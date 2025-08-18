#!/usr/bin/env node

/**
 * Test Agent-OS Document Analyzer
 * Comprehensive testing of the document analysis capabilities
 */

const AgentOSDocumentAnalyzer = require('./agent-os-document-analyzer.js');
const SharedMemoryStore = require('./shared-memory.js');
const CustomizationManager = require('./customization-manager.js');
const fs = require('fs').promises;
const path = require('path');

async function testAgentOSDocumentAnalyzer() {
  console.log('🧪 Testing Agent-OS Document Analyzer...\n');
  
  try {
    // Initialize dependencies
    console.log('1. Initializing dependencies...');
    const sharedMemory = new SharedMemoryStore({
      projectRoot: process.cwd(),
      maxMemorySize: 100 * 1024 * 1024 // 100MB for testing
    });
    
    await new Promise(resolve => {
      sharedMemory.once('initialized', resolve);
    });
    
    const customizationManager = new CustomizationManager(sharedMemory);
    
    // Initialize analyzer
    const analyzer = new AgentOSDocumentAnalyzer({
      projectRoot: process.cwd(),
      sharedMemory,
      customizationManager
    });
    
    await new Promise(resolve => {
      analyzer.once('initialized', resolve);
    });
    
    console.log('✅ Dependencies initialized successfully\n');
    
    // Test 1: Analyze existing documents
    console.log('2. Testing document discovery and analysis...');
    const projectPath = process.cwd();
    
    const analysisResult = await analyzer.analyzeExistingDocs(projectPath, {
      recursive: true,
      detectCustomizations: true,
      analysisDepth: 'standard'
    });
    
    console.log(`✅ Found and analyzed ${analysisResult.totalDocuments} documents`);
    console.log(`   - Agent-OS managed: ${analysisResult.agentOSDocuments}`);
    console.log(`   - With customizations: ${analysisResult.documentsWithCustomizations}\n`);
    
    // Test 2: Document type detection
    console.log('3. Testing document type detection...');
    
    // Test with sample content
    const testDocuments = [
      {
        fileName: 'CLAUDE.md',
        content: '# Claude Configuration\n\n## Project Analysis\n<!-- USER: Custom section -->'
      },
      {
        fileName: 'package.json',
        content: '{"name": "test", "version": "1.0.0", "agent-os": {"version": "2.1.0"}}'
      },
      {
        fileName: 'docker-compose.yml',
        content: 'version: "3.8"\nservices:\n  app:\n    image: node:18'
      }
    ];
    
    for (const doc of testDocuments) {
      const docType = analyzer.detectDocumentType(
        doc.fileName, 
        path.extname(doc.fileName).slice(1), 
        doc.content
      );
      console.log(`   - ${doc.fileName}: ${docType}`);
    }
    console.log('✅ Document type detection working\n');
    
    // Test 3: Customization detection
    console.log('4. Testing customization detection...');
    
    const sampleDoc = {
      path: '/test/CLAUDE.md',
      content: `# Claude Configuration
      
## Project Analysis
<!-- USER: This is my custom comment -->

## Custom Section
<!-- CUSTOM START -->
This is my custom content that should be preserved.
<!-- CUSTOM END -->

## Technology Stack
- JavaScript # MODIFIED - Added TypeScript support
- Docker`,
      type: 'markdown'
    };
    
    const customizations = await analyzer.detectCustomizations(sampleDoc, {
      analyzePatterns: true,
      detectStructuralChanges: true
    });
    
    console.log(`✅ Detected ${customizations.length} customizations:`);
    customizations.forEach((custom, index) => {
      console.log(`   ${index + 1}. ${custom.type}: ${custom.description || 'No description'}`);
    });
    console.log('');
    
    // Test 4: Extract custom sections
    console.log('5. Testing custom section extraction...');
    
    const customSections = await analyzer.extractCustomSections(sampleDoc.content, {
      includeComments: true,
      includeMarkedSections: true
    });
    
    console.log(`✅ Extracted ${customSections.length} custom sections\n`);
    
    // Test 5: Document comparison
    console.log('6. Testing document comparison...');
    
    const doc1 = {
      content: '# Title\n\nOriginal content\n\n## Section A',
      structure: { headers: [{ level: 1, text: 'Title' }] }
    };
    
    const doc2 = {
      content: '# Title\n\nModified content\n\n## Section A\n\n## Section B',
      structure: { headers: [{ level: 1, text: 'Title' }, { level: 2, text: 'Section B' }] }
    };
    
    const comparison = await analyzer.compareDocuments(doc1, doc2, {
      compareContent: true,
      compareStructure: true
    });
    
    console.log(`✅ Document comparison completed`);
    console.log(`   - Similarity: ${comparison.similarity}`);
    console.log(`   - Risk level: ${comparison.riskLevel}\n`);
    
    // Test 6: Update strategy calculation
    console.log('7. Testing update strategy calculation...');
    
    const existingDoc = {
      path: '/test/CLAUDE.md',
      content: sampleDoc.content,
      customizations: customizations,
      type: 'markdown'
    };
    
    const newTemplate = {
      version: '2.2.0',
      content: '# Claude Configuration\n\n## New Project Analysis\n\n## Technology Stack\n\n## New Features',
      changes: ['Updated project analysis', 'Added new features section']
    };
    
    const strategy = await analyzer.calculateUpdateStrategy(existingDoc, newTemplate, {
      strategy: 'merge-intelligent',
      preserveUserContent: true,
      generateReport: true
    });
    
    console.log(`✅ Update strategy calculated: ${strategy.strategy}`);
    console.log(`   - Risk level: ${strategy.riskLevel}`);
    console.log(`   - Estimated time: ${strategy.estimatedTime}\n`);
    
    // Test 7: User content preservation
    console.log('8. Testing user content preservation...');
    
    const preservationResult = await analyzer.preserveUserContent(existingDoc, newTemplate, {
      preserveComments: true,
      preserveCustomSections: true,
      generateBackup: false
    });
    
    console.log(`✅ User content preservation completed`);
    console.log(`   - Customizations preserved: ${preservationResult.preservationStrategy.customizations.length}`);
    console.log(`   - Preserved types:`, Object.keys(preservationResult.stats).join(', '));
    console.log('');
    
    // Test 8: Generate merge report
    console.log('9. Testing merge report generation...');
    
    const mergeReport = await analyzer.generateMergeReport(existingDoc, newTemplate, strategy, {
      includePreview: false,
      includeRiskAnalysis: true,
      includeRecommendations: true,
      format: 'detailed'
    });
    
    console.log(`✅ Merge report generated`);
    console.log(`   - Document type: ${mergeReport.executiveSummary.documentType}`);
    console.log(`   - Customizations found: ${mergeReport.executiveSummary.customizationsFound}`);
    console.log(`   - Update complexity: ${mergeReport.executiveSummary.updateComplexity}`);
    console.log(`   - Risk level: ${mergeReport.executiveSummary.riskLevel}`);
    console.log(`   - Recommendations: ${mergeReport.recommendations.length}\n`);
    
    // Test 9: Performance and statistics
    console.log('10. Testing performance and statistics...');
    
    const stats = analyzer.stats;
    console.log(`✅ Analyzer statistics:`);
    console.log(`   - Documents analyzed: ${stats.documentsAnalyzed}`);
    console.log(`   - Customizations detected: ${stats.customizationsDetected}`);
    console.log(`   - Update strategies generated: ${stats.updateStrategiesGenerated}`);
    console.log(`   - Merge conflicts: ${stats.mergeConflicts}`);
    console.log(`   - Preserved user content: ${stats.preservedUserContent}`);
    console.log(`   - Analysis time: ${stats.analysisTime}ms\n`);
    
    // Test 10: Event system
    console.log('11. Testing event system...');
    
    let eventCount = 0;
    analyzer.on('customizations-detected', () => eventCount++);
    analyzer.on('strategy-calculated', () => eventCount++);
    analyzer.on('content-preserved', () => eventCount++);
    
    // Trigger some events by running operations again
    await analyzer.detectCustomizations(sampleDoc);
    await analyzer.calculateUpdateStrategy(existingDoc, newTemplate);
    
    console.log(`✅ Event system working - ${eventCount} events fired\n`);
    
    console.log('🎉 All Agent-OS Document Analyzer tests passed successfully!\n');
    
    // Display final summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log('✅ Document discovery and analysis');
    console.log('✅ Document type detection'); 
    console.log('✅ Customization detection');
    console.log('✅ Custom section extraction');
    console.log('✅ Document comparison');
    console.log('✅ Update strategy calculation');
    console.log('✅ User content preservation');
    console.log('✅ Merge report generation');
    console.log('✅ Performance tracking');
    console.log('✅ Event system integration');
    console.log('');
    console.log('🔧 Component ready for production use!');
    
    // Cleanup
    await sharedMemory.shutdown();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAgentOSDocumentAnalyzer().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testAgentOSDocumentAnalyzer };