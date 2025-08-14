# Interactive Uninstaller Plan (Do Not Implement Yet)

Goal
- Provide a safe, interactive uninstaller that removes all files and artifacts that came with the workflow system while preserving all project documents and files generated during usage.
- Cross‑platform support: Linux/macOS/WSL (bash) and Windows (PowerShell). Non‑interactive flags for CI/automation.

Scope
- Installed per‑project alongside the workflow system (as part of installers).
- Available via CLI: `./ai-workflow uninstall` and OS scripts: `.ai-workflow/bin/uninstall.sh`, `.ai-workflow/bin/uninstall.ps1`.

Outcomes
- Remove only “installed system assets.”
- Keep “generated project artifacts” (docs/specs/code) by default.
- Remove ephemeral caches/logs/sessions.
- Offer dry‑run, full preview, backup/restore point, and optional overrides.

---

1) File Classification Strategy

A. Manifest‑driven primary method
- Create and maintain an installation manifest at install time:
  - Path: `.ai-workflow/installation-record.json`
  - Records: each file/directory path, origin (`installed_system_asset` | `generated_document` | `ephemeral_cache_log` | `symlink_executable`), source installer version, timestamp
- Document generation also appends to a generation log:
  - Path: `.ai-workflow/generation-record.json`
  - Records: generated paths, generation strategy (merge/intelligent/replace), backup location

B. Fallback heuristic (if manifests missing)
- Default remove:
  - `.ai-workflow/**` (except generation manifests/backups, preserved separately)
  - `ai-workflow` symlink/launcher in project root
  - `.ai-workflow/logs/**`, `.ai-workflow/supervisor/**`, `.ai-workflow/tmux-scripts/**`
- Conditional remove with user confirmation:
  - `.claude/agents/**` and `.claude/commands/**` if created by installer (detected by headers/markers)
  - `.claude-flow/memory/**`, `.claude-flow/hive-config.json` (keep by default if project wants history; prompt)
- Always keep by default (generated project docs):
  - `.claude/CLAUDE.md` and any merged CLAUDE.md
  - `.agent-os/**` (instructions, specs)
  - `.ai-dev/**` (analysis, approach reasoning)
  - Any code/assets created in project directories outside `.ai-workflow/`

C. Git‑protection mode
- If a target file is tracked and not present in manifests as `installed_system_asset`, require explicit confirmation
- Optional flag `--ignore-git` to bypass (not default)

---

2) User Experience Flow (Interactive)

1. Detection phase
   - Load manifests; classify assets into Remove/Keep/Unknown
   - Scan for active tmux sessions and background processes

2. Summary screen
   - Show counts/sizes for: System assets to remove, Generated artifacts to keep, Caches/logs to purge, Unknowns to review
   - Offer options:
     - [R] Review details
     - [B] Create backup (recommended)
     - [K] Adjust keep/remove rules (per category or per path)
     - [D] Dry‑run (show what would change)
     - [C] Continue

3. Backup (optional but recommended)
   - Create tarball/zip at `~/.ai-workflow-uninstall-backups/<project-name>-<timestamp>.tar.gz`
   - Include manifests and selected keep/remove lists

4. Confirmation
   - Require typed ack: `I UNDERSTAND AND ACCEPT`

5. Execution
   - Stop processes: terminate tmux sessions with `queen-agent-*` prefix; stop supervisors/watchers
   - Remove paths in Remove list (safe ordering, directories last)
   - Preserve Keep list untouched

6. Post‑checks and report
   - Verify CLI symlink removal; ensure no active processes remain
   - Write final report to `~/.ai-workflow-uninstall-logs/<timestamp>.json`
   - Show restore instructions if backup created

---

3) Non‑Interactive/Advanced Flags

- `--dry-run` (default true in CI): print plan, exit 0
- `--yes` or `--non-interactive`: proceed without prompts
- `--keep-generated=true|false` (default true)
- `--purge-caches=true|false` (default true)
- `--git-protect=true|false` (default true)
- `--backup=path` (create backup before removal)
- `--ignore-git` (override git protection)

---

4) Implementation Components (to be built later)

- CLI entrypoint
  - Add `uninstall` subcommand to `.ai-workflow/bin/ai-workflow`
  - Node.js orchestrator `lib/uninstall.js` coordinating OS‑specific helpers
- OS‑specific helpers
  - `.ai-workflow/bin/uninstall.sh` (bash)
  - `.ai-workflow/bin/uninstall.ps1` (PowerShell)
- Manifests
  - Writer: update `install-modular.sh` to record installed assets
  - Writer: update doc‑intelligence pipeline to record generated docs
- Process management
  - Utilities to list/kill tmux sessions and background PIDs
- Safety
  - Confirmation prompt; typed ack; path whitelist; path traversal protection
- Reporting
  - Uninstall logs; exit codes; backup/restore instructions

---

5) What Gets Removed vs Kept (Defaults)

Removed (by default)
- `.ai-workflow/**` (engine, configs, hooks, logs, supervisor, tmux‑scripts)
- `ai-workflow` symlink/launcher
- `.claude/agents/**` and `.claude/commands/**` if recorded as installed templates
- `.claude-flow/memory/**` (optional; prompt if large)

Kept (by default)
- `.claude/CLAUDE.md` and other customized docs
- `.agent-os/**` specs/instructions
- `.ai-dev/**` analysis/approach
- Any code and assets created outside workflow system folders

Prompted (review)
- `.claude-flow/hive-config.json` (often useful to keep history)
- Unknown items under `.claude/**` with edits (offer per‑file choice)

---

6) Safety & Recovery

- Backups include manifests and optional kept/removed items
- Restore guidance: how to place back preserved items if removed by mistake
- Git‑protection: never remove unmanifested tracked files without explicit override
- CI: `--dry-run` default; `--yes` required to execute

---

7) Test Plan

Matrix
- OS: Linux, macOS, Windows (PowerShell), WSL
- Modes: interactive, non‑interactive, dry‑run
- Scenarios:
  - Fresh install → uninstall (manifests present)
  - Install, generate docs, modify docs → uninstall (preserve customizations)
  - No manifests available → heuristic mode
  - tmux present vs absent; background supervisor running vs not
  - Git tracked vs untracked files under `.claude/` and `.agent-os/`

Assertions
- Only system assets removed by default; generated docs preserved
- tmux/background processes are stopped
- Symlink/launcher removed; dashboard not reachable
- Backup created and restorable

---

8) Documentation To Add

- `GPT5-DOCS/GITHUB-README.md`: add Uninstall section with examples
- `INSTALLATION-AND-USAGE.md`: add uninstall commands and safety notes
- `SECURITY.md`: confirm uninstall safety posture and CI defaults

---

9) Timeline & Acceptance Criteria

- Day 1–2: Manifest writers (install + doc generation), CLI scaffolding
- Day 3–4: Interactive flows, dry‑run/backup, process handling, safety checks
- Day 5: Cross‑platform validation, docs, and E2E tests

Acceptance
- Interactive and non‑interactive modes implemented
- Default behavior preserves generated project docs/files
- Clean removal of system assets and processes
- Comprehensive dry‑run, preview, and backups
