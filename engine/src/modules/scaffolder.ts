import fs from 'fs';
import path from 'path';
import { scanEnvironment } from './env-scanner.js';

export type ScaffoldFile = { relativePath: string; content: string };
export type ScaffoldPlan = { files: ScaffoldFile[]; conflicts: string[]; monorepo: boolean };

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


