#!/usr/bin/env node

/**
 * Advanced Framework Scaffolding CLI for Claude Flow 2.0
 * Interactive command-line interface for creating modern tech stacks
 * Supports React/shadcn/Tailwind, Rust/Supabase/PostgreSQL, and full-stack combinations
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import figlet from 'figlet';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { advancedFrameworkScaffolder, FrameworkStackTemplate } from '../modules/advanced-framework-scaffolder.js';

interface ProjectContext {
  projectName: string;
  description: string;
  author: string;
  license: string;
  template: string;
  outputPath: string;
  packageManager: string;
  features: string[];
  database?: string;
  authentication?: string;
  deployment?: string;
}

class AdvancedScaffoldCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands() {
    this.program
      .name('claude-flow-scaffold')
      .description('Advanced Framework Scaffolding for Modern Tech Stacks')
      .version('2.0.0');

    // Main create command
    this.program
      .command('create <project-name>')
      .description('Create a new project with advanced framework scaffolding')
      .option('-t, --template <template>', 'Project template')
      .option('-d, --description <description>', 'Project description')
      .option('-a, --author <author>', 'Project author')
      .option('-l, --license <license>', 'Project license', 'MIT')
      .option('-p, --package-manager <pm>', 'Package manager (npm, yarn, pnpm)', 'npm')
      .option('--interactive', 'Interactive mode with prompts')
      .option('--skip-install', 'Skip dependency installation')
      .option('--skip-git', 'Skip git repository initialization')
      .action(async (projectName, options) => {
        await this.createProject(projectName, options);
      });

    // List templates command
    this.program
      .command('list')
      .alias('ls')
      .description('List available project templates')
      .option('-c, --category <category>', 'Filter by category (frontend, backend, fullstack)')
      .action(async (options) => {
        await this.listTemplates(options);
      });

    // Template info command
    this.program
      .command('info <template-id>')
      .description('Show detailed information about a template')
      .action(async (templateId) => {
        await this.showTemplateInfo(templateId);
      });

    // Initialize existing project
    this.program
      .command('init')
      .description('Initialize scaffolding in existing project')
      .option('--enhance', 'Add enhancements to existing project')
      .option('--add <features>', 'Add specific features (comma-separated)')
      .action(async (options) => {
        await this.initializeProject(options);
      });

    // Update command
    this.program
      .command('update')
      .description('Update project dependencies and configurations')
      .option('--template <template>', 'Update to match template')
      .action(async (options) => {
        await this.updateProject(options);
      });
  }

  private async createProject(projectName: string, options: any) {
    try {
      console.log(chalk.cyan(figlet.textSync('Claude Flow', { font: 'Small' })));
      console.log(chalk.yellow('🚀 Advanced Framework Scaffolding\n'));

      let context: ProjectContext;

      if (options.interactive || !options.template) {
        context = await this.interactiveProjectSetup(projectName, options);
      } else {
        context = this.createContextFromOptions(projectName, options);
      }

      await this.scaffoldProject(context);

    } catch (error) {
      console.error(chalk.red('❌ Error creating project:'), error);
      process.exit(1);
    }
  }

  private async interactiveProjectSetup(projectName: string, options: any): Promise<ProjectContext> {
    console.log(chalk.blue(`Creating project: ${chalk.bold(projectName)}\n`));

    const templates = advancedFrameworkScaffolder.getAllTemplates();
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'What type of project would you like to create?',
        choices: [
          {
            name: `${chalk.green('Frontend')} - React + shadcn/ui + Tailwind CSS`,
            value: 'react-shadcn-tailwind',
            short: 'React Frontend'
          },
          {
            name: `${chalk.blue('Backend')} - Rust + Supabase + PostgreSQL`,
            value: 'rust-supabase-postgres',
            short: 'Rust Backend'
          },
          {
            name: `${chalk.magenta('Full-Stack')} - React + Rust + PostgreSQL`,
            value: 'fullstack-react-rust',
            short: 'Full-Stack'
          },
          {
            name: `${chalk.yellow('Next.js')} - Next.js + Prisma + Supabase`,
            value: 'nextjs-prisma-supabase',
            short: 'Next.js'
          },
          {
            name: `${chalk.cyan('Vue.js')} - Vue + Nuxt + Tailwind + Supabase`,
            value: 'vue-nuxt-supabase',
            short: 'Vue.js'
          },
          {
            name: `${chalk.red('Svelte')} - SvelteKit + Tailwind + Supabase`,
            value: 'svelte-kit-supabase',
            short: 'SvelteKit'
          },
          {
            name: `${chalk.blue('Mobile')} - Flutter + Supabase`,
            value: 'flutter-supabase',
            short: 'Flutter'
          },
          {
            name: `${chalk.green('Mobile')} - React Native + Expo + Supabase`,
            value: 'react-native-expo',
            short: 'React Native'
          }
        ]
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: (answers: any) => {
          const template = templates.find(t => t.id === answers.template);
          return template?.description || 'A new project';
        }
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: 'Your Name <your.email@example.com>'
      },
      {
        type: 'list',
        name: 'license',
        message: 'License:',
        choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense'],
        default: 'MIT'
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Package manager:',
        choices: ['npm', 'yarn', 'pnpm'],
        default: 'npm',
        when: (answers: any) => {
          const template = templates.find(t => t.id === answers.template);
          return template?.configuration.packageManagers.includes('npm');
        }
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Additional features:',
        choices: (answers: any) => {
          const template = templates.find(t => t.id === answers.template);
          const choices = [];
          
          if (template?.category === 'frontend' || template?.category === 'fullstack') {
            choices.push(
              { name: 'Dark mode support', value: 'dark-mode' },
              { name: 'Internationalization (i18n)', value: 'i18n' },
              { name: 'PWA support', value: 'pwa' },
              { name: 'Analytics integration', value: 'analytics' }
            );
          }
          
          if (template?.category === 'backend' || template?.category === 'fullstack') {
            choices.push(
              { name: 'Redis caching', value: 'redis' },
              { name: 'Email service', value: 'email' },
              { name: 'File upload', value: 'upload' },
              { name: 'Background jobs', value: 'jobs' }
            );
          }
          
          if (template?.category === 'fullstack') {
            choices.push(
              { name: 'Real-time features', value: 'realtime' },
              { name: 'API documentation', value: 'api-docs' }
            );
          }
          
          return choices;
        }
      },
      {
        type: 'list',
        name: 'database',
        message: 'Database preference:',
        choices: ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'],
        default: 'PostgreSQL',
        when: (answers: any) => {
          const template = templates.find(t => t.id === answers.template);
          return template?.configuration.databases.length > 0;
        }
      },
      {
        type: 'list',
        name: 'authentication',
        message: 'Authentication provider:',
        choices: ['Supabase', 'Auth0', 'Firebase', 'Custom JWT'],
        default: 'Supabase',
        when: (answers: any) => {
          const template = templates.find(t => t.id === answers.template);
          return template?.configuration.authentication.provider !== 'custom';
        }
      },
      {
        type: 'list',
        name: 'deployment',
        message: 'Preferred deployment platform:',
        choices: ['Vercel', 'Netlify', 'Railway', 'AWS', 'Google Cloud', 'Azure', 'Docker'],
        default: 'Vercel'
      }
    ]);

    return {
      projectName,
      description: answers.description,
      author: answers.author,
      license: answers.license,
      template: answers.template,
      outputPath: path.resolve(process.cwd(), projectName),
      packageManager: answers.packageManager || 'npm',
      features: answers.features || [],
      database: answers.database,
      authentication: answers.authentication,
      deployment: answers.deployment
    };
  }

  private createContextFromOptions(projectName: string, options: any): ProjectContext {
    return {
      projectName,
      description: options.description || 'A new project',
      author: options.author || 'Your Name <your.email@example.com>',
      license: options.license || 'MIT',
      template: options.template,
      outputPath: path.resolve(process.cwd(), projectName),
      packageManager: options.packageManager || 'npm',
      features: options.features ? options.features.split(',') : []
    };
  }

  private async scaffoldProject(context: ProjectContext) {
    const spinner = ora('Creating project structure...').start();

    try {
      // Check if directory already exists
      if (fs.existsSync(context.outputPath)) {
        spinner.fail(`Directory ${context.projectName} already exists`);
        return;
      }

      // Create output directory
      fs.mkdirSync(context.outputPath, { recursive: true });

      // Get template
      const template = advancedFrameworkScaffolder.getTemplate(context.template);
      if (!template) {
        throw new Error(`Template ${context.template} not found`);
      }

      spinner.text = `Scaffolding ${template.name} project...`;

      // Create template context
      const templateContext = {
        projectName: context.projectName,
        description: context.description,
        version: '0.1.0',
        author: context.author,
        license: context.license,
        template: template,
        technologies: [],
        customVariables: {
          packageManager: context.packageManager,
          features: context.features,
          database: context.database,
          authentication: context.authentication,
          deployment: context.deployment
        }
      };

      // Scaffold the project
      await advancedFrameworkScaffolder.scaffoldProject(
        context.template,
        templateContext,
        context.outputPath
      );

      spinner.succeed('Project structure created');

      // Initialize git repository
      if (this.shouldInitGit()) {
        spinner.start('Initializing git repository...');
        this.initGitRepository(context.outputPath);
        spinner.succeed('Git repository initialized');
      }

      // Show success message
      this.showSuccessMessage(context, template);

    } catch (error) {
      spinner.fail('Failed to create project');
      throw error;
    }
  }

  private shouldInitGit(): boolean {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private initGitRepository(projectPath: string) {
    try {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
      execSync('git commit -m "Initial commit from Claude Flow scaffolding"', { 
        cwd: projectPath, 
        stdio: 'ignore' 
      });
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not initialize git repository'));
    }
  }

  private showSuccessMessage(context: ProjectContext, template: FrameworkStackTemplate) {
    console.log('\n' + chalk.green('🎉 Project created successfully!\n'));
    
    console.log(chalk.bold('Project Details:'));
    console.log(`${chalk.gray('Name:')} ${context.projectName}`);
    console.log(`${chalk.gray('Template:')} ${template.name}`);
    console.log(`${chalk.gray('Location:')} ${context.outputPath}\n`);

    console.log(chalk.bold('Next Steps:'));
    console.log(`${chalk.gray('1.')} cd ${context.projectName}`);
    
    if (template.category === 'fullstack') {
      console.log(`${chalk.gray('2.')} ${context.packageManager} run install`);
      console.log(`${chalk.gray('3.')} ${context.packageManager} run dev`);
    } else if (template.technologies.includes('Rust')) {
      console.log(`${chalk.gray('2.')} cargo build`);
      console.log(`${chalk.gray('3.')} cargo run`);
    } else {
      console.log(`${chalk.gray('2.')} ${context.packageManager} install`);
      console.log(`${chalk.gray('3.')} ${context.packageManager} run dev`);
    }

    if (template.configuration.databases.length > 0) {
      console.log(`${chalk.gray('4.')} Set up your database connection in .env`);
    }

    console.log('\n' + chalk.blue('📚 Documentation:'));
    console.log(`${chalk.gray('•')} Read the README.md file for detailed instructions`);
    console.log(`${chalk.gray('•')} Check the docs/ folder for additional guides`);
    
    if (template.integrations.mcpServers.length > 0) {
      console.log(`${chalk.gray('•')} MCP servers available: ${template.integrations.mcpServers.join(', ')}`);
    }

    console.log('\n' + chalk.cyan('Happy coding! 🚀'));
  }

  private async listTemplates(options: any) {
    const templates = options.category 
      ? advancedFrameworkScaffolder.getTemplatesByCategory(options.category)
      : advancedFrameworkScaffolder.getAllTemplates();

    console.log(chalk.cyan(figlet.textSync('Templates', { font: 'Small' })));
    console.log(chalk.yellow(`Available project templates:\n`));

    const groupedTemplates = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, FrameworkStackTemplate[]>);

    Object.entries(groupedTemplates).forEach(([category, categoryTemplates]) => {
      console.log(chalk.bold(this.capitalize(category)));
      
      categoryTemplates.forEach(template => {
        const complexity = this.getComplexityIndicator(template.complexity);
        const technologies = template.technologies.slice(0, 3).join(', ');
        
        console.log(`  ${chalk.green(template.id.padEnd(25))} ${complexity} ${template.description}`);
        console.log(`  ${chalk.gray(' '.repeat(25))} ${chalk.dim(technologies)}\n`);
      });
    });

    console.log(chalk.blue('\nUsage:'));
    console.log(`  claude-flow-scaffold create my-app --template <template-id>`);
    console.log(`  claude-flow-scaffold create my-app --interactive`);
    console.log(`  claude-flow-scaffold info <template-id>`);
  }

  private async showTemplateInfo(templateId: string) {
    const template = advancedFrameworkScaffolder.getTemplate(templateId);
    
    if (!template) {
      console.error(chalk.red(`❌ Template "${templateId}" not found`));
      process.exit(1);
    }

    console.log(chalk.cyan(`📋 Template: ${template.name}\n`));
    
    console.log(chalk.bold('Description:'));
    console.log(`${template.description}\n`);
    
    console.log(chalk.bold('Category:'));
    console.log(`${this.capitalize(template.category)}\n`);
    
    console.log(chalk.bold('Complexity:'));
    console.log(`${this.getComplexityIndicator(template.complexity)} ${template.complexity}/10\n`);
    
    console.log(chalk.bold('Technologies:'));
    template.technologies.forEach(tech => {
      console.log(`  ${chalk.green('•')} ${tech}`);
    });
    console.log();
    
    console.log(chalk.bold('Requirements:'));
    Object.entries(template.requirements).forEach(([key, value]) => {
      console.log(`  ${chalk.yellow(key)}: ${value}`);
    });
    console.log();
    
    console.log(chalk.bold('Package Managers:'));
    template.configuration.packageManagers.forEach(pm => {
      console.log(`  ${chalk.green('•')} ${pm}`);
    });
    console.log();
    
    if (template.configuration.databases.length > 0) {
      console.log(chalk.bold('Databases:'));
      template.configuration.databases.forEach(db => {
        console.log(`  ${chalk.green('•')} ${db.type} (port ${db.port})`);
      });
      console.log();
    }
    
    console.log(chalk.bold('Development Workflow:'));
    Object.entries(template.development).forEach(([command, script]) => {
      console.log(`  ${chalk.yellow(command)}: ${Array.isArray(script) ? script.join(' && ') : script}`);
    });
    console.log();
    
    console.log(chalk.bold('Deployment Platforms:'));
    template.deployment.platforms.forEach(platform => {
      console.log(`  ${chalk.green('•')} ${platform}`);
    });
    console.log();
    
    console.log(chalk.blue('Usage:'));
    console.log(`  claude-flow-scaffold create my-app --template ${templateId}`);
  }

  private async initializeProject(options: any) {
    console.log(chalk.cyan('🔧 Initializing scaffolding in existing project...\n'));
    
    if (options.enhance) {
      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'enhancements',
          message: 'What would you like to add to your project?',
          choices: [
            { name: 'shadcn/ui components', value: 'shadcn' },
            { name: 'Tailwind CSS', value: 'tailwind' },
            { name: 'Supabase integration', value: 'supabase' },
            { name: 'PostgreSQL setup', value: 'postgres' },
            { name: 'Rust backend', value: 'rust-backend' },
            { name: 'TypeScript configuration', value: 'typescript' },
            { name: 'Testing framework', value: 'testing' },
            { name: 'CI/CD pipeline', value: 'cicd' }
          ]
        }
      ]);
      
      console.log(chalk.green(`Adding enhancements: ${answers.enhancements.join(', ')}`));
      // Implementation for adding enhancements
    }
    
    if (options.add) {
      const features = options.add.split(',');
      console.log(chalk.green(`Adding features: ${features.join(', ')}`));
      // Implementation for adding specific features
    }
  }

  private async updateProject(options: any) {
    console.log(chalk.cyan('🔄 Updating project...\n'));
    
    if (options.template) {
      console.log(chalk.blue(`Updating to match template: ${options.template}`));
      // Implementation for updating to match template
    } else {
      console.log(chalk.blue('Updating dependencies and configurations...'));
      // Implementation for general updates
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getComplexityIndicator(complexity: number): string {
    if (complexity <= 3) return chalk.green('●●○○○');
    if (complexity <= 5) return chalk.yellow('●●●○○');
    if (complexity <= 7) return chalk.orange('●●●●○');
    return chalk.red('●●●●●');
  }

  public run() {
    this.program.parse();
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new AdvancedScaffoldCLI();
  cli.run();
}

export { AdvancedScaffoldCLI };