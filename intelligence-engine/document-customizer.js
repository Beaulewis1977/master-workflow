#!/usr/bin/env node

/**
 * Document Customizer
 * Generates deeply customized documentation based on project analysis
 * Creates tech-stack specific configurations and workflows
 */

const fs = require('fs');
const path = require('path');
const versionPolicy = require('../lib/version-policy');

class DocumentCustomizer {
  constructor(analysis, approach) {
    this.analysis = analysis;
    this.approach = approach;
    this.projectPath = analysis.projectPath || process.cwd();
    this.templates = this.loadTemplates();
  }

  /**
   * Generate all customized documents
   */
  async generateDocuments() {
    const documents = {
      claude: await this.generateClaudeConfig(),
      agentOS: await this.generateAgentOSInstructions(),
      workflows: await this.generateWorkflows(),
      contributing: await this.generateContributing(),
      deployment: await this.generateDeployment(),
      architecture: await this.generateArchitecture(),
      sparc: this.approach.selected === 'hiveMindSparc' ? await this.generateSPARCPhases() : null,
      agents: await this.generateAgentConfigs(),
      slashCommands: await this.generateSlashCommands()
    };

    return documents;
  }

  /**
   * Generate all documents (alias for backward compatibility)
   * Returns documents in array format expected by tests
   */
  async generateAllDocuments() {
    const documents = await this.generateDocuments();
    const documentArray = [];
    
    // Convert to array format
    for (const [type, content] of Object.entries(documents)) {
      if (!content) {
        continue; // Skip null/undefined documents
      }
      
      if (typeof content === 'string') {
        // Simple string content
        const filename = this.getFilenameForType(type);
        documentArray.push({
          type,
          path: filename,
          content,
          size: content.length
        });
      } else if (typeof content === 'object') {
        // Check if it's a document with path and content
        if (content.path && content.content) {
          documentArray.push({
            type,
            path: content.path,
            content: content.content,
            size: content.content.length
          });
        } else if (content.files && Array.isArray(content.files)) {
          // Handle complex types like agents with multiple files
          content.files.forEach(file => {
            if (file.path && file.content) {
              documentArray.push({
                type: `${type}.${file.name || 'file'}`,
                path: file.path,
                content: file.content,
                size: file.content.length
              });
            }
          });
        }
      }
    }
    
    return documentArray;
  }

  /**
   * Get filename for document type
   */
  getFilenameForType(type) {
    const typeMap = {
      'claude': 'CLAUDE.md',
      'agentOS': 'Agent-OS.md',
      'workflows': 'WORKFLOWS.md',
      'contributing': 'CONTRIBUTING.md',
      'deployment': 'DEPLOYMENT.md',
      'architecture': 'ARCHITECTURE.md',
      'sparc': 'SPARC-PHASES.md',
      'slashCommands': 'SLASH-COMMANDS.md',
      'agents.queen': '.agents/queen-controller.md',
      'agents.coder': '.agents/coder-agent.md',
      'agents.tester': '.agents/tester-agent.md',
      'agents.deployer': '.agents/deployer-agent.md',
      'agents.analyst': '.agents/analyst-agent.md',
      'agents.doc-generator': '.agents/doc-generator-agent.md'
    };
    
    return typeMap[type] || `${type.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}.md`;
  }

  /**
   * Generate CLAUDE.md with deep customization
   */
  async generateClaudeConfig() {
    const projectInstructionsPath = path.join(this.projectPath, '.ai-dev', 'project-instructions.md');
    let projectInstructions = '';
    try {
      if (fs.existsSync(projectInstructionsPath)) {
        projectInstructions = fs.readFileSync(projectInstructionsPath, 'utf8');
      }
    } catch (e) { /* ignore */ }

    // Check if running in container
    const isContainer = this.detectContainerEnvironment();

    // Load MCP registry if present
    const mcpRegistryPath = path.join(this.projectPath, '.ai-workflow', 'configs', 'mcp-registry.json');
    let mcpRegistry = null;
    try {
      if (fs.existsSync(mcpRegistryPath)) {
        mcpRegistry = JSON.parse(fs.readFileSync(mcpRegistryPath, 'utf8'));
      }
    } catch (e) { /* ignore */ }

    // projectInstructions already loaded above

    const techStack = this.analysis.factors?.techStack || {};
    const features = this.analysis.factors?.features?.detected || {};
    const architecture = this.analysis.factors?.architecture || {};
    
    const versionName = versionPolicy.getSelectedVersionName({ analysis: this.analysis });
    const isExperimental = versionPolicy.isExperimentalName(versionName);
    const hasAITools = techStack.aiTools && techStack.aiTools.length > 0;

    let content = `# Claude Configuration - ${this.analysis.stage} Stage Project

## Project Analysis
- **Complexity Score**: ${this.analysis.score}/100
- **Stage**: ${this.analysis.stage}
 - **Selected Approach**: ${this.approach.name}
 - **Claude Flow Version**: ${versionName} ${isExperimental ? '(experimental)' : ''}
 - **Command**: \`${this.generateOptimalCommand()}\`

## Technology Stack
`;

    // Add detected languages
    if (techStack.languages?.length > 0) {
      content += `### Languages\n`;
      techStack.languages.forEach(lang => {
        content += `- ${lang}\n`;
        content += this.getLanguageGuidelines(lang);
      });
    }

    // Add detected frameworks
    if (techStack.frameworks?.length > 0) {
      content += `\n### Frameworks\n`;
      techStack.frameworks.forEach(framework => {
        content += `- ${framework}\n`;
        content += this.getFrameworkGuidelines(framework);
      });
    }

    // Add detected databases
    if (techStack.databases?.length > 0) {
      content += `\n### Databases\n`;
      techStack.databases.forEach(db => {
        content += `- ${db}\n`;
        content += this.getDatabaseGuidelines(db);
      });
    }

    // Add feature-specific guidelines
    content += `\n## Feature Guidelines\n`;
    
    if (features.authentication) {
      content += `\n### Authentication System
- Use JWT tokens for stateless authentication
- Implement refresh token rotation
- Store passwords using bcrypt with salt rounds >= 10
- Implement rate limiting on auth endpoints
`;
    }

    if (features.realtime) {
      content += `\n### Real-time Features
- Use WebSocket connections for bidirectional communication
- Implement connection pooling for scalability
- Add heartbeat mechanism for connection health
- Use rooms/channels for targeted messaging
`;
    }

    if (features.api) {
      content += `\n### API Development
- Follow RESTful principles
- Implement proper HTTP status codes
- Add OpenAPI/Swagger documentation
- Use versioning (e.g., /api/v1/)
- Implement pagination for list endpoints
`;
    }

    // Add architecture-specific guidelines
    if (architecture.primaryArchitecture) {
      content += `\n## Architecture: ${architecture.primaryArchitecture}\n`;
      content += this.getArchitectureGuidelines(architecture.primaryArchitecture);
    }

    // Add stage-specific instructions
    content += `\n## Stage-Specific Instructions (${this.analysis.stage})\n`;
    content += this.getStageInstructions(this.analysis.stage);

    // Project-specific instructions (if provided)
    if (projectInstructions && projectInstructions.trim().length > 0) {
      content += `\n## Project-Specific Instructions\n`;
      content += `${projectInstructions}\n`;
    }

    // MCP Registry summary
    if (mcpRegistry) {
      content += `\n## Discovered MCP Servers & Tools\n`;
      const servers = mcpRegistry.servers || {};
      const tools = mcpRegistry.tools || [];
      const serverNames = Object.keys(servers);
      if (serverNames.length > 0) {
        content += `\n### Servers\n`;
        for (const name of serverNames) {
          const s = servers[name];
          content += `- ${name}: ${JSON.stringify(s)}\n`;
        }
      }
      if (tools.length > 0) {
        content += `\n### Tools\n`;
        for (const t of tools) {
          content += `- ${t.name} (${t.type}${t.server ? `:${t.server}` : ''})\n`;
        }
      }
      // Indicate default server if present
      const defaultServer = Object.entries(servers).find(([_, v]) => v && v.default);
      if (defaultServer) {
        content += `\nDefault MCP Server: ${defaultServer[0]}\n`;
      }
    }

    // Add approach-specific workflow
    content += `\n## ${this.approach.name} Workflow\n`;
    content += this.getApproachWorkflow(this.approach.selected);

    // Version Policy Summary (Phase 3)
    const policy = versionPolicy.getPolicySummary();
    content += `\n## Version Policy\n`;
    content += `- Canonical versions: ${policy.canonicalNames.join(', ')}\n`;
    content += `- Experimental: ${policy.experimental.join(', ')}\n`;
    content += `- Override via env: ${policy.examples.env}\n`;

    return {
      path: '.claude/CLAUDE.md',
      content
    };
  }

  /**
   * Generate Agent OS instructions
   */
  async generateAgentOSInstructions() {
    const projectInstructionsPath = path.join(this.projectPath, '.ai-dev', 'project-instructions.md');
    let projectInstructions = '';
    try {
      if (fs.existsSync(projectInstructionsPath)) {
        projectInstructions = fs.readFileSync(projectInstructionsPath, 'utf8');
      }
    } catch (e) { /* ignore */ }

    const stage = this.analysis.stage;
    const techStack = this.analysis.factors?.techStack || {};
    
    let content = `# Agent OS Instructions

## Project Context
- **Stage**: ${stage}
- **Complexity**: ${this.analysis.score}/100
- **Primary Language**: ${techStack.languages?.[0] || 'Not detected'}
- **Primary Framework**: ${techStack.frameworks?.[0] || 'Not detected'}

## Development Standards
`;

    // Add language-specific standards
    if (techStack.languages?.includes('JavaScript') || techStack.languages?.includes('TypeScript')) {
      content += `
### JavaScript/TypeScript Standards
- Use ES6+ features (arrow functions, destructuring, async/await)
- Prefer functional programming patterns
- Use strict mode
- Implement proper error handling with try/catch
- Use TypeScript for type safety when available
`;
    }

    if (techStack.languages?.includes('Python')) {
      content += `
### Python Standards
- Follow PEP 8 style guide
- Use type hints for function signatures
- Implement proper exception handling
- Use virtual environments for dependencies
- Write docstrings for all functions and classes
`;
    }

    if (techStack.languages?.includes('Go')) {
      content += `
### Go Standards
- Follow effective Go guidelines
- Use gofmt for formatting
- Implement proper error handling
- Use goroutines for concurrency
- Write tests alongside code
`;
    }

    // Add framework-specific instructions
    if (techStack.frameworks?.includes('React')) {
      content += `
### React Development
- Use functional components with hooks
- Implement proper state management (Context API or Redux)
- Optimize with React.memo and useMemo
- Follow component composition patterns
- Write tests with React Testing Library
`;
    }

    if (techStack.frameworks?.includes('Express')) {
      content += `
### Express Development
- Use middleware for cross-cutting concerns
- Implement proper error handling middleware
- Use route separation for organization
- Implement input validation
- Add security headers (helmet)
`;
    }

    // Inject project-specific instructions into Agent-OS if provided
    if (projectInstructions && projectInstructions.trim().length > 0) {
      content += `\n## Project-Specific Instructions\n`;
      content += `${projectInstructions}\n`;
    }

    // Add stage-specific planning
    content += `
## Stage-Specific Instructions (${stage})
`;
    
    switch (stage) {
      case 'idea':
        content += `
- Focus on requirements gathering
- Create detailed specifications
- Design system architecture
- Plan implementation phases
- Define success criteria
`;
        break;
      case 'early':
        content += `
- Establish coding standards
- Set up development environment
- Create foundation components
- Implement core features
- Set up testing framework
`;
        break;
      case 'active':
        content += `
- Maintain code quality
- Add new features systematically
- Refactor when necessary
- Ensure test coverage
- Document APIs and components
`;
        break;
      case 'mature':
        content += `
- Focus on optimization
- Improve performance
- Enhance security
- Update documentation
- Plan for scaling
`;
        break;
    }

    return {
      path: '.agent-os/instructions/instructions.md',
      content
    };
  }

  /**
   * Generate custom workflows based on tech stack
   */
  async generateWorkflows() {
    const workflows = [];
    const techStack = this.analysis.factors?.techStack || {};
    const features = this.analysis.factors?.features?.detected || {};

    // Generate tech-specific workflows
    if (techStack.frameworks?.includes('React')) {
      workflows.push({
        path: '.ai-dev/workflows/add-react-component.json',
        content: JSON.stringify({
          name: 'add-react-component',
          description: 'Create a new React component',
          steps: [
            {
              type: 'create-file',
              template: 'react-component',
              path: 'src/components/${componentName}/${componentName}.jsx'
            },
            {
              type: 'create-file',
              template: 'react-component-test',
              path: 'src/components/${componentName}/${componentName}.test.jsx'
            },
            {
              type: 'create-file',
              template: 'react-component-styles',
              path: 'src/components/${componentName}/${componentName}.module.css'
            }
          ]
        }, null, 2)
      });
    }

    if (techStack.frameworks?.includes('Express')) {
      workflows.push({
        path: '.ai-dev/workflows/add-api-endpoint.json',
        content: JSON.stringify({
          name: 'add-api-endpoint',
          description: 'Create a new API endpoint',
          steps: [
            {
              type: 'create-file',
              template: 'express-controller',
              path: 'src/controllers/${resourceName}Controller.js'
            },
            {
              type: 'create-file',
              template: 'express-route',
              path: 'src/routes/${resourceName}.js'
            },
            {
              type: 'create-file',
              template: 'express-model',
              path: 'src/models/${resourceName}.js'
            },
            {
              type: 'create-file',
              template: 'api-test',
              path: 'tests/api/${resourceName}.test.js'
            }
          ]
        }, null, 2)
      });
    }

    // Add feature-specific workflows
    if (features.authentication) {
      workflows.push({
        path: '.ai-dev/workflows/setup-auth.json',
        content: JSON.stringify({
          name: 'setup-authentication',
          description: 'Set up authentication system',
          steps: [
            { type: 'install-packages', packages: ['jsonwebtoken', 'bcrypt', 'passport'] },
            { type: 'create-middleware', name: 'auth' },
            { type: 'create-routes', name: 'auth' },
            { type: 'create-models', name: 'user' },
            { type: 'create-tests', name: 'auth' }
          ]
        }, null, 2)
      });
    }

    return workflows;
  }

  /**
   * Generate CONTRIBUTING.md
   */
  async generateContributing() {
    const techStack = this.analysis.factors?.techStack || {};
    const stage = this.analysis.stage;
    
    let content = `# Contributing Guidelines

## Development Setup

### Prerequisites
`;

    // Add language-specific prerequisites
    if (techStack.languages?.includes('JavaScript') || techStack.languages?.includes('TypeScript')) {
      content += `- Node.js v18+ and npm/yarn\n`;
    }
    if (techStack.languages?.includes('Python')) {
      content += `- Python 3.8+ and pip\n`;
    }
    if (techStack.languages?.includes('Go')) {
      content += `- Go 1.19+\n`;
    }
    if (techStack.databases?.includes('PostgreSQL')) {
      content += `- PostgreSQL 13+\n`;
    }
    if (techStack.databases?.includes('MongoDB')) {
      content += `- MongoDB 5.0+\n`;
    }

    content += `
### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd <project-name>

`;

    // Add language-specific installation
    if (techStack.languages?.includes('JavaScript')) {
      content += `# Install dependencies
npm install
# or
yarn install

`;
    }
    if (techStack.languages?.includes('Python')) {
      content += `# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

`;
    }

    content += `\`\`\`

## Development Workflow

### Using AI Development OS
This project uses the Intelligent Workflow Decision System.

- **Approach**: ${this.approach.name}
- **Command**: \`${this.approach.command}\`

### Code Standards
`;

    // Add detected patterns
    const patterns = this.getDetectedPatterns();
    patterns.forEach(pattern => {
      content += `- ${pattern}\n`;
    });

    content += `
### Testing
`;

    if (this.analysis.factors?.testing?.hasTests) {
      content += `Run tests with: \`npm test\` or \`pytest\`\n`;
    } else {
      content += `Tests should be added for all new features.\n`;
    }

    // Add stage-specific contribution guidelines
    if (stage === 'idea' || stage === 'early') {
      content += `
## Current Focus (${stage} Stage)
- Establishing project structure
- Defining coding standards
- Creating foundational components
- Setting up development environment
`;
    } else if (stage === 'active') {
      content += `
## Current Focus (${stage} Stage)
- Adding new features
- Maintaining code quality
- Improving test coverage
- Updating documentation
`;
    } else if (stage === 'mature') {
      content += `
## Current Focus (${stage} Stage)
- Performance optimization
- Security enhancements
- Bug fixes
- Documentation updates
`;
    }

    return {
      path: 'CONTRIBUTING.md',
      content
    };
  }

  /**
   * Generate DEPLOYMENT.md
   */
  async generateDeployment() {
    const deployment = this.analysis.factors?.deployment || {};
    const techStack = this.analysis.factors?.techStack || {};
    
    let content = `# Deployment Guide

## Deployment Configuration
`;

    if (deployment.docker) {
      content += `
### Docker Deployment

\`\`\`bash
# Build the image
docker build -t app-name .

# Run the container
docker run -p 3000:3000 app-name
\`\`\`
`;
    }

    if (deployment.kubernetes) {
      content += `
### Kubernetes Deployment

\`\`\`bash
# Apply configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
\`\`\`
`;
    }

    if (deployment.cloudProvider) {
      content += `
### Cloud Provider: ${deployment.cloudProvider}

`;
      switch (deployment.cloudProvider) {
        case 'AWS':
          content += `Deploy using AWS ECS, Lambda, or Elastic Beanstalk\n`;
          break;
        case 'Azure':
          content += `Deploy using Azure App Service or Container Instances\n`;
          break;
        case 'GCP':
          content += `Deploy using Google App Engine or Cloud Run\n`;
          break;
        case 'PaaS':
          content += `Deploy using Vercel, Netlify, or Heroku\n`;
          break;
      }
    }

    // Add environment variables section
    content += `
## Environment Variables

Create a \`.env\` file with the following variables:

\`\`\`env
NODE_ENV=production
`;

    if (techStack.databases?.includes('PostgreSQL')) {
      content += `DATABASE_URL=postgresql://user:password@host:5432/dbname\n`;
    }
    if (techStack.databases?.includes('MongoDB')) {
      content += `MONGODB_URI=mongodb://localhost:27017/dbname\n`;
    }
    if (techStack.databases?.includes('Redis')) {
      content += `REDIS_URL=redis://localhost:6379\n`;
    }
    if (this.analysis.factors?.features?.detected?.authentication) {
      content += `JWT_SECRET=your-secret-key\n`;
    }

    content += `\`\`\`

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] CI/CD pipeline configured
`;

    return {
      path: 'DEPLOYMENT.md',
      content
    };
  }

  /**
   * Generate ARCHITECTURE.md
   */
  async generateArchitecture() {
    const architecture = this.analysis.factors?.architecture || {};
    const techStack = this.analysis.factors?.techStack || {};
    
    let content = `# System Architecture

## Overview
- **Architecture Type**: ${architecture.primaryArchitecture || 'Not determined'}
- **Complexity Score**: ${this.analysis.score}/100
- **Development Stage**: ${this.analysis.stage}

## Technology Stack
`;

    // List all technologies
    if (techStack.languages?.length > 0) {
      content += `\n### Languages\n`;
      techStack.languages.forEach(lang => {
        content += `- ${lang}\n`;
      });
    }

    if (techStack.frameworks?.length > 0) {
      content += `\n### Frameworks\n`;
      techStack.frameworks.forEach(fw => {
        content += `- ${fw}\n`;
      });
    }

    if (techStack.databases?.length > 0) {
      content += `\n### Databases\n`;
      techStack.databases.forEach(db => {
        content += `- ${db}\n`;
      });
    }

    // Add architecture diagram placeholder
    content += `
## Architecture Diagram

\`\`\`
`;

    if (architecture.primaryArchitecture === 'fullstack' || 
        (architecture.patterns?.frontend > 20 && architecture.patterns?.backend > 20)) {
      content += `┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│    Database     │
│   (React/Vue)   │     │   (Express)     │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
`;
    } else if (architecture.primaryArchitecture === 'microservices') {
      content += `┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Svc1 │  │ Svc2 │
└──────┘  └──────┘
`;
    } else {
      content += `┌─────────────────┐
│   Application   │
└────────┬────────┘
         │
    ┌────▼────┐
    │Database │
    └─────────┘
`;
    }

    content += `\`\`\`

## Key Components
`;

    // Describe detected components
    if (architecture.patterns?.frontend > 20) {
      content += `
### Frontend Layer
- Component-based architecture
- State management system
- Routing configuration
- API integration layer
`;
    }

    if (architecture.patterns?.backend > 20) {
      content += `
### Backend Layer
- RESTful API endpoints
- Business logic layer
- Data access layer
- Authentication/Authorization
`;
    }

    if (architecture.patterns?.database > 20) {
      content += `
### Data Layer
- Database schema design
- Data models/entities
- Migration system
- Caching strategy
`;
    }

    return {
      path: 'ARCHITECTURE.md',
      content
    };
  }

  /**
   * Generate SPARC methodology phases
   */
  async generateSPARCPhases() {
    const phases = [];
    const projectName = path.basename(this.projectPath);
    
    // Specification Phase
    phases.push({
      path: '.claude-flow/sparc-phases/1-specification.md',
      content: `# SPARC Phase 1: Specification

## Project: ${projectName}
## Complexity Score: ${this.analysis.score}/100

### Requirements Analysis
${this.generateRequirements()}

### Success Criteria
${this.generateSuccessCriteria()}

### Constraints
${this.generateConstraints()}
`
    });

    // Pseudocode Phase
    phases.push({
      path: '.claude-flow/sparc-phases/2-pseudocode.md',
      content: `# SPARC Phase 2: Pseudocode

## Core Algorithms
${this.generatePseudocode()}

## Data Structures
${this.generateDataStructures()}
`
    });

    // Architecture Phase
    phases.push({
      path: '.claude-flow/sparc-phases/3-architecture.md',
      content: `# SPARC Phase 3: Architecture

## System Design
${this.generateSystemDesign()}

## Component Breakdown
${this.generateComponentBreakdown()}
`
    });

    // Refinement Phase
    phases.push({
      path: '.claude-flow/sparc-phases/4-refinement.md',
      content: `# SPARC Phase 4: Refinement

## Optimization Opportunities
${this.generateOptimizations()}

## Code Quality Improvements
${this.generateQualityImprovements()}
`
    });

    // Completion Phase
    phases.push({
      path: '.claude-flow/sparc-phases/5-completion.md',
      content: `# SPARC Phase 5: Completion

## Implementation Checklist
${this.generateImplementationChecklist()}

## Testing Strategy
${this.generateTestingStrategy()}

## Deployment Plan
${this.generateDeploymentPlan()}
`
    });

    return phases;
  }

  // Helper methods for language/framework specific guidelines
  getLanguageGuidelines(language) {
    const guidelines = {
      'JavaScript': `  - Use ES6+ features
  - Async/await for asynchronous code
  - Proper error handling
`,
      'TypeScript': `  - Strict type checking
  - Interface definitions
  - Generic types where appropriate
`,
      'Python': `  - PEP 8 compliance
  - Type hints
  - Virtual environments
`,
      'Go': `  - Effective Go principles
  - Error handling patterns
  - Goroutines for concurrency
`
    };
    return guidelines[language] || '';
  }

  getFrameworkGuidelines(framework) {
    const guidelines = {
      'React': `  - Functional components with hooks
  - Component composition
  - State management patterns
`,
      'Vue': `  - Composition API
  - Component organization
  - Vuex for state management
`,
      'Express': `  - Middleware architecture
  - Route organization
  - Error handling middleware
`,
      'Django': `  - MVT pattern
  - Django REST framework
  - Model migrations
`,
      'FastAPI': `  - Type-driven development
  - Async endpoints
  - OpenAPI documentation
`
    };
    return guidelines[framework] || '';
  }

  getDatabaseGuidelines(database) {
    const guidelines = {
      'MongoDB': `  - Document design patterns
  - Indexing strategy
  - Aggregation pipelines
`,
      'PostgreSQL': `  - Normalized schema design
  - ACID compliance
  - Query optimization
`,
      'MySQL': `  - Table relationships
  - Query optimization
  - Replication setup
`,
      'Redis': `  - Caching strategies
  - Data expiration
  - Pub/sub patterns
`
    };
    return guidelines[database] || '';
  }

  getArchitectureGuidelines(architecture) {
    const guidelines = {
      'microservices': `- Service boundaries and responsibilities
- Inter-service communication (REST/gRPC)
- Service discovery and load balancing
- Distributed tracing and monitoring
- Circuit breaker patterns
`,
      'monolith': `- Clear module separation
- Layered architecture (presentation, business, data)
- Dependency injection
- Single deployment unit
`,
      'frontend': `- Component-based architecture
- State management patterns
- Client-side routing
- API integration layer
`,
      'backend': `- RESTful API design
- Service layer pattern
- Repository pattern for data access
- Authentication and authorization
`,
      'fullstack': `- Clear frontend/backend separation
- API contract definition
- Shared type definitions
- End-to-end testing
`
    };
    return guidelines[architecture] || '';
  }

  getStageInstructions(stage) {
    const instructions = {
      'idea': `- Focus on comprehensive planning and specification
- Define clear requirements and success criteria
- Design system architecture before implementation
- Create detailed implementation roadmap
`,
      'early': `- Establish coding standards and patterns
- Build foundational components first
- Set up development and testing environment
- Create initial documentation
`,
      'active': `- Maintain consistent code quality
- Add features systematically
- Ensure adequate test coverage
- Keep documentation up to date
`,
      'mature': `- Focus on optimization and performance
- Enhance security measures
- Improve monitoring and logging
- Plan for scaling and maintenance
`
    };
    return instructions[stage] || '';
  }

  getApproachWorkflow(approach) {
    const workflows = {
      'simpleSwarm': `1. Quick task analysis
2. Single-agent coordination
3. Focused implementation
4. Rapid iteration
`,
      'hiveMind': `1. Multi-agent task distribution
2. Parallel development streams
3. Cross-agent coordination
4. Integrated testing
5. Consolidated deployment
`,
      'hiveMindSparc': `1. SPARC Phase 1: Specification
2. SPARC Phase 2: Pseudocode
3. SPARC Phase 3: Architecture
4. SPARC Phase 4: Refinement
5. SPARC Phase 5: Completion
6. Multi-agent implementation
7. Systematic testing
8. Enterprise deployment
`
    };
    return workflows[approach] || '';
  }

  getDetectedPatterns() {
    const patterns = [];
    const analysis = this.analysis;
    
    // Add detected patterns from analysis
    if (analysis.factors?.size?.fileCount < 50) {
      patterns.push('Small codebase - focus on simplicity');
    } else {
      patterns.push('Large codebase - maintain clear organization');
    }
    
    if (analysis.factors?.testing?.hasTests) {
      patterns.push('Test-driven development practices');
    }
    
    if (analysis.factors?.features?.detected?.authentication) {
      patterns.push('Security-first development');
    }
    
    return patterns;
  }

  // SPARC helper methods
  generateRequirements() {
    const features = this.analysis.factors?.features?.detected || {};
    let requirements = '';
    
    if (features.authentication) {
      requirements += '- User authentication and authorization system\n';
    }
    if (features.api) {
      requirements += '- RESTful API with proper documentation\n';
    }
    if (features.realtime) {
      requirements += '- Real-time communication capabilities\n';
    }
    if (features.database) {
      requirements += '- Persistent data storage and retrieval\n';
    }
    
    return requirements || '- To be determined based on project requirements\n';
  }

  generateSuccessCriteria() {
    return `- All tests passing
- Code coverage > 80%
- Performance benchmarks met
- Security audit passed
- Documentation complete
`;
  }

  generateConstraints() {
    return `- Technology stack: ${this.analysis.factors?.techStack?.languages?.join(', ') || 'Not specified'}
- Timeline: Based on complexity score (${this.analysis.score}/100)
- Resources: ${this.approach.agentCount} agents allocated
`;
  }

  generatePseudocode() {
    return `// Core application flow
function main() {
  initialize_application()
  setup_middleware()
  configure_routes()
  connect_to_database()
  start_server()
}
`;
  }

  generateDataStructures() {
    return `- User Model
- Session Management
- Request/Response Objects
- Configuration Objects
`;
  }

  generateSystemDesign() {
    return `- Layered architecture
- Service-oriented design
- Event-driven components
- Scalable infrastructure
`;
  }

  generateComponentBreakdown() {
    return `- Frontend components
- Backend services
- Data access layer
- External integrations
`;
  }

  generateOptimizations() {
    return `- Code refactoring opportunities
- Performance bottleneck resolution
- Memory usage optimization
- Query optimization
`;
  }

  generateQualityImprovements() {
    return `- Code review findings
- Test coverage gaps
- Documentation updates
- Security enhancements
`;
  }

  generateImplementationChecklist() {
    return `- [ ] Core features implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Performance tested
- [ ] Security validated
`;
  }

  generateTestingStrategy() {
    return `- Unit tests for all components
- Integration tests for APIs
- End-to-end tests for critical paths
- Performance testing
- Security testing
`;
  }

  generateDeploymentPlan() {
    return `- Environment setup
- Database migrations
- Configuration management
- Monitoring setup
- Rollback procedures
`;
  }

  loadTemplates() {
    // In a real implementation, these would be loaded from template files
    return {
      'react-component': `import React from 'react';

const {{componentName}} = () => {
  return (
    <div>
      {{componentName}} Component
    </div>
  );
};

export default {{componentName}};`,
      'express-controller': `const {{resourceName}}Service = require('../services/{{resourceName}}Service');

exports.getAll = async (req, res) => {
  try {
    const items = await {{resourceName}}Service.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};`
    };
  }

  /**
   * Generate agent configurations based on project complexity
   */
  async generateAgentConfigs() {
    const configs = {};
    const complexity = this.analysis.score || 0;
    
    // Always include orchestrator
    configs['workflow-orchestrator'] = true;
    
    // Add agents based on complexity
    if (complexity > 20) {
      configs['complexity-analyzer-agent'] = true;
      configs['approach-selector-agent'] = true;
    }
    
    if (complexity > 40) {
      configs['document-customizer-agent'] = true;
      configs['integration-coordinator-agent'] = true;
    }
    
    if (complexity > 70) {
      configs['sparc-methodology-agent'] = true;
    }
    
    // Generate agent config files
    const agentFiles = {};
    const agentTemplateDir = path.join(__dirname, '..', 'agent-templates');
    
    for (const agentName of Object.keys(configs)) {
      const templatePath = path.join(agentTemplateDir, `${agentName}.md`);
      if (fs.existsSync(templatePath)) {
        const template = fs.readFileSync(templatePath, 'utf8');
        
        // Customize template based on project
        let customized = template;
        
        // Add project-specific context
        customized = customized.replace(/\[Project Name\]/g, this.analysis.projectName || 'Project');
        customized = customized.replace(/\[complexity\]/g, complexity);
        customized = customized.replace(/\[approach\]/g, this.approach.name);
        
        agentFiles[`${agentName}.md`] = customized;
      }
    }
    
    return {
      enabled: Object.keys(configs),
      files: agentFiles,
      orchestration: {
        master: 'workflow-orchestrator',
        complexity,
        approach: this.approach.selected
      }
    };
  }

  /**
   * Detect if running in container environment
   */
  detectContainerEnvironment() {
    // Check for common container indicators
    if (process.env.CONTAINER || 
        fs.existsSync('/.dockerenv') || 
        fs.existsSync('/run/.containerenv') ||
        process.env.KUBERNETES_SERVICE_HOST) {
      return true;
    }
    
    // Check for devcontainer
    if (process.env.REMOTE_CONTAINERS || 
        process.env.CODESPACES ||
        fs.existsSync('/workspaces/.devcontainer')) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate optimal command based on environment and analysis
   */
  generateOptimalCommand() {
    const score = this.analysis.score || 50;
    const versionName = versionPolicy.getSelectedVersionName({ analysis: this.analysis });
    const isContainer = this.detectContainerEnvironment();
    const hasYolo = process.env.YOLO_MODE === 'true';
    
    let command = 'npx claude-flow';
    command += versionPolicy.getSuffixForName(versionName);
    
    if (score <= 30) {
      command += ' swarm';
    } else if (score <= 70) {
      command += ' hive-mind spawn --agents 4';
    } else {
      command += ' hive-mind spawn --sparc --agents 8';
    }
    
    // Add appropriate Claude command
    command += hasYolo ? ' --yolo' : ' --claude';
    
    // Add container-specific flags if needed
    if (isContainer) {
      command += ' --container-mode';
    }
    
    command += ` "MASTER-WORKFLOW"`;
    
    return command;
  }

  /**
   * Generate slash commands for workflow control
   */
  async generateSlashCommands() {
    const commands = {};
    const commandTemplateDir = path.join(__dirname, '..', 'slash-commands');
    
    // Core commands always included
    const coreCommands = ['workflow', 'analyze', 'agents'];
    
    // Add SPARC command if high complexity
    if (this.analysis.score > 70 || this.approach.selected === 'hiveMindSparc') {
      coreCommands.push('sparc');
    }
    
    // Add quick command for simple projects
    if (this.analysis.score < 50) {
      coreCommands.push('quick');
    }
    
    // Generate command files
    for (const cmdName of coreCommands) {
      const templatePath = path.join(commandTemplateDir, `${cmdName}.md`);
      if (fs.existsSync(templatePath)) {
        const template = fs.readFileSync(templatePath, 'utf8');
        
        // Customize based on project
        let customized = template;
        const versionName = versionPolicy.getSelectedVersionName({ analysis: this.analysis });
        customized = customized.replace(/\[version\]/g, versionName);
        customized = customized.replace(/\[project\]/g, this.analysis.projectName || 'project');
        
        commands[`${cmdName}.md`] = customized;
      }
    }
    
    return {
      enabled: coreCommands,
      files: commands,
      defaultCommand: this.analysis.score > 70 ? 'sparc' : 'workflow'
    };
  }
}

// CLI execution
if (require.main === module) {
  const analysisPath = process.argv[2];
  const approachPath = process.argv[3];
  
  if (!analysisPath || !approachPath) {
    console.error('Usage: document-customizer.js <analysis.json> <approach.json>');
    process.exit(1);
  }
  
  try {
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    const approach = JSON.parse(fs.readFileSync(approachPath, 'utf8'));
    
    const customizer = new DocumentCustomizer(analysis, approach);
    customizer.generateDocuments().then(documents => {
      console.log(JSON.stringify(documents, null, 2));
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = DocumentCustomizer;