#!/usr/bin/env node

/**
 * Agent-OS Template Manager
 * Phase 4 Implementation - MASTER-WORKFLOW v3.0
 * 
 * Manages Agent-OS template documents and customization based on project analysis.
 * Intelligently customizes templates using codebase understanding.
 * 
 * Features:
 * - Load and manage template documents
 * - Customize templates based on project analysis
 * - Intelligent merge with existing documents
 * - Generate project-specific content from analysis
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

// Import Phase 3 components for analysis
const DeepCodebaseAnalyzer = require('./deep-codebase-analyzer');
const CustomizationManager = require('./customization-manager');
const EnhancedTemplateEngine = require('./enhanced-template-engine');
const SharedMemoryStore = require('./shared-memory');

class AgentOSTemplateManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Integration with existing systems
    this.sharedMemory = options.sharedMemory || new SharedMemoryStore();
    this.analyzer = options.analyzer || new DeepCodebaseAnalyzer();
    this.customizationManager = new CustomizationManager(this.sharedMemory);
    this.templateEngine = new EnhancedTemplateEngine(this.sharedMemory);
    
    // Configuration
    this.config = {
      projectPath: options.projectPath || process.cwd(),
      preserveCustomizations: options.preserveCustomizations !== false,
      autoDetect: options.autoDetect !== false,
      verbose: options.verbose || false,
      ...options
    };
    
    // Template storage
    this.templates = new Map();
    this.customizedTemplates = new Map();
    this.projectAnalysis = null;
    
    // Default template paths
    this.templatePaths = {
      global: path.join(process.env.HOME || process.env.USERPROFILE, '.agent-os'),
      project: path.join(this.config.projectPath, '.agent-os')
    };
  }
  
  /**
   * Load all templates from Agent-OS structure
   */
  async loadTemplates() {
    const loaded = {
      standards: [],
      instructions: [],
      product: [],
      errors: []
    };
    
    try {
      // Load global standards templates
      const standardsPath = path.join(this.templatePaths.global, 'standards');
      loaded.standards = await this.loadTemplatesFromDir(standardsPath);
      
      // Load instruction templates
      const instructionsPath = path.join(this.templatePaths.global, 'instructions');
      loaded.instructions = await this.loadTemplatesFromDir(instructionsPath);
      
      // Load project product templates
      const productPath = path.join(this.templatePaths.project, 'product');
      loaded.product = await this.loadTemplatesFromDir(productPath);
      
      this.emit('templates-loaded', loaded);
      return loaded;
      
    } catch (error) {
      loaded.errors.push(error);
      this.emit('error', error);
      return loaded;
    }
  }
  
  /**
   * Load templates from a directory recursively
   */
  async loadTemplatesFromDir(dirPath, category = '') {
    const templates = [];
    
    try {
      // Check if directory exists
      const exists = await this.pathExists(dirPath);
      if (!exists) {
        return templates;
      }
      
      // Read directory contents
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          // Recursively load from subdirectories
          const subTemplates = await this.loadTemplatesFromDir(
            itemPath,
            category ? `${category}/${item.name}` : item.name
          );
          templates.push(...subTemplates);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          // Load markdown template
          const content = await fs.readFile(itemPath, 'utf8');
          const templateId = category ? `${category}/${item.name}` : item.name;
          
          this.templates.set(templateId, {
            id: templateId,
            path: itemPath,
            content: content,
            category: category,
            filename: item.name
          });
          
          templates.push(templateId);
        }
      }
      
      return templates;
      
    } catch (error) {
      console.error(`Error loading templates from ${dirPath}:`, error);
      return templates;
    }
  }
  
  /**
   * Customize template based on project analysis
   */
  async customizeTemplate(templateId, analysis = null) {
    // Get template
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Use provided analysis or run new analysis
    const projectAnalysis = analysis || this.projectAnalysis || await this.analyzeProject();
    
    // Customize based on template type
    let customized = template.content;
    
    switch (templateId) {
      case 'tech-stack.md':
      case 'standards/tech-stack.md':
        customized = await this.customizeTechStack(template.content, projectAnalysis);
        break;
        
      case 'code-style.md':
      case 'standards/code-style.md':
        customized = await this.customizeCodeStyle(template.content, projectAnalysis);
        break;
        
      case 'best-practices.md':
      case 'standards/best-practices.md':
        customized = await this.customizeBestPractices(template.content, projectAnalysis);
        break;
        
      case 'mission.md':
      case 'product/mission.md':
        customized = await this.customizeMission(template.content, projectAnalysis);
        break;
        
      case 'roadmap.md':
      case 'product/roadmap.md':
        customized = await this.customizeRoadmap(template.content, projectAnalysis);
        break;
        
      case 'decisions.md':
      case 'product/decisions.md':
        customized = await this.customizeDecisions(template.content, projectAnalysis);
        break;
        
      default:
        // For other templates, do smart replacements
        customized = await this.smartCustomize(template.content, projectAnalysis);
    }
    
    // Store customized template
    this.customizedTemplates.set(templateId, {
      ...template,
      content: customized,
      customized: true,
      analysis: projectAnalysis
    });
    
    this.emit('template-customized', { templateId, customized });
    return customized;
  }
  
  /**
   * Customize tech-stack.md based on analysis
   */
  async customizeTechStack(template, analysis) {
    const replacements = {
      '[Language]': this.detectLanguages(analysis),
      '[Framework]': this.detectFrameworks(analysis),
      '[Database]': this.detectDatabases(analysis),
      '[Cache]': this.detectCache(analysis),
      '[Provider]': this.detectCloudProvider(analysis),
      '[Platform]': this.detectCIPlatform(analysis),
      '[npm/yarn/pnpm]': this.detectPackageManager(analysis),
      '[Tool]': this.detectBuildTool(analysis)
    };
    
    let customized = template;
    for (const [placeholder, value] of Object.entries(replacements)) {
      if (value) {
        customized = customized.replace(new RegExp(escapeRegExp(placeholder), 'g'), value);
      }
    }
    
    // Add detected tech stack details
    if (analysis.techStack) {
      customized += `\n## Detected Technology Stack\n\n`;
      
      if (analysis.techStack.languages?.length > 0) {
        customized += `### Languages\n${analysis.techStack.languages.map(l => `- ${l}`).join('\n')}\n\n`;
      }
      
      if (analysis.techStack.frameworks?.length > 0) {
        customized += `### Frameworks\n${analysis.techStack.frameworks.map(f => `- ${f}`).join('\n')}\n\n`;
      }
      
      if (analysis.techStack.databases?.length > 0) {
        customized += `### Databases\n${analysis.techStack.databases.map(d => `- ${d}`).join('\n')}\n\n`;
      }
      
      if (analysis.techStack.tools?.length > 0) {
        customized += `### Tools\n${analysis.techStack.tools.map(t => `- ${t}`).join('\n')}\n\n`;
      }
    }
    
    return customized;
  }
  
  /**
   * Customize code-style.md based on analysis
   */
  async customizeCodeStyle(template, analysis) {
    // Detect code style from existing code
    const indentation = this.detectIndentation(analysis) || '2 spaces';
    const lineLength = this.detectLineLength(analysis) || '100';
    
    let customized = template;
    customized = customized.replace('[2/4]', indentation.includes('2') ? '2' : '4');
    customized = customized.replace('[80/100/120]', lineLength);
    
    // Add language-specific styles
    if (analysis.techStack?.languages) {
      customized += `\n## Language-Specific Styles\n\n`;
      
      for (const lang of analysis.techStack.languages) {
        const styleGuide = this.getLanguageStyleGuide(lang, analysis);
        if (styleGuide) {
          customized += `### ${lang}\n${styleGuide}\n\n`;
        }
      }
    }
    
    return customized;
  }
  
  /**
   * Customize best-practices.md based on analysis
   */
  async customizeBestPractices(template, analysis) {
    let customized = template;
    
    // Add detected patterns and practices
    if (analysis.patterns) {
      customized += `\n## Detected Patterns & Practices\n\n`;
      
      if (analysis.patterns.designPatterns?.length > 0) {
        customized += `### Design Patterns\n${analysis.patterns.designPatterns.map(p => `- ${p}`).join('\n')}\n\n`;
      }
      
      if (analysis.patterns.architecturalPatterns?.length > 0) {
        customized += `### Architectural Patterns\n${analysis.patterns.architecturalPatterns.map(p => `- ${p}`).join('\n')}\n\n`;
      }
    }
    
    // Add testing practices if detected
    if (analysis.testing) {
      customized += `\n## Testing Practices\n\n`;
      customized += `- Test Coverage: ${analysis.testing.coverage || 'Unknown'}%\n`;
      customized += `- Test Framework: ${analysis.testing.framework || 'Unknown'}\n`;
      customized += `- Test Types: ${analysis.testing.types?.join(', ') || 'Unknown'}\n\n`;
    }
    
    return customized;
  }
  
  /**
   * Customize mission.md based on analysis
   */
  async customizeMission(template, analysis) {
    let customized = template;
    
    // Try to infer mission from README or package.json
    const projectInfo = await this.getProjectInfo(analysis);
    
    if (projectInfo.name) {
      customized = customized.replace('[What is the long-term vision for this product?]', 
        `Build and maintain ${projectInfo.name} as a leading solution in its domain`);
    }
    
    if (projectInfo.description) {
      customized = customized.replace('[Clear, concise mission statement]', projectInfo.description);
    }
    
    return customized;
  }
  
  /**
   * Customize roadmap.md based on analysis
   */
  async customizeRoadmap(template, analysis) {
    let customized = template;
    
    // Add detected features and TODOs
    if (analysis.businessLogic?.features) {
      customized += `\n## Detected Features\n\n`;
      
      for (const feature of analysis.businessLogic.features) {
        customized += `- [x] ${feature}\n`;
      }
      customized += '\n';
    }
    
    // Add detected TODOs and FIXMEs
    const todos = await this.findTODOs(analysis);
    if (todos.length > 0) {
      customized += `\n## Detected TODOs\n\n`;
      for (const todo of todos) {
        customized += `- [ ] ${todo}\n`;
      }
      customized += '\n';
    }
    
    return customized;
  }
  
  /**
   * Customize decisions.md based on analysis
   */
  async customizeDecisions(template, analysis) {
    let customized = template;
    
    // Add initial decision about tech stack
    const today = new Date().toISOString().split('T')[0];
    
    customized += `\n### Date: ${today}\n`;
    customized += `### Decision: Technology Stack Selection\n`;
    customized += `### Context\nInitial technology stack selection based on project analysis.\n\n`;
    customized += `### Options Considered\n`;
    customized += `Based on the codebase analysis, the following stack was detected and confirmed.\n\n`;
    customized += `### Decision\n`;
    
    if (analysis.techStack) {
      customized += `- Languages: ${analysis.techStack.languages?.join(', ') || 'Not detected'}\n`;
      customized += `- Frameworks: ${analysis.techStack.frameworks?.join(', ') || 'Not detected'}\n`;
      customized += `- Databases: ${analysis.techStack.databases?.join(', ') || 'Not detected'}\n`;
    }
    
    customized += `\n### Consequences\n`;
    customized += `This tech stack provides the foundation for all future development.\n\n---\n`;
    
    return customized;
  }
  
  /**
   * Smart customize for generic templates
   */
  async smartCustomize(template, analysis) {
    let customized = template;
    
    // Replace common placeholders
    const projectInfo = await this.getProjectInfo(analysis);
    
    const replacements = {
      '[Project Name]': projectInfo.name || 'Project',
      '[Description]': projectInfo.description || 'Project description',
      '[Version]': projectInfo.version || '1.0.0',
      '[Author]': projectInfo.author || 'Team',
      '[License]': projectInfo.license || 'MIT'
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      customized = customized.replace(new RegExp(escapeRegExp(placeholder), 'g'), value);
    }
    
    return customized;
  }
  
  /**
   * Merge customized template with existing document
   */
  async mergeWithExisting(templateContent, existingContent, preserveCustom = true) {
    if (!preserveCustom) {
      return templateContent;
    }
    
    // Detect customizations in existing content
    const customizations = await this.customizationManager.detectCustomizations(
      templateContent,
      existingContent
    );
    
    if (customizations.length === 0) {
      // No customizations detected, use new template
      return templateContent;
    }
    
    // Intelligent merge - preserve user sections
    let merged = templateContent;
    
    // Extract user-added sections (sections not in template)
    const userSections = this.extractUserSections(templateContent, existingContent);
    
    // Append user sections at the end
    if (userSections.length > 0) {
      merged += '\n\n## User Customizations\n\n';
      merged += userSections.join('\n\n');
    }
    
    // Preserve user comments
    const userComments = this.extractUserComments(existingContent);
    for (const comment of userComments) {
      // Try to place comment in similar location
      merged = this.insertCommentNearContext(merged, comment);
    }
    
    this.emit('template-merged', { customizations, userSections });
    return merged;
  }
  
  /**
   * Generate documents from analysis (no template)
   */
  async generateFromAnalysis(analysis) {
    const generated = {};
    
    // Generate tech stack document
    generated['tech-stack.md'] = this.generateTechStackDoc(analysis);
    
    // Generate architecture document
    generated['architecture.md'] = this.generateArchitectureDoc(analysis);
    
    // Generate API documentation if APIs detected
    if (analysis.apis?.endpoints?.length > 0) {
      generated['api-docs.md'] = this.generateAPIDoc(analysis);
    }
    
    // Generate database schema if detected
    if (analysis.databases?.schemas?.length > 0) {
      generated['database-schema.md'] = this.generateDatabaseDoc(analysis);
    }
    
    this.emit('documents-generated', generated);
    return generated;
  }
  
  /**
   * Analyze project for customization
   */
  async analyzeProject() {
    if (this.projectAnalysis) {
      return this.projectAnalysis;
    }
    
    try {
      // Run deep analysis
      this.projectAnalysis = await this.analyzer.analyzeComplete(this.config.projectPath);
      
      // Store in shared memory
      await this.sharedMemory.store('project-analysis', this.projectAnalysis);
      
      this.emit('project-analyzed', this.projectAnalysis);
      return this.projectAnalysis;
      
    } catch (error) {
      console.error('Failed to analyze project:', error);
      // Return minimal analysis
      return {
        techStack: { languages: [], frameworks: [], databases: [], tools: [] },
        patterns: {},
        architecture: 'unknown'
      };
    }
  }
  
  // === Helper Methods ===
  
  detectLanguages(analysis) {
    const languages = analysis.techStack?.languages || [];
    if (languages.length === 0) return 'JavaScript';
    if (languages.length === 1) return languages[0];
    return `${languages[0]} (Primary), ${languages.slice(1).join(', ')} (Secondary)`;
  }
  
  detectFrameworks(analysis) {
    const frameworks = analysis.techStack?.frameworks || [];
    if (frameworks.length === 0) return '[Framework]';
    return frameworks.join(', ');
  }
  
  detectDatabases(analysis) {
    const databases = analysis.databases?.detected || analysis.techStack?.databases || [];
    if (databases.length === 0) return '[Database]';
    return databases[0];
  }
  
  detectCache(analysis) {
    const cache = analysis.databases?.cache || 
                  (analysis.techStack?.databases?.includes('Redis') ? 'Redis' : null);
    return cache || '[Cache]';
  }
  
  detectCloudProvider(analysis) {
    if (analysis.deployment?.cloudProvider) return analysis.deployment.cloudProvider;
    if (analysis.deployment?.docker) return 'Docker-based';
    if (analysis.deployment?.kubernetes) return 'Kubernetes';
    return '[Provider]';
  }
  
  detectCIPlatform(analysis) {
    if (analysis.deployment?.cicd) {
      // Try to detect from files
      if (analysis.files?.some(f => f.includes('.github/workflows'))) return 'GitHub Actions';
      if (analysis.files?.some(f => f.includes('.gitlab-ci'))) return 'GitLab CI';
      if (analysis.files?.some(f => f.includes('jenkins'))) return 'Jenkins';
    }
    return '[Platform]';
  }
  
  detectPackageManager(analysis) {
    if (analysis.files?.some(f => f.includes('yarn.lock'))) return 'yarn';
    if (analysis.files?.some(f => f.includes('pnpm-lock'))) return 'pnpm';
    if (analysis.files?.some(f => f.includes('package-lock.json'))) return 'npm';
    return 'npm';
  }
  
  detectBuildTool(analysis) {
    if (analysis.files?.some(f => f.includes('webpack'))) return 'Webpack';
    if (analysis.files?.some(f => f.includes('vite'))) return 'Vite';
    if (analysis.files?.some(f => f.includes('rollup'))) return 'Rollup';
    if (analysis.files?.some(f => f.includes('parcel'))) return 'Parcel';
    return '[Tool]';
  }
  
  detectIndentation(analysis) {
    // This would need actual code analysis
    return '2 spaces';
  }
  
  detectLineLength(analysis) {
    // This would need actual code analysis
    return '100';
  }
  
  getLanguageStyleGuide(language, analysis) {
    const guides = {
      'JavaScript': `- Use ES6+ features\n- Async/await for asynchronous code\n- Destructuring where appropriate`,
      'TypeScript': `- Strict type checking enabled\n- Interface over type where possible\n- Explicit return types`,
      'Python': `- Follow PEP 8\n- Type hints for functions\n- Docstrings for all public methods`,
      'Java': `- Follow Oracle conventions\n- JavaDoc for public APIs\n- Meaningful variable names`,
      'Go': `- Follow effective Go guidelines\n- Keep it simple\n- Handle errors explicitly`
    };
    
    return guides[language] || '';
  }
  
  async getProjectInfo(analysis) {
    try {
      // Try to read package.json
      const packagePath = path.join(this.config.projectPath, 'package.json');
      const packageExists = await this.pathExists(packagePath);
      
      if (packageExists) {
        const packageContent = await fs.readFile(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        
        return {
          name: packageJson.name || 'Project',
          description: packageJson.description || '',
          version: packageJson.version || '1.0.0',
          author: packageJson.author || '',
          license: packageJson.license || 'MIT'
        };
      }
    } catch (error) {
      // Ignore errors
    }
    
    return {
      name: path.basename(this.config.projectPath),
      description: '',
      version: '1.0.0',
      author: '',
      license: 'MIT'
    };
  }
  
  async findTODOs(analysis) {
    // This would scan for TODO/FIXME comments
    return [];
  }
  
  extractUserSections(template, existing) {
    // Extract sections that exist in existing but not in template
    const templateSections = this.extractSections(template);
    const existingSections = this.extractSections(existing);
    
    const userSections = [];
    for (const section of existingSections) {
      if (!templateSections.some(ts => ts.title === section.title)) {
        userSections.push(section.content);
      }
    }
    
    return userSections;
  }
  
  extractSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    
    for (const line of lines) {
      if (line.startsWith('#')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line,
          content: line
        };
      } else if (currentSection) {
        currentSection.content += '\n' + line;
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  extractUserComments(content) {
    const comments = [];
    const commentPattern = /<!--\s*User[^>]*-->/g;
    let match;
    
    while ((match = commentPattern.exec(content)) !== null) {
      comments.push(match[0]);
    }
    
    return comments;
  }
  
  insertCommentNearContext(content, comment) {
    // Try to find similar context and insert comment
    // This is simplified - real implementation would be more sophisticated
    return content + '\n' + comment;
  }
  
  generateTechStackDoc(analysis) {
    let doc = `# Technology Stack\n\n`;
    doc += `## Auto-Generated from Analysis\n\n`;
    
    if (analysis.techStack) {
      doc += `### Languages\n${(analysis.techStack.languages || []).map(l => `- ${l}`).join('\n')}\n\n`;
      doc += `### Frameworks\n${(analysis.techStack.frameworks || []).map(f => `- ${f}`).join('\n')}\n\n`;
      doc += `### Databases\n${(analysis.techStack.databases || []).map(d => `- ${d}`).join('\n')}\n\n`;
      doc += `### Tools\n${(analysis.techStack.tools || []).map(t => `- ${t}`).join('\n')}\n\n`;
    }
    
    return doc;
  }
  
  generateArchitectureDoc(analysis) {
    let doc = `# Architecture Overview\n\n`;
    doc += `## Detected Architecture: ${analysis.architecture || 'Unknown'}\n\n`;
    
    if (analysis.patterns) {
      doc += `### Design Patterns\n${(analysis.patterns.designPatterns || []).map(p => `- ${p}`).join('\n')}\n\n`;
      doc += `### Architectural Patterns\n${(analysis.patterns.architecturalPatterns || []).map(p => `- ${p}`).join('\n')}\n\n`;
    }
    
    return doc;
  }
  
  generateAPIDoc(analysis) {
    let doc = `# API Documentation\n\n`;
    
    if (analysis.apis?.endpoints) {
      for (const endpoint of analysis.apis.endpoints) {
        doc += `## ${endpoint.method} ${endpoint.path}\n`;
        doc += `${endpoint.description || 'No description'}\n\n`;
      }
    }
    
    return doc;
  }
  
  generateDatabaseDoc(analysis) {
    let doc = `# Database Schema\n\n`;
    
    if (analysis.databases?.schemas) {
      for (const schema of analysis.databases.schemas) {
        doc += `## ${schema.name}\n`;
        doc += `${schema.description || ''}\n\n`;
        
        if (schema.tables) {
          for (const table of schema.tables) {
            doc += `### ${table.name}\n`;
            doc += `${table.columns?.map(c => `- ${c.name}: ${c.type}`).join('\n')}\n\n`;
          }
        }
      }
    }
    
    return doc;
  }
  
  async pathExists(pathToCheck) {
    try {
      await fs.access(pathToCheck);
      return true;
    } catch {
      return false;
    }
  }
}

// Helper function for regex escaping
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = AgentOSTemplateManager;

// CLI usage if run directly
if (require.main === module) {
  const manager = new AgentOSTemplateManager({
    verbose: true
  });
  
  (async () => {
    try {
      console.log('Loading templates...');
      await manager.loadTemplates();
      
      console.log('\nAnalyzing project...');
      const analysis = await manager.analyzeProject();
      
      console.log('\nCustomizing templates...');
      for (const templateId of manager.templates.keys()) {
        await manager.customizeTemplate(templateId, analysis);
        console.log(`Customized: ${templateId}`);
      }
      
      console.log('\n✅ Templates customized successfully!');
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}