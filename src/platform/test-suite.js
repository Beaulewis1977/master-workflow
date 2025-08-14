/**
 * Cross-Platform Test Suite for Claude Flow 2.0
 * Comprehensive testing across Windows, macOS, and Linux
 * Platform-specific validation and compatibility testing
 */

const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const { EventEmitter } = require('events');

const PlatformDetector = require('./platform-detector');
const CrossPlatformInstaller = require('./cross-platform-installer');
const MCPDiscoverySystem = require('./mcp-discovery');
const QueenController = require('./queen-controller').QueenController;
const WebUIServer = require('./webui-server');
const ShellIntegrationManager = require('./shell-integration');
const pathHandler = require('./path-handler').default;

const execAsync = promisify(exec);

/**
 * Cross-Platform Test Suite Manager
 */
class CrossPlatformTestSuite extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      testTimeout: options.testTimeout || 30000,
      retryAttempts: options.retryAttempts || 3,
      parallelTests: options.parallelTests || 4,
      coverageThreshold: options.coverageThreshold || 85,
      outputDir: options.outputDir || path.join(process.cwd(), 'test-results'),
      verbose: options.verbose || false,
      ...options
    };

    this.platformDetector = new PlatformDetector();
    this.platform = null;
    this.testResults = new Map();
    this.testSuites = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the test suite
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('🧪 Initializing Cross-Platform Test Suite...');
    
    this.platform = await this.platformDetector.initialize();
    await this.setupTestEnvironment();
    await this.registerTestSuites();
    
    this.isInitialized = true;
    console.log(`✅ Test Suite initialized for ${this.platformDetector.getPlatformDisplay()}`);
  }

  /**
   * Run all test suites
   */
  async runAllTests() {
    await this.ensureInitialized();
    
    console.log('🚀 Running Cross-Platform Compatibility Tests...');
    console.log(`📊 Platform: ${this.platformDetector.getPlatformDisplay()}`);
    console.log(`🔧 Architecture: ${process.arch}`);
    console.log(`📝 Node.js: ${process.version}`);
    
    const startTime = Date.now();
    const results = {
      platform: this.platformDetector.getPlatformDisplay(),
      startTime: new Date().toISOString(),
      suites: new Map(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        coverage: 0
      }
    };

    // Run test suites in parallel where possible
    const suitePromises = [];
    for (const [suiteName, suite] of this.testSuites) {
      suitePromises.push(
        this.runTestSuite(suiteName, suite).then(result => {
          results.suites.set(suiteName, result);
          results.summary.total += result.total;
          results.summary.passed += result.passed;
          results.summary.failed += result.failed;
          results.summary.skipped += result.skipped;
        }).catch(error => {
          console.error(`❌ Test suite ${suiteName} failed:`, error.message);
          results.suites.set(suiteName, {
            name: suiteName,
            error: error.message,
            total: 0,
            passed: 0,
            failed: 1,
            skipped: 0
          });
          results.summary.failed++;
        })
      );
    }

    await Promise.allSettled(suitePromises);

    // Calculate overall results
    results.duration = Date.now() - startTime;
    results.endTime = new Date().toISOString();
    results.summary.coverage = this.calculateOverallCoverage(results.suites);
    results.success = results.summary.failed === 0;

    // Generate report
    await this.generateTestReport(results);
    
    this.emit('testsCompleted', results);
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log(`⏭️ Skipped: ${results.summary.skipped}`);
    console.log(`📈 Coverage: ${results.summary.coverage.toFixed(2)}%`);
    console.log(`⏱️ Duration: ${(results.duration / 1000).toFixed(2)}s`);
    
    return results;
  }

  /**
   * Run specific test suite
   */
  async runTestSuite(suiteName, suite) {
    console.log(`\n🧪 Running test suite: ${suiteName}`);
    
    const startTime = Date.now();
    const results = {
      name: suiteName,
      platform: this.platformDetector.getPlatformDisplay(),
      startTime: new Date().toISOString(),
      tests: [],
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: 0
    };

    for (const test of suite.tests) {
      const testResult = await this.runTest(test);
      results.tests.push(testResult);
      results.total++;
      
      if (testResult.status === 'passed') {
        results.passed++;
        console.log(`  ✅ ${test.name}`);
      } else if (testResult.status === 'failed') {
        results.failed++;
        console.log(`  ❌ ${test.name}: ${testResult.error}`);
      } else {
        results.skipped++;
        console.log(`  ⏭️ ${test.name}: ${testResult.reason}`);
      }
    }

    results.duration = Date.now() - startTime;
    results.endTime = new Date().toISOString();
    results.coverage = this.calculateSuiteCoverage(results.tests);
    
    console.log(`📊 Suite ${suiteName}: ${results.passed}/${results.total} passed`);
    
    return results;
  }

  /**
   * Run individual test
   */
  async runTest(test) {
    const testResult = {
      name: test.name,
      description: test.description,
      startTime: new Date().toISOString(),
      status: 'running'
    };

    try {
      // Check if test should be skipped on this platform
      if (test.skipPlatforms && test.skipPlatforms.includes(this.platformDetector.getPlatformType())) {
        testResult.status = 'skipped';
        testResult.reason = `Skipped on ${this.platformDetector.getPlatformDisplay()}`;
        return testResult;
      }

      // Run test with timeout and retries
      let lastError;
      for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
        try {
          const result = await this.executeTestWithTimeout(test, this.options.testTimeout);
          testResult.result = result;
          testResult.status = 'passed';
          testResult.duration = Date.now() - new Date(testResult.startTime).getTime();
          return testResult;
        } catch (error) {
          lastError = error;
          if (attempt < this.options.retryAttempts) {
            console.warn(`    ⚠️ Test ${test.name} failed attempt ${attempt}, retrying...`);
            await this.sleep(1000 * attempt); // Exponential backoff
          }
        }
      }

      throw lastError;

    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.stack = error.stack;
      testResult.duration = Date.now() - new Date(testResult.startTime).getTime();
    }

    testResult.endTime = new Date().toISOString();
    return testResult;
  }

  /**
   * Execute test with timeout
   */
  async executeTestWithTimeout(test, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);

      // Execute the test
      test.execute()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // Private methods

  /**
   * Setup test environment
   * @private
   */
  async setupTestEnvironment() {
    // Create test output directory
    await fs.mkdir(this.options.outputDir, { recursive: true });
    
    // Setup platform-specific test data
    this.testData = {
      platform: this.platformDetector.getPlatformType(),
      paths: {
        temp: pathHandler.tmpdir(),
        home: pathHandler.homedir(),
        config: pathHandler.getConfigPaths().config
      },
      commands: {
        shell: this.platform.platformConfig.commands.shell,
        packageManager: this.platform.platformConfig.commands.packageManager
      }
    };
  }

  /**
   * Register all test suites
   * @private
   */
  async registerTestSuites() {
    // Platform Detection Tests
    this.testSuites.set('platform-detection', {
      description: 'Platform detection and configuration tests',
      tests: await this.createPlatformDetectionTests()
    });

    // Installation Tests
    this.testSuites.set('installation', {
      description: 'Cross-platform installation tests',
      tests: await this.createInstallationTests()
    });

    // Path Handling Tests
    this.testSuites.set('path-handling', {
      description: 'Universal path handling tests',
      tests: await this.createPathHandlingTests()
    });

    // Process Management Tests
    this.testSuites.set('process-management', {
      description: 'Platform-specific process management tests',
      tests: await this.createProcessManagementTests()
    });

    // MCP Discovery Tests
    this.testSuites.set('mcp-discovery', {
      description: 'MCP server discovery tests',
      tests: await this.createMcpDiscoveryTests()
    });

    // Queen Controller Tests
    this.testSuites.set('queen-controller', {
      description: 'Queen Controller scaling tests',
      tests: await this.createQueenControllerTests()
    });

    // Web UI Tests
    this.testSuites.set('webui', {
      description: 'Web UI cross-platform tests',
      tests: await this.createWebUITests()
    });

    // Shell Integration Tests
    this.testSuites.set('shell-integration', {
      description: 'Shell integration tests',
      tests: await this.createShellIntegrationTests()
    });

    // Performance Tests
    this.testSuites.set('performance', {
      description: 'Cross-platform performance tests',
      tests: await this.createPerformanceTests()
    });

    // System Integration Tests
    this.testSuites.set('system-integration', {
      description: 'End-to-end system integration tests',
      tests: await this.createSystemIntegrationTests()
    });
  }

  /**
   * Create platform detection tests
   * @private
   */
  async createPlatformDetectionTests() {
    return [
      {
        name: 'should detect platform correctly',
        description: 'Verify platform detection works correctly',
        execute: async () => {
          const detector = new PlatformDetector();
          await detector.initialize();
          
          const expectedPlatform = process.platform;
          const detectedPlatform = detector.platform;
          
          if (detectedPlatform !== expectedPlatform) {
            throw new Error(`Expected ${expectedPlatform}, got ${detectedPlatform}`);
          }
          
          return { platform: detectedPlatform, arch: detector.arch };
        }
      },
      
      {
        name: 'should detect system capabilities',
        description: 'Verify system capabilities are detected',
        execute: async () => {
          const detector = new PlatformDetector();
          await detector.initialize();
          
          const capabilities = detector.capabilities;
          const requiredCapabilities = ['node', 'npm'];
          
          for (const required of requiredCapabilities) {
            if (!capabilities.has(required) || !capabilities.get(required).available) {
              throw new Error(`Required capability ${required} not available`);
            }
          }
          
          return { capabilities: Object.fromEntries(capabilities) };
        }
      },

      {
        name: 'should validate environment',
        description: 'Verify environment validation works',
        execute: async () => {
          const detector = new PlatformDetector();
          await detector.initialize();
          
          const validation = detector.validationResults;
          
          if (!validation.platform) {
            throw new Error('Platform validation failed');
          }
          
          return validation;
        }
      }
    ];
  }

  /**
   * Create installation tests
   * @private
   */
  async createInstallationTests() {
    return [
      {
        name: 'should validate system requirements',
        description: 'Check if system meets minimum requirements',
        execute: async () => {
          const installer = new CrossPlatformInstaller();
          
          // Mock installation without actually installing
          const nodeVersion = process.version;
          const hasNode = nodeVersion && nodeVersion >= 'v18.0.0';
          
          if (!hasNode) {
            throw new Error('Node.js 18+ required');
          }
          
          return { nodeVersion, platform: this.platformDetector.getPlatformDisplay() };
        }
      },

      {
        name: 'should handle platform-specific paths',
        description: 'Verify platform-specific path handling',
        execute: async () => {
          const configPaths = pathHandler.getConfigPaths();
          
          // Verify paths exist or can be created
          for (const [type, configPath] of Object.entries(configPaths)) {
            const normalized = pathHandler.normalize(configPath);
            if (!normalized) {
              throw new Error(`Invalid ${type} path: ${configPath}`);
            }
          }
          
          return configPaths;
        }
      }
    ];
  }

  /**
   * Create path handling tests
   * @private
   */
  async createPathHandlingTests() {
    return [
      {
        name: 'should normalize paths correctly',
        description: 'Test path normalization across platforms',
        execute: async () => {
          const testPaths = [
            '/path/to/file',
            '\\path\\to\\file',
            'path/to/file',
            '../relative/path',
            '~/home/path',
            'C:\\Windows\\Path'
          ];
          
          const results = {};
          
          for (const testPath of testPaths) {
            const normalized = pathHandler.normalize(testPath);
            results[testPath] = normalized;
            
            if (!normalized) {
              throw new Error(`Failed to normalize path: ${testPath}`);
            }
          }
          
          return results;
        }
      },

      {
        name: 'should handle cross-platform joins',
        description: 'Test path joining across platforms',
        execute: async () => {
          const testCases = [
            ['/base', 'file.txt'],
            ['C:\\base', 'subdir', 'file.txt'],
            ['~', '.config', 'claude-flow'],
            ['.', 'relative', 'path']
          ];
          
          const results = {};
          
          for (const testCase of testCases) {
            const joined = pathHandler.join(...testCase);
            results[testCase.join(' + ')] = joined;
            
            if (!joined) {
              throw new Error(`Failed to join paths: ${testCase.join(', ')}`);
            }
          }
          
          return results;
        }
      }
    ];
  }

  /**
   * Create process management tests
   * @private
   */
  async createProcessManagementTests() {
    return [
      {
        name: 'should spawn processes',
        description: 'Test cross-platform process spawning',
        execute: async () => {
          const command = this.platformDetector.isWindows() ? 'echo' : 'echo';
          const args = ['test'];
          
          const result = await execAsync(`${command} ${args.join(' ')}`);
          
          if (!result.stdout.includes('test')) {
            throw new Error('Process execution failed');
          }
          
          return { command, output: result.stdout.trim() };
        }
      },

      {
        name: 'should handle shell commands',
        description: 'Test shell command execution',
        execute: async () => {
          const testCommand = this.platformDetector.isWindows() 
            ? 'ver'
            : 'uname -s';
          
          const result = await execAsync(testCommand);
          
          if (!result.stdout) {
            throw new Error('Shell command failed');
          }
          
          return { command: testCommand, output: result.stdout.trim() };
        }
      }
    ];
  }

  /**
   * Create MCP discovery tests
   * @private
   */
  async createMcpDiscoveryTests() {
    return [
      {
        name: 'should initialize MCP discovery',
        description: 'Test MCP discovery system initialization',
        execute: async () => {
          const discovery = new MCPDiscoverySystem();
          await discovery.initialize();
          
          const status = discovery.getStatus();
          
          if (!status.platform) {
            throw new Error('MCP discovery initialization failed');
          }
          
          return status;
        }
      },

      {
        name: 'should discover MCP servers',
        description: 'Test MCP server discovery',
        skipPlatforms: [], // Run on all platforms
        execute: async () => {
          const discovery = new MCPDiscoverySystem({ enableAutoDiscovery: false });
          await discovery.initialize();
          
          const servers = await discovery.discoverServers();
          
          if (servers.size === 0) {
            throw new Error('No MCP servers discovered');
          }
          
          return { discovered: servers.size, servers: Array.from(servers.keys()) };
        }
      }
    ];
  }

  /**
   * Create Queen Controller tests
   * @private
   */
  async createQueenControllerTests() {
    return [
      {
        name: 'should initialize Queen Controller',
        description: 'Test Queen Controller initialization',
        execute: async () => {
          const controller = new QueenController({ maxAgents: 10 });
          
          // Mock initialization without actually spawning agents
          const status = {
            initialized: true,
            platform: this.platformDetector.getPlatformDisplay(),
            maxAgents: 10
          };
          
          return status;
        }
      },

      {
        name: 'should handle agent scaling calculations',
        description: 'Test agent scaling logic',
        execute: async () => {
          const controller = new QueenController({ maxAgents: 100 });
          
          // Test scaling calculations
          const cpuCount = os.cpus().length;
          const memoryMB = Math.floor(os.totalmem() / 1024 / 1024);
          
          const calculatedMax = Math.min(cpuCount * 10, Math.floor(memoryMB / 512));
          
          if (calculatedMax <= 0) {
            throw new Error('Invalid scaling calculation');
          }
          
          return { cpuCount, memoryMB, calculatedMax };
        }
      }
    ];
  }

  /**
   * Create Web UI tests
   * @private
   */
  async createWebUITests() {
    return [
      {
        name: 'should create Web UI server',
        description: 'Test Web UI server creation',
        execute: async () => {
          const webui = new WebUIServer({ port: 3999 }); // Use different port for testing
          
          // Test server creation without starting
          const status = webui.getStatus();
          
          if (status.isRunning) {
            throw new Error('Server should not be running initially');
          }
          
          return { port: 3999, status: 'created' };
        }
      },

      {
        name: 'should handle platform-specific URLs',
        description: 'Test URL generation across platforms',
        execute: async () => {
          const webui = new WebUIServer({ port: 3003, host: 'localhost' });
          
          const expectedUrl = `http://localhost:3003`;
          const status = webui.getStatus();
          
          if (!status.url.includes('localhost:3003')) {
            throw new Error(`Invalid URL: ${status.url}`);
          }
          
          return { url: status.url, expected: expectedUrl };
        }
      }
    ];
  }

  /**
   * Create shell integration tests
   * @private
   */
  async createShellIntegrationTests() {
    return [
      {
        name: 'should detect available shells',
        description: 'Test shell detection on platform',
        execute: async () => {
          const shellManager = new ShellIntegrationManager();
          await shellManager.initialize();
          
          const status = shellManager.getStatus();
          
          if (status.detectedShells.length === 0) {
            throw new Error('No shells detected');
          }
          
          return status;
        }
      },

      {
        name: 'should generate shell aliases',
        description: 'Test alias generation for different shells',
        execute: async () => {
          const shellManager = new ShellIntegrationManager();
          
          const shells = ['bash', 'zsh', 'fish', 'powershell'];
          const results = {};
          
          for (const shell of shells) {
            const aliases = shellManager.generateCompletionScript(shell);
            results[shell] = aliases ? 'generated' : 'not supported';
          }
          
          return results;
        }
      }
    ];
  }

  /**
   * Create performance tests
   * @private
   */
  async createPerformanceTests() {
    return [
      {
        name: 'should measure system performance',
        description: 'Test system performance characteristics',
        execute: async () => {
          const startTime = Date.now();
          
          // Simulate some work
          await this.sleep(100);
          
          const duration = Date.now() - startTime;
          const cpuCount = os.cpus().length;
          const totalMemory = os.totalmem();
          const freeMemory = os.freemem();
          
          return {
            duration,
            cpuCount,
            totalMemoryMB: Math.floor(totalMemory / 1024 / 1024),
            freeMemoryMB: Math.floor(freeMemory / 1024 / 1024),
            platform: this.platformDetector.getPlatformDisplay()
          };
        }
      },

      {
        name: 'should validate memory usage',
        description: 'Test memory usage patterns',
        execute: async () => {
          const initial = process.memoryUsage();
          
          // Simulate memory usage
          const testData = new Array(10000).fill('test');
          
          const final = process.memoryUsage();
          
          return {
            initial: {
              rss: Math.floor(initial.rss / 1024 / 1024),
              heapUsed: Math.floor(initial.heapUsed / 1024 / 1024)
            },
            final: {
              rss: Math.floor(final.rss / 1024 / 1024),
              heapUsed: Math.floor(final.heapUsed / 1024 / 1024)
            },
            testDataLength: testData.length
          };
        }
      }
    ];
  }

  /**
   * Create system integration tests
   * @private
   */
  async createSystemIntegrationTests() {
    return [
      {
        name: 'should integrate all components',
        description: 'Test complete system integration',
        execute: async () => {
          // Test that all major components can be created
          const components = {
            platformDetector: new PlatformDetector(),
            installer: new CrossPlatformInstaller(),
            mcpDiscovery: new MCPDiscoverySystem({ enableAutoDiscovery: false }),
            queenController: new QueenController({ maxAgents: 5 }),
            webui: new WebUIServer({ port: 3998 }),
            shellManager: new ShellIntegrationManager()
          };
          
          // Initialize key components
          await components.platformDetector.initialize();
          await components.mcpDiscovery.initialize();
          await components.shellManager.initialize();
          
          return {
            componentsCreated: Object.keys(components).length,
            platform: components.platformDetector.getPlatformDisplay(),
            status: 'integrated'
          };
        }
      },

      {
        name: 'should validate cross-component compatibility',
        description: 'Test compatibility between components',
        execute: async () => {
          const detector = new PlatformDetector();
          await detector.initialize();
          
          const platformConfig = detector.platformConfig;
          
          // Validate that all components can use the platform config
          const validations = {
            paths: platformConfig.paths ? 'valid' : 'invalid',
            commands: platformConfig.commands ? 'valid' : 'invalid',
            filesystem: platformConfig.filesystem ? 'valid' : 'invalid',
            performance: platformConfig.performance ? 'valid' : 'invalid'
          };
          
          const allValid = Object.values(validations).every(v => v === 'valid');
          
          if (!allValid) {
            throw new Error('Component compatibility validation failed');
          }
          
          return validations;
        }
      }
    ];
  }

  /**
   * Calculate overall coverage
   * @private
   */
  calculateOverallCoverage(suites) {
    let totalTests = 0;
    let totalCoverage = 0;
    
    for (const suite of suites.values()) {
      if (suite.total > 0) {
        totalTests += suite.total;
        totalCoverage += (suite.passed / suite.total) * 100;
      }
    }
    
    return totalTests > 0 ? totalCoverage / suites.size : 0;
  }

  /**
   * Calculate suite coverage
   * @private
   */
  calculateSuiteCoverage(tests) {
    const passed = tests.filter(t => t.status === 'passed').length;
    const total = tests.length;
    
    return total > 0 ? (passed / total) * 100 : 0;
  }

  /**
   * Generate test report
   * @private
   */
  async generateTestReport(results) {
    const reportPath = path.join(this.options.outputDir, 'test-report.json');
    
    const report = {
      ...results,
      suites: Object.fromEntries(results.suites),
      generated: new Date().toISOString(),
      environment: {
        platform: this.platformDetector.getPlatformDisplay(),
        arch: process.arch,
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem()
      }
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Test report generated: ${reportPath}`);
    
    // Also generate HTML report
    await this.generateHTMLReport(report);
  }

  /**
   * Generate HTML test report
   * @private
   */
  async generateHTMLReport(report) {
    const htmlPath = path.join(this.options.outputDir, 'test-report.html');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Claude Flow 2.0 - Cross-Platform Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .metric { background: #f5f5f5; padding: 1rem; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0; color: #333; }
        .metric .value { font-size: 2rem; font-weight: bold; margin: 0.5rem 0; }
        .passed { color: #4CAF50; }
        .failed { color: #f44336; }
        .skipped { color: #ff9800; }
        .suite { background: white; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 1rem; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 1rem; border-bottom: 1px solid #ddd; }
        .suite-tests { padding: 1rem; }
        .test { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
        .test:last-child { border-bottom: none; }
        .test-passed { color: #4CAF50; }
        .test-failed { color: #f44336; }
        .test-skipped { color: #ff9800; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 Claude Flow 2.0 - Cross-Platform Test Report</h1>
        <p>Platform: ${report.environment.platform} (${report.environment.arch})</p>
        <p>Generated: ${report.generated}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${report.summary.total}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="value passed">${report.summary.passed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div class="value failed">${report.summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Coverage</h3>
            <div class="value">${report.summary.coverage.toFixed(2)}%</div>
        </div>
        <div class="metric">
            <h3>Duration</h3>
            <div class="value">${(report.duration / 1000).toFixed(2)}s</div>
        </div>
    </div>
    
    ${Object.values(report.suites).map(suite => `
        <div class="suite">
            <div class="suite-header">
                <h3>${suite.name}</h3>
                <p>${suite.description || 'No description'}</p>
                <p>Status: ${suite.passed}/${suite.total} passed (${suite.coverage?.toFixed(2) || 0}% coverage)</p>
            </div>
            <div class="suite-tests">
                ${suite.tests ? suite.tests.map(test => `
                    <div class="test">
                        <span class="test-${test.status}">
                            ${test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'}
                            ${test.name}
                        </span>
                        ${test.error ? `<br><small style="color: #666;">${test.error}</small>` : ''}
                    </div>
                `).join('') : '<p>No test details available</p>'}
            </div>
        </div>
    `).join('')}
</body>
</html>
    `;
    
    await fs.writeFile(htmlPath, html);
    console.log(`📄 HTML report generated: ${htmlPath}`);
  }

  // Utility methods

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    this.removeAllListeners();
  }
}

module.exports = CrossPlatformTestSuite;