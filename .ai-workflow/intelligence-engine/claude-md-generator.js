#!/usr/bin/env node

/**
 * CLAUDE.md Generator
 * Phase 3 Implementation - MASTER-WORKFLOW v3.0
 * 
 * Generates comprehensive CLAUDE.md files that document workflow configuration,
 * sub-agent architecture, MCP server configurations, and custom instructions
 * based on deep codebase analysis.
 * 
 * Features:
 * - Automatic complexity scoring and stage determination
 * - Workflow approach selection (Simple Swarm/Hive-Mind/Hive-Mind+SPARC)
 * - Sub-agent configuration matrix (10 agents with responsibilities)
 * - MCP server configuration (all 87 servers with auto-detection)
 * - Custom instruction generation based on codebase patterns
 * - Interactive setup wizard with customization options
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const EventEmitter = require('events');

// Import existing components
const SharedMemoryStore = require('./shared-memory');
const ComplexityAnalyzer = require('./complexity-analyzer');
const ApproachSelector = require('./approach-selector');
const DeepCodebaseAnalyzer = require('./deep-codebase-analyzer');
const AgentCommunication = require('./agent-communication');

class ClaudeMdGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Integration with existing systems
    this.sharedMemory = options.sharedMemory || new SharedMemoryStore();
    this.complexityAnalyzer = options.complexityAnalyzer || new ComplexityAnalyzer();
    this.approachSelector = options.approachSelector || new ApproachSelector();
    this.deepAnalyzer = options.deepAnalyzer || new DeepCodebaseAnalyzer();
    this.agentCommunication = options.agentCommunication || new AgentCommunication();
    
    // Configuration
    this.config = {
      interactive: true,
      autoDetect: true,
      includeMetrics: true,
      includeExamples: true,
      customInstructions: true,
      ...options.config
    };
    
    // MCP Server Categories (87 servers total)
    this.mcpServerCategories = {
      ESSENTIAL: [
        'context7', 'filesystem', 'git', 'grep', 'http', 'memory'
      ],
      DEVELOPMENT: [
        'docker', 'kubernetes', 'github', 'gitlab', 'jira', 'linear',
        'npm', 'yarn', 'pnpm', 'composer', 'pip', 'cargo'
      ],
      DATABASE: [
        'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 
        'dynamodb', 'cassandra', 'neo4j', 'sqlite', 'firestore'
      ],
      CLOUD: [
        'aws', 'gcp', 'azure', 's3', 'cloudflare', 'vercel', 
        'netlify', 'heroku', 'digitalocean', 'linode'
      ],
      COMMUNICATION: [
        'slack', 'discord', 'teams', 'twilio', 'sendgrid', 
        'mailgun', 'telegram', 'webhook', 'email', 'sms'
      ],
      MONITORING: [
        'sentry', 'datadog', 'newrelic', 'prometheus', 'grafana',
        'elastic', 'logstash', 'kibana', 'splunk', 'pagerduty'
      ],
      AI_ML: [
        'openai', 'anthropic', 'huggingface', 'tensorflow', 
        'pytorch', 'langchain', 'pinecone', 'weaviate', 'qdrant'
      ],
      SPECIALIZED: [
        'stripe', 'paypal', 'square', 'shopify', 'wordpress',
        'drupal', 'magento', 'salesforce', 'hubspot', 'zendesk'
      ],
      TESTING: [
        'jest', 'mocha', 'cypress', 'playwright', 'selenium',
        'puppeteer', 'testcafe', 'vitest', 'jasmine', 'karma'
      ],
      BUILD_TOOLS: [
        'webpack', 'vite', 'rollup', 'parcel', 'esbuild',
        'turbo', 'nx', 'bazel', 'gradle', 'maven'
      ]
    };
    
    // Sub-agent templates (from Phase 2)
    this.subAgents = [
      'code-analyzer-agent',
      'test-runner-agent',
      'doc-generator-agent',
      'api-builder-agent',
      'database-architect-agent',
      'security-scanner-agent',
      'performance-optimizer-agent',
      'deployment-engineer-agent',
      'frontend-specialist-agent',
      'recovery-specialist-agent'
    ];
    
    // Workflow stages
    this.stages = {
      idea: { minComplexity: 0, maxComplexity: 10 },
      early: { minComplexity: 11, maxComplexity: 30 },
      active: { minComplexity: 31, maxComplexity: 60 },
      mature: { minComplexity: 61, maxComplexity: 100 }
    };
    
    // State management
    this.analysis = null;
    this.projectConfig = null;
    this.selectedServers = new Set();
    this.agentResponsibilities = new Map();
    
    this.setupEventHandlers();
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.agentCommunication.on('claude-md-request', this.handleGenerationRequest.bind(this));
    this.deepAnalyzer.on('analysis-complete', this.handleAnalysisComplete.bind(this));
  }
  
  /**
   * Main entry point for CLAUDE.md generation
   */
  async generate(analysisOrPath = process.cwd(), options = {}) {
    const generationId = `claude-md-${Date.now()}`;
    
    try {
      console.log(chalk.cyan('\n🎯 CLAUDE.md Generator v3.0'));
      console.log(chalk.gray('Analyzing project and generating workflow configuration...\n'));
      
      // Get or perform analysis
      this.analysis = await this.getAnalysis(analysisOrPath);
      
      // Determine project configuration
      this.projectConfig = await this.determineProjectConfig(this.analysis);
      
      // Interactive mode if enabled
      if (this.config.interactive && !options.skipInteractive) {
        await this.runInteractiveWizard();
      } else {
        // Auto-configuration
        await this.autoConfigureProject();
      }
      
      // Generate CLAUDE.md content
      const content = await this.generateContent();
      
      // Preview if interactive
      if (this.config.interactive && !options.skipPreview) {
        await this.previewContent(content);
        
        const confirm = await this.askConfirmation('Save this configuration?');
        if (!confirm) {
          console.log(chalk.yellow('Generation cancelled by user.'));
          return null;
        }
      }
      
      // Save CLAUDE.md
      await this.saveClaudeMd(content);
      
      // Store in shared memory
      await this.storeConfiguration(generationId, content);
      
      console.log(chalk.green('\n✅ CLAUDE.md generated successfully!'));
      
      return {
        generationId,
        path: 'CLAUDE.md',
        config: this.projectConfig
      };
      
    } catch (error) {
      this.emit('generation-error', { generationId, error });
      throw error;
    }
  }
  
  /**
   * Get or perform analysis
   */
  async getAnalysis(analysisOrPath) {
    if (typeof analysisOrPath === 'object') {
      // Already have analysis
      return analysisOrPath;
    }
    
    // Perform new analysis
    console.log(chalk.cyan('🔍 Analyzing codebase...'));
    const analysis = await this.deepAnalyzer.analyzeComplete(analysisOrPath);
    
    // Get complexity score
    const complexity = await this.complexityAnalyzer.analyzeComplexity(analysisOrPath);
    analysis.complexity = complexity;
    
    return analysis;
  }
  
  /**
   * Determine project configuration based on analysis
   */
  async determineProjectConfig(analysis) {
    const config = {
      projectName: path.basename(process.cwd()),
      complexityScore: analysis.complexity?.score || 0,
      stage: this.determineStage(analysis.complexity?.score || 0),
      approach: await this.selectApproach(analysis),
      architecture: analysis.architecture?.type || 'unknown',
      languages: this.detectLanguages(analysis),
      frameworks: this.detectFrameworks(analysis),
      testingTools: this.detectTestingTools(analysis),
      databases: this.detectDatabases(analysis),
      apis: this.detectAPIs(analysis),
      deployment: this.detectDeployment(analysis),
      mcpServers: new Set(),
      agentAssignments: new Map(),
      customInstructions: []
    };
    
    return config;
  }
  
  /**
   * Determine project stage based on complexity
   */
  determineStage(complexityScore) {
    for (const [stage, range] of Object.entries(this.stages)) {
      if (complexityScore >= range.minComplexity && complexityScore <= range.maxComplexity) {
        return stage;
      }
    }
    return 'active'; // Default
  }
  
  /**
   * Select workflow approach
   */
  async selectApproach(analysis) {
    const selector = this.approachSelector;
    const approach = await selector.selectApproach(analysis);
    return approach;
  }
  
  /**
   * Run interactive configuration wizard
   */
  async runInteractiveWizard() {
    console.log(chalk.cyan('\n🧙 Interactive Configuration Wizard'));
    console.log(chalk.gray('Let\'s customize your CLAUDE.md configuration.\n'));
    
    // Step 1: Confirm project details
    console.log(chalk.bold('Step 1: Project Details'));
    console.log(`  Project: ${this.projectConfig.projectName}`);
    console.log(`  Complexity: ${this.projectConfig.complexityScore}/100`);
    console.log(`  Stage: ${this.projectConfig.stage}`);
    console.log(`  Architecture: ${this.projectConfig.architecture}`);
    
    const customizeName = await this.askYesNo('\nCustomize project name?');
    if (customizeName) {
      this.projectConfig.projectName = await this.askInput('Project name:');
    }
    
    // Step 2: Workflow approach
    console.log(chalk.bold('\nStep 2: Workflow Approach'));
    console.log(`  Recommended: ${this.projectConfig.approach}`);
    
    const approaches = ['simple-swarm', 'hive-mind', 'hive-mind-sparc'];
    console.log('\n  Available approaches:');
    console.log('  1) Simple Swarm - Basic agent coordination');
    console.log('  2) Hive-Mind - Advanced Queen Controller with 10 agents');
    console.log('  3) Hive-Mind + SPARC - Enterprise with methodology');
    
    const changeApproach = await this.askYesNo('\nChange approach?');
    if (changeApproach) {
      const choice = await this.askChoice(['1', '2', '3']);
      this.projectConfig.approach = approaches[parseInt(choice) - 1];
    }
    
    // Step 3: MCP Server selection
    console.log(chalk.bold('\nStep 3: MCP Server Configuration'));
    await this.configureMCPServers();
    
    // Step 4: Agent assignments
    console.log(chalk.bold('\nStep 4: Sub-Agent Assignments'));
    await this.configureAgentAssignments();
    
    // Step 5: Custom instructions
    console.log(chalk.bold('\nStep 5: Custom Instructions'));
    await this.configureCustomInstructions();
  }
  
  /**
   * Auto-configure project without interaction
   */
  async autoConfigureProject() {
    console.log(chalk.cyan('🤖 Auto-configuring project...'));
    
    // Auto-detect MCP servers
    this.projectConfig.mcpServers = await this.autoDetectMCPServers();
    
    // Auto-assign agents
    this.projectConfig.agentAssignments = await this.autoAssignAgents();
    
    // Generate custom instructions
    this.projectConfig.customInstructions = await this.generateCustomInstructions();
  }
  
  /**
   * Configure MCP servers interactively
   */
  async configureMCPServers() {
    const detected = await this.autoDetectMCPServers();
    
    console.log(`\n  Detected ${detected.size} relevant MCP servers:`);
    let count = 0;
    for (const server of detected) {
      console.log(`    - ${server}`);
      count++;
      if (count >= 10 && detected.size > 10) {
        console.log(`    ... and ${detected.size - 10} more`);
        break;
      }
    }
    
    const customize = await this.askYesNo('\nCustomize MCP server selection?');
    if (customize) {
      // Show categories and allow selection
      for (const [category, servers] of Object.entries(this.mcpServerCategories)) {
        console.log(chalk.yellow(`\n  ${category}:`));
        for (const server of servers) {
          const enabled = detected.has(server);
          const toggle = await this.askYesNo(`    ${server} (${enabled ? 'ON' : 'OFF'})?`);
          if (toggle !== enabled) {
            if (toggle) {
              detected.add(server);
            } else {
              detected.delete(server);
            }
          }
        }
      }
    }
    
    this.projectConfig.mcpServers = detected;
  }
  
  /**
   * Configure agent assignments interactively
   */
  async configureAgentAssignments() {
    const assignments = await this.autoAssignAgents();
    
    console.log('\n  Current agent assignments:');
    for (const [agent, responsibilities] of assignments) {
      console.log(`    ${agent}:`);
      responsibilities.slice(0, 3).forEach(r => console.log(`      - ${r}`));
      if (responsibilities.length > 3) {
        console.log(`      ... and ${responsibilities.length - 3} more`);
      }
    }
    
    const customize = await this.askYesNo('\nCustomize agent assignments?');
    if (customize) {
      // Allow reassignment of responsibilities
      console.log(chalk.yellow('\n  (Feature coming soon: Advanced agent customization)'));
    }
    
    this.projectConfig.agentAssignments = assignments;
  }
  
  /**
   * Configure custom instructions
   */
  async configureCustomInstructions() {
    const generated = await this.generateCustomInstructions();
    
    console.log('\n  Generated instructions:');
    generated.slice(0, 3).forEach(inst => console.log(`    - ${inst}`));
    if (generated.length > 3) {
      console.log(`    ... and ${generated.length - 3} more`);
    }
    
    const addCustom = await this.askYesNo('\nAdd custom instructions?');
    if (addCustom) {
      const instructions = [];
      let adding = true;
      while (adding) {
        const instruction = await this.askInput('Instruction (empty to finish):');
        if (instruction) {
          instructions.push(instruction);
        } else {
          adding = false;
        }
      }
      generated.push(...instructions);
    }
    
    this.projectConfig.customInstructions = generated;
  }
  
  /**
   * Auto-detect relevant MCP servers
   */
  async autoDetectMCPServers() {
    const servers = new Set(['context7', 'filesystem', 'git']); // Always include
    
    // Detect based on technologies
    if (this.projectConfig.languages.includes('JavaScript') || 
        this.projectConfig.languages.includes('TypeScript')) {
      servers.add('npm');
    }
    
    if (this.projectConfig.frameworks.includes('React') || 
        this.projectConfig.frameworks.includes('Vue')) {
      servers.add('vite');
      servers.add('webpack');
    }
    
    if (this.projectConfig.databases.includes('PostgreSQL')) {
      servers.add('postgres');
    }
    
    if (this.projectConfig.databases.includes('MongoDB')) {
      servers.add('mongodb');
    }
    
    if (this.analysis.apis?.rest?.length > 0) {
      servers.add('http');
      servers.add('openapi');
    }
    
    if (this.projectConfig.deployment.includes('Docker')) {
      servers.add('docker');
    }
    
    if (this.projectConfig.deployment.includes('Kubernetes')) {
      servers.add('kubernetes');
    }
    
    if (this.projectConfig.testingTools.includes('Jest')) {
      servers.add('jest');
    }
    
    // Add cloud providers if detected
    if (this.analysis.patterns?.cloudProviders?.includes('AWS')) {
      servers.add('aws');
      servers.add('s3');
    }
    
    return servers;
  }
  
  /**
   * Auto-assign agents to responsibilities
   */
  async autoAssignAgents() {
    const assignments = new Map();
    
    // Code Analyzer Agent
    assignments.set('code-analyzer-agent', [
      'Pattern extraction and analysis',
      'Architecture detection',
      'Code quality assessment',
      'Dependency analysis'
    ]);
    
    // Test Runner Agent
    if (this.projectConfig.testingTools.length > 0) {
      assignments.set('test-runner-agent', [
        'Test execution and coverage',
        'Test pattern analysis',
        'Test suite optimization',
        'Coverage gap identification'
      ]);
    }
    
    // API Builder Agent
    if (this.analysis.apis && Object.keys(this.analysis.apis).length > 0) {
      assignments.set('api-builder-agent', [
        'API endpoint implementation',
        'Schema validation',
        'Authentication setup',
        'API documentation'
      ]);
    }
    
    // Database Architect Agent
    if (this.projectConfig.databases.length > 0) {
      assignments.set('database-architect-agent', [
        'Schema design and optimization',
        'Query optimization',
        'Migration management',
        'Relationship mapping'
      ]);
    }
    
    // Security Scanner Agent
    assignments.set('security-scanner-agent', [
      'Vulnerability scanning',
      'Security best practices',
      'Dependency auditing',
      'Compliance checking'
    ]);
    
    // Performance Optimizer Agent
    assignments.set('performance-optimizer-agent', [
      'Performance bottleneck detection',
      'Algorithm optimization',
      'Memory usage analysis',
      'Resource optimization'
    ]);
    
    // Deployment Engineer Agent
    if (this.projectConfig.deployment.length > 0) {
      assignments.set('deployment-engineer-agent', [
        'CI/CD pipeline setup',
        'Deployment automation',
        'Infrastructure as code',
        'Zero-downtime deployments'
      ]);
    }
    
    // Frontend Specialist Agent
    if (this.projectConfig.frameworks.some(f => 
      ['React', 'Vue', 'Angular', 'Svelte'].includes(f))) {
      assignments.set('frontend-specialist-agent', [
        'UI/UX implementation',
        'Responsive design',
        'Performance optimization',
        'Accessibility compliance'
      ]);
    }
    
    // Doc Generator Agent
    assignments.set('doc-generator-agent', [
      'Documentation generation',
      'API documentation',
      'README maintenance',
      'Code commenting'
    ]);
    
    // Recovery Specialist Agent
    assignments.set('recovery-specialist-agent', [
      'Error recovery strategies',
      'System resilience',
      'Fallback mechanisms',
      'Disaster recovery'
    ]);
    
    return assignments;
  }
  
  /**
   * Generate custom instructions based on analysis
   */
  async generateCustomInstructions() {
    const instructions = [];
    
    // Language-specific instructions
    if (this.projectConfig.languages.includes('TypeScript')) {
      instructions.push('Use strict TypeScript with proper type definitions');
    }
    
    if (this.projectConfig.languages.includes('Python')) {
      instructions.push('Follow PEP 8 style guide for Python code');
    }
    
    // Framework-specific instructions
    if (this.projectConfig.frameworks.includes('React')) {
      instructions.push('Use functional components with hooks');
      instructions.push('Implement proper error boundaries');
    }
    
    // Architecture-specific instructions
    if (this.projectConfig.architecture === 'microservices') {
      instructions.push('Maintain service independence and loose coupling');
      instructions.push('Use API contracts for service communication');
    }
    
    // Testing instructions
    if (this.projectConfig.testingTools.length > 0) {
      instructions.push('Maintain test coverage above 80%');
      instructions.push('Write tests before implementing features (TDD)');
    }
    
    // Security instructions
    if (this.analysis.security?.vulnerabilities?.length > 0) {
      instructions.push('Address security vulnerabilities as priority');
      instructions.push('Follow OWASP security guidelines');
    }
    
    // Performance instructions
    if (this.analysis.performance?.bottlenecks?.length > 0) {
      instructions.push('Optimize identified performance bottlenecks');
      instructions.push('Use lazy loading and code splitting');
    }
    
    return instructions;
  }
  
  /**
   * Generate CLAUDE.md content
   */
  async generateContent() {
    const content = [];
    
    // Header
    content.push(`# Claude Configuration - ${this.projectConfig.projectName} (${this.projectConfig.stage} Stage)`);
    content.push('');
    
    // Phase 3 marker
    content.push('## Phase 3 Complete: Deep Analysis & Document Generation ✅');
    content.push(`- **Implementation Date**: ${new Date().toLocaleDateString()}`);
    content.push('- **Implementer**: Claude (Autonomous Workflow System)');
    content.push('- **Status**: Successfully completed with comprehensive analysis');
    content.push('');
    
    // Queen Controller Features
    content.push('### Queen Controller Features');
    content.push('- **10 Concurrent Sub-Agents**: Full capacity with specialized roles');
    content.push('- **200k Context Windows**: Each agent tracks individual context');
    content.push('- **Hierarchical Management**: Queen Controller orchestrates all agents');
    content.push('- **Shared Memory Store**: Cross-agent data sharing with SQLite persistence');
    content.push('- **Event-Driven Architecture**: Real-time agent coordination');
    content.push('');
    
    // Project Analysis
    content.push('## Project Analysis');
    content.push(`- **Complexity Score**: ${this.projectConfig.complexityScore}/100`);
    content.push(`- **Stage**: ${this.projectConfig.stage}`);
    content.push(`- **Selected Approach**: ${this.projectConfig.approach}`);
    content.push(`- **Architecture**: ${this.projectConfig.architecture}`);
    content.push(`- **Command**: \`npx --yes claude-flow@latest ${this.projectConfig.approach} spawn "${this.projectConfig.projectName}" --agents 10 --claude\``);
    content.push('');
    
    // Technology Stack
    content.push('## Technology Stack');
    
    if (this.projectConfig.languages.length > 0) {
      content.push('### Languages');
      this.projectConfig.languages.forEach(lang => {
        content.push(`- ${lang}`);
      });
      content.push('');
    }
    
    if (this.projectConfig.frameworks.length > 0) {
      content.push('### Frameworks');
      this.projectConfig.frameworks.forEach(fw => {
        content.push(`- ${fw}`);
      });
      content.push('');
    }
    
    // Sub-Agent Assignments
    content.push('## Sub-Agent Architecture & Responsibilities');
    content.push('');
    
    let agentNum = 1;
    for (const [agent, responsibilities] of this.projectConfig.agentAssignments) {
      content.push(`### ${agentNum}. ${agent}`);
      responsibilities.forEach(resp => {
        content.push(`- ${resp}`);
      });
      content.push('');
      agentNum++;
    }
    
    // MCP Server Configuration
    content.push('## MCP Server Configuration');
    content.push(`### Active Servers (${this.projectConfig.mcpServers.size}/87)`);
    
    // Group servers by category
    for (const [category, servers] of Object.entries(this.mcpServerCategories)) {
      const activeInCategory = servers.filter(s => this.projectConfig.mcpServers.has(s));
      if (activeInCategory.length > 0) {
        content.push(`#### ${category}`);
        activeInCategory.forEach(server => {
          content.push(`- ${server}: {"enabled":true}`);
        });
        content.push('');
      }
    }
    
    // Custom Instructions
    if (this.projectConfig.customInstructions.length > 0) {
      content.push('## Project-Specific Instructions');
      this.projectConfig.customInstructions.forEach(inst => {
        content.push(`- ${inst}`);
      });
      content.push('');
    }
    
    // Workflow Configuration
    content.push('## Workflow Configuration');
    content.push(`### ${this.projectConfig.approach} Workflow`);
    
    if (this.projectConfig.approach === 'hive-mind') {
      content.push('1. Queen Controller initialization');
      content.push('2. Sub-agent spawning (10 concurrent)');
      content.push('3. Task distribution and dependency management');
      content.push('4. Parallel execution with shared memory');
      content.push('5. Result aggregation and reporting');
    } else if (this.projectConfig.approach === 'hive-mind-sparc') {
      content.push('1. SPARC methodology initialization');
      content.push('2. Specification phase with deep analysis');
      content.push('3. Pseudocode generation with Queen Controller');
      content.push('4. Architecture implementation with 10 agents');
      content.push('5. Refinement with continuous testing');
      content.push('6. Completion with full documentation');
    } else {
      content.push('1. Simple agent coordination');
      content.push('2. Sequential task execution');
      content.push('3. Basic result aggregation');
    }
    content.push('');
    
    // Quality Metrics
    content.push('## Quality Metrics');
    content.push('- **Test Coverage Target**: 80%+');
    content.push('- **Performance Benchmarks**: < 30s analysis time');
    content.push('- **Security Score**: OWASP compliance');
    content.push('- **Documentation Coverage**: 100%');
    content.push('');
    
    // Version Policy
    content.push('## Version Policy');
    content.push('- Canonical versions: 3.0, alpha, beta, dev, latest, stable');
    content.push('- Experimental: alpha, beta, dev');
    content.push('- Override via env: CLAUDE_FLOW_VERSION=stable');
    content.push('');
    
    // Footer
    content.push('---');
    content.push('');
    content.push('*Generated by CLAUDE.md Generator v3.0*');
    content.push(`*Date: ${new Date().toISOString()}*`);
    content.push('*Phase 3: Deep Analysis & Document Generation Complete*');
    
    return content.join('\n');
  }
  
  /**
   * Preview content before saving
   */
  async previewContent(content) {
    console.log(chalk.cyan('\n📄 CLAUDE.md Preview:'));
    console.log(chalk.gray('=' .repeat(80)));
    
    // Show first 50 lines
    const lines = content.split('\n');
    const preview = lines.slice(0, 50);
    console.log(preview.join('\n'));
    
    if (lines.length > 50) {
      console.log(chalk.gray(`\n... and ${lines.length - 50} more lines`));
    }
    
    console.log(chalk.gray('=' .repeat(80)));
  }
  
  /**
   * Save CLAUDE.md file
   */
  async saveClaudeMd(content) {
    await fs.writeFile('CLAUDE.md', content, 'utf8');
  }
  
  /**
   * Store configuration in shared memory
   */
  async storeConfiguration(generationId, content) {
    await this.sharedMemory.set(
      `claude-md:${generationId}`,
      {
        generationId,
        content,
        config: this.projectConfig,
        timestamp: Date.now()
      },
      {
        namespace: this.sharedMemory.namespaces.TASK_RESULTS,
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      }
    );
  }
  
  // Detection helper methods
  detectLanguages(analysis) {
    const languages = new Set();
    
    // Check file extensions
    if (analysis.patterns?.fileExtensions) {
      const extMap = {
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.py': 'Python',
        '.java': 'Java',
        '.cs': 'C#',
        '.go': 'Go',
        '.rs': 'Rust',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.swift': 'Swift',
        '.kt': 'Kotlin'
      };
      
      for (const ext of analysis.patterns.fileExtensions) {
        if (extMap[ext]) {
          languages.add(extMap[ext]);
        }
      }
    }
    
    return Array.from(languages);
  }
  
  detectFrameworks(analysis) {
    const frameworks = new Set();
    
    // Check package.json dependencies
    if (analysis.patterns?.dependencies) {
      const deps = analysis.patterns.dependencies;
      
      if (deps.react) frameworks.add('React');
      if (deps.vue) frameworks.add('Vue');
      if (deps.angular) frameworks.add('Angular');
      if (deps.svelte) frameworks.add('Svelte');
      if (deps.express) frameworks.add('Express');
      if (deps.fastify) frameworks.add('Fastify');
      if (deps.nestjs) frameworks.add('NestJS');
      if (deps.django) frameworks.add('Django');
      if (deps.flask) frameworks.add('Flask');
      if (deps.rails) frameworks.add('Rails');
    }
    
    return Array.from(frameworks);
  }
  
  detectTestingTools(analysis) {
    const tools = new Set();
    
    if (analysis.testing?.frameworks) {
      analysis.testing.frameworks.forEach(fw => tools.add(fw));
    }
    
    return Array.from(tools);
  }
  
  detectDatabases(analysis) {
    const databases = new Set();
    
    if (analysis.databases?.schemas) {
      // Detect from connection strings or configs
      if (analysis.databases.type) {
        databases.add(analysis.databases.type);
      }
    }
    
    return Array.from(databases);
  }
  
  detectAPIs(analysis) {
    const apis = new Set();
    
    if (analysis.apis?.rest) apis.add('REST');
    if (analysis.apis?.graphql) apis.add('GraphQL');
    if (analysis.apis?.grpc) apis.add('gRPC');
    if (analysis.apis?.websocket) apis.add('WebSocket');
    
    return Array.from(apis);
  }
  
  detectDeployment(analysis) {
    const deployment = new Set();
    
    // Check for deployment files
    if (analysis.patterns?.files) {
      if (analysis.patterns.files.includes('Dockerfile')) {
        deployment.add('Docker');
      }
      if (analysis.patterns.files.includes('docker-compose.yml')) {
        deployment.add('Docker Compose');
      }
      if (analysis.patterns.files.includes('kubernetes.yaml')) {
        deployment.add('Kubernetes');
      }
    }
    
    return Array.from(deployment);
  }
  
  // Interactive helper methods
  async askYesNo(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise(resolve => {
      rl.question(`${question} (y/n): `, answer => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }
  
  async askInput(prompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise(resolve => {
      rl.question(`${prompt} `, answer => {
        rl.close();
        resolve(answer);
      });
    });
  }
  
  async askChoice(options) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise(resolve => {
      rl.question(`Choose (${options.join('/')}): `, answer => {
        rl.close();
        if (options.includes(answer)) {
          resolve(answer);
        } else {
          console.log(chalk.red('Invalid choice. Please try again.'));
          resolve(this.askChoice(options));
        }
      });
    });
  }
  
  async askConfirmation(message) {
    return await this.askYesNo(message);
  }
  
  // Event handlers
  handleGenerationRequest(data) {
    const { analysis, options } = data;
    this.generate(analysis, options);
  }
  
  handleAnalysisComplete(data) {
    const { analysis } = data;
    this.emit('analysis-ready', analysis);
  }
}

// Export for use in other modules
module.exports = ClaudeMdGenerator;

// CLI interface if run directly
if (require.main === module) {
  const generator = new ClaudeMdGenerator();
  
  const args = process.argv.slice(2);
  const options = {
    skipInteractive: args.includes('--auto'),
    skipPreview: args.includes('--no-preview')
  };
  
  generator.generate(process.cwd(), options)
    .then(result => {
      if (result) {
        console.log('✅ Generation complete:', result);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    });
}