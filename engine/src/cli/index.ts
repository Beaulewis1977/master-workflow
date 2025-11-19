#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import { migrate } from '../core/db.js';
import buildServer from '../api/server.js';
import { listComponents } from '../modules/components-registry.js';
import { planInstall } from '../modules/installer.js';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { 
  scaffoldProject, 
  createInteractiveProject, 
  enhanceExistingProject, 
  listTemplates, 
  getTemplateInfo,
  ScaffoldOptions 
} from '../modules/advanced-scaffolder.js';
import { 
  createFromTemplate, 
  scaffoldInteractive, 
  AVAILABLE_TEMPLATES,
  type TemplateType 
} from '../modules/scaffolder.js';
import UniversalScaffolder from '../modules/universal-scaffolder.js';
import TemplateManager from '../modules/template-manager.js';
import OptimizedScaffolder from '../modules/optimized-scaffolder.js';
import { advancedFrameworkScaffolder } from '../modules/advanced-framework-scaffolder.js';
import { frameworkTemplateEngine } from '../modules/framework-template-engine.js';
import { AdvancedScaffoldCLI } from './advanced-scaffold-cli.js';

const program = new Command();
program.name('mw-engine').description('Master Workflow Engine CLI').version('0.1.0');

program
  .command('migrate')
  .description('Apply database migrations')
  .action(() => {
    migrate();
    console.log('Migrations applied.');
  });

program
  .command('api')
  .description('Start API server')
  .option('-p, --port <port>', 'Port to listen on', process.env.MW_ENGINE_PORT || '13800')
  .action(async (opts) => {
    process.env.MW_ENGINE_PORT = String(opts.port);
    const app = await buildServer();
    await app.listen({ port: Number(opts.port), host: '0.0.0.0' });
    console.log(`API listening on http://localhost:${opts.port}`);
  });

program
  .command('plan')
  .description('Create an install plan (non-interactive)')
  .requiredOption('-s, --selections <ids>', 'Comma-separated component ids (e.g., core,claude-code)')
  .option('-m, --mode <mode>', 'Mode: guided|express|advanced', 'guided')
  .option('--yolo', 'Enable YOLO mode', false)
  .option('--dangerously-skip-permissions', 'Dangerously skip permissions', false)
  .option('--ack <text>', 'Acknowledgement text when enabling YOLO', '')
  .action((opts) => {
    const selections = String(opts.selections).split(',').map((s: string) => s.trim()).filter(Boolean);
    const plan = planInstall({
      selections,
      mode: opts.mode,
      options: {
        yolo: !!opts.yolo,
        dangerouslySkipPermissions: !!opts.dangerouslySkipPermissions,
        nonInteractive: true,
        ack: opts.ack,
      }
    });
    console.log(JSON.stringify(plan, null, 2));
  });

program
  .command('wizard')
  .description('Interactive installation wizard (planning only)')
  .action(async () => {
    const rl = createInterface({ input, output });
    try {
      console.log('\nAvailable components:');
      const comps = listComponents();
      comps.forEach(c => console.log(`- ${c.id}: ${c.name}`));
      const selInput = await rl.question('\nEnter component ids (comma-separated): ');
      const selections = selInput.split(',').map(s => s.trim()).filter(Boolean);
      const mode = (await rl.question('Mode [guided|express|advanced] (default guided): ')) || 'guided';
      const yoloAns = (await rl.question('Enable YOLO? [y/N]: ')).trim().toLowerCase();
      const yolo = yoloAns === 'y' || yoloAns === 'yes';
      let ack = '';
      if (yolo) {
        ack = await rl.question('Type ack text (must be "I-ACCEPT-RISK"): ');
      }
      const plan = planInstall({
        selections,
        mode: mode as any,
        options: { yolo, dangerouslySkipPermissions: yolo, nonInteractive: false, ack }
      });
      console.log('\nPlanned steps:\n' + JSON.stringify(plan, null, 2));
    } catch (e: any) {
      console.error('Wizard error:', e.message);
      process.exitCode = 1;
    } finally {
      rl.close();
    }
  });

// Universal Scaffolding System
const universalScaffolder = new UniversalScaffolder();
const templateManager = new TemplateManager();
const optimizedScaffolder = new OptimizedScaffolder();

// Enhanced create command with modern templates
program
  .command('create [project-name]')
  .description('Create a new project from modern templates')
  .option('-t, --template <template>', 'Use specific template (fullstack-modern, react-spa, nextjs-app, rust-api, node-api)')
  .option('-i, --interactive', 'Interactive mode')
  .option('--install', 'Install dependencies after creation')
  .option('--git', 'Initialize git repository')
  .option('--force', 'Overwrite existing directory')
  .action(async (projectName: string, options: any) => {
    try {
      if (options.interactive || !projectName || !options.template) {
        console.log('🚀 Claude Flow 2.0 - Interactive Project Creation\n');
        const result = await scaffoldInteractive({
          projectName,
          template: options.template,
          installDeps: options.install,
          initGit: options.git
        });
        return;
      }

      // Direct template creation
      if (!AVAILABLE_TEMPLATES[options.template as TemplateType]) {
        console.error(`❌ Invalid template: ${options.template}`);
        console.log('\n📚 Available templates:');
        Object.entries(AVAILABLE_TEMPLATES).forEach(([key, template]) => {
          console.log(`  • ${key}: ${template.description}`);
        });
        process.exit(1);
      }

      console.log(`🔨 Creating ${projectName} from ${options.template} template...`);
      
      const result = createFromTemplate(options.template as TemplateType, projectName);
      
      console.log(`✅ Created ${result.applied.length} files`);
      if (result.skipped.length > 0) {
        console.log(`⚠️  Skipped ${result.skipped.length} existing files`);
      }
      
      console.log('\n🎉 Project created successfully!');
      console.log(`📁 Location: ${result.projectDir}`);
      console.log(`🚀 Features: ${result.features.join(', ')}`);
      
      console.log('\n📖 Next steps:');
      console.log(`   cd ${projectName}`);
      
      const template = AVAILABLE_TEMPLATES[options.template as TemplateType];
      if (template.type === 'fullstack') {
        console.log('   cp .env.example .env');
        console.log('   # Configure environment variables');
        console.log('   docker-compose up -d');
      } else if (!options.install) {
        console.log('   npm install');
        console.log('   npm run dev');
      } else {
        console.log('   npm run dev');
      }
      
      
      if (result.nextSteps) {
        console.log('\n📋 Next steps:');
        result.nextSteps.forEach((step: string, i: number) => {
          console.log(`  ${i + 1}. ${step}`);
        });
      }
    } catch (error: any) {
      console.error('❌ Failed to create project:', error.message);
      process.exit(1);
    }
  });

// List available templates
program
  .command('templates')
  .description('List all available project templates')
  .action(() => {
    console.log('📚 Available Templates:\n');
    
    Object.entries(AVAILABLE_TEMPLATES).forEach(([key, template]) => {
      console.log(`🎨 ${template.name} (${key})`);
      console.log(`   Type: ${template.type}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Features: ${template.features.join(', ')}`);
      console.log('');
    });
    
    console.log('💡 Usage examples:');
    console.log('   npx claude-flow create my-app -t fullstack-modern');
    console.log('   npx claude-flow create my-app -i  # Interactive mode');
  });

// Technology-specific shortcuts
program
  .command('react [project-name]')
  .description('Create React application')
  .option('--typescript', 'Use TypeScript')
  .option('--next', 'Use Next.js')
  .action(async (projectName: string, options: any) => {
    const template = options.next ? 'nextjs-app' : 
                   options.typescript ? 'react-typescript' : 
                   'react-javascript';
    await universalScaffolder.create(projectName || 'my-react-app', { template });
  });

program
  .command('python [project-name]')
  .description('Create Python project')
  .option('--django', 'Use Django')
  .option('--flask', 'Use Flask')
  .option('--fastapi', 'Use FastAPI')
  .option('--ml', 'Machine Learning project')
  .action(async (projectName: string, options: any) => {
    const template = options.django ? 'django-rest' :
                   options.flask ? 'flask-api' :
                   options.fastapi ? 'fastapi' :
                   options.ml ? 'python-ml' :
                   'python-cli';
    await universalScaffolder.create(projectName || 'my-python-app', { template });
  });

program
  .command('rust [project-name]')
  .description('Create Rust project')
  .option('--web', 'Web server with Actix')
  .option('--wasm', 'WebAssembly project')
  .action(async (projectName: string, options: any) => {
    const template = options.web ? 'rust-web-actix' :
                   options.wasm ? 'rust-wasm' :
                   'rust-cli';
    await universalScaffolder.create(projectName || 'my-rust-app', { template });
  });

// Advanced scaffolding commands
program
  .command('scaffold')
  .description('Project scaffolding commands')
  .addCommand(
    new Command('create')
      .description('Create a new project with scaffolding')
      .argument('<project-name>', 'Name of the project to create')
      .option('-t, --template <template>', 'Project template to use')
      .option('-i, --interactive', 'Use interactive mode', false)
      .option('--install-deps', 'Install dependencies automatically', false)
      .option('--init-git', 'Initialize git repository', false)
      .option('--generate-docs', 'Generate documentation', true)
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
            generateDocs: options.generateDocs
          };

          const result = await scaffoldProject(scaffoldOptions);

          if (result.success) {
            console.log(`\n✅ ${result.message}`);
            console.log(`\n📁 Files created:`);
            result.files.forEach(file => console.log(`  - ${file}`));
            console.log(`\n🎉 Project '${projectName}' created successfully!`);
          } else {
            console.error(`\n❌ ${result.message}`);
            process.exit(1);
          }
        } catch (error) {
          console.error('❌ Failed to create project:', error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('init')
      .description('Initialize Claude Flow 2.0 in existing project')
      .option('--enhance', 'Enhance existing project', false)
      .option('--install-deps', 'Install new dependencies', false)
      .option('--generate-docs', 'Generate documentation', true)
      .action(async (options: any) => {
        try {
          console.log('🔧 Initializing Claude Flow 2.0 in existing project...\n');

          const scaffoldOptions: ScaffoldOptions = {
            projectName: 'existing-project',
            enhance: options.enhance,
            skipExisting: true,
            installDeps: options.installDeps,
            generateDocs: options.generateDocs
          };

          const result = await scaffoldProject(scaffoldOptions);

          if (result.success) {
            console.log(`\n✅ ${result.message}`);
            console.log('\n🎉 Claude Flow 2.0 initialized successfully!');
          } else {
            console.error(`\n❌ ${result.message}`);
            process.exit(1);
          }
        } catch (error) {
          console.error('❌ Failed to initialize project:', error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('templates')
      .description('List available project templates')
      .option('--universal', 'Show universal templates', false)
      .option('--language <lang>', 'Filter by language')
      .option('--framework <fw>', 'Filter by framework')
      .action(async (options: any) => {
        if (options.universal) {
          const templates = await templateManager.getAvailableTemplates();
          let filtered = templates;
          
          if (options.language) {
            filtered = filtered.filter((t: any) => t.language === options.language);
          }
          if (options.framework) {
            filtered = filtered.filter((t: any) => t.framework === options.framework);
          }
          
          console.log('\n🌍 Universal Templates:\n');
          const grouped: any = {};
          filtered.forEach((template: any) => {
            if (!grouped[template.language]) {
              grouped[template.language] = [];
            }
            grouped[template.language].push(template);
          });
          
          Object.entries(grouped).forEach(([language, templates]: [string, any]) => {
            console.log(`\n${language.toUpperCase()}:`);
            templates.forEach((template: any) => {
              const framework = template.framework ? ` (${template.framework})` : '';
              console.log(`  ${template.id}${framework} - ${template.description}`);
            });
          });
          
          console.log(`\nTotal: ${filtered.length} templates`);
        } else {
          listTemplates();
        }
      })
  )
  .addCommand(
    new Command('template')
      .description('Show detailed information about a template')
      .argument('<name>', 'Template name')
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
        
        console.log(`\nAgents (${template.agents.length}):`);
        template.agents.forEach(agent => console.log(`  - ${agent}`));

        console.log(`\nMCP Servers (${template.mcpServers.length}):`);
        template.mcpServers.forEach(server => console.log(`  - ${server}`));
      })
  )
  .addCommand(
    new Command('interactive')
      .description('Start interactive project creation wizard')
      .action(async () => {
        try {
          console.log('🧙‍♂️ Starting interactive project creation wizard...\n');
          await createInteractiveProject();
        } catch (error) {
          console.error('❌ Interactive creation failed:', error);
          process.exit(1);
        }
      })
  );

// Advanced Framework Scaffolding Commands
program
  .command('framework')
  .description('Advanced framework scaffolding for modern tech stacks')
  .addCommand(
    new Command('create')
      .description('Create a new project with advanced framework scaffolding')
      .argument('<project-name>', 'Name of the project to create')
      .option('-t, --template <template>', 'Framework template (react-shadcn-tailwind, rust-supabase-postgres, fullstack-react-rust)')
      .option('-d, --description <description>', 'Project description')
      .option('-a, --author <author>', 'Project author')
      .option('-l, --license <license>', 'Project license', 'MIT')
      .option('-p, --package-manager <pm>', 'Package manager (npm, yarn, pnpm)', 'npm')
      .option('--interactive', 'Interactive mode with prompts')
      .option('--skip-install', 'Skip dependency installation')
      .option('--skip-git', 'Skip git repository initialization')
      .action(async (projectName: string, options: any) => {
        try {
          console.log('🚀 Advanced Framework Scaffolding\n');

          if (options.interactive || !options.template) {
            // Use the advanced CLI for interactive mode
            const advancedCli = new AdvancedScaffoldCLI();
            await advancedCli.createProject(projectName, options);
          } else {
            // Direct scaffolding with specified template
            const template = advancedFrameworkScaffolder.getTemplate(options.template);
            if (!template) {
              console.error(`❌ Template '${options.template}' not found.`);
              console.log('\nAvailable templates:');
              advancedFrameworkScaffolder.getAllTemplates().forEach(t => {
                console.log(`  - ${t.id}: ${t.name}`);
              });
              process.exit(1);
            }

            const context = {
              projectName,
              description: options.description || template.description,
              version: '0.1.0',
              author: options.author || 'Your Name <your.email@example.com>',
              license: options.license,
              template: template,
              technologies: [],
              customVariables: {
                packageManager: options.packageManager,
                skipInstall: options.skipInstall,
                skipGit: options.skipGit
              }
            };

            const outputPath = path.join(process.cwd(), projectName);
            const result = await frameworkTemplateEngine.scaffoldProject(template, context, outputPath);

            if (result.success) {
              console.log(`\n✅ ${result.message}`);
              console.log(`\n📁 Files created: ${result.metrics.filesCreated}`);
              console.log(`📂 Directories created: ${result.metrics.directoriesCreated}`);
              console.log(`⏱️  Time elapsed: ${result.metrics.timeElapsed}ms`);
              console.log(`\n🎉 Project '${projectName}' created successfully!`);
              
              if (!options.skipInstall && result.commands.length > 0) {
                console.log('\n📦 Next steps:');
                console.log(`  1. cd ${projectName}`);
                if (template.technologies.includes('Rust')) {
                  console.log('  2. cargo run');
                } else {
                  console.log(`  2. ${options.packageManager} run dev`);
                }
              }
            } else {
              console.error(`\n❌ ${result.message}`);
              if (result.errors.length > 0) {
                console.error('\nErrors:');
                result.errors.forEach(error => console.error(`  - ${error}`));
              }
              process.exit(1);
            }
          }
        } catch (error) {
          console.error('❌ Failed to create project:', error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List available framework templates')
      .option('-c, --category <category>', 'Filter by category (frontend, backend, fullstack)')
      .action((options: any) => {
        const templates = options.category 
          ? advancedFrameworkScaffolder.getTemplatesByCategory(options.category)
          : advancedFrameworkScaffolder.getAllTemplates();

        console.log('🌟 Advanced Framework Templates:\n');

        const groupedTemplates = templates.reduce((acc: any, template: any) => {
          if (!acc[template.category]) {
            acc[template.category] = [];
          }
          acc[template.category].push(template);
          return acc;
        }, {});

        Object.entries(groupedTemplates).forEach(([category, categoryTemplates]: [string, any]) => {
          console.log(`\n${category.toUpperCase()}:`);
          
          categoryTemplates.forEach((template: any) => {
            const complexity = template.complexity <= 3 ? '●●○○○' :
                            template.complexity <= 5 ? '●●●○○' :
                            template.complexity <= 7 ? '●●●●○' : '●●●●●';
            const technologies = template.technologies.slice(0, 3).join(', ');
            
            console.log(`  ${template.id.padEnd(25)} ${complexity} ${template.description}`);
            console.log(`  ${' '.repeat(25)} ${technologies}\n`);
          });
        });

        console.log(`Total: ${templates.length} templates`);
      })
  )
  .addCommand(
    new Command('info')
      .description('Show detailed information about a framework template')
      .argument('<template-id>', 'Template ID')
      .action((templateId: string) => {
        const template = advancedFrameworkScaffolder.getTemplate(templateId);
        
        if (!template) {
          console.error(`❌ Template "${templateId}" not found`);
          console.log('\nAvailable templates:');
          advancedFrameworkScaffolder.getAllTemplates().forEach(t => {
            console.log(`  - ${t.id}: ${t.name}`);
          });
          process.exit(1);
        }

        console.log(`\n📋 Template: ${template.name}\n`);
        console.log(`Description: ${template.description}`);
        console.log(`Category: ${template.category}`);
        console.log(`Complexity: ${template.complexity}/10`);
        
        console.log(`\nTechnologies (${template.technologies.length}):`);
        template.technologies.forEach(tech => console.log(`  - ${tech}`));
        
        console.log(`\nRequirements:`);
        Object.entries(template.requirements).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        
        console.log(`\nPackage Managers:`);
        template.configuration.packageManagers.forEach(pm => console.log(`  - ${pm}`));
        
        if (template.configuration.databases.length > 0) {
          console.log(`\nDatabases:`);
          template.configuration.databases.forEach(db => {
            console.log(`  - ${db.type} (port ${db.port})`);
          });
        }
        
        console.log(`\nDeployment Platforms:`);
        template.deployment.platforms.forEach(platform => console.log(`  - ${platform}`));
        
        console.log(`\n📚 Usage:`);
        console.log(`  mw-engine framework create my-app --template ${templateId}`);
      })
  )
  .addCommand(
    new Command('init')
      .description('Initialize framework scaffolding in existing project')
      .option('--enhance', 'Add enhancements to existing project')
      .option('--add <features>', 'Add specific features (comma-separated)')
      .action(async (options: any) => {
        try {
          console.log('🔧 Initializing framework scaffolding in existing project...\n');
          
          if (options.enhance) {
            const enhancements = options.add ? options.add.split(',') : [];
            const result = await frameworkTemplateEngine.enhanceExistingProject(
              process.cwd(),
              enhancements
            );
            
            if (result.success) {
              console.log(`✅ ${result.message}`);
              console.log(`\n📁 Files modified: ${result.metrics.filesCreated}`);
              console.log(`📋 Commands run: ${result.commands.length}`);
            } else {
              console.error(`❌ ${result.message}`);
              process.exit(1);
            }
          } else {
            console.log('Available enhancements:');
            console.log('  - shadcn: Add shadcn/ui components');
            console.log('  - tailwind: Add Tailwind CSS');
            console.log('  - supabase: Add Supabase integration');
            console.log('  - postgres: Add PostgreSQL setup');
            console.log('  - typescript: Add TypeScript configuration');
            console.log('  - testing: Add testing framework');
            console.log('  - cicd: Add CI/CD pipeline');
            console.log('\nUsage: mw-engine framework init --enhance --add shadcn,tailwind');
          }
        } catch (error) {
          console.error('❌ Failed to initialize project:', error);
          process.exit(1);
        }
      })
  );

program.parse(process.argv);


