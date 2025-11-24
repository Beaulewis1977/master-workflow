# Autonomous Build Loop System - Overview

## 🎯 Purpose

This document defines the **Autonomous Build Loop System** for Master Workflow 3.0.

Goal: provide a small, well-defined set of **build loop profiles** that Master Workflow can run repeatedly to:

- Analyze an *existing or new* project
- Generate / refine docs and specs
- Implement or modify code
- Run tests and quality checks
- Evaluate results against explicit targets
- Repeat until the feature/app is "done" or "polished" by defined criteria

All of this must fit cleanly into the existing architecture:

- `MasterWorkflow3` (core orchestrator)
- `IntegratedQueenController`
- `ProjectBootstrapAgent`
- `AutonomousImplementationRunner`
- Queen sub-agents (Complexity Analyzer, Approach Selector, etc.)

> **Important:** This document and its siblings describe **design and implementation plans only**. They do **not** imply the loops are already implemented.

---

## 🤖 For Agents: How to Execute This Folder

This folder is designed to be executable **by agents** as a set of playbooks. A typical autonomous flow is:

1. **Start here** – Read this file (`LOOP-SYSTEM-OVERVIEW.md`) to learn the five loop profiles and when to use each.
2. **Analyze the project** – Use the Complexity Analyzer + Approach Selector to compute:
   - Complexity, stage, stack, coverage, documentation quality.
3. **Select a loop profile** – Follow `LOOP-SELECTION-AND-CONFIG.md` to:
   - Derive a recommended loop (`planning`, `spec-driven`, `tdd`, `legacy-rescue`, `polish`).
   - Apply project/user overrides from configuration or the interactive installer.
4. **Open the loop’s spec** – Read the corresponding loop document:
   - `ARCHITECTURE-AND-PLANNING-LOOP.md`
   - `NEW-PROJECT-SPEC-DRIVEN-LOOP.md`
   - `INCREMENTAL-TDD-LOOP.md`
   - `LEGACY-RESCUE-LOOP.md`
   - `POLISH-OPTIMIZATION-LOOP.md`
   and treat it as the phase-by-phase contract for this run.
5. **Execute phases iteratively** – For the chosen loop:
   - Run phases in order (analysis → docs/specs → implementation → tests → evaluation, etc.).
   - Write artifacts exactly where the spec says (user-facing docs, internal `.ai-workflow/internal-docs/...` locations).
   - Stop or hand off only when that loop’s exit criteria are satisfied.
6. **Chain loops when needed** – Once one loop completes, you may:
   - Re-run selection to choose the next appropriate loop (e.g., Planning → Spec‑Driven → TDD → Polish).
   - Use updated docs/metrics from previous loops as inputs.

Agents should **never assume** loops are implemented; instead, they should treat these docs as the source of truth for how to implement and run each loop safely.

---

## 🧠 Loop Profiles (High-Level)

We define five primary loop profiles:

1. **Architecture & Planning Loop** (docs-first planning for new & existing projects)
2. **Spec‑Driven App Build Loop** (new projects / major features)
3. **Incremental TDD Loop** (in-progress or mostly-done modules, TDD‑style)
4. **Legacy Rescue Loop** (older, messy, partially understood projects)
5. **Polish & Optimization Loop** (late-stage performance / UX / code quality)

Each loop profile is:

- A **named strategy** with clear phases
- Configurable via project-level configuration
- Selectable by:
  - The Queen + Complexity Analyzer (automatic), and/or
  - The interactive installer / `/workflow` commands (manual override)

### 1. Architecture & Planning Loop (Docs-First)

**Primary use cases:**

- New or existing projects where architecture, PRD, and plans are incomplete
- Early-phase work where stack/architecture decisions are not yet solid
- Projects that need clear roadmaps, epics/stories, and handoff docs before heavy implementation

**Key idea:**

> Think first: gather all inputs (prompt, existing docs, code, web knowledge) → create and refine architecture, PRD, diagrams, and phased plans → maintain live docs and internal coordination notes for agents.

See: `ARCHITECTURE-AND-PLANNING-LOOP.md`.

---

### 2. Spec‑Driven App Build Loop (New & Structured Work)

**Primary use cases:**

- New projects / greenfield development
- Major new features requiring specs & architecture
- Projects where good docs/architecture are a priority from day one

**Key idea:**

> Iterate: intent → analysis → specs → implementation → tests → refine until specs + tests + basic quality gates are satisfied.

See: `NEW-PROJECT-SPEC-DRIVEN-LOOP.md`.

---

### 3. Incremental TDD Loop (In‑Progress or Mostly Done Projects)

**Primary use cases:**

- Existing projects that are already mostly working
- Features in progress that need to be finished safely
- Bug fixes where regression safety is critical

**Key idea:**

> Small steps: write/expand tests first → minimal change to go green → regressions & coverage checks → repeat.

Applies to both:

- New behaviour (test-first for new functionality)
- Existing behaviour (characterization tests before refactors)

See: `INCREMENTAL-TDD-LOOP.md`.

---

### 4. Legacy Rescue Loop (Old / Messy Projects)

**Primary use cases:**

- Older, messy, monolithic or poorly-documented repos
- Systems with low test coverage and high risk
- "Big ball of mud" architectures that cannot be safely changed in one shot

**Key idea:**

> First, build a *safety net* (characterization tests & baselines), then iteratively refactor and modernize behind that net.

Emphasis on:

- Discovery & classification (code archaeology)
- Characterization tests over critical flows
- Strangler patterns and modularization

See: `LEGACY-RESCUE-LOOP.md`.

---

### 5. Polish & Optimization Loop (Refinement)

**Primary use cases:**

- Late in a feature/app lifecycle
- Before release or performance-sensitive milestones
- When functionality is correct but not efficient/clean enough

**Key idea:**

> Capture baseline metrics → choose optimization strategies → apply changes → re-measure → repeat until targets hit.

Targets may be:

- Performance metrics (latency, throughput, CPU/memory)
- Code quality (lint issues, complexity)
- UX metrics (Lighthouse, accessibility)

See: `POLISH-OPTIMIZATION-LOOP.md`.

---

## 🧩 Architectural Fit

### Existing Components We Will Reuse

- **`MasterWorkflow3`**
  - Provides the main runtime, entry points, and status.
  - Already integrates:
    - `IntegratedQueenController`
    - `FlowOrchestrator`
    - `AutonomousBuilder`.

- **`IntegratedQueenController`**
  - Bridges CommonJS Queen + ES module intelligence engines.
  - Provides task execution, quantum memory, swarm learning, and code archaeology.

- **`ProjectBootstrapAgent`**
  - Already capable of analyzing new/existing projects and generating docs.
  - Will be a key component in the Architecture & Planning, Spec‑Driven, and Legacy Rescue loops.

- **`AutonomousImplementationRunner`**
  - Already orchestrates the implementation of autonomous documentation features.
  - Serves as a template for how a build loop can structure multi-step autonomous work.


### New High-Level Pieces (Design Only)

The loop system will primarily introduce **coordination logic and configuration**, not new heavy engines:

- **Build Loop Orchestrator (design)**
  - A conceptual module responsible for:
    - Running loop iterations
    - Tracking progress/metrics
    - Evaluating exit criteria.
  - It will delegate real work to existing components like `MasterWorkflow3`, Queen sub-agents, test runners, etc.

- **Loop Profile Definitions (design)**
  - Loop profiles will be defined in configuration (likely YAML/JSON in `configs/`):
    - Phases, actions, metrics, exit criteria, safety limits.

- **Loop Selection Logic (design)**
  - Queen + Complexity Analyzer + Approach Selector will:
    - Recommend a default loop profile for a given project/feature.
  - Interactive installer and slash commands will allow manual override.

> All of the above are *design targets*. Implementation is intentionally deferred until documentation and plans are stable.

---

## 🔧 Projects & Scenarios Supported

The loop system is explicitly designed for:

1. **New Projects**
   - Empty or nearly-empty repos
   - Early-stage architecture & stack decisions

2. **In-Progress / Mostly Done Features**
   - Feature branches mid-way through implementation
   - Modules which have some tests and structure but are not complete

3. **Older, Messy Projects (Legacy Rescue)**
   - Poorly documented monoliths
   - Low test coverage
   - Mixed styles/technologies

4. **Mature, Production Systems**
   - Apps where correctness is known but polish/performance is lacking

Each of these scenarios maps cleanly to one or more loop profiles, as described in the per-loop documents.

---

## ✅ Non-Goals

To keep this system safe and realistic, we explicitly **do not** aim for:

- Fully autonomous, self-modifying code with no human oversight
- Automatic uninstallation of scaffolding or core components without explicit commands
- Guaranteed optimal architectures or performance; loops aim for *configured* targets, not perfection

These boundaries keep the loop system sane and compatible with existing safety expectations in Master Workflow.

---

## 📎 Related Documents

- `ENGINE_IMPROVEMENT_DOCS/README.md` – overall engine improvement context
- `ENGINE_IMPROVEMENT_DOCS/1-GPU-ACCELERATOR-FIX-PLAN.md` – GPU engine plan
- `ENGINE_IMPROVEMENT_DOCS/2-PREDICTIVE-ANALYTICS-FIX-PLAN.md` – predictive analytics
- `ENGINE_IMPROVEMENT_DOCS/3-AUTO-TUNER-FIX-PLAN.md` – auto-tuner
- `ENGINE_IMPROVEMENT_DOCS/4-SWARM-LEARNING-FIX-PLAN.md` – swarm intelligence
- `ENGINE_IMPROVEMENT_DOCS/5-PATTERN-DISCOVERY-FIX-PLAN.md` – deep pattern discovery

Loop-specific docs in this folder:

- `ARCHITECTURE-AND-PLANNING-LOOP.md`
- `NEW-PROJECT-SPEC-DRIVEN-LOOP.md`
- `INCREMENTAL-TDD-LOOP.md`
- `LEGACY-RESCUE-LOOP.md`
- `POLISH-OPTIMIZATION-LOOP.md`
- `LOOP-SELECTION-AND-CONFIG.md`
