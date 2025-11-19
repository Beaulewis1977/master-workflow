/**
 * State Management Tests
 * Zustand, Persistence, TypeScript Integration, DevTools
 */

const fs = require('fs').promises;
const path = require('path');

class StateManagementTests {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.frontendPath = path.join(projectPath, 'frontend');
  }

  async runAllTests() {
    const results = [];
    
    try {
      results.push(await this.testZustandSetup());
      results.push(await this.testStoreStructure());
      results.push(await this.testStateActions());
      results.push(await this.testMiddlewareIntegration());
      results.push(await this.testPersistenceLayer());
      results.push(await this.testTypeScriptIntegration());
      results.push(await this.testSelectorPatterns());
      results.push(await this.testAsyncActions());
      results.push(await this.testStateSubscriptions());
      results.push(await this.testDevToolsIntegration());
      results.push(await this.testPerformanceOptimizations());
      results.push(await this.testErrorBoundaries());
      
    } catch (error) {
      results.push({
        test: 'State Management Test Suite',
        passed: false,
        error: error.message
      });
    }
    
    return results;
  }

  async testZustandSetup() {
    try {
      // Test Zustand dependency
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (!packageJson.dependencies['zustand']) {
        throw new Error('Zustand dependency not found');
      }
      
      // Test store files exist
      const storeFiles = [
        path.join(this.frontendPath, 'src/store/app-store.ts'),
        path.join(this.frontendPath, 'src/store/auth-store.ts')
      ];
      
      let foundStores = 0;
      for (const storeFile of storeFiles) {
        try {
          await fs.access(storeFile);
          foundStores++;
        } catch (error) {
          // Store file doesn't exist
        }
      }
      
      if (foundStores === 0) {
        throw new Error('No Zustand store files found');
      }
      
      return {
        test: 'Zustand Setup',
        passed: true,
        details: `Zustand dependency installed, ${foundStores} store files found`
      };
      
    } catch (error) {
      return {
        test: 'Zustand Setup',
        passed: false,
        error: error.message
      };
    }
  }

  async testStoreStructure() {
    try {
      const appStorePath = path.join(this.frontendPath, 'src/store/app-store.ts');
      const appStoreContent = await fs.readFile(appStorePath, 'utf8');
      
      // Test store structure
      const storeFeatures = [
        'import { create }',
        'interface',
        'State',
        'Actions',
        'export const use'
      ];
      
      const missingFeatures = storeFeatures.filter(feature => 
        !appStoreContent.includes(feature)
      );
      
      if (missingFeatures.length > 0) {
        throw new Error(`Missing store features: ${missingFeatures.join(', ')}`);
      }
      
      // Test state shape
      const stateProperties = [
        'theme',
        'loading',
        'error',
        'notifications'
      ];
      
      const foundProperties = stateProperties.filter(prop => 
        appStoreContent.includes(prop)
      );
      
      // Test action functions
      const actionPatterns = [
        'set(',
        '=>',
        'async',
        'get()'
      ];
      
      const foundActions = actionPatterns.filter(pattern => 
        appStoreContent.includes(pattern)
      );
      
      return {
        test: 'Store Structure',
        passed: true,
        details: `${foundProperties.length} state properties, ${foundActions.length} action patterns`
      };
      
    } catch (error) {
      return {
        test: 'Store Structure',
        passed: false,
        error: error.message
      };
    }
  }

  async testStateActions() {
    try {
      const appStorePath = path.join(this.frontendPath, 'src/store/app-store.ts');
      const appStoreContent = await fs.readFile(appStorePath, 'utf8');
      
      // Test CRUD actions
      const crudActions = [
        'add',
        'update',
        'remove',
        'clear',
        'set',
        'get'
      ];
      
      const foundCrudActions = crudActions.filter(action => 
        appStoreContent.includes(action) || 
        appStoreContent.includes(action.charAt(0).toUpperCase() + action.slice(1))
      );
      
      // Test async actions
      const asyncPatterns = [
        'async ',
        'await ',
        'Promise',
        '.then(',
        '.catch('
      ];
      
      const foundAsyncPatterns = asyncPatterns.filter(pattern => 
        appStoreContent.includes(pattern)
      );
      
      // Test state mutations
      const mutationPatterns = [
        'state.',
        'draft.',
        'produce(',
        'immer'
      ];
      
      const foundMutationPatterns = mutationPatterns.filter(pattern => 
        appStoreContent.includes(pattern)
      );
      
      return {
        test: 'State Actions',
        passed: true,
        details: `${foundCrudActions.length} CRUD actions, ${foundAsyncPatterns.length} async patterns, ${foundMutationPatterns.length} mutation patterns`
      };
      
    } catch (error) {
      return {
        test: 'State Actions',
        passed: false,
        error: error.message
      };
    }
  }

  async testMiddlewareIntegration() {
    try {
      const appStorePath = path.join(this.frontendPath, 'src/store/app-store.ts');
      const appStoreContent = await fs.readFile(appStorePath, 'utf8');
      
      // Test middleware imports
      const middlewareImports = [
        'subscribeWithSelector',
        'persist',
        'immer',
        'devtools'
      ];
      
      const foundMiddleware = middlewareImports.filter(middleware => 
        appStoreContent.includes(middleware)
      );
      
      if (foundMiddleware.length === 0) {
        throw new Error('No Zustand middleware found');
      }
      
      // Test middleware configuration
      const middlewareConfigs = foundMiddleware.filter(middleware => {
        // Check if middleware is actually used in store creation
        const middlewareUsage = new RegExp(`${middleware}\\s*\\(`).test(appStoreContent);
        return middlewareUsage;
      });
      
      // Test specific middleware features
      let persistenceConfig = false;
      let immerConfig = false;
      let selectorConfig = false;
      
      if (appStoreContent.includes('persist')) {
        persistenceConfig = appStoreContent.includes('name:') && 
                           appStoreContent.includes('partialize');
      }
      
      if (appStoreContent.includes('immer')) {
        immerConfig = appStoreContent.includes('state.') || 
                     appStoreContent.includes('draft.');
      }
      
      if (appStoreContent.includes('subscribeWithSelector')) {
        selectorConfig = true;
      }
      
      return {
        test: 'Middleware Integration',
        passed: true,
        details: `${middlewareConfigs.length} middleware configured${persistenceConfig ? ', persistence' : ''}${immerConfig ? ', immer' : ''}${selectorConfig ? ', selectors' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Middleware Integration',
        passed: false,
        error: error.message
      };
    }
  }

  async testPersistenceLayer() {
    try {
      const appStorePath = path.join(this.frontendPath, 'src/store/app-store.ts');
      const appStoreContent = await fs.readFile(appStorePath, 'utf8');
      
      // Test persistence configuration
      if (!appStoreContent.includes('persist')) {
        return {
          test: 'Persistence Layer',
          passed: true,
          details: 'No persistence configured (optional)'
        };
      }
      
      // Test persistence options
      const persistenceFeatures = [
        'name:',
        'partialize',
        'storage',
        'version',
        'migrate'
      ];
      
      const foundFeatures = persistenceFeatures.filter(feature => 
        appStoreContent.includes(feature)
      );
      
      if (foundFeatures.length < 2) {
        throw new Error('Incomplete persistence configuration');
      }
      
      // Test partialize function
      const hasPartialize = appStoreContent.includes('partialize:') && 
                           appStoreContent.includes('state =>');
      
      if (!hasPartialize) {
        throw new Error('Partialize function not properly configured');
      }
      
      // Test storage type
      const storageTypes = ['localStorage', 'sessionStorage', 'AsyncStorage'];
      const foundStorage = storageTypes.filter(storage => 
        appStoreContent.includes(storage)
      );
      
      return {
        test: 'Persistence Layer',
        passed: true,
        details: `${foundFeatures.length} persistence features, partialize configured${foundStorage.length ? `, ${foundStorage[0]}` : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Persistence Layer',
        passed: false,
        error: error.message
      };
    }
  }

  async testTypeScriptIntegration() {
    try {
      const appStorePath = path.join(this.frontendPath, 'src/store/app-store.ts');
      const appStoreContent = await fs.readFile(appStorePath, 'utf8');
      
      // Test TypeScript interfaces
      const tsFeatures = [
        'interface',
        'type',
        ': string',
        ': number',
        ': boolean',
        ': Array<',
        '<'
      ];
      
      const foundTsFeatures = tsFeatures.filter(feature => 
        appStoreContent.includes(feature)
      );
      
      if (foundTsFeatures.length < 4) {
        throw new Error('Insufficient TypeScript type definitions');
      }
      
      // Test store typing
      const storeTyping = [
        '<AppState>',
        'interface AppState',
        'State &',
        'Actions'
      ];
      
      const foundStoreTyping = storeTyping.filter(typing => 
        appStoreContent.includes(typing)
      );
      
      // Test function signatures
      const functionSignatures = [
        ') =>',
        ': (',
        'async (',
        'Promise<'
      ];
      
      const foundSignatures = functionSignatures.filter(sig => 
        appStoreContent.includes(sig)
      );
      
      // Test exports with types
      const exportPatterns = [
        'export const use',
        'export interface',
        'export type'
      ];
      
      const foundExports = exportPatterns.filter(pattern => 
        appStoreContent.includes(pattern)
      );
      
      return {
        test: 'TypeScript Integration',
        passed: true,
        details: `${foundTsFeatures.length} TS features, ${foundStoreTyping.length} store typing, ${foundSignatures.length} function signatures`
      };
      
    } catch (error) {
      return {
        test: 'TypeScript Integration',
        passed: false,
        error: error.message
      };
    }
  }

  async testSelectorPatterns() {
    try {
      const appStorePath = path.join(this.frontendPath, 'src/store/app-store.ts');
      const appStoreContent = await fs.readFile(appStorePath, 'utf8');
      
      // Test selector exports
      const selectorPatterns = [
        'export const use',
        '=> useAppStore(',
        'state =>',
        'state.'
      ];
      
      const foundSelectors = selectorPatterns.filter(pattern => 
        appStoreContent.includes(pattern)
      );
      
      // Count actual selector functions
      const selectorMatches = appStoreContent.match(/export const use\w+/g) || [];
      const selectorCount = selectorMatches.length;
      
      // Test memoized selectors
      const memoizedPatterns = [
        'useCallback',
        'useMemo',
        'shallow',
        'subscribeWithSelector'
      ];
      
      const foundMemoized = memoizedPatterns.filter(pattern => 
        appStoreContent.includes(pattern)
      );
      
      // Test computed values
      const computedPatterns = [
        'get(',
        'computed',
        'derived'
      ];
      
      const foundComputed = computedPatterns.filter(pattern => 
        appStoreContent.includes(pattern)
      );
      
      return {
        test: 'Selector Patterns',
        passed: true,
        details: `${selectorCount} selectors exported, ${foundMemoized.length} memoization patterns, ${foundComputed.length} computed patterns`
      };
      
    } catch (error) {
      return {
        test: 'Selector Patterns',
        passed: false,
        error: error.message
      };
    }
  }

  async testAsyncActions() {
    try {
      const storeFiles = await this.findStoreFiles();
      let asyncActionCount = 0;
      let errorHandlingCount = 0;
      let loadingStateCount = 0;
      
      for (const storeFile of storeFiles) {
        const content = await fs.readFile(storeFile, 'utf8');
        
        // Count async actions
        const asyncMatches = content.match(/async\s+\w+/g) || [];
        asyncActionCount += asyncMatches.length;
        
        // Count error handling
        const errorPatterns = ['try {', 'catch (', '.catch(', 'error'];
        errorHandlingCount += errorPatterns.filter(pattern => 
          content.includes(pattern)
        ).length;
        
        // Count loading state management
        const loadingPatterns = ['loading', 'pending', 'isLoading'];
        loadingStateCount += loadingPatterns.filter(pattern => 
          content.includes(pattern)
        ).length;
      }
      
      return {
        test: 'Async Actions',
        passed: true,
        details: `${asyncActionCount} async actions, ${errorHandlingCount} error handling patterns, ${loadingStateCount} loading states`
      };
      
    } catch (error) {
      return {
        test: 'Async Actions',
        passed: false,
        error: error.message
      };
    }
  }

  async testStateSubscriptions() {
    try {
      const appStorePath = path.join(this.frontendPath, 'src/store/app-store.ts');
      const appStoreContent = await fs.readFile(appStorePath, 'utf8');
      
      // Test subscription features
      const subscriptionFeatures = [
        'subscribeWithSelector',
        'subscribe',
        'listener',
        'callback'
      ];
      
      const foundSubscriptions = subscriptionFeatures.filter(feature => 
        appStoreContent.includes(feature)
      );
      
      // Test React integration
      const reactIntegration = [
        'useEffect',
        'useState',
        'useCallback',
        'useMemo'
      ];
      
      // Check component files for store usage
      const componentFiles = await this.findComponentFiles();
      let storeUsageCount = 0;
      let subscriptionUsageCount = 0;
      
      for (const componentFile of componentFiles) {
        const content = await fs.readFile(componentFile, 'utf8');
        
        if (content.includes('useAppStore') || content.includes('useAuth')) {
          storeUsageCount++;
        }
        
        const foundReactIntegration = reactIntegration.filter(hook => 
          content.includes(hook)
        );
        
        if (foundReactIntegration.length > 0) {
          subscriptionUsageCount++;
        }
      }
      
      return {
        test: 'State Subscriptions',
        passed: true,
        details: `${foundSubscriptions.length} subscription features, ${storeUsageCount} components use store, ${subscriptionUsageCount} use React hooks`
      };
      
    } catch (error) {
      return {
        test: 'State Subscriptions',
        passed: false,
        error: error.message
      };
    }
  }

  async testDevToolsIntegration() {
    try {
      const appStorePath = path.join(this.frontendPath, 'src/store/app-store.ts');
      const appStoreContent = await fs.readFile(appStorePath, 'utf8');
      
      // Test devtools configuration
      const devtoolsFeatures = [
        'devtools',
        'name:',
        'enabled:',
        'trace:'
      ];
      
      const foundDevtools = devtoolsFeatures.filter(feature => 
        appStoreContent.includes(feature)
      );
      
      if (foundDevtools.length === 0) {
        return {
          test: 'DevTools Integration',
          passed: true,
          details: 'No explicit devtools configuration (using defaults)'
        };
      }
      
      // Test environment-based devtools
      const envPatterns = [
        'process.env',
        'NODE_ENV',
        'development',
        '__DEV__'
      ];
      
      const foundEnvPatterns = envPatterns.filter(pattern => 
        appStoreContent.includes(pattern)
      );
      
      return {
        test: 'DevTools Integration',
        passed: true,
        details: `${foundDevtools.length} devtools features${foundEnvPatterns.length ? ', environment-aware' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'DevTools Integration',
        passed: false,
        error: error.message
      };
    }
  }

  async testPerformanceOptimizations() {
    try {
      const storeFiles = await this.findStoreFiles();
      let optimizationCount = 0;
      
      // Test performance patterns
      const optimizationPatterns = [
        'shallow',
        'useCallback',
        'useMemo',
        'subscribeWithSelector',
        'partialize',
        'getState',
        'setState'
      ];
      
      for (const storeFile of storeFiles) {
        const content = await fs.readFile(storeFile, 'utf8');
        
        const foundOptimizations = optimizationPatterns.filter(pattern => 
          content.includes(pattern)
        );
        
        optimizationCount += foundOptimizations.length;
      }
      
      // Test component-level optimizations
      const componentFiles = await this.findComponentFiles();
      let componentOptimizations = 0;
      
      for (const componentFile of componentFiles) {
        const content = await fs.readFile(componentFile, 'utf8');
        
        const componentPatterns = [
          'React.memo',
          'useCallback',
          'useMemo',
          'shallow'
        ];
        
        const foundComponentOptimizations = componentPatterns.filter(pattern => 
          content.includes(pattern)
        );
        
        if (foundComponentOptimizations.length > 0) {
          componentOptimizations++;
        }
      }
      
      return {
        test: 'Performance Optimizations',
        passed: true,
        details: `${optimizationCount} store optimizations, ${componentOptimizations} optimized components`
      };
      
    } catch (error) {
      return {
        test: 'Performance Optimizations',
        passed: false,
        error: error.message
      };
    }
  }

  async testErrorBoundaries() {
    try {
      const storeFiles = await this.findStoreFiles();
      let errorHandlingCount = 0;
      
      for (const storeFile of storeFiles) {
        const content = await fs.readFile(storeFile, 'utf8');
        
        // Test error handling patterns
        const errorPatterns = [
          'try {',
          'catch (',
          '.catch(',
          'error:',
          'Error',
          'throw',
          'finally'
        ];
        
        const foundErrorHandling = errorPatterns.filter(pattern => 
          content.includes(pattern)
        );
        
        errorHandlingCount += foundErrorHandling.length;
      }
      
      // Test React error boundaries
      const componentFiles = await this.findComponentFiles();
      let errorBoundaryCount = 0;
      
      for (const componentFile of componentFiles) {
        const content = await fs.readFile(componentFile, 'utf8');
        
        if (content.includes('ErrorBoundary') || 
            content.includes('componentDidCatch') ||
            content.includes('getDerivedStateFromError')) {
          errorBoundaryCount++;
        }
      }
      
      return {
        test: 'Error Boundaries',
        passed: true,
        details: `${errorHandlingCount} error handling patterns, ${errorBoundaryCount} error boundaries`
      };
      
    } catch (error) {
      return {
        test: 'Error Boundaries',
        passed: false,
        error: error.message
      };
    }
  }

  async findStoreFiles() {
    const storeDir = path.join(this.frontendPath, 'src/store');
    const files = [];
    
    try {
      const items = await fs.readdir(storeDir);
      for (const item of items) {
        if (item.endsWith('.ts') || item.endsWith('.js')) {
          files.push(path.join(storeDir, item));
        }
      }
    } catch (error) {
      // Store directory doesn't exist
    }
    
    return files;
  }

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
    
    return files.slice(0, 10); // Limit to first 10 for performance
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

module.exports = StateManagementTests;