/**
 * Comprehensive Vercel Configuration Validation Test Suite
 * 
 * This test suite validates all aspects of Vercel deployment configuration
 * including syntax validation, build settings, environment variables,
 * routing, headers, and security configurations.
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class VercelConfigValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.setupSchema();
    this.configPath = path.resolve(__dirname, '../../vercel.json');
    this.frontendPath = path.resolve(__dirname, '../../frontend');
  }

  setupSchema() {
    // Vercel configuration JSON schema
    this.vercelSchema = {
      type: 'object',
      properties: {
        version: { type: 'number', enum: [2] },
        regions: { 
          type: 'array', 
          items: { type: 'string' },
          minItems: 1
        },
        framework: { type: 'string' },
        buildCommand: { type: 'string' },
        outputDirectory: { type: 'string' },
        installCommand: { type: 'string' },
        devCommand: { type: 'string' },
        routes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              src: { type: 'string' },
              dest: { type: 'string' },
              headers: { type: 'object' },
              methods: { 
                type: 'array',
                items: { type: 'string' }
              },
              status: { type: 'number' },
              continue: { type: 'boolean' }
            },
            required: ['src'],
            additionalProperties: false
          }
        },
        env: { type: 'object' },
        headers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              headers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    value: { type: 'string' }
                  },
                  required: ['key', 'value']
                }
              }
            },
            required: ['source', 'headers']
          }
        },
        rewrites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              destination: { type: 'string' }
            },
            required: ['source', 'destination']
          }
        },
        functions: { type: 'object' },
        crons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              schedule: { type: 'string' }
            },
            required: ['path', 'schedule']
          }
        }
      },
      required: ['version'],
      additionalProperties: false
    };

    this.validateConfig = this.ajv.compile(this.vercelSchema);
  }

  async loadConfig() {
    try {
      const configContent = await fs.promises.readFile(this.configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to load vercel.json: ${error.message}`);
    }
  }

  async validateSyntax() {
    const results = {
      valid: false,
      errors: [],
      warnings: []
    };

    try {
      const config = await this.loadConfig();
      const isValid = this.validateConfig(config);

      if (!isValid) {
        results.errors = this.validateConfig.errors.map(error => ({
          path: error.instancePath || error.schemaPath,
          message: error.message,
          value: error.data
        }));
      } else {
        results.valid = true;
      }

      return { ...results, config };
    } catch (error) {
      results.errors.push({
        path: 'root',
        message: error.message,
        critical: true
      });
      return results;
    }
  }

  async validateBuildSettings(config) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Validate build command
    if (!config.buildCommand) {
      results.errors.push({
        field: 'buildCommand',
        message: 'Build command is required for deployment'
      });
      results.valid = false;
    } else if (!config.buildCommand.includes('npm run build')) {
      results.warnings.push({
        field: 'buildCommand',
        message: 'Build command should use npm run build for consistency'
      });
    }

    // Validate output directory
    if (!config.outputDirectory) {
      results.errors.push({
        field: 'outputDirectory',
        message: 'Output directory is required'
      });
      results.valid = false;
    } else {
      const outputPath = path.resolve(this.frontendPath, config.outputDirectory.replace('frontend/', ''));
      try {
        await fs.promises.access(outputPath);
      } catch {
        results.warnings.push({
          field: 'outputDirectory',
          message: `Output directory ${config.outputDirectory} may not exist after build`
        });
      }
    }

    // Validate install command
    if (!config.installCommand) {
      results.warnings.push({
        field: 'installCommand',
        message: 'Install command not specified, Vercel will auto-detect'
      });
    }

    // Validate framework
    if (config.framework !== 'nextjs') {
      results.warnings.push({
        field: 'framework',
        message: 'Framework should be "nextjs" for optimal Next.js support'
      });
    }

    return results;
  }

  async validateEnvironmentVariables(config) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      missingVars: [],
      recommendedVars: []
    };

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_API_URL',
      'BACKEND_URL'
    ];

    const recommendedEnvVars = [
      'SENTRY_DSN',
      'NEXT_PUBLIC_WS_URL',
      'VERCEL_URL'
    ];

    if (!config.env) {
      results.errors.push({
        field: 'env',
        message: 'Environment variables section is required'
      });
      results.valid = false;
      return results;
    }

    // Check required environment variables
    for (const varName of requiredEnvVars) {
      if (!config.env[varName]) {
        results.missingVars.push(varName);
        results.errors.push({
          field: 'env',
          variable: varName,
          message: `Required environment variable ${varName} is missing`
        });
        results.valid = false;
      }
    }

    // Check recommended environment variables
    for (const varName of recommendedEnvVars) {
      if (!config.env[varName]) {
        results.recommendedVars.push(varName);
        results.warnings.push({
          field: 'env',
          variable: varName,
          message: `Recommended environment variable ${varName} is missing`
        });
      }
    }

    // Validate environment variable format
    for (const [key, value] of Object.entries(config.env)) {
      if (typeof value !== 'string') {
        results.errors.push({
          field: 'env',
          variable: key,
          message: `Environment variable ${key} must be a string`
        });
        results.valid = false;
      }

      // Check for Vercel secret format
      if (value.startsWith('@') && value.length < 3) {
        results.warnings.push({
          field: 'env',
          variable: key,
          message: `Environment variable ${key} has suspiciously short secret name`
        });
      }

      // Validate URL format for URL variables
      if (key.includes('URL') && !value.startsWith('@')) {
        try {
          new URL(value);
        } catch {
          results.warnings.push({
            field: 'env',
            variable: key,
            message: `Environment variable ${key} should be a valid URL or Vercel secret`
          });
        }
      }
    }

    return results;
  }

  async validateRouting(config) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      routeAnalysis: {
        apiRoutes: 0,
        websocketRoutes: 0,
        staticRoutes: 0,
        dynamicRoutes: 0
      }
    };

    if (!config.routes || !Array.isArray(config.routes)) {
      results.warnings.push({
        field: 'routes',
        message: 'No routes configured, relying on default routing'
      });
      return results;
    }

    for (const [index, route] of config.routes.entries()) {
      const routePrefix = `routes[${index}]`;

      // Validate route structure
      if (!route.src) {
        results.errors.push({
          field: routePrefix,
          message: 'Route source pattern is required'
        });
        results.valid = false;
        continue;
      }

      // Analyze route types
      if (route.src.includes('/api/')) {
        results.routeAnalysis.apiRoutes++;
      }
      if (route.src.includes('/ws')) {
        results.routeAnalysis.websocketRoutes++;
      }
      if (route.src.includes('(.*)')) {
        results.routeAnalysis.dynamicRoutes++;
      } else {
        results.routeAnalysis.staticRoutes++;
      }

      // Validate regex patterns
      try {
        new RegExp(route.src);
      } catch (error) {
        results.errors.push({
          field: routePrefix,
          message: `Invalid regex pattern in route source: ${error.message}`
        });
        results.valid = false;
      }

      // Validate destination
      if (route.dest) {
        if (route.dest.includes('$') && !route.dest.includes('$1') && route.src.includes('(.*)')) {
          results.warnings.push({
            field: routePrefix,
            message: 'Route has capture group but destination doesn\'t use $1'
          });
        }

        // Check for environment variable references
        if (route.dest.includes('$') && !route.dest.match(/\$\w+/)) {
          results.warnings.push({
            field: routePrefix,
            message: 'Route destination may have invalid environment variable reference'
          });
        }
      }

      // Validate methods if specified
      if (route.methods) {
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
        for (const method of route.methods) {
          if (!validMethods.includes(method.toUpperCase())) {
            results.errors.push({
              field: routePrefix,
              message: `Invalid HTTP method: ${method}`
            });
            results.valid = false;
          }
        }
      }
    }

    return results;
  }

  async validateSecurityHeaders(config) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      securityScore: 0,
      maxScore: 100
    };

    const requiredSecurityHeaders = {
      'X-Frame-Options': { required: true, score: 15 },
      'X-Content-Type-Options': { required: true, score: 10 },
      'Referrer-Policy': { required: true, score: 10 },
      'Content-Security-Policy': { required: false, score: 25 },
      'Strict-Transport-Security': { required: false, score: 20 },
      'X-XSS-Protection': { required: false, score: 10 },
      'Permissions-Policy': { required: false, score: 10 }
    };

    if (!config.headers || !Array.isArray(config.headers)) {
      results.errors.push({
        field: 'headers',
        message: 'Security headers configuration is missing'
      });
      results.valid = false;
      return results;
    }

    const configuredHeaders = new Set();

    for (const headerConfig of config.headers) {
      if (!headerConfig.headers || !Array.isArray(headerConfig.headers)) {
        continue;
      }

      for (const header of headerConfig.headers) {
        configuredHeaders.add(header.key);

        // Validate specific security headers
        switch (header.key) {
          case 'X-Frame-Options':
            if (!['DENY', 'SAMEORIGIN'].includes(header.value)) {
              results.warnings.push({
                field: 'headers',
                header: header.key,
                message: 'X-Frame-Options should be DENY or SAMEORIGIN'
              });
            } else {
              results.securityScore += requiredSecurityHeaders[header.key].score;
            }
            break;

          case 'X-Content-Type-Options':
            if (header.value !== 'nosniff') {
              results.warnings.push({
                field: 'headers',
                header: header.key,
                message: 'X-Content-Type-Options should be "nosniff"'
              });
            } else {
              results.securityScore += requiredSecurityHeaders[header.key].score;
            }
            break;

          case 'Referrer-Policy':
            const validPolicies = [
              'strict-origin-when-cross-origin',
              'strict-origin',
              'same-origin',
              'no-referrer'
            ];
            if (!validPolicies.includes(header.value)) {
              results.warnings.push({
                field: 'headers',
                header: header.key,
                message: `Referrer-Policy value "${header.value}" may not be optimal`
              });
            } else {
              results.securityScore += requiredSecurityHeaders[header.key].score;
            }
            break;

          case 'Access-Control-Allow-Origin':
            if (header.value === '*') {
              results.warnings.push({
                field: 'headers',
                header: header.key,
                message: 'CORS wildcard (*) should be restricted in production'
              });
            }
            break;
        }
      }
    }

    // Check for missing required headers
    for (const [headerName, config] of Object.entries(requiredSecurityHeaders)) {
      if (config.required && !configuredHeaders.has(headerName)) {
        results.errors.push({
          field: 'headers',
          header: headerName,
          message: `Required security header ${headerName} is missing`
        });
        results.valid = false;
      } else if (!config.required && !configuredHeaders.has(headerName)) {
        results.warnings.push({
          field: 'headers',
          header: headerName,
          message: `Recommended security header ${headerName} is missing`
        });
      }
    }

    return results;
  }

  async validateFunctions(config) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      functionAnalysis: {
        count: 0,
        totalMaxDuration: 0,
        avgMaxDuration: 0
      }
    };

    if (!config.functions) {
      results.warnings.push({
        field: 'functions',
        message: 'No serverless functions configured'
      });
      return results;
    }

    const functionPaths = Object.keys(config.functions);
    results.functionAnalysis.count = functionPaths.length;

    for (const [funcPath, funcConfig] of Object.entries(config.functions)) {
      // Validate function path exists
      const fullPath = path.resolve(this.frontendPath, funcPath);
      try {
        await fs.promises.access(fullPath);
      } catch {
        results.warnings.push({
          field: 'functions',
          function: funcPath,
          message: `Function file ${funcPath} does not exist`
        });
      }

      // Validate function configuration
      if (funcConfig.maxDuration) {
        if (funcConfig.maxDuration > 60) {
          results.warnings.push({
            field: 'functions',
            function: funcPath,
            message: `Function timeout ${funcConfig.maxDuration}s exceeds recommended 60s`
          });
        }
        results.functionAnalysis.totalMaxDuration += funcConfig.maxDuration;
      }

      if (funcConfig.memory) {
        const validMemorySizes = [128, 256, 512, 1024, 1536, 3008];
        if (!validMemorySizes.includes(funcConfig.memory)) {
          results.errors.push({
            field: 'functions',
            function: funcPath,
            message: `Invalid memory size ${funcConfig.memory}MB`
          });
          results.valid = false;
        }
      }
    }

    if (results.functionAnalysis.count > 0) {
      results.functionAnalysis.avgMaxDuration = 
        results.functionAnalysis.totalMaxDuration / results.functionAnalysis.count;
    }

    return results;
  }

  async validateCronJobs(config) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!config.crons || !Array.isArray(config.crons)) {
      results.warnings.push({
        field: 'crons',
        message: 'No cron jobs configured'
      });
      return results;
    }

    for (const [index, cron] of config.crons.entries()) {
      const cronPrefix = `crons[${index}]`;

      // Validate cron schedule format
      if (!cron.schedule) {
        results.errors.push({
          field: cronPrefix,
          message: 'Cron schedule is required'
        });
        results.valid = false;
        continue;
      }

      // Basic cron format validation (5 or 6 fields)
      const cronParts = cron.schedule.split(' ');
      if (cronParts.length !== 5 && cronParts.length !== 6) {
        results.errors.push({
          field: cronPrefix,
          message: 'Cron schedule must have 5 or 6 fields'
        });
        results.valid = false;
      }

      // Validate path
      if (!cron.path) {
        results.errors.push({
          field: cronPrefix,
          message: 'Cron path is required'
        });
        results.valid = false;
      } else if (!cron.path.startsWith('/')) {
        results.errors.push({
          field: cronPrefix,
          message: 'Cron path must start with /'
        });
        results.valid = false;
      }
    }

    return results;
  }

  async runCompleteValidation() {
    const startTime = Date.now();
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: 0,
      overall: {
        valid: true,
        score: 0,
        maxScore: 100
      },
      validations: {}
    };

    try {
      // 1. Syntax validation
      console.log('🔍 Validating Vercel configuration syntax...');
      const syntaxResult = await this.validateSyntax();
      report.validations.syntax = syntaxResult;

      if (!syntaxResult.valid) {
        report.overall.valid = false;
        return report;
      }

      const config = syntaxResult.config;

      // 2. Build settings validation
      console.log('🔧 Validating build settings...');
      report.validations.buildSettings = await this.validateBuildSettings(config);
      if (!report.validations.buildSettings.valid) {
        report.overall.valid = false;
      }

      // 3. Environment variables validation
      console.log('🌍 Validating environment variables...');
      report.validations.environment = await this.validateEnvironmentVariables(config);
      if (!report.validations.environment.valid) {
        report.overall.valid = false;
      }

      // 4. Routing validation
      console.log('🛣️ Validating routing configuration...');
      report.validations.routing = await this.validateRouting(config);
      if (!report.validations.routing.valid) {
        report.overall.valid = false;
      }

      // 5. Security headers validation
      console.log('🔒 Validating security headers...');
      report.validations.security = await this.validateSecurityHeaders(config);
      if (!report.validations.security.valid) {
        report.overall.valid = false;
      }

      // 6. Functions validation
      console.log('⚡ Validating serverless functions...');
      report.validations.functions = await this.validateFunctions(config);
      if (!report.validations.functions.valid) {
        report.overall.valid = false;
      }

      // 7. Cron jobs validation
      console.log('⏰ Validating cron jobs...');
      report.validations.crons = await this.validateCronJobs(config);
      if (!report.validations.crons.valid) {
        report.overall.valid = false;
      }

      // Calculate overall score
      let totalScore = 0;
      let maxScore = 0;

      // Security score (40% of total)
      if (report.validations.security.securityScore !== undefined) {
        totalScore += report.validations.security.securityScore * 0.4;
        maxScore += report.validations.security.maxScore * 0.4;
      }

      // Configuration completeness (60% of total)
      const validationKeys = ['buildSettings', 'environment', 'routing', 'functions'];
      const validValidations = validationKeys.filter(key => 
        report.validations[key] && report.validations[key].valid
      ).length;
      
      totalScore += (validValidations / validationKeys.length) * 60;
      maxScore += 60;

      report.overall.score = Math.round(totalScore);
      report.overall.maxScore = Math.round(maxScore);

    } catch (error) {
      report.overall.valid = false;
      report.error = {
        message: error.message,
        stack: error.stack
      };
    }

    report.executionTime = Date.now() - startTime;
    return report;
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Security recommendations
    if (report.validations.security && report.validations.security.securityScore < 70) {
      recommendations.push({
        category: 'Security',
        priority: 'High',
        message: 'Implement additional security headers for better protection',
        action: 'Add Content-Security-Policy and Strict-Transport-Security headers'
      });
    }

    // Performance recommendations
    if (report.validations.functions && report.validations.functions.functionAnalysis.avgMaxDuration > 30) {
      recommendations.push({
        category: 'Performance',
        priority: 'Medium',
        message: 'Consider optimizing function execution times',
        action: 'Review and optimize serverless function code'
      });
    }

    // Environment recommendations
    if (report.validations.environment && report.validations.environment.recommendedVars.length > 0) {
      recommendations.push({
        category: 'Configuration',
        priority: 'Low',
        message: 'Add recommended environment variables for better monitoring',
        action: `Configure: ${report.validations.environment.recommendedVars.join(', ')}`
      });
    }

    return recommendations;
  }
}

// Test execution
async function runVercelConfigTests() {
  console.log('🚀 Starting Vercel Configuration Validation Tests\n');
  
  const validator = new VercelConfigValidator();
  const report = await validator.runCompleteValidation();
  
  console.log('\n📊 Test Results:');
  console.log(`Overall Status: ${report.overall.valid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Security Score: ${report.overall.score}/${report.overall.maxScore}`);
  console.log(`Execution Time: ${report.executionTime}ms\n`);

  // Generate recommendations
  const recommendations = validator.generateRecommendations(report);
  if (recommendations.length > 0) {
    console.log('💡 Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.message}`);
      console.log(`   Action: ${rec.action}\n`);
    });
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '../reports/vercel-config-validation-report.json');
  await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📋 Detailed report saved to: ${reportPath}`);
  
  return report;
}

module.exports = {
  VercelConfigValidator,
  runVercelConfigTests
};

// Run tests if called directly
if (require.main === module) {
  runVercelConfigTests().catch(console.error);
}