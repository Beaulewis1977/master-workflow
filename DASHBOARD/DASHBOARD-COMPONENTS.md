# UI Components & Composition

Using shadcn/ui building blocks. Reference: [https://ui.shadcn.com/](https://ui.shadcn.com/)

## Shared

- Shell: layout `ResizablePanel` + `ScrollArea`
- Header: `Breadcrumb`, global actions (`DropdownMenu`, `Button`)
- Filters: `Command` dialog for quick filter/search
- Feedback: `Toast`, `AlertDialog`

## Overview Page

- KPI cards: `Card` + `Badge`
- Live stream: `ScrollArea` + virtual list; each entry wraps `Accordion` for details
- Incidents: `Table` with level badges and quick actions

## Agents

- List: DataTable pattern using `Table`, `Input` (search), `DropdownMenu` (row actions)
- Detail: `Tabs` (Timeline, Console, Sessions, Jobs, Variables, Config)
  - Timeline: `Accordion` entries with metadata
  - Console: `Textarea` input, output in code-styled `ScrollArea` (or xterm.js)
  - Metrics rail: `Card` + small `Progress`/sparklines

## Sessions

- List: `Table` with status `Badge`
- Detail: transcript (`ScrollArea`), side metrics, actions

## Jobs

- Queue/History: `Table`; row expand for logs; actions in `DropdownMenu`

## Logs

- Tail view: `ScrollArea` + level color coding; filter chips (`Badge` + `Toggle`)

## Analytics

- Charts in `Card` wrappers with concise legends

## Forms

- Settings and job forms use `Form`, `Input`, `Select`, `Switch`, `Checkbox`, `Slider` as needed

## State & Data Layer

- React Query for server state (queries/mutations)
- SSE hook for event streams (auto-retry)
- WebSocket only for shell/pty streams
- Lightweight UI state in Zustand (filters, tabs, panel sizes)
