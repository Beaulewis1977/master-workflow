# AI Development OS - Complete Integration Guide
## How the 4 Systems Work Together

### Table of Contents
1. [Installation Architecture](#installation-architecture)
2. [Communication Protocols](#communication-protocols)
3. [Control Hierarchy](#control-hierarchy)
4. [Project Configuration](#project-configuration)
5. [Workflow Examples](#workflow-examples)
6. [Troubleshooting](#troubleshooting)

---

## Installation Architecture

### Three-Layer Installation Model

#### 1. **Global/User Layer** (Install Once)
```bash
~/.ai-dev-os/              # Master control center
~/.claude/                 # Claude Code + Agent OS
~/.claude-flow/            # Claude-Flow memory
~/.tmux-orchestrator/      # Tmux sessions
```

**What gets installed globally:**
- Claude Code: `npm install -g @anthropic-ai/claude-code`
- Agent OS: Commands and agents in `~/.claude/`
- Claude-Flow: Can be global or use npx
- Tmux-Orchestrator: Scripts in home directory

**Answer:** You do NOT need to install these in each project directory!

#### 2. **Project Configuration Layer** (Per Project)
```bash
project/
├── .ai-dev/               # Project metadata
├── .claude/               # Project-specific settings
├── .agent-os/             # Project specs
├── .claude-flow/          # Project workflow memory
└── .tmux-orchestrator/    # Project sessions
```

**What's project-specific:**
- Configuration files only
- Project specifications
- Custom sub-agents
- Workflow definitions

#### 3. **Integration Layer** (AI Dev OS)
```bash
~/.ai-dev-os/
├── bin/                   # Control scripts
├── integrations/          # System configs
└── templates/             # Project templates
```

---

## Communication Protocols

### How Systems Talk to Each Other

#### The Communication Flow
```
User Input
    ↓
Tmux-Orchestrator (Session Manager)
    ↓ [tmux send-keys]
Claude Code (Integration Hub)
    ↓ [Commands/CLI/Delegation]
├── Agent OS (slash commands)
├── Claude-Flow (CLI commands)
└── Sub-Agents (internal delegation)
    ↓ [Hooks/Callbacks]
Back to Tmux-Orchestrator
```

### Specific Communication Methods

#### 1. **Tmux → Claude Code**
```bash
# Tmux sends commands to Claude Code
tmux send-keys -t session "claude /plan-product" Enter
tmux send-keys -t session "ai-dev flow swarm 'create API'" Enter
```

#### 2. **Claude Code → Agent OS**
```markdown
# Claude Code uses slash commands
/plan-product
/create-spec --feature "user-auth"
/analyze-product
/execute-tasks
```

#### 3. **Claude Code → Claude-Flow**
```bash
# Claude Code executes CLI commands
npx claude-flow@alpha swarm "implement feature"
npx claude-flow@alpha hive-mind spawn "project"
```

#### 4. **Claude Code → Sub-Agents**
```markdown
# Claude Code delegates internally
@code-reviewer: Review this implementation
@test-engineer: Create comprehensive tests
@security-auditor: Check for vulnerabilities
```

#### 5. **Systems → Tmux (Feedback)**
```json
// Via hooks in .claude/settings.json
{
  "hooks": {
    "tool-call-hook": "tmux send-keys -t orchestrator 'Tool: ${TOOL_NAME} Status: ${STATUS}' Enter",
    "model-response-hook": "tmux send-keys -t orchestrator 'Task completed' Enter"
  }
}
```

### The Integration Hub: Claude Code

**How Claude Code knows what to use:**

1. **Integration Configuration** (`~/.claude/integrations.json`)
```json
{
  "routing": {
    "simple-task": "direct-execution",
    "complex-task": "claude-flow",
    "planning-required": "agent-os-first",
    "long-running": "tmux-orchestrator",
    "specialized": "sub-agent-delegation"
  }
}
```

2. **Context Injection** (Added to CLAUDE.md)
```markdown
## Available Systems
- Planning needed? Use /plan-product (Agent OS)
- Complex task? Use `ai-dev flow hive-mind` (Claude-Flow)  
- Long-running? Use `ai-dev orchestrate` (Tmux)
- Specialized? Delegate to @sub-agent
```

3. **Intelligent Decision Making**
Claude Code analyzes each request and decides:
- Does it need planning? → Agent OS first
- Is it complex/multi-part? → Claude-Flow
- Will it take hours? → Tmux-Orchestrator
- Need expertise? → Sub-Agent

---

## Control Hierarchy

### Who Controls What

#### Master Controller: Tmux-Orchestrator
**Controls:** WHEN and WHERE
- Session management
- 24/7 persistence
- Scheduling
- Cross-project coordination

**How it controls:**
```bash
# Creates and manages sessions
tmux new-session -s "project-a"
tmux new-window -n "development"

# Sends commands to Claude Code
tmux send-keys -t "project-a:development" "claude /plan-product" Enter

# Monitors progress via hooks
# Receives feedback from Claude Code hooks
```

#### Integration Hub: Claude Code
**Controls:** HOW and ROUTING
- Receives all commands
- Routes to appropriate system
- Manages execution
- Reports results

**How it decides:**
```javascript
// Pseudo-logic in Claude Code
if (task.needs_planning) {
  execute("/plan-product");  // Agent OS
} else if (task.is_complex) {
  execute("claude-flow hive-mind");  // Claude-Flow
} else if (task.needs_specialization) {
  delegate_to("@code-reviewer");  // Sub-Agent
} else {
  execute_directly();  // Direct execution
}
```

#### Context Provider: Agent OS
**Controls:** WHAT (Specifications)
- Development standards
- Project specifications
- Planning documents
- Quality requirements

**How it provides context:**
```bash
# Creates specifications
/plan-product → generates product roadmap
/create-spec → generates feature specs
# These become context for all other systems
```

#### Workflow Engine: Claude-Flow
**Controls:** WHO (Agent Coordination)
- Multi-agent orchestration
- Parallel task execution
- Memory persistence
- Complex workflows

**How it coordinates:**
```bash
# Manages multiple agents
claude-flow hive-mind spawn "project"
# Coordinates parallel work
# Maintains context across agents
```

#### Executors: Sub-Agents
**Control:** SPECIFIC TASKS
- Specialized execution
- Focused expertise
- Quality assurance
- Domain-specific work

---

## Project Configuration

### Different Projects, Different Configs

#### Auto-Detection System
```javascript
// The installer detects project type from files:
package.json + react → web-app
requirements.txt → python api-service  
go.mod → go api-service
Cargo.toml → rust cli-tool
```

#### Template System
Each project type gets specific configurations:

##### Web App Configuration
```bash
.claude/agents/
├── frontend-specialist.md   # React/Vue expert
├── ui-designer.md           # UI/UX specialist
└── performance-optimizer.md # Web performance

.agent-os/standards.md       # Frontend standards
.claude-flow/config.json     # UI workflow configs
```

##### API Service Configuration
```bash
.claude/agents/
├── api-architect.md         # API design
├── database-specialist.md   # Data layer
└── security-engineer.md     # Security

.agent-os/standards.md       # API standards
.claude-flow/config.json     # Backend workflows
```

#### Per-Project Customization
```bash
# Run in each project directory
ai-dev init [type]

# This creates project-specific configs:
.ai-dev/project.json         # Project metadata
.claude/settings.json        # Project hooks
.agent-os/specs/            # Project specifications
```

**Answer:** Each project gets its own configuration while using the same global installations!

---

## Workflow Examples

### Example 1: Simple Task Flow
```
User: "Add user authentication"
    ↓
Claude Code (analyzes request)
    ↓
Routes to Agent OS: /create-spec --feature "user-auth"
    ↓
Agent OS generates specification
    ↓
Claude Code receives spec
    ↓
Routes to Claude-Flow: hive-mind spawn "implement-auth"
    ↓
Claude-Flow coordinates implementation
    ↓
Sub-Agents execute (api-architect, frontend-specialist, test-engineer)
    ↓
Results reported back through Claude Code
```

### Example 2: 24/7 Autonomous Flow
```
User: "ai-dev orchestrate"
    ↓
Tmux-Orchestrator creates sessions
    ↓
Launches Claude Code in session
    ↓
Claude Code runs /plan-product (Agent OS)
    ↓
Plan informs Claude-Flow coordination
    ↓
Multiple Sub-Agents work in parallel
    ↓
Progress reported via hooks to Tmux
    ↓
Tmux schedules next tasks
    ↓
Continues autonomously...
```

### Example 3: Cross-System Coordination
```
Tmux-Orchestrator (Scheduling)
    → "Time to run tests"
    
Claude Code (Routing)
    → Checks project type
    → Loads project config
    
Agent OS (Standards)
    → Provides test requirements
    
Claude-Flow (Coordination)
    → Spawns test agents
    
Sub-Agent @test-engineer (Execution)
    → Runs comprehensive tests
    
Results flow back through chain
```

---

## Installation Instructions

### Quick Install (One Command)
```bash
# Download and run the installer
curl -fsSL https://raw.githubusercontent.com/yourusername/ai-dev-os/main/install-ai-dev-os.sh | bash
```

### Manual Installation
```bash
# 1. Run the installer script
bash install-ai-dev-os.sh

# 2. Reload your shell
source ~/.bashrc  # or ~/.zshrc

# 3. Set API key
export ANTHROPIC_API_KEY="your-key"

# 4. Verify installation
ai-dev status
```

### Per-Project Setup
```bash
# Navigate to your project
cd my-project

# Initialize AI Dev OS
ai-dev init  # Auto-detects type
# OR
ai-dev init web-app  # Specify type

# Start development
ai-dev start

# For autonomous mode
ai-dev orchestrate
```

---

## How Claude Code Orchestrates Everything

### The Master Integration File
Claude Code reads `~/.claude/integrations.json` which tells it:

1. **What systems are available**
```json
{
  "systems": {
    "agent-os": { "enabled": true, "commands": [...] },
    "claude-flow": { "enabled": true, "modes": [...] },
    "tmux-orchestrator": { "enabled": true, ... },
    "sub-agents": { "enabled": true, "available": [...] }
  }
}
```

2. **When to use each system**
```json
{
  "routing": {
    "planning-required": "agent-os-first",
    "complex-task": "claude-flow",
    "long-running": "tmux-orchestrator",
    "specialized": "sub-agent-delegation"
  }
}
```

3. **How to communicate**
```json
{
  "hooks": {
    "user-prompt-submit-hook": "log_and_route",
    "tool-call-hook": "report_to_orchestrator",
    "model-response-hook": "update_status"
  }
}
```

### Claude Code's Decision Tree
```
Receive Task
    ↓
Is it a planning task?
    YES → /plan-product (Agent OS)
    NO ↓
Is it complex/multi-part?
    YES → claude-flow hive-mind
    NO ↓
Does it need specialization?
    YES → @sub-agent
    NO ↓
Is it long-running?
    YES → tmux-orchestrator
    NO ↓
Execute directly
```

---

## Key Insights

### 1. **One Installation, Many Projects**
- Systems install globally ONCE
- Each project gets custom configuration
- No need to reinstall for each project

### 2. **Claude Code as the Brain**
- All requests flow through Claude Code
- It intelligently routes to appropriate systems
- Maintains context and coordination

### 3. **Tmux as the Persistence Layer**
- Keeps everything running 24/7
- Survives restarts and disconnections
- Manages multiple projects simultaneously

### 4. **Communication via Multiple Channels**
- Commands (Agent OS)
- CLI (Claude-Flow)
- Delegation (Sub-Agents)
- Hooks (Feedback to Tmux)

### 5. **Project-Specific Without Redundancy**
- Templates provide starting configs
- Each project customizes as needed
- Global tools, local configurations

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Claude Code doesn't know about the systems"
**Solution:** Check `~/.claude/integrations.json` exists and is loaded

#### Issue: "Commands not found"
**Solution:** Run `source ~/.bashrc` to reload PATH

#### Issue: "Systems not communicating"
**Solution:** Check hooks in `.claude/settings.json`

#### Issue: "Wrong project type detected"
**Solution:** Manually specify: `ai-dev init web-app`

#### Issue: "Tmux sessions lost"
**Solution:** Use tmux-resurrect for session persistence

---

## Summary

The AI Development OS creates a **unified autonomous development environment** where:

1. **Tmux-Orchestrator** provides 24/7 persistence and scheduling
2. **Claude Code** acts as the intelligent integration hub
3. **Agent OS** provides planning and specifications
4. **Claude-Flow** coordinates multi-agent workflows
5. **Sub-Agents** execute specialized tasks

All systems work together through:
- Intelligent routing by Claude Code
- Multiple communication channels
- Shared configuration and context
- Automated coordination via hooks

**The result:** An AI development team that works autonomously, coordinates intelligently, and scales across multiple projects without requiring redundant installations.

---

*This integration creates not just a collection of tools, but a complete AI Development Operating System where each component has a clear role and all work together seamlessly.*