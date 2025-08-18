# Uninstaller Phased Execution Plan (Agent‑Ready, < 200k context per phase)

Purpose
- Provide a complete, chunked implementation plan that any agent can execute phase‑by‑phase within a large but bounded context window (≤ 200,000 tokens per phase). No destructive defaults; safety first.
- Companion to `UNINSTALLER-PLAN.md` (requirements). This document turns requirements into implementable work packages.

Guiding Principles
- Idempotent: safe to re‑run; no partial destructive states
- Preview first: dry‑run and plan review baked into the flow
- Manifest‑first: remove only what we installed; keep generated artifacts
- Git‑protect: never delete tracked files unless explicitly allowed
- Cross‑platform: Linux/macOS/WSL (bash) and Windows (PowerShell)

---

## Phase 0 — Scaffolding & Feature Flag (Non‑destructive)
Deliverables
- CLI subcommand scaffold: `./ai-workflow uninstall`
- Librarie stubs: `lib/uninstall/*` modules with no destructive actions
- OS shims (no‑op): `.ai-workflow/bin/uninstall.sh`, `.ai-workflow/bin/uninstall.ps1`
- Feature flag: hidden behind `AIWF_UNINSTALLER=true` until complete

Files to add
- `.ai-workflow/lib/uninstall/index.js` (entry)
- `.ai-workflow/lib/uninstall/manifest.js` (load/write helpers)
- `.ai-workflow/lib/uninstall/classifier.js` (mark remove/keep/unknown)
- `.ai-workflow/lib/uninstall/plan.js` (dry‑run plan builder)
- `.ai-workflow/lib/uninstall/process.js` (tmux/PID handling)
- `.ai-workflow/lib/uninstall/ui.js` (interactive prompts)
- `.ai-workflow/lib/uninstall/exec.js` (ordered deletions, currently stubbed)
- `.ai-workflow/lib/uninstall/report.js` (summary, logs)
- `.ai-workflow/bin/uninstall.sh` and `.ai-workflow/bin/uninstall.ps1` (call Node entry)

Acceptance
- `./ai-workflow uninstall --dry-run` prints “Uninstaller in preview mode; no changes.”
- Returns exit 0; detects platform; no file writes/removals.

---

## Phase 1 — Manifest Writers (Installers + Doc Generation)
Deliverables
- Installation manifest: `.ai-workflow/installation-record.json`
- Generation manifest: `.ai-workflow/generation-record.json`
- Writers integrated into installers and doc‑intelligence pipeline

Changes
- `install-modular.sh`, `install-production.sh`, `install-standalone.sh` record:
  - path, origin: `installed_system_asset|symlink_executable|ephemeral_cache_log`
  - installer version, timestamp
- Doc generation path updates record:
  - path, origin: `generated_document`
  - strategy: `merge|intelligent|replace`, backup path

Acceptance
- Fresh install produces valid JSON manifest(s)
- Re‑install appends without duplicates; includes version and timestamps

---

## Phase 2 — Classifier & Dry‑Run Plan (Non‑destructive)
Deliverables
- Classifier loads manifests; builds plan with 3 sets: `remove`, `keep`, `unknown`
- Heuristic fallback if manifests missing (as specified in `UNINSTALLER-PLAN.md`)
- JSON plan preview printed with counts, sizes

Plan schema (example)
```json
{
  "version": "1.0",
  "summary": { "remove": 123, "keep": 57, "unknown": 4 },
  "remove": [".ai-workflow/...", "ai-workflow"],
  "keep": [".agent-os/...", ".ai-dev/...", ".claude/CLAUDE.md"],
  "unknown": [".claude-flow/hive-config.json"],
  "notes": ["gitProtect=true", "backupRecommended=true"]
}
```

Acceptance
- `./ai-workflow uninstall --dry-run` prints structured plan and exits 0
- Heuristics respect conservative defaults (keep generated, prompt unknowns)

---

## Phase 3 — Interactive UI & Flags (Still Non‑destructive)
Deliverables
- TUI prompts to review details; adjust remove/keep per category/path
- Typed ack gate: `I UNDERSTAND AND ACCEPT`
- Flags: `--yes`, `--non-interactive`, `--keep-generated`, `--purge-caches`, `--git-protect`, `--ignore-git`

Acceptance
- Interactive flow displays summary, allows edits, and exits without changes if not confirmed
- Non‑interactive with `--dry-run` outputs plan and exits

---

## Phase 4 — Backup & Restore Points
Deliverables
- Backup archive: `~/.ai-workflow-uninstall-backups/<project>-<ts>.tar.gz` (Linux/macOS/WSL) or `.zip` (Windows)
- Includes manifests, selected keep/remove lists; optional files selected by user
- Restore instructions printed and saved

Acceptance
- `./ai-workflow uninstall --backup` creates archive; verifies readable; prints restore steps

---

## Phase 5 — Process & Session Handling
Deliverables
- Detect and stop tmux sessions with prefix `queen-agent-*` (if tmux present)
- Stop background supervisors/watchers started by the workflow
- Safe timeouts and SIGTERM→SIGKILL escalation on Linux/macOS; PowerShell equivalents on Windows

Acceptance
- Sessions and background processes are stopped before file operations; retries and clear messaging included

---

## Phase 6 — Execute Removal (Destructive; gated)
Deliverables
- Ordered deletion:
  1) symlinks/launchers (e.g., `ai-workflow`)
  2) logs/caches/supervisor/tmux‑scripts
  3) system directories (e.g., `.ai-workflow/**`)
- Path whitelist enforcement and traversal defense
- Git‑protect enforcement unless `--ignore-git`

Acceptance
- Interactive flow requires typed ack; non‑interactive requires `--yes`
- Only planned `remove` items are deleted; `keep` untouched

---

## Phase 7 — Reports & Post‑Checks
Deliverables
- Uninstall report: `~/.ai-workflow-uninstall-logs/<timestamp>.json`
- Post‑checks: confirm `ai-workflow` launcher removed; no tmux/supervisor left
- Clear next steps and how to restore from backup

Acceptance
- Report contains counts, paths, sizes, duration, exit code

---

## Phase 8 — Cross‑Platform Validation & E2E Tests
Deliverables
- Test matrix across Linux/macOS/Windows/WSL
- E2E scripts and fixtures simulating: fresh install, doc generation, edits, uninstall with/without manifests

Acceptance
- All scenarios pass; generated artifacts preserved by default; idempotent behavior verified

---

## Phase 9 — Documentation Updates
Deliverables
- `GPT5-DOCS/GITHUB-README.md`: Uninstall section with examples
- `GPT5-DOCS/USER-GUIDE.md`: Expanded uninstall usage and safety
- `SECURITY.md`: CI defaults (`--dry-run`), git‑protect policy

Acceptance
- Docs merged; commands copy‑pastable

---

# Work Packages (Sized for < 200k context)

WP‑0: CLI & Stubs
- Implement `uninstall` subcommand routing to `lib/uninstall/index.js`
- Create stub modules listed in Phase 0
- Output “preview mode” message; no file changes

WP‑1: Installation Manifest Writer
- Hook installers to write `installation-record.json`
- Ensure dedupe and version/timestamp fields

WP‑2: Generation Manifest Writer
- Hook doc‑intelligence/updater to append `generation-record.json`
- Record strategy and backup path

WP‑3: Classifier & Heuristics
- Implement classifier: manifests → remove/keep/unknown
- Implement conservative fallback rules (per plan)

WP‑4: Plan Builder & Pretty Printer
- Build JSON plan; compute counts/sizes; human‑readable table

WP‑5: UI Prompts & Flags
- Interactive review: categories and per‑path toggles
- Typed ack; parse `--yes`, `--non-interactive`, `--keep-generated`, `--purge-caches`, `--git-protect`

WP‑6: Backup/Restore
- Tar/zip creation per OS; include manifests and selected sets
- Print/save restore instructions

WP‑7: Process Handling
- Detect tmux sessions; stop supervisors/PIDs; timeouts and retries

WP‑8: Safe Removal Exec
- Ordered deletions; whitelist; traversal safety
- Respect git‑protect; implement `--ignore-git`

WP‑9: Reporting & Post‑Checks
- Write uninstall report; verify launcher removal; no active sessions

WP‑10: E2E Tests & Fixtures
- Scripts for matrix scenarios; CI friendly; `--dry-run` default in CI

WP‑11: Docs Update
- Update README/User Guide/Security with uninstall usage and safety

---

## Interfaces & Schemas (Summaries)

installation-record.json
```json
{
  "installerVersion": "3.0.0",
  "installedAt": "2025-08-13T12:34:56Z",
  "items": [
    { "path": ".ai-workflow/bin/ai-workflow", "origin": "symlink_executable" },
    { "path": ".ai-workflow/configs/orchestration.json", "origin": "installed_system_asset" }
  ]
}
```

generation-record.json
```json
{
  "updates": [
    { "path": ".claude/CLAUDE.md", "origin": "generated_document", "strategy": "intelligent", "backup": "~/.ai-dev-os/document-backups/2025-08-13/CLAUDE.md" }
  ]
}
```

uninstall-report.json
```json
{
  "startedAt": "...",
  "finishedAt": "...",
  "summary": { "removed": 120, "kept": 80, "unknownReviewed": 3 },
  "backup": "~/.ai-workflow-uninstall-backups/proj-2025-08-13.tar.gz",
  "exitCode": 0
}
```

---

## Risks & Rollback
- Risk: false‑positive deletions without manifests → Mitigation: conservative defaults + git‑protect + required confirmations
- Risk: process still running → Mitigation: detect/stop before removal; retries + forced stop
- Rollback: restore from backup archive; rerun install if needed

---

## Definition of Done
- All phases implemented and tested across platforms
- Default keeps generated artifacts; removes only installed assets
- Non‑interactive and interactive flows complete with backup, plan, report
- Documentation updated; CI green
