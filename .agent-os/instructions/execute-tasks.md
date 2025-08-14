# Execute Tasks Command

## Purpose
Complete development tasks using the neural swarm architect and coordinated sub-agents with maximum efficiency.

## Agent Assignment
- **Primary Agent**: 1-neural-swarm-architect.md
- **Context Window**: 200,000 tokens
- **Layer Priority**: Specifications (high), Standards (high), Product (low)

## Context Loading Strategy
1. **Specifications Layer** (Always load): Current task specifications, related features
2. **Standards Layer** (Always load): Coding standards, architecture patterns, testing requirements
3. **Product Layer** (Minimal load): Only high-level architecture constraints

## Process Flow
1. **Task Analysis**
   - Load task specification from .agent-os/specs/
   - Analyze complexity and resource requirements
   - Determine optimal agent assignment strategy
   - Plan parallel execution where possible

2. **Agent Coordination**
   - Distribute tasks across specialized sub-agents
   - Coordinate with Queen Controller for resource allocation
   - Monitor progress across 10 concurrent agent limit
   - Handle inter-agent communication and data sharing

3. **Implementation Phase**
   - Execute tasks using appropriate specialized agents:
     - **API Builder**: For backend API development
     - **Frontend Specialist**: For UI/UX implementation
     - **Database Architect**: For data layer changes
     - **Integration Coordinator**: For external service integration
     - **Test Engineer**: For test implementation

4. **Quality Assurance**
   - Run automated tests via Test Automation Engineer
   - Perform code review via CEO Quality Control
   - Validate against specifications
   - Ensure compliance with coding standards

5. **Integration & Deployment**
   - Coordinate deployment via Deployment Engineer
   - Monitor performance via Metrics Monitoring Engineer
   - Handle rollback if needed via Error Recovery Specialist

## Expected Outputs
- Completed feature implementation
- Updated codebase with new functionality
- Test suite covering new features
- Documentation updates
- Performance metrics and monitoring

## Agent Specialization Map
```json
{
  "backend": ["api-builder-agent.md", "database-architect-agent.md"],
  "frontend": ["frontend-specialist-agent.md"],
  "testing": ["test-automation-engineer.md", "testing-validation-agent.md"],
  "deployment": ["deployment-engineer-agent.md"],
  "integration": ["integration-coordinator-agent.md", "mcp-integration-specialist.md"],
  "performance": ["performance-optimizer-agent.md", "metrics-monitoring-engineer.md"],
  "security": ["security-auditor.md", "security-scanner-agent.md"],
  "documentation": ["doc-generator-agent.md", "document-customizer-agent.md"]
}
```

## Context Optimization
- **Target Reduction**: 80% context reduction by task-specific loading
- **Agent Isolation**: Each sub-agent maintains separate 200k context
- **Shared Memory**: Use SQLite persistence for cross-agent data sharing
- **Event-Driven**: Real-time coordination without context pollution

## Parallel Execution Strategy
1. **Task Decomposition**: Break complex features into parallel sub-tasks
2. **Agent Assignment**: Map sub-tasks to specialized agents
3. **Dependency Management**: Handle task dependencies and ordering
4. **Resource Balancing**: Optimize across 10 concurrent agent limit

## Command Syntax
```bash
/execute-tasks [task-id|spec-name] [--parallel] [--agents=N] [--priority=high|medium|low]
```

## Success Criteria
- All specified tasks completed successfully
- Code quality maintained per standards
- Tests passing with adequate coverage
- Documentation updated
- Performance metrics within acceptable ranges
- No regression in existing functionality
- Integration with Queen Controller maintained