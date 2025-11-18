---
description: Manage SPARC methodology phases for enterprise development
argument-hint: "[init|phase|status|validate] [1-5]"
allowed-tools: Read, Write, MultiEdit, Task, TodoWrite, Bash
model: opus
---

# SPARC Methodology Management

Execute and manage the 5-phase SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology for enterprise projects.

## SPARC Phases
1. **Specification**: Requirements gathering and success criteria
2. **Pseudocode**: Algorithm design and data structures
3. **Architecture**: System design and component architecture
4. **Refinement**: Optimization and quality improvements
5. **Completion**: Final implementation and deployment

## Commands
- `/sparc init` - Initialize SPARC for current project
- `/sparc phase 1` - Start Phase 1: Specification
- `/sparc phase 2` - Start Phase 2: Pseudocode
- `/sparc phase 3` - Start Phase 3: Architecture
- `/sparc phase 4` - Start Phase 4: Refinement
- `/sparc phase 5` - Start Phase 5: Completion
- `/sparc status` - Check current phase and progress
- `/sparc validate` - Validate phase completion criteria

## Phase Deliverables
### Phase 1: Specification
- requirements.md
- user-stories.md
- acceptance-criteria.md
- constraints.md

### Phase 2: Pseudocode
- algorithms.md
- data-structures.md
- flow-diagrams.md
- complexity-analysis.md

### Phase 3: Architecture
- architecture.md
- component-design.md
- interface-definitions.md
- deployment-architecture.md

### Phase 4: Refinement
- optimization-report.md
- refactoring-plan.md
- performance-benchmarks.md
- security-audit.md

### Phase 5: Completion
- implementation-checklist.md
- test-results.md
- deployment-guide.md
- operations-manual.md

## Quality Gates
Each phase has strict quality gates that must be passed before proceeding:
- All deliverables complete
- Stakeholder approval obtained
- Tests passing
- Documentation updated

Use sparc-methodology-agent to manage all SPARC operations with proper phase validation and transition management.