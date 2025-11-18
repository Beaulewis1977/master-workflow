# API Contracts (HTTP, SSE, WS)

All times ISO-8601 strings. IDs are opaque strings.

## Agents

GET `/api/agents`
```json
[
  {
    "id": "agent-1",
    "name": "Claude Ops",
    "type": "claude",
    "model": "claude-3-5",
    "status": "active",
    "tags": ["ops"],
    "lastActivityTs": "2025-06-10T12:34:56Z",
    "avgLatencyMs": 820
  }
]
```

GET `/api/agents/{id}`
```json
{
  "id": "agent-1",
  "name": "Claude Ops",
  "type": "claude",
  "model": "claude-3-5",
  "status": "active",
  "capabilities": ["chat", "jobs", "shell"],
  "metrics": {"cpuPct": 18.4, "memoryBytes": 209715200, "tokens24h": 128000, "cost24hUsd": 3.42}
}
```

POST `/api/agents/{id}/actions`
```json
{ "action": "pause" }
```

## Sessions

GET `/api/sessions`
```json
[
  {"id": "s1", "agentId": "agent-1", "state": "open", "startedAt": "2025-06-10T12:00:00Z"}
]
```

POST `/api/sessions`
```json
{ "agentId": "agent-1", "title": "Hotfix" }
```

POST `/api/sessions/{id}/message`
```json
{ "role": "user", "content": "Check the failing job" }
```

## Jobs

GET `/api/jobs`
```json
[{"id": "j1", "agentId": "agent-1", "type": "sync", "status": "running", "createdAt": "2025-06-10T12:10:00Z", "updatedAt": "2025-06-10T12:11:00Z"}]
```

POST `/api/jobs`
```json
{ "agentId": "agent-1", "type": "deploy", "inputs": {"env": "staging"} }
```

POST `/api/jobs/{id}/cancel`
```json
{}
```

## Logs

GET `/api/logs?agentId=agent-1&level=error&from=...&to=...`
```json
[{"timestamp": "2025-06-10T12:15:00Z", "level": "error", "message": "Timeout", "agentId": "agent-1"}]
```

## Events (SSE)

GET `/api/events/stream` (optional query: agentId, sessionId, types)

Event format:
```
event: job.progress
id: evt-123
retry: 5000
data: {"jobId":"j1","progress":72}
```

## Shell (WS + HTTP)

Create pty:
POST `/api/shell`
```json
{ "agentId": "agent-1" }
```

Write to pty:
POST `/api/shell/{id}/write`
```json
{ "data": "ls -la\n" }
```

Terminate:
DELETE `/api/shell/{id}`

WebSocket stream `/api/shell/{id}/socket` messages:
```json
{"type":"pty:read","data":"..."}
{"type":"pty:closed"}
```

Security: per-route RBAC; secrets server-only; CSRF on POST.

Reference components for UI: [shadcn/ui](https://ui.shadcn.com/)
