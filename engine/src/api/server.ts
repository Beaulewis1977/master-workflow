import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createLogger } from '../core/logging.js';
import { openDb } from '../core/db.js';
import componentsRoute from './routes/components.js';
import installRoute from './routes/install.js';
import convoRoute from './routes/convo.js';
import { randomUUID } from 'crypto';

const logger = createLogger('api');
const PORT = Number(process.env.MW_ENGINE_PORT || 13800);

async function buildServer() {
  const app = Fastify({ logger });
  app.register(cors, { origin: true });

  // Health
  app.get('/health', async () => ({ status: 'ok' }));

  // Routes
  app.register(componentsRoute);
  app.register(installRoute);
  app.register(convoRoute);

  // Env scan stub
  app.get('/api/env/scan', async () => ({ fingerprint: {}, matrix: {}, suggestions: [] }));

  // Install request stub
  app.post('/api/install', async (req, reply) => {
    const id = randomUUID();
    const db = openDb();
    const stmt = db.prepare('INSERT INTO installs (id, status) VALUES (?, ?)');
    stmt.run(id, 'queued');
    return reply.code(202).send({ id, status: 'queued' });
  });

  // Install status
  app.get('/api/install/:id/status', async (req: any, reply) => {
    const db = openDb();
    const row = db.prepare('SELECT id, status FROM installs WHERE id = ?').get(req.params.id);
    if (!row) return reply.code(404).send({ error: 'not_found' });
    return row;
  });

  // Convo message stub
  app.post('/api/convo/:sessionId/message', async (req: any) => {
    const id = randomUUID();
    return { id, reply: 'Acknowledged', actions: [] };
  });

  // Orchestrator configure stub
  app.post('/api/orchestrator/configure', async () => ({ ok: true }));

  return app;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('server.js')) {
  (async () => {
    const app = await buildServer();
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info({ port: PORT }, 'Engine API listening');
  })();
}

export default buildServer;


