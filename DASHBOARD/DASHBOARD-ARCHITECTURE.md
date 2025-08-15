# Architecture

A lightweight operations dashboard built on Next.js App Router and shadcn/ui, backed by a thin BFF (route handlers) that proxy to the MCP server for agent control, events, jobs, and shell. Real-time updates via SSE; interactive shell via WebSocket.

- UI: shadcn/ui components for consistent UX and accessibility
- BFF: Next.js API route handlers (REST + SSE + WS)
- Event Bus: in-process broker with adapters to MCP event streams
- MCP Server: single source of truth for agents, sessions, jobs, logs, shell
- Storage: durable DB (SQLite/Postgres) for history and analytics
- AuthZ: simple RBAC (viewer/operator/admin)

Reference components: https://ui.shadcn.com/

## System Context

```mermaid
C4Context
title "DAASHBOARD System Context"
Enterprise_Boundary(b0, "Workspace") {
  Person(user, "Operator", "Observes and controls agents")
  System_Boundary(s1, "DAASHBOARD") {
    System(fe, "Next.js UI", "shadcn/ui components")
    System(bff, "Next.js API", "REST, SSE, WebSocket")
  }
  System_Ext(mcp, "MCP Server", "agents, sessions, jobs, logs, shell")
  System_Ext(prov, "AI Providers", "Claude/OpenAI/etc")
  SystemDb(db, "Database", "history, analytics")
}
Rel(user, fe, "uses via browser")
Rel(fe, bff, "fetches, streams")
Rel(bff, mcp, "control, query, events")
Rel(mcp, prov, "LLM calls")
Rel(bff, db, "persist metrics/logs")
```

## Component Breakdown

```mermaid
graph TD
  A[UI: shadcn/ui pages] --> B[Client Data: React Query]
  B --> C[SSE Hook]
  B --> D[WS Shell Client]
  A --> E[Forms & Actions]
  E --> F[BFF: REST Handlers]
  C --> G[BFF: SSE Handlers]
  D --> H[BFF: WS Shell]
  F --> I[MCP Adapter]
  G --> I
  H --> I
  I --> J[MCP Server]
  F --> K[DB Persistence]
  G --> K
```

## Key Flows

### Chat/Message Flow

```mermaid
sequenceDiagram
  participant U as UI
  participant API as Next.js API
  participant MCP as MCP Server
  U->>API: POST /sessions/{id}/message
  API->>MCP: sendMessage(sessionId, content)
  MCP-->>API: ack
  API-->>U: 200 OK
  MCP-->>API: event(session.updated)
  API-->>U: SSE event → update timeline/console
```

### Event Stream (SSE)

```mermaid
sequenceDiagram
  participant U as UI (SSE client)
  participant API as SSE Route
  participant MCP as MCP Events
  U->>API: GET /events/stream?filters
  API->>MCP: subscribe(filters)
  MCP-->>API: event(...)
  API-->>U: event: job.progress\ndata: {...}
  note over U: UI merges into React Query cache and timeline
```

### Shell (WebSocket)

```mermaid
sequenceDiagram
  participant U as UI (xterm)
  participant WS as WS Route
  participant MCP as MCP Shell
  U->>WS: connect
  WS->>MCP: createPty(agent?)
  MCP-->>WS: pty:read bytes
  WS-->>U: bytes
  U->>WS: write command bytes
  WS->>MCP: pty:write bytes
  U->>WS: close → WS->>MCP: terminate
```

## Reliability & Security

- Reconnect strategy on SSE with backoff; idempotent UI updates
- WS heartbeat/ping for shell; auto-close on idle
- RBAC on API routes; CSRF on POST; secrets server-only
- Structured logs; metrics for tokens/cost/latency

## Deployment Notes

- Single Next.js app; colocated API handlers
- MCP endpoint URL via env; DB URL via env
- Edge-friendly SSE; Node runtime for WS
