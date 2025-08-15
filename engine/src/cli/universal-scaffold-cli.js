#!/usr/bin/env node

/**
 * Universal Scaffolding CLI for Claude Flow 2.0
 * Command-line interface for creating projects in any technology
 */

const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs').promises;
const UniversalScaffolder = require('../modules/universal-scaffolder');
const TemplateManager = require('../modules/template-manager');
const packageJson = require('../../../package.json');

class UniversalScaffoldCLI {
    constructor() {
        this.program = new Command();
        this.scaffolder = new UniversalScaffolder();
        this.templateManager = new TemplateManager();
        this.setupCommands();
        this.setupEventHandlers();
    }

    setupCommands() {
        this.program
            .name('claude-flow')
            .description('Universal project scaffolding for any technology')
            .version(packageJson.version);

        // Create new project
        this.program
            .command('create [project-name]')
            .description('Create a new project in any technology')
            .option('-t, --template <template>', 'Use specific template')
            .option('-l, --language <language>', 'Programming language')
            .option('-f, --framework <framework>', 'Framework to use')
            .option('--detect', 'Auto-detect project type')
            .option('--list-templates', 'List all available templates')
            .option('--typescript', 'Use TypeScript (where applicable)')
            .option('--no-git', 'Skip git initialization')
            .option('--no-install', 'Skip dependency installation')
            .option('--force', 'Overwrite existing directory')
            .option('--author <author>', 'Author name')
            .option('--email <email>', 'Author email')
            .option('--license <license>', 'License (default: MIT)')
            .option('--description <description>', 'Project description')
            .action(async (projectName, options) => {
                await this.handleCreate(projectName, options);
            });

        // Initialize in existing project
        this.program
            .command('init')
            .description('Add Claude Flow to existing project')
            .option('--enhance', 'Enhance with Claude Flow features')
            .option('--detect', 'Auto-detect project type')
            .option('--force', 'Force initialization')
            .action(async (options) => {
                await this.handleInit(options);
            });

        // List templates
        this.program
            .command('templates')
            .description('List all available templates')
            .option('--language <language>', 'Filter by language')
            .option('--framework <framework>', 'Filter by framework')
            .option('--json', 'Output as JSON')
            .action(async (options) => {
                await this.handleListTemplates(options);
            });

        // Add custom template
        this.program
            .command('template:add <path>')
            .description('Add custom template from directory or URL')
            .option('--name <name>', 'Template name')
            .option('--id <id>', 'Template ID')
            .action(async (path, options) => {
                await this.handleAddTemplate(path, options);
            });

        // Technology-specific shortcuts
        this.addTechnologyShortcuts();
    }

    addTechnologyShortcuts() {
        // JavaScript/TypeScript shortcuts
        this.program
            .command('react [project-name]')
            .description('Create React application')
            .option('--typescript', 'Use TypeScript')
            .option('--next', 'Use Next.js')
            .option('--vite', 'Use Vite')
            .action(async (projectName, options) => {
                const template = options.next ? 'nextjs-app' : 
                               options.typescript ? 'react-typescript' : 
                               'react-javascript';
                await this.handleCreate(projectName, { template });
            });

        this.program
            .command('vue [project-name]')
            .description('Create Vue application')
            .option('--vue3', 'Use Vue 3 (default)')
            .option('--nuxt', 'Use Nuxt.js')
            .action(async (projectName, options) => {
                const template = options.nuxt ? 'nuxt-app' : 'vue3-composition';
                await this.handleCreate(projectName, { template });
            });

        this.program
            .command('angular [project-name]')
            .description('Create Angular application')
            .option('--standalone', 'Use standalone components')
            .action(async (projectName, options) => {
                await this.handleCreate(projectName, { template: 'angular-standalone' });
            });

        // Python shortcuts
        this.program
            .command('django [project-name]')
            .description('Create Django project')
            .option('--api', 'REST API project')
            .action(async (projectName, options) => {
                const template = options.api ? 'django-rest' : 'django-app';
                await this.handleCreate(projectName, { template });
            });

        this.program
            .command('flask [project-name]')
            .description('Create Flask application')
            .action(async (projectName) => {
                await this.handleCreate(projectName, { template: 'flask-api' });
            });

        this.program
            .command('fastapi [project-name]')
            .description('Create FastAPI application')
            .action(async (projectName) => {
                await this.handleCreate(projectName, { template: 'fastapi' });
            });

        // Rust shortcuts
        this.program
            .command('rust [project-name]')
            .description('Create Rust project')
            .option('--cli', 'CLI application')
            .option('--web', 'Web server')
            .option('--wasm', 'WebAssembly project')
            .action(async (projectName, options) => {
                const template = options.web ? 'rust-web-actix' :
                               options.wasm ? 'rust-wasm' :
                               'rust-cli';
                await this.handleCreate(projectName, { template });
            });

        // Go shortcuts
        this.program
            .command('go [project-name]')
            .description('Create Go project')
            .option('--gin', 'Gin web framework')
            .option('--fiber', 'Fiber web framework')
            .option('--cli', 'CLI application')
            .action(async (projectName, options) => {
                const template = options.gin ? 'go-gin-api' :
                               options.fiber ? 'go-fiber' :
                               'go-cli';
                await this.handleCreate(projectName, { template });
            });

        // Mobile shortcuts
        this.program
            .command('mobile [project-name]')
            .description('Create mobile application')
            .option('--react-native', 'React Native')
            .option('--flutter', 'Flutter')
            .option('--ionic', 'Ionic')
            .option('--expo', 'Use Expo with React Native')
            .action(async (projectName, options) => {
                const template = options.flutter ? 'flutter-app' :
                               options.ionic ? 'ionic-angular' :
                               options.expo ? 'react-native-expo' :
                               'react-native';
                await this.handleCreate(projectName, { template });
            });

        // Desktop shortcuts
        this.program
            .command('desktop [project-name]')
            .description('Create desktop application')
            .option('--electron', 'Electron')
            .option('--tauri', 'Tauri')
            .action(async (projectName, options) => {
                const template = options.tauri ? 'tauri-app' : 'electron-react';
                await this.handleCreate(projectName, { template });
            });
    }

    setupEventHandlers() {
        // Scaffolder events
        this.scaffolder.on('start', ({ action, projectName }) => {
            console.log(chalk.blue(`Starting ${action} for ${projectName || 'project'}...`));
        });

        this.scaffolder.on('complete', (result) => {
            console.log(chalk.green('✓ Scaffolding complete!'));
            if (result.projectPath) {
                console.log(chalk.cyan(`\nProject created at: ${result.projectPath}`));
                console.log(chalk.cyan(`Files generated: ${result.filesGenerated.length}`));
                
                if (result.nextSteps) {
                    console.log(chalk.yellow('\nNext steps:'));
                    result.nextSteps.forEach((step, i) => {
                        console.log(chalk.yellow(`  ${i + 1}. ${step}`));
                    });
                }
            }
        });

        this.scaffolder.on('error', (error) => {
            console.error(chalk.red(`Error: ${error.message}`));
            process.exit(1);
        });
    }

    async handleCreate(projectName, options) {
        const spinner = ora();
        
        try {
            // If no project name provided, prompt for it
            if (!projectName) {
                const { name } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Project name:',
                        validate: (input) => input.length > 0
                    }
                ]);
                projectName = name;
            }

            // List templates if requested
            if (options.listTemplates) {
                await this.handleListTemplates({});
                return;
            }

            // Interactive mode if no template specified
            if (!options.template && !options.detect) {
                const answers = await this.promptForProjectDetails();
                Object.assign(options, answers);
            }

            spinner.start('Creating project...');
            
            // Create project
            const result = await this.scaffolder.create(projectName, options);
            
            spinner.succeed('Project created successfully!');
            
            // Display success message and next steps
            this.displaySuccessMessage(result, projectName);
            
        } catch (error) {
            spinner.fail(`Failed to create project: ${error.message}`);
            process.exit(1);
        }
    }

    async handleInit(options) {
        const spinner = ora();
        
        try {
            spinner.start('Analyzing existing project...');
            
            // Enhance existing project
            const result = await this.scaffolder.enhance('.', options);
            
            spinner.succeed('Project enhanced successfully!');
            
            console.log(chalk.green('\n✓ Claude Flow has been added to your project'));
            
            if (result.filesGenerated) {
                console.log(chalk.cyan(`Files added: ${result.filesGenerated.length}`));
            }
            
        } catch (error) {
            spinner.fail(`Failed to initialize: ${error.message}`);
            process.exit(1);
        }
    }

    async handleListTemplates(options) {
        try {
            const templates = await this.templateManager.getAvailableTemplates();
            
            // Filter templates
            let filtered = templates;
            if (options.language) {
                filtered = filtered.filter(t => t.language === options.language);
            }
            if (options.framework) {
                filtered = filtered.filter(t => t.framework === options.framework);
            }
            
            // Output format
            if (options.json) {
                console.log(JSON.stringify(filtered, null, 2));
            } else {
                console.log(chalk.cyan('\nAvailable Templates:\n'));
                
                // Group by language
                const grouped = {};
                filtered.forEach(template => {
                    if (!grouped[template.language]) {
                        grouped[template.language] = [];
                    }
                    grouped[template.language].push(template);
                });
                
                // Display grouped
                Object.entries(grouped).forEach(([language, templates]) => {
                    console.log(chalk.yellow(`\n${language.toUpperCase()}:`));
                    templates.forEach(template => {
                        const framework = template.framework ? 
                            chalk.gray(` (${template.framework})`) : '';
                        console.log(`  ${chalk.green(template.id)}${framework} - ${template.description}`);
                    });
                });
                
                console.log(chalk.gray(`\nTotal: ${filtered.length} templates`));
            }
            
        } catch (error) {
            console.error(chalk.red(`Error listing templates: ${error.message}`));
            process.exit(1);
        }
    }

    async handleAddTemplate(templatePath, options) {
        const spinner = ora();
        
        try {
            spinner.start('Adding custom template...');
            
            // Load and register template
            const templateId = await this.templateManager.importTemplate(templatePath);
            
            spinner.succeed(`Template added: ${templateId}`);
            
        } catch (error) {
            spinner.fail(`Failed to add template: ${error.message}`);
            process.exit(1);
        }
    }

    async promptForProjectDetails() {
        const languages = [
            'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 
            'Java', 'Kotlin', 'C#', 'Ruby', 'PHP', 'Swift',
            'Dart', 'Other'
        ];
        
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'language',
                message: 'Select programming language:',
                choices: languages
            },
            {
                type: 'list',
                name: 'projectType',
                message: 'Select project type:',
                choices: [
                    'Web Application',
                    'REST API',
                    'CLI Tool',
                    'Mobile App',
                    'Desktop App',
                    'Library/Package',
                    'Machine Learning',
                    'Game',
                    'Blockchain/Web3',
                    'Other'
                ]
            },
            {
                type: 'confirm',
                name: 'typescript',
                message: 'Use TypeScript?',
                when: (answers) => answers.language === 'JavaScript',
                default: true
            },
            {
                type: 'input',
                name: 'description',
                message: 'Project description:',
                default: 'A new project'
            },
            {
                type: 'input',
                name: 'author',
                message: 'Author name:',
                default: 'Your Name'
            },
            {
                type: 'list',
                name: 'license',
                message: 'License:',
                choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'None'],
                default: 'MIT'
            },
            {
                type: 'confirm',
                name: 'git',
                message: 'Initialize git repository?',
                default: true
            },
            {
                type: 'confirm',
                name: 'install',
                message: 'Install dependencies?',
                default: true
            }
        ]);
        
        // Map answers to template
        const templateMap = {
            'JavaScript:Web Application': 'javascript-vanilla',
            'JavaScript:REST API': 'express-api',
            'TypeScript:Web Application': 'typescript-node',
            'TypeScript:REST API': 'nestjs-api',
            'Python:Web Application': 'django-app',
            'Python:REST API': 'fastapi',
            'Python:CLI Tool': 'python-cli',
            'Python:Machine Learning': 'python-ml',
            'Rust:CLI Tool': 'rust-cli',
            'Rust:REST API': 'rust-web-actix',
            'Go:CLI Tool': 'go-cli',
            'Go:REST API': 'go-gin-api'
        };
        
        const key = `${answers.typescript ? 'TypeScript' : answers.language}:${answers.projectType}`;
        answers.template = templateMap[key] || 'generic';
        
        return answers;
    }

    displaySuccessMessage(result, projectName) {
        console.log(chalk.green('\n✨ Project created successfully!\n'));
        
        console.log(chalk.cyan('Project Details:'));
        console.log(`  Name: ${chalk.white(projectName)}`);
        console.log(`  Path: ${chalk.white(result.projectPath)}`);
        console.log(`  Files: ${chalk.white(result.filesGenerated.length)}`);
        
        if (result.metrics) {
            console.log(`  Time: ${chalk.white(result.metrics.duration + 'ms')}`);
            console.log(`  Size: ${chalk.white(this.formatBytes(result.metrics.bytesWritten))}`);
        }
        
        console.log(chalk.yellow('\n📦 Next Steps:\n'));
        console.log(`  ${chalk.gray('$')} cd ${projectName}`);
        
        if (result.dependencies && !result.dependencies.installed) {
            console.log(`  ${chalk.gray('$')} npm install`);
        }
        
        console.log(`  ${chalk.gray('$')} npm start\n`);
        
        console.log(chalk.blue('🚀 Happy coding with Claude Flow!\n'));
    }

    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    async run() {
        this.program.parse(process.argv);
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new UniversalScaffoldCLI();
    cli.run().catch(error => {
        console.error(chalk.red(`Fatal error: ${error.message}`));
        process.exit(1);
    });
}

module.exports = UniversalScaffoldCLI;