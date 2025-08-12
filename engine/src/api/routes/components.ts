import { FastifyInstance } from 'fastify';
import { listComponents } from '../../modules/components-registry.js';

export default async function (app: FastifyInstance) {
  app.get('/api/components', async () => ({ components: listComponents() }));
}


