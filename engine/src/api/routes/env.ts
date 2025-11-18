import { FastifyInstance } from 'fastify';
import { scanEnvironment } from '../../modules/env-scanner.js';

export default async function (app: FastifyInstance) {
  app.get('/api/env/scan', async () => {
    const fingerprint = scanEnvironment();
    const suggestions: string[] = [];
    if (fingerprint.host.platform === 'win32') suggestions.push('Prefer process mode; use WSL2 for tmux');
    if (fingerprint.containers.includes('dockerfile')) suggestions.push('Enable container-aware workflows');
    if (fingerprint.ciConfigs.includes('github-actions')) suggestions.push('Ensure CI matrix covers Node 18/20 and OS triad');
    return { fingerprint, matrix: {}, suggestions };
  });
}


