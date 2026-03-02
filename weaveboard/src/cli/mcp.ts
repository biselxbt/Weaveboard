/**
 * MCP Command
 * 
 * Starts the MCP server in standalone mode.
 * Loads all indexed repos from the global registry.
 * No longer depends on cwd — works from any directory.
 */

import { startMCPServer } from '../mcp/server.js';
import { LocalBackend } from '../mcp/local/local-backend.js';

export const mcpCommand = async () => {
  // Prevent unhandled errors from crashing the MCP server process.
  // KuzuDB lock conflicts and transient errors should degrade gracefully.
  process.on('uncaughtException', (err) => {
    console.error(`Weaveboard MCP: uncaught exception — ${err.message}`);
  });
  process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error(`Weaveboard MCP: unhandled rejection — ${msg}`);
  });

  // Initialize multi-repo backend from registry.
  // The server starts even with 0 repos — tools call refreshRepos() lazily,
  // so repos indexed after the server starts are discovered automatically.
  const backend = new LocalBackend();
  await backend.init();

  const repos = await backend.listRepos();
  if (repos.length === 0) {
    console.error('Weaveboard: No indexed repos yet. Run `weaveboard analyze` in a git repo — the server will pick it up automatically.');
  } else {
    console.error(`Weaveboard: MCP server starting with ${repos.length} repo(s): ${repos.map(r => r.name).join(', ')}`);
  }

  // Start MCP server (serves all repos, discovers new ones lazily)
  await startMCPServer(backend);
};
