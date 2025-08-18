import fs from 'fs';
import path from 'path';
import { scanEnvironment } from './env-scanner.js';

export type CustomizeOptions = {
  specName?: string; // e.g., 2025-08-12-initial
  includeAgents?: boolean;
};

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeFileSafe(p: string, content: string) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
}

function todaySlug(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function generateProjectDocs(root = process.cwd(), opts: CustomizeOptions = {}) {
  const fingerprint = scanEnvironment();
  const slug = opts.specName || `${todaySlug()}-customization`;

  const agentOsRoot = path.join(root, '.agent-os');
  const productDir = path.join(agentOsRoot, 'product');
  const specsDir = path.join(agentOsRoot, 'specs', slug);

  ensureDir(productDir);
  ensureDir(specsDir);

  // Product docs
  writeFileSafe(path.join(productDir, 'roadmap.md'), `# Roadmap\n\n- Auto-generated on ${new Date().toISOString()}\n- Focus: ${fingerprint.frameworks.join(', ') || 'General'}\n`);
  writeFileSafe(path.join(productDir, 'decisions.md'), `# Decisions\n\n- Package managers: ${fingerprint.pkgManagers.join(', ') || 'n/a'}\n- CI: ${fingerprint.ciConfigs.join(', ') || 'n/a'}\n`);

  // Spec docs
  writeFileSafe(path.join(specsDir, 'SRD.md'), `# Software Requirements Document\n\nDetected languages: ${fingerprint.languages.join(', ')}\nDetected frameworks: ${fingerprint.frameworks.join(', ')}\n`);
  writeFileSafe(path.join(specsDir, 'TECH-SPEC.md'), `# Technical Specification\n\nHost: ${fingerprint.host.platform}/${fingerprint.host.arch}\nContainers: ${fingerprint.containers.join(', ') || 'none'}\n`);
  writeFileSafe(path.join(specsDir, 'TASKS.md'), `# Tasks\n\n- [ ] Set up CI for Node ${fingerprint.pkgManagers.includes('npm') ? '18/20' : 'current'}\n- [ ] Add security scan\n- [ ] Document deployment\n`);
  writeFileSafe(path.join(specsDir, 'LITE.md'), `# Lite Summary\n\nSummary hash: ${fingerprint.hash}\n`);

  const written: string[] = [
    path.join(productDir, 'roadmap.md'),
    path.join(productDir, 'decisions.md'),
    path.join(specsDir, 'SRD.md'),
    path.join(specsDir, 'TECH-SPEC.md'),
    path.join(specsDir, 'TASKS.md'),
    path.join(specsDir, 'LITE.md'),
  ];

  if (opts.includeAgents) {
    const claudeAgentsDir = path.join(root, '.claude', 'agents');
    ensureDir(claudeAgentsDir);
    const agents: Record<string, string> = {
      'test-runner.md': `name: test-runner\nrole: testing\ntools:\n- Read\n- Grep\npolicy: minimal\n`,
      'code-reviewer.md': `name: code-reviewer\nrole: review\ntools:\n- Read\n- Diff\npolicy: minimal\n`,
      'security-scanner.md': `name: security-scanner\nrole: security\ntools:\n- Read\n- Grep\npolicy: least-privilege\n`,
      'debugger.md': `name: debugger\nrole: debug\ntools:\n- Read\n- Search\npolicy: minimal\n`,
    };
    for (const [file, content] of Object.entries(agents)) {
      const p = path.join(claudeAgentsDir, file);
      writeFileSafe(p, content);
      written.push(p);
    }
  }

  return { written, specSlug: slug, fingerprint };
}


