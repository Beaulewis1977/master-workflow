#!/usr/bin/env node

const http = require('http');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

function fetchJSON(path = '/') {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function clear() {
  process.stdout.write('\x1Bc');
}

function render(snapshot) {
  clear();
  console.log('Agent Bus TUI');
  console.log('==============');
  console.log(`Now: ${snapshot.now}`);
  console.log('Recent events:');
  (snapshot.events || []).forEach(evt => {
    console.log(`- [${evt.type}] ${evt.ts}`);
  });
}

async function loop() {
  try {
    const snapshot = await fetchJSON('/');
    render(snapshot);
  } catch (e) {
    console.error('Failed to fetch snapshot:', e.message);
  }
  setTimeout(loop, 3000);
}

loop();
