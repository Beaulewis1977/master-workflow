# Routes & Layout (Next.js App Router)

```
app/
  (daashboard)/
    daashboard/
      layout.tsx           // sidebar + header + toasts
      page.tsx             // overview
      agents/
        page.tsx           // list
        [agentId]/
          page.tsx         // detail (tabs)
      sessions/
        page.tsx
        [sessionId]/
          page.tsx
      jobs/
        page.tsx
      console/
        page.tsx
      logs/
        page.tsx
      analytics/
        page.tsx
      settings/
        page.tsx
  api/
    agents/route.ts        // GET list, POST bulk actions (optional)
    agents/[id]/route.ts   // GET
    agents/[id]/actions/route.ts // POST { action }
    sessions/route.ts      // GET, POST create
    sessions/[id]/route.ts // GET
    sessions/[id]/message/route.ts // POST
    jobs/route.ts          // GET, POST create
    jobs/[id]/cancel/route.ts // POST
    logs/route.ts          // GET
    events/stream/route.ts // GET (SSE)
    agents/[id]/stream/route.ts // GET (SSE)
    sessions/[id]/stream/route.ts // GET (SSE)
    shell/route.ts         // POST (create pty)
    shell/[id]/write/route.ts // POST
    shell/[id]/route.ts    // DELETE
    shell/[id]/socket/route.ts // WS
```

## Layout Notes

- Sidebar navigation using `NavigationMenu`/custom sidebar
- `Suspense` boundaries per page with `Skeleton`
- SSE client hook for streams; reconnect with backoff
- Access control wrapper per route (RBAC)

Reference components: [shadcn/ui](https://ui.shadcn.com/)
