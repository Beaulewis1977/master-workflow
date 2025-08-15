# Text Wireframes (v1)

Monospace text wireframes to convey layout and content hierarchy.

## Overview

+--------------------------------------------------------------+
| Header: DAASHBOARD | Search [       ] | User □              |
+------------------+-------------------------------------------+
| Sidebar          |  KPIs: [Active Agents][Jobs][Errors][$]   |
| - Overview       |                                           |
| - Agents         |  Live Stream (filter: All | Errors | Jobs)|
| - Sessions       |  [evt time] [type] [agent] message        |
| - Jobs           |  [evt time] [type] [agent] message        |
| - Console        |                                           |
| - Logs           |  Incidents                                |
| - Analytics      |  [time][agent] message → [Open]           |
| - Settings       |                                           |
+------------------+-------------------------------------------+

## Agents (List)

[Search ________] [Status ▼] [Model ▼]                        
----------------------------------------------------------------
| Name         | Status  | Model        | Sessions | Last seen |
----------------------------------------------------------------
| Claude Ops   | active  | claude-3-5   | 3        | 2m ago    | ...

Row actions: Open | Pause/Resume | Restart | Stop | Console

## Agent Detail

Title: Claude Ops [active]   [Start][Stop][Pause][Restart]
Tabs: [Timeline][Console][Sessions][Jobs][Variables][Config]

Right rail metrics:
[CPU □□□□■ ] [Mem □□□■ ] [Tokens 24h] [$ 24h]

### Timeline Tab

[12:34:56] session.opened s1
[12:35:10] job.started j1 type=sync
[12:35:14] job.progress j1 72%
[12:36:00] job.completed j1 ok (820ms)

### Console Tab

Output (scroll) ...............................................
> Message input _____________________________________ [Send]
[Attach session ▼] [System msg] [Tokens: 1.2k] [Cost: $0.02]

### Sessions Tab

| ID  | State | Started        | Duration | Actions   |
|-----|-------|----------------|----------|-----------|
| s1  | open  | 12:34:56       | 00:08:20 | [Open]    |

### Jobs Tab

| ID  | Type   | Status    | Created       | Duration | Actions     |
|-----|--------|-----------|---------------|----------|-------------|
| j1  | sync   | succeeded | 12:35:10      | 00:00:50 | [Rerun][Log]|

### Variables Tab

| Name              | Value                          |
|-------------------|--------------------------------|
| OPENAI_API_KEY    | ********                       |
| MAX_TOKENS        | 4000                           |

### Config Tab

Model: [claude-3-5 ▼]  Temperature: [0.2]
[Save]

## Sessions (List)

| Title      | Agent       | State | Duration | Last activity |
|------------|-------------|-------|----------|---------------|

## Session Detail

Transcript (scroll)
> user: "Check the failing job"
> assistant: "Investigating..."
Side metrics: tokens, cost, latency
Actions: [End session] [Download transcript]

## Jobs

Queue:
| ID   | Agent      | Type   | Status   | Duration | Actions |

History similar; row expand shows logs.

## Console (Global Shell)

Terminal output (scroll)
> Command input _____________________________________ [Send]
[Attach to agent ▼] [Clear] [End]

## Logs

Filters: [Agent ▼][Level ▼][Time ▼][Search ___]    [Export]
Tail area with colorized levels and quick copy.

## Analytics

Cards + small charts: tokens/cost by agent, success rate, error types.

## Settings

Sections:
- Connections (MCP, providers)
- Secrets & keys
- Roles & permissions
- Limits & webhooks
