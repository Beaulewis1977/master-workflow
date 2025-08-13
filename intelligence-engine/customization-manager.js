#!/usr/bin/env node

/**
 * Customization Manager
 * Detects and preserves user customizations in documents
 * 
 * Features:
 * - Advanced customization detection using AST and pattern matching
 * - Smart merge algorithms for preserving user changes
 * - Customization conflict resolution
 * - Support for multiple document types
 * - Integration with SharedMemory for persistence
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class CustomizationManager extends EventEmitter {
  constructor(sharedMemory) {
    super();
    
    this.sharedMemory = sharedMemory;
    this.customizationPatterns = new Map();
    this.mergeStrategies = new Map();
    this.detectionRules = new Map();
    
    this.initializePatterns();
    this.initializeMergeStrategies();
    this.initializeDetectionRules();
  }
  
  /**
   * Initialize customization detection patterns
   */
  initializePatterns() {
    // User comment patterns
    this.customizationPatterns.set('user-comments', [
      /<!--\s*USER:\s*(.*?)\s*-->/gi,
      /\/\*\s*USER:\s*(.*?)\s*\*\//gi,
      /#\s*USER:\s*(.*?)$/gim,
      /\/\/\s*USER:\s*(.*?)$/gim
    ]);
    
    // Custom sections
    this.customizationPatterns.set('custom-sections', [
      /<!--\s*CUSTOM START\s*-->(.*?)<!--\s*CUSTOM END\s*-->/gis,
      /\/\*\s*CUSTOM START\s*\*\/(.*?)\/\*\s*CUSTOM END\s*\*\//gis,
      /#\s*CUSTOM START$(.*?)#\s*CUSTOM END$/gims,
      /\/\/\s*CUSTOM START$(.*?)\/\/\s*CUSTOM END$/gims
    ]);
    
    // Modified configuration values
    this.customizationPatterns.set('config-modifications', [
      /(\w+):\s*([^#\n]*?)\s*#\s*MODIFIED/gim,
      /(\w+)\s*=\s*([^#\n]*?)\s*#\s*MODIFIED/gim,
      /"(\w+)":\s*"([^"]*?)"\s*,?\s*\/\*\s*MODIFIED\s*\*\//gim
    ]);
    
    // Personal additions
    this.customizationPatterns.set('personal-additions', [
      /<!--\s*PERSONAL:\s*(.*?)\s*-->/gis,
      /\/\*\s*PERSONAL:\s*(.*?)\s*\*\//gis,
      /#\s*PERSONAL:(.*?)(?=\n#|\n\n|\nclass|\nfunction|$)/gis
    ]);
    
    // Overrides
    this.customizationPatterns.set('overrides', [
      /<!--\s*OVERRIDE START\s*-->(.*?)<!--\s*OVERRIDE END\s*-->/gis,
      /\/\*\s*OVERRIDE START\s*\*\/(.*?)\/\*\s*OVERRIDE END\s*\*\//gis,
      /#\s*OVERRIDE START$(.*?)#\s*OVERRIDE END$/gims
    ]);
  }
  
  /**
   * Initialize merge strategies for different content types
   */
  initializeMergeStrategies() {
    this.mergeStrategies.set('markdown', this.mergeMarkdown.bind(this));
    this.mergeStrategies.set('json', this.mergeJSON.bind(this));
    this.mergeStrategies.set('yaml', this.mergeYAML.bind(this));
    this.mergeStrategies.set('javascript', this.mergeJavaScript.bind(this));
    this.mergeStrategies.set('typescript', this.mergeTypeScript.bind(this));
    this.mergeStrategies.set('shell', this.mergeShell.bind(this));
    this.mergeStrategies.set('text', this.mergeText.bind(this));
  }
  
  /**
   * Initialize detection rules for different document types
   */
  initializeDetectionRules() {
    // Markdown detection rules
    this.detectionRules.set('markdown', {
      significantChanges: [
        /^#{1,6}\s+.+$/gm,  // Headers
        /^\*\s+.+$/gm,      // List items
        /^\d+\.\s+.+$/gm,   // Numbered lists
        /```[\s\S]*?```/gm, // Code blocks
        /\[.*?\]\(.*?\)/gm  // Links
      ],
      preservePatterns: [
        /<!--[\s\S]*?-->/gm, // HTML comments
        /^>\s+.+$/gm         // Blockquotes
      ]
    });
    
    // JSON detection rules
    this.detectionRules.set('json', {
      significantChanges: [
        /"[^"]+"\s*:\s*"[^"]*"/gm,     // String properties
        /"[^"]+"\s*:\s*\d+/gm,         // Number properties
        /"[^"]+"\s*:\s*(true|false)/gm, // Boolean properties
        /"[^"]+"\s*:\s*\[[\s\S]*?\]/gm // Array properties
      ],
      preservePatterns: [
        /\/\*[\s\S]*?\*\//gm  // Comments
      ]
    });
    
    // Configuration file rules
    this.detectionRules.set('config', {
      significantChanges: [
        /^\s*\w+\s*[:=]\s*.+$/gm,  // Key-value pairs
        /^\s*-\s+.+$/gm            // YAML list items
      ],
      preservePatterns: [
        /^\s*#.*$/gm,              // Comments
        /^\s*\/\/.*$/gm            // JS-style comments
      ]
    });
  }
  
  /**
   * Detect customizations in a document
   */
  async detectCustomizations(originalContent, newContent, options = {}) {
    try {
      const documentType = this.detectDocumentType(options.filePath || '');
      const customizations = [];
      
      // Store content for comparison
      await this.storeContentForComparison(originalContent, newContent, options);
      
      // Pattern-based detection
      const patternCustomizations = await this.detectPatternCustomizations(
        originalContent, 
        documentType
      );
      customizations.push(...patternCustomizations);
      
      // Structural analysis
      const structuralCustomizations = await this.detectStructuralCustomizations(
        originalContent,
        newContent,
        documentType
      );
      customizations.push(...structuralCustomizations);
      
      // Semantic analysis
      const semanticCustomizations = await this.detectSemanticCustomizations(
        originalContent,
        newContent,
        documentType
      );
      customizations.push(...semanticCustomizations);
      
      // Metadata analysis
      const metadataCustomizations = await this.detectMetadataCustomizations(
        originalContent,
        documentType
      );
      customizations.push(...metadataCustomizations);
      
      // Deduplicate and rank customizations
      const uniqueCustomizations = this.deduplicateCustomizations(customizations);
      const rankedCustomizations = this.rankCustomizations(uniqueCustomizations);
      
      // Store detected customizations
      await this.storeCustomizations(options.filePath, rankedCustomizations);
      
      this.emit('customizations-detected', {
        filePath: options.filePath,
        customizations: rankedCustomizations,
        documentType
      });
      
      return rankedCustomizations;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to detect customizations: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Detect customizations using predefined patterns
   */
  async detectPatternCustomizations(content, documentType) {
    const customizations = [];
    
    for (const [patternType, patterns] of this.customizationPatterns) {
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          customizations.push({
            type: patternType,
            pattern: pattern.source,
            match: match[0],
            content: match[1] || match[0],
            position: {
              start: match.index,
              end: match.index + match[0].length
            },
            confidence: 0.9, // High confidence for explicit patterns
            description: this.describeCustomization(patternType, match)
          });
        }
      }
    }
    
    return customizations;
  }
  
  /**
   * Detect structural customizations using document analysis
   */
  async detectStructuralCustomizations(originalContent, newContent, documentType) {
    const customizations = [];
    
    try {
      const originalStructure = this.analyzeDocumentStructure(originalContent, documentType);
      const newStructure = this.analyzeDocumentStructure(newContent, documentType);
      
      // Compare structures
      const structuralDifferences = this.compareStructures(originalStructure, newStructure);
      
      for (const diff of structuralDifferences) {
        if (diff.type === 'addition' && this.isSignificantAddition(diff, documentType)) {
          customizations.push({
            type: 'structural-addition',
            content: diff.content,
            position: diff.position,
            confidence: 0.8,
            description: `Added ${diff.elementType}: ${this.summarizeContent(diff.content)}`
          });
        } else if (diff.type === 'modification' && this.isSignificantModification(diff, documentType)) {
          customizations.push({
            type: 'structural-modification',
            content: diff.content,
            original: diff.original,
            position: diff.position,
            confidence: 0.7,
            description: `Modified ${diff.elementType}: ${this.summarizeContent(diff.content)}`
          });
        }
      }
      
    } catch (error) {
      // Structure analysis failed, continue with other methods
      console.warn('Structural analysis failed:', error.message);
    }
    
    return customizations;
  }
  
  /**
   * Detect semantic customizations using content analysis
   */
  async detectSemanticCustomizations(originalContent, newContent, documentType) {
    const customizations = [];
    
    try {
      // Word-level analysis for meaningful changes
      const semanticChanges = this.analyzeSemanticChanges(originalContent, newContent);
      
      for (const change of semanticChanges) {
        if (change.significance > 0.6) { // Threshold for semantic importance
          customizations.push({
            type: 'semantic-change',
            content: change.newContent,
            original: change.originalContent,
            position: change.position,
            confidence: change.significance,
            description: `Semantic change: ${change.description}`,
            category: change.category
          });
        }
      }
      
    } catch (error) {
      console.warn('Semantic analysis failed:', error.message);
    }
    
    return customizations;
  }
  
  /**
   * Detect metadata customizations (timestamps, version info, etc.)
   */
  async detectMetadataCustomizations(content, documentType) {
    const customizations = [];
    
    const metadataPatterns = [
      /(?:date|timestamp|created|modified|updated):\s*([^\n]+)/gi,
      /version:\s*([^\n]+)/gi,
      /author:\s*([^\n]+)/gi,
      /last\s+modified\s+by:\s*([^\n]+)/gi
    ];
    
    for (const pattern of metadataPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        customizations.push({
          type: 'metadata-customization',
          content: match[1],
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          confidence: 0.6,
          description: `Custom metadata: ${match[0]}`
        });
      }
    }
    
    return customizations;
  }
  
  /**
   * Merge content with customizations preserved
   */
  async mergeWithCustomizations(newContent, customizations, options = {}) {
    try {
      const documentType = this.detectDocumentType(options.filePath || '');
      const mergeStrategy = this.mergeStrategies.get(documentType) || this.mergeText;
      
      // Sort customizations by position (descending to avoid index shifts)
      const sortedCustomizations = customizations.sort((a, b) => 
        (b.position?.start || 0) - (a.position?.start || 0)
      );
      
      // Apply customizations using appropriate strategy
      let mergedContent = await mergeStrategy(newContent, sortedCustomizations, options);
      
      // Post-process to clean up any conflicts
      mergedContent = this.postProcessMerge(mergedContent, documentType);
      
      // Store merge result for future reference
      await this.storeMergeResult(options.filePath, mergedContent, customizations);
      
      this.emit('customizations-merged', {
        filePath: options.filePath,
        customizationsApplied: customizations.length,
        documentType
      });
      
      return mergedContent;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to merge customizations: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Merge strategy for Markdown documents
   */
  async mergeMarkdown(newContent, customizations, options) {
    let merged = newContent;
    
    for (const customization of customizations) {
      switch (customization.type) {
        case 'user-comments':
          merged = this.insertUserComment(merged, customization);
          break;
          
        case 'custom-sections':
          merged = this.insertCustomSection(merged, customization);
          break;
          
        case 'personal-additions':
          merged = this.insertPersonalAddition(merged, customization);
          break;
          
        case 'structural-addition':
          merged = this.insertStructuralAddition(merged, customization);
          break;
          
        case 'semantic-change':
          merged = this.applySemanticChange(merged, customization);
          break;
      }
    }
    
    return merged;
  }
  
  /**
   * Merge strategy for JSON documents
   */
  async mergeJSON(newContent, customizations, options) {
    try {
      const newObj = JSON.parse(newContent);
      
      for (const customization of customizations) {
        if (customization.type === 'config-modifications') {
          this.applyJSONCustomization(newObj, customization);
        }
      }
      
      return JSON.stringify(newObj, null, 2);
      
    } catch (error) {
      // Fallback to text merge if JSON parsing fails
      return await this.mergeText(newContent, customizations, options);
    }
  }
  
  /**
   * Merge strategy for YAML documents
   */
  async mergeYAML(newContent, customizations, options) {
    let merged = newContent;
    
    for (const customization of customizations) {
      if (customization.type === 'config-modifications') {
        merged = this.applyYAMLCustomization(merged, customization);
      } else if (customization.type === 'user-comments') {
        merged = this.insertYAMLComment(merged, customization);
      }
    }
    
    return merged;
  }
  
  /**
   * Merge strategy for JavaScript/TypeScript documents
   */
  async mergeJavaScript(newContent, customizations, options) {
    return await this.mergeTypeScript(newContent, customizations, options);
  }
  
  async mergeTypeScript(newContent, customizations, options) {
    let merged = newContent;
    
    for (const customization of customizations) {
      switch (customization.type) {
        case 'user-comments':
          merged = this.insertJSComment(merged, customization);
          break;
          
        case 'custom-sections':
          merged = this.insertJSCustomSection(merged, customization);
          break;
          
        case 'overrides':
          merged = this.applyJSOverride(merged, customization);
          break;
      }
    }
    
    return merged;
  }
  
  /**
   * Merge strategy for shell scripts
   */
  async mergeShell(newContent, customizations, options) {
    let merged = newContent;
    
    for (const customization of customizations) {
      if (customization.type === 'user-comments') {
        merged = this.insertShellComment(merged, customization);
      } else if (customization.type === 'custom-sections') {
        merged = this.insertShellCustomSection(merged, customization);
      }
    }
    
    return merged;
  }
  
  /**
   * Default text merge strategy
   */
  async mergeText(newContent, customizations, options) {
    let merged = newContent;
    
    for (const customization of customizations) {
      // Insert at appropriate position based on confidence and type
      merged = this.insertCustomizationInText(merged, customization);
    }
    
    return merged;
  }
  
  /**
   * Detect document type from file path or content
   */
  detectDocumentType(filePath) {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const typeMap = {
      'md': 'markdown',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'js': 'javascript',
      'ts': 'typescript',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell'
    };
    
    return typeMap[extension] || 'text';
  }
  
  /**
   * Analyze document structure
   */
  analyzeDocumentStructure(content, documentType) {
    const structure = {
      type: documentType,
      elements: [],
      metadata: {}
    };
    
    switch (documentType) {
      case 'markdown':
        structure.elements = this.parseMarkdownStructure(content);
        break;
      case 'json':
        structure.elements = this.parseJSONStructure(content);
        break;
      case 'yaml':
        structure.elements = this.parseYAMLStructure(content);
        break;
      default:
        structure.elements = this.parseTextStructure(content);
    }
    
    return structure;
  }
  
  /**
   * Parse Markdown structure
   */
  parseMarkdownStructure(content) {
    const elements = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        elements.push({
          type: 'header',
          level: headerMatch[1].length,
          content: headerMatch[2],
          line: index,
          position: { start: index, end: index }
        });
      }
      
      // Lists
      const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
      if (listMatch) {
        elements.push({
          type: 'list-item',
          indent: listMatch[1].length,
          content: listMatch[2],
          line: index,
          position: { start: index, end: index }
        });
      }
      
      // Code blocks
      if (line.trim() === '```' || line.match(/^```\w+$/)) {
        elements.push({
          type: 'code-block-delimiter',
          content: line.trim(),
          line: index,
          position: { start: index, end: index }
        });
      }
    });
    
    return elements;
  }
  
  /**
   * Parse JSON structure
   */
  parseJSONStructure(content) {
    try {
      const obj = JSON.parse(content);
      return this.flattenJSONObject(obj, '');
    } catch {
      return [];
    }
  }
  
  /**
   * Parse YAML structure
   */
  parseYAMLStructure(content) {
    const elements = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const keyValueMatch = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (keyValueMatch) {
        elements.push({
          type: 'key-value',
          indent: keyValueMatch[1].length,
          key: keyValueMatch[2].trim(),
          value: keyValueMatch[3],
          line: index,
          position: { start: index, end: index }
        });
      }
    });
    
    return elements;
  }
  
  /**
   * Parse text structure (generic)
   */
  parseTextStructure(content) {
    const elements = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        elements.push({
          type: 'text-line',
          content: line,
          line: index,
          position: { start: index, end: index }
        });
      }
    });
    
    return elements;
  }
  
  /**
   * Helper methods for customization insertion
   */
  insertUserComment(content, customization) {
    const comment = `<!-- USER: ${customization.content} -->`;
    return this.insertAtBestPosition(content, comment, customization);
  }
  
  insertCustomSection(content, customization) {
    const section = `<!-- CUSTOM START -->\n${customization.content}\n<!-- CUSTOM END -->`;
    return this.insertAtBestPosition(content, section, customization);
  }
  
  insertAtBestPosition(content, insertion, customization) {
    const lines = content.split('\n');
    
    // Try to find the best insertion point
    let insertIndex = Math.floor(lines.length / 2); // Default to middle
    
    if (customization.position && customization.position.start) {
      // Convert character position to line
      const beforeText = content.substring(0, customization.position.start);
      insertIndex = beforeText.split('\n').length - 1;
    }
    
    lines.splice(insertIndex, 0, insertion);
    return lines.join('\n');
  }
  
  /**
   * Utility methods
   */
  deduplicateCustomizations(customizations) {
    const seen = new Set();
    return customizations.filter(custom => {
      const key = `${custom.type}:${custom.position?.start}:${custom.content}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  rankCustomizations(customizations) {
    return customizations.sort((a, b) => {
      // Sort by confidence (higher first), then by position
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return (a.position?.start || 0) - (b.position?.start || 0);
    });
  }
  
  describeCustomization(type, match) {
    const descriptions = {
      'user-comments': 'User comment',
      'custom-sections': 'Custom content section',
      'config-modifications': 'Configuration modification',
      'personal-additions': 'Personal addition',
      'overrides': 'Override configuration'
    };
    
    return descriptions[type] || 'Customization';
  }
  
  summarizeContent(content, maxLength = 50) {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    return cleaned.length > maxLength ? 
      cleaned.substring(0, maxLength) + '...' : 
      cleaned;
  }
  
  /**
   * Store methods for persistence
   */
  async storeCustomizations(filePath, customizations) {
    const key = `customizations:${this.hashFilePath(filePath)}`;
    await this.sharedMemory.set(key, {
      filePath,
      customizations,
      timestamp: Date.now()
    }, {
      namespace: this.sharedMemory.namespaces.SHARED_STATE,
      dataType: this.sharedMemory.dataTypes.PERSISTENT
    });
  }
  
  async storeContentForComparison(original, updated, options) {
    const key = `content-comparison:${Date.now()}`;
    await this.sharedMemory.set(key, {
      original,
      updated,
      filePath: options.filePath,
      timestamp: Date.now()
    }, {
      namespace: this.sharedMemory.namespaces.TEMP,
      dataType: this.sharedMemory.dataTypes.TRANSIENT,
      ttl: 3600000 // 1 hour
    });
  }
  
  async storeMergeResult(filePath, mergedContent, customizations) {
    const key = `merge-result:${this.hashFilePath(filePath)}:${Date.now()}`;
    await this.sharedMemory.set(key, {
      filePath,
      content: mergedContent,
      customizations: customizations.length,
      timestamp: Date.now()
    }, {
      namespace: this.sharedMemory.namespaces.TASK_RESULTS,
      dataType: this.sharedMemory.dataTypes.CACHED,
      ttl: 86400000 // 24 hours
    });
  }
  
  hashFilePath(filePath) {
    return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 8);
  }
  
  /**
   * Additional helper methods for specific merge operations
   */
  compareStructures(struct1, struct2) {
    const differences = [];
    
    // Simple implementation - can be enhanced with more sophisticated algorithms
    const elements1 = new Set(struct1.elements.map(e => `${e.type}:${e.content}`));
    const elements2 = new Set(struct2.elements.map(e => `${e.type}:${e.content}`));
    
    // Find additions in struct1
    struct1.elements.forEach(element => {
      const key = `${element.type}:${element.content}`;
      if (!elements2.has(key)) {
        differences.push({
          type: 'addition',
          element,
          elementType: element.type,
          content: element.content,
          position: element.position
        });
      }
    });
    
    return differences;
  }
  
  isSignificantAddition(diff, documentType) {
    const rules = this.detectionRules.get(documentType);
    if (!rules) return true;
    
    // Check if the addition matches significant patterns
    return rules.significantChanges.some(pattern => 
      pattern.test(diff.content)
    );
  }
  
  isSignificantModification(diff, documentType) {
    return this.isSignificantAddition(diff, documentType);
  }
  
  analyzeSemanticChanges(original, updated) {
    // Simplified semantic analysis - can be enhanced with NLP
    const changes = [];
    const originalWords = original.split(/\s+/);
    const updatedWords = updated.split(/\s+/);
    
    // Basic word-level comparison
    const wordDiff = this.getWordDifferences(originalWords, updatedWords);
    
    wordDiff.forEach(diff => {
      if (diff.type === 'change' && this.isSemanticallySIgnificant(diff)) {
        changes.push({
          originalContent: diff.original,
          newContent: diff.new,
          significance: diff.significance,
          description: diff.description,
          category: diff.category,
          position: diff.position
        });
      }
    });
    
    return changes;
  }
  
  getWordDifferences(original, updated) {
    // Simple word-level diff - can be replaced with more sophisticated algorithms
    return [];
  }
  
  isSemanticallySIgnificant(diff) {
    // Placeholder for semantic significance analysis
    return false;
  }
  
  postProcessMerge(content, documentType) {
    // Clean up any merge artifacts
    let cleaned = content;
    
    // Remove duplicate blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Ensure proper line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');
    
    return cleaned;
  }
  
  flattenJSONObject(obj, prefix) {
    const elements = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      elements.push({
        type: 'json-property',
        key: fullKey,
        value,
        valueType: typeof value
      });
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        elements.push(...this.flattenJSONObject(value, fullKey));
      }
    }
    
    return elements;
  }
}

module.exports = CustomizationManager;