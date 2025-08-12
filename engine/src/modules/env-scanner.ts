import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export type Fingerprint = {
  host: {
    platform: NodeJS.Platform;
    arch: string;
    release: string;
    cpus: number;
    totalMemMB: number;
  };
  distro?: { id?: string; name?: string; version?: string };
  pkgManagers: string[];
  languages: string[];
  frameworks: string[];
  ciConfigs: string[];
  containers: string[];
  hash: string;
};

function safeRead(p: string): string | null {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function fileExists(p: string) { try { return fs.existsSync(p); } catch { return false; } }

function detectDistro(): Fingerprint['distro'] | undefined {
  if (process.platform !== 'linux') return undefined;
  const osr = safeRead('/etc/os-release');
  if (!osr) return undefined;
  const map: Record<string, string> = {};
  osr.split('\n').forEach(line => {
    const m = line.match(/^(\w+)=(.*)$/);
    if (m) map[m[1]] = m[2].replace(/"/g, '');
  });
  return { id: map['ID'], name: map['NAME'], version: map['VERSION_ID'] };
}

function detectPkgManagers(): string[] {
  const managers: string[] = [];
  if (fileExists(path.join(process.cwd(), 'package-lock.json')) || fileExists(path.join(process.cwd(), 'package.json'))) managers.push('npm');
  if (fileExists(path.join(process.cwd(), 'pnpm-lock.yaml'))) managers.push('pnpm');
  if (fileExists(path.join(process.cwd(), 'yarn.lock'))) managers.push('yarn');
  if (fileExists(path.join(process.cwd(), 'requirements.txt')) || fileExists(path.join(process.cwd(), 'pyproject.toml'))) managers.push('pip');
  if (fileExists(path.join(process.cwd(), 'go.mod'))) managers.push('go');
  if (fileExists(path.join(process.cwd(), 'Cargo.toml'))) managers.push('cargo');
  if (fileExists(path.join(process.cwd(), 'pom.xml'))) managers.push('maven');
  if (fileExists(path.join(process.cwd(), 'build.gradle')) || fileExists(path.join(process.cwd(), 'build.gradle.kts'))) managers.push('gradle');
  return managers;
}

function detectLanguages(): string[] {
  const langs = new Set<string>();
  const addIf = (cond: boolean, lang: string) => { if (cond) langs.add(lang); };
  addIf(fileExists('package.json'), 'javascript');
  addIf(fileExists('tsconfig.json') || hasExtRecursive(process.cwd(), '.ts'), 'typescript');
  addIf(fileExists('requirements.txt') || fileExists('pyproject.toml') || hasExtRecursive(process.cwd(), '.py'), 'python');
  addIf(fileExists('go.mod') || hasExtRecursive(process.cwd(), '.go'), 'go');
  addIf(fileExists('Cargo.toml') || hasExtRecursive(process.cwd(), '.rs'), 'rust');
  addIf(fileExists('pom.xml') || hasExtRecursive(process.cwd(), '.java'), 'java');
  return Array.from(langs.values());
}

function hasExtRecursive(root: string, ext: string, maxFiles = 5000): boolean {
  let count = 0;
  const stack = [root];
  const excluded = new Set(['node_modules','.git','.ai-workflow','dist','build','coverage']);
  while (stack.length) {
    const dir = stack.pop()!;
    let entries: string[] = [];
    try { entries = fs.readdirSync(dir); } catch { continue; }
    for (const name of entries) {
      const full = path.join(dir, name);
      let stat: fs.Stats;
      try { stat = fs.statSync(full); } catch { continue; }
      if (stat.isDirectory()) {
        if (!excluded.has(name)) stack.push(full);
      } else if (stat.isFile()) {
        count++;
        if (full.endsWith(ext)) return true;
        if (count > maxFiles) return false;
      }
    }
  }
  return false;
}

function detectFrameworks(): string[] {
  const fws: string[] = [];
  const pkgPath = path.join(process.cwd(), 'package.json');
  let deps: Record<string, string> = {};
  if (fileExists(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    } catch {}
  }
  const has = (k: string) => Object.prototype.hasOwnProperty.call(deps, k);
  if (has('react')) fws.push('react');
  if (has('next')) fws.push('next');
  if (has('vue')) fws.push('vue');
  if (has('nuxt')) fws.push('nuxt');
  if (has('express')) fws.push('express');
  if (has('nest') || has('@nestjs/core')) fws.push('nest');

  // Python frameworks
  const req = safeRead('requirements.txt') || safeRead('pyproject.toml') || '';
  if (/django/i.test(req)) fws.push('django');
  if (/fastapi/i.test(req)) fws.push('fastapi');

  // Java frameworks
  const pom = safeRead('pom.xml') || '';
  if (/spring-framework|spring-boot/i.test(pom)) fws.push('spring');
  return Array.from(new Set(fws));
}

function detectCI(): string[] {
  const ci: string[] = [];
  if (fileExists(path.join(process.cwd(), '.github', 'workflows'))) ci.push('github-actions');
  if (fileExists(path.join(process.cwd(), '.gitlab-ci.yml'))) ci.push('gitlab-ci');
  if (fileExists(path.join(process.cwd(), '.circleci', 'config.yml'))) ci.push('circleci');
  if (fileExists(path.join(process.cwd(), 'Jenkinsfile'))) ci.push('jenkins');
  return ci;
}

function detectContainers(): string[] {
  const c: string[] = [];
  if (fileExists('Dockerfile')) c.push('dockerfile');
  if (fileExists('docker-compose.yml') || fileExists('compose.yaml')) c.push('compose');
  if (fileExists(path.join(process.cwd(), 'k8s'))) c.push('k8s');
  if (fileExists(path.join(process.cwd(), 'charts'))) c.push('helm');
  return c;
}

export function scanEnvironment(): Fingerprint {
  const host = {
    platform: process.platform,
    arch: process.arch,
    release: os.release(),
    cpus: os.cpus()?.length || 0,
    totalMemMB: Math.round(os.totalmem() / (1024 * 1024)),
  };
  const distro = detectDistro();
  const pkgManagers = detectPkgManagers();
  const languages = detectLanguages();
  const frameworks = detectFrameworks();
  const ciConfigs = detectCI();
  const containers = detectContainers();
  const basis = { host, distro, pkgManagers, languages, frameworks, ciConfigs, containers };
  const hash = crypto.createHash('sha256').update(JSON.stringify(basis)).digest('hex');
  return { ...basis, hash };
}


