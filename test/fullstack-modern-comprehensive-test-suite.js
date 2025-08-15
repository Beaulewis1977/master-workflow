#!/usr/bin/env node

/**
 * Comprehensive Test Automation Suite for Fullstack-Modern Template
 * Testing: Next.js 14, Tailwind CSS, shadcn/ui, Zustand, Supabase, Rust backend
 * 
 * This test suite validates all technology configurations, integrations, and functionality
 * including performance benchmarks and security validation.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class FullstackModernTestSuite {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../templates/fullstack-modern');
    this.testProjectPath = path.resolve(__dirname, '../test-projects/fullstack-modern-test');
    this.results = {
      overall: { passed: 0, failed: 0, skipped: 0 },
      frontend: { passed: 0, failed: 0, skipped: 0 },
      backend: { passed: 0, failed: 0, skipped: 0 },
      integration: { passed: 0, failed: 0, skipped: 0 },
      performance: { passed: 0, failed: 0, skipped: 0 },
      security: { passed: 0, failed: 0, skipped: 0 },
      e2e: { passed: 0, failed: 0, skipped: 0 }
    };
    this.detailedResults = [];
    this.startTime = Date.now();
  }

  async runTestSuite() {
    console.log('🚀 Starting Comprehensive Fullstack-Modern Template Test Suite');
    console.log('=' .repeat(80));

    try {
      // 1. Setup test environment
      await this.setupTestEnvironment();

      // 2. Frontend Testing (Next.js 14 + React 18)
      await this.testFrontendConfiguration();
      
      // 3. Styling and UI Testing (Tailwind CSS + shadcn/ui)
      await this.testStylingAndUI();
      
      // 4. State Management Testing (Zustand)
      await this.testStateManagement();
      
      // 5. Backend Testing (Rust + Axum)
      await this.testBackendConfiguration();
      
      // 6. Database Integration Testing (Supabase)
      await this.testSupabaseIntegration();
      
      // 7. Integration Testing
      await this.testIntegrationLayer();
      
      // 8. Performance Testing
      await this.testPerformance();
      
      // 9. Security Testing
      await this.testSecurity();
      
      // 10. End-to-End Testing
      await this.testEndToEnd();

      // 11. Generate comprehensive report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.recordResult('setup', 'Test Suite Setup', 'failed', error.message);
    }
  }

  async setupTestEnvironment() {
    console.log('\n📋 Setting up test environment...');
    
    try {
      // Clean up any existing test project
      await this.cleanupTestProject();
      
      // Create test project directory
      await fs.mkdir(this.testProjectPath, { recursive: true });
      
      // Copy template to test location
      await this.copyTemplate();
      
      // Install dependencies
      await this.installDependencies();
      
      this.recordResult('setup', 'Test Environment Setup', 'passed');
      console.log('✅ Test environment setup completed');
      
    } catch (error) {
      this.recordResult('setup', 'Test Environment Setup', 'failed', error.message);
      throw error;
    }
  }

  async testFrontendConfiguration() {
    console.log('\n🌐 Testing Frontend Configuration (Next.js 14 + React 18)...');
    
    const tests = [
      () => this.testNextjsConfig(),
      () => this.testAppRouter(),
      () => this.testSSRAndSSG(),
      () => this.testAPIRoutes(),
      () => this.testMiddleware(),
      () => this.testPerformanceOptimization(),
      () => this.testTypeScriptConfig(),
      () => this.testESLintConfig(),
      () => this.testBuildProcess()
    ];

    for (const test of tests) {
      await test();
    }
  }

  async testNextjsConfig() {
    try {
      const configPath = path.join(this.testProjectPath, 'frontend/next.config.js');
      const config = await fs.readFile(configPath, 'utf8');
      
      // Test Next.js configuration
      const requiredFeatures = [
        'experimental',
        'serverComponentsExternalPackages',
        'images',
        'rewrites',
        'headers',
        'webpack'
      ];
      
      const hasAllFeatures = requiredFeatures.every(feature => 
        config.includes(feature)
      );
      
      if (!hasAllFeatures) {
        throw new Error('Missing required Next.js configuration features');
      }
      
      // Test security headers
      const securityHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy'];
      const hasSecurityHeaders = securityHeaders.every(header => 
        config.includes(header)
      );
      
      if (!hasSecurityHeaders) {
        throw new Error('Missing required security headers');
      }
      
      this.recordResult('frontend', 'Next.js Configuration', 'passed');
      
    } catch (error) {
      this.recordResult('frontend', 'Next.js Configuration', 'failed', error.message);
    }
  }

  async testAppRouter() {
    try {
      // Check for App Router structure
      const appPath = path.join(this.testProjectPath, 'frontend/src/app');
      const layoutPath = path.join(appPath, 'layout.tsx');
      const pagePath = path.join(appPath, 'page.tsx');
      
      await fs.access(layoutPath);
      await fs.access(pagePath);
      
      // Validate layout.tsx structure
      const layoutContent = await fs.readFile(layoutPath, 'utf8');
      if (!layoutContent.includes('RootLayout') || !layoutContent.includes('children')) {
        throw new Error('Invalid layout.tsx structure');
      }
      
      // Validate page.tsx structure
      const pageContent = await fs.readFile(pagePath, 'utf8');
      if (!pageContent.includes('export default')) {
        throw new Error('Invalid page.tsx structure');
      }
      
      this.recordResult('frontend', 'App Router Structure', 'passed');
      
    } catch (error) {
      this.recordResult('frontend', 'App Router Structure', 'failed', error.message);
    }
  }

  async testSSRAndSSG() {
    try {
      // Test that Next.js can build successfully
      process.chdir(path.join(this.testProjectPath, 'frontend'));
      
      const { stdout, stderr } = await execAsync('npm run build', {
        timeout: 120000 // 2 minutes timeout
      });
      
      if (stderr && stderr.includes('error')) {
        throw new Error(`Build failed: ${stderr}`);
      }
      
      // Check for build artifacts
      const buildPath = path.join(this.testProjectPath, 'frontend/.next');
      await fs.access(buildPath);
      
      this.recordResult('frontend', 'SSR/SSG Build Process', 'passed');
      
    } catch (error) {
      this.recordResult('frontend', 'SSR/SSG Build Process', 'failed', error.message);
    }
  }

  async testStylingAndUI() {
    console.log('\n🎨 Testing Styling and UI (Tailwind CSS + shadcn/ui)...');
    
    const tests = [
      () => this.testTailwindConfig(),
      () => this.testShadcnUIIntegration(),
      () => this.testResponsiveDesign(),
      () => this.testDarkModeSupport(),
      () => this.testCustomComponentStyling(),
      () => this.testAnimations(),
      () => this.testTypography()
    ];

    for (const test of tests) {
      await test();
    }
  }

  async testTailwindConfig() {
    try {
      const configPath = path.join(this.testProjectPath, 'frontend/tailwind.config.js');
      const config = await fs.readFile(configPath, 'utf8');
      
      // Test Tailwind configuration
      const requiredFeatures = [
        'darkMode',
        'content',
        'theme',
        'extend',
        'colors',
        'keyframes',
        'animation'
      ];
      
      const hasAllFeatures = requiredFeatures.every(feature => 
        config.includes(feature)
      );
      
      if (!hasAllFeatures) {
        throw new Error('Missing required Tailwind CSS configuration features');
      }
      
      // Test for custom design system
      if (!config.includes('hsl(var(--') || !config.includes('CSS variables')) {
        console.warn('⚠️  Custom CSS variables design system not detected');
      }
      
      // Test plugins
      const requiredPlugins = ['tailwindcss-animate', '@tailwindcss/typography', '@tailwindcss/forms'];
      const hasPlugins = requiredPlugins.every(plugin => config.includes(plugin));
      
      if (!hasPlugins) {
        throw new Error('Missing required Tailwind CSS plugins');
      }
      
      this.recordResult('frontend', 'Tailwind CSS Configuration', 'passed');
      
    } catch (error) {
      this.recordResult('frontend', 'Tailwind CSS Configuration', 'failed', error.message);
    }
  }

  async testShadcnUIIntegration() {
    try {
      const packageJsonPath = path.join(this.testProjectPath, 'frontend/package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check for required shadcn/ui dependencies
      const requiredDeps = [
        '@radix-ui/react-slot',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        'class-variance-authority',
        'lucide-react'
      ];
      
      const missingDeps = requiredDeps.filter(dep => 
        !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
      );
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing shadcn/ui dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Test CSS global styles
      const globalCssPath = path.join(this.testProjectPath, 'frontend/src/app/globals.css');
      const globalCss = await fs.readFile(globalCssPath, 'utf8');
      
      if (!globalCss.includes('--background') || !globalCss.includes('--foreground')) {
        throw new Error('Missing CSS custom properties for theming');
      }
      
      this.recordResult('frontend', 'shadcn/ui Integration', 'passed');
      
    } catch (error) {
      this.recordResult('frontend', 'shadcn/ui Integration', 'failed', error.message);
    }
  }

  async testStateManagement() {
    console.log('\n🏪 Testing State Management (Zustand)...');
    
    const tests = [
      () => this.testZustandConfig(),
      () => this.testStatePersistence(),
      () => this.testStateHydration(),
      () => this.testMultipleStores(),
      () => this.testTypeScriptIntegration(),
      () => this.testDevToolsIntegration(),
      () => this.testMiddleware()
    ];

    for (const test of tests) {
      await test();
    }
  }

  async testZustandConfig() {
    try {
      const storePath = path.join(this.testProjectPath, 'frontend/src/store/app-store.ts');
      const storeContent = await fs.readFile(storePath, 'utf8');
      
      // Test Zustand store structure
      const requiredFeatures = [
        'import { create }',
        'subscribeWithSelector',
        'immer',
        'persist',
        'interface',
        'AppState'
      ];
      
      const hasAllFeatures = requiredFeatures.every(feature => 
        storeContent.includes(feature)
      );
      
      if (!hasAllFeatures) {
        throw new Error('Missing required Zustand store features');
      }
      
      // Test middleware configuration
      const middleware = ['subscribeWithSelector', 'immer', 'persist'];
      const hasMiddleware = middleware.every(mw => storeContent.includes(mw));
      
      if (!hasMiddleware) {
        throw new Error('Missing required Zustand middleware');
      }
      
      // Test TypeScript types
      if (!storeContent.includes('interface AppState') || !storeContent.includes('<AppState>')) {
        throw new Error('Missing TypeScript types for Zustand store');
      }
      
      this.recordResult('frontend', 'Zustand Configuration', 'passed');
      
    } catch (error) {
      this.recordResult('frontend', 'Zustand Configuration', 'failed', error.message);
    }
  }

  async testBackendConfiguration() {
    console.log('\n⚙️  Testing Backend Configuration (Rust + Axum)...');
    
    const tests = [
      () => this.testCargoConfig(),
      () => this.testAxumServerSetup(),
      () => this.testDatabaseIntegration(),
      () => this.testAuthenticationSetup(),
      () => this.testWebSocketSupport(),
      () => this.testCORSConfig(),
      () => this.testBuildProcess(),
      () => this.testSecurityMiddleware()
    ];

    for (const test of tests) {
      await test();
    }
  }

  async testCargoConfig() {
    try {
      const cargoPath = path.join(this.testProjectPath, 'backend/Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      // Test required dependencies
      const requiredDeps = [
        'axum',
        'tokio',
        'sqlx',
        'redis',
        'serde',
        'jsonwebtoken',
        'tower',
        'tower-http',
        'tracing'
      ];
      
      const missingDeps = requiredDeps.filter(dep => 
        !cargoContent.includes(`${dep} =`)
      );
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing required Rust dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Test features configuration
      if (!cargoContent.includes('features =')) {
        throw new Error('Missing features configuration in Cargo.toml');
      }
      
      this.recordResult('backend', 'Cargo Configuration', 'passed');
      
    } catch (error) {
      this.recordResult('backend', 'Cargo Configuration', 'failed', error.message);
    }
  }

  async testAxumServerSetup() {
    try {
      const mainPath = path.join(this.testProjectPath, 'backend/src/main.rs');
      const mainContent = await fs.readFile(mainPath, 'utf8');
      
      // Test Axum server structure
      const requiredFeatures = [
        'use axum',
        'Router::new()',
        'route(',
        'nest(',
        'layer(',
        'with_state(',
        'tokio::main'
      ];
      
      const hasAllFeatures = requiredFeatures.every(feature => 
        mainContent.includes(feature)
      );
      
      if (!hasAllFeatures) {
        throw new Error('Missing required Axum server features');
      }
      
      // Test middleware layers
      const middleware = ['TraceLayer', 'CorsLayer', 'AuthLayer'];
      const hasMiddleware = middleware.every(mw => mainContent.includes(mw));
      
      if (!hasMiddleware) {
        throw new Error('Missing required middleware layers');
      }
      
      this.recordResult('backend', 'Axum Server Setup', 'passed');
      
    } catch (error) {
      this.recordResult('backend', 'Axum Server Setup', 'failed', error.message);
    }
  }

  async testSupabaseIntegration() {
    console.log('\n🗄️  Testing Supabase Integration...');
    
    const tests = [
      () => this.testSupabaseClientConfig(),
      () => this.testDatabaseConnection(),
      () => this.testAuthenticationFlows(),
      () => this.testRealTimeSubscriptions(),
      () => this.testFileStorageIntegration()
    ];

    for (const test of tests) {
      await test();
    }
  }

  async testSupabaseClientConfig() {
    try {
      const packageJsonPath = path.join(this.testProjectPath, 'frontend/package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check for Supabase dependencies
      const supabaseDeps = [
        '@supabase/supabase-js',
        '@supabase/auth-helpers-nextjs'
      ];
      
      const missingDeps = supabaseDeps.filter(dep => 
        !packageJson.dependencies[dep]
      );
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing Supabase dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Check for Supabase provider
      const providerPath = path.join(this.testProjectPath, 'frontend/src/lib/supabase/provider.tsx');
      await fs.access(providerPath);
      
      this.recordResult('integration', 'Supabase Client Configuration', 'passed');
      
    } catch (error) {
      this.recordResult('integration', 'Supabase Client Configuration', 'failed', error.message);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    const tests = [
      () => this.testBuildPerformance(),
      () => this.testBundleSize(),
      () => this.testServerStartupTime(),
      () => this.testMemoryUsage(),
      () => this.testLoadTesting()
    ];

    for (const test of tests) {
      await test();
    }
  }

  async testBuildPerformance() {
    try {
      const startTime = Date.now();
      
      // Test frontend build performance
      process.chdir(path.join(this.testProjectPath, 'frontend'));
      await execAsync('npm run build', { timeout: 180000 }); // 3 minutes
      
      const frontendBuildTime = Date.now() - startTime;
      
      // Test backend build performance
      const backendStartTime = Date.now();
      process.chdir(path.join(this.testProjectPath, 'backend'));
      await execAsync('cargo build --release', { timeout: 300000 }); // 5 minutes
      
      const backendBuildTime = Date.now() - backendStartTime;
      
      // Performance thresholds
      if (frontendBuildTime > 120000) { // 2 minutes
        console.warn(`⚠️  Frontend build took ${frontendBuildTime}ms (> 2 min)`);
      }
      
      if (backendBuildTime > 240000) { // 4 minutes
        console.warn(`⚠️  Backend build took ${backendBuildTime}ms (> 4 min)`);
      }
      
      this.recordResult('performance', 'Build Performance', 'passed', 
        `Frontend: ${frontendBuildTime}ms, Backend: ${backendBuildTime}ms`
      );
      
    } catch (error) {
      this.recordResult('performance', 'Build Performance', 'failed', error.message);
    }
  }

  async testSecurity() {
    console.log('\n🔒 Testing Security...');
    
    const tests = [
      () => this.testSecurityHeaders(),
      () => this.testInputValidation(),
      () => this.testAuthenticationSecurity(),
      () => this.testCORSConfiguration(),
      () => this.testDependencyVulnerabilities()
    ];

    for (const test of tests) {
      await test();
    }
  }

  async testSecurityHeaders() {
    try {
      const nextConfigPath = path.join(this.testProjectPath, 'frontend/next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      const securityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options', 
        'Referrer-Policy'
      ];
      
      const missingHeaders = securityHeaders.filter(header => 
        !nextConfig.includes(header)
      );
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
      }
      
      this.recordResult('security', 'Security Headers', 'passed');
      
    } catch (error) {
      this.recordResult('security', 'Security Headers', 'failed', error.message);
    }
  }

  async testEndToEnd() {
    console.log('\n🔄 Testing End-to-End Workflows...');
    
    const tests = [
      () => this.testUserRegistrationFlow(),
      () => this.testAuthenticationFlow(),
      () => this.testDataPersistenceFlow(),
      () => this.testRealTimeFeatures(),
      () => this.testErrorHandling()
    ];

    for (const test of tests) {
      await test();
    }
  }

  // Utility methods
  async copyTemplate() {
    await this.copyRecursive(this.templatePath, this.testProjectPath);
  }

  async copyRecursive(src, dest) {
    const stats = await fs.stat(src);
    
    if (stats.isDirectory()) {
      await fs.mkdir(dest, { recursive: true });
      const items = await fs.readdir(src);
      
      for (const item of items) {
        if (item === 'node_modules' || item === 'target' || item === '.next') {
          continue; // Skip build directories
        }
        
        await this.copyRecursive(
          path.join(src, item),
          path.join(dest, item)
        );
      }
    } else {
      await fs.copyFile(src, dest);
    }
  }

  async installDependencies() {
    // Install frontend dependencies
    process.chdir(path.join(this.testProjectPath, 'frontend'));
    await execAsync('npm install', { timeout: 300000 });
    
    // Check Rust installation and install backend dependencies
    try {
      await execAsync('cargo --version');
      process.chdir(path.join(this.testProjectPath, 'backend'));
      await execAsync('cargo fetch', { timeout: 300000 });
    } catch (error) {
      console.warn('⚠️  Rust not available, skipping backend dependency installation');
    }
  }

  async cleanupTestProject() {
    try {
      await fs.rm(this.testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, that's fine
    }
  }

  recordResult(category, testName, status, details = '') {
    const result = {
      category,
      testName,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.detailedResults.push(result);
    this.results[category][status]++;
    this.results.overall[status]++;
    
    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️ ';
    console.log(`${emoji} ${testName}: ${status.toUpperCase()}${details ? ` - ${details}` : ''}`);
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      summary: {
        duration: `${Math.round(duration / 1000)}s`,
        totalTests: this.results.overall.passed + this.results.overall.failed + this.results.overall.skipped,
        passed: this.results.overall.passed,
        failed: this.results.overall.failed,
        skipped: this.results.overall.skipped,
        passRate: `${Math.round((this.results.overall.passed / (this.results.overall.passed + this.results.overall.failed)) * 100)}%`
      },
      categoryResults: this.results,
      detailedResults: this.detailedResults,
      timestamp: new Date().toISOString()
    };
    
    // Write report to file
    const reportPath = path.join(__dirname, `fullstack-modern-test-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownSummary = this.generateMarkdownSummary(report);
    const summaryPath = path.join(__dirname, `fullstack-modern-test-summary-${Date.now()}.md`);
    await fs.writeFile(summaryPath, markdownSummary);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUITE COMPLETE');
    console.log('='.repeat(80));
    console.log(`Duration: ${report.summary.duration}`);
    console.log(`Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Skipped: ${report.summary.skipped}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`\nDetailed report: ${reportPath}`);
    console.log(`Summary: ${summaryPath}`);
  }

  generateMarkdownSummary(report) {
    return `# Fullstack-Modern Template Test Report

## Summary
- **Duration**: ${report.summary.duration}
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Skipped**: ${report.summary.skipped}
- **Pass Rate**: ${report.summary.passRate}

## Category Results

### Frontend Testing
- Passed: ${report.categoryResults.frontend.passed}
- Failed: ${report.categoryResults.frontend.failed}
- Skipped: ${report.categoryResults.frontend.skipped}

### Backend Testing
- Passed: ${report.categoryResults.backend.passed}
- Failed: ${report.categoryResults.backend.failed}
- Skipped: ${report.categoryResults.backend.skipped}

### Integration Testing
- Passed: ${report.categoryResults.integration.passed}
- Failed: ${report.categoryResults.integration.failed}
- Skipped: ${report.categoryResults.integration.skipped}

### Performance Testing
- Passed: ${report.categoryResults.performance.passed}
- Failed: ${report.categoryResults.performance.failed}
- Skipped: ${report.categoryResults.performance.skipped}

### Security Testing
- Passed: ${report.categoryResults.security.passed}
- Failed: ${report.categoryResults.security.failed}
- Skipped: ${report.categoryResults.security.skipped}

### End-to-End Testing
- Passed: ${report.categoryResults.e2e.passed}
- Failed: ${report.categoryResults.e2e.failed}
- Skipped: ${report.categoryResults.e2e.skipped}

## Detailed Results

${report.detailedResults.map(result => 
  `- **${result.testName}** (${result.category}): ${result.status.toUpperCase()}${result.details ? ` - ${result.details}` : ''}`
).join('\n')}

---
*Generated on ${report.timestamp}*
`;
  }
}

// Run the test suite if called directly
if (require.main === module) {
  const testSuite = new FullstackModernTestSuite();
  testSuite.runTestSuite().catch(console.error);
}

module.exports = FullstackModernTestSuite;