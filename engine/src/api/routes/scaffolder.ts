import { FastifyInstance } from 'fastify';
import { createScaffoldPlan, writeScaffoldPreview, applyScaffold } from '../../modules/scaffolder.js';
import { 
  scaffoldProject, 
  createInteractiveProject, 
  enhanceExistingProject, 
  listTemplates, 
  getTemplateInfo,
  PROJECT_TEMPLATES,
  ScaffoldOptions 
} from '../../modules/advanced-scaffolder.js';

const scaffoldRequestSchema = {
  type: 'object',
  properties: {
    projectName: { type: 'string' },
    template: { type: 'string' },
    interactive: { type: 'boolean' },
    enhance: { type: 'boolean' },
    skipExisting: { type: 'boolean' },
    installDeps: { type: 'boolean' },
    initGit: { type: 'boolean' },
    generateDocs: { type: 'boolean' }
  },
  required: ['projectName']
};

export default async function (app: FastifyInstance) {
  // Legacy scaffolding endpoints
  app.post('/api/scaffold/plan', async () => createScaffoldPlan());
  app.post('/api/scaffold/preview', async () => writeScaffoldPreview());
  app.post('/api/scaffold/apply', async () => applyScaffold());

  // New advanced scaffolding endpoints
  
  // Get all available templates
  app.get('/api/scaffold/templates', async (request, reply) => {
    try {
      const templates = Object.entries(PROJECT_TEMPLATES).map(([key, template]) => ({
        key,
        name: template.name,
        type: template.type,
        framework: template.framework,
        language: template.language,
        description: `${template.name} project with ${template.language}`,
        agents: template.agents.length,
        mcpServers: template.mcpServers.length,
        bestPractices: template.bestPractices
      }));
      
      return { templates };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to fetch templates' });
    }
  });

  // Get template details
  app.get('/api/scaffold/templates/:templateName', async (request, reply) => {
    try {
      const { templateName } = request.params as { templateName: string };
      const template = getTemplateInfo(templateName);
      
      if (!template) {
        return reply.code(404).send({ error: 'Template not found' });
      }
      
      return { template };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to fetch template details' });
    }
  });

  // Create new project
  app.post('/api/scaffold/create', {
    schema: {
      body: scaffoldRequestSchema
    }
  }, async (request, reply) => {
    try {
      const options = request.body as ScaffoldOptions;
      const result = await scaffoldProject(options);
      
      if (result.success) {
        return {
          success: true,
          message: result.message,
          files: result.files,
          projectName: options.projectName
        };
      } else {
        return reply.code(400).send({
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      reply.code(500).send({ 
        success: false, 
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Enhance existing project
  app.post('/api/scaffold/enhance', {
    schema: {
      body: {
        type: 'object',
        properties: {
          projectPath: { type: 'string' },
          installDeps: { type: 'boolean' },
          generateDocs: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { projectPath = process.cwd(), installDeps = false, generateDocs = true } = request.body as any;
      
      const plan = enhanceExistingProject(projectPath, {
        installDeps,
        generateDocs
      });
      
      return {
        success: true,
        plan: {
          files: plan.files.length,
          conflicts: plan.conflicts.length,
          monorepo: plan.monorepo,
          conflictFiles: plan.conflicts,
          newFiles: plan.files.map(f => f.relativePath)
        }
      };
    } catch (error) {
      reply.code(500).send({ 
        success: false, 
        error: 'Failed to enhance project',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Validate project structure
  app.post('/api/scaffold/validate', {
    schema: {
      body: {
        type: 'object',
        properties: {
          projectPath: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { projectPath = process.cwd() } = request.body as any;
      const fs = await import('fs');
      const path = await import('path');
      
      const validation = {
        isValid: true,
        issues: [] as string[],
        components: [] as string[]
      };

      // Check for required files
      const requiredFiles = ['CLAUDE.md', '.claude/mcp.json'];
      requiredFiles.forEach(file => {
        const filePath = path.join(projectPath, file);
        if (fs.existsSync(filePath)) {
          validation.components.push(`File: ${file}`);
        } else {
          validation.issues.push(`Missing required file: ${file}`);
          validation.isValid = false;
        }
      });

      // Check for agents directory
      const agentsDir = path.join(projectPath, '.claude/agents');
      if (fs.existsSync(agentsDir)) {
        const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
        validation.components.push(`Agents: ${agentFiles.length} configured`);
        if (agentFiles.length === 0) {
          validation.issues.push('No agent configurations found');
          validation.isValid = false;
        }
      } else {
        validation.issues.push('Missing .claude/agents directory');
        validation.isValid = false;
      }

      return { validation };
    } catch (error) {
      reply.code(500).send({ 
        error: 'Failed to validate project',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get project analysis
  app.post('/api/scaffold/analyze', {
    schema: {
      body: {
        type: 'object',
        properties: {
          projectPath: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { projectPath = process.cwd() } = request.body as any;
      const fs = await import('fs');
      const path = await import('path');
      
      const analysis = {
        projectType: 'unknown' as string,
        language: 'unknown' as string,
        framework: null as string | null,
        hasTests: false,
        hasCI: false,
        hasDocs: false,
        packageManager: 'unknown' as string,
        files: {
          total: 0,
          source: 0,
          tests: 0,
          configs: 0
        }
      };

      // Detect project type
      if (fs.existsSync(path.join(projectPath, 'package.json'))) {
        analysis.packageManager = 'npm';
        try {
          const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
          
          if (packageJson.dependencies?.react) {
            analysis.projectType = 'frontend';
            analysis.framework = 'React';
            analysis.language = 'JavaScript';
          }
          if (packageJson.dependencies?.next) {
            analysis.projectType = 'fullstack';
            analysis.framework = 'Next.js';
          }
          if (packageJson.dependencies?.express) {
            analysis.projectType = 'backend';
            analysis.framework = 'Express';
          }
          if (packageJson.devDependencies?.typescript) {
            analysis.language = 'TypeScript';
          }
        } catch (e) {
          // Invalid package.json
        }
      }

      if (fs.existsSync(path.join(projectPath, 'requirements.txt')) || fs.existsSync(path.join(projectPath, 'manage.py'))) {
        analysis.projectType = 'backend';
        analysis.language = 'Python';
        analysis.packageManager = 'pip';
        if (fs.existsSync(path.join(projectPath, 'manage.py'))) {
          analysis.framework = 'Django';
        }
      }

      if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
        analysis.projectType = 'backend';
        analysis.language = 'Rust';
        analysis.packageManager = 'cargo';
      }

      if (fs.existsSync(path.join(projectPath, 'pubspec.yaml'))) {
        analysis.projectType = 'mobile';
        analysis.language = 'Dart';
        analysis.framework = 'Flutter';
        analysis.packageManager = 'flutter';
      }

      // Check for common directories/files
      analysis.hasTests = fs.existsSync(path.join(projectPath, 'test')) || 
                        fs.existsSync(path.join(projectPath, 'tests')) ||
                        fs.existsSync(path.join(projectPath, '__tests__'));

      analysis.hasCI = fs.existsSync(path.join(projectPath, '.github/workflows')) ||
                      fs.existsSync(path.join(projectPath, '.gitlab-ci.yml')) ||
                      fs.existsSync(path.join(projectPath, '.travis.yml'));

      analysis.hasDocs = fs.existsSync(path.join(projectPath, 'docs')) ||
                        fs.existsSync(path.join(projectPath, 'README.md'));

      return { analysis };
    } catch (error) {
      reply.code(500).send({ 
        error: 'Failed to analyze project',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Generate scaffolding preview
  app.post('/api/scaffold/preview', {
    schema: {
      body: scaffoldRequestSchema
    }
  }, async (request, reply) => {
    try {
      const options = request.body as ScaffoldOptions;
      const { createScaffoldPlan } = await import('../../modules/advanced-scaffolder.js');
      
      // Get template if specified
      let template = undefined;
      if (options.template) {
        template = getTemplateInfo(options.template);
        if (!template) {
          return reply.code(400).send({ error: 'Invalid template specified' });
        }
      }
      
      const plan = createScaffoldPlan(process.cwd(), options, template);
      
      return {
        preview: {
          files: plan.files.map(f => ({
            path: f.relativePath,
            size: f.content.length,
            type: f.relativePath.split('.').pop() || 'unknown'
          })),
          conflicts: plan.conflicts,
          monorepo: plan.monorepo,
          totalFiles: plan.files.length,
          hasConflicts: plan.conflicts.length > 0
        }
      };
    } catch (error) {
      reply.code(500).send({ 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}


