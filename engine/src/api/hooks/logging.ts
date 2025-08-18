import { FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance) {
  app.addHook('onRequest', async (req, _reply) => {
    app.log.info({ method: req.method, url: req.url }, 'incoming_request');
  });
  app.addHook('onResponse', async (req, reply) => {
    app.log.info({ status: reply.statusCode, url: req.url }, 'response_sent');
  });
}


