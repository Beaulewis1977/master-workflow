## GPT5-AUDIT: MASTER-WORKFLOW Comprehensive Architecture and Code Audit

This document provides a deep, end-to-end audit of the MASTER-WORKFLOW repository and its integrated subsystems (Claude Flow 2.0.x, Agent OS, Claude Code sub-agents, optional tmux orchestration), including code-level findings, security and reliability considerations, cross-platform readiness, observability, and a prioritized improvement roadmap. It consolidates and expands everything discussed in this chat into a single authoritative artifact.

### Scope and inputs
- Codebase: current repository state (classifiers: workflow orchestration, intelligence engine, simple-workflow, tmux scripts, configs)
- OS context: Windows 10 (PowerShell 7), project path on Windows
- External references and alignment targets:
  - Claude Flow v2.0.0 release narrative and capabilities [link](https://github.com/ruvnet/claude-flow/issues/113)
  - Agent OS repository [link](https://github.com/buildermethods/agent-os)
  - Tmux-Orchestrator patterns [link](https://github.com/Jedward23/Tmux-Orchestrator)
  - Claude Code sub-agents documentation [link](https://docs.anthropic.com/en/docs/claude-code/sub-agents)


## Executive summary

- The system offers two orchestration paths:
  - A modular, cross-platform workflow runner that can operate without tmux (preferred on Windows), using background processes.
  - A tmux-based orchestration path designed for 24/7 sessions with multi-window setups.
- It performs project analysis, selects an approach (Simple Swarm, Hive-Mind, or Hive-Mind + SPARC), optionally generates tailored documentation, and then executes Claude Flow commands.
- Simple Workflow provides a JSON-driven, on-demand automation layer that orchestrates Claude, Agent OS, Claude Flow, and sub-agents without requiring tmux.
- Integrations with Agent OS and Claude Code are present. Full runtime “swarm” supervision is delegated to Claude Flow or tmux.

Top priorities to address:
- Cross-platform reliability: shell commands and tools (sh, grep, at, tmux) are Linux-centric; harden Windows paths and fallbacks.
- Command execution robustness: avoid naive `split(' ')` and shell-dependent concatenations; adopt safe, portable process spawning.
- Fix document customizer logic issues; ensure output is consistently written when appropriate.
- Make tmux optional and safe-by-default; provide explicit Windows alternatives.
- Gate “YOLO”/dangerous permissions behind explicit opt-in and CI checks.


## Current architecture and flow

### High-level pipeline
1) Analyze project complexity → 2) Select orchestration approach → 3) Initialize agents/docs → 4) Execute orchestrated commands (Claude Flow and/or Claude Code) → 5) Optional: 24/7 tmux orchestration

### Key components
- Intelligence Engine
  - `complexity-analyzer.js`: heuristics-based analysis across size, dependencies, architecture, tech stack, features, team, deployment, testing.
  - `approach-selector.js`: maps analysis to `simpleSwarm` | `hiveMind` | `hiveMindSparc`; composes Claude Flow commands and versions.
  - `document-customizer.js`: prepares customized CLAUDE.md, Agent OS instructions, SPARC docs, tech-specific workflows, CONTRIBUTING/DEPLOYMENT/ARCHITECTURE docs.
  - `project-scanner.js`: Node-based recovery/incomplete-work scanning.
- Orchestration Runners
  - `workflow-runner-modular.js`: cross-platform oriented; can operate without tmux and manage background processes.
  - `workflow-runner.js`: tmux-aware legacy runner; manages sessions and Claude Flow CLI.
- Simple Workflow (no-tmux, JSON-driven, on-demand)
  - `simple-workflow/scripts/run-workflow.sh` and `workflows/*.json` drive Claude, Agent OS, Claude Flow, and sub-agents sequentially/optionally in parallel.
- Tmux Scripts (optional)
  - `tmux-scripts/orchestrate-workflow.sh`: multi-window session orchestration following Tmux-Orchestrator patterns.
- Configuration
  - `configs/` for approaches, mappings, orchestration design, integrations, tech-stack patterns, recovery, communication protocol.


## Detailed findings (with citations)

### A. Command execution and cross-platform gaps

1) Legacy runner uses Linux shells directly (breaks on Windows; brittle quoting):
```14:408:workflow-runner.js
// ...
this.log('info', `Executing: ${command}`);

// Execute in background
const child = spawn('sh', ['-c', command], {
  cwd: this.projectDir,
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe']
});
```

2) Grep-based scanning (Linux-only) in recovery path, duplicating Node scanner functionality:
```150:171:workflow-runner.js
// Find TODOs, FIXMEs, HACKs via grep
const { stdout } = await execAsync(
  `grep -r "${pattern}" "${this.projectDir}" --exclude-dir=node_modules --exclude-dir=.ai-workflow --exclude-dir=.git 2>/dev/null || true`
);
```

3) Modular runner’s naive tokenization breaks quoting/paths:
```399:405:workflow-runner-modular.js
const [cmd, ...args] = command.split(' ');
const child = spawn(cmd, args, {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe']
});
```

4) Approach selector composes chained commands with `&&` in a single string (fragile across spawn paths):
```311:317:intelligence-engine/approach-selector.js
// SPARC wizard appended with &&
baseCommand += ' && npx claude-flow' + version + ' sparc wizard --interactive';
```

5) tmux scheduling uses `at`, often missing; Linux-only:
```18:21:tmux-scripts/schedule-checkin.sh
at_time=$(date -d "+${CHECK_IN_TIME} minutes" +"%H:%M")
echo "tmux send-keys -t ${SESSION_NAME}:orchestrator '/agents status' C-m" | at "$at_time" 2>/dev/null
```

6) Plan indicates elevated privileges in places (consider Windows and least-privilege defaults):
```167:167:GPT5-PLAN.MD
  "requiresSudo": true,
```


### B. Document Customizer bugs and formatting issues

Duplicate declarations cause runtime errors and overwrite state:
```43:50:intelligence-engine/document-customizer.js
const projectInstructionsPath = path.join(this.projectPath, '.ai-dev', 'project-instructions.md');
let projectInstructions = '';
// ... reads instructions
```
```60:67:intelligence-engine/document-customizer.js
const projectInstructionsPath = path.join(this.projectPath, '.ai-dev', 'project-instructions.md');
let projectInstructions = '';
// ... duplicated block
```

Formatting glitch in stage instructions section:
```279:281:intelligence-engine/document-customizer.js
## Project-Specific Instructions

${stage} Stage)
```


### C. Missing/assumed utilities and assets

- MCP registry generator referenced but not present in repo (validate availability or vendor it):
```1735:1739:install-modular.sh
node "$INSTALL_DIR/lib/mcp-discover.js" "$INSTALL_DIR/configs/mcp-registry.json" >/dev/null 2>&1 || true
```

- tmux brace expansions and window loops assume GNU tooling; not portable to all shells.


### D. Observability gaps

Docs reference dashboards/event bus and hook streams; code currently writes JSON lines to `.ai-workflow/logs/` but lacks an actual status API or SSE stream.


## Security, reliability, and governance

- **Dangerous modes**: `--dangerously-skip-permissions` and “YOLO” should be disabled by default, clearly surfaced when enabled, and blocked in CI.
- **Command injection/quoting risk**: Concatenating commands with `&&` and naive splitting can lead to quoting errors or unsafe expansions. Use safe process spawning with explicit args.
- **Auto-commit loops**: tmux scripts auto-committing every 30 minutes should be opt-in to avoid unintended commits.
- **Spec hygiene**: Agent OS should remain the source of truth; enforce updates to `.agent-os/*` during workflows to avoid drift between code and generated docs/memory.


## Cross-platform readiness (Windows/macOS/Linux)

Recommended defaults and strategies:
- Prefer the modular runner on Windows; only use tmux when WSL2 or native tmux is present.
- Replace Linux-only paths with Node/portable functions:
  - Replace `spawn('sh', ['-c', ...])` with `spawn(command, { shell: true })` or a robust cross-platform runner (e.g., execa) where needed.
  - Replace grep/awk/sed parsing with Node-based scanning (reuse `project-scanner.js`).
  - Avoid `at`; prefer internal timers or OS-native schedulers (Windows Task Scheduler) when needed.
- Keep `requiresSudo: true` strictly opt-in; provide Windows alternatives and least-privilege defaults.


## Alignment to external ecosystems

- **Claude Flow v2.0.0**: Current integration invokes CLI (swarm/hive-mind/sparc) and handles version tags. To fully embrace v2.0.0, add commands for neural training, persistent memory operations, and expose version policy centrally. See release narrative examples [link](https://github.com/ruvnet/claude-flow/issues/113).
- **Agent OS**: Solid document-centric integration (instructions/specs). Enforce gates that verify required specs exist/updated before executing Claude Flow runs. Repo: [link](https://github.com/buildermethods/agent-os).
- **Tmux-Orchestrator**: Patterns match Jedward23’s multi-window approach. Make it explicitly optional, recommend WSL2 for Windows, and document non-tmux fallbacks. Repo: [link](https://github.com/Jedward23/Tmux-Orchestrator).
- **Claude Code sub-agents**: Agents scaffold to `.claude/agents`, Simple Workflow drives sub-agent prompts. Adopt auto-delegation policies and lifecycle hooks per docs [link](https://docs.anthropic.com/en/docs/claude-code/sub-agents).


## Code-level issue list (actionable)

1) Replace legacy shell exec and grep with Node/portable alternatives
- Files:
  - `workflow-runner.js` (shell spawn, grep in recovery)
  - `tmux-scripts/*` (Linux tooling)
- Fix:
  - Use `project-scanner.js` for all recovery scans.
  - Use a cross-platform runner (execa or `spawn` with `shell: true` and carefully quoted args) for single-command execution; avoid embedding `&&` in strings.

2) Harden `workflow-runner-modular.js` process spawning
- File:
  - `workflow-runner-modular.js` (naive `split(' ')`)
- Fix:
  - Preserve full command by executing with `shell: true` or pass `[cmd, ...args]` using a proper argument builder; avoid manual splitting.

3) Fix Document Customizer duplicates and formatting
- File:
  - `intelligence-engine/document-customizer.js`
- Fix:
  - Remove duplicated `projectInstructionsPath`/`projectInstructions` block.
  - Correct stage header to: `## Stage-Specific Instructions (${stage})`.
  - Ensure callers persist the generated docs to disk (or add a write mode to the customizer when executed as a CLI).

4) Make tmux scripts optional and OS-aware
- Files:
  - `tmux-scripts/orchestrate-workflow.sh`, `tmux-scripts/schedule-checkin.sh`
- Fix:
  - Guard features behind checks; if `tmux`/`at` are missing, print guidance and fall back to process mode.

5) Provide or remove references to missing MCP discovery utility
- File:
  - `install-modular.sh` references `lib/mcp-discover.js`
- Fix:
  - Vendor the script or change the integration to a documented manual step.

6) CI/policy hardening
- Add CI checks to fail on YOLO/dangerous modes, ensure cross-platform test matrix (Windows/macOS/Linux), and run a small set of smoke tests for each runner mode.


## Quick wins (1–3 days)

- **Fix Document Customizer** duplicates and formatting.
- **Unify recovery scanning** on `project-scanner.js` — remove grep calls.
- **Harden command execution** paths (no `split(' ')`; use `shell: true` or execa with properly quoted args).
- **Default to process mode** on Windows; only show tmux guidance when tmux is available.
- **Gate YOLO** behind an explicit env var; print a clear warning when enabled; disable in CI.


## Medium-term improvements (1–2 weeks)

- **Version policy module**: Centralize `CLAUDE_FLOW_VERSION` and remove duplicated version-attachment logic across modules.
- **Claude Flow v2.0.0 features**: Add commands for neural training/memory; feature-flag experimental flows and surface metrics/logging around them. Reference: [link](https://github.com/ruvnet/claude-flow/issues/113).
- **Sub-agent lifecycle**: Implement auto-delegation policies and agent capability matching (e.g., `test-engineer`, `security-auditor`); integrate with `.claude/settings.json` and document delegation heuristics. Reference: [link](https://docs.anthropic.com/en/docs/claude-code/sub-agents).
- **Observability**: Provide a minimal status server (Express) with JSON + SSE to stream prompt/tool/response/approach-change events; wire hooks to emit events to that bus.
- **MCP discovery**: Supply the missing discovery script or offer manual registry creation; summarize discovered servers/tools in `CLAUDE.md`.


## Longer-term architecture

- **Unify on modular runner** as the primary path; treat `workflow-runner.js` as tmux-only specialization (or deprecate after parity).
- **Formal event bus**: Internal pub/sub with metrics, state snapshots, and selective persistence (bounded, rotated log files). Expose `/events/stream` SSE endpoint and `/` status JSON.
- **Strategy gates**: Before invoking Claude Flow, verify preconditions (e.g., Agent OS specs exist/updated for the chosen approach) and short-circuit with actionable messages if missing.
- **Test suite**: Unit tests for analysis/selection/customization; integration tests running on a matrix (Windows/macOS/Linux); smoke tests that simulate each approach and assert correct command composition.


## Illustrative improvements (snippets)

### Safer process execution (portable)
```md
- Prefer: spawn(command, { shell: true, cwd, detached, stdio })
- Or use execa: execa(command, { shell: true, all: true, cwd }) for better output handling
- Avoid: splitting on spaces; avoid embedding `&&` inside command strings you later tokenize
```

### Replace grep-based scans with Node scanner
```md
- Use intelligence-engine/project-scanner.js for TODO/FIXME/NotImplemented/skipped tests
- Single source avoids duplication and OS-specific shell behavior
```

### Observability skeleton (SSE)
```md
GET /         -> returns JSON snapshot of last N events and health
GET /events   -> returns JSON stream (SSE) of events: prompt, tool, response, approach_change
```


## References

- Claude Flow v2.0.0 – Revolutionary AI Swarm Orchestration Platform (release narrative/examples): [link](https://github.com/ruvnet/claude-flow/issues/113)
- Agent OS (spec-driven planning system): [link](https://github.com/buildermethods/agent-os)
- Tmux-Orchestrator patterns: [link](https://github.com/Jedward23/Tmux-Orchestrator)
- Claude Code sub-agents docs: [link](https://docs.anthropic.com/en/docs/claude-code/sub-agents)


## Appendix: Selected code citations

Legacy runner shell spawn on Linux-only shell:
```14:408:workflow-runner.js
const child = spawn('sh', ['-c', command], {
  cwd: this.projectDir,
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe']
});
```

Modular runner naive argument splitting:
```399:405:workflow-runner-modular.js
const [cmd, ...args] = command.split(' ');
const child = spawn(cmd, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
```

Approach selector chaining commands with `&&`:
```311:317:intelligence-engine/approach-selector.js
baseCommand += ' && npx claude-flow' + version + ' sparc wizard --interactive';
```

Document Customizer duplicate declarations and formatting glitch:
```43:50:intelligence-engine/document-customizer.js
const projectInstructionsPath = path.join(this.projectPath, '.ai-dev', 'project-instructions.md');
let projectInstructions = '';
```
```60:67:intelligence-engine/document-customizer.js
const projectInstructionsPath = path.join(this.projectPath, '.ai-dev', 'project-instructions.md');
let projectInstructions = '';
```
```279:281:intelligence-engine/document-customizer.js
## Project-Specific Instructions

${stage} Stage)
```

Schedule check-in via `at` (Linux-only):
```18:21:tmux-scripts/schedule-checkin.sh
echo "tmux send-keys -t ${SESSION_NAME}:orchestrator '/agents status' C-m" | at "$at_time"
```

Requires sudo flag in plan (ensure least-privilege alternatives):
```167:167:GPT5-PLAN.MD
  "requiresSudo": true,
```


---

This audit was generated to include and expand on all items discussed in our chat, consolidating findings, code citations, and recommendations into one actionable document.


