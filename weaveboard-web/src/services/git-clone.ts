import { shouldIgnorePath } from '../config/ignore-service';
import { FileEntry } from './zip';
import JSZip from 'jszip';

export const parseGitHubUrl = (url: string): { owner: string; repo: string; branch?: string } | null => {
  const cleaned = url.trim().replace(/\.git$/, '');
  const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  
  if (!match) return null;
  
  const branchMatch = cleaned.match(/github\.com\/[^\/]+\/[^\/]+\/tree\/([^\/]+)/);
  
  return {
    owner: match[1],
    repo: match[2],
    branch: branchMatch?.[1],
  };
};

const findRootPrefix = (paths: string[]): string => {
  if (paths.length === 0) return '';
  
  // Get the first path segment of each file
  const firstSegments = paths
    .filter(p => p.includes('/'))
    .map(p => p.split('/')[0]);
  
  if (firstSegments.length === 0) return '';
  
  // Check if ALL files share the same first segment (GitHub archive format)
  const firstSegment = firstSegments[0];
  const allSameRoot = firstSegments.every(s => s === firstSegment);
  
  if (allSameRoot) {
    return firstSegment + '/';
  }
  
  return '';
};

const findBasePath = (files: string[]): string => {
  return findRootPrefix(files);
};

const extractZipFromArrayBuffer = async (buffer: ArrayBuffer, basePath: string): Promise<FileEntry[]> => {
  const files: FileEntry[] = [];
  
  try {
    const zip = await JSZip.loadAsync(buffer);
    
    const fileEntries = Object.entries(zip.files) as [string, any][];
    
    for (const [path, file] of fileEntries) {
      if (file.dir) continue;
      
      const relativePath = path.replace(basePath, '').replace(/^\//, '');
      if (!relativePath) continue;
      
      if (shouldIgnorePath(relativePath)) continue;
      
      try {
        const content = await file.async('string');
        files.push({
          path: relativePath,
          content,
        });
      } catch {
        // Skip binary files
      }
    }
  } catch (e) {
    console.error('Failed to extract ZIP:', e);
    throw new Error('Failed to extract repository ZIP');
  }
  
  return files;
};

export const cloneRepository = async (
  url: string,
  onProgress?: (phase: string, progress: number) => void,
  token?: string
): Promise<FileEntry[]> => {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error('Invalid GitHub URL. Use format: https://github.com/owner/repo');
  }

  try {
    onProgress?.('downloading', 0);

    // Try multiple URL formats - more options = better chance of success
    const branch = parsed.branch || 'main';
    const codeloadUrl = `https://codeload.github.com/${parsed.owner}/${parsed.repo}/zipball/${branch}`;
    const archiveUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/zipball/${branch}`;
    const githubArchiveUrl = `https://github.com/${parsed.owner}/${parsed.repo}/archive/${branch}.zip`;
    const githubArchiveRefUrl = `https://github.com/${parsed.owner}/${parsed.repo}/archive/${branch}.zip`;

    let response: Response | null = null;

    const fetchHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (token) {
      fetchHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Try different URL formats - archive.github.com format may work without redirect
    const fetchMethods = [
      // Direct codeload with token
      { url: `/api/proxy?url=${encodeURIComponent(codeloadUrl)}`, opts: { headers: fetchHeaders } },
      // GitHub archive format (no redirect to codeload)
      { url: `/api/proxy?url=${encodeURIComponent(githubArchiveUrl)}`, opts: { headers: { 'Accept': 'application/zip, application/octet-stream, */*' } } },
      // GitHub API
      { url: `/api/proxy?url=${encodeURIComponent(archiveUrl)}`, opts: { headers: fetchHeaders } },
      // Without branch
      { url: `/api/proxy?url=${encodeURIComponent(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/zipball`)}`, opts: { headers: fetchHeaders } },
    ];
    
    for (const method of fetchMethods) {
      try {
        response = await fetch(method.url, method.opts);
        if (response?.ok) {
          console.log('Success with:', method.url.substring(0, 50) + '...');
          break;
        }
      } catch (e) {
        console.log('Failed:', method.url.substring(0, 50), e);
      }
    }
    
    if (!response?.ok) {
      const status = response?.status;
      
      if (status === 404) {
        throw new Error('Repository not found. Check the URL.');
      }
      
      if (status === 403) {
        const remaining = response?.headers.get('X-RateLimit-Remaining');
        if (remaining === '0') {
          throw new Error('GitHub API rate limit exceeded. Try again later.');
        }
        throw new Error('Cannot access repository. Try downloading as ZIP from GitHub.');
      }
      
      if (status === 401) {
        throw new Error('Authentication required. Try downloading as ZIP from GitHub.');
      }
      
      // For any other error, recommend ZIP approach which is more reliable
      throw new Error('Failed to clone repository. Try downloading as ZIP from GitHub instead.');
    }
    
    // Get content length for progress
    const contentLength = response.headers.get('content-length');
    let loaded = 0;
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to read response');
    }
    
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      loaded += value.length;
      
      if (contentLength) {
        const percent = Math.round((loaded / parseInt(contentLength)) * 100);
        onProgress?.('downloading', percent);
      }
    }
    
    onProgress?.('extracting', 0);
    
    // Combine chunks
    const allBytes = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      allBytes.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Extract from ZIP
    const zip = await JSZip.loadAsync(allBytes.buffer);
    const basePath = findBasePath(Object.keys(zip.files));
    onProgress?.('extracting', 50);
    
    const files = await extractZipFromArrayBuffer(allBytes.buffer, basePath);
    
    onProgress?.('complete', 100);
    
    return files;
    
  } catch (error: any) {
    console.error('Clone error:', error);
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('CORS')) {
      throw new Error('GitHub clone is limited in browsers. For best results: download repository as ZIP from GitHub (green Code button → Download ZIP), then upload it here.');
    }
    
    throw error;
  }
};
