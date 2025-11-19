/**
 * Template Manager for Universal Scaffolding System
 * Handles loading, caching, and managing templates for all technologies
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const tar = require('tar');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

class TemplateManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            templatesDir: options.templatesDir || path.join(__dirname, '../../../templates'),
            cacheDir: options.cacheDir || path.join(require('os').tmpdir(), 'claude-flow-templates'),
            registryUrl: options.registryUrl || 'https://registry.claude-flow.io',
            maxCacheSize: options.maxCacheSize || 1024 * 1024 * 500, // 500MB
            ttl: options.ttl || 24 * 60 * 60 * 1000, // 24 hours
            ...options
        };
        
        this.templateCache = new Map();
        this.remoteTemplates = new Map();
        this.customTemplates = new Map();
        
        this.initializeTemplateRegistry();
    }

    /**
     * Initialize template registry with built-in templates
     */
    async initializeTemplateRegistry() {
        // Built-in templates for various technologies
        this.builtInTemplates = {
            // JavaScript/TypeScript
            'javascript-vanilla': {
                id: 'javascript-vanilla',
                name: 'Vanilla JavaScript',
                language: 'javascript',
                framework: null,
                description: 'Pure JavaScript project without frameworks',
                files: await this.loadTemplateFiles('javascript/vanilla')
            },
            'typescript-node': {
                id: 'typescript-node',
                name: 'TypeScript Node.js',
                language: 'typescript',
                framework: 'node',
                description: 'TypeScript Node.js application',
                files: await this.loadTemplateFiles('typescript/node')
            },
            'react-typescript': {
                id: 'react-typescript',
                name: 'React TypeScript',
                language: 'typescript',
                framework: 'react',
                description: 'React application with TypeScript',
                files: await this.loadTemplateFiles('react/typescript')
            },
            'nextjs-app': {
                id: 'nextjs-app',
                name: 'Next.js App Router',
                language: 'typescript',
                framework: 'nextjs',
                description: 'Next.js 14+ with App Router',
                files: await this.loadTemplateFiles('nextjs/app-router')
            },
            'vue3-composition': {
                id: 'vue3-composition',
                name: 'Vue 3 Composition API',
                language: 'javascript',
                framework: 'vue',
                description: 'Vue 3 with Composition API',
                files: await this.loadTemplateFiles('vue/vue3')
            },
            'angular-standalone': {
                id: 'angular-standalone',
                name: 'Angular Standalone',
                language: 'typescript',
                framework: 'angular',
                description: 'Angular with standalone components',
                files: await this.loadTemplateFiles('angular/standalone')
            },
            'svelte-kit': {
                id: 'svelte-kit',
                name: 'SvelteKit',
                language: 'javascript',
                framework: 'sveltekit',
                description: 'SvelteKit full-stack application',
                files: await this.loadTemplateFiles('svelte/kit')
            },
            
            // Python
            'python-cli': {
                id: 'python-cli',
                name: 'Python CLI',
                language: 'python',
                framework: null,
                description: 'Python command-line application',
                files: await this.loadTemplateFiles('python/cli')
            },
            'django-rest': {
                id: 'django-rest',
                name: 'Django REST API',
                language: 'python',
                framework: 'django',
                description: 'Django REST framework API',
                files: await this.loadTemplateFiles('python/django-rest')
            },
            'flask-api': {
                id: 'flask-api',
                name: 'Flask API',
                language: 'python',
                framework: 'flask',
                description: 'Flask RESTful API',
                files: await this.loadTemplateFiles('python/flask')
            },
            'fastapi': {
                id: 'fastapi',
                name: 'FastAPI',
                language: 'python',
                framework: 'fastapi',
                description: 'FastAPI modern web API',
                files: await this.loadTemplateFiles('python/fastapi')
            },
            'python-ml': {
                id: 'python-ml',
                name: 'Python ML Project',
                language: 'python',
                framework: 'scikit-learn',
                description: 'Machine learning project template',
                files: await this.loadTemplateFiles('python/ml')
            },
            
            // Rust
            'rust-cli': {
                id: 'rust-cli',
                name: 'Rust CLI',
                language: 'rust',
                framework: null,
                description: 'Rust command-line application',
                files: await this.loadTemplateFiles('rust/cli')
            },
            'rust-web-actix': {
                id: 'rust-web-actix',
                name: 'Actix Web',
                language: 'rust',
                framework: 'actix-web',
                description: 'Rust web server with Actix',
                files: await this.loadTemplateFiles('rust/actix')
            },
            'rust-wasm': {
                id: 'rust-wasm',
                name: 'Rust WASM',
                language: 'rust',
                framework: 'wasm',
                description: 'Rust WebAssembly project',
                files: await this.loadTemplateFiles('rust/wasm')
            },
            
            // Go
            'go-cli': {
                id: 'go-cli',
                name: 'Go CLI',
                language: 'go',
                framework: null,
                description: 'Go command-line application',
                files: await this.loadTemplateFiles('go/cli')
            },
            'go-gin-api': {
                id: 'go-gin-api',
                name: 'Gin API',
                language: 'go',
                framework: 'gin',
                description: 'Go REST API with Gin',
                files: await this.loadTemplateFiles('go/gin')
            },
            'go-fiber': {
                id: 'go-fiber',
                name: 'Fiber API',
                language: 'go',
                framework: 'fiber',
                description: 'Go web API with Fiber',
                files: await this.loadTemplateFiles('go/fiber')
            },
            
            // Java/Kotlin
            'java-spring-boot': {
                id: 'java-spring-boot',
                name: 'Spring Boot',
                language: 'java',
                framework: 'spring-boot',
                description: 'Spring Boot application',
                files: await this.loadTemplateFiles('java/spring-boot')
            },
            'kotlin-ktor': {
                id: 'kotlin-ktor',
                name: 'Ktor Server',
                language: 'kotlin',
                framework: 'ktor',
                description: 'Kotlin server with Ktor',
                files: await this.loadTemplateFiles('kotlin/ktor')
            },
            'android-compose': {
                id: 'android-compose',
                name: 'Android Jetpack Compose',
                language: 'kotlin',
                framework: 'android',
                description: 'Android app with Jetpack Compose',
                files: await this.loadTemplateFiles('android/compose')
            },
            
            // C#/.NET
            'dotnet-api': {
                id: 'dotnet-api',
                name: '.NET Web API',
                language: 'csharp',
                framework: 'aspnetcore',
                description: 'ASP.NET Core Web API',
                files: await this.loadTemplateFiles('dotnet/webapi')
            },
            'dotnet-blazor': {
                id: 'dotnet-blazor',
                name: 'Blazor WASM',
                language: 'csharp',
                framework: 'blazor',
                description: 'Blazor WebAssembly app',
                files: await this.loadTemplateFiles('dotnet/blazor')
            },
            
            // Ruby
            'ruby-rails-api': {
                id: 'ruby-rails-api',
                name: 'Rails API',
                language: 'ruby',
                framework: 'rails',
                description: 'Ruby on Rails API',
                files: await this.loadTemplateFiles('ruby/rails-api')
            },
            'ruby-sinatra': {
                id: 'ruby-sinatra',
                name: 'Sinatra App',
                language: 'ruby',
                framework: 'sinatra',
                description: 'Sinatra web application',
                files: await this.loadTemplateFiles('ruby/sinatra')
            },
            
            // PHP
            'php-laravel': {
                id: 'php-laravel',
                name: 'Laravel',
                language: 'php',
                framework: 'laravel',
                description: 'Laravel application',
                files: await this.loadTemplateFiles('php/laravel')
            },
            'php-symfony': {
                id: 'php-symfony',
                name: 'Symfony',
                language: 'php',
                framework: 'symfony',
                description: 'Symfony application',
                files: await this.loadTemplateFiles('php/symfony')
            },
            
            // Mobile
            'react-native-expo': {
                id: 'react-native-expo',
                name: 'React Native Expo',
                language: 'javascript',
                framework: 'react-native',
                description: 'React Native with Expo',
                files: await this.loadTemplateFiles('mobile/react-native-expo')
            },
            'flutter-app': {
                id: 'flutter-app',
                name: 'Flutter App',
                language: 'dart',
                framework: 'flutter',
                description: 'Flutter mobile application',
                files: await this.loadTemplateFiles('mobile/flutter')
            },
            'ionic-angular': {
                id: 'ionic-angular',
                name: 'Ionic Angular',
                language: 'typescript',
                framework: 'ionic',
                description: 'Ionic Angular mobile app',
                files: await this.loadTemplateFiles('mobile/ionic')
            },
            
            // Desktop
            'electron-react': {
                id: 'electron-react',
                name: 'Electron React',
                language: 'javascript',
                framework: 'electron',
                description: 'Electron desktop app with React',
                files: await this.loadTemplateFiles('desktop/electron-react')
            },
            'tauri-app': {
                id: 'tauri-app',
                name: 'Tauri App',
                language: 'rust',
                framework: 'tauri',
                description: 'Tauri desktop application',
                files: await this.loadTemplateFiles('desktop/tauri')
            },
            
            // Game Development
            'unity-2d': {
                id: 'unity-2d',
                name: 'Unity 2D Game',
                language: 'csharp',
                framework: 'unity',
                description: 'Unity 2D game project',
                files: await this.loadTemplateFiles('games/unity-2d')
            },
            'godot-project': {
                id: 'godot-project',
                name: 'Godot Game',
                language: 'gdscript',
                framework: 'godot',
                description: 'Godot game project',
                files: await this.loadTemplateFiles('games/godot')
            },
            'phaser-game': {
                id: 'phaser-game',
                name: 'Phaser Game',
                language: 'javascript',
                framework: 'phaser',
                description: 'Phaser.js game',
                files: await this.loadTemplateFiles('games/phaser')
            },
            
            // Blockchain
            'ethereum-hardhat': {
                id: 'ethereum-hardhat',
                name: 'Hardhat Project',
                language: 'solidity',
                framework: 'hardhat',
                description: 'Ethereum smart contracts with Hardhat',
                files: await this.loadTemplateFiles('blockchain/hardhat')
            },
            'solana-anchor': {
                id: 'solana-anchor',
                name: 'Anchor Project',
                language: 'rust',
                framework: 'anchor',
                description: 'Solana program with Anchor',
                files: await this.loadTemplateFiles('blockchain/anchor')
            },
            
            // Data Science
            'jupyter-notebook': {
                id: 'jupyter-notebook',
                name: 'Jupyter Notebook',
                language: 'python',
                framework: 'jupyter',
                description: 'Jupyter notebook project',
                files: await this.loadTemplateFiles('datascience/jupyter')
            },
            'r-shiny': {
                id: 'r-shiny',
                name: 'R Shiny App',
                language: 'r',
                framework: 'shiny',
                description: 'R Shiny web application',
                files: await this.loadTemplateFiles('datascience/r-shiny')
            },
            
            // Infrastructure
            'terraform-aws': {
                id: 'terraform-aws',
                name: 'Terraform AWS',
                language: 'hcl',
                framework: 'terraform',
                description: 'Terraform AWS infrastructure',
                files: await this.loadTemplateFiles('infrastructure/terraform-aws')
            },
            'kubernetes-helm': {
                id: 'kubernetes-helm',
                name: 'Helm Chart',
                language: 'yaml',
                framework: 'helm',
                description: 'Kubernetes Helm chart',
                files: await this.loadTemplateFiles('infrastructure/helm')
            },
            
            // Microservices
            'microservice-node': {
                id: 'microservice-node',
                name: 'Node Microservice',
                language: 'javascript',
                framework: 'express',
                description: 'Node.js microservice',
                files: await this.loadTemplateFiles('microservices/node')
            },
            'microservice-go': {
                id: 'microservice-go',
                name: 'Go Microservice',
                language: 'go',
                framework: 'grpc',
                description: 'Go microservice with gRPC',
                files: await this.loadTemplateFiles('microservices/go')
            }
        };
    }

    /**
     * Load template files from directory
     */
    async loadTemplateFiles(templatePath) {
        const files = [];
        const fullPath = path.join(this.options.templatesDir, templatePath);
        
        try {
            // Check if template directory exists
            await fs.access(fullPath);
            
            // Recursively read template files
            const readDir = async (dir, basePath = '') => {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const entryPath = path.join(dir, entry.name);
                    const relativePath = path.join(basePath, entry.name);
                    
                    if (entry.isDirectory()) {
                        await readDir(entryPath, relativePath);
                    } else {
                        const content = await fs.readFile(entryPath, 'utf8');
                        files.push({
                            path: relativePath,
                            content,
                            permissions: 0o644,
                            type: 'text'
                        });
                    }
                }
            };
            
            await readDir(fullPath);
            
        } catch (error) {
            // Return default template structure if directory doesn't exist
            return this.getDefaultTemplateFiles(templatePath);
        }
        
        return files;
    }

    /**
     * Get default template files for a given path
     */
    getDefaultTemplateFiles(templatePath) {
        const [category, type] = templatePath.split('/');
        
        // Return minimal default structure based on category
        const defaults = {
            'javascript': [
                {
                    path: 'package.json',
                    content: JSON.stringify({
                        name: '{{PROJECT_NAME_KEBAB}}',
                        version: '{{VERSION}}',
                        description: '{{DESCRIPTION}}',
                        main: 'index.js',
                        scripts: {
                            start: 'node index.js',
                            test: 'echo "Error: no test specified" && exit 1'
                        },
                        keywords: [],
                        author: '{{AUTHOR}}',
                        license: '{{LICENSE}}'
                    }, null, 2),
                    permissions: 0o644,
                    type: 'text'
                },
                {
                    path: 'index.js',
                    content: `console.log('Hello from {{PROJECT_NAME}}!');`,
                    permissions: 0o644,
                    type: 'text'
                },
                {
                    path: 'README.md',
                    content: `# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## License

{{LICENSE}}`,
                    permissions: 0o644,
                    type: 'text'
                }
            ],
            'python': [
                {
                    path: 'requirements.txt',
                    content: '',
                    permissions: 0o644,
                    type: 'text'
                },
                {
                    path: 'main.py',
                    content: `#!/usr/bin/env python3
"""{{PROJECT_NAME}} - {{DESCRIPTION}}"""

def main():
    print("Hello from {{PROJECT_NAME}}!")

if __name__ == "__main__":
    main()`,
                    permissions: 0o755,
                    type: 'text'
                },
                {
                    path: 'README.md',
                    content: `# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Installation

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`bash
python main.py
\`\`\`

## License

{{LICENSE}}`,
                    permissions: 0o644,
                    type: 'text'
                }
            ],
            'rust': [
                {
                    path: 'Cargo.toml',
                    content: `[package]
name = "{{PROJECT_NAME_SNAKE}}"
version = "{{VERSION}}"
edition = "2021"
authors = ["{{AUTHOR}} <{{EMAIL}}>"]
description = "{{DESCRIPTION}}"
license = "{{LICENSE}}"

[dependencies]`,
                    permissions: 0o644,
                    type: 'text'
                },
                {
                    path: 'src/main.rs',
                    content: `fn main() {
    println!("Hello from {{PROJECT_NAME}}!");
}`,
                    permissions: 0o644,
                    type: 'text'
                }
            ],
            'go': [
                {
                    path: 'go.mod',
                    content: `module {{PROJECT_NAME_KEBAB}}

go 1.21`,
                    permissions: 0o644,
                    type: 'text'
                },
                {
                    path: 'main.go',
                    content: `package main

import "fmt"

func main() {
    fmt.Println("Hello from {{PROJECT_NAME}}!")
}`,
                    permissions: 0o644,
                    type: 'text'
                }
            ]
        };
        
        return defaults[category] || defaults['javascript'];
    }

    /**
     * Get all available templates
     */
    async getAvailableTemplates() {
        const templates = [];
        
        // Add built-in templates
        for (const template of Object.values(this.builtInTemplates)) {
            templates.push(template);
        }
        
        // Add custom templates
        for (const template of this.customTemplates.values()) {
            templates.push(template);
        }
        
        // Add cached remote templates
        for (const template of this.remoteTemplates.values()) {
            templates.push(template);
        }
        
        return templates;
    }

    /**
     * Get template by ID or URL
     */
    async getTemplate(templateId) {
        // Check built-in templates
        if (this.builtInTemplates[templateId]) {
            return this.builtInTemplates[templateId];
        }
        
        // Check custom templates
        if (this.customTemplates.has(templateId)) {
            return this.customTemplates.get(templateId);
        }
        
        // Check cached remote templates
        if (this.remoteTemplates.has(templateId)) {
            return this.remoteTemplates.get(templateId);
        }
        
        // Try to load from URL or registry
        if (templateId.startsWith('http://') || templateId.startsWith('https://')) {
            return await this.loadRemoteTemplate(templateId);
        }
        
        // Try to load from npm package
        if (templateId.startsWith('@') || templateId.includes('/')) {
            return await this.loadNpmTemplate(templateId);
        }
        
        // Try to load from local path
        if (await this.isLocalPath(templateId)) {
            return await this.loadLocalTemplate(templateId);
        }
        
        // Default to generic template
        return this.getGenericTemplate(templateId);
    }

    /**
     * Load template from remote URL
     */
    async loadRemoteTemplate(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    try {
                        const template = JSON.parse(data);
                        this.remoteTemplates.set(template.id, template);
                        resolve(template);
                    } catch (error) {
                        reject(new Error(`Failed to parse template from ${url}: ${error.message}`));
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Load template from npm package
     */
    async loadNpmTemplate(packageName) {
        try {
            // Install package temporarily
            const tempDir = path.join(this.options.cacheDir, 'npm', packageName.replace('/', '-'));
            await fs.mkdir(tempDir, { recursive: true });
            
            await execAsync(`npm install ${packageName}`, { cwd: tempDir });
            
            // Load template configuration
            const templatePath = path.join(tempDir, 'node_modules', packageName);
            const templateConfig = require(path.join(templatePath, 'template.json'));
            
            // Load template files
            templateConfig.files = await this.loadTemplateFiles(templatePath);
            
            this.remoteTemplates.set(packageName, templateConfig);
            return templateConfig;
            
        } catch (error) {
            throw new Error(`Failed to load npm template ${packageName}: ${error.message}`);
        }
    }

    /**
     * Load template from local directory
     */
    async loadLocalTemplate(templatePath) {
        const absolutePath = path.resolve(templatePath);
        
        try {
            // Load template configuration
            const configPath = path.join(absolutePath, 'template.json');
            const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
            
            // Load template files
            config.files = await this.loadTemplateFiles(absolutePath);
            
            this.customTemplates.set(config.id, config);
            return config;
            
        } catch (error) {
            throw new Error(`Failed to load local template from ${templatePath}: ${error.message}`);
        }
    }

    /**
     * Get generic template for unknown project types
     */
    getGenericTemplate(projectType) {
        return {
            id: 'generic',
            name: 'Generic Project',
            language: typeof projectType === 'string' ? projectType : 'unknown',
            framework: null,
            description: 'Generic project template',
            files: [
                {
                    path: 'README.md',
                    content: `# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Getting Started

This is a generic project template. Please customize it according to your needs.

## License

{{LICENSE}}`,
                    permissions: 0o644,
                    type: 'text'
                },
                {
                    path: '.gitignore',
                    content: `# Dependencies
node_modules/
vendor/
target/
build/
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Environment
.env
.env.local`,
                    permissions: 0o644,
                    type: 'text'
                }
            ]
        };
    }

    /**
     * Register custom template
     */
    registerTemplate(template) {
        if (!template.id) {
            template.id = this.generateTemplateId(template);
        }
        
        this.customTemplates.set(template.id, template);
        this.emit('template:registered', template);
        
        return template.id;
    }

    /**
     * Generate unique template ID
     */
    generateTemplateId(template) {
        const base = `${template.language}-${template.framework || 'custom'}`;
        const hash = crypto.createHash('md5')
            .update(JSON.stringify(template))
            .digest('hex')
            .substring(0, 8);
        
        return `${base}-${hash}`;
    }

    /**
     * Check if path is local directory
     */
    async isLocalPath(templatePath) {
        try {
            const stat = await fs.stat(templatePath);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
        this.remoteTemplates.clear();
        this.emit('cache:cleared');
    }

    /**
     * Export template to file
     */
    async exportTemplate(templateId, outputPath) {
        const template = await this.getTemplate(templateId);
        
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }
        
        const exportData = {
            ...template,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        
        await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
        
        return outputPath;
    }

    /**
     * Import template from file
     */
    async importTemplate(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const template = JSON.parse(content);
        
        return this.registerTemplate(template);
    }
}

module.exports = TemplateManager;