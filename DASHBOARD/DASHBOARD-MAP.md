# Screen Map & Sitemap

## High-Level Map

- Overview
  - KPIs
  - Live stream
  - Incidents
- Agents
  - List
  - Detail: Timeline, Console, Sessions, Jobs, Variables, Config
- Sessions
  - List
  - Detail
- Jobs
  - Queue, History, Detail
- Console (global shell)
- Logs (tail, filters)
- Analytics (usage, cost, success)
- Settings (connections, secrets, roles, limits)

## Mermaid Sitemap

```mermaid
graph TD
  root[/daashboard/] --> A[overview]
  root --> B[agents]
  root --> C[sessions]
  root --> D[jobs]
  root --> E[console]
  root --> F[logs]
  root --> G[analytics]
  root --> H[settings]
  B --> B1[agents/[agentId]]
  C --> C1[sessions/[sessionId]]
```
