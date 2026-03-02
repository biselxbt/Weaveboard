# Draft: Weaveboard vs Noodlbox Strategy

## Objectives
- Understand Weaveboard current state and goals.
- Analyze Noodlbox capabilities from provided URL.
- Compare features, architecture, and value proposition.
- Provide strategic views and recommendations.

## Research Findings
- [Weaveboard]: Zero-server, browser-native (WASM), KuzuDB based. Graph + Vector hybrid search.
- [Noodlbox]: CLI-first, heavy install. Has "Session Hooks" and "Search Hooks" via plugins/CLI.

## Comparison Points
- **Core Philosophy**: Both bet on "Knowledge Graph + MCP" as the future. Noodlbox validates Weaveboard's direction.
- **Architecture**:
  - *Noodlbox*: CLI/Binary based. Likely local server management.
  - *Weaveboard*: Zero-server, Browser-native (WASM). Lower friction, higher privacy.
- **Features**:
  - *Communities/Processes*: Both have them. Noodlbox uses them for "context injection". Weaveboard uses them for "visual exploration + query".
  - *Impact Analysis*: Noodlbox has polished workflows (e.g., `detect_impact staged`). Weaveboard has the engine (`blastRadius`) but maybe not the specific workflow wrappers yet.
- **UX/Integration**:
  - *Noodlbox*: "Hooks" (Session/Search) are a killer feature. Proactively injecting context into the agent's session.
  - *Weaveboard*: Powerful tools, but relies on agent *pulling* data?

## Strategic Views
1. **Validation**: The market direction is confirmed. You are building the right thing.
2. **differentiation**: Lean into "Zero-Setup / Browser-Native". Noodlbox requires `noodl init` and CLI handling. Weaveboard could just *be*.
3. **Opportunity**: Steal the "Session/Search Hooks" pattern. Make the agent smarter *automatically* without the user asking "check impact".
4. **Workflow Polish**: Noodlbox's `/detect_impact staged` is a great specific use case. Weaveboard should wrap `blastRadius` into similar concrete workflows.

## Technical Feasibility (Interception)
- **Cursor**: Use `.cursorrules` to "shadow" default tools. Instruct agent to ALWAYS use `weaveboard_search` instead of `grep`.
- **Claude Code**: Likely uses a private plugin API for `PreToolUse`. We can't match this exactly without an official plugin, but we can approximate it with strong prompt instructions in `AGENTS.md`.
- **MCP Shadowing**: Define tools with names that conflict (e.g., `grep`)? No, unsafe. Better to use "Virtual Hooks" via system prompt instructions.
