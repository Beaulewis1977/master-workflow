# DASHBOARD Companion Spec

Design tokens, component variants, accessibility, shortcuts, persistence, and deployment guidance to accompany the execution plan.

Reference components: https://ui.shadcn.com/

## 1) Design Tokens

Typography
- Family: Inter (UI), JetBrains Mono (code/console)
- Sizes: xs 12, sm 14, base 16, lg 18, xl 20, 2xl 24
- Weights: 400 normal, 600 semibold, 700 bold

Spacing (rem)
- 0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4

Radii
- sm 4px, md 6px, lg 10px, full 9999px

Shadows
- sm: subtle card, md: raised card, lg: modal depth

Color (Light)
- Background: #0B0C0E on dark, #FFFFFF on light
- Foreground: #0B0C0E (light), #EDEFF2 (dark)
- Primary: #4F46E5 (indigo-600)
- Accent: #0EA5E9 (sky-500)
- Success: #10B981 (emerald-500)
- Warning: #F59E0B (amber-500)
- Danger: #EF4444 (red-500)
- Muted: #6B7280 (gray-500)

Color (Dark)
- Background: #0B0C0E
- Surface: #111318
- Primary: #6366F1 (indigo-500)
- Accent: #38BDF8 (sky-400)
- Success: #34D399 (emerald-400)
- Warning: #FBBF24 (amber-400)
- Danger: #F87171 (red-400)
- Muted: #9CA3AF (gray-400)

Theme application via CSS variables/Tailwind config consistent with shadcn/ui.

## 2) Component Variants

Button
- Variants: default (primary), secondary (surface), destructive, ghost, outline
- Sizes: sm, md, lg; Icon-only uses square with `aria-label`

Badge
- Variants: success, warning, error, info, neutral → map to status

Card
- Variants: kpi (emphasis), neutral (default), inset (compact)

Tabs
- Use underline style; keep 5–6 tabs max per page

Table
- Sticky header, row hover; empty/loading/error states consistent

Dialog/AlertDialog
- Confirm destructive actions (stop, cancel, delete)

Toast
- Success (green), error (red), info (indigo); auto-dismiss 5s

Inputs
- Show helper text and inline error; label always present

Command
- Global palette for quick actions (Cmd/Ctrl+K)

## 3) Accessibility

- Keyboard: full Tab/Shift+Tab traversal; Enter/Space activate; Esc closes dialogs
- Labels: every control has `label` or `aria-label`
- Live regions: `aria-live=polite` for new stream items
- Contrast: >= 4.5:1 text; >= 3:1 for UI chrome
- Focus: visible focus ring on interactive elements

## 4) Keyboard Shortcuts

- Command Palette: Cmd/Ctrl+K
- Global search/filter: /
- Navigate: g then o (overview) / a (agents) / s (sessions) / j (jobs) / c (console) / l (logs) / y (analytics) / t (settings)
- Stream pause/resume: Space (on stream area)
- Console: Enter send, Shift+Enter newline, Cmd/Ctrl+L clear, Cmd/Ctrl+E end session

## 5) Content Guidelines

- Status: active, paused, error, stopped (avoid synonyms)
- Time: relative with tooltip absolute
- Errors: concise message + detail link; no secrets in UI
- Empty states: instructive text with next action

## 6) Persistence & Schema (Summary)

- Core: agents, sessions, messages, jobs, job_logs, events_archive, users, roles, permissions, settings, saved_views, pins, analytics_rollups
- Retention: rolling window for events in memory; archive to DB daily
- Exports: session transcript export (JSON/Markdown)

## 7) API Error Model

```json
{ "error": { "code": "string", "message": "string", "details": {} } }
```

- Use HTTP 4xx/5xx appropriately; include `requestId` header

## 8) SSE/WS Events (Summary)

- agent.status, session.opened, session.closed, job.started, job.progress, job.completed, log.entry, console.output, error
- workflow.queen_status, workflow.strategy_changed, workflow.broadcast, delegation.assigned, delegation.recalled, cohort.paused/resumed/drained

## 9) Performance

- Virtualize long tables/streams
- Debounce filters/search
- SSE backoff (1s→30s); WS heartbeat

## 10) Security & RBAC

- Roles: viewer, operator, admin
- CSRF on POST; server-only secrets; redact logs
- Confirmations for destructive actions

## 11) Testing & QA (v1)

- Smoke: navigate all pages; agents/sessions list render; SSE delivers; WS shell connect/disconnect
- A11y: keyboard-only pass; screen reader labels
- Perf: no long-task spikes during tailing

## 12) Deployment

- Env: MCP_BASE_URL, DB_URL, NEXT_RUNTIME=node for WS routes
- SSE via edge-friendly routes; WS on Node runtime
- Observability: basic request logging and timings
