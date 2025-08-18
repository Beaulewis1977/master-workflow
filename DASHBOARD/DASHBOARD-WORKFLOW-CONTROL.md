# Workflow Control (Hive/Queen/Agents)

Operator-focused controls to direct the orchestration layer (queen) and worker agents (hive). Enables broadcast commands, targeted delegation, priority tuning, pausing/resuming cohorts, and safe shutdown. Non-IDE, minimal but powerful.

Reference components: https://ui.shadcn.com/

## Concepts

- Queen: orchestrator that plans, routes, and supervises workers
- Hive: collection of worker agents with roles/capabilities
- Delegation: assignment of a task/work item to a specific worker or cohort
- Broadcast: a message/instruction sent to all workers (optionally filtered)
- Strategy: queen routing policy (e.g., round-robin, capability-first, priority)

## Page: /daashboard/workflow

Layout
- Left rail: Queen status & controls
- Center: Delegation Matrix + Broadcast composer
- Right rail: Workers list (filters, quick actions)

Key Controls
- Queen lifecycle: Start, Pause, Resume, Stop, Restart
- Strategy: select policy; adjust thresholds (latency caps, max-concurrent)
- Broadcast to hive: message + scope filters (tags/capabilities)
- Delegate: pick task, target worker(s), priority
- Reroute/Recall: move task from worker A→B; cancel assignments
- Cohort actions: Pause/resume a tag/capability group; drain; cap concurrency
- Priority queue: reorder (drag/drop); bump/defer items

## UI Components (shadcn/ui)
- `card`, `tabs`, `table`, `badge`, `dropdown-menu`, `button`, `toggle`, `switch`, `select`, `slider`, `form`, `input`, `textarea`, `dialog`, `alert-dialog`, `toast`, `command`, `progress`, `tooltip`, `scroll-area`, `resizable`

## Data Model Additions (TypeScript)

```ts
export type QueenStatus = "idle" | "active" | "paused" | "stopped" | "error";

export interface QueenState {
  id: string;
  status: QueenStatus;
  strategy: "round_robin" | "capability_first" | "priority";
  queueDepth: number;
  maxConcurrent: number;
  avgLatencyMs?: number;
  lastDecisionTs?: string;
}

export interface Worker extends AgentSummary {
  role: "worker" | "specialist" | "supervisor";
  capabilities: string[];
  loadPct?: number;
  currentTaskId?: string;
}

export interface Delegation {
  id: string;
  taskId: string;
  from?: string; // queen or previous worker
  to: string; // worker agent id
  priority: number; // higher = sooner
  assignedAt: string;
}
```

## API Endpoints (BFF)

- Queen
  - GET `/api/workflow/queen` → `QueenState`
  - POST `/api/workflow/queen/actions` { action: "start" | "pause" | "resume" | "stop" | "restart" }
  - POST `/api/workflow/queen/strategy` { strategy, maxConcurrent?, thresholds? }
- Hive
  - GET `/api/workflow/workers` → `Worker[]`
  - POST `/api/workflow/broadcast` { message, filters?: { tags?: string[], capabilities?: string[] } }
  - POST `/api/workflow/delegate` { taskId, to: string | string[], priority? }
  - POST `/api/workflow/recall` { taskId, from: string }
  - POST `/api/workflow/cohort` { action: "pause" | "resume" | "drain", filters: { tags?: string[], capabilities?: string[] } }
  - POST `/api/workflow/priority` { taskId, op: "bump" | "defer" | "set", value?: number }

## SSE Events

New types
- `workflow.queen_status`
- `workflow.strategy_changed`
- `workflow.broadcast`
- `delegation.assigned`
- `delegation.recalled`
- `cohort.paused` / `cohort.resumed` / `cohort.drained`

Envelope: reuse `EventEnvelope` with `type` above and suitable payloads.

## Command Palette (Quick Actions)
- "Broadcast to hive" → opens composer
- "Delegate task to…" → select task then worker(s)
- "Pause queen" / "Resume queen" / "Stop queen"
- "Pause cohort by tag…" / "Resume cohort by capability…"
- "Reroute task…" / "Bump priority…"

## RBAC
- viewer: read-only
- operator: queen actions, broadcast, delegate, cohort actions
- admin: strategy/thresholds, settings, secrets

## Wireframe Snapshot

- Queen Card: status badge, strategy select, controls (Start/Pause/Resume/Stop/Restart), metrics (queueDepth, avgLatency)
- Broadcast Card: textarea + filters + Send
- Delegation Matrix: table of tasks × workers with priority and actions
- Workers Table: name, role, status, load, current task, row actions

## Notes
- Keep destructive operations in `alert-dialog`
- All mutations show `toast` feedback
- SSE should reconcile idempotently with local state
