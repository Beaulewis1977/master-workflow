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
- [x] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P0-T1: Create feature branch `feat/audit-remediation-ph1`.
- [ ] P0-T2: Add PR template and lightweight checklist to ensure acceptance criteria are tracked.

Acceptance Criteria
- New branch exists; PR template includes checklists.

Deliverables
- Branch, PR template updates, labels: `phase:1`, `type:infra`.

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 6. Phase 1: Quick Wins (Stability & Safety)
Goals: Fix obvious bugs and risky defaults fast.

Status
- [ ] Not started
- [x] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P1-T1: Fix duplicate declarations and formatting in `intelligence-engine/document-customizer.js`.
- [ ] P1-T2: Replace grep-based recovery scanning in `workflow-runner.js` with `project-scanner.js`.
- [ ] P1-T3: Default Windows to process mode; fence tmux usage; remove `at` dependency or guard behind presence checks.
- [ ] P1-T4: Gate YOLO/`--dangerously-skip-permissions` behind explicit env var and print warnings; ensure CI blocks it.

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

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 7. Phase 2: Cross-Platform & Safe Command Execution
Goals: Robust, portable process execution without naïve splitting.

Status
- [x] Not started
- [ ] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P2-T1: Introduce a command execution helper (execa or `spawn` with `{ shell: true }`) with a safe argument builder.
- [ ] P2-T2: Update `workflow-runner-modular.js` to use helper (remove `split(' ')`).
- [ ] P2-T3: Update `workflow-runner.js` to use helper (remove `spawn('sh', ['-c', ...])`).
- [ ] P2-T4: Refactor commands with `&&` (e.g., SPARC wizard) into sequential executions via helper.

Acceptance Criteria
- All runners execute commands on Windows/macOS/Linux with quoting preserved.
- No embedded `&&` required to chain critical actions.

Deliverables
- PR: `feat/portable-exec-helper` with cross-platform smoke tests (swarm/hive/sparc).

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 8. Phase 3: Claude Flow v2.0.0 Feature Integration
Goals: Expose CF v2.0.0 capabilities and centralize version policy.

Status
- [x] Not started
- [ ] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P3-T1: Centralize `CLAUDE_FLOW_VERSION` policy (alpha/beta/latest/stable/2.0/dev) in a single module.
- [ ] P3-T2: Add optional commands for neural training and memory ops (e.g., `training neural-train --epochs ...`).
- [ ] P3-T3: Update docs to mark experimental features and provide guardrails.

Acceptance Criteria
- Runners can launch v2.0.0 features behind flags; docs reflect version policy.

Deliverables
- PR: `feat/claude-flow-2-0-integration` with minimal e2e check (mock output accepted) and documentation.

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 9. Phase 4: Claude Code Sub-Agent Auto-Delegation
Goals: Implement practical, opt-in auto-delegation with clear rules.

Status
- [x] Not started
- [ ] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P4-T1: Define delegation rules (e.g., testing → `test-engineer`, security → `security-auditor`).
- [ ] P4-T2: Add `.claude/settings.json` toggles; document policies and safety checks.
- [ ] P4-T3: Provide examples in Simple Workflow steps for automatic hand-offs.

Acceptance Criteria
- Auto-delegation demo flow works; rules are documented and gated.

Deliverables
- PR: `feat/sub-agent-autodelegation` and documentation updates.

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 10. Phase 5: Observability (Status API + SSE Event Bus)
Goals: Provide minimal status server and live event stream.

Status
- [x] Not started
- [ ] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P5-T1: Add a lightweight status server (Express) exposing:
  - `/` JSON snapshot (agents, sessions, processes, errors)
  - `/events/stream` SSE for prompt/tool/response/approach_change
- [ ] P5-T2: Wire existing hooks/log emission to event bus.

Acceptance Criteria
- Status responds within < 100ms p50 locally; SSE streams live events.

Deliverables
- PR: `feat/observability-sse-status` with basic tests and docs.

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 11. Phase 6: MCP Discovery & Registry Flow
Goals: Make MCP registry generation reliable or documented.

Status
- [x] Not started
- [ ] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P6-T1: Provide `lib/mcp-discover.js` or vendor a minimal implementation.
- [ ] P6-T2: Update Document Customizer to summarize MCP registry in `CLAUDE.md`.
- [ ] P6-T3: Add fallback/manual path if discovery isn’t available.

Acceptance Criteria
- Registry generation succeeds or degrades gracefully; docs updated.

Deliverables
- PR: `feat/mcp-registry` with example registry and tests.

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 12. Phase 7: CI/CD & Governance (Policies and Tests)
Goals: Enforce safety, portability, and quality.

Status
- [x] Not started
- [ ] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P7-T1: Matrix CI (Windows/macOS/Linux) with unit + smoke tests.
- [ ] P7-T2: CI policy to block YOLO; lint + security scans.
- [ ] P7-T3: PR templates & CODEOWNERS for critical files (runners, scripts).

Acceptance Criteria
- CI green across OS matrix; YOLO blocked; baseline tests pass.

Deliverables
- PR: `chore/ci-policy-matrix`.

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 13. Phase 8: Consolidation & Migration (Modular Runner)
Goals: Unify on modular runner; deprecate legacy where appropriate.

Status
- [x] Not started
- [ ] In progress
- [ ] Done (Date: ______; PRs: ______)

Tasks
- [ ] P8-T1: Document modular runner as the default path; legacy runner as tmux specialization only.
- [ ] P8-T2: Migration guide and deprecation notice.

Acceptance Criteria
- Clear docs; no break for existing users; migration path provided.

Deliverables
- PR: `docs/unify-modular-runner`.

End-of-Phase Summary (to be filled)
- Changes:
- Metrics:
- Risks/Issues:
- Next Phase Go/No-Go:

---

### 14. Risk Register & Mitigations
- R1: Windows path issues → Mitigation: CI matrix, use Node APIs instead of shell.
- R2: Breaking changes → Mitigation: phase-by-phase PRs; feature flags.
- R3: Tool availability (tmux/at) → Mitigation: guard and fallback to process mode.
- R4: Cost/perf of CF v2.0.0 tasks → Mitigation: flags, mock/simulate where feasible.

### 15. Rollback Strategy (per phase)
- Each phase merges via separate PR; revert PR if regressions.
- Keep feature flags for new capabilities; default off until validated.

---

### 16. Tracking & Index (Task IDs → Files/PRs)

Task Index (sample mapping)
- P1-T1 → `intelligence-engine/document-customizer.js`
- P1-T2 → `workflow-runner.js` → use `intelligence-engine/project-scanner.js`
- P1-T3 → `workflow-runner*.js`, `tmux-scripts/*`
- P1-T4 → `install-modular.sh`, CI workflow
- P2-T1..T4 → `workflow-runner-modular.js`, `workflow-runner.js`, new `exec-helper`
- P3-* → version policy module, runners, docs
- P4-* → `.claude/settings.json`, Simple Workflow scripts
- P5-* → new `status-server.js`, hooks integration
- P6-* → `lib/mcp-discover.js`, Document Customizer
- P7-* → `.github/workflows/*`, CODEOWNERS, PR templates
- P8-* → docs, deprecation notes

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

---

Use this plan to drive focused PRs per phase. We will not begin implementation until you signal to proceed with Phase 0.

---

### 18. Phase Completion Log (Chronological)
- Phase 0 — Summary:
  - Date:
  - PRs:
  - Highlights:
- Phase 1 — Summary:
  - Date:
  - PRs:
  - Highlights:
- Phase 2 — Summary:
  - Date:
  - PRs:
  - Highlights:
- Phase 3 — Summary:
  - Date:
  - PRs:
  - Highlights:
- Phase 4 — Summary:
  - Date:
  - PRs:
  - Highlights:
- Phase 5 — Summary:
  - Date:
  - PRs:
  - Highlights:
- Phase 6 — Summary:
  - Date:
  - PRs:
  - Highlights:
- Phase 7 — Summary:
  - Date:
  - PRs:
  - Highlights:
- Phase 8 — Summary:
  - Date:
  - PRs:
  - Highlights:


