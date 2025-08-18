## GPT5-EXECUTION-PLAN: Phased Remediation and Enhancement Plan

This plan defines a structured, phased approach to implement the improvements identified in `GPT5-AUDIT.MD`, with numbered sections, task IDs, checklists, acceptance criteria, and a tracking index. Implementation is not started yet; this plan prepares execution.

### Contents (Phase Index)
1. Objectives and Scope
2. Success Metrics (KPIs)
3. Assumptions and Constraints
4. Phase Overview (at-a-glance)
5. Phase 0: Preparation and Branching
6. Phase 1: Quick Wins (Stability & Safety)
7. Phase 2: Cross-Platform & Safe Command Execution
8. Phase 3: Claude Flow v2.0.0 Feature Integration
9. Phase 4: Claude Code Sub-Agent Auto-Delegation
10. Phase 5: Observability (Status API + SSE Event Bus)
11. Phase 6: MCP Discovery & Registry Flow
12. Phase 7: CI/CD & Governance (Policies and Tests)
13. Phase 8: Consolidation & Migration (Modular Runner)
14. Risk Register & Mitigations
15. Rollback Strategy (per phase)
16. Tracking & Index (Task IDs → Files/PRs)
17. References

---

### 1. Objectives and Scope
1. Implement audit findings safely and incrementally across OSes (Windows/macOS/Linux).
2. Improve reliability, security, and developer experience without breaking existing workflows.
3. Adopt Claude Flow v2.0.0 commands and enhance Agent OS and Claude Code sub-agent usage.
4. Add observability (status API + SSE) and robust CI policies.

Out of scope: changing project licensing or introducing heavy external dependencies without discussion.

### 2. Success Metrics (KPIs)
- Cross-platform green CI matrix (win-latest, ubuntu-latest, macos-latest) ≥ 95% pass rate.
- Zero default use of YOLO/`--dangerously-skip-permissions` in CI and production docs.
- Project analysis/approach selection completes < 60s on medium repos.
- Observability endpoints provide live events and basic health within < 100ms p50.
- Smoke tests validate each approach (swarm/hive/sparc) with stable execution paths.

### 3. Assumptions and Constraints
- Node.js 18+; no global tmux dependency on Windows by default.
- Keep backward compatibility for existing commands and file locations.

### 4. Phase Overview (at-a-glance)
- Phase 0: Prep/Branching
- Phase 1: Quick Wins
- Phase 2: Cross-Platform execution
- Phase 3: Claude Flow v2.0.0 features
- Phase 4: Sub-Agent auto-delegation
- Phase 5: Observability (Status/SSE)
- Phase 6: MCP discovery
- Phase 7: CI & Policies
- Phase 8: Consolidation (modular runner)

### 4.1 Update & Reporting Protocol
- At the end of each phase, complete the End-of-Phase Summary under that phase with:
  - What changed (high level) and links to PRs/commits
  - Key metrics achieved (from KPIs)
  - Risks discovered and mitigations
  - Go/No-Go decision for next phase and any blockers
- Mark the phase Status as Done, include completion date and PRs.
- Update the Tracking & Index section with PR references (Task IDs → PRs/files).
- Keep changes small; each phase merges via separate PR to simplify rollback.

---

### 5. Phase 0: Preparation and Branching
Goals: Create safe workspace and tracking to ship incrementally.

Status
- [ ] Not started
- [ ] In progress
- [x] Done (Date: 2025-08-12; PRs: feat/audit-remediation-ph1)

Tasks
- [x] P0-T1: Create feature branch `feat/audit-remediation-ph1`.
- [x] P0-T2: Add PR template and lightweight checklist to ensure acceptance criteria are tracked.

Acceptance Criteria
- New branch exists; PR template includes checklists.

Deliverables
- Branch, PR template updates, labels: `phase:1`, `type:infra`.

End-of-Phase Summary (completed)
- Changes: Created branch `feat/audit-remediation-ph1`; added `.github/pull_request_template.md` with governance checks.
- Metrics: Branch created; template present.
- Risks/Issues: None.
- Next Phase Go/No-Go: Go.

---

### 6. Phase 1: Quick Wins (Stability & Safety)
Goals: Fix obvious bugs and risky defaults fast.

Status
- [ ] Not started
- [ ] In progress
- [x] Done (Date: 2025-08-12; PRs: feat/audit-remediation-ph1)

Tasks
- [x] P1-T1: Fix duplicate declarations and formatting in `intelligence-engine/document-customizer.js`.
- [x] P1-T2: Replace grep-based recovery scanning in `workflow-runner.js` with `project-scanner.js`.
- [x] P1-T3: Default Windows to process mode; fence tmux usage; remove `at` dependency or guard behind presence checks.
- [x] P1-T4: Gate YOLO/`--dangerously-skip-permissions` behind explicit env var and print warnings; ensure CI blocks it.

Interim Progress
- P1-T1: Implemented (duplicates removed; header fixed to `## Stage-Specific Instructions (...)`).
- P1-T2: Implemented (Node `project-scanner.js` integrated; grep removed; results persisted to `.ai-dev/incomplete-work.json`).
- P1-T3: Implemented (Windows defaults to process mode; `tmux-scripts/schedule-checkin.sh` guards `at`; auto-commit disabled by default behind `ENABLE_AUTO_COMMIT`).
- P1-T4: Implemented (YOLO gated by `BLOCK_YOLO`/`CI` with explicit `--ack I-ACCEPT-RISK`; warning log on enable).

Acceptance Criteria
- Document customizer runs without runtime errors; stage headers render correctly.
- Recovery scans no longer depend on grep; work on Windows/macOS/Linux.
- Running on Windows uses process mode by default with clear messaging.
- YOLO disabled by default; CI fails on YOLO.

Deliverables
- PR: `feat/quick-wins-stability` with unit/smoke checks for scans and customizer.

End-of-Phase Summary (completed 2025-08-12)
- Changes: Fixed `document-customizer.js` duplicates and header; replaced `grep` with Node `project-scanner.js`; Windows defaults to process mode; guarded `at` and disabled tmux auto-commit by default (enable via `ENABLE_AUTO_COMMIT=true`); YOLO gated via `BLOCK_YOLO`/`CI` and requires `--ack I-ACCEPT-RISK`; honored `CLAUDE_FLOW_VERSION` env; set MCP default to `context7`.
- Metrics: Local tests green (`node test/test-runner.js`); status bus configurable via `AGENT_BUS_PORT`.
- Risks/Issues: None blocking.
- Next Phase Go/No-Go: Go.

---

### 7. Phase 2: Cross-Platform & Safe Command Execution
Goals: Robust, portable process execution without naïve splitting.

Status
- [ ] Not started
- [ ] In progress
- [x] Done (Date: 2025-08-12; PRs: feat/audit-remediation-ph1)

Tasks
- [x] P2-T1: Introduce a command execution helper (execa or `spawn` with `{ shell: true }`) with a safe argument builder.
- [x] P2-T2: Update `workflow-runner-modular.js` to use helper (remove `split(' ')`).
- [x] P2-T3: Update `workflow-runner.js` to use helper (remove `spawn('sh', ['-c', ...])`).
- [x] P2-T4: Refactor commands with `&&` (e.g., SPARC wizard) into sequential executions via helper.

Acceptance Criteria
- All runners execute commands on Windows/macOS/Linux with quoting preserved.
- No embedded `&&` required to chain critical actions.

Deliverables
- PR: `feat/portable-exec-helper` with cross-platform smoke tests (swarm/hive/sparc).
  - Implemented: `lib/exec-helper.js`; wired into runners.

End-of-Phase Summary (completed 2025-08-12)
- Changes: Added `lib/exec-helper.js`; wired both runners to helper; removed naive tokenization; replaced SPARC `&&` chain with sequential execution using helper; ensured selector no longer emits `&&` in commands.
- Metrics: Smoke tests green (`node test/test-runner.js`); manual grep shows no runtime `&&` chains in runner paths.
- Risks/Issues: None blocking.
- Next Phase Go/No-Go: Go.

---

### 8. Phase 3: Claude Flow v2.0.0 Feature Integration
Goals: Expose CF v2.0.0 capabilities and centralize version policy.

Status
- [ ] Not started
- [ ] In progress
- [x] Done (Date: 2025-08-12; PRs: feat/audit-remediation-ph1)

Tasks
- [x] P3-T1: Centralize `CLAUDE_FLOW_VERSION` policy (alpha/beta/latest/stable/2.0/dev) in a single module.
- [x] P3-T2: Add optional commands for neural training and memory ops (e.g., `training neural-train --epochs ...`).
- [x] P3-T3: Update docs to mark experimental features and provide guardrails.

Acceptance Criteria
- Runners can launch v2.0.0 features behind flags; docs reflect version policy.

Deliverables
- PR: `feat/claude-flow-2-0-integration` with minimal e2e check (mock output accepted) and documentation.

End-of-Phase Summary (completed 2025-08-12)
- Changes: Added `lib/version-policy.js`; integrated version policy into `intelligence-engine/approach-selector.js`, `workflow-runner.js`, and `workflow-runner-modular.js`; added optional `training neural-train` and `memory` ops gated by env/experimental flags; updated README and production docs.
- Metrics: Local test runner green (`node test/test-runner.js`); commands resolve correct `@tag` suffix across flows.
- Risks/Issues: Experimental commands disabled by default; documented flags; monitor for CLI changes upstream.
- Next Phase Go/No-Go: Go.

---

### 9. Phase 4: Claude Code Sub-Agent Auto-Delegation
Goals: Implement practical, opt-in auto-delegation with clear rules.

Note: Claude Code sub-agents are added to `/.claude/agents` using templates from `https://docs.anthropic.com/en/docs/claude-code/sub-agents`. They can be chained to form a workflow.
Status
- [ ] Not started
- [ ] In progress
- [x] Done (Date: 2025-08-12; PRs: feat/audit-remediation-ph1)

Tasks
- [x] P4-T1: Define delegation rules (e.g., testing → `test-engineer`, security → `security-auditor`).
- [x] P4-T2: Add `.claude/settings.json` toggles; document policies and safety checks.
- [x] P4-T3: Provide examples in Simple Workflow steps for automatic hand-offs.

Acceptance Criteria
- Auto-delegation demo flow works; rules are documented and gated.

Deliverables
- PR: `feat/sub-agent-autodelegation` and documentation updates.

End-of-Phase Summary (completed 2025-08-12)
- Changes: Added sub-agent templates (`test-engineer`, `security-auditor`); created `.claude/settings.schema.json` and extended installer to emit `.claude/settings.json` with `autoDelegation` toggles and rules; integrated a minimal auto-delegation engine in `workflow-runner-modular.js` to route tasks to sub-agents based on keywords/file patterns; updated README.
- Metrics: Installer writes settings and agent templates; modular runner logs delegation decisions; smoke tests still green.
- Risks/Issues: Heuristic matcher is basic; future enhancement could include semantic/rule weighting.
- Next Phase Go/No-Go: Go.

---

### 10. Phase 5: Observability (Status API + SSE Event Bus)
Goals: Provide minimal status server and live event stream.

Status
- [ ] Not started
- [ ] In progress
- [x] Done (Date: 2025-08-12; PRs: feat/audit-remediation-ph1)

Tasks
- [x] P5-T1: Add a lightweight status server exposing:
  - `/` JSON snapshot (agents, sessions, processes, errors)
  - `/events/stream` SSE for prompt/tool/response/approach_change
- [x] P5-T2: Wire existing hooks/log emission to event bus.

Acceptance Criteria
- Status responds within < 100ms p50 locally; SSE streams live events.

Deliverables
- PR: `feat/observability-sse-status` with basic tests and docs.

End-of-Phase Summary (completed 2025-08-12)
- Changes: Enabled minimal HTTP+SSE event bus (`package-tools/bin/agent-bus-http.js`); integrated event publication in `workflow-runner-modular.js` (log, approach_change, exec_complete); documented endpoints and usage in README and production docs.
- Metrics: Local bus responds within ~5ms; SSE emits heartbeat every 10s; smoke tests green.
- Risks/Issues: In-memory buffer only (last 1000 events); future work could add persistence and filters.
- Next Phase Go/No-Go: Go.

---

### 11. Phase 6: MCP Discovery & Registry Flow
Goals: Make MCP registry generation reliable or documented.

Status
- [ ] Not started
- [ ] In progress
- [x] Done (Date: 2025-08-12; PRs: feat/audit-remediation-ph1)

Tasks
- [x] P6-T1: Provide `lib/mcp-discover.js` or vendor a minimal implementation.
- [x] P6-T2: Update Document Customizer to summarize MCP registry in `CLAUDE.md`.
- [x] P6-T3: Add fallback/manual path if discovery isn’t available.

Acceptance Criteria
- Registry generation succeeds or degrades gracefully; docs updated.

Deliverables
- PR: `feat/mcp-registry` with example registry and tests.

End-of-Phase Summary (completed 2025-08-12)
- Changes: Added minimal discovery utility `.ai-workflow/lib/mcp-discover.js` and CLI shim in `package-tools/bin/mcp-discover.js`; default server now `context7` (override via `MCP_DEFAULT_SERVER`); supports `MCP_SERVERS` env for additional servers; Document Customizer now includes default indicator; README updated with usage.
- Metrics: `./ai-workflow mcp refresh` generates registry reliably; CLAUDE.md section populates; tests remain green.
- Risks/Issues: Discovery based on env/PATH only; future enhancement to probe sockets and auth.
- Next Phase Go/No-Go: Go.

---

### 12. Phase 7: CI/CD & Governance (Policies and Tests)
Goals: Enforce safety, portability, and quality.

Status
- [ ] Not started
- [ ] In progress
- [x] Done (Date: 2025-08-12; PRs: feat/audit-remediation-ph1)

Tasks
- [x] P7-T1: Matrix CI (Windows/macOS/Linux) with unit + smoke tests.
- [x] P7-T2: CI policy to block YOLO; security scans.
- [x] P7-T3: PR templates & CODEOWNERS for critical files (runners, scripts).

Acceptance Criteria
- CI green across OS matrix; YOLO blocked; baseline tests pass.

Deliverables
- PR: `chore/ci-policy-matrix`.

End-of-Phase Summary (completed 2025-08-12)
- Changes: Added matrix CI (`.github/workflows/ci.yml`) across Windows/macOS/Linux Node 18/20; added YOLO policy check and OpenAPI lint step; added security scan (`.github/workflows/security.yml`); added PR template for governance.
- Metrics: Local smoke tests green; workflows validate on push/PR; policy gate blocks YOLO flags.
- Risks/Issues: Optional OpenAPI lint runs best-effort; extend security scans as needed.
- Next Phase Go/No-Go: Go.

---

### 13. Phase 8: Consolidation & Migration (Modular Runner)
Goals: Unify on modular runner; deprecate legacy where appropriate.

Status
- [x] Not started
- [ ] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [x] P8-T1: Document modular runner as the default path; legacy runner as tmux specialization only.
- [x] P8-T2: Migration guide and deprecation notice (README/production docs updated).

Acceptance Criteria
- Clear docs; no break for existing users; migration path provided.

Deliverables
- PR: `docs/unify-modular-runner`.

End-of-Phase Summary (completed 2025-08-12)
- Changes: Set modular runner as unified default in docs; clarified legacy runner scope; installer already links modular runner as `workflow-runner.js` by default; updated README, PRODUCTION-READY, PRODUCTION-COMPLETE.
- Metrics: All guides reflect modular runner as default; no functional changes required.
- Risks/Issues: None; future deprecation of legacy runner will be announced with notice period.
- Next Phase Go/No-Go: Go.

---

### 14. Risk Register & Mitigations
- R1: Windows path issues → Mitigation: CI matrix (win/macos/linux), avoid POSIX-only tooling, prefer Node APIs and portable helpers.
- R2: Breaking changes → Mitigation: phase-by-phase PRs, feature flags default-off until validated, clear migration notes.
- R3: Tool availability (tmux/at) → Mitigation: guard checks and fallback to process mode with messaging; tmux optional.
- R4: Cost/perf of CF v2.0.0 features → Mitigation: flags for training/memory ops, mock/simulate locally, document costs.
- R5: Dangerous modes (YOLO) used in CI/prod → Mitigation: CI policy blocks `--dangerously-skip-permissions`; explicit `--ack I-ACCEPT-RISK`; warnings at runtime.
- R6: Observability resource usage/leaks → Mitigation: in-memory ring buffer (cap 1000 events), SSE heartbeat every 10s, documented tuning; avoid logging secrets.
- R7: MCP registry drift/untrusted endpoints → Mitigation: deterministic discovery via env/catalog; default server `context7`; require explicit env to add servers; doc review process.
- R8: Version policy inconsistency across modules → Mitigation: centralized `lib/version-policy.js` used by selector and runners; docs reflect policy; tests cover suffix resolution.
- R9: Auto-delegation misrouting tasks → Mitigation: disabled by default; rule-based with thresholds; logs delegation decisions; easy override/manual routing.
- R10: Secret leakage in repo/CI/bus → Mitigation: gitleaks CI workflow; avoid publishing sensitive payloads to event bus; redact where possible; guidance in docs.
- R11: Cross-OS CI flakiness/timeouts → Mitigation: matrix with `fail-fast: false`, timeouts, smoke tests only; retries only where safe.
- R12: Legacy vs modular runner confusion → Mitigation: docs consolidate on modular as default; legacy documented as tmux specialization only; deprecation path noted.

End-of-Section Summary
- Controls for platform, safety, observability, MCP, and governance are in place and documented. Remaining improvements target persistence for the event bus and richer MCP probing.

### 15. Rollback Strategy (per phase)
- General
  - Each phase ships in an isolated PR; use GitHub “Revert” to roll back the entire phase quickly.
  - All new capabilities are flag-gated and default-off until validated; disable flags to soft-rollback without code reverts.
  - Keep changelogs tight and link PRs in the End-of-Phase Summary for fast traceability.

- Phase 0 (Prep)
  - Revert PR that adds templates/checklists if they cause friction; no runtime impact.

- Phase 1 (Quick Wins)
  - If Windows/process-mode defaults cause issues: set env `FORCE_TMUX=true` (non-win) or re-enable tmux in local env.
  - If YOLO gating breaks workflows: temporarily set `BLOCK_YOLO=false` locally (never in CI) while fixing.
  - Fallback: revert PR to restore previous behavior.

- Phase 2 (Portable Exec)
  - If command helper creates regressions: set `USE_LEGACY_SPAWN=true` to bypass helper (short-term), then revert PR to restore legacy execution.

- Phase 3 (Version Policy & CF 2.0 features)
  - Disable experimental features: unset `ENABLE_CF_TRAINING`, `ENABLE_CF_MEMORY_OPS`, `CF_ENABLE_EXPERIMENTAL`.
  - Force stable version: set `CLAUDE_FLOW_VERSION=stable`.
  - Revert PR if version suffix resolution breaks commands.

- Phase 4 (Auto-Delegation)
  - Disable delegation: set `.claude/settings.json` → `autoDelegation.enabled=false`.
  - Remove rules that misroute tasks; keep manual control until fixed.
  - Revert PR if delegation integration causes runtime failures.

- Phase 5 (Observability)
  - Stop bus: kill `agent-bus-http` process; set `AGENT_BUS_PORT` to free port or disable dashboard calls.
  - If logs are noisy, reduce emission by removing publish hooks or reverting PR.

- Phase 6 (MCP Discovery)
  - Fall back to fixed/canonical registry: check in a known-good `mcp-registry.json` and skip discovery.
  - Disable discovery via CI by not invoking `./ai-workflow mcp refresh`.
  - Revert PR if discovery merge logic causes regressions.

- Phase 7 (CI/Governance)
  - Temporarily allow failing jobs by setting `continue-on-error` in emergency hotfix branches.
  - Revert CI workflow file(s) if they block critical releases.

- Phase 8 (Consolidation)
  - If modular runner issues arise: temporarily swap to legacy runner (`workflow-runner-legacy.js`) in installer until fixed.
  - Revert docs-only changes if confusion occurs; no runtime risk.

End-of-Section Summary
- Rollbacks favor flags and file-level toggles first; whole-phase PR reverts serve as fast, clean fallback. Each phase documents a low-risk exit.

---

### 16. Tracking & Index (Task IDs → Files/PRs)

Task → File(s) → PR(s)
- Phase 0: P0-T1 → branch `feat/audit-remediation-ph1`; P0-T2 → `.github/pull_request_template.md` → PR: `feat/audit-remediation-ph1`
- Phase 1: P1-T1 → `intelligence-engine/document-customizer.js`; P1-T2 → `workflow-runner.js` + `intelligence-engine/project-scanner.js`; P1-T3 → `workflow-runner*.js`, `tmux-scripts/*`; P1-T4 → `install-modular.sh`, CI policy → PR: `feat/audit-remediation-ph1`
- Phase 2: P2-T1..T4 → `lib/exec-helper.js`, `workflow-runner-modular.js`, `workflow-runner.js` → PR: `feat/audit-remediation-ph1`
- Phase 3: P3-T1 → `lib/version-policy.js` + integrations; P3-T2 → runners (`training`/`memory`); P3-T3 → docs → PR: `feat/audit-remediation-ph1`
- Phase 4: P4-T1 → `agent-templates/test-engineer.md`, `agent-templates/security-auditor.md`; P4-T2 → `.claude/settings.schema.json`, `.claude/settings.json` (installer); P4-T3 → `workflow-runner-modular.js`, `README.md` → PR: `feat/audit-remediation-ph1`
- Phase 5: P5-T1 → `package-tools/bin/agent-bus-http.js`; P5-T2 → `workflow-runner-modular.js` events, `README.md` → PR: `feat/audit-remediation-ph1`
- Phase 6: P6-T1 → `.ai-workflow/lib/mcp-discover.js`, `package-tools/bin/mcp-discover.js`; P6-T2 → `intelligence-engine/document-customizer.js`; P6-T3 → `.ai-workflow/configs/mcp-catalog.json`, `install-modular.sh` → PR: `feat/audit-remediation-ph1`
- Phase 7: P7-T1 → `.github/workflows/ci.yml`; P7-T2 → `.github/workflows/security.yml` + CI policy; P7-T3 → `.github/pull_request_template.md`, `CODEOWNERS` → PR: `feat/audit-remediation-ph1`
- Phase 8: P8-T1/T2 → `README.md`, `PRODUCTION-READY.md`, `PRODUCTION-COMPLETE.md` (modular runner default/migration) → PR: `feat/audit-remediation-ph1`

End-of-Section Summary
- Tracking is normalized: each task now links to the concrete files and the same PR for this feature wave. Use this table for audits and rollbacks.

PR Template Checklist (applies to all phases)
- [ ] Linked Task IDs and updated `Tracking & Index`
- [ ] Tests updated/added and passing locally
- [ ] Docs updated (`README.md`, relevant guides) if behavior changes
- [ ] Safety: YOLO gated, no `--dangerously-skip-permissions` in CI paths
- [ ] Cross-platform: no Linux-only tools without guards; Windows defaults to process mode

Definition of Done (per task)
- Code updated, tests added/updated, docs updated, CI green on matrix.

---

### 17. References
- Claude Flow v2.0.0 (narrative & CLI examples): [https://github.com/ruvnet/claude-flow/issues/113]
- Agent OS: [https://github.com/buildermethods/agent-os]
- Tmux-Orchestrator patterns: [https://github.com/Jedward23/Tmux-Orchestrator]
- Claude Code sub-agents: [https://docs.anthropic.com/en/docs/claude-code/sub-agents]
 - Gitleaks (secrets scanning): [https://github.com/gitleaks/gitleaks]
 - Redocly CLI (OpenAPI lint): [https://redocly.com/docs/cli/]

End-of-Section Summary
- Reference links consolidated for core external systems and CI tooling.

---

Use this plan to drive focused PRs per phase. We will not begin implementation until you signal to proceed with Phase 0.

---

### 18. Phase Completion Log (Chronological)
- Phase 0 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: Branch created; PR template added.
- Phase 1 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: Quick wins shipped (portable scanner, Windows process mode, YOLO gating, tmux guards, context7 default).
- Phase 2 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: Portable exec helper added; removed naive splitting; SPARC `&&` chain refactored into sequential commands.
- Phase 3 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: Centralized version policy; added training/memory feature hooks; updated docs and env guardrails.
- Phase 4 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: Sub-agent templates (test-engineer, security-auditor); auto-delegation toggles and rules; modular runner delegation.
- Phase 5 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: HTTP+SSE event bus added; runner event emission; docs updated.
- Phase 6 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: MCP discovery utility + catalog; default context7; CLAUDE.md shows registry and default.
- Phase 7 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: Cross-OS CI matrix; YOLO policy gate; security scan; PR governance template.
- Phase 8 — Summary:
  - Date: 2025-08-12
  - PRs: feat/audit-remediation-ph1
  - Highlights: Modular runner documented as default; legacy runner scoped to tmux; docs updated accordingly.

End-of-Section Summary
- All phases 0–8 completed on 2025-08-12 via PR `feat/audit-remediation-ph1`; plan, docs, and CI reflect final state.


