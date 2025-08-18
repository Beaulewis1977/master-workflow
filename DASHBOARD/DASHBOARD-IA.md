# Information Architecture & User Flows

## Primary Personas

- Operator: monitors, triages, runs jobs, uses console
- Admin: configures connections, roles, secrets
- Viewer: read-only status and analytics

## Navigation Structure

- Overview
  - KPIs (agents, jobs, errors, tokens, cost)
  - Live event stream
  - Recent incidents
- Agents
  - List (filters, search)
  - Detail
    - Timeline
    - Console (chat)
    - Sessions
    - Jobs
    - Variables
    - Config
- Sessions
  - List
  - Detail (transcript, context, metrics)
- Jobs
  - Queue
  - History
  - Detail (logs, inputs/outputs)
- Console
  - Global shell/pty (attach to agent context optional)
- Logs
  - Central stream/tail
- Analytics
  - Usage, cost, success-rate
- Settings
  - Connections (MCP, providers)
  - Secrets & keys
  - Roles & permissions
  - Limits & webhooks

## Key User Flows

1) Observe agent health
- Open Overview → Scan KPIs → Filter event stream → Drill into Agent detail → Timeline

2) Intervene in stuck job
- Jobs → Filter `running`/`long` → Open → Inspect logs → Cancel or Rerun

3) Chat with agent
- Agents → Select agent → Console tab → Send message → View response and tokens

4) Start new workflow
- Jobs → Run job → Select agent & type → Provide inputs → Monitor queue and logs

5) Investigate error
- Overview → Incidents → Open log → View stack & context → Jump to Session/Agent

6) Operate shell
- Console → Start shell (pty) → Attach to agent or system → Run commands → End session

7) Configure provider
- Settings → Connections → Add/validate → Set limits → Save

## Information Priorities

- Always show current status and last activity for agents and sessions
- Keep destructive actions behind confirmation (AlertDialog)
- Preserve last filters and open tabs per user (local storage)
- Stream updates first; hydrate historical data in background

Reference components: [shadcn/ui](https://ui.shadcn.com/)
