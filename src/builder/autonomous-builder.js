/**
 * Autonomous App Builder
 * Builds complete applications from descriptions using AI agents
 */

import { EventEmitter } from 'events';
import { FlowOrchestrator } from '../claude-flow/orchestrator/flow-orchestrator.js';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export class AutonomousBuilder extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      outputDir: config.outputDir || './output',
      verbose: config.verbose || false,
      ...config
    };

    this.orchestrator = new FlowOrchestrator({ verbose: this.config.verbose });
    this.templates = this._initializeTemplates();
  }

  /**
   * Build an application from a description
   */
  async buildApp(description, options = {}) {
    this._log('Starting autonomous app build', { description, options });
    this.emit('build:start', { description, options });

    const startTime = Date.now();
    const buildId = `build_${Date.now()}`;

    try {
      // Step 1: Analyze the description
      const analysis = await this._analyzeDescription(description, options);
      this.emit('analysis:complete', analysis);

      // Step 2: Select tech stack
      const techStack = options.stack
        ? this._parseTechStack(options.stack)
        : this._selectTechStack(analysis);
      this.emit('techstack:selected', techStack);

      // Step 3: Generate project structure
      const projectStructure = await this._generateProjectStructure(analysis, techStack);
      this.emit('structure:generated', projectStructure);

      // Step 4: Create workflow for building
      const workflow = this._createBuildWorkflow(analysis, techStack, projectStructure);
      this.emit('workflow:created', workflow);

      // Step 5: Execute the build workflow
      const workflowResult = await this.orchestrator.executeWorkflow(workflow);

      // Step 6: Write files to disk
      const projectPath = await this._writeProjectFiles(buildId, projectStructure, workflowResult);

      // Success
      const result = {
        success: true,
        buildId,
        projectPath,
        analysis,
        techStack,
        duration: Date.now() - startTime
      };

      this.emit('build:complete', result);

      return result;

    } catch (error) {
      const result = {
        success: false,
        buildId,
        error: error.message,
        duration: Date.now() - startTime
      };

      this.emit('build:error', result);
      throw error;
    }
  }

  /**
   * Analyze the app description
   */
  async _analyzeDescription(description, options) {
    this._log('Analyzing description');

    // Extract keywords and patterns
    const keywords = this._extractKeywords(description);

    // Determine app type
    const appType = this._determineAppType(description, keywords);

    // Extract features
    const features = options.features
      ? options.features.split(',').map(f => f.trim())
      : this._extractFeatures(description, keywords);

    // Determine complexity
    const complexity = this._assessComplexity(description, features);

    return {
      description,
      appType,
      features,
      complexity,
      keywords,
      estimatedFiles: features.length * 3 + 5 // rough estimate
    };
  }

  /**
   * Extract keywords from description
   */
  _extractKeywords(description) {
    const text = description.toLowerCase();
    const keywords = [];

    // Technology keywords
    const techPatterns = {
      react: /react|jsx|component/,
      vue: /vue|vuejs/,
      node: /node|nodejs|express/,
      python: /python|flask|django/,
      database: /database|db|postgres|mysql|mongodb/,
      api: /api|rest|graphql|endpoint/,
      auth: /auth|login|user|authentication|oauth/,
      realtime: /realtime|websocket|socket\.io/,
      mobile: /mobile|ios|android|react native/
    };

    for (const [key, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(text)) {
        keywords.push(key);
      }
    }

    return keywords;
  }

  /**
   * Determine app type
   */
  _determineAppType(description, keywords) {
    const text = description.toLowerCase();

    if (keywords.includes('mobile')) return 'mobile-app';
    if (keywords.includes('api') && !keywords.includes('react') && !keywords.includes('vue')) {
      return 'api';
    }
    if (text.match(/cli|command|terminal/)) return 'cli';
    if (keywords.includes('react') || keywords.includes('vue')) return 'web-app';
    if (keywords.includes('node') || keywords.includes('python')) return 'backend';

    return 'web-app'; // default
  }

  /**
   * Extract features
   */
  _extractFeatures(description, keywords) {
    const features = [];

    if (keywords.includes('auth')) features.push('authentication');
    if (keywords.includes('database')) features.push('database');
    if (keywords.includes('api')) features.push('api');
    if (description.match(/crud|create|read|update|delete/i)) features.push('crud');
    if (keywords.includes('realtime')) features.push('realtime');
    if (description.match(/admin|dashboard/i)) features.push('admin-panel');
    if (description.match(/test|testing/i)) features.push('testing');

    return features.length > 0 ? features : ['basic'];
  }

  /**
   * Assess complexity
   */
  _assessComplexity(description, features) {
    if (features.length > 6) return 'complex';
    if (features.length > 3) return 'medium';
    return 'simple';
  }

  /**
   * Select tech stack based on analysis
   */
  _selectTechStack(analysis) {
    const { appType, keywords } = analysis;

    const stack = {
      type: appType,
      frontend: null,
      backend: null,
      database: null,
      other: []
    };

    // Select frontend
    if (appType === 'web-app') {
      stack.frontend = keywords.includes('vue') ? 'Vue.js' : 'React';
    }

    // Select backend
    if (appType !== 'cli' && appType !== 'frontend') {
      stack.backend = keywords.includes('python') ? 'Python/Flask' : 'Node.js/Express';
    }

    // Select database
    if (keywords.includes('database')) {
      stack.database = keywords.includes('mongodb') ? 'MongoDB' : 'PostgreSQL';
    }

    return stack;
  }

  /**
   * Parse tech stack from string
   */
  _parseTechStack(stackString) {
    const parts = stackString.split(',').map(s => s.trim());

    return {
      frontend: parts.find(p => p.match(/react|vue|angular/i)) || null,
      backend: parts.find(p => p.match(/node|express|python|flask|django/i)) || null,
      database: parts.find(p => p.match(/postgres|mysql|mongodb|sqlite/i)) || null,
      other: parts.filter(p => !p.match(/react|vue|angular|node|express|python|flask|django|postgres|mysql|mongodb|sqlite/i))
    };
  }

  /**
   * Generate project structure
   */
  async _generateProjectStructure(analysis, techStack) {
    this._log('Generating project structure');

    const structure = {
      name: this._generateProjectName(analysis.description),
      directories: [],
      files: []
    };

    // Base structure
    structure.directories.push('src', 'docs');
    structure.files.push({
      path: 'README.md',
      content: this._generateReadme(analysis, techStack)
    });

    structure.files.push({
      path: '.gitignore',
      content: this._generateGitignore(techStack)
    });

    // Frontend structure
    if (techStack.frontend) {
      structure.directories.push('src/components', 'src/pages', 'src/styles');
      structure.files.push({
        path: 'package.json',
        content: JSON.stringify(this._generatePackageJson(structure.name, techStack), null, 2)
      });
    }

    // Backend structure
    if (techStack.backend) {
      structure.directories.push('src/routes', 'src/controllers', 'src/models');
      if (techStack.backend.includes('Node')) {
        structure.files.push({
          path: techStack.frontend ? 'server/package.json' : 'package.json',
          content: JSON.stringify(this._generateBackendPackageJson(structure.name), null, 2)
        });
      } else if (techStack.backend.includes('Python')) {
        structure.files.push({
          path: 'requirements.txt',
          content: this._generateRequirementsTxt()
        });
      }
    }

    // Add feature-specific files
    for (const feature of analysis.features) {
      const featureFiles = this._getFeatureFiles(feature, techStack);
      structure.files.push(...featureFiles);
    }

    return structure;
  }

  /**
   * Create build workflow
   */
  _createBuildWorkflow(analysis, techStack, structure) {
    const workflow = {
      name: 'autonomous_build',
      phases: [
        {
          name: 'setup',
          agents: [
            {
              type: 'architect',
              task: `Set up project structure for: ${analysis.description}`,
              context: { analysis, techStack, structure }
            }
          ]
        },
        {
          name: 'implementation',
          agents: analysis.features.map(feature => ({
            type: 'developer',
            task: `Implement ${feature} feature`,
            context: { feature, techStack }
          })),
          parallel: true
        },
        {
          name: 'integration',
          agents: [
            {
              type: 'integrator',
              task: 'Integrate all features and ensure they work together',
              context: { features: analysis.features }
            }
          ]
        },
        {
          name: 'finalization',
          agents: [
            {
              type: 'documenter',
              task: 'Generate comprehensive documentation',
              context: { analysis, techStack }
            }
          ]
        }
      ]
    };

    return workflow;
  }

  /**
   * Write project files to disk
   */
  async _writeProjectFiles(buildId, structure, workflowResult) {
    const projectPath = join(this.config.outputDir, structure.name);

    this._log(`Writing project files to: ${projectPath}`);

    // Create base directory
    if (!existsSync(projectPath)) {
      await mkdir(projectPath, { recursive: true });
    }

    // Create directories
    for (const dir of structure.directories) {
      const dirPath = join(projectPath, dir);
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }
    }

    // Write files
    for (const file of structure.files) {
      const filePath = join(projectPath, file.path);
      await writeFile(filePath, file.content, 'utf-8');
    }

    return projectPath;
  }

  /**
   * Generate project name
   */
  _generateProjectName(description) {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .slice(0, 3)
      .join('-')
      || 'my-app';
  }

  /**
   * Generate README
   */
  _generateReadme(analysis, techStack) {
    return `# ${this._generateProjectName(analysis.description)}

${analysis.description}

## Tech Stack

- Frontend: ${techStack.frontend || 'N/A'}
- Backend: ${techStack.backend || 'N/A'}
- Database: ${techStack.database || 'N/A'}

## Features

${analysis.features.map(f => `- ${f}`).join('\n')}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Built With

Master Workflow - Autonomous AI development framework
`;
  }

  /**
   * Generate .gitignore
   */
  _generateGitignore(techStack) {
    const lines = [
      'node_modules/',
      '.env',
      '.DS_Store',
      'dist/',
      'build/',
      '*.log'
    ];

    if (techStack.backend?.includes('Python')) {
      lines.push('__pycache__/', '*.pyc', 'venv/', '.venv/');
    }

    return lines.join('\n');
  }

  /**
   * Generate package.json
   */
  _generatePackageJson(name, techStack) {
    const pkg = {
      name,
      version: '1.0.0',
      description: 'Generated by Master Workflow',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {},
      devDependencies: {}
    };

    if (techStack.frontend?.includes('React')) {
      pkg.dependencies.react = '^18.2.0';
      pkg.dependencies['react-dom'] = '^18.2.0';
      pkg.devDependencies.vite = '^5.0.0';
      pkg.devDependencies['@vitejs/plugin-react'] = '^4.2.0';
    }

    return pkg;
  }

  /**
   * Generate backend package.json
   */
  _generateBackendPackageJson(name) {
    return {
      name: `${name}-server`,
      version: '1.0.0',
      description: 'Backend server generated by Master Workflow',
      scripts: {
        start: 'node src/index.js',
        dev: 'nodemon src/index.js'
      },
      dependencies: {
        express: '^4.18.2',
        dotenv: '^16.3.1'
      },
      devDependencies: {
        nodemon: '^3.0.2'
      }
    };
  }

  /**
   * Generate requirements.txt
   */
  _generateRequirementsTxt() {
    return `Flask==3.0.0
python-dotenv==1.0.0
`;
  }

  /**
   * Get files for a feature
   */
  _getFeatureFiles(feature, techStack) {
    const files = [];

    // Placeholder - would be expanded based on feature type
    switch (feature) {
      case 'authentication':
        files.push({
          path: 'src/auth.js',
          content: '// Authentication implementation\n'
        });
        break;
      case 'api':
        files.push({
          path: 'src/api/index.js',
          content: '// API implementation\n'
        });
        break;
      default:
        files.push({
          path: `src/${feature}.js`,
          content: `// ${feature} implementation\n`
        });
    }

    return files;
  }

  /**
   * Initialize templates
   */
  _initializeTemplates() {
    return {
      // Template definitions would go here
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    await this.orchestrator.shutdown();
    this.removeAllListeners();
  }

  /**
   * Internal logging
   */
  _log(message, data = {}) {
    if (this.config.verbose) {
      console.log(`[AutonomousBuilder] ${message}`, data);
    }
    this.emit('log', { message, data, timestamp: Date.now() });
  }
}

export default AutonomousBuilder;
