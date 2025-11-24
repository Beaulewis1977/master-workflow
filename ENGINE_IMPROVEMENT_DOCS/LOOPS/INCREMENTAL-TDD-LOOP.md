# Incremental TDD Loop (In-Progress & Mostly-Complete Projects)

## 🎯 Overview

This document defines the **Incremental TDD Loop**, a build loop profile focused on:

- Safe, **test-first** development
- Working with **in-progress or mostly-complete** projects
- Reducing regressions while finishing features or fixing bugs

The loop is designed for both:

- **New behaviour**: writing tests before implementing a new capability.
- **Existing behaviour**: writing characterization tests around current behaviour before refactoring.

It complements the **Spec‑Driven App Build Loop** by providing a more granular, test-centered approach.

---

## 🧩 Use Cases

- A feature branch that is >50% complete but needs to be finished safely.
- A module in a mostly-finished app that requires additional functionality.
- A bug that must be fixed without breaking existing behaviour.
- Incremental improvements in code quality and structure within a live system.

This loop is also appropriate for **older projects that already have some tests**, but are not "full legacy rescue" cases.

---

## ⚙️ Preconditions & Inputs

### Functional Preconditions

- There exists at least some test infrastructure or ability to add tests:
  - Testing framework available (Jest, Mocha, etc.).
  - Ability to run `npm test` or equivalent.

### Technical Preconditions

- Node.js ≥ 18
- Project either:
  - Already has Master Workflow 3.0 installed, or
  - Is running inside a Master Workflow-bootstrapped environment.

### Logical Inputs

- A target **module/feature/bug** to work on.
- Optional:
  - Spec or documentation describing the desired behaviour.
  - Known regression cases or historical bug reports.

---

## 🧠 Loop Phases (Conceptual)

### Phase 1: Goal & Scope Definition

**Goal:** Precisely define what we are trying to change and what must not break.

**Activities:**

- Identify:
  - Target modules/files
  - Public APIs or behaviours affected
  - Invariants that must be preserved
- For bug fixes:
  - Capture current buggy behaviour and desired fixed behaviour
- For new features:
  - Capture acceptance criteria as testable scenarios

**Outputs:**

- `tddTarget` object with:
  - Scope (files/modules)
  - New behaviours
  - Behaviour to preserve
  - Related specs/docs (if available)

---

### Phase 2: Test-First / Characterization Tests

**Goal:** Create or extend the **test surface** before making behavioural changes.

**Activities:**

- For **bug fixes**:
  - Introduce a failing test that reproduces the bug.
- For **new behaviour**:
  - Introduce one or more failing tests describing the desired new behaviour.
- For **refactors**:
  - Add characterization tests that describe current correct behaviour, ensuring refactors dont break it.

Tests may include:

- Unit tests
- Integration tests
- API tests (for HTTP/gRPC/etc.)

**Outputs:**

- New or updated test files with intentional failures indicating work to be done.
- A mapping from tests to targets (for traceability).

---

### Phase 3: Minimal Implementation / Change

**Goal:** Make the **smallest change** necessary to bring failing tests to green.

**Activities:**

- Implement or modify code with a focus on:
  - Correctness
  - Minimal footprint
  - Avoiding broad architectural changes in a single loop iteration
- Use `MasterWorkflow3` / Queen agents to:
  - Localize changes
  - Avoid unnecessary rewrites

**Outputs:**

- Code changes that make previously failing tests pass.
- Updated coverage data (if available).

---

### Phase 4: Regression Testing

**Goal:** Ensure the minimal change did not introduce unintended regressions.

**Activities:**

- Run appropriate subsets of the test suite:
  - Relevant unit tests
  - Integration/e2e tests covering adjacent functionality
- Optionally run full test suite based on configuration or loop stage.

**Outputs:**

- `regressionResults` summary
  - Which tests were run
  - Pass/fail counts
  - Newly failing tests vs previous iterations

---

### Phase 5: Review, Refactor, and Exit Decision

**Goal:** Decide whether to:

- Exit the loop, or
- Run further iterations for refactoring/cleanup.

**Activities:**

- Evaluate:
  - All new TDD tests passing
  - No new regressions
  - Optional simple quality checks (lint, basic complexity)
- If everything is acceptable:
  - Mark loop iteration as complete
- If there are minor code smells but tests pass:
  - Optionally plan a **refactor sub-loop**:
    - Keep tests fixed
    - Clean up implementation
    - Re-run tests

**Exit Criteria (Configurable):**

- All **new** tests introduced for this loop are green.
- No **additional** failing tests vs baseline.
- Optional: no new critical lint issues.

---

## 🔧 Configuration (Summary)

Detailed configuration will live in `LOOP-SELECTION-AND-CONFIG.md`. Key parameters include:

- **Test Scope Strategy**
  - Minimal tests vs broader test expansion

- **Regression Depth**
  - Which test suites to run every iteration
  - When to trigger full suite vs focused tests

- **Iteration Limits**
  - Max number of TDD cycles before requiring human review

- **Refactor Policy**
  - Whether to allow refactor-only iterations under a stable test net

---

## 🧪 Example Scenarios

### Scenario A: Bug Fix in a Service

1. Identify the bug and affected endpoint.
2. Add a failing test that reproduces the bug.
3. Implement minimal code changes to make the test pass.
4. Run related tests to ensure no regressions.
5. If everything passes, exit loop.

### Scenario B: Add a Small Feature to an Existing Module

1. Define acceptance test cases.
2. Add failing tests describing the new behaviour.
3. Implement code until tests pass.
4. Run surrounding tests to ensure stability.
5. Optionally refactor now that behaviour is covered by tests.

---

## ✅ Success Criteria for This Loop

The Incremental TDD Loop is successful when it enables:

- Safe, small-step evolution of an existing codebase.
- Bug fixes and features delivered with minimal regressions.
- A pattern where **tests lead** and implementation follows.

It should integrate naturally with:

- Spec‑Driven Loop (for drawing initial specs)
- Legacy Rescue Loop (for messy areas needing characterization tests)
- Polish Loop (once behaviour is stable and we want to optimize).
