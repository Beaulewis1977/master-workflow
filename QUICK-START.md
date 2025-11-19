# 🎯 QUICK START GUIDE - Master Workflow 3.0

**The Ultimate AI Development Platform - Ready in 5 Minutes**

---

## 🚀 Installation (Choose One)

### Option 1: New Project (From Scratch)
```bash
# Create project directory
mkdir my-awesome-app && cd my-awesome-app

# Create minimal description
echo "# E-commerce Platform
Built with React frontend, Node.js backend, and PostgreSQL database.
Features: User authentication, product catalog, shopping cart, checkout.
" > architecture.md

# Install Master Workflow
git clone <this-repo> .master-workflow
cd .master-workflow
npm install

# Run enhanced installer
node src/installer/enhanced-installer.js

# That's it! Complete documentation generated, wiki created, ready to build!
```

### Option 2: Existing Project (Enhance Current Project)
```bash
# Navigate to your project
cd ~/my-existing-project

# Install Master Workflow
git clone <this-repo> .master-workflow
cd .master-workflow
npm install

# Run enhanced installer (auto-detects existing project)
node src/installer/enhanced-installer.js

# Analyzes codebase, fills documentation gaps, creates wiki, detects build phase!
```

### Option 3: Just Use Slash Commands
```bash
# In any Claude Code session with this repo:
/bootstrap              # Smart project setup
/wiki                   # Generate repo wiki
/analyze                # Analyze complexity
/quick "your task"      # Quick execution
```

---

## ⚡ Immediate Usage

### 1. Generate Wiki (Takes 30 seconds)
```bash
# Basic wiki (5 comprehensive pages)
/wiki

# With architecture diagrams
/wiki --diagrams

# Complete wiki with everything
/wiki --full

# Result: wiki/ directory with:
# - Home.md
# - Getting-Started.md
# - Architecture.md
# - Development-Guide.md
# - API-Reference.md
```

### 2. Bootstrap Project (Takes 1-2 minutes)
```bash
# Interactive mode (asks questions)
/bootstrap

# Analyze existing project
/bootstrap --analyze

# Quick automated setup
/bootstrap --minimal

# Result:
# - Complete README.md
# - Full documentation suite (8+ docs)
# - Mermaid architecture diagrams
# - Build phases (Phase 1-5)
# - Project structure
# - Repository wiki
```

### 3. Start Autonomous Building (Continuous)
```javascript
import { MasterWorkflow3 } from './.master-workflow/src/index.js';

// Initialize (5 seconds)
const system = new MasterWorkflow3();
await system.initialize();

// Execute task with FULL intelligence
const result = await system.execute({
  type: 'build_feature',
  description: 'Add user authentication with JWT tokens',
  context: {
    techStack: ['Node.js', 'Express', 'PostgreSQL'],
    requirements: ['Secure', 'RESTful', 'Token refresh']
  }
});

// System automatically:
// ✓ Searches AgentDB for similar implementations (96x faster)
// ✓ Recalls quantum memory from past projects
// ✓ Activates relevant skills (auth, security, API design)
// ✓ Neural swarm collective planning
// ✓ Queen spawns optimal agent
// ✓ Builds continuously with context compaction
// ✓ Never stops (manages own context window)
```

### 4. Skills Activation (Natural Language)
```javascript
// Just talk naturally - skills activate automatically!

await system.execute({
  description: "Let's pair program on the authentication feature"
});
// ✓ Activates: Pair Programming skill

await system.execute({
  description: "Review this PR for security vulnerabilities"
});
// ✓ Activates: PR Review + Security Scanning skills

await system.execute({
  description: "Find similar implementations in our codebase"
});
// ✓ Activates: AgentDB Semantic Search skill (96x faster!)

await system.execute({
  description: "Why did the deployment fail?"
});
// ✓ Activates: Causal Reasoning skill

await system.execute({
  description: "Deploy to production with zero downtime"
});
// ✓ Activates: Deployment Orchestration skill (blue-green strategy)
```

---

## 🎯 Common Workflows

### Workflow 1: Start Brand New Project
```bash
# 1. Create directory with minimal description
mkdir new-app && cd new-app
echo "Social media platform with React and GraphQL" > description.txt

# 2. Bootstrap
/bootstrap

# 3. Review generated docs
ls -la docs/        # ARCHITECTURE.md, API.md, DEPLOYMENT.md, etc.
ls -la wiki/        # Complete wiki with 5 pages

# 4. Start building
npm run workflow:start

# System builds continuously, compacts context automatically, never stops!
```

### Workflow 2: Enhance Existing Project
```bash
# 1. Navigate to project
cd ~/my-old-project

# 2. Bootstrap with analysis
/bootstrap --analyze

# Result shows:
# - Detected build phase: "development"
# - Found 47 source files
# - Tech stack: JavaScript, React, Express, PostgreSQL
# - Generated 5 missing docs
# - Created comprehensive wiki

# 3. Continue development
npm run workflow:start

# System picks up EXACTLY where you left off!
```

### Workflow 3: Generate Documentation On-Demand
```bash
# Need a wiki fast?
/wiki

# 30 seconds later: wiki/ directory with 5 comprehensive pages
# Compatible with GitHub wiki - just copy files!

# Update existing wiki
/wiki --update

# Add architecture diagrams
/wiki --diagrams
```

### Workflow 4: Use Natural Language Skills
```javascript
const system = new MasterWorkflow3();
await system.initialize();

// All of these activate skills automatically:

// "Let's do SPARC methodology for this feature"
// → Activates: SPARC Methodology skill
// → Creates: Specification, Pseudocode, Architecture, Refinement, Completion

// "Search for how we handled authentication before"
// → Activates: AgentDB Semantic Search (96x faster)
// → Returns: Past implementations with confidence scores

// "Learn from this failed deployment"
// → Activates: Reflexion Learning skill
// → Stores: Trajectory, extracts patterns, updates RL model

// "Coordinate 5 agents to work on this in parallel"
// → Activates: Multi-Agent Orchestration skill
// → Distributes: Work across agents intelligently
```

---

## 📊 Intelligence Systems Explained

### 1. AgentDB v1.3.9 (96x-164x Faster)
```javascript
// Semantic search in milliseconds
const results = await system.queen.agentDB.semanticSearch(
  "How do I implement OAuth2 with refresh tokens?"
);

// Returns in 0.1ms (was 9.6ms):
// - Past implementations
// - Similar patterns
// - Learned skills
// - Success trajectories
```

**Features:**
- HNSW indexing (O(log n) complexity)
- 9 RL algorithms (PPO, Q-Learning, MCTS, etc.)
- Reflexion memory (learns from mistakes)
- Automatic skill consolidation
- Causal reasoning

### 2. ReasoningBank (Hybrid Memory)
```javascript
// Store memory with namespace
await system.queen.reasoningBank.store({
  content: "OAuth2 implementation with JWT refresh tokens works best",
  metadata: { successRate: 0.95, project: 'auth-service' }
}, 'authentication');

// Search across namespaces
const memories = await system.queen.reasoningBank.search(
  "JWT token management",
  { namespace: 'authentication', limit: 10 }
);

// 2-3ms latency, hybrid search (pattern + semantic)
```

**Features:**
- 1024-dim hash embeddings (no API keys!)
- SQLite persistence
- Namespace isolation
- Pattern matching + semantic similarity

### 3. Skills System (25 Specialized Skills)
```javascript
// Skills activate automatically through natural language

// Development & Methodology (3)
"SPARC methodology"         → 5-phase enterprise development
"Pair program"              → Collaborative coding
"Create new skill"          → Skill builder

// Intelligence & Memory (6)
"Search for similar"        → AgentDB semantic search (96x faster)
"Learn from experience"     → Reflexion learning
"Why did this happen"       → Causal reasoning
"Consolidate skills"        → Auto skill library
"Remember when we"          → Memory retrieval
"Find patterns"             → Pattern recognition

// Swarm Coordination (3)
"Coordinate agents"         → Multi-agent orchestration
"Hive mind collaboration"   → Collective intelligence
"Distribute work"           → Intelligent task assignment

// GitHub Integration (5)
"Review this PR"            → Comprehensive PR review
"Setup GitHub Actions"      → Workflow automation
"Create release"            → Release management
"Manage multiple repos"     → Multi-repo coordination
"Triage issues"             → Auto-label and prioritize

// Automation & Quality (4)
"Setup git hooks"           → Pre-commit/push automation
"Verify code"               → Lint, test, validate
"Analyze performance"       → Profile and optimize
"Security scan"             → Vulnerability detection

// Flow Nexus Platform (4)
"Create dev sandbox"        → Cloud development environment
"Train neural model"        → Neural network training
"Run benchmarks"            → Performance testing
"Deploy to production"      → Multi-env deployment
```

### 4. Context Compactor (Autonomous)
```javascript
// Runs automatically in background
const compactor = new ContextCompactor({
  maxTokens: 200000,           // 200k limit
  compactionThreshold: 0.80,   // Compact at 80%
  preservePercent: 0.40        // Keep 40% most important
});

// Monitors usage
compactor.addToContext('task', {
  description: 'Implement authentication',
  status: 'active'
});

// At 80% usage: Smart Compaction
// - Scores all context by importance
// - Preserves: Active tasks (3.5x), Decisions (3.0x), Errors (2.5x)
// - Compacts: Completed tasks, old messages
// - Creates checkpoint for recovery
// - Saves 50-60% tokens

// At 95% usage: Emergency Compaction
// - Keeps only critical context (25%)
// - Preserves: Active tasks, recent errors, key decisions
// - Aggressive compression

// Result: Builds continuously for hours/days without stopping!
```

### 5. Project Bootstrap Agent
```javascript
const bootstrap = new ProjectBootstrapAgent({
  projectPath: './my-project',
  interactive: true
});

// Analyzes and generates
const result = await bootstrap.bootstrap();

// For new projects:
// - Reads: architecture.md or description
// - Asks: Smart questions (name, tech stack, features)
// - Generates: Complete docs, diagrams, wiki, structure

// For existing projects:
// - Scans: All source code
// - Detects: Tech stack, build phase (6 phases)
// - Fills: Documentation gaps
// - Creates: Repository wiki
// - Determines: Exactly where you left off
```

---

## 🎮 Live Examples

### Example 1: Build a Feature (Start to Finish)
```javascript
import { MasterWorkflow3 } from './.master-workflow/src/index.js';

const system = new MasterWorkflow3();
await system.initialize();

// Execute with full intelligence pipeline
const result = await system.execute({
  description: "Build a user authentication system with OAuth2 and JWT",
  type: 'build_feature',
  context: {
    techStack: ['Node.js', 'Express', 'PostgreSQL', 'JWT'],
    requirements: [
      'OAuth2 provider integration',
      'JWT access and refresh tokens',
      'Token rotation',
      'Secure password hashing',
      'Email verification'
    ]
  }
});

console.log(result);
// {
//   success: true,
//   phases: [
//     { name: 'quantum_recall', confidence: 0.85, similarProjects: 3 },
//     { name: 'swarm_planning', bestApproach: 'iterative-implementation' },
//     { name: 'agent_execution', agentId: 'developer-...', status: 'completed' },
//     { name: 'collective_learning', propagated: 10 },
//     { name: 'quantum_storage', stored: true }
//   ],
//   output: {
//     agentId: 'developer-1234-abc',
//     result: 'Authentication system implemented successfully',
//     filesCreated: ['auth/oauth.js', 'auth/jwt.js', 'auth/middleware.js'],
//     testsCreated: ['auth/oauth.test.js', 'auth/jwt.test.js']
//   }
// }
```

### Example 2: Continuous Building (Autonomous)
```javascript
// This runs indefinitely with autonomous context management

const system = new MasterWorkflow3();
await system.initialize();

// Build complex application
const buildTasks = [
  { description: 'Setup Express server with middleware' },
  { description: 'Create PostgreSQL database schema' },
  { description: 'Implement user authentication' },
  { description: 'Build REST API endpoints' },
  { description: 'Add input validation and error handling' },
  { description: 'Write comprehensive tests' },
  { description: 'Setup CI/CD pipeline' },
  { description: 'Create documentation' }
  // Add 100 more tasks if you want!
];

for (const task of buildTasks) {
  const result = await system.execute(task);

  // Context compactor monitors automatically:
  // - At 80% (160k tokens): Smart compaction
  // - Preserves critical info
  // - Saves 50-60% tokens
  // - Continues building!

  // At 95% (190k tokens): Emergency compaction
  // - Keeps only active tasks
  // - Saves 75% tokens
  // - Never stops!

  console.log(`✓ Completed: ${task.description}`);
}

// System builds ALL tasks continuously
// Context managed autonomously
// No human intervention needed
// Can build for hours, days, weeks!
```

### Example 3: Natural Language Skills
```javascript
const system = new MasterWorkflow3();
await system.initialize();

// Skill activation through conversation

// 1. Pair programming
await system.execute({
  description: "Let's pair program on the payment processing module"
});
// → Pair Programming skill activated
// → Collaborative mode engaged
// → Real-time feedback enabled

// 2. Multi-agent coordination
await system.execute({
  description: "Coordinate 5 agents to work on frontend, backend, database, tests, and docs simultaneously"
});
// → Multi-Agent Orchestration activated
// → 5 agents spawned
// → Work distributed intelligently
// → Progress tracked collectively

// 3. Learning and improvement
await system.execute({
  description: "Analyze why our last deployment to production failed and learn from it"
});
// → Causal Reasoning activated
// → Reflexion Learning activated
// → Root cause identified
// → Patterns extracted
// → Stored for future avoidance

// 4. AgentDB search
await system.execute({
  description: "Search for how we implemented caching in previous projects"
});
// → AgentDB Semantic Search activated (96x faster!)
// → Found 5 similar implementations
// → Returns best practices
// → Confidence scores provided
```

---

## 📈 Performance Metrics

### AgentDB Performance
- **Query Speed**: 0.1ms (was 9.6ms) = **96x faster**
- **Memory Usage**: 4-32x reduction with quantization
- **Search Quality**: Semantic understanding (not just keywords)
- **Learning**: 9 RL algorithms continuously improving

### Context Compaction
- **Smart Compaction**: Saves 50-60% tokens at 80% usage
- **Emergency Compaction**: Saves 75% tokens at 95% usage
- **Preservation**: 95%+ accuracy for critical information
- **Latency**: 100-500ms for compaction

### Project Bootstrap
- **New Project**: 30-60 seconds for complete setup
- **Existing Project**: 1-2 minutes for analysis
- **Documentation**: 8+ comprehensive documents generated
- **Wiki**: 5 pages created automatically

---

## 🔧 Configuration

### Master Workflow Config (.master-workflow/config.json)
```json
{
  "version": "3.0.0",
  "project": {
    "name": "my-project",
    "buildPhase": "development"
  },
  "systems": {
    "quantumMemory": true,
    "neuralSwarm": true,
    "agentDB": true,
    "reasoningBank": true,
    "skills": true,
    "contextCompactor": true
  },
  "queen": {
    "maxConcurrent": 10,
    "contextWindowSize": 200000
  },
  "agentDB": {
    "quantization": "scalar",
    "rlAlgorithm": "ppo"
  },
  "contextCompactor": {
    "compactionThreshold": 0.80,
    "preservePercent": 0.40
  }
}
```

### Environment Variables (.env)
```bash
# Project
PROJECT_NAME=my-project
BUILD_PHASE=development

# Queen Controller
MAX_CONCURRENT_AGENTS=10
CONTEXT_WINDOW_SIZE=200000

# AgentDB
AGENTDB_QUANTIZATION=scalar    # binary (32x), scalar (4x), product (12x)
AGENTDB_RL_ALGORITHM=ppo       # ppo, q-learning, mcts

# Context Compactor
CONTEXT_COMPACTION_THRESHOLD=0.80
CONTEXT_PRESERVE_PERCENT=0.40

# Optional
ANTHROPIC_API_KEY=your_key_here
```

---

## 🎓 Best Practices

### 1. Start with Bootstrap
Always bootstrap first - even for existing projects:
```bash
/bootstrap --analyze
```
Gets you: documentation, wiki, build phase detection, next steps

### 2. Use Natural Language
Skills activate automatically - just describe what you want:
```javascript
"Search for similar implementations"     // Better than manual search
"Review this PR for security issues"     // Better than /review
"Learn from this failure"                // Better than manual analysis
```

### 3. Let Context Compact Automatically
Don't worry about token limits:
- System monitors usage
- Compacts at 80% automatically
- Preserves what matters
- Builds continuously

### 4. Leverage AgentDB
96x faster semantic search - use it!:
```javascript
await system.queen.agentDB.semanticSearch("your query");
```

### 5. Check Build Phase
System detects where you are:
- `planning` - Start with SPARC methodology
- `development` - Use pair programming skill
- `testing` - Activate verification skill
- `pre-release` - Use deployment orchestration

---

## 🚨 Troubleshooting

### "Module not found" errors
```bash
# Install dependencies
cd .master-workflow
npm install

# If sqlite3 fails
npm install sqlite3 --build-from-source
# Or disable AgentDB in config
```

### Context window issues
```bash
# Context compactor runs automatically
# Check status:
const status = compactor.getStatus();
console.log(status.usage); // Current usage %

# Force compact manually:
await compactor._smartCompact();
```

### Skills not activating
```javascript
// Skills activate on keywords - be explicit:
"Search for similar" // Good
"find stuff"         // Too vague

// Check which skills activated:
const result = await system.skills.activate("your input");
console.log(result.activated); // List of activated skills
```

---

## 📚 Next Steps

1. **Try the examples** above
2. **Read INTEGRATION-COMPLETE.md** for full details
3. **Explore slash commands** in `.claude/commands/`
4. **Check generated wiki** in `wiki/`
5. **Review build phases** in `BUILD-PHASES.md`

---

## 💡 Pro Tips

1. **Use /bootstrap for any project** - even if it's "done", it fills gaps
2. **Skills chain automatically** - say "review PR and deploy" to activate multiple
3. **AgentDB learns continuously** - gets smarter with every task
4. **Context compactor is hands-off** - just build, it manages itself
5. **Natural language > commands** - system understands intent

---

**You now have the most advanced AI development system ever created.**

**Start building! 🚀**
