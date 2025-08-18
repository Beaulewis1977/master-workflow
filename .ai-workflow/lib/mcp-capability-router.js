#!/usr/bin/env node

/**
 * MCP Capability Router
 * Intelligent routing system that maps agent tasks to optimal MCP servers
 * based on capabilities, performance, and availability
 */

const fs = require('fs');
const path = require('path');

class MCPCapabilityRouter {
  constructor(mcpManager) {
    this.mcpManager = mcpManager;
    this.routingRules = new Map();
    this.agentProfiles = new Map();
    this.taskPatterns = new Map();
    
    // Load routing configuration
    this.loadRoutingConfiguration();
    this.initializeAgentProfiles();
    this.initializeTaskPatterns();
  }
  
  /**
   * Load routing configuration
   */
  loadRoutingConfiguration() {
    const configPath = path.join(__dirname, '..', 'configs', 'mcp-routing-rules.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.processRoutingRules(config.rules || []);
      } else {
        this.createDefaultRoutingRules();
      }
    } catch (error) {
      console.error('❌ Failed to load routing configuration:', error);
      this.createDefaultRoutingRules();
    }
  }
  
  /**
   * Create default routing rules
   */
  createDefaultRoutingRules() {
    const defaultRules = [
      {
        id: 'code-analysis',
        pattern: /code.*analysis|analyze.*code|review.*code/i,
        capabilities: ['code-analysis', 'documentation', 'refactoring'],
        preferredServers: ['context7', 'github'],
        priority: 10
      },
      {
        id: 'database-operations',
        pattern: /database|sql|query|migration/i,
        capabilities: ['sql-operations', 'schema-management', 'migrations'],
        preferredServers: ['postgres', 'mysql', 'mongodb'],
        priority: 9
      },
      {
        id: 'cloud-deployment',
        pattern: /deploy|cloud|infrastructure|provision/i,
        capabilities: ['deployment', 'cloud-management', 'infrastructure'],
        preferredServers: ['aws', 'gcp', 'azure', 'vercel', 'netlify'],
        priority: 9
      },
      {
        id: 'container-management',
        pattern: /docker|container|kubernetes|orchestration/i,
        capabilities: ['container-management', 'orchestration', 'scaling'],
        preferredServers: ['docker', 'kubernetes', 'rancher'],
        priority: 8
      },
      {
        id: 'ai-ml-operations',
        pattern: /ai|ml|machine learning|model|inference/i,
        capabilities: ['text-generation', 'model-inference', 'embeddings'],
        preferredServers: ['openai', 'anthropic', 'huggingface', 'ollama'],
        priority: 8
      },
      {
        id: 'web-automation',
        pattern: /browser|scrape|web.*automation|selenium|puppeteer/i,
        capabilities: ['web-scraping', 'automation', 'testing'],
        preferredServers: ['browser', 'puppeteer', 'playwright', 'selenium'],
        priority: 7
      },
      {
        id: 'communication',
        pattern: /message|notify|email|slack|discord/i,
        capabilities: ['messaging', 'notifications', 'communication'],
        preferredServers: ['slack', 'discord', 'email', 'twilio'],
        priority: 7
      },
      {
        id: 'monitoring',
        pattern: /monitor|metrics|logs|observability/i,
        capabilities: ['metrics-collection', 'monitoring', 'alerting'],
        preferredServers: ['prometheus', 'grafana', 'datadog', 'sentry'],
        priority: 6
      },
      {
        id: 'security',
        pattern: /security|vulnerability|secrets|encryption/i,
        capabilities: ['security-analysis', 'secrets-management', 'vulnerability-scanning'],
        preferredServers: ['vault', 'snyk', 'sonarqube', '1password'],
        priority: 8
      },
      {
        id: 'file-operations',
        pattern: /file|directory|filesystem|storage/i,
        capabilities: ['file-operations', 'directory-management'],
        preferredServers: ['filesystem', 's3', 'gcp'],
        priority: 6
      }
    ];
    
    defaultRules.forEach(rule => {
      this.routingRules.set(rule.id, rule);
    });
  }
  
  /**
   * Process routing rules from configuration
   */
  processRoutingRules(rules) {
    rules.forEach(rule => {
      if (rule.pattern && typeof rule.pattern === 'string') {
        rule.pattern = new RegExp(rule.pattern, 'i');
      }
      this.routingRules.set(rule.id, rule);
    });
  }
  
  /**
   * Initialize agent profiles for specialized routing
   */
  initializeAgentProfiles() {
    const agentProfiles = {
      'frontend-specialist-agent': {
        preferredCapabilities: ['frontend', 'deployment', 'web-automation'],
        preferredServers: ['vercel', 'netlify', 'browser', 'puppeteer'],
        fallbackServers: ['context7', 'github']
      },
      'backend-engineer-agent': {
        preferredCapabilities: ['api-development', 'database-operations', 'container-management'],
        preferredServers: ['postgres', 'redis', 'docker', 'kubernetes'],
        fallbackServers: ['context7', 'aws']
      },
      'database-architect-agent': {
        preferredCapabilities: ['sql-operations', 'schema-management', 'migrations'],
        preferredServers: ['postgres', 'mysql', 'mongodb', 'redis'],
        fallbackServers: ['sqlite', 'elasticsearch']
      },
      'deployment-engineer-agent': {
        preferredCapabilities: ['deployment', 'cloud-management', 'infrastructure'],
        preferredServers: ['aws', 'gcp', 'azure', 'docker', 'kubernetes'],
        fallbackServers: ['vercel', 'netlify', 'heroku']
      },
      'security-auditor-agent': {
        preferredCapabilities: ['security-analysis', 'vulnerability-scanning', 'secrets-management'],
        preferredServers: ['vault', 'snyk', 'sonarqube', '1password'],
        fallbackServers: ['github', 'gitlab']
      },
      'performance-optimizer-agent': {
        preferredCapabilities: ['monitoring', 'metrics-collection', 'performance-analysis'],
        preferredServers: ['prometheus', 'grafana', 'datadog', 'newrelic'],
        fallbackServers: ['sentry', 'elasticsearch']
      },
      'mcp-integration-specialist': {
        preferredCapabilities: ['all'],
        preferredServers: ['context7', 'filesystem', 'http', 'git'],
        fallbackServers: ['all']
      },
      'api-builder-agent': {
        preferredCapabilities: ['api-development', 'documentation', 'testing'],
        preferredServers: ['openapi', 'context7', 'http'],
        fallbackServers: ['github', 'gitlab']
      },
      'testing-validation-agent': {
        preferredCapabilities: ['testing', 'automation', 'quality-assurance'],
        preferredServers: ['browser', 'puppeteer', 'playwright', 'selenium'],
        fallbackServers: ['context7', 'sonarqube']
      },
      'documentation-generator-agent': {
        preferredCapabilities: ['documentation', 'content-generation'],
        preferredServers: ['context7', 'openapi', 'notion', 'confluence'],
        fallbackServers: ['github', 'gitlab']
      }
    };
    
    Object.entries(agentProfiles).forEach(([agentName, profile]) => {
      this.agentProfiles.set(agentName, profile);
    });
  }
  
  /**
   * Initialize task pattern matching
   */
  initializeTaskPatterns() {
    const taskPatterns = {
      'create-component': {
        capabilities: ['code-analysis', 'frontend', 'documentation'],
        preferredServers: ['context7', 'vercel'],
        complexity: 'medium'
      },
      'setup-database': {
        capabilities: ['database-operations', 'schema-management'],
        preferredServers: ['postgres', 'mysql', 'mongodb'],
        complexity: 'high'
      },
      'deploy-application': {
        capabilities: ['deployment', 'cloud-management', 'container-management'],
        preferredServers: ['aws', 'gcp', 'azure', 'docker'],
        complexity: 'high'
      },
      'run-tests': {
        capabilities: ['testing', 'automation'],
        preferredServers: ['browser', 'puppeteer', 'playwright'],
        complexity: 'medium'
      },
      'security-scan': {
        capabilities: ['security-analysis', 'vulnerability-scanning'],
        preferredServers: ['snyk', 'sonarqube', 'veracode'],
        complexity: 'medium'
      },
      'generate-docs': {
        capabilities: ['documentation', 'content-generation'],
        preferredServers: ['context7', 'openapi', 'notion'],
        complexity: 'low'
      },
      'monitor-performance': {
        capabilities: ['monitoring', 'metrics-collection'],
        preferredServers: ['prometheus', 'grafana', 'datadog'],
        complexity: 'medium'
      },
      'manage-secrets': {
        capabilities: ['secrets-management', 'security'],
        preferredServers: ['vault', '1password', 'bitwarden'],
        complexity: 'high'
      }
    };
    
    Object.entries(taskPatterns).forEach(([pattern, config]) => {
      this.taskPatterns.set(pattern, config);
    });
  }
  
  /**
   * Route request to optimal server
   */
  async routeRequest(request) {
    const {
      agentName,
      taskDescription,
      requiredCapabilities = [],
      preferredServers = [],
      context = {},
      priority = 'normal'
    } = request;
    
    console.log(`🧭 Routing request from ${agentName}: ${taskDescription}`);
    
    // Analyze the request
    const analysis = this.analyzeRequest(request);
    
    // Find matching routing rule
    const routingRule = this.findMatchingRule(taskDescription, requiredCapabilities);
    
    // Get agent profile
    const agentProfile = this.agentProfiles.get(agentName);
    
    // Find optimal server
    const optimalServer = await this.findOptimalServer({
      analysis,
      routingRule,
      agentProfile,
      requiredCapabilities,
      preferredServers,
      priority,
      context
    });
    
    // Generate routing decision
    const routingDecision = {
      selectedServer: optimalServer,
      reasoning: this.generateRoutingReasoning(analysis, routingRule, agentProfile, optimalServer),
      confidence: this.calculateConfidence(analysis, routingRule, agentProfile, optimalServer),
      alternatives: await this.findAlternativeServers(optimalServer, requiredCapabilities),
      metadata: {
        agentName,
        taskDescription,
        routingRule: routingRule?.id,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log(`✅ Routed to server: ${optimalServer} (confidence: ${routingDecision.confidence}%)`);
    
    return routingDecision;
  }
  
  /**
   * Analyze incoming request
   */
  analyzeRequest(request) {
    const { taskDescription, requiredCapabilities, context } = request;
    
    const analysis = {
      taskType: this.identifyTaskType(taskDescription),
      complexity: this.assessComplexity(taskDescription, context),
      urgency: this.assessUrgency(request.priority, context),
      requiredResources: this.assessRequiredResources(requiredCapabilities, context),
      keywords: this.extractKeywords(taskDescription),
      patterns: this.matchTaskPatterns(taskDescription)
    };
    
    return analysis;
  }
  
  /**
   * Identify task type from description
   */
  identifyTaskType(description) {
    const typePatterns = {
      'development': /develop|code|implement|build|create|program/i,
      'deployment': /deploy|release|publish|launch/i,
      'testing': /test|verify|validate|check/i,
      'monitoring': /monitor|observe|track|measure/i,
      'security': /secure|encrypt|audit|scan|vulnerability/i,
      'database': /database|sql|query|migration|schema/i,
      'documentation': /document|doc|readme|guide|manual/i,
      'analysis': /analyze|review|inspect|examine/i,
      'automation': /automate|script|workflow|pipeline/i,
      'communication': /notify|message|email|alert/i
    };
    
    for (const [type, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(description)) {
        return type;
      }
    }
    
    return 'general';
  }
  
  /**
   * Assess task complexity
   */
  assessComplexity(description, context) {
    let score = 0;
    
    // Keywords that indicate complexity
    const complexityIndicators = {
      high: /enterprise|production|scalable|distributed|microservices|kubernetes|aws|infrastructure/i,
      medium: /integration|api|database|deployment|automation|testing/i,
      low: /simple|basic|quick|minimal|prototype/i
    };
    
    if (complexityIndicators.high.test(description)) score += 3;
    if (complexityIndicators.medium.test(description)) score += 2;
    if (complexityIndicators.low.test(description)) score -= 1;
    
    // Context indicators
    if (context.multipleServers) score += 2;
    if (context.realTime) score += 2;
    if (context.highAvailability) score += 3;
    if (context.securityCritical) score += 2;
    
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
  
  /**
   * Assess task urgency
   */
  assessUrgency(priority, context) {
    const urgencyMap = {
      'critical': 'high',
      'high': 'high',
      'urgent': 'high',
      'normal': 'medium',
      'low': 'low',
      'background': 'low'
    };
    
    let urgency = urgencyMap[priority] || 'medium';
    
    // Context overrides
    if (context.deadline && new Date(context.deadline) - new Date() < 3600000) {
      urgency = 'high'; // Less than 1 hour deadline
    }
    
    return urgency;
  }
  
  /**
   * Assess required resources
   */
  assessRequiredResources(capabilities, context) {
    const resources = {
      compute: 'medium',
      memory: 'medium',
      network: 'medium',
      storage: 'medium',
      security: 'medium'
    };
    
    // Adjust based on capabilities
    if (capabilities.includes('model-inference') || capabilities.includes('image-generation')) {
      resources.compute = 'high';
      resources.memory = 'high';
    }
    
    if (capabilities.includes('database-operations') || capabilities.includes('big-data')) {
      resources.memory = 'high';
      resources.storage = 'high';
    }
    
    if (capabilities.includes('real-time') || capabilities.includes('streaming')) {
      resources.network = 'high';
    }
    
    if (capabilities.includes('secrets-management') || capabilities.includes('encryption')) {
      resources.security = 'high';
    }
    
    return resources;
  }
  
  /**
   * Extract keywords from task description
   */
  extractKeywords(description) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should']);
    
    return description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }
  
  /**
   * Match task patterns
   */
  matchTaskPatterns(description) {
    const matches = [];
    
    for (const [pattern, config] of this.taskPatterns.entries()) {
      if (description.toLowerCase().includes(pattern.toLowerCase().replace('-', ' '))) {
        matches.push({ pattern, ...config });
      }
    }
    
    return matches;
  }
  
  /**
   * Find matching routing rule
   */
  findMatchingRule(description, capabilities) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const rule of this.routingRules.values()) {
      let score = 0;
      
      // Pattern matching
      if (rule.pattern && rule.pattern.test(description)) {
        score += rule.priority || 5;
      }
      
      // Capability matching
      if (rule.capabilities) {
        const matchingCapabilities = capabilities.filter(cap => 
          rule.capabilities.includes(cap)
        );
        score += matchingCapabilities.length * 2;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = rule;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Find optimal server based on all criteria
   */
  async findOptimalServer(criteria) {
    const {
      analysis,
      routingRule,
      agentProfile,
      requiredCapabilities,
      preferredServers,
      priority,
      context
    } = criteria;
    
    const candidates = new Set();
    
    // Add servers from routing rule
    if (routingRule?.preferredServers) {
      routingRule.preferredServers.forEach(server => candidates.add(server));
    }
    
    // Add servers from agent profile
    if (agentProfile?.preferredServers) {
      if (agentProfile.preferredServers.includes('all')) {
        // Add all healthy servers
        const healthyServers = Array.from(this.mcpManager.healthStatus.entries())
          .filter(([_, status]) => status === 'healthy')
          .map(([name, _]) => name);
        healthyServers.forEach(server => candidates.add(server));
      } else {
        agentProfile.preferredServers.forEach(server => candidates.add(server));
      }
    }
    
    // Add servers from capability matching
    requiredCapabilities.forEach(capability => {
      const capabilityServers = this.mcpManager.capabilities.get(capability) || [];
      capabilityServers.forEach(server => candidates.add(server));
    });
    
    // Add explicitly preferred servers
    preferredServers.forEach(server => candidates.add(server));
    
    // If no candidates, use fallback logic
    if (candidates.size === 0) {
      const fallbackServer = this.mcpManager.findFallbackServer();
      if (fallbackServer) {
        candidates.add(fallbackServer);
      }
    }
    
    // Score and rank candidates
    const scoredCandidates = await this.scoreCandidates(Array.from(candidates), criteria);
    
    // Return the best candidate
    return scoredCandidates.length > 0 ? scoredCandidates[0].server : null;
  }
  
  /**
   * Score candidate servers
   */
  async scoreCandidates(candidates, criteria) {
    const { analysis, routingRule, agentProfile, priority } = criteria;
    
    const scored = await Promise.all(candidates.map(async serverName => {
      const server = this.mcpManager.servers.get(serverName);
      if (!server) return { server: serverName, score: 0 };
      
      let score = 0;
      
      // Base score from server priority
      score += server.priority * 10;
      
      // Health status bonus
      const healthStatus = this.mcpManager.healthStatus.get(serverName);
      if (healthStatus === 'healthy') score += 50;
      else if (healthStatus === 'unknown') score += 20;
      else score -= 20;
      
      // Performance metrics
      if (server.metrics.averageLatency < 100) score += 20;
      else if (server.metrics.averageLatency < 500) score += 10;
      
      const successRate = server.metrics.successes / Math.max(server.metrics.requests, 1);
      score += successRate * 30;
      
      // Capability matching
      const capabilityMatches = server.capabilities.filter(cap => 
        criteria.requiredCapabilities.includes(cap)
      );
      score += capabilityMatches.length * 15;
      
      // Routing rule preference
      if (routingRule?.preferredServers?.includes(serverName)) {
        score += 25;
      }
      
      // Agent profile preference
      if (agentProfile?.preferredServers?.includes(serverName) || 
          agentProfile?.preferredServers?.includes('all')) {
        score += 20;
      }
      
      // Task complexity matching
      if (analysis.complexity === 'high' && server.priority >= 8) score += 15;
      if (analysis.complexity === 'medium' && server.priority >= 6) score += 10;
      if (analysis.complexity === 'low' && server.priority >= 4) score += 5;
      
      // Urgency bonus for high-priority servers
      if (analysis.urgency === 'high' && server.priority >= 8) score += 10;
      
      // Load balancing - prefer less loaded servers
      const loadFactor = server.connectionPool.active / server.connectionPool.max;
      score += (1 - loadFactor) * 10;
      
      return { server: serverName, score, details: { successRate, capabilityMatches: capabilityMatches.length } };
    }));
    
    // Sort by score descending
    return scored
      .filter(candidate => candidate.score > 0)
      .sort((a, b) => b.score - a.score);
  }
  
  /**
   * Find alternative servers
   */
  async findAlternativeServers(selectedServer, requiredCapabilities, limit = 3) {
    const alternatives = [];
    
    // Find servers with similar capabilities
    const capabilityServers = new Set();
    requiredCapabilities.forEach(capability => {
      const servers = this.mcpManager.capabilities.get(capability) || [];
      servers.forEach(server => {
        if (server !== selectedServer) {
          capabilityServers.add(server);
        }
      });
    });
    
    // Score alternatives
    const scoredAlternatives = await this.scoreCandidates(
      Array.from(capabilityServers),
      { requiredCapabilities, analysis: { complexity: 'medium', urgency: 'medium' } }
    );
    
    return scoredAlternatives.slice(0, limit).map(alt => alt.server);
  }
  
  /**
   * Generate routing reasoning
   */
  generateRoutingReasoning(analysis, routingRule, agentProfile, selectedServer) {
    const reasons = [];
    
    if (routingRule) {
      reasons.push(`Matched routing rule: ${routingRule.id}`);
    }
    
    if (agentProfile) {
      reasons.push(`Agent profile preferences applied`);
    }
    
    const server = this.mcpManager.servers.get(selectedServer);
    if (server) {
      reasons.push(`Server priority: ${server.priority}`);
      reasons.push(`Health status: ${this.mcpManager.healthStatus.get(selectedServer)}`);
      
      if (server.metrics.requests > 0) {
        const successRate = Math.round((server.metrics.successes / server.metrics.requests) * 100);
        reasons.push(`Success rate: ${successRate}%`);
      }
      
      if (server.capabilities.length > 0) {
        reasons.push(`Capabilities: ${server.capabilities.slice(0, 3).join(', ')}`);
      }
    }
    
    return reasons;
  }
  
  /**
   * Calculate routing confidence
   */
  calculateConfidence(analysis, routingRule, agentProfile, selectedServer) {
    let confidence = 50; // Base confidence
    
    if (routingRule) confidence += 20;
    if (agentProfile) confidence += 15;
    
    const server = this.mcpManager.servers.get(selectedServer);
    if (server) {
      const healthStatus = this.mcpManager.healthStatus.get(selectedServer);
      if (healthStatus === 'healthy') confidence += 15;
      else if (healthStatus === 'unknown') confidence += 5;
      else confidence -= 10;
      
      if (server.metrics.requests > 10) {
        const successRate = server.metrics.successes / server.metrics.requests;
        confidence += Math.round(successRate * 10);
      }
    }
    
    return Math.min(Math.max(confidence, 0), 100);
  }
  
  /**
   * Get routing statistics
   */
  getRoutingStatistics() {
    return {
      totalRules: this.routingRules.size,
      totalAgentProfiles: this.agentProfiles.size,
      totalTaskPatterns: this.taskPatterns.size,
      availableCapabilities: Array.from(this.mcpManager.capabilities.keys()),
      healthyServers: Array.from(this.mcpManager.healthStatus.entries())
        .filter(([_, status]) => status === 'healthy')
        .map(([name, _]) => name)
    };
  }
}

module.exports = MCPCapabilityRouter;

// CLI usage
if (require.main === module) {
  const EnhancedMCPManager = require('./enhanced-mcp-manager');
  
  async function main() {
    try {
      const mcpManager = new EnhancedMCPManager();
      await mcpManager.initialize();
      
      const router = new MCPCapabilityRouter(mcpManager);
      
      // Test routing
      const testRequest = {
        agentName: 'frontend-specialist-agent',
        taskDescription: 'Deploy React application to cloud platform',
        requiredCapabilities: ['deployment', 'frontend', 'cloud-management'],
        priority: 'high'
      };
      
      const routingDecision = await router.routeRequest(testRequest);
      
      console.log('\n🧪 Test Routing Decision:');
      console.log(JSON.stringify(routingDecision, null, 2));
      
      const stats = router.getRoutingStatistics();
      console.log('\n📊 Routing Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to test MCP Capability Router:', error);
      process.exit(1);
    }
  }
  
  main();
}