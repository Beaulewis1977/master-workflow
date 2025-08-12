import { FastifyInstance } from 'fastify';
import { generateProjectDocs } from '../../modules/customizer.js';

export default async function (app: FastifyInstance) {
  app.post('/api/customize', async (req: any) => {
    const body = req.body || {};
    const result = generateProjectDocs(process.cwd(), { specName: body.specName, includeAgents: !!body.includeAgents });
    return { ok: true, ...result };
  });
}


