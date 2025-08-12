import fs from 'fs';
import path from 'path';

export type EngineState = {
  yolo?: { enabled: boolean; ack?: string; claudeCommand?: 'claude'|'yolo' };
};

function engineDir(root = process.cwd()): string {
  const dir = path.join(root, '.ai-workflow', 'engine');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function readEngineState(root = process.cwd()): EngineState {
  const fp = path.join(engineDir(root), 'config.json');
  try {
    if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {}
  return {};
}

export function writeEngineState(state: EngineState, root = process.cwd()): EngineState {
  const fp = path.join(engineDir(root), 'config.json');
  fs.writeFileSync(fp, JSON.stringify(state, null, 2));
  return state;
}


