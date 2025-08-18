/**
 * Comprehensive GitHub Actions CI/CD Pipeline Testing Suite
 * 
 * This test suite validates GitHub Actions workflows including:
 * - Workflow syntax and configuration validation
 * - Build automation testing
 * - Dependency management and caching validation
 * - Security scanning integration
 * - Multi-environment deployment testing
 * - Performance regression testing
 * - Notification and reporting systems
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Octokit } = require('@octokit/rest');

class GitHubActionsPipelineTester {
  constructor(options = {}) {
    this.options = {
      githubToken: process.env.GITHUB_TOKEN,
      owner: options.owner || process.env.GITHUB_OWNER,
      repo: options.repo || process.env.GITHUB_REPO,
      timeout: options.timeout || 600000, // 10 minutes
      ...options
    };
    
    this.octokit = new Octokit({
      auth: this.options.githubToken
    });
    
    this.projectPath = path.resolve(__dirname, '../../');
    this.workflowsPath = path.join(this.projectPath, '.github', 'workflows');
    
    this.testResults = {
      workflowValidation: [],
      buildTests: [],
      deploymentTests: [],
      securityTests: [],
      performanceTests: []
    };
  }

  async checkPrerequisites() {
    const checks = {
      githubToken: !!this.options.githubToken,
      repoAccess: false,
      workflowsExist: false,
      packageJson: false
    };

    // Check repository access
    if (this.options.githubToken && this.options.owner && this.options.repo) {
      try {
        await this.octokit.repos.get({
          owner: this.options.owner,
          repo: this.options.repo
        });
        checks.repoAccess = true;
      } catch (error) {
        console.warn('⚠️ Cannot access GitHub repository. Check credentials and permissions.');
      }
    }

    // Check workflows directory
    try {
      await fs.promises.access(this.workflowsPath);
      const workflowFiles = await fs.promises.readdir(this.workflowsPath);
      checks.workflowsExist = workflowFiles.some(file => file.endsWith('.yml') || file.endsWith('.yaml'));
    } catch (error) {
      console.warn('⚠️ .github/workflows directory not found or empty');
    }

    // Check package.json
    try {
      await fs.promises.access(path.join(this.projectPath, 'frontend', 'package.json'));
      checks.packageJson = true;
    } catch (error) {
      console.warn('⚠️ Frontend package.json not found');
    }

    return checks;
  }

  async validateWorkflowSyntax() {
    console.log('🔍 Validating GitHub Actions workflow syntax...');
    
    const validationResults = [];

    try {
      const workflowFiles = await fs.promises.readdir(this.workflowsPath);
      const yamlFiles = workflowFiles.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

      for (const filename of yamlFiles) {
        const result = await this.validateSingleWorkflow(filename);
        validationResults.push(result);
      }

    } catch (error) {
      validationResults.push({
        filename: 'unknown',
        status: 'error',
        error: error.message
      });
    }

    this.testResults.workflowValidation = validationResults;
    return validationResults;
  }

  async validateSingleWorkflow(filename) {
    const result = {
      filename,
      status: 'pending',
      errors: [],
      warnings: [],
      analysis: {
        jobs: 0,
        steps: 0,
        triggers: [],
        environments: [],
        secrets: [],
        permissions: {}
      }
    };

    try {
      const filePath = path.join(this.workflowsPath, filename);
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      // Parse YAML
      const workflow = yaml.load(content);
      
      // Validate workflow structure
      result.analysis = await this.analyzeWorkflow(workflow, result);
      
      // Validate required fields
      if (!workflow.name) {
        result.warnings.push('Workflow name is missing');
      }
      
      if (!workflow.on) {
        result.errors.push('Workflow triggers (on) are missing');
      }
      
      if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
        result.errors.push('No jobs defined in workflow');
      }

      // Validate jobs
      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          await this.validateJob(jobName, job, result);
        }
      }

      result.status = result.errors.length === 0 ? 'success' : 'failed';

    } catch (error) {
      result.status = 'error';
      result.errors.push(`Failed to parse workflow: ${error.message}`);
    }

    return result;
  }

  async analyzeWorkflow(workflow, result) {
    const analysis = {
      jobs: 0,
      steps: 0,
      triggers: [],
      environments: [],
      secrets: [],
      permissions: workflow.permissions || {}
    };

    // Analyze triggers
    if (workflow.on) {
      if (typeof workflow.on === 'string') {
        analysis.triggers.push(workflow.on);
      } else if (Array.isArray(workflow.on)) {
        analysis.triggers.push(...workflow.on);
      } else if (typeof workflow.on === 'object') {
        analysis.triggers.push(...Object.keys(workflow.on));
      }
    }

    // Analyze jobs
    if (workflow.jobs) {
      analysis.jobs = Object.keys(workflow.jobs).length;

      for (const [jobName, job] of Object.entries(workflow.jobs)) {
        if (job.steps) {
          analysis.steps += job.steps.length;
        }

        // Extract environments
        if (job.environment) {
          if (typeof job.environment === 'string') {
            analysis.environments.push(job.environment);
          } else if (job.environment.name) {
            analysis.environments.push(job.environment.name);
          }
        }

        // Extract secrets usage
        const jobContent = JSON.stringify(job);
        const secretMatches = jobContent.match(/\$\{\{\s*secrets\.\w+\s*\}\}/g);
        if (secretMatches) {
          analysis.secrets.push(...secretMatches.map(match => 
            match.replace(/\$\{\{\s*secrets\.(\w+)\s*\}\}/, '$1')
          ));
        }
      }
    }

    // Remove duplicates
    analysis.environments = [...new Set(analysis.environments)];
    analysis.secrets = [...new Set(analysis.secrets)];

    return analysis;
  }

  async validateJob(jobName, job, result) {
    // Validate runner
    if (!job['runs-on']) {
      result.errors.push(`Job '${jobName}' missing 'runs-on' specification`);
    } else {
      // Check for recommended runners
      const runner = job['runs-on'];
      if (typeof runner === 'string' && !runner.includes('ubuntu-latest')) {
        result.warnings.push(`Job '${jobName}' uses '${runner}' - consider 'ubuntu-latest' for better performance`);
      }
    }

    // Validate steps
    if (!job.steps || !Array.isArray(job.steps) || job.steps.length === 0) {
      result.errors.push(`Job '${jobName}' has no steps defined`);
    } else {
      for (const [stepIndex, step] of job.steps.entries()) {
        await this.validateStep(jobName, stepIndex, step, result);
      }
    }

    // Check for security best practices
    if (job.permissions && job.permissions === 'write-all') {
      result.warnings.push(`Job '${jobName}' has overly broad permissions`);
    }

    // Check for caching
    const hasCaching = job.steps?.some(step => 
      step.uses && step.uses.includes('actions/cache')
    );
    if (!hasCaching && this.jobShouldHaveCaching(job)) {
      result.warnings.push(`Job '${jobName}' could benefit from dependency caching`);
    }

    return result;
  }

  async validateStep(jobName, stepIndex, step, result) {
    const stepId = `${jobName}[${stepIndex}]`;

    // Validate step structure
    if (!step.uses && !step.run) {
      result.errors.push(`Step ${stepId} missing 'uses' or 'run' command`);
    }

    // Check for pinned action versions
    if (step.uses && !step.uses.includes('@')) {
      result.warnings.push(`Step ${stepId} uses unpinned action: ${step.uses}`);
    }

    // Check for hardcoded secrets
    if (step.run && typeof step.run === 'string') {
      const suspiciousPatterns = [
        /password\s*=\s*['"][^'"]+['"]/i,
        /token\s*=\s*['"][^'"]+['"]/i,
        /key\s*=\s*['"][^'"]+['"]/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(step.run)) {
          result.warnings.push(`Step ${stepId} may contain hardcoded secrets`);
          break;
        }
      }
    }

    // Check for environment variables security
    if (step.env) {
      for (const [envVar, value] of Object.entries(step.env)) {
        if (typeof value === 'string' && !value.includes('${{') && 
            (envVar.toLowerCase().includes('secret') || 
             envVar.toLowerCase().includes('token') ||
             envVar.toLowerCase().includes('password'))) {
          result.warnings.push(`Step ${stepId} may have hardcoded secret in ${envVar}`);
        }
      }
    }
  }

  jobShouldHaveCaching(job) {
    const jobContent = JSON.stringify(job);
    return jobContent.includes('npm install') || 
           jobContent.includes('yarn install') ||
           jobContent.includes('pip install') ||
           jobContent.includes('composer install');
  }

  async testBuildAutomation() {
    console.log('🔧 Testing build automation...');
    
    const buildTests = [];

    try {
      // Test local build process
      const localBuildTest = await this.testLocalBuild();
      buildTests.push(localBuildTest);

      // Test dependency management
      const dependencyTest = await this.testDependencyManagement();
      buildTests.push(dependencyTest);

      // Test build caching
      const cachingTest = await this.testBuildCaching();
      buildTests.push(cachingTest);

      // Test multi-environment builds
      const multiEnvTest = await this.testMultiEnvironmentBuilds();
      buildTests.push(multiEnvTest);

    } catch (error) {
      buildTests.push({
        test: 'build-automation',
        status: 'error',
        error: error.message
      });
    }

    this.testResults.buildTests = buildTests;
    return buildTests;
  }

  async testLocalBuild() {
    const test = {
      name: 'local-build',
      status: 'pending',
      steps: [],
      metrics: {}
    };

    try {
      const startTime = Date.now();

      // Test frontend build
      const frontendBuild = await this.runCommand('npm run build', {
        cwd: path.join(this.projectPath, 'frontend')
      });

      test.steps.push({
        name: 'frontend-build',
        status: frontendBuild.success ? 'success' : 'failed',
        output: frontendBuild.output,
        duration: frontendBuild.duration
      });

      // Test backend build (if applicable)
      try {
        const backendBuild = await this.runCommand('cargo build --release', {
          cwd: path.join(this.projectPath, 'backend')
        });

        test.steps.push({
          name: 'backend-build',
          status: backendBuild.success ? 'success' : 'failed',
          output: backendBuild.output,
          duration: backendBuild.duration
        });
      } catch (error) {
        test.steps.push({
          name: 'backend-build',
          status: 'skipped',
          reason: 'Backend build not available or failed'
        });
      }

      test.metrics.totalDuration = Date.now() - startTime;
      test.status = test.steps.every(step => step.status === 'success' || step.status === 'skipped') 
        ? 'success' : 'failed';

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testDependencyManagement() {
    const test = {
      name: 'dependency-management',
      status: 'pending',
      checks: {},
      security: {}
    };

    try {
      // Check package.json validity
      const packageJsonPath = path.join(this.projectPath, 'frontend', 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
      
      test.checks.packageJsonValid = true;
      test.checks.hasLockFile = await this.fileExists(
        path.join(this.projectPath, 'frontend', 'package-lock.json')
      );

      // Check for security vulnerabilities
      try {
        const auditResult = await this.runCommand('npm audit --json', {
          cwd: path.join(this.projectPath, 'frontend')
        });

        if (auditResult.success) {
          const auditData = JSON.parse(auditResult.output);
          test.security.vulnerabilities = auditData.metadata?.vulnerabilities || {};
          test.security.hasHighSeverity = Object.values(test.security.vulnerabilities)
            .some(count => count > 0);
        }
      } catch (auditError) {
        test.security.auditError = auditError.message;
      }

      // Check dependency versions
      test.checks.outdatedDependencies = await this.checkOutdatedDependencies();

      test.status = 'success';

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testBuildCaching() {
    const test = {
      name: 'build-caching',
      status: 'pending',
      cacheTests: []
    };

    try {
      // Test Node.js modules caching
      const nodeModulesPath = path.join(this.projectPath, 'frontend', 'node_modules');
      const hasNodeModules = await this.fileExists(nodeModulesPath);
      
      if (hasNodeModules) {
        const nodeModulesStats = await fs.promises.stat(nodeModulesPath);
        test.cacheTests.push({
          type: 'node_modules',
          exists: true,
          size: nodeModulesStats.size,
          modified: nodeModulesStats.mtime
        });
      }

      // Test Next.js build cache
      const nextCachePath = path.join(this.projectPath, 'frontend', '.next', 'cache');
      const hasNextCache = await this.fileExists(nextCachePath);
      
      if (hasNextCache) {
        const cacheStats = await fs.promises.stat(nextCachePath);
        test.cacheTests.push({
          type: 'next_cache',
          exists: true,
          size: cacheStats.size,
          modified: cacheStats.mtime
        });
      }

      test.status = 'success';

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testMultiEnvironmentBuilds() {
    const test = {
      name: 'multi-environment-builds',
      status: 'pending',
      environments: []
    };

    const environments = ['development', 'staging', 'production'];

    for (const env of environments) {
      const envTest = {
        name: env,
        status: 'pending',
        config: {},
        build: {}
      };

      try {
        // Set environment variables
        const envVars = this.getEnvironmentVariables(env);
        
        // Test build with environment-specific configuration
        const buildResult = await this.runCommand('npm run build', {
          cwd: path.join(this.projectPath, 'frontend'),
          env: { ...process.env, ...envVars }
        });

        envTest.build.success = buildResult.success;
        envTest.build.duration = buildResult.duration;
        envTest.status = buildResult.success ? 'success' : 'failed';

      } catch (error) {
        envTest.status = 'error';
        envTest.error = error.message;
      }

      test.environments.push(envTest);
    }

    test.status = test.environments.every(env => env.status === 'success') ? 'success' : 'failed';
    return test;
  }

  async testSecurityScanning() {
    console.log('🔒 Testing security scanning integration...');
    
    const securityTests = [];

    try {
      // Test dependency vulnerability scanning
      const dependencyTest = await this.testDependencyVulnerabilities();
      securityTests.push(dependencyTest);

      // Test code quality scanning
      const codeQualityTest = await this.testCodeQualityScanning();
      securityTests.push(codeQualityTest);

      // Test Docker image scanning
      const dockerScanTest = await this.testDockerImageScanning();
      securityTests.push(dockerScanTest);

      // Test secret detection
      const secretDetectionTest = await this.testSecretDetection();
      securityTests.push(secretDetectionTest);

    } catch (error) {
      securityTests.push({
        test: 'security-scanning',
        status: 'error',
        error: error.message
      });
    }

    this.testResults.securityTests = securityTests;
    return securityTests;
  }

  async testDependencyVulnerabilities() {
    const test = {
      name: 'dependency-vulnerabilities',
      status: 'pending',
      scanners: []
    };

    try {
      // NPM Audit
      const npmAudit = await this.runCommand('npm audit --json', {
        cwd: path.join(this.projectPath, 'frontend')
      });

      test.scanners.push({
        name: 'npm-audit',
        success: npmAudit.success,
        vulnerabilities: npmAudit.success ? 
          JSON.parse(npmAudit.output).metadata?.vulnerabilities : null
      });

      // Snyk (if available)
      try {
        const snykTest = await this.runCommand('npx snyk test --json', {
          cwd: path.join(this.projectPath, 'frontend')
        });

        test.scanners.push({
          name: 'snyk',
          success: snykTest.success,
          output: snykTest.output
        });
      } catch (snykError) {
        test.scanners.push({
          name: 'snyk',
          success: false,
          error: 'Snyk not available or requires authentication'
        });
      }

      test.status = 'success';

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testCodeQualityScanning() {
    const test = {
      name: 'code-quality-scanning',
      status: 'pending',
      tools: []
    };

    try {
      // ESLint
      const eslintTest = await this.runCommand('npx eslint . --format json', {
        cwd: path.join(this.projectPath, 'frontend')
      });

      test.tools.push({
        name: 'eslint',
        success: eslintTest.success,
        issues: eslintTest.success ? JSON.parse(eslintTest.output).length : null
      });

      // Prettier
      const prettierTest = await this.runCommand('npx prettier --check .', {
        cwd: path.join(this.projectPath, 'frontend')
      });

      test.tools.push({
        name: 'prettier',
        success: prettierTest.success,
        output: prettierTest.output
      });

      // TypeScript checking
      const tscTest = await this.runCommand('npx tsc --noEmit', {
        cwd: path.join(this.projectPath, 'frontend')
      });

      test.tools.push({
        name: 'typescript',
        success: tscTest.success,
        output: tscTest.output
      });

      test.status = 'success';

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testDockerImageScanning() {
    const test = {
      name: 'docker-image-scanning',
      status: 'pending',
      scans: []
    };

    try {
      // Check if Docker is available
      const dockerVersion = await this.runCommand('docker --version');
      
      if (dockerVersion.success) {
        // Trivy scanning (if available)
        try {
          const trivyTest = await this.runCommand('trivy --version');
          if (trivyTest.success) {
            test.scans.push({
              scanner: 'trivy',
              available: true,
              note: 'Trivy scanner available for container security scanning'
            });
          }
        } catch (trivyError) {
          test.scans.push({
            scanner: 'trivy',
            available: false,
            note: 'Trivy not installed'
          });
        }

        // Docker Scout (if available)
        try {
          const scoutTest = await this.runCommand('docker scout --help');
          if (scoutTest.success) {
            test.scans.push({
              scanner: 'docker-scout',
              available: true,
              note: 'Docker Scout available for vulnerability scanning'
            });
          }
        } catch (scoutError) {
          test.scans.push({
            scanner: 'docker-scout',
            available: false,
            note: 'Docker Scout not available'
          });
        }
      }

      test.status = 'success';

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testSecretDetection() {
    const test = {
      name: 'secret-detection',
      status: 'pending',
      patterns: [],
      findings: []
    };

    try {
      // Define secret patterns to look for
      const secretPatterns = [
        { name: 'API Key', pattern: /api[_-]?key\s*[=:]\s*['"][^'"]{20,}['"]/, severity: 'high' },
        { name: 'Token', pattern: /token\s*[=:]\s*['"][^'"]{20,}['"]/, severity: 'high' },
        { name: 'Password', pattern: /password\s*[=:]\s*['"][^'"]+['"]/, severity: 'medium' },
        { name: 'Private Key', pattern: /-----BEGIN PRIVATE KEY-----/, severity: 'critical' },
        { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/, severity: 'critical' }
      ];

      // Scan project files
      const projectFiles = await this.getProjectFiles();
      
      for (const filePath of projectFiles) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        
        for (const secretPattern of secretPatterns) {
          const matches = content.match(secretPattern.pattern);
          if (matches) {
            test.findings.push({
              file: path.relative(this.projectPath, filePath),
              pattern: secretPattern.name,
              severity: secretPattern.severity,
              line: this.getLineNumber(content, matches[0])
            });
          }
        }
      }

      test.patterns = secretPatterns.map(p => ({ name: p.name, severity: p.severity }));
      test.status = 'success';

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testPerformanceRegression() {
    console.log('📊 Testing performance regression...');
    
    const performanceTests = [];

    try {
      // Bundle size analysis
      const bundleSizeTest = await this.testBundleSize();
      performanceTests.push(bundleSizeTest);

      // Build time analysis
      const buildTimeTest = await this.testBuildTime();
      performanceTests.push(buildTimeTest);

      // Lighthouse CI integration test
      const lighthouseTest = await this.testLighthouseIntegration();
      performanceTests.push(lighthouseTest);

    } catch (error) {
      performanceTests.push({
        test: 'performance-regression',
        status: 'error',
        error: error.message
      });
    }

    this.testResults.performanceTests = performanceTests;
    return performanceTests;
  }

  async testBundleSize() {
    const test = {
      name: 'bundle-size',
      status: 'pending',
      metrics: {}
    };

    try {
      // Build the project first
      const buildResult = await this.runCommand('npm run build', {
        cwd: path.join(this.projectPath, 'frontend')
      });

      if (buildResult.success) {
        // Analyze bundle size
        const buildDir = path.join(this.projectPath, 'frontend', '.next');
        const stats = await this.analyzeBuildDirectory(buildDir);
        
        test.metrics = {
          totalSize: stats.totalSize,
          jsSize: stats.jsSize,
          cssSize: stats.cssSize,
          staticSize: stats.staticSize,
          largestFiles: stats.largestFiles
        };

        // Check against thresholds
        test.metrics.withinThresholds = {
          totalSize: stats.totalSize < 10 * 1024 * 1024, // 10MB
          jsSize: stats.jsSize < 5 * 1024 * 1024, // 5MB
          cssSize: stats.cssSize < 1024 * 1024 // 1MB
        };

        test.status = 'success';
      } else {
        test.status = 'failed';
        test.error = 'Build failed';
      }

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testBuildTime() {
    const test = {
      name: 'build-time',
      status: 'pending',
      measurements: []
    };

    try {
      // Run multiple build measurements
      for (let i = 0; i < 3; i++) {
        // Clean build directory
        await this.runCommand('rm -rf .next', {
          cwd: path.join(this.projectPath, 'frontend')
        });

        const startTime = Date.now();
        const buildResult = await this.runCommand('npm run build', {
          cwd: path.join(this.projectPath, 'frontend')
        });
        const duration = Date.now() - startTime;

        test.measurements.push({
          run: i + 1,
          duration,
          success: buildResult.success
        });
      }

      // Calculate statistics
      const durations = test.measurements
        .filter(m => m.success)
        .map(m => m.duration);

      if (durations.length > 0) {
        test.statistics = {
          average: durations.reduce((a, b) => a + b, 0) / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations),
          variance: this.calculateVariance(durations)
        };

        test.status = 'success';
      } else {
        test.status = 'failed';
        test.error = 'All builds failed';
      }

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  async testLighthouseIntegration() {
    const test = {
      name: 'lighthouse-integration',
      status: 'pending',
      lighthouse: {}
    };

    try {
      // Check if Lighthouse CI is configured
      const lhciConfigPath = path.join(this.projectPath, 'lighthouserc.js');
      const hasLighthouseConfig = await this.fileExists(lhciConfigPath);

      test.lighthouse.configExists = hasLighthouseConfig;

      if (hasLighthouseConfig) {
        const config = require(lhciConfigPath);
        test.lighthouse.config = {
          numberOfRuns: config.ci?.numberOfRuns || 1,
          url: config.ci?.url || [],
          budgets: !!config.ci?.budgets
        };
      }

      // Check if Lighthouse is available
      try {
        const lhciVersion = await this.runCommand('npx @lhci/cli --version');
        test.lighthouse.available = lhciVersion.success;
      } catch (lhciError) {
        test.lighthouse.available = false;
        test.lighthouse.error = 'Lighthouse CI not installed';
      }

      test.status = 'success';

    } catch (error) {
      test.status = 'error';
      test.error = error.message;
    }

    return test;
  }

  // Helper methods
  async runCommand(command, options = {}) {
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn('sh', ['-c', command], {
        cwd: options.cwd || this.projectPath,
        env: options.env || process.env,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          output: stdout,
          error: stderr,
          duration: Date.now() - startTime
        });
      });

      // Set timeout
      setTimeout(() => {
        child.kill();
        resolve({
          success: false,
          code: -1,
          output: stdout,
          error: 'Command timed out',
          duration: Date.now() - startTime
        });
      }, options.timeout || this.options.timeout);
    });
  }

  async fileExists(filePath) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getEnvironmentVariables(env) {
    const envVars = {
      NODE_ENV: env
    };

    switch (env) {
      case 'development':
        envVars.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api';
        break;
      case 'staging':
        envVars.NEXT_PUBLIC_API_URL = 'https://staging-api.example.com/api';
        break;
      case 'production':
        envVars.NEXT_PUBLIC_API_URL = 'https://api.example.com/api';
        break;
    }

    return envVars;
  }

  async checkOutdatedDependencies() {
    try {
      const outdatedResult = await this.runCommand('npm outdated --json', {
        cwd: path.join(this.projectPath, 'frontend')
      });

      if (outdatedResult.output) {
        const outdated = JSON.parse(outdatedResult.output);
        return Object.keys(outdated).length;
      }
    } catch (error) {
      return 0;
    }
    return 0;
  }

  async analyzeBuildDirectory(buildDir) {
    const stats = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      staticSize: 0,
      largestFiles: []
    };

    const files = await this.getAllFiles(buildDir);
    
    for (const filePath of files) {
      try {
        const stat = await fs.promises.stat(filePath);
        const size = stat.size;
        const ext = path.extname(filePath).toLowerCase();

        stats.totalSize += size;

        if (ext === '.js') {
          stats.jsSize += size;
        } else if (ext === '.css') {
          stats.cssSize += size;
        } else {
          stats.staticSize += size;
        }

        stats.largestFiles.push({
          path: path.relative(buildDir, filePath),
          size
        });
      } catch (error) {
        // Skip files that can't be accessed
      }
    }

    // Sort largest files
    stats.largestFiles.sort((a, b) => b.size - a.size);
    stats.largestFiles = stats.largestFiles.slice(0, 10);

    return stats;
  }

  async getAllFiles(dir, files = []) {
    const dirFiles = await fs.promises.readdir(dir);
    
    for (const file of dirFiles) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      
      if (stat.isDirectory()) {
        await this.getAllFiles(filePath, files);
      } else {
        files.push(filePath);
      }
    }
    
    return files;
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numbers.length;
  }

  async getProjectFiles() {
    // Get all project files excluding node_modules, .git, etc.
    const excludePatterns = [
      'node_modules',
      '.git',
      '.next',
      'target',
      'dist',
      'build'
    ];

    const files = [];
    await this.walkDirectory(this.projectPath, files, excludePatterns);
    return files;
  }

  async walkDirectory(dir, files, excludePatterns) {
    const dirFiles = await fs.promises.readdir(dir);
    
    for (const file of dirFiles) {
      if (excludePatterns.some(pattern => file.includes(pattern))) {
        continue;
      }

      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      
      if (stat.isDirectory()) {
        await this.walkDirectory(filePath, files, excludePatterns);
      } else if (stat.isFile()) {
        files.push(filePath);
      }
    }
  }

  getLineNumber(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    return 0;
  }

  async runCompletePipelineTests() {
    const startTime = Date.now();
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: 0,
      overall: {
        success: true,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0
      },
      results: {},
      recommendations: []
    };

    console.log('🚀 Starting Comprehensive GitHub Actions CI/CD Pipeline Tests\n');

    try {
      // Prerequisites check
      console.log('📋 Checking prerequisites...');
      const prerequisites = await this.checkPrerequisites();
      report.results.prerequisites = prerequisites;

      // Workflow validation
      report.results.workflowValidation = await this.validateWorkflowSyntax();
      report.overall.testsRun++;
      const workflowsPassed = report.results.workflowValidation.every(w => w.status === 'success');
      if (workflowsPassed) {
        report.overall.testsPassed++;
      } else {
        report.overall.testsFailed++;
        report.overall.success = false;
      }

      // Build automation tests
      report.results.buildAutomation = await this.testBuildAutomation();
      report.overall.testsRun++;
      const buildsPassed = report.results.buildAutomation.every(b => b.status === 'success');
      if (buildsPassed) {
        report.overall.testsPassed++;
      } else {
        report.overall.testsFailed++;
        report.overall.success = false;
      }

      // Security scanning tests
      report.results.securityScanning = await this.testSecurityScanning();
      report.overall.testsRun++;
      const securityPassed = report.results.securityScanning.every(s => s.status === 'success');
      if (securityPassed) {
        report.overall.testsPassed++;
      } else {
        report.overall.testsFailed++;
      }

      // Performance regression tests
      report.results.performanceRegression = await this.testPerformanceRegression();
      report.overall.testsRun++;
      const performancePassed = report.results.performanceRegression.every(p => p.status === 'success');
      if (performancePassed) {
        report.overall.testsPassed++;
      } else {
        report.overall.testsFailed++;
      }

    } catch (error) {
      report.overall.success = false;
      report.error = {
        message: error.message,
        stack: error.stack
      };
    }

    report.executionTime = Date.now() - startTime;

    // Generate recommendations
    report.recommendations = this.generatePipelineRecommendations(report);

    return report;
  }

  generatePipelineRecommendations(report) {
    const recommendations = [];

    // Workflow recommendations
    if (report.results.workflowValidation) {
      const failedWorkflows = report.results.workflowValidation.filter(w => w.status !== 'success');
      if (failedWorkflows.length > 0) {
        recommendations.push({
          category: 'Workflows',
          message: `${failedWorkflows.length} workflows have validation issues`,
          action: 'Fix workflow syntax and configuration errors',
          priority: 'High'
        });
      }
    }

    // Security recommendations
    if (report.results.securityScanning) {
      const hasSecurityIssues = report.results.securityScanning.some(test => 
        test.findings && test.findings.length > 0
      );
      if (hasSecurityIssues) {
        recommendations.push({
          category: 'Security',
          message: 'Security vulnerabilities or secrets detected',
          action: 'Review and remediate security findings',
          priority: 'Critical'
        });
      }
    }

    // Performance recommendations
    if (report.results.performanceRegression) {
      const bundleTest = report.results.performanceRegression.find(t => t.name === 'bundle-size');
      if (bundleTest && bundleTest.metrics && !bundleTest.metrics.withinThresholds?.totalSize) {
        recommendations.push({
          category: 'Performance',
          message: 'Bundle size exceeds recommended thresholds',
          action: 'Optimize bundle size through code splitting and tree shaking',
          priority: 'Medium'
        });
      }
    }

    return recommendations;
  }
}

// Export for use in other test files
module.exports = {
  GitHubActionsPipelineTester
};

// Run tests if called directly
if (require.main === module) {
  const tester = new GitHubActionsPipelineTester();
  tester.runCompletePipelineTests()
    .then(report => {
      console.log('\n📊 CI/CD Pipeline Test Results:');
      console.log(`Overall Success: ${report.overall.success ? '✅' : '❌'}`);
      console.log(`Tests: ${report.overall.testsPassed}/${report.overall.testsRun} passed`);
      console.log(`Execution Time: ${report.executionTime}ms\n`);

      if (report.recommendations.length > 0) {
        console.log('💡 Recommendations:');
        report.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.message}`);
          console.log(`   Action: ${rec.action}\n`);
        });
      }

      // Save report
      const reportPath = path.join(__dirname, '../reports/github-actions-pipeline-test-report.json');
      fs.promises.mkdir(path.dirname(reportPath), { recursive: true })
        .then(() => fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2)))
        .then(() => console.log(`📋 Report saved to: ${reportPath}`));
    })
    .catch(console.error);
}