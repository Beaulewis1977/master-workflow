# DAASHBOARD — Agent Operations Dashboard (Design Only)

A lightweight dashboard to observe and operate MCP-driven agents without a full IDE. Built with Next.js App Router and shadcn/ui components. This document outlines the information architecture, core screens, component mapping, data model, real-time events, and API contracts.

> Non-goal: Code editing or deep IDE functions. Focus is visibility, control, and simple interaction (chat, commands, jobs, sessions, shell).

---

## Objectives

- Provide a single place to watch agent activity, sessions, jobs, logs, metrics, and costs in near real-time
- Offer simple controls: start/stop, pause/resume, restart, run job/workflow, send message, attach shell
- Maintain clarity and speed; avoid complex IDE-like features

## Assumptions

- Default MCP server convention for libraries: context7
- Next.js App Router with server components; route handlers for APIs
- shadcn/ui as the base component library ([components reference](https://ui.shadcn.com/))
- Real-time via SSE for events/logs; WebSocket for shell/pty streams

---

## Navigation and Routes

- `/daashboard` — Overview
- `/daashboard/agents` — Agents list
- `/daashboard/agents/[agentId]` — Agent details (tabs)
- `/daashboard/sessions` — Sessions list
- `/daashboard/sessions/[sessionId]` — Session details
- `/daashboard/jobs` — Jobs/Workflows queue
- `/daashboard/console` — Global shell/terminal
- `/daashboard/logs` — Centralized logs
- `/daashboard/analytics` — Usage, cost, success metrics
- `/daashboard/settings` — Connections, secrets, roles, limits

See `DASHBOARD-ROUTES.md` and `DASHBOARD-IA.md` for details.

---

## Core Screens (High-Level)

1) Overview
- KPI cards: Active Agents, Running Jobs, Errors (24h), Queue Depth, Token Usage, Cost
- Live event stream (filterable by type/agent)
- Recent incidents/errors

2) Agents
- Search, filter by status/tags/model
- Table columns: Name, Status, Model, Sessions, Last activity, Avg latency
- Row actions: Open, Pause/Resume, Restart, Stop, Open Console

3) Agent Detail
- Header: Name, Status, Model, Controls (Start/Stop/Restart/Pause)
- Tabs: Timeline, Console (chat), Sessions, Jobs, Variables, Config
- Right rail: CPU/Memory, Latency, Tokens, Cost (sparklines)

4) Sessions
- List with status, duration, agent, last activity
- Actions: Start new, Resume, End, Inspect transcript

5) Jobs
- Queue and history (status, owner, duration)
- Actions: Run job, Rerun, Cancel, View logs

6) Console
- Global shell (pty) with history, quick commands, upload/download
- Attach to agent context if desired

7) Logs
- Stream/tail with filters (agent, level, component)
- Search and export

8) Analytics
- Token/cost per agent/session
- Success rate and error breakdowns

9) Settings
- MCP connections, API keys, secrets
- Roles/permissions, rate limits, webhooks

---

## Component Mapping (shadcn/ui)

- Layout: `Sheet` (mobile), `ResizablePanel`, `NavigationMenu`, `Breadcrumb`, `Separator`, `ScrollArea`
- Controls: `Button`, `DropdownMenu`, `Toggle`, `Switch`, `Badge`, `Tooltip`, `Command`
- Content: `Card`, `Tabs`, `Accordion` (timeline), `Dialog`/`AlertDialog`, `Toast`
- Data: `Table` (DataTable pattern), `Skeleton`, `Progress`
- Charts: small chart lib (Recharts/Victory) wrapped in `Card`
- Forms: `Form`, `Input`, `Textarea`, `Select`, `Slider`, `Checkbox`, `RadioGroup`
- Console: `Textarea` (input), `ScrollArea` + code-styled output, or embed xterm.js

Reference: [shadcn/ui components](https://ui.shadcn.com/)

---

## Minimal Data Model (TypeScript)

```ts
export type AgentStatus = "idle" | "active" | "paused" | "error" | "stopped";

export interface AgentSummary {
  id: string;
  name: string;
  type: "claude" | "openai" | "custom";
  model: string;
  status: AgentStatus;
  tags?: string[];
  lastActivityTs?: string;
  avgLatencyMs?: number;
}

export interface AgentDetail extends AgentSummary {
  capabilities: string[];
  metrics: {
    cpuPct?: number;
    memoryBytes?: number;
    tokens24h?: number;
    cost24hUsd?: number;
  };
}

export type SessionState = "open" | "closing" | "closed" | "error";

export interface Session {
  id: string;
  agentId: string;
  state: SessionState;
  startedAt: string;
  endedAt?: string;
  title?: string;
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

export interface Job {
  id: string;
  sessionId?: string;
  agentId: string;
  type: string;
  inputs?: Record<string, unknown>;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | "agent.status"
  | "session.opened"
  | "session.closed"
  | "job.started"
  | "job.progress"
  | "job.completed"
  | "log.entry"
  | "console.output"
  | "error";

export interface EventEnvelope<T = unknown> {
  id: string;
  type: EventType;
  agentId?: string;
  sessionId?: string;
  timestamp: string;
  payload: T;
}
```

---

## Real-Time Events

- SSE endpoint(s) for UI streams
  - `/api/events/stream` — all events (with query filters)
  - `/api/agents/[id]/stream` — agent-specific events
  - `/api/sessions/[id]/stream` — session-specific events
- WebSocket for shell (pty) streaming
  - `/api/shell/[id]/socket`

Event types: `agent.status`, `session.opened/closed`, `job.started/progress/completed`, `log.entry`, `console.output`, `error`.

---

## API Contracts (HTTP)

- Agents
  - GET `/api/agents`
  - GET `/api/agents/[id]`
  - POST `/api/agents/[id]/actions` { action: "start" | "stop" | "pause" | "resume" | "restart" }
- Sessions
  - GET `/api/sessions`
  - POST `/api/sessions` { agentId, title? }
  - GET `/api/sessions/[id]`
  - POST `/api/sessions/[id]/message` { role: "user" | "system", content: string }
- Jobs
  - GET `/api/jobs`
  - POST `/api/jobs` { agentId, type, inputs }
  - POST `/api/jobs/[id]/cancel`
- Logs
  - GET `/api/logs` (query: agentId, level, from, to)
- Console (pty)
  - POST `/api/shell` { agentId? }
  - POST `/api/shell/[id]/write` { data: string }
  - DELETE `/api/shell/[id]`

Full payload examples in `DASHBOARD-API.md`.

---

## Security & Roles

- Roles: `viewer` (read-only), `operator` (can run jobs/console), `admin` (settings)
- Secrets in server-only env; no client exposure
- CSRF on mutations; per-route RBAC guard

---

## Implementation Notes

- Next.js App Router; API route handlers for REST/SSE/WS
- Event bus abstraction; adapters for MCP events and local logs
- Prefer SSE for event feeds (proxy-friendly); WS only for shell
- Persist history to durable store (SQLite/Postgres)
- Client state via React Query; lightweight UI state via Zustand
- Charts via a small library; keep visuals minimal and legible

---

## Related Docs

- `DASHBOARD-ARCHITECTURE.md` — System context and component diagrams
- `DASHBOARD-DIAGRAMS.md` — Additional mermaid diagrams and sitemap
- `DASHBOARD-MAP.md` — Screen map & sitemap
- `DASHBOARD-SCAFFOLDING.md` — Planned structure and setup guidance
- `DASHBOARD-MCP-INTEGRATION.md` — Adapter, routes, events, and shell bridging
- `DASHBOARD-IA.md` — Information Architecture & user flows
- `DASHBOARD-ROUTES.md` — Route layout & loading boundaries
- `DASHBOARD-COMPONENTS.md` — UI components mapping and composition
- `DASHBOARD-COMPONENT-SELECTION.md` — Exact components per screen
- `DASHBOARD-API.md` — Detailed API payloads and event examples
- `DASHBOARD-WIREFRAMES.md` — Text wireframes for each screen
- `DASHBOARD-EXECUTION-PLAN.md` — Phase plan sized for LLM execution
- `DASHBOARD-WORKFLOW-CONTROL.md` — Hive/Queen/Agents workflow control
- `DASHBOARD-COMPANION-SPEC.md` — Tokens, variants, a11y, shortcuts, content

---

## Out of Scope (for v1)

- Code editing, file navigation, diff review
- Complex multi-user terminals or Tmux-like features
- Long-term audit/reporting beyond basic analytics
