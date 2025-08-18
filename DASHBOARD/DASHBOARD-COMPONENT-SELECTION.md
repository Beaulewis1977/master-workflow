# Selected shadcn/ui Components (by Screen)

Reference: [shadcn/ui](https://ui.shadcn.com/)

## Core Primitives (Install These)

- Layout & Navigation: `navigation-menu`, `breadcrumb`, `separator`, `sheet`, `resizable`, `scroll-area`
- Inputs & Forms: `form`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `slider`, `switch`, `label`
- Actions: `button`, `dropdown-menu`, `toggle`
- Content & Structure: `card`, `tabs`, `accordion`, `dialog`, `alert-dialog`, `popover`
- Data Display: `table`, `badge`, `skeleton`, `progress`, `tooltip`, `avatar`
- Search & Command: `command`
- Feedback: `toast`

Non-shadcn utilities:
- Charts: `recharts` (or `victory`)
- Terminal: `xterm`
- Icons: `lucide-react`

## Screen-to-Component Mapping

### Overview
- KPIs: `card`, `badge`
- Live event stream: `scroll-area`, `accordion`, `badge` (levels)
- Incidents list: `table`, `dropdown-menu` (row actions), `tooltip`

### Agents (List)
- Filters/search: `input`, `select`, `command` (quick search)
- Data table: `table`, `badge` (status), `dropdown-menu` (row actions), `skeleton`

### Agent Detail
- Header controls: `button`, `dropdown-menu`, `badge`
- Tabs: `tabs` (Timeline, Console, Sessions, Jobs, Variables, Config)
- Timeline: `accordion`, `badge`, `tooltip`
- Console (chat): `textarea` (input), `button`, `scroll-area` (output); terminal variant uses `xterm` inside `card`
- Metrics rail: `card`, `progress`, small charts (Recharts) with `card`
- Config & variables: `form`, `input`, `select`, `checkbox`, `switch`, `label`, `dialog` (confirm)

### Sessions
- List: `table`, `badge`, `skeleton`
- Detail: transcript `scroll-area`; actions `button`, `dropdown-menu`

### Jobs
- Queue/history: `table`, `dropdown-menu` (cancel/rerun/view logs), row expand with `accordion`

### Console (Global Shell)
- Terminal: `card` container + `xterm` for the viewport; controls `button`, `select`

### Logs
- Tail view: `scroll-area`, inline color coding; filters `select`, `input`, `toggle`, export `button`

### Analytics
- Charts: Recharts within `card`; selectors `select`, `popover` (date filter), `button`

### Settings
- Forms: `form`, `input`, `select`, `checkbox`, `switch`, `dialog` (confirm), `alert-dialog` (destructive)

## Variants & Usage Notes
- `button`: use `default`, `secondary`, `destructive`, `ghost` for table row actions
- `badge`: status color mapping (active=green, paused=yellow, error=red, stopped=gray)
- `table`: sticky header for long lists; use `skeleton` on initial load
- `tabs`: keep label count minimal; persist active tab in URL query
- `accordion`: for event/timeline details; default to collapsed for performance
- `dialog`/`alert-dialog`: confirmation for stop/restart/cancel
- `toast`: success/error feedback for mutations
- `command`: quick jump to agents/sessions/jobs (Cmd/Ctrl+K)
- `popover`: compact date/time filters for logs/analytics
- `resizable`: optional split panes for console and details

## Install Commands (Reference)

```bash
# Initialize (if not already)
npx shadcn@latest init --yes

# Add selected components
npx shadcn@latest add \
  button card table tabs input textarea select checkbox radio-group slider switch label \
  dropdown-menu toggle dialog alert-dialog toast badge tooltip separator scroll-area \
  navigation-menu breadcrumb sheet resizable accordion popover command avatar

# Icons
npm i lucide-react

# Utilities
npm i @tanstack/react-query zustand xterm recharts
```

## Accessibility
- Use `label` with all interactive inputs
- Provide `aria-live` regions for real-time stream updates
- Ensure keyboard access for `dropdown-menu`, `dialog`, `command`

## Theming & Density
- Use default shadcn theme; keep density compact where tables/streams are present
- Prefer semantic variants over custom CSS to reduce surface area
