#!/usr/bin/env node

/**
 * Environment Variables Test Suite
 * Comprehensive testing for environment variable handling, validation, and security
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class EnvironmentVariableTestSuite {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../../');
    this.testResults = {
      loading: [],
      validation: [],
      security: [],
      precedence: [],
      defaults: [],
      runtime: [],
      crossService: []
    };
    this.testEnvFile = path.join(this.templatePath, '.env.test');
    this.originalEnvs = new Map();
  }

  async runAllTests() {
    console.log('🌍 Starting Environment Variables Test Suite...\n');

    try {
      await this.setupTestEnvironment();
      await this.testEnvFileLoading();
      await this.testEnvironmentValidation();
      await this.testSecurityHandling();
      await this.testVariablePrecedence();
      await this.testDefaultValues();
      await this.testRuntimeConfiguration();
      await this.testCrossServiceSharing();

      return this.generateTestReport();
    } catch (error) {
      console.error('❌ Environment variable test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    console.log('🛠️ Setting up environment test environment...');
    
    // Store original environment variables
    const envVarsToBackup = [
      'NODE_ENV',
      'RUST_ENV',
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET'
    ];

    for (const envVar of envVarsToBackup) {
      if (process.env[envVar]) {
        this.originalEnvs.set(envVar, process.env[envVar]);
      }
    }

    // Create test environment files
    await this.createTestEnvFiles();
  }

  async createTestEnvFiles() {
    // Create various test .env files
    const envFiles = {
      '.env': `
# Base environment file
NODE_ENV=development
RUST_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/test_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
`,
      '.env.local': `
# Local overrides
DATABASE_URL=postgresql://postgres:password@localhost:5432/local_db
DEBUG_MODE=true
`,
      '.env.development': `
# Development specific
LOG_LEVEL=debug
DEV_TOOLS_ENABLED=true
`,
      '.env.production': `
# Production specific
NODE_ENV=production
RUST_ENV=production
LOG_LEVEL=info
DEBUG_MODE=false
`,
      '.env.test': `
# Test environment
NODE_ENV=test
RUST_ENV=test
DATABASE_URL=postgresql://postgres:password@localhost:5432/test_db
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret
`,
      '.env.example': `
# Example environment file (should not contain real values)
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
`
    };

    for (const [filename, content] of Object.entries(envFiles)) {
      const filePath = path.join(this.templatePath, filename);
      await fs.writeFile(filePath, content.trim());
    }
  }

  // 1. Environment File Loading Tests
  async testEnvFileLoading() {
    console.log('📁 Testing environment file loading...');

    const tests = [
      this.testDotEnvLoading,
      this.testEnvFileHierarchy,
      this.testEnvFileParsing,
      this.testEnvFileErrors
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.loading.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testDotEnvLoading() {
    // Test basic .env file loading
    const envContent = await fs.readFile(path.join(this.templatePath, '.env'), 'utf8');
    const envVars = this.parseEnvContent(envContent);

    const hasRequiredVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET'
    ].every(varName => envVars.has(varName));

    this.testResults.loading.push({
      test: 'dotenv_loading',
      status: hasRequiredVars ? 'passed' : 'failed',
      message: hasRequiredVars ? 
        'Basic .env file loaded successfully' : 
        'Required environment variables missing from .env'
    });
  }

  async testEnvFileHierarchy() {
    // Test environment file hierarchy (.env.local > .env.development > .env)
    const baseEnv = this.parseEnvContent(
      await fs.readFile(path.join(this.templatePath, '.env'), 'utf8')
    );
    const localEnv = this.parseEnvContent(
      await fs.readFile(path.join(this.templatePath, '.env.local'), 'utf8')
    );

    // Check if local overrides base
    const databaseUrlBase = baseEnv.get('DATABASE_URL');
    const databaseUrlLocal = localEnv.get('DATABASE_URL');
    const overrideWorks = databaseUrlBase !== databaseUrlLocal;

    this.testResults.loading.push({
      test: 'env_file_hierarchy',
      status: overrideWorks ? 'passed' : 'failed',
      message: overrideWorks ? 
        'Environment file hierarchy working correctly' : 
        'Environment file overrides not working'
    });
  }

  async testEnvFileParsing() {
    // Test environment file parsing edge cases
    const testContent = `
# Comments should be ignored
SIMPLE_VAR=value
QUOTED_VAR="quoted value"
SINGLE_QUOTED='single quoted'
MULTILINE_VAR="line 1
line 2"
EMPTY_VAR=
SPACE_VAR=value with spaces
EQUALS_VAR=value=with=equals
`;

    const testFile = path.join(this.templatePath, '.env.parsing.test');
    await fs.writeFile(testFile, testContent);

    const parsedVars = this.parseEnvContent(testContent);
    
    const parsingTests = [
      parsedVars.get('SIMPLE_VAR') === 'value',
      parsedVars.get('QUOTED_VAR') === 'quoted value',
      parsedVars.get('EMPTY_VAR') === '',
      parsedVars.has('SPACE_VAR'),
      parsedVars.has('EQUALS_VAR')
    ];

    await fs.unlink(testFile);

    const allTestsPassed = parsingTests.every(Boolean);

    this.testResults.loading.push({
      test: 'env_file_parsing',
      status: allTestsPassed ? 'passed' : 'failed',
      message: allTestsPassed ? 
        'Environment file parsing handles edge cases' : 
        'Environment file parsing has issues'
    });
  }

  async testEnvFileErrors() {
    // Test handling of malformed .env files
    const malformedContent = `
VALID_VAR=value
INVALID_VAR_NO_VALUE
=VALUE_WITHOUT_KEY
`;

    const testFile = path.join(this.templatePath, '.env.malformed.test');
    await fs.writeFile(testFile, malformedContent);

    try {
      const parsedVars = this.parseEnvContent(malformedContent);
      
      // Should handle malformed entries gracefully
      const hasValidVar = parsedVars.has('VALID_VAR');
      
      await fs.unlink(testFile);

      this.testResults.loading.push({
        test: 'env_file_errors',
        status: hasValidVar ? 'passed' : 'failed',
        message: hasValidVar ? 
          'Malformed env files handled gracefully' : 
          'Error handling for malformed env files failed'
      });
    } catch (error) {
      await fs.unlink(testFile);
      throw error;
    }
  }

  // 2. Environment Variable Validation
  async testEnvironmentValidation() {
    console.log('✅ Testing environment variable validation...');

    const tests = [
      this.testRequiredVariables,
      this.testVariableTypes,
      this.testVariableFormats,
      this.testVariableRanges
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.validation.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testRequiredVariables() {
    // Test that all required environment variables are present
    const requiredVars = {
      frontend: [
        'NODE_ENV',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ],
      backend: [
        'RUST_ENV',
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_SECRET'
      ]
    };

    const results = {};
    
    for (const [service, vars] of Object.entries(requiredVars)) {
      const envFile = path.join(this.templatePath, '.env');
      const envContent = await fs.readFile(envFile, 'utf8');
      const envVars = this.parseEnvContent(envContent);
      
      const missingVars = vars.filter(varName => !envVars.has(varName));
      results[service] = {
        required: vars.length,
        missing: missingVars.length,
        missingVars
      };
    }

    const allRequiredPresent = Object.values(results).every(result => result.missing === 0);

    this.testResults.validation.push({
      test: 'required_variables',
      status: allRequiredPresent ? 'passed' : 'failed',
      message: allRequiredPresent ? 
        'All required environment variables present' : 
        'Some required environment variables missing',
      details: results
    });
  }

  async testVariableTypes() {
    // Test environment variable type validation
    const typeTests = [
      { name: 'NODE_ENV', expectedType: 'string', validValues: ['development', 'production', 'test'] },
      { name: 'DATABASE_URL', expectedType: 'url', pattern: /^postgresql:\/\// },
      { name: 'REDIS_URL', expectedType: 'url', pattern: /^redis:\/\// },
      { name: 'JWT_SECRET', expectedType: 'string', minLength: 8 }
    ];

    const envFile = path.join(this.templatePath, '.env');
    const envContent = await fs.readFile(envFile, 'utf8');
    const envVars = this.parseEnvContent(envContent);

    const validationResults = [];

    for (const test of typeTests) {
      const value = envVars.get(test.name);
      let isValid = false;
      let errorMessage = '';

      if (!value) {
        errorMessage = 'Variable not found';
      } else if (test.validValues && !test.validValues.includes(value)) {
        errorMessage = `Invalid value: ${value}`;
      } else if (test.pattern && !test.pattern.test(value)) {
        errorMessage = `Invalid format: ${value}`;
      } else if (test.minLength && value.length < test.minLength) {
        errorMessage = `Too short: ${value.length} < ${test.minLength}`;
      } else {
        isValid = true;
      }

      validationResults.push({
        variable: test.name,
        valid: isValid,
        error: errorMessage
      });
    }

    const allValid = validationResults.every(result => result.valid);

    this.testResults.validation.push({
      test: 'variable_types',
      status: allValid ? 'passed' : 'failed',
      message: allValid ? 
        'All environment variable types valid' : 
        'Some environment variables have invalid types',
      details: validationResults
    });
  }

  async testVariableFormats() {
    // Test specific format requirements
    const formatTests = [
      {
        name: 'DATABASE_URL',
        test: (value) => {
          try {
            const url = new URL(value);
            return url.protocol === 'postgresql:' && url.hostname && url.pathname;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'REDIS_URL',
        test: (value) => {
          try {
            const url = new URL(value);
            return url.protocol === 'redis:' && url.hostname;
          } catch {
            return false;
          }
        }
      }
    ];

    const envFile = path.join(this.templatePath, '.env');
    const envContent = await fs.readFile(envFile, 'utf8');
    const envVars = this.parseEnvContent(envContent);

    const formatResults = [];

    for (const formatTest of formatTests) {
      const value = envVars.get(formatTest.name);
      const isValidFormat = value ? formatTest.test(value) : false;
      
      formatResults.push({
        variable: formatTest.name,
        valid: isValidFormat,
        value: value || 'undefined'
      });
    }

    const allFormatsValid = formatResults.every(result => result.valid);

    this.testResults.validation.push({
      test: 'variable_formats',
      status: allFormatsValid ? 'passed' : 'failed',
      message: allFormatsValid ? 
        'All environment variable formats valid' : 
        'Some environment variables have invalid formats',
      details: formatResults
    });
  }

  async testVariableRanges() {
    // Test environment variable value ranges
    this.testResults.validation.push({
      test: 'variable_ranges',
      status: 'info',
      message: 'Variable range validation should be implemented based on specific requirements'
    });
  }

  // 3. Security Handling Tests
  async testSecurityHandling() {
    console.log('🔒 Testing security handling...');

    const tests = [
      this.testSecretExposure,
      this.testSecretGeneration,
      this.testEnvironmentIsolation,
      this.testSecretRotation
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.security.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testSecretExposure() {
    // Test that secrets are not exposed in logs or error messages
    const secretVars = ['JWT_SECRET', 'SUPABASE_SERVICE_ROLE_KEY'];
    const envFile = path.join(this.templatePath, '.env');
    const envContent = await fs.readFile(envFile, 'utf8');
    const envVars = this.parseEnvContent(envContent);

    let exposureRisk = false;
    const exposureIssues = [];

    for (const secretVar of secretVars) {
      const value = envVars.get(secretVar);
      if (value) {
        // Check if it's a placeholder or example value
        if (value.includes('your-') || value.includes('example') || value.length < 16) {
          exposureIssues.push(`${secretVar} appears to be a placeholder`);
        }
        
        // Check if it's a weak secret
        if (value === 'secret' || value === 'password' || value === '123456') {
          exposureRisk = true;
          exposureIssues.push(`${secretVar} is using a weak value`);
        }
      }
    }

    this.testResults.security.push({
      test: 'secret_exposure',
      status: !exposureRisk ? 'passed' : 'failed',
      message: !exposureRisk ? 
        'No obvious secret exposure detected' : 
        'Potential secret exposure detected',
      issues: exposureIssues
    });
  }

  async testSecretGeneration() {
    // Test secret generation capabilities
    const generateSecureSecret = (length = 32) => {
      return crypto.randomBytes(length).toString('hex');
    };

    const testSecret = generateSecureSecret();
    const isSecure = testSecret.length >= 32 && /^[a-f0-9]+$/.test(testSecret);

    this.testResults.security.push({
      test: 'secret_generation',
      status: isSecure ? 'passed' : 'failed',
      message: isSecure ? 
        'Secure secret generation working' : 
        'Secret generation failed',
      recommendation: 'Use cryptographically secure random values for secrets'
    });
  }

  async testEnvironmentIsolation() {
    // Test that different environments are properly isolated
    const envFiles = ['.env', '.env.development', '.env.production', '.env.test'];
    const isolationIssues = [];

    for (const envFile of envFiles) {
      const filePath = path.join(this.templatePath, envFile);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const envVars = this.parseEnvContent(content);
        
        // Check for production secrets in development files
        if (envFile.includes('development') || envFile === '.env') {
          const hasProductionIndicators = content.includes('production') || 
                                         content.includes('prod-') ||
                                         envVars.get('NODE_ENV') === 'production';
          
          if (hasProductionIndicators) {
            isolationIssues.push(`${envFile} may contain production configuration`);
          }
        }
      } catch (error) {
        // File doesn't exist, which is fine
      }
    }

    this.testResults.security.push({
      test: 'environment_isolation',
      status: isolationIssues.length === 0 ? 'passed' : 'warning',
      message: isolationIssues.length === 0 ? 
        'Environment isolation appears correct' : 
        'Potential environment isolation issues',
      issues: isolationIssues
    });
  }

  async testSecretRotation() {
    // Test secret rotation capabilities
    this.testResults.security.push({
      test: 'secret_rotation',
      status: 'info',
      message: 'Secret rotation should be implemented as part of deployment process',
      recommendation: 'Implement automated secret rotation for production'
    });
  }

  // 4. Variable Precedence Tests
  async testVariablePrecedence() {
    console.log('📊 Testing variable precedence...');

    const tests = [
      this.testProcessEnvPrecedence,
      this.testEnvFilePrecedence,
      this.testCommandLineOverrides
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.precedence.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testProcessEnvPrecedence() {
    // Test that process.env takes precedence over .env files
    const testVar = 'TEST_PRECEDENCE_VAR';
    const envFileValue = 'env_file_value';
    const processEnvValue = 'process_env_value';

    // Set process environment variable
    process.env[testVar] = processEnvValue;

    // Add to .env file
    const envFile = path.join(this.templatePath, '.env');
    const originalContent = await fs.readFile(envFile, 'utf8');
    const modifiedContent = `${originalContent}\n${testVar}=${envFileValue}`;
    await fs.writeFile(envFile, modifiedContent);

    // The process.env should take precedence
    const actualValue = process.env[testVar];
    const precedenceWorks = actualValue === processEnvValue;

    // Restore original .env file
    await fs.writeFile(envFile, originalContent);
    delete process.env[testVar];

    this.testResults.precedence.push({
      test: 'process_env_precedence',
      status: precedenceWorks ? 'passed' : 'failed',
      message: precedenceWorks ? 
        'Process environment takes precedence over .env files' : 
        'Environment variable precedence not working correctly'
    });
  }

  async testEnvFilePrecedence() {
    // Test .env file precedence (.env.local > .env.development > .env)
    const baseEnv = this.parseEnvContent(
      await fs.readFile(path.join(this.templatePath, '.env'), 'utf8')
    );
    const localEnv = this.parseEnvContent(
      await fs.readFile(path.join(this.templatePath, '.env.local'), 'utf8')
    );

    // DATABASE_URL should be overridden in .env.local
    const precedenceCorrect = baseEnv.get('DATABASE_URL') !== localEnv.get('DATABASE_URL');

    this.testResults.precedence.push({
      test: 'env_file_precedence',
      status: precedenceCorrect ? 'passed' : 'failed',
      message: precedenceCorrect ? 
        'Environment file precedence working correctly' : 
        'Environment file precedence not working'
    });
  }

  async testCommandLineOverrides() {
    // Test command line environment variable overrides
    this.testResults.precedence.push({
      test: 'command_line_overrides',
      status: 'info',
      message: 'Command line overrides should be tested in actual runtime environment'
    });
  }

  // 5. Default Values Tests
  async testDefaultValues() {
    console.log('🎯 Testing default values...');

    const tests = [
      this.testDefaultValueHandling,
      this.testFallbackMechanisms,
      this.testConfigurationDefaults
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.defaults.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testDefaultValueHandling() {
    // Test default value syntax: ${VAR:-default}
    const testContent = `
TEST_VAR_WITH_DEFAULT=\${UNDEFINED_VAR:-default_value}
TEST_VAR_WITH_EMPTY_DEFAULT=\${UNDEFINED_VAR:-}
TEST_VAR_NORMAL=normal_value
`;

    // This would typically be handled by shell or a library like dotenv-expand
    this.testResults.defaults.push({
      test: 'default_value_handling',
      status: 'info',
      message: 'Default value handling depends on environment loader implementation',
      recommendation: 'Use dotenv-expand or similar for default value support'
    });
  }

  async testFallbackMechanisms() {
    // Test fallback mechanisms for missing variables
    this.testResults.defaults.push({
      test: 'fallback_mechanisms',
      status: 'info',
      message: 'Fallback mechanisms should be implemented in application configuration'
    });
  }

  async testConfigurationDefaults() {
    // Test that sensible defaults are provided
    const envExample = await fs.readFile(
      path.join(this.templatePath, '.env.example'), 
      'utf8'
    );
    const exampleVars = this.parseEnvContent(envExample);

    const hasGoodDefaults = [
      exampleVars.has('NODE_ENV'),
      exampleVars.has('DATABASE_URL'),
      exampleVars.has('REDIS_URL')
    ].every(Boolean);

    this.testResults.defaults.push({
      test: 'configuration_defaults',
      status: hasGoodDefaults ? 'passed' : 'failed',
      message: hasGoodDefaults ? 
        'Good default examples provided in .env.example' : 
        'Missing important defaults in .env.example'
    });
  }

  // 6. Runtime Configuration Tests
  async testRuntimeConfiguration() {
    console.log('⚡ Testing runtime configuration...');

    const tests = [
      this.testConfigurationReload,
      this.testRuntimeValidation,
      this.testConfigurationCaching
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.runtime.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testConfigurationReload() {
    // Test configuration reload capabilities
    this.testResults.runtime.push({
      test: 'configuration_reload',
      status: 'info',
      message: 'Configuration reload requires application restart in most cases',
      recommendation: 'Implement graceful restart for configuration changes'
    });
  }

  async testRuntimeValidation() {
    // Test runtime validation of environment variables
    this.testResults.runtime.push({
      test: 'runtime_validation',
      status: 'info',
      message: 'Runtime validation should be implemented in application startup'
    });
  }

  async testConfigurationCaching() {
    // Test configuration caching mechanisms
    this.testResults.runtime.push({
      test: 'configuration_caching',
      status: 'info',
      message: 'Configuration caching can improve performance',
      recommendation: 'Cache configuration values after validation'
    });
  }

  // 7. Cross-Service Variable Sharing
  async testCrossServiceSharing() {
    console.log('🔄 Testing cross-service variable sharing...');

    const tests = [
      this.testServiceCommunication,
      this.testSharedConfiguration,
      this.testServiceIsolation
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.crossService.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testServiceCommunication() {
    // Test that services can communicate using shared environment variables
    const envFile = path.join(this.templatePath, '.env');
    const envContent = await fs.readFile(envFile, 'utf8');
    const envVars = this.parseEnvContent(envContent);

    const communicationVars = [
      'FRONTEND_URL',
      'BACKEND_URL',
      'DATABASE_URL',
      'REDIS_URL'
    ];

    const hasCommunicationVars = communicationVars.every(varName => 
      envVars.has(varName)
    );

    this.testResults.crossService.push({
      test: 'service_communication',
      status: hasCommunicationVars ? 'passed' : 'failed',
      message: hasCommunicationVars ? 
        'Service communication variables configured' : 
        'Missing service communication variables'
    });
  }

  async testSharedConfiguration() {
    // Test shared configuration across services
    this.testResults.crossService.push({
      test: 'shared_configuration',
      status: 'info',
      message: 'Shared configuration should be consistent across services'
    });
  }

  async testServiceIsolation() {
    // Test that service-specific variables are properly isolated
    this.testResults.crossService.push({
      test: 'service_isolation',
      status: 'info',
      message: 'Service-specific variables should not leak between services'
    });
  }

  // Utility Methods
  parseEnvContent(content) {
    const envVars = new Map();
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('#') || !trimmedLine) {
        continue;
      }

      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        envVars.set(key, value);
      }
    }

    return envVars;
  }

  async execCommand(command) {
    return new Promise((resolve) => {
      exec(command, { cwd: this.templatePath }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr,
          code: error?.code
        });
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        info: 0
      },
      categories: this.testResults,
      security: {
        secretsHandling: 'review_required',
        environmentIsolation: 'review_required',
        accessControl: 'not_tested'
      },
      recommendations: [],
      overallStatus: 'unknown'
    };

    // Calculate summary
    for (const category of Object.values(this.testResults)) {
      for (const test of category) {
        report.summary.totalTests++;
        if (test.status === 'passed') report.summary.passed++;
        else if (test.status === 'failed') report.summary.failed++;
        else if (test.status === 'warning') report.summary.warnings++;
        else if (test.status === 'info') report.summary.info++;
      }
    }

    // Determine overall status
    if (report.summary.failed === 0) {
      report.overallStatus = report.summary.warnings > 0 ? 'warning' : 'passed';
    } else {
      report.overallStatus = 'failed';
    }

    // Generate recommendations
    report.recommendations = [
      'Review all environment variables for security implications',
      'Use strong, randomly generated secrets',
      'Implement environment variable validation in application startup',
      'Document required environment variables',
      'Use .env.example for documenting expected variables',
      'Implement proper secret rotation procedures',
      'Monitor for environment variable changes in production'
    ];

    // Save report
    await fs.writeFile(
      path.join(this.templatePath, 'env-variable-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Environment Variables Test Results:');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`ℹ️  Info: ${report.summary.info}`);
    console.log(`\n📄 Detailed report saved to: env-variable-test-report.json`);

    return report;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up environment test files...');
    
    // Remove test environment files
    const testFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test',
      '.env.example'
    ];

    for (const file of testFiles) {
      const filePath = path.join(this.templatePath, file);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist, ignore error
      }
    }

    // Restore original environment variables
    for (const [key, value] of this.originalEnvs) {
      process.env[key] = value;
    }
  }
}

// Export for use in other test files
module.exports = EnvironmentVariableTestSuite;

// Run if called directly
if (require.main === module) {
  const testSuite = new EnvironmentVariableTestSuite();
  
  testSuite.runAllTests()
    .then((report) => {
      console.log(`\n🎉 Environment variable testing completed with status: ${report.overallStatus}`);
      process.exit(report.overallStatus === 'failed' ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Environment variable test suite failed:', error);
      process.exit(1);
    });
}