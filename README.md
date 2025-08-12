# Intelligent Workflow Decision System v2.0

## 🚀 Modular Installation with Component Selection

Choose exactly what you need! The Intelligent Workflow System now offers fully modular installation where you can select which components to install based on your project needs. Works perfectly with just the core, or unlock full power with all integrations.

## Quick CLI Cheatsheet

- Analyze project: `./ai-workflow analyze`
- Initialize with auto-approach: `./ai-workflow init --auto`
- Force approach: `./ai-workflow init --swarm|--hive|--sparc`
- Override Claude Flow version: `CLAUDE_FLOW_VERSION=stable ./ai-workflow init --auto`
- Refresh MCP registry: `./ai-workflow mcp refresh`
- Start dashboards: `./ai-workflow status-dashboard 8787`
- Tail bus: `./ai-workflow bus tail [--type T] [--agent A] [--role R]`

## ✨ Key Features

- **🎛️ Modular Components**: Install only what you need
- **🧠 Intelligent Analysis**: Automatically analyzes project complexity (0-100 score)
- **📝 Interactive Prompt Collection**: Enter unlimited project requirements during setup
- **🎯 Smart Approach Selection**: Chooses optimal workflow approach
- **🔄 Multiple Execution Modes**: Works with or without TMux
- **👤 User Control**: Automatic, interactive, or manual override modes
- **📦 Standalone**: Each installation is completely independent
- **🔧 Post-Install Management**: Add or remove components anytime

## 🧩 Available Components

1. **Core Workflow System** (Required)
   - Intelligence engine for project analysis
   - Complexity scoring and approach selection
   - Basic workflow orchestration

2. **Claude Code Integration** (Optional)
   - AI-powered agents and commands
   - Automated hooks for workflow triggers
   - Recovery specialist for incomplete projects

3. **Agent-OS Planning** (Optional)
   - Specification-driven development
   - Product planning and task management
   - Structured documentation generation

4. **Claude Flow 2.0** (Optional)
   - Multi-agent coordination (Swarm/Hive-Mind)
   - SPARC enterprise methodology
   - Support for all version variants (alpha/beta/stable)

5. **TMux Orchestrator** (Optional)
   - 24/7 autonomous operation
   - Background session management
   - Multi-window workflow orchestration

## Engine (Phase 2–3)

- Core engine added under `engine/` (CLI + Fastify API + SQLite via better-sqlite3).
- Endpoints: `/health`, `/api/components`, `/api/install` (plan), `/api/install/:id/status`, `/api/convo/:sessionId/message`, `/api/convo/:sessionId`, `/api/env/scan`.
- Wizard CLI (planning): `cd engine && npm run build && node dist/cli/index.js wizard` (use inside devcontainer).
- Build/Run inside devcontainer or Linux host:
  - `cd engine && npm ci && npm run build && npm run cli migrate && npm start`.

## 📥 Installation

### Interactive Modular Installation (Recommended)

```bash
# Clone or download this repository
git clone [repository-url] workflow-system
cd workflow-system

# Run the modular installer in your project
cd /path/to/your/project
/path/to/workflow-system/install-modular.sh

# Follow the interactive prompts to:
# 1. Select components to install
# 2. Enter your initial project requirements (optional)
# 3. Start working immediately
```

### Quick Installation (All Components)

```bash
# Install everything for full power
cd /path/to/your/project
/path/to/workflow-system/install-production.sh
```

After installation, each project will have:
- `.ai-workflow/` - Local installation (intelligence engine, configs, templates)
- `ai-workflow` - Command-line interface (symlink in project root)
- `.ai-dev/` - Project metadata and analysis results
- Configuration directories for integrations (`.claude/`, `.agent-os/`, `.claude-flow/`)

## 🎮 Usage

### Component Management

```bash
# View installed components
./ai-workflow components

# Verify all components work together
./ai-workflow verify

# Add components after installation
./ai-workflow add claude-code    # Add Claude Code integration
./ai-workflow add agent-os       # Add Agent-OS planning
./ai-workflow add claude-flow    # Add Claude Flow 2.0
./ai-workflow add tmux           # Add TMux orchestrator

# Work with saved prompt
./ai-workflow prompt             # Execute saved prompt
./ai-workflow prompt edit        # Edit saved prompt
```

### YOLO Mode (Skip Permissions)

```bash
# Enable YOLO mode (uses your 'yolo' alias)
./ai-workflow yolo on

# Disable YOLO mode (uses standard 'claude')
./ai-workflow yolo off

# Check current mode
./ai-workflow yolo status

# During installation, you'll be asked:
# "Do you have a 'yolo' alias for Claude Code?"
```

YOLO details
- Flags used by the engine: `--yolo --dangerously-skip-permissions --non-interactive --ack I-ACCEPT-RISK`
- Guardrails remain active: command allowlists, filesystem write roots, full journaling, transactional rollback
- Kill switch: set `INSTALLER_KILL=1` to abort new actions

### Workflow Execution

```bash
# Analyze project complexity
./ai-workflow analyze

# Let AI select the best approach
./ai-workflow init --auto "Build a REST API with authentication"

# Interactive mode (shows analysis, lets you choose)
./ai-workflow init

# Force specific approach (if Claude Flow installed)
./ai-workflow init --sparc   # Force SPARC methodology
./ai-workflow init --hive    # Force Hive-Mind
./ai-workflow init --swarm   # Force Simple Swarm

# Use specific Claude Flow version
CLAUDE_FLOW_VERSION=beta ./ai-workflow init --auto
CLAUDE_FLOW_VERSION=2.0 ./ai-workflow init --sparc

### Command Execution Helper (Phase 2)

All internal command execution now uses a cross-platform helper that preserves quoting and supports sequential runs. This removes brittle `split(' ')` logic and Linux-only shells, improving Windows compatibility. SPARC wizard now runs as a separate sequential step instead of using `&&`.
```

### Runner Consolidation (Phase 8)

- The modular runner is the default unified runner across platforms.
- Legacy runner is considered a tmux-specialized variant only; installer links the modular runner as `workflow-runner.js` by default.

### Working Without TMux

The system automatically detects if TMux is installed and falls back to background process execution:

```bash
# Without TMux: Runs in background process
./ai-workflow init --auto

# Process logs saved to .ai-workflow/logs/
# Check status with:
./ai-workflow status

# With TMux: Creates detached sessions
# (Only if TMux component is installed)
./ai-workflow tmux start
./ai-workflow tmux attach
```

## 🔍 How It Works

### 1. Project Analysis
The system analyzes your project across 8 dimensions:
- **Size**: File count and code volume
- **Dependencies**: Package complexity
- **Architecture**: Monolith vs microservices
- **Tech Stack**: Languages, frameworks, databases
- **Features**: Auth, realtime, API, deployment
- **Team**: Collaboration indicators
- **Deployment**: Docker, Kubernetes, cloud
- **Testing**: Test coverage and frameworks

### 2. Approach Selection

Based on complexity score (0-100):

| Score | Approach | Description | Command |
|-------|----------|-------------|---------|
| 0-30 | Simple Swarm | Quick single-agent tasks | `npx claude-flow@[version] swarm` |
| 31-70 | Hive-Mind | Multi-agent coordination | `npx claude-flow@[version] hive-mind spawn` |
| 71-100 | Hive-Mind + SPARC | Enterprise methodology | `npx claude-flow@[version] hive-mind spawn --sparc` |

### 3. Project Stages

The system adapts to your project's lifecycle:
- **Idea**: Documentation only → Generates planning documents
- **Early**: Basic structure → Establishes patterns and standards
- **Active**: Substantial code → Optimizes for feature development
- **Mature**: Production-ready → Focuses on maintenance

### 4. Document Customization

Generates customized documentation based on detected stack:
- **CLAUDE.md**: Tech-specific guidelines and commands
- **Agent OS Instructions**: Language and framework standards
- **Custom Workflows**: Stack-specific development workflows
- **CONTRIBUTING.md**: Setup instructions for your tech stack
- **DEPLOYMENT.md**: Platform-specific deployment guides
- **ARCHITECTURE.md**: System design documentation
- **SPARC Phases**: 5-phase enterprise methodology (if applicable)

## 📁 Project Structure

```
your-project/
├── .ai-workflow/                 # Local installation (standalone)
│   ├── intelligence-engine/      # Analysis and selection engine
│   │   ├── complexity-analyzer.js
│   │   ├── approach-selector.js
│   │   ├── user-choice-handler.sh
│   │   └── document-customizer.js
│   ├── bin/                      # CLI scripts
│   │   └── ai-workflow
│   ├── templates/                # Workflow templates
│   └── configs/                  # Configuration files
│
├── .ai-dev/                      # Project metadata
│   ├── analysis.json             # Complexity analysis results
│   ├── approach.json             # Selected approach details
│   └── config.json               # Project configuration
│
├── .claude/                      # Claude Code integration
│   ├── CLAUDE.md                 # Customized project context
│   └── settings.json             # Claude settings
│
├── .agent-os/                    # Agent OS specifications
│   ├── specs/                    # Feature specifications
│   └── instructions.md           # Customized instructions
│
├── .claude-flow/                 # Claude Flow configuration
│   ├── hive-config.json          # Hive-mind settings
│   ├── sparc-phases/             # SPARC methodology phases
│   └── memory.db                 # Cross-session memory
│
└── ai-workflow                   # CLI command (symlink)
```

## 🎯 Claude Flow Versions

Set the version using environment variable:

```bash
# Available versions
CLAUDE_FLOW_VERSION=alpha   # Default, latest features
CLAUDE_FLOW_VERSION=beta    # Beta testing version
CLAUDE_FLOW_VERSION=latest  # Latest stable
CLAUDE_FLOW_VERSION=2.0     # Version 2.0 release
CLAUDE_FLOW_VERSION=stable  # Most stable version
CLAUDE_FLOW_VERSION=dev     # Development version
```

## 🔧 Configuration

Edit `.ai-dev/config.json` in your project:

```json
{
  "defaultSettings": {
    "claudeFlowVersion": "alpha",
    "mode": "interactive",
    "autoAnalyze": true,
    "generateDocs": true
  }
}
```

### New Defaults and Environment Variables

- Windows defaults to process mode (tmux disabled on `win32`).
- YOLO mode is gated in CI: set `BLOCK_YOLO=true` or rely on `CI=true` to block; enabling YOLO requires `--ack I-ACCEPT-RISK`.
- MCP default server: `context7` (override with `MCP_DEFAULT_SERVER`).
- Event bus port: set `AGENT_BUS_PORT` (defaults to 8787).
- TMux auto-commit is disabled by default; enable with `ENABLE_AUTO_COMMIT=true`.

## 📊 Example Analysis Output

```json
{
  "score": 72,
  "stage": "active",
  "factors": {
    "size": { "fileCount": 156, "score": 60 },
    "dependencies": { "count": 42, "score": 65 },
    "architecture": { "primaryArchitecture": "fullstack", "score": 75 },
    "techStack": {
      "languages": ["JavaScript", "TypeScript"],
      "frameworks": ["React", "Express"],
      "databases": ["PostgreSQL", "Redis"]
    },
    "features": {
      "detected": {
        "authentication": true,
        "realtime": true,
        "api": true,
        "docker": true
      }
    }
  },
  "recommendations": [{
    "approach": "Hive-Mind + SPARC",
    "reason": "High complexity project benefiting from systematic methodology",
    "confidence": 0.95
  }]
}
```

## 🚀 Generated Commands

The system generates the exact Claude Flow commands for your project:

```bash
# Simple Swarm (low complexity)
npx claude-flow@alpha swarm "Fix authentication bug"

# Hive-Mind (medium complexity)
npx claude-flow@alpha hive-mind spawn "my-project" --agents 5 --claude

# Hive-Mind + SPARC (high complexity)
npx claude-flow@alpha hive-mind spawn "enterprise-app" --sparc --agents 10 --claude
npx claude-flow@alpha sparc wizard --interactive
```

## User Guide

### Installation matrix
- Windows: Use install-modular.ps1 (Git Bash recommended). If you skip tmux, the system runs in process mode. PowerShell fallback for image attachments; FileSystemWatcher supervisor available.
- WSL: Works as Linux; inotify watcher.
- macOS: Full support; fswatch watcher used when installed.
- Linux: Full support; inotify watcher used when installed.

### Component selections and combinations
Pick any combination: Core only; Core+Agent-OS; Core+Claude Code; Core+Claude Flow; Any+TMux. The installer cleans up docs for unselected components to keep the project tidy.

### Initial prompt with image attachments
- During install, you can attach an image directory; images are copied to `.ai-workflow/assets/images` and referenced in `.ai-workflow/initial-prompt.md`.
- On Windows, if POSIX copy fails, PowerShell copies jpg/jpeg/png/gif/webp.

### Version policy and CLAUDE_FLOW_VERSION (centralized)
The system uses a centralized version policy (`lib/version-policy.js`) to decide and format the Claude Flow version for all modules.

- Accepted names: `alpha`, `beta`, `latest`, `stable`, `2.0`, `dev` (aliases like `v2`, `2`, `development` are normalized)
- Suffix mapping is automatic (e.g., `alpha` → `@alpha`)
- Defaults: If not set, heuristic picks based on analysis (e.g., `mature` → `stable`, very high complexity → `latest`, otherwise `alpha`)
- Override via env:
  - `CLAUDE_FLOW_VERSION=stable ./ai-workflow init --auto`
  - `CLAUDE_FLOW_VERSION=2.0 ./ai-workflow init --sparc`

### MCP discovery & usage
- Refresh registry: `./ai-workflow mcp refresh`
- View summary in CLAUDE.md under "Discovered MCP Servers & Tools".
- Agents should consult `.ai-workflow/configs/mcp-registry.json` at runtime (see AGENT-BOOTSTRAP.md).
- Default server: `context7` (override with `MCP_DEFAULT_SERVER`); you can also add servers via `MCP_SERVERS` env (JSON or CSV: `name=url`)

### Optional experimental features (Phase 3)
### Phase 4: Sub-Agent Auto-Delegation

- Configure toggles and rules in `.claude/settings.json`:
  - `autoDelegation.enabled`: enable/disable
  - `autoDelegation.rules[]`: match `taskKeywords` and/or `filePatterns` to `delegateTo` agent
- Included templates: `test-engineer`, `security-auditor` (installed to `.claude/agents/`)
- Modular runner auto-delegates Claude Code tasks based on rules (heuristic matching)


- Training (experimental gated by version or flag):
  - Enable: `ENABLE_CF_TRAINING=true` or `CF_ENABLE_EXPERIMENTAL=true` when using an experimental version (`alpha`, `beta`, `dev`)
  - Configure epochs: `CF_TRAINING_EPOCHS=5`
  - Runs: `npx claude-flow@<version> training neural-train --epochs <N>` automatically after core commands

- Memory operations (optional):
  - Enable: `ENABLE_CF_MEMORY_OPS=true`
  - Action: `CF_MEMORY_ACTION=summarize|sync|gc` (default `summarize`)
  - Runs automatically after core commands for the detected project

### Dashboards & event bus

#### Bus commands and TUI
- Start JSON + SSE dashboard (default port 8787):
  - `./ai-workflow status-dashboard 8787`
  - UI: http://localhost:8787/ui (filters: type, agent, role)
  - SSE: `GET /events/stream?type=prompt|tool|response|approach_change&agent=...&role=...`
- Tail the bus in terminal (with filters):
  - `./ai-workflow bus tail --type tool --agent worker-1 --role architect`
- Minimal TUI (no external deps):
  - `./ai-workflow bus tui --type response`
  - or `node .ai-workflow/bin/tmp_rovodev_agent_bus_tui.js --type response --agent queen --role watcher`


### Bus filtering examples
- Filter by type only (tool):
  - UI: Select Type=tool, leave Agent/Role blank
  - SSE: `/events/stream?type=tool`
  - Tail: `./ai-workflow bus tail --type tool`
- Filter by type and agent:
  - UI: Type=tool, Agent=worker-1
  - SSE: `/events/stream?type=tool&agent=worker-1`
  - Tail: `./ai-workflow bus tail --type tool --agent worker-1`
- Filter by role:
  - UI: Role=architect
  - SSE: `/events/stream?role=architect`
  - Tail: `./ai-workflow bus tail --role architect`

- Tail: `bash .ai-workflow/bin/tmp_rovodev_agent_bus_tail.sh`
- HTTP (JSON + SSE): `./ai-workflow status-dashboard [port]` (default 8787)
  - JSON: `GET /`
  - SSE: `GET /events/stream?type=prompt|tool|response|approach_change`
  - Publish: `POST /events/publish` with `{ type, payload }`
  - Agents emit events automatically (runner publishes log/approach_change/exec_complete)
- Event schema in AGENT-BOOTSTRAP.md. Hooks already emit prompt/tool/response; supervisor emits approach_change.

### Supervisors & watchers
- Linux: inotify; macOS: fswatch; Windows: FileSystemWatcher.
- Installer offers to start supervisor; Windows attempt is also made automatically if PowerShell is available.

### Workflow examples
- Small bug fix (Simple Swarm):
  - `./ai-workflow init --swarm "Fix off-by-one error in pagination"`
- Full-stack feature (Hive-Mind):
  - `./ai-workflow init --hive "Add user profile page with API"`
- Enterprise planning/refactor (SPARC):
  - `CLAUDE_FLOW_VERSION=stable ./ai-workflow init --sparc`
- Recovery of a messy repo:
  - Use recovery-specialist agent and run: `claude /recover analyze` (hooks trigger analysis/recovery paths)

### Best practices
- Keep CLAUDE.md, Agent-OS instructions, and AGENT-BOOTSTRAP.md handy for agents.
- Use MCP tools when available; fallback to built-ins.
- Watch the dashboard for approach changes and agent activity.
- Respect risk controls: avoid YOLO in CI, prefer portable commands, and keep MCP registry deterministic.

## Windows Quickstart (PowerShell + Git Bash)

- Install prerequisites:
  - Node.js 18+ from nodejs.org
  - Git for Windows (includes Git Bash)
- Run installer:
  - PowerShell: `./install-modular.ps1`
  - Or Git Bash: `bash install-modular.sh`
- If you skip TMux (recommended on native Windows), the system runs in process mode.
- Supervisors:
  - The PowerShell wrapper starts a FileSystemWatcher supervisor after a successful install.
  - The bash installer also attempts to start it if PowerShell is available.
- Image attachments: If POSIX copy fails, PowerShell fallback copies jpg/jpeg/png/gif/webp.

Common fixes:
- PowerShell execution policy: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- Git Bash not found: Install Git for Windows and relaunch PowerShell
- Node version: `node -v` must be >= 18

## Dashboard previews (placeholders)

- UI (http://localhost:8787/ui):

  ![Dashboard UI Placeholder](docs/images/dashboard-ui.png)

- SSE stream example:
  - `GET http://localhost:8787/events/stream?type=tool&agent=worker-1`

## FAQ

See FAQ.md for common issues (jq, tmux, fswatch, PowerShell execution policy) and fixes.

## 📚 Documentation Files

All documentation in this directory:

- **README.md** - This file
- **INTELLIGENT-DECISION-GUIDE.md** - Complete usage guide
- **MIGRATION-GUIDE.md** - Migration from standard systems
- **PRODUCTION-READY.md** - Production readiness details

Configuration references:
- **configs/approaches.json** - Approach definitions and settings
- **configs/tech-stack.json** - Technology detection patterns
- **configs/integrations.json** - System integration configurations

## ✅ Requirements

- **Node.js 18+** - Required for intelligence engine
- **npm** - Package manager
- **tmux** - Optional, for session management
- **git** - Optional, for version control

### Governance and Security
- Phase 1 governance is in place: CI workflow, issue templates, `SECURITY.md`, `CONTRIBUTING.md`, and `CODE_OF_CONDUCT.md`.
- YOLO mode is blocked in CI; dangerous flags must not be committed. See `SECURITY.md`.

## Contributing: MCP Servers & Tools

We welcome contributions of new MCP servers and tools.

- Add a server:
  - Extend `.ai-workflow/lib/mcp-discover.js` to detect the server (via env, PATH, or known socket URLs)
  - Add a baseline entry in `.claude-flow/hive-config.json` if widely useful
  - Document usage in README/AGENT-BOOTSTRAP.md
- Add a tool:
  - Add a tool entry to the registry (name, type, server binding if MCP)
  - Update CLAUDE.md/MCP section generation if special instructions are needed
- Testing:
  - Run `./ai-workflow mcp refresh` and verify the registry and docs update
  - Use the bus dashboard to observe agent/tool interactions

## 🆕 What’s New

- Interactive modular installer with component selection (Core, Claude Code, Agent-OS, Claude Flow, TMux)
- Prompt collection supports optional image attachments; Windows PowerShell fallback if POSIX find is unavailable
- Auto-selects Claude Flow version (alpha/latest/stable) based on analysis, with environment override
- Merges your .ai-dev/project-instructions.md into both .claude/CLAUDE.md and .agent-os/instructions/instructions.md
- Generates .claude-flow/hive-config.json with role-specific prompts, agent counts from complexity, and memory policies
- Optional “Auto-run now” at the end of install (tmux orchestration or direct command)
- Background supervisor loop to re-analyze and regenerate docs; restarts orchestration if approach changes significantly
- TMux orchestration uses the selected CLAUDE_FLOW_VERSION

## 🎉 Features Implemented

- ✅ Deep codebase analysis (reads actual files)
- ✅ All Claude Flow 2.0 versions supported
- ✅ Intelligent approach selection with learning
- ✅ User choice modes (auto/interactive/manual)
- ✅ Tech-stack specific documentation
- ✅ SPARC methodology with 5 phases
- ✅ Stage detection (idea/early/active/mature)
- ✅ Standalone installation per directory
- ✅ No global dependencies
- ✅ Complete independence between projects

## 🆘 Troubleshooting

### Analysis fails
- Ensure Node.js 18+ is installed
- Check project has readable files
- Try manual mode: `./ai-workflow init --swarm`

### Wrong approach selected
- Override with manual selection
- Adjust complexity in analysis
- Use environment variable for version

### Command not found
- Use `./ai-workflow` from project root
- Check installation completed successfully
- Verify symlink exists

## 📝 License

MIT License - See `LICENSE` file for details

---

**Ready for Production Use** - All features implemented and tested!

## CI/CD and GitHub Actions

- Continuous Integration: `.github/workflows/ci.yml` runs a cross-OS matrix (Windows/macOS/Linux) with Node 18/20 and smoke tests
- Security Scanning: `.github/workflows/security.yml` runs gitleaks; extend as needed
- Governance: PR template enforces safety and cross-platform checks

### Rollback Guidance (per phase)
- Prefer feature flags/env toggles to soft-rollback new features
- Revert full phase via GitHub “Revert” on the phase PR if needed
- See `GPT5-EXECUTION-PLAN.MD` section 15 for phase-specific steps

### Enable Claude Code GitHub Actions

1) Install the Claude GitHub App to this repo and grant Contents/Issues/PRs permissions
2) Add repository secrets (Settings → Secrets and variables → Actions):
   - `ANTHROPIC_API_KEY` (direct API) or provider creds (Bedrock/Vertex)
   - If using a custom GitHub App: `APP_ID`, `APP_PRIVATE_KEY`
3) Add a Claude workflow (see `.github/workflows/claude.yml` example) that responds to `@claude` in issues/PRs

Reference: Claude Code GitHub Actions setup and examples: https://docs.anthropic.com/en/docs/claude-code/github-actions

### API Contract

- Minimal API is documented in `openapi.yaml` and validated in CI (`OpenAPI Validate` workflow)
- Endpoints: `/` (status snapshot), `/events/stream` (SSE), `/events/publish` (event intake)

### Pre-commit Hooks

- Pre-commit configuration `.pre-commit-config.yaml` runs:
  - gitleaks (secrets scanning)
  - lint-if-available (executes `npm run lint` if defined)
  - Install locally: `pip install pre-commit && pre-commit install`