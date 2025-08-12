import { suffixFor, isExperimental, normalizeVersionName } from './version-policy.js';
import { readEngineState } from '../core/store.js';

export type FlowConfig = {
  version?: string; // alpha|beta|latest|stable|2.0|dev or alias
  sandbox?: boolean;
  featureFlags?: string[];
};

export function buildLaunchCommands(projectName: string, approach: 'simpleSwarm'|'hiveMind'|'hiveMindSparc', agentCount = 5, cfg?: FlowConfig) {
  const name = normalizeVersionName(cfg?.version || process.env.CLAUDE_FLOW_VERSION);
  const tag = suffixFor(name);
  const state = readEngineState();
  const cmds: string[] = [];
  const claudeCmd = state.yolo?.enabled ? 'yolo' : 'claude';
  if (approach === 'simpleSwarm') {
    cmds.push(`npx claude-flow${tag} swarm "Development task"`);
  } else if (approach === 'hiveMind') {
    cmds.push(`npx claude-flow${tag} hive-mind spawn "${projectName}" --agents ${agentCount} --${claudeCmd}`);
  } else if (approach === 'hiveMindSparc') {
    cmds.push(`npx claude-flow${tag} hive-mind spawn "${projectName}" --sparc --agents ${agentCount} --${claudeCmd}`);
    cmds.push(`npx claude-flow${tag} sparc wizard --interactive`);
  }

  // Optional experimental commands
  if (process.env.ENABLE_CF_TRAINING === 'true' || (process.env.CF_ENABLE_EXPERIMENTAL === 'true' && isExperimental(name))) {
    const epochs = Number(process.env.CF_TRAINING_EPOCHS || 3);
    cmds.push(`npx claude-flow${tag} training neural-train --epochs ${epochs}`);
  }
  if (process.env.ENABLE_CF_MEMORY_OPS === 'true') {
    const action = (process.env.CF_MEMORY_ACTION || 'summarize').toLowerCase();
    if (['summarize','sync','gc'].includes(action)) {
      cmds.push(`npx claude-flow${tag} memory ${action} --project "${projectName}"`);
    }
  }
  return cmds;
}


