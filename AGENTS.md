<!-- weaveboard:start -->
# Weaveboard MCP

This project is indexed by Weaveboard as **WeaveboardV2** (1348 symbols, 3469 relationships, 104 execution flows).

Weaveboard provides a knowledge graph over this codebase — call chains, blast radius, execution flows, and semantic search.

## Always Start Here

For any task involving code understanding, debugging, impact analysis, or refactoring, you must:

1. **Read `weaveboard://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx weaveboard analyze` in the terminal first.

## Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/weaveboard/weaveboard-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/weaveboard/weaveboard-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/weaveboard/weaveboard-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/weaveboard/weaveboard-refactoring/SKILL.md` |

## Tools Reference

| Tool | What it gives you |
|------|-------------------|
| `query` | Process-grouped code intelligence — execution flows related to a concept |
| `context` | 360-degree symbol view — categorized refs, processes it participates in |
| `impact` | Symbol blast radius — what breaks at depth 1/2/3 with confidence |
| `detect_changes` | Git-diff impact — what do your current changes affect |
| `rename` | Multi-file coordinated rename with confidence-tagged edits |
| `cypher` | Raw graph queries (read `weaveboard://repo/{name}/schema` first) |
| `list_repos` | Discover indexed repos |

## Resources Reference

Lightweight reads (~100-500 tokens) for navigation:

| Resource | Content |
|----------|---------|
| `weaveboard://repo/{name}/context` | Stats, staleness check |
| `weaveboard://repo/{name}/clusters` | All functional areas with cohesion scores |
| `weaveboard://repo/{name}/cluster/{clusterName}` | Area members |
| `weaveboard://repo/{name}/processes` | All execution flows |
| `weaveboard://repo/{name}/process/{processName}` | Step-by-step trace |
| `weaveboard://repo/{name}/schema` | Graph schema for Cypher |

## Graph Schema

**Nodes:** File, Function, Class, Interface, Method, Community, Process
**Edges (via CodeRelation.type):** CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES, MEMBER_OF, STEP_IN_PROCESS

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "myFunc"})
RETURN caller.name, caller.filePath
```

<!-- weaveboard:end -->
