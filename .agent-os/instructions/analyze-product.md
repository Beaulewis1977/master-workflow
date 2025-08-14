# Analyze Product Command

## Purpose
Analyze existing codebase and integrate findings into Agent-OS structure using intelligence analyzer with comprehensive assessment capabilities.

## Agent Assignment
- **Primary Agent**: 1-intelligence-analyzer.md
- **Context Window**: 200,000 tokens
- **Layer Priority**: Product (high), Standards (medium), Specifications (low)

## Context Loading Strategy
1. **Product Layer** (Always load): Existing product documentation, architecture diagrams
2. **Standards Layer** (Conditional): Load when analyzing code quality and compliance
3. **Specifications Layer** (Skip initially): Only load if analyzing specific features

## Process Flow
1. **Codebase Discovery**
   - Scan entire project structure
   - Identify technology stack and frameworks
   - Map dependencies and external integrations
   - Assess current complexity score (update from 39/100)

2. **Architecture Analysis**
   - Document existing system architecture
   - Identify design patterns and conventions
   - Map data flow and service interactions
   - Assess microservices structure

3. **Quality Assessment**
   - Analyze code quality and maintainability
   - Identify technical debt and improvement opportunities
   - Assess test coverage and quality
   - Review security vulnerabilities

4. **Integration Mapping**
   - Map existing features to Agent-OS specifications
   - Identify gaps in documentation
   - Create migration plan for Agent-OS integration
   - Recommend specification structure

5. **Optimization Recommendations**
   - Suggest performance improvements
   - Recommend refactoring opportunities
   - Identify automation possibilities
   - Plan context optimization strategies

## Expected Outputs
- `/product/codebase-analysis.md`
- `/product/architecture-documentation.md`
- `/product/technical-debt-assessment.md`
- `/product/integration-recommendations.md`
- Updated complexity score and project analysis
- Generated specifications for existing features

## Analysis Dimensions
```json
{
  "codeQuality": {
    "maintainability": "score/10",
    "readability": "score/10",
    "testability": "score/10"
  },
  "architecture": {
    "modularity": "score/10",
    "scalability": "score/10",
    "performance": "score/10"
  },
  "technical": {
    "complexity": "0-100",
    "dependencies": "count",
    "testCoverage": "percentage"
  },
  "business": {
    "featureCompleteness": "percentage",
    "userExperience": "score/10",
    "marketReadiness": "score/10"
  }
}
```

## Integration Points
- **Code Analyzer Agent**: For detailed static code analysis
- **Performance Optimizer**: For performance bottleneck identification
- **Security Scanner**: For security vulnerability assessment
- **Documentation Generator**: For generating missing documentation

## Context Optimization
- **Target Reduction**: 65% context reduction by analyzing in focused segments
- **Incremental Analysis**: Process large codebases in chunks
- **Selective Deep-Dive**: Only load detailed context for problematic areas
- **Memory Management**: Use intelligent caching for repeated analysis patterns

## Analysis Scope Options
- **Quick Scan**: High-level overview (30 minutes)
- **Standard Analysis**: Comprehensive assessment (2-4 hours)
- **Deep Audit**: Detailed investigation with recommendations (1-2 days)

## Command Syntax
```bash
/analyze-product [--scope=quick|standard|deep] [--focus=architecture|quality|performance|security] [--output=summary|detailed]
```

## Success Criteria
- Comprehensive understanding of existing codebase documented
- Architecture patterns and conventions identified
- Technical debt and improvement opportunities catalogued
- Integration plan for Agent-OS structure created
- Updated project complexity and analysis scores
- Actionable recommendations for optimization
- Existing features mapped to specification structure