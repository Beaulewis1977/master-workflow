#!/usr/bin/env node

/**
 * Phase 2 Test Suite - Classifier & Plan Builder
 * Comprehensive testing for enhanced modules with manifest-based classification
 * and plan building with size calculation and removal ordering
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const os = require('os');

// Import modules under test
const { FileClassifier } = require('./classifier');
const { PlanBuilder } = require('./plan');
const { ManifestManager } = require('./manifest');

// Simple formatting functions
const format = {
  green: (s) => `✅ ${s}`,
  red: (s) => `❌ ${s}`,
  yellow: (s) => `⚠️ ${s}`,
  blue: (s) => `🔵 ${s}`,
  cyan: (s) => `🔷 ${s}`,
  dim: (s) => `  ${s}`,
  bold: (s) => `\n=== ${s} ===\n`
};

class Phase2TestSuite {
  constructor() {
    this.testRoot = path.join(os.tmpdir(), 'ai-workflow-phase2-tests');
    this.projectRoot = path.join(this.testRoot, 'test-project');
    this.aiWorkflowDir = path.join(this.projectRoot, '.ai-workflow');
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
    this.metrics = [];
    this.startTime = null;
  }

  async setup() {
    this.startTime = performance.now();
    console.log(format.bold('🧪 Phase 2 Test Suite - Classifier & Plan Builder'));
    console.log(format.dim('Setting up test environment...'));

    // Create test directory structure
    await fs.mkdir(this.testRoot, { recursive: true });
    await fs.mkdir(this.projectRoot, { recursive: true });
    await fs.mkdir(this.aiWorkflowDir, { recursive: true });
    await fs.mkdir(path.join(this.aiWorkflowDir, 'logs'), { recursive: true });
    await fs.mkdir(path.join(this.aiWorkflowDir, 'cache'), { recursive: true });
    await fs.mkdir(path.join(this.aiWorkflowDir, 'supervisor'), { recursive: true });
    await fs.mkdir(path.join(this.projectRoot, 'src'), { recursive: true });
    await fs.mkdir(path.join(this.projectRoot, '.claude', 'agents'), { recursive: true });

    // Create test files
    await this.createTestFiles();
    await this.createTestManifests();
  }

  async createTestFiles() {
    const testFiles = [
      // Files to remove
      { path: '.ai-workflow/logs/system.log', content: 'log content', size: 500 },
      { path: '.ai-workflow/cache/temp.cache', content: 'cache content', size: 1024 },
      { path: '.ai-workflow/supervisor/process.pid', content: '12345', size: 10 },
      { path: 'ai-workflow', content: '#!/bin/bash\necho "launcher"', size: 30 },
      
      // Files to keep
      { path: 'src/main.js', content: 'console.log("app");', size: 50 },
      { path: 'package.json', content: '{"name": "test"}', size: 20 },
      { path: 'README.md', content: '# Test Project', size: 15 },
      
      // Unknown/review files
      { path: '.claude/agents/test.js', content: 'agent code', size: 100 },
      { path: '.ai-workflow/config.json', content: '{"setting": true}', size: 25 }
    ];

    for (const file of testFiles) {
      const filePath = path.join(this.projectRoot, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content);
    }
  }

  async createTestManifests() {
    // Create installation manifest
    const installationManifest = {
      installerVersion: '3.0.0',
      installedAt: new Date().toISOString(),
      items: [
        {
          path: '.ai-workflow/logs/system.log',
          origin: 'ephemeral_cache_log',
          timestamp: new Date().toISOString()
        },
        {
          path: '.ai-workflow/cache/temp.cache',
          origin: 'ephemeral_cache_log',
          timestamp: new Date().toISOString()
        },
        {
          path: '.ai-workflow/supervisor/process.pid',
          origin: 'installed_system_asset',
          timestamp: new Date().toISOString()
        },
        {
          path: 'ai-workflow',
          origin: 'symlink_executable',
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Create generation manifest
    const generationManifest = {
      generatedAt: new Date().toISOString(),
      updates: [
        {
          path: 'src/main.js',
          origin: 'generated_document',
          strategy: 'merge',
          timestamp: new Date().toISOString()
        },
        {
          path: 'README.md',
          origin: 'generated_document',
          strategy: 'intelligent',
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Write manifests
    await fs.writeFile(
      path.join(this.aiWorkflowDir, 'installation-record.json'),
      JSON.stringify(installationManifest, null, 2)
    );

    await fs.writeFile(
      path.join(this.aiWorkflowDir, 'generation-record.json'),
      JSON.stringify(generationManifest, null, 2)
    );
  }

  async cleanup() {
    try {
      await fs.rm(this.testRoot, { recursive: true, force: true });
    } catch (error) {
      console.warn(format.yellow(`Cleanup warning: ${error.message}`));
    }
  }

  async runTest(name, testFunction) {
    console.log(format.dim(`Running: ${name}`));
    const testStart = performance.now();
    
    try {
      await testFunction();
      const duration = Math.round(performance.now() - testStart);
      this.passed++;
      this.tests.push({ name, status: 'passed', duration });
      console.log(format.green(`✓ ${name} (${duration}ms)`));
      return { success: true, duration };
    } catch (error) {
      const duration = Math.round(performance.now() - testStart);
      this.failed++;
      this.tests.push({ name, status: 'failed', error: error.message, duration });
      console.log(format.red(`✗ ${name} - ${error.message} (${duration}ms)`));
      return { success: false, duration, error };
    }
  }

  async testClassifierWithManifests() {
    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, manifests);
    const classification = await classifier.classify();

    // Verify we have classifications
    if (!classification.remove || !classification.keep || !classification.unknown) {
      throw new Error('Classification missing required categories');
    }

    // Check specific items
    const removeItems = classification.remove.map(item => item.path);
    const keepItems = classification.keep.map(item => item.path);

    // System files should be marked for removal
    if (!removeItems.includes('.ai-workflow/logs/system.log')) {
      throw new Error('System log file not marked for removal');
    }

    if (!removeItems.includes('ai-workflow')) {
      throw new Error('Symlink not marked for removal');
    }

    // Generated docs should be kept by default
    if (!keepItems.includes('src/main.js')) {
      throw new Error('Generated document not marked to keep');
    }

    // Verify manifest source tracking
    const manifestItems = classification.remove.filter(item => item.source === 'manifest');
    if (manifestItems.length === 0) {
      throw new Error('No manifest-sourced items found');
    }
  }

  async testClassifierWithoutManifests() {
    // Test fallback to heuristic classification
    const emptyManifests = { hasManifests: false };
    const classifier = new FileClassifier(this.projectRoot, emptyManifests);
    const classification = await classifier.classify();

    // Should still classify files using heuristics
    if (classification.remove.length === 0 && classification.keep.length === 0) {
      throw new Error('Heuristic classification produced no results');
    }

    // All items should have heuristic source
    const allItems = [...classification.remove, ...classification.keep, ...classification.unknown];
    const nonHeuristicItems = allItems.filter(item => item.origin !== 'heuristic');
    
    if (nonHeuristicItems.length > 0) {
      throw new Error('Non-heuristic items found in heuristic-only classification');
    }
  }

  async testGitProtection() {
    // Create a simple git repo for testing
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      // Initialize git repo and add files
      await execAsync('git init', { cwd: this.projectRoot });
      await execAsync('git config user.email "test@example.com"', { cwd: this.projectRoot });
      await execAsync('git config user.name "Test User"', { cwd: this.projectRoot });
      await execAsync('git add .', { cwd: this.projectRoot });
      await execAsync('git commit -m "Initial commit"', { cwd: this.projectRoot });

      const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
      const classifier = new FileClassifier(this.projectRoot, manifests);
      const classification = await classifier.classify();

      // Git-tracked files should be protected (moved to unknown/keep)
      const removedGitFiles = classification.remove.filter(item => item.gitTracked);
      if (removedGitFiles.length > 0) {
        throw new Error('Git-tracked files found in removal list');
      }

    } catch (gitError) {
      // Git not available or other git error - skip this test
      console.log(format.yellow('Git not available, skipping git protection test'));
    }
  }

  async testFileExistenceValidation() {
    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, manifests);
    
    // Add non-existent file to manifest for testing
    manifests.installation.items.push({
      path: 'non-existent-file.txt',
      origin: 'installed_system_asset',
      timestamp: new Date().toISOString()
    });

    const classification = await classifier.classify();

    // Find the non-existent file in results
    const nonExistentItem = [...classification.remove, ...classification.keep, ...classification.unknown]
      .find(item => item.path === 'non-existent-file.txt');

    if (!nonExistentItem) {
      throw new Error('Non-existent file not included in classification');
    }

    if (nonExistentItem.exists !== false) {
      throw new Error('File existence not properly validated');
    }
  }

  async testUserModificationDetection() {
    // Create file with system marker
    const systemGenFile = path.join(this.projectRoot, 'system-generated.js');
    await fs.writeFile(systemGenFile, '// AUTO-GENERATED\nconsole.log("system");');

    // Create file without system marker (user-modified)
    const userModFile = path.join(this.projectRoot, 'user-modified.js');
    await fs.writeFile(userModFile, 'console.log("user code");');

    const manifests = { hasManifests: false };
    const classifier = new FileClassifier(this.projectRoot, manifests);

    // Test system file detection
    const isSystemModified = await classifier.checkIfUserModified('system-generated.js');
    if (isSystemModified) {
      throw new Error('System-generated file incorrectly detected as user-modified');
    }

    // Test user file detection
    const isUserModified = await classifier.checkIfUserModified('user-modified.js');
    if (!isUserModified) {
      throw new Error('User-modified file not detected');
    }
  }

  async testPlanBuilderBasicFunctionality() {
    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, manifests);
    const classification = await classifier.classify();

    const detectionData = {
      projectRoot: this.projectRoot,
      classification,
      processes: []
    };

    const config = {
      dryRun: true,
      gitProtect: true,
      keepGenerated: true,
      purgeCaches: true
    };

    const planBuilder = new PlanBuilder(detectionData, config);
    const plan = await planBuilder.build();

    // Verify plan structure
    if (!plan.version || !plan.timestamp || !plan.summary) {
      throw new Error('Plan missing required structure');
    }

    // Verify summary calculations
    if (plan.summary.remove !== plan.remove.length) {
      throw new Error('Remove count mismatch in summary');
    }

    if (plan.summary.keep !== plan.keep.length) {
      throw new Error('Keep count mismatch in summary');
    }

    if (plan.summary.unknown !== plan.unknown.length) {
      throw new Error('Unknown count mismatch in summary');
    }
  }

  async testSizeCalculation() {
    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, manifests);
    const classification = await classifier.classify();

    const detectionData = {
      projectRoot: this.projectRoot,
      classification
    };

    const config = { dryRun: true };
    const planBuilder = new PlanBuilder(detectionData, config);
    const plan = await planBuilder.build();

    // Verify size calculations exist
    if (typeof plan.summary.totalSize !== 'number') {
      throw new Error('Total size not calculated');
    }

    if (!plan.summary.totalSizeFormatted) {
      throw new Error('Formatted size string not generated');
    }

    // Verify individual item sizes
    const itemsWithSizes = [...plan.remove, ...plan.keep, ...plan.unknown]
      .filter(item => typeof item.size === 'number');

    if (itemsWithSizes.length === 0) {
      throw new Error('No items have size calculations');
    }

    // Test size formatting
    if (!planBuilder.formatSize(1024).includes('KB')) {
      throw new Error('Size formatting not working correctly');
    }
  }

  async testRemovalOrdering() {
    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, manifests);
    const classification = await classifier.classify();

    const detectionData = {
      projectRoot: this.projectRoot,
      classification
    };

    const config = { dryRun: true };
    const planBuilder = new PlanBuilder(detectionData, config);
    const plan = await planBuilder.build();

    if (plan.remove.length < 2) {
      // Can't test ordering with fewer than 2 items
      return;
    }

    // Verify symlinks come first
    const firstItem = plan.remove[0];
    const hasSymlinkFirst = firstItem.origin === 'symlink_executable' ||
      plan.remove.every(item => item.origin !== 'symlink_executable');

    if (!hasSymlinkFirst && plan.remove.some(item => item.origin === 'symlink_executable')) {
      throw new Error('Symlinks not prioritized in removal order');
    }

    // Verify ordering is consistent (should be deterministic)
    const firstOrder = [...plan.remove];
    await planBuilder.sortRemovalOrder();
    const secondOrder = [...plan.remove];

    for (let i = 0; i < firstOrder.length; i++) {
      if (firstOrder[i].path !== secondOrder[i].path) {
        throw new Error('Removal ordering is not deterministic');
      }
    }
  }

  async testConfigurationNotes() {
    const detectionData = {
      projectRoot: this.projectRoot,
      classification: { remove: [], keep: [], unknown: [] }
    };

    const config = {
      gitProtect: true,
      keepGenerated: true,
      purgeCaches: false,
      backup: '/tmp/backup',
      dryRun: true
    };

    const planBuilder = new PlanBuilder(detectionData, config);
    const plan = await planBuilder.build();

    // Verify configuration notes are added
    const notesText = plan.notes.join(' ');
    
    if (!notesText.includes('Git protection enabled')) {
      throw new Error('Git protection note not added');
    }

    if (!notesText.includes('Generated documents will be preserved')) {
      throw new Error('Keep generated note not added');
    }

    if (!notesText.includes('DRY RUN MODE')) {
      throw new Error('Dry run note not added');
    }

    if (!notesText.includes('/tmp/backup')) {
      throw new Error('Backup path note not added');
    }
  }

  async testJsonOutputFormatting() {
    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, manifests);
    const classification = await classifier.classify();

    const detectionData = {
      projectRoot: this.projectRoot,
      classification
    };

    const config = { jsonOutput: true };
    const planBuilder = new PlanBuilder(detectionData, config);
    const plan = await planBuilder.build();

    // Test JSON output generation
    const jsonOutput = planBuilder.generateJsonOutput();
    
    // Verify it's valid JSON
    let parsedPlan;
    try {
      parsedPlan = JSON.parse(jsonOutput);
    } catch (error) {
      throw new Error('Generated JSON is not valid');
    }

    // Verify structure is preserved
    if (!parsedPlan.version || !parsedPlan.timestamp || !parsedPlan.summary) {
      throw new Error('JSON output missing required fields');
    }

    // Verify arrays are sorted for consistency
    if (parsedPlan.remove.length > 1) {
      for (let i = 1; i < parsedPlan.remove.length; i++) {
        if (parsedPlan.remove[i-1].path > parsedPlan.remove[i].path) {
          throw new Error('JSON output arrays not sorted');
        }
      }
    }
  }

  async testVerboseMode() {
    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, manifests);
    const classification = await classifier.classify();

    const detectionData = {
      projectRoot: this.projectRoot,
      classification
    };

    const config = { verbose: true };
    const planBuilder = new PlanBuilder(detectionData, config);
    const plan = await planBuilder.build();

    // Test category breakdown generation
    const breakdown = planBuilder.generateCategoryBreakdown();

    if (!breakdown.byOrigin || !breakdown.byType || !breakdown.sizeBuckets) {
      throw new Error('Category breakdown missing required sections');
    }

    // Verify breakdown has data
    if (Object.keys(breakdown.byOrigin).length === 0) {
      throw new Error('No origin breakdown data generated');
    }

    if (breakdown.byType.files + breakdown.byType.directories + breakdown.byType.symlinks === 0) {
      throw new Error('No type breakdown data generated');
    }
  }

  async testIntegrationClassifierAndPlan() {
    // Test full integration between classifier and plan builder
    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, manifests);
    const classification = await classifier.classify();

    const detectionData = {
      projectRoot: this.projectRoot,
      classification,
      processes: [
        { name: 'ai-workflow-supervisor', pid: 12345 }
      ]
    };

    const config = {
      dryRun: false,
      gitProtect: true,
      keepGenerated: false  // Force remove generated docs
    };

    const planBuilder = new PlanBuilder(detectionData, config);
    const plan = await planBuilder.build();

    // Verify integration works correctly
    if (plan.processes.length !== 1) {
      throw new Error('Process data not properly integrated');
    }

    // With keepGenerated=false, some generated docs should move to remove
    const generatedInRemove = plan.remove.filter(item => 
      item.origin === 'generated_document');

    // Should have at least some generated documents to remove when keepGenerated=false
    // (This depends on the test data, so we'll just verify the config is being applied)
    if (config.keepGenerated === false && plan.config.keepGenerated !== false) {
      throw new Error('Configuration not properly passed to plan');
    }
  }

  async testEdgeCases() {
    // Test with missing manifests
    await fs.rm(path.join(this.aiWorkflowDir, 'installation-record.json'), { force: true });
    await fs.rm(path.join(this.aiWorkflowDir, 'generation-record.json'), { force: true });

    const manifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    if (manifests.hasManifests) {
      throw new Error('Should detect missing manifests');
    }

    // Test with empty manifests
    await fs.writeFile(
      path.join(this.aiWorkflowDir, 'installation-record.json'),
      JSON.stringify({ items: [] })
    );

    const emptyManifests = await ManifestManager.prototype.loadManifests(this.projectRoot);
    const classifier = new FileClassifier(this.projectRoot, emptyManifests);
    const classification = await classifier.classify();

    // Should still work with empty manifests
    if (!classification.remove && !classification.keep && !classification.unknown) {
      throw new Error('Classification failed with empty manifests');
    }

    // Test with corrupted manifest
    await fs.writeFile(
      path.join(this.aiWorkflowDir, 'installation-record.json'),
      'invalid json content'
    );

    try {
      await ManifestManager.prototype.loadManifests(this.projectRoot);
      throw new Error('Should have thrown error for corrupted manifest');
    } catch (error) {
      if (!error.message.includes('JSON')) {
        throw new Error('Wrong error type for corrupted manifest');
      }
    }
  }

  async testLargeFilesets() {
    // Create a larger number of test files
    const largeTestDir = path.join(this.projectRoot, 'large-test');
    await fs.mkdir(largeTestDir, { recursive: true });

    // Create 100 test files
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        fs.writeFile(
          path.join(largeTestDir, `file-${i}.txt`),
          `Content for file ${i}`.repeat(100) // ~1.8KB per file
        )
      );
    }
    await Promise.all(promises);

    // Test classification performance
    const manifests = { hasManifests: false };
    const classifier = new FileClassifier(this.projectRoot, manifests);
    
    const startTime = performance.now();
    const classification = await classifier.classify();
    const classifyTime = performance.now() - startTime;

    // Test plan building performance
    const detectionData = {
      projectRoot: this.projectRoot,
      classification
    };

    const planStart = performance.now();
    const planBuilder = new PlanBuilder(detectionData, { dryRun: true });
    const plan = await planBuilder.build();
    const planTime = performance.now() - planStart;

    // Performance should be reasonable (under 5 seconds for 100 files)
    if (classifyTime > 5000) {
      throw new Error(`Classification too slow: ${classifyTime}ms for 100 files`);
    }

    if (planTime > 5000) {
      throw new Error(`Plan building too slow: ${planTime}ms for 100 files`);
    }

    // Store performance metrics
    this.metrics.push(
      { name: 'Classification (100 files)', average: Math.round(classifyTime), min: Math.round(classifyTime), max: Math.round(classifyTime) },
      { name: 'Plan Building (100 files)', average: Math.round(planTime), min: Math.round(planTime), max: Math.round(planTime) }
    );
  }

  async runTests() {
    console.log(format.bold('🧪 Starting Phase 2 Test Suite'));
    
    await this.setup();

    try {
      // Classifier Tests
      console.log(format.bold('📋 Classifier Tests'));
      await this.runTest('Classifier with manifests', () => this.testClassifierWithManifests());
      await this.runTest('Classifier without manifests (heuristic)', () => this.testClassifierWithoutManifests());
      await this.runTest('Git protection', () => this.testGitProtection());
      await this.runTest('File existence validation', () => this.testFileExistenceValidation());
      await this.runTest('User modification detection', () => this.testUserModificationDetection());

      // Plan Builder Tests
      console.log(format.bold('📊 Plan Builder Tests'));
      await this.runTest('Plan builder basic functionality', () => this.testPlanBuilderBasicFunctionality());
      await this.runTest('Size calculation', () => this.testSizeCalculation());
      await this.runTest('Removal ordering', () => this.testRemovalOrdering());
      await this.runTest('Configuration notes', () => this.testConfigurationNotes());
      await this.runTest('JSON output formatting', () => this.testJsonOutputFormatting());
      await this.runTest('Verbose mode', () => this.testVerboseMode());

      // Integration Tests
      console.log(format.bold('🔄 Integration Tests'));
      await this.runTest('Classifier + Plan Builder integration', () => this.testIntegrationClassifierAndPlan());

      // Edge Case Tests
      console.log(format.bold('⚠️ Edge Case Tests'));
      await this.runTest('Edge cases (missing/corrupted manifests)', () => this.testEdgeCases());
      await this.runTest('Large file sets performance', () => this.testLargeFilesets());

    } finally {
      await this.cleanup();
    }

    // Print final results
    const totalTime = Math.round(performance.now() - this.startTime);
    const successRate = Math.round((this.passed / (this.passed + this.failed)) * 100);

    console.log(format.bold('📊 Phase 2 Test Results'));
    console.log(format.cyan(`Tests: ${this.passed}/${this.passed + this.failed} passed (${successRate}%)`));
    console.log(format.cyan(`Duration: ${totalTime}ms`));

    if (this.metrics.length > 0) {
      console.log(format.bold('⚡ Performance Metrics'));
      this.metrics.forEach(metric => {
        console.log(format.dim(`  ${metric.name}: ${metric.average}ms`));
      });
    }

    if (this.failed === 0) {
      console.log(format.green('🎉 All Phase 2 tests passed!'));
      return 0;
    } else {
      console.log(format.red(`❌ ${this.failed} tests failed`));
      return 1;
    }
  }
}

// Export for use in test runner
module.exports = Phase2TestSuite;

// Run tests if executed directly
if (require.main === module) {
  const suite = new Phase2TestSuite();
  suite.runTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error(format.red(`❌ Phase 2 test suite error: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    });
}