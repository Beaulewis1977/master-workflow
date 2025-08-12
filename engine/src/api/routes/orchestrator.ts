import { FastifyInstance } from 'fastify';
import { buildLaunchCommands } from '../../modules/flow-orchestrator.js';
import path from 'path';

export default async function (app: FastifyInstance) {
  app.post('/api/orchestrator/configure', async (req: any) => ({ ok: true }));

  app.post('/api/orchestrator/launch', async (req: any, reply) => {
    const body = req.body || {};
    const projectName = path.basename(process.cwd());
    const approach = body.approach || 'hiveMind';
    const agentCount = Number(body.agentCount || 5);
    const cmds = buildLaunchCommands(projectName, approach, agentCount, body.flow);
    return reply.code(200).send({ commands: cmds });
  });

  app.post('/api/orchestrator/rollback', async () => ({ ok: true }));
}


