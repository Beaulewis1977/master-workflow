# Installation and Usage

## Prerequisites
- Node.js 18+
- npm
- Optional: tmux (Linux/macOS/WSL recommended)
- Optional: Git

## Install Methods

### 1) Interactive Modular Installation (Recommended)
```bash
# From the workflow repo
cd /path/to/MASTER-WORKFLOW

# Install into your project directory
cd /path/to/your/project
/path/to/MASTER-WORKFLOW/install-modular.sh
```
- Choose components: Core, Claude Code, Agent-OS, Claude Flow 2.0, TMux
- Optionally enter a long initial prompt (saved to `.ai-workflow/initial-prompt.md`)

### 2) Quick Installation (All Components)
```bash
cd /path/to/your/project
/path/to/MASTER-WORKFLOW/install-production.sh
```

### 3) Per-Project Standalone Install
```bash
cd /path/to/your/project
/path/to/MASTER-WORKFLOW/install-standalone.sh
```

### 4) Windows
```powershell
# PowerShell
/path/to/MASTER-WORKFLOW/install-modular.ps1
```
- If tmux is skipped, the system runs in process mode

## Post-Install Layout
```
your-project/
├─ .ai-workflow/               # Local installation (intelligence engine, configs, templates)
│  ├─ bin/ai-workflow          # CLI entrypoint (symlink from root)
│  ├─ configs/                 # approach, orchestrator, MCP registry
│  ├─ intelligence-engine/     # analysis, selection, doc-intelligence
│  ├─ logs/                    # process logs and bus JSONL
│  └─ ...
├─ .ai-dev/                    # analysis + configuration
├─ .claude/                    # Claude Code agents and commands
├─ .claude-flow/               # Claude Flow configs (hive-config, memory)
└─ ai-workflow                 # CLI symlink
```

## Core CLI
```bash
# View installed components
./ai-workflow components

# Verify all pieces work together
./ai-workflow verify

# Analyze the project
./ai-workflow analyze

# Initialize with automatic approach selection
./ai-workflow init --auto "Build a REST API"

# Interactive mode (see analysis, choose approach)
./ai-workflow init

# Force a specific approach (requires Claude Flow)
./ai-workflow init --swarm
./ai-workflow init --hive
./ai-workflow init --sparc

# Use a specific Claude Flow version
CLAUDE_FLOW_VERSION=stable ./ai-workflow init --auto
CLAUDE_FLOW_VERSION=2.0 ./ai-workflow init --sparc

# YOLO mode (gated)
./ai-workflow yolo on
./ai-workflow yolo off
./ai-workflow yolo status

# Add components after install
./ai-workflow add claude-code
./ai-workflow add agent-os
./ai-workflow add claude-flow
./ai-workflow add tmux
```

## Claude Flow Commands (direct)
```bash
# Spawn hive-mind session with Claude integration
npx claude-flow@alpha hive-mind spawn "your objective" --agents 6 --claude

# SPARC enterprise orchestration
npx --yes claude-flow@latest hive-mind spawn "enterprise-app" --sparc --agents 10 --claude

# Status and resume
npx claude-flow@alpha hive-mind status
npx claude-flow@alpha hive-mind resume <session-id>
```

## Dashboards & Event Bus
```bash
# Start the SSE dashboard (default port 8787)
./ai-workflow status-dashboard 8787

# Tail the event bus in terminal
./ai-workflow bus tail --type response
```
- UI: `http://localhost:8787/ui`
- SSE: `GET /events/stream?type=prompt|tool|response|approach_change`

## Working Without tmux
```bash
# Runs as background process, logs stored under .ai-workflow/logs/
./ai-workflow init --auto
./ai-workflow status
```

## Engine API (optional)
```bash
cd engine && npm ci && npm run build && npm run cli migrate && npm start
# Health
curl -sS http://127.0.0.1:13800/health | jq
```

## Troubleshooting
- Ensure Node 18+
- If command not found, run from project root and verify the `ai-workflow` symlink
- Override approach manually if needed (swarm/hive/sparc)
