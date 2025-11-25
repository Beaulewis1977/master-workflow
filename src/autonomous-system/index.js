/**
 * Autonomous Documentation & Spec-Driven Development System
 * ==========================================================
 * Main entry point that orchestrates all autonomous system components.
 */

import { EventEmitter } from 'events';
import { ProjectAnalyzer } from './project-analyzer.js';
import { DocumentationGenerator } from './documentation-generator.js';
import { SpecificationEngine } from './specification-engine.js';
import { ImplementationPlanner } from './implementation-planner.js';
import { ProgressTracker } from './progress-tracker.js';
import { QualityValidator } from './quality-validator.js';
import { LoopSelector } from './loop-selector.js';
import { BuildLoopOrchestrator } from './build-loop-orchestrator.js';
import {
  PlanningLoopExecutor,
  SpecDrivenLoopExecutor,
  TDDLoopExecutor,
  LegacyRescueLoopExecutor,
  PolishLoopExecutor
} from './loop-executors.js';

export class AutonomousSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      projectPath: options.projectPath || process.cwd(),
      outputDir: options.outputDir || './output',
      mode: options.mode || 'autonomous', // autonomous, interactive
      verbose: options.verbose || false,
      ...options
    };

    this.analyzer = null;
    this.docGenerator = null;
    this.specEngine = null;
    this.planner = null;
    this.tracker = null;
    this.validator = null;
    
    // Build Loop System
    this.loopSelector = null;
    this.loopOrchestrator = null;

    this.analysis = null;
    this.results = {
      analysis: null,
      documents: [],
      specifications: [],
      plans: [],
      quality: null,
      loop: null
    };
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  async initialize() {
    this.log('🚀 Initializing Autonomous System...');
    this.emit('system:initializing');

    // Initialize analyzer first
    this.analyzer = new ProjectAnalyzer(this.options.projectPath, {
      verbose: this.options.verbose
    });

    this.emit('system:initialized');
    this.log('✅ Autonomous System initialized');
  }

  async runCompletePipeline() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🤖 Autonomous Documentation & Spec-Driven System 🤖      ║
║                                                              ║
║     Running Complete Pipeline                                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    const startTime = Date.now();
    this.emit('pipeline:start');

    try {
      // Step 1: Analyze Project
      console.log('\n📊 Step 1/6: Analyzing Project...');
      this.analysis = await this.analyzer.analyzeProject();
      this.results.analysis = this.analysis;
      this.emit('pipeline:step', { step: 1, name: 'analysis', complete: true });

      // Step 2: Generate Documentation
      console.log('\n📚 Step 2/6: Generating Documentation...');
      this.docGenerator = new DocumentationGenerator(this.analysis, {
        outputDir: `${this.options.outputDir}/docs`,
        verbose: this.options.verbose
      });
      const docs = await this.docGenerator.generateAllDocumentation();
      await this.docGenerator.saveDocumentation();
      this.results.documents = Array.from(docs.keys());
      this.emit('pipeline:step', { step: 2, name: 'documentation', complete: true });

      // Step 3: Generate Specifications
      console.log('\n📋 Step 3/6: Generating Specifications...');
      this.specEngine = new SpecificationEngine(this.analysis, {
        outputDir: `${this.options.outputDir}/specs`,
        verbose: this.options.verbose
      });
      const specs = await this.specEngine.generateAllSpecifications();
      await this.specEngine.saveSpecifications();
      this.results.specifications = Array.from(specs.keys());
      this.emit('pipeline:step', { step: 3, name: 'specifications', complete: true });

      // Step 4: Generate Implementation Plans
      console.log('\n📅 Step 4/6: Generating Implementation Plans...');
      this.planner = new ImplementationPlanner(this.analysis, {
        outputDir: `${this.options.outputDir}/plans`,
        verbose: this.options.verbose
      });
      const plans = await this.planner.generateAllPlans();
      await this.planner.savePlans();
      this.results.plans = Array.from(plans.keys());
      this.emit('pipeline:step', { step: 4, name: 'planning', complete: true });

      // Step 5: Validate Quality
      console.log('\n🔍 Step 5/6: Validating Quality...');
      this.validator = new QualityValidator(this.analysis, {
        outputDir: `${this.options.outputDir}/quality`,
        verbose: this.options.verbose
      });
      const quality = await this.validator.validateAll();
      await this.validator.saveReport();
      this.results.quality = quality;
      this.emit('pipeline:step', { step: 5, name: 'validation', complete: true });

      // Step 6: Initialize Progress Tracker
      console.log('\n📈 Step 6/6: Setting Up Progress Tracking...');
      this.tracker = new ProgressTracker(null, {
        outputDir: `${this.options.outputDir}/progress`,
        verbose: this.options.verbose
      });
      await this.tracker.start();
      await this.tracker.save();
      this.emit('pipeline:step', { step: 6, name: 'tracking', complete: true });

      const duration = Date.now() - startTime;

      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                  ✅ PIPELINE COMPLETE! ✅                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

📊 Results Summary:
   • Analysis: ${Object.keys(this.analysis.components || {}).length} components found
   • Documentation: ${this.results.documents.length} files generated
   • Specifications: ${this.results.specifications.length} specs created
   • Plans: ${this.results.plans.length} plans generated
   • Quality Score: ${this.results.quality?.overall?.grade || 'N/A'} (${this.results.quality?.overall?.score || 0}%)

⏱️  Total Duration: ${duration}ms

📁 Output Directory: ${this.options.outputDir}
      `);

      this.emit('pipeline:complete', { duration, results: this.results });
      return this.results;

    } catch (error) {
      console.error('\n❌ Pipeline failed:', error.message);
      this.emit('pipeline:error', error);
      throw error;
    }
  }

  async analyzeOnly() {
    if (!this.analyzer) await this.initialize();
    this.analysis = await this.analyzer.analyzeProject();
    return this.analysis;
  }

  async generateDocs() {
    if (!this.analysis) await this.analyzeOnly();
    this.docGenerator = new DocumentationGenerator(this.analysis, {
      outputDir: `${this.options.outputDir}/docs`,
      verbose: this.options.verbose
    });
    const docs = await this.docGenerator.generateAllDocumentation();
    await this.docGenerator.saveDocumentation();
    return docs;
  }

  async generateSpecs() {
    if (!this.analysis) await this.analyzeOnly();
    this.specEngine = new SpecificationEngine(this.analysis, {
      outputDir: `${this.options.outputDir}/specs`,
      verbose: this.options.verbose
    });
    const specs = await this.specEngine.generateAllSpecifications();
    await this.specEngine.saveSpecifications();
    return specs;
  }

  async generatePlans() {
    if (!this.analysis) await this.analyzeOnly();
    this.planner = new ImplementationPlanner(this.analysis, {
      outputDir: `${this.options.outputDir}/plans`,
      verbose: this.options.verbose
    });
    const plans = await this.planner.generateAllPlans();
    await this.planner.savePlans();
    return plans;
  }

  async validateQuality() {
    if (!this.analysis) await this.analyzeOnly();
    this.validator = new QualityValidator(this.analysis, {
      outputDir: `${this.options.outputDir}/quality`,
      verbose: this.options.verbose
    });
    const quality = await this.validator.validateAll();
    await this.validator.saveReport();
    return quality;
  }

  getStatus() {
    return {
      initialized: !!this.analyzer,
      analyzed: !!this.analysis,
      results: this.results,
      options: this.options,
      loopStatus: this.loopOrchestrator?.getStatus() || null
    };
  }

  // ============================================
  // Build Loop System Methods
  // ============================================

  /**
   * Initialize the build loop system
   */
  async initializeLoopSystem() {
    this.log('🔄 Initializing Build Loop System...');
    
    this.loopSelector = new LoopSelector({ verbose: this.options.verbose });
    await this.loopSelector.loadProfiles();
    
    this.loopOrchestrator = new BuildLoopOrchestrator({
      projectPath: this.options.projectPath,
      outputDir: this.options.outputDir,
      verbose: this.options.verbose
    });

    // Register all loop executors
    this.loopOrchestrator.registerExecutor('planning', new PlanningLoopExecutor({
      outputDir: this.options.outputDir,
      verbose: this.options.verbose
    }));
    this.loopOrchestrator.registerExecutor('spec-driven', new SpecDrivenLoopExecutor({
      outputDir: this.options.outputDir,
      verbose: this.options.verbose
    }));
    this.loopOrchestrator.registerExecutor('tdd', new TDDLoopExecutor({
      outputDir: this.options.outputDir,
      verbose: this.options.verbose
    }));
    this.loopOrchestrator.registerExecutor('legacy-rescue', new LegacyRescueLoopExecutor({
      outputDir: this.options.outputDir,
      verbose: this.options.verbose
    }));
    this.loopOrchestrator.registerExecutor('polish', new PolishLoopExecutor({
      outputDir: this.options.outputDir,
      verbose: this.options.verbose
    }));

    this.log('✅ Build Loop System initialized');
  }

  /**
   * Select the best loop profile for the current project
   */
  async selectLoop(options = {}) {
    if (!this.analysis) await this.analyzeOnly();
    if (!this.loopSelector) await this.initializeLoopSystem();
    
    const selection = await this.loopSelector.selectLoop(this.analysis, options);
    return selection;
  }

  /**
   * Run a build loop (auto-selects profile if not specified)
   */
  async runLoop(options = {}) {
    if (!this.analysis) await this.analyzeOnly();
    if (!this.loopOrchestrator) await this.initializeLoopSystem();
    
    const result = await this.loopOrchestrator.runLoop(this.analysis, options);
    this.results.loop = result;
    return result;
  }

  /**
   * Get available loop profiles
   */
  async getAvailableLoops() {
    if (!this.loopSelector) await this.initializeLoopSystem();
    return this.loopSelector.getAvailableProfiles();
  }

  /**
   * Shutdown the autonomous system and clean up resources
   */
  async shutdown() {
    this.log('🛑 Shutting down Autonomous System...');
    this.emit('system:shutting-down');

    // Stop progress tracker auto-save timer
    if (this.tracker && typeof this.tracker.stop === 'function') {
      try {
        await this.tracker.stop();
      } catch (error) {
        this.log(`Warning: tracker stop failed: ${error.message}`);
      }
    }

    // Stop loop orchestrator if running
    if (this.loopOrchestrator && typeof this.loopOrchestrator.stop === 'function') {
      try {
        await this.loopOrchestrator.stop();
      } catch (error) {
        this.log(`Warning: loop orchestrator stop failed: ${error.message}`);
      }
    }

    // Clear references
    this.analyzer = null;
    this.docGenerator = null;
    this.specEngine = null;
    this.planner = null;
    this.tracker = null;
    this.validator = null;
    this.loopSelector = null;
    this.loopOrchestrator = null;

    this.emit('system:shutdown');
    this.log('✅ Autonomous System shutdown complete');
    return true;
  }
}

// Export all components
export { ProjectAnalyzer } from './project-analyzer.js';
export { DocumentationGenerator } from './documentation-generator.js';
export { SpecificationEngine } from './specification-engine.js';
export { ImplementationPlanner } from './implementation-planner.js';
export { ProgressTracker } from './progress-tracker.js';
export { QualityValidator } from './quality-validator.js';

// Export Code Generation and Testing
export { CodeGenerator } from './code-generator.js';
export { TestRunner } from './test-runner.js';

// Export Build Loop System
export { LoopSelector } from './loop-selector.js';
export { BuildLoopOrchestrator } from './build-loop-orchestrator.js';
export {
  PlanningLoopExecutor,
  SpecDrivenLoopExecutor,
  TDDLoopExecutor,
  LegacyRescueLoopExecutor,
  PolishLoopExecutor
} from './loop-executors.js';

export default AutonomousSystem;
