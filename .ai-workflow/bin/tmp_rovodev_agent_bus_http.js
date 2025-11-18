#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const path = require('path');

const busFile = path.join(process.cwd(), '.ai-workflow', 'logs', 'agent-bus.jsonl');
const port = process.env.AGENT_BUS_PORT ? parseInt(process.env.AGENT_BUS_PORT, 10) : 8787;

function readTail(n = 200) {
  if (!fs.existsSync(busFile)) return [];
  const lines = fs.readFileSync(busFile, 'utf8').trim().split('\n');
  const tail = lines.slice(-n);
  return tail.map(l => { try { return JSON.parse(l); } catch { return { raw: l }; } });
}

const server = http.createServer((req, res) => {
  if (req.url === '/ui') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`<!doctype html><html><head><meta charset="utf-8"/><title>Agent Bus</title>
<style>body{font-family:sans-serif} .ev{padding:4px;border-bottom:1px solid #eee} .t{font-weight:bold} .a{color:#06c} .r{color:#690}</style>
</head><body>
<h1>Agent Bus</h1>
<label>Type <select id="type"><option value="">(all)</option><option>prompt</option><option>tool</option><option>response</option><option>approach_change</option></select></label>
<label>Agent <input id=\"agent\" placeholder=\"(any)\"/></label>
<label>Role <input id=\"role\" placeholder=\"(any)\"/></label>
<button id=\"apply\">Apply</button>
<pre id="log"></pre>
<script>
  function connect() {
    const type = document.getElementById('type').value;
    const params = new URLSearchParams(); if(type) params.set('type', type); const agent = document.getElementById('agent').value.trim(); if(agent) params.set('agent', agent); const role = document.getElementById('role').value.trim(); if(role) params.set('role', role);
    const es = new EventSource('/events/stream' + (params.toString()? ('?' + params.toString()):''));
    const log = document.getElementById('log');
    es.onmessage = (e)=>{
      const ev = JSON.parse(e.data); const t = ev.type || 'event';
      const line = '[' + ev.ts + '] ' + t.toUpperCase() + (ev.agent?' '+ev.agent:'') + (ev.role?' '+ev.role:'') + ' ' + (ev.prompt||ev.excerpt||ev.tool||'');
      log.textContent += line.substring(0,200) + '\n'; log.scrollTop = log.scrollHeight;
    };
    es.onerror = ()=>{ es.close(); setTimeout(connect, 2000); };
  }
  document.getElementById('apply').onclick = ()=>{ const params = new URLSearchParams(); const type=document.getElementById('type').value; if(type) params.set('type',type); const agent=document.getElementById('agent').value.trim(); if(agent) params.set('agent',agent); const role=document.getElementById('role').value.trim(); if(role) params.set('role',role); location.href = '/ui' + (params.toString()? ('?' + params.toString()):''); };
  document.getElementById('type').onchange = ()=>{ document.getElementById('apply').click(); };
  const p = new URLSearchParams(location.search).get('type'); if(p) document.getElementById('type').value = p; connect();
</script>
</body></html>`);
  }
  if (req.url.startsWith('/events/stream')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    let lastSize = 0;
    const timer = setInterval(() => {
      try {
        if (fs.existsSync(busFile)) {
          const stat = fs.statSync(busFile);
          if (stat.size > lastSize) {
            const data = fs.readFileSync(busFile, 'utf8');
            const lines = data.trim().split('\n').slice(-50);
            const url = new URL(req.url, `http://localhost:${port}`);
            const typeFilter = url.searchParams.get('type');
            const agentFilter = url.searchParams.get('agent');
            const roleFilter = url.searchParams.get('role');
            const filtered = lines
              .map(l => { try { return JSON.parse(l); } catch { return null; } })
              .filter(ev => ev && (!typeFilter || ev.type === typeFilter))
              .filter(ev => ev && (!agentFilter || ev.agent === agentFilter))
              .filter(ev => ev && (!roleFilter || ev.role === roleFilter));
            for (const ev of filtered) {
              res.write(`data: ${JSON.stringify(ev)}\n\n`);
            }
            lastSize = stat.size;
          }
        }
      } catch (e) {}
    }, 1000);
    req.on('close', () => clearInterval(timer));
    return;
  }
  if (req.url === '/' || req.url.startsWith('/events')) {
    const events = readTail();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ events, count: events.length, ts: new Date().toISOString() }, null, 2));
  }
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(port, () => {
  console.log(`Agent Bus HTTP dashboard on http://localhost:${port}`);
});
