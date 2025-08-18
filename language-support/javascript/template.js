/**
 * JavaScript Language Support Template
 * For MASTER-WORKFLOW v3.0
 */

module.exports = {
  language: 'javascript',
  extensions: ['.js', '.jsx', '.mjs', '.cjs'],
  
  // Build tools and package managers
  buildTools: {
    packageManager: 'npm',
    alternativeManagers: ['yarn', 'pnpm', 'bun'],
    buildCommand: 'npm run build',
    testCommand: 'npm test',
    lintCommand: 'npm run lint',
    formatCommand: 'npm run format'
  },
  
  // Common frameworks and libraries
  frameworks: [
    'React', 'Vue', 'Angular', 'Svelte',
    'Express', 'Fastify', 'Koa', 'NestJS',
    'Next.js', 'Nuxt.js', 'Gatsby', 'Remix'
  ],
  
  // Testing frameworks
  testing: {
    unit: ['Jest', 'Mocha', 'Vitest', 'Jasmine'],
    e2e: ['Cypress', 'Playwright', 'Puppeteer', 'TestCafe'],
    coverage: ['Istanbul', 'c8', 'nyc']
  },
  
  // Linting and formatting
  linting: {
    linter: 'ESLint',
    config: '.eslintrc.json',
    formatter: 'Prettier',
    formatterConfig: '.prettierrc'
  },
  
  // TypeScript support
  typescript: {
    supported: true,
    configFile: 'tsconfig.json',
    compiler: 'tsc',
    extensions: ['.ts', '.tsx', '.d.ts']
  },
  
  // Common patterns and best practices
  patterns: {
    moduleSystem: 'ESM',
    asyncHandling: 'async/await',
    errorHandling: 'try/catch',
    stateManagement: ['Redux', 'MobX', 'Zustand', 'Context API']
  },
  
  // Development server
  devServer: {
    command: 'npm run dev',
    defaultPort: 3000,
    hotReload: true
  },
  
  // Deployment
  deployment: {
    platforms: ['Vercel', 'Netlify', 'AWS', 'Heroku', 'Railway'],
    containerization: 'Docker',
    ci: ['GitHub Actions', 'CircleCI', 'Travis CI', 'Jenkins']
  }
};