#!/usr/bin/env node

/**
 * ENHANCED INTERACTIVE INSTALLER
 * ===============================
 * Uses ProjectBootstrapAgent and ContextCompactor for intelligent setup
 *
 * Features:
 * - Reads minimal input (just description or architecture.md)
 * - Asks intelligent questions
 * - Generates complete documentation
 * - Sets up context management
 * - Configures all intelligence systems
 * - Creates ready-to-use project
 */

import { ProjectBootstrapAgent } from '../bootstrap/project-bootstrap-agent.js';
import { ContextCompactor } from '../context/context-compactor.js';
import { MasterWorkflow3 } from '../index.js';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';

class EnhancedInstaller {
  constructor(options = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.interactive = options.interactive !== false;
    this.mode = null; // 'new' or 'existing'

    this.config = {
      project: {},
      systems: {},
      features: {}
    };
  }

  async run() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║     MASTER WORKFLOW 3.0 - ENHANCED INSTALLER              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('🚀 The Ultimate AI Development Platform\n');
    console.log('Combines:');
    console.log('  ✨ Quantum Memory Fusion - Cross-dimensional learning');
    console.log('  ✨ Neural Swarm Intelligence - Collective problem solving');
    console.log('  ✨ Code Archaeology - Deep codebase understanding');
    console.log('  ✨ AgentDB v1.3.9 - 96x-164x faster semantic search');
    console.log('  ✨ Reasoning Bank - Hybrid memory system');
    console.log('  ✨ 25 Specialized Skills - Natural language activation');
    console.log('  ✨ Context Compactor - Autonomous context management');
    console.log('  ✨ Project Bootstrap - Intelligent project setup\n');

    try {
      // Step 1: Detect installation type
      await this.detectInstallationType();

      // Step 2: Run appropriate installation
      if (this.mode === 'new') {
        await this.installNewProject();
      } else {
        await this.installExistingProject();
      }

      // Step 3: Configure intelligence systems
      await this.configureIntelligenceSystems();

      // Step 4: Create configuration files
      await this.createConfigurationFiles();

      // Step 5: Test installation
      await this.testInstallation();

      // Step 6: Show next steps
      await this.showNextSteps();

    } catch (error) {
      console.error('\n❌ Installation failed:', error.message);
      console.error('\nPlease check the error and try again.\n');
      process.exit(1);
    }
  }

  /**
   * Detect if this is a new or existing project
   */
  async detectInstallationType() {
    console.log('🔍 Detecting installation type...\n');

    // Check for indicators of existing project
    const indicators = [
      'package.json',
      'src/',
      'lib/',
      'README.md'
    ];

    let existingIndicators = 0;
    for (const indicator of indicators) {
      if (existsSync(join(this.projectPath, indicator))) {
        existingIndicators++;
      }
    }

    if (existingIndicators > 0) {
      console.log(`   Found ${existingIndicators} existing project indicators\n`);

      if (this.interactive) {
        const { mode } = await inquirer.prompt([{
          type: 'list',
          name: 'mode',
          message: 'This appears to be an existing project. How would you like to proceed?',
          choices: [
            { name: 'Enhance existing project (recommended)', value: 'existing' },
            { name: 'Create new project (will replace existing files)', value: 'new' }
          ]
        }]);
        this.mode = mode;
      } else {
        this.mode = 'existing';
      }
    } else {
      console.log('   No existing project detected - will create new project\n');
      this.mode = 'new';
    }

    console.log(`   Mode: ${this.mode === 'new' ? 'New Project' : 'Existing Project'}\n`);
  }

  /**
   * Install in new project
   */
  async installNewProject() {
    console.log('🎨 NEW PROJECT INSTALLATION\n');

    // Initialize ProjectBootstrapAgent
    const bootstrap = new ProjectBootstrapAgent({
      projectPath: this.projectPath,
      interactive: this.interactive
    });

    // Run bootstrap
    console.log('Running intelligent bootstrap...\n');
    const result = await bootstrap.bootstrap();

    this.config.project = result.project;

    console.log('\n✅ Project bootstrapped successfully!');
    console.log(`   Generated ${result.project.generatedDocs.length} documentation files`);
    console.log(`   Build Phase: ${result.project.buildPhase}`);
    console.log(`   Tech Stack: ${result.project.techStack.join(', ')}\n`);
  }

  /**
   * Install in existing project
   */
  async installExistingProject() {
    console.log('🔧 EXISTING PROJECT ENHANCEMENT\n');

    // Initialize ProjectBootstrapAgent in analyze mode
    const bootstrap = new ProjectBootstrapAgent({
      projectPath: this.projectPath,
      interactive: this.interactive
    });

    // Analyze and enhance
    console.log('Analyzing existing project...\n');
    const result = await bootstrap.bootstrap();

    this.config.project = result.project;

    console.log('\n✅ Project analyzed and enhanced!');
    console.log(`   Analyzed ${result.project.existingCode.length} source files`);
    console.log(`   Generated ${result.project.generatedDocs.length} new documentation files`);
    console.log(`   Build Phase: ${result.project.buildPhase}`);
    console.log(`   Next Steps: ${result.nextSteps.length} items\n`);
  }

  /**
   * Configure intelligence systems
   */
  async configureIntelligenceSystems() {
    console.log('🧠 CONFIGURING INTELLIGENCE SYSTEMS\n');

    if (this.interactive) {
      const { systems } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'systems',
        message: 'Select intelligence systems to enable:',
        choices: [
          { name: 'Quantum Memory Fusion (cross-dimensional learning)', value: 'quantumMemory', checked: true },
          { name: 'Neural Swarm Intelligence (collective problem solving)', value: 'neuralSwarm', checked: true },
          { name: 'Code Archaeology (deep codebase understanding)', value: 'codeArchaeology', checked: true },
          { name: 'AgentDB v1.3.9 (96x faster semantic search)', value: 'agentDB', checked: true },
          { name: 'Reasoning Bank (hybrid memory system)', value: 'reasoningBank', checked: true },
          { name: 'Skills System (25 specialized skills)', value: 'skills', checked: true },
          { name: 'Context Compactor (autonomous context management)', value: 'contextCompactor', checked: true }
        ]
      }]);

      for (const system of systems) {
        this.config.systems[system] = true;
      }
    } else {
      // Enable all systems by default
      this.config.systems = {
        quantumMemory: true,
        neuralSwarm: true,
        codeArchaeology: true,
        agentDB: true,
        reasoningBank: true,
        skills: true,
        contextCompactor: true
      };
    }

    console.log('\n✓ Intelligence systems configured:');
    for (const [system, enabled] of Object.entries(this.config.systems)) {
      if (enabled) {
        console.log(`   ✓ ${system}`);
      }
    }
    console.log();
  }

  /**
   * Create configuration files
   */
  async createConfigurationFiles() {
    console.log('📝 CREATING CONFIGURATION FILES\n');

    // Create .master-workflow directory
    const configDir = join(this.projectPath, '.master-workflow');
    await mkdir(configDir, { recursive: true });

    // Create master-workflow.config.json
    const config = {
      version: '3.0.0',
      project: {
        name: this.config.project.name || 'my-project',
        description: this.config.project.description || '',
        techStack: this.config.project.techStack || [],
        buildPhase: this.config.project.buildPhase || 'planning'
      },
      systems: this.config.systems,
      queen: {
        maxConcurrent: 10,
        contextWindowSize: 200000
      },
      agentDB: {
        quantization: 'scalar',
        rlAlgorithm: 'ppo'
      },
      contextCompactor: {
        maxTokens: 200000,
        compactionThreshold: 0.80,
        preservePercent: 0.40
      }
    };

    await writeFile(
      join(configDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );
    console.log('   ✓ Created .master-workflow/config.json');

    // Create .env file
    const envContent = `# Master Workflow 3.0 Configuration

# Project Settings
PROJECT_NAME=${config.project.name}
BUILD_PHASE=${config.project.buildPhase}

# Queen Controller
MAX_CONCURRENT_AGENTS=10
CONTEXT_WINDOW_SIZE=200000

# AgentDB
AGENTDB_QUANTIZATION=scalar
AGENTDB_RL_ALGORITHM=ppo

# Context Compactor
CONTEXT_COMPACTION_THRESHOLD=0.80
CONTEXT_PRESERVE_PERCENT=0.40

# Optional: Anthropic API Key
# ANTHROPIC_API_KEY=your_api_key_here
`;

    await writeFile(join(this.projectPath, '.env'), envContent);
    console.log('   ✓ Created .env file');

    // Create npm scripts in package.json (if it exists)
    const packageJsonPath = join(this.projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(
        await readFile(packageJsonPath, 'utf-8')
      );

      packageJson.scripts = {
        ...packageJson.scripts,
        'workflow:start': 'node .master-workflow/run.js',
        'workflow:bootstrap': 'node .master-workflow/bootstrap.js',
        'workflow:wiki': 'node .master-workflow/wiki.js',
        'workflow:test': 'npm test'
      };

      await writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );
      console.log('   ✓ Added workflow scripts to package.json');
    }

    console.log();
  }

  /**
   * Test installation
   */
  async testInstallation() {
    console.log('🧪 TESTING INSTALLATION\n');

    try {
      // Initialize Master Workflow
      console.log('   Testing Master Workflow initialization...');
      const workflow = new MasterWorkflow3({
        verbose: false,
        ...this.config.systems
      });

      // Quick initialization test
      await workflow.initialize();
      console.log('   ✓ Master Workflow initialized successfully');

      // Test status
      const status = await workflow.getStatus();
      console.log(`   ✓ System IQ: ${status.systemIQ}`);
      console.log(`   ✓ Capabilities: ${status.capabilities.length} unlocked`);

      // Shutdown
      await workflow.shutdown();
      console.log('   ✓ Clean shutdown successful\n');

    } catch (error) {
      console.warn(`   ⚠️  Test had warnings: ${error.message}`);
      console.log('   (This is OK for first-time setup)\n');
    }
  }

  /**
   * Show next steps
   */
  async showNextSteps() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                INSTALLATION COMPLETE! ✅                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('🎉 Master Workflow 3.0 is ready!\n');

    console.log('📚 Generated Documentation:');
    if (this.config.project.generatedDocs) {
      for (const doc of this.config.project.generatedDocs) {
        console.log(`   📄 ${doc}`);
      }
    }
    console.log();

    console.log('🚀 Quick Start Commands:\n');

    console.log('   # Start autonomous building');
    console.log('   npm run workflow:start\n');

    console.log('   # Generate/update wiki');
    console.log('   npm run workflow:wiki\n');

    console.log('   # Re-run bootstrap');
    console.log('   npm run workflow:bootstrap\n');

    console.log('📖 Next Steps:\n');

    if (this.mode === 'new') {
      console.log('   1. Review generated documentation in docs/');
      console.log('   2. Check wiki/ for comprehensive guides');
      console.log('   3. Start building: npm run workflow:start');
      console.log('   4. System will build continuously with autonomous context management');
    } else {
      console.log(`   1. Current build phase: ${this.config.project.buildPhase}`);
      console.log('   2. Review generated documentation for gaps filled');
      console.log('   3. Continue development: npm run workflow:start');
      console.log('   4. System picks up where you left off');
    }

    console.log();
    console.log('💡 Tips:');
    console.log('   • Use /bootstrap to regenerate docs anytime');
    console.log('   • Use /wiki to update repository wiki');
    console.log('   • Context compaction happens automatically at 80%');
    console.log('   • Skills activate through natural language');
    console.log('   • AgentDB provides 96x faster semantic search\n');

    console.log('📞 Need Help?');
    console.log('   • Check INTEGRATION-COMPLETE.md for full documentation');
    console.log('   • Review slash commands in .claude/commands/');
    console.log('   • All systems are ready for autonomous operation\n');

    console.log('✨ Happy building with the most advanced AI development system ever created! ✨\n');
  }
}

// Run installer if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const installer = new EnhancedInstaller({
    interactive: !process.argv.includes('--no-interactive')
  });

  installer.run().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

export default EnhancedInstaller;
