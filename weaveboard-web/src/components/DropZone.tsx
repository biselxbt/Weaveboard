import { useState, useCallback, useRef, DragEvent } from 'react';
import { Upload, FileArchive, Github, Loader2, ArrowRight, Key, Eye, EyeOff, Globe, X } from 'lucide-react';
import { cloneRepository, parseGitHubUrl } from '../services/git-clone';
import { connectToServer, type ConnectToServerResult } from '../services/server-connection';
import { FileEntry } from '../services/zip';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onGitClone?: (files: FileEntry[], repoName?: string) => void;
  onServerConnect?: (result: ConnectToServerResult, serverUrl?: string) => void;
  compact?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DropZone = ({ onFileSelect, onGitClone, onServerConnect, compact = false }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'zip' | 'github' | 'server'>('zip');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState({ phase: '', percent: 0 });
  const [error, setError] = useState<string | null>(null);

  const [serverUrl, setServerUrl] = useState(() =>
    localStorage.getItem('weaveboard-server-url') || ''
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [serverProgress, setServerProgress] = useState<{
    phase: string;
    downloaded: number;
    total: number | null;
  }>({ phase: '', downloaded: 0, total: null });
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.zip')) {
        onFileSelect(file);
      } else {
        setError('Please drop a .zip file');
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.zip')) {
        onFileSelect(file);
      } else {
        setError('Please select a .zip file');
      }
    }
  }, [onFileSelect]);

  const handleGitClone = async () => {
    if (!githubUrl.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      setError('Invalid GitHub URL. Use format: https://github.com/owner/repo');
      return;
    }

    setError(null);
    setIsCloning(true);
    setCloneProgress({ phase: 'starting', percent: 0 });

    try {
      const files = await cloneRepository(
        githubUrl,
        (phase, percent) => setCloneProgress({ phase, percent }),
        githubToken || undefined
      );

      setGithubToken('');

      if (onGitClone) {
        onGitClone(files, parsed.repo);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clone repository';
      if (message.includes('401') || message.includes('403') || message.includes('Authentication')) {
        if (!githubToken) {
          setError('This looks like a private repo. Add a GitHub PAT to access it.');
        } else {
          setError('Authentication failed. Check your token permissions.');
        }
      } else if (message.includes('404') || message.includes('not found')) {
        setError('Repository not found. Check the URL or it might be private.');
      } else {
        setError(message);
      }
    } finally {
      setIsCloning(false);
    }
  };

  const handleServerConnect = async () => {
    const urlToUse = serverUrl.trim() || window.location.origin;
    if (!urlToUse) {
      setError('Please enter a server URL');
      return;
    }

    localStorage.setItem('weaveboard-server-url', serverUrl);

    setError(null);
    setIsConnecting(true);
    setServerProgress({ phase: 'validating', downloaded: 0, total: null });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await connectToServer(
        urlToUse,
        (phase, downloaded, total) => {
          setServerProgress({ phase, downloaded, total });
        },
        abortController.signal
      );

      if (onServerConnect) {
        onServerConnect(result, urlToUse);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to connect to server';
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        setError('Cannot reach server. Check the URL and ensure the server is running.');
      } else {
        setError(message);
      }
    } finally {
      setIsConnecting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelConnect = () => {
    abortControllerRef.current?.abort();
    setIsConnecting(false);
  };

  const serverProgressPercent = serverProgress.total
    ? Math.round((serverProgress.downloaded / serverProgress.total) * 100)
    : null;

  if (compact) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Tab Switcher */}
          <div className="flex mb-6 glass rounded-full p-1">
            {[
              { id: 'zip', label: 'ZIP', icon: FileArchive },
              { id: 'github', label: 'GitHub', icon: Github },
              { id: 'server', label: 'Server', icon: Globe },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id as any); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === id 
                    ? 'bg-white text-black' 
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* ZIP Tab */}
          {activeTab === 'zip' && (
            <div
              className={`p-12 glass border-2 border-dashed rounded-3xl transition-all cursor-pointer ${
                isDragging 
                  ? 'border-white bg-white/10 scale-[1.02]' 
                  : 'border-border-default hover:border-white/50 hover:bg-white/5'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input-compact')?.click()}
            >
              <input
                id="file-input-compact"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center glass rounded-2xl ${isDragging ? 'scale-110' : ''}`}>
                <FileArchive className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">
                {isDragging ? 'Drop it here!' : 'Drop your codebase'}
              </h3>
              <p className="text-sm text-text-secondary text-center">
                Drag & drop a .zip file
              </p>
            </div>
          )}

          {/* GitHub Tab */}
          {activeTab === 'github' && (
            <div className="p-16 glass rounded-3xl">
              <div className="space-y-3">
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isCloning && handleGitClone()}
                  placeholder="https://github.com/owner/repo"
                  disabled={isCloning}
                  className="w-full px-4 py-3 input-glass text-sm"
                />
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="GitHub Token (recommended)"
                    disabled={isCloning}
                    className="w-full px-4 py-3 pr-10 input-glass text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleGitClone}
                  disabled={isCloning || !githubUrl.trim()}
                  className="w-full btn-white py-3 text-sm flex items-center justify-center gap-2"
                >
                  {isCloning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cloning...
                    </>
                  ) : (
                    <>
                      Clone Repository
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              {isCloning && (
                <div className="mt-4">
                  <div className="h-1.5 glass rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-300" style={{ width: `${cloneProgress.percent}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Server Tab */}
          {activeTab === 'server' && (
            <div className="p-20 glass rounded-3xl">
              <div className="space-y-3">
                <input
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isConnecting && handleServerConnect()}
                  placeholder="http://localhost:3000"
                  disabled={isConnecting}
                  className="w-full px-4 py-3 input-glass text-sm"
                />
                <p className="text-xs text-white/40 text-center">Connect to a local or remote Weaveboard server</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleServerConnect}
                    disabled={isConnecting}
                    className="flex-1 btn-white py-3 text-sm flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  {isConnecting && (
                    <button
                      onClick={handleCancelConnect}
                      className="px-4 py-3 glass rounded-full hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {isConnecting && serverProgressPercent !== null && (
                <div className="mt-4">
                  <div className="h-1.5 glass rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-300" style={{ width: `${serverProgressPercent}%` }} />
                  </div>
                  <p className="text-xs text-text-muted text-center mt-2">
                    {formatBytes(serverProgress.downloaded)} / {serverProgress.total ? formatBytes(serverProgress.total) : '...'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-void">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="flex mb-6 glass rounded-full p-1">
          {[
            { id: 'zip', label: 'ZIP Upload', icon: FileArchive },
            { id: 'github', label: 'GitHub URL', icon: Github },
            { id: 'server', label: 'Server', icon: Globe },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id as any); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-sm font-medium transition-all ${
                activeTab === id 
                  ? 'bg-white text-black' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hide-mobile">{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {activeTab === 'zip' && (
          <div
            className={`p-16 glass border-2 border-dashed rounded-3xl transition-all cursor-pointer ${
              isDragging 
                ? 'border-white bg-white/10 scale-[1.02] shadow-glow' 
                : 'border-border-default hover:border-white/50 hover:bg-white/5 animate-breathe'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className={`w-20 h-20 mx-auto mb-6 flex items-center justify-center glass rounded-2xl ${isDragging ? 'scale-110' : ''}`}>
              {isDragging ? (
                <Upload className="w-10 h-10" />
              ) : (
                <FileArchive className="w-10 h-10" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">
              {isDragging ? 'Drop it here!' : 'Drop your codebase'}
            </h2>
            <p className="text-sm text-text-secondary text-center mb-6">
              Drag & drop a .zip file to generate a knowledge graph
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="px-3 py-1.5 glass rounded-md text-xs">.zip</span>
            </div>
          </div>
        )}

        {activeTab === 'github' && (
          <div className="p-16 glass rounded-3xl">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center glass rounded-2xl">
              <Github className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">
              Clone from GitHub
            </h2>
            <p className="text-sm text-text-secondary text-center mb-6">
              Enter a repository URL to clone directly
            </p>
            <div className="space-y-3">
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isCloning && handleGitClone()}
                placeholder="https://github.com/owner/repo"
                disabled={isCloning}
                className="w-full px-4 py-3 input-glass text-sm"
              />
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="GitHub Token (recommended for reliability)"
                  disabled={isCloning}
                  className="w-full px-4 py-3 pr-10 input-glass text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleGitClone}
                disabled={isCloning || !githubUrl.trim()}
                className="w-full btn-white py-3 text-sm flex items-center justify-center gap-2"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {cloneProgress.phase === 'cloning'
                      ? `Cloning... ${cloneProgress.percent}%`
                      : cloneProgress.phase === 'reading'
                        ? 'Reading files...'
                        : 'Starting...'
                    }
                  </>
                ) : (
                  <>
                    Clone Repository
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            {isCloning && (
              <div className="mt-4">
                <div className="h-2 glass rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${cloneProgress.percent}%` }} />
                </div>
              </div>
            )}
            {githubToken && (
              <p className="mt-3 text-xs text-text-muted text-center">
                Token stays in your browser only
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="px-3 py-1.5 glass rounded-md text-xs">
                {githubToken ? 'Private + Public' : 'Public repos'}
              </span>
              <span className="px-3 py-1.5 glass rounded-md text-xs">Shallow clone</span>
            </div>
          </div>
        )}

        {activeTab === 'server' && (
          <div className="p-20 glass rounded-3xl">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center glass rounded-2xl">
              <Globe className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">
              Connect to Server
            </h2>
            <p className="text-sm text-text-secondary text-center mb-6">
              Load a pre-built knowledge graph from a running Weaveboard server
            </p>
            <div className="space-y-3">
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isConnecting && handleServerConnect()}
                placeholder={window.location.origin}
                disabled={isConnecting}
                className="w-full px-4 py-3 input-glass text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleServerConnect}
                  disabled={isConnecting}
                  className="flex-1 btn-white py-3 text-sm flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {serverProgressPercent !== null ? `${serverProgressPercent}%` : 'Connecting...'}
                    </>
                  ) : (
                    <>
                      Connect
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                {isConnecting && (
                  <button
                    onClick={handleCancelConnect}
                    className="px-4 py-3 glass rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {isConnecting && serverProgressPercent !== null && (
              <div className="mt-4">
                <div className="h-2 glass rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${serverProgressPercent}%` }} />
                </div>
                {serverProgress.total && (
                  <p className="mt-1 text-xs text-text-muted text-center">
                    {formatBytes(serverProgress.downloaded)} / {formatBytes(serverProgress.total)}
                  </p>
                )}
              </div>
            )}
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="px-3 py-1.5 glass rounded-md text-xs">Pre-indexed</span>
              <span className="px-3 py-1.5 glass rounded-md text-xs">No WASM needed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
