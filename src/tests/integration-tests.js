#!/usr/bin/env node
/**
 * Master Workflow 3.0 - Integration Tests
 * ========================================
 * Phase 4: Tests integration between Phase 1, 2, and 3 components.
 * 
 * Test Coverage:
 * - Phase 1 → Phase 2: Analysis feeds loop selection
 * - Phase 2 → Phase 3: Loops use engines
 * - Full pipeline: analyze → select loop → run with engines
 * - Cross-component event propagation
 */

import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';

// Phase 1 imports
import { AutonomousSystem } from '../autonomous-system/index.js';
import { ProjectAnalyzer } from '../autonomous-system/project-analyzer.js';
import { LoopSelector } from '../autonomous-system/loop-selector.js';
import { BuildLoopOrchestrator } from '../autonomous-system/build-loop-orchestrator.js';

// Phase 3 imports
import { EngineManager } from '../engines/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

class IntegrationTestSuite extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      projectPath: options.projectPath || PROJECT_ROOT,
      verbose: options.verbose || false,
      outputDir: options.outputDir || path.join(PROJECT_ROOT, 'test-output', 'integration')
    };
    
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  async runTest(name, testFn) {
    const startTime = Date.now();
    console.log(`\n  🧪 ${name}...`);
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`     ✅ PASSED (${duration}ms)`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed', duration });
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`     ❌ FAILED: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', duration, error: error.message });
      return false;
    }
  }

  async runAll() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🔗 Integration Test Suite - Phase 4 🔗                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    const startTime = Date.now();

    // Test Group 1: Phase 1 → Phase 2 Integration
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Group 1: Phase 1 → Phase 2 Integration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await this.runTest('Analysis feeds loop selection', async () => {
      await this.testAnalysisFeedsLoopSelection();
    });

    await this.runTest('Loop selector uses analysis characteristics', async () => {
      await this.testLoopSelectorUsesCharacteristics();
    });

    await this.runTest('Build orchestrator receives analysis context', async () => {
      await this.testOrchestratorReceivesAnalysis();
    });

    // Test Group 2: Phase 2 → Phase 3 Integration
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 Test Group 2: Phase 2 → Phase 3 Integration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.runTest('Engines initialize for loop execution', async () => {
      await this.testEnginesInitializeForLoop();
    });

    await this.runTest('Pattern discovery integrates with analysis', async () => {
      await this.testPatternDiscoveryIntegration();
    });

    await this.runTest('Predictive analytics uses loop context', async () => {
      await this.testPredictiveAnalyticsIntegration();
    });

    // Test Group 3: Full Pipeline Integration
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Test Group 3: Full Pipeline Integration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.runTest('Full pipeline: analyze → select → engines', async () => {
      await this.testFullPipeline();
    });

    await this.runTest('Engine optimization enhances loop execution', async () => {
      await this.testEngineOptimizationInLoop();
    });

    await this.runTest('Combined analysis and optimization workflow', async () => {
      await this.testCombinedWorkflow();
    });

    // Test Group 4: Event Propagation
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 Test Group 4: Cross-Component Event Propagation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.runTest('Events propagate from analyzer to system', async () => {
      await this.testAnalyzerEventPropagation();
    });

    await this.runTest('Loop events trigger engine updates', async () => {
      await this.testLoopEngineEventPropagation();
    });

    await this.runTest('Engine events bubble to orchestrator', async () => {
      await this.testEngineOrchestratorEventPropagation();
    });

    // Test Group 5: Error Handling Integration
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Test Group 5: Error Handling Integration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.runTest('Graceful degradation when engine unavailable', async () => {
      await this.testGracefulDegradation();
    });

    await this.runTest('Error recovery in loop execution', async () => {
      await this.testErrorRecoveryInLoop();
    });

    // Print summary
    const totalDuration = Date.now() - startTime;
    this.printSummary(totalDuration);

    return this.results;
  }

  // ============================================
  // Test Group 1: Phase 1 → Phase 2 Integration
  // ============================================

  async testAnalysisFeedsLoopSelection() {
    const analyzer = new ProjectAnalyzer(this.options.projectPath, { verbose: false });
    const analysis = await analyzer.analyzeProject();
    
    const selector = new LoopSelector({ verbose: false });
    await selector.loadProfiles();
    
    const selection = await selector.selectLoop(analysis);
    
    // Verify selection is based on analysis
    if (!selection.profile) throw new Error('No profile selected');
    if (!selection.characteristics) throw new Error('No characteristics in selection');
    if (typeof selection.confidence !== 'number') throw new Error('No confidence score');
    
    // Verify characteristics come from analysis
    const chars = selection.characteristics;
    if (typeof chars.complexityScore !== 'number') throw new Error('Missing complexity score');
    if (!chars.stage) throw new Error('Missing project stage');
    if (typeof chars.fileCount !== 'number') throw new Error('Missing file count');
  }

  async testLoopSelectorUsesCharacteristics() {
    const selector = new LoopSelector({ verbose: false });
    await selector.loadProfiles();
    
    // Test with different analysis profiles
    const earlyStageAnalysis = {
      structure: { totalFiles: 5, depth: 2 },
      components: {},
      metrics: { quality: { testCoverage: 0 } },
      documentation: {},
      patterns: {}
    };
    
    const matureAnalysis = {
      structure: { totalFiles: 200, depth: 8 },
      components: Array(100).fill(null).reduce((acc, _, i) => ({ ...acc, [`comp${i}`]: {} }), {}),
      metrics: { quality: { testCoverage: 80 } },
      documentation: { 'README.md': {}, 'ARCHITECTURE.md': {} },
      patterns: { architectural: ['MVC'] }
    };
    
    const earlySelection = await selector.selectLoop(earlyStageAnalysis);
    const matureSelection = await selector.selectLoop(matureAnalysis);
    
    // Early stage should recommend planning
    if (earlySelection.profile !== 'planning') {
      throw new Error(`Expected 'planning' for early stage, got '${earlySelection.profile}'`);
    }
    
    // Mature should recommend polish or tdd
    if (!['polish', 'tdd'].includes(matureSelection.profile)) {
      throw new Error(`Expected 'polish' or 'tdd' for mature, got '${matureSelection.profile}'`);
    }
  }

  async testOrchestratorReceivesAnalysis() {
    const analyzer = new ProjectAnalyzer(this.options.projectPath, { verbose: false });
    const analysis = await analyzer.analyzeProject();
    
    const orchestrator = new BuildLoopOrchestrator({
      projectPath: this.options.projectPath,
      outputDir: this.options.outputDir,
      verbose: false,
      dryRun: true
    });
    
    // Register a mock executor to capture analysis
    let receivedAnalysis = null;
    orchestrator.registerExecutor('legacy-rescue', {
      execute: async (selection, analysis) => {
        receivedAnalysis = analysis;
        return { profile: 'legacy-rescue', iterations: [], success: true, exitReason: 'test' };
      }
    });
    
    await orchestrator.runLoop(analysis, { profile: 'legacy-rescue' });
    
    if (!receivedAnalysis) throw new Error('Executor did not receive analysis');
    if (!receivedAnalysis.structure) throw new Error('Analysis missing structure');
  }

  // ============================================
  // Test Group 2: Phase 2 → Phase 3 Integration
  // ============================================

  async testEnginesInitializeForLoop() {
    const engines = new EngineManager({ verbose: false });
    await engines.initialize();
    
    // Verify all engines are available
    const status = engines.getStatus();
    if (!status.initialized) throw new Error('Engine manager not initialized');
    
    const requiredEngines = ['gpu', 'prediction', 'tuner', 'swarm', 'patterns'];
    for (const engine of requiredEngines) {
      if (!status.engines[engine]) throw new Error(`Engine '${engine}' not available`);
    }
    
    await engines.shutdown();
  }

  async testPatternDiscoveryIntegration() {
    const engines = new EngineManager({ verbose: false });
    await engines.initialize();
    
    // Run pattern discovery on engines directory
    const patterns = await engines.analyzePatterns(path.join(this.options.projectPath, 'src/engines'));
    
    if (!patterns.metrics) throw new Error('No metrics in pattern analysis');
    if (typeof patterns.metrics.filesAnalyzed !== 'number') throw new Error('Missing files analyzed count');
    if (!patterns.summary) throw new Error('No summary in pattern analysis');
    
    await engines.shutdown();
  }

  async testPredictiveAnalyticsIntegration() {
    const engines = new EngineManager({ verbose: false });
    await engines.initialize();
    
    // Record sample task data
    for (let i = 0; i < 10; i++) {
      engines.prediction.recordTask({
        complexity: Math.random() * 5,
        dependencies: Math.floor(Math.random() * 10),
        priority: Math.floor(Math.random() * 3) + 1,
        type: 'cpu',
        size: Math.random() * 100,
        duration: 100 + Math.random() * 500,
        failed: false
      });
    }
    
    // Make predictions
    const task = { complexity: 3, dependencies: 5, priority: 2, type: 'cpu', size: 50 };
    const duration = await engines.predict('duration', task);
    const failure = await engines.predict('failure', task);
    
    if (typeof duration.predicted !== 'number') throw new Error('Invalid duration prediction');
    if (typeof failure.probability !== 'number') throw new Error('Invalid failure prediction');
    
    await engines.shutdown();
  }

  // ============================================
  // Test Group 3: Full Pipeline Integration
  // ============================================

  async testFullPipeline() {
    // Initialize all systems
    const system = new AutonomousSystem({
      projectPath: this.options.projectPath,
      outputDir: this.options.outputDir,
      verbose: false
    });
    await system.initialize();
    
    const engines = new EngineManager({ verbose: false });
    await engines.initialize();
    
    // Step 1: Analyze
    const analysis = await system.analyzeOnly();
    if (!analysis) throw new Error('Analysis failed');
    
    // Step 2: Select loop based on analysis
    const selection = await system.selectLoop();
    if (!selection.profile) throw new Error('Loop selection failed');
    
    // Step 3: Use engines for optimization
    const patternAnalysis = await engines.analyzePatterns(
      path.join(this.options.projectPath, 'src/engines')
    );
    if (!patternAnalysis) throw new Error('Pattern analysis failed');
    
    // Cleanup resources
    await engines.shutdown();
    if (typeof system.shutdown === 'function') {
      await system.shutdown();
    }
  }

  async testEngineOptimizationInLoop() {
    const engines = new EngineManager({ verbose: false });
    await engines.initialize();
    
    // Simulate loop optimization scenario
    const objectiveFn = async (config) => {
      return -(Math.pow(config.iterations - 10, 2) + Math.pow(config.batchSize - 32, 2));
    };
    
    const paramSpace = {
      iterations: { type: 'integer', min: 1, max: 20 },
      batchSize: { type: 'integer', min: 8, max: 64 }
    };
    
    const result = await engines.optimize(objectiveFn, paramSpace, {
      algorithm: 'bayesian',
      maxIterations: 20
    });
    
    if (!result.bestConfig) throw new Error('No best config found');
    if (typeof result.bestScore !== 'number') throw new Error('No best score');
    
    await engines.shutdown();
  }

  async testCombinedWorkflow() {
    const engines = new EngineManager({ verbose: false });
    await engines.initialize();
    
    // Test the combined analyzeAndOptimize method
    const result = await engines.analyzeAndOptimize(
      path.join(this.options.projectPath, 'src/engines'),
      'code_quality'
    );
    
    if (!result.patterns) throw new Error('No patterns in combined result');
    if (!result.optimization) throw new Error('No optimization in combined result');
    if (!result.recommendations) throw new Error('No recommendations in combined result');
    
    await engines.shutdown();
  }

  // ============================================
  // Test Group 4: Event Propagation
  // ============================================

  async testAnalyzerEventPropagation() {
    const system = new AutonomousSystem({
      projectPath: this.options.projectPath,
      outputDir: this.options.outputDir,
      verbose: false
    });
    
    let initEvent = false;
    system.on('system:initialized', () => { initEvent = true; });
    
    await system.initialize();
    
    if (!initEvent) throw new Error('system:initialized event not emitted');
  }

  async testLoopEngineEventPropagation() {
    const orchestrator = new BuildLoopOrchestrator({
      projectPath: this.options.projectPath,
      outputDir: this.options.outputDir,
      verbose: false,
      dryRun: true
    });
    
    const events = [];
    orchestrator.on('loop:start', () => events.push('loop:start'));
    orchestrator.on('loop:complete', () => events.push('loop:complete'));
    
    // Register mock executor
    orchestrator.registerExecutor('planning', {
      execute: async () => ({ profile: 'planning', iterations: [], success: true, exitReason: 'test' })
    });
    
    const mockAnalysis = {
      structure: { totalFiles: 5 },
      components: {},
      metrics: {},
      documentation: {},
      patterns: {}
    };
    
    await orchestrator.runLoop(mockAnalysis, { profile: 'planning' });
    
    if (!events.includes('loop:start')) throw new Error('loop:start event not emitted');
    if (!events.includes('loop:complete')) throw new Error('loop:complete event not emitted');
  }

  async testEngineOrchestratorEventPropagation() {
    const engines = new EngineManager({ verbose: false });
    
    let initEvent = false;
    let shutdownEvent = false;
    
    engines.on('initialized', () => { initEvent = true; });
    engines.on('shutdown', () => { shutdownEvent = true; });
    
    await engines.initialize();
    await engines.shutdown();
    
    if (!initEvent) throw new Error('initialized event not emitted');
    if (!shutdownEvent) throw new Error('shutdown event not emitted');
  }

  // ============================================
  // Test Group 5: Error Handling Integration
  // ============================================

  async testGracefulDegradation() {
    // Test with engines disabled
    const engines = new EngineManager({
      enableGPU: false,
      enablePrediction: true,
      verbose: false
    });
    await engines.initialize();
    
    // GPU should not be available
    if (engines.gpu) throw new Error('GPU should be disabled');
    
    // Prediction should still work
    const task = { complexity: 3, dependencies: 5, priority: 2, type: 'cpu', size: 50 };
    const prediction = await engines.predict('duration', task);
    if (typeof prediction.predicted !== 'number') throw new Error('Prediction failed with partial engines');
    
    await engines.shutdown();
  }

  async testErrorRecoveryInLoop() {
    const orchestrator = new BuildLoopOrchestrator({
      projectPath: this.options.projectPath,
      outputDir: this.options.outputDir,
      verbose: false,
      dryRun: true
    });
    
    // Register executor that fails first time
    let attempts = 0;
    orchestrator.registerExecutor('spec-driven', {
      execute: async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Simulated first attempt failure');
        }
        return { profile: 'spec-driven', iterations: [], success: true, exitReason: 'recovered' };
      }
    });
    
    const mockAnalysis = {
      structure: { totalFiles: 50, depth: 5 },
      components: Array(20).fill(null).reduce((acc, _, i) => ({ ...acc, [`comp${i}`]: {} }), {}),
      metrics: { quality: { testCoverage: 40 } },
      documentation: { 'README.md': {} },
      patterns: {}
    };
    
    // First attempt should fail
    let firstFailed = false;
    try {
      await orchestrator.runLoop(mockAnalysis, { profile: 'spec-driven' });
    } catch {
      firstFailed = true;
    }
    
    if (!firstFailed) throw new Error('First attempt should have failed');
    
    // Second attempt should succeed
    const result = await orchestrator.runLoop(mockAnalysis, { profile: 'spec-driven' });
    if (!result.success) throw new Error('Recovery attempt should have succeeded');
  }

  printSummary(totalDuration) {
    const total = this.results.passed + this.results.failed + this.results.skipped;
    const passRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              📊 Integration Test Results 📊                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

   ✅ Passed:  ${this.results.passed}
   ❌ Failed:  ${this.results.failed}
   ⏭️  Skipped: ${this.results.skipped}
   
   📈 Pass Rate: ${passRate}%
   ⏱️  Duration:  ${totalDuration}ms

   Status: ${this.results.failed === 0 ? '🎉 ALL INTEGRATION TESTS PASSED!' : '⚠️ Some tests failed'}
    `);

    if (this.results.failed > 0) {
      console.log('Failed Tests:');
      this.results.tests
        .filter(t => t.status === 'failed')
        .forEach(t => console.log(`   • ${t.name}: ${t.error}`));
    }
  }
}

// Main execution
async function main() {
  const suite = new IntegrationTestSuite({
    verbose: process.argv.includes('--verbose'),
    projectPath: PROJECT_ROOT
  });

  try {
    const results = await suite.runAll();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Integration test suite failed:', error);
    process.exit(1);
  }
}

main();

export { IntegrationTestSuite };
