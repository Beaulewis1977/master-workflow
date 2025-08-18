# User Guide

## Who this is for
- Engineers adopting MASTER-WORKFLOW on new or existing projects
- Teams orchestrating Claude Code, Claude Flow 2.0, and Agent-OS together

## Quick Start
```bash
# Install (interactive)
/path/to/MASTER-WORKFLOW/install-modular.sh

# Analyze and initialize
./ai-workflow analyze
./ai-workflow init --auto

# Observe
./ai-workflow status-dashboard 8787
```

## New Projects
1. Create an empty repo or minimal scaffold
2. Run interactive install and select components
3. Enter initial prompt (requirements) when asked
4. Let the system analyze and pick an approach; review generated docs
5. Execute selected flow; iterate using prompts and agents

Recommended docs in new repos
- `.ai-dev/project-instructions.md`: your high-level goals and constraints
- `ARCHITECTURE.md`: initial system design
- `CONTRIBUTING.md`, `SECURITY.md`: team guardrails

## Existing Projects
1. Install per project (no global deps)
2. Run `./ai-workflow analyze` to discover stack, stage, complexity
3. Use interactive document updater to merge improved docs while preserving customizations
4. Choose approach: `--swarm` for small fixes, `--hive` for features, `--sparc` for enterprise refactors

Document upgrades (preservation)
- The updater detects changes and offers: backup & replace, intelligent merge, selective update, preview, skip
- Backups stored under a timestamped directory; diffs available in interactive mode

## All the ways to run
- Automatic: `./ai-workflow init --auto "Objective"`
- Interactive: `./ai-workflow init`
- Manual: `./ai-workflow init --swarm|--hive|--sparc`
- Direct Flow: `npx claude-flow@<ver> hive-mind spawn "Objective" --agents N --claude`
- With tmux: `./ai-workflow tmux start` then `attach`
- Process-mode (no tmux): default fallback; logs under `.ai-workflow/logs`

## Getting the most out of it
- Provide a rich `.ai-dev/project-instructions.md`; it’s merged into CLAUDE.md and Agent-OS instructions
- Set `CLAUDE_FLOW_VERSION=stable` for long runs; use `alpha` for newest features
- Keep the MCP registry fresh: `./ai-workflow mcp refresh` (default server is context7)
- Tail the event bus to see prompts, tools, and responses

## Intelligence engine and TODOs
- Analysis produces `analysis.json` with recommendations
- The document customizer embeds task lists and next-steps into generated docs (e.g., CLAUDE.md, specs)
- Agents can emit approach changes; watch dashboard for updated plans

## Commands Reference
```bash
./ai-workflow components
./ai-workflow verify
./ai-workflow analyze
./ai-workflow init [--auto|--swarm|--hive|--sparc]
./ai-workflow yolo [on|off|status]
./ai-workflow add [claude-code|agent-os|claude-flow|tmux]
./ai-workflow status-dashboard [port]
./ai-workflow bus tail [--type T] [--agent A] [--role R]
```

## Using from a separate toolkit repo
```bash
# One-time: get the toolkit
git clone <workflow-repo-url> ~/tools/MASTER-WORKFLOW

# For any project you want to use it with
cd /path/to/your/project
~/tools/MASTER-WORKFLOW/install-modular.sh      # interactive
# or
~/tools/MASTER-WORKFLOW/install-production.sh   # all components

# Then run
./ai-workflow analyze
./ai-workflow init --auto
```

## With vs without Claude Code
With Claude Code (CLI authenticated):
```bash
npx claude-flow@latest hive-mind spawn "Objective" --agents 6 --claude
# or let the runner add --claude automatically
./ai-workflow init --hive "Objective"
```
Without Claude Code (no --claude):
```bash
export ANTHROPIC_API_KEY=...   # if Flow requires direct API key
npx claude-flow@latest hive-mind spawn "Objective" --agents 6
./ai-workflow init --hive "Objective"
```

## Authentication
- Claude Code: install and authenticate the `claude` CLI (`claude --version` to verify).
- Without Claude Code: set `ANTHROPIC_API_KEY` (or provider creds) so Claude Flow can call the model.

## Seeing agent activity
```bash
# Dashboard UI + SSE
./ai-workflow status-dashboard 8787
# UI: http://localhost:8787/ui

# Tail the event bus
./ai-workflow bus tail --type response
./ai-workflow bus tail --type tool --agent worker-1

# Claude Flow session status
npx claude-flow@latest hive-mind status

# With tmux orchestrator
./ai-workflow tmux attach

# Without tmux: logs
ls -la .ai-workflow/logs/process-*.log
```

## Version pinning & model config
```bash
# Pin Flow channel
CLAUDE_FLOW_VERSION=stable ./ai-workflow init --hive
```
```json
// .claude-flow/hive-config.json (example)
{
  "roles": {
    "Queen":    { "model": "claude-3-opus" },
    "Frontend": { "model": "claude-3.5-sonnet" }
  }
}
```

## Uninstall (planned)
Default behavior: remove installed system assets; keep generated/merged project docs and code.
```bash
# Preview only
./ai-workflow uninstall --dry-run

# Interactive
./ai-workflow uninstall

# Non-interactive with safe defaults
./ai-workflow uninstall --keep-generated=true --purge-caches=true --yes
```
- Manifests ensure only installed assets are removed; generated artifacts are preserved by default.
- Safety: git-protect mode, optional backup, per-file review (interactive).

## What it uses under the hood
- Node.js, child_process, tmux (optional)
- Event bus with JSONL + SSE dashboard
- Document intelligence (discovery, merge, backups)
- Claude Flow 2.0 multi-agent orchestration
- Claude Code agents and commands
- Agent-OS specs/instructions

## Troubleshooting
- Node <18 → upgrade
- Missing Flow/Claude/Agent-OS → add via `./ai-workflow add ...`
- In CI, YOLO is blocked; enable locally only with explicit ack
