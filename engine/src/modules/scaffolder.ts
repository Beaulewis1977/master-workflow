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

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function exists(p: string): boolean { try { return fs.existsSync(p); } catch { return false; } }

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

function buildJustfile(): string {
  return [
    'default: test',
    '',
    'test:',
    '  npm test || echo "No tests"',
    '',
    'lint:',
    '  npm run lint || echo "No lint script"',
    '',
    'build:',
    '  npm run build || echo "No build script"',
    '',
    'e2e:',
    '  echo "Run E2E tests here"',
    '',
    'release:',
    '  echo "Run release pipeline here"'
  ].join('\n');
}

function buildNpmScriptsSnippet(): string {
  const scripts = {
    scripts: {
      test: 'node test/test-runner.js',
      lint: 'node scripts/lint-if-available.js',
      build: 'echo "no build"',
      e2e: 'echo "no e2e"',
      release: 'echo "no release"'
    }
  };
  return JSON.stringify(scripts, null, 2);
}

function buildAgents(): Record<string, string> {
  return {
    'db-migrator.md': 'name: db-migrator\nrole: database\ntools:\n- Read\n- Grep\npolicy: least-privilege\n',
    'infra-reviewer.md': 'name: infra-reviewer\nrole: infrastructure\ntools:\n- Read\n- Grep\npolicy: minimal\n'
  };
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

export function createScaffoldPlan(root = process.cwd()): ScaffoldPlan {
  const fingerprint = scanEnvironment();
  const monorepo = detectMonorepo(root);
  const files: ScaffoldFile[] = [];
  const conflicts: string[] = [];

  // justfile
  const justTarget = 'Justfile';
  if (exists(path.join(root, justTarget))) conflicts.push(justTarget);
  else files.push({ relativePath: justTarget, content: buildJustfile() });

  // npm scripts snippet
  const scriptsTarget = '.ai-workflow/scaffold/npm-scripts.json';
  files.push({ relativePath: scriptsTarget, content: buildNpmScriptsSnippet() });

  // agents
  const agents = buildAgents();
  for (const [name, content] of Object.entries(agents)) {
    const target = `.claude/agents/${name}`;
    if (exists(path.join(root, target))) conflicts.push(target);
    else files.push({ relativePath: target, content });
  }

  // workflows (if containers or k8s detected)
  if (fingerprint.containers.includes('k8s') || fingerprint.containers.includes('dockerfile')) {
    const wfPath = '.github/workflows/infra.yml';
    if (exists(path.join(root, wfPath))) conflicts.push(wfPath);
    else files.push({ relativePath: wfPath, content: buildInfraWorkflow() });
  }

  // monorepo note
  if (monorepo) {
    files.push({ relativePath: '.ai-workflow/scaffold/README-MONOREPO.md', content: '# Monorepo detected\n\nConsider per-package scripts and CI matrix.' });
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

// Enhanced template system
export const AVAILABLE_TEMPLATES = {
  'fullstack-modern': {
    name: 'Modern Full-Stack Template',
    description: 'Production-ready full-stack app with React 18, Next.js 14, Rust backend, real-time features',
    type: 'fullstack' as const,
    features: ['typescript', 'react-18', 'nextjs-14', 'rust-backend', 'supabase-auth', 'real-time', 'websockets'],
    path: 'templates/fullstack-modern'
  },
  'react-spa': {
    name: 'React Single Page Application',
    description: 'Modern React SPA with TypeScript, Vite, and essential tooling',
    type: 'frontend' as const,
    features: ['typescript', 'react-18', 'vite', 'tailwindcss', 'zustand'],
    path: 'templates/react-spa'
  },
  'nextjs-app': {
    name: 'Next.js Application',
    description: 'Next.js 14 app with App Router, TypeScript, and Tailwind CSS',
    type: 'frontend' as const,
    features: ['typescript', 'nextjs-14', 'tailwindcss', 'app-router'],
    path: 'templates/nextjs-app'
  },
  'rust-api': {
    name: 'Rust API Server',
    description: 'High-performance Rust API with Axum, PostgreSQL, and Redis',
    type: 'backend' as const,
    features: ['rust', 'axum', 'postgresql', 'redis', 'jwt-auth'],
    path: 'templates/rust-api'
  },
  'node-api': {
    name: 'Node.js API Server',
    description: 'Express.js API with TypeScript, PostgreSQL, and comprehensive tooling',
    type: 'backend' as const,
    features: ['typescript', 'express', 'postgresql', 'jwt-auth', 'swagger'],
    path: 'templates/node-api'
  }
} as const;

export type TemplateType = keyof typeof AVAILABLE_TEMPLATES;

export function createFromTemplate(templateName: TemplateType, projectName: string, targetDir: string = process.cwd()) {
  const template = AVAILABLE_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }

  const templatePath = path.join(__dirname, '../../../', template.path);
  if (!exists(templatePath)) {
    throw new Error(`Template directory not found: ${templatePath}`);
  }

  console.log(`Creating ${template.name} project: ${projectName}`);
  
  // Copy template files
  const applied: string[] = [];
  const skipped: string[] = [];
  
  function copyTemplate(srcDir: string, destDir: string, relativePath = '') {
    const items = fs.readdirSync(srcDir);
    
    for (const item of items) {
      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);
      const itemRelativePath = path.join(relativePath, item);
      
      // Skip template config file
      if (item === 'template.config.json') continue;
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        ensureDir(destPath);
        copyTemplate(srcPath, destPath, itemRelativePath);
      } else {
        if (exists(destPath)) {
          skipped.push(itemRelativePath);
          continue;
        }
        
        // Process template variables
        let content = fs.readFileSync(srcPath, 'utf8');
        content = content.replace(/\{\{projectName\}\}/g, projectName);
        
        fs.writeFileSync(destPath, content, 'utf8');
        applied.push(itemRelativePath);
      }
    }
  }
  
  const projectDir = path.join(targetDir, projectName);
  ensureDir(projectDir);
  
  copyTemplate(templatePath, projectDir);
  
  return {
    template: template.name,
    projectName,
    projectDir,
    applied,
    skipped,
    features: template.features
  };
}

export async function scaffoldInteractive(options: Partial<ScaffoldOptions> = {}) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question: string): Promise<string> => {
    return new Promise(resolve => rl.question(question, resolve));
  };

  try {
    console.log('🚀 Claude Flow 2.0 - Interactive Project Scaffolding\n');
    
    // Project name
    const projectName = options.projectName || await ask('📝 Project name: ');
    if (!projectName.trim()) {
      throw new Error('Project name is required');
    }
    
    // Template selection
    console.log('\n📚 Available templates:');
    Object.entries(AVAILABLE_TEMPLATES).forEach(([key, template], index) => {
      console.log(`  ${index + 1}. ${template.name} (${template.type})`);
      console.log(`     ${template.description}`);
      console.log(`     Features: ${template.features.join(', ')}\n`);
    });
    
    const templateChoice = options.template || await ask('🎨 Choose template (1-5): ');
    const templateKeys = Object.keys(AVAILABLE_TEMPLATES);
    const selectedTemplate = templateKeys[parseInt(templateChoice) - 1] as TemplateType;
    
    if (!selectedTemplate || !AVAILABLE_TEMPLATES[selectedTemplate]) {
      throw new Error('Invalid template selection');
    }
    
    // Additional options
    const installDeps = options.installDeps ?? (await ask('📦 Install dependencies? (y/N): ')).toLowerCase() === 'y';
    const initGit = options.initGit ?? (await ask('🔧 Initialize git repository? (y/N): ')).toLowerCase() === 'y';
    
    console.log('\n🔨 Creating project...');
    
    // Create project from template
    const result = createFromTemplate(selectedTemplate, projectName);
    
    console.log(`✅ Created ${result.applied.length} files`);
    if (result.skipped.length > 0) {
      console.log(`⚠️  Skipped ${result.skipped.length} existing files`);
    }
    
    // Install dependencies
    if (installDeps) {
      console.log('\n📦 Installing dependencies...');
      
      const template = AVAILABLE_TEMPLATES[selectedTemplate];
      if (template.type === 'fullstack') {
        // Install frontend dependencies
        await execAsync('npm install', { cwd: path.join(result.projectDir, 'frontend') });
        console.log('✅ Frontend dependencies installed');
        
        // Build backend (Rust)
        await execAsync('cargo check', { cwd: path.join(result.projectDir, 'backend') });
        console.log('✅ Backend dependencies checked');
      } else if (template.type === 'frontend') {
        await execAsync('npm install', { cwd: result.projectDir });
        console.log('✅ Dependencies installed');
      } else if (template.type === 'backend' && template.features.includes('rust')) {
        await execAsync('cargo check', { cwd: result.projectDir });
        console.log('✅ Dependencies checked');
      } else {
        await execAsync('npm install', { cwd: result.projectDir });
        console.log('✅ Dependencies installed');
      }
    }
    
    // Initialize git
    if (initGit) {
      console.log('\n🔧 Initializing git repository...');
      await execAsync('git init', { cwd: result.projectDir });
      await execAsync('git add .', { cwd: result.projectDir });
      await execAsync('git commit -m "Initial commit from Claude Flow template"', { cwd: result.projectDir });
      console.log('✅ Git repository initialized');
    }
    
    // Success message
    console.log('\n🎉 Project created successfully!');
    console.log(`\n📁 Project location: ${result.projectDir}`);
    console.log('\n🚀 Next steps:');
    console.log(`   cd ${projectName}`);
    
    if (template.type === 'fullstack') {
      console.log('   cp .env.example .env');
      console.log('   # Configure environment variables');
      console.log('   docker-compose up -d');
      console.log('\n🌐 URLs:');
      console.log('   Frontend: http://localhost:3000');
      console.log('   Backend:  http://localhost:8000');
      console.log('   Database: http://localhost:8080 (Adminer)');
    } else if (!installDeps) {
      console.log('   npm install');
      console.log('   npm run dev');
    } else {
      console.log('   npm run dev');
    }
    
    return result;
    
  } finally {
    rl.close();
  }
}


