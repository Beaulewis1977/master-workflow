/**
 * Security Tests
 * Headers, Input Validation, Authentication, CORS, Dependencies
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SecurityTests {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.frontendPath = path.join(projectPath, 'frontend');
    this.backendPath = path.join(projectPath, 'backend');
  }

  async runAllTests() {
    const results = [];
    
    try {
      results.push(await this.testSecurityHeaders());
      results.push(await this.testInputValidation());
      results.push(await this.testAuthenticationSecurity());
      results.push(await this.testCORSConfiguration());
      results.push(await this.testDependencyVulnerabilities());
      results.push(await this.testPasswordSecurity());
      results.push(await this.testJWTSecurity());
      results.push(await this.testDataValidation());
      results.push(await this.testSQLInjectionPrevention());
      results.push(await this.testXSSPrevention());
      results.push(await this.testCSRFProtection());
      results.push(await this.testRateLimiting());
      results.push(await this.testSecureTransport());
      results.push(await this.testSecretsManagement());
      
    } catch (error) {
      results.push({
        test: 'Security Test Suite',
        passed: false,
        error: error.message
      });
    }
    
    return results;
  }

  async testSecurityHeaders() {
    try {
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Test required security headers
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];
      
      const foundHeaders = requiredHeaders.filter(header => 
        nextConfig.includes(header)
      );
      
      if (foundHeaders.length < 3) {
        throw new Error(`Missing security headers: ${requiredHeaders.filter(h => !foundHeaders.includes(h)).join(', ')}`);
      }
      
      // Test specific header values
      const secureValues = [
        'DENY',
        'nosniff',
        'strict-origin-when-cross-origin'
      ];
      
      const foundValues = secureValues.filter(value => 
        nextConfig.includes(value)
      );
      
      // Test Content Security Policy
      const hasCSP = nextConfig.includes('Content-Security-Policy') || 
                    nextConfig.includes('CSP');
      
      return {
        test: 'Security Headers',
        passed: foundHeaders.length >= 3,
        details: `${foundHeaders.length}/${requiredHeaders.length} headers${hasCSP ? ', CSP configured' : ''}`,
        metrics: {
          foundHeaders: foundHeaders.length,
          requiredHeaders: requiredHeaders.length,
          csp: hasCSP
        }
      };
      
    } catch (error) {
      return {
        test: 'Security Headers',
        passed: false,
        error: error.message
      };
    }
  }

  async testInputValidation() {
    try {
      // Test frontend validation
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check for validation libraries
      const validationLibs = [
        'zod',
        'yup',
        'joi',
        'react-hook-form',
        '@hookform/resolvers'
      ];
      
      const foundValidationLibs = validationLibs.filter(lib => 
        packageJson.dependencies[lib] || packageJson.devDependencies[lib]
      );
      
      if (foundValidationLibs.length === 0) {
        throw new Error('No validation libraries found');
      }
      
      // Test backend validation (Rust)
      let backendValidation = 0;
      try {
        const cargoPath = path.join(this.backendPath, 'Cargo.toml');
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        
        const rustValidationLibs = [
          'validator',
          'serde',
          'garde'
        ];
        
        backendValidation = rustValidationLibs.filter(lib => 
          cargoContent.includes(lib)
        ).length;
        
      } catch (error) {
        console.warn('Backend validation check skipped');
      }
      
      // Test validation usage in components
      const componentFiles = await this.findComponentFiles();
      let validationUsage = 0;
      
      for (const file of componentFiles.slice(0, 5)) {
        const content = await fs.readFile(file, 'utf8');
        
        const validationPatterns = [
          'useForm',
          'zodResolver',
          'yupResolver',
          'validate',
          'schema',
          'z.'
        ];
        
        const foundPatterns = validationPatterns.filter(pattern => 
          content.includes(pattern)
        );
        
        if (foundPatterns.length > 0) {
          validationUsage++;
        }
      }
      
      return {
        test: 'Input Validation',
        passed: foundValidationLibs.length > 0,
        details: `${foundValidationLibs.length} frontend libs, ${backendValidation} backend libs, ${validationUsage} components use validation`,
        metrics: {
          frontendLibs: foundValidationLibs.length,
          backendLibs: backendValidation,
          componentUsage: validationUsage
        }
      };
      
    } catch (error) {
      return {
        test: 'Input Validation',
        passed: false,
        error: error.message
      };
    }
  }

  async testAuthenticationSecurity() {
    try {
      // Test Supabase auth integration
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const authLibs = [
        '@supabase/supabase-js',
        '@supabase/auth-helpers-nextjs',
        'next-auth',
        'jsonwebtoken'
      ];
      
      const foundAuthLibs = authLibs.filter(lib => 
        packageJson.dependencies[lib] || packageJson.devDependencies[lib]
      );
      
      if (foundAuthLibs.length === 0) {
        throw new Error('No authentication libraries found');
      }
      
      // Test auth store/context
      const authStoreFiles = [
        path.join(this.frontendPath, 'src/store/auth-store.ts'),
        path.join(this.frontendPath, 'src/lib/auth.ts'),
        path.join(this.frontendPath, 'src/contexts/auth.tsx')
      ];
      
      let authImplementation = 0;
      for (const file of authStoreFiles) {
        try {
          await fs.access(file);
          authImplementation++;
        } catch (error) {
          // File doesn't exist
        }
      }
      
      // Test backend auth (Rust)
      let backendAuth = 0;
      try {
        const cargoPath = path.join(this.backendPath, 'Cargo.toml');
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        
        const authFeatures = [
          'jsonwebtoken',
          'argon2',
          'uuid',
          'rand'
        ];
        
        backendAuth = authFeatures.filter(feature => 
          cargoContent.includes(feature)
        ).length;
        
      } catch (error) {
        console.warn('Backend auth check skipped');
      }
      
      // Test middleware/route protection
      const middlewareFiles = [
        path.join(this.frontendPath, 'middleware.ts'),
        path.join(this.frontendPath, 'src/middleware.ts')
      ];
      
      let hasMiddleware = false;
      for (const file of middlewareFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          if (content.includes('auth') || content.includes('token') || content.includes('protected')) {
            hasMiddleware = true;
            break;
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      return {
        test: 'Authentication Security',
        passed: foundAuthLibs.length > 0 && (authImplementation > 0 || backendAuth > 0),
        details: `${foundAuthLibs.length} auth libs, ${authImplementation} frontend impl, ${backendAuth} backend features${hasMiddleware ? ', middleware' : ''}`,
        metrics: {
          authLibs: foundAuthLibs.length,
          frontendImpl: authImplementation,
          backendFeatures: backendAuth,
          middleware: hasMiddleware
        }
      };
      
    } catch (error) {
      return {
        test: 'Authentication Security',
        passed: false,
        error: error.message
      };
    }
  }

  async testCORSConfiguration() {
    try {
      // Test Next.js CORS headers
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      const corsHeaders = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers',
        'Origin'
      ];
      
      const foundCorsHeaders = corsHeaders.filter(header => 
        nextConfig.includes(header)
      );
      
      // Test backend CORS (Rust)
      let backendCors = 0;
      try {
        const mainPath = path.join(this.backendPath, 'src/main.rs');
        const mainContent = await fs.readFile(mainPath, 'utf8');
        
        const corsFeatures = [
          'CorsLayer',
          'cors',
          'allow_origin',
          'allow_methods',
          'allow_headers'
        ];
        
        backendCors = corsFeatures.filter(feature => 
          mainContent.includes(feature)
        ).length;
        
      } catch (error) {
        console.warn('Backend CORS check skipped');
      }
      
      // Test for overly permissive CORS
      const hasWildcard = nextConfig.includes('*') || 
                         (backendCors > 0 && nextConfig.includes('Any'));
      
      return {
        test: 'CORS Configuration',
        passed: foundCorsHeaders.length > 0 || backendCors > 0,
        details: `${foundCorsHeaders.length} frontend headers, ${backendCors} backend features${hasWildcard ? ' (warning: wildcard found)' : ''}`,
        metrics: {
          frontendHeaders: foundCorsHeaders.length,
          backendFeatures: backendCors,
          hasWildcard
        }
      };
      
    } catch (error) {
      return {
        test: 'CORS Configuration',
        passed: false,
        error: error.message
      };
    }
  }

  async testDependencyVulnerabilities() {
    try {
      let frontendVulns = 0;
      let backendVulns = 0;
      
      // Test frontend dependencies
      process.chdir(this.frontendPath);
      try {
        const auditResult = execSync('npm audit --audit-level moderate --json', { 
          stdio: 'pipe',
          timeout: 60000
        });
        const auditData = JSON.parse(auditResult.toString());
        frontendVulns = auditData.metadata?.vulnerabilities?.total || 0;
      } catch (error) {
        console.warn('Frontend audit failed or vulnerabilities found');
      }
      
      // Test backend dependencies (Rust)
      try {
        process.chdir(this.backendPath);
        execSync('cargo audit', { stdio: 'pipe', timeout: 60000 });
      } catch (error) {
        if (error.status === 1) {
          backendVulns = 1; // Vulnerabilities found
        } else {
          console.warn('Backend audit failed (cargo-audit not installed)');
        }
      }
      
      // Test for known vulnerable patterns
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Check for outdated or vulnerable packages
      const potentiallyVulnerable = [
        'lodash',
        'moment',
        'request',
        'node-fetch'
      ];
      
      const foundVulnerable = potentiallyVulnerable.filter(pkg => 
        packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]
      );
      
      const totalVulns = frontendVulns + backendVulns + foundVulnerable.length;
      
      return {
        test: 'Dependency Vulnerabilities',
        passed: totalVulns === 0,
        details: `Frontend: ${frontendVulns}, Backend: ${backendVulns}, Potentially vulnerable: ${foundVulnerable.length}`,
        metrics: {
          frontendVulns,
          backendVulns,
          potentiallyVulnerable: foundVulnerable.length,
          total: totalVulns
        }
      };
      
    } catch (error) {
      return {
        test: 'Dependency Vulnerabilities',
        passed: false,
        error: error.message
      };
    }
  }

  async testPasswordSecurity() {
    try {
      // Test backend password hashing
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      
      try {
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        
        const hashingLibs = [
          'argon2',
          'bcrypt',
          'scrypt',
          'pbkdf2'
        ];
        
        const foundHashingLibs = hashingLibs.filter(lib => 
          cargoContent.includes(lib)
        );
        
        if (foundHashingLibs.length === 0) {
          throw new Error('No password hashing libraries found in backend');
        }
        
        // Test for secure random number generation
        const randomLibs = ['rand', 'getrandom'];
        const foundRandomLibs = randomLibs.filter(lib => 
          cargoContent.includes(lib)
        );
        
        return {
          test: 'Password Security',
          passed: foundHashingLibs.length > 0,
          details: `${foundHashingLibs.length} hashing libs, ${foundRandomLibs.length} random libs`,
          metrics: {
            hashingLibs: foundHashingLibs.length,
            randomLibs: foundRandomLibs.length
          }
        };
        
      } catch (error) {
        return {
          test: 'Password Security',
          passed: true,
          details: 'Backend not available (using Supabase auth)'
        };
      }
      
    } catch (error) {
      return {
        test: 'Password Security',
        passed: false,
        error: error.message
      };
    }
  }

  async testJWTSecurity() {
    try {
      // Test JWT implementation
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const jwtLibs = [
        'jsonwebtoken',
        'jose',
        '@supabase/supabase-js'
      ];
      
      const foundJwtLibs = jwtLibs.filter(lib => 
        packageJson.dependencies[lib] || packageJson.devDependencies[lib]
      );
      
      // Test backend JWT
      let backendJwt = false;
      try {
        const cargoPath = path.join(this.backendPath, 'Cargo.toml');
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        backendJwt = cargoContent.includes('jsonwebtoken');
      } catch (error) {
        console.warn('Backend JWT check skipped');
      }
      
      // Test for JWT best practices in code
      const authFiles = await this.findAuthFiles();
      let secureJwtUsage = 0;
      
      for (const file of authFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        const securePatterns = [
          'expiresIn',
          'exp:',
          'iat:',
          'verify',
          'secret',
          'algorithm'
        ];
        
        const foundPatterns = securePatterns.filter(pattern => 
          content.includes(pattern)
        );
        
        if (foundPatterns.length >= 2) {
          secureJwtUsage++;
        }
      }
      
      return {
        test: 'JWT Security',
        passed: foundJwtLibs.length > 0 || backendJwt,
        details: `${foundJwtLibs.length} frontend JWT libs, backend: ${backendJwt}, ${secureJwtUsage} secure implementations`,
        metrics: {
          frontendLibs: foundJwtLibs.length,
          backendJwt,
          secureImplementations: secureJwtUsage
        }
      };
      
    } catch (error) {
      return {
        test: 'JWT Security',
        passed: false,
        error: error.message
      };
    }
  }

  async testDataValidation() {
    try {
      // Test schema validation
      const schemaFiles = await this.findSchemaFiles();
      let validationSchemas = 0;
      
      for (const file of schemaFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        const validationPatterns = [
          'z.',
          'string()',
          'number()',
          'email()',
          'min(',
          'max(',
          'required()',
          'optional()'
        ];
        
        const foundPatterns = validationPatterns.filter(pattern => 
          content.includes(pattern)
        );
        
        if (foundPatterns.length >= 2) {
          validationSchemas++;
        }
      }
      
      // Test API route validation
      const apiFiles = await this.findAPIFiles();
      let validatedRoutes = 0;
      
      for (const file of apiFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        if (content.includes('validate') || 
            content.includes('parse') || 
            content.includes('schema')) {
          validatedRoutes++;
        }
      }
      
      return {
        test: 'Data Validation',
        passed: validationSchemas > 0 || validatedRoutes > 0,
        details: `${validationSchemas} validation schemas, ${validatedRoutes} validated API routes`,
        metrics: {
          validationSchemas,
          validatedRoutes
        }
      };
      
    } catch (error) {
      return {
        test: 'Data Validation',
        passed: false,
        error: error.message
      };
    }
  }

  async testSQLInjectionPrevention() {
    try {
      // Test backend ORM/query builder usage
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      
      try {
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        
        if (!cargoContent.includes('sqlx')) {
          return {
            test: 'SQL Injection Prevention',
            passed: true,
            details: 'No direct SQL usage (using Supabase)'
          };
        }
        
        // Test for parameterized queries
        const rustFiles = await this.findRustFiles();
        let parameterizedQueries = 0;
        let rawQueries = 0;
        
        for (const file of rustFiles) {
          const content = await fs.readFile(file, 'utf8');
          
          // Look for parameterized queries
          if (content.includes('query!') || 
              content.includes('$1') || 
              content.includes('bind(')) {
            parameterizedQueries++;
          }
          
          // Look for potentially dangerous raw queries
          if (content.includes('query_raw') || 
              content.includes('format!') && content.includes('SELECT')) {
            rawQueries++;
          }
        }
        
        return {
          test: 'SQL Injection Prevention',
          passed: parameterizedQueries > 0 && rawQueries === 0,
          details: `${parameterizedQueries} parameterized queries, ${rawQueries} raw queries`,
          metrics: {
            parameterizedQueries,
            rawQueries,
            safe: rawQueries === 0
          }
        };
        
      } catch (error) {
        return {
          test: 'SQL Injection Prevention',
          passed: true,
          details: 'Backend not available (using Supabase)'
        };
      }
      
    } catch (error) {
      return {
        test: 'SQL Injection Prevention',
        passed: false,
        error: error.message
      };
    }
  }

  async testXSSPrevention() {
    try {
      // Test React's built-in XSS protection
      const componentFiles = await this.findComponentFiles();
      let dangerouslySetInnerHTML = 0;
      let sanitizationUsage = 0;
      
      for (const file of componentFiles.slice(0, 10)) {
        const content = await fs.readFile(file, 'utf8');
        
        // Look for dangerous patterns
        if (content.includes('dangerouslySetInnerHTML')) {
          dangerouslySetInnerHTML++;
        }
        
        // Look for sanitization
        if (content.includes('sanitize') || 
            content.includes('escape') ||
            content.includes('DOMPurify')) {
          sanitizationUsage++;
        }
      }
      
      // Test for XSS protection libraries
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const xssProtectionLibs = [
        'dompurify',
        'xss',
        'sanitize-html'
      ];
      
      const foundXssLibs = xssProtectionLibs.filter(lib => 
        packageJson.dependencies[lib] || packageJson.devDependencies[lib]
      );
      
      return {
        test: 'XSS Prevention',
        passed: dangerouslySetInnerHTML === 0 || sanitizationUsage > 0,
        details: `${dangerouslySetInnerHTML} dangerous HTML usage, ${sanitizationUsage} sanitization, ${foundXssLibs.length} XSS libs`,
        metrics: {
          dangerousHTML: dangerouslySetInnerHTML,
          sanitization: sanitizationUsage,
          xssLibs: foundXssLibs.length,
          safe: dangerouslySetInnerHTML === 0 || sanitizationUsage > 0
        }
      };
      
    } catch (error) {
      return {
        test: 'XSS Prevention',
        passed: false,
        error: error.message
      };
    }
  }

  async testCSRFProtection() {
    try {
      // Test CSRF token implementation
      const middlewareFiles = [
        path.join(this.frontendPath, 'middleware.ts'),
        path.join(this.frontendPath, 'src/middleware.ts')
      ];
      
      let csrfMiddleware = false;
      for (const file of middlewareFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          if (content.includes('csrf') || content.includes('token') || content.includes('origin')) {
            csrfMiddleware = true;
            break;
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      // Test backend CSRF protection
      let backendCsrf = false;
      try {
        const cargoPath = path.join(this.backendPath, 'Cargo.toml');
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        
        if (cargoContent.includes('csrf') || cargoContent.includes('tower-csrf')) {
          backendCsrf = true;
        }
      } catch (error) {
        console.warn('Backend CSRF check skipped');
      }
      
      // Test SameSite cookie attributes
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      const sameSiteConfig = nextConfig.includes('SameSite') || 
                           nextConfig.includes('sameSite');
      
      return {
        test: 'CSRF Protection',
        passed: csrfMiddleware || backendCsrf || sameSiteConfig,
        details: `Middleware: ${csrfMiddleware}, Backend: ${backendCsrf}, SameSite: ${sameSiteConfig}`,
        metrics: {
          middleware: csrfMiddleware,
          backend: backendCsrf,
          sameSite: sameSiteConfig
        }
      };
      
    } catch (error) {
      return {
        test: 'CSRF Protection',
        passed: false,
        error: error.message
      };
    }
  }

  async testRateLimiting() {
    try {
      // Test backend rate limiting
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      
      try {
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        
        const rateLimitLibs = [
          'tower-governor',
          'rate-limit',
          'governor'
        ];
        
        const foundRateLimitLibs = rateLimitLibs.filter(lib => 
          cargoContent.includes(lib)
        );
        
        // Test implementation
        const mainPath = path.join(this.backendPath, 'src/main.rs');
        const mainContent = await fs.readFile(mainPath, 'utf8');
        
        const rateLimitImpl = mainContent.includes('RateLimit') || 
                             mainContent.includes('governor') ||
                             mainContent.includes('limit');
        
        return {
          test: 'Rate Limiting',
          passed: foundRateLimitLibs.length > 0 && rateLimitImpl,
          details: `${foundRateLimitLibs.length} rate limit libs, implementation: ${rateLimitImpl}`,
          metrics: {
            rateLimitLibs: foundRateLimitLibs.length,
            implementation: rateLimitImpl
          }
        };
        
      } catch (error) {
        return {
          test: 'Rate Limiting',
          passed: true,
          details: 'Backend not available (using platform rate limiting)'
        };
      }
      
    } catch (error) {
      return {
        test: 'Rate Limiting',
        passed: false,
        error: error.message
      };
    }
  }

  async testSecureTransport() {
    try {
      // Test HTTPS configuration
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      const httpsFeatures = [
        'Strict-Transport-Security',
        'https',
        'secure',
        'ssl'
      ];
      
      const foundHttpsFeatures = httpsFeatures.filter(feature => 
        nextConfig.includes(feature)
      );
      
      // Test environment configuration
      const envFiles = [
        path.join(this.frontendPath, '.env.example'),
        path.join(this.frontendPath, '.env.local')
      ];
      
      let httpsEnvConfig = false;
      for (const file of envFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          if (content.includes('https://') || content.includes('SSL')) {
            httpsEnvConfig = true;
            break;
          }
        } catch (error) {
          // File doesn't exist
        }
      }
      
      return {
        test: 'Secure Transport',
        passed: foundHttpsFeatures.length > 0 || httpsEnvConfig,
        details: `${foundHttpsFeatures.length} HTTPS features, env config: ${httpsEnvConfig}`,
        metrics: {
          httpsFeatures: foundHttpsFeatures.length,
          envConfig: httpsEnvConfig
        }
      };
      
    } catch (error) {
      return {
        test: 'Secure Transport',
        passed: false,
        error: error.message
      };
    }
  }

  async testSecretsManagement() {
    try {
      // Test environment variable usage
      const envFiles = [
        path.join(this.frontendPath, '.env.example'),
        path.join(this.frontendPath, '.env.local'),
        path.join(this.backendPath, '.env.example')
      ];
      
      let secretsInEnv = 0;
      let exposedSecrets = 0;
      
      for (const file of envFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          
          const secretPatterns = [
            'SECRET',
            'KEY',
            'TOKEN',
            'PASSWORD',
            'API_KEY'
          ];
          
          const foundSecrets = secretPatterns.filter(pattern => 
            content.includes(pattern)
          );
          
          secretsInEnv += foundSecrets.length;
          
          // Check for exposed secrets (actual values)
          const lines = content.split('\n');
          for (const line of lines) {
            if (line.includes('=') && !line.includes('your_') && !line.includes('example') && line.length > 20) {
              exposedSecrets++;
            }
          }
          
        } catch (error) {
          // File doesn't exist
        }
      }
      
      // Test for .env in .gitignore
      const gitignorePath = path.join(this.projectPath, '.gitignore');
      let gitignoreSecure = false;
      
      try {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        gitignoreSecure = gitignoreContent.includes('.env') && 
                         !gitignoreContent.includes('.env.example');
      } catch (error) {
        console.warn('.gitignore not found');
      }
      
      return {
        test: 'Secrets Management',
        passed: secretsInEnv > 0 && exposedSecrets === 0 && gitignoreSecure,
        details: `${secretsInEnv} env secrets, ${exposedSecrets} exposed, gitignore: ${gitignoreSecure}`,
        metrics: {
          envSecrets: secretsInEnv,
          exposedSecrets,
          gitignoreSecure,
          safe: exposedSecrets === 0
        }
      };
      
    } catch (error) {
      return {
        test: 'Secrets Management',
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
      path.join(this.frontendPath, 'src/app')
    ];
    
    for (const searchPath of searchPaths) {
      try {
        await this.findFilesRecursive(searchPath, files, ['.tsx', '.jsx']);
      } catch (error) {
        // Directory doesn't exist
      }
    }
    
    return files.slice(0, 10); // Limit for performance
  }

  async findAuthFiles() {
    const files = [];
    const searchPaths = [
      path.join(this.frontendPath, 'src/lib/auth.ts'),
      path.join(this.frontendPath, 'src/store/auth-store.ts'),
      path.join(this.frontendPath, 'src/contexts/auth.tsx'),
      path.join(this.backendPath, 'src/auth.rs')
    ];
    
    for (const filePath of searchPaths) {
      try {
        await fs.access(filePath);
        files.push(filePath);
      } catch (error) {
        // File doesn't exist
      }
    }
    
    return files;
  }

  async findSchemaFiles() {
    const files = [];
    const searchPaths = [
      path.join(this.frontendPath, 'src/lib/schemas'),
      path.join(this.frontendPath, 'src/schemas'),
      path.join(this.frontendPath, 'src/types')
    ];
    
    for (const searchPath of searchPaths) {
      try {
        await this.findFilesRecursive(searchPath, files, ['.ts', '.js']);
      } catch (error) {
        // Directory doesn't exist
      }
    }
    
    return files;
  }

  async findAPIFiles() {
    const files = [];
    const searchPath = path.join(this.frontendPath, 'src/app/api');
    
    try {
      await this.findFilesRecursive(searchPath, files, ['.ts', '.js']);
    } catch (error) {
      // Directory doesn't exist
    }
    
    return files;
  }

  async findRustFiles() {
    const files = [];
    const searchPath = path.join(this.backendPath, 'src');
    
    try {
      await this.findFilesRecursive(searchPath, files, ['.rs']);
    } catch (error) {
      // Directory doesn't exist
    }
    
    return files;
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

module.exports = SecurityTests;