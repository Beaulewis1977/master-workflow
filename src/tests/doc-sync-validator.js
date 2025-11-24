#!/usr/bin/env node
/**
 * Master Workflow 3.0 - Documentation Sync Validator
 * ===================================================
 * Phase 4: Verify documentation matches implementation
 * 
 * Validates:
 * - AUTONOMOUS-DOC-SYSTEM/ docs match implementation
 * - ENGINE_IMPROVEMENT_DOCS/ targets are met
 * - IMPLEMENTATION_SUMMARY.md is accurate
 */

import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { EngineManager } from '../engines/index.js';
import { AutonomousSystem } from '../autonomous-system/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

class DocSyncValidator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      projectPath: options.projectPath || PROJECT_ROOT,
      verbose: options.verbose || false
    };
    
    this.results = {
      validations: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
      syncReport: { inSync: [], outOfSync: [], missing: [] }
    };
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  async validate(name, description, validationFn) {
    console.log(`\n  🔍 ${name}`);
    console.log(`     ${description}`);
    
    try {
      const result = await validationFn();
      this.results.validations.push({ name, description, ...result });
      this.results.summary.total++;
      
      if (result.passed) {
        this.results.summary.passed++;
        console.log(`     ✅ PASSED: ${result.message}`);
      } else if (result.warning) {
        this.results.summary.warnings++;
        console.log(`     ⚠️  WARNING: ${result.message}`);
      } else {
        this.results.summary.failed++;
        console.log(`     ❌ FAILED: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      this.results.validations.push({ name, description, passed: false, error: error.message });
      this.results.summary.total++;
      this.results.summary.failed++;
      console.log(`     ❌ ERROR: ${error.message}`);
      return { passed: false, error: error.message };
    }
  }

  async runAll() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        📚 Documentation Sync Validator - Phase 4 📚          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    const startTime = Date.now();

    // Group 1: Implementation Summary Validation
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Group 1: Implementation Summary Validation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.validateImplementationSummary();

    // Group 2: Autonomous System Docs
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 Group 2: Autonomous System Documentation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.validateAutonomousSystemDocs();

    // Group 3: Engine Improvement Docs
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  Group 3: Engine Improvement Documentation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.validateEngineImprovementDocs();

    // Group 4: File Existence Validation
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📁 Group 4: File Existence Validation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.validateFileExistence();

    // Group 5: Feature Completeness
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Group 5: Feature Completeness');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await this.validateFeatureCompleteness();

    // Generate and save sync report
    const totalDuration = Date.now() - startTime;
    await this.generateSyncReport(totalDuration);
    this.printSummary(totalDuration);

    return this.results;
  }

  // ============================================
  // Group 1: Implementation Summary Validation
  // ============================================

  async validateImplementationSummary() {
    const summaryPath = path.join(this.options.projectPath, 'IMPLEMENTATION_SUMMARY.md');
    
    await this.validate(
      'Implementation Summary Exists',
      'Verify IMPLEMENTATION_SUMMARY.md exists',
      async () => {
        try {
          await fs.access(summaryPath);
          return { passed: true, message: 'File exists' };
        } catch {
          return { passed: false, message: 'File not found' };
        }
      }
    );

    await this.validate(
      'Phase 1 Components Documented',
      'Verify all Phase 1 components are listed',
      async () => {
        const content = await fs.readFile(summaryPath, 'utf8');
        const phase1Components = [
          'project-analyzer.js',
          'documentation-generator.js',
          'specification-engine.js',
          'implementation-planner.js',
          'progress-tracker.js',
          'quality-validator.js',
          'index.js',
          'cli.js'
        ];
        
        const missing = phase1Components.filter(c => !content.includes(c));
        if (missing.length === 0) {
          return { passed: true, message: 'All Phase 1 components documented' };
        }
        return { passed: false, message: `Missing: ${missing.join(', ')}` };
      }
    );

    await this.validate(
      'Phase 2 Components Documented',
      'Verify all Phase 2 components are listed',
      async () => {
        const content = await fs.readFile(summaryPath, 'utf8');
        const phase2Components = [
          'loop-selector.js',
          'build-loop-orchestrator.js',
          'loop-executors.js',
          'build-loops.yaml'
        ];
        
        const missing = phase2Components.filter(c => !content.includes(c));
        if (missing.length === 0) {
          return { passed: true, message: 'All Phase 2 components documented' };
        }
        return { passed: false, message: `Missing: ${missing.join(', ')}` };
      }
    );

    await this.validate(
      'Phase 3 Engines Documented',
      'Verify all Phase 3 engines are listed',
      async () => {
        const content = await fs.readFile(summaryPath, 'utf8');
        const phase3Engines = [
          'gpu-accelerator.js',
          'predictive-analytics.js',
          'auto-tuner.js',
          'swarm-intelligence.js',
          'pattern-discovery.js'
        ];
        
        const missing = phase3Engines.filter(e => !content.includes(e));
        if (missing.length === 0) {
          return { passed: true, message: 'All Phase 3 engines documented' };
        }
        return { passed: false, message: `Missing: ${missing.join(', ')}` };
      }
    );
  }

  // ============================================
  // Group 2: Autonomous System Docs
  // ============================================

  async validateAutonomousSystemDocs() {
    const docsPath = path.join(this.options.projectPath, 'AUTONOMOUS-DOC-SYSTEM');
    
    await this.validate(
      'AUTONOMOUS-DOC-SYSTEM Directory Exists',
      'Verify documentation directory exists',
      async () => {
        try {
          const stat = await fs.stat(docsPath);
          return { passed: stat.isDirectory(), message: stat.isDirectory() ? 'Directory exists' : 'Not a directory' };
        } catch {
          return { passed: false, message: 'Directory not found' };
        }
      }
    );

    await this.validate(
      'README.md Present',
      'Verify main README exists',
      async () => {
        try {
          await fs.access(path.join(docsPath, 'README.md'));
          return { passed: true, message: 'README.md exists' };
        } catch {
          return { passed: false, message: 'README.md not found' };
        }
      }
    );

    await this.validate(
      'Spec-Driven Development Documented',
      'Verify SPEC-DRIVEN-DEVELOPMENT-SYSTEM.md exists',
      async () => {
        try {
          await fs.access(path.join(docsPath, 'SPEC-DRIVEN-DEVELOPMENT-SYSTEM.md'));
          return { passed: true, message: 'Spec documentation exists' };
        } catch {
          return { passed: false, message: 'Spec documentation not found' };
        }
      }
    );

    await this.validate(
      'Implementation Matches Documentation',
      'Verify documented features are implemented',
      async () => {
        const system = new AutonomousSystem({ projectPath: this.options.projectPath, verbose: false });
        await system.initialize();
        
        const features = {
          analyze: typeof system.analyzeOnly === 'function',
          docs: typeof system.generateDocs === 'function',
          specs: typeof system.generateSpecs === 'function',
          plans: typeof system.generatePlans === 'function',
          quality: typeof system.validateQuality === 'function',
          loops: typeof system.runLoop === 'function'
        };
        
        const implemented = Object.values(features).filter(v => v).length;
        const total = Object.keys(features).length;
        
        if (implemented === total) {
          return { passed: true, message: `All ${total} features implemented` };
        }
        const missing = Object.entries(features).filter(([,v]) => !v).map(([k]) => k);
        return { passed: false, message: `Missing: ${missing.join(', ')}` };
      }
    );
  }

  // ============================================
  // Group 3: Engine Improvement Docs
  // ============================================

  async validateEngineImprovementDocs() {
    const docsPath = path.join(this.options.projectPath, 'ENGINE_IMPROVEMENT_DOCS');
    
    await this.validate(
      'ENGINE_IMPROVEMENT_DOCS Directory Exists',
      'Verify engine docs directory exists',
      async () => {
        try {
          const stat = await fs.stat(docsPath);
          return { passed: stat.isDirectory(), message: stat.isDirectory() ? 'Directory exists' : 'Not a directory' };
        } catch {
          return { passed: false, message: 'Directory not found' };
        }
      }
    );

    await this.validate(
      'Engine Fix Plans Exist',
      'Verify all engine fix plans are documented',
      async () => {
        const expectedDocs = [
          '1-GPU-ACCELERATOR-FIX-PLAN.md',
          '2-PREDICTIVE-ANALYTICS-FIX-PLAN.md',
          '3-AUTO-TUNER-FIX-PLAN.md',
          '4-SWARM-LEARNING-FIX-PLAN.md',
          '5-PATTERN-DISCOVERY-FIX-PLAN.md'
        ];
        
        const missing = [];
        for (const doc of expectedDocs) {
          try {
            await fs.access(path.join(docsPath, doc));
          } catch {
            missing.push(doc);
          }
        }
        
        if (missing.length === 0) {
          return { passed: true, message: 'All fix plans documented' };
        }
        return { warning: true, passed: false, message: `Missing: ${missing.join(', ')}` };
      }
    );

    await this.validate(
      'Engines Match Documented Targets',
      'Verify engines implement documented features',
      async () => {
        const engines = new EngineManager({ verbose: false });
        await engines.initialize();
        
        const checks = {
          gpu: engines.gpu && typeof engines.gpu.matrixMultiply === 'function',
          prediction: engines.prediction && typeof engines.prediction.predictDuration === 'function',
          tuner: engines.tuner && typeof engines.tuner.optimize === 'function',
          swarm: engines.swarm && typeof engines.swarm.particleSwarmOptimize === 'function',
          patterns: engines.patterns && typeof engines.patterns.analyzeCodebase === 'function'
        };
        
        await engines.shutdown();
        
        const implemented = Object.values(checks).filter(v => v).length;
        if (implemented === 5) {
          return { passed: true, message: 'All 5 engines implement core features' };
        }
        const missing = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
        return { passed: false, message: `Missing implementations: ${missing.join(', ')}` };
      }
    );

    await this.validate(
      'Performance Targets Documented',
      'Verify README.md contains performance targets',
      async () => {
        const readmePath = path.join(docsPath, 'README.md');
        try {
          const content = await fs.readFile(readmePath, 'utf8');
          const targets = ['3.6x', '90%', '20%', 'collective intelligence', '85%'];
          const found = targets.filter(t => content.includes(t));
          
          if (found.length >= 4) {
            return { passed: true, message: `${found.length}/5 targets documented` };
          }
          return { warning: true, passed: false, message: `Only ${found.length}/5 targets found` };
        } catch {
          return { passed: false, message: 'README.md not found' };
        }
      }
    );
  }

  // ============================================
  // Group 4: File Existence Validation
  // ============================================

  async validateFileExistence() {
    const expectedFiles = {
      'Phase 1': [
        'src/autonomous-system/project-analyzer.js',
        'src/autonomous-system/documentation-generator.js',
        'src/autonomous-system/specification-engine.js',
        'src/autonomous-system/implementation-planner.js',
        'src/autonomous-system/progress-tracker.js',
        'src/autonomous-system/quality-validator.js',
        'src/autonomous-system/index.js',
        'src/autonomous-system/cli.js'
      ],
      'Phase 2': [
        'src/autonomous-system/loop-selector.js',
        'src/autonomous-system/build-loop-orchestrator.js',
        'src/autonomous-system/loop-executors.js',
        'configs/build-loops.yaml'
      ],
      'Phase 3': [
        'src/engines/gpu-accelerator.js',
        'src/engines/predictive-analytics.js',
        'src/engines/auto-tuner.js',
        'src/engines/swarm-intelligence.js',
        'src/engines/pattern-discovery.js',
        'src/engines/index.js',
        'src/engines/test-engines.js'
      ]
    };

    for (const [phase, files] of Object.entries(expectedFiles)) {
      await this.validate(
        `${phase} Files Exist`,
        `Verify all ${phase} implementation files exist`,
        async () => {
          const missing = [];
          for (const file of files) {
            try {
              await fs.access(path.join(this.options.projectPath, file));
            } catch {
              missing.push(file);
            }
          }
          
          if (missing.length === 0) {
            return { passed: true, message: `All ${files.length} files exist` };
          }
          this.results.syncReport.missing.push(...missing);
          return { passed: false, message: `Missing ${missing.length} files: ${missing.slice(0,3).join(', ')}${missing.length > 3 ? '...' : ''}` };
        }
      );
    }
  }

  // ============================================
  // Group 5: Feature Completeness
  // ============================================

  async validateFeatureCompleteness() {
    await this.validate(
      'Loop Profiles Complete',
      'Verify all 5 loop profiles are implemented',
      async () => {
        const system = new AutonomousSystem({ projectPath: this.options.projectPath, verbose: false });
        await system.initialize();
        await system.initializeLoopSystem();
        
        const profiles = await system.getAvailableLoops();
        const expectedProfiles = ['planning', 'spec-driven', 'tdd', 'legacy-rescue', 'polish'];
        const found = profiles.map(p => p.key || p.shortName);
        const missing = expectedProfiles.filter(p => !found.includes(p));
        
        if (missing.length === 0) {
          return { passed: true, message: `All 5 loop profiles available` };
        }
        return { passed: false, message: `Missing profiles: ${missing.join(', ')}` };
      }
    );

    await this.validate(
      'Engine Algorithms Complete',
      'Verify all optimization algorithms are implemented',
      async () => {
        const engines = new EngineManager({ verbose: false });
        await engines.initialize();
        
        // Test each algorithm
        const testFn = async (c) => -(c.x * c.x);
        const paramSpace = { x: { type: 'continuous', min: -5, max: 5 } };
        
        const algorithms = ['bayesian', 'genetic', 'annealing'];
        const results = {};
        
        for (const algo of algorithms) {
          try {
            await engines.optimize(testFn, paramSpace, { algorithm: algo, maxIterations: 5 });
            results[algo] = true;
          } catch {
            results[algo] = false;
          }
        }
        
        await engines.shutdown();
        
        const working = Object.values(results).filter(v => v).length;
        if (working === algorithms.length) {
          return { passed: true, message: `All ${algorithms.length} algorithms working` };
        }
        const failed = Object.entries(results).filter(([,v]) => !v).map(([k]) => k);
        return { passed: false, message: `Failed algorithms: ${failed.join(', ')}` };
      }
    );

    await this.validate(
      'CLI Commands Available',
      'Verify CLI commands are functional',
      async () => {
        const cliPath = path.join(this.options.projectPath, 'src/autonomous-system/cli.js');
        try {
          const content = await fs.readFile(cliPath, 'utf8');
          const commands = ['analyze', 'docs', 'specs', 'plans', 'quality', 'all', 'loop'];
          const found = commands.filter(cmd => content.includes(`'${cmd}'`) || content.includes(`"${cmd}"`));
          
          if (found.length >= 6) {
            return { passed: true, message: `${found.length} CLI commands available` };
          }
          return { warning: true, passed: false, message: `Only ${found.length} commands found` };
        } catch {
          return { passed: false, message: 'CLI file not found' };
        }
      }
    );
  }

  // ============================================
  // Report Generation
  // ============================================

  async generateSyncReport(totalDuration) {
    // Categorize results
    for (const validation of this.results.validations) {
      if (validation.passed) {
        this.results.syncReport.inSync.push(validation.name);
      } else if (!validation.error) {
        this.results.syncReport.outOfSync.push({ name: validation.name, reason: validation.message });
      }
    }

    // Save report
    const outputPath = path.join(this.options.projectPath, 'test-output', 'doc-sync');
    await fs.mkdir(outputPath, { recursive: true });
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: this.results.summary,
      syncReport: this.results.syncReport,
      validations: this.results.validations
    };
    
    await fs.writeFile(
      path.join(outputPath, 'sync-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate markdown report
    const mdReport = this.generateMarkdownReport(report);
    await fs.writeFile(
      path.join(outputPath, 'SYNC-REPORT.md'),
      mdReport
    );
  }

  generateMarkdownReport(report) {
    const { summary, syncReport } = report;
    
    return `# Documentation Sync Report

**Generated:** ${report.timestamp}  
**Duration:** ${report.duration}ms

## Summary

| Metric | Count |
|--------|-------|
| Total Validations | ${summary.total} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Warnings | ${summary.warnings} |

## Sync Status

### ✅ In Sync (${syncReport.inSync.length})
${syncReport.inSync.map(item => `- ${item}`).join('\n') || '- None'}

### ❌ Out of Sync (${syncReport.outOfSync.length})
${syncReport.outOfSync.map(item => `- **${item.name}**: ${item.reason}`).join('\n') || '- None'}

### 📁 Missing Files (${syncReport.missing.length})
${syncReport.missing.map(file => `- \`${file}\``).join('\n') || '- None'}

## Recommendations

${summary.failed > 0 ? `
1. Review and update documentation for out-of-sync items
2. Create missing files or update IMPLEMENTATION_SUMMARY.md
3. Re-run validation after fixes
` : '✅ All documentation is in sync with implementation!'}
`;
  }

  printSummary(totalDuration) {
    const { passed, failed, warnings, total } = this.results.summary;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              📚 Doc Sync Validation Results 📚                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

   ✅ Passed:   ${passed}/${total}
   ❌ Failed:   ${failed}/${total}
   ⚠️  Warnings: ${warnings}/${total}
   
   📈 Pass Rate: ${passRate}%
   ⏱️  Duration:  ${totalDuration}ms

   Status: ${failed === 0 ? '🎉 ALL DOCUMENTATION IN SYNC!' : '⚠️ Some documentation needs updating'}

   📁 Report saved to: test-output/doc-sync/
    `);
  }
}

async function main() {
  const validator = new DocSyncValidator({
    verbose: process.argv.includes('--verbose'),
    projectPath: PROJECT_ROOT
  });

  try {
    const results = await validator.runAll();
    process.exit(results.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Doc sync validation failed:', error);
    process.exit(1);
  }
}

main();

export { DocSyncValidator };
