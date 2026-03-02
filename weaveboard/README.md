# Weaveboard

**Graph-powered code intelligence for AI agents.** Index any codebase into a knowledge graph, then query it via MCP or CLI.

Works with **Cursor**, **Claude Code**, **Windsurf**, **Cline**, **OpenCode**, and any MCP-compatible tool.

[![npm version](https://img.shields.io/npm/v/weaveboard.svg)](https://www.npmjs.com/package/weaveboard)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0/)

---

## Why?

AI coding tools don't understand your codebase structure. They edit a function without knowing 47 other functions depend on it. Weaveboard fixes this by **precomputing every dependency, call chain, and relationship** into a queryable graph.

**Three commands to give your AI agent full codebase awareness.**

## Quick Start

```bash
# Index your repo (run from repo root)
npx weaveboard analyze
```

That's it. This indexes the codebase, installs agent skills, registers Claude Code hooks, and creates `AGENTS.md` / `CLAUDE.md` context files — all in one command.

To configure MCP for your editor, run `npx weaveboard setup` once — or set it up manually below.

`weaveboard setup` auto-detects your editors and writes the correct global MCP config. You only need to run it once.

### Editor Support

| Editor | MCP | Skills | Hooks (auto-augment) | Support |
|--------|-----|--------|---------------------|---------|
| **Claude Code** | Yes | Yes | Yes (PreToolUse) | **Full** |
| **Cursor** | Yes | Yes | — | MCP + Skills |
| **Windsurf** | Yes | — | — | MCP |
| **OpenCode** | Yes | Yes | — | MCP + Skills |

> **Claude Code** gets the deepest integration: MCP tools + agent skills + PreToolUse hooks that automatically enrich grep/glob/bash calls with knowledge graph context.

### Community Integrations

| Agent | Install | Source |
|-------|---------|--------|
| [pi](https://pi.dev) | `pi install npm:pi-weaveboard` | [pi-weaveboard](https://github.com/tintinweb/pi-weaveboard) |

## MCP Setup (manual)

If you prefer to configure manually instead of using `weaveboard setup`:

### Claude Code (full support — MCP + skills + hooks)

```bash
claude mcp add weaveboard -- npx -y weaveboard@latest mcp
```

### Cursor / Windsurf

Add to `~/.cursor/mcp.json` (global — works for all projects):

```json
{
  "mcpServers": {
    "weaveboard": {
      "command": "npx",
      "args": ["-y", "weaveboard@latest", "mcp"]
    }
  }
}
```

### OpenCode

Add to `~/.config/opencode/config.json`:

```json
{
  "mcp": {
    "weaveboard": {
      "command": "npx",
      "args": ["-y", "weaveboard@latest", "mcp"]
    }
  }
}
```

## How It Works

Weaveboard builds a complete knowledge graph of your codebase through a multi-phase indexing pipeline:

1. **Structure** — Walks the file tree and maps folder/file relationships
2. **Parsing** — Extracts functions, classes, methods, and interfaces using Tree-sitter ASTs
3. **Resolution** — Resolves imports and function calls across files with language-aware logic
4. **Clustering** — Groups related symbols into functional communities
5. **Processes** — Traces execution flows from entry points through call chains
6. **Search** — Builds hybrid search indexes for fast retrieval

The result is a **KuzuDB graph database** stored locally in `.weaveboard/` with full-text search and semantic embeddings.

## MCP Tools

Your AI agent gets these tools automatically:

| Tool | What It Does | `repo` Param |
|------|-------------|--------------|
| `list_repos` | Discover all indexed repositories | — |
| `query` | Process-grouped hybrid search (BM25 + semantic + RRF) | Optional |
| `context` | 360-degree symbol view — categorized refs, process participation | Optional |
| `impact` | Blast radius analysis with depth grouping and confidence | Optional |
| `detect_changes` | Git-diff impact — maps changed lines to affected processes | Optional |
| `rename` | Multi-file coordinated rename with graph + text search | Optional |
| `cypher` | Raw Cypher graph queries | Optional |

> With one indexed repo, the `repo` param is optional. With multiple, specify which: `query({query: "auth", repo: "my-app"})`.

## MCP Resources

| Resource | Purpose |
|----------|---------|
| `weaveboard://repos` | List all indexed repositories (read first) |
| `weaveboard://repo/{name}/context` | Codebase stats, staleness check, and available tools |
| `weaveboard://repo/{name}/clusters` | All functional clusters with cohesion scores |
| `weaveboard://repo/{name}/cluster/{name}` | Cluster members and details |
| `weaveboard://repo/{name}/processes` | All execution flows |
| `weaveboard://repo/{name}/process/{name}` | Full process trace with steps |
| `weaveboard://repo/{name}/schema` | Graph schema for Cypher queries |

## MCP Prompts

| Prompt | What It Does |
|--------|-------------|
| `detect_impact` | Pre-commit change analysis — scope, affected processes, risk level |
| `generate_map` | Architecture documentation from the knowledge graph with mermaid diagrams |

## CLI Commands

```bash
weaveboard setup                    # Configure MCP for your editors (one-time)
weaveboard analyze [path]           # Index a repository (or update stale index)
weaveboard analyze --force          # Force full re-index
weaveboard analyze --skip-embeddings  # Skip embedding generation (faster)
weaveboard mcp                     # Start MCP server (stdio) — serves all indexed repos
weaveboard serve                   # Start local HTTP server (multi-repo) for web UI
weaveboard list                    # List all indexed repositories
weaveboard status                  # Show index status for current repo
weaveboard clean                   # Delete index for current repo
weaveboard clean --all --force     # Delete all indexes
weaveboard wiki [path]             # Generate LLM-powered docs from knowledge graph
weaveboard wiki --model <model>    # Wiki with custom LLM model (default: gpt-4o-mini)
```

## Multi-Repo Support

Weaveboard supports indexing multiple repositories. Each `weaveboard analyze` registers the repo in a global registry (`~/.weaveboard/registry.json`). The MCP server serves all indexed repos automatically.

## Supported Languages

TypeScript, JavaScript, Python, Java, C, C++, C#, Go, Rust, PHP, Swift

## Agent Skills

Weaveboard ships with skill files that teach AI agents how to use the tools effectively:

- **Exploring** — Navigate unfamiliar code using the knowledge graph
- **Debugging** — Trace bugs through call chains
- **Impact Analysis** — Analyze blast radius before changes
- **Refactoring** — Plan safe refactors using dependency mapping

Installed automatically by both `weaveboard analyze` (per-repo) and `weaveboard setup` (global).

## Requirements

- Node.js >= 18
- Git repository (uses git for commit tracking)

## Privacy

- All processing happens locally on your machine
- No code is sent to any server
- Index stored in `.weaveboard/` inside your repo (gitignored)
- Global registry at `~/.weaveboard/` stores only paths and metadata

## Web UI

Weaveboard also has a browser-based UI at [weaveboard.pro](https://weaveboard.pro) — 100% client-side, your code never leaves the browser.

**Local Backend Mode:** Run `weaveboard serve` and open the web UI locally — it auto-detects the server and shows all your indexed repos, with full AI chat support. No need to re-upload or re-index. The agent's tools (Cypher queries, search, code navigation) route through the backend HTTP API automatically.

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)

Free for non-commercial use. Contact for commercial licensing.
