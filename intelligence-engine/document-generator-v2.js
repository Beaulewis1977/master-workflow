#!/usr/bin/env node

/**
 * Document Generator v2
 * Phase 3 Implementation - MASTER-WORKFLOW v3.0
 * 
 * Advanced document generation system with interactive updates,
 * diff preview, and customization preservation.
 * 
 * Features:
 * - Interactive update mode (update/skip/preview per document)
 * - Diff preview showing exact changes
 * - Customization preservation (preserves user modifications)
 * - Document versioning with rollback capability
 * - Agent-OS document generation
 * - Integration with specialized doc-generator-agent
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const diff = require('diff');
const EventEmitter = require('events');

// Import existing components
const DocumentCustomizer = require('./document-customizer');
const SharedMemoryStore = require('./shared-memory');
const QueenController = require('./queen-controller');
const AgentCommunication = require('./agent-communication');

// Import supporting components
const InteractiveDocumentUpdater = require('./interactive-updater');
const CustomizationManager = require('./customization-manager');
const DocumentVersioning = require('./document-versioning');
const EnhancedTemplateEngine = require('./enhanced-template-engine');

class DocumentGeneratorV2 extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Path configuration
    this.projectRoot = options.projectRoot || process.cwd();
    this.outputDir = options.outputDir || this.projectRoot;
    
    // Integration with existing systems
    this.queenController = options.queenController || null;
    this.sharedMemory = options.sharedMemory || null;
    this.agentCommunication = options.agentCommunication || null;
    
    // Core components (optional - only create if needed to avoid dependency issues)
    this.interactiveUpdater = null;
    this.customizationManager = null;
    this.versionManager = null;
    this.templateEngine = null;
    
    // Inherit from existing DocumentCustomizer
    this.documentCustomizer = null; // Will be initialized with analysis
    
    // Configuration
    this.config = {
      interactive: true,
      preserveCustomizations: true,
      showDiff: true,
      autoBackup: true,
      batchSimilar: true,
      maxVersions: 10,
      ...options.config
    };
    
    // State management
    this.pendingUpdates = new Map();
    this.customizations = new Map();
    this.documentVersions = new Map();
    this.userPreferences = new Map();
    
    // Setup readline interface for interactive mode
    this.rl = null;
    
    this.setupEventHandlers();
  }
  
  /**
   * Setup event handlers for agent communication
   */
  setupEventHandlers() {
    // Only setup event handlers if agentCommunication is available
    if (this.agentCommunication) {
      this.agentCommunication.on('doc-generation-request', this.handleGenerationRequest.bind(this));
      this.agentCommunication.on('doc-update-request', this.handleUpdateRequest.bind(this));
      this.agentCommunication.on('customization-detected', this.handleCustomizationDetected.bind(this));
    }
  }
  
  /**
   * Generate all documents (batch mode - for tests and automation)
   * Returns an object with all generated documents
   */
  async generateAllDocuments(options = {}) {
    try {
      // Use default analysis if none provided
      const analysis = options.analysis || {
        complexity: { score: 45 },
        patterns: {},
        architecture: { type: 'modular' },
        projectPath: process.cwd()
      };
      
      const approach = options.approach || 'hive-mind';
      
      // Initialize document customizer with analysis
      this.documentCustomizer = new DocumentCustomizer(analysis, approach);
      
      // Use the DocumentCustomizer's generateAllDocuments method which handles the conversion
      const documentArray = await this.documentCustomizer.generateAllDocuments();
      
      // Write documents to disk if requested
      if (options.writeToDisc !== false) {
        for (const doc of documentArray) {
          await this.writeDocument(doc.path, doc.content);
        }
      }
      
      return {
        generated: documentArray.length,
        documents: documentArray,
        summary: {
          types: documentArray.length,
          totalSize: documentArray.reduce((sum, doc) => sum + doc.size, 0)
        }
      };
      
    } catch (error) {
      this.emit('generation-error', { error });
      throw error;
    }
  }
  
  /**
   * Get filename for document type
   */
  getFilenameForType(type) {
    const typeMap = {
      'claude': 'CLAUDE.md',
      'agentOS': 'Agent-OS.md',
      'workflows': 'WORKFLOWS.md',
      'contributing': 'CONTRIBUTING.md',
      'deployment': 'DEPLOYMENT.md',
      'architecture': 'ARCHITECTURE.md',
      'sparc': 'SPARC-PHASES.md',
      'slashCommands': 'SLASH-COMMANDS.md',
      'agents.queen': '.agents/queen-controller.md',
      'agents.coder': '.agents/coder-agent.md',
      'agents.tester': '.agents/tester-agent.md',
      'agents.deployer': '.agents/deployer-agent.md',
      'agents.analyst': '.agents/analyst-agent.md',
      'agents.doc-generator': '.agents/doc-generator-agent.md'
    };
    
    return typeMap[type] || `${type.toUpperCase()}.md`;
  }
  
  /**
   * Main entry point for interactive document generation
   */
  async generateDocumentsInteractive(analysis, approach, options = {}) {
    const generationId = `doc-gen-${Date.now()}`;
    
    try {
      // Initialize document customizer with analysis
      this.documentCustomizer = new DocumentCustomizer(analysis, approach);
      
      // Store generation request in shared memory
      await this.storeGenerationRequest(generationId, analysis, approach, options);
      
      // Check for existing documents
      const existingDocs = await this.scanForExistingDocuments();
      
      if (existingDocs.length > 0 && this.config.interactive) {
        // Interactive update mode
        return await this.interactiveUpdateMode(existingDocs, analysis, approach, options);
      } else {
        // Fresh generation
        return await this.generateFreshDocuments(analysis, approach, options);
      }
      
    } catch (error) {
      this.emit('generation-error', { generationId, error });
      throw error;
    } finally {
      // Cleanup
      if (this.rl) {
        this.rl.close();
      }
    }
  }
  
  /**
   * Interactive update mode for existing documents
   */
  async interactiveUpdateMode(existingDocs, analysis, approach, options) {
    console.log(chalk.cyan('\n📄 Document Update Mode'));
    console.log(chalk.gray('Found existing documents. How would you like to proceed?\n'));
    
    // Group similar documents for batch operations
    const documentGroups = this.config.batchSimilar ? 
      await this.groupSimilarDocuments(existingDocs) : 
      existingDocs.map(doc => [doc]);
    
    const updateResults = {
      updated: [],
      skipped: [],
      preserved: [],
      errors: []
    };
    
    for (const group of documentGroups) {
      const updatePlan = await this.createUpdatePlan(group, analysis, approach);
      
      // Present options to user
      const choice = await this.presentUpdateOptions(updatePlan);
      
      switch (choice) {
        case 'update':
          await this.updateDocuments(updatePlan, updateResults);
          break;
          
        case 'skip':
          updateResults.skipped.push(...group);
          break;
          
        case 'preview':
          await this.showDiffPreview(updatePlan);
          // Re-ask after preview
          const postPreviewChoice = await this.presentUpdateOptions(updatePlan);
          if (postPreviewChoice === 'update') {
            await this.updateDocuments(updatePlan, updateResults);
          } else {
            updateResults.skipped.push(...group);
          }
          break;
          
        case 'customize':
          await this.customizeUpdate(updatePlan, updateResults);
          break;
      }
    }
    
    // Generate summary report
    const report = await this.generateUpdateReport(updateResults);
    
    // Store results in shared memory
    await this.storeUpdateResults(updateResults);
    
    return report;
  }
  
  /**
   * Generate fresh documents (no existing documents)
   */
  async generateFreshDocuments(analysis, approach, options) {
    console.log(chalk.green('\n🚀 Generating new documents...'));
    
    const documentArray = await this.documentCustomizer.generateAllDocuments();
    
    // Create document versions
    for (const doc of documentArray) {
      await this.versionManager.createSnapshot(doc.path, doc.content);
    }
    
    // Write documents to disk
    for (const doc of documentArray) {
      await this.writeDocument(doc.path, doc.content);
    }
    
    console.log(chalk.green(`✅ Generated ${documentArray.length} documents successfully!`));
    
    return {
      generated: documentArray.length,
      documents: documentArray.map(d => d.path)
    };
  }
  
  /**
   * Create update plan for documents
   */
  async createUpdatePlan(documents, analysis, approach) {
    const plan = {
      documents: [],
      customizations: [],
      changes: []
    };
    
    for (const docPath of documents) {
      // Read existing document
      const existingContent = await this.readDocument(docPath);
      
      // Generate new content
      const newContent = await this.generateDocumentContent(docPath, analysis, approach);
      
      // Detect customizations
      const customizations = await this.customizationManager.detectCustomizations(
        existingContent, 
        newContent
      );
      
      // Create diff
      const diff = this.createDiff(existingContent, newContent);
      
      plan.documents.push({
        path: docPath,
        existing: existingContent,
        new: newContent,
        customizations,
        diff
      });
    }
    
    return plan;
  }
  
  /**
   * Present update options to user
   */
  async presentUpdateOptions(updatePlan) {
    const docCount = updatePlan.documents.length;
    const customCount = updatePlan.documents.reduce(
      (sum, doc) => sum + doc.customizations.length, 
      0
    );
    
    console.log(chalk.yellow(`\n📝 ${docCount} document(s) have updates available`));
    
    if (customCount > 0) {
      console.log(chalk.magenta(`   ${customCount} customization(s) detected and will be preserved`));
    }
    
    console.log('\nOptions:');
    console.log('  1) Update - Apply updates while preserving customizations');
    console.log('  2) Skip - Keep existing documents unchanged');
    console.log('  3) Preview - Show diff of changes');
    console.log('  4) Customize - Choose specific changes to apply');
    
    const choice = await this.getUserChoice(['1', '2', '3', '4']);
    
    const choices = {
      '1': 'update',
      '2': 'skip',
      '3': 'preview',
      '4': 'customize'
    };
    
    return choices[choice];
  }
  
  /**
   * Show diff preview of changes
   */
  async showDiffPreview(updatePlan) {
    console.log(chalk.cyan('\n📊 Document Changes Preview:'));
    console.log(chalk.gray('=' .repeat(80)));
    
    for (const doc of updatePlan.documents) {
      console.log(chalk.bold(`\n📄 ${doc.path}`));
      console.log(chalk.gray('-'.repeat(40)));
      
      // Show diff with colors
      const changes = diff.diffLines(doc.existing, doc.new);
      
      changes.forEach(part => {
        if (part.added) {
          console.log(chalk.green('+' + part.value));
        } else if (part.removed) {
          console.log(chalk.red('-' + part.value));
        } else {
          // Show context lines (first and last 2 lines of unchanged parts)
          const lines = part.value.split('\n');
          if (lines.length > 4) {
            console.log(chalk.gray(lines.slice(0, 2).join('\n')));
            console.log(chalk.gray('  ...'));
            console.log(chalk.gray(lines.slice(-2).join('\n')));
          } else {
            console.log(chalk.gray(part.value));
          }
        }
      });
      
      // Show preserved customizations
      if (doc.customizations.length > 0) {
        console.log(chalk.magenta('\n✨ Preserved Customizations:'));
        doc.customizations.forEach(custom => {
          console.log(chalk.magenta(`  - ${custom.type}: ${custom.description}`));
        });
      }
    }
    
    console.log(chalk.gray('\n' + '='.repeat(80)));
  }
  
  /**
   * Update documents with customization preservation
   */
  async updateDocuments(updatePlan, results) {
    console.log(chalk.cyan('\n🔄 Updating documents...'));
    
    for (const doc of updatePlan.documents) {
      try {
        // Backup existing document
        if (this.config.autoBackup) {
          await this.versionManager.createSnapshot(doc.path, doc.existing);
        }
        
        // Merge with customizations
        const mergedContent = await this.customizationManager.mergeWithCustomizations(
          doc.new,
          doc.customizations
        );
        
        // Write updated document
        await this.writeDocument(doc.path, mergedContent);
        
        results.updated.push(doc.path);
        results.preserved.push(...doc.customizations);
        
        console.log(chalk.green(`  ✅ Updated: ${doc.path}`));
        
      } catch (error) {
        console.error(chalk.red(`  ❌ Error updating ${doc.path}: ${error.message}`));
        results.errors.push({ path: doc.path, error });
      }
    }
  }
  
  /**
   * Customize specific updates
   */
  async customizeUpdate(updatePlan, results) {
    console.log(chalk.cyan('\n🎨 Customization Mode'));
    
    for (const doc of updatePlan.documents) {
      console.log(chalk.bold(`\n📄 ${doc.path}`));
      
      // Show each change and ask for confirmation
      const changes = diff.diffLines(doc.existing, doc.new);
      const acceptedChanges = [];
      
      for (const change of changes) {
        if (change.added || change.removed) {
          console.log(chalk.yellow('\nChange:'));
          
          if (change.removed) {
            console.log(chalk.red('-' + change.value));
          }
          if (change.added) {
            console.log(chalk.green('+' + change.value));
          }
          
          const accept = await this.askYesNo('Accept this change?');
          if (accept) {
            acceptedChanges.push(change);
          }
        } else {
          acceptedChanges.push(change); // Keep unchanged parts
        }
      }
      
      // Apply accepted changes
      const customizedContent = this.applySelectedChanges(doc.existing, acceptedChanges);
      
      // Write customized document
      await this.writeDocument(doc.path, customizedContent);
      results.updated.push(doc.path);
    }
  }
  
  /**
   * Group similar documents for batch operations
   */
  async groupSimilarDocuments(documents) {
    const groups = new Map();
    
    for (const doc of documents) {
      const type = this.getDocumentType(doc);
      
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      
      groups.get(type).push(doc);
    }
    
    return Array.from(groups.values());
  }
  
  /**
   * Get document type for grouping
   */
  getDocumentType(docPath) {
    const basename = path.basename(docPath);
    
    if (basename === 'CLAUDE.md') return 'claude-config';
    if (basename === 'Agent-OS.md') return 'agent-os';
    if (basename.endsWith('.rules')) return 'rules';
    if (basename.endsWith('.md')) return 'documentation';
    if (basename.endsWith('.json')) return 'config';
    
    return 'other';
  }
  
  /**
   * Generate document content based on path
   */
  async generateDocumentContent(docPath, analysis, approach) {
    const basename = path.basename(docPath);
    
    // Use appropriate generator based on document type
    switch (basename) {
      case 'CLAUDE.md':
        return await this.generateClaudeMd(analysis, approach);
        
      case 'Agent-OS.md':
        return await this.generateAgentOS(analysis, approach);
        
      case '.cursorrules':
      case '.clinerules':
        return await this.generateRules(analysis, basename);
        
      default:
        return await this.documentCustomizer.generateDocument(basename, analysis);
    }
  }
  
  /**
   * Scan for existing documents
   */
  async scanForExistingDocuments() {
    const documentsToCheck = [
      'CLAUDE.md',
      'Agent-OS.md',
      '.cursorrules',
      '.clinerules',
      'README.md',
      'IMPROVEMENTS-v3.0.md'
    ];
    
    const existing = [];
    
    for (const doc of documentsToCheck) {
      try {
        await fs.access(doc);
        existing.push(doc);
      } catch {
        // Document doesn't exist
      }
    }
    
    return existing;
  }
  
  /**
   * Read document from disk
   */
  async readDocument(docPath) {
    try {
      return await fs.readFile(docPath, 'utf8');
    } catch {
      return '';
    }
  }
  
  /**
   * Write document to disk
   */
  async writeDocument(docPath, content) {
    // Ensure the path is relative to the output directory
    const fullPath = path.isAbsolute(docPath) ? docPath : path.join(this.outputDir, docPath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    await fs.writeFile(fullPath, content, 'utf8');
  }
  
  /**
   * Create diff between two strings
   */
  createDiff(oldContent, newContent) {
    return diff.createPatch('document', oldContent, newContent);
  }
  
  /**
   * Apply selected changes to content
   */
  applySelectedChanges(originalContent, acceptedChanges) {
    let result = '';
    
    for (const change of acceptedChanges) {
      if (!change.removed) {
        result += change.value;
      }
    }
    
    return result;
  }
  
  /**
   * Get user choice from options
   */
  async getUserChoice(options) {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    
    return new Promise(resolve => {
      this.rl.question(`Choose option (${options.join('/')}): `, answer => {
        if (options.includes(answer)) {
          resolve(answer);
        } else {
          console.log(chalk.red('Invalid option. Please try again.'));
          resolve(this.getUserChoice(options));
        }
      });
    });
  }
  
  /**
   * Ask yes/no question
   */
  async askYesNo(question) {
    const answer = await this.getUserChoice(['y', 'n']);
    return answer === 'y';
  }
  
  /**
   * Generate update report
   */
  async generateUpdateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        updated: results.updated.length,
        skipped: results.skipped.length,
        preserved: results.preserved.length,
        errors: results.errors.length
      },
      details: results
    };
    
    // Display summary
    console.log(chalk.cyan('\n📊 Update Summary:'));
    console.log(chalk.green(`  ✅ Updated: ${report.summary.updated} documents`));
    console.log(chalk.yellow(`  ⏭️  Skipped: ${report.summary.skipped} documents`));
    console.log(chalk.magenta(`  ✨ Preserved: ${report.summary.preserved} customizations`));
    
    if (report.summary.errors > 0) {
      console.log(chalk.red(`  ❌ Errors: ${report.summary.errors}`));
    }
    
    return report;
  }
  
  /**
   * Store generation request in shared memory
   */
  async storeGenerationRequest(generationId, analysis, approach, options) {
    await this.sharedMemory.set(
      `doc-gen:${generationId}:request`,
      {
        generationId,
        analysis,
        approach,
        options,
        timestamp: Date.now()
      },
      {
        namespace: this.sharedMemory.namespaces.CROSS_AGENT,
        dataType: this.sharedMemory.dataTypes.SHARED
      }
    );
  }
  
  /**
   * Store update results in shared memory
   */
  async storeUpdateResults(results) {
    await this.sharedMemory.set(
      `doc-gen:results:${Date.now()}`,
      results,
      {
        namespace: this.sharedMemory.namespaces.TASK_RESULTS,
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      }
    );
  }
  
  /**
   * Generate custom document with specified template and sections
   */
  async generateCustomDocument(options) {
    const { template, title, sections, data } = options;
    
    let content = `# ${title}\n\n`;
    
    // Add template-specific content
    if (template === 'technical-spec') {
      content += `## Technical Specification\n\n`;
      content += `Generated on: ${new Date().toISOString()}\n\n`;
      
      if (data) {
        content += `### Configuration\n`;
        Object.entries(data).forEach(([key, value]) => {
          content += `- **${key}**: ${value}\n`;
        });
        content += `\n`;
      }
      
      if (sections && sections.length > 0) {
        sections.forEach(section => {
          content += `## ${section}\n\n`;
          content += `Content for ${section.toLowerCase()} will be generated based on project analysis.\n\n`;
        });
      }
    } else {
      // Generic template
      content += `## Overview\n\nCustom document generated with template: ${template}\n\n`;
      
      if (sections && sections.length > 0) {
        sections.forEach(section => {
          content += `## ${section}\n\nContent for ${section}\n\n`;
        });
      }
    }
    
    content += `---\n*Generated by DocumentGeneratorV2*\n`;
    
    return content;
  }

  /**
   * Create a document version entry
   */
  async createDocumentVersion(options) {
    const { reason, author, changes } = options;
    
    const versionInfo = {
      version: `v${Date.now()}`,
      timestamp: new Date().toISOString(),
      reason: reason || 'Document update',
      author: author || 'Unknown',
      changes: changes || [],
      id: `version-${Date.now()}`
    };
    
    // Store version info if version manager is available
    if (this.versionManager) {
      await this.versionManager.recordVersion(versionInfo);
    }
    
    // Store in shared memory if available
    if (this.sharedMemory) {
      await this.sharedMemory.set(`doc-version:${versionInfo.id}`, versionInfo);
    }
    
    return versionInfo;
  }

  /**
   * Generate CLAUDE.md content
   */
  async generateClaudeMd(analysis, approach) {
    // This will be implemented by claude-md-generator.js
    // For now, return a placeholder
    return `# Claude Configuration\n\nGenerated by Document Generator v2\n`;
  }
  
  /**
   * Generate Agent-OS.md content
   */
  async generateAgentOS(analysis, approach) {
    return this.documentCustomizer.generateAgentOS();
  }
  
  /**
   * Generate rules files
   */
  async generateRules(analysis, filename) {
    return this.documentCustomizer.generateRules(filename);
  }
  
  // Event handlers
  handleGenerationRequest(data) {
    const { analysis, approach, options } = data;
    this.generateDocumentsInteractive(analysis, approach, options);
  }
  
  handleUpdateRequest(data) {
    const { documents, options } = data;
    this.interactiveUpdateMode(documents, null, null, options);
  }
  
  handleCustomizationDetected(data) {
    const { docPath, customizations } = data;
    this.customizations.set(docPath, customizations);
  }
}

// Export for use in other modules
module.exports = DocumentGeneratorV2;

// CLI interface if run directly
if (require.main === module) {
  const generator = new DocumentGeneratorV2();
  
  // Example usage
  const analysis = {
    complexity: { score: 45 },
    patterns: {},
    architecture: { type: 'modular' }
  };
  
  const approach = 'hive-mind';
  
  generator.generateDocumentsInteractive(analysis, approach)
    .then(report => {
      console.log('Document generation complete:', report);
      process.exit(0);
    })
    .catch(error => {
      console.error('Document generation failed:', error);
      process.exit(1);
    });
}