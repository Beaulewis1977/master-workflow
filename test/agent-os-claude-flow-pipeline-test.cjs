#!/usr/bin/env node

/**
 * Agent-OS to Claude Flow 2.0 Pipeline Integration Test
 * 
 * This test validates the complete pipeline from Agent-OS specification
 * creation to Claude Flow 2.0 execution with WASM acceleration.
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class AgentOSClaudeFlowPipelineTest {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.testResults = [];
  }

  /**
   * Test the complete pipeline from spec creation to execution
   */
  async testCompleteSpecToExecutionPipeline() {
    const testName = "Agent-OS Spec Creation to Claude Flow Execution Pipeline";
    const startTime = performance.now();
    
    try {
      // Load Agent-OS integration
      const agentOSPath = path.join(this.projectRoot, 'intelligence-engine', 'agent-os-integration.js');
      const { AgentOSIntegration } = require(agentOSPath);
      
      const agentOS = new AgentOSIntegration({
        projectRoot: this.projectRoot,
        pipelineMode: true
      });
      
      await agentOS.initialize();
      
      // Step 1: Create a comprehensive specification
      const projectSpec = {
        name: 'test-api-server',
        type: 'web-api',
        requirements: [
          'RESTful API with CRUD operations',
          'User authentication and authorization',
          'Data persistence with SQLite',
          'Comprehensive error handling',
          'API documentation generation',
          'Unit and integration tests'
        ],
        architecture: {
          pattern: 'layered',
          components: ['controller', 'service', 'repository', 'middleware'],
          database: 'sqlite',
          authentication: 'jwt'
        },
        performance: {
          targetResponseTime: '<100ms',
          concurrentUsers: 1000,
          availability: '99.9%'
        },
        testing: {
          coverage: '>90%',
          types: ['unit', 'integration', 'e2e']
        }
      };
      
      // Generate specification document
      const specResult = await agentOS.generateProjectSpecification(projectSpec);
      
      if (!specResult || !specResult.specification) {
        throw new Error('Failed to generate project specification');
      }
      
      // Step 2: Convert spec to Claude Flow 2.0 workflow
      const workflowConversion = await agentOS.convertSpecToWorkflow(specResult.specification, {
        topology: 'hierarchical',
        enableWasmAcceleration: true,
        targetAgents: 8,
        parallelization: true
      });
      
      if (!workflowConversion || !workflowConversion.workflow) {
        throw new Error('Failed to convert specification to workflow');
      }
      
      // Step 3: Initialize Claude Flow 2.0 execution engine
      const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
      const { QueenController } = require(queenControllerPath);
      
      const queen = new QueenController({
        maxConcurrent: 8,
        contextWindowSize: 200000,
        workflowMode: true,
        wasmAcceleration: true,
        topologyType: 'hierarchical'
      });
      
      await queen.initialize();
      
      // Step 4: Execute workflow with Claude Flow 2.0
      const executionResult = await queen.executeWorkflow(workflowConversion.workflow, {
        trackPerformance: true,
        enableOptimizations: true,
        generateArtifacts: true
      });
      
      if (!executionResult || executionResult.failed) {
        throw new Error('Workflow execution failed');
      }
      
      // Step 5: Validate pipeline results
      const validation = await this.validatePipelineResults(
        projectSpec,
        specResult.specification,
        workflowConversion.workflow,
        executionResult
      );
      
      if (!validation.valid) {
        throw new Error(`Pipeline validation failed: ${validation.errors.join(', ')}`);
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        specGeneration: !!specResult,
        workflowConversion: !!workflowConversion,
        execution: !!executionResult,
        validation: validation.valid,
        artifactsGenerated: executionResult.artifacts?.length || 0,
        performanceGains: executionResult.performance
      });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Test Agent-OS three-layer context with Claude Flow integration
   */
  async testThreeLayerContextIntegration() {
    const testName = "Three-Layer Context Integration with Claude Flow";
    const startTime = performance.now();
    
    try {
      const agentOSPath = path.join(this.projectRoot, 'intelligence-engine', 'agent-os-integration.js');
      const { AgentOSIntegration } = require(agentOSPath);
      
      const agentOS = new AgentOSIntegration({
        projectRoot: this.projectRoot,
        layeredContext: true,
        adaptiveLoading: true
      });
      
      await agentOS.initialize();
      
      // Test each context layer with Claude Flow
      const contextLayers = ['base', 'enhanced', 'full'];
      const layerResults = {};
      
      for (const layer of contextLayers) {
        // Build context for layer
        const context = await agentOS.buildLayeredContext(layer, {
          includeCodeAnalysis: layer !== 'base',
          includeMetadata: layer === 'full',
          optimizeForSpeed: layer === 'base'
        });
        
        // Test Claude Flow processing with this context
        const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
        const { QueenController } = require(queenControllerPath);
        
        const queen = new QueenController({
          maxConcurrent: 3,
          contextWindowSize: 200000,
          contextLayer: layer
        });
        
        await queen.initialize();
        
        // Execute test task with layered context
        const testTask = {
          type: 'analysis',
          context: context,
          layer: layer
        };
        
        const result = await queen.executeTaskWithContext(testTask);
        
        layerResults[layer] = {
          contextSize: JSON.stringify(context).length,
          executionTime: result ? result.duration : 0,
          success: !!result,
          tokenCount: result ? result.tokenCount : 0
        };
      }
      
      // Validate layer progression and optimization
      const baseSize = layerResults.base.contextSize;
      const enhancedSize = layerResults.enhanced.contextSize;
      const fullSize = layerResults.full.contextSize;
      
      if (baseSize >= enhancedSize || enhancedSize >= fullSize) {
        throw new Error('Context layer sizes not properly progressive');
      }
      
      // Validate performance optimization per layer
      const baseSpeed = layerResults.base.executionTime;
      const fullSpeed = layerResults.full.executionTime;
      
      if (baseSpeed > fullSpeed * 2) {
        console.warn('Base layer not significantly faster than full layer');
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, { layerResults });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Test conditional file loading with Claude Flow optimization
   */
  async testConditionalFileLoadingWithOptimization() {
    const testName = "Conditional File Loading with Claude Flow Optimization";
    const startTime = performance.now();
    
    try {
      const agentOSPath = path.join(this.projectRoot, 'intelligence-engine', 'agent-os-integration.js');
      const { AgentOSIntegration } = require(agentOSPath);
      
      const agentOS = new AgentOSIntegration({
        projectRoot: this.projectRoot,
        conditionalLoading: true,
        smartCaching: true
      });
      
      await agentOS.initialize();
      
      // Test different file loading strategies
      const loadingStrategies = [
        {
          name: 'priority-only',
          config: { 
            patterns: ['package.json', '*.md', 'intelligence-engine/*.js'],
            maxFiles: 20,
            priorityFirst: true
          }
        },
        {
          name: 'context-aware',
          config: {
            patterns: ['**/*.js', '**/*.json'],
            maxFiles: 50,
            contextRelevance: true,
            excludeTests: true
          }
        },
        {
          name: 'adaptive',
          config: {
            patterns: ['**/*'],
            maxFiles: 100,
            adaptive: true,
            contextBudget: 150000 // 150k tokens
          }
        }
      ];
      
      const strategyResults = {};
      
      for (const strategy of loadingStrategies) {
        const loadResult = await agentOS.loadFilesConditionally(strategy.config);
        
        if (!loadResult || !loadResult.files) {
          throw new Error(`File loading failed for strategy: ${strategy.name}`);
        }
        
        // Test Claude Flow processing with loaded files
        const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
        const { QueenController } = require(queenControllerPath);
        
        const queen = new QueenController({
          maxConcurrent: 2,
          contextWindowSize: 200000,
          fileLoadingStrategy: strategy.name
        });
        
        await queen.initialize();
        
        // Process loaded files
        const processingResult = await queen.processLoadedFiles(loadResult.files, {
          enableOptimizations: true,
          trackMetrics: true
        });
        
        strategyResults[strategy.name] = {
          filesLoaded: loadResult.files.length,
          totalSize: loadResult.totalSize,
          contextReduction: loadResult.contextReduction || 0,
          processingTime: processingResult ? processingResult.duration : 0,
          success: !!processingResult
        };
      }
      
      // Validate context reduction achievements
      const adaptiveReduction = strategyResults.adaptive.contextReduction;
      
      if (adaptiveReduction < 60) { // Expected 60-80% reduction
        throw new Error(`Context reduction ${adaptiveReduction}% below 60% target`);
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, { strategyResults });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Test product and specification generation pipeline
   */
  async testProductSpecificationGeneration() {
    const testName = "Product and Specification Generation Pipeline";
    const startTime = performance.now();
    
    try {
      const agentOSPath = path.join(this.projectRoot, 'intelligence-engine', 'agent-os-integration.js');
      const { AgentOSIntegration } = require(agentOSPath);
      
      const agentOS = new AgentOSIntegration({
        projectRoot: this.projectRoot,
        generationMode: true
      });
      
      await agentOS.initialize();
      
      // Test product specification generation
      const productRequirements = {
        domain: 'e-commerce',
        features: [
          'User registration and authentication',
          'Product catalog with search and filtering',
          'Shopping cart and checkout',
          'Payment processing integration',
          'Order management system',
          'Admin dashboard'
        ],
        constraints: {
          budget: 'medium',
          timeline: '3 months',
          scalability: 'high',
          security: 'critical'
        },
        technology: {
          frontend: 'React',
          backend: 'Node.js',
          database: 'PostgreSQL',
          deployment: 'AWS'
        }
      };
      
      // Generate comprehensive product specification
      const productSpec = await agentOS.generateProductSpecification(productRequirements);
      
      if (!productSpec || !productSpec.specification) {
        throw new Error('Product specification generation failed');
      }
      
      // Validate specification completeness
      const requiredSections = [
        'architecture', 'components', 'database', 'api', 'security',
        'testing', 'deployment', 'monitoring', 'documentation'
      ];
      
      const missingSections = requiredSections.filter(section => 
        !productSpec.specification[section]
      );
      
      if (missingSections.length > 0) {
        throw new Error(`Missing specification sections: ${missingSections.join(', ')}`);
      }
      
      // Test specification validation
      const validation = await agentOS.validateSpecification(productSpec.specification);
      
      if (!validation.valid) {
        throw new Error(`Specification validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Test conversion to implementation tasks
      const taskConversion = await agentOS.convertSpecificationToTasks(productSpec.specification);
      
      if (!taskConversion || taskConversion.tasks.length === 0) {
        throw new Error('Task conversion from specification failed');
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        specificationGenerated: true,
        sectionsComplete: requiredSections.length - missingSections.length,
        tasksGenerated: taskConversion.tasks.length,
        validationPassed: validation.valid
      });
      
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
      return false;
    }
  }

  /**
   * Validate pipeline results
   */
  async validatePipelineResults(originalSpec, specification, workflow, executionResult) {
    const validation = {
      valid: true,
      errors: []
    };
    
    // Validate specification fidelity
    if (!specification.requirements || specification.requirements.length === 0) {
      validation.valid = false;
      validation.errors.push('Specification missing requirements');
    }
    
    // Validate workflow structure
    if (!workflow.steps || workflow.steps.length === 0) {
      validation.valid = false;
      validation.errors.push('Workflow missing steps');
    }
    
    // Validate execution results
    if (!executionResult.completed) {
      validation.valid = false;
      validation.errors.push('Workflow execution not completed');
    }
    
    // Validate performance improvements
    if (executionResult.performance && executionResult.performance.speedup < 2.0) {
      validation.errors.push('Performance speedup below minimum threshold');
    }
    
    return validation;
  }

  /**
   * Log successful test result
   */
  logSuccess(testName, duration, details = {}) {
    this.testResults.push({
      name: testName,
      success: true,
      duration: duration,
      details: details,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ ${testName} (${duration.toFixed(2)}ms)`);
  }

  /**
   * Log failed test result
   */
  logError(testName, error, duration) {
    this.testResults.push({
      name: testName,
      success: false,
      error: error.message,
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
    console.log(`❌ ${testName}: ${error.message} (${duration.toFixed(2)}ms)`);
  }

  /**
   * Run all pipeline tests
   */
  async runAllTests() {
    console.log('🔄 Running Agent-OS to Claude Flow Pipeline Tests\n');
    
    const tests = [
      () => this.testCompleteSpecToExecutionPipeline(),
      () => this.testThreeLayerContextIntegration(),
      () => this.testConditionalFileLoadingWithOptimization(),
      () => this.testProductSpecificationGeneration()
    ];
    
    for (const test of tests) {
      await test();
    }
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`\n📊 Pipeline Tests Complete: ${passed}/${total} passed`);
    
    return {
      passed,
      total,
      results: this.testResults
    };
  }
}

module.exports = AgentOSClaudeFlowPipelineTest;

// Run tests if executed directly
if (require.main === module) {
  const pipelineTest = new AgentOSClaudeFlowPipelineTest();
  pipelineTest.runAllTests()
    .then(results => {
      process.exit(results.passed === results.total ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Pipeline tests failed:', error);
      process.exit(1);
    });
}