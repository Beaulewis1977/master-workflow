---
description: Intelligently bootstrap new or existing projects with complete documentation
argument-hint: "[--analyze] [--interactive] [--minimal]"
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Task, TodoWrite
---

# Smart Project Bootstrap

Ultra-intelligent project bootstrapping that works with minimal input or analyzes existing projects.

## For New Projects

Start with just a description or architecture document:

```bash
# Option 1: Just a description
echo "E-commerce platform with React and Node.js" > architecture.md
/bootstrap

# Option 2: Interactive mode
/bootstrap --interactive

# Option 3: Minimal automated
/bootstrap --minimal
```

**What Gets Generated**:
- ✅ Complete README.md
- ✅ Full documentation suite (ARCHITECTURE.md, DEVELOPMENT.md, API.md, etc.)
- ✅ Architecture diagrams (Mermaid format)
- ✅ Build phases with task breakdown
- ✅ Project directory structure
- ✅ Tech stack recommendations
- ✅ Repository wiki
- ✅ Contributing guidelines
- ✅ Deployment documentation

## For Existing Projects

Analyze and enhance existing codebases:

```bash
# Analyze existing project
/bootstrap --analyze

# Interactive analysis with questions
/bootstrap --analyze --interactive
```

**What Gets Analyzed**:
- 🔍 Entire codebase structure
- 🔍 Existing documentation
- 🔍 Tech stack detection (automatic)
- 🔍 Build phase detection (6 phases)
- 🔍 Feature extraction
- 🔍 Architecture pattern recognition

**What Gets Generated**:
- ✅ Missing documentation
- ✅ Repository wiki
- ✅ Architecture diagrams
- ✅ Build phase roadmap
- ✅ Continuation strategy (picks up where you left off!)

## How It Works

### For New Projects:

1. **Read Minimal Input**
   - Reads any existing docs (architecture.md, description.txt, etc.)
   - Extracts key information (project goals, tech preferences)

2. **Interactive Questions** (if enabled)
   - Project name?
   - Tech stack preferences?
   - Architecture pattern?
   - Key features?

3. **Generate Everything**
   - Complete documentation suite
   - Mermaid architecture diagrams
   - Build phases (Phase 1-5)
   - Project structure (`src/`, `tests/`, `docs/`, etc.)
   - Repository wiki

4. **Ready to Build**
   - All documentation in place
   - Clear build roadmap
   - Ready for autonomous development

### For Existing Projects:

1. **Deep Codebase Analysis**
   - Scans all source files
   - Reads existing documentation
   - Analyzes directory structure
   - Checks for tests, CI/CD, deployment configs

2. **Tech Stack Detection**
   - Automatic language detection
   - Framework identification (React, Express, Django, etc.)
   - Database detection (PostgreSQL, MongoDB, Redis, etc.)
   - Tool detection (Docker, Kubernetes, etc.)

3. **Build Phase Detection**
   - `planning` - No code yet (0 files)
   - `early-development` - Starting out (< 10 files)
   - `development` - Active coding (no tests yet)
   - `testing` - Has tests, needs CI
   - `pre-release` - Has CI, needs docs
   - `maintenance` - Complete project

4. **Fill Gaps**
   - Generate missing documentation
   - Create repository wiki
   - Add architecture diagrams
   - Define next steps based on phase

## Interactive Mode

With `--interactive`, you'll be asked:

**For New Projects**:
- Project name
- Brief description
- Tech stack (multi-select)
- Architecture pattern
- Key features (comma-separated)

**For Existing Projects**:
- Confirm detected project name
- Confirm detected tech stack
- Generate missing docs? (Y/n)
- Create wiki? (Y/n)
- Additional features to document?

## Output Examples

### New Project Output:
```
📝 BOOTSTRAPPING NEW PROJECT...

📄 Step 1: Reading input documentation...
   Read 1 docs

💬 Step 2: Interactive questions...
   Project name: awesome-app
   Tech stack: React, Node.js, PostgreSQL
   Architecture: Microservices

📝 Step 3: Generating complete documentation...
   Generated 8 docs

🎨 Step 4: Creating architecture diagrams...
   ✓ Diagrams created

📊 Step 5: Creating build phases...
   ✓ Build phases defined

🏗️  Step 6: Creating project structure...
   ✓ Structure created

📚 Step 7: Creating repo wiki...
   ✓ Repo wiki created

✅ NEW PROJECT BOOTSTRAP COMPLETE!

Next steps:
- Review generated documentation
- Start implementing core features
- Setup development environment
```

### Existing Project Output:
```
🔍 ANALYZING EXISTING PROJECT...

📄 Step 1: Reading existing documentation...
   Found 3 existing docs

🏗️  Step 2: Analyzing codebase...
   Found 47 source files

🔧 Step 3: Detecting tech stack...
   Tech Stack: JavaScript, React, Express, PostgreSQL

📊 Step 4: Determining build phase...
   Build Phase: development

💬 Step 5: Clarifying questions...
   [Interactive Q&A if enabled]

📝 Step 6: Generating missing documentation...
   Generated 5 new docs

📚 Step 7: Creating repo wiki...
   ✓ Repo wiki created

✅ EXISTING PROJECT BOOTSTRAP COMPLETE!

Next steps:
- Continue feature development
- Add comprehensive tests
- Update documentation
```

## Generated File Structure

```
project/
├── README.md                    # Complete project overview
├── BUILD-PHASES.md             # 5-phase build roadmap
├── docs/
│   ├── ARCHITECTURE.md         # System architecture
│   ├── DEVELOPMENT.md          # Dev guidelines
│   ├── API.md                  # API reference
│   ├── DEPLOYMENT.md           # Deployment guide
│   ├── CONTRIBUTING.md         # Contribution guide
│   └── diagrams/
│       ├── architecture.mmd    # Architecture diagram
│       ├── data-flow.mmd       # Data flow diagram
│       └── deployment.mmd      # Deployment diagram
├── wiki/
│   ├── Home.md                 # Wiki homepage
│   ├── Getting-Started.md      # Quick start
│   ├── Architecture.md         # Architecture
│   ├── Development-Guide.md    # Dev guide
│   └── API-Reference.md        # API docs
├── src/                        # Source code (structure created)
├── tests/                      # Test directory (structure created)
└── .agent-os/                  # Agent OS specs (if applicable)
    ├── specs/
    ├── tasks/
    └── plans/
```

## Smart Features

**Tech Stack Auto-Detection**:
- Checks package.json, requirements.txt, go.mod, Cargo.toml
- Analyzes import statements
- Detects frameworks from dependencies
- Identifies databases from configs

**Build Phase Intelligence**:
- Counts source files for size estimation
- Checks for test files
- Looks for CI/CD configs (.github/workflows, .gitlab-ci.yml)
- Analyzes documentation completeness
- Determines exact phase in lifecycle

**Documentation Quality**:
- Real project data (not templates)
- Actual tech stack
- Discovered features
- Detected architecture
- Build phase-specific guidance

## When to Use

**Use `/bootstrap` for**:
- ✅ Brand new projects (just an idea)
- ✅ Existing projects missing docs
- ✅ Projects you inherited
- ✅ Open source project setup
- ✅ Before sharing with team
- ✅ Before autonomous building

**Use `/bootstrap --analyze` for**:
- ✅ Understanding existing codebases
- ✅ Determining build phase
- ✅ Generating missing docs
- ✅ Creating repo wiki
- ✅ Picking up abandoned projects

## Integration with Autonomous Building

After bootstrap completes, you can:
```bash
# Start autonomous building with Master Workflow 3.0
npm start build -- --autonomous

# The system will:
# ✓ Use generated documentation as context
# ✓ Follow build phases
# ✓ Build continuously with context compaction
# ✓ Never stop (handles own context window)
```

## Advanced Options

```bash
# Minimal bootstrap (no questions, fast)
/bootstrap --minimal

# Full interactive experience
/bootstrap --interactive

# Analyze without generation (dry run)
/bootstrap --analyze --dry-run

# Generate specific components only
/bootstrap --wiki-only
/bootstrap --diagrams-only
/bootstrap --phases-only
```

This uses the ProjectBootstrapAgent which combines:
- Code archaeology for deep analysis
- Quantum memory for pattern recognition
- Neural swarm for intelligent decisions
- Context compactor for autonomous operation

**Result**: The smartest project bootstrapper ever built!
