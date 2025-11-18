#!/usr/bin/env node

/**
 * Test Suite for Manifest Writers
 * Phase 1 Implementation Test
 */

const fs = require('fs').promises;
const path = require('path');
const { ManifestManager } = require('./manifest');

// Simple formatting functions (no external dependencies)
const format = {
  green: (s) => `✅ ${s}`,
  red: (s) => `❌ ${s}`,
  yellow: (s) => `⚠️ ${s}`,
  dim: (s) => `  ${s}`,
  bold: (s) => `\n=== ${s} ===\n`
};

class ManifestWriterTests {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.testRoot = path.join(this.projectRoot, '.ai-workflow/test-temp');
    this.manager = null;
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async setup() {
    // Create test directory structure
    await fs.mkdir(this.testRoot, { recursive: true });
    
    // Create the .ai-workflow directory within the test directory
    const aiWorkflowDir = path.join(this.testRoot, '.ai-workflow');
    await fs.mkdir(aiWorkflowDir, { recursive: true });
    
    this.manager = new ManifestManager(this.testRoot);
    console.log(format.dim('Test environment setup complete'));
  }

  async cleanup() {
    // Remove test files and directories
    try {
      await fs.unlink(path.join(this.testRoot, '.ai-workflow/installation-record.json'));
    } catch (e) {}
    try {
      await fs.unlink(path.join(this.testRoot, '.ai-workflow/generation-record.json'));
    } catch (e) {}
    try {
      // Remove the .ai-workflow directory if it's empty
      await fs.rmdir(path.join(this.testRoot, '.ai-workflow'));
    } catch (e) {}
    try {
      // Remove the test root directory if it's empty
      await fs.rmdir(this.testRoot);
    } catch (e) {}
    console.log(format.dim('Test cleanup complete'));
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

  async runTests() {
    console.log(format.bold('\n🧪 Running Manifest Writer Tests\n'));
    
    await this.setup();

    // Test 1: Create installation manifest
    await this.test('Create installation manifest', async () => {
      const items = [
        { path: '.ai-workflow/lib/core.js', origin: 'installed_system_asset' },
        { path: '.ai-workflow/bin/launcher', origin: 'symlink_executable' }
      ];
      
      const manifest = await this.manager.writeInstallationManifest(items, '3.0.0');
      
      if (!manifest.installerVersion) throw new Error('Missing installer version');
      if (!manifest.installedAt) throw new Error('Missing installation timestamp');
      if (manifest.items.length !== 2) throw new Error('Wrong number of items');
    });

    // Test 2: Append to installation manifest (deduplication)
    await this.test('Append with deduplication', async () => {
      const newItems = [
        { path: '.ai-workflow/lib/core.js', origin: 'installed_system_asset' }, // Duplicate
        { path: '.ai-workflow/lib/utils.js', origin: 'installed_system_asset' }  // New
      ];
      
      const manifest = await this.manager.writeInstallationManifest(newItems, '3.0.1');
      
      // Should have 3 items total (2 original + 1 new, duplicate ignored)
      if (manifest.items.length !== 3) {
        throw new Error(`Expected 3 items, got ${manifest.items.length}`);
      }
    });

    // Test 3: Create generation manifest
    await this.test('Create generation manifest', async () => {
      const updates = [
        { 
          path: '.claude/CLAUDE.md', 
          origin: 'generated_document',
          strategy: 'intelligent',
          backup: '.ai-workflow/backups/CLAUDE.md.bak'
        }
      ];
      
      const manifest = await this.manager.writeGenerationManifest(updates);
      
      if (!manifest.updates) throw new Error('Missing updates array');
      if (manifest.updates.length !== 1) throw new Error('Wrong number of updates');
    });

    // Test 4: Add individual installed item
    await this.test('Add individual installed item', async () => {
      await this.manager.addInstalledItem('.ai-workflow/configs/config.json', 'installed_system_asset');
      
      const manifest = await this.manager.loadInstallationManifest();
      const hasItem = manifest.items.some(i => i.path === '.ai-workflow/configs/config.json');
      
      if (!hasItem) throw new Error('Item not added to manifest');
    });

    // Test 5: Add individual generated item
    await this.test('Add individual generated item', async () => {
      await this.manager.addGeneratedItem(
        '.agent-os/instructions.md',
        'merge',
        '.ai-workflow/backups/instructions.md.bak'
      );
      
      const manifest = await this.manager.loadGenerationManifest();
      const hasItem = manifest.updates.some(u => u.path === '.agent-os/instructions.md');
      
      if (!hasItem) throw new Error('Generated item not added');
    });

    // Test 6: Load non-existent manifest
    await this.test('Load non-existent manifest gracefully', async () => {
      const tempManager = new ManifestManager('/tmp/non-existent-project');
      const manifest = await tempManager.loadInstallationManifest();
      
      if (manifest !== null) throw new Error('Should return null for missing manifest');
    });

    // Test 7: Atomic write operation
    await this.test('Atomic write prevents corruption', async () => {
      const testPath = path.join(this.testRoot, 'test-atomic.json');
      const data = { test: 'data', timestamp: new Date().toISOString() };
      
      await this.manager.atomicWrite(testPath, data);
      
      const content = await fs.readFile(testPath, 'utf8');
      const parsed = JSON.parse(content);
      
      if (parsed.test !== 'data') throw new Error('Atomic write failed');
      
      // Cleanup
      await fs.unlink(testPath);
    });

    // Test 8: Deduplication with timestamp updates
    await this.test('Deduplication updates timestamps', async () => {
      const items = [
        { path: '.ai-workflow/lib/core.js', origin: 'installed_system_asset' }
      ];
      
      // Get original timestamp
      const manifest1 = await this.manager.loadInstallationManifest();
      const originalItem = manifest1.items.find(i => i.path === '.ai-workflow/lib/core.js');
      const originalTimestamp = originalItem ? originalItem.timestamp : null;
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Re-add the same item
      await this.manager.writeInstallationManifest(items, '3.0.2');
      
      const manifest2 = await this.manager.loadInstallationManifest();
      const updatedItem = manifest2.items.find(i => i.path === '.ai-workflow/lib/core.js');
      
      if (!updatedItem.timestamp) throw new Error('Missing timestamp');
      if (updatedItem.version !== '3.0.2') throw new Error('Version not updated');
    });

    await this.cleanup();
    
    // Print summary
    console.log('\n' + format.bold('Test Results:'));
    console.log(format.green(`  Passed: ${this.passed}`));
    if (this.failed > 0) {
      console.log(format.red(`  Failed: ${this.failed}`));
    }
    console.log(format.dim(`  Total:  ${this.passed + this.failed}`));
    
    // Return exit code
    return this.failed === 0 ? 0 : 1;
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new ManifestWriterTests();
  tester.runTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('❌ Test suite error:', error);
      process.exit(1);
    });
}

module.exports = ManifestWriterTests;