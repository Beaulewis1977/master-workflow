#!/usr/bin/env node

/**
 * Fullstack-Modern Template Test Runner
 * Orchestrates comprehensive testing across all technology layers
 */

const path = require('path');
const fs = require('fs').promises;

// Import test modules
const FrontendTests = require('./fullstack-modern/frontend-tests');
const BackendTests = require('./fullstack-modern/backend-tests');
const StylingUITests = require('./fullstack-modern/styling-ui-tests');
const StateManagementTests = require('./fullstack-modern/state-management-tests');
const PerformanceTests = require('./fullstack-modern/performance-tests');
const SecurityTests = require('./fullstack-modern/security-tests');
const E2ETests = require('./fullstack-modern/e2e-tests');

class FullstackModernTestRunner {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../templates/fullstack-modern');
    this.testProjectPath = path.resolve(__dirname, '../test-projects/fullstack-modern-test');
    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        passRate: 0
      },
      categories: {},
      detailed: [],
      metrics: {},
      recommendations: []
    };
    this.startTime = Date.now();
  }

  async runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive Fullstack-Modern Template Testing');
    console.log('=' .repeat(80));
    console.log('Testing: Next.js 14, React 18, Tailwind CSS, shadcn/ui, Zustand, Supabase, Rust');
    console.log('=' .repeat(80));

    try {
      // 1. Setup test environment
      await this.setupTestEnvironment();

      // 2. Run all test categories
      await this.runTestCategory('Frontend (Next.js 14 + React 18)', FrontendTests);
      await this.runTestCategory('Backend (Rust + Axum)', BackendTests);
      await this.runTestCategory('Styling & UI (Tailwind + shadcn/ui)', StylingUITests);
      await this.runTestCategory('State Management (Zustand)', StateManagementTests);
      await this.runTestCategory('Performance & Optimization', PerformanceTests);
      await this.runTestCategory('Security & Validation', SecurityTests);
      await this.runTestCategory('End-to-End & Integration', E2ETests);

      // 3. Generate comprehensive report
      await this.generateComprehensiveReport();
      
      // 4. Cleanup
      await this.cleanup();

      console.log('\n✅ Comprehensive testing completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      throw error;
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
      
      // Install dependencies in background (optional)
      // await this.installDependencies();
      
      console.log('✅ Test environment setup completed');
      
    } catch (error) {
      console.error('❌ Test environment setup failed:', error);
      throw error;
    }
  }

  async runTestCategory(categoryName, TestClass) {
    console.log(`\n🧪 Testing ${categoryName}...`);
    console.log('-'.repeat(60));
    
    const startTime = Date.now();
    const testInstance = new TestClass(this.testProjectPath);
    
    try {
      const categoryResults = await testInstance.runAllTests();
      const duration = Date.now() - startTime;
      
      // Process results
      const categoryStats = this.processResults(categoryResults, categoryName, duration);
      this.results.categories[categoryName] = categoryStats;
      
      // Update overall summary
      this.results.summary.totalTests += categoryStats.totalTests;
      this.results.summary.passed += categoryStats.passed;
      this.results.summary.failed += categoryStats.failed;
      this.results.summary.skipped += categoryStats.skipped;
      
      // Add detailed results
      this.results.detailed.push(...categoryResults.map(result => ({
        ...result,
        category: categoryName,
        timestamp: new Date().toISOString()
      })));
      
      // Display category summary
      this.displayCategorySummary(categoryName, categoryStats);
      
    } catch (error) {
      console.error(`❌ ${categoryName} tests failed:`, error);
      this.results.categories[categoryName] = {
        totalTests: 1,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        passRate: 0,
        error: error.message
      };
    }
  }

  processResults(results, categoryName, duration) {
    const stats = {
      totalTests: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed && r.error).length,
      skipped: results.filter(r => r.skipped).length,
      duration,
      passRate: 0,
      tests: results
    };
    
    stats.passRate = stats.totalTests > 0 ? 
      Math.round((stats.passed / stats.totalTests) * 100) : 0;
    
    return stats;
  }

  displayCategorySummary(categoryName, stats) {
    const passIcon = stats.passRate >= 80 ? '✅' : stats.passRate >= 60 ? '⚠️' : '❌';
    
    console.log(`\n${passIcon} ${categoryName} Summary:`);
    console.log(`   Tests: ${stats.totalTests} | Passed: ${stats.passed} | Failed: ${stats.failed} | Pass Rate: ${stats.passRate}%`);
    console.log(`   Duration: ${Math.round(stats.duration / 1000)}s`);
    
    // Show failed tests
    if (stats.failed > 0) {
      const failedTests = stats.tests.filter(t => !t.passed && t.error);
      console.log(`   Failed Tests:`);
      failedTests.forEach(test => {
        console.log(`     - ${test.test}: ${test.error}`);
      });
    }
  }

  async generateComprehensiveReport() {
    const endTime = Date.now();
    this.results.summary.duration = endTime - this.startTime;
    this.results.summary.passRate = this.results.summary.totalTests > 0 ? 
      Math.round((this.results.summary.passed / this.results.summary.totalTests) * 100) : 0;
    
    // Generate quality assessment
    this.results.qualityAssessment = this.generateQualityAssessment();
    
    // Generate recommendations
    this.results.recommendations = this.generateRecommendations();
    
    // Generate technology-specific metrics
    this.results.technologyMetrics = this.generateTechnologyMetrics();
    
    // Save comprehensive report
    const reportId = `fullstack-modern-${Date.now()}`;
    const reportPath = path.join(__dirname, `${reportId}-comprehensive-report.json`);
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate markdown summary
    const markdownSummary = this.generateMarkdownReport();
    const summaryPath = path.join(__dirname, `${reportId}-summary.md`);
    await fs.writeFile(summaryPath, markdownSummary);
    
    // Display final summary
    this.displayFinalSummary(reportPath, summaryPath);
  }

  generateQualityAssessment() {
    const categories = Object.values(this.results.categories);
    const avgPassRate = categories.reduce((sum, cat) => sum + cat.passRate, 0) / categories.length;
    
    let grade = 'F';
    let assessment = 'Needs significant improvement';
    
    if (avgPassRate >= 95) {
      grade = 'A+';
      assessment = 'Excellent - Production ready';
    } else if (avgPassRate >= 90) {
      grade = 'A';
      assessment = 'Very good - Minor improvements needed';
    } else if (avgPassRate >= 80) {
      grade = 'B';
      assessment = 'Good - Some improvements recommended';
    } else if (avgPassRate >= 70) {
      grade = 'C';
      assessment = 'Fair - Multiple issues need attention';
    } else if (avgPassRate >= 60) {
      grade = 'D';
      assessment = 'Poor - Significant issues present';
    }
    
    return {
      grade,
      assessment,
      averagePassRate: Math.round(avgPassRate),
      readinessLevel: this.assessReadinessLevel(avgPassRate)
    };
  }

  assessReadinessLevel(passRate) {
    if (passRate >= 95) return 'Production Ready';
    if (passRate >= 85) return 'Near Production Ready';
    if (passRate >= 75) return 'Development Ready';
    if (passRate >= 60) return 'Prototype Ready';
    return 'Needs Major Work';
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze each category for specific recommendations
    Object.entries(this.results.categories).forEach(([category, stats]) => {
      if (stats.passRate < 80) {
        recommendations.push({
          category,
          priority: stats.passRate < 60 ? 'HIGH' : 'MEDIUM',
          issue: `${category} pass rate is ${stats.passRate}%`,
          recommendation: this.getCategoryRecommendation(category, stats)
        });
      }
    });
    
    // Add general recommendations based on overall performance
    if (this.results.summary.passRate < 85) {
      recommendations.push({
        category: 'General',
        priority: 'HIGH',
        issue: 'Overall template quality below production standards',
        recommendation: 'Review failed tests and implement missing features before production use'
      });
    }
    
    return recommendations;
  }

  getCategoryRecommendation(category, stats) {
    const failedTests = stats.tests.filter(t => !t.passed);
    
    switch (category) {
      case 'Frontend (Next.js 14 + React 18)':
        return 'Review Next.js configuration, ensure TypeScript setup is complete, and verify all React 18 features are properly implemented';
      case 'Backend (Rust + Axum)':
        return 'Check Rust installation, verify Cargo dependencies, and ensure all Axum routes are properly configured';
      case 'Styling & UI (Tailwind + shadcn/ui)':
        return 'Verify Tailwind CSS configuration, ensure shadcn/ui components are properly installed, and check responsive design implementation';
      case 'State Management (Zustand)':
        return 'Review Zustand store configuration, implement proper TypeScript types, and add state persistence if needed';
      case 'Performance & Optimization':
        return 'Optimize bundle sizes, implement code splitting, and configure proper caching strategies';
      case 'Security & Validation':
        return 'Implement missing security headers, add input validation, and review authentication security';
      case 'End-to-End & Integration':
        return 'Set up Playwright testing, implement proper error boundaries, and ensure all user flows work correctly';
      default:
        return 'Review failed tests and implement missing features';
    }
  }

  generateTechnologyMetrics() {
    return {
      nextjs: this.getTechnologyScore('Frontend'),
      react: this.getTechnologyScore('Frontend'),
      tailwind: this.getTechnologyScore('Styling & UI'),
      shadcnui: this.getTechnologyScore('Styling & UI'),
      zustand: this.getTechnologyScore('State Management'),
      rust: this.getTechnologyScore('Backend'),
      axum: this.getTechnologyScore('Backend'),
      supabase: this.getTechnologyScore('End-to-End'),
      performance: this.getTechnologyScore('Performance'),
      security: this.getTechnologyScore('Security')
    };
  }

  getTechnologyScore(categoryPattern) {
    const category = Object.keys(this.results.categories).find(cat => 
      cat.includes(categoryPattern)
    );
    
    return category ? this.results.categories[category].passRate : 0;
  }

  generateMarkdownReport() {
    const qa = this.results.qualityAssessment;
    
    return `# Fullstack-Modern Template Test Report

## Overall Assessment
- **Grade**: ${qa.grade}
- **Assessment**: ${qa.assessment}
- **Readiness Level**: ${qa.readinessLevel}
- **Overall Pass Rate**: ${this.results.summary.passRate}%

## Summary
- **Total Tests**: ${this.results.summary.totalTests}
- **Passed**: ${this.results.summary.passed}
- **Failed**: ${this.results.summary.failed}
- **Duration**: ${Math.round(this.results.summary.duration / 1000)}s

## Category Results

${Object.entries(this.results.categories).map(([category, stats]) => `
### ${category}
- **Pass Rate**: ${stats.passRate}%
- **Tests**: ${stats.totalTests} (${stats.passed} passed, ${stats.failed} failed)
- **Duration**: ${Math.round(stats.duration / 1000)}s
${stats.failed > 0 ? `- **Issues**: ${stats.tests.filter(t => !t.passed).map(t => t.test).join(', ')}` : ''}
`).join('')}

## Technology Scores

| Technology | Score | Status |
|------------|-------|--------|
| Next.js 14 | ${this.getTechnologyScore('Frontend')}% | ${this.getScoreStatus(this.getTechnologyScore('Frontend'))} |
| React 18 | ${this.getTechnologyScore('Frontend')}% | ${this.getScoreStatus(this.getTechnologyScore('Frontend'))} |
| Tailwind CSS | ${this.getTechnologyScore('Styling')}% | ${this.getScoreStatus(this.getTechnologyScore('Styling'))} |
| shadcn/ui | ${this.getTechnologyScore('Styling')}% | ${this.getScoreStatus(this.getTechnologyScore('Styling'))} |
| Zustand | ${this.getTechnologyScore('State')}% | ${this.getScoreStatus(this.getTechnologyScore('State'))} |
| Rust + Axum | ${this.getTechnologyScore('Backend')}% | ${this.getScoreStatus(this.getTechnologyScore('Backend'))} |
| Performance | ${this.getTechnologyScore('Performance')}% | ${this.getScoreStatus(this.getTechnologyScore('Performance'))} |
| Security | ${this.getTechnologyScore('Security')}% | ${this.getScoreStatus(this.getTechnologyScore('Security'))} |

## Recommendations

${this.results.recommendations.map(rec => `
### ${rec.category} (${rec.priority} Priority)
**Issue**: ${rec.issue}
**Recommendation**: ${rec.recommendation}
`).join('')}

## Failed Tests

${this.results.detailed.filter(test => !test.passed).map(test => `
- **${test.category}**: ${test.test}
  - Error: ${test.error || 'Test failed'}
`).join('')}

---
*Generated on ${new Date().toISOString()}*
`;
  }

  getScoreStatus(score) {
    if (score >= 90) return '✅ Excellent';
    if (score >= 80) return '✅ Good';
    if (score >= 70) return '⚠️ Fair';
    if (score >= 60) return '⚠️ Poor';
    return '❌ Needs Work';
  }

  displayFinalSummary(reportPath, summaryPath) {
    const qa = this.results.qualityAssessment;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Grade: ${qa.grade} - ${qa.assessment}`);
    console.log(`Readiness Level: ${qa.readinessLevel}`);
    console.log(`Overall Pass Rate: ${this.results.summary.passRate}%`);
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Duration: ${Math.round(this.results.summary.duration / 1000)}s`);
    
    console.log('\n📈 Category Performance:');
    Object.entries(this.results.categories).forEach(([category, stats]) => {
      const status = stats.passRate >= 80 ? '✅' : stats.passRate >= 60 ? '⚠️' : '❌';
      console.log(`  ${status} ${category}: ${stats.passRate}%`);
    });
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      this.results.recommendations.slice(0, 3).forEach(rec => {
        console.log(`  • ${rec.category}: ${rec.recommendation.substring(0, 80)}...`);
      });
    }
    
    console.log(`\n📄 Reports Generated:`);
    console.log(`  Detailed: ${reportPath}`);
    console.log(`  Summary: ${summaryPath}`);
    console.log('='.repeat(80));
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

  async cleanupTestProject() {
    try {
      await fs.rm(this.testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, that's fine
    }
  }

  async cleanup() {
    // Optional: Clean up test project after testing
    // await this.cleanupTestProject();
    console.log('\n🧹 Test environment cleaned up');
  }
}

// Run the comprehensive test suite if called directly
if (require.main === module) {
  const testRunner = new FullstackModernTestRunner();
  testRunner.runComprehensiveTests().catch(error => {
    console.error('Comprehensive test suite failed:', error);
    process.exit(1);
  });
}

module.exports = FullstackModernTestRunner;