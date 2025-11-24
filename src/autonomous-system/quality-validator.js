/**
 * QualityValidator - Quality Assurance System
 * ============================================
 * Validates implementation quality against standards.
 * Part of the Autonomous Documentation & Spec-Driven Development System.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class QualityValidator extends EventEmitter {
  constructor(projectAnalysis, options = {}) {
    super();
    this.analysis = projectAnalysis;
    this.options = {
      outputDir: options.outputDir || './quality',
      thresholds: {
        testCoverage: options.testCoverage || 80,
        documentationCoverage: options.documentationCoverage || 90,
        codeQuality: options.codeQuality || 7,
        complexity: options.complexity || 10,
        duplication: options.duplication || 5
      },
      verbose: options.verbose || false
    };

    this.validationResults = {
      timestamp: null,
      overall: { passed: false, score: 0 },
      categories: new Map(),
      issues: [],
      recommendations: []
    };
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  async validateAll() {
    this.log('🔍 Running quality validation...');
    this.emit('validation:start');
    this.validationResults.timestamp = new Date().toISOString();

    try {
      await this.validateCodeQuality();
      await this.validateTestCoverage();
      await this.validateDocumentation();
      await this.validateArchitecture();
      await this.validateSecurity();
      await this.validatePerformance();

      this.calculateOverallScore();
      this.generateRecommendations();

      this.log('✅ Quality validation completed');
      this.emit('validation:complete', this.validationResults);
      return this.validationResults;
    } catch (error) {
      this.emit('validation:error', error);
      throw error;
    }
  }

  async validateCodeQuality() {
    this.log('📊 Validating code quality...');
    const components = Object.values(this.analysis.components || {});
    const metrics = this.analysis.metrics || {};

    const issues = [];
    let score = 10;

    // Check component count
    if (components.length === 0) {
      issues.push({ severity: 'warning', message: 'No components detected' });
      score -= 2;
    }

    // Check for large files (estimated by component density)
    const avgComponentsPerFile = parseFloat(metrics.code?.avgComponentsPerFile || 0);
    if (avgComponentsPerFile > 5) {
      issues.push({ severity: 'warning', message: 'High component density per file - consider splitting' });
      score -= 1;
    }

    // Check complexity
    const complexity = metrics.complexity?.estimated || 'medium';
    if (complexity === 'high') {
      issues.push({ severity: 'info', message: 'High project complexity detected' });
      score -= 1;
    }

    // Check for naming conventions
    const badNames = components.filter(c => 
      c.name.length < 3 || /^[a-z]$/.test(c.name) || /^temp|test|foo|bar/i.test(c.name)
    );
    if (badNames.length > 0) {
      issues.push({ severity: 'warning', message: `${badNames.length} components with poor naming` });
      score -= Math.min(2, badNames.length * 0.5);
    }

    // Check for exported components
    const exportedCount = components.filter(c => c.isExported).length;
    const exportRatio = components.length > 0 ? exportedCount / components.length : 0;
    if (exportRatio < 0.3) {
      issues.push({ severity: 'info', message: 'Low export ratio - many internal components' });
    }

    this.validationResults.categories.set('codeQuality', {
      name: 'Code Quality',
      score: Math.max(0, score),
      maxScore: 10,
      passed: score >= this.options.thresholds.codeQuality,
      issues
    });
  }

  async validateTestCoverage() {
    this.log('🧪 Validating test coverage...');
    const metrics = this.analysis.metrics || {};
    const coverage = metrics.quality?.testCoverage || 0;

    const issues = [];
    let score = 10;

    if (coverage < 50) {
      issues.push({ severity: 'error', message: `Test coverage critically low: ${coverage}%` });
      score = Math.max(0, coverage / 10);
    } else if (coverage < this.options.thresholds.testCoverage) {
      issues.push({ severity: 'warning', message: `Test coverage below threshold: ${coverage}% < ${this.options.thresholds.testCoverage}%` });
      score = Math.max(0, (coverage / this.options.thresholds.testCoverage) * 10);
    }

    // Check for test file presence
    const structure = this.analysis.structure || {};
    const hasTestDir = this.hasDirectory(structure.tree, 'test') || 
                       this.hasDirectory(structure.tree, 'tests') ||
                       this.hasDirectory(structure.tree, '__tests__');
    
    if (!hasTestDir) {
      issues.push({ severity: 'warning', message: 'No dedicated test directory found' });
      score -= 1;
    }

    this.validationResults.categories.set('testCoverage', {
      name: 'Test Coverage',
      score: Math.max(0, Math.min(10, score)),
      maxScore: 10,
      passed: coverage >= this.options.thresholds.testCoverage,
      coverage,
      threshold: this.options.thresholds.testCoverage,
      issues
    });
  }

  async validateDocumentation() {
    this.log('📚 Validating documentation...');
    const docs = this.analysis.documentation || {};
    const components = Object.values(this.analysis.components || {});
    const docCoverage = this.analysis.metrics?.quality?.documentationCoverage || 0;

    const issues = [];
    let score = 10;

    // Check README
    const hasReadme = Object.keys(docs).some(k => k.toLowerCase().includes('readme'));
    if (!hasReadme) {
      issues.push({ severity: 'error', message: 'No README file found' });
      score -= 3;
    }

    // Check doc coverage
    if (docCoverage < this.options.thresholds.documentationCoverage) {
      issues.push({ severity: 'warning', message: `Documentation coverage: ${docCoverage}% < ${this.options.thresholds.documentationCoverage}%` });
      score -= 2;
    }

    // Check for API docs
    const hasApiDocs = Object.keys(docs).some(k => k.toLowerCase().includes('api'));
    if (!hasApiDocs && components.length > 10) {
      issues.push({ severity: 'info', message: 'No API documentation found' });
      score -= 1;
    }

    // Check doc quality (sections, code examples)
    const docValues = Object.values(docs);
    const avgSections = docValues.length > 0 
      ? docValues.reduce((sum, d) => sum + (d.sections || 0), 0) / docValues.length 
      : 0;
    
    if (avgSections < 3 && docValues.length > 0) {
      issues.push({ severity: 'info', message: 'Documentation files have few sections' });
      score -= 1;
    }

    this.validationResults.categories.set('documentation', {
      name: 'Documentation',
      score: Math.max(0, score),
      maxScore: 10,
      passed: score >= 7,
      coverage: docCoverage,
      issues
    });
  }

  async validateArchitecture() {
    this.log('🏗️ Validating architecture...');
    const patterns = this.analysis.patterns || {};
    const structure = this.analysis.structure || {};

    const issues = [];
    let score = 10;

    // Check for architectural patterns
    if (patterns.architectural?.length === 0) {
      issues.push({ severity: 'info', message: 'No clear architectural pattern detected' });
      score -= 1;
    }

    // Check directory structure depth
    if (structure.depth > 10) {
      issues.push({ severity: 'warning', message: `Deep directory structure: ${structure.depth} levels` });
      score -= 1;
    }

    // Check for separation of concerns
    const hasSrc = this.hasDirectory(structure.tree, 'src');
    const hasLib = this.hasDirectory(structure.tree, 'lib');
    if (!hasSrc && !hasLib) {
      issues.push({ severity: 'info', message: 'No src/ or lib/ directory - consider organizing code' });
      score -= 1;
    }

    // Check for config separation
    const hasConfig = this.hasDirectory(structure.tree, 'config') || 
                      this.hasDirectory(structure.tree, 'configs');
    if (!hasConfig && structure.totalFiles > 20) {
      issues.push({ severity: 'info', message: 'No dedicated config directory' });
    }

    this.validationResults.categories.set('architecture', {
      name: 'Architecture',
      score: Math.max(0, score),
      maxScore: 10,
      passed: score >= 7,
      patterns: patterns.architectural?.map(p => p.name) || [],
      issues
    });
  }

  async validateSecurity() {
    this.log('🔒 Validating security...');
    const deps = this.analysis.dependencies || {};
    const prodDeps = deps.node?.production || {};

    const issues = [];
    let score = 10;

    // Check for security-related packages
    const securityPackages = ['helmet', 'cors', 'express-rate-limit', 'bcrypt', 'jsonwebtoken'];
    const hasSecurityPackages = securityPackages.some(pkg => prodDeps[pkg]);
    
    if (!hasSecurityPackages && Object.keys(prodDeps).length > 10) {
      issues.push({ severity: 'warning', message: 'No common security packages detected' });
      score -= 2;
    }

    // Check for potentially vulnerable patterns (basic check)
    const dangerousPackages = ['eval', 'vm2'];
    const hasDangerous = dangerousPackages.some(pkg => prodDeps[pkg]);
    if (hasDangerous) {
      issues.push({ severity: 'warning', message: 'Potentially dangerous packages detected' });
      score -= 2;
    }

    // Check for .env handling
    const hasEnvPackage = prodDeps['dotenv'] || prodDeps['env-cmd'];
    if (!hasEnvPackage && Object.keys(prodDeps).length > 5) {
      issues.push({ severity: 'info', message: 'No environment variable management package' });
      score -= 1;
    }

    this.validationResults.categories.set('security', {
      name: 'Security',
      score: Math.max(0, score),
      maxScore: 10,
      passed: score >= 7,
      issues
    });
  }

  async validatePerformance() {
    this.log('⚡ Validating performance considerations...');
    const deps = this.analysis.dependencies || {};
    const prodDeps = deps.node?.production || {};
    const structure = this.analysis.structure || {};

    const issues = [];
    let score = 10;

    // Check dependency count
    const depCount = Object.keys(prodDeps).length;
    if (depCount > 50) {
      issues.push({ severity: 'warning', message: `High dependency count: ${depCount}` });
      score -= 2;
    } else if (depCount > 30) {
      issues.push({ severity: 'info', message: `Moderate dependency count: ${depCount}` });
      score -= 1;
    }

    // Check for performance packages
    const perfPackages = ['compression', 'redis', 'memcached', 'lru-cache'];
    const hasPerfPackages = perfPackages.some(pkg => prodDeps[pkg]);
    if (!hasPerfPackages && depCount > 20) {
      issues.push({ severity: 'info', message: 'No caching/compression packages detected' });
    }

    // Check file count
    if (structure.totalFiles > 500) {
      issues.push({ severity: 'info', message: `Large codebase: ${structure.totalFiles} files` });
    }

    this.validationResults.categories.set('performance', {
      name: 'Performance',
      score: Math.max(0, score),
      maxScore: 10,
      passed: score >= 7,
      issues
    });
  }

  calculateOverallScore() {
    const categories = Array.from(this.validationResults.categories.values());
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    const maxScore = categories.reduce((sum, cat) => sum + cat.maxScore, 0);
    
    const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const allPassed = categories.every(cat => cat.passed);

    this.validationResults.overall = {
      passed: allPassed,
      score: overallScore,
      grade: this.scoreToGrade(overallScore),
      totalCategories: categories.length,
      passedCategories: categories.filter(c => c.passed).length
    };

    // Collect all issues
    this.validationResults.issues = categories.flatMap(cat => 
      cat.issues.map(issue => ({ ...issue, category: cat.name }))
    );
  }

  scoreToGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateRecommendations() {
    const recommendations = [];
    const categories = this.validationResults.categories;

    // Test coverage recommendations
    const testCat = categories.get('testCoverage');
    if (testCat && !testCat.passed) {
      recommendations.push({
        priority: 'high',
        category: 'Testing',
        recommendation: 'Increase test coverage to at least 80%',
        actions: [
          'Add unit tests for core business logic',
          'Add integration tests for API endpoints',
          'Set up coverage reporting in CI/CD'
        ]
      });
    }

    // Documentation recommendations
    const docCat = categories.get('documentation');
    if (docCat && !docCat.passed) {
      recommendations.push({
        priority: 'medium',
        category: 'Documentation',
        recommendation: 'Improve documentation coverage',
        actions: [
          'Add or update README with setup instructions',
          'Generate API documentation',
          'Add inline code comments for complex logic'
        ]
      });
    }

    // Security recommendations
    const secCat = categories.get('security');
    if (secCat && secCat.issues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Security',
        recommendation: 'Address security concerns',
        actions: [
          'Add security middleware (helmet, cors)',
          'Implement rate limiting',
          'Review and update dependencies'
        ]
      });
    }

    // Architecture recommendations
    const archCat = categories.get('architecture');
    if (archCat && !archCat.passed) {
      recommendations.push({
        priority: 'medium',
        category: 'Architecture',
        recommendation: 'Improve code organization',
        actions: [
          'Establish clear directory structure',
          'Separate concerns (controllers, services, models)',
          'Document architectural decisions'
        ]
      });
    }

    this.validationResults.recommendations = recommendations;
  }

  hasDirectory(tree, name) {
    if (!tree) return false;
    for (const [k, v] of Object.entries(tree)) {
      if (k === name && v.type === 'directory') return true;
      if (v.type === 'directory' && v.children && this.hasDirectory(v.children, name)) return true;
    }
    return false;
  }

  async generateReport() {
    let content = `# Quality Validation Report\n\n`;
    content += `**Generated:** ${this.validationResults.timestamp}\n\n`;

    // Overall Score
    const overall = this.validationResults.overall;
    content += `## Overall Score\n\n`;
    content += `**Grade: ${overall.grade}** (${overall.score}%)\n\n`;
    content += `Status: ${overall.passed ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}\n\n`;
    content += `Categories Passed: ${overall.passedCategories}/${overall.totalCategories}\n\n`;

    // Category Details
    content += `## Category Scores\n\n`;
    content += `| Category | Score | Status |\n`;
    content += `|----------|-------|--------|\n`;
    
    for (const [, cat] of this.validationResults.categories) {
      const status = cat.passed ? '✅' : '❌';
      content += `| ${cat.name} | ${cat.score}/${cat.maxScore} | ${status} |\n`;
    }
    content += '\n';

    // Issues
    if (this.validationResults.issues.length > 0) {
      content += `## Issues Found\n\n`;
      
      const errors = this.validationResults.issues.filter(i => i.severity === 'error');
      const warnings = this.validationResults.issues.filter(i => i.severity === 'warning');
      const infos = this.validationResults.issues.filter(i => i.severity === 'info');

      if (errors.length > 0) {
        content += `### Errors\n\n`;
        for (const issue of errors) {
          content += `- ❌ **${issue.category}:** ${issue.message}\n`;
        }
        content += '\n';
      }

      if (warnings.length > 0) {
        content += `### Warnings\n\n`;
        for (const issue of warnings) {
          content += `- ⚠️ **${issue.category}:** ${issue.message}\n`;
        }
        content += '\n';
      }

      if (infos.length > 0) {
        content += `### Info\n\n`;
        for (const issue of infos) {
          content += `- ℹ️ **${issue.category}:** ${issue.message}\n`;
        }
        content += '\n';
      }
    }

    // Recommendations
    if (this.validationResults.recommendations.length > 0) {
      content += `## Recommendations\n\n`;
      
      for (const rec of this.validationResults.recommendations) {
        content += `### ${rec.category} (${rec.priority} priority)\n\n`;
        content += `**${rec.recommendation}**\n\n`;
        content += `Actions:\n`;
        for (const action of rec.actions) {
          content += `- [ ] ${action}\n`;
        }
        content += '\n';
      }
    }

    return content;
  }

  async saveReport(outputDir) {
    const dir = outputDir || this.options.outputDir;
    await fs.mkdir(dir, { recursive: true });

    // Save JSON results
    const jsonPath = path.join(dir, 'quality-results.json');
    const jsonData = {
      ...this.validationResults,
      categories: Object.fromEntries(this.validationResults.categories)
    };
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

    // Save markdown report
    const report = await this.generateReport();
    const mdPath = path.join(dir, 'QUALITY_REPORT.md');
    await fs.writeFile(mdPath, report, 'utf8');

    this.log(`💾 Quality report saved to ${dir}`);
    this.emit('report:saved', { dir });
  }
}

export default QualityValidator;
