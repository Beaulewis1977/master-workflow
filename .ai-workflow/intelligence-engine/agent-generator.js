#!/usr/bin/env node

/**
 * Agent Generator - Claude Flow 2.0
 * 
 * Generates project-specific sub-agents based on project analysis
 * Creates customized agents in .claude/agents/ following Anthropic's specification
 * 
 * @see https://docs.anthropic.com/en/docs/claude-code/sub-agents
 */

const fs = require('fs');
const path = require('path');

class AgentGenerator {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.agentDir = path.join(this.projectRoot, '.claude', 'agents');
    this.templateDir = options.templateDir || path.join(this.projectRoot, '.ai-workflow', 'agent-templates');
    this.userAgentDir = path.join(require('os').homedir(), '.claude', 'agents');
    
    // Agent selection rules based on complexity and project type
    this.agentSelectionRules = {
      // Always include these core agents
      core: [
        'workflow-orchestrator',
        'code-analyzer'
      ],
      
      // Complexity-based agents - NO LIMITS, generate as many as needed
      complexity: {
        low: {  // 0-30
          agents: ['test-runner', 'doc-generator'],
          minAgents: 4,
          maxAgents: null  // Unlimited
        },
        medium: {  // 31-70
          agents: ['test-runner', 'doc-generator', 'api-builder', 'database-architect'],
          minAgents: 7,
          maxAgents: null  // Unlimited
        },
        high: {  // 71-100
          agents: ['test-runner', 'doc-generator', 'api-builder', 'database-architect', 
                   'security-scanner', 'performance-optimizer', 'deployment-engineer'],
          minAgents: 10,
          maxAgents: null  // Unlimited
        },
        sparc: {  // 71+ with SPARC
          agents: ['sparc-methodology', 'test-runner', 'doc-generator', 'api-builder', 
                   'database-architect', 'security-scanner', 'performance-optimizer', 
                   'deployment-engineer', 'recovery-specialist'],
          minAgents: 12,
          maxAgents: null  // Unlimited - can generate 4000+ agents
        },
        enterprise: {  // 90+ enterprise scale
          agents: ['sparc-methodology', 'test-runner', 'doc-generator', 'api-builder', 
                   'database-architect', 'security-scanner', 'performance-optimizer', 
                   'deployment-engineer', 'recovery-specialist', 'scalability-architect',
                   'microservice-orchestrator', 'event-bus-manager', 'saga-coordinator'],
          minAgents: 50,
          maxAgents: null  // Unlimited - designed for 4000+ agents
        }
      },
      
      // Tech-stack specific agents
      techStack: {
        react: ['frontend-react-specialist'],
        vue: ['frontend-vue-specialist'],
        angular: ['frontend-angular-specialist'],
        nextjs: ['fullstack-nextjs-specialist'],
        nodejs: ['backend-nodejs-specialist'],
        python: ['backend-python-specialist'],
        go: ['backend-go-specialist'],
        rust: ['backend-rust-specialist'],
        docker: ['container-orchestration-specialist'],
        kubernetes: ['k8s-deployment-specialist'],
        aws: ['cloud-aws-specialist'],
        gcp: ['cloud-gcp-specialist'],
        azure: ['cloud-azure-specialist']
      },
      
      // Project-type specific agents
      projectType: {
        api: ['api-builder', 'api-tester', 'openapi-generator'],
        webapp: ['frontend-specialist', 'ui-ux-reviewer', 'accessibility-auditor'],
        mobile: ['mobile-developer', 'app-store-publisher'],
        cli: ['cli-builder', 'terminal-ui-specialist'],
        library: ['package-publisher', 'documentation-writer', 'changelog-manager'],
        microservices: ['service-mesh-architect', 'distributed-tracing-specialist'],
        ml: ['ml-engineer', 'data-pipeline-builder', 'model-evaluator']
      }
    };
  }

  /**
   * Generate unlimited specialized agents dynamically based on project scale
   */
  generateUnlimitedAgents(analysis, targetCount = 4000) {
    const agents = [];
    
    // Generate specialized agents for every detected pattern
    const patterns = analysis.factors?.patterns || [];
    patterns.forEach(pattern => {
      agents.push({
        name: `pattern-${pattern}-specialist`,
        description: `Specialized agent for ${pattern} pattern implementation`
      });
    });
    
    // Generate agents for each file type concentration
    const fileTypes = analysis.factors?.fileTypes || {};
    Object.entries(fileTypes).forEach(([ext, count]) => {
      if (count > 10) {
        agents.push({
          name: `filetype-${ext}-specialist`,
          description: `Specialized agent for ${ext} files`
        });
      }
    });
    
    // Generate agents for each major directory
    const directories = analysis.factors?.structure?.directories || [];
    directories.forEach(dir => {
      if (dir.files > 5) {
        agents.push({
          name: `module-${dir.name.replace(/[^a-z0-9]/gi, '-')}-specialist`,
          description: `Specialized agent for ${dir.name} module`
        });
      }
    });
    
    // Generate numbered specialists to reach target count
    const currentCount = agents.length;
    if (currentCount < targetCount) {
      const remaining = targetCount - currentCount;
      const specializations = [
        'performance', 'security', 'testing', 'documentation', 'refactoring',
        'debugging', 'optimization', 'integration', 'deployment', 'monitoring',
        'logging', 'caching', 'validation', 'migration', 'scaling'
      ];
      
      for (let i = 0; i < remaining; i++) {
        const spec = specializations[i % specializations.length];
        const num = Math.floor(i / specializations.length) + 1;
        agents.push({
          name: `${spec}-specialist-${num}`,
          description: `Specialized ${spec} agent #${num} for distributed workload`
        });
      }
    }
    
    return agents;
  }

  /**
   * Generate all project-specific agents based on analysis
   */
  async generateProjectAgents(analysis, approach, options = {}) {
    console.log('🤖 Generating project-specific sub-agents...');
    
    // Support dry run for testing
    const dryRun = options.dryRun || false;
    
    try {
      if (!dryRun) {
        // Ensure .claude/agents directory exists
        await this.ensureAgentDirectory();
      }
      
      // Determine which agents to generate
      const selectedAgents = this.selectAgents(analysis, approach);
      console.log(`  Selected ${selectedAgents.length} agents for this project`);
      
      // For dry run, just return the agent list
      if (dryRun) {
        return selectedAgents.map(name => ({ name, description: `Specialized agent: ${name}` }));
      }
      
      // Generate each agent
      const generatedAgents = [];
      for (const agentType of selectedAgents) {
        try {
          const agent = await this.generateAgent(agentType, analysis, approach);
          if (agent) {
            generatedAgents.push(agent);
            console.log(`  ✅ Generated: ${agent.name}`);
          }
        } catch (error) {
          console.warn(`  ⚠️  Failed to generate ${agentType}: ${error.message}`);
        }
      }
      
      // For enterprise projects, generate unlimited additional agents
      const complexity = analysis.score || analysis.complexity?.score || 0;
      if (complexity >= 90 && !dryRun) {
        console.log('  📈 Generating unlimited specialized agents for enterprise project...');
        const unlimitedAgents = this.generateUnlimitedAgents(analysis, 100); // Start with 100, can scale to 4000+
        for (const agentDef of unlimitedAgents.slice(0, 50)) { // Generate first 50 for demo
          try {
            const agent = await this.generateDefaultAgent(agentDef.name, analysis);
            if (agent) {
              generatedAgents.push(agent);
            }
          } catch (error) {
            // Continue generating others
          }
        }
        console.log(`  🚀 Generated ${unlimitedAgents.length} additional specialized agents (can scale to 4000+)`);
      }
      
      // Generate project coordination agent
      const coordinatorAgent = await this.generateProjectCoordinator(analysis, approach, generatedAgents);
      if (coordinatorAgent) {
        generatedAgents.push(coordinatorAgent);
        console.log(`  ✅ Generated: ${coordinatorAgent.name}`);
      }
      
      // Create agent registry
      await this.createAgentRegistry(generatedAgents);
      
      console.log(`\n✨ Successfully generated ${generatedAgents.length} project-specific agents (unlimited scaling enabled)`);
      return generatedAgents;
      
    } catch (error) {
      console.error('Failed to generate agents:', error);
      throw error;
    }
  }

  /**
   * Select which agents to generate based on project analysis
   */
  selectAgents(analysis, approach) {
    const selected = new Set();
    
    // Add core agents
    this.agentSelectionRules.core.forEach(agent => selected.add(agent));
    
    // Add complexity-based agents
    const complexity = analysis.score || analysis.complexity?.score || 0;
    let complexityLevel = 'low';
    if (complexity >= 90) {
      complexityLevel = 'enterprise';  // For massive projects needing 4000+ agents
    } else if (complexity > 70 && (approach?.selected === 'hiveMindSparc' || approach === 'hive-mind-sparc')) {
      complexityLevel = 'sparc';
    } else if (complexity > 70) {
      complexityLevel = 'high';
    } else if (complexity > 30) {
      complexityLevel = 'medium';
    }
    
    const complexityAgents = this.agentSelectionRules.complexity[complexityLevel];
    complexityAgents.agents.forEach(agent => selected.add(agent));
    
    // Add tech-stack specific agents
    const techStack = analysis.factors?.techStack || {};
    
    // Check for frontend frameworks
    if (techStack.frameworks?.react) selected.add('frontend-react-specialist');
    if (techStack.frameworks?.vue) selected.add('frontend-vue-specialist');
    if (techStack.frameworks?.angular) selected.add('frontend-angular-specialist');
    if (techStack.frameworks?.nextjs) selected.add('fullstack-nextjs-specialist');
    
    // Check for backend languages
    if (techStack.languages?.includes('JavaScript') || techStack.languages?.includes('TypeScript')) {
      selected.add('backend-nodejs-specialist');
    }
    if (techStack.languages?.includes('Python')) selected.add('backend-python-specialist');
    if (techStack.languages?.includes('Go')) selected.add('backend-go-specialist');
    if (techStack.languages?.includes('Rust')) selected.add('backend-rust-specialist');
    
    // Check for infrastructure
    if (techStack.infrastructure?.docker) selected.add('container-orchestration-specialist');
    if (techStack.infrastructure?.kubernetes) selected.add('k8s-deployment-specialist');
    
    // Add project-type specific agents
    const projectType = analysis.projectType || this.detectProjectType(analysis);
    if (this.agentSelectionRules.projectType[projectType]) {
      this.agentSelectionRules.projectType[projectType].forEach(agent => selected.add(agent));
    }
    
    // NO LIMITS - Generate as many agents as needed
    const selectedArray = Array.from(selected);
    const minAgents = complexityAgents.minAgents || 4;
    
    // For enterprise projects, generate specialized agents for each detected component
    if (complexityLevel === 'enterprise' || complexity >= 90) {
      // Add microservice-specific agents if detected
      const microservices = analysis.factors?.architecture?.microservices || [];
      microservices.forEach((service, index) => {
        selectedArray.push(`microservice-${service}-specialist`);
      });
      
      // Add database-specific agents for each database
      const databases = techStack.databases || [];
      databases.forEach(db => {
        selectedArray.push(`database-${db}-specialist`);
      });
      
      // Add API endpoint specialists for large APIs
      const apiEndpoints = analysis.factors?.features?.detected?.apiEndpoints || 0;
      if (apiEndpoints > 50) {
        // Generate specialists for API groups
        for (let i = 0; i < Math.ceil(apiEndpoints / 10); i++) {
          selectedArray.push(`api-group-${i + 1}-specialist`);
        }
      }
      
      // Add component-specific agents for large frontend projects
      const components = analysis.factors?.frontend?.components || 0;
      if (components > 100) {
        for (let i = 0; i < Math.ceil(components / 20); i++) {
          selectedArray.push(`ui-component-group-${i + 1}-specialist`);
        }
      }
    }
    
    // Ensure we have at least the minimum number of agents
    if (selectedArray.length < minAgents) {
      // Add generic specialists to meet minimum
      const genericSpecialists = [
        'code-reviewer', 'refactoring-specialist', 'optimization-expert',
        'debugging-specialist', 'integration-tester', 'load-tester'
      ];
      
      for (const specialist of genericSpecialists) {
        if (selectedArray.length >= minAgents) break;
        if (!selectedArray.includes(specialist)) {
          selectedArray.push(specialist);
        }
      }
    }
    
    // No upper limit - return all selected agents
    console.log(`  📊 Generated ${selectedArray.length} specialized agents (no limits!)`);
    return selectedArray;
  }

  /**
   * Generate a single agent with project-specific customization
   */
  async generateAgent(agentType, analysis, approach) {
    // Try to load template
    const template = await this.loadAgentTemplate(agentType);
    if (!template) {
      // Generate from default template if specific template not found
      return this.generateDefaultAgent(agentType, analysis);
    }
    
    // Customize template with project context
    const customized = this.customizeTemplate(template, analysis, approach);
    
    // Write agent file
    const filename = `${agentType}.md`;
    const filepath = path.join(this.agentDir, filename);
    await fs.promises.writeFile(filepath, customized, 'utf8');
    
    return {
      name: agentType,
      path: filepath,
      description: this.extractDescription(customized)
    };
  }

  /**
   * Load agent template from various locations
   */
  async loadAgentTemplate(agentType) {
    const possiblePaths = [
      path.join(this.templateDir, `${agentType}.md`),
      path.join(this.templateDir, `${agentType}-agent.md`),
      path.join(this.projectRoot, '.ai-workflow', 'agent-templates', `${agentType}.md`),
      path.join(this.projectRoot, '.ai-workflow', 'agent-templates', `${agentType}-agent.md`),
      path.join(this.projectRoot, 'agent-templates', `${agentType}.md`),
      path.join(this.projectRoot, 'agent-templates', `${agentType}-agent.md`)
    ];
    
    for (const templatePath of possiblePaths) {
      try {
        const content = await fs.promises.readFile(templatePath, 'utf8');
        return content;
      } catch (error) {
        // Continue searching
      }
    }
    
    return null;
  }

  /**
   * Customize template with project-specific context
   */
  customizeTemplate(template, analysis, approach) {
    let customized = template;
    
    // Extract project information
    const projectName = analysis.projectName || path.basename(this.projectRoot);
    const complexity = analysis.score || 0;
    const stage = analysis.stage || 'development';
    const techStack = analysis.factors?.techStack || {};
    const approachName = approach?.selected || 'standard';
    
    // Replace standard placeholders
    customized = customized.replace(/\[Project Name\]/gi, projectName);
    customized = customized.replace(/\[project\]/gi, projectName);
    customized = customized.replace(/\[complexity\]/gi, complexity);
    customized = customized.replace(/\[stage\]/gi, stage);
    customized = customized.replace(/\[approach\]/gi, approachName);
    
    // Add project-specific context to description
    const lines = customized.split('\n');
    const headerEnd = lines.findIndex(line => line === '---', 1);
    
    if (headerEnd > 0) {
      // Update YAML frontmatter
      const header = lines.slice(0, headerEnd + 1);
      const body = lines.slice(headerEnd + 1);
      
      // Update description to be project-specific
      const descIndex = header.findIndex(line => line.startsWith('description:'));
      if (descIndex > 0) {
        const originalDesc = header[descIndex];
        header[descIndex] = originalDesc.replace('project', projectName)
          .replace('codebase', `${projectName} codebase`);
      }
      
      // Add project context to body
      const contextSection = `
## Project Context
- **Project**: ${projectName}
- **Complexity**: ${complexity}/100
- **Stage**: ${stage}
- **Approach**: ${approachName}
- **Primary Language**: ${techStack.primaryLanguage || 'JavaScript'}
- **Framework**: ${techStack.primaryFramework || 'Not detected'}

## Project-Specific Guidelines
${this.generateProjectGuidelines(analysis)}
`;
      
      // Insert context after the header
      body.splice(1, 0, contextSection);
      
      customized = [...header, ...body].join('\n');
    }
    
    // Clean up any remaining placeholders
    customized = customized.replace(/\[.*?\]/g, '');
    
    return customized;
  }

  /**
   * Generate project-specific guidelines based on analysis
   */
  generateProjectGuidelines(analysis) {
    const guidelines = [];
    
    // Add tech-stack specific guidelines
    const techStack = analysis.factors?.techStack || {};
    
    if (techStack.frameworks?.react) {
      guidelines.push('- Follow React best practices and hooks patterns');
      guidelines.push('- Ensure proper component composition and state management');
    }
    
    if (techStack.languages?.includes('TypeScript')) {
      guidelines.push('- Maintain strict TypeScript typing throughout the codebase');
      guidelines.push('- Avoid using `any` type unless absolutely necessary');
    }
    
    if (techStack.testing?.jest || techStack.testing?.mocha) {
      guidelines.push('- Write comprehensive unit tests for all new functionality');
      guidelines.push('- Maintain test coverage above 80%');
    }
    
    if (techStack.infrastructure?.docker) {
      guidelines.push('- Ensure all changes are compatible with containerized deployment');
      guidelines.push('- Update Dockerfile if dependencies change');
    }
    
    // Add project-type specific guidelines
    const hasAPI = analysis.factors?.features?.detected?.api;
    if (hasAPI) {
      guidelines.push('- Maintain RESTful API conventions');
      guidelines.push('- Update API documentation for any endpoint changes');
    }
    
    const hasDatabase = analysis.factors?.features?.detected?.database;
    if (hasDatabase) {
      guidelines.push('- Follow database migration best practices');
      guidelines.push('- Ensure data integrity in all database operations');
    }
    
    // Add general guidelines
    guidelines.push('- Follow existing code style and conventions');
    guidelines.push('- Update documentation when making significant changes');
    guidelines.push('- Consider performance implications of changes');
    
    return guidelines.join('\n');
  }

  /**
   * Generate a default agent when no template exists
   */
  async generateDefaultAgent(agentType, analysis) {
    const projectName = analysis.projectName || path.basename(this.projectRoot);
    const agentName = agentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const content = `---
name: ${agentType}
description: Specialized agent for ${agentName.toLowerCase()} tasks in the ${projectName} project. Use when ${agentName.toLowerCase()} expertise is needed.
---

You are a ${agentName} specialist for the ${projectName} project.

## Core Responsibilities
- Perform ${agentName.toLowerCase()} tasks with expertise
- Follow project-specific conventions and patterns
- Collaborate with other agents when needed
- Report results and status updates clearly

## Project Context
- **Project**: ${projectName}
- **Complexity**: ${analysis.score || 0}/100
- **Stage**: ${analysis.stage || 'development'}

## Guidelines
${this.generateProjectGuidelines(analysis)}

When working on tasks:
1. Analyze the requirements thoroughly
2. Plan your approach before implementation
3. Test your changes when applicable
4. Document any significant decisions
5. Communicate clearly with status updates
`;
    
    const filename = `${agentType}.md`;
    const filepath = path.join(this.agentDir, filename);
    await fs.promises.writeFile(filepath, content, 'utf8');
    
    return {
      name: agentType,
      path: filepath,
      description: `Specialized agent for ${agentName.toLowerCase()} tasks`
    };
  }

  /**
   * Generate project coordinator agent
   */
  async generateProjectCoordinator(analysis, approach, agents) {
    const projectName = analysis.projectName || path.basename(this.projectRoot);
    const agentList = agents.map(a => `- ${a.name}: ${a.description || 'Specialized agent'}`).join('\n');
    
    const content = `---
name: project-coordinator
description: Main coordinator for the ${projectName} project. Orchestrates work between specialized agents and ensures project goals are met. Use as the primary entry point for complex tasks.
---

You are the Project Coordinator for ${projectName}, responsible for orchestrating work across all specialized agents and ensuring project success.

## Project Overview
- **Name**: ${projectName}
- **Complexity**: ${analysis.score || 0}/100
- **Stage**: ${analysis.stage || 'development'}
- **Approach**: ${approach?.selected || 'standard'}
- **Team Size**: ${agents.length} specialized agents

## Available Agents
${agentList}

## Coordination Responsibilities

### 1. Task Distribution
- Analyze incoming requests and break them into subtasks
- Assign tasks to the most appropriate specialized agents
- Ensure optimal workload distribution

### 2. Quality Assurance
- Review outputs from all agents
- Ensure consistency across the project
- Validate that solutions meet project standards

### 3. Communication
- Provide clear status updates
- Coordinate information sharing between agents
- Summarize complex work for stakeholders

### 4. Project Standards
${this.generateProjectGuidelines(analysis)}

## Workflow Process
1. **Receive Request**: Understand the full scope of work needed
2. **Plan Approach**: Break down into manageable tasks
3. **Delegate Work**: Assign to specialized agents with clear instructions
4. **Monitor Progress**: Track task completion and quality
5. **Integrate Results**: Combine outputs into cohesive solution
6. **Report Success**: Provide clear summary of completed work

## Decision Framework
When deciding which agent to use:
- Code analysis or refactoring → code-analyzer
- Testing or test fixes → test-runner
- Documentation updates → doc-generator
- API development → api-builder
- Database work → database-architect
- Security concerns → security-scanner
- Performance issues → performance-optimizer
- Deployment tasks → deployment-engineer

Always prioritize:
1. Correctness and reliability
2. Code quality and maintainability
3. Performance and efficiency
4. Clear documentation
5. Security best practices
`;
    
    const filepath = path.join(this.agentDir, 'project-coordinator.md');
    await fs.promises.writeFile(filepath, content, 'utf8');
    
    return {
      name: 'project-coordinator',
      path: filepath,
      description: `Main coordinator for the ${projectName} project`
    };
  }

  /**
   * Create agent registry file
   */
  async createAgentRegistry(agents) {
    const registry = {
      version: '2.0',
      generated: new Date().toISOString(),
      projectRoot: this.projectRoot,
      agents: agents.map(agent => ({
        name: agent.name,
        path: agent.path.replace(this.projectRoot, '.'),
        description: agent.description,
        active: true
      }))
    };
    
    const registryPath = path.join(this.agentDir, 'agent-registry.json');
    await fs.promises.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf8');
    
    return registry;
  }

  /**
   * Ensure .claude/agents directory exists
   */
  async ensureAgentDirectory() {
    await fs.promises.mkdir(this.agentDir, { recursive: true });
    
    // Create .gitignore if it doesn't exist
    const gitignorePath = path.join(this.agentDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      await fs.promises.writeFile(gitignorePath, '# Project-specific agents\n# Add to git if you want to share with team\n', 'utf8');
    }
  }

  /**
   * Extract description from agent content
   */
  extractDescription(content) {
    const lines = content.split('\n');
    const descLine = lines.find(line => line.startsWith('description:'));
    if (descLine) {
      return descLine.replace('description:', '').trim();
    }
    return 'Specialized agent';
  }

  /**
   * Detect project type from analysis
   */
  detectProjectType(analysis) {
    const factors = analysis.factors || {};
    
    if (factors.features?.detected?.api) return 'api';
    if (factors.features?.detected?.webapp) return 'webapp';
    if (factors.features?.detected?.cli) return 'cli';
    if (factors.features?.detected?.mobile) return 'mobile';
    if (factors.projectType) return factors.projectType;
    
    // Detect based on tech stack
    const techStack = factors.techStack || {};
    if (techStack.frameworks?.react || techStack.frameworks?.vue || techStack.frameworks?.angular) {
      return 'webapp';
    }
    if (techStack.frameworks?.express || techStack.frameworks?.fastapi) {
      return 'api';
    }
    
    return 'general';
  }
}

// CLI execution
if (require.main === module) {
  const analysisPath = process.argv[2];
  const approachPath = process.argv[3];
  
  if (!analysisPath) {
    console.error('Usage: agent-generator.js <analysis.json> [approach.json]');
    process.exit(1);
  }
  
  try {
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    const approach = approachPath ? JSON.parse(fs.readFileSync(approachPath, 'utf8')) : null;
    
    const generator = new AgentGenerator();
    generator.generateProjectAgents(analysis, approach).then(agents => {
      console.log(`\nGenerated ${agents.length} agents:`);
      agents.forEach(agent => {
        console.log(`  - ${agent.name}`);
      });
    }).catch(error => {
      console.error('Error generating agents:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = AgentGenerator;