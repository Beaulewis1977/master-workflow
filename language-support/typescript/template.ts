/**
 * TypeScript Language Support Template
 * For MASTER-WORKFLOW v3.0
 */

export interface LanguageConfig {
  language: string;
  extensions: string[];
  buildTools: BuildTools;
  frameworks: Record<string, string[]>;
  testing: TestingConfig;
  linting: LintingConfig;
  patterns: Record<string, unknown>;
  devServer: DevServerConfig;
  deployment: DeploymentConfig;
  typescript: TypeScriptConfig;
}

export interface BuildTools {
  packageManager: string;
  alternativeManagers: string[];
  buildCommand: string;
  testCommand: string;
  lintCommand: string;
  formatCommand: string;
  typeCheckCommand: string;
  compiler: string;
  bundlers: string[];
}

export interface TestingConfig {
  unit: string[];
  e2e: string[];
  coverage: string[];
  configFiles: string[];
  testRunners: string[];
}

export interface LintingConfig {
  linter: string;
  config: string;
  formatter: string;
  formatterConfig: string;
  typeChecker: string;
  additionalLinters: string[];
}

export interface DevServerConfig {
  command: string;
  defaultPort: number;
  hotReload: boolean;
  watchMode: boolean;
  devTools: string[];
}

export interface DeploymentConfig {
  platforms: string[];
  containerization: string;
  ci: string[];
  buildTargets: string[];
  serverless: string[];
}

export interface TypeScriptConfig {
  version: string;
  configFile: string;
  strictMode: boolean;
  decorators: boolean;
  experimentalFeatures: string[];
  compilerOptions: Record<string, unknown>;
}

export class TypeScriptLanguageConfig implements LanguageConfig {
  public readonly language = 'typescript';
  public readonly extensions = ['.ts', '.tsx', '.d.ts', '.mts', '.cts'];

  public readonly buildTools: BuildTools = {
    packageManager: 'npm',
    alternativeManagers: ['yarn', 'pnpm', 'bun'],
    buildCommand: 'npm run build',
    testCommand: 'npm test',
    lintCommand: 'npm run lint',
    formatCommand: 'npm run format',
    typeCheckCommand: 'tsc --noEmit',
    compiler: 'tsc',
    bundlers: ['webpack', 'vite', 'rollup', 'esbuild', 'parcel', 'swc'],
  };

  public readonly frameworks: Record<string, string[]> = {
    frontend: ['React', 'Vue', 'Angular', 'Svelte', 'Solid.js', 'Qwik'],
    backend: ['Express', 'Fastify', 'Koa', 'NestJS', 'Hapi', 'tRPC'],
    fullstack: ['Next.js', 'Nuxt', 'SvelteKit', 'Remix', 'T3 Stack'],
    mobile: ['React Native', 'Ionic', 'NativeScript', 'Capacitor'],
    desktop: ['Electron', 'Tauri', 'Neutralino'],
    testing: ['Jest', 'Vitest', 'Mocha', 'Jasmine', 'Playwright', 'Cypress'],
  };

  public readonly testing: TestingConfig = {
    unit: ['Jest', 'Vitest', 'Mocha', 'Jasmine', 'Node:test'],
    e2e: ['Playwright', 'Cypress', 'Puppeteer', 'TestCafe'],
    coverage: ['Istanbul', 'c8', 'nyc', '@vitest/coverage'],
    configFiles: ['jest.config.ts', 'vitest.config.ts', 'playwright.config.ts'],
    testRunners: ['Jest', 'Vitest', 'Mocha', 'Node:test'],
  };

  public readonly linting: LintingConfig = {
    linter: 'ESLint',
    config: '.eslintrc.json',
    formatter: 'Prettier',
    formatterConfig: '.prettierrc',
    typeChecker: 'TypeScript',
    additionalLinters: ['@typescript-eslint/eslint-plugin', 'eslint-plugin-import'],
  };

  public readonly patterns: Record<string, unknown> = {
    moduleSystem: 'ESM',
    asyncHandling: 'async/await with Promise<T>',
    errorHandling: 'try/catch with typed errors',
    stateManagement: ['Redux Toolkit', 'Zustand', 'Jotai', 'Valtio'],
    designPatterns: ['Dependency Injection', 'Factory', 'Observer', 'Strategy'],
    typePatterns: ['Generics', 'Union Types', 'Intersection Types', 'Conditional Types'],
  };

  public readonly devServer: DevServerConfig = {
    command: 'npm run dev',
    defaultPort: 3000,
    hotReload: true,
    watchMode: true,
    devTools: ['TypeScript Language Server', 'Webpack Dev Server', 'Vite Dev Server'],
  };

  public readonly deployment: DeploymentConfig = {
    platforms: ['Vercel', 'Netlify', 'AWS', 'Azure', 'Google Cloud', 'Railway'],
    containerization: 'Docker',
    ci: ['GitHub Actions', 'GitLab CI', 'CircleCI', 'Jenkins', 'Azure DevOps'],
    buildTargets: ['ES2020', 'ES2022', 'ESNext', 'CommonJS', 'UMD'],
    serverless: ['Vercel Functions', 'Netlify Functions', 'AWS Lambda', 'Cloudflare Workers'],
  };

  public readonly typescript: TypeScriptConfig = {
    version: '5.0+',
    configFile: 'tsconfig.json',
    strictMode: true,
    decorators: true,
    experimentalFeatures: ['decorators', 'emitDecoratorMetadata'],
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
    },
  };

  /**
   * Get the complete configuration object
   */
  public getConfig(): LanguageConfig {
    return {
      language: this.language,
      extensions: this.extensions,
      buildTools: this.buildTools,
      frameworks: this.frameworks,
      testing: this.testing,
      linting: this.linting,
      patterns: this.patterns,
      devServer: this.devServer,
      deployment: this.deployment,
      typescript: this.typescript,
    };
  }

  /**
   * Get configuration as JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  /**
   * Validate TypeScript configuration
   */
  public validateConfig(): boolean {
    return (
      this.language === 'typescript' &&
      this.extensions.includes('.ts') &&
      this.typescript.strictMode === true
    );
  }
}

// Utility functions for working with TypeScript projects
export namespace TypeScriptUtils {
  /**
   * Generate a basic tsconfig.json
   */
  export function generateTsConfig(options: Partial<TypeScriptConfig> = {}): object {
    const config = new TypeScriptLanguageConfig();
    return {
      compilerOptions: {
        ...config.typescript.compilerOptions,
        ...options.compilerOptions,
      },
      include: ['src/**/*', 'tests/**/*'],
      exclude: ['node_modules', 'dist', 'build'],
    };
  }

  /**
   * Common package.json scripts for TypeScript projects
   */
  export function generatePackageScripts(): Record<string, string> {
    return {
      build: 'tsc',
      'build:watch': 'tsc --watch',
      'type-check': 'tsc --noEmit',
      dev: 'ts-node src/index.ts',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      lint: 'eslint src/**/*.ts',
      'lint:fix': 'eslint src/**/*.ts --fix',
      format: 'prettier --write src/**/*.ts',
      'format:check': 'prettier --check src/**/*.ts',
    };
  }
}

// Example usage and demonstration
if (require.main === module) {
  const config = new TypeScriptLanguageConfig();
  
  console.log('TypeScript Language Configuration:');
  console.log(config.toJSON());
  
  console.log('\nValidation Result:', config.validateConfig());
  
  console.log('\nGenerated tsconfig.json:');
  console.log(JSON.stringify(TypeScriptUtils.generateTsConfig(), null, 2));
  
  console.log('\nRecommended package.json scripts:');
  console.log(JSON.stringify(TypeScriptUtils.generatePackageScripts(), null, 2));
}

export default TypeScriptLanguageConfig;