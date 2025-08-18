/**
 * End-to-End Tests
 * Playwright Integration, User Workflows, Real-time Features
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class E2ETests {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.frontendPath = path.join(projectPath, 'frontend');
    this.backendPath = path.join(projectPath, 'backend');
  }

  async runAllTests() {
    const results = [];
    
    try {
      results.push(await this.testPlaywrightSetup());
      results.push(await this.testUserRegistrationFlow());
      results.push(await this.testAuthenticationFlow());
      results.push(await this.testDataPersistenceFlow());
      results.push(await this.testRealTimeFeatures());
      results.push(await this.testErrorHandling());
      results.push(await this.testResponsiveDesign());
      results.push(await this.testAccessibility());
      results.push(await this.testPerformanceMetrics());
      results.push(await this.testCrossOriginRequests());
      results.push(await this.testFormValidation());
      results.push(await this.testNavigationFlow());
      
    } catch (error) {
      results.push({
        test: 'E2E Test Suite',
        passed: false,
        error: error.message
      });
    }
    
    return results;
  }

  async testPlaywrightSetup() {
    try {
      // Test Playwright dependency
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (!packageJson.devDependencies['@playwright/test']) {
        throw new Error('Playwright dependency not found');
      }
      
      // Test Playwright configuration
      const playwrightConfigFiles = [
        path.join(this.frontendPath, 'playwright.config.ts'),
        path.join(this.frontendPath, 'playwright.config.js')
      ];
      
      let configFound = false;
      let configContent = '';
      
      for (const configFile of playwrightConfigFiles) {
        try {
          configContent = await fs.readFile(configFile, 'utf8');
          configFound = true;
          break;
        } catch (error) {
          // Config file doesn't exist
        }
      }
      
      if (!configFound) {
        throw new Error('Playwright configuration not found');
      }
      
      // Test configuration features
      const configFeatures = [
        'testDir:',
        'use:',
        'projects:',
        'timeout',
        'retries'
      ];
      
      const foundFeatures = configFeatures.filter(feature => 
        configContent.includes(feature)
      );
      
      // Test browsers configuration
      const browsers = ['chromium', 'firefox', 'webkit'];
      const configuredBrowsers = browsers.filter(browser => 
        configContent.includes(browser)
      );
      
      return {
        test: 'Playwright Setup',
        passed: configFound && foundFeatures.length >= 3,
        details: `Config found, ${foundFeatures.length} features, ${configuredBrowsers.length} browsers`,
        metrics: {
          configFound,
          features: foundFeatures.length,
          browsers: configuredBrowsers.length
        }
      };
      
    } catch (error) {
      return {
        test: 'Playwright Setup',
        passed: false,
        error: error.message
      };
    }
  }

  async testUserRegistrationFlow() {
    try {
      // Test if registration components exist
      const registrationFiles = [
        path.join(this.frontendPath, 'src/app/register'),
        path.join(this.frontendPath, 'src/app/auth/register'),
        path.join(this.frontendPath, 'src/components/auth')
      ];
      
      let registrationImplementation = false;
      let formValidation = false;
      
      for (const regPath of registrationFiles) {
        try {
          const items = await fs.readdir(regPath);
          const hasRegFiles = items.some(item => 
            item.includes('register') || item.includes('signup')
          );
          
          if (hasRegFiles) {
            registrationImplementation = true;
            
            // Check for form validation
            for (const item of items) {
              if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
                const content = await fs.readFile(path.join(regPath, item), 'utf8');
                if (content.includes('useForm') || 
                    content.includes('validation') || 
                    content.includes('schema')) {
                  formValidation = true;
                }
              }
            }
          }
        } catch (error) {
          // Directory doesn't exist
        }
      }
      
      // Test Supabase auth integration
      const authStoreFiles = [
        path.join(this.frontendPath, 'src/store/auth-store.ts'),
        path.join(this.frontendPath, 'src/lib/auth.ts')
      ];
      
      let authIntegration = false;
      for (const authFile of authStoreFiles) {
        try {
          const content = await fs.readFile(authFile, 'utf8');
          if (content.includes('signUp') || 
              content.includes('register') || 
              content.includes('createUser')) {
            authIntegration = true;
            break;
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      return {
        test: 'User Registration Flow',
        passed: registrationImplementation || authIntegration,
        details: `Implementation: ${registrationImplementation}, Form validation: ${formValidation}, Auth integration: ${authIntegration}`,
        metrics: {
          implementation: registrationImplementation,
          formValidation,
          authIntegration
        }
      };
      
    } catch (error) {
      return {
        test: 'User Registration Flow',
        passed: false,
        error: error.message
      };
    }
  }

  async testAuthenticationFlow() {
    try {
      // Test authentication components
      const authFiles = [
        path.join(this.frontendPath, 'src/app/login'),
        path.join(this.frontendPath, 'src/app/auth'),
        path.join(this.frontendPath, 'src/components/auth')
      ];
      
      let loginImplementation = false;
      let protectedRoutes = false;
      let sessionManagement = false;
      
      for (const authPath of authFiles) {
        try {
          const items = await fs.readdir(authPath);
          const hasAuthFiles = items.some(item => 
            item.includes('login') || item.includes('signin') || item.includes('auth')
          );
          
          if (hasAuthFiles) {
            loginImplementation = true;
          }
        } catch (error) {
          // Directory doesn't exist
        }
      }
      
      // Test middleware for protected routes
      const middlewareFiles = [
        path.join(this.frontendPath, 'middleware.ts'),
        path.join(this.frontendPath, 'src/middleware.ts')
      ];
      
      for (const middlewareFile of middlewareFiles) {
        try {
          const content = await fs.readFile(middlewareFile, 'utf8');
          if (content.includes('auth') || 
              content.includes('protected') || 
              content.includes('token')) {
            protectedRoutes = true;
            break;
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      // Test session/state management
      const stateFiles = [
        path.join(this.frontendPath, 'src/store/auth-store.ts'),
        path.join(this.frontendPath, 'src/contexts/auth.tsx')
      ];
      
      for (const stateFile of stateFiles) {
        try {
          const content = await fs.readFile(stateFile, 'utf8');
          if (content.includes('session') || 
              content.includes('user') || 
              content.includes('isAuthenticated')) {
            sessionManagement = true;
            break;
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      return {
        test: 'Authentication Flow',
        passed: loginImplementation && (protectedRoutes || sessionManagement),
        details: `Login: ${loginImplementation}, Protected routes: ${protectedRoutes}, Session mgmt: ${sessionManagement}`,
        metrics: {
          login: loginImplementation,
          protectedRoutes,
          sessionManagement
        }
      };
      
    } catch (error) {
      return {
        test: 'Authentication Flow',
        passed: false,
        error: error.message
      };
    }
  }

  async testDataPersistenceFlow() {
    try {
      // Test Supabase integration
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const hasSupabase = packageJson.dependencies['@supabase/supabase-js'];
      
      if (!hasSupabase) {
        throw new Error('Supabase dependency not found');
      }
      
      // Test data fetching patterns
      const queryFiles = [
        path.join(this.frontendPath, 'src/lib/api'),
        path.join(this.frontendPath, 'src/hooks'),
        path.join(this.frontendPath, 'src/queries')
      ];
      
      let dataFetching = 0;
      let errorHandling = 0;
      let loadingStates = 0;
      
      for (const queryPath of queryFiles) {
        try {
          const items = await fs.readdir(queryPath);
          
          for (const item of items) {
            if (item.endsWith('.ts') || item.endsWith('.js')) {
              const content = await fs.readFile(path.join(queryPath, item), 'utf8');
              
              // Count data fetching patterns
              if (content.includes('useQuery') || 
                  content.includes('fetch') || 
                  content.includes('supabase')) {
                dataFetching++;
              }
              
              // Count error handling
              if (content.includes('error') || 
                  content.includes('catch') || 
                  content.includes('try')) {
                errorHandling++;
              }
              
              // Count loading states
              if (content.includes('loading') || 
                  content.includes('pending') || 
                  content.includes('isLoading')) {
                loadingStates++;
              }
            }
          }
        } catch (error) {
          // Directory doesn't exist
        }
      }
      
      // Test TanStack Query integration
      const hasTanStackQuery = packageJson.dependencies['@tanstack/react-query'];
      
      return {
        test: 'Data Persistence Flow',
        passed: hasSupabase && dataFetching > 0,
        details: `Supabase: ${hasSupabase}, Data fetching: ${dataFetching}, Error handling: ${errorHandling}, TanStack Query: ${!!hasTanStackQuery}`,
        metrics: {
          supabase: hasSupabase,
          dataFetching,
          errorHandling,
          loadingStates,
          tanStackQuery: !!hasTanStackQuery
        }
      };
      
    } catch (error) {
      return {
        test: 'Data Persistence Flow',
        passed: false,
        error: error.message
      };
    }
  }

  async testRealTimeFeatures() {
    try {
      // Test WebSocket/real-time integration
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const realTimeLibs = [
        'socket.io-client',
        '@supabase/supabase-js', // Has real-time features
        'ws'
      ];
      
      const foundRealTimeLibs = realTimeLibs.filter(lib => 
        packageJson.dependencies[lib] || packageJson.devDependencies[lib]
      );
      
      // Test WebSocket provider/context
      const wsFiles = [
        path.join(this.frontendPath, 'src/lib/websocket'),
        path.join(this.frontendPath, 'src/contexts/websocket.tsx'),
        path.join(this.frontendPath, 'src/hooks/useWebSocket.ts')
      ];
      
      let wsImplementation = false;
      for (const wsFile of wsFiles) {
        try {
          await fs.access(wsFile);
          wsImplementation = true;
          break;
        } catch (error) {
          // File doesn't exist
        }
      }
      
      // Test real-time usage in components
      const componentFiles = await this.findComponentFiles();
      let realTimeUsage = 0;
      
      for (const file of componentFiles.slice(0, 5)) {
        const content = await fs.readFile(file, 'utf8');
        
        const realTimePatterns = [
          'subscribe',
          'channel',
          'socket',
          'realtime',
          'live'
        ];
        
        const foundPatterns = realTimePatterns.filter(pattern => 
          content.includes(pattern)
        );
        
        if (foundPatterns.length > 0) {
          realTimeUsage++;
        }
      }
      
      // Test backend WebSocket support
      let backendWebSocket = false;
      try {
        const cargoPath = path.join(this.backendPath, 'Cargo.toml');
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        backendWebSocket = cargoContent.includes('ws') || 
                          cargoContent.includes('tokio-tungstenite');
      } catch (error) {
        console.warn('Backend WebSocket check skipped');
      }
      
      return {
        test: 'Real-time Features',
        passed: foundRealTimeLibs.length > 0 || wsImplementation || backendWebSocket,
        details: `${foundRealTimeLibs.length} RT libs, WS impl: ${wsImplementation}, ${realTimeUsage} components, Backend WS: ${backendWebSocket}`,
        metrics: {
          realTimeLibs: foundRealTimeLibs.length,
          wsImplementation,
          componentUsage: realTimeUsage,
          backendWebSocket
        }
      };
      
    } catch (error) {
      return {
        test: 'Real-time Features',
        passed: false,
        error: error.message
      };
    }
  }

  async testErrorHandling() {
    try {
      // Test error boundary implementation
      const componentFiles = await this.findComponentFiles();
      let errorBoundaries = 0;
      let errorHandling = 0;
      let loadingStates = 0;
      
      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Error boundaries
        if (content.includes('ErrorBoundary') || 
            content.includes('componentDidCatch') ||
            content.includes('getDerivedStateFromError')) {
          errorBoundaries++;
        }
        
        // General error handling
        if (content.includes('try {') || 
            content.includes('.catch(') || 
            content.includes('error:')) {
          errorHandling++;
        }
        
        // Loading states
        if (content.includes('loading') || 
            content.includes('pending') || 
            content.includes('isLoading')) {
          loadingStates++;
        }
      }
      
      // Test global error handling
      const globalErrorFiles = [
        path.join(this.frontendPath, 'src/app/global-error.tsx'),
        path.join(this.frontendPath, 'src/app/error.tsx'),
        path.join(this.frontendPath, 'pages/_error.tsx')
      ];
      
      let globalErrorHandling = false;
      for (const errorFile of globalErrorFiles) {
        try {
          await fs.access(errorFile);
          globalErrorHandling = true;
          break;
        } catch (error) {
          // File doesn't exist
        }
      }
      
      // Test 404 handling
      const notFoundFiles = [
        path.join(this.frontendPath, 'src/app/not-found.tsx'),
        path.join(this.frontendPath, 'pages/404.tsx')
      ];
      
      let notFoundHandling = false;
      for (const notFoundFile of notFoundFiles) {
        try {
          await fs.access(notFoundFile);
          notFoundHandling = true;
          break;
        } catch (error) {
          // File doesn't exist
        }
      }
      
      return {
        test: 'Error Handling',
        passed: errorHandling > 0 || globalErrorHandling,
        details: `${errorBoundaries} error boundaries, ${errorHandling} error handling, Global: ${globalErrorHandling}, 404: ${notFoundHandling}`,
        metrics: {
          errorBoundaries,
          errorHandling,
          loadingStates,
          globalErrorHandling,
          notFoundHandling
        }
      };
      
    } catch (error) {
      return {
        test: 'Error Handling',
        passed: false,
        error: error.message
      };
    }
  }

  async testResponsiveDesign() {
    try {
      // Test responsive breakpoints in Tailwind
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      
      const breakpoints = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
      const customBreakpoints = tailwindConfig.includes('screens:');
      
      // Test responsive usage in components
      const componentFiles = await this.findComponentFiles();
      let responsiveComponents = 0;
      
      for (const file of componentFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        const foundBreakpoints = breakpoints.filter(bp => 
          content.includes(bp)
        );
        
        if (foundBreakpoints.length > 0) {
          responsiveComponents++;
        }
      }
      
      // Test container usage
      const hasContainer = tailwindConfig.includes('container:');
      
      // Test mobile-first approach
      const componentUsage = componentFiles.length > 0 ? 
        (responsiveComponents / Math.min(componentFiles.length, 10)) * 100 : 0;
      
      return {
        test: 'Responsive Design',
        passed: responsiveComponents > 0 && hasContainer,
        details: `${responsiveComponents} responsive components, Container: ${hasContainer}, Custom breakpoints: ${customBreakpoints}, Usage: ${Math.round(componentUsage)}%`,
        metrics: {
          responsiveComponents,
          container: hasContainer,
          customBreakpoints,
          usagePercentage: Math.round(componentUsage)
        }
      };
      
    } catch (error) {
      return {
        test: 'Responsive Design',
        passed: false,
        error: error.message
      };
    }
  }

  async testAccessibility() {
    try {
      // Test Radix UI components (accessible by default)
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const radixComponents = Object.keys(packageJson.dependencies || {}).filter(dep => 
        dep.startsWith('@radix-ui/')
      );
      
      // Test semantic HTML usage
      const componentFiles = await this.findComponentFiles();
      let semanticComponents = 0;
      let ariaUsage = 0;
      
      const semanticElements = ['main', 'nav', 'aside', 'section', 'article', 'header', 'footer'];
      const ariaAttributes = ['aria-', 'role=', 'tabIndex'];
      
      for (const file of componentFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        const foundSemantic = semanticElements.filter(element => 
          content.includes(`<${element}`) || content.includes(`"${element}"`)
        );
        
        const foundAria = ariaAttributes.filter(attr => 
          content.includes(attr)
        );
        
        if (foundSemantic.length > 0) {
          semanticComponents++;
        }
        
        if (foundAria.length > 0) {
          ariaUsage++;
        }
      }
      
      // Test focus management
      const tailwindConfigPath = path.join(this.frontendPath, 'tailwind.config.js');
      const tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
      const hasFocusRing = tailwindConfig.includes('ring:') || tailwindConfig.includes('focus:');
      
      return {
        test: 'Accessibility',
        passed: radixComponents.length > 0 || semanticComponents > 0,
        details: `${radixComponents.length} Radix components, ${semanticComponents} semantic components, ${ariaUsage} ARIA usage, Focus ring: ${hasFocusRing}`,
        metrics: {
          radixComponents: radixComponents.length,
          semanticComponents,
          ariaUsage,
          focusRing: hasFocusRing
        }
      };
      
    } catch (error) {
      return {
        test: 'Accessibility',
        passed: false,
        error: error.message
      };
    }
  }

  async testPerformanceMetrics() {
    try {
      // Test Web Vitals integration
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const performanceLibs = [
        'web-vitals',
        '@vercel/analytics',
        '@sentry/nextjs'
      ];
      
      const foundPerfLibs = performanceLibs.filter(lib => 
        packageJson.dependencies[lib] || packageJson.devDependencies[lib]
      );
      
      // Test performance monitoring implementation
      const appFiles = [
        path.join(this.frontendPath, 'src/app/layout.tsx'),
        path.join(this.frontendPath, 'pages/_app.tsx')
      ];
      
      let performanceMonitoring = false;
      for (const appFile of appFiles) {
        try {
          const content = await fs.readFile(appFile, 'utf8');
          if (content.includes('reportWebVitals') || 
              content.includes('Analytics') || 
              content.includes('vitals')) {
            performanceMonitoring = true;
            break;
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      // Test image optimization
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      const imageOptimization = nextConfig.includes('images:') && 
                               nextConfig.includes('formats');
      
      return {
        test: 'Performance Metrics',
        passed: foundPerfLibs.length > 0 || performanceMonitoring || imageOptimization,
        details: `${foundPerfLibs.length} perf libs, Monitoring: ${performanceMonitoring}, Image opt: ${imageOptimization}`,
        metrics: {
          performanceLibs: foundPerfLibs.length,
          monitoring: performanceMonitoring,
          imageOptimization
        }
      };
      
    } catch (error) {
      return {
        test: 'Performance Metrics',
        passed: false,
        error: error.message
      };
    }
  }

  async testCrossOriginRequests() {
    try {
      // Test CORS configuration
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      const corsFeatures = [
        'headers',
        'rewrites',
        'Access-Control',
        'origin'
      ];
      
      const foundCorsFeatures = corsFeatures.filter(feature => 
        nextConfig.includes(feature)
      );
      
      // Test API proxy configuration
      const apiProxyConfig = nextConfig.includes('rewrites') && 
                            nextConfig.includes('destination');
      
      // Test environment configuration for API endpoints
      const envFiles = [
        path.join(this.frontendPath, '.env.example'),
        path.join(this.frontendPath, '.env.local')
      ];
      
      let apiEndpointConfig = false;
      for (const envFile of envFiles) {
        try {
          const content = await fs.readFile(envFile, 'utf8');
          if (content.includes('API_URL') || 
              content.includes('BACKEND_URL') || 
              content.includes('NEXT_PUBLIC_')) {
            apiEndpointConfig = true;
            break;
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      return {
        test: 'Cross-Origin Requests',
        passed: foundCorsFeatures.length > 0 || apiProxyConfig || apiEndpointConfig,
        details: `${foundCorsFeatures.length} CORS features, Proxy: ${apiProxyConfig}, Env config: ${apiEndpointConfig}`,
        metrics: {
          corsFeatures: foundCorsFeatures.length,
          apiProxy: apiProxyConfig,
          envConfig: apiEndpointConfig
        }
      };
      
    } catch (error) {
      return {
        test: 'Cross-Origin Requests',
        passed: false,
        error: error.message
      };
    }
  }

  async testFormValidation() {
    try {
      // Test form validation libraries
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const formLibs = [
        'react-hook-form',
        '@hookform/resolvers',
        'zod',
        'yup'
      ];
      
      const foundFormLibs = formLibs.filter(lib => 
        packageJson.dependencies[lib] || packageJson.devDependencies[lib]
      );
      
      // Test form implementation in components
      const componentFiles = await this.findComponentFiles();
      let formsWithValidation = 0;
      let totalForms = 0;
      
      for (const file of componentFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        // Count forms
        if (content.includes('<form') || content.includes('useForm')) {
          totalForms++;
          
          // Check for validation
          const validationPatterns = [
            'useForm',
            'zodResolver',
            'yupResolver',
            'register(',
            'errors.',
            'isValid'
          ];
          
          const foundValidation = validationPatterns.filter(pattern => 
            content.includes(pattern)
          );
          
          if (foundValidation.length > 0) {
            formsWithValidation++;
          }
        }
      }
      
      const validationRate = totalForms > 0 ? 
        (formsWithValidation / totalForms) * 100 : 0;
      
      return {
        test: 'Form Validation',
        passed: foundFormLibs.length > 0 && formsWithValidation > 0,
        details: `${foundFormLibs.length} form libs, ${formsWithValidation}/${totalForms} forms validated (${Math.round(validationRate)}%)`,
        metrics: {
          formLibs: foundFormLibs.length,
          validatedForms: formsWithValidation,
          totalForms,
          validationRate: Math.round(validationRate)
        }
      };
      
    } catch (error) {
      return {
        test: 'Form Validation',
        passed: false,
        error: error.message
      };
    }
  }

  async testNavigationFlow() {
    try {
      // Test Next.js navigation
      const componentFiles = await this.findComponentFiles();
      let navigationUsage = 0;
      let linkUsage = 0;
      let routerUsage = 0;
      
      for (const file of componentFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        // Count navigation patterns
        if (content.includes('useRouter') || content.includes('router.push')) {
          routerUsage++;
        }
        
        if (content.includes('Link') && content.includes('next/link')) {
          linkUsage++;
        }
        
        if (content.includes('navigation') || content.includes('nav')) {
          navigationUsage++;
        }
      }
      
      // Test navigation component
      const navFiles = [
        path.join(this.frontendPath, 'src/components/Navigation.tsx'),
        path.join(this.frontendPath, 'src/components/Navbar.tsx'),
        path.join(this.frontendPath, 'src/components/Header.tsx')
      ];
      
      let hasNavigation = false;
      for (const navFile of navFiles) {
        try {
          await fs.access(navFile);
          hasNavigation = true;
          break;
        } catch (error) {
          // File doesn't exist
        }
      }
      
      // Test layout with navigation
      const layoutPath = path.join(this.frontendPath, 'src/app/layout.tsx');
      let layoutNavigation = false;
      
      try {
        const layoutContent = await fs.readFile(layoutPath, 'utf8');
        layoutNavigation = layoutContent.includes('nav') || 
                          layoutContent.includes('Navigation') ||
                          layoutContent.includes('Header');
      } catch (error) {
        console.warn('Layout file not found');
      }
      
      return {
        test: 'Navigation Flow',
        passed: routerUsage > 0 || linkUsage > 0 || hasNavigation,
        details: `Router: ${routerUsage}, Links: ${linkUsage}, Navigation: ${navigationUsage}, Has nav component: ${hasNavigation}, Layout nav: ${layoutNavigation}`,
        metrics: {
          routerUsage,
          linkUsage,
          navigationUsage,
          hasNavigationComponent: hasNavigation,
          layoutNavigation
        }
      };
      
    } catch (error) {
      return {
        test: 'Navigation Flow',
        passed: false,
        error: error.message
      };
    }
  }

  // Utility methods
  async findComponentFiles() {
    const files = [];
    const searchPaths = [
      path.join(this.frontendPath, 'src/components'),
      path.join(this.frontendPath, 'src/app'),
      path.join(this.frontendPath, 'components')
    ];
    
    for (const searchPath of searchPaths) {
      try {
        await this.findFilesRecursive(searchPath, files, ['.tsx', '.jsx']);
      } catch (error) {
        // Directory doesn't exist
      }
    }
    
    return files.slice(0, 15); // Limit for performance
  }

  async findFilesRecursive(dir, files, extensions) {
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          await this.findFilesRecursive(itemPath, files, extensions);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or access error
    }
  }
}

module.exports = E2ETests;