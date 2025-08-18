#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { 
  scaffoldProject, 
  createInteractiveProject, 
  enhanceExistingProject, 
  listTemplates, 
  getTemplateInfo,
  PROJECT_TEMPLATES,
  ScaffoldOptions 
} from '../modules/advanced-scaffolder.js';

const program = new Command();

program
  .name('claude-flow-scaffold')
  .description('Claude Flow 2.0 Project Scaffolding System')
  .version('2.0.0');

// Create new project command
program
  .command('create <project-name>')
  .description('Create a new project with scaffolding')
  .option('-t, --template <template>', 'Project template to use')
  .option('-i, --interactive', 'Use interactive mode', false)
  .option('--install-deps', 'Install dependencies automatically', false)
  .option('--init-git', 'Initialize git repository', false)
  .option('--generate-docs', 'Generate documentation', true)
  .option('--skip-existing', 'Skip existing files', false)
  .action(async (projectName: string, options: any) => {
    try {
      console.log(`🚀 Creating new project: ${projectName}\n`);
      
      const scaffoldOptions: ScaffoldOptions = {
        projectName,
        template: options.template,
        interactive: options.interactive,
        enhance: false,
        installDeps: options.installDeps,
        initGit: options.initGit,
        generateDocs: options.generateDocs,
        skipExisting: options.skipExisting
      };

      // Create project directory
      const projectPath = path.join(process.cwd(), projectName);
      if (fs.existsSync(projectPath)) {
        console.error(`❌ Directory '${projectName}' already exists!`);
        process.exit(1);
      }

      fs.mkdirSync(projectPath, { recursive: true });
      process.chdir(projectPath);

      // Run scaffolding
      const result = await scaffoldProject(scaffoldOptions);

      if (result.success) {
        console.log(`\n✅ ${result.message}`);
        console.log(`\n📁 Files created:`);
        result.files.forEach(file => console.log(`  - ${file}`));
        
        console.log(`\n🎉 Project '${projectName}' created successfully!`);
        console.log(`\nNext steps:`);
        console.log(`  cd ${projectName}`);
        console.log(`  ${getStartCommand(options.template)}`);
      } else {
        console.error(`\n❌ ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      process.exit(1);
    }
  });

// Initialize/enhance existing project command
program
  .command('init')
  .description('Initialize Claude Flow 2.0 in existing project')
  .option('--enhance', 'Enhance existing project with Claude Flow capabilities', false)
  .option('--webui', 'Include web UI components', false)
  .option('--install-deps', 'Install new dependencies', false)
  .option('--generate-docs', 'Generate documentation', true)
  .action(async (options: any) => {
    try {
      console.log('🔧 Initializing Claude Flow 2.0 in existing project...\n');

      const scaffoldOptions: ScaffoldOptions = {
        projectName: path.basename(process.cwd()),
        enhance: options.enhance,
        skipExisting: true,
        installDeps: options.installDeps,
        generateDocs: options.generateDocs
      };

      const result = await scaffoldProject(scaffoldOptions);

      if (result.success) {
        console.log(`\n✅ ${result.message}`);
        console.log(`\n📁 Files created/updated:`);
        result.files.forEach(file => console.log(`  - ${file}`));
        
        console.log('\n🎉 Claude Flow 2.0 initialized successfully!');
        console.log('\nNext steps:');
        console.log('  npx claude-flow@2.0.0 --help');
      } else {
        console.error(`\n❌ ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to initialize project:', error);
      process.exit(1);
    }
  });

// List templates command
program
  .command('templates')
  .description('List available project templates')
  .action(() => {
    listTemplates();
  });

// Template info command
program
  .command('template <name>')
  .description('Show detailed information about a template')
  .action((name: string) => {
    const template = getTemplateInfo(name);
    if (!template) {
      console.error(`❌ Template '${name}' not found.`);
      console.log('\nAvailable templates:');
      listTemplates();
      process.exit(1);
    }

    console.log(`\n📋 Template: ${template.name}\n`);
    console.log(`Type: ${template.type}`);
    console.log(`Framework: ${template.framework || 'N/A'}`);
    console.log(`Language: ${template.language}`);
    
    console.log(`\nDependencies (${template.dependencies.length}):`);
    template.dependencies.forEach(dep => console.log(`  - ${dep}`));
    
    console.log(`\nDev Dependencies (${template.devDependencies.length}):`);
    template.devDependencies.forEach(dep => console.log(`  - ${dep}`));
    
    console.log(`\nScripts:`);
    Object.entries(template.scripts).forEach(([name, script]) => {
      console.log(`  ${name}: ${script}`);
    });

    console.log(`\nAgents (${template.agents.length}):`);
    template.agents.forEach(agent => console.log(`  - ${agent}`));

    console.log(`\nMCP Servers (${template.mcpServers.length}):`);
    template.mcpServers.forEach(server => console.log(`  - ${server}`));

    console.log(`\nBest Practices:`);
    Object.entries(template.bestPractices).forEach(([practice, enabled]) => {
      console.log(`  ${practice}: ${enabled ? '✅' : '❌'}`);
    });

    console.log(`\nUsage:`);
    console.log(`  npx claude-flow@2.0.0 create my-project --template ${name}`);
  });

// Interactive command
program
  .command('interactive')
  .description('Start interactive project creation wizard')
  .action(async () => {
    try {
      console.log('🧙‍♂️ Starting interactive project creation wizard...\n');
      await createInteractiveProject();
    } catch (error) {
      console.error('❌ Interactive creation failed:', error);
      process.exit(1);
    }
  });

// Enhance command
program
  .command('enhance')
  .description('Enhance existing project with Claude Flow capabilities')
  .option('--install-deps', 'Install new dependencies', false)
  .option('--generate-docs', 'Generate documentation', true)
  .action(async (options: any) => {
    try {
      console.log('🚀 Enhancing existing project with Claude Flow capabilities...\n');
      
      const plan = enhanceExistingProject(process.cwd(), {
        installDeps: options.installDeps,
        generateDocs: options.generateDocs
      });

      console.log(`\n📋 Enhancement Plan:`);
      console.log(`Files to create: ${plan.files.length}`);
      console.log(`Conflicts detected: ${plan.conflicts.length}`);
      
      if (plan.conflicts.length > 0) {
        console.log(`\n⚠️  Conflicts (files will be skipped):`);
        plan.conflicts.forEach(conflict => console.log(`  - ${conflict}`));
      }

      console.log(`\n✅ Enhancement completed successfully!`);
    } catch (error) {
      console.error('❌ Enhancement failed:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate current project structure and configuration')
  .action(() => {
    try {
      console.log('🔍 Validating project structure...\n');
      
      const currentDir = process.cwd();
      const issues = [];

      // Check for package.json or equivalent
      const hasPackageJson = fs.existsSync(path.join(currentDir, 'package.json'));
      const hasCargoToml = fs.existsSync(path.join(currentDir, 'Cargo.toml'));
      const hasPubspec = fs.existsSync(path.join(currentDir, 'pubspec.yaml'));
      const hasRequirements = fs.existsSync(path.join(currentDir, 'requirements.txt'));

      if (!hasPackageJson && !hasCargoToml && !hasPubspec && !hasRequirements) {
        issues.push('No project manifest found (package.json, Cargo.toml, pubspec.yaml, or requirements.txt)');
      }

      // Check for Claude configuration
      const hasClaudeConfig = fs.existsSync(path.join(currentDir, 'CLAUDE.md'));
      if (!hasClaudeConfig) {
        issues.push('Missing CLAUDE.md configuration file');
      }

      // Check for agents directory
      const hasAgents = fs.existsSync(path.join(currentDir, '.claude/agents'));
      if (!hasAgents) {
        issues.push('Missing .claude/agents directory');
      }

      // Check for MCP configuration
      const hasMcpConfig = fs.existsSync(path.join(currentDir, '.claude/mcp.json'));
      if (!hasMcpConfig) {
        issues.push('Missing .claude/mcp.json configuration');
      }

      if (issues.length === 0) {
        console.log('✅ Project structure is valid!');
        console.log('\nFound configuration files:');
        if (hasPackageJson) console.log('  - package.json');
        if (hasCargoToml) console.log('  - Cargo.toml');
        if (hasPubspec) console.log('  - pubspec.yaml');
        if (hasRequirements) console.log('  - requirements.txt');
        if (hasClaudeConfig) console.log('  - CLAUDE.md');
        if (hasAgents) console.log('  - .claude/agents/');
        if (hasMcpConfig) console.log('  - .claude/mcp.json');
      } else {
        console.log('⚠️  Issues found:');
        issues.forEach(issue => console.log(`  - ${issue}`));
        console.log('\nTo fix these issues, run:');
        console.log('  npx claude-flow@2.0.0 init --enhance');
      }
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

// Demo command
program
  .command('demo')
  .description('Create a demo project to showcase capabilities')
  .option('--type <type>', 'Demo type (frontend|backend|fullstack|mobile)', 'frontend')
  .action(async (options: any) => {
    try {
      const demoTypes = {
        frontend: 'react-typescript',
        backend: 'node-express',
        fullstack: 'next-fullstack',
        mobile: 'react-native'
      };

      const template = demoTypes[options.type as keyof typeof demoTypes] || 'react-typescript';
      const projectName = `claude-flow-demo-${options.type}`;

      console.log(`🎪 Creating ${options.type} demo project...\n`);

      const scaffoldOptions: ScaffoldOptions = {
        projectName,
        template,
        interactive: false,
        enhance: false,
        installDeps: true,
        initGit: true,
        generateDocs: true
      };

      // Create demo directory
      const demoPath = path.join(process.cwd(), projectName);
      if (fs.existsSync(demoPath)) {
        console.error(`❌ Demo directory '${projectName}' already exists!`);
        process.exit(1);
      }

      fs.mkdirSync(demoPath, { recursive: true });
      process.chdir(demoPath);

      const result = await scaffoldProject(scaffoldOptions);

      if (result.success) {
        console.log(`\n✅ Demo project created successfully!`);
        console.log(`\n📁 Location: ${demoPath}`);
        console.log(`\nNext steps:`);
        console.log(`  cd ${projectName}`);
        console.log(`  ${getStartCommand(template)}`);
      } else {
        console.error(`\n❌ ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Demo creation failed:', error);
      process.exit(1);
    }
  });

function getStartCommand(template?: string): string {
  if (!template) return 'npm run dev';
  
  const templateObj = PROJECT_TEMPLATES[template];
  if (!templateObj) return 'npm run dev';
  
  if (templateObj.language === 'Python') {
    return templateObj.scripts.dev || 'python manage.py runserver';
  } else if (templateObj.language === 'Rust') {
    return templateObj.scripts.dev || 'cargo run';
  } else if (templateObj.language === 'Dart') {
    return templateObj.scripts.run || 'flutter run';
  } else {
    return templateObj.scripts.dev || 'npm run dev';
  }
}

// Parse command line arguments
program.parse();

export default program;