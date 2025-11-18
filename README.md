# 🚀 Master Workflow

**An autonomous AI development framework combining Claude Flow, Agent OS, and Claude Code**

## 🎯 Vision

Master Workflow is a meta-framework that orchestrates AI agents to autonomously develop applications. It combines three powerful systems:

- **🌊 Claude Flow**: Workflow orchestration for AI agent tasks
- **🤖 Agent OS**: An operating system framework for AI agents with memory, planning, and execution
- **💻 Claude Code**: Deep integration with Anthropic's Claude Code CLI

## ✨ Features

- 🎭 **Multi-Agent Orchestration**: Coordinate multiple AI agents with specialized roles
- 🔄 **Workflow Automation**: Define complex workflows with dependencies and conditions
- 🧠 **Agent Memory System**: Persistent memory across agent sessions
- 📋 **Task Planning**: Automatic task breakdown and execution planning
- 🏗️ **Autonomous App Building**: Build complete applications from descriptions
- 🎨 **Interactive Installer**: Easy setup with guided configuration
- 🔌 **Extensible Plugin System**: Add custom agents and workflows
- 📊 **Progress Tracking**: Real-time visibility into agent operations

## 🏗️ Architecture

```
master-workflow/
├── src/
│   ├── agent-os/          # Agent operating system core
│   │   ├── core/          # Agent runtime and lifecycle
│   │   ├── memory/        # Memory management system
│   │   ├── planning/      # Task planning engine
│   │   └── execution/     # Execution engine
│   ├── claude-flow/       # Workflow orchestration
│   │   ├── workflows/     # Workflow definitions
│   │   ├── orchestrator/  # Workflow execution engine
│   │   └── conditions/    # Conditional logic
│   ├── claude-code/       # Claude Code integration
│   │   ├── integration/   # CLI integration layer
│   │   └── commands/      # Custom commands
│   ├── builder/           # Autonomous app builder
│   │   ├── generators/    # Code generators
│   │   ├── templates/     # Project templates
│   │   └── analyzers/     # Code analyzers
│   ├── installer/         # Interactive installer
│   └── cli/              # Command-line interfaces
├── workflows/             # Workflow definitions (YAML)
├── agents/               # Agent definitions and configs
├── templates/            # Application templates
└── docs/                 # Documentation

```

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd master-workflow

# Run interactive installer
npm run install:interactive
```

### Your First Workflow

```bash
# Create a new app autonomously
npm run build:app -- --describe "A todo app with React and Node.js backend"

# Run a custom workflow
npm run flow -- --workflow workflows/examples/feature-development.yaml

# Start an agent session
npm run agent -- --type developer --task "Refactor the user authentication"
```

## 📚 Core Concepts

### Agent OS

The Agent OS provides a runtime environment for AI agents with:
- **Memory**: Short-term and long-term memory storage
- **Planning**: Automatic task decomposition and planning
- **Execution**: Tool use and code execution capabilities
- **Learning**: Context accumulation across sessions

### Claude Flow

Workflow orchestration that allows you to:
- Define multi-step workflows in YAML
- Set up agent pipelines with dependencies
- Add conditional logic and branching
- Parallel execution of independent tasks

### Autonomous Builder

The autonomous builder can:
- Generate complete applications from descriptions
- Choose appropriate tech stacks
- Create project structures
- Write code with best practices
- Set up testing and CI/CD

## 🎮 Usage Examples

### Example 1: Build a Full-Stack App

```bash
npm run build:app -- \
  --describe "A blog platform with user auth, posts, comments" \
  --stack "React, Node.js, PostgreSQL" \
  --features "auth,crud,api,admin-panel"
```

### Example 2: Run Development Workflow

```yaml
# workflows/feature-development.yaml
name: Feature Development
agents:
  - type: planner
    task: Break down feature into tasks
  - type: developer
    task: Implement the feature
  - type: tester
    task: Write and run tests
  - type: reviewer
    task: Review code quality
```

```bash
npm run flow -- --workflow workflows/feature-development.yaml
```

### Example 3: Custom Agent Session

```javascript
import { AgentOS } from './src/agent-os/core/agent-runtime.js';

const agent = new AgentOS({
  type: 'developer',
  memory: true,
  planning: true
});

await agent.execute({
  task: 'Add user authentication to the app',
  context: './src'
});
```

## 🔧 Configuration

Create a `.env` file:

```env
ANTHROPIC_API_KEY=your_api_key_here
AGENT_OS_MEMORY_PATH=./.agent-memory
CLAUDE_FLOW_WORKFLOWS_PATH=./workflows
BUILDER_TEMPLATES_PATH=./templates
```

## 🎯 Roadmap

- [x] Core architecture design
- [x] Agent OS foundation
- [x] Claude Flow orchestration
- [x] Interactive installer
- [x] Autonomous builder
- [ ] Web UI dashboard
- [ ] Agent marketplace
- [ ] Workflow templates library
- [ ] Cloud deployment support
- [ ] Multi-LLM support

## 🤝 Contributing

This is an experimental framework. Contributions, ideas, and feedback are welcome!

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ using Claude Code**
