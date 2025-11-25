# Polish & Optimization Loop (Refinement & Performance)

## 🎯 Overview

This document defines the **Polish & Optimization Loop**, a build loop profile focused on:

- Performance improvements
- Code quality and maintainability
- UX and accessibility polish

It assumes that **core functionality is already correct** and covered by tests (ideally using the Spec‑Driven or TDD loops).

The key idea:

> **Measure → Optimize → Re-measure**, under constraints that keep functionality correct and maintainable.

---

## 🧩 Use Cases

- Late-stage refinement before a release.
- Improving response times and resource usage for hot paths.
- Cleaning up technical debt while tests already exist.
- Incremental UX/accessibility improvements for frontends.

---

## ⚙️ Preconditions & Inputs

### Functional Preconditions

- The system or feature is **functionally complete**.
- Tests exist and can be run reliably.

### Technical Preconditions

- Node.js ≥ 18
- Ability to run:
  - Test suite
  - Lint/format tools
  - Basic perf/UX tooling (where applicable).

### Measurement Inputs

- Initial baseline metrics for:
  - Performance (latency, throughput, CPU/memory)
  - Code quality (lint issues, complexity, duplication)
  - UX (Lighthouse scores, accessibility reports) where relevant.

---

## 🧠 Loop Phases (Conceptual)

### Phase 1: Baseline Capture

**Goal:** Establish the starting point for metrics.

**Activities:**

- Run the existing test suite and record:
  - Test pass/fail status
  - Basic test timings
- Run performance checks for key scenarios:
  - Synthetic benchmarks
  - Representative load tests (if configured)
- Run code quality analyzers:
  - Linters
  - Complexity/duplication tools
- For frontends:
  - Lighthouse or equivalent audits
  - Basic accessibility checks

**Outputs:**

- `baselineMetrics` object stored in ReasoningBank / filesystem.

---

### Phase 2: Target Definition

**Goal:** Define what "polished" or "optimized" means in concrete, quantitative terms.

**Activities:**

- For performance:
  - e.g. "Reduce p95 latency for endpoint X by 30%"
  - e.g. "Cap memory growth under load scenario Y"
- For code quality:
  - e.g. "Reduce critical lint issues to 0"
  - e.g. "Reduce cyclomatic complexity in module Z below N"
- For UX:
  - e.g. "Achieve Lighthouse performance score ≥ 90"
  - e.g. "Resolve all contrast/accessibility issues in report"

**Outputs:**

- `polishTargets` object with specific thresholds and priorities.

---

### Phase 3: Optimization Attempt

**Goal:** Experiment with changes likely to move metrics toward targets, without breaking functionality.

**Activities:**

- Use Queen Controller to select strategies, such as:
  - Caching layers
  - Query/index optimization
  - Parallelization / batching
  - Algorithmic improvements
  - Dead code elimination and simplification
- For code quality:
  - Refactor long methods/modules
  - Remove duplication
  - Improve naming and structure
- For UX:
  - Optimize asset loading (code splitting, compression)
  - Fix accessibility issues

Each iteration should:

- Make a **limited set of changes** to keep attribution clear.
- Tag those changes with the targeted metrics.

**Outputs:**

- Concrete code changes tied to a specific optimization hypothesis.

---

### Phase 4: Re-Measurement & Safety Checks

**Goal:** Verify the impact of optimization attempts.

**Activities:**

- Re-run:
  - Tests (to ensure no functional regression)
  - Relevant performance benchmarks
  - Code quality analysis
  - UX audits (as applicable)

**Outputs:**

- `iterationMetrics` capturing before/after comparisons.

---

### Phase 5: Evaluation & Exit Decision

**Goal:** Decide whether more iterations are worthwhile.

**Activities:**

- Compare `iterationMetrics` against `baselineMetrics` and `polishTargets`.
- For each target:
  - Met
  - Improved but not yet met
  - No improvement or regression

**Exit Criteria (Configurable):**

- All high-priority targets met **or**
- Diminishing returns detected (e.g., no improvement over last N iterations) **or**
- Safety limit reached (max iterations or time budget).

If exiting, generate a **Polish Report** summarizing:

- Changes made
- Metrics before vs after
- Remaining opportunities (if any).

---

## 🔧 Configuration (Summary)

Key configuration parameters (full details in `LOOP-SELECTION-AND-CONFIG.md`):

- **Target Types & Thresholds**
  - Which metrics to optimize and their quantitative targets

- **Risk Tolerance**
  - How aggressive optimizations are allowed to be
  - E.g., small refactors only vs larger structural changes

- **Iteration Budget**
  - Maximum number of optimization iterations per run
  - Optional time-based limits

- **Rollback Policy**
  - Handling cases where metrics worsen or tests fail

---

## 🧪 Example Scenarios

### Scenario A: API Performance Tuning

1. Capture baseline latency/throughput for key endpoints.
2. Set targets (e.g., 30% latency reduction on `/checkout`).
3. Apply caching and query/index changes.
4. Re-measure; repeat until targets are met or budget is exhausted.

### Scenario B: Frontend UX Polish

1. Run Lighthouse on key pages.
2. Set goals (e.g., performance ≥ 90, accessibility ≥ 90).
3. Optimize assets, fix contrast/ARIA issues.
4. Re-run Lighthouse, iterate as needed.

---

## ✅ Success Criteria for This Loop

The Polish & Optimization Loop is successful when:

- Measurable improvements are achieved without functional regressions.
- The system can document optimization attempts and their effects.
- It can be safely run after core functionality is stabilized via other loops.

It should be selectable as:

- A follow-up to successful Spec‑Driven or TDD loops
- A targeted tool during performance or UX-focused sprints.
