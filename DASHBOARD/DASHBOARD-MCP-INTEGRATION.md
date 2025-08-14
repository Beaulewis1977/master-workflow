# MCP Integration Plan (shadcn + Next.js)

Leverage the existing Next.js server as a BFF to the MCP server for agent control, jobs, sessions, logs, and shell. UI uses shadcn/ui. Default MCP library server: context7 [[memory:828182]].

Reference components: [shadcn/ui](https://ui.shadcn.com/)

## Configuration

- Env:
  - `MCP_BASE_URL` (e.g., http://localhost:13800)
  - `MCP_TOKEN` (if required)
- Server-only adapter module exposes typed functions:
  - `listAgents()`, `getAgent(id)`, `performAgentAction(id, action)`
  - `listSessions()`, `openSession(agentId, title?)`, `getSession(id)`, `sendMessage(sessionId, body)`
  - `listJobs()`, `createJob(agentId, type, inputs)`, `cancelJob(id)`
  - `getLogs(query)`
  - `subscribeEvents(filters)` → async iterator for events
  - `createShell(agentId?)`, `writeShell(id, data)`, `closeShell(id)`, `connectShellWS(id)`

## Route Mapping (BFF ↔ MCP)

- Agents
  - GET `/api/agents` → adapter.listAgents
  - GET `/api/agents/[id]` → adapter.getAgent
  - POST `/api/agents/[id]/actions` → adapter.performAgentAction
- Sessions
  - GET `/api/sessions` → adapter.listSessions
  - POST `/api/sessions` → adapter.openSession
  - GET `/api/sessions/[id]` → adapter.getSession
  - POST `/api/sessions/[id]/message` → adapter.sendMessage
- Jobs
  - GET `/api/jobs` → adapter.listJobs
  - POST `/api/jobs` → adapter.createJob
  - POST `/api/jobs/[id]/cancel` → adapter.cancelJob
- Logs
  - GET `/api/logs` → adapter.getLogs
- Events (SSE)
  - GET `/api/events/stream` → adapter.subscribeEvents
  - (scoped): `/api/agents/[id]/stream`, `/api/sessions/[id]/stream`
- Shell (WS + HTTP)
  - POST `/api/shell` → adapter.createShell
  - POST `/api/shell/[id]/write` → adapter.writeShell
  - DELETE `/api/shell/[id]` → adapter.closeShell
  - WS `/api/shell/[id]/socket` → adapter.connectShellWS

## Event Model

- Normalize MCP events into UI `EventEnvelope` with types:
  - `agent.status`, `session.opened`, `session.closed`,
  - `job.started`, `job.progress`, `job.completed`,
  - `log.entry`, `console.output`, `error`
- SSE route multiplexes MCP stream(s) → `text/event-stream` per filters

## Shell Bridging

- Create pty via MCP; return shell id
- WS route proxies binary/text frames between UI and MCP pty
- Heartbeat/ping and max idle timeout

## Auth & RBAC

- Server validates user role: `viewer`, `operator`, `admin`
- Gate mutations (actions, write, cancel) to `operator+`
- Settings/keys behind `admin`

## Observability

- Structured logs (route, status, duration)
- Metrics: token usage, cost, latency per agent/session/job
- Persist aggregates to DB for analytics page

## Local Dev (suggested)

- Start MCP on port 13800
- Start Next.js dev server
- Set `MCP_BASE_URL=http://localhost:13800`
- Smoke test: `/daashboard` → Agents list, Events stream, Shell
