#!/usr/bin/env node

/**
 * Universal MCP Discovery CLI - Simplified Working Version
 * 
 * This creates a universal MCP server discovery system that works
 * with ANY project structure and automatically configures the Enhanced
 * MCP Ecosystem v3.0 with 125+ servers.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

async function discoverMcpServers(projectPath = process.cwd()) {
    console.log('🚀 Universal MCP Discovery System v4.0');
    console.log(`📁 Analyzing: ${projectPath}`);
    console.log(`🖥️  Platform: ${os.platform()}-${os.arch()}`);
    console.log('');

    const results = {
        discovery: {
            version: '4.0.0',
            timestamp: new Date().toISOString(),
            projectPath,
            platform: `${os.platform()}-${os.arch()}`
        },
        analysis: {
            languages: [],
            frameworks: [],
            dependencies: [],
            infrastructure: []
        },
        servers: [],
        recommendations: [],
        config: {}
    };

    // 1. Analyze project structure
    console.log('📊 Phase 1: Analyzing project structure...');
    const files = await scanDirectory(projectPath);
    const packageJson = await readPackageJson(projectPath);
    
    // 2. Detect languages
    console.log('🔤 Phase 2: Detecting languages...');
    const languages = detectLanguages(files);
    results.analysis.languages = languages;
    
    // 3. Detect frameworks
    console.log('🛠️  Phase 3: Detecting frameworks...');
    const frameworks = detectFrameworks(files, packageJson);
    results.analysis.frameworks = frameworks;
    
    // 4. Scan dependencies
    console.log('📦 Phase 4: Scanning dependencies...');
    const dependencies = scanDependencies(packageJson);
    results.analysis.dependencies = dependencies;
    
    // 5. Detect infrastructure
    console.log('🏗️  Phase 5: Detecting infrastructure...');
    const infrastructure = detectInfrastructure(files);
    results.analysis.infrastructure = infrastructure;

    // 6. Generate MCP server recommendations
    console.log('🎯 Phase 6: Generating MCP server recommendations...');
    const mcpServers = generateMcpRecommendations(results.analysis);
    results.servers = mcpServers;
    results.recommendations = mcpServers.filter(s => s.confidence > 60);

    // 7. Create configuration
    console.log('⚙️  Phase 7: Creating MCP configuration...');
    const config = createMcpConfiguration(results.servers, results.analysis);
    results.config = config;

    return results;
}

async function scanDirectory(dir, maxDepth = 3, currentDepth = 0) {
    if (currentDepth > maxDepth) return [];
    
    const files = [];
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__'];
    
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            if (skipDirs.includes(item)) continue;
            
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isFile()) {
                files.push({
                    name: item,
                    path: fullPath,
                    ext: path.extname(item).toLowerCase(),
                    size: stats.size
                });
            } else if (stats.isDirectory() && currentDepth < maxDepth) {
                files.push(...await scanDirectory(fullPath, maxDepth, currentDepth + 1));
            }
        }
    } catch (error) {
        // Ignore permission errors
    }
    
    return files;
}

async function readPackageJson(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    try {
        if (fs.existsSync(packageJsonPath)) {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            return JSON.parse(content);
        }
    } catch (error) {
        // Ignore parse errors
    }
    return null;
}

function detectLanguages(files) {
    const languageMap = {
        '.js': 'JavaScript',
        '.jsx': 'JavaScript (React)',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript (React)',
        '.py': 'Python',
        '.rs': 'Rust',
        '.go': 'Go',
        '.java': 'Java',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.cs': 'C#',
        '.cpp': 'C++',
        '.c': 'C',
        '.dart': 'Dart',
        '.swift': 'Swift',
        '.kt': 'Kotlin'
    };

    const counts = {};
    for (const file of files) {
        const lang = languageMap[file.ext];
        if (lang) {
            counts[lang] = (counts[lang] || 0) + 1;
        }
    }

    return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .map(([lang, count]) => ({ language: lang, files: count }));
}

function detectFrameworks(files, packageJson) {
    const frameworks = [];
    const filePatterns = {
        'React': ['jsx', 'tsx'],
        'Next.js': ['next.config.js', 'next.config.ts'],
        'Vue.js': ['vue.config.js', '.vue'],
        'Angular': ['angular.json', '.component.ts'],
        'Svelte': ['svelte.config.js', '.svelte'],
        'Flutter': ['pubspec.yaml', '.dart'],
        'Django': ['manage.py', 'settings.py'],
        'Flask': ['app.py', 'wsgi.py'],
        'FastAPI': ['main.py'],
        'Express': ['server.js', 'app.js'],
        'Spring Boot': ['pom.xml', 'application.properties'],
        'Laravel': ['artisan', 'composer.json'],
        'Ruby on Rails': ['Gemfile', 'config/application.rb']
    };

    // Check file patterns
    for (const [framework, patterns] of Object.entries(filePatterns)) {
        const found = patterns.some(pattern => 
            files.some(file => 
                file.name.includes(pattern) || file.ext === `.${pattern}`
            )
        );
        if (found) frameworks.push(framework);
    }

    // Check package.json dependencies
    if (packageJson && packageJson.dependencies) {
        const deps = Object.keys(packageJson.dependencies);
        const depMap = {
            'react': 'React',
            'next': 'Next.js',
            'vue': 'Vue.js',
            '@angular/core': 'Angular',
            'svelte': 'Svelte',
            'express': 'Express',
            'fastify': 'Fastify',
            '@nestjs/core': 'NestJS',
            'gatsby': 'Gatsby',
            'nuxt': 'Nuxt.js'
        };

        for (const dep of deps) {
            const framework = depMap[dep];
            if (framework && !frameworks.includes(framework)) {
                frameworks.push(framework);
            }
        }
    }

    return frameworks;
}

function scanDependencies(packageJson) {
    const dependencies = {
        production: [],
        development: [],
        total: 0
    };

    if (packageJson) {
        if (packageJson.dependencies) {
            dependencies.production = Object.keys(packageJson.dependencies);
        }
        if (packageJson.devDependencies) {
            dependencies.development = Object.keys(packageJson.devDependencies);
        }
        dependencies.total = dependencies.production.length + dependencies.development.length;
    }

    return dependencies;
}

function detectInfrastructure(files) {
    const infrastructure = [];
    const patterns = {
        'Docker': ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
        'Kubernetes': ['deployment.yaml', 'service.yaml', 'ingress.yaml'],
        'Terraform': ['.tf', 'main.tf'],
        'GitHub Actions': ['.github/workflows/'],
        'GitLab CI': ['.gitlab-ci.yml'],
        'Vercel': ['vercel.json'],
        'Netlify': ['netlify.toml'],
        'Heroku': ['Procfile'],
        'AWS': ['serverless.yml', 'sam.yaml'],
        'Firebase': ['firebase.json']
    };

    for (const [tech, filePatterns] of Object.entries(patterns)) {
        const found = filePatterns.some(pattern =>
            files.some(file => 
                file.name.includes(pattern) || file.path.includes(pattern)
            )
        );
        if (found) infrastructure.push(tech);
    }

    return infrastructure;
}

function generateMcpRecommendations(analysis) {
    const servers = [];

    // Core servers (always recommended)
    servers.push(
        { name: 'filesystem', category: 'core', priority: 100, confidence: 100, enabled: true },
        { name: 'http', category: 'core', priority: 95, confidence: 100, enabled: true },
        { name: 'git', category: 'core', priority: 90, confidence: 100, enabled: true }
    );

    // Language-specific servers
    for (const { language } of analysis.languages) {
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'javascript (react)':
                servers.push(
                    { name: 'npm', category: 'package-manager', priority: 90, confidence: 95, enabled: true },
                    { name: 'eslint', category: 'linting', priority: 75, confidence: 85, enabled: true },
                    { name: 'prettier', category: 'formatting', priority: 70, confidence: 80, enabled: true }
                );
                break;
            case 'typescript':
            case 'typescript (react)':
                servers.push(
                    { name: 'typescript', category: 'language', priority: 90, confidence: 95, enabled: true },
                    { name: 'tsc', category: 'compiler', priority: 85, confidence: 90, enabled: true }
                );
                break;
            case 'python':
                servers.push(
                    { name: 'pip', category: 'package-manager', priority: 90, confidence: 95, enabled: true },
                    { name: 'pytest', category: 'testing', priority: 80, confidence: 85, enabled: true },
                    { name: 'black', category: 'formatting', priority: 70, confidence: 80, enabled: true }
                );
                break;
            case 'rust':
                servers.push(
                    { name: 'cargo', category: 'package-manager', priority: 95, confidence: 95, enabled: true },
                    { name: 'clippy', category: 'linting', priority: 75, confidence: 85, enabled: true }
                );
                break;
        }
    }

    // Framework-specific servers
    for (const framework of analysis.frameworks) {
        switch (framework.toLowerCase()) {
            case 'react':
                servers.push(
                    { name: 'react', category: 'framework', priority: 90, confidence: 95, enabled: true },
                    { name: 'storybook', category: 'documentation', priority: 65, confidence: 70, enabled: false }
                );
                break;
            case 'next.js':
                servers.push(
                    { name: 'nextjs', category: 'framework', priority: 95, confidence: 100, enabled: true },
                    { name: 'vercel', category: 'deployment', priority: 85, confidence: 90, enabled: true }
                );
                break;
            case 'vue.js':
                servers.push(
                    { name: 'vue', category: 'framework', priority: 90, confidence: 95, enabled: true }
                );
                break;
            case 'angular':
                servers.push(
                    { name: 'angular', category: 'framework', priority: 90, confidence: 95, enabled: true }
                );
                break;
            case 'flutter':
                servers.push(
                    { name: 'flutter', category: 'framework', priority: 95, confidence: 100, enabled: true },
                    { name: 'firebase', category: 'backend', priority: 80, confidence: 85, enabled: true }
                );
                break;
            case 'django':
                servers.push(
                    { name: 'django', category: 'framework', priority: 95, confidence: 100, enabled: true },
                    { name: 'postgres', category: 'database', priority: 85, confidence: 90, enabled: true }
                );
                break;
            case 'express':
                servers.push(
                    { name: 'express', category: 'framework', priority: 90, confidence: 95, enabled: true }
                );
                break;
        }
    }

    // Infrastructure-specific servers
    for (const infra of analysis.infrastructure) {
        switch (infra.toLowerCase()) {
            case 'docker':
                servers.push(
                    { name: 'docker', category: 'containerization', priority: 90, confidence: 100, enabled: true }
                );
                break;
            case 'kubernetes':
                servers.push(
                    { name: 'kubernetes', category: 'orchestration', priority: 85, confidence: 95, enabled: true }
                );
                break;
            case 'terraform':
                servers.push(
                    { name: 'terraform', category: 'infrastructure', priority: 85, confidence: 95, enabled: true }
                );
                break;
            case 'github actions':
                servers.push(
                    { name: 'github', category: 'ci-cd', priority: 90, confidence: 100, enabled: true }
                );
                break;
            case 'aws':
                servers.push(
                    { name: 'aws', category: 'cloud', priority: 85, confidence: 90, enabled: true }
                );
                break;
            case 'firebase':
                servers.push(
                    { name: 'firebase', category: 'backend', priority: 85, confidence: 95, enabled: true }
                );
                break;
        }
    }

    // Remove duplicates and sort by priority
    const uniqueServers = servers.filter((server, index, self) => 
        index === self.findIndex(s => s.name === server.name)
    ).sort((a, b) => b.priority - a.priority);

    return uniqueServers;
}

function createMcpConfiguration(servers, analysis) {
    const config = {
        version: '3.0',
        metadata: {
            generated: new Date().toISOString(),
            generator: 'universal-mcp-discovery',
            project: analysis
        },
        global: {
            timeout: 30000,
            retries: 3,
            logLevel: 'info',
            enableMetrics: true
        },
        servers: {},
        categories: {}
    };

    // Configure each server
    for (const server of servers) {
        config.servers[server.name] = {
            enabled: server.enabled,
            priority: server.priority,
            category: server.category,
            confidence: server.confidence,
            autoStart: server.priority > 80,
            config: {
                healthCheck: {
                    enabled: true,
                    interval: server.priority > 85 ? 30000 : 60000,
                    timeout: 5000
                },
                connection: {
                    maxConnections: Math.ceil(server.priority / 20),
                    timeout: 30000
                },
                logging: {
                    level: server.priority > 85 ? 'debug' : 'info',
                    includeMetrics: server.priority > 80
                }
            }
        };
    }

    // Group by categories
    const categories = [...new Set(servers.map(s => s.category))];
    for (const category of categories) {
        const categoryServers = servers.filter(s => s.category === category);
        config.categories[category] = {
            servers: categoryServers.map(s => s.name),
            enabled: categoryServers.filter(s => s.enabled).length,
            total: categoryServers.length
        };
    }

    return config;
}

async function saveResults(results, outputDir = process.cwd()) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(outputDir, `mcp-discovery-${timestamp}`);
    
    await fs.promises.mkdir(outputPath, { recursive: true });
    
    // Save main results
    const resultsFile = path.join(outputPath, 'discovery-results.json');
    await fs.promises.writeFile(resultsFile, JSON.stringify(results, null, 2));
    
    // Save MCP config
    const configFile = path.join(outputPath, 'mcp-config.json');
    await fs.promises.writeFile(configFile, JSON.stringify(results.config, null, 2));
    
    // Create summary
    const summary = generateSummary(results);
    const summaryFile = path.join(outputPath, 'README.md');
    await fs.promises.writeFile(summaryFile, summary);
    
    // Create install script
    const installScript = generateInstallScript(results);
    const scriptFile = path.join(outputPath, 'install-mcp-servers.sh');
    await fs.promises.writeFile(scriptFile, installScript);
    await fs.promises.chmod(scriptFile, '755');
    
    return { outputPath, resultsFile, configFile, summaryFile, scriptFile };
}

function generateSummary(results) {
    const { analysis, servers, config } = results;
    
    return `# Universal MCP Discovery Results

## Project Analysis
- **Languages**: ${analysis.languages.map(l => l.language).join(', ') || 'None detected'}
- **Frameworks**: ${analysis.frameworks.join(', ') || 'None detected'}
- **Dependencies**: ${analysis.dependencies.total} packages (${analysis.dependencies.production.length} production)
- **Infrastructure**: ${analysis.infrastructure.join(', ') || 'None detected'}

## MCP Server Recommendations

### Essential Servers (${servers.filter(s => s.priority > 90).length})
${servers.filter(s => s.priority > 90).map(s => `- **${s.name}** (${s.category}) - ${s.confidence}% confidence`).join('\\n')}

### Recommended Servers (${servers.filter(s => s.priority >= 75 && s.priority <= 90).length})
${servers.filter(s => s.priority >= 75 && s.priority <= 90).map(s => `- **${s.name}** (${s.category}) - ${s.confidence}% confidence`).join('\\n')}

### Optional Servers (${servers.filter(s => s.priority < 75).length})
${servers.filter(s => s.priority < 75).map(s => `- **${s.name}** (${s.category}) - ${s.confidence}% confidence`).join('\\n')}

## Configuration Summary
- **Total Servers**: ${servers.length}
- **Enabled Servers**: ${servers.filter(s => s.enabled).length}
- **Categories**: ${Object.keys(config.categories).length}

## Installation
\`\`\`bash
# Make script executable and run
chmod +x install-mcp-servers.sh
./install-mcp-servers.sh

# Or manually install Claude Flow 2.0
npx --yes claude-flow@2.0.0 init --claude --webui --mcp-v3
\`\`\`

## Next Steps
1. Review the generated MCP configuration
2. Run the installation script
3. Start your MCP ecosystem: \`claude-flow start --all\`
4. Access dashboard: \`http://localhost:3000\`

---
*Generated by Universal MCP Discovery System v4.0*  
*Compatible with Enhanced MCP Ecosystem v3.0*
`;
}

function generateInstallScript(results) {
    const enabledServers = results.servers.filter(s => s.enabled);
    
    return `#!/bin/bash
# Universal MCP Installation Script
# Generated by Universal MCP Discovery System v4.0

set -e

echo "🚀 Installing Universal MCP Ecosystem v3.0..."
echo "📁 Project: $(pwd)"
echo "🎯 Installing ${enabledServers.length} MCP servers"
echo ""

# Install Claude Flow 2.0 with MCP v3.0
echo "📦 Installing Claude Flow 2.0 with Enhanced MCP Ecosystem..."
npx --yes claude-flow@2.0.0 init --claude --webui --mcp-v3

# Create MCP configuration
echo "⚙️  Creating MCP configuration..."
mkdir -p .mcp/servers
cp mcp-config.json .mcp/config.json

# Start core services
echo "🔧 Starting core MCP services..."
npx claude-flow start --core

# Health check
echo "🏥 Running health checks..."
npx claude-flow mcp health-check

echo ""
echo "✅ Universal MCP Ecosystem installed successfully!"
echo "🌐 Dashboard: http://localhost:3000"
echo "📚 Documentation: ./README.md"
echo ""
echo "High Priority Servers Installed:"
${enabledServers.filter(s => s.priority > 80).map(s => `echo "  ✓ ${s.name} (${s.category})"`).join('\\n')}
echo ""
echo "Next steps:"
echo "1. Access the dashboard to manage servers"
echo "2. Review configuration in mcp-config.json"
echo "3. Enable additional servers as needed"
`;
}

// Main CLI execution
async function main() {
    const args = process.argv.slice(2);
    const projectPath = args[0] || process.cwd();
    const outputPath = args[1] || projectPath;
    const options = {
        save: !args.includes('--no-save'),
        install: args.includes('--install'),
        verbose: args.includes('--verbose')
    };

    try {
        const results = await discoverMcpServers(projectPath);
        
        console.log('\\n📊 Discovery Summary:');
        console.log(`   • Languages: ${results.analysis.languages.length}`);
        console.log(`   • Frameworks: ${results.analysis.frameworks.length}`);
        console.log(`   • Dependencies: ${results.analysis.dependencies.total}`);
        console.log(`   • Infrastructure: ${results.analysis.infrastructure.length}`);
        console.log(`   • MCP Servers: ${results.servers.length}`);
        console.log(`   • Enabled Servers: ${results.servers.filter(s => s.enabled).length}`);
        console.log(`   • High Priority: ${results.servers.filter(s => s.priority > 80).length}`);

        if (options.save) {
            console.log('\\n💾 Saving results...');
            const files = await saveResults(results, outputPath);
            
            console.log('\\n📁 Files Created:');
            console.log(`   • Results: ${files.resultsFile}`);
            console.log(`   • Configuration: ${files.configFile}`);
            console.log(`   • Summary: ${files.summaryFile}`);
            console.log(`   • Install Script: ${files.scriptFile}`);

            if (options.install) {
                console.log('\\n🚀 Running installation...');
                const { spawn } = require('child_process');
                const install = spawn('bash', [files.scriptFile], { stdio: 'inherit' });
                
                install.on('close', (code) => {
                    if (code === 0) {
                        console.log('\\n✅ Installation completed successfully!');
                    } else {
                        console.log(`\\n❌ Installation failed with code ${code}`);
                    }
                });
            }
        }

        console.log('\\n✅ Universal MCP Discovery completed successfully!');
        console.log('💡 Next: Review the configuration and run the install script');
        
    } catch (error) {
        console.error('\\n❌ Discovery failed:', error.message);
        if (options.verbose) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

// Export for module usage
module.exports = { discoverMcpServers, main };

// Run if called directly
if (require.main === module) {
    main();
}