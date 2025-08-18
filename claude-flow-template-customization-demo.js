#!/usr/bin/env node

/**
 * Claude Flow 2.0 Template Customization Pipeline Demo
 * 
 * This demonstrates the complete workflow that happens when a user runs:
 * `npx claude-flow@2.0.0 init --claude --webui` in their project directory
 * 
 * Features:
 * - Template Discovery from /.claude/agents/
 * - Project Analysis and Tech Stack Detection
 * - Template Customization for specific project types
 * - CLAUDE.md Generation with project-specific instructions
 * - Agent Configuration Customization
 * - MCP Server Selection based on dependencies
 * - Workflow Approach Selection (simple-swarm vs hive-mind vs sparc)
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class ClaudeFlowTemplateCustomizationDemo {
  constructor() {
    this.projectTypes = {
      'empty': { complexity: 5, description: 'Empty or new project' },
      'react': { complexity: 35, description: 'React frontend application' },
      'node-api': { complexity: 45, description: 'Node.js API backend' },
      'python-ml': { complexity: 60, description: 'Python Machine Learning project' },
      'microservices': { complexity: 85, description: 'Microservices architecture' },
      'claude-flow-system': { complexity: 95, description: 'Claude Flow 2.0 System (this project)' }
    };
    
    this.agentTemplates = [
      'complexity-analyzer-agent',
      'document-customizer-agent',
      'approach-selector-agent',
      'code-analyzer-agent',
      'api-builder-agent',
      'database-architect-agent',
      'security-scanner-agent',
      'frontend-specialist-agent',
      'deployment-engineer-agent',
      'recovery-specialist-agent'
    ];

    this.mcpServerCategories = {
      ESSENTIAL: ['context7', 'filesystem', 'git', 'grep', 'http'],
      DEVELOPMENT: ['github', 'npm', 'docker', 'kubernetes'],
      DATABASE: ['postgres', 'mongodb', 'redis', 'sqlite'],
      CLOUD: ['aws', 'gcp', 'azure', 'vercel'],
      AI_ML: ['openai', 'anthropic', 'huggingface', 'langchain'],
      TESTING: ['jest', 'cypress', 'playwright']
    };
  }

  /**
   * Main demonstration entry point
   */
  async runDemo() {
    console.log(chalk.cyan.bold('\n🎯 Claude Flow 2.0 Template Customization Pipeline Demo'));
    console.log(chalk.gray('Demonstrating: npx claude-flow@2.0.0 init --claude --webui\n'));

    // Step 1: Template Discovery
    await this.demonstrateTemplateDiscovery();
    
    // Step 2-6: Show customization for different project types
    for (const [projectType, config] of Object.entries(this.projectTypes)) {
      await this.demonstrateProjectCustomization(projectType, config);
    }

    // Step 7: Show complete pipeline
    await this.demonstrateCompletePipeline();
    
    console.log(chalk.green.bold('\n✅ Template Customization Demo Complete!'));
    console.log(chalk.gray('This shows how Claude Flow 2.0 automatically adapts to any project type.\n'));
  }

  /**
   * Step 1: Demonstrate template discovery from /.claude/agents/
   */
  async demonstrateTemplateDiscovery() {
    console.log(chalk.yellow.bold('═══════════════════════════════════════════════════════════'));
    console.log(chalk.yellow.bold('Step 1: Template Discovery'));
    console.log(chalk.yellow.bold('═══════════════════════════════════════════════════════════'));
    
    console.log(chalk.cyan('\n🔍 Scanning /.claude/agents/ directory for Agent-OS templates...'));
    
    // Simulate discovering templates
    const templates = await this.discoverAgentTemplates();
    
    console.log(chalk.green(`✅ Discovered ${templates.length} Agent-OS templates:`));
    templates.forEach((template, index) => {
      console.log(`  ${index + 1}. ${template.name} - ${template.description}`);
    });

    console.log(chalk.cyan('\n📋 Template Categories:'));
    console.log(`  • Analysis Agents: complexity-analyzer, code-analyzer`);
    console.log(`  • Implementation Agents: api-builder, database-architect, frontend-specialist`);
    console.log(`  • Quality Agents: security-scanner, test-runner, recovery-specialist`);
    console.log(`  • Management Agents: document-customizer, workflow-orchestrator`);

    await this.pause();
  }

  /**
   * Demonstrate project customization for a specific project type
   */
  async demonstrateProjectCustomization(projectType, config) {
    console.log(chalk.yellow.bold('\n═══════════════════════════════════════════════════════════'));
    console.log(chalk.yellow.bold(`Project Type: ${projectType.toUpperCase()} (Complexity: ${config.complexity}/100)`));
    console.log(chalk.yellow.bold('═══════════════════════════════════════════════════════════'));

    // Step 2: Project Analysis
    console.log(chalk.cyan('\n📊 Step 2: Project Analysis & Tech Stack Detection'));
    const analysis = this.simulateProjectAnalysis(projectType);
    
    console.log(chalk.green('Tech Stack Detected:'));
    console.log(`  Languages: ${analysis.languages.join(', ')}`);
    console.log(`  Frameworks: ${analysis.frameworks.join(', ')}`);
    console.log(`  Databases: ${analysis.databases.join(', ')}`);
    console.log(`  Deployment: ${analysis.deployment.join(', ')}`);

    // Step 3: Template Customization
    console.log(chalk.cyan('\n🎨 Step 3: Template Customization'));
    const customization = this.generateTemplateCustomization(projectType, analysis);
    
    console.log(chalk.green('Customizations Applied:'));
    customization.forEach(custom => {
      console.log(`  • ${custom}`);
    });

    // Step 4: CLAUDE.md Generation
    console.log(chalk.cyan('\n📄 Step 4: CLAUDE.md Generation'));
    const claudeMd = this.generateClaudeMd(projectType, analysis, config.complexity);
    
    console.log(chalk.green('Generated CLAUDE.md sections:'));
    console.log(claudeMd.preview);

    // Step 5: Agent Configuration
    console.log(chalk.cyan('\n🤖 Step 5: Agent Configuration Customization'));
    const agentConfig = this.customizeAgentConfiguration(projectType, analysis);
    
    console.log(chalk.green('Agent Assignments:'));
    agentConfig.forEach(agent => {
      console.log(`  ${agent.name}: ${agent.responsibilities.slice(0, 2).join(', ')}...`);
    });

    // Step 6: MCP Server Selection
    console.log(chalk.cyan('\n🔧 Step 6: MCP Server Selection'));
    const mcpServers = this.selectMCPServers(analysis);
    
    console.log(chalk.green('Selected MCP Servers:'));
    for (const [category, servers] of Object.entries(mcpServers)) {
      if (servers.length > 0) {
        console.log(`  ${category}: ${servers.join(', ')}`);
      }
    }

    // Step 7: Workflow Approach Selection
    console.log(chalk.cyan('\n⚡ Step 7: Workflow Approach Selection'));
    const approach = this.selectWorkflowApproach(config.complexity);
    
    console.log(chalk.green(`Selected Approach: ${approach.name}`));
    console.log(`  Rationale: ${approach.rationale}`);
    console.log(`  Command: ${approach.command}`);

    await this.pause();
  }

  /**
   * Demonstrate the complete pipeline with the current project
   */
  async demonstrateCompletePipeline() {
    console.log(chalk.yellow.bold('\n═══════════════════════════════════════════════════════════'));
    console.log(chalk.yellow.bold('COMPLETE PIPELINE: Current Claude Flow 2.0 Project'));
    console.log(chalk.yellow.bold('═══════════════════════════════════════════════════════════'));

    console.log(chalk.cyan('\n🎯 Analyzing Current Project (Claude Flow 2.0 Workflow System)'));
    
    const currentAnalysis = {
      languages: ['JavaScript', 'TypeScript', 'Python', 'Shell'],
      frameworks: ['Node.js', 'Express', 'React (WebUI)', 'SQLite'],
      databases: ['SQLite', 'Shared Memory Store'],
      deployment: ['Docker', 'Cross-platform', 'npm Registry'],
      features: ['Queen Controller', 'Sub-Agents', 'MCP Integration', 'Real-time Monitoring'],
      architecture: 'Hive-Mind with Queen Controller',
      complexity: 95
    };

    // Show complete customization
    console.log(chalk.green('\n✅ Complete Analysis Results:'));
    console.log(`  Project Type: Advanced Workflow System`);
    console.log(`  Complexity Score: ${currentAnalysis.complexity}/100`);
    console.log(`  Architecture: ${currentAnalysis.architecture}`);
    console.log(`  Stage: mature`);

    // Generated CLAUDE.md structure
    console.log(chalk.cyan('\n📋 Generated Project Structure:'));
    const structure = this.generateProjectStructure(currentAnalysis);
    structure.forEach(item => {
      console.log(`  ${item}`);
    });

    // Final customizations
    console.log(chalk.cyan('\n🎨 Applied Customizations:'));
    const finalCustomizations = [
      'Configured 10 specialized sub-agents for complex workflow management',
      'Selected hive-mind approach for enterprise-scale coordination',
      'Integrated 25+ MCP servers across all categories',
      'Added Queen Controller architecture documentation',
      'Generated SPARC methodology phases for systematic development',
      'Configured cross-platform installation and deployment',
      'Added real-time monitoring and performance analytics',
      'Implemented shared memory store for agent coordination'
    ];
    
    finalCustomizations.forEach(custom => {
      console.log(`  ✅ ${custom}`);
    });

    console.log(chalk.green.bold('\n🎉 Pipeline Complete! Ready for production use.'));
  }

  // Helper methods for simulation

  async discoverAgentTemplates() {
    return this.agentTemplates.map(name => ({
      name: name,
      description: this.getAgentDescription(name)
    }));
  }

  getAgentDescription(agentName) {
    const descriptions = {
      'complexity-analyzer-agent': 'Analyzes project complexity across 8 dimensions',
      'document-customizer-agent': 'Generates project-specific documentation and configs',
      'approach-selector-agent': 'Selects optimal workflow approach based on complexity',
      'code-analyzer-agent': 'Deep codebase analysis and pattern detection',
      'api-builder-agent': 'REST/GraphQL API implementation and documentation',
      'database-architect-agent': 'Database design, optimization, and migrations',
      'security-scanner-agent': 'Security vulnerability scanning and compliance',
      'frontend-specialist-agent': 'Frontend UI/UX implementation and optimization',
      'deployment-engineer-agent': 'CI/CD pipelines and infrastructure automation',
      'recovery-specialist-agent': 'Error recovery and system resilience strategies'
    };
    return descriptions[agentName] || 'Specialized workflow agent';
  }

  simulateProjectAnalysis(projectType) {
    const analyses = {
      'empty': {
        languages: [],
        frameworks: [],
        databases: [],
        deployment: []
      },
      'react': {
        languages: ['JavaScript', 'TypeScript'],
        frameworks: ['React', 'Vite', 'Express'],
        databases: ['PostgreSQL'],
        deployment: ['Vercel', 'Docker']
      },
      'node-api': {
        languages: ['JavaScript', 'TypeScript'],
        frameworks: ['Express', 'NestJS'],
        databases: ['PostgreSQL', 'Redis'],
        deployment: ['AWS', 'Docker', 'Kubernetes']
      },
      'python-ml': {
        languages: ['Python'],
        frameworks: ['FastAPI', 'TensorFlow', 'PyTorch'],
        databases: ['PostgreSQL', 'MongoDB'],
        deployment: ['AWS', 'Google Cloud', 'Docker']
      },
      'microservices': {
        languages: ['JavaScript', 'Python', 'Go'],
        frameworks: ['Express', 'FastAPI', 'Gin'],
        databases: ['PostgreSQL', 'MongoDB', 'Redis'],
        deployment: ['Kubernetes', 'Docker', 'AWS', 'Istio']
      },
      'claude-flow-system': {
        languages: ['JavaScript', 'TypeScript', 'Python'],
        frameworks: ['Node.js', 'Express', 'React'],
        databases: ['SQLite', 'Shared Memory'],
        deployment: ['Cross-platform', 'npm', 'Docker']
      }
    };
    return analyses[projectType] || analyses['empty'];
  }

  generateTemplateCustomization(projectType, analysis) {
    const customizations = [];
    
    // Language-specific customizations
    if (analysis.languages.includes('TypeScript')) {
      customizations.push('Added TypeScript strict mode configuration');
      customizations.push('Generated type definitions for project APIs');
    }
    
    if (analysis.languages.includes('Python')) {
      customizations.push('Applied PEP 8 style guide configuration');
      customizations.push('Added Python virtual environment setup');
    }
    
    // Framework-specific customizations
    if (analysis.frameworks.includes('React')) {
      customizations.push('Configured React functional components with hooks');
      customizations.push('Added React Testing Library setup');
    }
    
    if (analysis.frameworks.includes('Express')) {
      customizations.push('Generated Express middleware configuration');
      customizations.push('Added REST API documentation templates');
    }
    
    // Project type specific
    switch (projectType) {
      case 'empty':
        customizations.push('Generated starter project templates');
        customizations.push('Added basic development workflow');
        break;
      case 'microservices':
        customizations.push('Configured service mesh architecture');
        customizations.push('Added inter-service communication patterns');
        break;
      case 'claude-flow-system':
        customizations.push('Configured Queen Controller architecture');
        customizations.push('Added sub-agent coordination patterns');
        break;
    }
    
    return customizations;
  }

  generateClaudeMd(projectType, analysis, complexity) {
    const sections = [
      `# Claude Configuration - ${projectType} Project`,
      '',
      `## Project Analysis`,
      `- **Complexity Score**: ${complexity}/100`,
      `- **Stage**: ${this.getStageFromComplexity(complexity)}`,
      `- **Architecture**: ${this.getArchitectureFromAnalysis(analysis)}`,
      '',
      `## Technology Stack`,
      ...analysis.languages.map(lang => `- **Language**: ${lang}`),
      ...analysis.frameworks.map(fw => `- **Framework**: ${fw}`),
      '',
      `## Workflow Configuration`,
      `- **Selected Approach**: ${this.selectWorkflowApproach(complexity).name}`,
      `- **Agent Count**: ${this.getAgentCount(complexity)}`,
      `- **Context Windows**: 200k per agent`,
      '',
      `## Custom Instructions`,
      '- Follow project-specific patterns and conventions',
      '- Maintain consistency with existing codebase',
      '- Implement comprehensive testing strategy'
    ];

    return {
      content: sections.join('\n'),
      preview: sections.slice(0, 10).join('\n') + '\n  ... (additional sections)'
    };
  }

  customizeAgentConfiguration(projectType, analysis) {
    const baseAgents = [
      { name: 'complexity-analyzer-agent', responsibilities: ['Complexity analysis', 'Pattern detection'] },
      { name: 'code-analyzer-agent', responsibilities: ['Code quality', 'Architecture analysis'] }
    ];

    // Add agents based on analysis
    if (analysis.frameworks.includes('React') || analysis.frameworks.includes('Vue')) {
      baseAgents.push({
        name: 'frontend-specialist-agent',
        responsibilities: ['UI/UX implementation', 'Component optimization']
      });
    }

    if (analysis.frameworks.includes('Express') || analysis.frameworks.includes('FastAPI')) {
      baseAgents.push({
        name: 'api-builder-agent',
        responsibilities: ['API development', 'Schema validation']
      });
    }

    if (analysis.databases.length > 0) {
      baseAgents.push({
        name: 'database-architect-agent',
        responsibilities: ['Schema design', 'Query optimization']
      });
    }

    if (analysis.deployment.includes('Docker') || analysis.deployment.includes('Kubernetes')) {
      baseAgents.push({
        name: 'deployment-engineer-agent',
        responsibilities: ['CI/CD setup', 'Container orchestration']
      });
    }

    baseAgents.push({
      name: 'security-scanner-agent',
      responsibilities: ['Vulnerability scanning', 'Security compliance']
    });

    return baseAgents;
  }

  selectMCPServers(analysis) {
    const selected = {
      ESSENTIAL: ['context7', 'filesystem', 'git'],
      DEVELOPMENT: [],
      DATABASE: [],
      CLOUD: [],
      AI_ML: [],
      TESTING: []
    };

    // Language-based selection
    if (analysis.languages.includes('JavaScript') || analysis.languages.includes('TypeScript')) {
      selected.DEVELOPMENT.push('npm', 'github');
    }

    if (analysis.languages.includes('Python')) {
      selected.DEVELOPMENT.push('pip', 'github');
    }

    // Framework-based selection
    if (analysis.frameworks.includes('React') || analysis.frameworks.includes('Vue')) {
      selected.DEVELOPMENT.push('vite', 'webpack');
      selected.TESTING.push('jest', 'cypress');
    }

    // Database selection
    analysis.databases.forEach(db => {
      if (db.toLowerCase().includes('postgres')) selected.DATABASE.push('postgres');
      if (db.toLowerCase().includes('mongo')) selected.DATABASE.push('mongodb');
      if (db.toLowerCase().includes('redis')) selected.DATABASE.push('redis');
    });

    // Deployment selection
    analysis.deployment.forEach(deploy => {
      if (deploy.toLowerCase().includes('aws')) selected.CLOUD.push('aws', 's3');
      if (deploy.toLowerCase().includes('docker')) selected.DEVELOPMENT.push('docker');
      if (deploy.toLowerCase().includes('kubernetes')) selected.DEVELOPMENT.push('kubernetes');
    });

    return selected;
  }

  selectWorkflowApproach(complexity) {
    if (complexity <= 20) {
      return {
        name: 'simple-swarm',
        rationale: 'Low complexity project suitable for basic agent coordination',
        command: 'npx claude-flow@2.0.0 swarm'
      };
    } else if (complexity <= 60) {
      return {
        name: 'hive-mind',
        rationale: 'Medium complexity requiring Queen Controller with specialized agents',
        command: 'npx claude-flow@2.0.0 hive-mind --agents 6'
      };
    } else {
      return {
        name: 'hive-mind-sparc',
        rationale: 'High complexity requiring full SPARC methodology with enterprise features',
        command: 'npx claude-flow@2.0.0 hive-mind --sparc --agents 10'
      };
    }
  }

  generateProjectStructure(analysis) {
    return [
      '📁 Project Root/',
      '├── 📄 CLAUDE.md (Generated project configuration)',
      '├── 📁 .claude/',
      '│   ├── 📁 agents/ (10 specialized sub-agents)',
      '│   ├── 📄 config.json (Workflow configuration)',
      '│   └── 📄 mcp-servers.json (MCP server config)',
      '├── 📁 intelligence-engine/ (Queen Controller)',
      '├── 📁 workflows/ (SPARC methodology phases)',
      '├── 📁 monitoring/ (Real-time dashboard)',
      '└── 📄 package.json (Dependencies and scripts)'
    ];
  }

  // Utility methods
  getStageFromComplexity(complexity) {
    if (complexity <= 10) return 'idea';
    if (complexity <= 30) return 'early';
    if (complexity <= 60) return 'active';
    return 'mature';
  }

  getArchitectureFromAnalysis(analysis) {
    if (analysis.deployment.includes('Kubernetes')) return 'microservices';
    if (analysis.frameworks.length > 2) return 'multi-tier';
    if (analysis.frameworks.includes('React') && analysis.frameworks.includes('Express')) return 'full-stack';
    return 'monolithic';
  }

  getAgentCount(complexity) {
    if (complexity <= 20) return 3;
    if (complexity <= 60) return 6;
    return 10;
  }

  async pause() {
    console.log(chalk.gray('\n⏸️  Press Enter to continue...'));
    return new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
  }
}

// Run the demo if called directly
if (require.main === module) {
  const demo = new ClaudeFlowTemplateCustomizationDemo();
  demo.runDemo().catch(console.error);
}

module.exports = ClaudeFlowTemplateCustomizationDemo;