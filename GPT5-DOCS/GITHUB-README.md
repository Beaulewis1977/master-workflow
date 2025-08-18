# MASTER-WORKFLOW v3.0 — Intelligent Multi‑Agent Workflow System

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)  
![Node](https://img.shields.io/badge/Node-%E2%89%A518.x-blue) ![Platforms](https://img.shields.io/badge/Platforms-Linux%20%7C%20macOS%20%7C%20WSL%20%7C%20Windows-9cf) ![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

### Designed & created by: Beau Lewis • Blewisxx@gmail.com

---

## Why MASTER‑WORKFLOW
MASTER‑WORKFLOW is a production‑grade orchestration system that analyzes your codebase, chooses the optimal approach (Swarm, Hive‑Mind, SPARC), generates/updates docs intelligently, and launches multi‑agent execution with Claude Flow 2.0 and Claude Code. It’s modular, safe by default, and works per‑project with no global dependencies.

- Blazing fast multi‑agent orchestration with a Queen Controller (10 concurrent sub‑agents, 200k context each)
- Intelligent document upgrades that preserve your customizations
- Guardrails: command allowlists, transactional journaling, YOLO gated and blocked in CI
- Cross‑platform: Linux/macOS/WSL/Windows (tmux optional; process‑mode fallback)

---

## Key Capabilities at a Glance
- Intelligent 8‑dimension project analysis (size, deps, architecture, tech stack, features, team, deployment, tests)
- Automatic approach selection with version policy (alpha/beta/latest/stable/2.0/dev)
- Claude Flow 2.0 orchestration: Swarm, Hive‑Mind, SPARC (enterprise phases)
- Claude Code integration: local dev agents, slash commands, recovery specialist
- Agent‑OS: product/spec docs and instructions used by all agents
- Event bus + SSE dashboard for real‑time visibility (prompts, tools, responses, approach changes)
- MCP‑aware by default (default server: context7) with dynamic registry

---

## Architecture
```mermaid
flowchart TD
  U[Developer] --> R[ai-workflow Runner]
  R --> A[Analyzer (8D)]
  R --> S[Approach Selector]
  R --> D[Doc Intelligence]
  R --> Q[Queen Controller]
  Q --> CF[Claude Flow 2.0]
  CF --> CC[Claude Code Agents]
  D --> OS[Agent-OS Specs/Instructions]
  R --> BUS[Event Bus + Dashboard]
```

- Analyzer → determines complexity score and project stage
- Approach Selector → maps to Swarm, Hive‑Mind, or SPARC
- Doc Intelligence → generates/merges CLAUDE.md, Agent‑OS specs, hive‑config
- Queen Controller → manages sub‑agents (spawn/monitor/resources)
- Claude Flow 2.0 → executes multi‑agent plan with persistence and artifacts
- Event Bus → JSONL log + SSE dashboard (filters by type/agent/role)

---

## Installation
Choose an option below. Per‑project installs only; nothing global required.

```bash
# Interactive Modular Install (Recommended)
/path/to/MASTER-WORKFLOW/install-modular.sh

# All Components (Full Power)
/path/to/MASTER-WORKFLOW/install-production.sh

# Per‑Project Standalone
/path/to/MASTER-WORKFLOW/install-standalone.sh

# Windows (PowerShell)
/path/to/MASTER-WORKFLOW/install-modular.ps1
```

After install, your project contains:
```
.ai-workflow/  # intelligence engine, configs, templates, logs
.ai-dev/       # analysis and configuration
.claude/       # Claude Code agents and commands
.claude-flow/  # Flow configs (hive-config, memory)
ai-workflow    # CLI symlink
```

---

## Quick Start
```bash
# Analyze your repo
./ai-workflow analyze

# Initialize with automatic approach selection
./ai-workflow init --auto "Add user profiles with API"

# Force a specific approach
./ai-workflow init --swarm     # small, fast tasks
./ai-workflow init --hive      # multi‑agent feature work
./ai-workflow init --sparc     # enterprise methodology

# Override Claude Flow version
CLAUDE_FLOW_VERSION=stable ./ai-workflow init --auto
CLAUDE_FLOW_VERSION=2.0 ./ai-workflow init --sparc

# Observe live activity (SSE dashboard)
./ai-workflow status-dashboard 8787
```

Approach selection (typical):
- 0–30 → Swarm
- 31–70 → Hive‑Mind
- 71–100 → Hive‑Mind + SPARC

---

## Usage Cheatsheet
```bash
# Components and verification
./ai-workflow components
./ai-workflow verify

# Prompts
./ai-workflow prompt
./ai-workflow prompt edit

# Add components later
./ai-workflow add claude-code
./ai-workflow add agent-os
./ai-workflow add claude-flow
./ai-workflow add tmux

# YOLO (guarded; blocked in CI)
./ai-workflow yolo on
./ai-workflow yolo off
./ai-workflow yolo status

# Direct Claude Flow (integrated with Claude Code)
npx claude-flow@alpha hive-mind spawn "your objective" --agents 6 --claude
npx --yes claude-flow@latest hive-mind spawn "enterprise" --sparc --agents 10 --claude
```

Without tmux: runs in process‑mode; logs under `.ai-workflow/logs/`.  
With tmux: `./ai-workflow tmux start` then `./ai-workflow tmux attach`.

---

## Integrations
- Claude Code: agents and slash commands in `.claude/`; recovery specialist for incomplete repos
- Claude Flow 2.0: multi‑agent execution (Swarm/Hive/SPARC) with persistence and memory
- Agent‑OS: product/spec documents and instructions consumed by agents and flows
- MCP: dynamic registry with default `context7`, configurable via `MCP_DEFAULT_SERVER`/`MCP_SERVERS`

---

## Safety & Governance
- Guardrails: command allowlists, scoped write roots, full journaling, transactional rollback
- YOLO Mode: explicit ack, blocked in CI, disabled by default
- Security & governance docs: `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`

---

## Real‑time Visibility
```bash
# Start SSE dashboard (default port 8787)
./ai-workflow status-dashboard 8787

# Tail the bus in terminal with filters
./ai-workflow bus tail --type response
./ai-workflow bus tail --type tool --agent worker-1
```
- UI: http://localhost:8787/ui
- SSE: `GET /events/stream?type=prompt|tool|response|approach_change`

---

## What You Can Build
- Refactor single‑user apps to SaaS with Supabase (RLS, Stripe, realtime)
- Safety mobile SaaS (inactivity/fall detection, caregiver portal, SMS/GPS)
- Camera‑roll cleanup SaaS (swipe to keep/delete, on‑device index, privacy modes)

See detailed examples in:  
`GPT5-DOCS/USE-CASES.md`

---

## Troubleshooting
- Node < 18 → upgrade to Node 18+
- Commands not found → run from project root; confirm `ai-workflow` symlink
- Missing pieces → `./ai-workflow add claude-flow|agent-os|claude-code|tmux`
- Windows without tmux → uses process‑mode automatically (recommended)

---

## Learn More
- System Audit: `GPT5-DOCS/WORKFLOW-AUDIT.md`
- Integrations: `GPT5-DOCS/INTEGRATIONS.md`
- Full Install & Usage: `GPT5-DOCS/INSTALLATION-AND-USAGE.md`
- Features & Settings: `GPT5-DOCS/WORKFLOW-FEATURES-AND-SETTINGS.md`
- User Guide: `GPT5-DOCS/USER-GUIDE.md`

---

## License
MIT — see `LICENSE` in the repository.
