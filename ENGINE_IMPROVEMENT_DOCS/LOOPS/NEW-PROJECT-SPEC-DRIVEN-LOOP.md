# Spec‑Driven App Build Loop (New Projects & Major Features)

## 🎯 Overview

This document defines the **Spec‑Driven App Build Loop**, the default loop profile for:

- Greenfield projects
- Major new features in existing projects
- Any work where **clear specifications + good documentation** are required

The loop repeatedly performs the following high-level cycle:

1. **Intent & analysis** of the project/feature
2. **Spec & doc generation/refinement**
3. **Implementation** via Queen sub-agents and `MasterWorkflow3`
4. **Testing & static checks**
5. **Evaluation against explicit exit criteria**
6. Repeat until the feature/app satisfies specs + tests + quality gates

This loop is designed to work for:

- Brand new, empty repos
- Existing repos with some structure but missing specs/docs
- Features added into larger systems

---

## 🧩 Role in the Overall Loop System

- For **new projects**, this is the **primary loop** used from initialization onwards.
- For **existing projects**, it is typically chained after:
  - An **Exploration/Spike** phase (to pick technologies/architecture), or
  - A **Legacy Rescue** phase that established safety and basic structure.
- It is complementary to the **Incremental TDD Loop**:
  - Spec‑Driven focuses on upfront requirements & architecture.
  - TDD focuses on small, test-first increments for stability.

---

## ⚙️ Preconditions & Inputs

The loop can start with minimal information but benefits from more context.

### Minimal Inputs (absolute minimum)

- A short **feature or project description** (from user, architecture file, or prompt):
  - e.g. `"Web app for managing subscriptions with Stripe billing"`
- A target **project path** (default: current working directory).

### Recommended Inputs

- `architecture.md` or equivalent high-level doc
- Existing repo structure (if any)
- User preferences captured by the interactive installer:
  - Preferred stack (e.g. Next.js + Supabase, REST vs GraphQL)
  - Non-functional requirements (performance, security, compliance)
  - Documentation expectations (API docs, architecture diagrams, etc.)

### Technical Preconditions

- Node.js ≥ 18
- Project has run the Master Workflow installer (so `.ai-workflow`, `.claude`, etc. are available) **or** is in the process of being bootstrapped.

---

## 🧠 Loop Phases (Conceptual)

> **Note:** These phases describe *behaviour*. Implementation details (APIs, function names) are intentionally not fixed here to keep the design flexible.

### Phase 1: Intent & Project Analysis

**Goal:** Understand what needs to be built and the current state of the project.

**Activities:**

- Use `ProjectBootstrapAgent` + Queen code archaeology to:
  - Read any existing docs (`architecture.md`, `README`, etc.).
  - Inspect directory structure and detect languages/frameworks.
  - Identify whether this is:
    - A new project (little/no existing code)
    - An existing project where a new feature is being added.
- Store analysis in SharedMemory and ReasoningBank.
- Optionally prompt the user (interactive mode) for:
  - Clarifications about goals
  - Hard constraints (deadlines, hosting, compliance)

**Outputs:**

- `projectAnalysis` object containing:
  - Tech stack
  - Detected patterns/modules
  - Dependencies
  - Existing documentation and gaps
  - Feature/goal summary

---

### Phase 2: Spec & Documentation Generation / Refinement

**Goal:** Create a **clear, machine-usable specification** and accompanying documentation.

**Activities:**

- Generate or update:
  - High-level system or feature spec
  - API contracts (endpoints, payloads, auth requirements)
  - Data models (entities, relationships)
  - User flows / state diagrams (optionally in Mermaid)
- For new projects:
  - Create initial docs in a dedicated `docs/` or similar folder.
- For existing projects:
  - Integrate with existing doc structure
  - Mark any conflicting or unknown behaviours.
- In interactive mode:
  - Present spec drafts to the user for confirmation or correction.

**Iteration inside this phase:**

- Loop locally in Phase 2 (spec refinement) until:
  - No open TODOs or `TBD` markers remain in core spec sections.
  - User (or a configured policy) approves the spec.

**Outputs:**

- `featureSpec` (structured object)
- Generated/updated docs written to disk
- Perhaps a `spec-version` or hash for later tracking

---

### Phase 3: Implementation

**Goal:** Translate the spec into working code, with a bias toward correctness and clarity.

**Activities:**

- Use Queen Controller to spawn specialist agents:
  - `architect`
  - `developer`
  - `test-runner`
  - `doc-generator` (if additional docs are needed)
- Use `MasterWorkflow3.execute` (or equivalent orchestrated calls) to:
  - Create or modify modules
  - Wire routes, handlers, services
  - Generate or update migrations, configuration, etc.

**Safety considerations:**

- Prefer non-destructive changes:
  - Additive first (new files, new modules)
  - Refactors guarded by tests (once test coverage exists)

**Outputs:**

- Concrete code changes committed to the working tree
- A list of changed files (for analysis and later loops)

---

### Phase 4: Tests & Static Checks

**Goal:** Validate that implementation conforms to specs and does not introduce obvious problems.

**Activities:**

- Run available tests:
  - For new projects, generate basic test scaffolding and smoke tests.
  - For existing projects, expand tests to cover new behaviour.
- Run static analysis where configured:
  - Linters (ESLint, etc.)
  - Type checkers (TypeScript, etc.)
- Optionally run fast security/performance checks:
  - Basic dependency vulnerability scan
  - Quick microbenchmark of critical paths (if configured).

**Outputs:**

- `testResults` summary (pass/fail, coverage if supported)
- `staticCheckResults` (lint issues, type errors)

---

### Phase 5: Evaluation & Exit

**Goal:** Decide whether the loop is done or another iteration is required.

**Inputs:**

- `featureSpec`
- `testResults`
- `staticCheckResults`
- Policy/threshold configuration (see configuration doc)

**Exit criteria examples:**

- All feature-specific acceptance tests pass
- No critical errors in linters or type checks
- (Optional) Coverage ≥ project-defined threshold for new code
- No blocking security issues detected

**If criteria met:**

- The loop terminates successfully for this feature/app.
- A summary report is stored (SharedMemory, ReasoningBank, and possibly a markdown log).

**If criteria NOT met:**

- The loop computes a **refinement plan**:
  - Identify failing tests and their likely causes
  - Identify gaps between spec and behaviour
  - Identify highest-impact lint or structural issues.
- This refinement plan is fed back into **Phase 2 (Spec & Doc Refinement)** and the loop repeats.

---

## 🔧 Configuration & Customization (Summary)

> Detailed configuration schema will be defined in `LOOP-SELECTION-AND-CONFIG.md`. This section describes the main knobs relevant to this loop.

### Key Configurable Parameters

- **Spec Strictness**
  - How strict the loop is about having fully detailed specs before major implementation.

- **Test & Coverage Thresholds**
  - Minimum test pass/cov requirements before considering the loop complete.

- **Static Check Thresholds**
  - Maximum allowed number or severity of lint/type issues.

- **Iteration Limits**
  - Maximum number of full loop iterations before aborting or requiring human approval.

- **Interactive vs Autonomous Mode**
  - Whether user interaction is required for spec approvals.

---

## 🧪 Example Scenarios

### Scenario A: Brand New Full-Stack App

- User describes the app in high-level terms.
- System:
  - Analyzes the empty or nearly-empty repo
  - Proposes a recommended stack & architecture
  - Generates initial specs and docs
  - Iteratively builds out initial modules + tests until specs are satisfied.

### Scenario B: New Feature in an Existing Service

- Project already has services, tests, and docs.
- System:
  - Analyzes existing structure
  - Adds a feature-specific spec and documentation
  - Implements only the new modules/endpoints needed
  - Reuses existing test infrastructure
  - Stops once feature tests pass and no new issues are introduced.

---

## ✅ Success Criteria for This Loop

The Spec‑Driven App Build Loop will be considered successful when:

1. It can be configured and selected via loop configuration/selection.
2. It can take a minimal high-level description + repo and produce:
   - Specs
   - Docs
   - Working code
   - Tests
3. It stops **only** when explicit exit criteria are satisfied, or safety limits are reached.
4. It integrates cleanly with other loops:
   - TDD for fine-grained changes
   - Legacy Rescue for messy starting points
   - Polish for performance/UX once functionally complete.
