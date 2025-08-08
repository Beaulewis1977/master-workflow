# Master Workflow Implementation Prompt
## AI Agent Task: Implement Intelligent Codebase Analysis and Document Customization System

### Objective
Transform the AI Dev OS initialization system to perform deep codebase analysis, intelligent approach selection, and generate fully customized, project-specific document ecosystems using Claude Flow 2.0 with SPARC methodology integration. The system works across all project lifecycle stages and provides both automatic AI decisions and user choice for optimal workflow selection.

## Project Lifecycle Support Requirements

### Stage 1: Idea/Planning Stage (Empty or Docs-Only Directory)
**Input:** README.md, project-idea.md, requirements.txt (planning docs)
**Analysis Focus:**
- Parse planning documents for technology intentions
- Extract feature requirements and architectural hints
- Identify mentioned frameworks, databases, deployment targets
- Generate complete foundational documentation ecosystem
- Create implementation roadmap and development standards

**Generated Output:**
- Complete Agent OS instruction set for planned tech stack
- Professional documentation templates ready for population
- Development workflows for planned features
- Architecture guidelines based on stated requirements
- Implementation checklists and milestone tracking

### Stage 2: Early Development (Basic Structure Exists)
**Input:** Basic project structure, package files, initial code files
**Analysis Focus:**
- Confirm planned vs actual technology choices
- Analyze emerging code patterns and conventions
- Identify architectural decisions being made
- Detect testing and deployment setup progress
- Generate documentation that guides continued development

### Stage 3: Active Development (Substantial Codebase)
**Input:** Working application with established patterns
**Analysis Focus:**
- Extract established coding conventions and patterns
- Analyze actual architecture implementation
- Identify technical debt and improvement opportunities
- Document existing API patterns and data flows
- Generate maintenance and enhancement guidelines

### Stage 4: Mature/Finished Projects (Complete Codebase)
**Input:** Production-ready or deployed application
**Analysis Focus:**
- Document existing architecture and design decisions
- Create comprehensive maintenance documentation
- Generate onboarding guides for new team members
- Identify refactoring opportunities and technical debt
- Create operational and deployment documentation

## Technical Implementation Specifications

### 1. Intelligent Decision System Integration

#### Enhanced ai-dev Command Structure
```bash
# Dual-mode operation: AI decides or user chooses
ai-dev init --auto "task description"        # AI analyzes and chooses automatically
ai-dev init --interactive "task description" # Show options, let user choose
ai-dev init --choose                         # Analyze current project, show recommendations

# Approach-specific commands
ai-dev init --swarm                          # Force Simple Swarm
ai-dev init --hive                           # Force Hive-Mind
ai-dev init --sparc                          # Force Hive-Mind + SPARC

# Analysis and orchestration
ai-dev analyze --recommend                   # Analyze without execution
ai-dev orchestrate --adaptive               # Smart approach selection for tmux
```

#### Complexity Analysis and Approach Selection
```javascript
// File: enhanced-ai-dev/intelligent-router.js
function selectOptimalApproach(projectPath, taskDescription, userPreferences) {
  const analysis = {
    complexityScore: analyzeComplexity(projectPath, taskDescription),
    projectStage: detectProjectStage(projectPath),
    sparcPhase: detectSparcPhase(projectPath),
    userHistory: loadUserPreferences(userPreferences)
  };

  const approaches = {
    simpleSwarm: { scoreRange: [0, 30], claudeFlow: 'swarm' },
    hiveMind: { scoreRange: [31, 70], claudeFlow: 'hive-mind' },
    hiveMindSparc: { scoreRange: [71, 100], claudeFlow: 'hive-mind --sparc' }
  };

  return routeToApproach(analysis, approaches);
}
```

### 2. Enhanced Analysis Engine Implementation

#### Multi-Stage Analysis Function
```javascript
// File: analyze-engine/project-stage-detector.js
function detectProjectStage(projectPath) {
  const indicators = {
    idea: hasOnlyDocumentation(projectPath),
    early: hasBasicStructure(projectPath),
    active: hasSubstantialCode(projectPath),
    mature: hasProductionIndicators(projectPath)
  };
  
  return {
    stage: determinePrimaryStage(indicators),
    confidence: calculateConfidence(indicators),
    characteristics: extractStageCharacteristics(projectPath, stage)
  };
}

function analyzeByStage(projectPath, stage) {
  switch(stage) {
    case 'idea':
      return analyzeDocumentationIntent(projectPath);
    case 'early':
      return analyzeEmergingPatterns(projectPath);
    case 'active':
      return analyzeEstablishedPatterns(projectPath);
    case 'mature':
      return analyzeProductionPatterns(projectPath);
  }
}
```

#### Documentation Intent Analysis (Idea Stage)
```javascript
// File: analyze-engine/intent-analyzer.js
function analyzeDocumentationIntent(projectPath) {
  const docs = findPlanningDocuments(projectPath);
  const analysis = {
    intendedTechStack: extractTechnologyMentions(docs),
    plannedFeatures: extractFeatureList(docs),
    architecturalHints: extractArchitectureClues(docs),
    deploymentTargets: extractDeploymentMentions(docs),
    teamSize: extractTeamSizeHints(docs),
    timeline: extractTimelineHints(docs)
  };
  
  return {
    ...analysis,
    recommendedStack: generateStackRecommendations(analysis),
    implementationPlan: generateImplementationRoadmap(analysis)
  };
}
```

#### Production Pattern Analysis (Mature Stage)
```javascript
// File: analyze-engine/production-analyzer.js
function analyzeProductionPatterns(projectPath) {
  return {
    deploymentConfig: analyzeDeploymentSetup(projectPath),
    monitoringSetup: analyzeMonitoringTools(projectPath),
    securityImplementation: analyzeSecurityPatterns(projectPath),
    performanceOptimizations: analyzePerformancePatterns(projectPath),
    maintenanceNeeds: identifyMaintenanceRequirements(projectPath),
    technicalDebt: assessTechnicalDebt(projectPath)
  };
}
```

### 2. Stage-Specific Document Generation

#### Idea Stage Document Generator
```javascript
// File: customization-engine/idea-stage-generator.js
function generateIdeaStageDocuments(analysis) {
  return {
    foundationalDocs: [
      generateTechStackStandards(analysis.recommendedStack),
      generateArchitectureGuidelines(analysis.architecturalHints),
      generateDevelopmentWorkflows(analysis.intendedTechStack),
      generateImplementationChecklist(analysis.implementationPlan)
    ],
    professionalDocs: [
      generateContributingGuide(analysis.teamSize),
      generateSecurityGuidelines(analysis.recommendedStack),
      generateDeploymentPlan(analysis.deploymentTargets),
      generateTestingStrategy(analysis.recommendedStack)
    ],
    planningDocs: [
      generateFeatureSpecs(analysis.plannedFeatures),
      generateMilestoneTracking(analysis.timeline),
      generateRiskAssessment(analysis.recommendedStack)
    ]
  };
}
```

#### Mature Stage Document Generator
```javascript
// File: customization-engine/mature-stage-generator.js
function generateMatureStageDocuments(analysis) {
  return {
    maintenanceDocs: [
      generateOperationalRunbook(analysis.deploymentConfig),
      generateTroubleshootingGuide(analysis.monitoringSetup),
      generateOnboardingGuide(analysis.codePatterns),
      generateArchitectureDocumentation(analysis.actualArchitecture)
    ],
    improvementDocs: [
      generateTechnicalDebtPlan(analysis.technicalDebt),
      generateRefactoringRoadmap(analysis.improvementOpportunities),
      generatePerformanceOptimizationPlan(analysis.performanceAnalysis),
      generateSecurityAuditResults(analysis.securityImplementation)
    ]
  };
}
```

### 3. Integration with Existing install-ai-dev-os.sh

#### Modified Installation Script Structure
```bash
#!/bin/bash
# File: MASTER-WORKFLOW/install-ai-dev-os.sh (Enhanced)

# Stage 1: Project Analysis
echo "🔍 Analyzing project stage and characteristics..."
PROJECT_ANALYSIS=$(node ~/.agent-os/analyze-engine/main.js "$PWD")
PROJECT_STAGE=$(echo "$PROJECT_ANALYSIS" | jq -r '.stage')
echo "📊 Detected project stage: $PROJECT_STAGE"

# Stage 2: Stage-Specific Setup
case $PROJECT_STAGE in
  "idea")
    echo "💡 Setting up foundational development environment..."
    setup_idea_stage_environment "$PROJECT_ANALYSIS"
    ;;
  "early")
    echo "🌱 Configuring early development environment..."
    setup_early_stage_environment "$PROJECT_ANALYSIS"
    ;;
  "active")
    echo "🚀 Optimizing active development environment..."
    setup_active_stage_environment "$PROJECT_ANALYSIS"
    ;;
  "mature")
    echo "🏭 Establishing production maintenance environment..."
    setup_mature_stage_environment "$PROJECT_ANALYSIS"
    ;;
esac

# Stage 3: Document Generation
echo "📝 Generating stage-appropriate documentation..."
node ~/.agent-os/customization-engine/main.js "$PWD" "$PROJECT_ANALYSIS"

# Stage 4: Validation and Finalization
echo "✅ Validating generated documentation..."
node ~/.agent-os/validation-engine/main.js "$PWD"
```

#### Stage-Specific Setup Functions
```bash
setup_idea_stage_environment() {
  local analysis="$1"
  
  # Create foundational structure
  create_project_structure_from_intent "$analysis"
  
  # Generate comprehensive planning documentation
  generate_planning_documentation "$analysis"
  
  # Set up development workflows for intended stack
  setup_development_workflows "$analysis"
  
  # Create implementation tracking system
  setup_milestone_tracking "$analysis"
}

setup_mature_stage_environment() {
  local analysis="$1"
  
  # Document existing architecture
  document_existing_architecture "$analysis"
  
  # Generate maintenance documentation
  generate_maintenance_docs "$analysis"
  
  # Create operational runbooks
  generate_operational_docs "$analysis"
  
  # Set up improvement tracking
  setup_improvement_tracking "$analysis"
}
```

### 4. Document Template Modifications

#### Dynamic Template System
```javascript
// File: templates/dynamic-template-processor.js
class DynamicTemplateProcessor {
  processTemplate(templatePath, analysis, projectStage) {
    const template = loadTemplate(templatePath);
    const stageConfig = getStageConfiguration(projectStage);
    
    return {
      content: this.replaceVariables(template, analysis),
      sections: this.adaptSections(template, stageConfig),
      examples: this.generateExamples(analysis, projectStage),
      workflows: this.createWorkflows(analysis, projectStage)
    };
  }
  
  adaptSections(template, stageConfig) {
    // Remove irrelevant sections for current stage
    // Add stage-specific sections
    // Reorder sections based on stage priorities
  }
}
```

#### Stage-Aware Template Variables
```markdown
<!-- File: templates/professional/CONTRIBUTING.template.md -->
# Contributing to {{PROJECT_NAME}}

{{#if_stage_idea}}
## Project Vision
This project is in the planning stage. Contributions should focus on:
- Refining requirements and specifications
- Technology stack validation
- Architecture design discussions
{{/if_stage_idea}}

{{#if_stage_mature}}
## Established Patterns
This is a mature project with established patterns:
- Follow existing code conventions documented in {{CODE_STYLE_GUIDE}}
- Maintain backward compatibility
- Update documentation for any changes
{{/if_stage_mature}}

## Development Setup
{{#if_detected_stack}}
### Prerequisites
{{#each detected_stack.dependencies}}
- {{name}} {{version}}
{{/each}}
{{/if_detected_stack}}
```

### 5. Testing and Validation Requirements

#### Multi-Stage Testing Protocol
```javascript
// File: test/stage-validation.test.js
describe('Stage-Specific Document Generation', () => {
  test('Idea stage generates foundational docs', async () => {
    const ideaProject = createTestProject('idea', {
      files: ['README.md', 'project-requirements.md']
    });
    
    const result = await analyzeAndGenerate(ideaProject);
    
    expect(result.documents).toInclude([
      'ARCHITECTURE_GUIDELINES.md',
      'IMPLEMENTATION_ROADMAP.md',
      'TECH_STACK_STANDARDS.md'
    ]);
  });
  
  test('Mature stage generates maintenance docs', async () => {
    const matureProject = createTestProject('mature', {
      hasDeployment: true,
      hasTests: true,
      hasProduction: true
    });
    
    const result = await analyzeAndGenerate(matureProject);
    
    expect(result.documents).toInclude([
      'OPERATIONAL_RUNBOOK.md',
      'MAINTENANCE_GUIDE.md',
      'ONBOARDING_GUIDE.md'
    ]);
  });
});
```

### 6. Documentation Update Tasks

#### Existing Guide Updates Required
1. **Update install-ai-dev-os.sh**: Add stage detection and analysis calls
2. **Enhance Agent OS Templates**: Convert to stage-aware dynamic templates
3. **Update Workflow Definitions**: Add stage-specific workflow variations
4. **Modify Claude Integration**: Add stage context to Claude Code calls
5. **Update Simple Workflow**: Create simplified version of stage detection

#### New Documentation Required
1. **Stage Detection Guide**: How the system identifies project stages
2. **Template Customization Guide**: How templates adapt to different stages
3. **Troubleshooting Guide**: Common issues and solutions for each stage
4. **Migration Guide**: Moving projects between stages or updating analysis

## Expected Outcomes by Stage

### Idea Stage Results
- Complete development environment setup for intended tech stack
- Comprehensive planning and specification documentation
- Implementation roadmap with milestones and checkpoints
- Development workflows ready for first code commits
- Professional documentation framework established

### Mature Stage Results
- Complete documentation of existing architecture and patterns
- Operational runbooks for maintenance and deployment
- Onboarding guides for new team members
- Technical debt assessment and improvement roadmap
- Professional maintenance and enhancement workflows

## Implementation Priority
1. **Week 1**: Stage detection and analysis engine
2. **Week 2**: Stage-specific document generators
3. **Week 3**: Integration with existing installation system
4. **Week 4**: Testing across all project stages and refinement

This implementation ensures the system provides maximum value regardless of when it's introduced to a project, from initial conception through production maintenance.
