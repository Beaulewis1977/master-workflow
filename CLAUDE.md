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

## Project Analysis
- **Complexity Score**: 39/100 (Supports up to 100 with Queen Controller)
- **Stage**: active
- **Selected Approach**: Hive-Mind with Queen Controller
- **Claude Flow Version**: alpha (experimental)
- **Command**: `npx --yes claude-flow@latest hive-mind spawn "MASTER-WORKFLOW" --sparc --agents 10 --claude`

## Technology Stack
### Languages
- JavaScript
  - Use ES6+ features
  - Async/await for asynchronous code
  - Proper error handling
- TypeScript
  - Strict type checking
  - Interface definitions
  - Generic types where appropriate

## Feature Guidelines

## Architecture: backend
- RESTful API design
- Service layer pattern
- Repository pattern for data access
- Authentication and authorization

## Stage-Specific Instructions (active)
- Maintain consistent code quality
- Add features systematically
- Ensure adequate test coverage
- Keep documentation up to date

## Discovered MCP Servers & Tools

### Servers
- context7: {"enabled":true,"default":true,"description":"General-purpose coding MCP server (preferred for coding)"}
- filesystem: {"enabled":true,"root":"."}
- http: {"enabled":true}
- git: {"enabled":true,"repo":"auto"}
- openapi: {"enabled":true}
- browser: {"enabled":true}
- search: {"enabled":true}
- github: {"enabled":true}
- slack: {"enabled":true}
- jira: {"enabled":true}
- docker: {"enabled":true}
- kubernetes: {"enabled":true}
- postgres: {"enabled":true}
- redis: {"enabled":true}
- s3: {"enabled":true}
- aws: {"enabled":true}
- gcp: {"enabled":true}
- azure: {"enabled":true}
- stripe: {"enabled":true}
- twilio: {"enabled":true}

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


- after finishing all the work from a plan you should update all documeents and create a summary, or if a summary is already created by you in the codebase, add to it and always use your name, date and time. its currently august.
- after      │
│   phase one you will create an end of phase summary, and for every phase, do an end of phase summary which also is a handoff  │
│   document for the next phase. /workspaces/MASTER-WORKFLOW/END-OF-PHASE-SUMMARIES and put the phase there. use context7 and   │
│   other mcp sever tools too help