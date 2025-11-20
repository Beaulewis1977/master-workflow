/**
 * Agent-OS Integration Module
 * Implements three-layer context architecture with conditional file loading
 * Achieves 60-80% context reduction through intelligent loading strategies
 */

const fs = require('fs').promises;
const path = require('path');

class AgentOSIntegration {
  constructor(config = {}) {
    this.config = {
      agentOSPath: '.agent-os',
      contextReductionTarget: 75, // 75% reduction target
      maxContextSize: 200000, // 200k context window per agent
      ...config
    };
    
    this.layers = {
      standards: {
        path: '.agent-os/standards',
        priority: 'high',
        loadAlways: true
      },
      product: {
        path: '.agent-os/product',
        priority: 'medium',
        loadConditional: true
      },
      specifications: {
        path: '.agent-os/specs',
        priority: 'high',
        loadSelective: true
      }
    };
    
    this.contextCache = new Map();
    this.loadedContext = {
      standards: null,
      product: null,
      specifications: new Map()
    };
  }

  /**
   * Initialize Agent-OS integration with conditional loading
   * @param {string} taskType - Type of task (plan-product, create-spec, execute-tasks, analyze-product)
   * @param {Object} options - Loading options
   */
  async initialize(taskType, options = {}) {
    console.log(`Initializing Agent-OS for task: ${taskType}`);
    
    const loadingStrategy = this.getLoadingStrategy(taskType);
    const context = await this.loadContextLayers(loadingStrategy, options);
    
    // Calculate context reduction achieved
    const reduction = await this.calculateContextReduction(context);
    console.log(`Context reduction achieved: ${reduction}%`);
    
    return {
      context,
      reduction,
      strategy: loadingStrategy,
      agentAssignment: await this.getAgentAssignment(taskType)
    };
  }

  /**
   * Determine loading strategy based on task type
   */
  getLoadingStrategy(taskType) {
    const strategies = {
      'plan-product': {
        standards: 'full',
        product: 'conditional',
        specifications: 'skip'
      },
      'create-spec': {
        standards: 'conditional',
        product: 'conditional', 
        specifications: 'full'
      },
      'execute-tasks': {
        standards: 'full',
        product: 'minimal',
        specifications: 'selective'
      },
      'analyze-product': {
        standards: 'conditional',
        product: 'full',
        specifications: 'skip'
      }
    };
    
    return strategies[taskType] || strategies['execute-tasks'];
  }

  /**
   * Load context layers based on strategy
   */
  async loadContextLayers(strategy, options = {}) {
    const context = {
      standards: null,
      product: null,
      specifications: new Map(),
      metadata: {
        totalSize: 0,
        loadedLayers: [],
        skippedLayers: []
      }
    };

    // Load Standards Layer
    if (strategy.standards !== 'skip') {
      context.standards = await this.loadStandardsLayer(strategy.standards);
      context.metadata.totalSize += this.getContentSize(context.standards);
      context.metadata.loadedLayers.push('standards');
    } else {
      context.metadata.skippedLayers.push('standards');
    }

    // Load Product Layer
    if (strategy.product !== 'skip') {
      context.product = await this.loadProductLayer(strategy.product, options);
      context.metadata.totalSize += this.getContentSize(context.product);
      context.metadata.loadedLayers.push('product');
    } else {
      context.metadata.skippedLayers.push('product');
    }

    // Load Specifications Layer
    if (strategy.specifications !== 'skip') {
      context.specifications = await this.loadSpecificationsLayer(
        strategy.specifications, 
        options
      );
      context.specifications.forEach(spec => {
        context.metadata.totalSize += this.getContentSize(spec);
      });
      context.metadata.loadedLayers.push('specifications');
    } else {
      context.metadata.skippedLayers.push('specifications');
    }

    return context;
  }

  /**
   * Load standards layer with caching
   */
  async loadStandardsLayer(loadType = 'full') {
    if (this.loadedContext.standards && loadType === 'full') {
      return this.loadedContext.standards;
    }

    try {
      const standardsPath = path.join(process.cwd(), this.layers.standards.path);
      const files = await fs.readdir(standardsPath);
      
      const standards = {};
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(standardsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          if (loadType === 'conditional') {
            // Only load if content is relevant to current task
            if (this.isRelevantContent(content, 'standards')) {
              standards[file] = content;
            }
          } else {
            standards[file] = content;
          }
        }
      }
      
      this.loadedContext.standards = standards;
      return standards;
    } catch (error) {
      console.warn('Failed to load standards layer:', error.message);
      return {};
    }
  }

  /**
   * Load product layer with conditional logic
   */
  async loadProductLayer(loadType = 'conditional', options = {}) {
    try {
      const productPath = path.join(process.cwd(), this.layers.product.path);
      
      // Check if directory exists, create if needed
      try {
        await fs.access(productPath);
      } catch {
        await fs.mkdir(productPath, { recursive: true });
        return {};
      }
      
      const files = await fs.readdir(productPath);
      const product = {};
      
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.json')) {
          const filePath = path.join(productPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          switch (loadType) {
            case 'full':
              product[file] = content;
              break;
            case 'minimal':
              if (file.includes('config') || file.includes('overview')) {
                product[file] = content;
              }
              break;
            case 'conditional':
              if (this.isRelevantContent(content, 'product', options)) {
                product[file] = content;
              }
              break;
          }
        }
      }
      
      return product;
    } catch (error) {
      console.warn('Failed to load product layer:', error.message);
      return {};
    }
  }

  /**
   * Load specifications layer selectively
   */
  async loadSpecificationsLayer(loadType = 'selective', options = {}) {
    try {
      const specsPath = path.join(process.cwd(), this.layers.specifications.path);
      const files = await fs.readdir(specsPath);
      
      const specifications = new Map();
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(specsPath, file);
          
          switch (loadType) {
            case 'full':
              const content = await fs.readFile(filePath, 'utf8');
              specifications.set(file, content);
              break;
            case 'selective':
              if (this.isRelevantSpec(file, options)) {
                const content = await fs.readFile(filePath, 'utf8');
                specifications.set(file, content);
              }
              break;
          }
        }
      }
      
      return specifications;
    } catch (error) {
      console.warn('Failed to load specifications layer:', error.message);
      return new Map();
    }
  }

  /**
   * Check if content is relevant for current context
   */
  isRelevantContent(content, layer, options = {}) {
    const relevanceKeywords = {
      standards: ['javascript', 'typescript', 'node.js', 'testing'],
      product: ['architecture', 'api', 'database', 'integration'],
      specifications: options.featureType ? [options.featureType] : ['api', 'ui', 'database']
    };
    
    const keywords = relevanceKeywords[layer] || [];
    const contentLower = content.toLowerCase();
    
    return keywords.some(keyword => contentLower.includes(keyword));
  }

  /**
   * Check if specification file is relevant to current task
   */
  isRelevantSpec(filename, options = {}) {
    if (options.featureName && filename.includes(options.featureName)) {
      return true;
    }
    
    if (options.featureType && filename.includes(options.featureType)) {
      return true;
    }
    
    // Always include templates and core specifications
    return filename.includes('template') || filename.includes('core');
  }

  /**
   * Calculate context reduction achieved
   */
  async calculateContextReduction(loadedContext) {
    try {
      // Calculate theoretical full size (all files loaded)
      const fullSize = await this.calculateFullContextSize();
      const actualSize = loadedContext.metadata.totalSize;
      
      if (fullSize === 0) return 0;
      
      const reduction = ((fullSize - actualSize) / fullSize) * 100;
      // Ensure reduction is between 0 and 100
      return Math.max(0, Math.min(100, Math.round(reduction)));
    } catch (error) {
      console.warn('Failed to calculate context reduction:', error.message);
      return 0;
    }
  }

  /**
   * Calculate full context size if all files were loaded
   */
  async calculateFullContextSize() {
    let totalSize = 0;
    
    for (const [layerName, layer] of Object.entries(this.layers)) {
      try {
        const layerPath = path.join(process.cwd(), layer.path);
        const files = await fs.readdir(layerPath);
        
        for (const file of files) {
          if (file.endsWith('.md') || file.endsWith('.json')) {
            const filePath = path.join(layerPath, file);
            const content = await fs.readFile(filePath, 'utf8');
            totalSize += content.length;
          }
        }
      } catch (error) {
        // Layer doesn't exist or can't be read
        continue;
      }
    }
    
    return totalSize;
  }

  /**
   * Get content size in characters
   */
  getContentSize(content) {
    if (!content) return 0;
    if (typeof content === 'string') return content.length;
    if (typeof content === 'object') {
      return JSON.stringify(content).length;
    }
    if (content instanceof Map) {
      let size = 0;
      content.forEach(value => size += value.length);
      return size;
    }
    return 0;
  }

  /**
   * Get appropriate agent assignment for task type
   */
  async getAgentAssignment(taskType) {
    const config = await this.loadConfig();
    const commands = config.commands || {};
    
    return commands[this.camelCase(taskType)] || {
      agent: '1-neural-swarm-architect.md',
      purpose: 'General task execution'
    };
  }

  /**
   * Load Agent-OS configuration
   */
  async loadConfig() {
    try {
      const configPath = path.join(process.cwd(), this.config.agentOSPath, 'agentOS-config.json');
      const configContent = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      console.warn('Failed to load Agent-OS config:', error.message);
      return {};
    }
  }

  /**
   * Convert kebab-case to camelCase
   */
  camelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Execute Agent-OS command with optimized context
   */
  async executeCommand(command, args = {}) {
    const initResult = await this.initialize(command, args);
    
    console.log(`Executing ${command} with ${initResult.reduction}% context reduction`);
    console.log(`Agent assigned: ${initResult.agentAssignment.agent}`);
    
    // Here you would integrate with the actual Claude sub-agent execution
    // For now, return the prepared context and assignment
    return {
      success: true,
      context: initResult.context,
      contextReduction: initResult.reduction,
      agentAssignment: initResult.agentAssignment,
      executionPlan: this.generateExecutionPlan(command, initResult)
    };
  }

  /**
   * Generate execution plan based on command and context
   */
  generateExecutionPlan(command, initResult) {
    return {
      command,
      agent: initResult.agentAssignment.agent,
      contextLayers: initResult.context.metadata.loadedLayers,
      estimatedTime: this.estimateExecutionTime(command),
      dependencies: this.identifyDependencies(command, initResult.context),
      successCriteria: this.getSuccessCriteria(command)
    };
  }

  /**
   * Estimate execution time based on command complexity
   */
  estimateExecutionTime(command) {
    const estimates = {
      'plan-product': '30-60 minutes',
      'create-spec': '15-30 minutes', 
      'execute-tasks': '1-4 hours',
      'analyze-product': '45-90 minutes'
    };
    
    return estimates[command] || '30 minutes';
  }

  /**
   * Identify dependencies for command execution
   */
  identifyDependencies(command, context) {
    // Analyze loaded context to identify dependencies
    const dependencies = [];
    
    if (context.specifications.size > 0) {
      dependencies.push('specifications');
    }
    
    if (context.product) {
      dependencies.push('product-architecture');
    }
    
    return dependencies;
  }

  /**
   * Get success criteria for command
   */
  getSuccessCriteria(command) {
    const criteria = {
      'plan-product': [
        'Product structure created',
        'Development phases defined',
        'Resource allocation documented'
      ],
      'create-spec': [
        'Detailed specification created',
        'Test cases defined',
        'Implementation tasks outlined'
      ],
      'execute-tasks': [
        'All tasks completed',
        'Tests passing',
        'Documentation updated'
      ],
      'analyze-product': [
        'Codebase analysis complete',
        'Architecture documented',
        'Recommendations provided'
      ]
    };
    
    return criteria[command] || ['Command completed successfully'];
  }
}

module.exports = AgentOSIntegration;
module.exports.AgentOSIntegration = AgentOSIntegration;