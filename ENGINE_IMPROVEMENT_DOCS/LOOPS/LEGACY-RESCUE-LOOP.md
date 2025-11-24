# Legacy Rescue Loop (Old, Messy, or Under-Tested Projects)

## 🎯 Overview

This document defines the **Legacy Rescue Loop**, a build loop profile designed for:

- Older, messy, or poorly-documented projects
- Low-test-coverage systems that are risky to change
- Monolithic or "big ball of mud" architectures

The key idea:

> **First build a safety net (characterization tests & baselines), then iteratively modernize and refactor behind that net.**

This loop is more conservative than the Spec‑Driven or TDD loops and is focused on:

- Understanding existing behaviour
- Preserving critical functionality
- Gradual refactoring and modularization

---

## 🧩 Use Cases

- Legacy services with years of ad hoc changes
- Apps with limited or unreliable tests
- Mixed tech stacks inside a single repo
- Systems where no single person fully understands all behaviours

---

## ⚙️ Preconditions & Inputs

### Technical Preconditions

- Node.js ≥ 18
- Ability to run the Master Workflow environment around the project:
  - Even if the project itself is not Node-based, Master Workflow can operate as an **orchestration overlay**, using external tools and test commands.

### Logical Inputs

- The **project root** to analyze.
- Optional indicators of:
  - Critical modules or flows (payments, auth, etc.)
  - Known pain points or recent production incidents.

---

## 🧠 Loop Phases (Conceptual)

### Phase 1: Deep Archaeological Analysis

**Goal:** Build a **map of the system** and identify high-risk, high-value areas.

**Activities:**

- Use Code Archaeology Engine (`excavateCodebase`) to:
  - Map modules, dependencies, and coupling
  - Detect hotspots (complexity, change frequency, size)
  - Find potential "seams" for modularization
- Use AgentDB and ReasoningBank to aggregate insights:
  - Past patterns
  - Known anti-patterns
- Generate a **Legacy Landscape Report**:
  - Key components and domains
  - Risk map (by module or area)
  - Suggested entry points for rescue work

**Outputs:**

- `legacyAnalysis` structure:
  - Architectural sketch
  - Hotspot list
  - Suggested work order

---

### Phase 2: Safety Net Creation (Characterization Tests & Baselines)

**Goal:** Establish a **reliable baseline** for current behaviour before any drastic changes.

**Activities:**

- Identify critical flows:
  - Authentication
  - Billing
  - Data persistence
  - Integrations with external systems
- For each critical flow:
  - Create characterization tests capturing **current** behaviour (even if not ideal).
  - Add smoke tests and health checks.
- Establish baseline metrics:
  - Test pass/fail status
  - Response times / throughput for key paths
  - Error rates and log patterns (if accessible)

**Outputs:**

- A suite of **baseline tests** that must remain green.
- Recorded metrics for each baseline run.

---

### Phase 3: Rescue Plan & Strangler Design

**Goal:** Plan **incremental improvements** that can be safely made behind the safety net.

**Activities:**

- Identify areas for:
  - Modularization (e.g., split large files into cohesive modules)
  - Interface extraction (define clear boundaries between concerns)
  - Strangler patterns (gradually replace old surfaces with new ones)
- Prioritize by:
  - Risk (user-facing impact, security, financial)
  - Dependency chains (work from edges inward where possible)
- Generate a **Rescue Plan** document containing:
  - Ordered list of refactor/modernization steps
  - Associated tests or baseline checks per step

**Outputs:**

- `legacyRescuePlan` with explicit, small, testable steps.

---

### Phase 4: Incremental Refactor & Modernization

**Goal:** Execute the rescue plan in **small, reversible steps**.

**Activities (for each step in the plan):

1. Re-run baseline tests to ensure the starting point is stable.
2. Apply a small, focused change:
   - Extract a module
   - Improve naming and structure
   - Introduce a clearer interface
3. Run baseline + targeted tests.
4. If anything breaks:
   - Either fix the issue
   - Or roll back and update the plan.

**Outputs:**

- Gradually improved architecture and code quality.
- Updated documentation as structure becomes clearer.

---

### Phase 5: Periodic Re-Assessment & Exit Decision

**Goal:** Periodically decide whether to continue rescuing, switch loop profiles, or exit.

**Activities:**

- After N iterations, re-run:
  - Archaeology analysis
  - Metrics collection
- Compare against starting point:
  - Reduced complexity in key modules
  - Fewer critical hotspots
  - Improved test coverage and baseline robustness
- Decide to:
  - Continue with further rescue iterations
  - Switch to **Spec‑Driven** for new features on top of the rescued core
  - Use **Polish Loop** for performance and UX once structure is acceptable

**Exit Criteria (Configurable):**

- Enough structure and tests exist that other loop profiles can take over safely.
- Critical legacy hotspots have been addressed or isolated.

---

## 🔧 Configuration (Summary)

Key configuration aspects (detailed in `LOOP-SELECTION-AND-CONFIG.md`):

- **Risk Prioritization Strategy**
  - Security-first
  - Revenue-first
  - User-impact-first

- **Max Change Size per Iteration**
  - Limits on LOC changed or files touched

- **Baseline Strictness**
  - How strict baseline test adherence must be before applying a refactor

- **Iteration & Reassessment Schedules**
  - How often to run full archaeology + reporting

---

## 🧪 Example Scenarios

### Scenario A: Monolithic Node.js API with Spaghetti Routes

1. Run archaeological analysis to map routes and services.
2. Build characterization tests around critical endpoints.
3. Identify modules to extract (e.g., auth, billing).
4. Apply small refactors guarded by tests.
5. After several iterations, shift new features to the Spec‑Driven loop, using the now-cleaner structure.

### Scenario B: Mixed Tech Legacy App

1. Use archaeology to understand language boundaries (e.g., PHP + Node + Python).
2. Build baseline health checks and black-box tests around public APIs.
3. Gradually modernize individual components while maintaining those external contracts.

---

## ✅ Success Criteria for This Loop

The Legacy Rescue Loop is successful when it enables:

- Safer changes to previously high-risk areas.
- Progressive improvement in structure and test coverage.
- A clear handoff to other loops (Spec‑Driven, TDD, Polish) once the system is sufficiently understood and stabilized.

It should be the **recommended default loop** when:

- Complexity Analyzer scores a project high in complexity and low in test coverage.
- The user flags the project as "legacy" or "risky" in the installer.
