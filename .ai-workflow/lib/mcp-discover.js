#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function which(cmd) {
  const paths = process.env.PATH.split(path.delimiter);
  for (const p of paths) {
    const full = path.join(p, cmd + (process.platform === 'win32' ? '.exe' : ''));
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function parseMcpEnv(env) {
  try {
    return JSON.parse(env);
  } catch {}
  const out = {};
  for (const part of env.split(',')) {
    const [name, url] = part.split('=').map(s => s.trim());
    if (name) out[name] = { enabled: true, url: url || '' };
  }
  return out;
}

function discover() {
  const registry = { servers: {}, tools: [] };
  registry.meta = { autoDiscover: true, generatedAt: new Date().toISOString() };

  // From env MCP_SERVERS (JSON or CSV)
  if (process.env.MCP_SERVERS) {
    registry.servers = parseMcpEnv(process.env.MCP_SERVERS);
  }

  // Baseline servers
  registry.servers.filesystem = registry.servers.filesystem || { enabled: true, root: '.' };
  registry.servers.http = registry.servers.http || { enabled: true };

  // Git server if git is available
  if (which('git')) {
    registry.servers.git = registry.servers.git || { enabled: true, repo: 'auto' };
  }

  // Tools
  registry.tools.push({ name: 'grep', type: 'builtin', description: 'Search files' });
  registry.tools.push({ name: 'httpClient', type: 'mcp', server: 'http' });
  registry.tools.push({ name: 'fs', type: 'mcp', server: 'filesystem' });
  if (registry.servers.git && registry.servers.git.enabled) {
    registry.tools.push({ name: 'git', type: 'mcp', server: 'git' });
  }

  return registry;
}

function main() {
  const outPath = process.argv[2] || path.join(process.cwd(), '.ai-workflow', 'configs', 'mcp-registry.json');
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  const registry = discover();
  fs.writeFileSync(outPath, JSON.stringify(registry, null, 2));
  console.log('MCP registry written to', outPath);
}

if (require.main === module) main();
