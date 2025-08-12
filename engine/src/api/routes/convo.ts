import { FastifyInstance } from 'fastify';
import { ensureSession, addMessage, getThread, generateReply } from '../../modules/convo-manager.js';

export default async function (app: FastifyInstance) {
  app.post('/api/convo/:sessionId/message', async (req: any, reply) => {
    const { sessionId } = req.params;
    const body = req.body || {};
    ensureSession(sessionId, req.headers['user-agent'], body.envInfo);
    addMessage(sessionId, 'user', body.text || '', body.images);
    const { reply: text, actions } = generateReply({ text: body.text, images: body.images });
    addMessage(sessionId, 'assistant', text, []);
    return reply.code(200).send({ reply: text, actions });
  });

  app.get('/api/convo/:sessionId', async (req: any, reply) => {
    const { sessionId } = req.params;
    const thread = getThread(sessionId);
    if (!thread) return reply.code(404).send({ error: 'not_found' });
    return thread;
  });
}


