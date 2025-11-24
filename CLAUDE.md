# Claude Configuration - Master Workflow 3.0

> **IMPORTANT**: Use specialized sub-agents from `/.claude/agents/` for all work. Each has its own 200k context window.

---

## Project Overview

| Property | Value |
|----------|-------|
| **Stage** | Active Development |
| **Complexity** | 82/100 (Advanced) |
| **Type** | AI-powered workflow automation with multi-agent coordination |
| **Approach** | Hive-Mind + SPARC |
| **Claude Flow** | alpha |

---

## Implementation Status

### Queen Controller Architecture ✅
- **Completed**: August 13, 2025
- **Test Pass Rate**: 80%
- **Features**: 10 concurrent sub-agents, 200k context windows, hierarchical management, SQLite shared memory, event-driven coordination

### Phases 1-4: Production Implementation ✅
- **Completed**: November 24, 2025
- **PR**: [#24](https://github.com/Beaulewis1977/master-workflow/pull/24) - `feature/phase-1-4-implementation`
- **Stats**: 34 files, 12,849 lines, 47 tests passing
- **Components**:
  - Autonomous Documentation System (ProjectAnalyzer, DocumentationGenerator, SpecificationEngine)
  - Build Loop System (LoopSelector, BuildLoopOrchestrator, 5 Loop Executors)
  - Enhanced Engines (GPUAccelerator, PredictiveAnalytics, AutoTuner, SwarmIntelligence, PatternDiscovery)
  - Code Generator & Test Runner (real implementations, no placeholders)

---

## Technology Stack

### Core Runtime
- **Node.js** v18+ (worker threads, clustering)
- **JavaScript ES6+** (async/await, modules)
- **Event-Driven Architecture** (EventEmitter)

### System Architecture
- **Queen Controller**: Orchestrates 4,462+ agents
- **Cross-Platform**: Windows, macOS, Linux
- **Monitoring**: WebSocket servers, Chart.js dashboards
- **Storage**: SQLite with file fallback
- **MCP Integration**: 100+ servers

---

## MCP Servers & Tools

**Default Server**: context7

| Category | Servers |
|----------|---------|
| **Core** | filesystem, http, git, context7 |
| **Development** | github, gitlab, npm, yarn |
| **Cloud** | aws, gcp, azure, vercel, netlify |
| **Databases** | postgres, mysql, redis, mongodb, sqlite |
| **AI/ML** | openai, anthropic, perplexity, huggingface |
| **Communication** | slack, discord, teams, telegram |
| **Monitoring** | prometheus, grafana, datadog, sentry |

**Key Tools**: context7, fs, httpClient, git, openapi, browser, search, github, docker, k8s, postgres, redis, s3, grep

---

## Neural Learning Data

**File**: `.hive-mind/neural-data/neural-learning-data.json`

Contains trained ML model weights. The `timestamp` changes on every run (noise), but `weights` are valuable.

| Action | When |
|--------|------|
| Leave uncommitted | Day-to-day work |
| Commit with message | After significant training |
| `git checkout` to restore | If weights corrupted |

---

## Development Guidelines

### Code Quality
- Strict error handling with graceful degradation
- Proper resource cleanup for worker threads
- Event-driven patterns for agent communication
- Cross-platform compatibility in all modules

### Phase Workflow
1. **Before starting**: Check `/END-OF-PHASE-SUMMARIES/PHASE-*/` for previous handoff docs
2. **During work**: Use tools (context7, perplexity, zen mcp, vibe coder) for help
3. **After completing**: Create two documents in `/END-OF-PHASE-SUMMARIES/PHASE-{N}/`:
   - `PHASE-{N}-COMPLETE.md` - Summary of completed work
   - `PHASE-{N}-SUMMARY.md` - Handoff with unfinished items, context, tools
4. **Commit**: Push to branch `{AGENT}-PHASE-{N}-COMPLETE`

### Best Practices
- Keep documents short but thorough
- Use context7 to verify packages are current before coding
- If stuck: use ultrathink, then consult other LLMs (zen mcp, vibe coder, perplexity)
- Never commit: .gitignore files, API keys, large SDK files

---

## Quick Reference

```bash
# Recommended spawn command
npx --yes claude-flow@alpha hive-mind spawn "TASK" --sparc --agents 10 --claude

# Run tests
node src/engines/test-engines.js
node src/tests/integration-tests.js

# Restore neural weights
git checkout .hive-mind/neural-data/neural-learning-data.json
```

## Version Policy
- **Stable**: 2.0, latest, stable
- **Experimental**: alpha, beta, dev
- **Override**: `CLAUDE_FLOW_VERSION=stable`