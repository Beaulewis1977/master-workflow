import fs from 'fs';
import path from 'path';
import { scanEnvironment } from './env-scanner.js';
import { createInterface } from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type ScaffoldFile = { relativePath: string; content: string };
export type ScaffoldPlan = { files: ScaffoldFile[]; conflicts: string[]; monorepo: boolean };

export interface ProjectTemplate {
  name: string;
  type: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'data-science' | 'devops';
  framework?: string;
  language: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  structure: Record<string, string>;
  configs: Record<string, string>;
  agents: string[];
  mcpServers: string[];
  bestPractices: {
    linting: boolean;
    testing: boolean;
    security: boolean;
    documentation: boolean;
    cicd: boolean;
  };
}

export interface ScaffoldOptions {
  projectName: string;
  template?: string;
  interactive?: boolean;
  enhance?: boolean;
  skipExisting?: boolean;
  installDeps?: boolean;
  initGit?: boolean;
  generateDocs?: boolean;
}

// Project Templates Registry
const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  'react-typescript': {
    name: 'React TypeScript',
    type: 'frontend',
    framework: 'React',
    language: 'TypeScript',
    dependencies: ['react', 'react-dom'],
    devDependencies: [
      '@types/react', '@types/react-dom', '@vitejs/plugin-react',
      'vite', 'typescript', 'eslint', '@typescript-eslint/parser',
      '@typescript-eslint/eslint-plugin', 'prettier'
    ],
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      lint: 'eslint src --ext .ts,.tsx',
      'lint:fix': 'eslint src --ext .ts,.tsx --fix',
      format: 'prettier --write src',
      test: 'vitest',
      'test:coverage': 'vitest --coverage'
    },
    structure: {
      'src/App.tsx': 'React App component',
      'src/main.tsx': 'React entry point',
      'src/components/': 'React components',
      'src/hooks/': 'Custom React hooks',
      'src/utils/': 'Utility functions',
      'src/types/': 'TypeScript type definitions',
      'public/index.html': 'HTML template'
    },
    configs: {
      'tsconfig.json': 'TypeScript configuration',
      'vite.config.ts': 'Vite build configuration',
      '.eslintrc.json': 'ESLint configuration',
      '.prettierrc': 'Prettier configuration'
    },
    agents: ['frontend-specialist-agent', 'code-analyzer-agent', 'testing-validation-agent'],
    mcpServers: ['npm', 'vite', 'github', 'vercel', 'cypress'],
    bestPractices: {
      linting: true,
      testing: true,
      security: true,
      documentation: true,
      cicd: true
    }
  },
  
  'next-fullstack': {
    name: 'Next.js Full Stack',
    type: 'fullstack',
    framework: 'Next.js',
    language: 'TypeScript',
    dependencies: ['next', 'react', 'react-dom', '@next/font'],
    devDependencies: [
      '@types/react', '@types/react-dom', '@types/node',
      'typescript', 'eslint', 'eslint-config-next', 'prettier',
      'tailwindcss', 'postcss', 'autoprefixer'
    ],
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'lint:fix': 'next lint --fix',
      format: 'prettier --write .',
      test: 'jest',
      'test:watch': 'jest --watch'
    },
    structure: {
      'app/page.tsx': 'Next.js App Router page',
      'app/layout.tsx': 'Root layout',
      'app/api/': 'API routes',
      'components/': 'React components',
      'lib/': 'Utility libraries',
      'types/': 'TypeScript types',
      'public/': 'Static assets'
    },
    configs: {
      'next.config.js': 'Next.js configuration',
      'tailwind.config.js': 'Tailwind CSS configuration',
      'tsconfig.json': 'TypeScript configuration'
    },
    agents: ['frontend-specialist-agent', 'api-builder-agent', 'database-architect-agent'],
    mcpServers: ['npm', 'next', 'vercel', 'github', 'postgres'],
    bestPractices: {
      linting: true,
      testing: true,
      security: true,
      documentation: true,
      cicd: true
    }
  },
  
  'node-express': {
    name: 'Node.js Express API',
    type: 'backend',
    framework: 'Express',
    language: 'TypeScript',
    dependencies: ['express', 'cors', 'helmet', 'dotenv'],
    devDependencies: [
      '@types/express', '@types/cors', '@types/node',
      'typescript', 'ts-node', 'nodemon', 'eslint',
      '@typescript-eslint/parser', '@typescript-eslint/eslint-plugin',
      'jest', '@types/jest', 'supertest', '@types/supertest'
    ],
    scripts: {
      dev: 'nodemon src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
      lint: 'eslint src --ext .ts',
      'lint:fix': 'eslint src --ext .ts --fix',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage'
    },
    structure: {
      'src/index.ts': 'Server entry point',
      'src/routes/': 'API route handlers',
      'src/middleware/': 'Express middleware',
      'src/models/': 'Data models',
      'src/controllers/': 'Request controllers',
      'src/utils/': 'Utility functions',
      'src/types/': 'TypeScript types'
    },
    configs: {
      'tsconfig.json': 'TypeScript configuration',
      'jest.config.js': 'Jest testing configuration',
      '.env.example': 'Environment variables template'
    },
    agents: ['api-builder-agent', 'database-architect-agent', 'security-scanner-agent'],
    mcpServers: ['npm', 'github', 'postgres', 'redis', 'docker'],
    bestPractices: {
      linting: true,
      testing: true,
      security: true,
      documentation: true,
      cicd: true
    }
  },
  
  'react-native': {
    name: 'React Native Mobile',
    type: 'mobile',
    framework: 'React Native',
    language: 'TypeScript',
    dependencies: ['react', 'react-native'],
    devDependencies: [
      '@types/react', '@types/react-native',
      'typescript', 'eslint', '@typescript-eslint/parser',
      '@typescript-eslint/eslint-plugin', 'prettier',
      '@react-native-community/eslint-config'
    ],
    scripts: {
      start: 'react-native start',
      'android': 'react-native run-android',
      'ios': 'react-native run-ios',
      lint: 'eslint . --ext .js,.jsx,.ts,.tsx',
      'lint:fix': 'eslint . --ext .js,.jsx,.ts,.tsx --fix',
      test: 'jest'
    },
    structure: {
      'App.tsx': 'Root app component',
      'src/screens/': 'App screens',
      'src/components/': 'Reusable components',
      'src/navigation/': 'Navigation setup',
      'src/services/': 'API services',
      'src/utils/': 'Utility functions'
    },
    configs: {
      'tsconfig.json': 'TypeScript configuration',
      'metro.config.js': 'Metro bundler configuration',
      'react-native.config.js': 'React Native configuration'
    },
    agents: ['frontend-specialist-agent', 'testing-validation-agent'],
    mcpServers: ['npm', 'github', 'firebase', 'expo'],
    bestPractices: {
      linting: true,
      testing: true,
      security: true,
      documentation: true,
      cicd: false
    }
  },
  
  'python-django': {
    name: 'Python Django API',
    type: 'backend',
    framework: 'Django',
    language: 'Python',
    dependencies: ['Django', 'djangorestframework', 'django-cors-headers'],
    devDependencies: ['pytest', 'pytest-django', 'black', 'flake8', 'mypy'],
    scripts: {
      dev: 'python manage.py runserver',
      migrate: 'python manage.py migrate',
      'make-migrations': 'python manage.py makemigrations',
      test: 'pytest',
      lint: 'flake8 .',
      format: 'black .',
      'type-check': 'mypy .'
    },
    structure: {
      'manage.py': 'Django management script',
      'requirements.txt': 'Python dependencies',
      'project/settings.py': 'Django settings',
      'project/urls.py': 'URL configuration',
      'apps/': 'Django applications'
    },
    configs: {
      'pyproject.toml': 'Python project configuration',
      'pytest.ini': 'Pytest configuration',
      '.flake8': 'Flake8 linting configuration'
    },
    agents: ['api-builder-agent', 'database-architect-agent', 'security-scanner-agent'],
    mcpServers: ['github', 'postgres', 'redis', 'docker', 'aws'],
    bestPractices: {
      linting: true,
      testing: true,
      security: true,
      documentation: true,
      cicd: true
    }
  },

  'flutter-mobile': {
    name: 'Flutter Mobile App',
    type: 'mobile',
    framework: 'Flutter',
    language: 'Dart',
    dependencies: ['flutter', 'cupertino_icons'],
    devDependencies: ['flutter_test', 'flutter_lints'],
    scripts: {
      run: 'flutter run',
      build: 'flutter build apk',
      'build:ios': 'flutter build ios',
      test: 'flutter test',
      'analyze': 'flutter analyze',
      'format': 'dart format .'
    },
    structure: {
      'lib/main.dart': 'App entry point',
      'lib/screens/': 'App screens',
      'lib/widgets/': 'Custom widgets',
      'lib/services/': 'API and business logic',
      'lib/models/': 'Data models',
      'test/': 'Test files'
    },
    configs: {
      'pubspec.yaml': 'Flutter project configuration',
      'analysis_options.yaml': 'Dart analyzer configuration'
    },
    agents: ['frontend-specialist-agent', 'testing-validation-agent'],
    mcpServers: ['github', 'firebase', 'flutter'],
    bestPractices: {
      linting: true,
      testing: true,
      security: true,
      documentation: true,
      cicd: true
    }
  },

  'rust-backend': {
    name: 'Rust Backend API',
    type: 'backend',
    framework: 'Axum',
    language: 'Rust',
    dependencies: ['tokio', 'axum', 'serde', 'serde_json'],
    devDependencies: ['cargo-watch'],
    scripts: {
      dev: 'cargo watch -x run',
      build: 'cargo build --release',
      test: 'cargo test',
      lint: 'cargo clippy',
      format: 'cargo fmt'
    },
    structure: {
      'src/main.rs': 'Server entry point',
      'src/handlers/': 'Request handlers',
      'src/models/': 'Data models',
      'src/middleware/': 'Middleware modules',
      'Cargo.toml': 'Rust project manifest'
    },
    configs: {
      'Cargo.toml': 'Rust project configuration',
      'rustfmt.toml': 'Rust formatter configuration'
    },
    agents: ['api-builder-agent', 'database-architect-agent', 'security-scanner-agent'],
    mcpServers: ['github', 'postgres', 'redis', 'docker'],
    bestPractices: {
      linting: true,
      testing: true,
      security: true,
      documentation: true,
      cicd: true
    }
  }
};

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function exists(p: string): boolean { 
  try { 
    return fs.existsSync(p); 
  } catch { 
    return false; 
  } 
}

function detectMonorepo(root: string): boolean {
  if (exists(path.join(root, 'packages'))) return true;
  // detect multiple package.json in subdirs (lightweight)
  try {
    const entries = fs.readdirSync(root);
    let count = 0;
    for (const e of entries) {
      const full = path.join(root, e);
      if (fs.statSync(full).isDirectory() && exists(path.join(full, 'package.json'))) count++;
      if (count >= 2) return true;
    }
  } catch {}
  return false;
}

// Interactive project creation
export async function createInteractiveProject(options: Partial<ScaffoldOptions> = {}): Promise<ScaffoldPlan> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt: string): Promise<string> => {
    return new Promise(resolve => {
      rl.question(prompt, resolve);
    });
  };
  
  try {
    console.log('🚀 Claude Flow 2.0 Project Scaffolding\n');
    
    const projectName = options.projectName || await question('Project name: ');
    
    console.log('\nAvailable templates:');
    Object.entries(PROJECT_TEMPLATES).forEach(([key, template], index) => {
      console.log(`${index + 1}. ${template.name} (${template.type})`);
    });
    
    const templateChoice = options.template || await question('\nSelect template (name or number): ');
    const template = resolveTemplate(templateChoice);
    
    const installDeps = options.installDeps ?? (await question('Install dependencies? (y/n): ')).toLowerCase() === 'y';
    const initGit = options.initGit ?? (await question('Initialize git repository? (y/n): ')).toLowerCase() === 'y';
    const generateDocs = options.generateDocs ?? (await question('Generate documentation? (y/n): ')).toLowerCase() === 'y';
    
    const finalOptions: ScaffoldOptions = {
      projectName,
      template: template.name,
      interactive: true,
      enhance: false,
      installDeps,
      initGit,
      generateDocs
    };
    
    return createScaffoldPlan(process.cwd(), finalOptions, template);
  } finally {
    rl.close();
  }
}

// Enhanced existing project detection and scaffolding
export function enhanceExistingProject(root = process.cwd(), options: Partial<ScaffoldOptions> = {}): ScaffoldPlan {
  const fingerprint = scanEnvironment();
  const detectedTemplate = detectProjectTemplate(fingerprint, root);
  
  console.log(`📁 Detected project type: ${detectedTemplate?.name || 'Unknown'}`);
  
  const enhanceOptions: ScaffoldOptions = {
    projectName: path.basename(root),
    enhance: true,
    skipExisting: true,
    ...options
  };
  
  return createScaffoldPlan(root, enhanceOptions, detectedTemplate);
}

function resolveTemplate(choice: string): ProjectTemplate {
  // Try by key first
  if (PROJECT_TEMPLATES[choice]) {
    return PROJECT_TEMPLATES[choice];
  }
  
  // Try by number
  const templateKeys = Object.keys(PROJECT_TEMPLATES);
  const index = parseInt(choice) - 1;
  if (index >= 0 && index < templateKeys.length) {
    return PROJECT_TEMPLATES[templateKeys[index]];
  }
  
  // Try by name (case insensitive)
  const templateByName = Object.values(PROJECT_TEMPLATES).find(
    t => t.name.toLowerCase().includes(choice.toLowerCase())
  );
  
  if (templateByName) {
    return templateByName;
  }
  
  // Default to React TypeScript
  console.log(`⚠️  Template '${choice}' not found. Using React TypeScript as default.`);
  return PROJECT_TEMPLATES['react-typescript'];
}

function detectProjectTemplate(fingerprint: any, root: string): ProjectTemplate | null {
  const packageJsonPath = path.join(root, 'package.json');
  
  if (exists(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Detect React projects
      if (packageJson.dependencies?.react) {
        if (packageJson.dependencies?.next) {
          return PROJECT_TEMPLATES['next-fullstack'];
        }
        if (packageJson.dependencies?.['react-native']) {
          return PROJECT_TEMPLATES['react-native'];
        }
        return PROJECT_TEMPLATES['react-typescript'];
      }
      
      // Detect Node.js projects
      if (packageJson.dependencies?.express) {
        return PROJECT_TEMPLATES['node-express'];
      }
    } catch (error) {
      console.warn('Failed to parse package.json:', error);
    }
  }
  
  // Detect Python projects
  if (exists(path.join(root, 'manage.py')) || exists(path.join(root, 'requirements.txt'))) {
    return PROJECT_TEMPLATES['python-django'];
  }
  
  // Detect Flutter projects
  if (exists(path.join(root, 'pubspec.yaml'))) {
    return PROJECT_TEMPLATES['flutter-mobile'];
  }
  
  // Detect Rust projects
  if (exists(path.join(root, 'Cargo.toml'))) {
    return PROJECT_TEMPLATES['rust-backend'];
  }
  
  return null;
}

export function createScaffoldPlan(root = process.cwd(), options: ScaffoldOptions = { projectName: 'new-project' }, template?: ProjectTemplate): ScaffoldPlan {
  const fingerprint = scanEnvironment();
  const monorepo = detectMonorepo(root);
  const files: ScaffoldFile[] = [];
  const conflicts: string[] = [];
  
  const isEnhancing = options.enhance;
  const skipExisting = options.skipExisting || isEnhancing;
  
  function addFile(relativePath: string, content: string) {
    const fullPath = path.join(root, relativePath);
    if (exists(fullPath)) {
      if (!skipExisting) conflicts.push(relativePath);
    } else {
      files.push({ relativePath, content });
    }
  }
  
  // Project structure based on template
  if (template) {
    // Package.json for JavaScript/TypeScript projects
    if (['JavaScript', 'TypeScript'].includes(template.language)) {
      addFile('package.json', buildPackageJson(template, options.projectName));
    }
    
    // Python requirements
    if (template.language === 'Python') {
      const requirements = template.dependencies.concat(template.devDependencies).join('\n');
      addFile('requirements.txt', requirements);
    }
    
    // Rust Cargo.toml
    if (template.language === 'Rust') {
      addFile('Cargo.toml', generateCargoToml(template, options.projectName));
    }
    
    // Flutter pubspec.yaml
    if (template.language === 'Dart') {
      addFile('pubspec.yaml', generatePubspecYaml(template, options.projectName));
    }
    
    // Project structure
    Object.entries(template.structure).forEach(([filePath, description]) => {
      if (filePath.endsWith('/')) {
        // Directory - create with README
        addFile(`${filePath}README.md`, `# ${description}\n\nThis directory contains ${description.toLowerCase()}.\n`);
      } else {
        // File - create with template content
        addFile(filePath, generateFileContent(filePath, template, description));
      }
    });
    
    // Configuration files
    Object.entries(template.configs).forEach(([configFile, description]) => {
      addFile(configFile, generateConfigContent(configFile, template, description));
    });
    
    // Agents
    const agents = buildAgents(template);
    Object.entries(agents).forEach(([name, content]) => {
      addFile(`.claude/agents/${name}`, content);
    });
    
    // MCP server configuration
    const mcpConfig = generateMCPConfig(template);
    addFile('.claude/mcp.json', JSON.stringify(mcpConfig, null, 2));
    
    // CI/CD workflow
    if (template.bestPractices.cicd) {
      addFile('.github/workflows/ci.yml', buildCIWorkflow(template));
    }
    
    // Justfile
    addFile('Justfile', buildJustfile(template));
    
    // Documentation
    if (options.generateDocs) {
      addFile('README.md', generateProjectReadme(template, options.projectName));
      addFile('CONTRIBUTING.md', generateContributingGuide(template));
    }
    
    // Environment files
    addFile('.env.example', generateEnvTemplate(template));
    addFile('.gitignore', generateGitignore(template));
    
  } else {
    // Legacy scaffolding for unknown projects
    addFile('Justfile', buildJustfile());
    addFile('.ai-workflow/scaffold/npm-scripts.json', buildNpmScriptsSnippet());
    
    const agents = buildAgents();
    Object.entries(agents).forEach(([name, content]) => {
      addFile(`.claude/agents/${name}`, content);
    });
    
    if (fingerprint.containers.includes('k8s') || fingerprint.containers.includes('dockerfile')) {
      addFile('.github/workflows/infra.yml', buildInfraWorkflow());
    }
  }
  
  // Claude configuration
  addFile('CLAUDE.md', generateClaudeConfig(template, options, fingerprint));
  
  // Monorepo handling
  if (monorepo) {
    addFile('.ai-workflow/scaffold/README-MONOREPO.md', '# Monorepo detected\n\nConsider per-package scripts and CI matrix.');
  }
  
  return { files, conflicts, monorepo };
}

export function writeScaffoldPreview(root = process.cwd(), plan?: ScaffoldPlan) {
  const p = plan || createScaffoldPlan(root);
  for (const f of p.files) {
    const previewPath = path.join(root, '.ai-workflow', 'scaffold', f.relativePath);
    ensureDir(path.dirname(previewPath));
    fs.writeFileSync(previewPath, f.content, 'utf8');
  }
  return { written: p.files.map(f => path.join('.ai-workflow/scaffold', f.relativePath)), conflicts: p.conflicts, monorepo: p.monorepo };
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<{ success: boolean; message: string; files: string[] }> {
  try {
    const plan = options.interactive 
      ? await createInteractiveProject(options)
      : options.enhance
        ? enhanceExistingProject(process.cwd(), options)
        : createScaffoldPlan(process.cwd(), options);
    
    const result = applyScaffold(process.cwd(), plan);
    
    // Install dependencies
    if (options.installDeps) {
      console.log('📦 Installing dependencies...');
      await installDependencies();
    }
    
    // Initialize git repository
    if (options.initGit && !exists(path.join(process.cwd(), '.git'))) {
      console.log('🔧 Initializing git repository...');
      await execAsync('git init');
      await execAsync('git add .');
      await execAsync('git commit -m "Initial commit - scaffolded with Claude Flow 2.0"');
    }
    
    return {
      success: true,
      message: `Successfully scaffolded project '${options.projectName}' with ${result.applied.length} files created.`,
      files: result.applied
    };
  } catch (error) {
    return {
      success: false,
      message: `Scaffolding failed: ${error instanceof Error ? error.message : String(error)}`,
      files: []
    };
  }
}

async function installDependencies(): Promise<void> {
  try {
    if (exists('package.json')) {
      await execAsync('npm install');
    } else if (exists('requirements.txt')) {
      await execAsync('pip install -r requirements.txt');
    } else if (exists('Cargo.toml')) {
      await execAsync('cargo build');
    } else if (exists('pubspec.yaml')) {
      await execAsync('flutter pub get');
    }
  } catch (error) {
    console.warn('⚠️  Failed to install dependencies:', error);
  }
}

export function applyScaffold(root = process.cwd(), plan?: ScaffoldPlan) {
  const p = plan || createScaffoldPlan(root);
  const applied: string[] = [];
  const skipped: string[] = [];
  for (const f of p.files) {
    const target = path.join(root, f.relativePath);
    if (exists(target)) { skipped.push(f.relativePath); continue; }
    ensureDir(path.dirname(target));
    // Prefer using preview if exists
    const preview = path.join(root, '.ai-workflow', 'scaffold', f.relativePath);
    if (exists(preview)) {
      fs.copyFileSync(preview, target);
    } else {
      fs.writeFileSync(target, f.content, 'utf8');
    }
    applied.push(f.relativePath);
  }
  return { applied, skipped, conflicts: p.conflicts };
}

// Helper functions for building project files
function buildPackageJson(template: ProjectTemplate, projectName: string): string {
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: `${template.name} project scaffolded with Claude Flow 2.0`,
    main: template.language === 'TypeScript' ? 'dist/index.js' : 'src/index.js',
    scripts: template.scripts,
    dependencies: template.dependencies.reduce((acc, dep) => {
      acc[dep] = 'latest';
      return acc;
    }, {} as Record<string, string>),
    devDependencies: template.devDependencies.reduce((acc, dep) => {
      acc[dep] = 'latest';
      return acc;
    }, {} as Record<string, string>),
    keywords: [template.type, template.framework, template.language].filter(Boolean),
    author: '',
    license: 'MIT',
    ...(template.type === 'frontend' && {
      browserslist: {
        production: [
          ">0.2%",
          "not dead",
          "not op_mini all"
        ],
        development: [
          "last 1 chrome version",
          "last 1 firefox version",
          "last 1 safari version"
        ]
      }
    })
  };
  
  return JSON.stringify(packageJson, null, 2);
}

function generateCargoToml(template: ProjectTemplate, projectName: string): string {
  return `[package]
name = "${projectName}"
version = "0.1.0"
edition = "2021"
description = "${template.name} project scaffolded with Claude Flow 2.0"

[dependencies]
${template.dependencies.map(dep => `${dep} = "*"`).join('\n')}

[dev-dependencies]
${template.devDependencies.map(dep => `${dep} = "*"`).join('\n')}
`;
}

function generatePubspecYaml(template: ProjectTemplate, projectName: string): string {
  return `name: ${projectName}
description: ${template.name} project scaffolded with Claude Flow 2.0.
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
${template.dependencies.map(dep => `  ${dep}: ^1.0.0`).join('\n')}

dev_dependencies:
  flutter_test:
    sdk: flutter
${template.devDependencies.map(dep => `  ${dep}: ^1.0.0`).join('\n')}

flutter:
  uses-material-design: true
`;
}

function buildNpmScriptsSnippet(template?: ProjectTemplate): string {
  const defaultScripts = {
    scripts: {
      test: 'node test/test-runner.js',
      lint: 'node scripts/lint-if-available.js',
      build: 'echo "no build"',
      e2e: 'echo "no e2e"',
      release: 'echo "no release"'
    }
  };
  
  if (template) {
    return JSON.stringify({ scripts: template.scripts }, null, 2);
  }
  
  return JSON.stringify(defaultScripts, null, 2);
}

function buildAgents(template?: ProjectTemplate): Record<string, string> {
  const baseAgents = {
    'code-analyzer-agent.md': 'name: code-analyzer-agent\nrole: code-analysis\ntools:\n- Read\n- Grep\n- Edit\npolicy: read-analyze\n',
    'doc-generator-agent.md': 'name: doc-generator-agent\nrole: documentation\ntools:\n- Read\n- Write\n- Edit\npolicy: documentation\n'
  };
  
  if (template) {
    template.agents.forEach(agent => {
      const agentConfig = generateAgentConfig(agent, template);
      baseAgents[`${agent}.md`] = agentConfig;
    });
  } else {
    // Default agents for unknown projects
    baseAgents['db-migrator.md'] = 'name: db-migrator\nrole: database\ntools:\n- Read\n- Grep\npolicy: least-privilege\n';
    baseAgents['infra-reviewer.md'] = 'name: infra-reviewer\nrole: infrastructure\ntools:\n- Read\n- Grep\npolicy: minimal\n';
  }
  
  return baseAgents;
}

function generateAgentConfig(agentName: string, template: ProjectTemplate): string {
  const agentConfigs: Record<string, any> = {
    'frontend-specialist-agent': {
      name: 'frontend-specialist-agent',
      role: 'frontend-development',
      tools: ['Read', 'Write', 'Edit', 'MultiEdit', 'Bash'],
      specialization: template.framework || 'frontend',
      policy: 'frontend-development'
    },
    'api-builder-agent': {
      name: 'api-builder-agent',
      role: 'api-development',
      tools: ['Read', 'Write', 'Edit', 'MultiEdit', 'Bash'],
      specialization: 'REST API',
      policy: 'api-development'
    },
    'database-architect-agent': {
      name: 'database-architect-agent',
      role: 'database-design',
      tools: ['Read', 'Write', 'Edit'],
      specialization: 'database-architecture',
      policy: 'database-management'
    },
    'testing-validation-agent': {
      name: 'testing-validation-agent',
      role: 'testing',
      tools: ['Read', 'Write', 'Bash'],
      specialization: 'automated-testing',
      policy: 'testing'
    },
    'security-scanner-agent': {
      name: 'security-scanner-agent',
      role: 'security',
      tools: ['Read', 'Grep', 'Bash'],
      specialization: 'security-analysis',
      policy: 'security-scanning'
    }
  };
  
  const config = agentConfigs[agentName] || {
    name: agentName,
    role: 'general',
    tools: ['Read', 'Grep'],
    policy: 'least-privilege'
  };
  
  return Object.entries(config)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join('\n- ') : value}`)
    .join('\n');
}

function buildJustfile(template?: ProjectTemplate): string {
  const baseCommands = [
    'default: test',
    '',
    'test:',
    '  npm test || python -m pytest || cargo test || flutter test || echo "No tests"',
    '',
    'lint:',
    '  npm run lint || flake8 . || cargo clippy || dart analyze || echo "No lint script"',
    '',
    'build:',
    '  npm run build || python setup.py build || cargo build || flutter build apk || echo "No build script"',
    '',
    'format:',
    '  npm run format || black . || cargo fmt || dart format . || prettier --write . || echo "No format script"',
    ''
  ];
  
  if (template) {
    if (template.type === 'mobile') {
      baseCommands.push(
        'android:',
        '  npm run android || react-native run-android || flutter run',
        '',
        'ios:',
        '  npm run ios || react-native run-ios || flutter run',
        ''
      );
    }
    
    if (template.bestPractices.cicd) {
      baseCommands.push(
        'deploy:',
        '  echo "Run deployment pipeline here"',
        '',
        'release:',
        '  echo "Run release pipeline here"'
      );
    }
  }
  
  return baseCommands.join('\n');
}

function buildCIWorkflow(template: ProjectTemplate): string {
  const workflowName = `${template.name} CI/CD`;
  const nodeVersion = '18';
  const pythonVersion = '3.11';
  
  const baseWorkflow = [
    `name: ${workflowName}`,
    'on:',
    '  push:',
    '    branches: [ main, develop ]',
    '  pull_request:',
    '    branches: [ main, develop ]',
    '',
    'jobs:',
    '  test:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4'
  ];
  
  if (template.language === 'TypeScript' || template.language === 'JavaScript') {
    baseWorkflow.push(
      `      - name: Setup Node.js`,
      `        uses: actions/setup-node@v4`,
      `        with:`,
      `          node-version: '${nodeVersion}'`,
      `          cache: 'npm'`,
      `      - name: Install dependencies`,
      `        run: npm ci`,
      `      - name: Run linting`,
      `        run: npm run lint`,
      `      - name: Run tests`,
      `        run: npm test`,
      `      - name: Build project`,
      `        run: npm run build`
    );
  } else if (template.language === 'Python') {
    baseWorkflow.push(
      `      - name: Setup Python`,
      `        uses: actions/setup-python@v4`,
      `        with:`,
      `          python-version: '${pythonVersion}'`,
      `      - name: Install dependencies`,
      `        run: |`,
      `          python -m pip install --upgrade pip`,
      `          pip install -r requirements.txt`,
      `      - name: Run linting`,
      `        run: flake8 .`,
      `      - name: Run tests`,
      `        run: pytest`
    );
  } else if (template.language === 'Rust') {
    baseWorkflow.push(
      `      - name: Setup Rust`,
      `        uses: actions-rs/toolchain@v1`,
      `        with:`,
      `          toolchain: stable`,
      `      - name: Run tests`,
      `        run: cargo test`,
      `      - name: Run clippy`,
      `        run: cargo clippy -- -D warnings`,
      `      - name: Build project`,
      `        run: cargo build --release`
    );
  } else if (template.language === 'Dart') {
    baseWorkflow.push(
      `      - name: Setup Flutter`,
      `        uses: subosito/flutter-action@v2`,
      `        with:`,
      `          flutter-version: '3.13.0'`,
      `      - name: Get dependencies`,
      `        run: flutter pub get`,
      `      - name: Run analyzer`,
      `        run: flutter analyze`,
      `      - name: Run tests`,
      `        run: flutter test`
    );
  }
  
  if (template.bestPractices.security) {
    baseWorkflow.push(
      ``,
      `  security:`,
      `    runs-on: ubuntu-latest`,
      `    steps:`,
      `      - uses: actions/checkout@v4`,
      `      - name: Run security scan`,
      `        uses: securecodewarrior/github-action-add-sarif@v1`,
      `        with:`,
      `          sarif-file: 'security-scan.sarif'`
    );
  }
  
  return baseWorkflow.join('\n');
}

function buildInfraWorkflow(): string {
  return [
    'name: Infra Checks',
    'on:',
    '  pull_request:',
    '    branches: [ main, develop ]',
    'jobs:',
    '  infra:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - name: List IaC files',
    '        run: |',
    '          ls -R k8s || true',
    '          ls -R terraform || true'
  ].join('\n');
}

// Template content generators
function generateFileContent(filePath: string, template: ProjectTemplate, description: string): string {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  
  // TypeScript/JavaScript files
  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    if (fileName === 'App.tsx' || fileName === 'App.jsx') {
      return generateReactApp(template);
    }
    if (fileName === 'main.tsx' || fileName === 'index.ts') {
      return generateEntryPoint(template);
    }
    if (filePath.includes('api/') || filePath.includes('routes/')) {
      return generateAPIRoute(template);
    }
  }
  
  // Python files
  if (ext === '.py') {
    if (fileName === 'manage.py') {
      return generateDjangoManage();
    }
    if (fileName === 'settings.py') {
      return generateDjangoSettings();
    }
  }
  
  // Rust files
  if (ext === '.rs') {
    if (fileName === 'main.rs') {
      return generateRustMain(template);
    }
  }
  
  // Dart files
  if (ext === '.dart') {
    if (fileName === 'main.dart') {
      return generateFlutterMain(template);
    }
  }
  
  // HTML files
  if (ext === '.html') {
    return generateHTMLTemplate(template);
  }
  
  return `// ${description}\n// Generated by Claude Flow 2.0\n\nexport default function() {\n  // TODO: Implement ${description.toLowerCase()}\n}\n`;
}

function generateConfigContent(configFile: string, template: ProjectTemplate, description: string): string {
  switch (configFile) {
    case 'tsconfig.json':
      return JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: template.framework === 'Vite',
          declaration: template.type === 'backend',
          outDir: './dist',
          jsx: template.framework === 'React' ? 'react-jsx' : undefined,
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src'],
        references: [{ path: './tsconfig.node.json' }]
      }, null, 2);
      
    case 'vite.config.ts':
      return `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: 3000,\n    open: true\n  },\n  build: {\n    outDir: 'dist',\n    sourcemap: true\n  }\n})\n`;
      
    case '.eslintrc.json':
      return JSON.stringify({
        env: {
          browser: template.type === 'frontend',
          es2020: true,
          node: true
        },
        extends: [
          'eslint:recommended',
          template.language === 'TypeScript' ? '@typescript-eslint/recommended' : null,
          template.framework === 'React' ? 'plugin:react-hooks/recommended' : null
        ].filter(Boolean),
        parser: template.language === 'TypeScript' ? '@typescript-eslint/parser' : undefined,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: template.framework === 'React' ? { jsx: true } : undefined
        },
        plugins: [
          template.language === 'TypeScript' ? '@typescript-eslint' : null,
          template.framework === 'React' ? 'react-refresh' : null
        ].filter(Boolean),
        rules: {
          'no-unused-vars': 'warn',
          'no-console': 'warn'
        }
      }, null, 2);
      
    case '.prettierrc':
      return JSON.stringify({
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 80,
        tabWidth: 2
      }, null, 2);

    case 'rustfmt.toml':
      return `max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
use_small_heuristics = "Default"
indent_style = "Block"
wrap_comments = false
format_code_in_doc_comments = false
comment_width = 80
normalize_comments = false
license_template_path = ""
format_strings = false
format_macro_matchers = false
format_macro_bodies = true
empty_item_single_line = true
struct_lit_single_line = true
fn_single_line = false
where_single_line = false
imports_indent = "Block"
imports_layout = "Mixed"
merge_imports = false
reorder_imports = true
reorder_modules = true
reorder_impl_items = false
type_punctuation_density = "Wide"
space_before_colon = false
space_after_colon = true
spaces_around_ranges = false
binop_separator = "Front"
remove_nested_parens = true
combine_control_expr = true
overflow_delimited_expr = false
struct_field_align_threshold = 0
enum_discrim_align_threshold = 0
match_arm_blocks = true
force_multiline_blocks = false
fn_args_layout = "Tall"
brace_style = "SameLineWhere"
control_brace_style = "AlwaysSameLine"
trailing_semicolon = true
trailing_comma = "Vertical"
match_block_trailing_comma = false
blank_lines_upper_bound = 1
blank_lines_lower_bound = 0
edition = "2021"
version = "One"
inline_attribute_width = 0
merge_derives = true
use_try_shorthand = false
use_field_init_shorthand = false
force_explicit_abi = true
condense_wildcard_suffixes = false
color = "Auto"
required_version = "1.4.37"
unstable_features = false
disable_all_formatting = false
skip_children = false
hide_parse_errors = false
error_on_line_overflow = false
error_on_unformatted = false
report_todo = "Never"
report_fixme = "Never"
ignore = []
emit_mode = "Files"
make_backup = false
`;

    case 'analysis_options.yaml':
      return `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_single_quotes: true
    avoid_print: false
    avoid_unnecessary_containers: true
    avoid_web_libraries_in_flutter: true
    no_logic_in_create_state: true
    prefer_const_constructors: true
    prefer_const_declarations: true
    prefer_const_literals_to_create_immutables: true
    sized_box_for_whitespace: true
    use_build_context_synchronously: true
    use_full_hex_values_for_flutter_colors: true
    use_super_parameters: true

analyzer:
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
  errors:
    invalid_annotation_target: ignore
`;
      
    default:
      return `# ${description}\n# Generated by Claude Flow 2.0\n`;
  }
}

function generateMCPConfig(template: ProjectTemplate): object {
  const mcpConfig = {
    mcpServers: {} as Record<string, any>
  };
  
  // Essential servers for all projects
  mcpConfig.mcpServers['context7'] = { enabled: true };
  mcpConfig.mcpServers['filesystem'] = { enabled: true };
  mcpConfig.mcpServers['git'] = { enabled: true };
  
  // Add template-specific servers
  template.mcpServers.forEach(server => {
    mcpConfig.mcpServers[server] = { enabled: true };
  });
  
  return mcpConfig;
}

function generateReactApp(template: ProjectTemplate): string {
  return `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${template.name}</h1>
        <p>
          Generated with Claude Flow 2.0 scaffolding system.
        </p>
      </header>
    </div>
  )
}

export default App
`;
}

function generateEntryPoint(template: ProjectTemplate): string {
  if (template.framework === 'React') {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  }
  
  if (template.framework === 'Express') {
    return `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${template.name} API' })
})

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})
`;
  }
  
  return `// Entry point for ${template.name}
// Generated by Claude Flow 2.0

console.log('Welcome to ${template.name}!')
`;
}

function generateAPIRoute(template: ProjectTemplate): string {
  return `import { Request, Response } from 'express'

// API route handler
// Generated by Claude Flow 2.0

export const handler = async (req: Request, res: Response) => {
  try {
    // TODO: Implement route logic
    res.json({ message: 'Route implemented successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
`;
}

function generateRustMain(template: ProjectTemplate): string {
  return `use axum::{response::Html, routing::get, Router};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(handler));

    println!("🚀 ${template.name} server starting on port 3000");
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();
        
    axum::serve(listener, app).await.unwrap();
}

async fn handler() -> Html<&'static str> {
    Html("<h1>Welcome to ${template.name}</h1><p>Generated with Claude Flow 2.0</p>")
}
`;
}

function generateFlutterMain(template: ProjectTemplate): string {
  return `import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${template.name}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(title: '${template.name}'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text('Welcome to your Flutter app!'),
            const Text('Generated with Claude Flow 2.0'),
            const SizedBox(height: 20),
            Text(
              'Button pressed:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
`;
}

function generateDjangoManage(): string {
  return `#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


if __name__ == '__main__':
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
`;
}

function generateDjangoSettings(): string {
  return `"""
Django settings for project.
Generated by Claude Flow 2.0.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')

DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'project.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
`;
}

function generateHTMLTemplate(template: ProjectTemplate): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${template.name}</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
}

function generateProjectReadme(template: ProjectTemplate, projectName: string): string {
  return `# ${projectName}

${template.name} project scaffolded with Claude Flow 2.0.

## Getting Started

### Prerequisites

- ${template.language === 'Python' ? 'Python 3.11+' : template.language === 'Rust' ? 'Rust 1.70+' : template.language === 'Dart' ? 'Flutter 3.13+' : 'Node.js 18+'}
${template.language === 'JavaScript' || template.language === 'TypeScript' ? '- npm or yarn' : ''}

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${projectName}

# Install dependencies
${template.language === 'Python' ? 'pip install -r requirements.txt' : template.language === 'Rust' ? 'cargo build' : template.language === 'Dart' ? 'flutter pub get' : 'npm install'}
\`\`\`

### Development

\`\`\`bash
# Start development server
${template.scripts.dev || 'npm run dev'}
\`\`\`

### Building

\`\`\`bash
# Build for production
${template.scripts.build || 'npm run build'}
\`\`\`

### Testing

\`\`\`bash
# Run tests
${template.scripts.test || 'npm test'}
\`\`\`

## Project Structure

\`\`\`
${Object.keys(template.structure).map(path => path).join('\n')}
\`\`\`

## Features

- ✅ ${template.framework} setup
- ✅ ${template.language} support
${template.bestPractices.linting ? '- ✅ ESLint configuration' : ''}
${template.bestPractices.testing ? '- ✅ Testing framework' : ''}
${template.bestPractices.security ? '- ✅ Security best practices' : ''}
${template.bestPractices.cicd ? '- ✅ CI/CD pipeline' : ''}

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Generated with Claude Flow 2.0 scaffolding system*
`;
}

function generateContributingGuide(template: ProjectTemplate): string {
  return `# Contributing to this project

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: \`${template.language === 'Python' ? 'pip install -r requirements.txt' : template.language === 'Rust' ? 'cargo build' : template.language === 'Dart' ? 'flutter pub get' : 'npm install'}\`
4. Create a feature branch

## Code Style

- Follow ${template.language} best practices
${template.bestPractices.linting ? '- Run linting: `npm run lint`' : ''}
- Format code before committing

## Testing

${template.bestPractices.testing ? '- Write tests for new features\n- Ensure all tests pass: `npm test`' : '- Add tests when possible'}

## Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure CI pipeline passes
4. Request review

---

*Generated with Claude Flow 2.0*
`;
}

function generateEnvTemplate(template: ProjectTemplate): string {
  const envVars = [];
  
  if (template.type === 'backend' || template.type === 'fullstack') {
    envVars.push('# Database');
    envVars.push('DATABASE_URL=postgresql://user:pass@localhost:5432/dbname');
    envVars.push('');
    envVars.push('# Security');
    envVars.push('SECRET_KEY=your-secret-key-here');
    envVars.push('JWT_SECRET=your-jwt-secret-here');
    envVars.push('');
  }
  
  if (template.type === 'frontend' || template.type === 'fullstack') {
    envVars.push('# API');
    envVars.push('REACT_APP_API_URL=http://localhost:3001/api');
    envVars.push('');
  }
  
  envVars.push('# Environment');
  envVars.push('NODE_ENV=development');
  envVars.push('PORT=3000');
  
  return envVars.join('\n');
}

function generateGitignore(template: ProjectTemplate): string {
  const ignorePatterns = [
    '# Dependencies',
    'node_modules/',
    '__pycache__/',
    '*.pyc',
    '',
    '# Build outputs',
    'dist/',
    'build/',
    '*.tsbuildinfo',
    'target/',
    '',
    '# Environment',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Logs',
    'logs/',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*'
  ];
  
  if (template.language === 'Python') {
    ignorePatterns.push('', '# Python specific', '*.egg-info/', 'venv/', 'env/');
  }
  
  if (template.framework === 'Next.js') {
    ignorePatterns.push('', '# Next.js', '.next/');
  }
  
  if (template.language === 'Rust') {
    ignorePatterns.push('', '# Rust specific', 'Cargo.lock', 'target/');
  }
  
  if (template.language === 'Dart') {
    ignorePatterns.push('', '# Flutter/Dart specific', '.dart_tool/', '.flutter-plugins', '.flutter-plugins-dependencies', '.packages', '.pub-cache/', '.pub/', 'build/');
  }
  
  return ignorePatterns.join('\n');
}

function generateClaudeConfig(template: ProjectTemplate | undefined, options: ScaffoldOptions, fingerprint: any): string {
  const complexity = calculateComplexity(template, fingerprint);
  const approach = complexity > 50 ? 'hive-mind' : 'simple';
  const agentCount = template ? Math.min(template.agents.length, 6) : 4;
  
  return `# Claude Configuration - ${options.projectName} (${template?.type || 'unknown'} project)

## Project Analysis
- **Complexity Score**: ${complexity}/100
- **Stage**: active
- **Project Type**: ${template?.type || 'unknown'}
- **Technology**: ${template?.framework || 'unknown'} (${template?.language || 'unknown'})
- **Selected Approach**: ${approach}
- **Command**: \`npx --yes claude-flow@2.0.0 ${approach} spawn "${options.projectName}" --agents ${agentCount} --claude\`

## Technology Stack
${template ? `### Framework
- ${template.framework}

### Language
- ${template.language}

### Dependencies
${template.dependencies.map(dep => `- ${dep}`).join('\n')}
` : ''}
## Sub-Agent Architecture
${template ? template.agents.map((agent, i) => `### ${i + 1}. ${agent}
- Specialized for ${template.type} development
- Context window: 200k tokens
`).join('\n') : ''}
## MCP Server Configuration
${template ? `### Active Servers (${template.mcpServers.length})
${template.mcpServers.map(server => `- ${server}: {"enabled":true}`).join('\n')}
` : ''}
## Project-Specific Instructions
${template ? generateProjectInstructions(template) : '- Follow general development best practices\n- Maintain code quality and documentation'}

## Quality Metrics
- **Test Coverage Target**: ${template?.bestPractices.testing ? '80%+' : 'N/A'}
- **Security Score**: ${template?.bestPractices.security ? 'Zero critical vulnerabilities' : 'Basic security'}
- **Documentation Coverage**: ${template?.bestPractices.documentation ? '100%' : 'Basic documentation'}

---

*Generated by Claude Flow 2.0 Scaffolding System*
*Date: ${new Date().toISOString()}*
`;
}

function calculateComplexity(template: ProjectTemplate | undefined, fingerprint: any): number {
  let complexity = 30; // Base complexity
  
  if (!template) return complexity;
  
  // Add complexity based on project type
  const typeComplexity = {
    'frontend': 20,
    'backend': 40,
    'fullstack': 60,
    'mobile': 50,
    'desktop': 45,
    'data-science': 35,
    'devops': 70
  };
  
  complexity += typeComplexity[template.type] || 20;
  
  // Add complexity for features
  if (template.bestPractices.testing) complexity += 10;
  if (template.bestPractices.security) complexity += 10;
  if (template.bestPractices.cicd) complexity += 15;
  if (template.agents.length > 3) complexity += 10;
  
  return Math.min(complexity, 100);
}

function generateProjectInstructions(template: ProjectTemplate): string {
  const instructions = [];
  
  switch (template.type) {
    case 'frontend':
      instructions.push(
        '- Use functional components with hooks exclusively',
        '- Implement proper error boundaries',
        '- Follow accessibility guidelines (WCAG 2.1)',
        '- Optimize bundle size with code splitting'
      );
      break;
      
    case 'backend':
      instructions.push(
        '- Follow RESTful API design principles',
        '- Implement proper error handling and logging',
        '- Use middleware for cross-cutting concerns',
        '- Validate all inputs and sanitize outputs'
      );
      break;
      
    case 'fullstack':
      instructions.push(
        '- Maintain clear separation between client and server',
        '- Implement proper API versioning',
        '- Use environment variables for configuration',
        '- Follow security best practices'
      );
      break;
      
    case 'mobile':
      instructions.push(
        '- Follow platform-specific design guidelines',
        '- Implement proper navigation patterns',
        '- Optimize for performance and battery life',
        '- Handle different screen sizes and orientations'
      );
      break;
      
    default:
      instructions.push(
        '- Follow language-specific best practices',
        '- Maintain clean architecture patterns',
        '- Implement comprehensive testing',
        '- Document all public APIs'
      );
  }
  
  return instructions.map(instruction => instruction).join('\n');
}

// CLI interface functions
export function listTemplates(): void {
  console.log('\n🚀 Available Claude Flow 2.0 Project Templates:\n');
  
  const categories = {
    'Frontend': ['react-typescript'],
    'Full-Stack': ['next-fullstack'],
    'Backend': ['node-express', 'python-django', 'rust-backend'],
    'Mobile': ['react-native', 'flutter-mobile']
  };
  
  Object.entries(categories).forEach(([category, templates]) => {
    console.log(`\n📁 ${category}:`);
    templates.forEach(templateKey => {
      const template = PROJECT_TEMPLATES[templateKey];
      if (template) {
        console.log(`  • ${templateKey} - ${template.name} (${template.language})`);
      }
    });
  });
  
  console.log('\n💡 Usage:');
  console.log('  npx claude-flow@2.0.0 create my-app --template react-typescript');
  console.log('  npx claude-flow@2.0.0 init --enhance (for existing projects)');
  console.log('');
}

export function getTemplateInfo(templateName: string): ProjectTemplate | null {
  return PROJECT_TEMPLATES[templateName] || null;
}

export { PROJECT_TEMPLATES };