#!/usr/bin/env node

/**
 * MCP Agent Bindings System
 * 
 * Provides dynamic MCP server access to all 42+ specialized agents
 * with intelligent server selection, capability matching, and failover
 */

const fs = require('fs');
const path = require('path');
const EnhancedMCPManager = require('./enhanced-mcp-manager');

class MCPAgentBindings {
  constructor(options = {}) {
    this.mcpManager = new EnhancedMCPManager(options);
    this.agentBindings = new Map();
    this.capabilityMatrix = new Map();
    this.agentProfiles = new Map();
    this.accessPolicies = new Map();
    
    this.config = {
      agentsPath: options.agentsPath || path.join(__dirname, '../../.claude/agents'),
      bindingsPath: options.bindingsPath || path.join(__dirname, '..', 'configs', 'agent-mcp-bindings.json'),
      profilesPath: options.profilesPath || path.join(__dirname, '..', 'configs', 'agent-profiles.json'),
      maxServersPerAgent: options.maxServersPerAgent || 20,
      defaultServerTimeout: options.defaultServerTimeout || 10000,
      serverSelectionStrategy: options.serverSelectionStrategy || 'capability-priority'
    };
  }

  /**
   * Initialize the agent binding system
   */
  async initialize() {
    console.log('🔗 Initializing MCP Agent Bindings...');
    
    try {
      // Initialize MCP manager
      await this.mcpManager.initialize();
      
      // Load agent profiles
      await this.loadAgentProfiles();
      
      // Discover agents
      await this.discoverAgents();
      
      // Create capability matrix
      this.createCapabilityMatrix();
      
      // Generate bindings
      this.generateAgentBindings();
      
      // Save configurations
      await this.saveBindings();
      
      console.log(`✅ Agent bindings initialized for ${this.agentBindings.size} agents`);
      
    } catch (error) {
      console.error('❌ Failed to initialize MCP Agent Bindings:', error);
      throw error;
    }
  }

  /**
   * Load agent profiles with capability requirements
   */
  async loadAgentProfiles() {
    const profiles = {
      // Core System Agents
      'queen-controller-architect': {
        role: 'system-coordinator',
        requiredCapabilities: ['metrics-collection', 'monitoring', 'orchestration', 'logging'],
        preferredServers: ['prometheus', 'grafana', 'vault', 'context7'],
        priority: 10,
        maxConcurrentConnections: 15
      },
      
      'orchestration-coordinator': {
        role: 'workflow-orchestrator', 
        requiredCapabilities: ['container-management', 'scaling', 'service-discovery'],
        preferredServers: ['kubernetes', 'docker', 'rancher', 'context7'],
        priority: 9,
        maxConcurrentConnections: 12
      },

      'neural-swarm-architect': {
        role: 'ai-coordinator',
        requiredCapabilities: ['text-generation', 'reasoning', 'model-inference'],
        preferredServers: ['openai', 'anthropic', 'gemini', 'claude_projects', 'langchain'],
        priority: 9,
        maxConcurrentConnections: 10
      },

      'mcp-integration-specialist': {
        role: 'mcp-coordinator',
        requiredCapabilities: ['all'],
        preferredServers: ['*'], // Access to all servers
        priority: 10,
        maxConcurrentConnections: 20
      },

      // Development Agents
      'engine-architect': {
        role: 'system-developer',
        requiredCapabilities: ['code-analysis', 'repository-management', 'ci-cd'],
        preferredServers: ['context7', 'github', 'githubactions', 'docker'],
        priority: 8,
        maxConcurrentConnections: 10
      },

      'deployment-pipeline-engineer': {
        role: 'deployment-specialist',
        requiredCapabilities: ['deployment', 'infrastructure-management', 'ci-cd'],
        preferredServers: ['terraform', 'ansible', 'kubernetes', 'aws', 'gcp', 'azure'],
        priority: 8,
        maxConcurrentConnections: 8
      },

      'github-git-specialist-agent': {
        role: 'version-control-specialist',
        requiredCapabilities: ['version-control', 'repository-management', 'pull-requests'],
        preferredServers: ['github', 'gitlab', 'bitbucket', 'git'],
        priority: 7,
        maxConcurrentConnections: 6
      },

      'database-architect-agent': {
        role: 'data-specialist',
        requiredCapabilities: ['sql-operations', 'document-operations', 'data-warehouse'],
        preferredServers: ['postgres', 'mysql', 'mongodb', 'redis', 'snowflake', 'databricks'],
        priority: 7,
        maxConcurrentConnections: 8
      },

      'api-builder-agent': {
        role: 'api-developer',
        requiredCapabilities: ['api-documentation', 'http-requests', 'schema-validation'],
        preferredServers: ['openapi', 'http', 'context7', 'postman'],
        priority: 6,
        maxConcurrentConnections: 6
      },

      'frontend-specialist-agent': {
        role: 'frontend-developer',
        requiredCapabilities: ['deployment', 'static-hosting', 'web-scraping'],
        preferredServers: ['vercel', 'netlify', 'browser', 'puppeteer', 'context7'],
        priority: 6,
        maxConcurrentConnections: 6
      },

      // Security & Monitoring Agents
      'security-compliance-auditor': {
        role: 'security-specialist',
        requiredCapabilities: ['vulnerability-scanning', 'secrets-management', 'security-analysis'],
        preferredServers: ['vault', 'snyk', 'sonarqube', '1password', 'veracode'],
        priority: 8,
        maxConcurrentConnections: 8
      },

      'security-scanner-agent': {
        role: 'security-scanner',
        requiredCapabilities: ['vulnerability-scanning', 'dependency-analysis', 'static-analysis'],
        preferredServers: ['snyk', 'sonarqube', 'veracode', 'qualys'],
        priority: 7,
        maxConcurrentConnections: 5
      },

      'metrics-monitoring-engineer': {
        role: 'monitoring-specialist',
        requiredCapabilities: ['metrics-collection', 'visualization', 'error-tracking'],
        preferredServers: ['prometheus', 'grafana', 'datadog', 'newrelic', 'sentry'],
        priority: 7,
        maxConcurrentConnections: 8
      },

      // Testing & Quality Agents
      'test-automation-engineer': {
        role: 'testing-specialist',
        requiredCapabilities: ['web-testing', 'cross-browser', 'automation'],
        preferredServers: ['playwright', 'selenium', 'puppeteer', 'browser'],
        priority: 6,
        maxConcurrentConnections: 6
      },

      'test-runner-agent': {
        role: 'test-executor',
        requiredCapabilities: ['ci-cd', 'testing', 'automation'],
        preferredServers: ['jenkins', 'circleci', 'githubactions', 'context7'],
        priority: 6,
        maxConcurrentConnections: 5
      },

      // Communication & Documentation Agents
      'documentation-generator': {
        role: 'documentation-specialist',
        requiredCapabilities: ['documentation', 'api-documentation', 'collaboration'],
        preferredServers: ['notion', 'confluence', 'openapi', 'context7'],
        priority: 5,
        maxConcurrentConnections: 4
      },

      'agent-communication-bridge': {
        role: 'communication-coordinator',
        requiredCapabilities: ['messaging', 'notifications', 'collaboration'],
        preferredServers: ['slack', 'discord', 'teams', 'email'],
        priority: 6,
        maxConcurrentConnections: 8
      },

      // Analysis & Intelligence Agents
      'intelligence-analyzer': {
        role: 'analysis-specialist',
        requiredCapabilities: ['data-visualization', 'analytics', 'reasoning'],
        preferredServers: ['tableau', 'powerbi', 'looker', 'perplexity', 'anthropic'],
        priority: 7,
        maxConcurrentConnections: 6
      },

      'complexity-analyzer-agent': {
        role: 'complexity-analyst',
        requiredCapabilities: ['code-analysis', 'metrics-collection', 'reasoning'],
        preferredServers: ['context7', 'sonarqube', 'anthropic', 'prometheus'],
        priority: 6,
        maxConcurrentConnections: 5
      },

      'performance-optimization-engineer': {
        role: 'performance-specialist',
        requiredCapabilities: ['apm', 'performance-monitoring', 'metrics-collection'],
        preferredServers: ['datadog', 'newrelic', 'grafana', 'jaeger', 'zipkin'],
        priority: 7,
        maxConcurrentConnections: 6
      },

      // Specialized Domain Agents
      'sparc-methodology-implementer': {
        role: 'methodology-specialist',
        requiredCapabilities: ['project-management', 'workflow-automation', 'documentation'],
        preferredServers: ['jira', 'asana', 'notion', 'zapier', 'context7'],
        priority: 6,
        maxConcurrentConnections: 5
      },

      'state-persistence-manager': {
        role: 'state-specialist',
        requiredCapabilities: ['caching', 'data-structures', 'embedded-sql'],
        preferredServers: ['redis', 'sqlite', 'postgres', 'vault'],
        priority: 7,
        maxConcurrentConnections: 6
      },

      'resource-scheduler': {
        role: 'resource-manager',
        requiredCapabilities: ['container-management', 'scaling', 'resource-allocation'],
        preferredServers: ['kubernetes', 'docker', 'rancher', 'aws', 'gcp'],
        priority: 7,
        maxConcurrentConnections: 8
      },

      'error-recovery-specialist': {
        role: 'recovery-specialist',
        requiredCapabilities: ['error-tracking', 'monitoring', 'alerting'],
        preferredServers: ['sentry', 'prometheus', 'grafana', 'datadog'],
        priority: 8,
        maxConcurrentConnections: 6
      }
    };

    this.agentProfiles = new Map(Object.entries(profiles));
    console.log(`📋 Loaded ${this.agentProfiles.size} agent profiles`);
  }

  /**
   * Discover all agents in the agents directory
   */
  async discoverAgents() {
    console.log('🔍 Discovering agents...');
    
    if (!fs.existsSync(this.config.agentsPath)) {
      console.warn(`⚠️  Agents path not found: ${this.config.agentsPath}`);
      return;
    }

    const agentFiles = fs.readdirSync(this.config.agentsPath)
      .filter(file => file.endsWith('.md'))
      .map(file => path.basename(file, '.md'))
      .filter(name => !name.startsWith('1-') || name.includes('agent')); // Filter out summary files

    const discoveredAgents = new Set();
    
    agentFiles.forEach(agentName => {
      // Clean up agent name
      const cleanName = agentName.replace(/^1-/, '').replace(/-agent$/, '');
      discoveredAgents.add(cleanName);
      
      // If no profile exists, create a default one
      if (!this.agentProfiles.has(cleanName)) {
        this.agentProfiles.set(cleanName, {
          role: 'general-agent',
          requiredCapabilities: ['code-analysis', 'file-operations'],
          preferredServers: ['context7', 'filesystem', 'http'],
          priority: 5,
          maxConcurrentConnections: 4
        });
      }
    });

    console.log(`🤖 Discovered ${discoveredAgents.size} agents:`, Array.from(discoveredAgents));
  }

  /**
   * Create capability matrix mapping capabilities to servers
   */
  createCapabilityMatrix() {
    console.log('🧩 Creating capability matrix...');
    
    const serverStatus = this.mcpManager.getServerStatus();
    const capabilities = serverStatus.capabilities;
    
    capabilities.forEach(capability => {
      const serversWithCapability = [];
      
      serverStatus.servers.forEach(server => {
        if (server.capabilities.includes(capability)) {
          serversWithCapability.push({
            name: server.name,
            priority: server.priority,
            status: server.status,
            category: server.category
          });
        }
      });
      
      // Sort by priority (higher first)
      serversWithCapability.sort((a, b) => b.priority - a.priority);
      this.capabilityMatrix.set(capability, serversWithCapability);
    });
    
    console.log(`📊 Capability matrix created with ${capabilities.length} capabilities`);
  }

  /**
   * Generate optimal server bindings for each agent
   */
  generateAgentBindings() {
    console.log('🔗 Generating agent bindings...');
    
    for (const [agentName, profile] of this.agentProfiles.entries()) {
      const binding = {
        agentName,
        role: profile.role,
        priority: profile.priority,
        maxConnections: profile.maxConcurrentConnections,
        servers: new Set(),
        capabilities: new Set(),
        bindings: []
      };

      // Handle wildcard access for MCP specialist
      if (profile.preferredServers.includes('*')) {
        const serverStatus = this.mcpManager.getServerStatus();
        serverStatus.servers.forEach(server => {
          if (server.status === 'healthy') {
            binding.servers.add(server.name);
            server.capabilities.forEach(cap => binding.capabilities.add(cap));
          }
        });
      } else {
        // Add preferred servers
        profile.preferredServers.forEach(serverName => {
          const server = this.mcpManager.servers.get(serverName);
          if (server && server.status !== 'error') {
            binding.servers.add(serverName);
            server.capabilities.forEach(cap => binding.capabilities.add(cap));
          }
        });

        // Add servers for required capabilities
        profile.requiredCapabilities.forEach(capability => {
          if (capability === 'all') return; // Skip 'all' capability
          
          const capabilityServers = this.capabilityMatrix.get(capability) || [];
          let addedCount = 0;
          
          for (const server of capabilityServers) {
            if (binding.servers.size < this.config.maxServersPerAgent && 
                addedCount < 3 && // Max 3 servers per capability
                server.status === 'healthy') {
              
              binding.servers.add(server.name);
              binding.capabilities.add(capability);
              addedCount++;
            }
          }
        });
      }

      // Create final bindings list
      binding.bindings = Array.from(binding.servers).map(serverName => {
        const server = this.mcpManager.servers.get(serverName);
        return {
          serverName,
          priority: server ? server.priority : 5,
          capabilities: server ? server.capabilities : [],
          healthCheck: server ? server.healthCheck : 'auto',
          category: server ? server.category : 'unknown'
        };
      }).sort((a, b) => b.priority - a.priority);

      this.agentBindings.set(agentName, {
        ...binding,
        servers: Array.from(binding.servers),
        capabilities: Array.from(binding.capabilities)
      });
    }
    
    console.log(`🔗 Generated bindings for ${this.agentBindings.size} agents`);
  }

  /**
   * Get server access for specific agent
   */
  getServerAccess(agentName, capability = null) {
    const binding = this.agentBindings.get(agentName);
    if (!binding) {
      // Fallback to default servers
      return {
        servers: ['context7', 'filesystem', 'http'],
        primary: 'context7'
      };
    }

    if (capability) {
      // Filter servers by capability
      const capableServers = binding.bindings.filter(b => 
        b.capabilities.includes(capability)
      );
      
      return {
        servers: capableServers.map(s => s.serverName),
        primary: capableServers[0]?.serverName || binding.bindings[0]?.serverName
      };
    }

    return {
      servers: binding.servers,
      primary: binding.bindings[0]?.serverName
    };
  }

  /**
   * Execute tool through agent's optimal server
   */
  async executeToolForAgent(agentName, toolName, params = {}, options = {}) {
    const serverAccess = this.getServerAccess(agentName, options.capability);
    
    // Try servers in order of priority
    for (const serverName of serverAccess.servers) {
      try {
        return await this.mcpManager.executeTool(toolName, params, {
          ...options,
          serverName,
          agentName
        });
      } catch (error) {
        console.warn(`⚠️  Server ${serverName} failed for agent ${agentName}, trying next...`);
        continue;
      }
    }
    
    throw new Error(`No healthy servers available for agent ${agentName} and tool ${toolName}`);
  }

  /**
   * Get agent access statistics
   */
  getAgentStats() {
    const stats = {
      totalAgents: this.agentBindings.size,
      totalBindings: 0,
      agentsByRole: {},
      serverUsage: {},
      capabilityDistribution: {}
    };

    for (const [agentName, binding] of this.agentBindings.entries()) {
      stats.totalBindings += binding.servers.length;
      
      // Count by role
      stats.agentsByRole[binding.role] = (stats.agentsByRole[binding.role] || 0) + 1;
      
      // Count server usage
      binding.servers.forEach(server => {
        stats.serverUsage[server] = (stats.serverUsage[server] || 0) + 1;
      });
      
      // Count capability usage
      binding.capabilities.forEach(capability => {
        stats.capabilityDistribution[capability] = (stats.capabilityDistribution[capability] || 0) + 1;
      });
    }

    return stats;
  }

  /**
   * Save bindings configuration
   */
  async saveBindings() {
    const bindingsConfig = {
      version: '3.0.0',
      generatedAt: new Date().toISOString(),
      totalAgents: this.agentBindings.size,
      
      bindings: Object.fromEntries(this.agentBindings),
      
      capabilityMatrix: Object.fromEntries(this.capabilityMatrix),
      
      stats: this.getAgentStats(),
      
      config: this.config
    };

    const dir = path.dirname(this.config.bindingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.config.bindingsPath,
      JSON.stringify(bindingsConfig, null, 2)
    );

    console.log(`💾 Agent bindings saved to ${this.config.bindingsPath}`);
  }

  /**
   * Generate agent access documentation
   */
  generateAccessDocumentation() {
    let doc = `# MCP Agent Server Access Matrix\n\n`;
    doc += `Generated: ${new Date().toISOString()}\n`;
    doc += `Total Agents: ${this.agentBindings.size}\n\n`;

    doc += `## Agent Bindings Summary\n\n`;
    doc += `| Agent | Role | Servers | Capabilities | Priority |\n`;
    doc += `|-------|------|---------|--------------|----------|\n`;

    for (const [agentName, binding] of this.agentBindings.entries()) {
      doc += `| ${agentName} | ${binding.role} | ${binding.servers.length} | ${binding.capabilities.length} | ${binding.priority} |\n`;
    }

    doc += `\n## Detailed Access Matrix\n\n`;

    for (const [agentName, binding] of this.agentBindings.entries()) {
      doc += `### ${agentName}\n\n`;
      doc += `- **Role:** ${binding.role}\n`;
      doc += `- **Priority:** ${binding.priority}\n`;
      doc += `- **Max Connections:** ${binding.maxConnections}\n`;
      doc += `- **Servers:** ${binding.servers.join(', ')}\n`;
      doc += `- **Capabilities:** ${binding.capabilities.slice(0, 10).join(', ')}${binding.capabilities.length > 10 ? '...' : ''}\n\n`;
      
      if (binding.bindings.length > 0) {
        doc += `#### Server Bindings:\n\n`;
        binding.bindings.slice(0, 10).forEach(server => {
          doc += `- **${server.serverName}** (Priority: ${server.priority}, Category: ${server.category})\n`;
        });
        doc += `\n`;
      }
    }

    return doc;
  }
}

module.exports = MCPAgentBindings;

// CLI usage
if (require.main === module) {
  async function main() {
    const bindings = new MCPAgentBindings();
    
    try {
      await bindings.initialize();
      
      // Generate and save documentation
      const docs = bindings.generateAccessDocumentation();
      const docsPath = path.join(__dirname, '..', 'docs', 'mcp-agent-access-matrix.md');
      const docsDir = path.dirname(docsPath);
      
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      fs.writeFileSync(docsPath, docs);
      console.log(`📚 Documentation saved to ${docsPath}`);
      
      // Display stats
      const stats = bindings.getAgentStats();
      console.log('\n📊 Agent Binding Statistics:');
      console.log(`Total Agents: ${stats.totalAgents}`);
      console.log(`Total Bindings: ${stats.totalBindings}`);
      console.log(`Average Bindings per Agent: ${(stats.totalBindings / stats.totalAgents).toFixed(1)}`);
      console.log('\nTop Server Usage:');
      
      const topServers = Object.entries(stats.serverUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
        
      topServers.forEach(([server, count]) => {
        console.log(`  ${server}: ${count} agents`);
      });
      
    } catch (error) {
      console.error('❌ Failed to create agent bindings:', error);
      process.exit(1);
    }
  }
  
  main();
}