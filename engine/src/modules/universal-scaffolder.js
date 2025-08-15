/**
 * Universal Scaffolding Engine for Claude Flow 2.0
 * Supports ANY technology stack with intelligent detection and generation
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const { Worker } = require('worker_threads');
const os = require('os');

// Language detection mappings
const LANGUAGE_EXTENSIONS = {
    // Web languages
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript', 
    '.tsx': 'typescript',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    
    // Backend languages
    '.py': 'python',
    '.rb': 'ruby',
    '.php': 'php',
    '.java': 'java',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.go': 'go',
    '.rs': 'rust',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.fs': 'fsharp',
    '.vb': 'visualbasic',
    '.swift': 'swift',
    '.m': 'objectivec',
    
    // Data & ML
    '.r': 'r',
    '.jl': 'julia',
    '.ipynb': 'jupyter',
    '.mat': 'matlab',
    
    // Systems & DevOps
    '.sh': 'bash',
    '.ps1': 'powershell',
    '.dockerfile': 'docker',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.json': 'json',
    '.xml': 'xml',
    
    // Database
    '.sql': 'sql',
    '.graphql': 'graphql',
    '.gql': 'graphql',
    
    // Mobile
    '.dart': 'dart',
    '.mm': 'objectivecpp',
    
    // Game Development
    '.gdscript': 'gdscript',
    '.lua': 'lua',
    '.hx': 'haxe',
    
    // Blockchain
    '.sol': 'solidity',
    '.move': 'move',
    '.cairo': 'cairo',
    '.vy': 'vyper',
    
    // Other
    '.elm': 'elm',
    '.ex': 'elixir',
    '.exs': 'elixir',
    '.erl': 'erlang',
    '.hrl': 'erlang',
    '.clj': 'clojure',
    '.cljs': 'clojurescript',
    '.nim': 'nim',
    '.v': 'vlang',
    '.zig': 'zig',
    '.pas': 'pascal',
    '.pp': 'pascal',
    '.pl': 'perl',
    '.pm': 'perl',
    '.raku': 'raku',
    '.tcl': 'tcl',
    '.asm': 'assembly',
    '.s': 'assembly',
    '.cob': 'cobol',
    '.f90': 'fortran',
    '.f95': 'fortran',
    '.ada': 'ada',
    '.adb': 'ada',
    '.d': 'd',
    '.cr': 'crystal',
    '.ml': 'ocaml',
    '.mli': 'ocaml',
    '.fs': 'fsharp',
    '.fsi': 'fsharp',
    '.fsx': 'fsharp',
    '.groovy': 'groovy',
    '.gradle': 'groovy'
};

// Package file mappings
const PACKAGE_FILES = {
    'package.json': { type: 'node', manager: 'npm' },
    'yarn.lock': { type: 'node', manager: 'yarn' },
    'pnpm-lock.yaml': { type: 'node', manager: 'pnpm' },
    'bun.lockb': { type: 'node', manager: 'bun' },
    'composer.json': { type: 'php', manager: 'composer' },
    'Gemfile': { type: 'ruby', manager: 'bundler' },
    'requirements.txt': { type: 'python', manager: 'pip' },
    'Pipfile': { type: 'python', manager: 'pipenv' },
    'pyproject.toml': { type: 'python', manager: 'poetry' },
    'go.mod': { type: 'go', manager: 'go' },
    'Cargo.toml': { type: 'rust', manager: 'cargo' },
    'pom.xml': { type: 'java', manager: 'maven' },
    'build.gradle': { type: 'java', manager: 'gradle' },
    'build.gradle.kts': { type: 'kotlin', manager: 'gradle' },
    'project.clj': { type: 'clojure', manager: 'leiningen' },
    'deps.edn': { type: 'clojure', manager: 'deps' },
    'mix.exs': { type: 'elixir', manager: 'mix' },
    'rebar.config': { type: 'erlang', manager: 'rebar' },
    'pubspec.yaml': { type: 'dart', manager: 'pub' },
    'Package.swift': { type: 'swift', manager: 'spm' },
    'Podfile': { type: 'ios', manager: 'cocoapods' },
    'build.sbt': { type: 'scala', manager: 'sbt' },
    'stack.yaml': { type: 'haskell', manager: 'stack' },
    'cabal.project': { type: 'haskell', manager: 'cabal' },
    'elm.json': { type: 'elm', manager: 'elm' },
    'dub.json': { type: 'd', manager: 'dub' },
    'dub.sdl': { type: 'd', manager: 'dub' },
    'nimble': { type: 'nim', manager: 'nimble' },
    'build.zig': { type: 'zig', manager: 'zig' },
    'Project.toml': { type: 'julia', manager: 'pkg' },
    'CMakeLists.txt': { type: 'cpp', manager: 'cmake' },
    'Makefile': { type: 'c', manager: 'make' },
    'meson.build': { type: 'cpp', manager: 'meson' },
    'conanfile.txt': { type: 'cpp', manager: 'conan' },
    'vcpkg.json': { type: 'cpp', manager: 'vcpkg' }
};

class UniversalScaffolder extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            templatesDir: options.templatesDir || path.join(__dirname, '../../../templates'),
            cacheDir: options.cacheDir || path.join(os.tmpdir(), 'claude-flow-cache'),
            maxWorkers: options.maxWorkers || os.cpus().length,
            timeout: options.timeout || 30000,
            verbose: options.verbose || false,
            ...options
        };
        
        this.templateCache = new Map();
        this.detectionCache = new Map();
        this.workerPool = [];
        this.initializeWorkerPool();
    }

    /**
     * Initialize worker pool for parallel processing
     */
    initializeWorkerPool() {
        const workerScript = `
            const { parentPort } = require('worker_threads');
            parentPort.on('message', async (task) => {
                try {
                    const result = await processTask(task);
                    parentPort.postMessage({ success: true, result });
                } catch (error) {
                    parentPort.postMessage({ success: false, error: error.message });
                }
            });
            
            async function processTask(task) {
                // Task processing logic here
                return task;
            }
        `;
        
        // Create workers based on CPU count
        for (let i = 0; i < this.options.maxWorkers; i++) {
            // Worker creation would go here in production
        }
    }

    /**
     * Main entry point for creating a new project
     */
    async create(projectName, options = {}) {
        this.emit('start', { action: 'create', projectName, options });
        
        try {
            // Step 1: Detect or use specified technology
            const projectType = await this.detectOrSpecifyProjectType(options);
            
            // Step 2: Select appropriate template
            const template = await this.selectTemplate(projectType, options);
            
            // Step 3: Prepare project directory
            const projectPath = await this.prepareProjectDirectory(projectName, options);
            
            // Step 4: Generate scaffolding
            const result = await this.generateScaffolding(template, projectPath, {
                ...options,
                projectName,
                projectType
            });
            
            // Step 5: Install dependencies
            if (!options.skipInstall) {
                await this.installDependencies(projectPath, projectType);
            }
            
            // Step 6: Initialize version control
            if (!options.skipGit) {
                await this.initializeGit(projectPath);
            }
            
            // Step 7: Run post-creation hooks
            await this.runPostCreationHooks(template, projectPath, options);
            
            this.emit('complete', result);
            return result;
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Enhance an existing project with Claude Flow capabilities
     */
    async enhance(projectPath = '.', options = {}) {
        this.emit('start', { action: 'enhance', projectPath, options });
        
        try {
            // Step 1: Analyze existing project
            const analysis = await this.analyzeExistingProject(projectPath);
            
            // Step 2: Determine enhancement strategy
            const strategy = await this.determineEnhancementStrategy(analysis, options);
            
            // Step 3: Apply non-invasive enhancements
            const result = await this.applyEnhancements(projectPath, strategy, {
                ...options,
                nonInvasive: true,
                preserve: true
            });
            
            // Step 4: Update configuration files
            await this.updateConfigurations(projectPath, analysis, options);
            
            // Step 5: Add Claude Flow integration
            await this.addClaudeFlowIntegration(projectPath, analysis);
            
            this.emit('complete', result);
            return result;
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Detect project type from directory or options
     */
    async detectOrSpecifyProjectType(options) {
        if (options.template) {
            return this.parseTemplateSpecification(options.template);
        }
        
        if (options.detect) {
            return await this.detectProjectType(options.path || '.');
        }
        
        // Interactive selection would go here
        return await this.interactiveProjectTypeSelection();
    }

    /**
     * Detect project type from existing files
     */
    async detectProjectType(directory) {
        const cacheKey = `detect:${directory}`;
        if (this.detectionCache.has(cacheKey)) {
            return this.detectionCache.get(cacheKey);
        }
        
        const signatures = {
            languages: new Map(),
            frameworks: new Map(),
            buildTools: new Map(),
            packageManagers: new Map()
        };
        
        try {
            // Scan for file extensions
            const files = await this.scanDirectory(directory);
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                const language = LANGUAGE_EXTENSIONS[ext];
                if (language) {
                    signatures.languages.set(language, 
                        (signatures.languages.get(language) || 0) + 1);
                }
            }
            
            // Check for package files
            for (const [filename, info] of Object.entries(PACKAGE_FILES)) {
                const filePath = path.join(directory, filename);
                if (await this.fileExists(filePath)) {
                    signatures.packageManagers.set(info.manager, 1);
                    
                    // Analyze package file for framework detection
                    const framework = await this.detectFrameworkFromPackageFile(filePath, info.type);
                    if (framework) {
                        signatures.frameworks.set(framework, 1);
                    }
                }
            }
            
            // Check for build tools
            const buildTools = await this.detectBuildTools(directory);
            for (const tool of buildTools) {
                signatures.buildTools.set(tool, 1);
            }
            
            // Aggregate results
            const result = this.aggregateProjectSignatures(signatures);
            this.detectionCache.set(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.error('Error detecting project type:', error);
            return { language: 'unknown', confidence: 0 };
        }
    }

    /**
     * Detect framework from package file
     */
    async detectFrameworkFromPackageFile(filePath, projectType) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            if (projectType === 'node' && filePath.endsWith('package.json')) {
                const pkg = JSON.parse(content);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                
                // React ecosystem
                if (deps['react']) return 'react';
                if (deps['next']) return 'nextjs';
                if (deps['gatsby']) return 'gatsby';
                
                // Vue ecosystem
                if (deps['vue']) return 'vue';
                if (deps['nuxt']) return 'nuxt';
                
                // Angular
                if (deps['@angular/core']) return 'angular';
                
                // Svelte
                if (deps['svelte']) return 'svelte';
                if (deps['@sveltejs/kit']) return 'sveltekit';
                
                // Backend frameworks
                if (deps['express']) return 'express';
                if (deps['fastify']) return 'fastify';
                if (deps['@nestjs/core']) return 'nestjs';
                if (deps['koa']) return 'koa';
                if (deps['hapi']) return 'hapi';
                
                // Testing frameworks
                if (deps['jest']) return 'jest';
                if (deps['mocha']) return 'mocha';
                if (deps['vitest']) return 'vitest';
            }
            
            if (projectType === 'python') {
                // Parse requirements.txt or pyproject.toml
                if (content.includes('django')) return 'django';
                if (content.includes('flask')) return 'flask';
                if (content.includes('fastapi')) return 'fastapi';
                if (content.includes('pyramid')) return 'pyramid';
                if (content.includes('tornado')) return 'tornado';
                if (content.includes('tensorflow')) return 'tensorflow';
                if (content.includes('pytorch')) return 'pytorch';
                if (content.includes('scikit-learn')) return 'scikit-learn';
            }
            
            if (projectType === 'ruby' && filePath.endsWith('Gemfile')) {
                if (content.includes('rails')) return 'rails';
                if (content.includes('sinatra')) return 'sinatra';
                if (content.includes('hanami')) return 'hanami';
            }
            
            if (projectType === 'php' && filePath.endsWith('composer.json')) {
                const pkg = JSON.parse(content);
                const deps = { ...pkg.require, ...pkg['require-dev'] };
                
                if (deps['laravel/framework']) return 'laravel';
                if (deps['symfony/framework-bundle']) return 'symfony';
                if (deps['slim/slim']) return 'slim';
                if (deps['laminas/laminas-mvc']) return 'laminas';
            }
            
            if (projectType === 'java') {
                if (content.includes('spring-boot')) return 'spring-boot';
                if (content.includes('micronaut')) return 'micronaut';
                if (content.includes('quarkus')) return 'quarkus';
                if (content.includes('vertx')) return 'vertx';
            }
            
            if (projectType === 'rust' && filePath.endsWith('Cargo.toml')) {
                if (content.includes('actix-web')) return 'actix-web';
                if (content.includes('rocket')) return 'rocket';
                if (content.includes('warp')) return 'warp';
                if (content.includes('axum')) return 'axum';
                if (content.includes('tokio')) return 'tokio';
            }
            
            if (projectType === 'go' && filePath.endsWith('go.mod')) {
                if (content.includes('gin-gonic/gin')) return 'gin';
                if (content.includes('labstack/echo')) return 'echo';
                if (content.includes('gofiber/fiber')) return 'fiber';
                if (content.includes('gorilla/mux')) return 'gorilla';
            }
            
        } catch (error) {
            console.error('Error detecting framework:', error);
        }
        
        return null;
    }

    /**
     * Select the best template based on project type
     */
    async selectTemplate(projectType, options) {
        // Load available templates
        const templates = await this.loadAvailableTemplates();
        
        // Score each template
        const scoredTemplates = templates.map(template => ({
            template,
            score: this.calculateTemplateScore(template, projectType, options)
        }));
        
        // Sort by score
        scoredTemplates.sort((a, b) => b.score - a.score);
        
        // Return best match or default
        if (scoredTemplates.length > 0 && scoredTemplates[0].score > 0.5) {
            return scoredTemplates[0].template;
        }
        
        // Return generic template as fallback
        return this.getGenericTemplate(projectType);
    }

    /**
     * Calculate template compatibility score
     */
    calculateTemplateScore(template, projectType, options) {
        let score = 0;
        const weights = {
            language: 0.4,
            framework: 0.3,
            buildTool: 0.2,
            features: 0.1
        };
        
        // Language match
        if (template.language === projectType.language) {
            score += weights.language;
        }
        
        // Framework match
        if (template.framework === projectType.framework) {
            score += weights.framework;
        }
        
        // Build tool match
        if (template.buildTool === projectType.buildTool) {
            score += weights.buildTool;
        }
        
        // Feature overlap
        if (template.features && projectType.features) {
            const overlap = template.features.filter(f => 
                projectType.features.includes(f)).length;
            const maxFeatures = Math.max(template.features.length, 
                projectType.features.length);
            if (maxFeatures > 0) {
                score += weights.features * (overlap / maxFeatures);
            }
        }
        
        // User preference bonus
        if (options.preferredTemplate === template.id) {
            score += 0.2;
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * Generate scaffolding from template
     */
    async generateScaffolding(template, projectPath, context) {
        const startTime = Date.now();
        const generatedFiles = [];
        
        try {
            // Process each template file
            for (const file of template.files) {
                if (await this.shouldIncludeFile(file, context)) {
                    const processedFile = await this.processTemplateFile(file, context);
                    const destPath = path.join(projectPath, processedFile.path);
                    
                    // Ensure directory exists
                    await fs.mkdir(path.dirname(destPath), { recursive: true });
                    
                    // Write file
                    await fs.writeFile(destPath, processedFile.content, {
                        mode: file.permissions || 0o644
                    });
                    
                    generatedFiles.push({
                        path: destPath,
                        size: Buffer.byteLength(processedFile.content),
                        type: file.type || 'text'
                    });
                }
            }
            
            // Generate dynamic files based on options
            if (context.options.typescript) {
                await this.generateTypeScriptConfig(projectPath);
            }
            
            if (context.options.testing) {
                await this.generateTestingSetup(projectPath, context);
            }
            
            if (context.options.docker) {
                await this.generateDockerfiles(projectPath, context);
            }
            
            if (context.options.ci) {
                await this.generateCIConfiguration(projectPath, context);
            }
            
            return {
                success: true,
                projectPath,
                filesGenerated: generatedFiles,
                metrics: {
                    duration: Date.now() - startTime,
                    filesCreated: generatedFiles.length,
                    bytesWritten: generatedFiles.reduce((sum, f) => sum + f.size, 0)
                }
            };
            
        } catch (error) {
            throw new Error(`Scaffolding generation failed: ${error.message}`);
        }
    }

    /**
     * Process template file with variable substitution
     */
    async processTemplateFile(file, context) {
        let content = file.content;
        
        // Replace variables
        content = this.replaceTemplateVariables(content, context);
        
        // Process conditionals
        content = this.processConditionals(content, context);
        
        // Process loops
        content = this.processLoops(content, context);
        
        // Apply transformations
        if (file.transformations) {
            for (const transform of file.transformations) {
                content = await this.applyTransformation(content, transform, context);
            }
        }
        
        return {
            path: this.replaceTemplateVariables(file.path, context),
            content
        };
    }

    /**
     * Replace template variables
     */
    replaceTemplateVariables(text, context) {
        const variables = {
            PROJECT_NAME: context.projectName,
            PROJECT_NAME_KEBAB: this.toKebabCase(context.projectName),
            PROJECT_NAME_SNAKE: this.toSnakeCase(context.projectName),
            PROJECT_NAME_PASCAL: this.toPascalCase(context.projectName),
            PROJECT_NAME_CAMEL: this.toCamelCase(context.projectName),
            AUTHOR: context.options.author || 'Your Name',
            EMAIL: context.options.email || 'you@example.com',
            LICENSE: context.options.license || 'MIT',
            DESCRIPTION: context.options.description || 'A new project',
            VERSION: context.options.version || '0.1.0',
            YEAR: new Date().getFullYear(),
            DATE: new Date().toISOString().split('T')[0],
            ...context.variables
        };
        
        let result = text;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            result = result.replace(regex, value);
        }
        
        return result;
    }

    /**
     * Utility functions for case conversion
     */
    toKebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2')
                  .replace(/[\s_]+/g, '-')
                  .toLowerCase();
    }
    
    toSnakeCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1_$2')
                  .replace(/[\s-]+/g, '_')
                  .toLowerCase();
    }
    
    toPascalCase(str) {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
                  .replace(/^(.)/, c => c.toUpperCase());
    }
    
    toCamelCase(str) {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
                  .replace(/^(.)/, c => c.toLowerCase());
    }

    /**
     * Helper methods
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async scanDirectory(dir, maxDepth = 3, currentDepth = 0) {
        const files = [];
        if (currentDepth >= maxDepth) return files;
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                // Skip node_modules and hidden directories
                if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    const subFiles = await this.scanDirectory(fullPath, maxDepth, currentDepth + 1);
                    files.push(...subFiles);
                } else {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dir}:`, error);
        }
        
        return files;
    }
    
    async prepareProjectDirectory(projectName, options) {
        const projectPath = path.resolve(options.path || '.', projectName);
        
        // Check if directory exists
        if (await this.fileExists(projectPath)) {
            if (!options.force) {
                throw new Error(`Directory ${projectPath} already exists. Use --force to overwrite.`);
            }
        }
        
        // Create directory
        await fs.mkdir(projectPath, { recursive: true });
        
        return projectPath;
    }
    
    aggregateProjectSignatures(signatures) {
        const result = {
            language: 'unknown',
            framework: null,
            buildTool: null,
            packageManager: null,
            confidence: 0
        };
        
        // Find most common language
        if (signatures.languages.size > 0) {
            let maxCount = 0;
            for (const [lang, count] of signatures.languages) {
                if (count > maxCount) {
                    maxCount = count;
                    result.language = lang;
                }
            }
            result.confidence = Math.min(maxCount / 10, 1.0);
        }
        
        // Get first detected framework
        if (signatures.frameworks.size > 0) {
            result.framework = signatures.frameworks.keys().next().value;
        }
        
        // Get first detected build tool
        if (signatures.buildTools.size > 0) {
            result.buildTool = signatures.buildTools.keys().next().value;
        }
        
        // Get first detected package manager
        if (signatures.packageManagers.size > 0) {
            result.packageManager = signatures.packageManagers.keys().next().value;
        }
        
        return result;
    }
}

module.exports = UniversalScaffolder;