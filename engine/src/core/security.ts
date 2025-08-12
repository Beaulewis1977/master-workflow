import { ValidationError } from './errors.js';

const COMMAND_ALLOWLIST = new Set(['npm','node','npx','bash','sh','pwsh','powershell','git','tmux','jq','claude','claude-flow']);

export function enforceCommandAllowlist(command: string) {
  const cmd = String(command).trim().split(/\s+/)[0];
  if (!COMMAND_ALLOWLIST.has(cmd)) {
    throw new ValidationError(`Command not allowed: ${cmd}`);
  }
}

export function enforceYoloFlags(yolo?: boolean, dangerouslySkipPermissions?: boolean, ack?: string) {
  const enabled = !!(yolo || dangerouslySkipPermissions);
  const blocked = process.env.CI === 'true' || process.env.BLOCK_YOLO === 'true';
  if (enabled && blocked) throw new ValidationError('YOLO mode is blocked in CI or when BLOCK_YOLO=true');
  if (enabled && ack !== 'I-ACCEPT-RISK') throw new ValidationError('YOLO requires ack: I-ACCEPT-RISK');
}


