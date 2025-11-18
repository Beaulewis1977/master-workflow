#!/usr/bin/env node

/**
 * Integration Checker
 * Verifies all workflow components are properly integrated
 * Container-aware with fallback mechanisms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class IntegrationChecker {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.isContainer = this.detectContainer();
    this.results = {
      core: {},
      integrations: {},
      connectivity: {},
      health: {},
      recommendations: []
    };
  }

  /**
   * Run complete integration check
   */
  async checkAll() {
    console.log('🔍 Running Integration Checks...\n');
    
    // Check core components
    await this.checkCoreComponents();
    
    // Check external integrations
    await this.checkExternalIntegrations();
    
    // Check connectivity
    await this.checkConnectivity();
    
    // Generate health report
    this.generateHealthReport();
    
    return this.results;
  }

  /**
   * Check core workflow components
   */
  async checkCoreComponents() {
    console.log('📦 Checking Core Components...');
    
    // Check workflow runner
    this.results.core.workflowRunner = fs.existsSync(
      path.join(this.projectPath, 'workflow-runner.js')
    ) || fs.existsSync(
      path.join(this.projectPath, '.ai-workflow', 'workflow-runner.js')
    );
    
    // Check intelligence engine
    this.results.core.intelligenceEngine = fs.existsSync(
      path.join(this.projectPath, 'intelligence-engine')
    );
    
    // Check complexity analyzer
    this.results.core.complexityAnalyzer = fs.existsSync(
      path.join(this.projectPath, 'intelligence-engine', 'complexity-analyzer.js')
    );
    
    // Check document customizer
    this.results.core.documentCustomizer = fs.existsSync(
      path.join(this.projectPath, 'intelligence-engine', 'document-customizer.js')
    );
    
    // Check engine API
    this.results.core.engineAPI = await this.checkEngineAPI();
    
    console.log(`  ✓ Core components: ${Object.values(this.results.core).filter(Boolean).length}/${Object.keys(this.results.core).length}`);
  }

  /**
   * Check external tool integrations
   */
  async checkExternalIntegrations() {
    console.log('🔗 Checking External Integrations...');
    
    // Check Claude Code
    this.results.integrations.claudeCode = await this.checkClaudeCode();
    
    // Check Agent-OS
    this.results.integrations.agentOS = await this.checkAgentOS();
    
    // Check Claude Flow
    this.results.integrations.claudeFlow = await this.checkClaudeFlow();
    
    // Check TMux Orchestrator
    this.results.integrations.tmux = await this.checkTMux();
    
    // Check MCP servers
    this.results.integrations.mcp = await this.checkMCPServers();
    
    console.log(`  ✓ Integrations: ${Object.values(this.results.integrations).filter(Boolean).length}/${Object.keys(this.results.integrations).length}`);
  }

  /**
   * Check connectivity between components
   */
  async checkConnectivity() {
    console.log('🌐 Checking Connectivity...');
    
    // Check API connectivity
    this.results.connectivity.api = await this.checkAPIConnectivity();
    
    // Check port availability
    this.results.connectivity.ports = await this.checkPorts();
    
    // Check file permissions
    this.results.connectivity.permissions = await this.checkPermissions();
    
    // Check container-host bridge if in container
    if (this.isContainer) {
      this.results.connectivity.containerBridge = await this.checkContainerBridge();
    }
    
    console.log(`  ✓ Connectivity: ${Object.values(this.results.connectivity).filter(Boolean).length}/${Object.keys(this.results.connectivity).length}`);
  }

  /**
   * Check if Claude Code is available
   */
  async checkClaudeCode() {
    // Check for Claude settings
    const hasSettings = fs.existsSync(path.join(this.projectPath, '.claude', 'settings.json'));
    
    // Check for agents
    const hasAgents = fs.existsSync(path.join(this.projectPath, '.claude', 'agents'));
    
    // Check for CLAUDE.md
    const hasClaudeMd = fs.existsSync(path.join(this.projectPath, '.claude', 'CLAUDE.md')) ||
                        fs.existsSync(path.join(this.projectPath, 'CLAUDE.md'));
    
    // Try to detect Claude command availability
    let hasCommand = false;
    try {
      if (this.isContainer) {
        // In container, check if host has Claude
        hasCommand = process.env.CLAUDE_AVAILABLE === 'true';
      } else {
        execSync('which claude', { stdio: 'pipe' });
        hasCommand = true;
      }
    } catch (e) {
      // Claude command not found
    }
    
    const isAvailable = hasSettings || hasAgents || hasClaudeMd || hasCommand;
    
    if (!isAvailable && !this.isContainer) {
      this.results.recommendations.push('Install Claude Code for enhanced AI assistance');
    }
    
    return isAvailable;
  }

  /**
   * Check if Agent-OS is available
   */
  async checkAgentOS() {
    const hasConfig = fs.existsSync(path.join(this.projectPath, '.agent-os', 'agentOS-config.json'));
    const hasInstructions = fs.existsSync(path.join(this.projectPath, '.agent-os', 'instructions'));
    
    const isAvailable = hasConfig || hasInstructions;
    
    if (!isAvailable) {
      this.results.recommendations.push('Configure Agent-OS for enhanced orchestration');
    }
    
    return isAvailable;
  }

  /**
   * Check if Claude Flow is available
   */
  async checkClaudeFlow() {
    const hasConfig = fs.existsSync(path.join(this.projectPath, '.claude-flow'));
    const hasHiveMind = fs.existsSync(path.join(this.projectPath, '.hive-mind'));
    
    // Check if npx claude-flow works
    let hasCommand = false;
    try {
      execSync('npx claude-flow@alpha --version', { stdio: 'pipe', timeout: 5000 });
      hasCommand = true;
    } catch (e) {
      // Command not available
    }
    
    const isAvailable = hasConfig || hasHiveMind || hasCommand;
    
    if (!isAvailable) {
      this.results.recommendations.push('Claude Flow 2.0 not detected - workflow orchestration limited');
    }
    
    return isAvailable;
  }

  /**
   * Check if TMux is available
   */
  async checkTMux() {
    const hasConfig = fs.existsSync(path.join(this.projectPath, '.tmux-orchestrator'));
    
    // Check tmux command
    let hasCommand = false;
    try {
      execSync('which tmux', { stdio: 'pipe' });
      hasCommand = true;
    } catch (e) {
      // TMux not installed
    }
    
    return hasConfig || hasCommand;
  }

  /**
   * Check MCP server availability
   */
  async checkMCPServers() {
    const mcpRegistry = path.join(this.projectPath, '.ai-workflow', 'configs', 'mcp-registry.json');
    
    if (fs.existsSync(mcpRegistry)) {
      try {
        const registry = JSON.parse(fs.readFileSync(mcpRegistry, 'utf8'));
        return registry.servers && Object.keys(registry.servers).length > 0;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Check Engine API health
   */
  async checkEngineAPI() {
    const port = process.env.MW_ENGINE_PORT || 13800;
    
    try {
      // Simple check if port is in use
      execSync(`lsof -i:${port}`, { stdio: 'pipe' });
      return true;
    } catch (e) {
      // Port not in use, API likely not running
      this.results.recommendations.push(`Start Engine API: cd engine && npm start (port ${port})`);
      return false;
    }
  }

  /**
   * Check API connectivity
   */
  async checkAPIConnectivity() {
    const port = process.env.MW_ENGINE_PORT || 13800;
    
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check port availability
   */
  async checkPorts() {
    const ports = {
      engine: 13800,
      dashboard: 8787
    };
    
    let allAvailable = true;
    
    for (const [service, port] of Object.entries(ports)) {
      try {
        execSync(`lsof -i:${port}`, { stdio: 'pipe' });
        // Port is in use (good if it's our service)
      } catch (e) {
        // Port is free
        if (service === 'engine') {
          allAvailable = false;
        }
      }
    }
    
    return allAvailable;
  }

  /**
   * Check file permissions
   */
  async checkPermissions() {
    const criticalPaths = [
      'workflow-runner.js',
      'ai-workflow',
      'intelligence-engine/complexity-analyzer.js'
    ];
    
    for (const file of criticalPaths) {
      const fullPath = path.join(this.projectPath, file);
      if (fs.existsSync(fullPath)) {
        try {
          fs.accessSync(fullPath, fs.constants.R_OK | fs.constants.X_OK);
        } catch (e) {
          this.results.recommendations.push(`Fix permissions for ${file}: chmod +x ${file}`);
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Check container-host bridge
   */
  async checkContainerBridge() {
    // Check if we can communicate with host
    const canReachHost = process.env.HOST_AVAILABLE === 'true';
    
    if (!canReachHost) {
      this.results.recommendations.push('Configure host-container bridge for full integration');
    }
    
    return canReachHost;
  }

  /**
   * Detect if running in container
   */
  detectContainer() {
    return process.env.CONTAINER === 'true' ||
           fs.existsSync('/.dockerenv') ||
           fs.existsSync('/run/.containerenv') ||
           process.env.REMOTE_CONTAINERS === 'true' ||
           process.env.CODESPACES === 'true';
  }

  /**
   * Generate health report
   */
  generateHealthReport() {
    const coreHealth = Object.values(this.results.core).filter(Boolean).length / Object.keys(this.results.core).length;
    const integrationHealth = Object.values(this.results.integrations).filter(Boolean).length / Object.keys(this.results.integrations).length;
    const connectivityHealth = Object.values(this.results.connectivity).filter(Boolean).length / Object.keys(this.results.connectivity).length;
    
    this.results.health = {
      overall: Math.round((coreHealth + integrationHealth + connectivityHealth) / 3 * 100),
      core: Math.round(coreHealth * 100),
      integrations: Math.round(integrationHealth * 100),
      connectivity: Math.round(connectivityHealth * 100),
      status: this.getHealthStatus((coreHealth + integrationHealth + connectivityHealth) / 3)
    };
  }

  /**
   * Get health status description
   */
  getHealthStatus(score) {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.5) return 'Fair';
    if (score >= 0.3) return 'Poor';
    return 'Critical';
  }

  /**
   * Print report to console
   */
  printReport() {
    console.log('\n' + '='.repeat(50));
    console.log('INTEGRATION HEALTH REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n📊 Overall Health: ${this.results.health.overall}% (${this.results.health.status})`);
    console.log(`  Core Systems: ${this.results.health.core}%`);
    console.log(`  Integrations: ${this.results.health.integrations}%`);
    console.log(`  Connectivity: ${this.results.health.connectivity}%`);
    
    if (this.isContainer) {
      console.log('\n🐳 Running in Container Environment');
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// CLI execution
if (require.main === module) {
  const checker = new IntegrationChecker();
  
  checker.checkAll().then(results => {
    checker.printReport();
    
    // Output JSON if requested
    if (process.argv.includes('--json')) {
      console.log('\nJSON Output:');
      console.log(JSON.stringify(results, null, 2));
    }
    
    // Exit with error if health is poor
    if (results.health.overall < 50) {
      process.exit(1);
    }
  });
}

module.exports = IntegrationChecker;