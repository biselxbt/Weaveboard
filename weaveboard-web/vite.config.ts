import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
    topLevelAwait(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/kuzu-wasm/kuzu_wasm_worker.js',
          dest: 'assets'
        }
      ]
    }),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/proxy')) {
            console.log('[api-proxy] Request:', req.method, req.url);

            // Handle CORS preflight
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Git-Protocol, Accept');
              res.statusCode = 200;
              res.end();
              return;
            }

            const urlParam = new URL(req.url || '', 'http://localhost').searchParams.get('url');
            console.log('[api-proxy] URL param:', urlParam);

            if (!urlParam) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing url query parameter' }));
              return;
            }

            // Decode URL-encoded parameter
            const url = decodeURIComponent(urlParam);
            console.log('[api-proxy] Decoded URL:', url);

            const allowedHosts = ['github.com', 'api.github.com', 'raw.githubusercontent.com', 'codeload.github.com'];
            try {
              const parsedUrl = new URL(url);
              console.log('[api-proxy] Host:', parsedUrl.hostname);
              if (!allowedHosts.some(host => parsedUrl.hostname.endsWith(host))) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: 'Only GitHub URLs are allowed' }));
                return;
              }
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid URL' }));
              return;
            }

            try {
              const headers: Record<string, string> = {
                'User-Agent': 'git/isomorphic-git',
              };
              if (req.headers.authorization) {
                headers['Authorization'] = req.headers.authorization as string;
              }
              if (req.headers.accept) {
                headers['Accept'] = req.headers.accept as string;
              }

              let response = await fetch(url, {
                method: req.method || 'GET',
                headers,
                redirect: 'manual',
              });

              console.log('[api-proxy] Response status:', response.status, 'from', url);

              const redirectCodes = [301, 302, 303, 307, 308];
              let redirectCount = 0;
              const maxRedirects = 5;

              while (redirectCodes.includes(response.status) && redirectCount < maxRedirects) {
                const location = response.headers.get('location');
                if (!location) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Redirect without location header' }));
                  return;
                }

                const absoluteUrl = location.startsWith('http') ? location : new URL(location, url).toString();
                const redirectParsed = new URL(absoluteUrl);
                if (!allowedHosts.some(host => redirectParsed.hostname.endsWith(host))) {
                  res.statusCode = 403;
                  res.end(JSON.stringify({ error: 'Redirect to disallowed host' }));
                  return;
                }

                console.log(`[api-proxy] Following redirect to: ${absoluteUrl}`);

                response = await fetch(absoluteUrl, {
                  method: req.method || 'GET',
                  headers,
                  redirect: 'manual',
                });

                redirectCount++;
              }

              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Expose-Headers', '*');

              const skipHeaders = ['content-encoding', 'transfer-encoding', 'connection', 'www-authenticate'];
              response.headers.forEach((value, key) => {
                if (!skipHeaders.includes(key.toLowerCase())) {
                  res.setHeader(key, value);
                }
              });

              res.statusCode = response.status;
              const buffer = await response.arrayBuffer();
              res.end(Buffer.from(buffer));

            } catch (error) {
              console.error('[api-proxy] Error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Proxy request failed', details: String(error) }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fix for Rollup failing to resolve this deep import from @langchain/anthropic
      '@anthropic-ai/sdk/lib/transform-json-schema': path.resolve(__dirname, 'node_modules/@anthropic-ai/sdk/lib/transform-json-schema.mjs'),
      // Fix for mermaid d3-color prototype crash on Vercel (known issue with mermaid 10.9.0+ and Vite)
      'mermaid': path.resolve(__dirname, 'node_modules/mermaid/dist/mermaid.esm.min.mjs'),
    },
  },
  // Polyfill Buffer for isomorphic-git (Node.js API needed in browser)
  define: {
    global: 'globalThis',
  },
  // Optimize deps - exclude kuzu-wasm from pre-bundling (it has WASM files)
  optimizeDeps: {
    exclude: ['kuzu-wasm'],
    include: ['buffer'],
  },
  // Required for KuzuDB WASM (SharedArrayBuffer needs Cross-Origin Isolation)
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    // Allow serving files from node_modules
    fs: {
      allow: ['..'],
    },
  },
  // Also set for preview/production builds
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // Worker configuration
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
  },
});
