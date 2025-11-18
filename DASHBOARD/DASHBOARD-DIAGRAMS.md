# Diagrams

## Architecture (System Context)

```mermaid
graph LR
  user([Operator]) --> ui[Next.js UI]\n
  ui --> api[Next.js API]\n  api --> mcp[MCP Server]\n  mcp --> providers[AI Providers]\n  api --> db[(DB)]
```

## Component View

```mermaid
graph TD
  subgraph UI
    P[Pages & Layout]\n    C[Components (shadcn/ui)]\n    RQ[React Query]\n    SSE[SSE Hook]\n    WS[WS Client]
  end
  subgraph Server
    REST[REST Routes]\n    SSEH[SSE Route]\n    WSH[WS Shell]\n    ADPT[MCP Adapter]\n    PERS[Persistence]
  end
  P --> C
  C --> RQ
  RQ --> REST
  SSE --> SSEH
  WS --> WSH
  REST --> ADPT
  SSEH --> ADPT
  WSH --> ADPT
  ADPT --> MCP[MCP Server]
  REST --> PERS
  SSEH --> PERS
```

## Chat Sequence

```mermaid
sequenceDiagram
  participant U as UI
  participant API as REST
  participant MCP as MCP
  U->>API: POST /sessions/{id}/message
  API->>MCP: sendMessage
  MCP-->>API: ack
  API-->>U: 200 OK
```

## SSE Stream

```mermaid
sequenceDiagram
  participant U as UI
  participant S as SSE Route
  participant E as MCP Events
  U->>S: GET /events/stream
  E-->>S: event
  S-->>U: event
```

## Shell WS

```mermaid
sequenceDiagram
  participant U as UI (xterm)
  participant W as WS
  participant P as MCP Pty
  U->>W: connect
  W->>P: createPty
  P-->>W: read bytes
  W-->>U: bytes
  U->>W: write bytes
  W->>P: write bytes
```

## Sitemap

```mermaid
graph TD
  root[/daashboard/] --> agents[/agents/]
  root --> sessions[/sessions/]
  root --> jobs[/jobs/]
  root --> console[/console/]
  root --> logs[/logs/]
  root --> analytics[/analytics/]
  root --> settings[/settings/]
  agents --> agentId[/agents/[agentId]/]
  sessions --> sessionId[/sessions/[sessionId]/]
```
