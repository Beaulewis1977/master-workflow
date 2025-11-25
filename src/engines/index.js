/**
 * Master Workflow 3.0 - Enhanced Engines
 * =======================================
 * Central export for all improved engine implementations.
 */

import { EventEmitter } from 'events';
import { GPUAccelerator } from './gpu-accelerator.js';
import { PredictiveAnalytics } from './predictive-analytics.js';
import { AutoTuner } from './auto-tuner.js';
import { SwarmIntelligence } from './swarm-intelligence.js';
import { PatternDiscovery } from './pattern-discovery.js';

/**
 * EngineManager - Unified interface for all engines
 */
export class EngineManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableGPU: options.enableGPU !== false,
      enablePrediction: options.enablePrediction !== false,
      enableTuning: options.enableTuning !== false,
      enableSwarm: options.enableSwarm !== false,
      enablePatterns: options.enablePatterns !== false,
      verbose: options.verbose || false
    };

    this.engines = {};
    this.initialized = false;
  }

  log(msg) { if (this.options.verbose) console.log(`[Engines] ${msg}`); }

  async initialize() {
    this.log('Initializing Engine Manager...');
    const errors = [];

    if (this.options.enableGPU) {
      try {
        this.engines.gpu = new GPUAccelerator({ verbose: this.options.verbose });
        await this.engines.gpu.initialize();
      } catch (error) {
        this.log(`GPU engine failed to initialize: ${error.message}`);
        errors.push({ engine: 'gpu', error: error.message });
      }
    }

    if (this.options.enablePrediction) {
      try {
        this.engines.prediction = new PredictiveAnalytics({ verbose: this.options.verbose });
        await this.engines.prediction.initialize();
      } catch (error) {
        this.log(`Prediction engine failed to initialize: ${error.message}`);
        errors.push({ engine: 'prediction', error: error.message });
      }
    }

    if (this.options.enableTuning) {
      try {
        this.engines.tuner = new AutoTuner({ verbose: this.options.verbose });
        await this.engines.tuner.initialize();
      } catch (error) {
        this.log(`Tuner engine failed to initialize: ${error.message}`);
        errors.push({ engine: 'tuner', error: error.message });
      }
    }

    if (this.options.enableSwarm) {
      try {
        this.engines.swarm = new SwarmIntelligence({ verbose: this.options.verbose });
        await this.engines.swarm.initialize();
      } catch (error) {
        this.log(`Swarm engine failed to initialize: ${error.message}`);
        errors.push({ engine: 'swarm', error: error.message });
      }
    }

    if (this.options.enablePatterns) {
      try {
        this.engines.patterns = new PatternDiscovery({ verbose: this.options.verbose });
        await this.engines.patterns.initialize();
      } catch (error) {
        this.log(`Patterns engine failed to initialize: ${error.message}`);
        errors.push({ engine: 'patterns', error: error.message });
      }
    }

    this.initialized = true;
    this.initErrors = errors;
    this.log(`✅ Engine Manager initialized with ${Object.keys(this.engines).length} engines`);
    if (errors.length > 0) {
      this.log(`⚠️ ${errors.length} engine(s) failed to initialize`);
    }
    this.emit('initialized', { engines: Object.keys(this.engines), errors });
    
    return this;
  }

  // GPU Accelerator shortcuts
  get gpu() { return this.engines.gpu; }
  
  async accelerate(operation, data) {
    if (!this.engines.gpu) throw new Error('GPU engine not enabled');
    return this.engines.gpu.processBatch(data, operation);
  }

  // Predictive Analytics shortcuts
  get prediction() { return this.engines.prediction; }
  
  async predict(type, input) {
    if (!this.engines.prediction) throw new Error('Prediction engine not enabled');
    switch (type) {
      case 'duration': return this.engines.prediction.predictDuration(input);
      case 'failure': return this.engines.prediction.predictFailure(input);
      case 'resources': return this.engines.prediction.predictResources(input);
      default: throw new Error(`Unknown prediction type: ${type}`);
    }
  }

  // Auto-Tuner shortcuts
  get tuner() { return this.engines.tuner; }
  
  async optimize(objectiveFn, paramSpace, options = {}) {
    if (!this.engines.tuner) throw new Error('Tuner engine not enabled');
    return this.engines.tuner.optimize(objectiveFn, paramSpace, options);
  }

  // Swarm Intelligence shortcuts
  get swarm() { return this.engines.swarm; }
  
  async swarmOptimize(objectiveFn, bounds, options = {}) {
    if (!this.engines.swarm) throw new Error('Swarm engine not enabled');
    return this.engines.swarm.particleSwarmOptimize(objectiveFn, bounds, options);
  }

  async collectiveSolve(problem, options = {}) {
    if (!this.engines.swarm) throw new Error('Swarm engine not enabled');
    return this.engines.swarm.collectiveSolve(problem, options);
  }

  // Pattern Discovery shortcuts
  get patterns() { return this.engines.patterns; }
  
  async analyzePatterns(rootPath) {
    if (!this.engines.patterns) throw new Error('Pattern engine not enabled');
    return this.engines.patterns.analyzeCodebase(rootPath);
  }

  // Combined operations
  async analyzeAndOptimize(codebasePath, _optimizationGoal) {
    this.log('Running combined analysis and optimization...');

    // Analyze patterns first
    const patternResults = this.engines.patterns 
      ? await this.engines.patterns.analyzeCodebase(codebasePath)
      : null;

    // Use pattern insights to guide optimization
    const paramSpace = {
      refactorPriority: { type: 'continuous', min: 0, max: 1 },
      testCoverage: { type: 'continuous', min: 0, max: 1 },
      complexity: { type: 'integer', min: 1, max: 10 }
    };

    const objectiveFn = async (params) => {
      // Score based on pattern health and params
      const healthScore = patternResults?.summary?.healthScore || 50;
      return healthScore * params.refactorPriority + 
             params.testCoverage * 20 - 
             params.complexity * 5;
    };

    const optimizationResult = this.engines.tuner
      ? await this.engines.tuner.optimize(objectiveFn, paramSpace, { maxIterations: 50 })
      : null;

    return {
      patterns: patternResults,
      optimization: optimizationResult,
      recommendations: this.generateCombinedRecommendations(patternResults, optimizationResult)
    };
  }

  generateCombinedRecommendations(patterns, optimization) {
    const recommendations = [];

    if (patterns?.summary?.healthScore < 60) {
      recommendations.push({
        priority: 'high',
        action: 'Address code quality issues',
        details: patterns.summary.topIssues
      });
    }

    if (optimization?.bestConfig) {
      recommendations.push({
        priority: 'medium',
        action: 'Apply optimized configuration',
        details: optimization.bestConfig
      });
    }

    return recommendations;
  }

  getStatus() {
    const status = {
      initialized: this.initialized,
      engines: {}
    };

    for (const [name, engine] of Object.entries(this.engines)) {
      status.engines[name] = engine.getStatus ? engine.getStatus() : { active: true };
    }

    return status;
  }

  async shutdown() {
    this.log('Shutting down engines...');
    
    // Cleanup individual engines if they have shutdown methods
    for (const [name, engine] of Object.entries(this.engines)) {
      if (typeof engine.shutdown === 'function') {
        try {
          await engine.shutdown();
          this.log(`Shut down ${name} engine`);
        } catch (error) {
          this.log(`Error shutting down ${name}: ${error.message}`);
        }
      }
    }
    
    this.engines = {};
    this.initialized = false;
    this.emit('shutdown');
  }
}

// Export individual engines
export { GPUAccelerator } from './gpu-accelerator.js';
export { PredictiveAnalytics } from './predictive-analytics.js';
export { AutoTuner } from './auto-tuner.js';
export { SwarmIntelligence } from './swarm-intelligence.js';
export { PatternDiscovery } from './pattern-discovery.js';

export default EngineManager;
