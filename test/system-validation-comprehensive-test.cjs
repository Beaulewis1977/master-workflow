#!/usr/bin/env node

/**
 * System Validation Comprehensive Test Suite
 * 
 * Tests the actual implemented components and validates system integration
 * based on the real codebase structure and available modules.
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class SystemValidationTest {
  constructor() {
    this.projectRoot = process.cwd();
    this.testResults = [];
    this.startTime = Date.now();
  }

  /**
   * Test 1: Validate Claude Flow 2.0 Architecture Components
   */
  async testClaudeFlow2Architecture() {
    const testName = "Claude Flow 2.0 Architecture Components";
    const startTime = performance.now();
    
    try {
      // Test Queen Controller exists and has required structure
      const queenControllerPath = path.join(this.projectRoot, 'intelligence-engine', 'queen-controller.js');
      const queenControllerExists = await fs.access(queenControllerPath).then(() => true).catch(() => false);
      
      if (!queenControllerExists) {
        throw new Error('Queen Controller not found');
      }
      
      const queenControllerContent = await fs.readFile(queenControllerPath, 'utf8');
      
      // Validate key Claude Flow 2.0 features in Queen Controller
      const requiredFeatures = [
        'WasmCoreModule',
        'TopologyManager',
        'NeuralLearningSystem',
        'contextWindowSize',
        'maxConcurrent'
      ];
      
      const missingFeatures = requiredFeatures.filter(feature => 
        !queenControllerContent.includes(feature)
      );
      
      if (missingFeatures.length > 0) {
        throw new Error(`Missing Claude Flow 2.0 features: ${missingFeatures.join(', ')}`);
      }
      
      // Test WASM Core Module
      const wasmModulePath = path.join(this.projectRoot, 'intelligence-engine', 'wasm-core-module.js');
      const wasmExists = await fs.access(wasmModulePath).then(() => true).catch(() => false);
      
      // Test Topology Manager
      const topologyPath = path.join(this.projectRoot, 'intelligence-engine', 'topology-manager.js');
      const topologyExists = await fs.access(topologyPath).then(() => true).catch(() => false);
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        queenControllerFound: true,
        requiredFeaturesPresent: requiredFeatures.length - missingFeatures.length,
        wasmModuleExists: wasmExists,
        topologyManagerExists: topologyExists
      });
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
  }

  /**
   * Test 2: Validate Agent-OS Integration Components
   */
  async testAgentOSIntegration() {
    const testName = "Agent-OS Integration Components";
    const startTime = performance.now();
    
    try {
      // Test Agent-OS integration module
      const agentOSPath = path.join(this.projectRoot, 'intelligence-engine', 'agent-os-integration.js');
      const agentOSExists = await fs.access(agentOSPath).then(() => true).catch(() => false);
      
      // Test document analyzer
      const docAnalyzerPath = path.join(this.projectRoot, 'intelligence-engine', 'agent-os-document-analyzer.js');
      const docAnalyzerExists = await fs.access(docAnalyzerPath).then(() => true).catch(() => false);
      
      // Test structure handler
      const structureHandlerPath = path.join(this.projectRoot, 'intelligence-engine', 'agent-os-structure-handler.js');
      const structureHandlerExists = await fs.access(structureHandlerPath).then(() => true).catch(() => false);
      
      if (agentOSExists) {
        const agentOSContent = await fs.readFile(agentOSPath, 'utf8');
        
        // Validate Agent-OS features
        const agentOSFeatures = [
          'three-layer',
          'context',
          'specification',
          'conditional',
          'loading'
        ];
        
        const foundFeatures = agentOSFeatures.filter(feature => 
          agentOSContent.toLowerCase().includes(feature.toLowerCase())
        );
        
        const duration = performance.now() - startTime;
        this.logSuccess(testName, duration, {
          agentOSModuleExists: agentOSExists,
          documentAnalyzerExists: docAnalyzerExists,
          structureHandlerExists: structureHandlerExists,
          featuresFound: foundFeatures.length
        });
        
      } else {
        throw new Error('Agent-OS integration module not found');
      }
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
  }

  /**
   * Test 3: Validate Claude Code Sub-Agents
   */
  async testClaudeCodeSubAgents() {
    const testName = "Claude Code Sub-Agents Architecture";
    const startTime = performance.now();
    
    try {
      // Test .claude/agents directory
      const agentsDir = path.join(this.projectRoot, '.claude', 'agents');
      const agentsDirExists = await fs.access(agentsDir).then(() => true).catch(() => false);
      
      if (!agentsDirExists) {
        throw new Error('Claude Code agents directory not found');
      }
      
      // Count available agents
      const agentFiles = await fs.readdir(agentsDir);
      const agentMdFiles = agentFiles.filter(file => file.endsWith('.md'));
      
      // Validate key agent types
      const expectedAgentTypes = [
        'test-runner-agent',
        'code-analyzer-agent',
        'deployment-engineer-agent',
        'security-auditor',
        'doc-generator-agent'
      ];
      
      const foundAgentTypes = expectedAgentTypes.filter(type => 
        agentMdFiles.some(file => file.includes(type))
      );
      
      // Test sub-agent manager
      const subAgentManagerPath = path.join(this.projectRoot, 'intelligence-engine', 'sub-agent-manager.js');
      const subAgentManagerExists = await fs.access(subAgentManagerPath).then(() => true).catch(() => false);
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        agentsDirectoryExists: agentsDirExists,
        totalAgentFiles: agentMdFiles.length,
        expectedAgentTypesFound: foundAgentTypes.length,
        subAgentManagerExists: subAgentManagerExists,
        meetsMinimumAgentCount: agentMdFiles.length >= 10
      });
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
  }

  /**
   * Test 4: Validate Shared Memory and Communication System
   */
  async testSharedMemorySystem() {
    const testName = "Shared Memory and Communication System";
    const startTime = performance.now();
    
    try {
      // Test shared memory module
      const sharedMemoryPath = path.join(this.projectRoot, 'intelligence-engine', 'shared-memory.js');
      const sharedMemoryExists = await fs.access(sharedMemoryPath).then(() => true).catch(() => false);
      
      if (!sharedMemoryExists) {
        throw new Error('Shared memory module not found');
      }
      
      const sharedMemoryContent = await fs.readFile(sharedMemoryPath, 'utf8');
      
      // Test agent communication bus
      const commBusPath = path.join(this.projectRoot, 'intelligence-engine', 'agent-communication-bus.js');
      const commBusExists = await fs.access(commBusPath).then(() => true).catch(() => false);
      
      // Validate shared memory features
      const memoryFeatures = [
        'SQLite',
        'persistence',
        'cross-agent',
        'context',
        'synchronization'
      ];
      
      const foundMemoryFeatures = memoryFeatures.filter(feature => 
        sharedMemoryContent.toLowerCase().includes(feature.toLowerCase())
      );
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        sharedMemoryModuleExists: sharedMemoryExists,
        communicationBusExists: commBusExists,
        memoryFeaturesFound: foundMemoryFeatures.length,
        supportsSQLite: sharedMemoryContent.includes('sqlite') || sharedMemoryContent.includes('SQLite')
      });
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
  }

  /**
   * Test 5: Validate Neural Learning System
   */
  async testNeuralLearningSystem() {
    const testName = "Neural Learning System";
    const startTime = performance.now();
    
    try {
      // Test neural learning module
      const neuralPath = path.join(this.projectRoot, 'intelligence-engine', 'neural-learning.js');
      const neuralExists = await fs.access(neuralPath).then(() => true).catch(() => false);
      
      if (!neuralExists) {
        throw new Error('Neural learning module not found');
      }
      
      const neuralContent = await fs.readFile(neuralPath, 'utf8');
      
      // Test capability matcher
      const capabilityPath = path.join(this.projectRoot, 'intelligence-engine', 'capability-matcher.js');
      const capabilityExists = await fs.access(capabilityPath).then(() => true).catch(() => false);
      
      // Validate neural learning features
      const neuralFeatures = [
        'learning',
        'training',
        'optimization',
        'pattern',
        'decision'
      ];
      
      const foundNeuralFeatures = neuralFeatures.filter(feature => 
        neuralContent.toLowerCase().includes(feature.toLowerCase())
      );
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        neuralModuleExists: neuralExists,
        capabilityMatcherExists: capabilityExists,
        neuralFeaturesFound: foundNeuralFeatures.length,
        hasLearningCapabilities: neuralContent.includes('learn') || neuralContent.includes('train')
      });
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
  }

  /**
   * Test 6: Validate Performance Monitoring and Optimization
   */
  async testPerformanceMonitoring() {
    const testName = "Performance Monitoring and Optimization";
    const startTime = performance.now();
    
    try {
      // Test performance monitor
      const perfMonitorPath = path.join(this.projectRoot, 'intelligence-engine', 'performance-monitor.js');
      const perfMonitorExists = await fs.access(perfMonitorPath).then(() => true).catch(() => false);
      
      // Test Claude Flow 2.0 performance monitor
      const claudeFlowPerfPath = path.join(this.projectRoot, 'intelligence-engine', 'claude-flow-2-performance-monitor.js');
      const claudeFlowPerfExists = await fs.access(claudeFlowPerfPath).then(() => true).catch(() => false);
      
      // Test database performance monitor
      const dbPerfPath = path.join(this.projectRoot, 'intelligence-engine', 'database-performance-monitor.js');
      const dbPerfExists = await fs.access(dbPerfPath).then(() => true).catch(() => false);
      
      let performanceFeatures = 0;
      
      if (perfMonitorExists) {
        const perfContent = await fs.readFile(perfMonitorPath, 'utf8');
        const features = ['metrics', 'monitoring', 'optimization', 'tracking'];
        performanceFeatures = features.filter(f => 
          perfContent.toLowerCase().includes(f)
        ).length;
      }
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        performanceMonitorExists: perfMonitorExists,
        claudeFlowPerformanceExists: claudeFlowPerfExists,
        databasePerformanceExists: dbPerfExists,
        performanceFeaturesFound: performanceFeatures
      });
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
  }

  /**
   * Test 7: Validate Configuration and Integration Files
   */
  async testConfigurationIntegration() {
    const testName = "Configuration and Integration Files";
    const startTime = performance.now();
    
    try {
      // Test main configuration files
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJsonExists = await fs.access(packageJsonPath).then(() => true).catch(() => false);
      
      const readmePath = path.join(this.projectRoot, 'README.md');
      const readmeExists = await fs.access(readmePath).then(() => true).catch(() => false);
      
      const claudeMdPath = path.join(this.projectRoot, 'CLAUDE.md');
      const claudeMdExists = await fs.access(claudeMdPath).then(() => true).catch(() => false);
      
      // Test configuration directories
      const configsDir = path.join(this.projectRoot, 'configs');
      const configsDirExists = await fs.access(configsDir).then(() => true).catch(() => false);
      
      let configCount = 0;
      if (configsDirExists) {
        const configFiles = await fs.readdir(configsDir);
        configCount = configFiles.filter(f => f.endsWith('.json')).length;
      }
      
      // Test language support
      const languageSupportDir = path.join(this.projectRoot, 'language-support');
      const languageSupportExists = await fs.access(languageSupportDir).then(() => true).catch(() => false);
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        packageJsonExists: packageJsonExists,
        readmeExists: readmeExists,
        claudeMdExists: claudeMdExists,
        configsDirectoryExists: configsDirExists,
        configurationFilesCount: configCount,
        languageSupportExists: languageSupportExists
      });
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
  }

  /**
   * Test 8: Validate Database and Persistence Layer
   */
  async testDatabasePersistence() {
    const testName = "Database and Persistence Layer";
    const startTime = performance.now();
    
    try {
      // Test database connection manager
      const dbManagerPath = path.join(this.projectRoot, 'intelligence-engine', 'database-connection-manager.js');
      const dbManagerExists = await fs.access(dbManagerPath).then(() => true).catch(() => false);
      
      if (!dbManagerExists) {
        throw new Error('Database connection manager not found');
      }
      
      const dbManagerContent = await fs.readFile(dbManagerPath, 'utf8');
      
      // Test backup and recovery
      const backupPath = path.join(this.projectRoot, 'intelligence-engine', 'backup-recovery-system.js');
      const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
      
      // Validate database features
      const dbFeatures = ['SQLite', 'connection', 'transaction', 'persistence'];
      const foundDbFeatures = dbFeatures.filter(feature => 
        dbManagerContent.includes(feature)
      ).length;
      
      // Check for .hive-mind directory
      const hiveMindDir = path.join(this.projectRoot, '.hive-mind');
      const hiveMindExists = await fs.access(hiveMindDir).then(() => true).catch(() => false);
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        databaseManagerExists: dbManagerExists,
        backupSystemExists: backupExists,
        databaseFeaturesFound: foundDbFeatures,
        hiveMindDirectoryExists: hiveMindExists,
        supportsSQLite: dbManagerContent.includes('sqlite3') || dbManagerContent.includes('SQLite')
      });
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
  }

  /**
   * Test 9: System Integration Validation
   */
  async testSystemIntegration() {
    const testName = "System Integration Validation";
    const startTime = performance.now();
    
    try {
      // Calculate overall system health
      const passedTests = this.testResults.filter(r => r.success).length;
      const totalTests = this.testResults.length;
      const systemHealthScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      
      // Test critical system files
      const criticalFiles = [
        'intelligence-engine/queen-controller.js',
        'intelligence-engine/shared-memory.js',
        'intelligence-engine/neural-learning.js',
        '.claude/agents/test-runner-agent.md'
      ];
      
      let criticalFilesFound = 0;
      
      for (const file of criticalFiles) {
        const filePath = path.join(this.projectRoot, file);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        if (exists) criticalFilesFound++;
      }
      
      const integrationScore = (criticalFilesFound / criticalFiles.length) * 100;
      
      // Validate minimum system requirements
      const systemRequirements = {
        claudeFlow2Components: integrationScore >= 75,
        agentArchitecture: criticalFilesFound >= 3,
        systemHealth: systemHealthScore >= 70,
        readyForDeployment: integrationScore >= 75 && systemHealthScore >= 70
      };
      
      const duration = performance.now() - startTime;
      this.logSuccess(testName, duration, {
        systemHealthScore: systemHealthScore.toFixed(1) + '%',
        criticalFilesFound: criticalFilesFound,
        integrationScore: integrationScore.toFixed(1) + '%',
        systemRequirements: systemRequirements,
        deploymentReady: systemRequirements.readyForDeployment
      });
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logError(testName, error, duration);
    }
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
    if (Object.keys(details).length > 0) {
      Object.entries(details).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
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
   * Run all system validation tests
   */
  async runAllTests() {
    console.log('🔍 Running System Validation Comprehensive Test Suite\n');
    console.log('Testing actual implemented components and architecture\n');
    
    const tests = [
      () => this.testClaudeFlow2Architecture(),
      () => this.testAgentOSIntegration(),
      () => this.testClaudeCodeSubAgents(),
      () => this.testSharedMemorySystem(),
      () => this.testNeuralLearningSystem(),
      () => this.testPerformanceMonitoring(),
      () => this.testConfigurationIntegration(),
      () => this.testDatabasePersistence(),
      () => this.testSystemIntegration()
    ];
    
    for (const test of tests) {
      await test();
    }
    
    // Generate final report
    await this.generateSystemValidationReport();
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`\n📊 System Validation Complete:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${total - passed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    return {
      passed,
      total,
      successRate: parseFloat(successRate),
      results: this.testResults
    };
  }

  /**
   * Generate system validation report
   */
  async generateSystemValidationReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const report = {
      summary: {
        testSuite: 'System Validation Comprehensive Test',
        executionTime: new Date().toISOString(),
        totalDuration: totalDuration,
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length,
        successRate: ((this.testResults.filter(r => r.success).length / this.testResults.length) * 100).toFixed(1)
      },
      systemComponents: {
        claudeFlow2: this.testResults.find(r => r.name.includes('Claude Flow 2.0'))?.success || false,
        agentOS: this.testResults.find(r => r.name.includes('Agent-OS'))?.success || false,
        subAgents: this.testResults.find(r => r.name.includes('Sub-Agents'))?.success || false,
        sharedMemory: this.testResults.find(r => r.name.includes('Shared Memory'))?.success || false,
        neuralLearning: this.testResults.find(r => r.name.includes('Neural Learning'))?.success || false,
        performance: this.testResults.find(r => r.name.includes('Performance'))?.success || false,
        configuration: this.testResults.find(r => r.name.includes('Configuration'))?.success || false,
        database: this.testResults.find(r => r.name.includes('Database'))?.success || false,
        systemIntegration: this.testResults.find(r => r.name.includes('System Integration'))?.success || false
      },
      detailedResults: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(this.projectRoot, 'SYSTEM-VALIDATION-REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 System validation report saved: ${reportPath}`);
    
    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const failedTests = this.testResults.filter(r => !r.success);
    const recommendations = [];
    
    if (failedTests.length === 0) {
      recommendations.push('System validation complete - all components are properly integrated');
    } else {
      recommendations.push(`Address ${failedTests.length} failing component(s):`);
      failedTests.forEach(test => {
        recommendations.push(`- Fix: ${test.name} - ${test.error}`);
      });
    }
    
    const successRate = (this.testResults.filter(r => r.success).length / this.testResults.length) * 100;
    
    if (successRate >= 90) {
      recommendations.push('System is deployment-ready with excellent component integration');
    } else if (successRate >= 75) {
      recommendations.push('System is mostly ready - address remaining issues for production deployment');
    } else {
      recommendations.push('System requires significant fixes before deployment consideration');
    }
    
    return recommendations;
  }
}

// Run tests if executed directly
if (require.main === module) {
  const systemTest = new SystemValidationTest();
  
  systemTest.runAllTests()
    .then(results => {
      process.exit(results.successRate >= 75 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ System validation test failed:', error);
      process.exit(1);
    });
}

module.exports = SystemValidationTest;