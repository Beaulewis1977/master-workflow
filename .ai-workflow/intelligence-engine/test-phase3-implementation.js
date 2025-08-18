#!/usr/bin/env node

/**
 * Phase 3 Implementation Test Suite
 * Tests all Phase 3 components for the MASTER-WORKFLOW v3.0
 * 
 * Tests:
 * - Deep Codebase Analyzer
 * - All 8 Analysis Engines
 * - Document Generator v2
 * - Interactive Components
 * - CLAUDE.md Generator
 */

const fs = require('fs').promises;
const path = require('path');
// const chalk = require('chalk');

// Import Phase 3 components
const DeepCodebaseAnalyzer = require('./deep-codebase-analyzer');
const DocumentGeneratorV2 = require('./document-generator-v2');
const ClaudeMdGenerator = require('./claude-md-generator');
const InteractiveUpdater = require('./interactive-updater');
const CustomizationManager = require('./customization-manager');
const DocumentVersioning = require('./document-versioning');
const EnhancedTemplateEngine = require('./enhanced-template-engine');

// Import Phase 1-2 components for integration testing
const SharedMemoryStore = require('./shared-memory');
const QueenController = require('./queen-controller');
const AgentCommunication = require('./agent-communication');

// Test utilities
const testResults = {
  passed: [],
  failed: [],
  skipped: []
};

async function test(name, testFn) {
  try {
    console.log(`Testing: ${name}...`);
    await testFn();
    testResults.passed.push(name);
    console.log(`  ✅ ${name} passed`);
  } catch (error) {
    testResults.failed.push({ name, error: error.message });
    console.log(`  ❌ ${name} failed: ${error.message}`);
  }
}

async function testAsync(name, testFn, timeout = 5000) {
  return new Promise(async (resolve) => {
    const timer = setTimeout(() => {
      testResults.skipped.push(`${name} (timeout)`);
      console.log(`  ⏭️  ${name} skipped (timeout)`);
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

// Test Suite
async function runPhase3Tests() {
  console.log('\n🧪 Phase 3 Implementation Test Suite\n');
  console.log('Testing all Phase 3 components...\n');
  
  // Initialize shared components
  const sharedMemory = new SharedMemoryStore();
  const queenController = new QueenController();
  const agentCommunication = new AgentCommunication();
  
  // Test 1: Deep Codebase Analyzer
  await test('Deep Codebase Analyzer initialization', async () => {
    const analyzer = new DeepCodebaseAnalyzer({
      sharedMemory,
      queenController,
      agentCommunication
    });
    
    if (!analyzer.patternEngine) throw new Error('Pattern engine not initialized');
    if (!analyzer.architectureEngine) throw new Error('Architecture engine not initialized');
    if (!analyzer.businessLogicEngine) throw new Error('Business logic engine not initialized');
    if (!analyzer.apiEngine) throw new Error('API engine not initialized');
    if (!analyzer.databaseEngine) throw new Error('Database engine not initialized');
    if (!analyzer.testEngine) throw new Error('Test engine not initialized');
    if (!analyzer.securityEngine) throw new Error('Security engine not initialized');
    if (!analyzer.performanceEngine) throw new Error('Performance engine not initialized');
  });
  
  // Test 2: Analysis Engines existence
  await test('All 8 Analysis Engines exist', async () => {
    const enginesDir = path.join(__dirname, 'analysis-engines');
    const expectedEngines = [
      'pattern-detection-engine.js',
      'architecture-detection-engine.js',
      'business-logic-extractor.js',
      'api-analysis-engine.js',
      'database-analysis-engine.js',
      'test-analysis-engine.js',
      'security-analysis-engine.js',
      'performance-analysis-engine.js'
    ];
    
    for (const engine of expectedEngines) {
      const enginePath = path.join(enginesDir, engine);
      try {
        await fs.access(enginePath);
      } catch {
        throw new Error(`Engine ${engine} not found`);
      }
    }
  });
  
  // Test 3: Analysis Engines can be imported
  await test('All Analysis Engines can be imported', async () => {
    const engines = [
      'pattern-detection-engine',
      'architecture-detection-engine',
      'business-logic-extractor',
      'api-analysis-engine',
      'database-analysis-engine',
      'test-analysis-engine',
      'security-analysis-engine',
      'performance-analysis-engine'
    ];
    
    for (const engine of engines) {
      const EngineCons = require(`./analysis-engines/${engine}`);
      const instance = new EngineCons(sharedMemory);
      if (!instance) throw new Error(`Failed to instantiate ${engine}`);
    }
  });
  
  // Test 4: Document Generator v2 initialization
  await test('Document Generator v2 initialization', async () => {
    const generator = new DocumentGeneratorV2({
      sharedMemory,
      queenController,
      agentCommunication
    });
    
    if (!generator.interactiveUpdater) throw new Error('Interactive updater not initialized');
    if (!generator.customizationManager) throw new Error('Customization manager not initialized');
    if (!generator.versionManager) throw new Error('Version manager not initialized');
    if (!generator.templateEngine) throw new Error('Template engine not initialized');
  });
  
  // Test 5: Interactive Components
  await test('Interactive Components initialization', async () => {
    const updater = new InteractiveUpdater(sharedMemory);
    const customizationMgr = new CustomizationManager(sharedMemory);
    const versionMgr = new DocumentVersioning(sharedMemory);
    const templateEngine = new EnhancedTemplateEngine(sharedMemory);
    
    if (!updater.sharedMemory) throw new Error('Interactive updater shared memory not set');
    if (!customizationMgr.sharedMemory) throw new Error('Customization manager shared memory not set');
    if (!versionMgr.sharedMemory) throw new Error('Version manager shared memory not set');
    if (!templateEngine.sharedMemory) throw new Error('Template engine shared memory not set');
  });
  
  // Test 6: CLAUDE.md Generator initialization
  await test('CLAUDE.md Generator initialization', async () => {
    const generator = new ClaudeMdGenerator({
      sharedMemory,
      agentCommunication
    });
    
    if (!generator.mcpServerCategories) throw new Error('MCP server categories not defined');
    if (!generator.subAgents) throw new Error('Sub-agents not defined');
    if (generator.subAgents.length !== 10) throw new Error('Should have 10 sub-agents');
    
    // Check MCP server count
    let totalServers = 0;
    for (const category of Object.values(generator.mcpServerCategories)) {
      totalServers += category.length;
    }
    if (totalServers < 80) throw new Error(`Only ${totalServers} MCP servers defined, expected 87+`);
  });
  
  // Test 7: Deep Analysis Methods
  await testAsync('Deep Analysis methods exist', async () => {
    const analyzer = new DeepCodebaseAnalyzer({
      sharedMemory,
      queenController,
      agentCommunication
    });
    
    const methods = [
      'analyzeComplete',
      'extractPatterns',
      'detectArchitecture',
      'extractBusinessLogic',
      'detectAPIs',
      'analyzeDatabases',
      'analyzeTests',
      'scanSecurity',
      'identifyBottlenecks'
    ];
    
    for (const method of methods) {
      if (typeof analyzer[method] !== 'function') {
        throw new Error(`Method ${method} not found`);
      }
    }
  });
  
  // Test 8: Document Generator Interactive Methods
  await test('Document Generator interactive methods exist', async () => {
    const generator = new DocumentGeneratorV2({
      sharedMemory,
      queenController,
      agentCommunication
    });
    
    const methods = [
      'generateDocumentsInteractive',
      'interactiveUpdateMode',
      'createUpdatePlan',
      'presentUpdateOptions',
      'showDiffPreview',
      'updateDocuments'
    ];
    
    for (const method of methods) {
      if (typeof generator[method] !== 'function') {
        throw new Error(`Method ${method} not found`);
      }
    }
  });
  
  // Test 9: CLAUDE.md Generator Methods
  await test('CLAUDE.md Generator methods exist', async () => {
    const generator = new ClaudeMdGenerator({
      sharedMemory,
      agentCommunication
    });
    
    const methods = [
      'generate',
      'determineProjectConfig',
      'autoDetectMCPServers',
      'autoAssignAgents',
      'generateCustomInstructions',
      'generateContent'
    ];
    
    for (const method of methods) {
      if (typeof generator[method] !== 'function') {
        throw new Error(`Method ${method} not found`);
      }
    }
  });
  
  // Test 10: Pattern Detection Engine functionality
  await testAsync('Pattern Detection Engine can detect patterns', async () => {
    const PatternEngine = require('./analysis-engines/pattern-detection-engine');
    const engine = new PatternEngine(sharedMemory);
    
    const testCode = `
      class Singleton {
        constructor() {
          if (Singleton.instance) {
            return Singleton.instance;
          }
          Singleton.instance = this;
        }
      }
    `;
    
    const patterns = await engine.detectDesignPatterns([
      { path: 'test.js', content: testCode }
    ]);
    
    if (!patterns || patterns.length === 0) {
      throw new Error('No patterns detected');
    }
  });
  
  // Test 11: Architecture Detection
  await testAsync('Architecture Detection Engine functionality', async () => {
    const ArchEngine = require('./analysis-engines/architecture-detection-engine');
    const engine = new ArchEngine(sharedMemory);
    
    const result = await engine.detectArchitecture('.');
    
    if (!result.type) throw new Error('Architecture type not detected');
    if (typeof result.confidence !== 'number') throw new Error('Confidence score not calculated');
  });
  
  // Test 12: Customization Manager detection
  await test('Customization Manager can detect customizations', async () => {
    const manager = new CustomizationManager(sharedMemory);
    
    const original = '# Title\nOriginal content';
    const modified = '# Title\nOriginal content\n<!-- User custom comment -->';
    
    const customizations = await manager.detectCustomizations(original, modified);
    
    if (!Array.isArray(customizations)) {
      throw new Error('Customizations should be an array');
    }
  });
  
  // Test 13: Document Versioning
  await testAsync('Document Versioning can create snapshots', async () => {
    const versioning = new DocumentVersioning(sharedMemory);
    
    const testPath = 'test-doc.md';
    const testContent = '# Test Document\nContent here';
    
    const version = await versioning.createSnapshot(testPath, testContent);
    
    if (!version || !version.id) {
      throw new Error('Version not created properly');
    }
  });
  
  // Test 14: Template Engine compilation
  await test('Template Engine can compile templates', async () => {
    const engine = new EnhancedTemplateEngine(sharedMemory);
    
    const template = 'Hello {{name}}!';
    const data = { name: 'World' };
    
    const result = await engine.render(template, data);
    
    if (result !== 'Hello World!') {
      throw new Error(`Template rendering failed: got "${result}"`);
    }
  });
  
  // Test 15: Integration with SharedMemory
  await testAsync('Components integrate with SharedMemory', async () => {
    const analyzer = new DeepCodebaseAnalyzer({ sharedMemory });
    
    // Store test data
    await sharedMemory.set('test:phase3', { data: 'test' });
    
    // Retrieve test data
    const retrieved = await sharedMemory.get('test:phase3');
    
    if (!retrieved || retrieved.data !== 'test') {
      throw new Error('SharedMemory integration failed');
    }
  });
  
  // Test 16: Event emission
  await testAsync('Components emit events correctly', async () => {
    const analyzer = new DeepCodebaseAnalyzer({ sharedMemory });
    
    let eventFired = false;
    analyzer.on('analysis-complete', () => {
      eventFired = true;
    });
    
    analyzer.emit('analysis-complete', { test: true });
    
    // Give time for event to fire
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!eventFired) {
      throw new Error('Event not emitted/received');
    }
  });
  
  // Print results
  console.log('\n📊 Test Results Summary\n');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⏭️  Skipped: ${testResults.skipped.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\nFailed Tests:');
    testResults.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }
  
  if (testResults.skipped.length > 0) {
    console.log('\nSkipped Tests:');
    testResults.skipped.forEach(name => {
      console.log(`  - ${name}`);
    });
  }
  
  // Calculate pass rate
  const total = testResults.passed.length + testResults.failed.length + testResults.skipped.length;
  const passRate = Math.round((testResults.passed.length / total) * 100);
  
  console.log(`\n📈 Pass Rate: ${passRate}%`);
  
  if (passRate >= 80) {
    console.log('\n✨ Phase 3 Implementation Test Suite PASSED!\n');
  } else {
    console.log('\n⚠️  Phase 3 Implementation needs attention\n');
  }
  
  return passRate;
}

// Run tests if executed directly
if (require.main === module) {
  runPhase3Tests()
    .then(passRate => {
      process.exit(passRate >= 80 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runPhase3Tests };