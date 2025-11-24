# Loop Selection & Configuration (Queen + Installer)

## 🎯 Overview

This document defines **how build loops are selected and configured** in Master Workflow 3.0.

Goals:

- Allow **automatic loop selection** based on project analysis
- Allow **user override** via interactive installer and commands
- Provide a **central configuration model** for all loop profiles

The loops considered here are:

- Architecture & Planning Loop (docs-first)
- Spec‑Driven App Build Loop
- Incremental TDD Loop
- Legacy Rescue Loop
- Polish & Optimization Loop

---

## 🧠 Actors & Components

### Queen-Side Components

- **Complexity Analyzer Agent**
  - Computes project complexity score (0–100)
  - Detects project stage (idea / early / active / mature)
  - Detects tech stack(s)

- **Approach Selector Agent**
  - Maps analysis → recommended approach/loop
  - Outputs confidence and rationale

- **IntegratedQueenController**
  - Executes tasks using the chosen loop profile (once implemented)

### Installer / User-Facing Components

- **Interactive Installer**
  - Asks the user which loop style they want to use
  - Presents recommended default based on analysis

- **Slash Commands / CLI**
  - e.g. `/workflow loop spec-driven`, `/workflow loop auto`
  - Provide direct control over loop choice per task.

---

## 🔁 Loop Selection Logic (Design)

> **Note:** This section describes *intended* behaviour. Actual code integration is deferred until engine improvements are implemented.

### 1. Project Analysis → Loop Recommendation

On first run (or when requested), the system performs a **Project Analysis** via the Complexity Analyzer Agent:

- Complexity score (0–100)
- Project stage: idea / early / active / mature
- Tech stack(s) and languages
- Test coverage and quality heuristics (if available)

Based on this, the Approach Selector Agent recommends a **default loop profile** using a ruleset such as:

- If **stage in {idea, early}** or **documentation/planning is weak**:
  - Recommend: **Architecture & Planning Loop** (run first to create/align architecture, PRD, and roadmap)
- If **complexity ≤ 30** and **stage in {idea, early}** and **docs are already solid**:
  - Recommend: **Spec‑Driven App Build Loop**
- If **complexity in [31, 70]**, **stage in {active, mature}**, and **coverage is decent**:
  - Recommend: **Incremental TDD Loop**
- If **complexity ≥ 70** and **coverage is low** or code appears highly coupled:
  - Recommend: **Legacy Rescue Loop**
- If **stage == mature** and user selects "optimize" or metrics show performance issues:
  - Recommend: **Polish & Optimization Loop**

The recommendation is presented with:

- Loop name and description
- Reasoning (key analysis factors)
- Confidence level

---

### 2. User Override via Installer

During interactive installation or configuration, the user is prompted:

> **"Select build loop style for this project"**
>
> - Auto (recommended): [Recommended Loop Name]
> - Architecture & Planning (docs-first architecture/PRD/roadmap)
> - Spec‑Driven (new projects & major features)
> - Incremental TDD (test-first increments)
> - Legacy Rescue (old/messy projects)
> - Polish & Optimization (performance/UX)

The user may:

- Accept the **Auto** recommendation (Queen decides based on analysis)
- Manually override and choose a different default loop profile

The choice is stored in a project-local config file (see below).

---

### 3. Per-Task Loop Overrides

Even if a project has a default loop, specific tasks can override it:

- Slash commands or CLI:
  - `/workflow loop planning "Design architecture and roadmap for new auth system"`
  - `/workflow loop spec-driven "Build new reporting dashboard"`
  - `/workflow loop tdd "Finish payment validation logic"`
  - `/workflow loop legacy "Stabilize accounting module"`
  - `/workflow loop polish "Optimize API latency"`

If no explicit loop is given for a task:

- The system falls back to the **project default loop**.

---

## 🗂 Loop Configuration Model (Design)

Loop configuration will be stored in a simple, human-editable format under `configs/`, for example:

- `configs/build-loops.yaml` (global defaults)
- `.ai-workflow/configs/build-loop.json` (project-local overrides)

### Example: Global Loop Config (YAML Sketch)

```yaml
profiles:
  planning:
    description: "Architecture & Planning loop for docs-first work"
    maxIterations: 8
    exitCriteria:
      requireArchitectureDoc: true
      requirePRD: true
      requireProjectPlan: true

  spec-driven:
    description: "Spec-first loop for new apps/features"
    maxIterations: 10
    exitCriteria:
      requireSpecsApproved: true
      requireAllFeatureTestsPass: true
      requireNoCriticalLints: true
      minCoverage: 0.7

  tdd:
    description: "Incremental TDD loop for in-progress code"
    maxIterations: 20
    exitCriteria:
      requireNewTestsGreen: true
      forbidNewRegressions: true

  legacy-rescue:
    description: "Conservative loop for legacy codebases"
    maxIterations: 30
    rescueMode: true
    exitCriteria:
      minBaselineCoverage: 0.4
      minHotspotRefactors: 3

  polish:
    description: "Optimization loop for performance/UX polish"
    maxIterations: 15
    exitCriteria:
      targetMetrics:
        - metric: "latency.p95"
          target: "<= 300ms"
        - metric: "lighthouse.performance"
          target: ">= 90"
```

### Example: Project-Local Override

```json
{
  "defaultProfile": "spec-driven",
  "overrides": {
    "legacy-modules/*": "legacy-rescue",
    "payments/*": "tdd",
    "frontend/*": "polish"
  }
}
```

The project-local file allows certain directories or modules to default to specific loops.

---

## 🔐 Safety & Governance

To avoid unintended consequences, loop selection and configuration obey the following principles:

- **Non-destructive defaults**
  - Loops must not delete large amounts of code or data.
  - Destructive actions (like uninstallation) remain in separate, explicitly-invoked tools.

- **Iteration Limits**
  - Every profile has a `maxIterations` or other guardrail.
  - The system stops and reports rather than looping forever.

- **Human-In-The-Loop** (optional but recommended)
  - For high-risk areas (security, finance), require human approval between iterations.

- **Auditability**
  - Log selected profiles, decisions, and iterations.
  - Make it easy to review what the system did and why.

---

## ✅ Success Criteria for Loop Selection & Config

This design will be considered successful when:

1. Projects can define a **default loop profile** and **per-area overrides**.
2. The Queen can recommend sensible defaults based on analysis.
3. Users can easily override and choose loop styles via installer and commands.
4. Loops always operate within **clear safety bounds**, with no implicit destructive behaviour.

Once the loop engines are implemented according to the other LOOPS documents, this config & selection layer will allow Master Workflow 3.0 to adapt its strategy to:

- New greenfield projects
- In-progress features
- Legacy rescue efforts
- Late-stage polish and optimization.
