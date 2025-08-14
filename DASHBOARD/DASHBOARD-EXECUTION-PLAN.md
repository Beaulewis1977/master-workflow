# DAASHBOARD-EXECUTION-PLAN: Phased Build Plan (LLM-Sized)

Design-first implementation plan for the Agent Operations Dashboard using Next.js + shadcn/ui, integrating with the MCP server. Phases are sized so an AI agent can complete each within a 200,000-token context window (code + docs + diffs).

- Reference components: [shadcn/ui](https://ui.shadcn.com/)
- Default MCP library server convention: context7 (configurable) [[memory:828182]]
- This plan does not begin coding until explicitly requested; it prepares implementation.

---

## Contents
1. Objectives & Scope
2. Token & Complexity Guardrails
3. Phase Index (at-a-glance)
4. Phase Details (0–8)
5. Tracking & Index (Task IDs)
6. References

---

## 1) Objectives & Scope
- Implement a lightweight, operator-focused dashboard (not an IDE)
- Observe and control agents, sessions, jobs, logs, shell; see analytics
- Real-time via SSE; shell via WS; RBAC for safety

Out of scope (v1): file editing, deep IDE features, multi-user terminals.

## 2) Token & Complexity Guardrails (per phase)
- Token ceiling: 200k tokens (prompt + retrieved code + diffs + tests)
- File change cap: ≤ 25 files; total LOC added ≤ 6,000
- Component cap: ≤ 12 new components per phase
- API handlers cap: ≤ 8 new handlers per phase
- Prefer incremental merges to keep diffs small

---

## 3) Phase Index
- Phase 0: Preparation & Scaffolding
- Phase 1: Layout, Navigation, Theming
- Phase 2: Data Layer (Types, API, SSE/WS hooks)
- Phase 3: Agents & Sessions (List + Detail skeleton)
- Phase 4: Jobs, Logs, Console (Global Shell)
- Phase 5: Events Integration & Timelines (SSE wired UI)
- Phase 6: Analytics (Tokens/Cost/Latency)
- Phase 7: Settings & RBAC
- Phase 8: Polish, A11y, Perf, QA

---

## 4) Phase Details

### Phase 0: Preparation & Scaffolding
Goals: Create safe structure, install deps, and stub pages/components.

Tasks
- D0-T1: Add directories and placeholder pages per `DASHBOARD-SCAFFOLDING.md`
- D0-T2: Install shadcn/ui and add core components (see `DASHBOARD-COMPONENT-SELECTION.md`)
- D0-T3: Add utilities: React Query, Zustand, xterm, Recharts (no code yet)
- D0-T4: Create shared types file `lib/daashboard/types.ts`

Acceptance Criteria
- Pages/routes compile with placeholders; no runtime logic
- Components exist as stubs; build succeeds

Deliverables
- Scaffolded `app/(daashboard)/daashboard/*`
- Components in `components/daashboard/*`

---

### Phase 1: Layout, Navigation, Theming
Goals: Ship base layout, sidebar/header, breadcrumbs, toasts; set theme and color tokens.

Tasks
- D1-T1: Implement `layout.tsx` with sidebar menu and header
- D1-T2: Add `Breadcrumb`, `NavigationMenu`, `Toaster`
- D1-T3: Define color tokens and theme config (see `DASHBOARD-COMPANION-SPEC.md`)
- D1-T4: Build KPI `Card` and stream shell for Overview placeholders

Acceptance Criteria
- All pages render within shared layout; dark/light theme supported
- Keyboard accessible navigation (Tab, Enter, Esc)

Deliverables
- `app/(daashboard)/daashboard/layout.tsx`
- `components/daashboard/kpi-card.tsx`

---

### Phase 2: Data Layer (Types, API, SSE/WS hooks)
Goals: Implement client helpers and hooks for REST, SSE, and WS.

Tasks
- D2-T1: `lib/daashboard/api.ts` (REST wrappers, error handling)
- D2-T2: `lib/daashboard/sse.ts` (subscribe with backoff, filters)
- D2-T3: `lib/daashboard/ws.ts` (WS client for pty with heartbeat)
- D2-T4: React Query setup and base hooks (agents, sessions, jobs)

Acceptance Criteria
- REST calls work against dev MCP BFF endpoints (mock if needed)
- SSE reconnects with backoff; WS pings; no memory leaks

Deliverables
- `lib/daashboard/{api,sse,ws}.ts`

---

### Phase 3: Agents & Sessions (List + Detail skeleton)
Goals: Build Agents list and details (tabs with placeholders); Sessions list and details.

Tasks
- D3-T1: Agents list: filters, table, row actions (disabled wiring)
- D3-T2: Agent detail: header controls, `Tabs` (Timeline/Console/Sessions/Jobs/Variables/Config)
- D3-T3: Sessions list + detail transcript shell

Acceptance Criteria
- Navigation works; screens display real data via REST
- Loading/empty/error states present; no SSE yet

Deliverables
- `app/(daashboard)/daashboard/agents/*`
- `app/(daashboard)/daashboard/sessions/*`

---

### Phase 4: Jobs, Logs, Console (Global Shell)
Goals: Jobs queue/history, Logs tail page, Global Console with xterm.

Tasks
- D4-T1: Jobs page with `Table` and row actions (rerun/cancel)
- D4-T2: Logs page with filters and tail `ScrollArea`
- D4-T3: Console page: xterm in `Card`, controls, WS lifecycle

Acceptance Criteria
- Console connects to WS mock/real; can write/read; handles close
- Logs filter and paginate; jobs actions call REST

Deliverables
- `app/(daashboard)/daashboard/{jobs,logs,console}/page.tsx`
- `components/daashboard/console-panel.tsx`

---

### Phase 5: Events Integration & Timelines (SSE wired UI)
Goals: Wire SSE to live-update agents, sessions, jobs, and timeline.

Tasks
- D5-T1: Subscribe on Overview and Agent Detail Timeline
- D5-T2: Merge events into React Query cache (idempotent updates)
- D5-T3: Visual badges and toasts for errors/incidents

Acceptance Criteria
- Live updates visible within 1–2s; no UI freezes
- Timeline shows ordered entries with expandable details

Deliverables
- `components/daashboard/live-stream.tsx`

---

### Phase 6: Analytics (Tokens/Cost/Latency)
Goals: Basic analytics cards and charts using Recharts.

Tasks
- D6-T1: Aggregation calls (or mock) for tokens/cost/latency
- D6-T2: Charts in `Card` with concise legends
- D6-T3: Date range filters via `Popover`

Acceptance Criteria
- Charts render with sample/real data; time-range filters work

Deliverables
- `app/(daashboard)/daashboard/analytics/page.tsx`

---

### Phase 7: Settings & RBAC
Goals: Forms for connections/keys/limits; role-based route guards.

Tasks
- D7-T1: Settings forms with `Form`, validation, and `AlertDialog` for sensitive ops
- D7-T2: RBAC guard for routes and actions (viewer/operator/admin)

Acceptance Criteria
- Non-admin cannot access Settings; destructive actions confirm

Deliverables
- `app/(daashboard)/daashboard/settings/page.tsx`
- `lib/daashboard/rbac.ts`

---

### Phase 8: Polish, A11y, Perf, QA
Goals: Finalize accessibility, performance, and QA.

Tasks
- D8-T1: Audit focus states, roles, aria- attributes; add screen reader text
- D8-T2: Virtualize long lists/streams where needed
- D8-T3: Add empty/loading/error states everywhere; consistent toasts
- D8-T4: Smoke tests/manual checklist; docs review

Acceptance Criteria
- Lighthouse a11y ≥ 95; no console errors; smooth scrolling

Deliverables
- Updated components; QA checklist

---

## 5) Tracking & Index (Task IDs)
- D0-T1..D0-T4 → Scaffolding & deps
- D1-T1..D1-T4 → Layout/nav/theme
- D2-T1..D2-T4 → Data layer hooks
- D3-T1..D3-T3 → Agents/Sessions pages
- D4-T1..D4-T3 → Jobs/Logs/Console
- D5-T1..D5-T3 → SSE timelines and toasts
- D6-T1..D6-T3 → Analytics
- D7-T1..D7-T2 → Settings/RBAC
- D8-T1..D8-T4 → Polish/QA

Link docs:
- `DASHBOARD-COMPANION-SPEC.md`, `DASHBOARD-COMPONENT-SELECTION.md`, `DASHBOARD-SCAFFOLDING.md`, `DASHBOARD-ARCHITECTURE.md`, `DASHBOARD-MCP-INTEGRATION.md`, `DASHBOARD-API.md`, `DASHBOARD-ROUTES.md`, `DASHBOARD-IA.md`, `DASHBOARD-WIREFRAMES.md`, `DASHBOARD-DIAGRAMS.md`, `DASHBOARD-README.md`

---

## 6) References
- shadcn/ui components: https://ui.shadcn.com/
- MCP integration notes: `DASHBOARD-MCP-INTEGRATION.md`
- Design tokens, colors, components: `DASHBOARD-COMPANION-SPEC.md`
