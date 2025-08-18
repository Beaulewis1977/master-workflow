#!/usr/bin/env node

/**
 * Enhanced MCP Server Manager
 * Handles 100+ MCP servers with intelligent routing, health monitoring, 
 * connection pooling, and capability mapping
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class EnhancedMCPManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.servers = new Map();
    this.tools = new Map();
    this.capabilities = new Map();
    this.healthStatus = new Map();
    this.connectionPools = new Map();
    this.loadBalancers = new Map();
    
    // Configuration
    this.config = {
      catalogPath: options.catalogPath || path.join(__dirname, '..', 'configs', 'mcp-catalog.json'),
      registryPath: options.registryPath || path.join(__dirname, '..', 'configs', 'mcp-registry.json'),
      healthCheckInterval: options.healthCheckInterval || 30000,
      connectionTimeout: options.connectionTimeout || 5000,
      retryAttempts: options.retryAttempts || 3,
      maxConnectionsPerServer: options.maxConnectionsPerServer || 10,
      loadBalancingStrategy: options.loadBalancingStrategy || 'weighted-round-robin',
      cacheEnabled: options.cacheEnabled !== false,
      cacheTTL: options.cacheTTL || 300000,
      cacheMaxSize: options.cacheMaxSize || 1000
    };
    
    // Cache system
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
      serversOnline: 0,
      serversOffline: 0
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the MCP manager
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Enhanced MCP Manager...');
      
      // Load catalog and registry
      await this.loadCatalog();
      await this.loadRegistry();
      
      // Initialize servers
      await this.initializeServers();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start cache cleanup
      this.startCacheCleanup();
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log(`✅ Enhanced MCP Manager initialized with ${this.servers.size} servers`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced MCP Manager:', error);
      throw error;
    }
  }
  
  /**
   * Load server catalog
   */
  async loadCatalog() {
    try {
      if (fs.existsSync(this.config.catalogPath)) {
        const catalogData = JSON.parse(fs.readFileSync(this.config.catalogPath, 'utf8'));
        this.catalog = catalogData;
        console.log(`📚 Loaded catalog with ${catalogData.totalServers} servers`);
      } else {
        console.warn('⚠️  MCP catalog not found, using minimal configuration');
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
   * Initialize all servers from catalog
   */
  async initializeServers() {
    console.log('🔧 Initializing servers from catalog...');
    
    for (const [categoryName, category] of Object.entries(this.catalog.categories || {})) {
      for (const [serverName, serverConfig] of Object.entries(category.servers || {})) {
        if (serverConfig.enabled) {
          await this.initializeServer(serverName, serverConfig, categoryName);
        }
      }
    }
    
    // Also initialize servers from registry that might not be in catalog
    for (const [serverName, serverConfig] of Object.entries(this.registry.servers || {})) {
      if (serverConfig.enabled && !this.servers.has(serverName)) {
        await this.initializeServer(serverName, serverConfig, 'registry');
      }
    }
  }
  
  /**
   * Initialize a single server
   */
  async initializeServer(name, config, category = 'unknown') {
    try {
      const serverInfo = {
        name,
        config,
        category,
        priority: config.priority || 5,
        capabilities: config.capabilities || [],
        tags: config.tags || [],
        healthCheck: config.healthCheck || 'auto',
        status: 'initializing',
        lastHealthCheck: null,
        connectionPool: null,
        metrics: {
          requests: 0,
          successes: 0,
          failures: 0,
          averageLatency: 0
        }
      };
      
      // Create connection pool
      serverInfo.connectionPool = await this.createConnectionPool(name, config);
      
      // Map capabilities
      this.mapServerCapabilities(name, config.capabilities || []);
      
      // Register tools
      this.registerServerTools(name, config);
      
      this.servers.set(name, serverInfo);
      this.healthStatus.set(name, 'unknown');
      
      console.log(`✅ Initialized server: ${name} (${category})`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize server ${name}:`, error);
    }
  }
  
  /**
   * Create connection pool for a server
   */
  async createConnectionPool(serverName, config) {
    return {
      active: 0,
      idle: 0,
      max: this.config.maxConnectionsPerServer,
      connections: [],
      queue: [],
      
      async acquire() {
        // Connection pool logic would go here
        // For now, return a mock connection
        return { id: `${serverName}-${Date.now()}`, serverName };
      },
      
      async release(connection) {
        // Release connection logic
      }
    };
  }
  
  /**
   * Map server capabilities for intelligent routing
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
   * Register tools for a server
   */
  registerServerTools(serverName, config) {
    // Auto-generate tools based on server name and capabilities
    const toolName = serverName;
    
    this.tools.set(toolName, {
      name: toolName,
      type: 'mcp',
      server: serverName,
      capabilities: config.capabilities || [],
      description: config.description || `${serverName} MCP server`,
      priority: config.priority || 5
    });
  }
  
  /**
   * Find optimal server for a given capability or task
   */
  findOptimalServer(capability, options = {}) {
    const candidateServers = this.capabilities.get(capability) || [];
    
    if (candidateServers.length === 0) {
      // Fallback to default or any available server
      return this.findFallbackServer(options);
    }
    
    // Filter by health status
    const healthyServers = candidateServers.filter(name => 
      this.healthStatus.get(name) === 'healthy'
    );
    
    if (healthyServers.length === 0) {
      return null; // No healthy servers available
    }
    
    // Apply load balancing strategy
    return this.applyLoadBalancing(healthyServers, options);
  }
  
  /**
   * Apply load balancing to select optimal server
   */
  applyLoadBalancing(servers, options = {}) {
    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        return this.roundRobinSelection(servers);
        
      case 'weighted-round-robin':
        return this.weightedRoundRobinSelection(servers);
        
      case 'least-connections':
        return this.leastConnectionsSelection(servers);
        
      case 'weighted-response':
        return this.weightedResponseSelection(servers);
        
      case 'priority':
        return this.priorityBasedSelection(servers);
        
      default:
        return servers[Math.floor(Math.random() * servers.length)];
    }
  }
  
  /**
   * Weighted round-robin server selection
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
   * Priority-based server selection
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
   * Find fallback server when no capability match found
   */
  findFallbackServer(options = {}) {
    // Try default server first
    const defaultServer = Array.from(this.servers.values()).find(s => s.config.default);
    if (defaultServer && this.healthStatus.get(defaultServer.name) === 'healthy') {
      return defaultServer.name;
    }
    
    // Fall back to any healthy core server
    const coreServers = Array.from(this.servers.values()).filter(s => 
      s.category === 'core' && this.healthStatus.get(s.name) === 'healthy'
    );
    
    if (coreServers.length > 0) {
      return this.priorityBasedSelection(coreServers.map(s => s.name));
    }
    
    // Last resort: any healthy server
    const healthyServers = Array.from(this.servers.keys()).filter(name =>
      this.healthStatus.get(name) === 'healthy'
    );
    
    return healthyServers.length > 0 ? healthyServers[0] : null;
  }
  
  /**
   * Execute a tool on the optimal server
   */
  async executeTool(toolName, params = {}, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cacheKey = this.getCacheKey(toolName, params);
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          this.metrics.cacheHits++;
          return cachedResult;
        }
        this.metrics.cacheMisses++;
      }
      
      // Find tool definition
      const tool = this.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }
      
      // Find optimal server
      const serverName = options.serverName || 
                        this.findOptimalServer(tool.capabilities[0], options) ||
                        tool.server;
      
      if (!serverName) {
        throw new Error(`No healthy server available for tool: ${toolName}`);
      }
      
      // Execute with retry logic
      const result = await this.executeWithRetry(serverName, toolName, params, options);
      
      // Cache result
      if (this.config.cacheEnabled && !options.skipCache) {
        const cacheKey = this.getCacheKey(toolName, params);
        this.setInCache(cacheKey, result);
      }
      
      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics(serverName, true, latency);
      this.metrics.successfulRequests++;
      
      return result;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(null, false, latency);
      this.metrics.failedRequests++;
      throw error;
    }
  }
  
  /**
   * Execute with retry logic
   */
  async executeWithRetry(serverName, toolName, params, options, attempt = 1) {
    try {
      return await this.executeOnServer(serverName, toolName, params, options);
    } catch (error) {
      if (attempt >= this.config.retryAttempts) {
        throw error;
      }
      
      // Try failover server
      if (attempt === 1) {
        const fallbackServer = this.findFallbackServer(options);
        if (fallbackServer && fallbackServer !== serverName) {
          return await this.executeWithRetry(fallbackServer, toolName, params, options, attempt + 1);
        }
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return await this.executeWithRetry(serverName, toolName, params, options, attempt + 1);
    }
  }
  
  /**
   * Execute on specific server
   */
  async executeOnServer(serverName, toolName, params, options) {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server not found: ${serverName}`);
    }
    
    // Get connection from pool
    const connection = await server.connectionPool.acquire();
    
    try {
      // Mock execution - in real implementation, this would call the actual MCP server
      const result = await this.mockServerExecution(serverName, toolName, params);
      return result;
    } finally {
      await server.connectionPool.release(connection);
    }
  }
  
  /**
   * Mock server execution (replace with actual MCP protocol calls)
   */
  async mockServerExecution(serverName, toolName, params) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    return {
      server: serverName,
      tool: toolName,
      params,
      result: `Mock result from ${serverName} for ${toolName}`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    // Perform initial health check
    setTimeout(() => this.performHealthChecks(), 1000);
  }
  
  /**
   * Perform health checks on all servers
   */
  async performHealthChecks() {
    console.log('🔍 Performing health checks...');
    
    const healthPromises = Array.from(this.servers.keys()).map(async serverName => {
      try {
        const isHealthy = await this.checkServerHealth(serverName);
        const currentStatus = this.healthStatus.get(serverName);
        const newStatus = isHealthy ? 'healthy' : 'unhealthy';
        
        if (currentStatus !== newStatus) {
          console.log(`📊 Server ${serverName} status: ${currentStatus} -> ${newStatus}`);
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
    
    // Update metrics
    this.updateHealthMetrics();
  }
  
  /**
   * Check health of specific server
   */
  async checkServerHealth(serverName) {
    const server = this.servers.get(serverName);
    if (!server) return false;
    
    switch (server.healthCheck) {
      case 'auto':
        return true; // Assume healthy for auto servers
        
      case 'connection-required':
      case 'daemon-required':
      case 'cluster-required':
        // Mock connection check
        return Math.random() > 0.1; // 90% healthy
        
      case 'auth-required':
      case 'api-key-required':
      case 'token-required':
        // Check if credentials are available
        return this.hasCredentials(serverName);
        
      default:
        return true;
    }
  }
  
  /**
   * Check if server has required credentials
   */
  hasCredentials(serverName) {
    // Mock credential check - in real implementation, check actual credentials
    const credentialEnvs = [
      `${serverName.toUpperCase()}_API_KEY`,
      `${serverName.toUpperCase()}_TOKEN`,
      `${serverName.toUpperCase()}_AUTH`
    ];
    
    return credentialEnvs.some(env => process.env[env]);
  }
  
  /**
   * Update health metrics
   */
  updateHealthMetrics() {
    let online = 0;
    let offline = 0;
    
    for (const status of this.healthStatus.values()) {
      if (status === 'healthy') {
        online++;
      } else {
        offline++;
      }
    }
    
    this.metrics.serversOnline = online;
    this.metrics.serversOffline = offline;
  }
  
  /**
   * Update server metrics
   */
  updateMetrics(serverName, success, latency) {
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
    
    // Update global average latency
    const totalLatency = this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency;
    this.metrics.averageLatency = totalLatency / this.metrics.totalRequests;
  }
  
  /**
   * Cache management
   */
  getCacheKey(toolName, params) {
    return `${toolName}:${JSON.stringify(params)}`;
  }
  
  getFromCache(key) {
    const result = this.cache.get(key);
    const timestamp = this.cacheTimestamps.get(key);
    
    if (result && timestamp && (Date.now() - timestamp < this.config.cacheTTL)) {
      return result;
    }
    
    // Clean expired entry
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    return null;
  }
  
  setInCache(key, value) {
    if (this.cache.size >= this.config.cacheMaxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }
    
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }
  
  /**
   * Start cache cleanup
   */
  startCacheCleanup() {
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Clean every minute
  }
  
  /**
   * Clean up expired cache entries
   */
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
   * Get comprehensive server status
   */
  getServerStatus() {
    const servers = Array.from(this.servers.entries()).map(([name, server]) => ({
      name,
      category: server.category,
      status: server.status,
      priority: server.priority,
      capabilities: server.capabilities,
      tags: server.tags,
      healthCheck: server.healthCheck,
      lastHealthCheck: server.lastHealthCheck,
      metrics: server.metrics
    }));
    
    return {
      totalServers: this.servers.size,
      healthyServers: Array.from(this.healthStatus.values()).filter(s => s === 'healthy').length,
      capabilities: Array.from(this.capabilities.keys()),
      tools: Array.from(this.tools.keys()),
      metrics: this.metrics,
      servers
    };
  }
  
  /**
   * Generate updated registry
   */
  generateRegistry() {
    const servers = {};
    const tools = [];
    
    // Convert servers map to registry format
    for (const [name, server] of this.servers.entries()) {
      servers[name] = {
        enabled: true,
        priority: server.priority,
        description: server.config.description,
        capabilities: server.capabilities,
        tags: server.tags,
        healthCheck: server.healthCheck,
        ...(server.config.default && { default: true })
      };
    }
    
    // Convert tools map to registry format
    for (const [name, tool] of this.tools.entries()) {
      tools.push({
        name: tool.name,
        type: tool.type,
        server: tool.server,
        description: tool.description,
        capabilities: tool.capabilities,
        priority: tool.priority
      });
    }
    
    return {
      servers,
      tools,
      meta: {
        autoDiscover: true,
        enhancedManager: true,
        generatedAt: new Date().toISOString(),
        totalServers: this.servers.size,
        totalCapabilities: this.capabilities.size,
        version: '3.0.0'
      }
    };
  }
  
  /**
   * Save updated registry
   */
  async saveRegistry() {
    const registry = this.generateRegistry();
    const registryJson = JSON.stringify(registry, null, 2);
    
    const dir = path.dirname(this.config.registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.config.registryPath, registryJson);
    console.log(`💾 Updated registry saved to ${this.config.registryPath}`);
  }
}

// Utility functions for load balancing strategies
EnhancedMCPManager.prototype.roundRobinSelection = function(servers) {
  this._roundRobinIndex = (this._roundRobinIndex || 0) % servers.length;
  return servers[this._roundRobinIndex++];
};

EnhancedMCPManager.prototype.leastConnectionsSelection = function(servers) {
  return servers.reduce((best, current) => {
    const bestServer = this.servers.get(best);
    const currentServer = this.servers.get(current);
    
    if (!bestServer) return current;
    if (!currentServer) return best;
    
    return currentServer.connectionPool.active < bestServer.connectionPool.active ? current : best;
  });
};

EnhancedMCPManager.prototype.weightedResponseSelection = function(servers) {
  return servers.reduce((best, current) => {
    const bestServer = this.servers.get(best);
    const currentServer = this.servers.get(current);
    
    if (!bestServer) return current;
    if (!currentServer) return best;
    
    return currentServer.metrics.averageLatency < bestServer.metrics.averageLatency ? current : best;
  });
};

module.exports = EnhancedMCPManager;

// CLI usage
if (require.main === module) {
  async function main() {
    const manager = new EnhancedMCPManager();
    
    try {
      await manager.initialize();
      
      // Save enhanced registry
      await manager.saveRegistry();
      
      // Display status
      const status = manager.getServerStatus();
      console.log('\n📊 Enhanced MCP Manager Status:');
      console.log(`Total Servers: ${status.totalServers}`);
      console.log(`Healthy Servers: ${status.healthyServers}`);
      console.log(`Total Capabilities: ${status.capabilities.length}`);
      console.log(`Total Tools: ${status.tools.length}`);
      
      // Test tool execution
      console.log('\n🧪 Testing tool execution...');
      const testResult = await manager.executeTool('context7', { test: true });
      console.log('Test result:', testResult);
      
    } catch (error) {
      console.error('❌ Failed to run Enhanced MCP Manager:', error);
      process.exit(1);
    }
  }
  
  main();
}