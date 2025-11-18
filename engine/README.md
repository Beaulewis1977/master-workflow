Master Workflow Engine (Phase 2)

- CLI + Fastify API + SQLite (better-sqlite3)
- Logging via pino
- Migrations under `migrations/`

Quickstart

```
cd engine
npm install
npm run build
npm run cli migrate
npm run start  # starts API on 13800
# or
npm run dev    # ts-node dev server
```

Endpoints
- GET `/health` → `{ status: 'ok' }`
- GET `/api/components` → sample registry
- POST `/api/install` → queues install and returns id
- GET `/api/install/:id/status` → install status
- POST `/api/convo/:sessionId/message` → basic echo reply
- GET `/api/env/scan` → stubbed env scan


