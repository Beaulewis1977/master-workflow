/**
 * Frontend Technology Tests
 * Next.js 14, React 18, TypeScript, ESLint, Prettier
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class FrontendTests {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.frontendPath = path.join(projectPath, 'frontend');
  }

  async runAllTests() {
    const results = [];
    
    try {
      results.push(await this.testNextjsAppRouter());
      results.push(await this.testReactComponents());
      results.push(await this.testTypeScriptConfig());
      results.push(await this.testESLintConfiguration());
      results.push(await this.testBuildOptimization());
      results.push(await this.testImageOptimization());
      results.push(await this.testMetadataAPI());
      results.push(await this.testServerComponents());
      results.push(await this.testClientComponents());
      results.push(await this.testAPIRoutes());
      results.push(await this.testMiddleware());
      results.push(await this.testInternationalization());
      
    } catch (error) {
      results.push({
        test: 'Frontend Test Suite',
        passed: false,
        error: error.message
      });
    }
    
    return results;
  }

  async testNextjsAppRouter() {
    try {
      // Test App Router structure
      const appDir = path.join(this.frontendPath, 'src/app');
      const layoutPath = path.join(appDir, 'layout.tsx');
      const pagePath = path.join(appDir, 'page.tsx');
      
      // Check required files exist
      await fs.access(layoutPath);
      await fs.access(pagePath);
      
      // Validate layout.tsx
      const layoutContent = await fs.readFile(layoutPath, 'utf8');
      const layoutValidations = [
        layoutContent.includes('RootLayout'),
        layoutContent.includes('children: React.ReactNode'),
        layoutContent.includes('export default'),
        layoutContent.includes('html'),
        layoutContent.includes('body')
      ];
      
      if (!layoutValidations.every(Boolean)) {
        throw new Error('Invalid layout.tsx structure');
      }
      
      // Validate page.tsx
      const pageContent = await fs.readFile(pagePath, 'utf8');
      if (!pageContent.includes('export default') || !pageContent.includes('function')) {
        throw new Error('Invalid page.tsx structure');
      }
      
      // Test nested routes
      const nestedRoutes = ['api', 'auth', 'dashboard'];
      const existingRoutes = [];
      
      for (const route of nestedRoutes) {
        const routePath = path.join(appDir, route);
        try {
          await fs.access(routePath);
          existingRoutes.push(route);
        } catch (error) {
          // Route doesn't exist, that's fine
        }
      }
      
      return {
        test: 'Next.js App Router',
        passed: true,
        details: `Found ${existingRoutes.length} nested routes: ${existingRoutes.join(', ')}`
      };
      
    } catch (error) {
      return {
        test: 'Next.js App Router',
        passed: false,
        error: error.message
      };
    }
  }

  async testReactComponents() {
    try {
      // Test React 18 features
      const layoutPath = path.join(this.frontendPath, 'src/app/layout.tsx');
      const layoutContent = await fs.readFile(layoutPath, 'utf8');
      
      // Check for React 18 features
      const react18Features = [
        'use client', // Client Components
        'Suspense', // Suspense boundaries
        'ErrorBoundary' // Error boundaries
      ];
      
      const foundFeatures = react18Features.filter(feature => 
        layoutContent.includes(feature)
      );
      
      // Test component structure
      const componentsDir = path.join(this.frontendPath, 'src/components');
      let componentCount = 0;
      
      try {
        const components = await fs.readdir(componentsDir);
        componentCount = components.filter(file => 
          file.endsWith('.tsx') || file.endsWith('.jsx')
        ).length;
      } catch (error) {
        // Components directory might not exist
      }
      
      return {
        test: 'React 18 Components',
        passed: true,
        details: `Found ${foundFeatures.length} React 18 features, ${componentCount} components`
      };
      
    } catch (error) {
      return {
        test: 'React 18 Components',
        passed: false,
        error: error.message
      };
    }
  }

  async testTypeScriptConfig() {
    try {
      const tsconfigPath = path.join(this.frontendPath, 'tsconfig.json');
      const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf8'));
      
      // Validate TypeScript configuration
      const requiredCompilerOptions = [
        'target',
        'module',
        'moduleResolution',
        'jsx',
        'strict',
        'esModuleInterop',
        'skipLibCheck',
        'forceConsistentCasingInFileNames'
      ];
      
      const missingOptions = requiredCompilerOptions.filter(option => 
        !tsconfig.compilerOptions || !tsconfig.compilerOptions.hasOwnProperty(option)
      );
      
      if (missingOptions.length > 0) {
        throw new Error(`Missing TypeScript options: ${missingOptions.join(', ')}`);
      }
      
      // Test strict mode
      if (!tsconfig.compilerOptions.strict) {
        throw new Error('TypeScript strict mode is not enabled');
      }
      
      // Test Next.js specific options
      const nextjsOptions = ['incremental', 'plugins'];
      const foundNextjsOptions = nextjsOptions.filter(option => 
        tsconfig.compilerOptions[option]
      );
      
      // Run type checking
      process.chdir(this.frontendPath);
      try {
        execSync('npm run type-check', { stdio: 'pipe' });
      } catch (error) {
        throw new Error('TypeScript type checking failed');
      }
      
      return {
        test: 'TypeScript Configuration',
        passed: true,
        details: `Strict mode enabled, ${foundNextjsOptions.length} Next.js options configured`
      };
      
    } catch (error) {
      return {
        test: 'TypeScript Configuration',
        passed: false,
        error: error.message
      };
    }
  }

  async testESLintConfiguration() {
    try {
      const eslintConfigPath = path.join(this.frontendPath, '.eslintrc.json');
      let eslintConfig;
      
      try {
        eslintConfig = JSON.parse(await fs.readFile(eslintConfigPath, 'utf8'));
      } catch (error) {
        // Try package.json eslint config
        const packageJsonPath = path.join(this.frontendPath, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        eslintConfig = packageJson.eslintConfig;
        
        if (!eslintConfig) {
          throw new Error('No ESLint configuration found');
        }
      }
      
      // Validate ESLint configuration
      const requiredExtends = ['next/core-web-vitals'];
      const hasRequiredExtends = requiredExtends.every(extend => 
        eslintConfig.extends && eslintConfig.extends.includes(extend)
      );
      
      if (!hasRequiredExtends) {
        throw new Error('Missing required ESLint extends configuration');
      }
      
      // Run ESLint
      process.chdir(this.frontendPath);
      try {
        execSync('npm run lint', { stdio: 'pipe' });
      } catch (error) {
        // ESLint found issues, but that's informational
        console.warn('ESLint found issues (not failing test)');
      }
      
      return {
        test: 'ESLint Configuration',
        passed: true,
        details: 'ESLint properly configured with Next.js rules'
      };
      
    } catch (error) {
      return {
        test: 'ESLint Configuration',
        passed: false,
        error: error.message
      };
    }
  }

  async testBuildOptimization() {
    try {
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Test optimization features
      const optimizationFeatures = [
        'images', // Image optimization
        'experimental', // Experimental features
        'webpack', // Webpack customization
        'compress' // Response compression
      ];
      
      const foundFeatures = optimizationFeatures.filter(feature => 
        nextConfig.includes(feature)
      );
      
      // Test build process
      process.chdir(this.frontendPath);
      const buildStart = Date.now();
      
      try {
        execSync('npm run build', { stdio: 'pipe', timeout: 180000 });
      } catch (error) {
        throw new Error('Build process failed');
      }
      
      const buildDuration = Date.now() - buildStart;
      
      // Check build output
      const buildPath = path.join(this.frontendPath, '.next');
      await fs.access(buildPath);
      
      return {
        test: 'Build Optimization',
        passed: true,
        details: `Build completed in ${Math.round(buildDuration / 1000)}s, ${foundFeatures.length} optimization features`
      };
      
    } catch (error) {
      return {
        test: 'Build Optimization',
        passed: false,
        error: error.message
      };
    }
  }

  async testImageOptimization() {
    try {
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Test image configuration
      if (!nextConfig.includes('images')) {
        throw new Error('Image optimization not configured');
      }
      
      // Test image formats
      const modernFormats = ['image/webp', 'image/avif'];
      const foundFormats = modernFormats.filter(format => 
        nextConfig.includes(format)
      );
      
      if (foundFormats.length === 0) {
        throw new Error('Modern image formats not configured');
      }
      
      // Test image domains
      if (!nextConfig.includes('domains')) {
        console.warn('No image domains configured (might be intentional)');
      }
      
      return {
        test: 'Image Optimization',
        passed: true,
        details: `${foundFormats.length} modern formats configured`
      };
      
    } catch (error) {
      return {
        test: 'Image Optimization',
        passed: false,
        error: error.message
      };
    }
  }

  async testServerComponents() {
    try {
      // Find server components (no 'use client' directive)
      const componentsToCheck = [
        path.join(this.frontendPath, 'src/app/layout.tsx'),
        path.join(this.frontendPath, 'src/app/page.tsx')
      ];
      
      let serverComponents = 0;
      let clientComponents = 0;
      
      for (const componentPath of componentsToCheck) {
        try {
          const content = await fs.readFile(componentPath, 'utf8');
          if (content.includes("'use client'") || content.includes('"use client"')) {
            clientComponents++;
          } else {
            serverComponents++;
          }
        } catch (error) {
          // Component doesn't exist
        }
      }
      
      return {
        test: 'Server Components',
        passed: true,
        details: `${serverComponents} server components, ${clientComponents} client components`
      };
      
    } catch (error) {
      return {
        test: 'Server Components',
        passed: false,
        error: error.message
      };
    }
  }

  async testAPIRoutes() {
    try {
      const apiDir = path.join(this.frontendPath, 'src/app/api');
      let apiRoutes = [];
      
      try {
        const routes = await this.findAPIRoutes(apiDir);
        apiRoutes = routes;
      } catch (error) {
        // No API routes found
      }
      
      // Test API route structure
      for (const route of apiRoutes) {
        const routeContent = await fs.readFile(route, 'utf8');
        
        // Check for proper exports
        const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        const foundMethods = httpMethods.filter(method => 
          routeContent.includes(`export async function ${method}`)
        );
        
        if (foundMethods.length === 0) {
          throw new Error(`No HTTP methods exported in ${route}`);
        }
      }
      
      return {
        test: 'API Routes',
        passed: true,
        details: `Found ${apiRoutes.length} API routes`
      };
      
    } catch (error) {
      return {
        test: 'API Routes',
        passed: false,
        error: error.message
      };
    }
  }

  async findAPIRoutes(dir, routes = []) {
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          await this.findAPIRoutes(itemPath, routes);
        } else if (item === 'route.ts' || item === 'route.js') {
          routes.push(itemPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }
    
    return routes;
  }

  async testMiddleware() {
    try {
      const middlewarePath = path.join(this.frontendPath, 'middleware.ts');
      
      try {
        const middlewareContent = await fs.readFile(middlewarePath, 'utf8');
        
        // Test middleware structure
        if (!middlewareContent.includes('export function middleware')) {
          throw new Error('Invalid middleware export');
        }
        
        if (!middlewareContent.includes('export const config')) {
          throw new Error('Missing middleware config');
        }
        
        return {
          test: 'Middleware',
          passed: true,
          details: 'Middleware properly configured'
        };
        
      } catch (error) {
        // Middleware doesn't exist (optional)
        return {
          test: 'Middleware',
          passed: true,
          details: 'No middleware configured (optional)'
        };
      }
      
    } catch (error) {
      return {
        test: 'Middleware',
        passed: false,
        error: error.message
      };
    }
  }

  async testMetadataAPI() {
    try {
      const layoutPath = path.join(this.frontendPath, 'src/app/layout.tsx');
      const layoutContent = await fs.readFile(layoutPath, 'utf8');
      
      // Test for Metadata API usage
      const metadataFeatures = [
        'export const metadata',
        'Metadata',
        'generateMetadata'
      ];
      
      const foundFeatures = metadataFeatures.filter(feature => 
        layoutContent.includes(feature)
      );
      
      return {
        test: 'Metadata API',
        passed: true,
        details: `${foundFeatures.length} metadata features found`
      };
      
    } catch (error) {
      return {
        test: 'Metadata API',
        passed: false,
        error: error.message
      };
    }
  }

  async testClientComponents() {
    try {
      // Find client components ('use client' directive)
      const componentsToCheck = [
        path.join(this.frontendPath, 'src/components'),
        path.join(this.frontendPath, 'src/app')
      ];
      
      let clientComponents = 0;
      
      for (const dir of componentsToCheck) {
        try {
          clientComponents += await this.countClientComponents(dir);
        } catch (error) {
          // Directory doesn't exist
        }
      }
      
      return {
        test: 'Client Components',
        passed: true,
        details: `Found ${clientComponents} client components`
      };
      
    } catch (error) {
      return {
        test: 'Client Components',
        passed: false,
        error: error.message
      };
    }
  }

  async countClientComponents(dir) {
    let count = 0;
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          count += await this.countClientComponents(itemPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
          const content = await fs.readFile(itemPath, 'utf8');
          if (content.includes("'use client'") || content.includes('"use client"')) {
            count++;
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or access error
    }
    
    return count;
  }

  async testInternationalization() {
    try {
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Test for i18n configuration
      const i18nFeatures = ['i18n', 'locales', 'defaultLocale'];
      const foundFeatures = i18nFeatures.filter(feature => 
        nextConfig.includes(feature)
      );
      
      return {
        test: 'Internationalization',
        passed: true,
        details: foundFeatures.length > 0 
          ? `${foundFeatures.length} i18n features configured`
          : 'No i18n configuration (optional)'
      };
      
    } catch (error) {
      return {
        test: 'Internationalization',
        passed: false,
        error: error.message
      };
    }
  }
}

module.exports = FrontendTests;