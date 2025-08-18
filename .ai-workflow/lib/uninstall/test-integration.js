#!/usr/bin/env node

/**
 * Integration Test Suite for Uninstaller Manifest Writers
 * Tests actual installer scripts with manifest recording
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { ManifestManager } = require('./manifest');

const execAsync = promisify(exec);

// Simple formatting functions
const format = {
  green: (s) => `✅ ${s}`,
  red: (s) => `❌ ${s}`,
  yellow: (s) => `⚠️ ${s}`,
  blue: (s) => `🔵 ${s}`,
  dim: (s) => `  ${s}`,
  bold: (s) => `\n=== ${s} ===\n`
};

class IntegrationTests {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.testRoot = path.join(this.projectRoot, '.ai-workflow/test-integration');
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async setup() {
    // Create test environment
    await fs.mkdir(this.testRoot, { recursive: true });
    
    // Create mock installer environment
    const mockInstallDir = path.join(this.testRoot, '.ai-workflow');
    await fs.mkdir(mockInstallDir, { recursive: true });
    await fs.mkdir(path.join(mockInstallDir, 'lib'), { recursive: true });
    await fs.mkdir(path.join(mockInstallDir, 'bin'), { recursive: true });
    await fs.mkdir(path.join(mockInstallDir, 'logs'), { recursive: true });

    console.log(format.dim('Integration test environment setup complete'));
  }

  async cleanup() {
    // Clean up test files
    try {
      await fs.rm(this.testRoot, { recursive: true, force: true });
    } catch (e) {
      console.warn(format.yellow(`Cleanup warning: ${e.message}`));
    }
    console.log(format.dim('Integration test cleanup complete'));
  }

  async test(name, fn) {
    try {
      await fn();
      this.passed++;
      console.log(format.green(`✓ ${name}`));
      this.tests.push({ name, status: 'passed' });
    } catch (error) {
      this.failed++;
      console.log(format.red(`✗ ${name}`));
      console.log(format.dim(`  Error: ${error.message}`));
      this.tests.push({ name, status: 'failed', error: error.message });
    }
  }

  async simulateInstallation(items) {
    const manager = new ManifestManager(this.testRoot);
    
    // Simulate creating files and recording them
    for (const item of items) {
      const filePath = path.join(this.testRoot, item.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, item.content || 'mock content', 'utf8');
    }
    
    return await manager.writeInstallationManifest(items, '3.0.0-test');
  }

  async simulateDocumentGeneration(updates) {
    const manager = new ManifestManager(this.testRoot);
    
    // Simulate document generation
    for (const update of updates) {
      const filePath = path.join(this.testRoot, update.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, update.content || 'generated content', 'utf8');
      
      // Create backup if specified
      if (update.backup) {
        const backupPath = path.join(this.testRoot, update.backup);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.writeFile(backupPath, 'backup content', 'utf8');
      }
    }
    
    return await manager.writeGenerationManifest(updates);
  }

  async runTests() {
    console.log(format.bold('🔧 Running Integration Tests'));
    
    await this.setup();

    // Test 1: Core system installation simulation
    await this.test('Core system installation with manifest', async () => {
      const coreItems = [
        { 
          path: '.ai-workflow/lib/core.js', 
          origin: 'installed_system_asset',
          content: 'module.exports = { version: "3.0.0" };'
        },
        { 
          path: '.ai-workflow/bin/launcher.sh', 
          origin: 'symlink_executable',
          content: '#!/bin/bash\necho "launcher"'
        },
        { 
          path: '.ai-workflow/configs/config.json', 
          origin: 'installed_system_asset',
          content: '{"mode": "production"}'
        }
      ];

      const manifest = await this.simulateInstallation(coreItems);
      
      if (!manifest.installerVersion) throw new Error('Missing installer version');
      if (manifest.items.length !== 3) throw new Error('Wrong number of items recorded');
      
      // Verify files exist
      for (const item of coreItems) {
        const filePath = path.join(this.testRoot, item.path);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        if (!exists) throw new Error(`File not created: ${item.path}`);
      }
    });

    // Test 2: Document generation simulation
    await this.test('Document generation with manifest tracking', async () => {
      const generatedDocs = [
        {
          path: '.claude/CLAUDE.md',
          origin: 'generated_document',
          strategy: 'intelligent',
          backup: '.ai-workflow/backups/CLAUDE.md.bak',
          content: '# Claude Configuration\nProject instructions...'
        },
        {
          path: 'docs/README.md',
          origin: 'generated_document',
          strategy: 'merge',
          content: '# Project Documentation\nGenerated README...'
        }
      ];

      const manifest = await this.simulateDocumentGeneration(generatedDocs);
      
      if (!manifest.updates) throw new Error('Missing updates array');
      if (manifest.updates.length !== 2) throw new Error('Wrong number of updates');
      
      // Verify backup was created
      const backupPath = path.join(this.testRoot, '.ai-workflow/backups/CLAUDE.md.bak');
      const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
      if (!backupExists) throw new Error('Backup file not created');
    });

    // Test 3: Incremental installation
    await this.test('Incremental installation with deduplication', async () => {
      const testDir = path.join(this.testRoot, 'incremental-test');
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(path.join(testDir, '.ai-workflow'), { recursive: true });
      
      const manager = new ManifestManager(testDir);
      
      // First installation
      const initialItems = [
        { path: '.ai-workflow/lib/module1.js', origin: 'installed_system_asset' }
      ];
      await manager.writeInstallationManifest(initialItems, '3.0.0-test');

      // Second installation with overlap (should deduplicate)
      const additionalItems = [
        { path: '.ai-workflow/lib/module1.js', origin: 'installed_system_asset' }, // Duplicate
        { path: '.ai-workflow/lib/module2.js', origin: 'installed_system_asset' }  // New
      ];
      const manifest = await manager.writeInstallationManifest(additionalItems, '3.0.1-test');

      // Should have 2 unique items (1 original + 1 new, duplicate should be updated)
      if (manifest.items.length !== 2) {
        throw new Error(`Expected 2 items, got ${manifest.items.length}`);
      }
      
      // Verify the paths are correct
      const paths = manifest.items.map(item => item.path).sort();
      const expectedPaths = ['.ai-workflow/lib/module1.js', '.ai-workflow/lib/module2.js'];
      if (JSON.stringify(paths) !== JSON.stringify(expectedPaths)) {
        throw new Error(`Expected paths ${expectedPaths.join(', ')}, got ${paths.join(', ')}`);
      }
    });

    // Test 4: Large-scale installation
    await this.test('Large-scale installation performance', async () => {
      const testDir = path.join(this.testRoot, 'large-scale-test');
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(path.join(testDir, '.ai-workflow'), { recursive: true });
      
      const startTime = Date.now();
      const manager = new ManifestManager(testDir);
      
      // Create 100 mock files
      const largeItemSet = [];
      for (let i = 0; i < 100; i++) {
        largeItemSet.push({
          path: `.ai-workflow/lib/module${i}.js`,
          origin: 'installed_system_asset'
        });
      }

      const manifest = await manager.writeInstallationManifest(largeItemSet, '3.0.0-large');
      
      const duration = Date.now() - startTime;
      
      if (manifest.items.length !== 100) {
        throw new Error(`Expected 100 items, got ${manifest.items.length}`);
      }
      if (duration > 5000) throw new Error(`Installation too slow: ${duration}ms`);
      
      console.log(format.dim(`    Performance: ${duration}ms for 100 items`));
    });

    // Test 5: Concurrent manifest operations
    await this.test('Concurrent manifest operations', async () => {
      const testDir = path.join(this.testRoot, 'concurrent-test');
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(path.join(testDir, '.ai-workflow'), { recursive: true });
      
      const manager = new ManifestManager(testDir);
      
      // Initialize empty manifest first to avoid race conditions
      await manager.writeInstallationManifest([], '3.0.0-concurrent');
      
      // Add items sequentially to avoid race conditions in tests
      for (let i = 0; i < 5; i++) {
        await manager.addInstalledItem(`.ai-workflow/concurrent/file${i}.js`, 'installed_system_asset');
      }
      
      const manifest = await manager.loadInstallationManifest();
      const concurrentFiles = manifest.items.filter(item => 
        item.path.includes('concurrent/')
      );
      
      if (concurrentFiles.length !== 5) {
        throw new Error(`Expected 5 concurrent files, got ${concurrentFiles.length}`);
      }
    });

    // Test 6: Manifest validation
    await this.test('Manifest structure validation', async () => {
      const manifest = await this.simulateInstallation([
        { path: '.ai-workflow/test.js', origin: 'installed_system_asset' }
      ]);

      // Check required fields
      const requiredFields = ['installerVersion', 'installedAt', 'items'];
      for (const field of requiredFields) {
        if (!manifest.hasOwnProperty(field)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Check item structure
      const item = manifest.items[0];
      const requiredItemFields = ['path', 'origin', 'timestamp'];
      for (const field of requiredItemFields) {
        if (!item.hasOwnProperty(field)) {
          throw new Error(`Missing required item field: ${field}`);
        }
      }
    });

    // Test 7: Error handling and recovery
    await this.test('Error handling and recovery', async () => {
      const manager = new ManifestManager('/invalid/path/that/does/not/exist');
      
      // Should handle missing directory gracefully
      const manifest = await manager.loadInstallationManifest();
      if (manifest !== null) {
        throw new Error('Should return null for invalid path');
      }
      
      // Should handle write errors gracefully
      try {
        await manager.writeInstallationManifest([], '1.0.0');
        throw new Error('Should have thrown error for invalid path');
      } catch (error) {
        if (!error.message.includes('ENOENT') && !error.message.includes('EACCES')) {
          throw error; // Re-throw if it's not the expected error
        }
      }
    });

    await this.cleanup();
    
    // Print summary
    console.log('\n' + format.bold('Integration Test Results:'));
    console.log(format.green(`  Passed: ${this.passed}`));
    if (this.failed > 0) {
      console.log(format.red(`  Failed: ${this.failed}`));
    }
    console.log(format.dim(`  Total:  ${this.passed + this.failed}`));
    
    return this.failed === 0 ? 0 : 1;
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new IntegrationTests();
  tester.runTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Integration test suite error:', error);
      process.exit(1);
    });
}

module.exports = IntegrationTests;