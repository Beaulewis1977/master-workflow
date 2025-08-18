#!/usr/bin/env node

const http = require('http');
const url = require('url');

const PORT = process.env.AGENT_BUS_PORT ? Number(process.env.AGENT_BUS_PORT) : (process.env.PORT ? Number(process.env.PORT) : 8787);

let events = [];

function addEvent(type, payload) {
  const evt = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ts: new Date().toISOString(),
    type,
    payload
  };
  events.push(evt);
  if (events.length > 1000) events = events.slice(-1000);
}

function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // Minimal HTML dashboard
  if (parsed.pathname === '/ui') {
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Agent Bus Dashboard</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;margin:0;background:#0b1020;color:#e6edf3}
      header{padding:12px 16px;border-bottom:1px solid #1f273a;background:#0f1530;position:sticky;top:0}
      h1{font-size:16px;margin:0}
      .meta{font-size:12px;opacity:.8}
      #stream{padding:12px 16px}
      .evt{border:1px solid #26324d;border-radius:8px;padding:10px;margin:8px 0;background:#0f1833}
      .evt small{opacity:.7}
      .type{font-weight:600;color:#7aa2f7}
      pre{white-space:pre-wrap;word-break:break-word;margin:6px 0;background:#0a1228;padding:8px;border-radius:6px}
      .filters{display:flex;gap:8px;margin-top:6px}
      input,select{background:#0a1228;color:#e6edf3;border:1px solid #26324d;border-radius:6px;padding:6px}
    </style>
  </head>
  <body>
    <header>
      <h1>Agent Bus Dashboard</h1>
      <div class="meta">JSON/SSE stream at <code>/events/stream</code></div>
      <div class="filters">
        <label>Type <select id="type"><option value="">(all)</option><option>prompt</option><option>tool</option><option>response</option><option>approach_change</option><option>test</option></select></label>
        <input id="search" placeholder="Search payload..." />
      </div>
    </header>
    <div id="stream"></div>
    <script>
      const list = document.getElementById('stream');
      const typeSel = document.getElementById('type');
      const search = document.getElementById('search');
      const es = new EventSource('/events/stream');
      const keep = [];
      function render(){
        const t = typeSel.value.trim().toLowerCase();
        const q = search.value.trim().toLowerCase();
        list.innerHTML='';
        keep.filter(e=>{
          if(t && (String(e.type||'').toLowerCase()!==t)) return false;
          if(q && JSON.stringify(e).toLowerCase().indexOf(q)===-1) return false;
          return true;
        }).slice(-200).reverse().forEach(e=>{
          const div=document.createElement('div');
          div.className='evt';
          div.innerHTML=`<div class="type">${e.type||'event'}</div>
            <small>${e.ts||''} ${e.id?(' · '+e.id):''}</small>
            <pre>${JSON.stringify(e.payload||e,null,2)}</pre>`;
          list.appendChild(div);
        });
      }
      es.onmessage = (ev)=>{ try{ const obj = JSON.parse(ev.data); keep.push(obj); render(); }catch(e){} };
      typeSel.onchange=render; search.oninput=render;
    </script>
  </body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (parsed.pathname === '/') {
    const snapshot = {
      status: 'ok',
      now: new Date().toISOString(),
      events: events.slice(-50),
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(snapshot));
    return;
  }

  if (parsed.pathname === '/events/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.write('\n');

    // Send recent events initially
    events.slice(-10).forEach(evt => sendSSE(res, evt));

    // Minimal demo: emit a heartbeat every 10s
    const interval = setInterval(() => {
      sendSSE(res, { type: 'heartbeat', ts: new Date().toISOString() });
    }, 10000);

    req.on('close', () => clearInterval(interval));
    return;
  }

  if (parsed.pathname === '/events/publish' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const { type = 'unknown', payload = {} } = data;
        addEvent(type, payload);
        res.writeHead(204);
        res.end();
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid_json' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  console.log(`Agent Bus HTTP listening on http://localhost:${PORT}`);
});
