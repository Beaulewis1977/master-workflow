import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createLogger } from '../core/logging.js';
import { openDb } from '../core/db.js';
import loggingHook from './hooks/logging.js';
import componentsRoute from './routes/components.js';
import installRoute from './routes/install.js';
import convoRoute from './routes/convo.js';
import envRoute from './routes/env.js';
import orchestratorRoute from './routes/orchestrator.js';
import customizerRoute from './routes/customizer.js';
import scaffolderRoute from './routes/scaffolder.js';
import yoloRoute from './routes/yolo.js';
import { randomUUID } from 'crypto';

const logger = createLogger('api');
const PORT = Number(process.env.MW_ENGINE_PORT || 13800);

async function buildServer() {
  const app = Fastify({ logger });
  app.register(cors, { origin: true });
  app.register(loggingHook);

  // Health
  app.get('/health', async () => ({ status: 'ok' }));

  // Routes
  app.register(componentsRoute);
  app.register(installRoute);
  app.register(convoRoute);
  app.register(envRoute);
  app.register(orchestratorRoute);
  app.register(customizerRoute);
  app.register(scaffolderRoute);
  app.register(yoloRoute);

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


