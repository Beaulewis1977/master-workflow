import pino, { Logger } from 'pino';

export const createLogger = (name: string): Logger => {
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'production' ? undefined : {
      target: 'pino-pretty',
      options: { colorize: true }
    },
    redact: ['req.headers.authorization', 'password', 'token', 'apiKey']
  });
};


