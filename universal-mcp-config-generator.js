#!/usr/bin/env node

/**
 * Universal MCP Configuration Generator v4.0
 * 
 * Companion to Universal MCP Discovery System that generates
 * optimized configurations for any project structure and integrates
 * with Enhanced MCP Ecosystem v3.0
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class UniversalMcpConfigGenerator {
    constructor(discoveryResults, options = {}) {
        this.results = discoveryResults;
        this.options = {
            generateDocker: true,
            generateKubernetes: true,
            generateTerraform: true,
            generateCICD: true,
            optimizePerformance: true,
            enableHotReload: true,
            ...options
        };
        
        this.templates = {
            mcpServer: this.createMcpServerTemplate(),
            dockerCompose: this.createDockerComposeTemplate(),
            kubernetes: this.createKubernetesTemplate(),
            terraform: this.createTerraformTemplate(),
            githubActions: this.createGithubActionsTemplate(),
            makefile: this.createMakefileTemplate()
        };
    }

    async generateAllConfigurations(outputDir) {
        const configDir = path.join(outputDir, 'mcp-configurations');
        await fs.promises.mkdir(configDir, { recursive: true });

        console.log('🎯 Generating Universal MCP Configurations...');
        
        // Core MCP configuration
        await this.generateMcpConfiguration(configDir);
        
        // Environment-specific configurations
        await this.generateEnvironmentConfigurations(configDir);
        
        // Container configurations
        if (this.options.generateDocker) {
            await this.generateDockerConfigurations(configDir);
        }
        
        // Kubernetes configurations
        if (this.options.generateKubernetes) {
            await this.generateKubernetesConfigurations(configDir);
        }
        
        // Infrastructure as Code
        if (this.options.generateTerraform) {
            await this.generateTerraformConfigurations(configDir);
        }
        
        // CI/CD configurations
        if (this.options.generateCICD) {
            await this.generateCICDConfigurations(configDir);
        }
        
        // Development tools
        await this.generateDevelopmentConfigurations(configDir);
        
        // Monitoring and observability
        await this.generateMonitoringConfigurations(configDir);
        
        console.log(`✅ All configurations generated in: ${configDir}`);
        return configDir;
    }

    async generateMcpConfiguration(outputDir) {
        const mcpDir = path.join(outputDir, 'mcp');
        await fs.promises.mkdir(mcpDir, { recursive: true });

        // Main MCP configuration
        const mainConfig = {
            version: '3.0',
            metadata: {
                generated: new Date().toISOString(),
                generator: 'universal-mcp-config-generator',
                version: '4.0.0',
                project: this.results.discovery.projectRoot
            },
            global: {
                timeout: 30000,
                retries: 3,
                logLevel: 'info',
                enableMetrics: true,
                enableTracing: this.options.optimizePerformance,
                hotReload: this.options.enableHotReload
            },
            servers: this.generateServerConfigurations(),
            routing: this.generateRoutingConfiguration(),
            loadBalancing: this.generateLoadBalancingConfiguration(),
            monitoring: this.generateMonitoringConfiguration(),
            security: this.generateSecurityConfiguration()
        };

        await fs.promises.writeFile(
            path.join(mcpDir, 'mcp-config.json'),
            JSON.stringify(mainConfig, null, 2)
        );

        // Server-specific configurations
        for (const server of this.results.servers.filter(s => s.enabled)) {
            const serverConfig = this.generateIndividualServerConfig(server);
            await fs.promises.writeFile(
                path.join(mcpDir, `${server.name}.json`),
                JSON.stringify(serverConfig, null, 2)
            );
        }

        // Generate server registry
        const registry = this.generateServerRegistry();
        await fs.promises.writeFile(
            path.join(mcpDir, 'server-registry.json'),
            JSON.stringify(registry, null, 2)
        );

        console.log('📋 MCP configuration files generated');
    }

    generateServerConfigurations() {
        const configs = {};
        
        for (const server of this.results.servers.filter(s => s.enabled)) {
            configs[server.name] = {
                enabled: true,
                priority: server.priority,
                category: server.category,
                type: server.type,
                config: {
                    ...server.config,
                    healthCheck: {
                        enabled: true,
                        endpoint: '/health',
                        interval: server.priority > 80 ? 30000 : 60000,
                        timeout: 5000,
                        retries: 3
                    },
                    connection: {
                        maxConnections: Math.ceil(server.priority / 20),
                        keepAlive: true,
                        timeout: 30000,
                        pool: {
                            min: 1,
                            max: Math.ceil(server.priority / 10),
                            acquireTimeout: 10000,
                            createTimeout: 5000,
                            destroyTimeout: 3000,
                            idleTimeout: 300000
                        }
                    },
                    logging: {
                        level: server.priority > 85 ? 'debug' : 'info',
                        structured: true,
                        includeMetrics: server.priority > 80,
                        tracing: this.options.optimizePerformance
                    },
                    performance: {
                        caching: {
                            enabled: this.options.optimizePerformance,
                            ttl: server.priority > 85 ? 300 : 600,
                            maxSize: '100MB'
                        },
                        compression: {
                            enabled: true,
                            algorithm: 'gzip',
                            threshold: 1024
                        }
                    }
                }
            };
        }
        
        return configs;
    }

    generateRoutingConfiguration() {
        const routes = {};
        const categories = [...new Set(this.results.servers.map(s => s.category))];
        
        for (const category of categories) {
            const categoryServers = this.results.servers.filter(s => s.category === category && s.enabled);
            routes[category] = {
                strategy: 'round_robin',
                servers: categoryServers.map(s => s.name),
                healthCheck: true,
                failover: {
                    enabled: true,
                    timeout: 5000,
                    maxRetries: 3
                }
            };
        }
        
        return routes;
    }

    generateLoadBalancingConfiguration() {
        return {
            algorithm: 'weighted_round_robin',
            weights: this.generateServerWeights(),
            healthCheck: {
                enabled: true,
                interval: 30000,
                timeout: 5000,
                unhealthyThreshold: 3,
                healthyThreshold: 2
            },
            circuitBreaker: {
                enabled: true,
                failureThreshold: 5,
                resetTimeout: 30000,
                monitoringPeriod: 60000
            }
        };
    }

    generateServerWeights() {
        const weights = {};
        for (const server of this.results.servers.filter(s => s.enabled)) {
            weights[server.name] = Math.max(1, Math.ceil(server.priority / 20));
        }
        return weights;
    }

    generateMonitoringConfiguration() {
        return {
            metrics: {
                enabled: true,
                endpoint: '/metrics',
                format: 'prometheus',
                interval: 15000
            },
            tracing: {
                enabled: this.options.optimizePerformance,
                sampler: 'probabilistic',
                samplingRate: 0.1,
                exporter: 'jaeger'
            },
            logging: {
                level: 'info',
                format: 'json',
                outputs: ['console', 'file'],
                rotation: {
                    enabled: true,
                    maxSize: '100MB',
                    maxFiles: 10
                }
            }
        };
    }

    generateSecurityConfiguration() {
        const isProduction = this.results.analysis.infrastructure.deployment.length > 0;
        
        return {
            authentication: {
                enabled: isProduction,
                type: 'jwt',
                secretKey: '${MCP_SECRET_KEY}',
                expiresIn: '1h'
            },
            authorization: {
                enabled: isProduction,
                rbac: {
                    enabled: true,
                    roles: ['admin', 'user', 'readonly']
                }
            },
            rateLimiting: {
                enabled: true,
                windowMs: 60000,
                maxRequests: 1000,
                skipSuccessfulRequests: false
            },
            cors: {
                enabled: true,
                origins: ['http://localhost:3000', 'https://*.vercel.app'],
                credentials: true
            },
            headers: {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            }
        };
    }

    generateIndividualServerConfig(server) {
        return {
            name: server.name,
            version: '1.0.0',
            description: server.description,
            category: server.category,
            type: server.type,
            enabled: server.enabled,
            priority: server.priority,
            
            server: {
                host: '0.0.0.0',
                port: this.assignServerPort(server),
                protocol: server.type === 'builtin' ? 'internal' : 'http'
            },
            
            capabilities: this.generateServerCapabilities(server),
            tools: this.generateServerTools(server),
            resources: this.generateServerResources(server),
            
            configuration: {
                ...server.config,
                environment: this.generateServerEnvironment(server),
                dependencies: this.generateServerDependencies(server)
            }
        };
    }

    assignServerPort(server) {
        const basePort = 9000;
        const portOffset = server.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;
        return basePort + portOffset;
    }

    generateServerCapabilities(server) {
        const capabilities = ['health_check', 'metrics'];
        
        if (server.category === 'core') {
            capabilities.push('routing', 'load_balancing');
        }
        
        if (server.category.includes('database')) {
            capabilities.push('transactions', 'migrations', 'backup');
        }
        
        if (server.category.includes('ai')) {
            capabilities.push('streaming', 'batch_processing');
        }
        
        return capabilities;
    }

    generateServerTools(server) {
        // Generate tool definitions based on server type and category
        const tools = {};
        
        if (server.tools && Array.isArray(server.tools)) {
            for (const toolName of server.tools) {
                tools[toolName] = {
                    description: `${toolName} tool for ${server.name}`,
                    parameters: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                };
            }
        }
        
        return tools;
    }

    generateServerResources(server) {
        const resources = {};
        
        if (server.resources && Array.isArray(server.resources)) {
            for (const resourceName of server.resources) {
                resources[resourceName] = {
                    description: `${resourceName} resource for ${server.name}`,
                    uri: `mcp://${server.name}/${resourceName}`,
                    mimeType: 'application/json'
                };
            }
        }
        
        return resources;
    }

    generateServerEnvironment(server) {
        const env = {
            NODE_ENV: '${NODE_ENV:-production}',
            LOG_LEVEL: '${LOG_LEVEL:-info}',
            MCP_SERVER_NAME: server.name,
            MCP_SERVER_CATEGORY: server.category
        };
        
        // Add server-specific environment variables
        if (server.category.includes('database')) {
            env.DATABASE_URL = '${DATABASE_URL}';
            env.DB_POOL_SIZE = '${DB_POOL_SIZE:-10}';
        }
        
        if (server.category.includes('ai')) {
            env.OPENAI_API_KEY = '${OPENAI_API_KEY}';
            env.ANTHROPIC_API_KEY = '${ANTHROPIC_API_KEY}';
        }
        
        if (server.category.includes('cloud')) {
            env.AWS_REGION = '${AWS_REGION:-us-east-1}';
            env.GCP_PROJECT = '${GCP_PROJECT}';
        }
        
        return env;
    }

    generateServerDependencies(server) {
        const dependencies = [];
        
        // Add common dependencies
        if (server.category === 'core') {
            dependencies.push('filesystem', 'http');
        }
        
        // Add category-specific dependencies
        if (server.category.includes('database')) {
            dependencies.push('core_postgres', 'core_redis');
        }
        
        if (server.category.includes('monitoring')) {
            dependencies.push('prometheus', 'grafana');
        }
        
        return dependencies;
    }

    generateServerRegistry() {
        return {
            version: '3.0',
            servers: this.results.servers.map(server => ({
                id: server.name,
                name: server.name,
                category: server.category,
                type: server.type,
                enabled: server.enabled,
                priority: server.priority,
                confidence: server.confidence,
                endpoint: server.type === 'builtin' ? 'internal' : `http://localhost:${this.assignServerPort(server)}`,
                healthCheck: `/health`,
                metrics: `/metrics`,
                tags: [
                    server.category,
                    server.type,
                    `priority-${Math.ceil(server.priority / 20)}`,
                    `confidence-${Math.ceil(server.confidence / 25)}`
                ]
            })),
            categories: this.generateCategoryRegistry(),
            dependencies: this.generateDependencyGraph()
        };
    }

    generateCategoryRegistry() {
        const categories = {};
        const allCategories = [...new Set(this.results.servers.map(s => s.category))];
        
        for (const category of allCategories) {
            const servers = this.results.servers.filter(s => s.category === category);
            categories[category] = {
                name: category,
                description: `${category} servers`,
                serverCount: servers.length,
                enabledCount: servers.filter(s => s.enabled).length,
                averagePriority: Math.round(servers.reduce((sum, s) => sum + s.priority, 0) / servers.length),
                servers: servers.map(s => s.name)
            };
        }
        
        return categories;
    }

    generateDependencyGraph() {
        const graph = {};
        
        for (const server of this.results.servers) {
            graph[server.name] = {
                dependsOn: server.dependencies || [],
                dependents: this.results.servers
                    .filter(s => s.dependencies && s.dependencies.includes(server.name))
                    .map(s => s.name)
            };
        }
        
        return graph;
    }

    async generateEnvironmentConfigurations(outputDir) {
        const envDir = path.join(outputDir, 'environments');
        await fs.promises.mkdir(envDir, { recursive: true });

        const environments = ['development', 'testing', 'staging', 'production'];
        
        for (const env of environments) {
            const config = this.generateEnvironmentConfig(env);
            await fs.promises.writeFile(
                path.join(envDir, `${env}.json`),
                JSON.stringify(config, null, 2)
            );
        }

        // Generate .env files
        await this.generateEnvFiles(envDir);
        
        console.log('🌍 Environment configurations generated');
    }

    generateEnvironmentConfig(environment) {
        const baseConfig = {
            environment,
            timestamp: new Date().toISOString(),
            
            global: {
                logLevel: environment === 'production' ? 'info' : 'debug',
                enableMetrics: true,
                enableTracing: environment !== 'development',
                hotReload: environment === 'development'
            },
            
            servers: {}
        };

        for (const server of this.results.servers.filter(s => s.enabled)) {
            baseConfig.servers[server.name] = {
                enabled: true,
                replicas: environment === 'production' ? 
                    Math.max(1, Math.ceil(server.priority / 50)) : 1,
                resources: this.generateResourceLimits(server, environment),
                scaling: this.generateScalingConfig(server, environment)
            };
        }

        return baseConfig;
    }

    generateResourceLimits(server, environment) {
        const multiplier = {
            development: 0.5,
            testing: 0.7,
            staging: 0.8,
            production: 1.0
        }[environment];

        const baseCpu = Math.max(100, server.priority * 2);
        const baseMemory = Math.max(128, server.priority * 4);

        return {
            requests: {
                cpu: `${Math.round(baseCpu * multiplier)}m`,
                memory: `${Math.round(baseMemory * multiplier)}Mi`
            },
            limits: {
                cpu: `${Math.round(baseCpu * multiplier * 2)}m`,
                memory: `${Math.round(baseMemory * multiplier * 2)}Mi`
            }
        };
    }

    generateScalingConfig(server, environment) {
        if (environment === 'production') {
            return {
                minReplicas: 1,
                maxReplicas: Math.max(3, Math.ceil(server.priority / 30)),
                targetCPUUtilization: 70,
                targetMemoryUtilization: 80
            };
        }
        
        return {
            minReplicas: 1,
            maxReplicas: 1,
            targetCPUUtilization: 80,
            targetMemoryUtilization: 90
        };
    }

    async generateEnvFiles(envDir) {
        const environments = ['development', 'testing', 'staging', 'production'];
        
        for (const env of environments) {
            const envVars = this.generateEnvironmentVariables(env);
            const envContent = Object.entries(envVars)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            
            await fs.promises.writeFile(
                path.join(envDir, `.env.${env}`),
                envContent
            );
        }

        // Generate .env.example
        const exampleVars = this.generateEnvironmentVariables('example');
        const exampleContent = Object.entries(exampleVars)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        await fs.promises.writeFile(
            path.join(envDir, '.env.example'),
            exampleContent
        );
    }

    generateEnvironmentVariables(environment) {
        const vars = {
            NODE_ENV: environment === 'example' ? 'development' : environment,
            LOG_LEVEL: environment === 'production' ? 'info' : 'debug',
            MCP_VERSION: '3.0',
            MCP_CONFIG_PATH: './mcp/mcp-config.json',
            
            // Server-specific variables
            MCP_SERVER_PORT: '9000',
            MCP_DASHBOARD_PORT: '3000',
            MCP_METRICS_PORT: '9090',
            
            // Database variables (if needed)
            DATABASE_URL: environment === 'example' ? 
                'postgresql://user:pass@localhost:5432/dbname' : 
                '${DATABASE_URL}',
            
            // Cache variables
            REDIS_URL: environment === 'example' ? 
                'redis://localhost:6379' : 
                '${REDIS_URL}',
            
            // Security variables
            JWT_SECRET: environment === 'example' ? 
                'your-secret-key-here' : 
                '${JWT_SECRET}',
            
            // API keys (if AI servers are enabled)
            ...(this.hasAIServers() && {
                OPENAI_API_KEY: '${OPENAI_API_KEY}',
                ANTHROPIC_API_KEY: '${ANTHROPIC_API_KEY}'
            }),
            
            // Cloud provider variables (if cloud servers are enabled)
            ...(this.hasCloudServers() && {
                AWS_REGION: 'us-east-1',
                GCP_PROJECT: '${GCP_PROJECT}',
                AZURE_SUBSCRIPTION_ID: '${AZURE_SUBSCRIPTION_ID}'
            })
        };

        return vars;
    }

    hasAIServers() {
        return this.results.servers.some(s => s.category.includes('ai') && s.enabled);
    }

    hasCloudServers() {
        return this.results.servers.some(s => s.category.includes('cloud') && s.enabled);
    }

    async generateDockerConfigurations(outputDir) {
        const dockerDir = path.join(outputDir, 'docker');
        await fs.promises.mkdir(dockerDir, { recursive: true });

        // Generate Dockerfile
        const dockerfile = this.generateDockerfile();
        await fs.promises.writeFile(path.join(dockerDir, 'Dockerfile'), dockerfile);

        // Generate docker-compose.yml
        const dockerCompose = this.generateDockerCompose();
        await fs.promises.writeFile(path.join(dockerDir, 'docker-compose.yml'), dockerCompose);

        // Generate .dockerignore
        const dockerignore = this.generateDockerignore();
        await fs.promises.writeFile(path.join(dockerDir, '.dockerignore'), dockerignore);

        console.log('🐳 Docker configurations generated');
    }

    generateDockerfile() {
        const primaryLang = this.results.analysis.languages.primary;
        const baseImage = this.selectDockerBaseImage(primaryLang);
        
        return `# Universal MCP Server Dockerfile
# Generated for project with primary language: ${primaryLang}

FROM ${baseImage}

# Set working directory
WORKDIR /app

# Copy configuration files
COPY mcp-configurations/ ./config/
COPY package*.json ./

# Install dependencies
${this.generateDockerInstallCommands(primaryLang)}

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S mcp && \\
    adduser -S mcp -u 1001

# Set permissions
RUN chown -R mcp:mcp /app
USER mcp

# Expose ports
EXPOSE 9000 3000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:9000/health || exit 1

# Start command
CMD ["npm", "start"]
`;
    }

    selectDockerBaseImage(language) {
        const imageMap = {
            javascript: 'node:18-alpine',
            typescript: 'node:18-alpine',
            python: 'python:3.11-slim',
            rust: 'rust:1.70-slim',
            go: 'golang:1.21-alpine',
            java: 'openjdk:17-alpine',
            csharp: 'mcr.microsoft.com/dotnet/runtime:7.0-alpine'
        };
        return imageMap[language] || 'alpine:latest';
    }

    generateDockerInstallCommands(language) {
        const commandMap = {
            javascript: 'RUN npm ci --only=production',
            typescript: 'RUN npm ci --only=production && npm run build',
            python: 'RUN pip install --no-cache-dir -r requirements.txt',
            rust: 'RUN cargo build --release',
            go: 'RUN go mod download && go build -o main .',
            java: 'RUN ./mvnw package -DskipTests',
            csharp: 'RUN dotnet restore && dotnet publish -c Release -o out'
        };
        return commandMap[language] || 'RUN echo "No specific install commands"';
    }

    generateDockerCompose() {
        const services = {
            'mcp-server': {
                build: '.',
                ports: ['9000:9000', '3000:3000', '9090:9090'],
                environment: [
                    'NODE_ENV=production',
                    'LOG_LEVEL=info'
                ],
                volumes: [
                    './config:/app/config:ro',
                    './logs:/app/logs'
                ],
                healthcheck: {
                    test: ['CMD', 'curl', '-f', 'http://localhost:9000/health'],
                    interval: '30s',
                    timeout: '3s',
                    retries: 3,
                    'start_period': '5s'
                },
                restart: 'unless-stopped'
            }
        };

        // Add database services if needed
        if (this.hasDatabaseServers()) {
            if (this.hasServer('postgres')) {
                services.postgres = {
                    image: 'postgres:15-alpine',
                    environment: [
                        'POSTGRES_DB=mcp',
                        'POSTGRES_USER=mcp',
                        'POSTGRES_PASSWORD=mcppass'
                    ],
                    volumes: ['postgres_data:/var/lib/postgresql/data'],
                    ports: ['5432:5432']
                };
            }

            if (this.hasServer('redis')) {
                services.redis = {
                    image: 'redis:7-alpine',
                    volumes: ['redis_data:/data'],
                    ports: ['6379:6379']
                };
            }
        }

        // Add monitoring services
        if (this.hasMonitoringServers()) {
            services.prometheus = {
                image: 'prom/prometheus:latest',
                ports: ['9091:9090'],
                volumes: ['./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro']
            };

            services.grafana = {
                image: 'grafana/grafana:latest',
                ports: ['3001:3000'],
                environment: [
                    'GF_SECURITY_ADMIN_PASSWORD=admin'
                ],
                volumes: ['grafana_data:/var/lib/grafana']
            };
        }

        const compose = {
            version: '3.8',
            services,
            volumes: this.generateDockerVolumes(),
            networks: {
                mcp: {
                    driver: 'bridge'
                }
            }
        };

        // Convert to YAML manually to avoid js-yaml dependency
        const yamlContent = this.convertToYaml(compose);
        return `# Universal MCP Docker Compose Configuration
# Generated by Universal MCP Config Generator v4.0

${yamlContent}`;
    }

    generateDockerVolumes() {
        const volumes = {};
        
        if (this.hasServer('postgres')) {
            volumes.postgres_data = {};
        }
        
        if (this.hasServer('redis')) {
            volumes.redis_data = {};
        }
        
        if (this.hasMonitoringServers()) {
            volumes.grafana_data = {};
        }
        
        return volumes;
    }

    generateDockerignore() {
        return `# Universal MCP .dockerignore
# Generated by Universal MCP Config Generator v4.0

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/

# Rust
target/
Cargo.lock

# Go
vendor/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.coveralls.yml

# nyc test coverage
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Git
.git/
.gitignore
README.md
CHANGELOG.md

# Test files
test/
tests/
__tests__/
*.test.js
*.spec.js

# Development files
docs/
examples/
demo/
`;
    }

    hasDatabaseServers() {
        return this.results.servers.some(s => s.category.includes('database') && s.enabled);
    }

    hasMonitoringServers() {
        return this.results.servers.some(s => s.category.includes('monitoring') && s.enabled);
    }

    hasServer(serverName) {
        return this.results.servers.some(s => s.name === serverName && s.enabled);
    }

    async generateKubernetesConfigurations(outputDir) {
        const k8sDir = path.join(outputDir, 'kubernetes');
        await fs.promises.mkdir(k8sDir, { recursive: true });

        // Generate namespace
        const namespace = this.generateKubernetesNamespace();
        await fs.promises.writeFile(path.join(k8sDir, 'namespace.yaml'), namespace);

        // Generate deployment
        const deployment = this.generateKubernetesDeployment();
        await fs.promises.writeFile(path.join(k8sDir, 'deployment.yaml'), deployment);

        // Generate service
        const service = this.generateKubernetesService();
        await fs.promises.writeFile(path.join(k8sDir, 'service.yaml'), service);

        // Generate ingress
        const ingress = this.generateKubernetesIngress();
        await fs.promises.writeFile(path.join(k8sDir, 'ingress.yaml'), ingress);

        // Generate configmap
        const configmap = this.generateKubernetesConfigMap();
        await fs.promises.writeFile(path.join(k8sDir, 'configmap.yaml'), configmap);

        // Generate HPA (if needed)
        const hpa = this.generateKubernetesHPA();
        await fs.promises.writeFile(path.join(k8sDir, 'hpa.yaml'), hpa);

        console.log('☸️  Kubernetes configurations generated');
    }

    generateKubernetesNamespace() {
        return `apiVersion: v1
kind: Namespace
metadata:
  name: mcp-system
  labels:
    name: mcp-system
    generated-by: universal-mcp-config-generator
`;
    }

    generateKubernetesDeployment() {
        const replicas = Math.max(1, Math.ceil(this.results.servers.filter(s => s.enabled).length / 10));
        
        return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
  namespace: mcp-system
  labels:
    app: mcp-server
    version: v1
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
        version: v1
    spec:
      containers:
      - name: mcp-server
        image: mcp-server:latest
        ports:
        - containerPort: 9000
          name: api
        - containerPort: 3000
          name: dashboard
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        envFrom:
        - configMapRef:
            name: mcp-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 9000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 9000
          initialDelaySeconds: 5
          periodSeconds: 5
      restartPolicy: Always
`;
    }

    generateKubernetesService() {
        return `apiVersion: v1
kind: Service
metadata:
  name: mcp-server-service
  namespace: mcp-system
  labels:
    app: mcp-server
spec:
  type: ClusterIP
  ports:
  - name: api
    port: 9000
    targetPort: 9000
  - name: dashboard
    port: 3000
    targetPort: 3000
  - name: metrics
    port: 9090
    targetPort: 9090
  selector:
    app: mcp-server
`;
    }

    generateKubernetesIngress() {
        return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mcp-server-ingress
  namespace: mcp-system
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - mcp.example.com
    secretName: mcp-tls
  rules:
  - host: mcp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mcp-server-service
            port:
              number: 3000
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: mcp-server-service
            port:
              number: 9000
`;
    }

    generateKubernetesConfigMap() {
        return `apiVersion: v1
kind: ConfigMap
metadata:
  name: mcp-config
  namespace: mcp-system
data:
  MCP_VERSION: "3.0"
  MCP_CONFIG_PATH: "/app/config/mcp-config.json"
  LOG_LEVEL: "info"
  METRICS_ENABLED: "true"
  TRACING_ENABLED: "true"
`;
    }

    generateKubernetesHPA() {
        return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mcp-server-hpa
  namespace: mcp-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mcp-server
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
`;
    }

    // Template creation methods
    createMcpServerTemplate() {
        return {
            version: '1.0.0',
            name: '${SERVER_NAME}',
            description: '${SERVER_DESCRIPTION}',
            main: 'src/index.js',
            scripts: {
                start: 'node src/index.js',
                dev: 'nodemon src/index.js',
                test: 'jest',
                build: 'tsc'
            },
            dependencies: {
                '@modelcontextprotocol/sdk': '^0.4.0',
                express: '^4.18.2',
                cors: '^2.8.5'
            },
            devDependencies: {
                nodemon: '^3.0.1',
                jest: '^29.7.0',
                '@types/node': '^20.8.0',
                typescript: '^5.2.0'
            }
        };
    }

    createDockerComposeTemplate() {
        return `version: '3.8'
services:
  \${SERVICE_NAME}:
    build: .
    ports:
      - "\${PORT}:\${PORT}"
    environment:
      - NODE_ENV=production
    volumes:
      - ./config:/app/config:ro
    restart: unless-stopped
`;
    }

    createKubernetesTemplate() {
        return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: \${APP_NAME}
spec:
  replicas: \${REPLICAS}
  selector:
    matchLabels:
      app: \${APP_NAME}
  template:
    metadata:
      labels:
        app: \${APP_NAME}
    spec:
      containers:
      - name: \${APP_NAME}
        image: \${IMAGE}
        ports:
        - containerPort: \${PORT}
`;
    }

    createTerraformTemplate() {
        return `terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
`;
    }

    createGithubActionsTemplate() {
        return `name: MCP Server CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    - name: Deploy to production
      run: echo "Deploy logic here"
`;
    }

    createMakefileTemplate() {
        return `.PHONY: help build test deploy clean

help: ## Show this help message
	@echo 'Available commands:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \\033[36m%-15s\\033[0m %s\\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the application
	npm run build

test: ## Run tests
	npm test

deploy: ## Deploy the application
	docker-compose up -d

clean: ## Clean build artifacts
	rm -rf dist node_modules
`;
    }

    // YAML converter helper (to avoid external dependency)
    convertToYaml(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        let yaml = '';
        
        if (Array.isArray(obj)) {
            obj.forEach(item => {
                yaml += `${spaces}- ${this.convertToYaml(item, indent + 2)}\n`;
            });
        } else if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    yaml += `${spaces}${key}:\n`;
                    value.forEach(item => {
                        if (typeof item === 'string') {
                            yaml += `${spaces}  - ${item}\n`;
                        } else {
                            yaml += `${spaces}  -\n${this.convertToYaml(item, indent + 4)}`;
                        }
                    });
                } else if (value && typeof value === 'object') {
                    yaml += `${spaces}${key}:\n${this.convertToYaml(value, indent + 2)}`;
                } else {
                    yaml += `${spaces}${key}: ${value}\n`;
                }
            });
        } else {
            yaml += obj;
        }
        
        return yaml;
    }

    // Additional configuration methods would continue here...
    // This includes generateTerraformConfigurations, generateCICDConfigurations, etc.
}

// Export for module usage
module.exports = { UniversalMcpConfigGenerator };

// CLI interface
if (require.main === module) {
    console.log('Universal MCP Configuration Generator v4.0');
    console.log('This module requires discovery results from Universal MCP Discovery System');
    console.log('Usage: const generator = new UniversalMcpConfigGenerator(discoveryResults);');
    console.log('       generator.generateAllConfigurations(outputDir);');
}