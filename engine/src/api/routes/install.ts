import { FastifyInstance } from 'fastify';
import { planInstall } from '../../modules/installer.js';

export default async function (app: FastifyInstance) {
  app.post('/api/install', async (req: any, reply) => {
    try {
      const plan = planInstall(req.body || {});
      return reply.code(200).send({ plan });
    } catch (e: any) {
      return reply.code(400).send({ error: e.message });
    }
  });
}


