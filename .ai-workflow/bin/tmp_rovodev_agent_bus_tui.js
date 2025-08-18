#!/usr/bin/env node
// Minimal TUI dashboard for agent-bus JSONL (no external deps)
// Usage: node tmp_rovodev_agent_bus_tui.js [--type prompt|tool|response|approach_change] [--agent name] [--role name]

const fs = require('fs');
const path = require('path');

const busFile = path.join(process.cwd(), '.ai-workflow', 'logs', 'agent-bus.jsonl');
let filter = { type: null, agent: null, role: null };

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--type') filter.type = process.argv[++i] || null;
  else if (arg === '--agent') filter.agent = process.argv[++i] || null;
  else if (arg === '--role') filter.role = process.argv[++i] || null;
}

function clear() { process.stdout.write('\x1Bc'); }
function header() {
  process.stdout.write('Agent Bus TUI (q to quit)\n');
  process.stdout.write('Filters: ' + JSON.stringify(filter) + '\n');
  process.stdout.write('File: ' + busFile + '\n');
  process.stdout.write(''.padEnd(process.stdout.columns || 80, '-') + '\n');
}

function readTail(n = 200) {
  if (!fs.existsSync(busFile)) return [];
  const lines = fs.readFileSync(busFile, 'utf8').trim().split('\n');
  return lines.slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function matches(ev) {
  if (filter.type && ev.type !== filter.type) return false;
  if (filter.agent && ev.agent !== filter.agent) return false;
  if (filter.role && ev.role !== filter.role) return false;
  return true;
}

function format(ev) {
  const ts = ev.ts || '';
  const t = (ev.type || 'event').toUpperCase().padEnd(15);
  const ag = (ev.agent || '').padEnd(12);
  const rl = (ev.role || '').padEnd(12);
  const payload = ev.prompt || ev.excerpt || ev.tool || '';
  return `[${ts}] ${t} ${ag} ${rl} ${String(payload).replace(/\n/g, ' ').substring(0, process.stdout.columns ? process.stdout.columns - 40 : 120)}`;
}

let running = true;
process.stdin.setRawMode && process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (buf) => {
  const ch = buf.toString('utf8');
  if (ch === 'q' || ch === '\u0003') { // q or Ctrl-C
    running = false; process.exit(0);
  }
});

function tick() {
  if (!running) return;
  clear();
  header();
  const events = readTail(400).filter(matches);
  const start = Math.max(0, events.length - ((process.stdout.rows || 30) - 6));
  for (let i = start; i < events.length; i++) {
    process.stdout.write(format(events[i]) + '\n');
  }
}

setInterval(tick, 1000);
tick();
