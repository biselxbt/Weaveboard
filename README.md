# Weaveboard

<div align="center">

[![npm version](https://img.shields.io/npm/v/weaveboard.svg)](https://www.npmjs.com/package/weaveboard)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0/)
[![GitHub stars](https://img.shields.io/github/stars/biselxbt/weaveboard)](https://github.com/biselxbt/weaveboard)
[![Web UI](https://img.shields.io/badge/Web_UI-weaveboard.pro-blue)](https://weaveboard.pro)

**Graph-powered code intelligence for AI agents.** Index any codebase into a knowledge graph, then query it via MCP or explore it visually.

</div>

---

## The Problem

AI coding tools like **Cursor**, **Claude Code**, **Cline**, and **Windsurf** are powerful — but they don't truly understand your codebase structure.

When an AI edits `UserService.validate()`, it doesn't know **47 other functions** depend on its return type. Breaking changes ship silently.

**Weaveboard fixes this** by precomputing every dependency, call chain, and relationship into a queryable knowledge graph.

---

## Two Ways to Use Weaveboard

| | **CLI + MCP** | **Web UI** |
|---|---|---|
| **What** | Index repos locally, connect AI agents via MCP | Visual graph explorer + AI chat |
| **For** | Daily development with Cursor, Claude Code, Windsurf | Quick exploration, demos |
| **Scale** | Full repos, any size | ~5k files or unlimited via backend |
| **Install** | `npm install -g weaveboard` | No install — [weaveboard.pro](https://weaveboard.pro) |
| **Privacy** | Everything local, no network calls | 100% browser-based, no code uploaded |

---

## Quick Start

### Web UI (No Install)

```bash
# Just open in browser
https://weaveboard.pro
```

### CLI

```bash
# Install globally
npm install -g weaveboard

# Index your repository
npx weaveboard analyze

# Configure MCP for your editor
npx weaveboard setup
```

That's it. `weaveboard analyze` indexes your codebase, installs agent skills, registers Claude Code hooks, and creates `AGENTS.md` / `CLAUDE.md` context files — all in one command.

---

## How It Works

Weaveboard builds a complete knowledge graph of your codebase through a multi-phase indexing pipeline:

1. **Structure** — Walk the file tree and map folder/file relationships
2. **Parsing** — Extract functions, classes, methods, and interfaces using Tree-sitter ASTs
3. **Resolution** — Resolve imports and function calls across files with language-aware logic
4. **Clustering** — Group related symbols into functional communities
5. **Processes** — Trace execution flows from entry points through call chains
6. **Search** — Build hybrid search indexes (BM25 + semantic) for fast retrieval

The result is a **KuzuDB graph database** stored locally in `.weaveboard/` with full-text search and semantic embeddings.

---

## Features

### Impact Analysis
Know exactly what breaks before you ship. See upstream/downstream dependencies with confidence scores.
```
impact({target: "UserService", direction: "upstream", minConfidence: 0.8})
```

### Process-Grouped Search
Search understands execution flows, not just keywords. Find code in the context of how it runs.
```
query({query: "authentication middleware"})
```

### Context View
360° symbol view showing incoming/outgoing calls, imports, and which processes use it.
```
context({name: "validateUser"})
```

### Detect Changes
Pre-commit analysis. See what processes your changes affect before pushing.
```
detect_changes({scope: "all"})
```

---

## MCP Tools

Your AI agent gets **7 tools** automatically via MCP:

| Tool | What It Does | `repo` Param |
|------|-------------|--------------|
| `list_repos` | Discover all indexed repositories | — |
| `query` | Process-grouped hybrid search (BM25 + semantic + RRF) | Optional |
| `context` | 360° symbol view — refs, processes | Optional |
| `impact` | Blast radius analysis with depth grouping and confidence | Optional |
| `detect_changes` | Git-diff impact — maps changed lines to affected processes | Optional |
| `rename` | Multi-file coordinated rename with graph + text search | Optional |
| `cypher` | Raw Cypher graph queries | Optional |

### MCP Prompts

| Prompt | What It Does |
|--------|-------------|
| `detect_impact` | Pre-commit change analysis — scope, affected processes, risk level |
| `generate_map` | Architecture documentation from the knowledge graph with mermaid diagrams |

---

## Agent Skills

Weaveboard ships with **4 skill files** that teach AI agents how to use the tools effectively:

- **Exploring** — Navigate unfamiliar code using the knowledge graph
- **Debugging** — Trace bugs through call chains
- **Impact Analysis** — Analyze blast radius before changes
- **Refactoring** — Plan safe refactors using dependency mapping

---

## Editor Support

| Editor | MCP | Skills | Hooks (auto-augment) |
|--------|-----|--------|----------------------|
| **Claude Code** | ✓ | ✓ | ✓ (PreToolUse) |
| **Cursor** | ✓ | ✓ | — |
| **Windsurf** | ✓ | — | — |
| **OpenCode** | ✓ | ✓ | — |

> **Claude Code** gets the deepest integration: MCP tools + agent skills + PreToolUse hooks that automatically enrich grep/glob/bash calls with knowledge graph context.

### Manual MCP Setup

If you prefer to configure manually instead of using `weaveboard setup`:

**Claude Code:**
```bash
claude mcp add weaveboard -- npx -y weaveboard@latest mcp
```

**Cursor / Windsurf** — Add to `~/.cursor/mcp.json`:
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

**OpenCode** — Add to `~/.config/opencode/config.json`:
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

---

## CLI Commands

```bash
weaveboard analyze [path]           # Index a repository (or update stale index)
weaveboard analyze --force          # Force full re-index
weaveboard analyze --skip-embeddings # Skip embedding generation (faster)
weaveboard setup                    # Configure MCP for your editors (one-time)
weaveboard mcp                     # Start MCP server (stdio)
weaveboard serve                   # Start local HTTP server for web UI
weaveboard list                    # List all indexed repositories
weaveboard status                  # Show index status for current repo
weaveboard clean                   # Delete index for current repo
weaveboard clean --all --force     # Delete all indexes
weaveboard wiki [path]             # Generate LLM-powered docs from graph
weaveboard wiki --model <model>    # Wiki with custom LLM model
```

---

## Supported Languages

**11 languages** supported:

TypeScript • JavaScript • Python • Java • C • C++ • C# • Go • Rust • PHP • Swift

---

## Tech Stack

| Layer | CLI | Web |
|-------|-----|-----|
| **Runtime** | Node.js | Browser (WASM) |
| **Parsing** | Tree-sitter native | Tree-sitter WASM |
| **Database** | KuzuDB native | KuzuDB WASM |
| **Embeddings** | transformers.js | transformers.js (WebGPU) |
| **Visualization** | — | Sigma.js + Graphology |
| **Frontend** | — | React 18, Vite, Tailwind |

---

## Multi-Repo Support

Weaveboard supports indexing **multiple repositories**. Each `weaveboard analyze` registers the repo in a global registry (`~/.weaveboard/registry.json`). The MCP server serves all indexed repos automatically.

**Local Backend Mode:** Run `weaveboard serve` and open the web UI locally — it auto-detects the server and shows all your indexed repos, with full AI chat support. No need to re-upload or re-index.

---

## Security & Privacy

### CLI
- ✓ All processing happens locally on your machine
- ✓ No code is sent to any server
- ✓ Index stored in `.weaveboard/` inside your repo (gitignored)
- ✓ Global registry at `~/.weaveboard/` stores only paths and metadata

### Web
- ✓ Everything runs in your browser
- ✓ No code uploaded to any server
- ✓ API keys stored in localStorage only
- ✓ Open source — audit the code yourself

---

## $WEAVE Token

Weaveboard is becoming a **self-sustaining, token-powered developer ecosystem** on Solana. $WEAVE was designed to align incentives between users, developers, and infrastructure — so the more the platform grows, the better it gets for everyone.

### Why $WEAVE?

Every $WEAVE trade on pump.fun automatically routes a portion of fees to the official Weaveboard Treasury wallet via Solana's native mechanisms. These funds are used **100% transparently** for:

- High-performance GPU clusters
- LLM inference costs
- Indexing servers, storage, and global MCP relay
- Open-source bounties and new language support

### Premium Features (for $WEAVE Holders)

- **Unlimited AI queries** — No rate limits
- **Larger file uploads** — Process bigger codebases
- **Priority processing** — Faster response times
- **x402 Pay-Per-Use** — Pay instantly with micro-transactions in $WEAVE for complex queries
- **Wallet-native integration** — Connect your Solana wallet once and use AI with zero setup

### Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | Live Now | Infrastructure Sustainability — Treasury funds GPU clusters, LLM costs, and servers |
| **Phase 2** | Rolling Out | Native AI & Payments — Built-in hosted models with x402 micro-payments |
| **Phase 3** | Coming Soon | More exciting features on the way |

### Free Tier Guarantee

**You can always bring your own API keys** — no token required. Premium features are completely optional and powered by the community-driven treasury.

---

## License

[PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)

Free for non-commercial use. Contact for commercial licensing.

---

## Links

- **Web UI:** [weaveboard.pro](https://weaveboard.pro)
- **$WEAVE Token:** [weaveboard.pro/weave](https://weaveboard.pro/weave)
- **npm:** [weaveboard](https://www.npmjs.com/package/weaveboard)
- **GitHub:** [biselxbt/weaveboard](https://github.com/biselxbt/weaveboard)
- **Docs:** See `weaveboard/README.md` for CLI-only documentation
