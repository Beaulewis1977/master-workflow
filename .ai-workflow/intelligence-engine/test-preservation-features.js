#!/usr/bin/env node

/**
 * Test script for document preservation features
 */

const CustomizationManager = require('./customization-manager');
const DocumentVersioning = require('./document-versioning');
const EnhancedTemplateEngine = require('./enhanced-template-engine');

// Mock shared memory for testing
class MockSharedMemory {
  constructor() {
    this.data = new Map();
  }

  async set(key, value, options = {}) {
    this.data.set(key, value);
    return true;
  }

  async get(key) {
    return this.data.get(key);
  }

  get namespaces() {
    return {
      SHARED_STATE: 'shared',
      TEMP: 'temp',
      TASK_RESULTS: 'results'
    };
  }

  get dataTypes() {
    return {
      PERSISTENT: 'persistent',
      TRANSIENT: 'transient',
      CACHED: 'cached'
    };
  }
}

async function runPreservationTests() {
  console.log('🧪 Testing Document Update Preservation Features\n');

  const mockMemory = new MockSharedMemory();
  
  // Test 1: Customization Detection
  console.log('Test 1: Customization Detection');
  try {
    const cm = new CustomizationManager(mockMemory);
    const old = '# Title\nDefault content';
    const custom = '# Title\nDefault content\n<!-- User: My custom note -->\nMy additions';
    
    const customizations = await cm.detectCustomizations(old, custom);
    console.log('✓ Customizations found:', customizations.length);
    
    if (customizations.length > 0) {
      console.log('  - Type:', customizations[0].type);
      console.log('  - Content:', customizations[0].content);
    }
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }
  
  console.log('');

  // Test 2: Document Versioning
  console.log('Test 2: Document Versioning');
  try {
    const dv = new DocumentVersioning(mockMemory);
    const version = await dv.createSnapshot('test-doc.md', 'Test content', {
      message: 'Test snapshot'
    });
    console.log('✓ Version created:', version.id);
    console.log('  - Version number:', version.version);
    console.log('  - Document ID:', version.documentId);
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }

  console.log('');

  // Test 3: Template Engine with Inline Templates
  console.log('Test 3: Template Engine - Inline Templates');
  try {
    const te = new EnhancedTemplateEngine(mockMemory);
    
    // Test plain text (should pass through unchanged)
    const plainResult = await te.render('Hello World!', {});
    console.log('✓ Plain text rendered:', plainResult);
    
    // Test template with variables
    const templateResult = await te.render('Hello {{name}}!', { name: 'Phase4' });
    console.log('✓ Template rendered:', templateResult);
    
    // Test custom syntax
    const customResult = await te.render('Hello ${name}!', { name: 'Custom' }, { syntax: 'custom' });
    console.log('✓ Custom syntax rendered:', customResult);
    
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }

  console.log('');

  // Test 4: Customization Preservation in Merge
  console.log('Test 4: Customization Preservation in Merge');
  try {
    const cm = new CustomizationManager(mockMemory);
    
    // Create test documents
    const original = `# API Documentation
This is the default content.

## Features
- Feature 1
- Feature 2`;

    const customized = `# API Documentation
This is the default content.
<!-- USER: Added important note -->
**Note: This API is deprecated**

## Features
- Feature 1
- Feature 2
- Custom Feature 3  <!-- USER: My addition -->

<!-- CUSTOM START -->
## My Custom Section
This is my custom content that should be preserved.
<!-- CUSTOM END -->`;

    const updated = `# API Documentation
This is the updated default content with new information.

## Features
- Feature 1 (Enhanced)
- Feature 2 (Updated)
- Feature 3 (New)

## Installation
New installation instructions.`;

    // Detect customizations
    const customizations = await cm.detectCustomizations(original, customized);
    console.log('✓ Detected customizations:', customizations.length);

    // Merge with preservation
    const merged = await cm.mergeWithCustomizations(updated, customizations);
    console.log('✓ Merged content with preserved customizations');
    console.log('  - Original length:', original.length);
    console.log('  - Updated length:', updated.length);
    console.log('  - Merged length:', merged.length);
    
    // Check if custom content was preserved
    const hasUserComment = merged.includes('USER: Added important note');
    const hasCustomSection = merged.includes('My Custom Section');
    console.log('  - User comment preserved:', hasUserComment ? '✓' : '✗');
    console.log('  - Custom section preserved:', hasCustomSection ? '✓' : '✗');

  } catch (error) {
    console.error('✗ Failed:', error.message);
  }

  console.log('');

  // Test 5: Version History and Rollback
  console.log('Test 5: Version History and Rollback');
  try {
    const dv = new DocumentVersioning(mockMemory);
    const testFile = '/tmp/test-doc.md';
    
    // Create multiple versions
    const v1 = await dv.createSnapshot(testFile, 'Version 1 content', { message: 'Initial version' });
    const v2 = await dv.createSnapshot(testFile, 'Version 2 content', { message: 'Updated content' });
    const v3 = await dv.createSnapshot(testFile, 'Version 3 content', { message: 'Latest version' });
    
    console.log('✓ Created 3 versions');
    
    // Get version history
    const history = await dv.getVersionHistory(testFile, { limit: 5 });
    console.log('✓ Version history retrieved:', history.length, 'versions');
    
    // Get version stats
    const stats = await dv.getVersionStats(testFile);
    console.log('✓ Version statistics:');
    console.log('  - Total versions:', stats.totalVersions);
    console.log('  - Current version:', stats.currentVersion);
    console.log('  - Average size:', stats.averageSize, 'bytes');

  } catch (error) {
    console.error('✗ Failed:', error.message);
  }

  console.log('');
  
  // Test 6: Template Registry and Batch Rendering
  console.log('Test 6: Template Registry and Batch Rendering');
  try {
    const te = new EnhancedTemplateEngine(mockMemory);
    
    // Register templates
    await te.registerTemplate('header', '# {{title}}\n{{description}}', {
      description: 'Header template',
      type: 'component'
    });
    
    await te.registerTemplate('list', '{{#each items}}- {{this}}\n{{/each}}', {
      description: 'List template', 
      type: 'component'
    });
    
    console.log('✓ Templates registered');
    
    // List templates
    const templates = te.listTemplates();
    console.log('✓ Available templates:', templates.length);
    
    // Batch render
    const batchResults = await te.renderBatch([
      { 
        name: 'header', 
        context: { title: 'My Document', description: 'A test document' }
      }
    ]);
    
    console.log('✓ Batch rendering completed');
    console.log('  - Results:', batchResults.size);
    
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }

  console.log('\n🎉 All preservation tests completed!');
}

// Run tests
runPreservationTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});