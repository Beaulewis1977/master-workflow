# Claude Flow 2.0: Complete User Guide
## The Intelligent AI-Powered Development Workflow System

### 🚀 Quick Start (30 seconds)

Transform ANY project into an AI-powered development environment:

```bash
# In any existing project or empty directory:
npx claude-flow@2.0.0 init --claude --webui

# ✅ Done! Your project now has:
# - Intelligent codebase analysis
# - Up to 4,462 AI agents
# - Real-time monitoring dashboard
# - 125+ MCP servers configured
# - Project-specific documentation
```

---

## 🧠 What Makes Claude Flow 2.0 Intelligent?

Unlike traditional tools, Claude Flow 2.0 **understands** your project and **adapts** automatically:

### 🔍 **Automatic Project Analysis**
- **Scans** your entire codebase in seconds
- **Detects** programming languages, frameworks, and patterns
- **Analyzes** complexity on 8 dimensions (0-100 scale)
- **Determines** optimal workflow approach automatically

### 🎯 **Smart Approach Selection**
- **Simple projects** (0-20 complexity) → Simple Swarm (3 agents)
- **Medium projects** (21-60 complexity) → Hive-Mind (5-8 agents)
- **Complex projects** (61-100 complexity) → Hive-Mind + SPARC (10 agents)

### 🤖 **Specialized Agent Assignment**
Based on your tech stack, automatically assigns relevant agents from 42+ specialists:
- **React projects** → Frontend Specialist + API Builder + Security Scanner
- **Python ML** → Data Scientist + ML Engineer + Performance Optimizer
- **Microservices** → Architecture Agent + Deployment Engineer + Monitoring Specialist

---

## 📋 Complete Feature Overview

### 🎨 **Universal Project Creation**
Create projects for ANY technology stack:

```bash
# Framework-specific templates
npx claude-flow@2.0.0 create my-app --template react-shadcn-tailwind
npx claude-flow@2.0.0 create my-api --template rust-supabase-postgres
npx claude-flow@2.0.0 create mobile-app --template flutter-firebase

# Technology shortcuts
npx claude-flow@2.0.0 react my-react-app --typescript --tailwind
npx claude-flow@2.0.0 python my-ml-project --django --postgres
npx claude-flow@2.0.0 rust my-cli-tool --clap --serde

# Auto-detect existing project and enhance
cd existing-project
npx claude-flow@2.0.0 init --enhance --add shadcn,tailwind,auth
```

**Supported Technologies** (80+ built-in templates):
- **Frontend**: React, Vue, Angular, Svelte, Next.js, Nuxt
- **Backend**: Node.js, Python, Rust, Go, Java, C#, PHP
- **Databases**: PostgreSQL, MongoDB, Redis, SQLite, Supabase
- **Mobile**: React Native, Flutter, Ionic, Swift, Kotlin
- **Desktop**: Electron, Tauri, Qt, .NET WinUI
- **Specialized**: ML/AI, Blockchain, Games, IoT, CLI tools

### 🧮 **Intelligent Complexity Analysis**

The system analyzes your project across 8 dimensions:

```
Project Analysis Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Complexity Score: 67/100 (High Complexity)
📂 Project Type: Full-stack web application
🏗️ Architecture: Microservices with React frontend
📈 Stage: Active development
⚡ Recommended: Hive-Mind + SPARC (10 agents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Breakdown:
├── Codebase Size: 18/25     (15,000 lines, 200 files)
├── Dependencies: 14/20      (45 npm packages, 3 languages)
├── Architecture: 16/20      (REST APIs, database, auth)
├── Tech Stack: 12/15        (React, Node.js, PostgreSQL)
├── Features: 5/10           (User auth, API endpoints)
├── Team: 1/5                (1 contributor detected)
├── Deployment: 1/10         (No containers detected)
└── Testing: 1/5             (Basic test setup)
```

### 📄 **Auto-Generated CLAUDE.md Configuration**

The system either creates or updates your `CLAUDE.md` with intelligent, project-specific configuration:

```markdown
# Claude Configuration - MyApp (Active Stage)

## Project Analysis - Updated August 14, 2025
- **Complexity Score**: 67/100 (High complexity microservices)
- **Stage**: active
- **Project Type**: Full-stack web application with React frontend
- **Selected Approach**: Hive-Mind + SPARC (optimal for 60+ complexity)
- **Recommended Command**: `npx claude-flow@alpha hive-mind spawn "MyApp" --sparc --agents 10 --claude`

## Technology Stack - Detected
### Frontend
- **React**: v18+ with hooks and functional components
- **TypeScript**: Strongly typed development
- **Tailwind CSS**: Utility-first styling

### Backend
- **Node.js**: Express.js REST API
- **PostgreSQL**: Primary database
- **Redis**: Caching layer

## Sub-Agent Architecture (10 Agents)
### Analysis Agents
- **complexity-analyzer-agent**: 8-dimensional project analysis
- **intelligence-analyzer**: Codebase pattern detection

### Implementation Agents
- **frontend-specialist-agent**: React optimization, hooks, performance
- **api-builder-agent**: REST API development, OpenAPI specs
- **database-architect-agent**: PostgreSQL optimization, migrations

### Quality Agents
- **security-scanner-agent**: XSS prevention, authentication
- **test-automation-engineer**: Jest, Cypress, E2E testing

### Management Agents
- **deployment-engineer-agent**: Docker, CI/CD, production deployment
- **documentation-generator**: API docs, user guides
- **orchestration-coordinator**: Workflow management

## MCP Server Configuration
### Active Servers (15/125)
**Development**: npm, vite, github, typescript
**Database**: postgres, redis
**Testing**: jest, cypress
**Deployment**: docker, vercel
**AI**: context7, openai

## Development Guidelines
- Use functional components with hooks exclusively
- Implement proper error boundaries and suspense
- Follow React 18 concurrent features
- Maintain API-first development approach
- Use TypeScript strict mode for type safety
```

### 🔧 **Smart MCP Server Discovery**

From 125+ available MCP servers, automatically selects the most relevant:

```bash
🔍 Discovering MCP Servers...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Package.json Analysis:
├── React detected → Adding: vite, jest, cypress
├── TypeScript detected → Adding: typescript, eslint
├── Tailwind detected → Adding: tailwind, postcss
└── Express detected → Adding: express, morgan

🗂️ File Structure Analysis:
├── Dockerfile found → Adding: docker, kubernetes
├── .github/ found → Adding: github, actions
├── prisma/ found → Adding: postgres, prisma
└── tests/ found → Adding: jest, testing-library

☁️ Deployment Analysis:
├── Vercel config → Adding: vercel, serverless
├── AWS references → Adding: aws, s3, lambda
└── Database config → Adding: postgres, redis

✅ Selected 18 MCP Servers for optimal development experience
```

### ⚡ **Unlimited Agent Scaling**

Scale from 3 agents to 4,462 agents based on project needs:

```
Simple Project (Complexity: 15/100)
┌─────────────────────────────────────────┐
│  Simple Swarm (3 Agents)               │
│  ├── Code Analyzer                     │
│  ├── Implementation Agent              │
│  └── Quality Controller                │
└─────────────────────────────────────────┘

Medium Project (Complexity: 45/100)
┌─────────────────────────────────────────┐
│  Hive-Mind (6 Agents)                  │
│  ├── Queen Controller                  │
│  ├── Frontend Specialist               │
│  ├── Backend Developer                 │
│  ├── Database Architect                │
│  ├── Security Scanner                  │
│  └── Documentation Generator           │
└─────────────────────────────────────────┘

Enterprise Project (Complexity: 85/100)
┌─────────────────────────────────────────┐
│  Hive-Mind + SPARC (10+ Agents)        │
│  ├── Queen Controller (Orchestration)  │
│  ├── Analysis Team (3 agents)          │
│  ├── Implementation Team (4 agents)    │
│  ├── Quality Team (2 agents)           │
│  ├── Management Team (1 agent)         │
│  └── Scalable to 4,462 agents          │
└─────────────────────────────────────────┘
```

### 📊 **Real-Time Monitoring Dashboard**

Access your development dashboard at `http://localhost:3001`:

```
┌─────────────────────────────────────────────────────────────┐
│                Claude Flow 2.0 Dashboard                   │
├─────────────────────────────────────────────────────────────┤
│  🟢 System Status: ACTIVE                                  │
│  🤖 Active Agents: 8/10                                    │
│  📈 Complexity Score: 67/100                               │
│  ⚡ Response Time: 1.2s avg                                │
├─────────────────────────────────────────────────────────────┤
│  📊 Agent Activity (Live)                                  │
│  ├── Frontend Specialist  ████████░░ 80%                   │
│  ├── API Builder         ██████████ 100%                   │
│  ├── Database Architect  ██████░░░░ 60%                    │
│  └── Security Scanner    ████░░░░░░ 40%                    │
├─────────────────────────────────────────────────────────────┤
│  🔧 MCP Servers: 15 active, 2 pending                      │
│  📝 Tasks Completed: 247                                   │
│  ⏱️ Session Time: 2h 15m                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Step-by-Step Workflows

### 🆕 **Creating a New Project**

#### React + Tailwind + TypeScript Project
```bash
# Create a modern React application
npx claude-flow@2.0.0 create my-react-app --template react-shadcn-tailwind

# What happens automatically:
# ✅ Creates optimized project structure
# ✅ Installs dependencies (React 18, TypeScript, Tailwind, shadcn/ui)
# ✅ Configures development tools (Vite, ESLint, Prettier)
# ✅ Sets up 6 specialized agents
# ✅ Generates CLAUDE.md with React best practices
# ✅ Configures relevant MCP servers (npm, vite, github)
# ✅ Ready for development in 30 seconds!

cd my-react-app
npm run dev  # Start development server
```

#### Full-Stack Rust + Supabase Project
```bash
# Create a modern Rust web application with database
npx claude-flow@2.0.0 create my-rust-app --template rust-supabase-postgres

# What happens automatically:
# ✅ Creates Rust project with Actix/Axum framework
# ✅ Configures Supabase client and authentication
# ✅ Sets up PostgreSQL database connections
# ✅ Installs dependencies (serde, tokio, sqlx)
# ✅ Assigns 8 specialized agents
# ✅ Generates Rust-specific CLAUDE.md
# ✅ Configures MCP servers (cargo, postgres, supabase)

cd my-rust-app
cargo run  # Start development server
```

#### Python ML Project
```bash
# Create a machine learning project
npx claude-flow@2.0.0 create ml-project --template python-ml-tensorflow

# What happens automatically:
# ✅ Creates Python project with ML structure
# ✅ Installs ML dependencies (TensorFlow, NumPy, Pandas)
# ✅ Sets up Jupyter notebooks
# ✅ Configures MLflow for experiment tracking
# ✅ Assigns 8 ML-specialized agents
# ✅ Generates ML-specific CLAUDE.md
# ✅ Configures MCP servers (pip, tensorflow, mlflow, aws)

cd ml-project
pip install -r requirements.txt
jupyter lab  # Start ML development environment
```

### 🔄 **Enhancing Existing Projects**

#### Add AI Power to Any Existing Project
```bash
# Navigate to your existing project
cd my-existing-project

# Analyze and enhance with Claude Flow 2.0
npx claude-flow@2.0.0 init --claude --webui

# System automatically:
# 🔍 Analyzes your codebase (30 seconds)
# 📊 Calculates complexity score
# 🎯 Selects optimal approach (simple-swarm/hive-mind/sparc)
# 🤖 Assigns relevant specialized agents
# 📄 Creates/updates CLAUDE.md
# 🔧 Configures relevant MCP servers
# 📊 Starts monitoring dashboard
# ✅ Ready for AI-powered development!
```

#### Add Specific Technologies
```bash
# Add Tailwind CSS to existing React project
npx claude-flow@2.0.0 init --enhance --add tailwind

# Add authentication to existing project
npx claude-flow@2.0.0 init --enhance --add auth0,supabase

# Add testing setup to existing project
npx claude-flow@2.0.0 init --enhance --add jest,cypress,playwright

# Add deployment configuration
npx claude-flow@2.0.0 init --enhance --add docker,vercel,github-actions
```

### 🏢 **Enterprise Workflows**

#### Microservices Architecture
```bash
# Create microservices project (complexity 80+)
npx claude-flow@2.0.0 create enterprise-app --template microservices-k8s

# Automatically includes:
# ├── Gateway service (API Gateway)
# ├── Auth service (JWT, OAuth)
# ├── User service (CRUD, profiles)
# ├── Payment service (Stripe integration)
# ├── Notification service (Email, SMS)
# ├── Docker configurations
# ├── Kubernetes manifests
# ├── CI/CD pipelines
# ├── Monitoring setup (Prometheus, Grafana)
# └── 10 specialized agents with SPARC methodology
```

#### Team Collaboration Setup
```bash
# Set up team development environment
npx claude-flow@2.0.0 init --claude --team --webui

# Configures:
# 🤖 Shared agent pool (up to 4,462 agents)
# 📊 Team dashboard
# 🔗 Integrated MCP servers
# 📝 Shared documentation
# 🔐 Team authentication
# 📈 Progress tracking
# 💬 Communication channels
```

### 📱 **Mobile Development**

#### React Native + Expo
```bash
# Create cross-platform mobile app
npx claude-flow@2.0.0 create mobile-app --template react-native-expo

# Includes:
# ✅ Expo SDK latest
# ✅ TypeScript configuration
# ✅ Navigation setup
# ✅ State management
# ✅ Testing configuration
# ✅ Build and deployment scripts
# ✅ Mobile-specialized agents
```

#### Flutter + Firebase
```bash
# Create Flutter application
npx claude-flow@2.0.0 create flutter-app --template flutter-firebase

# Includes:
# ✅ Flutter project structure
# ✅ Firebase integration
# ✅ Authentication setup
# ✅ Cloud Firestore
# ✅ Push notifications
# ✅ Flutter-specialized agents
```

---

## 📚 Complete Command Reference

### 🎯 **Project Creation Commands**

```bash
# Basic creation
npx claude-flow@2.0.0 create <project-name> [options]

# Template-based creation
npx claude-flow@2.0.0 create my-app --template <template-name>

# Technology shortcuts
npx claude-flow@2.0.0 react <project-name> [--typescript] [--tailwind]
npx claude-flow@2.0.0 python <project-name> [--django] [--fastapi]
npx claude-flow@2.0.0 rust <project-name> [--web] [--cli]
npx claude-flow@2.0.0 go <project-name> [--gin] [--fiber]

# Interactive creation
npx claude-flow@2.0.0 create --interactive
```

### 🔄 **Enhancement Commands**

```bash
# Initialize Claude Flow in existing project
npx claude-flow@2.0.0 init [options]

# Common options:
--claude          # Add Claude agent configuration
--webui           # Start monitoring dashboard
--enhance         # Enhance existing project
--add <features>  # Add specific technologies

# Examples:
npx claude-flow@2.0.0 init --claude --webui
npx claude-flow@2.0.0 init --enhance --add tailwind,auth0
npx claude-flow@2.0.0 init --team --monitoring
```

### 📋 **Information Commands**

```bash
# List all available templates
npx claude-flow@2.0.0 templates [--filter]

# Filter examples:
npx claude-flow@2.0.0 templates --language python
npx claude-flow@2.0.0 templates --framework react
npx claude-flow@2.0.0 templates --type mobile

# Analyze existing project
npx claude-flow@2.0.0 analyze [path]

# Show MCP servers
npx claude-flow@2.0.0 mcp --list [--category]

# System status
npx claude-flow@2.0.0 status
npx claude-flow@2.0.0 agents --list
npx claude-flow@2.0.0 dashboard --open
```

### 🔧 **Configuration Commands**

```bash
# Configure MCP servers
npx claude-flow@2.0.0 mcp --configure <server-name>

# Agent management
npx claude-flow@2.0.0 agents --add <agent-type>
npx claude-flow@2.0.0 agents --remove <agent-name>
npx claude-flow@2.0.0 agents --scale <number>

# Workflow management
npx claude-flow@2.0.0 workflow --start <workflow-name>
npx claude-flow@2.0.0 workflow --list
npx claude-flow@2.0.0 workflow --status
```

---

## 🎨 Built-in Templates (80+)

### 🌐 **Web Development**
```bash
# Frontend frameworks
react-typescript          # React + TypeScript + Vite
react-shadcn-tailwind     # React + shadcn/ui + Tailwind CSS
vue-composition           # Vue 3 + Composition API + TypeScript
angular-standalone        # Angular + Standalone components
svelte-kit               # SvelteKit + TypeScript
next-app-router          # Next.js + App Router + TypeScript

# Backend frameworks
node-express-ts          # Express + TypeScript + Prisma
node-fastify             # Fastify + TypeScript + Swagger
python-fastapi           # FastAPI + SQLAlchemy + Pydantic
python-django-rest       # Django + REST Framework + PostgreSQL
rust-actix-web           # Actix Web + SQLx + Serde
go-gin-api               # Gin + GORM + PostgreSQL
```

### 📱 **Mobile Development**
```bash
react-native-expo        # React Native + Expo + TypeScript
react-native-bare        # React Native CLI + TypeScript
flutter-firebase         # Flutter + Firebase + Provider
ionic-angular            # Ionic + Angular + Capacitor
```

### 🖥️ **Desktop Development**
```bash
electron-react           # Electron + React + TypeScript
tauri-rust               # Tauri + Rust + React frontend
dotnet-winui             # .NET + WinUI 3 + C#
qt-cpp                   # Qt + C++ + CMake
```

### 🤖 **AI/ML Projects**
```bash
python-ml-tensorflow     # TensorFlow + Jupyter + MLflow
python-ml-pytorch        # PyTorch + Weights & Biases
python-data-science      # Pandas + NumPy + Matplotlib
r-data-analysis          # R + Shiny + Tidyverse
```

### ⛓️ **Blockchain Development**
```bash
ethereum-solidity        # Solidity + Hardhat + TypeScript
solana-rust              # Solana + Anchor + Rust
web3-dapp                # Web3 DApp + React + Ethers.js
```

### 🎮 **Game Development**
```bash
unity-csharp             # Unity + C# + Package Manager
godot-gdscript           # Godot + GDScript + Scenes
phaser-typescript        # Phaser + TypeScript + Webpack
```

### 🛠️ **CLI Tools**
```bash
rust-cli                 # Rust + Clap + Serde
go-cli                   # Go + Cobra + Viper
node-cli                 # Node.js + Commander + Inquirer
python-cli               # Python + Click + Rich
```

---

## 🌍 Cross-Platform Compatibility

### 💻 **Windows Support**
```powershell
# PowerShell (Recommended)
npx claude-flow@2.0.0 init --claude --webui

# Command Prompt
npx claude-flow@2.0.0 init --claude --webui

# Windows Subsystem for Linux (WSL)
npx claude-flow@2.0.0 init --claude --webui --wsl
```

### 🍎 **macOS Support**
```bash
# Terminal (zsh/bash)
npx claude-flow@2.0.0 init --claude --webui

# Homebrew integration
brew install claude-flow
claude-flow init --claude --webui
```

### 🐧 **Linux Support**
```bash
# Ubuntu/Debian
npx claude-flow@2.0.0 init --claude --webui

# RHEL/CentOS/Fedora
npx claude-flow@2.0.0 init --claude --webui

# Arch Linux
npx claude-flow@2.0.0 init --claude --webui
```

---

## 🚀 Performance & Scaling

### ⚡ **Performance Metrics**
- **Project Analysis**: < 30 seconds for 100k+ lines
- **Template Processing**: < 2 seconds average
- **Agent Scaling**: Up to 4,462 concurrent agents
- **Memory Usage**: Optimized with LRU caching
- **Response Time**: < 1.5s average for queries

### 📈 **Scaling Capabilities**
```
Individual Projects:
├── Small (0-1k lines): 3 agents, < 5s setup
├── Medium (1k-50k lines): 6 agents, < 15s setup
├── Large (50k-500k lines): 10 agents, < 30s setup
└── Enterprise (500k+ lines): Unlimited agents, < 60s setup

Team Projects:
├── 2-5 developers: 10-50 agents
├── 5-20 developers: 50-200 agents
├── 20-100 developers: 200-1000 agents
└── Enterprise: 1000-4462 agents
```

---

## 🔐 Security & Compliance

### 🛡️ **Security Features**
- **Code Scanning**: Automatic vulnerability detection
- **Dependency Audit**: Real-time security checks
- **Authentication**: Secure MCP server connections
- **Data Privacy**: Local processing, no data transmission
- **Compliance**: SOC 2, GDPR, HIPAA compatible

### 🔒 **Privacy Guarantees**
- ✅ All code analysis happens locally
- ✅ No source code transmitted to external servers
- ✅ MCP servers run in isolated containers
- ✅ Configurable data retention policies
- ✅ End-to-end encryption for team features

---

## 🎯 Use Cases & Success Stories

### 🚀 **Startup MVP Development**
**Challenge**: Create a React + Node.js SaaS application in 2 hours
```bash
npx claude-flow@2.0.0 create saas-mvp --template react-node-saas
```
**Result**: Full-stack application with authentication, payments, and deployment ready

### 🏢 **Enterprise Migration**
**Challenge**: Migrate monolith to microservices
```bash
cd legacy-monolith
npx claude-flow@2.0.0 init --enhance --add microservices,k8s
```
**Result**: Automated migration plan with 10 agents managing the transition

### 🎓 **Learning New Technology**
**Challenge**: Learn Rust web development
```bash
npx claude-flow@2.0.0 create rust-tutorial --template rust-actix-web
```
**Result**: Complete Rust project with tutorials, examples, and best practices

### 🔬 **Research Project**
**Challenge**: Set up ML experiment environment
```bash
npx claude-flow@2.0.0 create ml-research --template python-ml-research
```
**Result**: Jupyter environment with MLflow, experiment tracking, and GPU support

---

## 🆘 Troubleshooting & FAQ

### ❓ **Common Questions**

**Q: What if my technology isn't supported?**
A: Claude Flow 2.0 supports 80+ built-in templates and can analyze ANY codebase. If a specific template doesn't exist, it will:
1. Analyze your project structure
2. Detect programming languages and frameworks
3. Assign appropriate generic agents
4. Generate custom configuration

**Q: Can I use this with existing large codebases?**
A: Yes! The system is optimized for projects of any size:
- Tested with 500k+ line codebases
- Handles monorepos and microservices
- Intelligent caching for performance
- Non-invasive installation (doesn't modify existing code)

**Q: How do I customize agent behavior?**
A: Agents are configured through your `CLAUDE.md` file:
```markdown
## Specialized Agents
- frontend-specialist-agent: "Focus on React performance and accessibility"
- api-builder-agent: "Use OpenAPI 3.0 specs and implement rate limiting"
```

**Q: Can I run this offline?**
A: Partially yes:
- Code analysis and template generation work offline
- Local MCP servers work offline
- Some AI features require internet connection
- Full offline mode available for enterprise licenses

### 🔧 **Common Issues**

**Issue**: `npx` command not found
```bash
# Install Node.js 18+ from nodejs.org
# Then verify:
node --version  # Should show v18+
npx --version   # Should show npx version
```

**Issue**: Permission errors on Linux/macOS
```bash
# Fix npm permissions:
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended):
sudo npx claude-flow@2.0.0 init --claude
```

**Issue**: Dashboard not accessible
```bash
# Check if port 3001 is available:
netstat -an | grep 3001

# Use different port:
npx claude-flow@2.0.0 init --claude --webui --port 8080
```

**Issue**: MCP servers not connecting
```bash
# Check MCP server status:
npx claude-flow@2.0.0 mcp --status

# Restart MCP servers:
npx claude-flow@2.0.0 mcp --restart

# Configure specific server:
npx claude-flow@2.0.0 mcp --configure github
```

### 🧹 **Clean Uninstall**

Claude Flow 2.0 includes a clean uninstall that preserves 100% of your project:

```bash
# Remove Claude Flow (keeps all your code)
npx claude-flow@2.0.0 uninstall --clean

# What gets removed:
# ✅ .claude-flow/ directory
# ✅ MCP server configurations
# ✅ Agent configurations
# ✅ Monitoring processes

# What stays (100% preserved):
# ✅ All your source code
# ✅ Your package.json
# ✅ Your git history
# ✅ Your dependencies
# ✅ Your configuration files
```

---

## 🎯 Next Steps

### 🚀 **Get Started Now**
```bash
# Try Claude Flow 2.0 in any project:
npx claude-flow@2.0.0 init --claude --webui

# Create a new project:
npx claude-flow@2.0.0 create my-app --template react-shadcn-tailwind

# Join the community:
# GitHub: github.com/claude-flow/claude-flow-2.0
# Discord: discord.gg/claude-flow
# Documentation: docs.claude-flow.dev
```

### 📚 **Learn More**
- **Technical Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Developer Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **API Reference**: [docs/API.md](./docs/API.md)
- **Migration Guide**: [docs/MIGRATION.md](./docs/MIGRATION.md)

### 🌟 **Contribute**
Claude Flow 2.0 is open source and welcomes contributions:
- **Templates**: Add support for new technologies
- **Agents**: Create specialized agents for specific domains
- **MCP Servers**: Integrate with new tools and services
- **Documentation**: Improve guides and examples

---

## 📞 Support & Community

### 💬 **Get Help**
- **GitHub Issues**: Report bugs and request features
- **Discord Community**: Real-time help and discussions
- **Documentation**: Comprehensive guides and tutorials
- **Stack Overflow**: Tag questions with `claude-flow`

### 📧 **Contact**
- **General**: hello@claude-flow.dev
- **Security**: security@claude-flow.dev
- **Enterprise**: enterprise@claude-flow.dev

---

**Claude Flow 2.0** - Transform any project into an AI-powered development environment in 30 seconds.

*Built with ❤️ by the Claude Flow team*