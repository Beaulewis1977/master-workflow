# Architecture & Planning Loop (Docs-First)

## 🎯 Overview

This document defines the **Architecture & Planning Loop** ("planning/docs-first" loop) for Master Workflow 3.0.

Purpose:

- For **new and existing projects**, perform a deep planning + documentation cycle **before** or **alongside** code changes.
- Produce:
  - Architecture & system blueprints
  - Diagrams (e.g. Mermaid)
  - PRD-level docs (product requirements)
  - Project management structures (epics, stories, phases, tasks)
  - Integration/handoff docs for agents and humans
- Continuously **update** these documents as work progresses, including:
  - README
  - Integration/progress docs
  - Internal coordination docs for agents

This loop focuses on **thinking and writing** rather than implementing code, and then hands off to other loops (Spec‑Driven, TDD, Legacy, Polish).

---

## 🧩 Role in the Loop Ecosystem

The Architecture & Planning Loop is designed to:

- Run **early** in the lifecycle (for new projects or big features)
- Run **on demand** for existing or legacy projects when planning/docs are weak
- Feed other loops with:
  - Clear specs and architecture
  - Phased build plans
  - Internal agent coordination docs

Typical sequences:

- **New project:**
  - Architecture & Planning → Spec‑Driven App Build → TDD → Polish

- **Existing project, new feature:**
  - Architecture & Planning (feature-level) → Spec‑Driven or TDD

- **Legacy project:**
  - Legacy Rescue → Architecture & Planning (once structure understood) → Spec‑Driven/TDD

---

## ⚙️ Preconditions & Inputs

### Supported Inputs

This loop is intentionally flexible. It can start from:

- A simple **initial prompt** describing the idea
- Existing docs:
  - `README.md`
  - `ARCHITECTURE.md` / `docs/` folder
  - ADRs (architecture decision records)
- Existing codebase (any stage):
  - Fresh project with almost no code
  - Large, mature system with many modules

### Technical Preconditions

- Node.js ≥ 18
- Master Workflow environment is available around the project:
  - `.ai-workflow/` present or to be created by installer

Optional but recommended:

- Internet / MCP access for **web search and external knowledge**, where allowed.

---

## 🧠 Loop Phases (Conceptual)

> This is a behavioural spec, not concrete API. Exact function names and module boundaries are left to implementation docs/agents.

### Phase 1: Input Harvesting & Discovery

**Goal:** Collect all relevant context from the project and outside sources.

**Activities:**

1. **Local project scan**
   - Use ProjectBootstrapAgent + Queen code archaeology to:
     - List languages, frameworks, major folders
     - Identify existing docs, diagrams, config files
     - Detect obvious bounded contexts / domains

2. **Doc ingestion**
   - Read:
     - README, existing architecture docs
     - Any existing ADRs or design docs
     - Issues/tickets if available (future integration)

3. **Prompt & instructions analysis**
   - Parse the initial user prompt / build docs / goal statements.
   - Extract:
     - Constraints
     - Success criteria
     - Milestones or deadlines

4. **External knowledge (where allowed)**
   - Use web/MCP search to:
     - Pull in stack-specific best practices
     - Check for common architectures and pitfalls

**Outputs:**

- `planningContext` structure:
  - Existing architecture & gaps
  - Inputs & constraints
  - Applicable patterns/best practices

---

### Phase 2: Architecture & Blueprint

**Goal:** Define a clear, high-level architecture and system blueprint.

**Activities:**

- Identify or define:
  - System context (users, external systems, data sources)
  - Major components/services/modules
  - Data flows and integration points
  - Key decisions (e.g. monolith vs microservices, DB choices)

- Produce:
  - **Architecture overview doc** (e.g. `docs/ARCHITECTURE.md`)
  - **Diagrams** (Mermaid or similar), such as:
    - System context diagrams
    - Container/component diagrams
    - Sequence diagrams for critical flows

**Outputs:**

- `architectureDoc` (markdown, versioned)
- `diagrams` (inline Mermaid and/or generated files)

---

### Phase 3: Product Requirements & PRD

**Goal:** Capture product-centric requirements, not just technical architecture.

**Activities:**

- Draft a **PRD-style document**, including:
  - Problem statement & goals
  - User personas and primary use cases
  - Functional requirements
  - Non-functional requirements (performance, reliability, security, compliance)
  - Success metrics / KPIs

- For existing projects:
  - Reconcile current behaviour with desired behaviour
  - Mark deltas and migrations clearly

**Outputs:**

- `PRD` document (e.g. `docs/PRD.md` or `docs/product/PRD-<feature>.md`)

---

### Phase 4: Project Management Structure (Epics / Stories / Phases)

**Goal:** Turn architecture + PRD into an **execution plan**.

**Activities:**

- Break work into:
  - **Phases** (e.g. MVP → Beta → GA)
  - **Epics** (major capabilities)
  - **User stories / tasks** (implementable units)

- Include for each epic/story:
  - Description
  - Acceptance criteria
  - Dependencies
  - Suggested loop profile for implementation (Spec‑Driven, TDD, Legacy Rescue, Polish)

- Output formats:
  - Markdown roadmap (e.g. `docs/ROADMAP.md`)
  - Optional machine-readable plan (JSON/YAML) for agents to consume

**Outputs:**

- `projectPlan`:
  - `phases[]`
  - `epics[]`
  - `stories[]`
- Roadmap and planning docs on disk

---

### Phase 5: Handoff, Integration & Agent Coordination Docs

**Goal:** Create documents that help **agents and humans** work together.

**Activities:**

- Generate:
  - **Implementation playbooks**:
    - How different agents should approach certain epics (e.g., builder agents vs test agents)
  - **Integration docs**:
    - How new components should plug into existing systems
  - **Handoff docs**:
    - What context is needed when moving from planning → implementation → polishing

- Define a **message-passing convention between agents via docs**, e.g.:
  - Each loop/epic can have a log/notes file where agents append:
    - Progress updates
    - TODOs for other agents
    - Decisions taken and rationale

**Outputs:**

- `handoffDocs` and `agentPlaybooks` (markdown)
- Initialized internal doc/message files for collaboration

---

### Phase 6: Live Doc Updates & Continuous Planning

**Goal:** Keep docs and plans **in sync** as the project evolves.

**Activities:**

- On each iteration (or when triggered by other loops):
  - Re-scan code and configuration for changes.
  - Update:
    - README sections (e.g. feature lists, setup steps)
    - Integration/progress docs (e.g. `docs/INTEGRATION-NOTES.md`, `docs/PROGRESS-LOG.md`)
    - PRD & architecture docs when scope changes
  - Adjust project plan:
    - Mark completed epics/stories
    - Add new ones discovered by implementation loops

- Generate **release-ready handoff docs**:
  - For other teams (QA, ops, stakeholders)
  - For the autonomous system itself (next loops)

**Outputs:**

- Continuously updated documentation
- Logs of planning iterations (for audit)

---

## 📁 Doc Locations & Internal Doc Space

The loop distinguishes between **user-facing docs** and **internal agent docs**.

### User-Facing Docs (Examples)

These live in visible project locations such as:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/PRD.md`
- `docs/ROADMAP.md`
- `docs/INTEGRATION-NOTES.md`
- `docs/PROGRESS-LOG.md`

Exact filenames/paths can be configured, but the pattern is:

- Top-level or `docs/` folder
- Clear, human-readable structure

### Internal Agent Docs & Message Space

For **agent-only** docs and coordination, the loop uses a dedicated internal area under `.ai-workflow/`, for example:

- `.ai-workflow/internal-docs/planning-loop/`

Within this folder, the system can maintain:

- `context-<timestamp>.md` – snapshots of planning context
- `epic-<id>-log.md` – per-epic agent notes & progress
- `loop-iterations.md` – summary of planning iterations
- `decisions.md` – key architecture/product decisions (agent-facing version)

Agents are expected to:

- **Read** relevant internal docs at the start of their work
- **Append** messages/updates in a structured, append-only fashion
- Use simple patterns (e.g. YAML frontmatter or markdown sections) so other agents can parse entries.

These internal docs are **not required** to be stable or polished; they are optimized for **machine + agent collaboration**.

---

## 🌐 Use of Web Search & External Knowledge

The Architecture & Planning Loop may use web/MCP search when allowed by configuration to:

- Discover best practices for the projects stack
- Fetch example architectures, patterns, and anti-patterns
- Suggest libraries or SaaS integrations

Configuration options (see selection/config doc):

- Enable/disable external search globally or per project
- Domains/knowledge sources allowed
- Time/usage limits per planning iteration

---

## 🔧 Configuration Hooks (Summary)

The full configuration schema will be detailed in `LOOP-SELECTION-AND-CONFIG.md`, but key knobs specific to this loop include:

- **Doc Coverage Expectations**
  - Required docs (ARCHITECTURE, PRD, ROADMAP, etc.) before exit

- **Planning Strictness**
  - How complete docs must be before handing off to implementation loops

- **Interactive vs Autonomous Modality**
  - Whether user approvals are required for major plan/architecture changes

- **Internal Doc Storage Path**
  - Default: `.ai-workflow/internal-docs/planning-loop/`
  - Overridable per project

---

## ✅ Success Criteria for This Loop

The Architecture & Planning Loop is successful when:

1. It can take *any* combination of prompt, docs, and existing code and produce:
   - Clear architecture docs
   - PRD-level requirements
   - Phased project plan (phases, epics, stories, tasks)
   - Handoff docs and internal coordination docs

2. It **iteratively refines** these artifacts until configured completeness thresholds are met.

3. It can update docs **live** as other loops (Spec‑Driven, TDD, Legacy, Polish) make changes, keeping:
   - README
   - Integration/progress docs
   - Internal agent docs
   in sync with reality.

4. It provides clean handoff to other loops by:
   - Tagging epics/stories with recommended loop profiles
   - Creating internal notes that sub-agents can read and extend.
