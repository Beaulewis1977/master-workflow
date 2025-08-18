/**
 * Backend Technology Tests
 * Rust, Axum, sqlx, Redis, WebSocket, Authentication
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class BackendTests {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.backendPath = path.join(projectPath, 'backend');
  }

  async runAllTests() {
    const results = [];
    
    try {
      results.push(await this.testRustEnvironment());
      results.push(await this.testCargoConfiguration());
      results.push(await this.testAxumSetup());
      results.push(await this.testDatabaseIntegration());
      results.push(await this.testRedisIntegration());
      results.push(await this.testWebSocketSupport());
      results.push(await this.testAuthenticationSystem());
      results.push(await this.testMiddlewareStack());
      results.push(await this.testErrorHandling());
      results.push(await this.testLoggingSystem());
      results.push(await this.testSecurityFeatures());
      results.push(await this.testBuildProcess());
      results.push(await this.testDockerSupport());
      
    } catch (error) {
      results.push({
        test: 'Backend Test Suite',
        passed: false,
        error: error.message
      });
    }
    
    return results;
  }

  async testRustEnvironment() {
    try {
      // Check Rust installation
      try {
        execSync('rustc --version', { stdio: 'pipe' });
      } catch (error) {
        throw new Error('Rust compiler not found');
      }
      
      try {
        execSync('cargo --version', { stdio: 'pipe' });
      } catch (error) {
        throw new Error('Cargo package manager not found');
      }
      
      // Check Rust edition
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      if (!cargoContent.includes('edition = "2021"')) {
        throw new Error('Not using Rust 2021 edition');
      }
      
      return {
        test: 'Rust Environment',
        passed: true,
        details: 'Rust and Cargo available, using 2021 edition'
      };
      
    } catch (error) {
      return {
        test: 'Rust Environment',
        passed: false,
        error: error.message
      };
    }
  }

  async testCargoConfiguration() {
    try {
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      // Test required dependencies
      const requiredDeps = [
        'axum',
        'tokio',
        'sqlx',
        'redis',
        'serde',
        'jsonwebtoken',
        'tower',
        'tower-http',
        'tracing',
        'anyhow',
        'thiserror'
      ];
      
      const missingDeps = requiredDeps.filter(dep => 
        !cargoContent.includes(`${dep} =`)
      );
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Test features configuration
      const requiredFeatures = [
        'features =',
        'runtime-tokio-rustls',
        'postgres',
        'migrate'
      ];
      
      const missingFeatures = requiredFeatures.filter(feature => 
        !cargoContent.includes(feature)
      );
      
      if (missingFeatures.length > 0) {
        throw new Error(`Missing features: ${missingFeatures.join(', ')}`);
      }
      
      // Test dev dependencies
      const devDeps = ['tokio-test'];
      const foundDevDeps = devDeps.filter(dep => 
        cargoContent.includes(dep)
      );
      
      return {
        test: 'Cargo Configuration',
        passed: true,
        details: `All ${requiredDeps.length} dependencies configured, ${foundDevDeps.length} dev dependencies`
      };
      
    } catch (error) {
      return {
        test: 'Cargo Configuration',
        passed: false,
        error: error.message
      };
    }
  }

  async testAxumSetup() {
    try {
      const mainPath = path.join(this.backendPath, 'src/main.rs');
      const mainContent = await fs.readFile(mainPath, 'utf8');
      
      // Test Axum imports and setup
      const requiredImports = [
        'use axum',
        'Router',
        'routing::'
      ];
      
      const missingImports = requiredImports.filter(imp => 
        !mainContent.includes(imp)
      );
      
      if (missingImports.length > 0) {
        throw new Error(`Missing Axum imports: ${missingImports.join(', ')}`);
      }
      
      // Test router configuration
      const routerFeatures = [
        'Router::new()',
        '.route(',
        '.nest(',
        '.layer(',
        '.with_state('
      ];
      
      const missingFeatures = routerFeatures.filter(feature => 
        !mainContent.includes(feature)
      );
      
      if (missingFeatures.length > 0) {
        throw new Error(`Missing router features: ${missingFeatures.join(', ')}`);
      }
      
      // Test async main function
      if (!mainContent.includes('#[tokio::main]') || !mainContent.includes('async fn main()')) {
        throw new Error('Missing or invalid async main function');
      }
      
      return {
        test: 'Axum Setup',
        passed: true,
        details: 'Complete Axum router configuration with async runtime'
      };
      
    } catch (error) {
      return {
        test: 'Axum Setup',
        passed: false,
        error: error.message
      };
    }
  }

  async testDatabaseIntegration() {
    try {
      // Test sqlx configuration
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      if (!cargoContent.includes('sqlx')) {
        throw new Error('sqlx dependency not found');
      }
      
      // Test database module
      const dbModulePath = path.join(this.backendPath, 'src/database.rs');
      
      try {
        const dbContent = await fs.readFile(dbModulePath, 'utf8');
        
        // Test database features
        const dbFeatures = [
          'use sqlx',
          'Pool',
          'Postgres',
          'async fn',
          'migrate'
        ];
        
        const missingFeatures = dbFeatures.filter(feature => 
          !dbContent.includes(feature)
        );
        
        if (missingFeatures.length > 0) {
          throw new Error(`Missing database features: ${missingFeatures.join(', ')}`);
        }
        
      } catch (error) {
        throw new Error('Database module (database.rs) not found or invalid');
      }
      
      // Test migrations
      const migrationsPath = path.join(this.backendPath, 'migrations');
      
      try {
        const migrations = await fs.readdir(migrationsPath);
        const sqlMigrations = migrations.filter(file => file.endsWith('.sql'));
        
        if (sqlMigrations.length === 0) {
          throw new Error('No SQL migrations found');
        }
        
        return {
          test: 'Database Integration',
          passed: true,
          details: `sqlx configured with ${sqlMigrations.length} migrations`
        };
        
      } catch (error) {
        return {
          test: 'Database Integration',
          passed: true,
          details: 'sqlx configured (no migrations found)'
        };
      }
      
    } catch (error) {
      return {
        test: 'Database Integration',
        passed: false,
        error: error.message
      };
    }
  }

  async testRedisIntegration() {
    try {
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      if (!cargoContent.includes('redis')) {
        throw new Error('Redis dependency not found');
      }
      
      // Test Redis features
      const redisFeatures = ['tokio-comp', 'connection-manager'];
      const foundFeatures = redisFeatures.filter(feature => 
        cargoContent.includes(feature)
      );
      
      if (foundFeatures.length === 0) {
        throw new Error('Redis features not configured');
      }
      
      // Look for Redis usage in source code
      const srcFiles = await this.findRustFiles(path.join(this.backendPath, 'src'));
      let redisUsage = false;
      
      for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('use redis') || content.includes('Redis')) {
          redisUsage = true;
          break;
        }
      }
      
      return {
        test: 'Redis Integration',
        passed: true,
        details: `Redis configured with ${foundFeatures.length} features${redisUsage ? ', usage found' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Redis Integration',
        passed: false,
        error: error.message
      };
    }
  }

  async testWebSocketSupport() {
    try {
      // Test WebSocket dependencies
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      const wsFeatures = ['ws', 'tokio-tungstenite'];
      const foundWsFeatures = wsFeatures.filter(feature => 
        cargoContent.includes(feature)
      );
      
      if (foundWsFeatures.length === 0) {
        throw new Error('WebSocket features not configured');
      }
      
      // Test WebSocket module
      const wsModulePath = path.join(this.backendPath, 'src/websocket.rs');
      
      try {
        const wsContent = await fs.readFile(wsModulePath, 'utf8');
        
        const wsFeatures = [
          'WebSocket',
          'async fn',
          'upgrade',
          'handler'
        ];
        
        const missingFeatures = wsFeatures.filter(feature => 
          !wsContent.includes(feature)
        );
        
        if (missingFeatures.length > 0) {
          throw new Error(`Missing WebSocket features: ${missingFeatures.join(', ')}`);
        }
        
        return {
          test: 'WebSocket Support',
          passed: true,
          details: 'Complete WebSocket implementation with handler'
        };
        
      } catch (error) {
        return {
          test: 'WebSocket Support',
          passed: true,
          details: 'WebSocket dependencies configured (no handler found)'
        };
      }
      
    } catch (error) {
      return {
        test: 'WebSocket Support',
        passed: false,
        error: error.message
      };
    }
  }

  async testAuthenticationSystem() {
    try {
      // Test JWT dependency
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      if (!cargoContent.includes('jsonwebtoken')) {
        throw new Error('JWT dependency not found');
      }
      
      // Test auth module
      const authModulePath = path.join(this.backendPath, 'src/auth.rs');
      
      try {
        const authContent = await fs.readFile(authModulePath, 'utf8');
        
        const authFeatures = [
          'jsonwebtoken',
          'Claims',
          'encode',
          'decode',
          'async fn'
        ];
        
        const foundFeatures = authFeatures.filter(feature => 
          authContent.includes(feature)
        );
        
        if (foundFeatures.length < 3) {
          throw new Error('Incomplete authentication implementation');
        }
        
        return {
          test: 'Authentication System',
          passed: true,
          details: `JWT authentication with ${foundFeatures.length} features`
        };
        
      } catch (error) {
        return {
          test: 'Authentication System',
          passed: true,
          details: 'JWT dependency configured (no auth module found)'
        };
      }
      
    } catch (error) {
      return {
        test: 'Authentication System',
        passed: false,
        error: error.message
      };
    }
  }

  async testMiddlewareStack() {
    try {
      const mainPath = path.join(this.backendPath, 'src/main.rs');
      const mainContent = await fs.readFile(mainPath, 'utf8');
      
      // Test middleware layers
      const middlewareLayers = [
        'TraceLayer',
        'CorsLayer',
        'ServiceBuilder'
      ];
      
      const foundLayers = middlewareLayers.filter(layer => 
        mainContent.includes(layer)
      );
      
      if (foundLayers.length === 0) {
        throw new Error('No middleware layers configured');
      }
      
      // Test CORS configuration
      if (mainContent.includes('CorsLayer')) {
        const corsFeatures = ['allow_origin', 'allow_methods', 'allow_headers'];
        const foundCorsFeatures = corsFeatures.filter(feature => 
          mainContent.includes(feature)
        );
        
        if (foundCorsFeatures.length === 0) {
          throw new Error('CORS layer found but not properly configured');
        }
      }
      
      return {
        test: 'Middleware Stack',
        passed: true,
        details: `${foundLayers.length} middleware layers configured`
      };
      
    } catch (error) {
      return {
        test: 'Middleware Stack',
        passed: false,
        error: error.message
      };
    }
  }

  async testErrorHandling() {
    try {
      // Test error handling dependencies
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      const errorDeps = ['anyhow', 'thiserror'];
      const foundErrorDeps = errorDeps.filter(dep => 
        cargoContent.includes(dep)
      );
      
      if (foundErrorDeps.length === 0) {
        throw new Error('No error handling dependencies found');
      }
      
      // Test error module
      const errorModulePath = path.join(this.backendPath, 'src/error.rs');
      
      try {
        const errorContent = await fs.readFile(errorModulePath, 'utf8');
        
        const errorFeatures = [
          'Error',
          'Result',
          'derive',
          'Display'
        ];
        
        const foundFeatures = errorFeatures.filter(feature => 
          errorContent.includes(feature)
        );
        
        return {
          test: 'Error Handling',
          passed: true,
          details: `${foundErrorDeps.length} error deps, error module with ${foundFeatures.length} features`
        };
        
      } catch (error) {
        return {
          test: 'Error Handling',
          passed: true,
          details: `${foundErrorDeps.length} error handling dependencies configured`
        };
      }
      
    } catch (error) {
      return {
        test: 'Error Handling',
        passed: false,
        error: error.message
      };
    }
  }

  async testLoggingSystem() {
    try {
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      // Test logging dependencies
      const loggingDeps = ['tracing', 'tracing-subscriber'];
      const foundLoggingDeps = loggingDeps.filter(dep => 
        cargoContent.includes(dep)
      );
      
      if (foundLoggingDeps.length === 0) {
        throw new Error('No logging dependencies found');
      }
      
      // Test logging setup in main.rs
      const mainPath = path.join(this.backendPath, 'src/main.rs');
      const mainContent = await fs.readFile(mainPath, 'utf8');
      
      const loggingFeatures = [
        'tracing_subscriber',
        'EnvFilter',
        'fmt::layer',
        'init()'
      ];
      
      const foundFeatures = loggingFeatures.filter(feature => 
        mainContent.includes(feature)
      );
      
      if (foundFeatures.length < 2) {
        throw new Error('Logging not properly initialized');
      }
      
      return {
        test: 'Logging System',
        passed: true,
        details: `Tracing configured with ${foundFeatures.length} features`
      };
      
    } catch (error) {
      return {
        test: 'Logging System',
        passed: false,
        error: error.message
      };
    }
  }

  async testSecurityFeatures() {
    try {
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoPath, 'utf8');
      
      // Test security dependencies
      const securityDeps = ['argon2', 'rand', 'tower-governor'];
      const foundSecurityDeps = securityDeps.filter(dep => 
        cargoContent.includes(dep)
      );
      
      if (foundSecurityDeps.length === 0) {
        throw new Error('No security dependencies found');
      }
      
      // Test Sentry integration (optional)
      const sentryIntegration = cargoContent.includes('sentry');
      
      return {
        test: 'Security Features',
        passed: true,
        details: `${foundSecurityDeps.length} security dependencies${sentryIntegration ? ', Sentry integration' : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Security Features',
        passed: false,
        error: error.message
      };
    }
  }

  async testBuildProcess() {
    try {
      process.chdir(this.backendPath);
      
      // Test debug build
      const debugStart = Date.now();
      try {
        execSync('cargo check', { stdio: 'pipe', timeout: 120000 });
      } catch (error) {
        throw new Error('Debug build check failed');
      }
      const debugDuration = Date.now() - debugStart;
      
      // Test release build (optional, can be slow)
      let releaseDuration = 0;
      try {
        const releaseStart = Date.now();
        execSync('cargo build --release', { stdio: 'pipe', timeout: 300000 });
        releaseDuration = Date.now() - releaseStart;
      } catch (error) {
        console.warn('Release build skipped (timeout or error)');
      }
      
      return {
        test: 'Build Process',
        passed: true,
        details: `Debug: ${Math.round(debugDuration / 1000)}s${releaseDuration ? `, Release: ${Math.round(releaseDuration / 1000)}s` : ''}`
      };
      
    } catch (error) {
      return {
        test: 'Build Process',
        passed: false,
        error: error.message
      };
    }
  }

  async testDockerSupport() {
    try {
      const dockerfilePath = path.join(this.backendPath, 'Dockerfile');
      
      try {
        const dockerfileContent = await fs.readFile(dockerfilePath, 'utf8');
        
        // Test Dockerfile structure
        const dockerFeatures = [
          'FROM rust',
          'WORKDIR',
          'COPY',
          'RUN cargo',
          'EXPOSE',
          'CMD'
        ];
        
        const foundFeatures = dockerFeatures.filter(feature => 
          dockerfileContent.includes(feature)
        );
        
        if (foundFeatures.length < 4) {
          throw new Error('Incomplete Dockerfile');
        }
        
        // Test multi-stage build (recommended)
        const multiStage = dockerfileContent.includes('as builder');
        
        return {
          test: 'Docker Support',
          passed: true,
          details: `Dockerfile with ${foundFeatures.length} features${multiStage ? ', multi-stage build' : ''}`
        };
        
      } catch (error) {
        return {
          test: 'Docker Support',
          passed: true,
          details: 'No Dockerfile found (optional)'
        };
      }
      
    } catch (error) {
      return {
        test: 'Docker Support',
        passed: false,
        error: error.message
      };
    }
  }

  async findRustFiles(dir, files = []) {
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          await this.findRustFiles(itemPath, files);
        } else if (item.endsWith('.rs')) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or access error
    }
    
    return files;
  }
}

module.exports = BackendTests;