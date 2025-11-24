/**
 * Test Runner - Real Test Execution Engine
 * =========================================
 * Executes tests using Node's built-in test runner or discovers and runs test files.
 * Supports Jest-like syntax and provides detailed reporting.
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class TestRunner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      projectPath: options.projectPath || process.cwd(),
      testPattern: options.testPattern || '**/*.test.js',
      timeout: options.timeout || 30000,
      verbose: options.verbose || false,
      coverage: options.coverage || false,
      parallel: options.parallel || false
    };
    
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tests: [],
      coverage: null
    };
  }

  log(msg) { if (this.options.verbose) console.log(`[TestRunner] ${msg}`); }

  /**
   * Discover test files in the project
   */
  async discoverTests(rootPath = this.options.projectPath) {
    const testFiles = [];
    
    async function scanDir(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDir(fullPath);
          } else if (entry.isFile() && (
            entry.name.endsWith('.test.js') || 
            entry.name.endsWith('.spec.js') ||
            entry.name.endsWith('.test.mjs') ||
            entry.name.includes('test-')
          )) {
            testFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }

    await scanDir(rootPath);
    this.log(`Discovered ${testFiles.length} test files`);
    return testFiles;
  }

  /**
   * Run all discovered tests
   */
  async runAll() {
    const startTime = Date.now();
    this.emit('run:start');
    
    const testFiles = await this.discoverTests();
    
    if (testFiles.length === 0) {
      this.log('No test files found');
      return this.results;
    }

    for (const testFile of testFiles) {
      await this.runTestFile(testFile);
    }

    this.results.duration = Date.now() - startTime;
    this.emit('run:complete', this.results);
    
    return this.results;
  }

  /**
   * Run a single test file
   */
  async runTestFile(filePath) {
    this.log(`Running: ${path.relative(this.options.projectPath, filePath)}`);
    this.emit('file:start', { file: filePath });

    try {
      // Try to run with Node's native test runner first
      const result = await this.executeWithNodeRunner(filePath);
      this.processResult(filePath, result);
    } catch (error) {
      // Fallback to direct import and execution
      try {
        const result = await this.executeDirectly(filePath);
        this.processResult(filePath, result);
      } catch (execError) {
        this.results.failed++;
        this.results.total++;
        this.results.tests.push({
          file: filePath,
          status: 'error',
          error: execError.message,
          duration: 0
        });
      }
    }

    this.emit('file:complete', { file: filePath });
  }

  /**
   * Execute test file using Node's test runner
   */
  async executeWithNodeRunner(filePath) {
    return new Promise((resolve, reject) => {
      const args = ['--test', filePath];
      if (this.options.coverage) {
        args.unshift('--experimental-test-coverage');
      }

      const proc = spawn('node', args, {
        cwd: this.options.projectPath,
        timeout: this.options.timeout
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code
        });
      });

      proc.on('error', reject);
    });
  }

  /**
   * Execute test file directly by importing it
   */
  async executeDirectly(filePath) {
    const startTime = Date.now();
    const testResults = { passed: 0, failed: 0, tests: [] };

    try {
      // Create a simple test context
      const testContext = this.createTestContext(testResults);
      
      // Import and run the test file
      const testModule = await import(`file://${filePath}`);
      
      // If the module exports a test function, run it
      if (typeof testModule.default === 'function') {
        await testModule.default(testContext);
      } else if (typeof testModule.runTests === 'function') {
        await testModule.runTests(testContext);
      }

      return {
        success: testResults.failed === 0,
        passed: testResults.passed,
        failed: testResults.failed,
        tests: testResults.tests,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Create a test context with assertion helpers
   */
  createTestContext(results) {
    const assertions = {
      equal: (a, b, msg) => {
        if (a !== b) throw new Error(msg || `Expected ${a} to equal ${b}`);
      },
      deepEqual: (a, b, msg) => {
        if (JSON.stringify(a) !== JSON.stringify(b)) {
          throw new Error(msg || `Expected deep equality`);
        }
      },
      ok: (val, msg) => {
        if (!val) throw new Error(msg || `Expected truthy value`);
      },
      throws: async (fn, msg) => {
        try {
          await fn();
          throw new Error(msg || 'Expected function to throw');
        } catch (e) {
          if (e.message === msg || e.message === 'Expected function to throw') throw e;
        }
      },
      notThrows: async (fn, msg) => {
        try {
          await fn();
        } catch (e) {
          throw new Error(msg || `Expected function not to throw: ${e.message}`);
        }
      }
    };

    return {
      test: async (name, fn) => {
        const start = Date.now();
        try {
          await fn(assertions);
          results.passed++;
          results.tests.push({ name, status: 'passed', duration: Date.now() - start });
        } catch (error) {
          results.failed++;
          results.tests.push({ name, status: 'failed', error: error.message, duration: Date.now() - start });
        }
      },
      describe: (name, fn) => fn(),
      it: async (name, fn) => {
        const start = Date.now();
        try {
          await fn(assertions);
          results.passed++;
          results.tests.push({ name, status: 'passed', duration: Date.now() - start });
        } catch (error) {
          results.failed++;
          results.tests.push({ name, status: 'failed', error: error.message, duration: Date.now() - start });
        }
      },
      ...assertions
    };
  }

  processResult(filePath, result) {
    if (result.success) {
      this.results.passed += result.passed || 1;
      this.results.total += (result.passed || 1) + (result.failed || 0);
    } else {
      this.results.failed += result.failed || 1;
      this.results.total += (result.passed || 0) + (result.failed || 1);
    }

    if (result.tests) {
      this.results.tests.push(...result.tests.map(t => ({ ...t, file: filePath })));
    } else {
      this.results.tests.push({
        file: filePath,
        status: result.success ? 'passed' : 'failed',
        error: result.error,
        duration: result.duration || 0
      });
    }
  }

  /**
   * Run specific test file or pattern
   */
  async run(pattern) {
    const startTime = Date.now();
    this.emit('run:start');

    const testFiles = await this.discoverTests();
    const matchingFiles = testFiles.filter(f => 
      f.includes(pattern) || path.basename(f).includes(pattern)
    );

    for (const testFile of matchingFiles) {
      await this.runTestFile(testFile);
    }

    this.results.duration = Date.now() - startTime;
    this.emit('run:complete', this.results);
    
    return this.results;
  }

  /**
   * Generate test report
   */
  generateReport() {
    const { total, passed, failed, skipped, duration, tests } = this.results;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    let report = `
Test Results
============
Total:   ${total}
Passed:  ${passed} ✅
Failed:  ${failed} ❌
Skipped: ${skipped} ⏭️
Duration: ${duration}ms
Pass Rate: ${passRate}%

`;

    if (failed > 0) {
      report += 'Failed Tests:\n';
      tests.filter(t => t.status === 'failed').forEach(t => {
        report += `  ❌ ${t.name || t.file}\n`;
        if (t.error) report += `     Error: ${t.error}\n`;
      });
    }

    return report;
  }

  /**
   * Calculate test coverage from analysis
   */
  async calculateCoverage(analysis) {
    const components = Object.keys(analysis.components || {});
    const testFiles = await this.discoverTests();
    
    let covered = 0;
    for (const component of components) {
      const hasTest = testFiles.some(f => 
        f.toLowerCase().includes(component.toLowerCase()) ||
        path.basename(f).includes(component)
      );
      if (hasTest) covered++;
    }

    return {
      total: components.length,
      covered,
      percentage: components.length > 0 ? Math.round((covered / components.length) * 100) : 0,
      uncovered: components.filter(c => 
        !testFiles.some(f => f.toLowerCase().includes(c.toLowerCase()))
      )
    };
  }

  getResults() {
    return this.results;
  }

  reset() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tests: [],
      coverage: null
    };
  }
}

export default TestRunner;
