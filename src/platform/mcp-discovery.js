/**
 * Cross-Platform MCP Discovery System for Claude Flow 2.0
 * Universal MCP server discovery and management across Windows, macOS, and Linux
 * Supports 125+ MCP servers with platform-specific optimizations
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const { EventEmitter } = require('events');
const PlatformDetector = require('./platform-detector');
const pathHandler = require('./path-handler').default;

const execAsync = promisify(exec);

/**
 * Cross-Platform MCP Discovery and Management System
 */
class MCPDiscoverySystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      discoveryInterval: options.discoveryInterval || 300000, // 5 minutes
      healthCheckInterval: options.healthCheckInterval || 60000, // 1 minute
      cacheTimeout: options.cacheTimeout || 600000, // 10 minutes
      maxRetries: options.maxRetries || 3,
      requestTimeout: options.requestTimeout || 30000,
      enableAutoDiscovery: options.enableAutoDiscovery !== false,
      ...options
    };

    this.platformDetector = new PlatformDetector();
    this.platform = null;
    this.discoveredServers = new Map();
    this.activeServers = new Map();
    this.serverHealth = new Map();
    this.discoveryCache = new Map();
    this.isInitialized = false;
    this.discoveryTimer = null;
    this.healthTimer = null;
  }

  /**
   * Initialize the MCP discovery system
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('🔍 Initializing Cross-Platform MCP Discovery System...');
    
    this.platform = await this.platformDetector.initialize();
    await this.loadServerCatalog();
    await this.setupPlatformPaths();
    
    if (this.options.enableAutoDiscovery) {
      await this.startAutoDiscovery();
    }

    this.isInitialized = true;
    console.log(`✅ MCP Discovery System initialized for ${this.platformDetector.getPlatformDisplay()}`);
    
    this.emit('initialized');
  }

  /**
   * Discover all available MCP servers
   * @returns {Promise<Map>} Map of discovered servers
   */
  async discoverServers() {
    await this.ensureInitialized();
    
    console.log('🔎 Starting comprehensive MCP server discovery...');
    
    const discoveryTasks = [
      this.discoverNpmMcpServers(),
      this.discoverLocalMcpServers(),
      this.discoverSystemMcpServers(),
      this.discoverCustomMcpServers(),
      this.discoverKnownMcpServers()
    ];

    const results = await Promise.allSettled(discoveryTasks);
    
    // Merge all discovery results
    const allServers = new Map();
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        result.value.forEach((server, key) => {
          allServers.set(key, server);
        });
      } else {
        console.warn(`Discovery task ${index} failed:`, result.reason);
      }
    });

    // Validate and categorize servers
    const validatedServers = await this.validateDiscoveredServers(allServers);
    
    // Update internal state
    this.discoveredServers = validatedServers;
    this.emit('serversDiscovered', validatedServers);
    
    console.log(`✅ Discovered ${validatedServers.size} MCP servers`);
    
    return validatedServers;
  }

  /**
   * Start automatic discovery and health monitoring
   */
  async startAutoDiscovery() {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
    }
    
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
    }

    // Initial discovery
    await this.discoverServers();

    // Setup periodic discovery
    this.discoveryTimer = setInterval(async () => {
      try {
        await this.discoverServers();
      } catch (error) {
        console.error('Auto-discovery failed:', error);
        this.emit('discoveryError', error);
      }
    }, this.options.discoveryInterval);

    // Setup health monitoring
    this.healthTimer = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        console.error('Health check failed:', error);
        this.emit('healthCheckError', error);
      }
    }, this.options.healthCheckInterval);

    console.log('🚀 Auto-discovery and health monitoring started');
  }

  /**
   * Stop automatic discovery and health monitoring
   */
  stopAutoDiscovery() {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
    
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    
    console.log('⏹️ Auto-discovery stopped');
  }

  /**
   * Get server by name with fallback options
   * @param {string} serverName - Server name
   * @param {boolean} includeAliases - Include server aliases
   * @returns {object|null} Server configuration
   */
  getServer(serverName, includeAliases = true) {
    // Direct lookup
    let server = this.discoveredServers.get(serverName);
    if (server) return server;

    if (includeAliases) {
      // Search by aliases
      for (const [key, serverConfig] of this.discoveredServers) {
        if (serverConfig.aliases && serverConfig.aliases.includes(serverName)) {
          return serverConfig;
        }
      }

      // Search by npm package name
      for (const [key, serverConfig] of this.discoveredServers) {
        if (serverConfig.npmPackage === serverName) {
          return serverConfig;
        }
      }
    }

    return null;
  }

  /**
   * Get servers by category
   * @param {string} category - Server category
   * @returns {Map} Servers in category
   */
  getServersByCategory(category) {
    const categoryServers = new Map();
    
    for (const [key, server] of this.discoveredServers) {
      if (server.category === category) {
        categoryServers.set(key, server);
      }
    }
    
    return categoryServers;
  }

  /**
   * Get server health status
   * @param {string} serverName - Server name
   * @returns {object|null} Health status
   */
  getServerHealth(serverName) {
    return this.serverHealth.get(serverName) || null;
  }

  /**
   * Test server connectivity
   * @param {string} serverName - Server name
   * @returns {Promise<object>} Connection test result
   */
  async testServerConnection(serverName) {
    const server = this.getServer(serverName);
    if (!server) {
      throw new Error(`Server not found: ${serverName}`);
    }

    const testResult = {
      serverName,
      timestamp: new Date().toISOString(),
      success: false,
      latency: null,
      error: null,
      capabilities: []
    };

    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      const connectionTest = await this.performConnectionTest(server);
      testResult.latency = Date.now() - startTime;
      
      if (connectionTest.success) {
        testResult.success = true;
        testResult.capabilities = connectionTest.capabilities;
        
        // Update health status
        this.serverHealth.set(serverName, {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          latency: testResult.latency,
          capabilities: testResult.capabilities
        });
      } else {
        testResult.error = connectionTest.error;
        this.serverHealth.set(serverName, {
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          error: testResult.error
        });
      }
    } catch (error) {
      testResult.error = error.message;
      this.serverHealth.set(serverName, {
        status: 'error',
        lastCheck: new Date().toISOString(),
        error: error.message
      });
    }

    return testResult;
  }

  /**
   * Get comprehensive status report
   * @returns {object} System status
   */
  getStatus() {
    const totalServers = this.discoveredServers.size;
    const activeServers = Array.from(this.activeServers.keys()).length;
    const healthyServers = Array.from(this.serverHealth.values())
      .filter(health => health.status === 'healthy').length;

    const categoryCounts = {};
    for (const [key, server] of this.discoveredServers) {
      categoryCounts[server.category] = (categoryCounts[server.category] || 0) + 1;
    }

    return {
      timestamp: new Date().toISOString(),
      platform: this.platformDetector.getPlatformDisplay(),
      discovery: {
        totalServers,
        activeServers,
        healthyServers,
        categoryCounts,
        lastDiscovery: this.lastDiscoveryTime
      },
      health: {
        overall: healthyServers / totalServers,
        byCategory: this.getHealthByCategory(),
        issues: this.getHealthIssues()
      },
      performance: {
        averageLatency: this.getAverageLatency(),
        fastestServer: this.getFastestServer(),
        slowestServer: this.getSlowestServer()
      }
    };
  }

  // Private methods for server discovery

  /**
   * Discover NPM-based MCP servers
   * @private
   */
  async discoverNpmMcpServers() {
    const servers = new Map();
    
    try {
      // Check global npm packages
      const globalResult = await this.executeWithTimeout('npm list -g --depth=0 --json', 10000);
      if (globalResult.success) {
        const globalPackages = JSON.parse(globalResult.stdout || '{}');
        this.extractMcpServersFromNpm(globalPackages.dependencies || {}, servers, 'global');
      }
    } catch (error) {
      console.warn('Failed to discover global npm MCP servers:', error.message);
    }

    try {
      // Check local npm packages
      const localResult = await this.executeWithTimeout('npm list --depth=0 --json', 10000);
      if (localResult.success) {
        const localPackages = JSON.parse(localResult.stdout || '{}');
        this.extractMcpServersFromNpm(localPackages.dependencies || {}, servers, 'local');
      }
    } catch (error) {
      console.warn('Failed to discover local npm MCP servers:', error.message);
    }

    return servers;
  }

  /**
   * Discover local MCP servers in common paths
   * @private
   */
  async discoverLocalMcpServers() {
    const servers = new Map();
    const searchPaths = this.getLocalSearchPaths();

    for (const searchPath of searchPaths) {
      try {
        const expandedPath = pathHandler.expandTilde(pathHandler.expandVars(searchPath));
        
        if (await pathHandler.exists(expandedPath)) {
          const localServers = await this.scanDirectoryForMcpServers(expandedPath);
          localServers.forEach((server, key) => servers.set(key, server));
        }
      } catch (error) {
        console.warn(`Failed to scan ${searchPath}:`, error.message);
      }
    }

    return servers;
  }

  /**
   * Discover system-installed MCP servers
   * @private
   */
  async discoverSystemMcpServers() {
    const servers = new Map();
    const systemPaths = this.getSystemSearchPaths();

    for (const systemPath of systemPaths) {
      try {
        if (await pathHandler.exists(systemPath)) {
          const systemServers = await this.scanDirectoryForMcpServers(systemPath);
          systemServers.forEach((server, key) => servers.set(key, server));
        }
      } catch (error) {
        console.warn(`Failed to scan system path ${systemPath}:`, error.message);
      }
    }

    return servers;
  }

  /**
   * Discover custom MCP servers from configuration
   * @private
   */
  async discoverCustomMcpServers() {
    const servers = new Map();
    
    // Check for custom server configurations
    const configPaths = pathHandler.getConfigPaths();
    const customConfigPath = pathHandler.join(configPaths.config, 'custom-mcp-servers.json');
    
    try {
      if (await pathHandler.exists(customConfigPath)) {
        const configData = await fs.readFile(customConfigPath, 'utf8');
        const customServers = JSON.parse(configData);
        
        for (const [key, serverConfig] of Object.entries(customServers)) {
          servers.set(key, {
            ...serverConfig,
            type: 'custom',
            source: 'configuration'
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load custom MCP servers:', error.message);
    }

    return servers;
  }

  /**
   * Discover known MCP servers from catalog
   * @private
   */
  async discoverKnownMcpServers() {
    const servers = new Map();
    
    // Test known servers from our catalog
    if (this.serverCatalog) {
      for (const [category, categoryServers] of Object.entries(this.serverCatalog.categories)) {
        for (const [serverName, serverConfig] of Object.entries(categoryServers.servers)) {
          const fullServerConfig = {
            name: serverName,
            category: category,
            type: 'catalog',
            source: 'mcp-catalog',
            ...serverConfig,
            npmPackage: this.getNpmPackageName(serverName, serverConfig),
            command: this.buildServerCommand(serverName, serverConfig)
          };
          
          servers.set(serverName, fullServerConfig);
        }
      }
    }

    return servers;
  }

  /**
   * Validate discovered servers
   * @private
   * @param {Map} servers - Discovered servers
   * @returns {Promise<Map>} Validated servers
   */
  async validateDiscoveredServers(servers) {
    const validatedServers = new Map();
    const validationPromises = [];

    for (const [key, server] of servers) {
      validationPromises.push(
        this.validateServer(key, server).then(validationResult => {
          if (validationResult.isValid) {
            validatedServers.set(key, {
              ...server,
              validation: validationResult,
              discoveredAt: new Date().toISOString()
            });
          }
        }).catch(error => {
          console.warn(`Validation failed for ${key}:`, error.message);
        })
      );
    }

    await Promise.allSettled(validationPromises);
    return validatedServers;
  }

  /**
   * Validate individual server
   * @private
   * @param {string} serverName - Server name
   * @param {object} serverConfig - Server configuration
   * @returns {Promise<object>} Validation result
   */
  async validateServer(serverName, serverConfig) {
    const validation = {
      isValid: false,
      hasExecutable: false,
      hasConfiguration: false,
      isAccessible: false,
      errors: []
    };

    try {
      // Check if executable/command exists
      if (serverConfig.command) {
        const commandTest = await this.testCommand(serverConfig.command);
        validation.hasExecutable = commandTest.success;
        if (!commandTest.success) {
          validation.errors.push(`Command not found: ${serverConfig.command}`);
        }
      }

      // Check npm package if specified
      if (serverConfig.npmPackage) {
        const packageTest = await this.testNpmPackage(serverConfig.npmPackage);
        validation.hasConfiguration = packageTest.exists;
        if (!packageTest.exists) {
          validation.errors.push(`NPM package not found: ${serverConfig.npmPackage}`);
        }
      }

      // Simple accessibility test
      if (validation.hasExecutable || validation.hasConfiguration) {
        validation.isAccessible = true;
      }

      // Mark as valid if basic criteria are met
      validation.isValid = validation.isAccessible && validation.errors.length === 0;

    } catch (error) {
      validation.errors.push(error.message);
    }

    return validation;
  }

  /**
   * Perform health checks on all servers
   * @private
   */
  async performHealthChecks() {
    const healthPromises = [];
    
    for (const [serverName] of this.discoveredServers) {
      healthPromises.push(
        this.testServerConnection(serverName).catch(error => {
          console.warn(`Health check failed for ${serverName}:`, error.message);
        })
      );
    }

    await Promise.allSettled(healthPromises);
    this.emit('healthCheckCompleted', this.serverHealth);
  }

  /**
   * Perform connection test for a server
   * @private
   * @param {object} server - Server configuration
   * @returns {Promise<object>} Connection test result
   */
  async performConnectionTest(server) {
    if (server.npmPackage) {
      return await this.testNpmMcpServer(server);
    } else if (server.command) {
      return await this.testCommandMcpServer(server);
    } else {
      return { success: false, error: 'No testable configuration found' };
    }
  }

  /**
   * Test NPM-based MCP server
   * @private
   */
  async testNpmMcpServer(server) {
    try {
      const command = `npx --yes ${server.npmPackage} --version`;
      const result = await this.executeWithTimeout(command, 15000);
      
      return {
        success: result.success,
        capabilities: server.capabilities || [],
        version: result.success ? result.stdout.trim() : null,
        error: result.success ? null : result.error
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test command-based MCP server
   * @private
   */
  async testCommandMcpServer(server) {
    try {
      const result = await this.executeWithTimeout(`${server.command} --help`, 10000);
      
      return {
        success: result.success,
        capabilities: server.capabilities || [],
        error: result.success ? null : result.error
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Utility methods

  /**
   * Load server catalog from configuration
   * @private
   */
  async loadServerCatalog() {
    try {
      const catalogPath = pathHandler.join(__dirname, '../../.ai-workflow/configs/mcp-catalog.json');
      if (await pathHandler.exists(catalogPath)) {
        const catalogData = await fs.readFile(catalogPath, 'utf8');
        this.serverCatalog = JSON.parse(catalogData);
        console.log(`📚 Loaded catalog with ${this.serverCatalog.totalServers} servers`);
      }
    } catch (error) {
      console.warn('Failed to load MCP server catalog:', error.message);
    }
  }

  /**
   * Setup platform-specific paths
   * @private
   */
  async setupPlatformPaths() {
    this.searchPaths = {
      local: this.getLocalSearchPaths(),
      system: this.getSystemSearchPaths(),
      npm: this.getNpmSearchPaths()
    };
  }

  /**
   * Get local search paths
   * @private
   */
  getLocalSearchPaths() {
    const configPaths = pathHandler.getConfigPaths();
    
    const paths = [
      pathHandler.join(configPaths.config, 'mcp-servers'),
      pathHandler.join(configPaths.data, 'mcp-servers'),
      '~/.mcp/servers',
      './mcp-servers',
      './node_modules/@mcp',
      './node_modules/@modelcontextprotocol'
    ];

    // Add platform-specific paths
    if (this.platformDetector.isWindows()) {
      paths.push(
        pathHandler.join(process.env.APPDATA, 'mcp-servers'),
        pathHandler.join(process.env.LOCALAPPDATA, 'mcp-servers')
      );
    } else if (this.platformDetector.isMacOS()) {
      paths.push(
        '~/Library/Application Support/mcp-servers',
        '/usr/local/lib/mcp-servers'
      );
    } else {
      paths.push(
        '~/.local/share/mcp-servers',
        '/usr/local/lib/mcp-servers',
        '/opt/mcp-servers'
      );
    }

    return paths;
  }

  /**
   * Get system search paths
   * @private
   */
  getSystemSearchPaths() {
    if (this.platformDetector.isWindows()) {
      return [
        'C:\\Program Files\\mcp-servers',
        'C:\\ProgramData\\mcp-servers'
      ];
    } else if (this.platformDetector.isMacOS()) {
      return [
        '/Applications/mcp-servers',
        '/usr/local/bin',
        '/opt/homebrew/lib/mcp-servers'
      ];
    } else {
      return [
        '/usr/lib/mcp-servers',
        '/usr/local/lib/mcp-servers',
        '/opt/mcp-servers',
        '/var/lib/mcp-servers'
      ];
    }
  }

  /**
   * Get NPM search paths
   * @private
   */
  getNpmSearchPaths() {
    const paths = [];
    
    try {
      // Global npm path
      const globalPath = require('child_process').execSync('npm config get prefix', { encoding: 'utf8' }).trim();
      paths.push(pathHandler.join(globalPath, 'node_modules'));
    } catch (error) {
      // Fallback paths
      if (this.platformDetector.isWindows()) {
        paths.push(pathHandler.join(process.env.APPDATA, 'npm', 'node_modules'));
      } else {
        paths.push('/usr/local/lib/node_modules');
      }
    }
    
    return paths;
  }

  /**
   * Extract MCP servers from npm list output
   * @private
   */
  extractMcpServersFromNpm(dependencies, servers, scope) {
    for (const [packageName, packageInfo] of Object.entries(dependencies)) {
      if (this.isMcpPackage(packageName)) {
        const serverName = this.extractServerName(packageName);
        servers.set(serverName, {
          name: serverName,
          npmPackage: packageName,
          version: packageInfo.version,
          type: 'npm',
          scope: scope,
          source: 'npm-discovery',
          category: this.inferCategory(packageName),
          command: `npx ${packageName}`
        });
      }
    }
  }

  /**
   * Check if package is an MCP server
   * @private
   */
  isMcpPackage(packageName) {
    const mcpPatterns = [
      /^@modelcontextprotocol\/server-/,
      /^@mcp\//,
      /-mcp$/,
      /-mcp-server$/,
      /^mcp-/,
      /^claude-mcp-/
    ];
    
    return mcpPatterns.some(pattern => pattern.test(packageName));
  }

  /**
   * Extract server name from package name
   * @private
   */
  extractServerName(packageName) {
    return packageName
      .replace(/^@modelcontextprotocol\/server-/, '')
      .replace(/^@mcp\//, '')
      .replace(/-mcp$/, '')
      .replace(/-mcp-server$/, '')
      .replace(/^mcp-/, '')
      .replace(/^claude-mcp-/, '');
  }

  /**
   * Infer category from package name
   * @private
   */
  inferCategory(packageName) {
    const categoryMap = {
      'filesystem': 'core',
      'git': 'core',
      'http': 'core',
      'github': 'development',
      'gitlab': 'development',
      'docker': 'containerization',
      'kubernetes': 'containerization',
      'aws': 'cloud',
      'gcp': 'cloud',
      'azure': 'cloud',
      'postgres': 'databases',
      'mysql': 'databases',
      'mongodb': 'databases',
      'redis': 'databases'
    };
    
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (packageName.includes(keyword)) {
        return category;
      }
    }
    
    return 'utilities';
  }

  /**
   * Scan directory for MCP servers
   * @private
   */
  async scanDirectoryForMcpServers(dirPath) {
    const servers = new Map();
    
    try {
      const entries = await pathHandler.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const serverPath = pathHandler.join(dirPath, entry.name);
          const server = await this.identifyMcpServer(serverPath, entry.name);
          if (server) {
            servers.set(entry.name, server);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error.message);
    }
    
    return servers;
  }

  /**
   * Identify MCP server in directory
   * @private
   */
  async identifyMcpServer(serverPath, serverName) {
    const indicators = [
      'package.json',
      'mcp.json',
      'server.js',
      'index.js',
      'main.py',
      'server.py'
    ];
    
    for (const indicator of indicators) {
      const indicatorPath = pathHandler.join(serverPath, indicator);
      if (await pathHandler.exists(indicatorPath)) {
        return {
          name: serverName,
          path: serverPath,
          type: 'local',
          source: 'directory-scan',
          category: 'custom',
          configFile: indicator
        };
      }
    }
    
    return null;
  }

  /**
   * Get NPM package name for server
   * @private
   */
  getNpmPackageName(serverName, serverConfig) {
    if (serverConfig.npmPackage) {
      return serverConfig.npmPackage;
    }
    
    // Generate likely npm package name
    return `@modelcontextprotocol/server-${serverName}`;
  }

  /**
   * Build server command
   * @private
   */
  buildServerCommand(serverName, serverConfig) {
    if (serverConfig.command) {
      return serverConfig.command;
    }
    
    const npmPackage = this.getNpmPackageName(serverName, serverConfig);
    return `npx --yes ${npmPackage}`;
  }

  /**
   * Test command existence
   * @private
   */
  async testCommand(command) {
    try {
      const testCommand = this.platformDetector.isWindows() 
        ? `where ${command.split(' ')[0]}`
        : `which ${command.split(' ')[0]}`;
      
      const result = await this.executeWithTimeout(testCommand, 5000);
      return { success: result.success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test NPM package existence
   * @private
   */
  async testNpmPackage(packageName) {
    try {
      const result = await this.executeWithTimeout(`npm view ${packageName} version`, 5000);
      return { exists: result.success };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Execute command with timeout
   * @private
   */
  async executeWithTimeout(command, timeout) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        maxBuffer: 1024 * 1024 // 1MB
      });
      
      return {
        success: true,
        stdout: stdout || '',
        stderr: stderr || ''
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  /**
   * Get health by category
   * @private
   */
  getHealthByCategory() {
    const categoryHealth = {};
    
    for (const [serverName, server] of this.discoveredServers) {
      const category = server.category;
      const health = this.serverHealth.get(serverName);
      
      if (!categoryHealth[category]) {
        categoryHealth[category] = { total: 0, healthy: 0 };
      }
      
      categoryHealth[category].total++;
      if (health && health.status === 'healthy') {
        categoryHealth[category].healthy++;
      }
    }
    
    return categoryHealth;
  }

  /**
   * Get health issues
   * @private
   */
  getHealthIssues() {
    const issues = [];
    
    for (const [serverName, health] of this.serverHealth) {
      if (health.status !== 'healthy') {
        issues.push({
          server: serverName,
          status: health.status,
          error: health.error,
          lastCheck: health.lastCheck
        });
      }
    }
    
    return issues;
  }

  /**
   * Get average latency
   * @private
   */
  getAverageLatency() {
    const latencies = Array.from(this.serverHealth.values())
      .map(health => health.latency)
      .filter(latency => typeof latency === 'number');
    
    if (latencies.length === 0) return null;
    
    return latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
  }

  /**
   * Get fastest server
   * @private
   */
  getFastestServer() {
    let fastest = null;
    let minLatency = Infinity;
    
    for (const [serverName, health] of this.serverHealth) {
      if (health.latency && health.latency < minLatency) {
        minLatency = health.latency;
        fastest = serverName;
      }
    }
    
    return fastest ? { server: fastest, latency: minLatency } : null;
  }

  /**
   * Get slowest server
   * @private
   */
  getSlowestServer() {
    let slowest = null;
    let maxLatency = 0;
    
    for (const [serverName, health] of this.serverHealth) {
      if (health.latency && health.latency > maxLatency) {
        maxLatency = health.latency;
        slowest = serverName;
      }
    }
    
    return slowest ? { server: slowest, latency: maxLatency } : null;
  }

  /**
   * Ensure system is initialized
   * @private
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.stopAutoDiscovery();
    this.removeAllListeners();
    console.log('🧹 MCP Discovery System cleaned up');
  }
}

module.exports = MCPDiscoverySystem;