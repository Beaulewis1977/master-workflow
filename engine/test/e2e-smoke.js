#!/usr/bin/env node
import http from 'http';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: 13800, path }, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve({ code: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  const health = await get('/health');
  if (health.code !== 200) { console.error('Health failed', health); process.exit(1); }
  const env = await get('/api/env/scan');
  if (env.code !== 200) { console.error('Env scan failed', env); process.exit(1); }
  console.log('E2E smoke OK');
})();


