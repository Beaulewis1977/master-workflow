import { ValidationError } from '../core/errors.js';

export function validateSelections(selections: string[]) {
  if (!Array.isArray(selections) || selections.length === 0) {
    throw new ValidationError('At least one component must be selected');
  }
}

export function validateYoloAck(opts?: { yolo?: boolean; dangerouslySkipPermissions?: boolean; ack?: string }) {
  const yoloEnabled = !!(opts?.yolo || opts?.dangerouslySkipPermissions);
  const blocked = process.env.CI === 'true' || process.env.BLOCK_YOLO === 'true';
  if (yoloEnabled && blocked) {
    throw new ValidationError('YOLO is blocked in CI or when BLOCK_YOLO=true');
  }
  if (yoloEnabled && opts?.ack !== 'I-ACCEPT-RISK') {
    throw new ValidationError('YOLO requires explicit ack: I-ACCEPT-RISK');
  }
}


