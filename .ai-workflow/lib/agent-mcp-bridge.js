#!/usr/bin/env node

/**
 * Agent MCP Bridge
 * Provides seamless MCP server access for all specialized agents
 * Handles dynamic server binding, capability routing, and tool orchestration
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const EnhancedMCPManager = require('./enhanced-mcp-manager');
const MCPCapabilityRouter = require('./mcp-capability-router');

class AgentMCPBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.mcpManager = null;
    this.capabilityRouter = null;
    this.agentSessions = new Map();
    this.toolBindings = new Map();
    
    this.config = {
      agentsPath: options.agentsPath || path.join(__dirname, '../../.claude/agents'),
      bridgeTimeout: options.bridgeTimeout || 30000,
      maxConcurrentRequests: options.maxConcurrentRequests || 100,
      enableCaching: options.enableCaching !== false,
      enableMetrics: options.enableMetrics !== false,
      autoRetry: options.autoRetry !== false
    };
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      activeAgents: 0,
      toolInvocations: new Map(),
      serverUsage: new Map()
    };
    
    this.initialized = false;
  }
  
  /**
   * Initialize the agent MCP bridge
   */
  async initialize() {
    try {
      console.log('🌉 Initializing Agent MCP Bridge...');
      
      // Initialize MCP manager
      this.mcpManager = new EnhancedMCPManager();
      await this.mcpManager.initialize();
      
      // Initialize capability router
      this.capabilityRouter = new MCPCapabilityRouter(this.mcpManager);
      
      // Discover and register agents
      await this.discoverAgents();
      
      // Setup tool bindings
      await this.setupToolBindings();
      
      // Start monitoring
      this.startMetricsCollection();
      
      this.initialized = true;
      this.emit('initialized');
      
      console.log(`✅ Agent MCP Bridge initialized with ${this.agentSessions.size} agents`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Agent MCP Bridge:', error);
      throw error;
    }
  }
  
  /**
   * Discover all specialized agents
   */
  async discoverAgents() {
    console.log('🔍 Discovering specialized agents...');
    
    try {
      const agentFiles = fs.readdirSync(this.config.agentsPath)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(this.config.agentsPath, file));
      
      for (const agentFile of agentFiles) {
        await this.registerAgent(agentFile);
      }
      
      console.log(`📋 Discovered ${this.agentSessions.size} specialized agents`);
      
    } catch (error) {
      console.error('❌ Failed to discover agents:', error);
    }
  }
  
  /**
   * Register a single agent
   */
  async registerAgent(agentFile) {
    try {
      const agentContent = fs.readFileSync(agentFile, 'utf8');
      const agentInfo = this.parseAgentFile(agentContent, agentFile);
      
      if (agentInfo) {
        const session = {
          ...agentInfo,
          filePath: agentFile,
          status: 'ready',
          lastActive: null,
          toolsUsed: new Set(),
          serversUsed: new Set(),
          requestCount: 0,
          successCount: 0,
          failureCount: 0,
          averageLatency: 0
        };
        
        this.agentSessions.set(agentInfo.name, session);
        
        // Create tool bindings for this agent
        await this.createAgentToolBindings(agentInfo.name, agentInfo.tools);
        
        console.log(`✅ Registered agent: ${agentInfo.name}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to register agent from ${agentFile}:`, error);
    }
  }
  
  /**
   * Parse agent file to extract metadata
   */
  parseAgentFile(content, filePath) {
    try {
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        return null;
      }
      
      const frontmatter = frontmatterMatch[1];
      const agentInfo = {};
      
      // Parse YAML-like frontmatter
      const lines = frontmatter.split('\n');
      for (const line of lines) {
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          
          if (key === 'tools') {
            agentInfo.tools = value.split(',').map(t => t.trim()).filter(Boolean);
          } else if (key === 'color') {
            agentInfo.color = value;
          } else if (key === 'description') {
            agentInfo.description = value;
          } else {
            agentInfo[key] = value;
          }
        }
      }
      
      // Extract agent name from file name if not in frontmatter
      if (!agentInfo.name) {
        agentInfo.name = path.basename(filePath, '.md');
      }
      
      // Ensure required fields
      agentInfo.tools = agentInfo.tools || [];
      agentInfo.description = agentInfo.description || 'Specialized agent';
      
      return agentInfo;
      
    } catch (error) {
      console.error('Failed to parse agent file:', error);
      return null;
    }
  }
  
  /**
   * Create tool bindings for an agent
   */
  async createAgentToolBindings(agentName, tools) {
    const bindings = new Map();
    
    for (const tool of tools) {
      // Check if it's an MCP tool
      if (tool.startsWith('mcp__')) {
        const mcpTool = tool.substring(5); // Remove 'mcp__' prefix
        const serverName = this.findServerForTool(mcpTool);
        
        if (serverName) {
          bindings.set(tool, {
            type: 'mcp',
            server: serverName,
            tool: mcpTool,
            originalName: tool
          });
        }
      } else {
        // Check if it's a standard MCP server name
        if (this.mcpManager.servers.has(tool)) {
          bindings.set(tool, {
            type: 'mcp',
            server: tool,
            tool: tool,
            originalName: tool
          });
        } else {
          // Built-in tool
          bindings.set(tool, {
            type: 'builtin',
            tool: tool,
            originalName: tool
          });
        }
      }
    }
    
    this.toolBindings.set(agentName, bindings);
    
    console.log(`🔗 Created ${bindings.size} tool bindings for ${agentName}`);
  }
  
  /**
   * Find server that provides a specific tool
   */
  findServerForTool(toolName) {
    // Try exact match first
    if (this.mcpManager.servers.has(toolName)) {
      return toolName;
    }
    
    // Try capability matching
    for (const [serverName, server] of this.mcpManager.servers.entries()) {
      if (server.capabilities.some(cap => cap.includes(toolName.toLowerCase()))) {
        return serverName;
      }
    }
    
    // Try tag matching
    for (const [serverName, server] of this.mcpManager.servers.entries()) {
      if (server.tags && server.tags.some(tag => tag.includes(toolName.toLowerCase()))) {
        return serverName;
      }
    }
    
    return null;
  }
  
  /**
   * Setup global tool bindings
   */
  async setupToolBindings() {
    console.log('🔧 Setting up global tool bindings...');
    
    // Create bindings for all available MCP servers
    for (const [serverName, server] of this.mcpManager.servers.entries()) {
      if (server.config.enabled) {
        // Standard binding (server name as tool name)
        this.createGlobalBinding(serverName, {
          type: 'mcp',
          server: serverName,
          capabilities: server.capabilities || [],
          priority: server.priority || 5
        });
        
        // Capability-based bindings
        if (server.capabilities) {
          server.capabilities.forEach(capability => {
            this.createGlobalBinding(`mcp_${capability}`, {
              type: 'mcp',
              server: serverName,
              capability: capability,
              priority: server.priority || 5
            });
          });
        }
      }
    }
    
    console.log('✅ Global tool bindings setup complete');
  }
  
  /**
   * Create a global tool binding
   */
  createGlobalBinding(toolName, binding) {
    if (!this.toolBindings.has('global')) {
      this.toolBindings.set('global', new Map());
    }
    
    this.toolBindings.get('global').set(toolName, binding);
  }
  
  /**
   * Execute tool for an agent
   */
  async executeAgentTool(agentName, toolName, params = {}, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      console.log(`🛠️  Agent ${agentName} executing tool: ${toolName}`);
      
      // Get agent session
      const agent = this.agentSessions.get(agentName);
      if (!agent) {
        throw new Error(`Agent not found: ${agentName}`);
      }
      
      // Update agent activity
      agent.lastActive = new Date();
      agent.requestCount++;
      
      // Find tool binding
      const binding = this.findToolBinding(agentName, toolName);
      if (!binding) {
        throw new Error(`Tool not available for agent ${agentName}: ${toolName}`);
      }
      
      let result;
      
      if (binding.type === 'mcp') {
        // Route through capability router for intelligent server selection
        const routingRequest = {
          agentName,
          taskDescription: `Execute ${toolName} with params: ${JSON.stringify(params)}`,
          requiredCapabilities: binding.capability ? [binding.capability] : [],
          preferredServers: [binding.server],
          context: options.context || {},
          priority: options.priority || 'normal'
        };
        
        const routingDecision = await this.capabilityRouter.routeRequest(routingRequest);
        
        // Execute on selected server
        result = await this.mcpManager.executeTool(
          binding.tool, 
          params, 
          { 
            serverName: routingDecision.selectedServer,
            ...options 
          }
        );
        
        // Track server usage
        agent.serversUsed.add(routingDecision.selectedServer);
        this.updateServerUsageMetrics(routingDecision.selectedServer);
        
      } else {
        // Execute built-in tool
        result = await this.executeBuiltinTool(toolName, params, options);
      }
      
      // Update metrics
      const latency = Date.now() - startTime;
      this.updateAgentMetrics(agentName, true, latency, toolName);
      this.metrics.successfulRequests++;
      
      console.log(`✅ Tool execution completed for ${agentName}: ${toolName} (${latency}ms)`);
      
      return result;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateAgentMetrics(agentName, false, latency, toolName);
      this.metrics.failedRequests++;
      
      console.error(`❌ Tool execution failed for ${agentName}: ${toolName}`, error);
      throw error;
    }
  }
  
  /**
   * Find tool binding for agent
   */
  findToolBinding(agentName, toolName) {
    // Check agent-specific bindings first
    const agentBindings = this.toolBindings.get(agentName);
    if (agentBindings && agentBindings.has(toolName)) {
      return agentBindings.get(toolName);
    }
    
    // Check global bindings
    const globalBindings = this.toolBindings.get('global');
    if (globalBindings && globalBindings.has(toolName)) {
      return globalBindings.get(toolName);
    }
    
    // Try MCP server direct access
    if (this.mcpManager.servers.has(toolName)) {
      return {
        type: 'mcp',
        server: toolName,
        tool: toolName
      };
    }
    
    return null;
  }
  
  /**
   * Execute built-in tool
   */
  async executeBuiltinTool(toolName, params, options) {
    // Mock built-in tool execution
    // In real implementation, this would handle built-in tools like grep, etc.
    
    return {
      tool: toolName,
      type: 'builtin',
      params,
      result: `Built-in tool ${toolName} executed successfully`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Update agent metrics
   */
  updateAgentMetrics(agentName, success, latency, toolName) {
    const agent = this.agentSessions.get(agentName);
    if (agent) {
      if (success) {
        agent.successCount++;
      } else {
        agent.failureCount++;
      }
      
      // Update average latency
      const totalLatency = agent.averageLatency * (agent.requestCount - 1) + latency;
      agent.averageLatency = totalLatency / agent.requestCount;
      
      // Track tool usage
      agent.toolsUsed.add(toolName);
    }
    
    // Update global tool metrics
    if (!this.metrics.toolInvocations.has(toolName)) {
      this.metrics.toolInvocations.set(toolName, 0);
    }
    this.metrics.toolInvocations.set(toolName, this.metrics.toolInvocations.get(toolName) + 1);
    
    // Update global average latency
    const totalLatency = this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency;
    this.metrics.averageLatency = totalLatency / this.metrics.totalRequests;
  }
  
  /**
   * Update server usage metrics
   */
  updateServerUsageMetrics(serverName) {
    if (!this.metrics.serverUsage.has(serverName)) {
      this.metrics.serverUsage.set(serverName, 0);
    }
    this.metrics.serverUsage.set(serverName, this.metrics.serverUsage.get(serverName) + 1);
  }
  
  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    if (!this.config.enableMetrics) return;
    
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect every 30 seconds
  }
  
  /**
   * Collect and emit metrics
   */
  collectMetrics() {
    const activeAgents = Array.from(this.agentSessions.values())
      .filter(agent => agent.lastActive && (Date.now() - agent.lastActive.getTime() < 300000)) // Active in last 5 minutes
      .length;
    
    this.metrics.activeAgents = activeAgents;
    
    const metricsSnapshot = {
      ...this.metrics,
      toolInvocations: Object.fromEntries(this.metrics.toolInvocations),
      serverUsage: Object.fromEntries(this.metrics.serverUsage),
      timestamp: new Date().toISOString()
    };
    
    this.emit('metrics', metricsSnapshot);
  }
  
  /**
   * Get agent status
   */
  getAgentStatus(agentName) {
    const agent = this.agentSessions.get(agentName);
    if (!agent) {
      return null;
    }
    
    return {
      name: agent.name,
      description: agent.description,
      status: agent.status,
      lastActive: agent.lastActive,
      requestCount: agent.requestCount,
      successCount: agent.successCount,
      failureCount: agent.failureCount,
      successRate: agent.requestCount > 0 ? (agent.successCount / agent.requestCount * 100) : 0,
      averageLatency: agent.averageLatency,
      toolsUsed: Array.from(agent.toolsUsed),
      serversUsed: Array.from(agent.serversUsed),
      availableTools: Array.from(this.toolBindings.get(agentName)?.keys() || [])
    };
  }
  
  /**
   * Get all agents status
   */
  getAllAgentsStatus() {
    const agents = {};
    
    for (const agentName of this.agentSessions.keys()) {
      agents[agentName] = this.getAgentStatus(agentName);
    }
    
    return {
      totalAgents: this.agentSessions.size,
      activeAgents: this.metrics.activeAgents,
      totalServers: this.mcpManager.servers.size,
      healthyServers: Array.from(this.mcpManager.healthStatus.values()).filter(s => s === 'healthy').length,
      metrics: this.metrics,
      agents
    };
  }
  
  /**
   * Get agent tool capabilities
   */
  getAgentCapabilities(agentName) {
    const agent = this.agentSessions.get(agentName);
    const bindings = this.toolBindings.get(agentName);
    
    if (!agent || !bindings) {
      return null;
    }
    
    const capabilities = {
      agentName,
      description: agent.description,
      availableTools: [],
      mcpServers: [],
      capabilities: new Set(),
      categories: new Set()
    };
    
    for (const [toolName, binding] of bindings.entries()) {
      capabilities.availableTools.push({
        name: toolName,
        type: binding.type,
        server: binding.server || null,
        capability: binding.capability || null
      });
      
      if (binding.type === 'mcp' && binding.server) {
        capabilities.mcpServers.push(binding.server);
        
        const server = this.mcpManager.servers.get(binding.server);
        if (server) {
          if (server.capabilities) {
            server.capabilities.forEach(cap => capabilities.capabilities.add(cap));
          }
          if (server.category) {
            capabilities.categories.add(server.category);
          }
        }
      }
    }
    
    return {
      ...capabilities,
      capabilities: Array.from(capabilities.capabilities),
      categories: Array.from(capabilities.categories),
      mcpServers: [...new Set(capabilities.mcpServers)]
    };
  }
  
  /**
   * Refresh agent registrations
   */
  async refreshAgents() {
    console.log('🔄 Refreshing agent registrations...');
    
    // Clear existing sessions
    this.agentSessions.clear();
    this.toolBindings.clear();
    
    // Re-discover agents
    await this.discoverAgents();
    await this.setupToolBindings();
    
    console.log(`✅ Agent registrations refreshed: ${this.agentSessions.size} agents`);
    
    this.emit('agentsRefreshed');
  }
}

module.exports = AgentMCPBridge;

// CLI usage
if (require.main === module) {
  async function main() {
    try {
      const bridge = new AgentMCPBridge();
      
      await bridge.initialize();
      
      // Display status
      const status = bridge.getAllAgentsStatus();
      console.log('\n📊 Agent MCP Bridge Status:');
      console.log(`Total Agents: ${status.totalAgents}`);
      console.log(`Active Agents: ${status.activeAgents}`);
      console.log(`Total Servers: ${status.totalServers}`);
      console.log(`Healthy Servers: ${status.healthyServers}`);
      
      // Test agent tool execution
      const agentNames = Array.from(bridge.agentSessions.keys());
      if (agentNames.length > 0) {
        const testAgent = agentNames[0];
        console.log(`\n🧪 Testing tool execution for agent: ${testAgent}`);
        
        try {
          const result = await bridge.executeAgentTool(testAgent, 'context7', { test: true });
          console.log('Test result:', result);
        } catch (error) {
          console.log('Test failed (expected for demo):', error.message);
        }
      }
      
      // Display agent capabilities
      if (agentNames.length > 0) {
        const capabilities = bridge.getAgentCapabilities(agentNames[0]);
        console.log(`\n🔍 Capabilities for ${agentNames[0]}:`, JSON.stringify(capabilities, null, 2));
      }
      
    } catch (error) {
      console.error('❌ Failed to run Agent MCP Bridge:', error);
      process.exit(1);
    }
  }
  
  main();
}