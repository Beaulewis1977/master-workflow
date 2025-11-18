# Agent Bootstrap Guide

This guide explains how sub-agents (Claude Code agents, Claude Flow roles, or external tools) should initialize and coordinate in this project.

## 1) Core Files to Read

- .ai-dev/analysis.json
  - Latest project complexity analysis (score, stage, factors)
- .ai-workflow/configs/approach.json
  - Selected approach (simpleSwarm | hiveMind | hiveMindSparc)
  - Prepared command(s), match scores, reasoning
- .ai-workflow/configs/mcp-registry.json
  - Discovered MCP servers and available tools (auto-generated)
- .claude-flow/hive-config.json
  - Roles, prompts, persistence policy, routing per role
  - claudeFlowVersion and tool/server hints
- .ai-dev/project-instructions.md
  - Human-provided project instructions merged into docs

## 2) MCP Servers & Tools Discovery

Agents should look up discovered servers/tools in:

- .ai-workflow/configs/mcp-registry.json
- If missing, generate it:

```bash
./ai-workflow mcp refresh
```

Behavior:
- Registry is derived from MCP_SERVERS env (JSON or CSV), baseline detection (filesystem/http/git), and PATH probes.
- hive-config.json declares mcpServers with `autoDiscover: true`. Prefer the runtime registry.

Recommended pattern:
- If tool/server not listed, attempt discovery by name and update the registry.
- Handle failures gracefully; prefer built-ins (e.g., grep) when MCP servers are unavailable.

## 3) Event Bus for Coordination

A JSONL bus collects agent/runtime events:

- Path: `.ai-workflow/logs/agent-bus.jsonl`
- Schemas (examples):
  - Prompt: `{ "ts": "ISO8601", "type": "prompt", "prompt": "..." }`
  - Tool Call: `{ "ts": "ISO8601", "type": "tool", "tool": "name", "args": "..." }`
  - Model Response: `{ "ts": "ISO8601", "type": "response", "excerpt": "..." }`
  - Approach Change: `{ "ts": "ISO8601", "type": "approach_change", "from": "simpleSwarm", "to": "hiveMind" }`

How to consume:
- Tail-style: `bash .ai-workflow/bin/tmp_rovodev_agent_bus_tail.sh`
- HTTP JSON/SSE dashboard:
  - Start: `./ai-workflow status-dashboard` (default port 8787)
  - JSON: `GET http://localhost:8787/`
  - SSE: `GET http://localhost:8787/events/stream?type=prompt|tool|response|approach_change`

Agents should:
- Emit their own events when useful (e.g., task started/completed) by appending JSONL.
- Watch for `approach_change` to adapt coordination (e.g., increase agents for SPARC).

## 4) Memory & Routing

hive-config.json defines per-role routing for logs/artifacts:

```json
{
  "persistence": {
    "routing": {
      "Queen": { "logs": ".claude-flow/memory/logs/queen", "artifacts": ".claude-flow/memory/artifacts/queen" }
    }
  }
}
```

Guidelines:
- Persist artifacts and logs in the role-specific directories.
- Keep large artifacts outside version control unless explicitly required.

## 5) Version & Approach Awareness

- Respect `claudeFlowVersion` in `.claude-flow/hive-config.json`.
- Check `.ai-workflow/configs/approach.json` for current selection.
- When approach changes (event bus `approach_change`), reconfigure agents accordingly.

## 6) Best Practices

- Read CLAUDE.md and Agent-OS instructions; both include Project-Specific Instructions.
- Prefer MCP tools when available; fallback to built-ins.
- Emit structured events to the bus for visibility.
- Avoid writing secrets to the bus or public artifacts.
- Coordinate via documented directories to keep logs consistent.
