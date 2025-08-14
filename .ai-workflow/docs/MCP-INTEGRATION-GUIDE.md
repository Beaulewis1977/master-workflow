# Enhanced MCP Ecosystem - Integration Guide

## Quick Start

### 1. Using the Enhanced MCP Manager v3.0

```javascript
const EnhancedMCPManagerV3 = require('./lib/enhanced-mcp-manager-v3');

// Initialize with all features enabled
const manager = new EnhancedMCPManagerV3({
  agentBindingsEnabled: true,
  dynamicConfigEnabled: true,
  autoScalingEnabled: true,
  costTrackingEnabled: true
});

await manager.initialize();
```

### 2. Agent-Specific Tool Execution

```javascript
// Execute tool through agent-optimized routing
const result = await manager.executeToolForAgent(
  'neural-swarm-architect',  // Agent name
  'openai',                  // Tool/server name
  { prompt: 'Generate code' }, // Parameters
  { capability: 'text-generation' } // Options
);
```

### 3. Direct Server Access

```javascript
// Execute on specific server with failover
const result = await manager.executeTool(
  'context7',                // Tool name
  { action: 'analyze' },     // Parameters
  { preferredServer: 'context7' } // Options
);
```

## Available MCP Servers (125 Total)

### Core Servers (Always Available)
- **context7** - General-purpose coding (Priority: 10)
- **filesystem** - File operations (Priority: 10)
- **http** - HTTP requests (Priority: 9)
- **git** - Version control (Priority: 9)

### AI/ML Servers (11 Available)
- **openai** - OpenAI GPT models
- **anthropic** - Claude models
- **gemini** - Google Gemini
- **claude_projects** - Claude Projects API
- **huggingface** - Model hub
- **ollama** - Local LLMs
- **langchain** - LangChain framework
- **llamaindex** - LlamaIndex RAG
- **tensorflow** - ML framework
- **pytorch** - Research framework
- **perplexity** - AI search

### Cloud Platforms (10 Available)
- **aws** - Amazon Web Services
- **gcp** - Google Cloud Platform
- **azure** - Microsoft Azure
- **vercel** - Frontend deployment
- **netlify** - Static hosting
- **heroku** - PaaS platform
- **digitalocean** - Cloud infrastructure
- **linode** - VPS hosting
- **vultr** - Cloud compute
- **railway** - Modern deployment

### Databases (10 Available)
- **postgres** - PostgreSQL
- **mysql** - MySQL
- **mongodb** - MongoDB
- **redis** - In-memory database
- **sqlite** - Embedded database
- **elasticsearch** - Search engine
- **cassandra** - NoSQL database
- **neo4j** - Graph database
- **influxdb** - Time-series database
- **couchdb** - Document database

## Agent Server Bindings

### Get Agent's Preferred Servers
```javascript
const binding = manager.agentBindings.get('engine-architect');
console.log(binding.servers); // ['context7', 'github', 'githubactions', ...]
```

### Create Custom Agent Binding
```javascript
const customBinding = await manager.createAgentBinding('my-custom-agent', {
  role: 'data-analyst',
  requiredCapabilities: ['sql-operations', 'data-visualization'],
  preferredServers: ['postgres', 'tableau', 'powerbi'],
  priority: 7,
  maxConnections: 8
});
```

## Server Templates

### Apply Custom Template
```javascript
// Add to mcp-server-templates.json
{
  "my_custom_template": {
    "template": {
      "enabled": true,
      "priority": 8,
      "connectionPool": {
        "minConnections": 2,
        "maxConnections": 12
      },
      "rateLimiting": {
        "enabled": true,
        "requestsPerMinute": 100
      }
    },
    "applicableTo": ["my-server"]
  }
}
```

### Template Selection Rules
```javascript
{
  "templateSelectionRules": [
    {
      "condition": "server.tags.includes('my-category')",
      "template": "my_custom_template"
    }
  ]
}
```

## Health Monitoring

### Check Server Status
```javascript
const status = manager.getStatus();
console.log(`Healthy servers: ${status.healthyServers}/${status.totalServers}`);

// Get specific server health
const serverHealth = manager.healthStatus.get('context7');
console.log(`Context7 status: ${serverHealth}`);
```

### Monitor Server Events
```javascript
manager.on('serverStatusChanged', (serverName, newStatus, oldStatus) => {
  console.log(`Server ${serverName}: ${oldStatus} → ${newStatus}`);
});

manager.on('serverScaled', (serverName, direction, newMaxConnections) => {
  console.log(`Server ${serverName} scaled ${direction} to ${newMaxConnections} connections`);
});
```

## Cost Tracking

### Enable Cost Tracking for AI Servers
```javascript
// In server configuration
{
  "openai": {
    "costTracking": {
      "enabled": true,
      "trackTokens": true,
      "costPerToken": 0.0001,
      "dailyBudget": 100
    }
  }
}

// Get cost statistics
const server = manager.servers.get('openai');
const costs = server.costTracker?.getStats();
console.log(`Daily cost: $${costs.dailyCost.toFixed(2)}`);
```

### Monitor Budget Usage
```javascript
manager.on('budgetExceeded', (serverName, cost) => {
  console.warn(`Server ${serverName} exceeded budget: $${cost.toFixed(2)}`);
});
```

## Performance Optimization

### Connection Pool Statistics
```javascript
const server = manager.servers.get('context7');
const poolStats = server.connectionPool.getStats();
console.log({
  active: poolStats.active,
  idle: poolStats.idle,
  peakConnections: poolStats.metrics.peakConnections
});
```

### Cache Performance
```javascript
const status = manager.getStatus();
const hitRate = (status.cache.hitRate * 100).toFixed(1);
console.log(`Cache hit rate: ${hitRate}%`);
```

### Agent Usage Analytics
```javascript
const agentStats = manager.getAgentUsageStats();
Object.entries(agentStats).forEach(([agent, servers]) => {
  console.log(`${agent}:`);
  Object.entries(servers).forEach(([server, stats]) => {
    console.log(`  ${server}: ${stats.requests} requests, ${(stats.successRate * 100).toFixed(1)}% success`);
  });
});
```

## Configuration Files

### Key Configuration Files
- **`mcp-catalog.json`** - Server definitions (125 servers)
- **`mcp-server-templates.json`** - Dynamic configuration templates
- **`mcp-registry.json`** - Generated server registry
- **`agent-mcp-bindings.json`** - Agent-server bindings (auto-generated)

### Environment Variables for Auth Servers
```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# GitHub
export GITHUB_TOKEN="ghp_..."

# AWS
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."

# Stripe
export STRIPE_API_KEY="sk_..."
```

## Troubleshooting

### Common Issues

1. **Server Unhealthy Due to Missing Credentials**
   - Check environment variables for auth-required servers
   - Servers without credentials will show as 'unhealthy' but won't affect core functionality

2. **Connection Pool Exhausted**
   - Auto-scaling will increase pool size automatically
   - Check server load and consider manual scaling

3. **High Latency**
   - Review server selection strategy
   - Check network connectivity to external services
   - Monitor connection pool utilization

4. **Cost Budget Exceeded**
   - Adjust daily budget in server configuration
   - Implement rate limiting
   - Monitor token usage for AI services

### Debug Mode
```javascript
// Enable verbose logging
const manager = new EnhancedMCPManagerV3({
  loggingLevel: 'debug',
  performanceTracking: true
});
```

## Best Practices

1. **Agent-Specific Execution**
   - Always use `executeToolForAgent()` for optimal routing
   - Let the system choose servers based on capabilities

2. **Cost Management**
   - Set appropriate daily budgets for AI services
   - Monitor token usage regularly
   - Use caching to reduce API calls

3. **Health Monitoring**
   - Check server health before critical operations
   - Implement fallback strategies for unhealthy servers
   - Monitor performance metrics regularly

4. **Configuration Management**
   - Keep server templates updated
   - Review agent bindings periodically
   - Update credentials and configurations as needed

This integration guide provides the foundation for using the Enhanced MCP Ecosystem v3.0 effectively in your autonomous workflow system.