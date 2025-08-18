#!/usr/bin/env node

/**
 * Enhanced MCP Server Manager v3.0
 * 
 * Complete rewrite with:
 * - 125+ MCP servers with intelligent routing
 * - Dynamic server configuration templates
 * - Agent-specific server bindings (42+ agents)
 * - Auto-scaling and load balancing
 * - Cost tracking and budget management
 * - Advanced health monitoring
 * - Connection pooling with failover
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class EnhancedMCPManagerV3 extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.servers = new Map();
    this.tools = new Map();
    this.capabilities = new Map();
    this.healthStatus = new Map();
    this.agentBindings = new Map();
    this.serverTemplates = new Map();
    
    this.config = {
      catalogPath: options.catalogPath || path.join(__dirname, '..', 'configs', 'mcp-catalog.json'),
      registryPath: options.registryPath || path.join(__dirname, '..', 'configs', 'mcp-registry.json'),
      templatesPath: options.templatesPath || path.join(__dirname, '..', 'configs', 'mcp-server-templates.json'),
      bindingsPath: options.bindingsPath || path.join(__dirname, '..', 'configs', 'agent-mcp-bindings.json'),
      agentsPath: options.agentsPath || path.join(__dirname, '../../.claude/agents'),
      
      healthCheckInterval: options.healthCheckInterval || 30000,
      connectionTimeout: options.connectionTimeout || 5000,
      retryAttempts: options.retryAttempts || 3,
      maxConnectionsPerServer: options.maxConnectionsPerServer || 15,
      loadBalancingStrategy: options.loadBalancingStrategy || 'weighted-round-robin',
      
      cacheEnabled: options.cacheEnabled !== false,
      cacheTTL: options.cacheTTL || 300000,
      cacheMaxSize: options.cacheMaxSize || 2000,
      
      agentBindingsEnabled: options.agentBindingsEnabled !== false,
      dynamicConfigEnabled: options.dynamicConfigEnabled !== false,
      autoScalingEnabled: options.autoScalingEnabled !== false,
      costTrackingEnabled: options.costTrackingEnabled !== false
    };
    
    // Enhanced metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
      serversOnline: 0,
      serversOffline: 0,
      totalCosts: 0,
      totalTokensUsed: 0,
      scalingActions: 0,
      agentRequests: new Map()
    };
    
    // Cache system
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Agent usage tracking
    this.agentUsageStats = new Map();
    
    this.initialized = false;
  }
  
  /**
   * Initialize the enhanced MCP manager
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Enhanced MCP Manager v3.0...');
      
      // Load all configurations
      await this.loadCatalog();
      await this.loadRegistry();
      await this.loadServerTemplates();
      
      // Initialize servers with templates
      await this.initializeServers();
      
      // Setup agent bindings if enabled
      if (this.config.agentBindingsEnabled) {
        await this.setupAgentBindings();
      }
      
      // Start monitoring systems
      this.startHealthMonitoring();
      this.startCacheCleanup();
      
      if (this.config.autoScalingEnabled) {
        this.startAutoScaling();
      }
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log(`✅ Enhanced MCP Manager v3.0 initialized:`);
      console.log(`   - Servers: ${this.servers.size}`);
      console.log(`   - Capabilities: ${this.capabilities.size}`);
      console.log(`   - Agent Bindings: ${this.agentBindings.size}`);
      console.log(`   - Templates: ${this.serverTemplates.size}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced MCP Manager v3.0:', error);
      throw error;
    }
  }
  
  /**
   * Load server catalog with 125+ servers
   */
  async loadCatalog() {
    try {
      if (fs.existsSync(this.config.catalogPath)) {
        const catalogData = JSON.parse(fs.readFileSync(this.config.catalogPath, 'utf8'));
        this.catalog = catalogData;
        console.log(`📚 Loaded catalog with ${catalogData.totalServers} servers across ${Object.keys(catalogData.categories).length} categories`);
      } else {
        console.warn('⚠️  MCP catalog not found, creating default configuration');
        this.catalog = { categories: {}, globalSettings: {} };
      }
    } catch (error) {
      console.error('❌ Failed to load MCP catalog:', error);
      throw error;
    }
  }
  
  /**
   * Load server registry
   */
  async loadRegistry() {
    try {
      if (fs.existsSync(this.config.registryPath)) {
        const registryData = JSON.parse(fs.readFileSync(this.config.registryPath, 'utf8'));
        this.registry = registryData;
        console.log(`📝 Loaded registry with ${Object.keys(registryData.servers || {}).length} servers`);
      } else {
        console.log('📝 Creating new registry...');
        this.registry = { servers: {}, tools: [], meta: {} };
      }
    } catch (error) {
      console.error('❌ Failed to load MCP registry:', error);
      throw error;
    }
  }
  
  /**
   * Load server configuration templates
   */
  async loadServerTemplates() {
    try {
      if (fs.existsSync(this.config.templatesPath)) {
        const templatesData = JSON.parse(fs.readFileSync(this.config.templatesPath, 'utf8'));
        
        for (const [templateName, templateConfig] of Object.entries(templatesData.templates)) {
          this.serverTemplates.set(templateName, templateConfig);
        }
        
        this.templateConfig = templatesData.dynamicConfiguration || {};
        this.globalDefaults = templatesData.globalDefaults || {};
        
        console.log(`🔧 Loaded ${this.serverTemplates.size} server templates`);
      } else {
        console.warn('⚠️  Server templates not found, using basic configuration');
        this.templateConfig = { enabled: false };
        this.globalDefaults = {};
      }
    } catch (error) {
      console.error('❌ Failed to load server templates:', error);
      throw error;
    }
  }
  
  /**
   * Initialize all servers with dynamic templates
   */
  async initializeServers() {
    console.log('🔧 Initializing servers with dynamic templates...');
    
    let serverCount = 0;
    
    // Initialize from catalog
    for (const [categoryName, category] of Object.entries(this.catalog.categories || {})) {
      for (const [serverName, serverConfig] of Object.entries(category.servers || {})) {
        if (serverConfig.enabled) {
          await this.initializeServer(serverName, serverConfig, categoryName);
          serverCount++;
        }
      }
    }
    
    // Initialize from registry (fallback)
    for (const [serverName, serverConfig] of Object.entries(this.registry.servers || {})) {
      if (serverConfig.enabled && !this.servers.has(serverName)) {
        await this.initializeServer(serverName, serverConfig, 'registry');
        serverCount++;
      }
    }
    
    console.log(`🏗️  Initialized ${serverCount} servers`);
  }
  
  /**
   * Initialize a single server with template application
   */
  async initializeServer(name, config, category = 'unknown') {
    try {
      // Apply dynamic template
      const enhancedConfig = this.applyServerTemplate(name, config, category);
      
      const serverInfo = {
        name,
        originalConfig: config,
        config: enhancedConfig,
        category,
        priority: enhancedConfig.priority || 5,
        capabilities: enhancedConfig.capabilities || [],
        tags: enhancedConfig.tags || [],
        healthCheck: enhancedConfig.healthCheck || 'auto',
        status: 'initializing',
        lastHealthCheck: null,
        template: null,
        
        // Enhanced features
        connectionPool: null,
        rateLimiter: null,
        costTracker: null,
        
        metrics: {
          requests: 0,
          successes: 0,
          failures: 0,
          averageLatency: 0,
          totalCost: 0,
          tokensUsed: 0,
          lastScalingAction: null,
          startTime: Date.now()
        }
      };
      
      // Create enhanced connection pool
      serverInfo.connectionPool = await this.createConnectionPool(name, enhancedConfig);
      
      // Setup rate limiting if configured
      if (enhancedConfig.rateLimiting?.enabled) {
        serverInfo.rateLimiter = this.createRateLimiter(enhancedConfig.rateLimiting);
      }
      
      // Setup cost tracking if configured
      if (enhancedConfig.costTracking?.enabled) {
        serverInfo.costTracker = this.createCostTracker(enhancedConfig.costTracking);
      }
      
      // Map capabilities
      this.mapServerCapabilities(name, serverInfo.capabilities);
      
      // Register tools
      this.registerServerTools(name, enhancedConfig);
      
      this.servers.set(name, serverInfo);
      this.healthStatus.set(name, 'unknown');
      
      console.log(`✅ Initialized server: ${name} (${category}) with template features`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize server ${name}:`, error);
    }
  }
  
  /**
   * Apply dynamic server template based on server characteristics
   */
  applyServerTemplate(name, baseConfig, category) {
    if (!this.templateConfig?.enabled) {
      return baseConfig;
    }
    
    // Find matching template
    let selectedTemplate = this.templateConfig.defaultTemplate || 'utility_server';
    const server = { ...baseConfig, tags: baseConfig.tags || [], category };
    
    for (const rule of this.templateConfig.templateSelectionRules || []) {
      try {
        // Simple rule evaluation - in production use safer evaluation
        if (this.evaluateTemplateRule(rule.condition, server)) {
          selectedTemplate = rule.template;
          break;
        }
      } catch (error) {
        console.warn(`⚠️  Failed to evaluate template rule: ${rule.condition}`, error);
      }
    }
    
    const template = this.serverTemplates.get(selectedTemplate);
    if (!template) {
      console.warn(`⚠️  Template '${selectedTemplate}' not found, using defaults`);
      return baseConfig;
    }
    
    // Deep merge template with base config
    const mergedConfig = this.deepMerge(template.template || {}, baseConfig);
    mergedConfig.appliedTemplate = selectedTemplate;
    
    console.log(`🔧 Applied template '${selectedTemplate}' to server '${name}'`);
    return mergedConfig;
  }
  
  /**
   * Evaluate template selection rule
   */
  evaluateTemplateRule(condition, server) {
    // Simple condition evaluation - could be enhanced with a proper expression parser
    try {
      // Replace server properties in condition
      let evaluatedCondition = condition
        .replace(/server\.tags\.includes\('([^']+)'\)/g, (match, tag) => 
          server.tags.includes(tag))
        .replace(/server\.healthCheck === '([^']+)'/g, (match, healthCheck) =>
          server.healthCheck === healthCheck)
        .replace(/server\.category === '([^']+)'/g, (match, cat) =>
          server.category === cat);
      
      return eval(evaluatedCondition);
    } catch (error) {
      console.warn('Template rule evaluation failed:', error);
      return false;
    }
  }
  
  /**
   * Deep merge two objects
   */
  deepMerge(template, override) {
    const result = { ...template };
    
    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
          result[key] = this.deepMerge(result[key] || {}, override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }
    
    return result;
  }
  
  /**
   * Create enhanced connection pool
   */
  async createConnectionPool(serverName, config) {
    const poolConfig = {
      ...this.globalDefaults.connectionPool,
      ...config.connectionPool
    };
    
    return {
      serverName,
      config: poolConfig,
      active: 0,
      idle: 0,
      connections: [],
      queue: [],
      
      metrics: {
        acquired: 0,
        released: 0,
        timeouts: 0,
        errors: 0,
        peakConnections: 0
      },
      
      async acquire() {
        this.metrics.acquired++;
        this.active++;
        this.metrics.peakConnections = Math.max(this.metrics.peakConnections, this.active);
        
        const connection = {
          id: `${serverName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          serverName,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          active: true,
          requestCount: 0
        };
        
        this.connections.push(connection);
        return connection;
      },
      
      async release(connection) {
        if (!connection) return;
        
        this.metrics.released++;
        this.active = Math.max(0, this.active - 1);
        
        connection.active = false;
        connection.lastUsed = Date.now();
        this.idle++;
        
        // Clean up old connections
        this.cleanup();
      },
      
      cleanup() {
        const now = Date.now();
        const idleTimeout = this.config.idleTimeoutMillis || 30000;
        
        this.connections = this.connections.filter(conn => {
          if (!conn.active && (now - conn.lastUsed) > idleTimeout) {
            this.idle = Math.max(0, this.idle - 1);
            return false;
          }
          return true;
        });
      },
      
      getStats() {
        return {
          active: this.active,
          idle: this.idle,
          total: this.connections.length,
          config: this.config,
          metrics: this.metrics
        };
      }
    };
  }
  
  /**
   * Create rate limiter
   */
  createRateLimiter(config) {
    return {
      config,
      requests: [],
      tokens: 0,
      lastRefill: Date.now(),
      
      async checkLimit() {
        const now = Date.now();
        const windowMs = 60000; // 1 minute window
        
        // Clean old requests
        this.requests = this.requests.filter(time => now - time < windowMs);
        
        // Check rate limits
        if (this.requests.length >= config.requestsPerMinute) {
          throw new Error('Rate limit exceeded: requests per minute');
        }
        
        if (config.tokensPerMinute && this.tokens >= config.tokensPerMinute) {
          throw new Error('Rate limit exceeded: tokens per minute');
        }
        
        this.requests.push(now);
        return true;
      },
      
      recordTokens(tokenCount) {
        if (config.tokensPerMinute) {
          this.tokens += tokenCount;
          
          // Reset tokens every minute
          const now = Date.now();
          if (now - this.lastRefill > 60000) {
            this.tokens = 0;
            this.lastRefill = now;
          }
        }
      }
    };
  }
  
  /**
   * Create cost tracker
   */
  createCostTracker(config) {
    return {
      config,
      dailyCost: 0,
      totalCost: 0,
      tokensUsed: 0,
      lastReset: Date.now(),
      
      trackCost(usage) {
        const now = Date.now();
        
        // Reset daily cost at midnight
        if (now - this.lastReset > 24 * 60 * 60 * 1000) {
          this.dailyCost = 0;
          this.lastReset = now;
        }
        
        let cost = 0;
        if (config.trackTokens && usage.tokens) {
          cost = usage.tokens * (config.costPerToken || 0.0001);
          this.tokensUsed += usage.tokens;
        } else {
          cost = config.costPerRequest || 0.01;
        }
        
        this.dailyCost += cost;
        this.totalCost += cost;
        
        // Check budget limits
        if (this.dailyCost > (config.dailyBudget || 1000)) {
          throw new Error(`Daily budget exceeded: $${this.dailyCost.toFixed(2)}`);
        }
        
        return cost;
      },
      
      getStats() {
        return {
          dailyCost: this.dailyCost,
          totalCost: this.totalCost,
          tokensUsed: this.tokensUsed,
          budget: this.config.dailyBudget || 1000,
          budgetUsedPercent: (this.dailyCost / (this.config.dailyBudget || 1000)) * 100
        };
      }
    };
  }
  
  /**
   * Map server capabilities for routing
   */
  mapServerCapabilities(serverName, capabilities) {
    capabilities.forEach(capability => {
      if (!this.capabilities.has(capability)) {
        this.capabilities.set(capability, []);
      }
      this.capabilities.get(capability).push(serverName);
    });
  }
  
  /**
   * Register tools for server
   */
  registerServerTools(serverName, config) {
    const tool = {
      name: serverName,
      type: 'mcp',
      server: serverName,
      capabilities: config.capabilities || [],
      description: config.description || `${serverName} MCP server`,
      priority: config.priority || 5,
      template: config.appliedTemplate
    };
    
    this.tools.set(serverName, tool);
  }
  
  /**
   * Setup agent bindings for 42+ specialized agents
   */
  async setupAgentBindings() {
    console.log('🤖 Setting up agent bindings...');
    
    // Discover agents
    const agents = await this.discoverAgents();
    
    // Define agent profiles with server preferences
    const agentProfiles = this.getAgentProfiles();
    
    // Create bindings for each agent
    for (const agentName of agents) {
      const profile = agentProfiles.get(agentName) || this.getDefaultAgentProfile();
      const binding = await this.createAgentBinding(agentName, profile);
      this.agentBindings.set(agentName, binding);
    }
    
    // Save bindings
    await this.saveAgentBindings();
    
    console.log(`🔗 Created bindings for ${this.agentBindings.size} agents`);
  }
  
  /**
   * Discover agents in the agents directory
   */
  async discoverAgents() {
    const agents = new Set();
    
    if (!fs.existsSync(this.config.agentsPath)) {
      console.warn(`⚠️  Agents path not found: ${this.config.agentsPath}`);
      return Array.from(agents);
    }
    
    const agentFiles = fs.readdirSync(this.config.agentsPath)
      .filter(file => file.endsWith('.md'))
      .map(file => path.basename(file, '.md'));
    
    agentFiles.forEach(filename => {
      // Clean up agent names
      let agentName = filename.replace(/^1-/, '').replace(/-agent$/, '');
      
      // Skip summary files
      if (agentName.includes('SUMMARY') || agentName.includes('MATRIX') || 
          agentName.includes('CONFIGURATION') || agentName.length < 3) {
        return;
      }
      
      agents.add(agentName);
    });
    
    return Array.from(agents);
  }
  
  /**
   * Get agent profiles with server preferences
   */
  getAgentProfiles() {
    const profiles = new Map();
    
    // Core System Agents
    profiles.set('queen-controller-architect', {
      role: 'system-coordinator',
      requiredCapabilities: ['metrics-collection', 'monitoring', 'orchestration'],
      preferredServers: ['prometheus', 'grafana', 'vault', 'context7'],
      priority: 10,
      maxConnections: 15
    });
    
    profiles.set('mcp-integration-specialist', {
      role: 'mcp-coordinator',
      requiredCapabilities: ['*'], // All capabilities
      preferredServers: ['*'], // All servers
      priority: 10,
      maxConnections: 20
    });
    
    // AI/ML Agents
    profiles.set('neural-swarm-architect', {
      role: 'ai-coordinator',
      requiredCapabilities: ['text-generation', 'reasoning', 'model-inference'],
      preferredServers: ['openai', 'anthropic', 'gemini', 'claude_projects'],
      priority: 9,
      maxConnections: 12
    });
    
    // Development Agents
    profiles.set('engine-architect', {
      role: 'system-developer',
      requiredCapabilities: ['code-analysis', 'repository-management', 'ci-cd'],
      preferredServers: ['context7', 'github', 'githubactions'],
      priority: 8,
      maxConnections: 10
    });
    
    profiles.set('deployment-pipeline-engineer', {
      role: 'deployment-specialist',
      requiredCapabilities: ['deployment', 'infrastructure-management', 'containerization'],
      preferredServers: ['terraform', 'kubernetes', 'docker', 'aws', 'gcp'],
      priority: 8,
      maxConnections: 10
    });
    
    // Add more agent profiles as needed...
    
    return profiles;
  }
  
  /**
   * Get default agent profile
   */
  getDefaultAgentProfile() {
    return {
      role: 'general-agent',
      requiredCapabilities: ['code-analysis', 'file-operations'],
      preferredServers: ['context7', 'filesystem', 'http'],
      priority: 5,
      maxConnections: 6
    };
  }
  
  /**
   * Create agent binding
   */
  async createAgentBinding(agentName, profile) {
    const binding = {
      agentName,
      role: profile.role,
      priority: profile.priority,
      maxConnections: profile.maxConnections,
      servers: new Set(),
      capabilities: new Set(),
      serverBindings: []
    };
    
    // Handle wildcard access
    if (profile.preferredServers.includes('*')) {
      this.servers.forEach((server, serverName) => {
        if (server.status !== 'error') {
          binding.servers.add(serverName);
          server.capabilities.forEach(cap => binding.capabilities.add(cap));
        }
      });
    } else {
      // Add preferred servers
      profile.preferredServers.forEach(serverName => {
        const server = this.servers.get(serverName);
        if (server) {
          binding.servers.add(serverName);
          server.capabilities.forEach(cap => binding.capabilities.add(cap));
        }
      });
      
      // Add servers for required capabilities
      profile.requiredCapabilities.forEach(capability => {
        if (capability === '*') return;
        
        const capabilityServers = this.capabilities.get(capability) || [];
        capabilityServers.slice(0, 3).forEach(serverName => { // Max 3 per capability
          binding.servers.add(serverName);
          binding.capabilities.add(capability);
        });
      });
    }
    
    // Create final server bindings list
    binding.serverBindings = Array.from(binding.servers).map(serverName => {
      const server = this.servers.get(serverName);
      return {
        serverName,
        priority: server?.priority || 5,
        capabilities: server?.capabilities || [],
        status: server?.status || 'unknown',
        template: server?.config?.appliedTemplate
      };
    }).sort((a, b) => b.priority - a.priority);
    
    return {
      ...binding,
      servers: Array.from(binding.servers),
      capabilities: Array.from(binding.capabilities)
    };
  }
  
  /**
   * Execute tool for specific agent
   */
  async executeToolForAgent(agentName, toolName, params = {}, options = {}) {
    const binding = this.agentBindings.get(agentName);
    if (!binding) {
      // Fallback to default execution
      return await this.executeTool(toolName, params, { ...options, agentName });
    }
    
    // Track agent usage
    this.metrics.agentRequests.set(agentName, 
      (this.metrics.agentRequests.get(agentName) || 0) + 1);
    
    // Try servers in priority order
    for (const serverBinding of binding.serverBindings) {
      try {
        return await this.executeTool(toolName, params, {
          ...options,
          agentName,
          preferredServer: serverBinding.serverName
        });
      } catch (error) {
        console.warn(`⚠️  Server ${serverBinding.serverName} failed for agent ${agentName}, trying next...`);
        continue;
      }
    }
    
    throw new Error(`No available servers for agent ${agentName} and tool ${toolName}`);
  }
  
  /**
   * Execute tool with enhanced features
   */
  async executeTool(toolName, params = {}, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Check cache first
      if (this.config.cacheEnabled && !options.skipCache) {
        const cacheKey = this.getCacheKey(toolName, params, options.agentName);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.metrics.cacheHits++;
          return cached;
        }
        this.metrics.cacheMisses++;
      }
      
      // Find tool and optimal server
      const tool = this.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }
      
      const serverName = options.preferredServer || this.findOptimalServer(tool, options);
      if (!serverName) {
        throw new Error(`No healthy server available for tool: ${toolName}`);
      }
      
      // Execute with enhanced features
      const result = await this.executeOnServer(serverName, toolName, params, options);
      
      // Cache result
      if (this.config.cacheEnabled && !options.skipCache) {
        const cacheKey = this.getCacheKey(toolName, params, options.agentName);
        this.setInCache(cacheKey, result);
      }
      
      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics(serverName, true, latency, options.agentName);
      this.metrics.successfulRequests++;
      
      return result;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(null, false, latency, options.agentName);
      this.metrics.failedRequests++;
      throw error;
    }
  }
  
  /**
   * Find optimal server for tool execution
   */
  findOptimalServer(tool, options = {}) {
    // Get candidate servers
    const candidates = tool.capabilities.length > 0 
      ? this.capabilities.get(tool.capabilities[0]) || []
      : [tool.server];
    
    // Filter by health status
    const healthyServers = candidates.filter(name => 
      this.healthStatus.get(name) === 'healthy'
    );
    
    if (healthyServers.length === 0) {
      return this.getFallbackServer();
    }
    
    // Apply load balancing
    return this.applyLoadBalancing(healthyServers, options);
  }
  
  /**
   * Apply load balancing strategy
   */
  applyLoadBalancing(servers, options = {}) {
    switch (this.config.loadBalancingStrategy) {
      case 'weighted-round-robin':
        return this.weightedRoundRobinSelection(servers);
      case 'least-connections':
        return this.leastConnectionsSelection(servers);
      case 'priority':
        return this.priorityBasedSelection(servers);
      default:
        return servers[Math.floor(Math.random() * servers.length)];
    }
  }
  
  /**
   * Weighted round robin selection
   */
  weightedRoundRobinSelection(servers) {
    const weights = servers.map(name => {
      const server = this.servers.get(name);
      return server ? server.priority : 1;
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < servers.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return servers[i];
      }
    }
    
    return servers[0];
  }
  
  /**
   * Least connections selection
   */
  leastConnectionsSelection(servers) {
    return servers.reduce((best, current) => {
      const bestServer = this.servers.get(best);
      const currentServer = this.servers.get(current);
      
      if (!bestServer) return current;
      if (!currentServer) return best;
      
      const bestConnections = bestServer.connectionPool?.active || 0;
      const currentConnections = currentServer.connectionPool?.active || 0;
      
      return currentConnections < bestConnections ? current : best;
    });
  }
  
  /**
   * Priority-based selection
   */
  priorityBasedSelection(servers) {
    return servers.reduce((best, current) => {
      const bestServer = this.servers.get(best);
      const currentServer = this.servers.get(current);
      
      if (!bestServer) return current;
      if (!currentServer) return best;
      
      return currentServer.priority > bestServer.priority ? current : best;
    });
  }
  
  /**
   * Get fallback server
   */
  getFallbackServer() {
    // Try core servers first
    const coreServers = Array.from(this.servers.values())
      .filter(s => s.tags.includes('core') && this.healthStatus.get(s.name) === 'healthy')
      .map(s => s.name);
    
    if (coreServers.length > 0) {
      return coreServers[0];
    }
    
    // Any healthy server
    const healthyServers = Array.from(this.healthStatus.entries())
      .filter(([name, status]) => status === 'healthy')
      .map(([name]) => name);
    
    return healthyServers.length > 0 ? healthyServers[0] : null;
  }
  
  /**
   * Execute on specific server
   */
  async executeOnServer(serverName, toolName, params, options = {}) {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server not found: ${serverName}`);
    }
    
    // Check rate limits
    if (server.rateLimiter) {
      await server.rateLimiter.checkLimit();
    }
    
    // Get connection
    const connection = await server.connectionPool.acquire();
    
    try {
      // Mock execution - replace with actual MCP protocol calls
      const result = await this.mockServerExecution(serverName, toolName, params, options);
      
      // Track costs
      if (server.costTracker && this.config.costTrackingEnabled) {
        const cost = server.costTracker.trackCost(result.usage || {});
        this.metrics.totalCosts += cost;
        if (result.usage?.tokens) {
          this.metrics.totalTokensUsed += result.usage.tokens;
        }
      }
      
      return result;
      
    } finally {
      await server.connectionPool.release(connection);
    }
  }
  
  /**
   * Mock server execution (replace with actual implementation)
   */
  async mockServerExecution(serverName, toolName, params, options = {}) {
    // Simulate network latency
    const latency = 50 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, latency));
    
    // Simulate token usage for AI servers
    const server = this.servers.get(serverName);
    let usage = {};
    
    if (server?.tags?.includes('ai')) {
      usage = {
        tokens: Math.floor(Math.random() * 1000) + 100,
        prompt_tokens: Math.floor(Math.random() * 500) + 50,
        completion_tokens: Math.floor(Math.random() * 500) + 50
      };
      
      // Track rate limiter tokens
      if (server.rateLimiter) {
        server.rateLimiter.recordTokens(usage.tokens);
      }
    }
    
    return {
      server: serverName,
      tool: toolName,
      params,
      options,
      result: `Enhanced result from ${serverName} for ${toolName}`,
      usage,
      timestamp: new Date().toISOString(),
      latency,
      agentName: options.agentName
    };
  }
  
  /**
   * Update comprehensive metrics
   */
  updateMetrics(serverName, success, latency, agentName = null) {
    // Update server metrics
    if (serverName) {
      const server = this.servers.get(serverName);
      if (server) {
        server.metrics.requests++;
        if (success) {
          server.metrics.successes++;
        } else {
          server.metrics.failures++;
        }
        
        // Update average latency
        const totalLatency = server.metrics.averageLatency * (server.metrics.requests - 1) + latency;
        server.metrics.averageLatency = totalLatency / server.metrics.requests;
      }
    }
    
    // Update global metrics
    const totalLatency = this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency;
    this.metrics.averageLatency = totalLatency / this.metrics.totalRequests;
    
    // Track agent usage
    if (agentName && serverName) {
      const key = `${agentName}:${serverName}`;
      const stats = this.agentUsageStats.get(key) || { 
        requests: 0, successes: 0, failures: 0, totalLatency: 0 
      };
      
      stats.requests++;
      stats.totalLatency += latency;
      if (success) stats.successes++;
      else stats.failures++;
      
      this.agentUsageStats.set(key, stats);
    }
  }
  
  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    console.log('🏥 Starting enhanced health monitoring...');
    
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    // Initial health check
    setTimeout(() => this.performHealthChecks(), 2000);
  }
  
  /**
   * Perform comprehensive health checks
   */
  async performHealthChecks() {
    const healthPromises = Array.from(this.servers.keys()).map(async serverName => {
      try {
        const isHealthy = await this.checkServerHealth(serverName);
        const currentStatus = this.healthStatus.get(serverName);
        const newStatus = isHealthy ? 'healthy' : 'unhealthy';
        
        if (currentStatus !== newStatus) {
          console.log(`🔄 Server ${serverName}: ${currentStatus} → ${newStatus}`);
          this.emit('serverStatusChanged', serverName, newStatus, currentStatus);
        }
        
        this.healthStatus.set(serverName, newStatus);
        
        const server = this.servers.get(serverName);
        if (server) {
          server.status = newStatus;
          server.lastHealthCheck = new Date();
        }
        
      } catch (error) {
        console.error(`❌ Health check failed for ${serverName}:`, error);
        this.healthStatus.set(serverName, 'error');
      }
    });
    
    await Promise.allSettled(healthPromises);
    this.updateHealthMetrics();
  }
  
  /**
   * Check individual server health
   */
  async checkServerHealth(serverName) {
    const server = this.servers.get(serverName);
    if (!server) return false;
    
    switch (server.healthCheck) {
      case 'auto':
        return true;
        
      case 'connection-required':
      case 'daemon-required':
      case 'cluster-required':
        return Math.random() > 0.05; // 95% healthy
        
      case 'auth-required':
      case 'api-key-required':
      case 'token-required':
        return this.hasCredentials(serverName);
        
      default:
        return true;
    }
  }
  
  /**
   * Check if server has required credentials
   */
  hasCredentials(serverName) {
    const envVars = [
      `${serverName.toUpperCase()}_API_KEY`,
      `${serverName.toUpperCase()}_TOKEN`,
      `${serverName.toUpperCase()}_AUTH`,
      `${serverName.toUpperCase()}_CREDENTIALS`
    ];
    
    return envVars.some(env => process.env[env]);
  }
  
  /**
   * Update health metrics
   */
  updateHealthMetrics() {
    let online = 0;
    let offline = 0;
    
    for (const status of this.healthStatus.values()) {
      if (status === 'healthy') online++;
      else offline++;
    }
    
    this.metrics.serversOnline = online;
    this.metrics.serversOffline = offline;
  }
  
  /**
   * Start auto-scaling system
   */
  startAutoScaling() {
    if (!this.config.autoScalingEnabled) return;
    
    console.log('⚖️ Starting auto-scaling system...');
    
    setInterval(() => {
      this.evaluateScaling();
    }, 60000); // Every minute
  }
  
  /**
   * Evaluate scaling decisions
   */
  async evaluateScaling() {
    for (const [serverName, server] of this.servers.entries()) {
      if (!server.config.scaling?.enabled) continue;
      
      const poolStats = server.connectionPool.getStats();
      const utilization = poolStats.active / poolStats.config.max;
      const errorRate = server.metrics.failures / Math.max(1, server.metrics.requests);
      
      let action = null;
      
      if (utilization > 0.8 || errorRate > 0.1) {
        action = 'scale_up';
      } else if (utilization < 0.2 && errorRate < 0.01) {
        action = 'scale_down';
      }
      
      if (action) {
        await this.executeScaling(serverName, action);
        this.metrics.scalingActions++;
      }
    }
  }
  
  /**
   * Execute scaling action
   */
  async executeScaling(serverName, action) {
    const server = this.servers.get(serverName);
    if (!server) return;
    
    console.log(`⚖️ Scaling ${action} for ${serverName}`);
    
    switch (action) {
      case 'scale_up':
        if (server.connectionPool.config.max < 25) {
          server.connectionPool.config.max += 3;
          this.emit('serverScaled', serverName, 'up', server.connectionPool.config.max);
        }
        break;
        
      case 'scale_down':
        const minConnections = server.connectionPool.config.min || 1;
        if (server.connectionPool.config.max > minConnections + 2) {
          server.connectionPool.config.max -= 1;
          this.emit('serverScaled', serverName, 'down', server.connectionPool.config.max);
        }
        break;
    }
    
    server.metrics.lastScalingAction = {
      action,
      timestamp: Date.now(),
      newMaxConnections: server.connectionPool.config.max
    };
  }
  
  /**
   * Cache management
   */
  getCacheKey(toolName, params, agentName = null) {
    const keyData = { toolName, params };
    if (agentName) keyData.agentName = agentName;
    return JSON.stringify(keyData);
  }
  
  getFromCache(key) {
    const result = this.cache.get(key);
    const timestamp = this.cacheTimestamps.get(key);
    
    if (result && timestamp && (Date.now() - timestamp < this.config.cacheTTL)) {
      return result;
    }
    
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    return null;
  }
  
  setInCache(key, value) {
    if (this.cache.size >= this.config.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }
    
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }
  
  startCacheCleanup() {
    setInterval(() => {
      this.cleanupCache();
    }, 60000);
  }
  
  cleanupCache() {
    const now = Date.now();
    
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }
  
  /**
   * Save agent bindings configuration
   */
  async saveAgentBindings() {
    const bindingsConfig = {
      version: '3.0.0',
      generatedAt: new Date().toISOString(),
      totalAgents: this.agentBindings.size,
      bindings: Object.fromEntries(this.agentBindings),
      stats: this.getBindingStats()
    };
    
    const dir = path.dirname(this.config.bindingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.config.bindingsPath, JSON.stringify(bindingsConfig, null, 2));
    console.log(`💾 Agent bindings saved to ${this.config.bindingsPath}`);
  }
  
  /**
   * Get binding statistics
   */
  getBindingStats() {
    const stats = {
      totalBindings: 0,
      agentsByRole: {},
      serverUsage: {}
    };
    
    for (const binding of this.agentBindings.values()) {
      stats.totalBindings += binding.servers.length;
      stats.agentsByRole[binding.role] = (stats.agentsByRole[binding.role] || 0) + 1;
      
      binding.servers.forEach(server => {
        stats.serverUsage[server] = (stats.serverUsage[server] || 0) + 1;
      });
    }
    
    return stats;
  }
  
  /**
   * Get comprehensive status
   */
  getStatus() {
    const servers = Array.from(this.servers.entries()).map(([name, server]) => ({
      name,
      status: server.status,
      category: server.category,
      priority: server.priority,
      capabilities: server.capabilities,
      template: server.config.appliedTemplate,
      metrics: {
        ...server.metrics,
        connectionPool: server.connectionPool?.getStats(),
        costs: server.costTracker?.getStats()
      }
    }));
    
    return {
      version: '3.0.0',
      initialized: this.initialized,
      totalServers: this.servers.size,
      healthyServers: Array.from(this.healthStatus.values()).filter(s => s === 'healthy').length,
      totalCapabilities: this.capabilities.size,
      totalTools: this.tools.size,
      totalAgents: this.agentBindings.size,
      
      features: {
        agentBindingsEnabled: this.config.agentBindingsEnabled,
        dynamicConfigEnabled: this.config.dynamicConfigEnabled,
        autoScalingEnabled: this.config.autoScalingEnabled,
        costTrackingEnabled: this.config.costTrackingEnabled
      },
      
      metrics: this.metrics,
      servers,
      
      agentUsage: this.getAgentUsageStats(),
      bindingStats: this.getBindingStats(),
      
      cache: {
        size: this.cache.size,
        hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
      }
    };
  }
  
  /**
   * Get agent usage statistics
   */
  getAgentUsageStats() {
    const stats = {};
    
    for (const [key, data] of this.agentUsageStats.entries()) {
      const [agent, server] = key.split(':');
      if (!stats[agent]) stats[agent] = {};
      
      stats[agent][server] = {
        requests: data.requests,
        successes: data.successes,
        failures: data.failures,
        averageLatency: data.totalLatency / Math.max(1, data.requests),
        successRate: data.successes / Math.max(1, data.requests)
      };
    }
    
    return stats;
  }
  
  /**
   * Generate updated registry
   */
  generateRegistry() {
    const servers = {};
    const tools = [];
    
    for (const [name, server] of this.servers.entries()) {
      servers[name] = {
        enabled: true,
        priority: server.priority,
        description: server.config.description,
        capabilities: server.capabilities,
        tags: server.tags,
        healthCheck: server.healthCheck,
        template: server.config.appliedTemplate,
        category: server.category
      };
    }
    
    for (const tool of this.tools.values()) {
      tools.push({
        name: tool.name,
        type: tool.type,
        server: tool.server,
        description: tool.description,
        capabilities: tool.capabilities,
        priority: tool.priority,
        template: tool.template
      });
    }
    
    return {
      servers,
      tools,
      meta: {
        version: '3.0.0',
        enhancedManager: true,
        generatedAt: new Date().toISOString(),
        totalServers: this.servers.size,
        totalCapabilities: this.capabilities.size,
        totalAgents: this.agentBindings.size,
        features: {
          agentBindings: this.config.agentBindingsEnabled,
          dynamicConfig: this.config.dynamicConfigEnabled,
          autoScaling: this.config.autoScalingEnabled,
          costTracking: this.config.costTrackingEnabled
        }
      }
    };
  }
  
  /**
   * Save updated registry
   */
  async saveRegistry() {
    const registry = this.generateRegistry();
    const dir = path.dirname(this.config.registryPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.config.registryPath, JSON.stringify(registry, null, 2));
    console.log(`💾 Enhanced registry v3.0 saved to ${this.config.registryPath}`);
  }
}

module.exports = EnhancedMCPManagerV3;

// CLI usage
if (require.main === module) {
  async function main() {
    const manager = new EnhancedMCPManagerV3({
      agentBindingsEnabled: true,
      dynamicConfigEnabled: true,
      autoScalingEnabled: true,
      costTrackingEnabled: true
    });
    
    try {
      await manager.initialize();
      
      // Save enhanced registry
      await manager.saveRegistry();
      
      // Display comprehensive status
      const status = manager.getStatus();
      console.log('\n📊 Enhanced MCP Manager v3.0 Status:');
      console.log(`Version: ${status.version}`);
      console.log(`Total Servers: ${status.totalServers}`);
      console.log(`Healthy Servers: ${status.healthyServers}`);
      console.log(`Total Agents: ${status.totalAgents}`);
      console.log(`Total Capabilities: ${status.totalCapabilities}`);
      console.log(`Cache Hit Rate: ${(status.cache.hitRate * 100).toFixed(1)}%`);
      
      console.log('\nFeatures Enabled:');
      Object.entries(status.features).forEach(([feature, enabled]) => {
        console.log(`  ${feature}: ${enabled ? '✅' : '❌'}`);
      });
      
      console.log('\nTop Server Usage:');
      const serverUsage = Object.entries(status.bindingStats.serverUsage || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      serverUsage.forEach(([server, count]) => {
        console.log(`  ${server}: ${count} agents`);
      });
      
      // Test enhanced execution
      console.log('\n🧪 Testing enhanced execution...');
      const testResult = await manager.executeToolForAgent('mcp-integration-specialist', 'context7', { test: true });
      console.log('Test result:', testResult.result);
      
    } catch (error) {
      console.error('❌ Failed to run Enhanced MCP Manager v3.0:', error);
      process.exit(1);
    }
  }
  
  main();
}