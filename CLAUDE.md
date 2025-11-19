## YOU MUST USE SPECIALIZED SUB-AGENTS FROM /.claude/agents for all work, not the workflow agents with claude code flow

# Claude Configuration - active Stage Project

## Phase 1 Complete: Queen Controller Architecture ✅
- **Implementation Date**: August 13, 2025
- **Implementer**: Claude (Autonomous Workflow System)
- **Status**: Successfully completed with 80% test pass rate

### Queen Controller Features
- **10 Concurrent Sub-Agents**: Upgraded from 6 to 10 agents
- **200k Context Windows**: Each agent tracks individual context
- **Hierarchical Management**: Queen Controller orchestrates all agents
- **Shared Memory Store**: Cross-agent data sharing with SQLite persistence
- **Event-Driven Architecture**: Real-time agent coordination

## Phase 7 In Progress: Documentation & Final Updates ⚙️
- **Implementation Date**: August 13, 2025
- **Implementer**: Claude (Autonomous Workflow System)
- **Status**: In Progress

### Documentation Tasks
- Updating all documents to v3.0
- Creating architecture guides
- Writing migration documentation
- Generating implementation summaries

## Project Analysis - Updated August 14, 2025
- **Complexity Score**: 82/100 (Advanced workflow orchestration system)
- **Stage**: active
- **Project Type**: AI-powered development workflow automation with multi-agent coordination
- **Selected Approach**: Hive-Mind + SPARC (optimal for 80+ complexity)
- **Claude Flow Version**: alpha (experimental features required)
- **Recommended Command**: `npx --yes claude-flow@alpha hive-mind spawn "CLAUDE-FLOW-2.0-ANALYSIS-DEMO" --sparc --agents 10 --claude`

## Technology Stack - Advanced Multi-Agent System
### Core Runtime
- **Node.js**: v18+ (required for worker threads and clustering)
- **JavaScript ES6+**: Modern async/await, destructuring, arrow functions
- **Event-Driven Architecture**: EventEmitter, custom event systems
- **Worker Threads**: Multi-threading for agent isolation
- **Clustering**: CPU core utilization for scaling

### System Architecture
- **Queen Controller Pattern**: Master orchestrator for 4,462+ agents
- **Cross-Platform Support**: Windows, macOS, Linux compatibility
- **Real-time Monitoring**: WebSocket servers, Chart.js dashboards
- **Shared Memory Store**: SQLite persistence with file fallback
- **MCP Integration**: 100+ Model Context Protocol servers

### Development Guidelines
- Use strict error handling and graceful degradation
- Implement proper resource cleanup for worker threads
- Follow event-driven patterns for agent communication
- Maintain cross-platform compatibility in all modules
- Use optional dependencies for platform-specific features

## Feature Guidelines

## Architecture: Advanced Workflow Orchestration
- **Queen Controller**: Hierarchical agent management with unlimited scaling
- **Event-Driven Coordination**: Real-time agent communication and task distribution
- **Worker Thread Pool**: Isolated execution environments with 200k context per agent
- **Cross-Platform Abstraction**: Unified API across Windows/macOS/Linux
- **Plugin Architecture**: Dynamic MCP server discovery and integration
- **Monitoring Dashboard**: Real-time performance metrics and agent health
- **Fault Tolerance**: Automatic recovery and graceful degradation
- **Resource Management**: Memory limits, timeouts, and cleanup procedures

## Stage-Specific Instructions (active)
- Maintain consistent code quality
- Add features systematically
- Ensure adequate test coverage
- Keep documentation up to date

## Discovered MCP Servers & Tools

### Servers (100 Total)
- **Core**: filesystem, http, git, context7
- **Development**: github, gitlab, bitbucket, npm, yarn
- **Cloud**: aws, gcp, azure, vercel, netlify
- **Databases**: postgres, mysql, redis, mongodb, sqlite
- **AI/ML**: openai, anthropic, perplexity, huggingface
- **Communication**: slack, discord, teams, telegram
- **Monitoring**: prometheus, grafana, datadog, sentry
- **And 70+ more across 13 categories**

### Tools
- context7 (mcp:context7)
- fs (mcp:filesystem)
- httpClient (mcp:http)
- git (mcp:git)
- openapi (mcp:openapi)
- browser (mcp:browser)
- search (mcp:search)
- github (mcp:github)
- slack (mcp:slack)
- jira (mcp:jira)
- docker (mcp:docker)
- k8s (mcp:kubernetes)
- postgres (mcp:postgres)
- redis (mcp:redis)
- s3 (mcp:s3)
- aws (mcp:aws)
- gcp (mcp:gcp)
- azure (mcp:azure)
- stripe (mcp:stripe)
- twilio (mcp:twilio)
- grep (builtin)
- httpClient (mcp:http)
- fs (mcp:filesystem)
- context7 (mcp:context7)
- git (mcp:git)

Default MCP Server: context7

## Hive-Mind Workflow
1. Multi-agent task distribution
2. Parallel development streams
3. Cross-agent coordination
4. Integrated testing
5. Consolidated deployment

## Version Policy
- Canonical versions: 2.0, alpha, beta, dev, latest, stable
- Experimental: alpha, beta, dev
- Override via env: CLAUDE_FLOW_VERSION=stable


- keep all documents and summaries as short as possible while still being thorough.
- you must use tools and mcp servers to help. like context7. you must use it to make sure all packages and libraries are up to date and current. use before coding.
- if you are getting bugs or having trouble with something- stop and use ultrathink and if you still need help use tools like zen mcp, vibe coder mcp, etc for consultation with other LLM models. Also use tools to search the internet, like perplexity mcp and others. you also have tools like desktop commander and taskmaster to help.
- after each phase is complete you must create two documents. 1) a phase complete summary, example - PHASE-1-COMPLETE.MD and end of each phase will replace the phase number 1 with the phase number you just finished and save to /END-OF-PHASE-SUMMARIES and create that number phase folder to place it in 'PHASE-ONE, PHASE-TWO, PHASE-*, etc. 2) end of phase summary handoff document that includes the work you did and anywork that still needs to be finished by the next agent, also, any important ddocuments or context to read, and important tools to use. this document naming will be 'PHASE-*-SUMMARY.MD and must be saved to /END-OF-PHASE-SUMMARIES inside that phase's folder.
- always check /END-OF-PHASE-SUMMARIES folder for the previous phase's end of phase summaries and handoff documents before starting on the new phase. there is important context there and also may list things that were not ffinished from the previous phase. also important documents to read and tools to use. <example> if youre starting on PHASE-2 then go to /END-OF-PHASE-SUMMARIES folder and look at the documents in PHASE-ONE folder and look at the handoff documeent - PHASE-1-SUMMARY.MD and the end of phase summary document PHASE-1-COMPLETE.MD.
- you must always commit and push all appropriate work and changes to the repo with the new branch name of the phase you were working on with your name on the front. <example> you finished phase-1 so you would push to brand CLAUDE-CODE-PHASE-1-COMPLETE </example> make sure only the files that should be committed and pushed are pushed. nothing from .gitignore, nothing with api keys, etc. no large SDK files, unless they should be pushed to the repo.
- after each phase is complete you must create two documents. 1) a phase complete summary, <example> PHASE-1-COMPLETE.MD</example> and end of each phase will replace the phase number 1 with the phase number you just finished and save to /END-OF-PHASE-SUMMARIES and create that number phase folder to place it in <example> PHASE-ONE, PHASE-TWO, PHASE-*</example> etc. 2) end of phase summary handoff document that includes the work you did and anywork that still needs to be finished by the next agent, also, any important ddocuments or context to read, and important tools to use. this document naming will be <example>PHASE-*-SUMMARY.MD</example> and must be saved to /END-OF-PHASE-SUMMARIES inside that phase's folder.

- YOU MUST USE SPECIALIZED SUB-AGENTS TO DO THE ALL WORK. THEY HAVE THEIR OWN 200,000 CONTEXT WINDOW. THEY ARE AT @.claude/agents/