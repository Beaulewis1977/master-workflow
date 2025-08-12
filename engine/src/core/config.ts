export type EngineConfig = {
  yoloMode: boolean;
  claude: { model: string; contextWindow: number; launchFlags: string[] };
  security: {
    denyAutoPermissions: boolean;
    yolo: boolean;
    dangerouslySkipPermissions: boolean;
    allowlistCommands: string[];
    fsWriteRoots: string[];
    egressAllowlist: string[];
  };
};

export const defaultConfig: EngineConfig = {
  yoloMode: false,
  claude: { model: 'auto', contextWindow: 200000, launchFlags: [] },
  security: {
    denyAutoPermissions: false,
    yolo: false,
    dangerouslySkipPermissions: false,
    allowlistCommands: ['npm','node','npx','pwsh','bash','git'],
    fsWriteRoots: ['.','.agent-os','.claude','configs','engine','bin','/usr/local/bin'],
    egressAllowlist: ['github.com','registry.npmjs.org','packages.microsoft.com','packages.ubuntu.com','dl.google.com']
  }
};


