# AI Dev OS User Guide
## Your AI Development Team at Your Command 🚀

### Welcome!
This guide will teach you how to use your new AI Development Operating System - a complete team of AI agents working together to build software for you, even while you sleep!

---

## Table of Contents
1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Basic Commands](#basic-commands)
3. [Working with Projects](#working-with-projects)
4. [Common Workflows](#common-workflows)
5. [Real-World Examples](#real-world-examples)
6. [Tips & Tricks](#tips--tricks)
7. [FAQ](#frequently-asked-questions)

---

## Quick Start (5 Minutes)

### Your First AI-Powered Project

```bash
# 1. Create a new project folder
mkdir my-awesome-app
cd my-awesome-app

# 2. Initialize AI Dev OS
ai-dev init

# 3. Start building with AI
claude
# Type: /plan-product
# Follow the prompts to describe your app

# 4. For autonomous development (optional)
ai-dev orchestrate
```

That's it! Your AI team is now planning and building your project.

---

## Basic Commands

### The Main Commands You'll Use Daily

#### 🎯 `ai-dev init`
Initialize AI Dev OS in your project
```bash
# Auto-detect project type
ai-dev init

# Or specify type
ai-dev init web-app
ai-dev init api-service
ai-dev init mobile-app
```

#### 📊 `ai-dev status`
Check if everything is working
```bash
ai-dev status

# Output shows:
# ✅ Claude Code: Installed
# ✅ Agent OS: Ready
# ✅ Claude-Flow: Active
# ✅ Tmux: Running
```

#### 🚀 `ai-dev start`
Start all AI systems for your project
```bash
ai-dev start
```

#### 🤖 `ai-dev orchestrate`
Start 24/7 autonomous development
```bash
# Basic autonomous mode
ai-dev orchestrate

# Named project session
ai-dev orchestrate my-project
```

#### ⚙️ `ai-dev-config.sh`
Configure permissions and settings
```bash
./ai-dev-config.sh

# Quick toggle permissions
./toggle-permissions.sh on   # Skip permission prompts
./toggle-permissions.sh off  # Ask for permission
```

---

## Working with Projects

### Starting a New Project

#### Example 1: Building a Web App
```bash
# Create and enter project
mkdir social-media-app
cd social-media-app

# Initialize as web app
ai-dev init web-app

# Start Claude and plan
claude
```

In Claude, type:
```
/plan-product

I want to build a social media app with:
- User profiles and authentication
- Post creation with images
- Like and comment features
- Real-time notifications
- Mobile responsive design
```

#### Example 2: Creating an API Service
```bash
mkdir weather-api
cd weather-api
ai-dev init api-service

claude
/plan-product

Create a weather API service that:
- Fetches data from multiple weather providers
- Caches responses for performance
- Provides RESTful endpoints
- Includes rate limiting
- Has comprehensive documentation
```

### Working with Existing Projects

```bash
# Navigate to your existing project
cd my-existing-project

# Initialize AI Dev OS (won't overwrite your code)
ai-dev init

# Analyze your existing codebase
claude
/analyze-product

# AI will understand your project structure and help you continue development
```

---

## Common Workflows

### Workflow 1: Planning Before Coding

```bash
# Always start with planning
claude
/plan-product
# Describe your project vision

# Create specific feature specs
/create-spec --feature "user authentication"

# Then execute the plan
/execute-tasks
```

### Workflow 2: Quick Feature Addition

```bash
# For simple features, use Claude-Flow's swarm mode
ai-dev flow swarm "add password reset functionality to the login system"
```

### Workflow 3: Complex Multi-Feature Development

```bash
# Use hive-mind for complex projects
ai-dev flow hive-mind spawn "e-commerce-platform"

# This coordinates multiple agents:
# - Architect designs the system
# - Backend developer creates APIs
# - Frontend developer builds UI
# - Tester writes tests
# All working in parallel!
```

### Workflow 4: Overnight Development Session

```bash
# Before bed, start autonomous mode
ai-dev orchestrate overnight-work

# In Claude session that opens:
/plan-product
"Complete the remaining features for the user dashboard"

# Go to sleep - wake up to progress!
# Check progress in the morning:
tmux attach -t overnight-work
```

### Workflow 5: Bug Fixing Session

```bash
claude

# Describe the bug
There's a bug where users can't upload images larger than 2MB. 
The error message is unclear and the upload fails silently.

# AI will:
# 1. Locate the bug
# 2. Understand the issue
# 3. Fix the problem
# 4. Add proper error handling
# 5. Create tests to prevent regression
```

---

## Real-World Examples

### Example 1: Building a Todo App (30 minutes)

```bash
# Create project
mkdir todo-app
cd todo-app
ai-dev init web-app

# Start Claude
claude

# Give instructions
/plan-product
Build a modern todo application with:
- Add, edit, delete tasks
- Mark tasks as complete
- Filter by status (all, active, completed)
- Local storage persistence
- Clean, modern UI with Tailwind CSS
- Keyboard shortcuts
- Drag and drop to reorder

# Let AI build it
/execute-tasks

# Result: Full todo app with all features!
```

### Example 2: Creating a REST API (45 minutes)

```bash
mkdir book-api
cd book-api
ai-dev init api-service

claude
/plan-product
Create a RESTful API for a book library with:
- CRUD operations for books
- Author management
- User authentication with JWT
- Search and filtering
- Pagination
- PostgreSQL database
- API documentation with Swagger
- Rate limiting
- Unit and integration tests

# Execute the plan
ai-dev flow hive-mind spawn "book-api-implementation"
```

### Example 3: Migrating Legacy Code (Multi-day)

```bash
cd legacy-php-app
ai-dev init

# Start 24/7 migration
ai-dev orchestrate migration

claude
/analyze-product
# AI analyzes your legacy code

/plan-product
Migrate this PHP monolith to:
- Node.js microservices
- React frontend
- PostgreSQL database
- Docker containers
- Keep all existing functionality
- Migrate incrementally without downtime

# AI works continuously, migrating piece by piece
# Check progress anytime:
tmux attach -t migration
```

### Example 4: Adding AI Features to Existing App

```bash
cd my-chat-app
ai-dev init

claude
I want to add AI features:
- Smart message suggestions
- Sentiment analysis for messages
- Auto-moderation for inappropriate content
- Language translation
- Smart emoji recommendations

# AI will integrate these features into your existing codebase
```

---

## Tips & Tricks

### 🚀 Productivity Tips

#### 1. **Use Templates for Common Projects**
```bash
# After building a project type once, save it as template
cp -r my-perfect-setup ~/.ai-dev-os/templates/my-template
```

#### 2. **Chain Commands for Efficiency**
```bash
# Plan, create specs, and execute in one go
claude -c "/plan-product && /create-spec && /execute-tasks"
```

#### 3. **Use Tmux Windows for Parallel Work**
```bash
# Work on frontend and backend simultaneously
tmux new-window -n frontend
tmux new-window -n backend
# AI agents work in parallel in different windows
```

#### 4. **Quick Context Switching**
```bash
# Save project state
ai-dev flow hive-mind save "checkpoint-1"

# Switch to another feature
ai-dev flow hive-mind spawn "new-feature"

# Return to saved state later
ai-dev flow hive-mind resume "checkpoint-1"
```

### 💡 Power User Features

#### 1. **Custom Sub-Agents**
Create specialized agents for your needs:
```bash
# Create custom agent
cat > .claude/agents/database-optimizer.md << 'EOF'
---
name: database-optimizer
description: Database performance specialist
tools: Read, Write, Edit, Bash
---

You are a database optimization expert. Focus on:
- Query optimization
- Index strategies
- Performance tuning
- Schema design
EOF
```

#### 2. **Automation Hooks**
```bash
# Auto-run tests after code changes
echo 'npm test' > .claude/hooks/post-edit.sh
chmod +x .claude/hooks/post-edit.sh
```

#### 3. **Cross-Project Coordination**
```bash
# Manage multiple projects
tmux new-session -s project-manager
ai-dev orchestrate project-a
# Ctrl+b, c (new window)
ai-dev orchestrate project-b
# Switch between: Ctrl+b, n/p
```

### ⚡ Performance Optimization

#### 1. **Skip Permissions for Speed**
```bash
# During development (be careful!)
./toggle-permissions.sh on

# For production/careful work
./toggle-permissions.sh off
```

#### 2. **Use Swarm for Quick Tasks**
```bash
# Faster for simple tasks
ai-dev flow swarm "fix typo in README"

# Instead of full hive-mind
ai-dev flow hive-mind spawn "fix typo"  # Overkill
```

#### 3. **Batch Related Tasks**
```bash
claude
/create-spec --batch
- User authentication
- Password reset
- Email verification
- Two-factor authentication
# Creates all specs at once, more efficient
```

---

## Frequently Asked Questions

### General Questions

**Q: Do I need to install everything in each project?**
A: No! Install once globally, then just run `ai-dev init` in each project.

**Q: Can I use this with existing projects?**
A: Yes! Run `ai-dev init` in any existing project. It won't overwrite your code.

**Q: How much does this cost in API usage?**
A: Varies by usage. Simple tasks: $0.01-0.10. Complex projects: $1-10. 24/7 mode: monitor carefully!

**Q: Can I use this offline?**
A: No, requires internet for API access.

### Troubleshooting

**Q: "Command not found: ai-dev"**
A: Run: `source ~/.bashrc` or restart your terminal.

**Q: "Claude Code not working"**
A: Check API key: `echo $ANTHROPIC_API_KEY`

**Q: "Tmux session disappeared"**
A: Sessions persist through terminal closes but not system restarts. Use `tmux ls` to check.

**Q: "AI is asking for permission constantly"**
A: Enable skip-permissions: `./toggle-permissions.sh on`

**Q: "AI doesn't understand my project"**
A: Run `/analyze-product` first, or provide more context in `/plan-product`

### Best Practices

**Q: When should I use each mode?**
A:
- **Direct Claude**: Simple edits, questions, explanations
- **Agent OS**: Planning new projects or features
- **Claude-Flow Swarm**: Quick, single-purpose tasks
- **Claude-Flow Hive-Mind**: Complex, multi-part features
- **Tmux-Orchestrator**: Long-running or overnight work

**Q: How do I stop autonomous mode?**
A: 
```bash
# List sessions
tmux ls

# Stop specific session
tmux kill-session -t session-name

# Stop all
tmux kill-server
```

**Q: Can multiple people use this on the same project?**
A: Yes, but coordinate to avoid conflicts. Use git branches and communicate about active AI sessions.

---

## Quick Reference Card

### Essential Commands
```bash
ai-dev init          # Setup project
ai-dev status        # Check systems
ai-dev start         # Start development
ai-dev orchestrate   # 24/7 mode
ai-dev-config.sh     # Settings menu
toggle-permissions.sh # Quick permission toggle
```

### In Claude Code
```
/plan-product        # Plan entire project
/create-spec         # Create feature specs
/analyze-product     # Understand existing code
/execute-tasks       # Build from specs
```

### Claude-Flow Commands
```bash
ai-dev flow swarm "task"     # Quick tasks
ai-dev flow hive-mind spawn  # Complex projects
ai-dev flow hive-mind resume # Continue work
```

### Tmux Basics
```bash
tmux ls                      # List sessions
tmux attach -t name          # View session
tmux kill-session -t name    # Stop session
Ctrl+b, d                    # Detach from session
Ctrl+b, n/p                  # Next/previous window
```

---

## Getting Help

### Resources
- **Technical Docs**: `AI-Dev-OS-Technical-Setup.md`
- **Integration Guide**: `AI-Dev-OS-Integration-Guide.md`
- **Workflow Docs**: `4-System-Ultimate-AI-Development-Workflow.md`

### Commands
```bash
ai-dev help
claude --help
ai-dev status --verbose
```

### Community
- Report issues: [GitHub Issues]
- Ask questions: [Discord/Forum]
- Share templates: [Template Repository]

---

## Final Tips

1. **Start Small**: Begin with simple projects to learn the system
2. **Plan First**: Always use `/plan-product` before coding
3. **Monitor Costs**: Check API usage regularly
4. **Save Templates**: Reuse successful project setups
5. **Trust the AI**: Let it work autonomously - it's designed for this!

---

*Happy AI-Powered Development! Your AI team is ready to build amazing things with you! 🚀*

---

## Appendix: Complete Workflow Example

### Building a Full SaaS Application

```bash
# Day 1: Planning
mkdir saas-platform
cd saas-platform
ai-dev init web-app

claude
/plan-product
Build a SaaS platform for project management with:
- Multi-tenant architecture
- Team collaboration features
- Kanban and Gantt charts
- Time tracking
- Invoicing
- API for integrations
- Mobile apps
- Real-time updates

# Day 2-7: Autonomous Development
ai-dev orchestrate saas-development

# Check progress daily
tmux attach -t saas-development

# Week 2: Testing & Refinement
claude
Run comprehensive tests and fix any issues found

# Week 3: Deployment Preparation
/create-spec --feature "deployment-pipeline"
/execute-tasks

# Result: Production-ready SaaS platform!
```

---

*Remember: You're not just using AI tools - you're commanding an entire AI development team! Think big, plan well, and let your AI team handle the implementation details.*