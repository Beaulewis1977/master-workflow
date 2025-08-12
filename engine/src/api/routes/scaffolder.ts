import { FastifyInstance } from 'fastify';
import { createScaffoldPlan, writeScaffoldPreview, applyScaffold } from '../../modules/scaffolder.js';

export default async function (app: FastifyInstance) {
  app.post('/api/scaffold/plan', async () => createScaffoldPlan());
  app.post('/api/scaffold/preview', async () => writeScaffoldPreview());
  app.post('/api/scaffold/apply', async () => applyScaffold());
}


