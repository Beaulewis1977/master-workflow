#!/usr/bin/env node

/**
 * Interactive Installer
 * Guides users through setting up Master Workflow
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// For this implementation, we'll use simple console I/O
// In production, you'd use inquirer, but for now let's keep it simple

class InteractiveInstaller {
  constructor() {
    this.config = {};
    this.steps = [
      'welcome',
      'checkEnvironment',
      'configureApi',
      'configureMemory',
      'configureBuilder',
      'createExamples',
      'finish'
    ];
    this.currentStep = 0;
  }

  async run() {
    console.log('\n🚀 Master Workflow - Interactive Installation\n');

    for (const step of this.steps) {
      await this[step]();
    }
  }

  async welcome() {
    console.log('Welcome to Master Workflow!');
    console.log('This installer will guide you through the setup process.\n');
    console.log('Master Workflow combines:');
    console.log('  • Agent OS - AI agent runtime with memory and planning');
    console.log('  • Claude Flow - Workflow orchestration');
    console.log('  • Claude Code - Integration with Anthropic Claude');
    console.log('  • Autonomous Builder - Build apps from descriptions\n');

    await this._pause();
  }

  async checkEnvironment() {
    console.log('📋 Checking environment...\n');

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`✓ Node.js version: ${nodeVersion}`);

    // Check for required directories
    const dirs = ['.agent-memory', 'workflows', 'templates', 'output'];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        console.log(`  Creating ${dir}/...`);
        await mkdir(dir, { recursive: true });
      } else {
        console.log(`✓ ${dir}/ exists`);
      }
    }

    console.log('\n✓ Environment check complete\n');
  }

  async configureApi() {
    console.log('🔑 API Configuration\n');

    console.log('Master Workflow can integrate with Claude Code.');
    console.log('You can configure this later by editing .env file.\n');

    // Generate .env template
    this.config.apiKey = 'your_api_key_here';

    console.log('✓ API configuration prepared\n');
  }

  async configureMemory() {
    console.log('🧠 Memory Configuration\n');

    this.config.memory = {
      path: './.agent-memory',
      maxShortTermSize: 100
    };

    console.log(`Memory will be stored in: ${this.config.memory.path}`);
    console.log(`Short-term cache size: ${this.config.memory.maxShortTermSize} entries\n`);

    console.log('✓ Memory configuration complete\n');
  }

  async configureBuilder() {
    console.log('🏗️  Builder Configuration\n');

    this.config.builder = {
      outputDir: './output',
      templatesDir: './templates'
    };

    console.log(`Generated apps will be saved to: ${this.config.builder.outputDir}`);
    console.log(`Templates directory: ${this.config.builder.templatesDir}\n`);

    console.log('✓ Builder configuration complete\n');
  }

  async createExamples() {
    console.log('📚 Creating example files...\n');

    // Create .env file
    const envContent = `# Master Workflow Configuration
ANTHROPIC_API_KEY=${this.config.apiKey}
AGENT_OS_MEMORY_PATH=${this.config.memory.path}
CLAUDE_FLOW_WORKFLOWS_PATH=./workflows
BUILDER_TEMPLATES_PATH=${this.config.builder.templatesDir}
BUILDER_OUTPUT_PATH=${this.config.builder.outputDir}
`;

    await writeFile('.env', envContent, 'utf-8');
    console.log('✓ Created .env file');

    // Create example workflow
    const exampleWorkflow = `# Example Workflow: Feature Development
name: feature-development
description: Complete workflow for developing a new feature

phases:
  - name: planning
    agents:
      - type: planner
        task: "Analyze the feature requirements and create a detailed plan"
        context:
          requireTests: true
          requireDocs: true

  - name: implementation
    agents:
      - type: developer
        task: "Implement the planned feature with best practices"
        dependsOn: planner

  - name: testing
    agents:
      - type: tester
        task: "Write and run comprehensive tests"
        dependsOn: developer

  - name: documentation
    agents:
      - type: documenter
        task: "Create documentation for the new feature"
        dependsOn: developer
`;

    await writeFile('workflows/example-feature-development.yaml', exampleWorkflow, 'utf-8');
    console.log('✓ Created example workflow (workflows/example-feature-development.yaml)');

    // Create quick start guide
    const quickStart = `# Quick Start Guide

## Running Your First Build

Build an application from a description:

\`\`\`bash
npm run build:app -- --describe "A todo app with React frontend"
\`\`\`

## Running a Workflow

Execute a pre-defined workflow:

\`\`\`bash
npm run flow -- --workflow workflows/example-feature-development.yaml
\`\`\`

## Using the Agent CLI

Start an interactive agent session:

\`\`\`bash
npm run agent -- --type developer --task "Refactor the authentication module"
\`\`\`

## Configuration

Edit the .env file to customize:
- API keys
- Memory settings
- Output directories

## Examples

### Build a Blog Platform

\`\`\`bash
npm run build:app -- \\
  --describe "A blog platform with user auth and comments" \\
  --stack "React, Node.js, PostgreSQL" \\
  --features "auth,crud,api,comments"
\`\`\`

### Build a REST API

\`\`\`bash
npm run build:app -- \\
  --describe "A REST API for a todo application" \\
  --stack "Node.js, Express, MongoDB"
\`\`\`

## Learn More

- Check docs/ for detailed documentation
- View workflows/ for workflow examples
- Browse templates/ for app templates

## Support

For issues and questions, see the GitHub repository.
`;

    await writeFile('docs/QUICK_START.md', quickStart, 'utf-8');
    console.log('✓ Created quick start guide (docs/QUICK_START.md)');

    console.log('\n✓ Example files created\n');
  }

  async finish() {
    console.log('✅ Installation Complete!\n');

    console.log('🎉 Master Workflow is ready to use!\n');

    console.log('Next steps:');
    console.log('  1. Edit .env and add your Anthropic API key (if needed)');
    console.log('  2. Read docs/QUICK_START.md for usage examples');
    console.log('  3. Try building your first app:\n');

    console.log('     npm run build:app -- --describe "Your app idea here"\n');

    console.log('Happy building! 🚀\n');
  }

  async _pause() {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run installer
const installer = new InteractiveInstaller();
installer.run().catch(console.error);
