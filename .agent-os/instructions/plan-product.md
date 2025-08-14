# Plan Product Command

## Purpose
Initialize product structure and planning using the orchestration coordinator agent with 200k context window.

## Agent Assignment
- **Primary Agent**: 1-orchestration-coordinator.md
- **Context Window**: 200,000 tokens
- **Layer Priority**: Standards (high), Product (medium), Specifications (low)

## Context Loading Strategy
1. **Standards Layer** (Always load): Global coding preferences, architecture patterns
2. **Product Layer** (Conditional): Existing product documentation, business requirements
3. **Specifications Layer** (Skip): Individual feature specs not needed for planning

## Process Flow
1. **Analysis Phase**
   - Load current project structure
   - Analyze existing codebase complexity (39/100)
   - Identify technology stack (JavaScript, Node.js, SQLite)

2. **Planning Phase**
   - Create high-level product architecture
   - Define development phases and milestones
   - Establish resource allocation strategy
   - Generate product roadmap

3. **Documentation Phase**
   - Create product overview document
   - Update .agent-os/product/ directory
   - Generate initial specifications templates
   - Link to appropriate sub-agents for implementation

## Expected Outputs
- `/product/product-overview.md`
- `/product/architecture-plan.md`
- `/product/development-roadmap.md`
- Updated `/specs/` templates for features

## Integration Points
- **Queen Controller**: Coordinate with other agents for parallel planning
- **Claude Flow 2.0**: Leverage hive-mind architecture for distributed planning
- **Sub-Agents**: Delegate specific planning aspects to specialized agents

## Context Optimization
- **Target Reduction**: 75% context reduction through conditional loading
- **Memory Management**: Only load relevant product and standard files
- **Selective Processing**: Focus on high-priority planning elements

## Command Syntax
```bash
/plan-product [product-name] [--scope=full|minimal] [--update-existing]
```

## Success Criteria
- Product structure created in .agent-os/product/
- Development phases clearly defined
- Resource allocation documented
- Integration with existing Queen Controller architecture maintained