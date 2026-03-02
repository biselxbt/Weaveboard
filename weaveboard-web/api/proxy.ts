import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * CORS Proxy for isomorphic-git
 * 
 * isomorphic-git calls: /api/proxy?url=https://github.com/...
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Git-Protocol, Accept');
    res.status(200).end();
    return;
  }

  // Get URL from query parameter
  let { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  // Decode URL if needed
  try {
    url = decodeURIComponent(url);
  } catch {
    // Already decoded or invalid, continue
  }

  // Only allow GitHub URLs for security (including codeload.github.com for redirects)
  const allowedHosts = ['github.com', 'api.github.com', 'raw.githubusercontent.com', 'codeload.github.com'];
  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }
  
  if (!allowedHosts.some(host => parsedUrl.hostname.endsWith(host))) {
    console.log(`[proxy] Forbidden: hostname=${parsedUrl.hostname}, allowed=${allowedHosts.join(', ')}`);
    res.status(403).json({ error: 'Only GitHub URLs are allowed', hostname: parsedUrl.hostname });
    return;
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'git/isomorphic-git',
    };
    
    // Forward relevant headers
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization as string;
    }
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }
    if (req.headers['git-protocol']) {
      headers['Git-Protocol'] = req.headers['git-protocol'] as string;
    }
    if (req.headers.accept) {
      headers['Accept'] = req.headers.accept as string;
    }

    // Get request body for POST requests
    let body: Buffer | undefined;
    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      body = Buffer.concat(chunks);
    }

    // Fetch with manual redirect handling to avoid CORS issues on codeload.github.com
    let response = await fetch(url, {
      method: req.method || 'GET',
      headers,
      body: body ? new Uint8Array(body) : undefined,
      redirect: 'manual',
    });

    // Redirect codes to follow
    const redirectCodes = [301, 302, 303, 307, 308];

    // Log response status for debugging
    console.log(`[proxy] Initial response: ${response.status} from ${url}`);

    // If initial request fails, return error details
    if (!redirectCodes.includes(response.status)) {
      if (response.status >= 400) {
        let errorDetails = `HTTP ${response.status}`;
        try {
          const text = await response.text();
          errorDetails += `: ${text.substring(0, 200)}`;
        } catch {}
        console.log(`[proxy] Error: ${errorDetails}`);
        res.status(response.status);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.json({ error: 'GitHub request failed', details: errorDetails });
        return;
      }
    }

    // Follow redirects server-side (GitHub API returns 302 to codeload.github.com)
    let redirectCount = 0;
    const maxRedirects = 5;

    while (redirectCodes.includes(response.status) && redirectCount < maxRedirects) {
      const location = response.headers.get('location');
      if (!location) {
        res.status(400).json({ error: 'Redirect without location header' });
        return;
      }

      // Handle relative redirects
      const absoluteUrl = location.startsWith('http') ? location : new URL(location, url).toString();

      // Validate redirect URL is allowed
      const redirectParsed = new URL(absoluteUrl);
      if (!allowedHosts.some(host => redirectParsed.hostname.endsWith(host))) {
        res.status(403).json({ error: 'Redirect to disallowed host' });
        return;
      }

      console.log(`Following redirect to: ${absoluteUrl}`);

      // For codeload.github.com redirects, remove auth headers (codeload doesn't accept them)
      const redirectHeaders = { ...headers };
      if (redirectParsed.hostname === 'codeload.github.com') {
        delete redirectHeaders['Authorization'];
        redirectHeaders['Accept'] = 'application/zip, application/octet-stream, */*';
      }

      response = await fetch(absoluteUrl, {
        method: req.method || 'GET',
        headers: redirectHeaders,
        body: body ? new Uint8Array(body) : undefined,
        redirect: 'manual',
      });

      redirectCount++;
    }

    if (redirectCount >= maxRedirects) {
      res.status(400).json({ error: 'Too many redirects' });
      return;
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');

    // Forward response headers (except ones that cause issues)
    const skipHeaders = [
      'content-encoding', 
      'transfer-encoding', 
      'connection',
      'www-authenticate', // IMPORTANT: Strip this to prevent browser's native auth popup!
    ];
    
    response.headers.forEach((value, key) => {
      if (!skipHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: String(error) });
  }
}

