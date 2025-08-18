/**
 * Dynamic Agent Registry - Unlimited Agent Type Support
 * 
 * This module replaces the hard-coded agent type registry with a dynamic system
 * that automatically discovers and registers all specialized agents from the
 * /.claude/agents/ directory, supporting unlimited agent scaling.
 * 
 * Features:
 * - Auto-discovery of agent templates
 * - Dynamic agent type registration
 * - Hot-reloading of agent configurations
 * - Capability matching and optimization
 * - Template validation and caching
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DynamicAgentRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      agentsDirectory: options.agentsDirectory || path.join(process.cwd(), '.claude/agents'),
      fallbackDirectory: options.fallbackDirectory || path.join(process.cwd(), 'sub-agent-documentation/agents'),
      watchForChanges: options.watchForChanges !== false,
      cacheEnabled: options.cacheEnabled !== false,
      validationEnabled: options.validationEnabled !== false,
      templateExtensions: options.templateExtensions || ['.md', '.txt'],
      contextWindowDefault: options.contextWindowDefault || 200000,
      ...options
    };
    
    // Registry state
    this.agentTypes = new Map();
    this.templateCache = new Map();
    this.capabilityIndex = new Map();
    this.templateHashes = new Map();
    
    // Discovery state
    this.isInitialized = false;
    this.lastDiscovery = 0;
    this.discoveryInProgress = false;
    
    // File watchers
    this.watchers = new Map();
    
    // Statistics
    this.stats = {
      totalAgentsDiscovered: 0,
      validAgents: 0,
      invalidAgents: 0,
      lastUpdateTime: 0,
      discoveryTime: 0
    };
  }
  
  /**
   * Initialize the dynamic agent registry
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('Dynamic Agent Registry already initialized');
      return;
    }
    
    console.log('Initializing Dynamic Agent Registry for unlimited agent scaling...');
    const startTime = Date.now();
    
    try {
      // Discover and register all agents
      await this.discoverAgents();
      
      // Setup file watching if enabled
      if (this.config.watchForChanges) {
        await this.setupFileWatching();
      }
      
      this.isInitialized = true;
      this.stats.discoveryTime = Date.now() - startTime;
      
      this.emit('registry-initialized', {
        agentCount: this.agentTypes.size,
        discoveryTime: this.stats.discoveryTime,
        stats: this.getStats()
      });
      
      console.log(`Dynamic Agent Registry initialized: ${this.agentTypes.size} agents discovered in ${this.stats.discoveryTime}ms`);
      
    } catch (error) {
      console.error('Failed to initialize Dynamic Agent Registry:', error);
      this.emit('initialization-error', error);
      throw error;
    }
  }
  
  /**
   * Discover all agent templates in the configured directories
   */
  async discoverAgents() {
    if (this.discoveryInProgress) {
      console.log('Agent discovery already in progress');
      return;
    }
    
    this.discoveryInProgress = true;
    const startTime = Date.now();
    
    try {
      console.log(`Discovering agents in: ${this.config.agentsDirectory}`);
      
      // Clear existing registry for fresh discovery
      this.agentTypes.clear();
      this.capabilityIndex.clear();
      this.stats.totalAgentsDiscovered = 0;
      this.stats.validAgents = 0;
      this.stats.invalidAgents = 0;
      
      // Discover from primary directory
      await this.discoverInDirectory(this.config.agentsDirectory);
      
      // Discover from fallback directory if primary has limited agents
      if (this.agentTypes.size < 10) {
        console.log(`Only ${this.agentTypes.size} agents found, checking fallback directory...`);
        await this.discoverInDirectory(this.config.fallbackDirectory);
      }
      
      // Build capability index
      this.buildCapabilityIndex();
      
      this.lastDiscovery = Date.now();
      this.stats.lastUpdateTime = this.lastDiscovery;
      
      this.emit('discovery-completed', {
        totalAgents: this.agentTypes.size,
        validAgents: this.stats.validAgents,
        invalidAgents: this.stats.invalidAgents,
        discoveryTime: Date.now() - startTime
      });
      
    } catch (error) {
      console.error('Agent discovery failed:', error);
      this.emit('discovery-error', error);
      throw error;
    } finally {
      this.discoveryInProgress = false;
    }
  }
  
  /**
   * Discover agents in a specific directory
   */
  async discoverInDirectory(directory) {
    try {
      await fs.access(directory);
      const files = await fs.readdir(directory);
      
      const agentFiles = files.filter(file => 
        this.config.templateExtensions.some(ext => file.toLowerCase().endsWith(ext))
      );
      
      console.log(`Found ${agentFiles.length} potential agent files in ${directory}`);
      
      // Process files in parallel batches
      const batchSize = 10;
      for (let i = 0; i < agentFiles.length; i += batchSize) {
        const batch = agentFiles.slice(i, i + batchSize);
        const promises = batch.map(file => 
          this.processAgentFile(path.join(directory, file), file)
        );
        
        await Promise.allSettled(promises);
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`Agent directory not found: ${directory}`);
      } else {
        console.error(`Error accessing directory ${directory}:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Process a single agent template file
   */
  async processAgentFile(filePath, fileName) {
    try {
      this.stats.totalAgentsDiscovered++;
      
      // Read and parse agent template
      const content = await fs.readFile(filePath, 'utf-8');
      const agentConfig = await this.parseAgentTemplate(content, fileName);
      
      if (agentConfig) {
        // Generate agent type ID
        const agentType = this.generateAgentTypeId(fileName, agentConfig);
        
        // Validate agent configuration
        if (this.config.validationEnabled) {
          const validation = this.validateAgentConfig(agentConfig);
          if (!validation.valid) {
            console.warn(`Invalid agent config ${fileName}: ${validation.errors.join(', ')}`);
            this.stats.invalidAgents++;
            return;
          }
        }
        
        // Calculate content hash for change detection
        const contentHash = crypto.createHash('md5').update(content).digest('hex');
        this.templateHashes.set(agentType, contentHash);
        
        // Register agent type
        this.agentTypes.set(agentType, {
          ...agentConfig,
          fileName,
          filePath,
          registeredAt: Date.now(),
          contentHash
        });
        
        // Cache template content if enabled
        if (this.config.cacheEnabled) {
          this.templateCache.set(agentType, content);
        }
        
        this.stats.validAgents++;
        
        console.log(`Registered agent: ${agentType} (${agentConfig.capabilities?.join(', ') || 'no capabilities'})`);
        
        this.emit('agent-registered', {
          agentType,
          config: agentConfig,
          fileName
        });
        
      } else {
        this.stats.invalidAgents++;
      }
      
    } catch (error) {
      console.error(`Failed to process agent file ${fileName}:`, error);
      this.stats.invalidAgents++;
      this.emit('agent-processing-error', {
        fileName,
        error: error.message
      });
    }
  }
  
  /**
   * Parse agent template and extract configuration
   */
  async parseAgentTemplate(content, fileName) {
    try {
      const config = {
        template: fileName,
        capabilities: [],
        contextWindow: this.config.contextWindowDefault,
        description: '',
        priority: 'normal',
        category: 'general',
        requirements: [],
        examples: []
      };
      
      // Extract title/name
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        config.name = titleMatch[1].trim();
      }
      
      // Extract description
      const descMatch = content.match(/## (?:Description|Overview|Summary)\s*\n([\s\S]*?)(?=\n##|\n#|\n---|\n```|$)/i);
      if (descMatch) {
        config.description = descMatch[1].trim().substring(0, 200);
      }
      
      // Extract capabilities
      const capabilitiesMatch = content.match(/## (?:Capabilities|Core Responsibilities|Skills)\s*\n([\s\S]*?)(?=\n##|\n#|\n---|\n```|$)/i);
      if (capabilitiesMatch) {
        const capText = capabilitiesMatch[1];
        config.capabilities = this.extractCapabilities(capText);
      }
      
      // Extract context window specification
      const contextMatch = content.match(/context_window:\s*(\d+)/i) || 
                          content.match(/(\d+,?\d*)\s*(?:token|context)/i);
      if (contextMatch) {
        const contextSize = parseInt(contextMatch[1].replace(/,/g, ''));
        if (contextSize > 0) {
          config.contextWindow = contextSize;
        }
      }
      
      // Extract category/type
      const categoryMatch = content.match(/## (?:Category|Type|Role)\s*\n([^\n]+)/i) ||
                           content.match(/You are a[n]?\s+(.+?)\s+Agent/i);
      if (categoryMatch) {
        config.category = categoryMatch[1].trim().toLowerCase();
      }
      
      // Extract priority
      const priorityMatch = content.match(/priority:\s*(high|medium|low|normal)/i);
      if (priorityMatch) {
        config.priority = priorityMatch[1].toLowerCase();
      }
      
      // Extract requirements
      const reqMatch = content.match(/## (?:Requirements|Dependencies|Prerequisites)\s*\n([\s\S]*?)(?=\n##|\n#|\n---|\n```|$)/i);
      if (reqMatch) {
        config.requirements = this.extractListItems(reqMatch[1]);
      }
      
      // Extract examples
      const exampleMatch = content.match(/## (?:Examples|Usage|Use Cases)\s*\n([\s\S]*?)(?=\n##|\n#|\n---|\n```|$)/i);
      if (exampleMatch) {
        config.examples = this.extractListItems(exampleMatch[1]);
      }
      
      // Infer capabilities from filename and content if none found
      if (config.capabilities.length === 0) {
        config.capabilities = this.inferCapabilities(fileName, content);
      }
      
      return config;
      
    } catch (error) {
      console.error(`Failed to parse agent template ${fileName}:`, error);
      return null;
    }
  }
  
  /**
   * Extract capabilities from text content
   */
  extractCapabilities(text) {
    const capabilities = new Set();
    
    // Common capability patterns
    const patterns = [
      /(?:analysis|analyze|analyzing)/gi,
      /(?:testing|test|validation|validate)/gi,
      /(?:documentation|docs|document)/gi,
      /(?:api|endpoint|service)/gi,
      /(?:database|db|schema|sql)/gi,
      /(?:security|audit|vulnerability)/gi,
      /(?:performance|optimization|optimize)/gi,
      /(?:deployment|deploy|ci-cd|devops)/gi,
      /(?:frontend|ui|interface)/gi,
      /(?:backend|server|infrastructure)/gi,
      /(?:recovery|fix|repair|troubleshoot)/gi,
      /(?:monitoring|metrics|logging)/gi,
      /(?:coordination|orchestration|management)/gi,
      /(?:integration|workflow|automation)/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        const capability = matches[0].toLowerCase();
        capabilities.add(capability);
      }
    });
    
    // Extract from bullet points
    const bulletPoints = text.match(/[-*]\s+([^\n]+)/g);
    if (bulletPoints) {
      bulletPoints.forEach(point => {
        const cleanPoint = point.replace(/[-*]\s+/, '').toLowerCase();
        if (cleanPoint.length > 3 && cleanPoint.length < 30) {
          capabilities.add(cleanPoint);
        }
      });
    }
    
    return Array.from(capabilities).slice(0, 10); // Limit to 10 capabilities
  }
  
  /**
   * Infer capabilities from filename and content
   */
  inferCapabilities(fileName, content) {
    const capabilities = [];
    const name = fileName.toLowerCase();
    
    // Filename-based inference
    const filenameCapabilities = {
      'analyzer': ['analysis', 'pattern-detection'],
      'test': ['testing', 'validation'],
      'doc': ['documentation', 'markdown'],
      'api': ['api', 'endpoints'],
      'database': ['database', 'schema'],
      'security': ['security', 'audit'],
      'performance': ['performance', 'optimization'],
      'deployment': ['deployment', 'ci-cd'],
      'frontend': ['frontend', 'ui'],
      'recovery': ['recovery', 'fixes'],
      'monitor': ['monitoring', 'metrics'],
      'orchestr': ['orchestration', 'coordination'],
      'integration': ['integration', 'workflow']
    };
    
    Object.entries(filenameCapabilities).forEach(([keyword, caps]) => {
      if (name.includes(keyword)) {
        capabilities.push(...caps);
      }
    });
    
    // Content-based inference
    const contentLower = content.toLowerCase();
    if (contentLower.includes('typescript') || contentLower.includes('javascript')) {
      capabilities.push('javascript', 'typescript');
    }
    if (contentLower.includes('react') || contentLower.includes('vue') || contentLower.includes('angular')) {
      capabilities.push('frontend', 'spa');
    }
    if (contentLower.includes('node') || contentLower.includes('express')) {
      capabilities.push('backend', 'nodejs');
    }
    
    return [...new Set(capabilities)]; // Remove duplicates
  }
  
  /**
   * Extract list items from markdown text
   */
  extractListItems(text) {
    const items = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        const item = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (item.length > 0) {
          items.push(item);
        }
      }
    });
    
    return items;
  }
  
  /**
   * Generate agent type ID from filename and config
   */
  generateAgentTypeId(fileName, config) {
    // Remove file extension and sanitize
    let baseName = fileName.replace(/\.[^/.]+$/, '');
    
    // Remove numeric prefixes (e.g., "1-" from "1-agent-name.md")
    baseName = baseName.replace(/^\d+-/, '');
    
    // Convert to kebab-case
    let agentType = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Ensure uniqueness
    let counter = 1;
    const originalType = agentType;
    while (this.agentTypes.has(agentType)) {
      agentType = `${originalType}-${counter}`;
      counter++;
    }
    
    return agentType;
  }
  
  /**
   * Validate agent configuration
   */
  validateAgentConfig(config) {
    const errors = [];
    
    if (!config.template) {
      errors.push('Missing template filename');
    }
    
    if (!config.capabilities || config.capabilities.length === 0) {
      errors.push('No capabilities defined');
    }
    
    if (!config.contextWindow || config.contextWindow < 1000) {
      errors.push('Invalid context window size');
    }
    
    if (config.contextWindow > 1000000) {
      errors.push('Context window too large (max 1M tokens)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Build capability index for fast searching
   */
  buildCapabilityIndex() {
    this.capabilityIndex.clear();
    
    for (const [agentType, config] of this.agentTypes) {
      config.capabilities.forEach(capability => {
        if (!this.capabilityIndex.has(capability)) {
          this.capabilityIndex.set(capability, []);
        }
        this.capabilityIndex.get(capability).push(agentType);
      });
    }
    
    console.log(`Built capability index with ${this.capabilityIndex.size} unique capabilities`);
  }
  
  /**
   * Setup file watching for hot-reloading
   */
  async setupFileWatching() {
    if (!this.config.watchForChanges) return;
    
    try {
      const chokidar = require('chokidar');
      
      const watcher = chokidar.watch(this.config.agentsDirectory, {
        ignored: /[\/\\]\./,
        persistent: true,
        ignoreInitial: true
      });
      
      watcher.on('add', (filePath) => this.handleFileChange('add', filePath));
      watcher.on('change', (filePath) => this.handleFileChange('change', filePath));
      watcher.on('unlink', (filePath) => this.handleFileChange('delete', filePath));
      
      this.watchers.set('primary', watcher);
      console.log('File watching enabled for agent templates');
      
    } catch (error) {
      console.warn('Failed to setup file watching (chokidar not available):', error.message);
    }
  }
  
  /**
   * Handle file system changes
   */
  async handleFileChange(event, filePath) {
    try {
      const fileName = path.basename(filePath);
      
      if (!this.config.templateExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
        return; // Not an agent template file
      }
      
      console.log(`Agent template ${event}: ${fileName}`);
      
      if (event === 'delete') {
        // Remove agent type
        const agentType = this.findAgentTypeByPath(filePath);
        if (agentType) {
          this.agentTypes.delete(agentType);
          this.templateCache.delete(agentType);
          this.templateHashes.delete(agentType);
          this.buildCapabilityIndex();
          
          this.emit('agent-unregistered', { agentType, fileName });
        }
      } else {
        // Add or update agent type
        await this.processAgentFile(filePath, fileName);
        this.buildCapabilityIndex();
      }
      
    } catch (error) {
      console.error(`Failed to handle file change for ${filePath}:`, error);
    }
  }
  
  /**
   * Find agent type by file path
   */
  findAgentTypeByPath(filePath) {
    for (const [agentType, config] of this.agentTypes) {
      if (config.filePath === filePath) {
        return agentType;
      }
    }
    return null;
  }
  
  /**
   * Get all registered agent types
   */
  getAgentTypes() {
    return new Map(this.agentTypes);
  }
  
  /**
   * Get agent configuration by type
   */
  getAgentConfig(agentType) {
    return this.agentTypes.get(agentType);
  }
  
  /**
   * Get agent template content
   */
  async getAgentTemplate(agentType) {
    if (this.config.cacheEnabled && this.templateCache.has(agentType)) {
      return this.templateCache.get(agentType);
    }
    
    const config = this.agentTypes.get(agentType);
    if (!config) {
      throw new Error(`Agent type not found: ${agentType}`);
    }
    
    try {
      const content = await fs.readFile(config.filePath, 'utf-8');
      
      if (this.config.cacheEnabled) {
        this.templateCache.set(agentType, content);
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to load template for ${agentType}: ${error.message}`);
    }
  }
  
  /**
   * Find agent types by capabilities
   */
  findAgentsByCapability(capabilities) {
    const results = new Set();
    
    capabilities.forEach(capability => {
      const agents = this.capabilityIndex.get(capability) || [];
      agents.forEach(agent => results.add(agent));
    });
    
    return Array.from(results);
  }
  
  /**
   * Search agent types by query
   */
  searchAgents(query) {
    const queryLower = query.toLowerCase();
    const results = [];
    
    for (const [agentType, config] of this.agentTypes) {
      let score = 0;
      
      // Name match
      if (agentType.includes(queryLower)) {
        score += 10;
      }
      
      // Capability match
      const capabilityMatches = config.capabilities.filter(cap => 
        cap.toLowerCase().includes(queryLower)
      );
      score += capabilityMatches.length * 5;
      
      // Description match
      if (config.description && config.description.toLowerCase().includes(queryLower)) {
        score += 3;
      }
      
      // Category match
      if (config.category && config.category.includes(queryLower)) {
        score += 2;
      }
      
      if (score > 0) {
        results.push({
          agentType,
          config,
          score,
          matches: {
            capabilities: capabilityMatches
          }
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get registry statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalAgentTypes: this.agentTypes.size,
      uniqueCapabilities: this.capabilityIndex.size,
      isInitialized: this.isInitialized,
      cachingEnabled: this.config.cacheEnabled,
      watchingEnabled: this.config.watchForChanges
    };
  }
  
  /**
   * Refresh registry (rediscover all agents)
   */
  async refresh() {
    console.log('Refreshing Dynamic Agent Registry...');
    await this.discoverAgents();
    return this.getStats();
  }
  
  /**
   * Shutdown the registry
   */
  async shutdown() {
    // Stop file watchers
    for (const [name, watcher] of this.watchers) {
      if (watcher && typeof watcher.close === 'function') {
        await watcher.close();
      }
    }
    this.watchers.clear();
    
    // Clear caches
    this.templateCache.clear();
    this.templateHashes.clear();
    
    this.isInitialized = false;
    this.emit('registry-shutdown');
    console.log('Dynamic Agent Registry shutdown completed');
  }
}

module.exports = DynamicAgentRegistry;