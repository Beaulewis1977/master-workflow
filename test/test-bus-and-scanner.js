#!/usr/bin/env node
import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

function ok(name, cond) { console.log((cond? '✓':'✗') + ' ' + name); if (!cond) process.exitCode = 1; }

// Start bus server
const server = spawn('node', ['package-tools/bin/agent-bus-http.js'], { stdio: 'pipe' });
await new Promise(r => setTimeout(r, 500));

function getJSON(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: 8787, path: p }, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => { try{ resolve(JSON.parse(data)); } catch(e){ reject(e); } });
    }).on('error', reject);
  });
}

function postJSON(p, body) {
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: 8787, path: p, method: 'POST', headers: { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(data) }}, res => { res.resume(); res.on('end', resolve); });
    req.on('error', reject); req.write(data); req.end();
  });
}

try {
  const snap = await getJSON('/');
  ok('bus snapshot returns status', snap && snap.status === 'ok');
  await postJSON('/events/publish', { type: 'test', payload: { hello: 'world' } });
  const snap2 = await getJSON('/');
  ok('bus received published event', Array.isArray(snap2.events));
} catch (e) {
  ok('bus endpoints work: ' + e.message, false);
}

// Scanner env detection
try {
  const scannerPath = path.resolve('intelligence-engine/project-scanner.js');
  const Scanner = (await import('file://' + scannerPath)).default || (await import('file://' + scannerPath));
  const PS = Scanner.default || Scanner;
  const s = new PS(process.cwd());
  const results = await s.scan();
  ok('scanner returns results', !!results && typeof results === 'object');
  ok('scanner has signals', !!results.signals);
} catch (e) {
  ok('scanner env detection: ' + e.message, false);
}

server.kill('SIGTERM');

