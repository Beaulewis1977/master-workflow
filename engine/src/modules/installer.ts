import { listComponents } from './components-registry.js';
import { validateSelections, validateYoloAck } from './validator.js';
import { createLogger } from '../core/logging.js';

const logger = createLogger('installer');

export type InstallRequest = {
  selections: string[];
  mode: 'guided' | 'express' | 'advanced';
  options?: { yolo?: boolean; dangerouslySkipPermissions?: boolean; nonInteractive?: boolean; ack?: string };
};

export function planInstall(req: InstallRequest) {
  validateSelections(req.selections);
  validateYoloAck(req.options);
  const registry = listComponents();
  const selected = registry.filter(c => req.selections.includes(c.id));
  const steps = selected.map(c => ({ id: c.id, action: 'install', estimatedSeconds: c.estimatedSeconds || 10 }));
  const totalSeconds = steps.reduce((s, x) => s + (x.estimatedSeconds || 0), 0);
  logger.info({ selections: req.selections, totalSeconds }, 'Install plan created');
  return { steps, totalSeconds };
}


