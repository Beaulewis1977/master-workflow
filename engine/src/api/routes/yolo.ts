import { FastifyInstance } from 'fastify';
import { readEngineState, writeEngineState } from '../../core/store.js';
import { enforceYoloFlags } from '../../core/security.js';

export default async function (app: FastifyInstance) {
  app.post('/api/yolo/on', async (req: any, reply) => {
    const body = req.body || {};
    enforceYoloFlags(true, true, body.ack);
    const state = readEngineState();
    state.yolo = { enabled: true, ack: body.ack || 'I-ACCEPT-RISK', claudeCommand: 'yolo' };
    writeEngineState(state);
    return reply.send({ ok: true, yolo: state.yolo });
  });

  app.post('/api/yolo/off', async (_req, reply) => {
    const state = readEngineState();
    state.yolo = { enabled: false, ack: undefined, claudeCommand: 'claude' };
    writeEngineState(state);
    return reply.send({ ok: true, yolo: state.yolo });
  });

  app.get('/api/yolo/status', async () => ({ yolo: readEngineState().yolo || { enabled: false, claudeCommand: 'claude' } }));
}


