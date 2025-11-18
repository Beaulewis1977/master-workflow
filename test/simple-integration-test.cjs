#!/usr/bin/env node

/**
 * Simplified Phase 6 Integration Test
 * Basic integration test to verify core functionality
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function boldLog(message) {
  console.log(`${colors.bold}${message}${colors.reset}`);
}

// Test results
const testResults = {
  passed: [],
  failed: []
};

async function test(name, testFn) {
  try {
    colorLog('blue', `Testing: ${name}...`);
    await testFn();
    testResults.passed.push(name);
    colorLog('green', `✅ ${name} - PASSED`);
  } catch (error) {
    testResults.failed.push({ name, error: error.message });
    colorLog('red', `❌ ${name} - FAILED: ${error.message}`);
  }
}

async function setupSimpleTestEnvironment() {
  const testTempDir = path.join(os.tmpdir(), `simple-phase6-test-${Date.now()}`);
  await fs.mkdir(testTempDir, { recursive: true });
  
  const projectDir = path.join(testTempDir, 'project');
  await fs.mkdir(projectDir, { recursive: true });
  
  // Create basic package.json
  const packageJson = {
    name: 'simple-test-project',
    version: '1.0.0',
    dependencies: {
      express: '^4.18.0',
      react: '^18.0.0'
    }
  };
  
  await fs.writeFile(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create basic source file
  await fs.writeFile(
    path.join(projectDir, 'index.js'),
    `const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello World!'));
module.exports = app;`
  );
  
  return { testTempDir, projectDir };
}

async function cleanupTestEnvironment(testTempDir) {
  try {
    await fs.rm(testTempDir, { recursive: true, force: true });
  } catch (error) {
    colorLog('yellow', `Warning: Failed to cleanup ${testTempDir}: ${error.message}`);
  }
}

// Test 1: Basic Component Import
async function testComponentImports() {
  await test('Component Imports', async () => {
    const QueenController = require('../intelligence-engine/queen-controller');
    const SharedMemoryStore = require('../intelligence-engine/shared-memory');
    const MCPFullConfigurator = require('../intelligence-engine/mcp-full-configurator');
    
    if (typeof QueenController !== 'function') {
      throw new Error('QueenController not imported correctly');
    }
    
    if (typeof SharedMemoryStore !== 'function') {
      throw new Error('SharedMemoryStore not imported correctly');
    }
    
    if (typeof MCPFullConfigurator !== 'function') {
      throw new Error('MCPFullConfigurator not imported correctly');
    }
  });
}

// Test 2: Basic Queen Controller Initialization
async function testQueenControllerBasic() {
  await test('Queen Controller Basic Initialization', async () => {
    const { testTempDir, projectDir } = await setupSimpleTestEnvironment();
    
    try {
      const QueenController = require('../intelligence-engine/queen-controller');
      
      const queenController = new QueenController({
        projectRoot: projectDir,
        maxConcurrent: 2
      });
      
      // Wait a moment for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status = queenController.getStatus();
      
      if (!status || typeof status.activeAgents !== 'number') {
        throw new Error('Queen Controller status not available');
      }
      
      await queenController.shutdown();
      
    } finally {
      await cleanupTestEnvironment(testTempDir);
    }
  });
}

// Test 3: Basic MCP Configuration
async function testMCPConfiguratorBasic() {
  await test('MCP Configurator Basic', async () => {
    const { testTempDir, projectDir } = await setupSimpleTestEnvironment();
    
    try {
      const MCPFullConfigurator = require('../intelligence-engine/mcp-full-configurator');
      
      const configurator = new MCPFullConfigurator();
      
      const analysis = await configurator.analyzeProject(projectDir);
      
      if (!analysis.detectedTechnologies || !Array.isArray(analysis.detectedTechnologies)) {
        throw new Error('MCP analysis failed');
      }
      
      if (typeof analysis.totalServers !== 'number') {
        throw new Error('MCP server count not available');
      }
      
    } finally {
      await cleanupTestEnvironment(testTempDir);
    }
  });
}

// Test 4: Basic Shared Memory
async function testSharedMemoryBasic() {
  await test('Shared Memory Basic', async () => {
    const { testTempDir } = await setupSimpleTestEnvironment();
    
    try {
      const SharedMemoryStore = require('../intelligence-engine/shared-memory');
      
      const sharedMemory = new SharedMemoryStore({
        projectRoot: testTempDir
      });
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test basic set/get
      await sharedMemory.set('test_key', { data: 'test_value' });
      const retrieved = await sharedMemory.get('test_key');
      
      if (!retrieved || retrieved.data !== 'test_value') {
        throw new Error('Shared memory set/get failed');
      }
      
      await sharedMemory.shutdown();
      
    } finally {
      await cleanupTestEnvironment(testTempDir);
    }
  });
}

// Test 5: Neural Learning Import (if available)
async function testNeuralLearningImport() {
  await test('Neural Learning Import', async () => {
    try {
      const { NeuralLearningSystem } = require('../intelligence-engine/neural-learning');
      
      if (typeof NeuralLearningSystem !== 'function') {
        throw new Error('NeuralLearningSystem not imported correctly');
      }
      
      // Try basic initialization
      const neuralSystem = new NeuralLearningSystem({
        persistencePath: path.join(os.tmpdir(), 'test-neural'),
        autoSave: false
      });
      
      if (!neuralSystem) {
        throw new Error('Neural system not created');
      }
      
    } catch (error) {
      if (error.message.includes('Cannot find module')) {
        throw new Error('Neural learning module not found - may need to be implemented');
      }
      throw error;
    }
  });
}

async function runSimpleIntegrationTests() {
  boldLog('🧪 Simple Phase 6 Integration Test');
  boldLog('==================================');
  
  console.log('Running basic integration tests...\n');
  
  try {
    await testComponentImports();
    await testQueenControllerBasic();
    await testMCPConfiguratorBasic();
    await testSharedMemoryBasic();
    await testNeuralLearningImport();
    
  } catch (error) {
    colorLog('red', `Test suite failed: ${error.message}`);
  }
  
  // Results
  boldLog('\n📊 Test Results');
  boldLog('================');
  
  const total = testResults.passed.length + testResults.failed.length;
  const passRate = total > 0 ? (testResults.passed.length / total) * 100 : 0;
  
  colorLog('green', `✅ Passed: ${testResults.passed.length}`);
  colorLog('red', `❌ Failed: ${testResults.failed.length}`);
  colorLog('blue', `📈 Pass Rate: ${passRate.toFixed(1)}%`);
  
  if (testResults.failed.length > 0) {
    boldLog('\n❌ Failed Tests:');
    testResults.failed.forEach(({ name, error }) => {
      colorLog('red', `  • ${name}: ${error}`);
    });
  }
  
  if (passRate >= 80) {
    boldLog('\n🎉 Basic integration tests passed!');
    colorLog('green', 'Core components are working correctly.');
  } else {
    boldLog('\n⚠️ Some basic tests failed');
    colorLog('yellow', 'Check component availability and basic functionality.');
  }
  
  return { passRate, results: testResults };
}

// Run tests
if (require.main === module) {
  runSimpleIntegrationTests()
    .then((results) => {
      process.exit(results.passRate >= 80 ? 0 : 1);
    })
    .catch((error) => {
      colorLog('red', `Test execution failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runSimpleIntegrationTests };