export type Component = {
  id: string;
  name: string;
  description: string;
  diskSpaceMB?: number;
  deps?: string[];
  conflicts?: string[];
  supportedDistros?: Array<'ubuntu'|'debian'|'mint'|'centos'|'windows'|'macos'>;
  precheck?: { type: 'shell'; cmd: string };
  install?: Record<string, string>;
  verify?: { type: 'shell'; cmd: string };
  rollback?: Record<string, string>;
  requiresSudo?: boolean;
  estimatedSeconds?: number;
};

export type Registry = Record<string, Component>;

export const defaultRegistry: Registry = {
  core: {
    id: 'core',
    name: 'Core Workflow System',
    description: 'Intelligence engine, analysis, and orchestration',
    supportedDistros: ['ubuntu','debian','mint','centos','windows','macos'],
    estimatedSeconds: 10
  },
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code Integration',
    description: 'Agents, commands, and hooks',
    supportedDistros: ['ubuntu','debian','mint','centos','windows','macos'],
    estimatedSeconds: 30
  },
  'agent-os': {
    id: 'agent-os',
    name: 'Agent-OS Planning',
    description: 'Specification-driven docs and planning',
    supportedDistros: ['ubuntu','debian','mint','centos','windows','macos'],
    estimatedSeconds: 25
  },
  'claude-flow': {
    id: 'claude-flow',
    name: 'Claude Flow 2.0',
    description: 'Multi-agent coordination (SPARC optional)',
    supportedDistros: ['ubuntu','debian','mint','centos','windows','macos'],
    estimatedSeconds: 40
  },
  tmux: {
    id: 'tmux',
    name: 'tmux Multiplexer',
    description: 'Terminal multiplexer (WSL2/Ubuntu recommended on Windows).',
    diskSpaceMB: 25,
    deps: ['apt'],
    conflicts: [],
    supportedDistros: ['ubuntu','debian','mint','centos'],
    precheck: { type: 'shell', cmd: 'tmux -V' },
    install: {
      ubuntu: 'sudo apt-get update && sudo apt-get install -y tmux',
      debian: 'sudo apt-get update && sudo apt-get install -y tmux',
      mint: 'sudo apt-get update && sudo apt-get install -y tmux',
      centos: 'sudo yum install -y tmux'
    },
    verify: { type: 'shell', cmd: 'tmux -V' },
    rollback: {
      ubuntu: 'sudo apt-get remove -y tmux',
      debian: 'sudo apt-get remove -y tmux',
      mint: 'sudo apt-get remove -y tmux',
      centos: 'sudo yum remove -y tmux'
    },
    requiresSudo: true,
    estimatedSeconds: 30
  }
};

export const listComponents = () => Object.values(defaultRegistry);


