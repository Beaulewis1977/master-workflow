# Scaffolding (Design Only)

This is a planning guide for setting up the dashboard when we choose to implement. No code is generated yet.

## Directory Layout

```
app/
  (daashboard)/
    daashboard/
      layout.tsx
      page.tsx
      agents/
        page.tsx
        [agentId]/page.tsx
      sessions/
        page.tsx
        [sessionId]/page.tsx
      jobs/page.tsx
      console/page.tsx
      logs/page.tsx
      analytics/page.tsx
      settings/page.tsx
  api/
    agents/route.ts
    agents/[id]/route.ts
    agents/[id]/actions/route.ts
    sessions/route.ts
    sessions/[id]/route.ts
    sessions/[id]/message/route.ts
    jobs/route.ts
    jobs/[id]/cancel/route.ts
    logs/route.ts
    events/stream/route.ts
    agents/[id]/stream/route.ts
    sessions/[id]/stream/route.ts
    shell/route.ts
    shell/[id]/write/route.ts
    shell/[id]/route.ts
    shell/[id]/socket/route.ts
components/
  daashboard/
    kpi-card.tsx
    live-stream.tsx
    data-table.tsx
    agent-header.tsx
    agent-metrics-rail.tsx
    console-panel.tsx
    job-run-form.tsx
    filters-bar.tsx
lib/
  daashboard/
    api.ts
    sse.ts
    ws.ts
    types.ts
    rbac.ts
    events.ts
    storage.ts
```

## shadcn/ui Setup (Reference)

- Initialize shadcn/ui:
```bash
npx shadcn@latest init --yes
```
- Add core components (expand as needed):
```bash
npx shadcn@latest add button card table tabs input textarea select dropdown-menu dialog alert-dialog toast badge tooltip separator scroll-area navigation-menu sheet toggle switch form progress skeleton breadcrumb resizable
```

## Packages (Reference)

```bash
npm i zustand @tanstack/react-query xterm recharts
```

## Client Utilities (Planned)

- `lib/daashboard/api.ts`: REST helpers (fetch wrappers, React Query hooks)
- `lib/daashboard/sse.ts`: SSE subscribe with backoff and abort support
- `lib/daashboard/ws.ts`: WS client for pty with heartbeats
- `lib/daashboard/types.ts`: shared types from design
- `lib/daashboard/rbac.ts`: role checking helper
- `lib/daashboard/events.ts`: event type guards and mappers

## Server Utilities (Planned)

- MCP adapter: server-only module that talks to MCP server
- SSE route helpers: transform MCP events to UI events
- Shell WS: pty proxy with lifecycle and auth
- Persistence: DB client (Prisma/Drizzle) + migrations

## Page Composition Hints

- Use `layout.tsx` with sidebar nav and `Toaster`
- Each page uses `Suspense` + `Skeleton`
- Data tables are filterable/searchable; use accessible semantics

Reference components: https://ui.shadcn.com/
