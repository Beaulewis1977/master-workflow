/**
 * DocumentationGenerator - Automatic Documentation Creation
 * ==========================================================
 * Generates comprehensive documentation from project analysis.
 * Part of the Autonomous Documentation & Spec-Driven Development System.
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class DocumentationGenerator extends EventEmitter {
  constructor(projectAnalysis, options = {}) {
    super();
    this.analysis = projectAnalysis;
    this.options = {
      outputDir: options.outputDir || './docs',
      formats: options.formats || ['markdown'],
      includeExamples: options.includeExamples !== false,
      includeDiagrams: options.includeDiagrams !== false,
      includeMetrics: options.includeMetrics !== false,
      verbose: options.verbose || false
    };
    this.generatedDocs = new Map();
    this.templates = new Map();
    this.initializeTemplates();
  }

  log(msg) { if (this.options.verbose) console.log(msg); }

  initializeTemplates() {
    this.templates.set('api', this.apiTemplate.bind(this));
    this.templates.set('architecture', this.architectureTemplate.bind(this));
    this.templates.set('component', this.componentTemplate.bind(this));
    this.templates.set('setup', this.setupTemplate.bind(this));
    this.templates.set('contributing', this.contributingTemplate.bind(this));
  }

  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  async generateAllDocumentation() {
    this.log('📚 Generating comprehensive documentation...');
    this.emit('generation:start');

    try {
      await this.generateAPIDocumentation();
      await this.generateArchitectureDocumentation();
      await this.generateComponentDocumentation();
      await this.generateSetupDocumentation();
      await this.generateContributingDocumentation();
      await this.generateReadme();

      this.log('✅ Documentation generation completed');
      this.emit('generation:complete', { docs: Array.from(this.generatedDocs.keys()) });
      return this.generatedDocs;
    } catch (error) {
      this.emit('generation:error', error);
      throw error;
    }
  }

  async generateAPIDocumentation() {
    this.log('📝 Generating API documentation...');
    const components = this.analysis.components || {};
    const metadata = this.analysis.dependencies?.node?.metadata || {};

    let content = `# ${metadata.name || 'Project'} API Documentation\n\n`;
    content += `**Version:** ${metadata.version || '1.0.0'}\n`;
    content += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    content += `## Overview\n\nThis document provides comprehensive API documentation for the project.\n\n`;

    // Group components by type
    const grouped = this.groupByType(components);

    // Classes
    if (grouped.class?.length > 0) {
      content += `## Classes\n\n`;
      for (const comp of grouped.class) {
        content += `### ${comp.name}\n\n`;
        content += `**File:** \`${comp.file}\`\n\n`;
        content += this.generateComponentDescription(comp) + '\n\n';
        if (this.options.includeExamples) {
          content += `#### Usage Example\n\n\`\`\`javascript\nconst instance = new ${comp.name}();\n\`\`\`\n\n`;
        }
      }
    }

    // Functions
    if (grouped.function?.length > 0 || grouped['arrow-function']?.length > 0) {
      content += `## Functions\n\n`;
      const funcs = [...(grouped.function || []), ...(grouped['arrow-function'] || [])];
      for (const comp of funcs) {
        content += `### ${comp.name}\n\n`;
        content += `**File:** \`${comp.file}\`\n`;
        content += `**Type:** ${comp.type}\n\n`;
        content += this.generateComponentDescription(comp) + '\n\n';
      }
    }

    // Exports
    if (grouped.export?.length > 0) {
      content += `## Exports\n\n`;
      for (const comp of grouped.export) {
        content += `- **${comp.name}** - \`${comp.file}\`\n`;
      }
      content += '\n';
    }

    this.generatedDocs.set('API.md', content);
    this.emit('doc:generated', { name: 'API.md' });
  }

  async generateArchitectureDocumentation() {
    this.log('🏗️ Generating architecture documentation...');
    const structure = this.analysis.structure || {};
    const patterns = this.analysis.patterns || {};
    const deps = this.analysis.dependencies || {};

    let content = `# System Architecture\n\n`;
    content += `## Overview\n\n`;
    content += this.generateArchitectureOverview() + '\n\n';

    // Architectural Patterns
    content += `## Architectural Patterns\n\n`;
    if (patterns.architectural?.length > 0) {
      for (const pattern of patterns.architectural) {
        content += `### ${pattern.name}\n\n`;
        content += `**Confidence:** ${Math.round(pattern.confidence * 100)}%\n\n`;
        if (pattern.layers) content += `**Layers:** ${pattern.layers.join(', ')}\n\n`;
      }
    } else {
      content += `No specific architectural patterns detected.\n\n`;
    }

    // Project Structure
    content += `## Project Structure\n\n`;
    content += `- **Total Files:** ${structure.totalFiles || 0}\n`;
    content += `- **Total Directories:** ${structure.totalDirectories || 0}\n`;
    content += `- **Max Depth:** ${structure.depth || 0}\n`;
    content += `- **Project Type:** ${structure.projectType || 'unknown'}\n\n`;

    // Languages
    if (structure.languages) {
      content += `### Languages\n\n`;
      for (const [lang, count] of Object.entries(structure.languages)) {
        content += `- **${lang}:** ${count} files\n`;
      }
      content += '\n';
    }

    // Frameworks
    if (structure.frameworks?.length > 0) {
      content += `### Frameworks\n\n`;
      for (const fw of structure.frameworks) {
        content += `- ${fw}\n`;
      }
      content += '\n';
    }

    // Dependencies
    content += `## Dependencies\n\n`;
    if (deps.node) {
      content += `### Node.js Dependencies\n\n`;
      content += `- **Production:** ${Object.keys(deps.node.production || {}).length}\n`;
      content += `- **Development:** ${Object.keys(deps.node.development || {}).length}\n\n`;

      if (Object.keys(deps.node.production || {}).length > 0) {
        content += `#### Production Dependencies\n\n`;
        for (const [name, version] of Object.entries(deps.node.production).slice(0, 20)) {
          content += `- \`${name}\`: ${version}\n`;
        }
        if (Object.keys(deps.node.production).length > 20) {
          content += `- ... and ${Object.keys(deps.node.production).length - 20} more\n`;
        }
        content += '\n';
      }
    }

    // Architecture Diagram (ASCII)
    if (this.options.includeDiagrams) {
      content += `## Architecture Diagram\n\n`;
      content += '```\n' + this.generateAsciiDiagram() + '\n```\n\n';
    }

    this.generatedDocs.set('ARCHITECTURE.md', content);
    this.emit('doc:generated', { name: 'ARCHITECTURE.md' });
  }

  async generateComponentDocumentation() {
    this.log('🧩 Generating component documentation...');
    const components = this.analysis.components || {};

    let content = `# Component Reference\n\n`;
    content += `## Overview\n\nDetailed reference for all ${Object.keys(components).length} system components.\n\n`;

    const grouped = this.groupByType(components);

    for (const [type, comps] of Object.entries(grouped)) {
      content += `## ${this.capitalizeType(type)}s\n\n`;
      
      for (const comp of comps) {
        content += `### ${comp.name}\n\n`;
        content += `| Property | Value |\n|----------|-------|\n`;
        content += `| Type | ${comp.type} |\n`;
        content += `| File | \`${comp.file}\` |\n`;
        content += `| Language | ${comp.language || 'unknown'} |\n`;
        content += `| Exported | ${comp.isExported ? 'Yes' : 'No'} |\n\n`;
        
        content += `**Description:** ${this.generateComponentDescription(comp)}\n\n`;
        
        if (comp.methods?.length > 0) {
          content += `**Methods:**\n`;
          for (const m of comp.methods) {
            content += `- \`${m.name}(${(m.parameters || []).join(', ')})\`\n`;
          }
          content += '\n';
        }
      }
    }

    this.generatedDocs.set('COMPONENTS.md', content);
    this.emit('doc:generated', { name: 'COMPONENTS.md' });
  }

  async generateSetupDocumentation() {
    this.log('⚙️ Generating setup documentation...');
    const deps = this.analysis.dependencies || {};

    let content = `# Setup & Installation\n\n`;
    content += `## Prerequisites\n\n`;
    
    const prereqs = this.identifyPrerequisites();
    for (const prereq of prereqs) {
      content += `- ${prereq}\n`;
    }
    content += '\n';

    content += `## Installation\n\n`;
    content += `### 1. Clone the Repository\n\n`;
    content += `\`\`\`bash\ngit clone <repository-url>\ncd ${deps.node?.metadata?.name || 'project'}\n\`\`\`\n\n`;

    content += `### 2. Install Dependencies\n\n`;
    if (deps.node) {
      content += `\`\`\`bash\nnpm install\n\`\`\`\n\n`;
    }
    if (deps.python) {
      content += `\`\`\`bash\npip install -r requirements.txt\n\`\`\`\n\n`;
    }

    content += `### 3. Configuration\n\n`;
    content += `Copy the example environment file and configure:\n\n`;
    content += `\`\`\`bash\ncp .env.example .env\n# Edit .env with your settings\n\`\`\`\n\n`;

    content += `### 4. Run the Application\n\n`;
    if (deps.node?.scripts) {
      if (deps.node.scripts.dev) {
        content += `**Development:**\n\`\`\`bash\nnpm run dev\n\`\`\`\n\n`;
      }
      if (deps.node.scripts.start) {
        content += `**Production:**\n\`\`\`bash\nnpm start\n\`\`\`\n\n`;
      }
      if (deps.node.scripts.build) {
        content += `**Build:**\n\`\`\`bash\nnpm run build\n\`\`\`\n\n`;
      }
    }

    content += `## Verification\n\n`;
    content += `To verify the installation:\n\n`;
    if (deps.node?.scripts?.test) {
      content += `\`\`\`bash\nnpm test\n\`\`\`\n\n`;
    }

    this.generatedDocs.set('SETUP.md', content);
    this.emit('doc:generated', { name: 'SETUP.md' });
  }

  async generateContributingDocumentation() {
    this.log('🤝 Generating contributing documentation...');
    const deps = this.analysis.dependencies || {};

    let content = `# Contributing Guidelines\n\n`;
    content += `## Overview\n\nThank you for considering contributing to this project!\n\n`;

    content += `## Development Setup\n\n`;
    content += `1. Fork the repository\n`;
    content += `2. Clone your fork\n`;
    content += `3. Install dependencies: \`npm install\`\n`;
    content += `4. Create a feature branch: \`git checkout -b feature/your-feature\`\n\n`;

    content += `## Coding Standards\n\n`;
    content += `- Follow the existing code style\n`;
    content += `- Write meaningful commit messages\n`;
    content += `- Add tests for new features\n`;
    content += `- Update documentation as needed\n\n`;

    content += `## Testing\n\n`;
    if (deps.node?.scripts?.test) {
      content += `Run tests before submitting:\n\n\`\`\`bash\nnpm test\n\`\`\`\n\n`;
    }
    if (deps.node?.scripts?.lint) {
      content += `Run linting:\n\n\`\`\`bash\nnpm run lint\n\`\`\`\n\n`;
    }

    content += `## Pull Request Process\n\n`;
    content += `1. Ensure all tests pass\n`;
    content += `2. Update documentation if needed\n`;
    content += `3. Submit a pull request with a clear description\n`;
    content += `4. Wait for review and address feedback\n\n`;

    content += `## Code of Conduct\n\n`;
    content += `Please be respectful and constructive in all interactions.\n`;

    this.generatedDocs.set('CONTRIBUTING.md', content);
    this.emit('doc:generated', { name: 'CONTRIBUTING.md' });
  }

  async generateReadme() {
    this.log('📄 Generating README...');
    const deps = this.analysis.dependencies || {};
    const structure = this.analysis.structure || {};
    const metrics = this.analysis.metrics || {};
    const metadata = deps.node?.metadata || {};

    let content = `# ${metadata.name || 'Project'}\n\n`;
    
    if (metadata.description) {
      content += `${metadata.description}\n\n`;
    }

    // Badges
    content += `![Version](https://img.shields.io/badge/version-${metadata.version || '1.0.0'}-blue)\n`;
    if (structure.frameworks?.length > 0) {
      content += `![Framework](https://img.shields.io/badge/framework-${structure.frameworks[0]}-green)\n`;
    }
    content += '\n';

    content += `## Features\n\n`;
    content += `- ${Object.keys(this.analysis.components || {}).length} components\n`;
    content += `- ${structure.totalFiles || 0} files\n`;
    if (structure.frameworks?.length > 0) {
      content += `- Built with ${structure.frameworks.join(', ')}\n`;
    }
    content += '\n';

    content += `## Quick Start\n\n`;
    content += `\`\`\`bash\n# Install dependencies\nnpm install\n\n# Run development server\nnpm run dev\n\`\`\`\n\n`;

    content += `## Documentation\n\n`;
    content += `- [API Documentation](./docs/API.md)\n`;
    content += `- [Architecture](./docs/ARCHITECTURE.md)\n`;
    content += `- [Setup Guide](./docs/SETUP.md)\n`;
    content += `- [Contributing](./docs/CONTRIBUTING.md)\n\n`;

    if (this.options.includeMetrics && metrics.code) {
      content += `## Metrics\n\n`;
      content += `| Metric | Value |\n|--------|-------|\n`;
      content += `| Total Files | ${metrics.code.totalFiles} |\n`;
      content += `| Total Lines | ${metrics.code.totalLines} |\n`;
      content += `| Components | ${metrics.code.totalComponents} |\n`;
      content += `| Test Coverage | ~${metrics.quality?.testCoverage || 0}% |\n\n`;
    }

    content += `## License\n\n`;
    content += `${metadata.license || 'MIT'}\n`;

    this.generatedDocs.set('README.md', content);
    this.emit('doc:generated', { name: 'README.md' });
  }

  async saveDocumentation(outputDir) {
    const dir = outputDir || this.options.outputDir;
    this.log(`💾 Saving documentation to ${dir}...`);

    await fs.mkdir(dir, { recursive: true });

    for (const [filename, content] of this.generatedDocs) {
      const filePath = path.join(dir, filename);
      await fs.writeFile(filePath, content, 'utf8');
      this.log(`   ✅ Saved: ${filePath}`);
    }

    this.emit('save:complete', { dir, files: Array.from(this.generatedDocs.keys()) });
    this.log('📚 All documentation saved successfully');
  }

  // Helper methods
  groupByType(components) {
    const grouped = {};
    for (const [name, comp] of Object.entries(components)) {
      const type = comp.type || 'unknown';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push({ name, ...comp });
    }
    return grouped;
  }

  capitalizeType(type) {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  generateComponentDescription(comp) {
    const descriptions = {
      'class': `A ${comp.name} class providing core functionality.`,
      'function': `A function that performs ${comp.name.replace(/([A-Z])/g, ' $1').toLowerCase()} operations.`,
      'arrow-function': `An arrow function for ${comp.name.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
      'export': `Exported module ${comp.name}.`
    };
    return descriptions[comp.type] || `A ${comp.type} component named ${comp.name}.`;
  }

  generateArchitectureOverview() {
    const patterns = this.analysis.patterns?.architectural || [];
    const frameworks = this.analysis.structure?.frameworks || [];
    const components = Object.keys(this.analysis.components || {}).length;
    const files = this.analysis.structure?.totalFiles || 0;

    let overview = 'This project follows a ';
    if (patterns.length > 0) {
      overview += `${patterns[0].name.toLowerCase()} architectural pattern`;
    } else {
      overview += 'custom architectural structure';
    }
    if (frameworks.length > 0) {
      overview += ` built with ${frameworks.join(', ')}`;
    }
    overview += `. The system consists of ${components} main components spread across ${files} files.`;
    return overview;
  }

  identifyPrerequisites() {
    const prereqs = [];
    const deps = this.analysis.dependencies || {};

    if (deps.node) {
      prereqs.push('Node.js 18+ (https://nodejs.org)');
      prereqs.push('npm or yarn package manager');
    }
    if (deps.python) prereqs.push('Python 3.9+');
    if (deps.go) prereqs.push('Go 1.20+');
    if (deps.rust) prereqs.push('Rust (latest stable)');

    const prodDeps = deps.node?.production || {};
    if (prodDeps.mongodb || prodDeps.mongoose) prereqs.push('MongoDB database');
    if (prodDeps.redis || prodDeps.ioredis) prereqs.push('Redis server');
    if (prodDeps.pg || prodDeps.postgres) prereqs.push('PostgreSQL database');
    if (prodDeps.mysql || prodDeps.mysql2) prereqs.push('MySQL database');

    return prereqs.length > 0 ? prereqs : ['Node.js 18+'];
  }

  generateAsciiDiagram() {
    const patterns = this.analysis.patterns?.architectural || [];
    const structure = this.analysis.structure || {};

    if (patterns.find(p => p.name === 'MVC')) {
      return `
┌─────────────────────────────────────────┐
│              Application                │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  Views  │──│Controllers│──│ Models │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│       │            │            │       │
│       └────────────┼────────────┘       │
│                    │                    │
│              ┌─────────┐                │
│              │ Database│                │
│              └─────────┘                │
└─────────────────────────────────────────┘`;
    }

    if (patterns.find(p => p.name === 'Layered Architecture')) {
      return `
┌─────────────────────────────────────────┐
│           Presentation Layer            │
├─────────────────────────────────────────┤
│            Business Layer               │
├─────────────────────────────────────────┤
│             Service Layer               │
├─────────────────────────────────────────┤
│              Data Layer                 │
└─────────────────────────────────────────┘`;
    }

    return `
┌─────────────────────────────────────────┐
│              Application                │
├─────────────────────────────────────────┤
│  Files: ${String(structure.totalFiles || 0).padEnd(6)} Dirs: ${String(structure.totalDirectories || 0).padEnd(6)}  │
│  Components: ${String(Object.keys(this.analysis.components || {}).length).padEnd(25)} │
└─────────────────────────────────────────┘`;
  }

  // Template methods for custom templates
  apiTemplate(data) { return this.generateAPIDocumentation(); }
  architectureTemplate(data) { return this.generateArchitectureDocumentation(); }
  componentTemplate(data) { return this.generateComponentDocumentation(); }
  setupTemplate(data) { return this.generateSetupDocumentation(); }
  contributingTemplate(data) { return this.generateContributingDocumentation(); }
}

export default DocumentationGenerator;
