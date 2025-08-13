#!/usr/bin/env node

/**
 * Enhanced Template Engine
 * Advanced templating system for document generation
 * 
 * Features:
 * - Multiple template formats (Handlebars, Mustache, custom syntax)
 * - Dynamic template compilation and caching
 * - Context-aware template selection
 * - Template inheritance and composition
 * - Conditional logic and loops
 * - Custom helper functions
 * - Template validation and error handling
 * - Integration with SharedMemory for template storage
 */

const EventEmitter = require('events');
const path = require('path');
const crypto = require('crypto');

class EnhancedTemplateEngine extends EventEmitter {
  constructor(sharedMemory) {
    super();
    
    this.sharedMemory = sharedMemory;
    this.templateCache = new Map();
    this.compiledTemplates = new Map();
    this.templateMetadata = new Map();
    this.helpers = new Map();
    this.partials = new Map();
    
    // Configuration
    this.config = {
      cacheTemplates: true,
      validateTemplates: true,
      allowUnsafeEval: false,
      maxTemplateSize: 1024 * 1024, // 1MB
      templateTimeout: 30000, // 30 seconds
      enableInheritance: true,
      enableIncludes: true
    };
    
    // Template syntax configurations
    this.syntaxConfig = {
      handlebars: {
        variableStart: '{{',
        variableEnd: '}}',
        blockStart: '{{#',
        blockEnd: '}}',
        blockClose: '{{/',
        blockCloseEnd: '}}'
      },
      mustache: {
        variableStart: '{{',
        variableEnd: '}}',
        blockStart: '{{#',
        blockEnd: '}}',
        blockClose: '{{/',
        blockCloseEnd: '}}'
      },
      custom: {
        variableStart: '${',
        variableEnd: '}',
        blockStart: '<%',
        blockEnd: '%>',
        blockClose: '</%',
        blockCloseEnd: '%>'
      }
    };
    
    this.initializeEngine();
  }
  
  /**
   * Initialize the template engine
   */
  async initializeEngine() {
    try {
      // Register built-in helpers
      this.registerBuiltinHelpers();
      
      // Load templates from shared memory
      await this.loadTemplatesFromMemory();
      
      // Setup template validation
      this.setupValidation();
      
      this.emit('engine-initialized', {
        templatesLoaded: this.templateCache.size,
        helpersRegistered: this.helpers.size
      });
      
    } catch (error) {
      this.emit('error', new Error(`Failed to initialize template engine: ${error.message}`));
    }
  }
  
  /**
   * Register a template with the engine
   */
  async registerTemplate(name, content, options = {}) {
    try {
      // Validate template content
      if (this.config.validateTemplates) {
        await this.validateTemplate(content, options);
      }
      
      // Create template metadata
      const metadata = {
        name,
        size: content.length,
        type: options.type || 'template',
        syntax: options.syntax || 'handlebars',
        created: Date.now(),
        updated: Date.now(),
        version: options.version || '1.0.0',
        description: options.description || '',
        tags: options.tags || [],
        dependencies: options.dependencies || [],
        author: options.author || 'system'
      };
      
      // Store template
      this.templateCache.set(name, {
        content,
        metadata,
        compiled: null
      });
      
      this.templateMetadata.set(name, metadata);
      
      // Pre-compile if requested
      if (options.precompile) {
        await this.compileTemplate(name);
      }
      
      // Persist to shared memory
      await this.persistTemplate(name, content, metadata);
      
      this.emit('template-registered', {
        name,
        size: content.length,
        type: metadata.type
      });
      
      return {
        name,
        id: this.generateTemplateId(name),
        size: content.length,
        version: metadata.version
      };
      
    } catch (error) {
      this.emit('error', new Error(`Failed to register template: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Compile a template for faster rendering
   */
  async compileTemplate(name, options = {}) {
    try {
      const template = this.templateCache.get(name);
      if (!template) {
        throw new Error(`Template '${name}' not found`);
      }
      
      if (template.compiled && !options.force) {
        return template.compiled;
      }
      
      const syntax = template.metadata.syntax || 'handlebars';
      const compiler = this.getCompiler(syntax);
      
      // Compile template
      const compiled = await compiler.compile(template.content, {
        ...options,
        syntax: template.metadata.syntax,
        helpers: this.helpers,
        partials: this.partials
      });
      
      // Cache compiled template
      template.compiled = compiled;
      this.compiledTemplates.set(name, compiled);
      
      this.emit('template-compiled', {
        name,
        syntax,
        compilationTime: Date.now() - (options.startTime || Date.now())
      });
      
      return compiled;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to compile template '${name}': ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Render a template with given context
   */
  async render(templateName, context = {}, options = {}) {
    try {
      const startTime = Date.now();
      
      // Get or compile template
      let compiled = this.compiledTemplates.get(templateName);
      if (!compiled) {
        compiled = await this.compileTemplate(templateName);
      }
      
      // Prepare rendering context
      const renderContext = await this.prepareContext(context, options);
      
      // Add built-in context variables
      renderContext.$timestamp = Date.now();
      renderContext.$templateName = templateName;
      renderContext.$renderOptions = options;
      
      // Render template
      let result;
      if (options.timeout) {
        result = await this.renderWithTimeout(compiled, renderContext, options.timeout);
      } else {
        result = await compiled.render(renderContext);
      }
      
      // Post-process result
      result = await this.postProcessResult(result, options);
      
      const renderTime = Date.now() - startTime;
      
      this.emit('template-rendered', {
        templateName,
        contextSize: Object.keys(context).length,
        renderTime,
        outputSize: result.length
      });
      
      return result;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to render template '${templateName}': ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Render template with inheritance support
   */
  async renderWithInheritance(templateName, context = {}, options = {}) {
    try {
      if (!this.config.enableInheritance) {
        return await this.render(templateName, context, options);
      }
      
      // Check for parent template
      const template = this.templateCache.get(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }
      
      const parentTemplate = this.extractParentTemplate(template.content);
      
      if (parentTemplate) {
        // Render parent template first
        const parentContext = {
          ...context,
          $blocks: await this.extractBlocks(template.content),
          $child: templateName
        };
        
        return await this.render(parentTemplate, parentContext, options);
      } else {
        return await this.render(templateName, context, options);
      }
      
    } catch (error) {
      this.emit('error', new Error(`Failed to render with inheritance: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Include and render partial templates
   */
  async renderWithIncludes(templateName, context = {}, options = {}) {
    try {
      if (!this.config.enableIncludes) {
        return await this.render(templateName, context, options);
      }
      
      let template = this.templateCache.get(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }
      
      // Process includes
      let content = template.content;
      const includes = this.extractIncludes(content);
      
      for (const include of includes) {
        const includeContent = await this.render(include.template, {
          ...context,
          ...include.context
        }, options);
        
        content = content.replace(include.placeholder, includeContent);
      }
      
      // Create temporary template with includes resolved
      const tempName = `${templateName}_with_includes_${Date.now()}`;
      await this.registerTemplate(tempName, content, {
        type: 'temporary',
        syntax: template.metadata.syntax
      });
      
      try {
        const result = await this.render(tempName, context, options);
        
        // Cleanup temporary template
        this.templateCache.delete(tempName);
        this.compiledTemplates.delete(tempName);
        
        return result;
      } catch (error) {
        // Cleanup on error
        this.templateCache.delete(tempName);
        this.compiledTemplates.delete(tempName);
        throw error;
      }
      
    } catch (error) {
      this.emit('error', new Error(`Failed to render with includes: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Batch render multiple templates
   */
  async renderBatch(templates, sharedContext = {}, options = {}) {
    try {
      const results = new Map();
      const startTime = Date.now();
      
      const renderPromises = templates.map(async templateSpec => {
        const { name, context = {}, options: templateOptions = {} } = templateSpec;
        const finalContext = { ...sharedContext, ...context };
        const finalOptions = { ...options, ...templateOptions };
        
        try {
          const result = await this.render(name, finalContext, finalOptions);
          return { name, result, success: true };
        } catch (error) {
          return { name, error: error.message, success: false };
        }
      });
      
      const renderResults = await Promise.all(renderPromises);
      
      renderResults.forEach(result => {
        results.set(result.name, {
          success: result.success,
          content: result.result,
          error: result.error
        });
      });
      
      const totalTime = Date.now() - startTime;
      const successful = renderResults.filter(r => r.success).length;
      
      this.emit('batch-rendered', {
        totalTemplates: templates.length,
        successful,
        failed: templates.length - successful,
        totalTime
      });
      
      return results;
      
    } catch (error) {
      this.emit('error', new Error(`Failed to render batch: ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Register a helper function
   */
  registerHelper(name, func, options = {}) {
    try {
      if (typeof func !== 'function') {
        throw new Error('Helper must be a function');
      }
      
      this.helpers.set(name, {
        func,
        description: options.description || '',
        async: options.async || false,
        safe: options.safe || false,
        created: Date.now()
      });
      
      this.emit('helper-registered', { name, async: options.async });
      
    } catch (error) {
      this.emit('error', new Error(`Failed to register helper '${name}': ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Register a partial template
   */
  registerPartial(name, content, options = {}) {
    try {
      this.partials.set(name, {
        content,
        syntax: options.syntax || 'handlebars',
        created: Date.now()
      });
      
      this.emit('partial-registered', { name });
      
    } catch (error) {
      this.emit('error', new Error(`Failed to register partial '${name}': ${error.message}`));
      throw error;
    }
  }
  
  /**
   * Get template information
   */
  getTemplateInfo(name) {
    const template = this.templateCache.get(name);
    if (!template) {
      return null;
    }
    
    return {
      name,
      metadata: template.metadata,
      size: template.content.length,
      compiled: !!template.compiled,
      lastRendered: template.lastRendered || null
    };
  }
  
  /**
   * List all registered templates
   */
  listTemplates(options = {}) {
    const templates = [];
    
    for (const [name, template] of this.templateCache) {
      // Apply filters
      if (options.type && template.metadata.type !== options.type) {
        continue;
      }
      
      if (options.syntax && template.metadata.syntax !== options.syntax) {
        continue;
      }
      
      if (options.tags && !options.tags.some(tag => template.metadata.tags.includes(tag))) {
        continue;
      }
      
      templates.push({
        name,
        type: template.metadata.type,
        syntax: template.metadata.syntax,
        size: template.content.length,
        version: template.metadata.version,
        created: template.metadata.created,
        updated: template.metadata.updated
      });
    }
    
    // Sort by name by default
    templates.sort((a, b) => a.name.localeCompare(b.name));
    
    return templates;
  }
  
  /**
   * Validate template syntax and structure
   */
  async validateTemplate(content, options = {}) {
    try {
      const syntax = options.syntax || 'handlebars';
      const validator = this.getValidator(syntax);
      
      // Size check
      if (content.length > this.config.maxTemplateSize) {
        throw new Error(`Template exceeds maximum size limit (${this.config.maxTemplateSize} bytes)`);
      }
      
      // Syntax validation
      const validation = await validator.validate(content);
      
      if (!validation.valid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Security checks
      if (!this.config.allowUnsafeEval) {
        const securityIssues = this.checkTemplateSecurity(content);
        if (securityIssues.length > 0) {
          throw new Error(`Template security issues: ${securityIssues.join(', ')}`);
        }
      }
      
      return validation;
      
    } catch (error) {
      throw new Error(`Template validation failed: ${error.message}`);
    }
  }
  
  /**
   * Get compiler for specific syntax
   */
  getCompiler(syntax) {
    switch (syntax) {
      case 'handlebars':
        return new HandlebarsCompiler(this.syntaxConfig.handlebars);
      case 'mustache':
        return new MustacheCompiler(this.syntaxConfig.mustache);
      case 'custom':
        return new CustomCompiler(this.syntaxConfig.custom);
      default:
        throw new Error(`Unsupported template syntax: ${syntax}`);
    }
  }
  
  /**
   * Get validator for specific syntax
   */
  getValidator(syntax) {
    switch (syntax) {
      case 'handlebars':
        return new HandlebarsValidator();
      case 'mustache':
        return new MustacheValidator();
      case 'custom':
        return new CustomValidator();
      default:
        throw new Error(`No validator available for syntax: ${syntax}`);
    }
  }
  
  /**
   * Register built-in helper functions
   */
  registerBuiltinHelpers() {
    // Date/time helpers
    this.registerHelper('now', () => new Date().toISOString());
    this.registerHelper('timestamp', () => Date.now());
    this.registerHelper('formatDate', (date, format) => {
      const d = new Date(date);
      // Simple date formatting - in production, use a proper date library
      return d.toLocaleDateString();
    });
    
    // String helpers
    this.registerHelper('uppercase', str => String(str).toUpperCase());
    this.registerHelper('lowercase', str => String(str).toLowerCase());
    this.registerHelper('capitalize', str => {
      const s = String(str);
      return s.charAt(0).toUpperCase() + s.slice(1);
    });
    this.registerHelper('trim', str => String(str).trim());
    this.registerHelper('replace', (str, search, replace) => {
      return String(str).replace(new RegExp(search, 'g'), replace);
    });
    
    // Number helpers
    this.registerHelper('add', (a, b) => Number(a) + Number(b));
    this.registerHelper('subtract', (a, b) => Number(a) - Number(b));
    this.registerHelper('multiply', (a, b) => Number(a) * Number(b));
    this.registerHelper('divide', (a, b) => Number(a) / Number(b));
    this.registerHelper('round', num => Math.round(Number(num)));
    
    // Array helpers
    this.registerHelper('length', arr => Array.isArray(arr) ? arr.length : 0);
    this.registerHelper('join', (arr, separator = ',') => {
      return Array.isArray(arr) ? arr.join(separator) : '';
    });
    this.registerHelper('slice', (arr, start, end) => {
      return Array.isArray(arr) ? arr.slice(start, end) : [];
    });
    
    // Comparison helpers
    this.registerHelper('eq', (a, b) => a === b);
    this.registerHelper('ne', (a, b) => a !== b);
    this.registerHelper('gt', (a, b) => Number(a) > Number(b));
    this.registerHelper('lt', (a, b) => Number(a) < Number(b));
    this.registerHelper('gte', (a, b) => Number(a) >= Number(b));
    this.registerHelper('lte', (a, b) => Number(a) <= Number(b));
    
    // Logic helpers
    this.registerHelper('and', (...args) => args.slice(0, -1).every(Boolean));
    this.registerHelper('or', (...args) => args.slice(0, -1).some(Boolean));
    this.registerHelper('not', val => !val);
    
    // Utility helpers
    this.registerHelper('json', obj => JSON.stringify(obj, null, 2));
    this.registerHelper('default', (value, defaultValue) => value || defaultValue);
    this.registerHelper('debug', (context) => {
      console.log('Template Debug:', context);
      return '';
    });
  }
  
  /**
   * Prepare rendering context with helper functions
   */
  async prepareContext(context, options) {
    const prepared = { ...context };
    
    // Add helpers to context
    const helperFunctions = {};
    for (const [name, helper] of this.helpers) {
      helperFunctions[name] = helper.func;
    }
    prepared.$helpers = helperFunctions;
    
    // Add system context
    prepared.$system = {
      timestamp: Date.now(),
      version: '1.0.0',
      engine: 'enhanced-template-engine'
    };
    
    return prepared;
  }
  
  /**
   * Render template with timeout
   */
  async renderWithTimeout(compiled, context, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Template rendering timed out after ${timeout}ms`));
      }, timeout);
      
      compiled.render(context)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
  
  /**
   * Post-process rendering result
   */
  async postProcessResult(result, options) {
    let processed = result;
    
    // Trim whitespace if requested
    if (options.trim) {
      processed = processed.trim();
    }
    
    // Normalize line endings
    if (options.normalizeLineEndings) {
      processed = processed.replace(/\r\n/g, '\n');
    }
    
    // Remove empty lines if requested
    if (options.removeEmptyLines) {
      processed = processed.replace(/^\s*\n/gm, '');
    }
    
    return processed;
  }
  
  /**
   * Extract parent template from inheritance syntax
   */
  extractParentTemplate(content) {
    const match = content.match(/{{!\s*extends\s+['"]([^'"]+)['"]\s*}}/);
    return match ? match[1] : null;
  }
  
  /**
   * Extract template blocks for inheritance
   */
  async extractBlocks(content) {
    const blocks = {};
    const blockRegex = /{{#block\s+['"]([^'"]+)['"]\s*}}([\s\S]*?){{\/block}}/g;
    
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
      blocks[match[1]] = match[2];
    }
    
    return blocks;
  }
  
  /**
   * Extract include directives
   */
  extractIncludes(content) {
    const includes = [];
    const includeRegex = /{{>\s*['"]([^'"]+)['"]\s*(?:with\s+(.+?))?\s*}}/g;
    
    let match;
    while ((match = includeRegex.exec(content)) !== null) {
      includes.push({
        placeholder: match[0],
        template: match[1],
        context: match[2] ? this.parseContextString(match[2]) : {}
      });
    }
    
    return includes;
  }
  
  /**
   * Parse context string for includes
   */
  parseContextString(contextStr) {
    try {
      // Simple key=value parsing - in production, use a proper parser
      const context = {};
      const pairs = contextStr.split(/\s+/);
      
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          context[key.trim()] = value.trim().replace(/['"]/g, '');
        }
      });
      
      return context;
    } catch {
      return {};
    }
  }
  
  /**
   * Check template for security issues
   */
  checkTemplateSecurity(content) {
    const issues = [];
    
    // Check for potential script injection
    if (content.match(/<script[\s\S]*?<\/script>/gi)) {
      issues.push('Contains script tags');
    }
    
    // Check for eval usage
    if (content.match(/eval\s*\(/gi)) {
      issues.push('Contains eval() calls');
    }
    
    // Check for dangerous helpers
    const dangerousPatterns = [
      /require\s*\(/gi,
      /process\./gi,
      /global\./gi,
      /__dirname/gi,
      /__filename/gi
    ];
    
    dangerousPatterns.forEach(pattern => {
      if (content.match(pattern)) {
        issues.push(`Contains potentially dangerous pattern: ${pattern.source}`);
      }
    });
    
    return issues;
  }
  
  /**
   * Generate template ID
   */
  generateTemplateId(name) {
    return crypto.createHash('md5').update(name).digest('hex').substring(0, 8);
  }
  
  /**
   * Load templates from shared memory
   */
  async loadTemplatesFromMemory() {
    try {
      const templates = await this.sharedMemory.get('template-engine:templates');
      if (templates) {
        for (const [name, template] of templates) {
          this.templateCache.set(name, template);
          this.templateMetadata.set(name, template.metadata);
        }
      }
    } catch (error) {
      // No templates in memory yet
    }
  }
  
  /**
   * Persist template to shared memory
   */
  async persistTemplate(name, content, metadata) {
    await this.sharedMemory.set(
      `template:${name}`,
      { content, metadata },
      {
        namespace: this.sharedMemory.namespaces.SHARED_STATE,
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      }
    );
    
    // Update template index
    const currentTemplates = Array.from(this.templateCache.entries());
    await this.sharedMemory.set(
      'template-engine:templates',
      currentTemplates,
      {
        namespace: this.sharedMemory.namespaces.SHARED_STATE,
        dataType: this.sharedMemory.dataTypes.PERSISTENT
      }
    );
  }
  
  /**
   * Setup template validation
   */
  setupValidation() {
    // Template validation will be implemented based on syntax
  }
}

/**
 * Handlebars-like compiler
 */
class HandlebarsCompiler {
  constructor(config) {
    this.config = config;
  }
  
  async compile(content, options = {}) {
    return {
      render: async (context) => {
        return this.processTemplate(content, context);
      }
    };
  }
  
  processTemplate(content, context) {
    let result = content;
    
    // Process variables {{variable}}
    result = result.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, variable) => {
      const value = this.resolveVariable(variable.trim(), context);
      return value !== undefined ? String(value) : '';
    });
    
    // Process blocks {{#if}} {{/if}}
    result = this.processBlocks(result, context);
    
    return result;
  }
  
  resolveVariable(path, context) {
    const parts = path.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  processBlocks(content, context) {
    // Simple block processing - in production, use a proper parser
    return content.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, body) => {
      const conditionValue = this.resolveVariable(condition.trim(), context);
      return conditionValue ? body : '';
    });
  }
}

/**
 * Mustache-like compiler
 */
class MustacheCompiler extends HandlebarsCompiler {
  constructor(config) {
    super(config);
  }
}

/**
 * Custom syntax compiler
 */
class CustomCompiler {
  constructor(config) {
    this.config = config;
  }
  
  async compile(content, options = {}) {
    return {
      render: async (context) => {
        return this.processTemplate(content, context);
      }
    };
  }
  
  processTemplate(content, context) {
    let result = content;
    
    // Process variables ${variable}
    result = result.replace(/\$\{([^}]+)\}/g, (match, variable) => {
      const value = this.resolveVariable(variable.trim(), context);
      return value !== undefined ? String(value) : '';
    });
    
    return result;
  }
  
  resolveVariable(path, context) {
    const parts = path.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
}

/**
 * Template validators
 */
class HandlebarsValidator {
  async validate(content) {
    const errors = [];
    
    // Check for balanced braces
    const openBraces = (content.match(/\{\{/g) || []).length;
    const closeBraces = (content.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced template braces');
    }
    
    // Check for unclosed blocks
    const blockOpens = (content.match(/\{\{#[^}]+\}\}/g) || []).length;
    const blockCloses = (content.match(/\{\{\/[^}]+\}\}/g) || []).length;
    
    if (blockOpens !== blockCloses) {
      errors.push('Unbalanced template blocks');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

class MustacheValidator extends HandlebarsValidator {}

class CustomValidator {
  async validate(content) {
    const errors = [];
    
    // Check for balanced custom syntax
    const openBraces = (content.match(/\$\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced template braces');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = EnhancedTemplateEngine;