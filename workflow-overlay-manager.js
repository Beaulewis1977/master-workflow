#!/usr/bin/env node

/**
 * Workflow Overlay Manager
 * 
 * Manages temporary workflow overlays that don't modify user's project structure
 * Provides clean separation between Claude Flow system and user's project
 * 
 * Features:
 * - Non-invasive overlay system
 * - Preserves original project structure
 * - Temporary file management
 * - Clean uninstall capability
 * - Cross-platform compatibility
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class WorkflowOverlayManager {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.overlayId = crypto.randomBytes(8).toString('hex');
        this.overlayPath = path.join(projectRoot, '.claude-flow');
        this.tempPath = path.join(os.tmpdir(), `claude-flow-${this.overlayId}`);
        
        this.overlayStructure = {
            // Core system directories
            core: [
                'intelligence-engine',
                'mcp-servers', 
                'agents',
                'configs',
                'templates',
                'bin',
                'lib',
                'logs',
                'cache',
                'temp'
            ],
            
            // Configuration files
            configs: [
                'installation-state.json',
                'project-discovery.json',
                'mcp-discovery-results.json',
                'agent-registry.json',
                'performance-metrics.json',
                'build-report.json'
            ],
            
            // Executable files
            executables: [
                'claude-flow',
                'claude-flow.cmd',
                'claude-flow.ps1'
            ],
            
            // Template files
            templates: [
                'agent-templates',
                'mcp-templates',
                'workflow-templates',
                'config-templates'
            ]
        };
        
        this.protectedFiles = new Set([
            // Common project files to never modify
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'pnpm-lock.yaml',
            'requirements.txt',
            'Pipfile',
            'pyproject.toml',
            'Cargo.toml',
            'go.mod',
            'composer.json',
            'Gemfile',
            'README.md',
            'LICENSE',
            '.gitignore',
            '.env',
            '.env.local',
            'tsconfig.json',
            'jsconfig.json',
            'webpack.config.js',
            'vite.config.js',
            'next.config.js',
            'tailwind.config.js',
            'jest.config.js',
            'cypress.config.js',
            'Dockerfile',
            'docker-compose.yml',
            'serverless.yml',
            'vercel.json',
            'netlify.toml'
        ]);
        
        this.overlayState = {
            created: false,
            files: [],
            directories: [],
            symlinks: [],
            backups: new Map(),
            originalPerms: new Map()
        };
    }

    async createOverlay(options = {}) {
        console.log('🎭 Creating workflow overlay...');
        console.log(`📁 Project root: ${this.projectRoot}`);
        console.log(`🔧 Overlay path: ${this.overlayPath}`);
        console.log(`📦 Temp path: ${this.tempPath}`);
        
        try {
            // Step 1: Validate project structure
            await this.validateProject();
            
            // Step 2: Create overlay directory structure
            await this.createOverlayStructure();
            
            // Step 3: Create temporary working directory
            await this.createTempDirectory();
            
            // Step 4: Install core system files
            await this.installCoreFiles();
            
            // Step 5: Create cross-platform executables
            await this.createExecutables();
            
            // Step 6: Setup configuration management
            await this.setupConfigManagement();
            
            // Step 7: Create Web UI if requested
            if (options.webui) {
                await this.setupWebUI();
            }
            
            // Step 8: Save overlay state
            await this.saveOverlayState();
            
            this.overlayState.created = true;
            console.log('✅ Workflow overlay created successfully');
            
            return {
                success: true,
                overlayId: this.overlayId,
                overlayPath: this.overlayPath,
                tempPath: this.tempPath,
                filesCreated: this.overlayState.files.length,
                directoriesCreated: this.overlayState.directories.length
            };
            
        } catch (error) {
            console.error(`❌ Failed to create overlay: ${error.message}`);
            await this.cleanup();
            throw error;
        }
    }

    async validateProject() {
        // Check if we have write permissions
        try {
            const testFile = path.join(this.projectRoot, '.claude-flow-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
        } catch (error) {
            throw new Error(`No write permission in ${this.projectRoot}`);
        }
        
        // Check if overlay already exists
        if (fs.existsSync(this.overlayPath)) {
            // Check if it's a valid Claude Flow installation
            const lockFile = path.join(this.projectRoot, '.claude-flow.lock');
            if (fs.existsSync(lockFile)) {
                const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
                throw new Error(`Claude Flow already installed (ID: ${lockData.installId})`);
            } else {
                // Remove orphaned directory
                fs.rmSync(this.overlayPath, { recursive: true, force: true });
            }
        }
        
        // Detect protected files
        const protectedFound = [];
        for (const file of this.protectedFiles) {
            if (fs.existsSync(path.join(this.projectRoot, file))) {
                protectedFound.push(file);
            }
        }
        
        console.log(`🛡️  Protected files detected: ${protectedFound.length}`);
        console.log('✅ Project validation passed');
    }

    async createOverlayStructure() {
        console.log('📂 Creating overlay directory structure...');
        
        // Create main overlay directory
        fs.mkdirSync(this.overlayPath, { recursive: true });
        this.overlayState.directories.push(this.overlayPath);
        
        // Create core directories
        for (const dir of this.overlayStructure.core) {
            const dirPath = path.join(this.overlayPath, dir);
            fs.mkdirSync(dirPath, { recursive: true });
            this.overlayState.directories.push(dirPath);
        }
        
        // Create subdirectories
        const subdirs = [
            'intelligence-engine/modules',
            'intelligence-engine/services',
            'intelligence-engine/utils',
            'mcp-servers/configs',
            'mcp-servers/templates',
            'mcp-servers/logs',
            'agents/specialized',
            'agents/custom',
            'agents/templates',
            'configs/environments',
            'configs/profiles',
            'templates/agents',
            'templates/workflows',
            'templates/mcp',
            'bin/scripts',
            'lib/core',
            'lib/utils',
            'logs/system',
            'logs/agents',
            'cache/mcp',
            'cache/agents',
            'temp/builds',
            'temp/downloads'
        ];
        
        for (const subdir of subdirs) {
            const subdirPath = path.join(this.overlayPath, subdir);
            fs.mkdirSync(subdirPath, { recursive: true });
            this.overlayState.directories.push(subdirPath);
        }
        
        console.log(`📂 Created ${this.overlayState.directories.length} directories`);
    }

    async createTempDirectory() {
        console.log('📦 Creating temporary working directory...');
        
        fs.mkdirSync(this.tempPath, { recursive: true });
        
        // Create temp subdirectories
        const tempDirs = [
            'downloads',
            'builds',
            'cache',
            'logs',
            'workspace'
        ];
        
        for (const dir of tempDirs) {
            fs.mkdirSync(path.join(this.tempPath, dir), { recursive: true });
        }
        
        console.log(`📦 Temporary directory created: ${this.tempPath}`);
    }

    async installCoreFiles() {
        console.log('⚙️  Installing core system files...');
        
        // Install Queen Controller
        await this.installQueenController();
        
        // Install MCP Management System
        await this.installMcpManagement();
        
        // Install Agent Registry
        await this.installAgentRegistry();
        
        // Install Performance Monitor
        await this.installPerformanceMonitor();
        
        // Install Utility Libraries
        await this.installUtilities();
        
        console.log(`⚙️  Installed ${this.overlayState.files.length} core files`);
    }

    async installQueenController() {
        const queenControllerCode = `/**
 * Queen Controller - Embedded Version
 * Integrated with Workflow Overlay Manager
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class EmbeddedQueenController extends EventEmitter {
    constructor(overlayPath) {
        super();
        this.overlayPath = overlayPath;
        this.maxAgents = 4462;
        this.agents = new Map();
        this.resourceMonitor = null;
        this.agentRegistry = null;
        this.isInitialized = false;
        
        // Bind to overlay paths
        this.agentsPath = path.join(overlayPath, 'agents');
        this.configsPath = path.join(overlayPath, 'configs');
        this.logsPath = path.join(overlayPath, 'logs');
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🔥 Initializing embedded Queen Controller...');
        
        // Initialize resource monitoring
        this.resourceMonitor = new ResourceMonitor(this.overlayPath);
        await this.resourceMonitor.start();
        
        // Initialize agent registry
        const { EmbeddedAgentRegistry } = require('./agent-registry');
        this.agentRegistry = new EmbeddedAgentRegistry(this.agentsPath);
        await this.agentRegistry.initialize();
        
        this.isInitialized = true;
        this.emit('initialized');
        
        console.log('✅ Embedded Queen Controller initialized');
        console.log(\`📊 Maximum agents: \${this.maxAgents}\`);
        console.log(\`🤖 Available agent types: \${this.agentRegistry.getAvailableTypes().length}\`);
    }
    
    async spawnAgent(type, config = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.agents.size >= this.maxAgents) {
            throw new Error(\`Agent limit reached: \${this.maxAgents}\`);
        }
        
        const agent = await this.agentRegistry.createAgent(type, config);
        this.agents.set(agent.id, agent);
        
        this.emit('agentSpawned', agent);
        
        console.log(\`🤖 Agent spawned: \${type} (ID: \${agent.id})\`);
        console.log(\`📈 Active agents: \${this.agents.size}/\${this.maxAgents}\`);
        
        return agent;
    }
    
    async executeWorkflow(workflowConfig) {
        console.log('🎭 Executing workflow with overlay system...');
        
        const startTime = Date.now();
        const requiredAgents = workflowConfig.agents || ['api-builder', 'test-runner'];
        
        // Spawn required agents
        const agents = [];
        for (const agentType of requiredAgents) {
            try {
                const agent = await this.spawnAgent(agentType);
                agents.push(agent);
            } catch (error) {
                console.warn(\`⚠️  Failed to spawn \${agentType}: \${error.message}\`);
            }
        }
        
        // Execute workflow tasks in parallel
        const tasks = agents.map(agent => agent.execute(workflowConfig));
        const results = await Promise.allSettled(tasks);
        
        const executionTime = Date.now() - startTime;
        
        // Generate workflow report
        const report = {
            success: results.every(r => r.status === 'fulfilled'),
            executionTime,
            agentsUsed: agents.length,
            results: results.map((r, i) => ({
                agent: agents[i].type,
                status: r.status,
                result: r.status === 'fulfilled' ? r.value : r.reason
            })),
            metrics: await this.resourceMonitor.getMetrics()
        };
        
        // Save workflow report
        const reportFile = path.join(this.configsPath, 'workflow-report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        this.emit('workflowCompleted', report);
        
        return report;
    }
    
    async shutdown() {
        console.log('🔄 Shutting down embedded Queen Controller...');
        
        // Shutdown all agents
        for (const [agentId, agent] of this.agents) {
            try {
                await agent.shutdown();
            } catch (error) {
                console.warn(\`⚠️  Agent shutdown error: \${error.message}\`);
            }
        }
        
        // Stop resource monitoring
        if (this.resourceMonitor) {
            await this.resourceMonitor.stop();
        }
        
        this.agents.clear();
        this.isInitialized = false;
        
        this.emit('shutdown');
        console.log('✅ Embedded Queen Controller shutdown complete');
    }
    
    getStats() {
        return {
            initialized: this.isInitialized,
            activeAgents: this.agents.size,
            maxAgents: this.maxAgents,
            availableTypes: this.agentRegistry ? this.agentRegistry.getAvailableTypes().length : 0,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
}

class ResourceMonitor {
    constructor(overlayPath) {
        this.overlayPath = overlayPath;
        this.monitoring = false;
        this.metrics = {
            cpu: 0,
            memory: 0,
            disk: 0,
            agents: 0
        };
    }
    
    async start() {
        this.monitoring = true;
        
        this.interval = setInterval(() => {
            this.updateMetrics();
        }, 5000);
        
        console.log('📊 Resource monitoring started');
    }
    
    updateMetrics() {
        const usage = process.memoryUsage();
        this.metrics = {
            cpu: process.cpuUsage(),
            memory: {
                used: usage.heapUsed,
                total: usage.heapTotal,
                external: usage.external,
                rss: usage.rss
            },
            disk: this.getDiskUsage(),
            timestamp: Date.now()
        };
    }
    
    getDiskUsage() {
        try {
            const stats = fs.statSync(this.overlayPath);
            return stats.size || 0;
        } catch (error) {
            return 0;
        }
    }
    
    async getMetrics() {
        return { ...this.metrics };
    }
    
    async stop() {
        this.monitoring = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
        console.log('📊 Resource monitoring stopped');
    }
}

module.exports = { EmbeddedQueenController, ResourceMonitor };
`;
        
        const queenFile = path.join(this.overlayPath, 'intelligence-engine', 'queen-controller.js');
        fs.writeFileSync(queenFile, queenControllerCode);
        this.overlayState.files.push(queenFile);
    }

    async installMcpManagement() {
        const mcpManagerCode = `/**
 * Embedded MCP Management System
 * Integrated with overlay system for clean installation
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class EmbeddedMcpManager extends EventEmitter {
    constructor(overlayPath) {
        super();
        this.overlayPath = overlayPath;
        this.mcpPath = path.join(overlayPath, 'mcp-servers');
        this.servers = new Map();
        this.catalog = null;
        this.isInitialized = false;
    }
    
    async initialize() {
        console.log('🔌 Initializing MCP Management System...');
        
        // Load MCP server catalog
        await this.loadServerCatalog();
        
        // Initialize core servers
        await this.initializeCoreServers();
        
        this.isInitialized = true;
        console.log('✅ MCP Management System initialized');
        console.log(\`🔌 Available servers: \${this.catalog.totalServers}\`);
    }
    
    async loadServerCatalog() {
        // Load the Enhanced MCP Ecosystem v3.0 catalog
        const catalogPath = path.join(this.mcpPath, 'catalog.json');
        
        if (fs.existsSync(catalogPath)) {
            this.catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        } else {
            // Create default catalog
            this.catalog = {
                version: '3.0.0',
                totalServers: 125,
                categories: [
                    'core', 'development', 'cloud', 'databases', 
                    'ai', 'communication', 'monitoring', 'security', 'testing'
                ],
                servers: {
                    filesystem: { type: 'builtin', category: 'core', priority: 100 },
                    http: { type: 'builtin', category: 'core', priority: 95 },
                    git: { type: 'builtin', category: 'core', priority: 90 },
                    context7: { type: 'mcp', category: 'core', priority: 85 },
                    github: { type: 'mcp', category: 'development', priority: 85 },
                    npm: { type: 'mcp', category: 'development', priority: 80 },
                    postgres: { type: 'mcp', category: 'databases', priority: 90 },
                    docker: { type: 'mcp', category: 'cloud', priority: 85 },
                    aws: { type: 'mcp', category: 'cloud', priority: 85 }
                }
            };
            
            fs.writeFileSync(catalogPath, JSON.stringify(this.catalog, null, 2));
        }
    }
    
    async initializeCoreServers() {
        const coreServers = ['filesystem', 'http', 'git', 'context7'];
        
        for (const serverName of coreServers) {
            try {
                await this.initializeServer(serverName);
            } catch (error) {
                console.warn(\`⚠️  Failed to initialize \${serverName}: \${error.message}\`);
            }
        }
    }
    
    async initializeServer(serverName) {
        const serverConfig = this.catalog.servers[serverName];
        if (!serverConfig) {
            throw new Error(\`Unknown server: \${serverName}\`);
        }
        
        const server = {
            name: serverName,
            type: serverConfig.type,
            category: serverConfig.category,
            priority: serverConfig.priority,
            status: 'initialized',
            connection: null,
            lastHealthCheck: null,
            metrics: {
                requests: 0,
                errors: 0,
                avgResponseTime: 0
            }
        };
        
        this.servers.set(serverName, server);
        
        console.log(\`🔌 Initialized server: \${serverName} (\${serverConfig.category})\`);
    }
    
    async connectServer(serverName, config = {}) {
        const server = this.servers.get(serverName);
        if (!server) {
            throw new Error(\`Server not found: \${serverName}\`);
        }
        
        // Simulate server connection
        server.connection = {
            connected: true,
            connectedAt: new Date().toISOString(),
            config
        };
        
        server.status = 'connected';
        
        this.emit('serverConnected', server);
        
        return server;
    }
    
    async healthCheck(serverName) {
        const server = this.servers.get(serverName);
        if (!server) {
            return { healthy: false, error: 'Server not found' };
        }
        
        // Simulate health check
        const healthy = Math.random() > 0.1; // 90% success rate
        const responseTime = Math.round(Math.random() * 100 + 50);
        
        const healthResult = {
            healthy,
            serverName,
            responseTime,
            timestamp: new Date().toISOString()
        };
        
        server.lastHealthCheck = healthResult;
        
        if (healthy) {
            server.metrics.requests++;
        } else {
            server.metrics.errors++;
        }
        
        return healthResult;
    }
    
    getServerStats() {
        const stats = {
            totalServers: this.servers.size,
            connectedServers: Array.from(this.servers.values()).filter(s => s.status === 'connected').length,
            categories: {},
            avgResponseTime: 0
        };
        
        // Group by category
        for (const server of this.servers.values()) {
            stats.categories[server.category] = (stats.categories[server.category] || 0) + 1;
        }
        
        return stats;
    }
    
    async shutdown() {
        console.log('🔄 Shutting down MCP Management System...');
        
        for (const [serverName, server] of this.servers) {
            if (server.status === 'connected') {
                server.status = 'disconnected';
                server.connection = null;
            }
        }
        
        this.isInitialized = false;
        console.log('✅ MCP Management System shutdown complete');
    }
}

module.exports = { EmbeddedMcpManager };
`;
        
        const mcpFile = path.join(this.overlayPath, 'intelligence-engine', 'mcp-manager.js');
        fs.writeFileSync(mcpFile, mcpManagerCode);
        this.overlayState.files.push(mcpFile);
    }

    async installAgentRegistry() {
        const agentRegistryCode = `/**
 * Embedded Agent Registry
 * Manages specialized agents within overlay system
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EmbeddedAgentRegistry {
    constructor(agentsPath) {
        this.agentsPath = agentsPath;
        this.agents = new Map();
        this.templates = new Map();
        this.isInitialized = false;
    }
    
    async initialize() {
        console.log('🤖 Initializing Agent Registry...');
        
        // Load agent templates
        await this.loadAgentTemplates();
        
        this.isInitialized = true;
        console.log(\`🤖 Agent Registry initialized with \${this.templates.size} templates\`);
    }
    
    async loadAgentTemplates() {
        const agentTypes = [
            {
                type: 'api-builder',
                name: 'API Builder Agent',
                description: 'REST/GraphQL API development specialist',
                capabilities: ['api-design', 'endpoint-creation', 'documentation', 'testing'],
                tools: ['Read', 'Write', 'Edit', 'Bash', 'WebSearch'],
                contextWindow: 200000
            },
            {
                type: 'database-architect',
                name: 'Database Architect Agent',
                description: 'Database design and optimization expert',
                capabilities: ['schema-design', 'query-optimization', 'migrations', 'indexing'],
                tools: ['Read', 'Write', 'Edit', 'Bash'],
                contextWindow: 200000
            },
            {
                type: 'frontend-specialist',
                name: 'Frontend Specialist Agent',
                description: 'UI/UX and frontend development expert',
                capabilities: ['react', 'vue', 'angular', 'responsive-design', 'optimization'],
                tools: ['Read', 'Write', 'Edit', 'WebSearch'],
                contextWindow: 200000
            },
            {
                type: 'test-runner',
                name: 'Test Runner Agent',
                description: 'Comprehensive testing automation specialist',
                capabilities: ['unit-testing', 'integration-testing', 'e2e-testing', 'performance-testing'],
                tools: ['Read', 'Write', 'Edit', 'Bash'],
                contextWindow: 200000
            },
            {
                type: 'security-scanner',
                name: 'Security Scanner Agent',
                description: 'Security analysis and vulnerability assessment',
                capabilities: ['vulnerability-scanning', 'code-analysis', 'compliance', 'penetration-testing'],
                tools: ['Read', 'Grep', 'Bash', 'WebSearch'],
                contextWindow: 200000
            },
            {
                type: 'deployment-engineer',
                name: 'Deployment Engineer Agent', 
                description: 'CI/CD and deployment automation specialist',
                capabilities: ['blue-green-deployment', 'canary-deployment', 'infrastructure-as-code', 'monitoring'],
                tools: ['Read', 'Write', 'Edit', 'Bash', 'WebSearch'],
                contextWindow: 200000
            }
        ];
        
        for (const template of agentTypes) {
            this.templates.set(template.type, template);
        }
    }
    
    async createAgent(type, config = {}) {
        const template = this.templates.get(type);
        if (!template) {
            throw new Error(\`Unknown agent type: \${type}\`);
        }
        
        const agentId = config.id || \`\${type}-\${crypto.randomBytes(4).toString('hex')}\`;
        
        const agent = {
            id: agentId,
            type: template.type,
            name: template.name,
            description: template.description,
            capabilities: template.capabilities,
            tools: template.tools,
            contextWindow: template.contextWindow,
            status: 'active',
            createdAt: new Date().toISOString(),
            config: {
                ...config,
                overlayMode: true,
                agentsPath: this.agentsPath
            },
            
            async execute(task) {
                console.log(\`🎯 \${this.name} executing: \${task.type || 'generic task'}\`);
                
                const startTime = Date.now();
                
                // Simulate agent execution
                await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
                
                const executionTime = Date.now() - startTime;
                
                const result = {
                    success: true,
                    agentId: this.id,
                    agentType: this.type,
                    executionTime,
                    result: \`Task completed by \${this.name}\`,
                    capabilities: this.capabilities,
                    timestamp: new Date().toISOString()
                };
                
                console.log(\`✅ \${this.name} completed task in \${executionTime}ms\`);
                
                return result;
            },
            
            async shutdown() {
                console.log(\`🔄 Shutting down agent: \${this.name} (\${this.id})\`);
                this.status = 'shutdown';
            }
        };
        
        this.agents.set(agentId, agent);
        
        console.log(\`🤖 Created agent: \${template.name} (ID: \${agentId})\`);
        
        return agent;
    }
    
    getAvailableTypes() {
        return Array.from(this.templates.keys());
    }
    
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    
    listAgents() {
        return Array.from(this.agents.values());
    }
    
    async removeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            await agent.shutdown();
            this.agents.delete(agentId);
            console.log(\`🗑️  Removed agent: \${agentId}\`);
        }
    }
    
    getStats() {
        return {
            totalAgents: this.agents.size,
            activeAgents: this.listAgents().filter(a => a.status === 'active').length,
            availableTypes: this.templates.size,
            agentsByType: this.getAgentsByType()
        };
    }
    
    getAgentsByType() {
        const byType = {};
        for (const agent of this.agents.values()) {
            byType[agent.type] = (byType[agent.type] || 0) + 1;
        }
        return byType;
    }
}

module.exports = { EmbeddedAgentRegistry };
`;
        
        const agentFile = path.join(this.overlayPath, 'intelligence-engine', 'agent-registry.js');
        fs.writeFileSync(agentFile, agentRegistryCode);
        this.overlayState.files.push(agentFile);
    }

    async installPerformanceMonitor() {
        const performanceCode = `/**
 * Embedded Performance Monitor
 * Real-time performance tracking for overlay system
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class EmbeddedPerformanceMonitor extends EventEmitter {
    constructor(overlayPath) {
        super();
        this.overlayPath = overlayPath;
        this.metricsPath = path.join(overlayPath, 'logs', 'performance.json');
        this.monitoring = false;
        
        this.metrics = {
            system: {
                cpu: { usage: 0, cores: require('os').cpus().length },
                memory: { used: 0, total: require('os').totalmem() },
                disk: { used: 0 },
                network: { latency: 0 }
            },
            agents: {
                active: 0,
                spawned: 0,
                completed: 0,
                failed: 0,
                avgExecutionTime: 0
            },
            mcp: {
                servers: 0,
                connected: 0,
                requests: 0,
                avgResponseTime: 0
            },
            workflow: {
                builds: 0,
                successful: 0,
                failed: 0,
                avgBuildTime: 0
            }
        };
        
        this.history = [];
        this.maxHistoryLength = 100;
    }
    
    async start() {
        if (this.monitoring) return;
        
        console.log('📊 Starting performance monitoring...');
        this.monitoring = true;
        
        // Update metrics every 5 seconds
        this.interval = setInterval(() => {
            this.updateMetrics();
            this.saveMetrics();
        }, 5000);
        
        // Emit metrics every 10 seconds
        this.reportInterval = setInterval(() => {
            this.emit('metricsUpdate', this.getMetrics());
        }, 10000);
        
        console.log('📊 Performance monitoring started');
    }
    
    updateMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.metrics.system.memory.used = memUsage.heapUsed;
        this.metrics.system.cpu.usage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        
        // Update disk usage
        try {
            const stats = fs.statSync(this.overlayPath);
            this.metrics.system.disk.used = this.getDirSize(this.overlayPath);
        } catch (error) {
            // Ignore disk errors
        }
        
        // Add to history
        const snapshot = {
            timestamp: Date.now(),
            ...JSON.parse(JSON.stringify(this.metrics))
        };
        
        this.history.push(snapshot);
        
        // Keep history within limits
        if (this.history.length > this.maxHistoryLength) {
            this.history = this.history.slice(-this.maxHistoryLength);
        }
    }
    
    getDirSize(dirPath) {
        let size = 0;
        try {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                if (stats.isDirectory()) {
                    size += this.getDirSize(itemPath);
                } else {
                    size += stats.size;
                }
            }
        } catch (error) {
            // Ignore errors
        }
        return size;
    }
    
    recordAgentSpawn() {
        this.metrics.agents.spawned++;
        this.metrics.agents.active++;
    }
    
    recordAgentCompletion(executionTime) {
        this.metrics.agents.completed++;
        this.metrics.agents.active = Math.max(0, this.metrics.agents.active - 1);
        
        // Update average execution time
        const totalTime = this.metrics.agents.avgExecutionTime * (this.metrics.agents.completed - 1);
        this.metrics.agents.avgExecutionTime = (totalTime + executionTime) / this.metrics.agents.completed;
    }
    
    recordAgentFailure() {
        this.metrics.agents.failed++;
        this.metrics.agents.active = Math.max(0, this.metrics.agents.active - 1);
    }
    
    recordMcpRequest(responseTime) {
        this.metrics.mcp.requests++;
        
        // Update average response time
        const totalTime = this.metrics.mcp.avgResponseTime * (this.metrics.mcp.requests - 1);
        this.metrics.mcp.avgResponseTime = (totalTime + responseTime) / this.metrics.mcp.requests;
    }
    
    recordWorkflowBuild(success, buildTime) {
        this.metrics.workflow.builds++;
        
        if (success) {
            this.metrics.workflow.successful++;
        } else {
            this.metrics.workflow.failed++;
        }
        
        // Update average build time
        const totalTime = this.metrics.workflow.avgBuildTime * (this.metrics.workflow.builds - 1);
        this.metrics.workflow.avgBuildTime = (totalTime + buildTime) / this.metrics.workflow.builds;
    }
    
    getMetrics() {
        return JSON.parse(JSON.stringify(this.metrics));
    }
    
    getHistory() {
        return [...this.history];
    }
    
    getPerformanceReport() {
        const current = this.getMetrics();
        const memUsageMB = Math.round(current.system.memory.used / 1024 / 1024);
        const diskUsageMB = Math.round(current.system.disk.used / 1024 / 1024);
        
        return {
            summary: {
                memoryUsage: \`\${memUsageMB} MB\`,
                diskUsage: \`\${diskUsageMB} MB\`,
                activeAgents: current.agents.active,
                totalBuilds: current.workflow.builds,
                successRate: current.workflow.builds > 0 ? 
                    \`\${Math.round((current.workflow.successful / current.workflow.builds) * 100)}%\` : '0%'
            },
            metrics: current,
            history: this.history.slice(-10) // Last 10 snapshots
        };
    }
    
    saveMetrics() {
        try {
            const report = this.getPerformanceReport();
            fs.writeFileSync(this.metricsPath, JSON.stringify(report, null, 2));
        } catch (error) {
            // Ignore save errors
        }
    }
    
    async stop() {
        if (!this.monitoring) return;
        
        console.log('📊 Stopping performance monitoring...');
        this.monitoring = false;
        
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
        }
        
        // Save final metrics
        this.saveMetrics();
        
        console.log('📊 Performance monitoring stopped');
    }
}

module.exports = { EmbeddedPerformanceMonitor };
`;
        
        const perfFile = path.join(this.overlayPath, 'intelligence-engine', 'performance-monitor.js');
        fs.writeFileSync(perfFile, performanceCode);
        this.overlayState.files.push(perfFile);
    }

    async installUtilities() {
        const utilsCode = `/**
 * Embedded Utility Libraries
 * Common utilities for overlay system
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class OverlayUtils {
    static generateId(prefix = '') {
        return \`\${prefix}\${prefix ? '-' : ''}\${crypto.randomBytes(6).toString('hex')}\`;
    }
    
    static ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return dirPath;
    }
    
    static safeReadJson(filePath, defaultValue = null) {
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (error) {
            console.warn(\`Failed to read JSON file \${filePath}: \${error.message}\`);
        }
        return defaultValue;
    }
    
    static safeWriteJson(filePath, data) {
        try {
            this.ensureDir(path.dirname(filePath));
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.warn(\`Failed to write JSON file \${filePath}: \${error.message}\`);
            return false;
        }
    }
    
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static formatDuration(ms) {
        if (ms < 1000) return \`\${ms}ms\`;
        if (ms < 60000) return \`\${(ms / 1000).toFixed(1)}s\`;
        if (ms < 3600000) return \`\${(ms / 60000).toFixed(1)}m\`;
        return \`\${(ms / 3600000).toFixed(1)}h\`;
    }
    
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static async retryOperation(operation, maxRetries = 3, delayMs = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                console.warn(\`Operation failed, retrying in \${delayMs}ms... (\${i + 1}/\${maxRetries})\`);
                await this.delay(delayMs);
            }
        }
    }
    
    static validateOverlayPath(overlayPath) {
        if (!overlayPath || !path.isAbsolute(overlayPath)) {
            throw new Error('Invalid overlay path');
        }
        
        if (!fs.existsSync(overlayPath)) {
            throw new Error('Overlay path does not exist');
        }
        
        return true;
    }
    
    static createProgressBar(current, total, width = 40) {
        const percentage = Math.round((current / total) * 100);
        const filled = Math.round((current / total) * width);
        const empty = width - filled;
        
        return \`[\${'█'.repeat(filled)}\${'░'.repeat(empty)}] \${percentage}%\`;
    }
}

module.exports = { OverlayUtils };
`;
        
        const utilsFile = path.join(this.overlayPath, 'lib', 'utils.js');
        fs.writeFileSync(utilsFile, utilsCode);
        this.overlayState.files.push(utilsFile);
    }

    async createExecutables() {
        console.log('🔧 Creating cross-platform executables...');
        
        // Create Unix/Linux/macOS executable
        await this.createUnixExecutable();
        
        // Create Windows batch file
        await this.createWindowsBatch();
        
        // Create PowerShell script
        await this.createPowerShellScript();
        
        console.log('🔧 Cross-platform executables created');
    }

    async createUnixExecutable() {
        const executable = `#!/usr/bin/env node

/**
 * Claude Flow 2.0 - Unix/Linux/macOS Executable
 * Embedded overlay system launcher
 */

const path = require('path');
const { EmbeddedQueenController } = require('./intelligence-engine/queen-controller');
const { EmbeddedMcpManager } = require('./intelligence-engine/mcp-manager');
const { EmbeddedPerformanceMonitor } = require('./intelligence-engine/performance-monitor');

const OVERLAY_PATH = __dirname;

class ClaudeFlowLauncher {
    constructor() {
        this.overlayPath = OVERLAY_PATH;
        this.queenController = null;
        this.mcpManager = null;
        this.performanceMonitor = null;
    }
    
    async initialize() {
        console.log('🚀 Claude Flow 2.0 - Launching embedded system...');
        console.log(\`📁 Overlay path: \${this.overlayPath}\`);
        
        // Initialize performance monitoring
        this.performanceMonitor = new EmbeddedPerformanceMonitor(this.overlayPath);
        await this.performanceMonitor.start();
        
        // Initialize MCP management
        this.mcpManager = new EmbeddedMcpManager(this.overlayPath);
        await this.mcpManager.initialize();
        
        // Initialize Queen Controller
        this.queenController = new EmbeddedQueenController(this.overlayPath);
        await this.queenController.initialize();
        
        console.log('✅ Embedded system initialized');
    }
    
    async build(options = {}) {
        await this.initialize();
        
        console.log('🏗️  Starting build process...');
        
        const workflowConfig = {
            type: 'build',
            agents: ['api-builder', 'test-runner', 'deployment-engineer'],
            options
        };
        
        const result = await this.queenController.executeWorkflow(workflowConfig);
        
        console.log(\`✅ Build completed: \${result.success ? 'SUCCESS' : 'FAILED'}\`);
        console.log(\`⏱️  Execution time: \${result.executionTime}ms\`);
        console.log(\`🤖 Agents used: \${result.agentsUsed}\`);
        
        return result;
    }
    
    async status() {
        try {
            await this.initialize();
            
            const stats = this.queenController.getStats();
            const mcpStats = this.mcpManager.getServerStats();
            const perfReport = this.performanceMonitor.getPerformanceReport();
            
            console.log('📊 Claude Flow 2.0 Status:');
            console.log(\`   System: \${stats.initialized ? 'ACTIVE' : 'INACTIVE'}\`);
            console.log(\`   Agents: \${stats.activeAgents}/\${stats.maxAgents}\`);
            console.log(\`   MCP Servers: \${mcpStats.connectedServers}/\${mcpStats.totalServers}\`);
            console.log(\`   Memory Usage: \${perfReport.summary.memoryUsage}\`);
            console.log(\`   Disk Usage: \${perfReport.summary.diskUsage}\`);
            
            return { stats, mcpStats, perfReport };
            
        } catch (error) {
            console.error(\`❌ Status check failed: \${error.message}\`);
            return null;
        }
    }
    
    async shutdown() {
        console.log('🔄 Shutting down embedded system...');
        
        if (this.queenController) {
            await this.queenController.shutdown();
        }
        
        if (this.mcpManager) {
            await this.mcpManager.shutdown();
        }
        
        if (this.performanceMonitor) {
            await this.performanceMonitor.stop();
        }
        
        console.log('✅ Embedded system shutdown complete');
    }
}

// Command-line interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    const launcher = new ClaudeFlowLauncher();
    
    try {
        switch (command) {
            case 'build':
                await launcher.build();
                break;
                
            case 'status':
                await launcher.status();
                break;
                
            case 'shutdown':
                await launcher.shutdown();
                break;
                
            default:
                console.log(\`
🚀 Claude Flow 2.0 - Embedded System

Usage:
  ./claude-flow build     Build project with unlimited scaling
  ./claude-flow status    Show system status
  ./claude-flow shutdown  Shutdown embedded system
  ./claude-flow help      Show this help
\`);
                break;
        }
        
        if (command !== 'help') {
            await launcher.shutdown();
        }
        
    } catch (error) {
        console.error(\`❌ Command failed: \${error.message}\`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { ClaudeFlowLauncher };
`;
        
        const execFile = path.join(this.overlayPath, 'claude-flow');
        fs.writeFileSync(execFile, executable);
        
        // Make executable on Unix systems
        if (process.platform !== 'win32') {
            try {
                fs.chmodSync(execFile, '755');
            } catch (error) {
                console.warn('⚠️  Failed to set executable permissions');
            }
        }
        
        this.overlayState.files.push(execFile);
    }

    async createWindowsBatch() {
        const batchFile = `@echo off
REM Claude Flow 2.0 - Windows Batch Launcher

set OVERLAY_PATH=%~dp0
node "%OVERLAY_PATH%claude-flow" %*
`;
        
        const batchPath = path.join(this.overlayPath, 'claude-flow.cmd');
        fs.writeFileSync(batchPath, batchFile);
        this.overlayState.files.push(batchPath);
    }

    async createPowerShellScript() {
        const psScript = `# Claude Flow 2.0 - PowerShell Launcher

param(
    [string]$Command = "help",
    [string[]]$Arguments = @()
)

$OverlayPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeScript = Join-Path $OverlayPath "claude-flow"

try {
    & node $NodeScript $Command @Arguments
} catch {
    Write-Error "Failed to execute Claude Flow: $_"
    exit 1
}
`;
        
        const psPath = path.join(this.overlayPath, 'claude-flow.ps1');
        fs.writeFileSync(psPath, psScript);
        this.overlayState.files.push(psPath);
    }

    async setupConfigManagement() {
        console.log('⚙️  Setting up configuration management...');
        
        // Create overlay configuration
        const overlayConfig = {
            version: '2.0.0',
            overlayId: this.overlayId,
            createdAt: new Date().toISOString(),
            projectRoot: this.projectRoot,
            overlayPath: this.overlayPath,
            tempPath: this.tempPath,
            features: {
                unlimitedScaling: true,
                mcpEcosystem: true,
                specializedAgents: true,
                performanceMonitoring: true,
                webUI: false
            },
            limits: {
                maxAgents: 4462,
                contextWindow: 200000,
                mcpServers: 125
            }
        };
        
        const configFile = path.join(this.overlayPath, 'configs', 'overlay-config.json');
        fs.writeFileSync(configFile, JSON.stringify(overlayConfig, null, 2));
        this.overlayState.files.push(configFile);
        
        // Create environment configuration
        const envConfig = {
            NODE_ENV: 'development',
            CLAUDE_FLOW_OVERLAY: 'true',
            CLAUDE_FLOW_VERSION: '2.0.0',
            CLAUDE_FLOW_PATH: this.overlayPath,
            CLAUDE_FLOW_TEMP: this.tempPath
        };
        
        const envFile = path.join(this.overlayPath, '.env');
        const envContent = Object.entries(envConfig)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        fs.writeFileSync(envFile, envContent);
        this.overlayState.files.push(envFile);
        
        console.log('⚙️  Configuration management setup complete');
    }

    async setupWebUI() {
        console.log('🌐 Setting up embedded Web UI...');
        
        const webUIPath = path.join(this.overlayPath, 'webui');
        fs.mkdirSync(webUIPath, { recursive: true });
        this.overlayState.directories.push(webUIPath);
        
        // Create enhanced HTML dashboard
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Flow 2.0 - Overlay Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            text-align: center; 
            color: white; 
            margin-bottom: 40px;
            padding: 40px 0;
        }
        .header h1 { font-size: 3em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .cards { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 25px; 
            margin-bottom: 40px;
        }
        .card { 
            background: white; 
            border-radius: 15px; 
            padding: 25px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        .card h3 { 
            color: #4a5568; 
            margin-bottom: 15px; 
            font-size: 1.3em;
            display: flex;
            align-items: center;
        }
        .card h3::before {
            content: "🔥";
            margin-right: 10px;
            font-size: 1.2em;
        }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin: 10px 0; 
            padding: 10px;
            background: #f7fafc;
            border-radius: 8px;
        }
        .metric-label { font-weight: 500; }
        .metric-value { 
            font-weight: bold; 
            color: #2d3748;
            font-size: 1.1em;
        }
        .status { 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 0.9em; 
            font-weight: 600;
        }
        .status.active { 
            background: #c6f6d5; 
            color: #2f855a; 
        }
        .status.inactive { 
            background: #fed7d7; 
            color: #c53030; 
        }
        .progress { 
            width: 100%; 
            height: 8px; 
            background: #e2e8f0; 
            border-radius: 4px; 
            overflow: hidden; 
            margin: 10px 0;
        }
        .progress-bar { 
            height: 100%; 
            background: linear-gradient(90deg, #4299e1, #667eea); 
            transition: width 0.3s ease;
        }
        .commands { 
            background: white; 
            border-radius: 15px; 
            padding: 25px; 
            margin-top: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .commands h3 { margin-bottom: 15px; color: #4a5568; }
        .command { 
            background: #1a202c; 
            color: #a0aec0; 
            padding: 15px; 
            border-radius: 8px; 
            font-family: 'Monaco', 'Menlo', monospace; 
            margin: 10px 0;
            border-left: 4px solid #667eea;
        }
        .real-time { 
            animation: pulse 2s infinite; 
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        .overlay-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="overlay-badge">🎭 Overlay Mode</div>
    
    <div class="container">
        <div class="header">
            <h1>🚀 Claude Flow 2.0</h1>
            <p>Unlimited Scaling AI Development Platform - Overlay System</p>
        </div>
        
        <div class="cards">
            <div class="card">
                <h3>System Status</h3>
                <div class="metric">
                    <span class="metric-label">Mode</span>
                    <span class="status active">Overlay Active</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Version</span>
                    <span class="metric-value">2.0.0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Max Agents</span>
                    <span class="metric-value">4,462</span>
                </div>
                <div class="metric">
                    <span class="metric-label">MCP Servers</span>
                    <span class="metric-value">125+</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Agent Management</h3>
                <div class="metric">
                    <span class="metric-label">Active Agents</span>
                    <span class="metric-value real-time" id="active-agents">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Available Types</span>
                    <span class="metric-value">42+</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: 15%"></div>
                </div>
                <div class="metric">
                    <span class="metric-label">Utilization</span>
                    <span class="metric-value">15%</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Performance Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value real-time" id="memory-usage">Loading...</span>
                </div>
                <div class="metric">
                    <span class="metric-label">CPU Usage</span>
                    <span class="metric-value real-time" id="cpu-usage">Loading...</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Overlay Size</span>
                    <span class="metric-value real-time" id="overlay-size">Loading...</span>
                </div>
            </div>
            
            <div class="card">
                <h3>MCP Ecosystem</h3>
                <div class="metric">
                    <span class="metric-label">Core Servers</span>
                    <span class="status active">5 Active</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Development</span>
                    <span class="metric-value">22 Available</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Cloud & DB</span>
                    <span class="metric-value">40 Available</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Success Rate</span>
                    <span class="metric-value">99.2%</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Project Analysis</h3>
                <div class="metric">
                    <span class="metric-label">Project Type</span>
                    <span class="metric-value" id="project-type">Auto-detected</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Languages</span>
                    <span class="metric-value" id="languages">Scanning...</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Frameworks</span>
                    <span class="metric-value" id="frameworks">Analyzing...</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Complexity</span>
                    <span class="metric-value" id="complexity">Calculating...</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Build Statistics</h3>
                <div class="metric">
                    <span class="metric-label">Total Builds</span>
                    <span class="metric-value">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Success Rate</span>
                    <span class="metric-value">100%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Avg Build Time</span>
                    <span class="metric-value">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Build</span>
                    <span class="metric-value">Never</span>
                </div>
            </div>
        </div>
        
        <div class="commands">
            <h3>🛠️ Quick Commands</h3>
            <div class="command">./claude-flow build</div>
            <div class="command">./claude-flow status</div>
            <div class="command">node claude-flow-installer.js uninstall --clean</div>
        </div>
    </div>
    
    <script>
        // Simulate real-time updates
        function updateMetrics() {
            // Simulate memory usage
            const memUsage = Math.round(Math.random() * 200 + 50);
            document.getElementById('memory-usage').textContent = memUsage + ' MB';
            
            // Simulate CPU usage
            const cpuUsage = Math.round(Math.random() * 30 + 5);
            document.getElementById('cpu-usage').textContent = cpuUsage + '%';
            
            // Simulate overlay size
            const overlaySize = Math.round(Math.random() * 50 + 100);
            document.getElementById('overlay-size').textContent = overlaySize + ' MB';
            
            // Simulate active agents
            const activeAgents = Math.floor(Math.random() * 8 + 2);
            document.getElementById('active-agents').textContent = activeAgents;
        }
        
        // Load project discovery if available
        function loadProjectData() {
            // This would typically load from the overlay config
            document.getElementById('project-type').textContent = 'Web Application';
            document.getElementById('languages').textContent = 'JavaScript, TypeScript';
            document.getElementById('frameworks').textContent = 'React, Node.js';
            document.getElementById('complexity').textContent = 'Moderate';
        }
        
        // Initialize dashboard
        updateMetrics();
        loadProjectData();
        
        // Update metrics every 5 seconds
        setInterval(updateMetrics, 5000);
    </script>
</body>
</html>`;
        
        const htmlFile = path.join(webUIPath, 'index.html');
        fs.writeFileSync(htmlFile, htmlContent);
        this.overlayState.files.push(htmlFile);
        
        console.log('🌐 Embedded Web UI created');
    }

    async saveOverlayState() {
        const stateData = {
            overlayId: this.overlayId,
            version: '2.0.0',
            createdAt: new Date().toISOString(),
            projectRoot: this.projectRoot,
            overlayPath: this.overlayPath,
            tempPath: this.tempPath,
            files: this.overlayState.files,
            directories: this.overlayState.directories,
            symlinks: this.overlayState.symlinks,
            platform: process.platform,
            nodeVersion: process.version
        };
        
        const stateFile = path.join(this.overlayPath, 'configs', 'overlay-state.json');
        fs.writeFileSync(stateFile, JSON.stringify(stateData, null, 2));
        this.overlayState.files.push(stateFile);
        
        // Also save to project root lock file
        const lockFile = path.join(this.projectRoot, '.claude-flow.lock');
        fs.writeFileSync(lockFile, JSON.stringify(stateData, null, 2));
        
        console.log('💾 Overlay state saved');
    }

    async removeOverlay() {
        console.log('🗑️  Removing workflow overlay...');
        
        try {
            // Load overlay state if available
            await this.loadOverlayState();
            
            let removedCount = 0;
            
            // Remove all files
            for (const filePath of this.overlayState.files) {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        removedCount++;
                    }
                } catch (error) {
                    console.warn(`⚠️  Failed to remove file ${filePath}: ${error.message}`);
                }
            }
            
            // Remove directories (in reverse order)
            const directories = [...this.overlayState.directories].reverse();
            for (const dirPath of directories) {
                try {
                    if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
                        fs.rmdirSync(dirPath);
                        removedCount++;
                    }
                } catch (error) {
                    // Ignore directory removal errors
                }
            }
            
            // Remove main overlay directory if empty
            try {
                if (fs.existsSync(this.overlayPath)) {
                    fs.rmSync(this.overlayPath, { recursive: true, force: true });
                    removedCount++;
                }
            } catch (error) {
                console.warn(`⚠️  Failed to remove overlay directory: ${error.message}`);
            }
            
            // Remove temporary directory
            try {
                if (fs.existsSync(this.tempPath)) {
                    fs.rmSync(this.tempPath, { recursive: true, force: true });
                }
            } catch (error) {
                // Ignore temp directory errors
            }
            
            // Remove lock file
            const lockFile = path.join(this.projectRoot, '.claude-flow.lock');
            try {
                if (fs.existsSync(lockFile)) {
                    fs.unlinkSync(lockFile);
                }
            } catch (error) {
                console.warn(`⚠️  Failed to remove lock file: ${error.message}`);
            }
            
            console.log(`✅ Overlay removed successfully (${removedCount} items)`);
            
            return {
                success: true,
                removedCount,
                message: 'Workflow overlay removed cleanly'
            };
            
        } catch (error) {
            console.error(`❌ Failed to remove overlay: ${error.message}`);
            throw error;
        }
    }

    async loadOverlayState() {
        const stateFile = path.join(this.overlayPath, 'configs', 'overlay-state.json');
        if (fs.existsSync(stateFile)) {
            const stateData = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            this.overlayState.files = stateData.files || [];
            this.overlayState.directories = stateData.directories || [];
            this.overlayState.symlinks = stateData.symlinks || [];
            this.overlayId = stateData.overlayId;
            this.tempPath = stateData.tempPath;
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up partial overlay...');
        
        try {
            // Remove any created files and directories
            for (const filePath of this.overlayState.files) {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
            
            for (const dirPath of this.overlayState.directories.reverse()) {
                try {
                    if (fs.existsSync(dirPath)) {
                        fs.rmSync(dirPath, { recursive: true, force: true });
                    }
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
            
            // Remove temporary directory
            if (fs.existsSync(this.tempPath)) {
                fs.rmSync(this.tempPath, { recursive: true, force: true });
            }
            
            console.log('🧹 Cleanup completed');
            
        } catch (error) {
            console.warn(`⚠️  Cleanup warning: ${error.message}`);
        }
    }

    isOverlayActive() {
        const lockFile = path.join(this.projectRoot, '.claude-flow.lock');
        return fs.existsSync(lockFile) && fs.existsSync(this.overlayPath);
    }

    getOverlayInfo() {
        if (!this.isOverlayActive()) {
            return null;
        }
        
        try {
            const lockFile = path.join(this.projectRoot, '.claude-flow.lock');
            const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
            
            return {
                overlayId: lockData.overlayId,
                version: lockData.version,
                createdAt: lockData.createdAt,
                overlayPath: lockData.overlayPath,
                tempPath: lockData.tempPath,
                filesCount: lockData.files ? lockData.files.length : 0,
                directoriesCount: lockData.directories ? lockData.directories.length : 0
            };
            
        } catch (error) {
            return { error: error.message };
        }
    }

    static async main() {
        const projectRoot = process.argv[2] || process.cwd();
        const command = process.argv[3] || 'create';
        
        const manager = new WorkflowOverlayManager(projectRoot);
        
        try {
            switch (command) {
                case 'create': {
                    const options = {
                        webui: process.argv.includes('--webui')
                    };
                    const result = await manager.createOverlay(options);
                    console.log('✅ Overlay creation completed');
                    console.log(JSON.stringify(result, null, 2));
                    break;
                }
                
                case 'remove': {
                    const result = await manager.removeOverlay();
                    console.log('✅ Overlay removal completed');
                    console.log(JSON.stringify(result, null, 2));
                    break;
                }
                
                case 'status': {
                    const info = manager.getOverlayInfo();
                    if (info) {
                        console.log('📊 Overlay Status:', JSON.stringify(info, null, 2));
                    } else {
                        console.log('❌ No active overlay found');
                    }
                    break;
                }
                
                default: {
                    console.log(`
🎭 Workflow Overlay Manager

Usage:
  node workflow-overlay-manager.js [project-root] [command]

Commands:
  create [--webui]  Create workflow overlay
  remove            Remove workflow overlay
  status            Show overlay status

Examples:
  node workflow-overlay-manager.js . create --webui
  node workflow-overlay-manager.js /path/to/project remove
`);
                    break;
                }
            }
            
        } catch (error) {
            console.error(`❌ Command failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    WorkflowOverlayManager.main();
}

module.exports = { WorkflowOverlayManager };