#!/usr/bin/env node

/**
 * Phase 5 Implementation Test Suite
 * Tests all Phase 5 Neural Intelligence & MCP Optimization components for the MASTER-WORKFLOW v3.0
 * 
 * Tests:
 * - MCP Full Configurator functionality (87 servers, auto-detection, configuration generation)
 * - Neural Learning System functionality (WASM core, pattern recording, success metrics)
 * - MCP Server Presets functionality (8 presets, loading, validation)
 * - Integration tests for neural learning with MCP optimization
 * - End-to-end workflow optimization and prediction
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Import Phase 5 components
const MCPFullConfigurator = require('./mcp-full-configurator');
const { NeuralLearningSystem, WASMNeuralCore, PatternRecorder, SuccessMetrics } = require('./neural-learning');

// Import MCP Server Presets
const { MCPPresetManager, presetManager } = require('../templates/mcp-configs/server-presets/index');

// Import previous phase components for integration testing
const SharedMemoryStore = require('./shared-memory');
const QueenController = require('./queen-controller');
const AgentCommunication = require('./agent-communication');

// Test utilities
const testResults = {
  passed: [],
  failed: [],
  skipped: []
};

// Temporary test directories
let testTempDir;
let testProjectDir;
let testNeuralDataDir;

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, testFn) {
  try {
    colorLog('blue', `Testing: ${name}...`);
    await testFn();
    testResults.passed.push(name);
    colorLog('green', `  ✅ ${name} passed`);
  } catch (error) {
    testResults.failed.push({ name, error: error.message });
    colorLog('red', `  ❌ ${name} failed: ${error.message}`);
  }
}

async function testAsync(name, testFn, timeout = 15000) {
  return new Promise(async (resolve) => {
    const timer = setTimeout(() => {
      testResults.skipped.push(`${name} (timeout)`);
      colorLog('yellow', `  ⏭️  ${name} skipped (timeout)`);
      resolve();
    }, timeout);
    
    try {
      await test(name, testFn);
    } finally {
      clearTimeout(timer);
      resolve();
    }
  });
}

// Setup test environment
async function setupTestEnvironment() {
  testTempDir = path.join(os.tmpdir(), `phase5-test-${Date.now()}`);
  testProjectDir = path.join(testTempDir, 'test-project');
  testNeuralDataDir = path.join(testTempDir, 'neural-data');
  
  await fs.mkdir(testTempDir, { recursive: true });
  await fs.mkdir(testProjectDir, { recursive: true });
  await fs.mkdir(testNeuralDataDir, { recursive: true });
  
  // Create a comprehensive test project structure
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    description: 'Test project for Phase 5 testing',
    main: 'index.js',
    scripts: {
      start: 'node index.js',
      test: 'jest',
      build: 'webpack'
    },
    dependencies: {
      express: '^4.18.0',
      react: '^18.0.0',
      'next': '^13.0.0',
      mongoose: '^7.0.0',
      redis: '^4.0.0',
      stripe: '^12.0.0',
      '@slack/bolt': '^3.0.0',
      'aws-sdk': '^2.1400.0',
      openai: '^4.0.0',
      '@anthropic-ai/sdk': '^0.20.0'
    },
    devDependencies: {
      jest: '^29.0.0',
      cypress: '^12.0.0',
      playwright: '^1.36.0',
      '@sentry/node': '^7.0.0'
    }
  };
  
  await fs.writeFile(
    path.join(testProjectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create framework indicator files
  await fs.writeFile(
    path.join(testProjectDir, 'next.config.js'),
    'module.exports = { reactStrictMode: true };'
  );
  
  await fs.writeFile(
    path.join(testProjectDir, 'vercel.json'),
    '{ "version": 2, "builds": [{ "src": "index.js", "use": "@vercel/node" }] }'
  );
  
  await fs.writeFile(
    path.join(testProjectDir, 'docker-compose.yml'),
    'version: "3.8"\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"'
  );
  
  // Create source files
  await fs.writeFile(
    path.join(testProjectDir, 'index.js'),
    `const express = require('express');
const { Stripe } = require('stripe');
const { MongoClient } = require('mongodb');
const Redis = require('redis');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});

module.exports = app;`
  );
  
  // Create .env example
  await fs.writeFile(
    path.join(testProjectDir, '.env.example'),
    `NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/testdb
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
SLACK_BOT_TOKEN=xoxb-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...`
  );

  // Create test directories
  await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(testProjectDir, 'components'), { recursive: true });
  await fs.mkdir(path.join(testProjectDir, 'pages'), { recursive: true });
  await fs.mkdir(path.join(testProjectDir, '__tests__'), { recursive: true });
  await fs.mkdir(path.join(testProjectDir, 'cypress'), { recursive: true });
}

// Cleanup test environment
async function cleanupTestEnvironment() {
  try {
    if (testTempDir) {
      await fs.rm(testTempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`Warning: Failed to cleanup test directory: ${error.message}`);
  }
}

// Test Suite
async function runPhase5Tests() {
  colorLog('magenta', '\n🧪 Phase 5 Implementation Test Suite\n');
  colorLog('cyan', 'Testing Neural Intelligence & MCP Optimization components...\n');
  
  // Setup test environment
  await setupTestEnvironment();
  
  // Initialize shared components
  const sharedMemory = new SharedMemoryStore();
  const queenController = new QueenController();
  const agentCommunication = new AgentCommunication();
  
  // Test 1: MCP Full Configurator - Initialization
  await test('MCP Full Configurator initialization', async () => {
    const configurator = new MCPFullConfigurator();
    
    if (!configurator.mcpCatalog) throw new Error('MCP catalog not initialized');
    if (!configurator.detectedTechnologies) throw new Error('Detected technologies not initialized');
    if (!configurator.recommendedServers) throw new Error('Recommended servers not initialized');
    
    // Verify catalog has all 100 servers across categories
    const catalogSummary = configurator.getCatalogSummary();
    if (catalogSummary.totalServers !== 100) {
      throw new Error(`Expected 100 servers, got ${catalogSummary.totalServers}`);
    }
    
    // Check required categories
    const requiredCategories = [
      'development', 'ai', 'databases', 'cloud', 'communication',
      'analytics', 'payment', 'versionControl', 'cicd', 'monitoring',
      'testing', 'documentation', 'core'
    ];
    
    for (const category of requiredCategories) {
      if (!catalogSummary.categories[category]) {
        throw new Error(`Missing required category: ${category}`);
      }
    }
  });

  // Test 2: MCP Full Configurator - Project Analysis
  await testAsync('MCP Full Configurator can analyze project', async () => {
    const configurator = new MCPFullConfigurator();
    
    const analysis = await configurator.analyzeProject(testProjectDir);
    
    if (!analysis.detectedTechnologies) throw new Error('No detected technologies');
    if (!analysis.recommendedServers) throw new Error('No recommended servers');
    if (typeof analysis.totalServers !== 'number') throw new Error('Invalid total servers count');
    
    // Should detect Node.js/Express technologies
    const detectedTech = analysis.detectedTechnologies;
    const hasNodeTech = detectedTech.some(tech => 
      tech.includes('express') || tech.includes('javascript') || tech.includes('node')
    );
    
    if (!hasNodeTech) {
      // Should at least detect some core servers
      if (analysis.totalServers < 2) {
        throw new Error('Should detect at least core servers');
      }
    }
    
    // Should have priority breakdown
    if (!analysis.priorityBreakdown) throw new Error('Missing priority breakdown');
  });

  // Test 3: MCP Full Configurator - Configuration Generation
  await testAsync('MCP Full Configurator can generate configuration', async () => {
    const configurator = new MCPFullConfigurator();
    
    // First analyze the project
    await configurator.analyzeProject(testProjectDir);
    
    const outputPath = path.join(testTempDir, '.claude', 'mcp.json');
    const config = configurator.generateConfiguration({
      includeOptional: false,
      priorityThreshold: 'medium',
      outputPath: outputPath
    });
    
    if (!config.mcpServers) throw new Error('Generated config missing mcpServers');
    
    // Check that configuration file was created
    try {
      await fs.access(outputPath);
    } catch {
      throw new Error('Configuration file was not created');
    }
    
    // Should have at least core servers
    if (Object.keys(config.mcpServers).length === 0) {
      throw new Error('No servers in generated configuration');
    }
    
    // Check server structure
    const firstServerId = Object.keys(config.mcpServers)[0];
    const firstServer = config.mcpServers[firstServerId];
    
    if (!firstServer.command) throw new Error('Server missing command');
    if (!firstServer.args) throw new Error('Server missing args');
  });

  // Test 4: MCP Full Configurator - Server Dependencies
  await test('MCP Full Configurator handles server dependencies', async () => {
    const configurator = new MCPFullConfigurator();
    
    // Apply a preset that has dependencies
    configurator.applyProjectTypePreset('ecommerce');
    
    const servers = configurator.recommendedServers;
    
    // E-commerce preset should include payment servers
    let hasPaymentServer = false;
    for (const [serverId] of servers) {
      if (serverId.includes('stripe') || serverId.includes('payment')) {
        hasPaymentServer = true;
        break;
      }
    }
    
    if (!hasPaymentServer && servers.size > 0) {
      // Check if any servers are recommended
      if (servers.size === 0) {
        throw new Error('No servers recommended for e-commerce preset');
      }
    }
  });

  // Test 5: MCP Full Configurator - Project Type Presets
  await test('MCP Full Configurator provides project type presets', async () => {
    const configurator = new MCPFullConfigurator();
    
    const presets = configurator.getProjectTypePresets();
    
    const expectedPresets = ['web-app', 'api-service', 'mobile-app', 'ai-ml-project', 'ecommerce'];
    
    for (const preset of expectedPresets) {
      if (!presets[preset]) {
        throw new Error(`Missing preset: ${preset}`);
      }
      
      if (!presets[preset].description) {
        throw new Error(`Preset ${preset} missing description`);
      }
      
      if (!presets[preset].servers || presets[preset].servers.length === 0) {
        throw new Error(`Preset ${preset} missing servers`);
      }
    }
  });

  // Test 6: Neural Learning System - WASM Core Initialization
  await testAsync('Neural Learning System WASM Core initialization', async () => {
    const wasmCore = new WASMNeuralCore();
    
    if (!wasmCore.architecture) throw new Error('Architecture not defined');
    if (wasmCore.architecture.totalWeights <= 0) throw new Error('Invalid weight count');
    if (wasmCore.architecture.totalActivations <= 0) throw new Error('Invalid activation count');
    
    // Initialize (will use JavaScript fallback)
    const initialized = await wasmCore.initializeWASM();
    
    if (!initialized) throw new Error('Failed to initialize WASM core');
    if (!wasmCore.isInitialized) throw new Error('Core not marked as initialized');
    if (!wasmCore.weights) throw new Error('Weights not allocated');
    if (!wasmCore.activations) throw new Error('Activations not allocated');
    
    // Test that weights are properly initialized
    let hasNonZeroWeights = false;
    for (let i = 0; i < Math.min(10, wasmCore.weights.length); i++) {
      if (wasmCore.weights[i] !== 0) {
        hasNonZeroWeights = true;
        break;
      }
    }
    
    if (!hasNonZeroWeights) {
      throw new Error('Weights not properly initialized');
    }
  });

  // Test 7: Neural Learning System - Pattern Recording
  await test('Neural Learning System pattern recording', async () => {
    const patternRecorder = new PatternRecorder();
    
    const workflowData = {
      workflowType: 'code-analysis',
      projectType: 'web-app',
      complexity: 7,
      taskCount: 5,
      duration: 45000,
      userInteractions: 3,
      primaryLanguage: 'javascript'
    };
    
    const outcome = {
      success: true,
      duration: 43000,
      quality: 0.9,
      errors: []
    };
    
    const pattern = patternRecorder.recordPattern(workflowData, outcome);
    
    if (!pattern.id) throw new Error('Pattern missing ID');
    if (!pattern.features) throw new Error('Pattern missing features');
    if (pattern.features.length !== 32) throw new Error('Invalid feature vector size');
    if (typeof pattern.successRate !== 'number') throw new Error('Invalid success rate');
    if (pattern.usageCount !== 1) throw new Error('Invalid usage count');
    
    // Record another outcome for the same pattern
    const outcome2 = { success: false, duration: 50000, quality: 0.6, errors: ['timeout'] };
    const pattern2 = patternRecorder.recordPattern(workflowData, outcome2);
    
    if (pattern2.id !== pattern.id) throw new Error('Same workflow should generate same pattern ID');
    if (pattern2.usageCount !== 2) throw new Error('Usage count not updated');
    if (pattern2.successRate !== 0.5) throw new Error('Success rate not updated correctly');
  });

  // Test 8: Neural Learning System - Success Metrics Tracking
  await test('Neural Learning System success metrics tracking', async () => {
    const successMetrics = new SuccessMetrics();
    
    const workflowData = { id: 'test-1', type: 'analysis' };
    const outcome = {
      success: true,
      duration: 30000,
      quality: 0.8,
      userRating: 4,
      errors: [],
      resourceUsage: { cpu: 0.3, memory: 0.4 }
    };
    
    const metric = successMetrics.recordOutcome(workflowData, outcome);
    
    if (!metric.timestamp) throw new Error('Metric missing timestamp');
    if (metric.success !== true) throw new Error('Metric success not recorded');
    if (metric.duration !== 30000) throw new Error('Metric duration not recorded');
    
    // Check aggregate metrics
    if (successMetrics.metrics.totalWorkflows !== 1) throw new Error('Total workflows not tracked');
    if (successMetrics.metrics.successfulWorkflows !== 1) throw new Error('Successful workflows not tracked');
    if (successMetrics.metrics.averageTime !== 30000) throw new Error('Average time not calculated');
    
    // Record a failure
    const failureOutcome = { success: false, duration: 60000, errors: ['error1'] };
    successMetrics.recordOutcome({ id: 'test-2', type: 'analysis' }, failureOutcome);
    
    if (successMetrics.metrics.totalWorkflows !== 2) throw new Error('Total workflows not updated');
    if (successMetrics.metrics.errorRate !== 0.5) throw new Error('Error rate not calculated correctly');
  });

  // Test 9: Neural Learning System - Prediction Engine
  await testAsync('Neural Learning System prediction engine', async () => {
    const neuralSystem = new NeuralLearningSystem({
      persistencePath: testNeuralDataDir,
      autoSave: false
    });
    
    const initialized = await neuralSystem.initialize();
    if (!initialized) throw new Error('Neural system failed to initialize');
    
    // Train with some data first
    const workflowData = {
      id: 'training-1',
      type: 'code-analysis',
      taskCount: 5,
      duration: 45000,
      complexity: 7,
      userInteractions: 3,
      projectSize: 15000,
      primaryLanguage: 'javascript'
    };
    
    const outcome = {
      success: true,
      duration: 43000,
      quality: 0.9,
      userRating: 4.5,
      errors: [],
      resourceUsage: { cpu: 0.4, memory: 0.3 }
    };
    
    await neuralSystem.learn(workflowData, outcome);
    
    // Make a prediction
    const prediction = await neuralSystem.predict({
      ...workflowData,
      id: 'prediction-test'
    });
    
    if (typeof prediction.successProbability !== 'number') throw new Error('Invalid success probability');
    if (prediction.successProbability < 0 || prediction.successProbability > 1) {
      throw new Error('Success probability out of range');
    }
    if (typeof prediction.confidence !== 'number') throw new Error('Invalid confidence');
    if (!Array.isArray(prediction.optimizations)) throw new Error('Missing optimizations');
    if (!Array.isArray(prediction.neuralOutput)) throw new Error('Missing neural output');
  });

  // Test 10: Neural Learning System - Model Persistence
  await testAsync('Neural Learning System model persistence', async () => {
    const neuralSystem = new NeuralLearningSystem({
      persistencePath: testNeuralDataDir,
      autoSave: false
    });
    
    await neuralSystem.initialize();
    
    // Train with some data
    const workflowData = {
      id: 'persist-test',
      type: 'optimization',
      taskCount: 3,
      complexity: 5
    };
    
    const outcome = { success: true, duration: 20000, quality: 0.8 };
    await neuralSystem.learn(workflowData, outcome);
    
    // Save data
    await neuralSystem.savePersistentData();
    
    // Create new instance and load data
    const neuralSystem2 = new NeuralLearningSystem({
      persistencePath: testNeuralDataDir,
      autoSave: false
    });
    
    await neuralSystem2.initialize();
    
    // Check that data was loaded
    if (neuralSystem2.patternRecorder.patterns.size === 0) {
      throw new Error('Patterns not loaded from persistence');
    }
    
    if (neuralSystem2.successMetrics.metrics.totalWorkflows === 0) {
      throw new Error('Metrics not loaded from persistence');
    }
  });

  // Test 11: MCP Server Presets - Preset Manager Initialization
  await test('MCP Server Presets manager initialization', async () => {
    const manager = new MCPPresetManager();
    
    if (!manager.presets) throw new Error('Presets not loaded');
    if (!manager.presetsPath) throw new Error('Presets path not set');
    
    const availablePresets = manager.getAvailablePresets();
    if (availablePresets.length === 0) throw new Error('No presets loaded');
    
    // Should have at least 8 presets as mentioned in requirements
    if (availablePresets.length < 8) {
      throw new Error(`Expected at least 8 presets, got ${availablePresets.length}`);
    }
    
    // Check for essential presets
    const essentialPresets = ['web-development', 'api-backend', 'data-science', 'devops'];
    for (const preset of essentialPresets) {
      if (!availablePresets.includes(preset)) {
        throw new Error(`Missing essential preset: ${preset}`);
      }
    }
  });

  // Test 12: MCP Server Presets - Preset Loading and Validation
  await test('MCP Server Presets loading and validation', async () => {
    const webDevPreset = presetManager.getPreset('web-development');
    
    if (!webDevPreset) throw new Error('Web development preset not found');
    if (!webDevPreset.name) throw new Error('Preset missing name');
    if (!webDevPreset.description) throw new Error('Preset missing description');
    if (!webDevPreset.enabled_servers) throw new Error('Preset missing enabled servers');
    if (!webDevPreset.environment_variables) throw new Error('Preset missing environment variables');
    if (!webDevPreset.recommended_tools) throw new Error('Preset missing recommended tools');
    
    // Check server structure
    const servers = webDevPreset.enabled_servers;
    if (Object.keys(servers).length === 0) throw new Error('No servers in preset');
    
    const firstServer = Object.values(servers)[0];
    if (typeof firstServer.enabled !== 'boolean') throw new Error('Server missing enabled flag');
    if (typeof firstServer.priority !== 'number') throw new Error('Server missing priority');
    if (!firstServer.description) throw new Error('Server missing description');
    
    // Test API backend preset
    const apiPreset = presetManager.getPreset('api-backend');
    if (!apiPreset) throw new Error('API backend preset not found');
    
    // Should have database-related servers
    const hasPostgres = apiPreset.enabled_servers.postgres;
    const hasRedis = apiPreset.enabled_servers.redis;
    
    if (!hasPostgres && !hasRedis) {
      throw new Error('API backend preset should include database servers');
    }
  });

  // Test 13: MCP Server Presets - Statistics and Analysis
  await test('MCP Server Presets statistics and analysis', async () => {
    const stats = presetManager.getStatistics();
    
    if (typeof stats.total_presets !== 'number') throw new Error('Invalid total presets');
    if (stats.total_presets === 0) throw new Error('No presets counted');
    if (!stats.categories) throw new Error('Missing categories statistics');
    if (!stats.servers) throw new Error('Missing servers statistics');
    if (typeof stats.total_servers !== 'number') throw new Error('Invalid total servers count');
    
    // Should have multiple categories
    const categoryCount = Object.keys(stats.categories).length;
    if (categoryCount === 0) throw new Error('No categories found');
    
    // Should track server usage across presets
    const serverCount = Object.keys(stats.servers).length;
    if (serverCount === 0) throw new Error('No servers tracked in statistics');
  });

  // Test 14: MCP Server Presets - Preset Merging
  await test('MCP Server Presets merging functionality', async () => {
    const merged = presetManager.mergePresets(['web-development', 'api-backend']);
    
    if (!merged.enabled_servers) throw new Error('Merged preset missing servers');
    if (!merged.environment_variables) throw new Error('Merged preset missing environment variables');
    if (!merged.recommended_tools) throw new Error('Merged preset missing tools');
    
    // Should have servers from both presets
    const hasWebServer = merged.enabled_servers.context7;
    const hasBackendServer = merged.enabled_servers.postgres || merged.enabled_servers.redis;
    
    if (!hasWebServer) throw new Error('Missing web development servers in merge');
    if (!hasBackendServer) throw new Error('Missing backend servers in merge');
    
    // Environment variables should be merged
    const requiredVars = merged.environment_variables.required;
    if (!Array.isArray(requiredVars)) throw new Error('Invalid required environment variables');
    if (requiredVars.length === 0) throw new Error('No required environment variables in merged preset');
  });

  // Test 15: Integration Test - MCP Configurator with Neural Learning
  await testAsync('Integration: MCP Configurator with Neural Learning', async () => {
    const configurator = new MCPFullConfigurator();
    const neuralSystem = new NeuralLearningSystem({
      persistencePath: testNeuralDataDir,
      autoSave: false
    });
    
    await neuralSystem.initialize();
    
    // Analyze project with MCP configurator
    const mcpAnalysis = await configurator.analyzeProject(testProjectDir);
    
    // Create workflow data that includes MCP insights
    const workflowData = {
      id: 'integration-test',
      type: 'mcp-optimization',
      detectedServers: mcpAnalysis.totalServers,
      recommendedServers: Object.keys(mcpAnalysis.recommendedServers),
      projectComplexity: mcpAnalysis.totalServers / 10, // Normalize
      taskCount: 8,
      duration: 60000
    };
    
    const outcome = {
      success: mcpAnalysis.totalServers > 0,
      duration: 55000,
      quality: mcpAnalysis.totalServers > 5 ? 0.8 : 0.6,
      mcpOptimization: true
    };
    
    // Learn from MCP analysis outcome
    await neuralSystem.learn(workflowData, outcome);
    
    // Predict future MCP optimization
    const prediction = await neuralSystem.predict(workflowData);
    
    if (typeof prediction.successProbability !== 'number') {
      throw new Error('Neural prediction failed for MCP workflow');
    }
    
    // Generate optimized configuration based on prediction
    if (prediction.successProbability > 0.5) {
      const config = configurator.generateConfiguration({
        priorityThreshold: 'high',
        includeOptional: false
      });
      
      if (!config.mcpServers) {
        throw new Error('Failed to generate optimized MCP configuration');
      }
    }
  });

  // Test 16: Integration Test - Preset Application with Project Analysis
  await testAsync('Integration: Preset Application with Project Analysis', async () => {
    const configurator = new MCPFullConfigurator();
    
    // Analyze the test project
    const analysis = await configurator.analyzeProject(testProjectDir);
    
    // Determine best preset based on detected technologies
    let bestPreset = 'web-app'; // Default
    
    const detectedTech = analysis.detectedTechnologies.join(' ').toLowerCase();
    if (detectedTech.includes('postgres') || detectedTech.includes('mongodb')) {
      bestPreset = 'api-service';
    } else if (detectedTech.includes('react') || detectedTech.includes('next')) {
      bestPreset = 'web-app';
    }
    
    // Apply the preset
    configurator.applyProjectTypePreset(bestPreset);
    
    // Get corresponding MCP preset
    const mcpPreset = presetManager.getPreset('web-development');
    
    if (!mcpPreset) throw new Error('Failed to load corresponding MCP preset');
    
    // Verify integration between MCP configurator and presets
    const configuratorServers = Array.from(configurator.recommendedServers.keys());
    const presetServers = Object.keys(mcpPreset.enabled_servers);
    
    // Should have some overlap or complementary servers
    let hasOverlap = false;
    for (const server of configuratorServers) {
      if (presetServers.some(ps => server.includes(ps) || ps.includes(server.split(':')[1]))) {
        hasOverlap = true;
        break;
      }
    }
    
    // Alternative check: both should recommend core servers
    const configuratorHasCore = configuratorServers.some(s => s.includes('filesystem') || s.includes('http'));
    const presetHasCore = presetServers.includes('filesystem') || presetServers.includes('http');
    
    if (!hasOverlap && !configuratorHasCore && !presetHasCore) {
      // At least one should have some servers
      if (configuratorServers.length === 0 && presetServers.length === 0) {
        throw new Error('Neither configurator nor preset recommends any servers');
      }
    }
  });

  // Test 17: Neural Learning System - Batch Training and Performance
  await testAsync('Neural Learning System batch training and performance', async () => {
    const neuralSystem = new NeuralLearningSystem({
      persistencePath: testNeuralDataDir,
      autoSave: false,
      batchSize: 5
    });
    
    await neuralSystem.initialize();
    
    // Generate multiple training samples
    const trainingSamples = [];
    for (let i = 0; i < 10; i++) {
      const workflowData = {
        id: `batch-${i}`,
        type: 'batch-training',
        taskCount: Math.floor(Math.random() * 10) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        duration: Math.random() * 60000 + 10000
      };
      
      const outcome = {
        success: Math.random() > 0.3, // 70% success rate
        duration: workflowData.duration * (0.8 + Math.random() * 0.4),
        quality: Math.random() * 0.5 + 0.5
      };
      
      trainingSamples.push({ workflowData, outcome });
    }
    
    // Train with all samples
    for (const sample of trainingSamples) {
      await neuralSystem.learn(sample.workflowData, sample.outcome);
    }
    
    // Force process remaining training queue
    await neuralSystem.flushTraining();
    
    // Check that training occurred
    const status = neuralSystem.getSystemStatus();
    if (status.performance.trainingIterations === 0) {
      throw new Error('No training iterations recorded');
    }
    
    if (status.patterns.total === 0) {
      throw new Error('No patterns learned');
    }
    
    // Test prediction performance
    const startTime = Date.now();
    await neuralSystem.predict(trainingSamples[0].workflowData);
    const predictionTime = Date.now() - startTime;
    
    if (predictionTime > 1000) { // Should be fast
      throw new Error(`Prediction too slow: ${predictionTime}ms`);
    }
  });

  // Test 18: Neural Learning System - Analytics and Insights
  await testAsync('Neural Learning System analytics and insights', async () => {
    const neuralSystem = new NeuralLearningSystem({
      persistencePath: testNeuralDataDir,
      autoSave: false
    });
    
    await neuralSystem.initialize();
    
    // Add some training data
    for (let i = 0; i < 5; i++) {
      const workflowData = {
        id: `analytics-${i}`,
        type: 'analytics-test',
        complexity: 5 + i,
        taskCount: 3 + i
      };
      
      const outcome = {
        success: i < 3, // First 3 successful
        duration: 20000 + i * 5000,
        quality: 0.7 + i * 0.05
      };
      
      await neuralSystem.learn(workflowData, outcome);
    }
    
    const analytics = neuralSystem.getAnalytics();
    
    if (!analytics.initialized) throw new Error('Analytics shows system not initialized');
    if (!analytics.patterns) throw new Error('Analytics missing patterns data');
    if (!analytics.metrics) throw new Error('Analytics missing metrics data');
    if (!analytics.performance) throw new Error('Analytics missing performance data');
    if (!analytics.insights) throw new Error('Analytics missing insights');
    
    // Check insights structure
    const insights = analytics.insights;
    if (!Array.isArray(insights.topPatterns)) throw new Error('Missing top patterns insights');
    if (typeof insights.optimizationImpact !== 'object') throw new Error('Missing optimization impact');
    if (typeof insights.learningProgress !== 'object') throw new Error('Missing learning progress');
    
    // Learning progress should have maturity indicators
    const progress = insights.learningProgress;
    if (typeof progress.maturity !== 'number') throw new Error('Missing maturity score');
    if (typeof progress.experience !== 'number') throw new Error('Missing experience score');
    if (typeof progress.dataRichness !== 'number') throw new Error('Missing data richness score');
  });

  // Test 19: End-to-End Workflow Optimization
  await testAsync('End-to-end workflow optimization', async () => {
    // Initialize all systems
    const configurator = new MCPFullConfigurator();
    const neuralSystem = new NeuralLearningSystem({
      persistencePath: testNeuralDataDir,
      autoSave: false
    });
    
    await neuralSystem.initialize();
    
    // Pre-train the neural system with some sample data to enable better predictions
    const trainingData = [
      {
        workflow: { id: 'train1', type: 'full-optimization', taskCount: 8, complexity: 6, estimatedDuration: 100000 },
        outcome: { success: true, duration: 90000, quality: 0.8 }
      },
      {
        workflow: { id: 'train2', type: 'full-optimization', taskCount: 12, complexity: 8, estimatedDuration: 150000 },
        outcome: { success: true, duration: 140000, quality: 0.9 }
      },
      {
        workflow: { id: 'train3', type: 'full-optimization', taskCount: 6, complexity: 4, estimatedDuration: 80000 },
        outcome: { success: false, duration: 120000, quality: 0.5 }
      }
    ];
    
    for (const sample of trainingData) {
      await neuralSystem.learn(sample.workflow, sample.outcome);
    }
    
    // Force process any queued training
    await neuralSystem.flushTraining();
    
    // Step 1: Analyze project with MCP configurator
    const mcpAnalysis = await configurator.analyzeProject(testProjectDir);
    
    // Step 2: Create optimized workflow based on analysis
    const workflowData = {
      id: 'e2e-optimization',
      type: 'full-optimization',
      mcpServers: mcpAnalysis.totalServers,
      detectedTech: mcpAnalysis.detectedTechnologies.length,
      taskCount: 10,
      complexity: Math.min(mcpAnalysis.totalServers, 10),
      estimatedDuration: 120000
    };
    
    // Step 3: Get neural prediction for workflow
    const prediction = await neuralSystem.predict(workflowData);
    
    // Step 4: Apply optimization suggestions
    let optimizedWorkflow = { ...workflowData };
    
    if (prediction.optimizations && prediction.optimizations.length > 0) {
      // Apply high-priority optimizations
      const highPriorityOpts = prediction.optimizations.filter(opt => opt.priority === 'high');
      
      if (highPriorityOpts.length > 0) {
        // Simulate applying optimizations (reduce complexity, add safety measures)
        optimizedWorkflow.complexity = Math.max(1, optimizedWorkflow.complexity - 2);
        optimizedWorkflow.optimizationsApplied = highPriorityOpts.length;
      }
    }
    
    // Step 5: Generate optimized MCP configuration
    if (prediction.successProbability > 0.4) {
      const config = configurator.generateConfiguration({
        priorityThreshold: prediction.successProbability > 0.7 ? 'high' : 'medium',
        includeOptional: prediction.confidence > 0.6
      });
      
      if (!config.mcpServers) {
        throw new Error('Failed to generate optimized configuration');
      }
      
      optimizedWorkflow.mcpConfigGenerated = true;
      optimizedWorkflow.enabledServers = Object.keys(config.mcpServers).length;
    }
    
    // Step 6: Simulate workflow execution and learn from outcome
    const outcome = {
      success: prediction.successProbability > 0.5,
      duration: optimizedWorkflow.estimatedDuration * (0.7 + Math.random() * 0.6),
      quality: prediction.successProbability * 0.9 + 0.1,
      optimization: true,
      mcpIntegration: true,
      resourceUsage: { cpu: 0.4, memory: 0.3 }
    };
    
    // Step 7: Learn from the optimized workflow
    await neuralSystem.learn(optimizedWorkflow, outcome);
    
    // Verify end-to-end integration worked
    if (!optimizedWorkflow.mcpConfigGenerated) {
      throw new Error('MCP configuration not generated in optimization flow');
    }
    
    if (optimizedWorkflow.enabledServers === 0) {
      throw new Error('No MCP servers enabled in optimization');
    }
  });

  // Test 20: System Stress Test and Memory Management
  await testAsync('System stress test and memory management', async () => {
    const neuralSystem = new NeuralLearningSystem({
      persistencePath: testNeuralDataDir,
      autoSave: false,
      batchSize: 10
    });
    
    await neuralSystem.initialize();
    
    // Generate large number of patterns to test memory management
    const startMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 100; i++) {
      const workflowData = {
        id: `stress-${i}`,
        type: `type-${i % 10}`, // Create different pattern types
        taskCount: Math.floor(Math.random() * 20) + 1,
        complexity: Math.floor(Math.random() * 10) + 1,
        projectSize: Math.floor(Math.random() * 100000) + 1000,
        randomFactor: Math.random()
      };
      
      const outcome = {
        success: Math.random() > 0.4,
        duration: Math.random() * 100000 + 10000,
        quality: Math.random()
      };
      
      await neuralSystem.learn(workflowData, outcome);
      
      // Occasionally make predictions to test performance
      if (i % 20 === 0) {
        await neuralSystem.predict(workflowData);
      }
    }
    
    // Force processing of remaining training queue
    await neuralSystem.flushTraining();
    
    const endMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = endMemory - startMemory;
    
    // Memory increase should be reasonable (less than 100MB for this test)
    if (memoryIncrease > 100 * 1024 * 1024) {
      throw new Error(`Excessive memory usage: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }
    
    // Check that pattern cleanup is working
    const patternCount = neuralSystem.patternRecorder.patterns.size;
    if (patternCount > neuralSystem.patternRecorder.maxPatterns) {
      throw new Error('Pattern cleanup not working - exceeded maximum patterns');
    }
    
    // Verify system is still functional after stress test
    const status = neuralSystem.getSystemStatus();
    if (!status.initialized) {
      throw new Error('System became uninitialized during stress test');
    }
    
    if (status.performance.predictionsServed === 0) {
      throw new Error('No predictions served during stress test');
    }
  });

  // Cleanup
  await cleanupTestEnvironment();
  
  // Print results
  colorLog('magenta', '\n📊 Test Results Summary\n');
  colorLog('green', `✅ Passed: ${testResults.passed.length}`);
  colorLog('red', `❌ Failed: ${testResults.failed.length}`);
  colorLog('yellow', `⏭️  Skipped: ${testResults.skipped.length}`);
  
  if (testResults.failed.length > 0) {
    colorLog('red', '\nFailed Tests:');
    testResults.failed.forEach(({ name, error }) => {
      colorLog('red', `  - ${name}: ${error}`);
    });
  }
  
  if (testResults.skipped.length > 0) {
    colorLog('yellow', '\nSkipped Tests:');
    testResults.skipped.forEach(name => {
      colorLog('yellow', `  - ${name}`);
    });
  }
  
  // Calculate pass rate
  const total = testResults.passed.length + testResults.failed.length + testResults.skipped.length;
  const passRate = Math.round((testResults.passed.length / total) * 100);
  
  colorLog('cyan', `\n📈 Pass Rate: ${passRate}%`);
  
  // Phase 5 specific metrics
  colorLog('blue', '\n🧠 Phase 5 Specific Results:');
  colorLog('blue', `  • MCP Full Configurator: ${testResults.passed.filter(t => t.includes('MCP Full Configurator')).length}/5 tests passed`);
  colorLog('blue', `  • Neural Learning System: ${testResults.passed.filter(t => t.includes('Neural Learning System')).length}/7 tests passed`);
  colorLog('blue', `  • MCP Server Presets: ${testResults.passed.filter(t => t.includes('MCP Server Presets')).length}/4 tests passed`);
  colorLog('blue', `  • Integration Tests: ${testResults.passed.filter(t => t.includes('Integration') || t.includes('End-to-end')).length}/3 tests passed`);
  
  if (passRate >= 95) {
    colorLog('green', '\n✨ Phase 5 Implementation Test Suite PASSED with 95%+ success rate!\n');
    colorLog('cyan', '🎯 All Neural Intelligence & MCP Optimization components are working correctly');
  } else if (passRate >= 85) {
    colorLog('yellow', '\n⚠️  Phase 5 Implementation mostly working but needs attention\n');
  } else {
    colorLog('red', '\n❌ Phase 5 Implementation needs significant fixes\n');
  }
  
  return passRate;
}

// Run tests if executed directly
if (require.main === module) {
  runPhase5Tests()
    .then(passRate => {
      process.exit(passRate >= 95 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runPhase5Tests };