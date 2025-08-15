/**
 * Framework Template Engine for Claude Flow 2.0
 * Handles template processing, file generation, and project scaffolding
 * Integrates with specialized sub-agents for optimal code generation
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FrameworkStackTemplate, TemplateContext, AdvancedFileTemplate, ProjectDirectory } from './advanced-framework-scaffolder.js';

const execAsync = promisify(exec);

export interface ScaffoldingResult {
  success: boolean;
  message: string;
  files: string[];
  directories: string[];
  commands: string[];
  errors: string[];
  metrics: {
    filesCreated: number;
    directoriesCreated: number;
    timeElapsed: number;
    totalSize: number;
  };
}

export interface AgentTask {
  agent: string;
  task: string;
  context: any;
  priority: number;
}

class FrameworkTemplateEngine {
  private agentRegistry: Map<string, any> = new Map();

  constructor() {
    this.initializeAgentRegistry();
  }

  private initializeAgentRegistry() {
    // Register available agents for different tasks
    this.agentRegistry.set('frontend-specialist', {
      capabilities: ['react', 'vue', 'angular', 'svelte', 'tailwind', 'shadcn'],
      contextWindow: 200000,
      specializations: ['component-development', 'responsive-design', 'performance-optimization']
    });

    this.agentRegistry.set('api-builder', {
      capabilities: ['rest-api', 'graphql', 'authentication', 'validation', 'documentation'],
      contextWindow: 200000,
      specializations: ['endpoint-design', 'security', 'performance']
    });

    this.agentRegistry.set('database-architect', {
      capabilities: ['postgresql', 'mysql', 'mongodb', 'redis', 'migrations', 'optimization'],
      contextWindow: 200000,
      specializations: ['schema-design', 'query-optimization', 'data-modeling']
    });
  }

  public async scaffoldProject(
    template: FrameworkStackTemplate,
    context: TemplateContext,
    outputPath: string
  ): Promise<ScaffoldingResult> {
    const startTime = Date.now();
    const result: ScaffoldingResult = {
      success: false,
      message: '',
      files: [],
      directories: [],
      commands: [],
      errors: [],
      metrics: {
        filesCreated: 0,
        directoriesCreated: 0,
        timeElapsed: 0,
        totalSize: 0
      }
    };

    try {
      // Phase 1: Create directory structure
      await this.createDirectoryStructure(template, outputPath, result);

      // Phase 2: Generate and write files
      await this.generateProjectFiles(template, context, outputPath, result);

      // Phase 3: Install dependencies
      await this.installDependencies(template, outputPath, result);

      // Phase 4: Run post-installation steps
      await this.runPostInstallationSteps(template, outputPath, result);

      // Phase 5: Initialize development environment
      await this.initializeDevelopmentEnvironment(template, outputPath, result);

      // Calculate metrics
      result.metrics.timeElapsed = Date.now() - startTime;
      result.success = true;
      result.message = `Successfully scaffolded ${template.name} project`;

    } catch (error) {
      result.success = false;
      result.message = `Failed to scaffold project: ${error.message}`;
      result.errors.push(error.message);
    }

    return result;
  }

  private async createDirectoryStructure(
    template: FrameworkStackTemplate,
    outputPath: string,
    result: ScaffoldingResult
  ): Promise<void> {
    const createDirectories = async (directories: Record<string, string>, basePath: string) => {
      for (const [dirName, description] of Object.entries(directories)) {
        const dirPath = path.join(basePath, dirName);
        await fs.mkdir(dirPath, { recursive: true });
        result.directories.push(dirPath);
        result.metrics.directoriesCreated++;
      }
    };

    // Create root directories
    await createDirectories(template.structure.root.directories, outputPath);

    // Create subproject directories
    if (template.structure.subprojects) {
      for (const [subprojectName, subproject] of Object.entries(template.structure.subprojects)) {
        const subprojectPath = path.join(outputPath, subprojectName);
        await createDirectories(subproject.directories, subprojectPath);
      }
    }

    // Create shared directories
    if (template.structure.shared) {
      const sharedPath = path.join(outputPath, 'shared');
      await createDirectories(template.structure.shared.directories, sharedPath);
    }
  }

  private async generateProjectFiles(
    template: FrameworkStackTemplate,
    context: TemplateContext,
    outputPath: string,
    result: ScaffoldingResult
  ): Promise<void> {
    const generateFiles = async (files: Record<string, AdvancedFileTemplate>, basePath: string) => {
      for (const [fileName, fileTemplate] of Object.entries(files)) {
        const filePath = path.join(basePath, fileTemplate.path);
        
        let content: string;
        if (typeof fileTemplate.content === 'function') {
          content = fileTemplate.content(context);
        } else {
          content = fileTemplate.templated 
            ? this.processTemplate(fileTemplate.content, context)
            : fileTemplate.content;
        }

        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Write file
        await fs.writeFile(filePath, content, 'utf8');

        // Set executable permissions if needed
        if (fileTemplate.executable) {
          await fs.chmod(filePath, 0o755);
        }

        result.files.push(filePath);
        result.metrics.filesCreated++;
        result.metrics.totalSize += content.length;
      }
    };

    // Generate root files
    await generateFiles(template.structure.root.files, outputPath);

    // Generate subproject files
    if (template.structure.subprojects) {
      for (const [subprojectName, subproject] of Object.entries(template.structure.subprojects)) {
        const subprojectPath = path.join(outputPath, subprojectName);
        await generateFiles(subproject.files, subprojectPath);
      }
    }

    // Generate shared files
    if (template.structure.shared) {
      const sharedPath = path.join(outputPath, 'shared');
      await generateFiles(template.structure.shared.files, sharedPath);
    }
  }

  private processTemplate(template: string, context: TemplateContext): string {
    return template
      .replace(/\{\{projectName\}\}/g, context.projectName)
      .replace(/\{\{description\}\}/g, context.description)
      .replace(/\{\{author\}\}/g, context.author)
      .replace(/\{\{license\}\}/g, context.license)
      .replace(/\{\{version\}\}/g, context.version);
  }

  private async installDependencies(
    template: FrameworkStackTemplate,
    outputPath: string,
    result: ScaffoldingResult
  ): Promise<void> {
    const installForProject = async (project: ProjectDirectory, projectPath: string) => {
      if (Object.keys(project.dependencies).length > 0 || Object.keys(project.devDependencies).length > 0) {
        const packageManager = template.configuration.packageManagers[0];
        
        if (packageManager === 'cargo') {
          // Rust project - dependencies are managed by Cargo.toml
          const buildCommand = 'cargo build';
          result.commands.push(buildCommand);
          await execAsync(buildCommand, { cwd: projectPath });
        } else {
          // Node.js project
          const installCommand = `${packageManager} install`;
          result.commands.push(installCommand);
          await execAsync(installCommand, { cwd: projectPath });
        }
      }
    };

    // Install root dependencies
    await installForProject(template.structure.root, outputPath);

    // Install subproject dependencies
    if (template.structure.subprojects) {
      for (const [subprojectName, subproject] of Object.entries(template.structure.subprojects)) {
        const subprojectPath = path.join(outputPath, subprojectName);
        await installForProject(subproject, subprojectPath);
      }
    }
  }

  private async runPostInstallationSteps(
    template: FrameworkStackTemplate,
    outputPath: string,
    result: ScaffoldingResult
  ): Promise<void> {
    for (const step of template.installation) {
      if (!step.optional) {
        for (const command of step.commands) {
          try {
            result.commands.push(command);
            await execAsync(command, { cwd: outputPath });
          } catch (error) {
            if (!step.optional) {
              throw new Error(`Failed to run command: ${command}`);
            }
            result.errors.push(`Optional command failed: ${command}`);
          }
        }
      }
    }
  }

  private async initializeDevelopmentEnvironment(
    template: FrameworkStackTemplate,
    outputPath: string,
    result: ScaffoldingResult
  ): Promise<void> {
    // Create .env files
    if (Object.keys(template.configuration.environmentVariables).length > 0) {
      const envContent = Object.entries(template.configuration.environmentVariables)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      const envPath = path.join(outputPath, '.env.example');
      await fs.writeFile(envPath, envContent);
      result.files.push(envPath);
    }

    // Create development scripts
    const scriptsPath = path.join(outputPath, 'scripts');
    await fs.mkdir(scriptsPath, { recursive: true });

    // Create development setup script
    const setupScript = this.generateSetupScript(template);
    const setupScriptPath = path.join(scriptsPath, 'setup.sh');
    await fs.writeFile(setupScriptPath, setupScript);
    await fs.chmod(setupScriptPath, 0o755);
    result.files.push(setupScriptPath);
  }

  private generateSetupScript(template: FrameworkStackTemplate): string {
    const commands = [
      '#!/bin/bash',
      '# Development environment setup script',
      '# Generated by Claude Flow 2.0 Advanced Framework Scaffolding',
      '',
      'set -e',
      '',
      'echo "🚀 Setting up development environment..."',
      ''
    ];

    // Add environment setup
    if (Object.keys(template.configuration.environmentVariables).length > 0) {
      commands.push(
        'if [ ! -f .env ]; then',
        '  cp .env.example .env',
        '  echo "📝 Created .env file from .env.example"',
        '  echo "⚠️  Please update .env with your actual values"',
        'fi',
        ''
      );
    }

    // Add dependency installation
    commands.push(...template.development.setup.map(cmd => `echo "📦 Running: ${cmd}" && ${cmd}`));

    // Add database setup if needed
    if (template.configuration.databases.length > 0) {
      commands.push(
        '',
        'echo "🗄️  Setting up database..."',
        '# Add your database setup commands here',
        ''
      );
    }

    commands.push(
      'echo "✅ Development environment setup complete!"',
      'echo "📚 Next steps:"',
      `echo "  1. Update .env with your configuration"`,
      `echo "  2. Run: ${template.development.start.join(' && ')}"`,
      ''
    );

    return commands.join('\n');
  }

  public async createProjectWithAgents(
    template: FrameworkStackTemplate,
    context: TemplateContext,
    outputPath: string
  ): Promise<ScaffoldingResult> {
    // Identify which agents to use based on template
    const requiredAgents = this.identifyRequiredAgents(template);
    
    // Create agent tasks
    const agentTasks = this.createAgentTasks(template, context, requiredAgents);
    
    // Execute scaffolding with agent coordination
    return await this.executeWithAgentCoordination(template, context, outputPath, agentTasks);
  }

  private identifyRequiredAgents(template: FrameworkStackTemplate): string[] {
    const agents: string[] = [];

    // Frontend agent for UI frameworks
    if (template.technologies.some(tech => 
      ['React', 'Vue.js', 'Angular', 'Svelte', 'shadcn/ui', 'Tailwind CSS'].includes(tech)
    )) {
      agents.push('frontend-specialist');
    }

    // API builder for backend frameworks
    if (template.technologies.some(tech => 
      ['Axum', 'Express.js', 'FastAPI', 'Spring Boot', 'ASP.NET Core'].includes(tech)
    )) {
      agents.push('api-builder');
    }

    // Database architect for database technologies
    if (template.technologies.some(tech => 
      ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLx'].includes(tech)
    )) {
      agents.push('database-architect');
    }

    return agents;
  }

  private createAgentTasks(
    template: FrameworkStackTemplate,
    context: TemplateContext,
    requiredAgents: string[]
  ): AgentTask[] {
    const tasks: AgentTask[] = [];

    if (requiredAgents.includes('frontend-specialist')) {
      tasks.push({
        agent: 'frontend-specialist',
        task: 'component-development',
        context: {
          framework: template.technologies.find(t => ['React', 'Vue.js', 'Angular', 'Svelte'].includes(t)),
          styling: template.technologies.find(t => ['Tailwind CSS', 'shadcn/ui'].includes(t)),
          responsive: true,
          accessibility: 'wcag-2.1'
        },
        priority: 1
      });
    }

    if (requiredAgents.includes('api-builder')) {
      tasks.push({
        agent: 'api-builder',
        task: 'api-development',
        context: {
          framework: template.technologies.find(t => ['Axum', 'Express.js', 'FastAPI'].includes(t)),
          authentication: template.configuration.authentication,
          endpoints: template.configuration.apis[0]?.endpoints || [],
          documentation: true
        },
        priority: 2
      });
    }

    if (requiredAgents.includes('database-architect')) {
      tasks.push({
        agent: 'database-architect',
        task: 'schema-design',
        context: {
          database: template.configuration.databases[0]?.type || 'postgresql',
          migrations: true,
          optimization: true,
          relationships: 'normalized'
        },
        priority: 3
      });
    }

    return tasks;
  }

  private async executeWithAgentCoordination(
    template: FrameworkStackTemplate,
    context: TemplateContext,
    outputPath: string,
    agentTasks: AgentTask[]
  ): Promise<ScaffoldingResult> {
    // For now, fall back to regular scaffolding
    // In a full implementation, this would coordinate with actual agents
    return await this.scaffoldProject(template, context, outputPath);
  }

  public async enhanceExistingProject(
    projectPath: string,
    enhancements: string[]
  ): Promise<ScaffoldingResult> {
    const result: ScaffoldingResult = {
      success: false,
      message: '',
      files: [],
      directories: [],
      commands: [],
      errors: [],
      metrics: {
        filesCreated: 0,
        directoriesCreated: 0,
        timeElapsed: 0,
        totalSize: 0
      }
    };

    try {
      for (const enhancement of enhancements) {
        await this.applyEnhancement(projectPath, enhancement, result);
      }

      result.success = true;
      result.message = `Successfully applied enhancements: ${enhancements.join(', ')}`;
    } catch (error) {
      result.success = false;
      result.message = `Failed to apply enhancements: ${error.message}`;
      result.errors.push(error.message);
    }

    return result;
  }

  private async applyEnhancement(
    projectPath: string,
    enhancement: string,
    result: ScaffoldingResult
  ): Promise<void> {
    switch (enhancement) {
      case 'shadcn':
        await this.addShadcnUi(projectPath, result);
        break;
      case 'tailwind':
        await this.addTailwindCss(projectPath, result);
        break;
      case 'supabase':
        await this.addSupabaseIntegration(projectPath, result);
        break;
      case 'postgres':
        await this.addPostgreSqlSetup(projectPath, result);
        break;
      case 'typescript':
        await this.addTypeScriptConfiguration(projectPath, result);
        break;
      case 'testing':
        await this.addTestingFramework(projectPath, result);
        break;
      case 'cicd':
        await this.addCiCdPipeline(projectPath, result);
        break;
      default:
        throw new Error(`Unknown enhancement: ${enhancement}`);
    }
  }

  private async addShadcnUi(projectPath: string, result: ScaffoldingResult): Promise<void> {
    // Add shadcn/ui to existing React project
    const commands = [
      'npx shadcn-ui@latest init',
      'npx shadcn-ui@latest add button',
      'npx shadcn-ui@latest add card',
      'npx shadcn-ui@latest add input'
    ];

    for (const command of commands) {
      result.commands.push(command);
      await execAsync(command, { cwd: projectPath });
    }
  }

  private async addTailwindCss(projectPath: string, result: ScaffoldingResult): Promise<void> {
    // Add Tailwind CSS to existing project
    const commands = [
      'npm install -D tailwindcss postcss autoprefixer',
      'npx tailwindcss init -p'
    ];

    for (const command of commands) {
      result.commands.push(command);
      await execAsync(command, { cwd: projectPath });
    }

    // Create Tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

    const configPath = path.join(projectPath, 'tailwind.config.js');
    await fs.writeFile(configPath, tailwindConfig);
    result.files.push(configPath);
  }

  private async addSupabaseIntegration(projectPath: string, result: ScaffoldingResult): Promise<void> {
    // Add Supabase integration
    const command = 'npm install @supabase/supabase-js';
    result.commands.push(command);
    await execAsync(command, { cwd: projectPath });

    // Create Supabase client
    const supabaseClient = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`;

    const clientPath = path.join(projectPath, 'src/lib/supabase.ts');
    await fs.mkdir(path.dirname(clientPath), { recursive: true });
    await fs.writeFile(clientPath, supabaseClient);
    result.files.push(clientPath);
  }

  private async addPostgreSqlSetup(projectPath: string, result: ScaffoldingResult): Promise<void> {
    // Add PostgreSQL setup files
    const dockerCompose = `version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`;

    const composePath = path.join(projectPath, 'docker-compose.yml');
    await fs.writeFile(composePath, dockerCompose);
    result.files.push(composePath);
  }

  private async addTypeScriptConfiguration(projectPath: string, result: ScaffoldingResult): Promise<void> {
    // Add TypeScript configuration
    const command = 'npm install -D typescript @types/node';
    result.commands.push(command);
    await execAsync(command, { cwd: projectPath });

    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }]
    };

    const configPath = path.join(projectPath, 'tsconfig.json');
    await fs.writeFile(configPath, JSON.stringify(tsConfig, null, 2));
    result.files.push(configPath);
  }

  private async addTestingFramework(projectPath: string, result: ScaffoldingResult): Promise<void> {
    // Add testing framework
    const command = 'npm install -D vitest @testing-library/react @testing-library/jest-dom';
    result.commands.push(command);
    await execAsync(command, { cwd: projectPath });
  }

  private async addCiCdPipeline(projectPath: string, result: ScaffoldingResult): Promise<void> {
    // Add GitHub Actions workflow
    const workflow = `name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm run test
    - run: npm run build`;

    const workflowPath = path.join(projectPath, '.github/workflows/ci.yml');
    await fs.mkdir(path.dirname(workflowPath), { recursive: true });
    await fs.writeFile(workflowPath, workflow);
    result.files.push(workflowPath);
  }
}

export const frameworkTemplateEngine = new FrameworkTemplateEngine();