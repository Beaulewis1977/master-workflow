# Intelligent Workflow Decision System v2.0

## 🚀 Modular Installation with Component Selection

Choose exactly what you need! The Intelligent Workflow System now offers fully modular installation where you can select which components to install based on your project needs. Works perfectly with just the core, or unlock full power with all integrations.

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
```

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

MIT License - See LICENSE file for details

---

**Ready for Production Use** - All features implemented and tested!