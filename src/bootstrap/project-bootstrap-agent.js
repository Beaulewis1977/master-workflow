/**
 * PROJECT BOOTSTRAP AGENT
 * =======================
 * Ultra-intelligent agent that can:
 * - Read minimal build docs (just architecture description)
 * - Ask clarifying questions interactively
 * - Generate complete documentation suite
 * - Create architecture diagrams
 * - Determine tech stack
 * - Create build phases
 * - Start autonomous building
 *
 * This is the "brain" of the interactive installer.
 */

import { EventEmitter } from 'events';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import inquirer from 'inquirer';

export class ProjectBootstrapAgent extends EventEmitter {
  constructor(options = {}) {
    super();

    this.projectPath = options.projectPath || process.cwd();
    this.interactiveMode = options.interactive !== false;
    this.verbose = options.verbose || false;

    // Intelligence systems (injected)
    this.queen = options.queen || null;

    // Discovered project info
    this.project = {
      name: null,
      description: null,
      architecture: null,
      techStack: [],
      buildPhase: 'planning',
      features: [],
      constraints: [],
      existingDocs: [],
      existingCode: [],
      generatedDocs: []
    };
  }

  /**
   * BOOTSTRAP - Main entry point
   * Can bootstrap from scratch OR analyze existing project
   */
  async bootstrap() {
    console.log('\n🚀 PROJECT BOOTSTRAP AGENT');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Phase 1: Detect if this is new or existing project
    const isExisting = await this._detectExistingProject();

    if (isExisting) {
      console.log('📂 Existing project detected!\n');
      return await this._bootstrapExistingProject();
    } else {
      console.log('✨ New project - creating from scratch!\n');
      return await this._bootstrapNewProject();
    }
  }

  /**
   * BOOTSTRAP EXISTING PROJECT
   * Analyzes codebase, creates missing docs, determines build phase
   */
  async _bootstrapExistingProject() {
    console.log('🔍 ANALYZING EXISTING PROJECT...\n');

    // Step 1: Read existing documentation
    console.log('📄 Step 1: Reading existing documentation...');
    await this._readExistingDocs();
    console.log(`   Found ${this.project.existingDocs.length} existing docs\n`);

    // Step 2: Analyze codebase
    console.log('🏗️  Step 2: Analyzing codebase...');
    await this._analyzeCodebase();
    console.log(`   Found ${this.project.existingCode.length} source files\n`);

    // Step 3: Determine tech stack
    console.log('🔧 Step 3: Detecting tech stack...');
    await this._detectTechStack();
    console.log(`   Tech Stack: ${this.project.techStack.join(', ')}\n`);

    // Step 4: Determine build phase
    console.log('📊 Step 4: Determining build phase...');
    await this._detectBuildPhase();
    console.log(`   Build Phase: ${this.project.buildPhase}\n`);

    // Step 5: Ask clarifying questions
    if (this.interactiveMode) {
      console.log('💬 Step 5: Clarifying questions...\n');
      await this._askClarifyingQuestions();
    }

    // Step 6: Generate missing documentation
    console.log('\n📝 Step 6: Generating missing documentation...');
    await this._generateMissingDocs();
    console.log(`   Generated ${this.project.generatedDocs.length} new docs\n`);

    // Step 7: Create repo wiki
    console.log('📚 Step 7: Creating repo wiki...');
    await this._createRepoWiki();
    console.log('   ✓ Repo wiki created\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ EXISTING PROJECT BOOTSTRAP COMPLETE!\n');

    return this._createBootstrapResult();
  }

  /**
   * BOOTSTRAP NEW PROJECT
   * Reads minimal docs, asks questions, generates everything
   */
  async _bootstrapNewProject() {
    console.log('📝 BOOTSTRAPPING NEW PROJECT...\n');

    // Step 1: Read minimal input docs
    console.log('📄 Step 1: Reading input documentation...');
    await this._readMinimalDocs();
    console.log(`   Read ${this.project.existingDocs.length} docs\n`);

    // Step 2: Ask detailed questions
    if (this.interactiveMode) {
      console.log('💬 Step 2: Interactive questions...\n');
      await this._askDetailedQuestions();
    }

    // Step 3: Generate complete documentation suite
    console.log('\n📝 Step 3: Generating complete documentation...');
    await this._generateCompleteDocs();
    console.log(`   Generated ${this.project.generatedDocs.length} docs\n`);

    // Step 4: Generate architecture diagrams
    console.log('🎨 Step 4: Creating architecture diagrams...');
    await this._generateArchitectureDiagrams();
    console.log('   ✓ Diagrams created\n');

    // Step 5: Create build phases
    console.log('📊 Step 5: Creating build phases...');
    await this._createBuildPhases();
    console.log('   ✓ Build phases defined\n');

    // Step 6: Create project structure
    console.log('🏗️  Step 6: Creating project structure...');
    await this._createProjectStructure();
    console.log('   ✓ Structure created\n');

    // Step 7: Create repo wiki
    console.log('📚 Step 7: Creating repo wiki...');
    await this._createRepoWiki();
    console.log('   ✓ Repo wiki created\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ NEW PROJECT BOOTSTRAP COMPLETE!\n');

    return this._createBootstrapResult();
  }

  // ========== DETECTION METHODS ==========

  async _detectExistingProject() {
    // Check for common indicators of existing project
    const indicators = [
      'package.json',
      'src/',
      'lib/',
      'app/',
      'index.js',
      'main.py',
      'go.mod',
      'Cargo.toml',
      'pom.xml',
      'build.gradle'
    ];

    for (const indicator of indicators) {
      if (existsSync(join(this.projectPath, indicator))) {
        return true;
      }
    }

    return false;
  }

  async _readExistingDocs() {
    const docPatterns = [
      'README.md',
      'ARCHITECTURE.md',
      'DESIGN.md',
      'SPEC.md',
      'docs/**/*.md',
      '.agent-os/**/*.md',
      'CLAUDE.md'
    ];

    for (const pattern of docPatterns) {
      const path = join(this.projectPath, pattern);
      if (existsSync(path)) {
        try {
          const content = await readFile(path, 'utf-8');
          this.project.existingDocs.push({
            path: pattern,
            content,
            type: this._classifyDoc(content)
          });
        } catch (error) {
          // Skip if can't read
        }
      }
    }

    // Extract key info from docs
    await this._extractInfoFromDocs();
  }

  async _readMinimalDocs() {
    // Same as readExistingDocs but for new projects
    await this._readExistingDocs();
  }

  async _analyzeCodebase() {
    // Use Queen's Code Archaeology if available
    if (this.queen) {
      const excavation = await this.queen.excavateCodebase(this.projectPath);
      this.project.existingCode = excavation.files || [];
      this.project.architecture = excavation.architecture || null;
      this.project.techStack = excavation.technologies || [];
    } else {
      // Fallback: simple file scanning
      await this._scanSourceFiles();
    }
  }

  async _detectTechStack() {
    const detected = new Set(this.project.techStack);

    // Check package.json
    if (existsSync(join(this.projectPath, 'package.json'))) {
      detected.add('JavaScript/TypeScript');
      detected.add('Node.js');
    }

    // Check requirements.txt or setup.py
    if (existsSync(join(this.projectPath, 'requirements.txt')) ||
        existsSync(join(this.projectPath, 'setup.py'))) {
      detected.add('Python');
    }

    // Check go.mod
    if (existsSync(join(this.projectPath, 'go.mod'))) {
      detected.add('Go');
    }

    // Check Cargo.toml
    if (existsSync(join(this.projectPath, 'Cargo.toml'))) {
      detected.add('Rust');
    }

    this.project.techStack = Array.from(detected);
  }

  async _detectBuildPhase() {
    // Analyze completeness of project
    const hasTests = this.project.existingCode.some(f => f.includes('test'));
    const hasCI = existsSync(join(this.projectPath, '.github/workflows'));
    const hasDocs = this.project.existingDocs.length > 3;
    const codeFiles = this.project.existingCode.length;

    if (codeFiles === 0) {
      this.project.buildPhase = 'planning';
    } else if (codeFiles < 10) {
      this.project.buildPhase = 'early-development';
    } else if (!hasTests) {
      this.project.buildPhase = 'development';
    } else if (!hasCI) {
      this.project.buildPhase = 'testing';
    } else if (!hasDocs) {
      this.project.buildPhase = 'pre-release';
    } else {
      this.project.buildPhase = 'maintenance';
    }
  }

  // ========== INTERACTIVE METHODS ==========

  async _askClarifyingQuestions() {
    const questions = [
      {
        type: 'input',
        name: 'projectName',
        message: 'What is the project name?',
        default: this.project.name || 'my-project'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief project description:',
        default: this.project.description || ''
      },
      {
        type: 'confirm',
        name: 'createMissingDocs',
        message: 'Generate missing documentation?',
        default: true
      },
      {
        type: 'confirm',
        name: 'createWiki',
        message: 'Create repo wiki?',
        default: true
      }
    ];

    const answers = await inquirer.prompt(questions);
    Object.assign(this.project, answers);
  }

  async _askDetailedQuestions() {
    const questions = [
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-project'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: ''
      },
      {
        type: 'checkbox',
        name: 'techStack',
        message: 'Select tech stack:',
        choices: [
          'JavaScript/TypeScript',
          'Python',
          'Go',
          'Rust',
          'Java',
          'React',
          'Vue',
          'Angular',
          'Node.js',
          'Django',
          'Flask',
          'PostgreSQL',
          'MongoDB',
          'Redis'
        ]
      },
      {
        type: 'list',
        name: 'architecture',
        message: 'Architecture pattern:',
        choices: [
          'Monolithic',
          'Microservices',
          'Serverless',
          'JAMstack',
          'Event-Driven',
          'Layered'
        ]
      },
      {
        type: 'input',
        name: 'features',
        message: 'Key features (comma-separated):',
        filter: (input) => input.split(',').map(s => s.trim())
      }
    ];

    const answers = await inquirer.prompt(questions);
    Object.assign(this.project, answers);
  }

  // ========== GENERATION METHODS ==========

  async _generateMissingDocs() {
    const docsToGenerate = [
      { name: 'ARCHITECTURE.md', generator: () => this._generateArchitectureDoc() },
      { name: 'DEVELOPMENT.md', generator: () => this._generateDevelopmentDoc() },
      { name: 'API.md', generator: () => this._generateAPIDoc() },
      { name: 'DEPLOYMENT.md', generator: () => this._generateDeploymentDoc() },
      { name: 'CONTRIBUTING.md', generator: () => this._generateContributingDoc() }
    ];

    for (const doc of docsToGenerate) {
      const exists = this.project.existingDocs.some(d => d.path.includes(doc.name));
      if (!exists) {
        const content = await doc.generator();
        const path = join(this.projectPath, 'docs', doc.name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content);
        this.project.generatedDocs.push(doc.name);
      }
    }
  }

  async _generateCompleteDocs() {
    await this._generateMissingDocs();

    // Also generate project-specific docs
    const projectReadme = this._generateReadme();
    await writeFile(join(this.projectPath, 'README.md'), projectReadme);
    this.project.generatedDocs.push('README.md');
  }

  async _generateArchitectureDiagrams() {
    // Generate Mermaid diagrams
    const diagrams = {
      'architecture-overview.mmd': this._generateArchitectureMermaid(),
      'data-flow.mmd': this._generateDataFlowMermaid(),
      'deployment.mmd': this._generateDeploymentMermaid()
    };

    const diagramsDir = join(this.projectPath, 'docs', 'diagrams');
    await mkdir(diagramsDir, { recursive: true });

    for (const [name, content] of Object.entries(diagrams)) {
      await writeFile(join(diagramsDir, name), content);
    }
  }

  async _createBuildPhases() {
    const phases = [
      {
        name: 'Phase 1: Foundation',
        tasks: ['Setup project structure', 'Configure tooling', 'Create core modules']
      },
      {
        name: 'Phase 2: Core Features',
        tasks: ['Implement main features', 'Add tests', 'Create API endpoints']
      },
      {
        name: 'Phase 3: Integration',
        tasks: ['Integrate external services', 'Add authentication', 'Setup CI/CD']
      },
      {
        name: 'Phase 4: Polish',
        tasks: ['Add documentation', 'Optimize performance', 'Security audit']
      },
      {
        name: 'Phase 5: Release',
        tasks: ['Final testing', 'Deployment', 'Monitoring setup']
      }
    ];

    const phasesDoc = this._generatePhasesDoc(phases);
    await writeFile(join(this.projectPath, 'BUILD-PHASES.md'), phasesDoc);
  }

  async _createProjectStructure() {
    const structure = {
      'src': {},
      'tests': {},
      'docs': {},
      'config': {},
      '.agent-os': {
        'specs': {},
        'tasks': {},
        'plans': {}
      }
    };

    await this._createDirStructure(this.projectPath, structure);
  }

  async _createRepoWiki() {
    const wikiDir = join(this.projectPath, 'wiki');
    await mkdir(wikiDir, { recursive: true });

    const wikiPages = {
      'Home.md': this._generateWikiHome(),
      'Getting-Started.md': this._generateWikiGettingStarted(),
      'Architecture.md': this._generateWikiArchitecture(),
      'Development-Guide.md': this._generateWikiDevelopment(),
      'API-Reference.md': this._generateWikiAPI()
    };

    for (const [name, content] of Object.entries(wikiPages)) {
      await writeFile(join(wikiDir, name), content);
    }
  }

  // ========== HELPER METHODS ==========

  _classifyDoc(content) {
    const lower = content.toLowerCase();
    if (lower.includes('architecture') || lower.includes('design')) return 'architecture';
    if (lower.includes('api') || lower.includes('endpoint')) return 'api';
    if (lower.includes('spec') || lower.includes('specification')) return 'specification';
    if (lower.includes('readme')) return 'readme';
    return 'general';
  }

  async _extractInfoFromDocs() {
    for (const doc of this.project.existingDocs) {
      // Extract project name from README
      if (doc.path.includes('README')) {
        const nameMatch = doc.content.match(/^#\s+(.+)/m);
        if (nameMatch) this.project.name = nameMatch[1].trim();
      }

      // Extract description
      const descMatch = doc.content.match(/##\s+(?:Description|About)\n\n(.+)/i);
      if (descMatch) this.project.description = descMatch[1].trim();

      // Extract features
      const featuresMatch = doc.content.match(/##\s+Features?\n\n((?:[-*]\s+.+\n?)+)/i);
      if (featuresMatch) {
        const features = featuresMatch[1].split('\n')
          .filter(l => l.trim())
          .map(l => l.replace(/^[-*]\s+/, '').trim());
        this.project.features.push(...features);
      }
    }
  }

  async _scanSourceFiles() {
    // Simple recursive file scan
    const scan = async (dir) => {
      try {
        const entries = await readdir(join(this.projectPath, dir), { withFileTypes: true });
        for (const entry of entries) {
          const path = join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scan(path);
          } else if (entry.isFile() && this._isSourceFile(entry.name)) {
            this.project.existingCode.push(path);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    await scan('');
  }

  _isSourceFile(filename) {
    const extensions = ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  async _createDirStructure(base, structure) {
    for (const [dir, children] of Object.entries(structure)) {
      const dirPath = join(base, dir);
      await mkdir(dirPath, { recursive: true });
      if (Object.keys(children).length > 0) {
        await this._createDirStructure(dirPath, children);
      }
    }
  }

  _createBootstrapResult() {
    return {
      success: true,
      project: this.project,
      nextSteps: this._generateNextSteps()
    };
  }

  _generateNextSteps() {
    const steps = [];

    if (this.project.buildPhase === 'planning') {
      steps.push('Review generated documentation');
      steps.push('Start implementing core features');
      steps.push('Setup development environment');
    } else if (this.project.buildPhase === 'development') {
      steps.push('Continue feature development');
      steps.push('Add comprehensive tests');
      steps.push('Update documentation');
    } else {
      steps.push('Review build phase status');
      steps.push('Address any gaps');
      steps.push('Prepare for next phase');
    }

    return steps;
  }

  // ========== DOCUMENT GENERATORS ==========

  _generateReadme() {
    return `# ${this.project.name}

${this.project.description}

## Tech Stack

${this.project.techStack.map(t => `- ${t}`).join('\n')}

## Architecture

${this.project.architecture || 'TBD'}

## Features

${this.project.features.map(f => `- ${f}`).join('\n')}

## Getting Started

See [Getting Started Guide](./docs/GETTING-STARTED.md)

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [API Reference](./docs/API.md)
- [Deployment](./docs/DEPLOYMENT.md)

## Build Phase

Current Phase: **${this.project.buildPhase}**

See [BUILD-PHASES.md](./BUILD-PHASES.md) for details.

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md)

## License

MIT
`;
  }

  _generateArchitectureDoc() {
    return `# Architecture

## Overview

${this.project.description}

## Architecture Pattern

${this.project.architecture || 'TBD'}

## Component Diagram

See [diagrams/architecture-overview.mmd](./diagrams/architecture-overview.mmd)

## Tech Stack

${this.project.techStack.map(t => `- ${t}`).join('\n')}

## Design Decisions

TBD

## Future Considerations

TBD
`;
  }

  _generateDevelopmentDoc() {
    return `# Development Guide

## Setup

\`\`\`bash
# Clone repository
git clone <repo-url>

# Install dependencies
npm install  # or appropriate command for your stack

# Run development server
npm run dev
\`\`\`

## Project Structure

\`\`\`
src/          - Source code
tests/        - Test files
docs/         - Documentation
config/       - Configuration files
.agent-os/    - Agent OS specs and tasks
\`\`\`

## Development Workflow

1. Create feature branch
2. Implement feature
3. Add tests
4. Update documentation
5. Create pull request

## Testing

\`\`\`bash
npm test
\`\`\`

## Code Style

Follow standard conventions for ${this.project.techStack[0] || 'your language'}.
`;
  }

  _generateAPIDoc() {
    return `# API Reference

## Endpoints

TBD

## Authentication

TBD

## Examples

TBD
`;
  }

  _generateDeploymentDoc() {
    return `# Deployment Guide

## Prerequisites

- TBD

## Deployment Steps

1. TBD
2. TBD

## Environment Variables

TBD

## Monitoring

TBD
`;
  }

  _generateContributingDoc() {
    return `# Contributing

## How to Contribute

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update documentation
6. Submit pull request

## Code of Conduct

Be respectful and professional.

## Questions?

Open an issue or contact maintainers.
`;
  }

  _generatePhasesDoc(phases) {
    return `# Build Phases

${phases.map((phase, i) => `
## ${phase.name}

**Tasks:**
${phase.tasks.map(t => `- [ ] ${t}`).join('\n')}

`).join('\n')}
`;
  }

  _generateArchitectureMermaid() {
    return `graph TB
    A[Client] --> B[API Gateway]
    B --> C[Service Layer]
    C --> D[Data Layer]
    D --> E[Database]
`;
  }

  _generateDataFlowMermaid() {
    return `flowchart LR
    A[Input] --> B[Processing]
    B --> C[Output]
`;
  }

  _generateDeploymentMermaid() {
    return `graph LR
    A[Development] --> B[Staging]
    B --> C[Production]
`;
  }

  _generateWikiHome() {
    return `# ${this.project.name} Wiki

Welcome to the ${this.project.name} wiki!

## Quick Links

- [Getting Started](./Getting-Started.md)
- [Architecture](./Architecture.md)
- [Development Guide](./Development-Guide.md)
- [API Reference](./API-Reference.md)
`;
  }

  _generateWikiGettingStarted() {
    return `# Getting Started

Quick start guide for ${this.project.name}.

## Prerequisites

${this.project.techStack.map(t => `- ${t}`).join('\n')}

## Installation

\`\`\`bash
git clone <repo-url>
cd ${this.project.name}
npm install
\`\`\`

## First Steps

1. Review the architecture
2. Run the development server
3. Explore the codebase
`;
  }

  _generateWikiArchitecture() {
    return `# Architecture

Detailed architecture documentation for ${this.project.name}.

See main [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for more details.
`;
  }

  _generateWikiDevelopment() {
    return `# Development Guide

Development guidelines for contributors.

See main [DEVELOPMENT.md](../docs/DEVELOPMENT.md) for more details.
`;
  }

  _generateWikiAPI() {
    return `# API Reference

API documentation for ${this.project.name}.

See main [API.md](../docs/API.md) for more details.
`;
  }
}

export default ProjectBootstrapAgent;
