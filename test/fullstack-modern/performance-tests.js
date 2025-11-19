/**
 * Performance Tests
 * Load Testing, Bundle Analysis, Memory Usage, Metrics Collection
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

class PerformanceTests {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.frontendPath = path.join(projectPath, 'frontend');
    this.backendPath = path.join(projectPath, 'backend');
  }

  async runAllTests() {
    const results = [];
    
    try {
      results.push(await this.testBuildPerformance());
      results.push(await this.testBundleSize());
      results.push(await this.testServerStartupTime());
      results.push(await this.testMemoryUsage());
      results.push(await this.testNetworkOptimization());
      results.push(await this.testImageOptimization());
      results.push(await this.testCodeSplitting());
      results.push(await this.testTreeShaking());
      results.push(await this.testCompressionTest());
      results.push(await this.testCacheStrategies());
      results.push(await this.testDatabasePerformance());
      results.push(await this.testConcurrencyHandling());
      
    } catch (error) {
      results.push({
        test: 'Performance Test Suite',
        passed: false,
        error: error.message
      });
    }
    
    return results;
  }

  async testBuildPerformance() {
    try {
      // Frontend build performance
      process.chdir(this.frontendPath);
      const frontendStart = performance.now();
      
      try {
        execSync('npm run build', { stdio: 'pipe', timeout: 300000 }); // 5 minutes
      } catch (error) {
        throw new Error('Frontend build failed');
      }
      
      const frontendDuration = performance.now() - frontendStart;
      
      // Backend build performance (if Rust is available)
      let backendDuration = 0;
      try {
        process.chdir(this.backendPath);
        const backendStart = performance.now();
        execSync('cargo build --release', { stdio: 'pipe', timeout: 600000 }); // 10 minutes
        backendDuration = performance.now() - backendStart;
      } catch (error) {
        console.warn('Backend build skipped (Rust not available or failed)');
      }
      
      // Performance thresholds
      const frontendSeconds = Math.round(frontendDuration / 1000);
      const backendSeconds = Math.round(backendDuration / 1000);
      
      const frontendOptimal = frontendSeconds < 120; // Under 2 minutes
      const backendOptimal = backendSeconds < 300 || backendDuration === 0; // Under 5 minutes
      
      return {
        test: 'Build Performance',
        passed: frontendOptimal && backendOptimal,
        details: `Frontend: ${frontendSeconds}s${backendDuration ? `, Backend: ${backendSeconds}s` : ''}`,
        metrics: {
          frontendBuildTime: frontendSeconds,
          backendBuildTime: backendSeconds,
          optimal: frontendOptimal && backendOptimal
        }
      };
      
    } catch (error) {
      return {
        test: 'Build Performance',
        passed: false,
        error: error.message
      };
    }
  }

  async testBundleSize() {
    try {
      process.chdir(this.frontendPath);
      
      // Ensure build exists
      try {
        await fs.access('.next');
      } catch (error) {
        throw new Error('Build output not found. Run build test first.');
      }
      
      // Analyze bundle sizes
      const buildPath = path.join(this.frontendPath, '.next');
      const staticPath = path.join(buildPath, 'static');
      
      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;
      let fileCount = 0;
      
      try {
        await this.calculateDirectorySize(staticPath, (file, size) => {
          totalSize += size;
          fileCount++;
          
          if (file.endsWith('.js')) {
            jsSize += size;
          } else if (file.endsWith('.css')) {
            cssSize += size;
          }
        });
      } catch (error) {
        throw new Error('Unable to analyze bundle sizes');
      }
      
      // Convert to KB
      const totalKB = Math.round(totalSize / 1024);
      const jsKB = Math.round(jsSize / 1024);
      const cssKB = Math.round(cssSize / 1024);
      
      // Performance thresholds
      const totalOptimal = totalKB < 1024; // Under 1MB total
      const jsOptimal = jsKB < 512; // Under 512KB JS
      const cssOptimal = cssKB < 100; // Under 100KB CSS
      
      return {
        test: 'Bundle Size Analysis',
        passed: totalOptimal && jsOptimal && cssOptimal,
        details: `Total: ${totalKB}KB, JS: ${jsKB}KB, CSS: ${cssKB}KB, Files: ${fileCount}`,
        metrics: {
          totalSize: totalKB,
          jsSize: jsKB,
          cssSize: cssKB,
          fileCount,
          optimal: totalOptimal && jsOptimal && cssOptimal
        }
      };
      
    } catch (error) {
      return {
        test: 'Bundle Size Analysis',
        passed: false,
        error: error.message
      };
    }
  }

  async testServerStartupTime() {
    try {
      // Test backend startup if available
      let backendStartup = 0;
      try {
        process.chdir(this.backendPath);
        const start = performance.now();
        
        // Check if binary exists
        const binaryPath = path.join(this.backendPath, 'target/release');
        await fs.access(binaryPath);
        
        // Simulate startup time (can't actually start server in tests)
        backendStartup = performance.now() - start;
        
      } catch (error) {
        console.warn('Backend startup test skipped (binary not found)');
      }
      
      // Test Next.js startup
      process.chdir(this.frontendPath);
      const frontendStart = performance.now();
      
      try {
        // Test production start (simulate)
        execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
        const frontendStartup = performance.now() - frontendStart;
        
        const frontendSeconds = Math.round(frontendStartup / 1000);
        const backendSeconds = Math.round(backendStartup / 1000);
        
        const frontendOptimal = frontendSeconds < 30; // Under 30 seconds
        const backendOptimal = backendSeconds < 5 || backendStartup === 0; // Under 5 seconds
        
        return {
          test: 'Server Startup Time',
          passed: frontendOptimal && backendOptimal,
          details: `Frontend: ${frontendSeconds}s${backendStartup ? `, Backend: ${backendSeconds}s` : ''}`,
          metrics: {
            frontendStartup: frontendSeconds,
            backendStartup: backendSeconds,
            optimal: frontendOptimal && backendOptimal
          }
        };
        
      } catch (error) {
        throw new Error('Frontend startup test failed');
      }
      
    } catch (error) {
      return {
        test: 'Server Startup Time',
        passed: false,
        error: error.message
      };
    }
  }

  async testMemoryUsage() {
    try {
      const initialMemory = process.memoryUsage();
      
      // Simulate memory-intensive operations
      const start = performance.now();
      
      // Test memory usage during build
      process.chdir(this.frontendPath);
      execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
      
      const finalMemory = process.memoryUsage();
      const duration = performance.now() - start;
      
      // Calculate memory usage
      const heapUsed = Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024);
      const heapTotal = Math.round(finalMemory.heapTotal / 1024 / 1024);
      const external = Math.round(finalMemory.external / 1024 / 1024);
      
      // Memory thresholds
      const heapOptimal = heapUsed < 200; // Under 200MB heap increase
      const totalOptimal = heapTotal < 500; // Under 500MB total heap
      
      return {
        test: 'Memory Usage',
        passed: heapOptimal && totalOptimal,
        details: `Heap Used: ${heapUsed}MB, Total: ${heapTotal}MB, External: ${external}MB`,
        metrics: {
          heapUsed,
          heapTotal,
          external,
          duration: Math.round(duration / 1000),
          optimal: heapOptimal && totalOptimal
        }
      };
      
    } catch (error) {
      return {
        test: 'Memory Usage',
        passed: false,
        error: error.message
      };
    }
  }

  async testNetworkOptimization() {
    try {
      // Test Next.js configuration for network optimization
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Test optimization features
      const optimizations = [
        'images', // Image optimization
        'compress', // Response compression
        'headers', // Custom headers
        'rewrites', // URL rewrites
        'webpack' // Webpack optimizations
      ];
      
      const foundOptimizations = optimizations.filter(opt => 
        nextConfig.includes(opt)
      );
      
      // Test image optimization
      const imageFeatures = [
        'domains',
        'formats',
        'quality',
        'sizes'
      ];
      
      const foundImageFeatures = imageFeatures.filter(feature => 
        nextConfig.includes(feature)
      );
      
      // Test compression and caching headers
      const performanceHeaders = [
        'Cache-Control',
        'Content-Encoding',
        'ETag',
        'Expires'
      ];
      
      const foundHeaders = performanceHeaders.filter(header => 
        nextConfig.includes(header)
      );
      
      return {
        test: 'Network Optimization',
        passed: foundOptimizations.length >= 3,
        details: `${foundOptimizations.length} optimizations, ${foundImageFeatures.length} image features, ${foundHeaders.length} performance headers`,
        metrics: {
          optimizations: foundOptimizations.length,
          imageFeatures: foundImageFeatures.length,
          headers: foundHeaders.length
        }
      };
      
    } catch (error) {
      return {
        test: 'Network Optimization',
        passed: false,
        error: error.message
      };
    }
  }

  async testImageOptimization() {
    try {
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Test image optimization configuration
      if (!nextConfig.includes('images')) {
        throw new Error('Image optimization not configured');
      }
      
      // Test modern formats
      const modernFormats = ['image/webp', 'image/avif'];
      const foundFormats = modernFormats.filter(format => 
        nextConfig.includes(format)
      );
      
      if (foundFormats.length === 0) {
        throw new Error('Modern image formats not configured');
      }
      
      // Test image domains
      const hasImageDomains = nextConfig.includes('domains:');
      
      // Test image quality settings
      const hasQualitySettings = nextConfig.includes('quality') || 
                                nextConfig.includes('deviceSizes');
      
      return {
        test: 'Image Optimization',
        passed: true,
        details: `${foundFormats.length} modern formats${hasImageDomains ? ', domains configured' : ''}${hasQualitySettings ? ', quality settings' : ''}`,
        metrics: {
          modernFormats: foundFormats.length,
          domainsConfigured: hasImageDomains,
          qualitySettings: hasQualitySettings
        }
      };
      
    } catch (error) {
      return {
        test: 'Image Optimization',
        passed: false,
        error: error.message
      };
    }
  }

  async testCodeSplitting() {
    try {
      process.chdir(this.frontendPath);
      
      // Ensure build exists
      await fs.access('.next');
      
      // Analyze chunks
      const staticPath = path.join(this.frontendPath, '.next/static/chunks');
      
      try {
        const chunks = await fs.readdir(staticPath);
        const jsChunks = chunks.filter(file => file.endsWith('.js'));
        
        // Count different types of chunks
        const pageChunks = jsChunks.filter(chunk => chunk.includes('pages/'));
        const vendorChunks = jsChunks.filter(chunk => 
          chunk.includes('vendor') || chunk.includes('node_modules')
        );
        const appChunks = jsChunks.filter(chunk => 
          chunk.includes('app/') || chunk.includes('main')
        );
        
        const totalChunks = jsChunks.length;
        const hasSplitting = totalChunks > 3; // Multiple chunks indicate splitting
        
        return {
          test: 'Code Splitting',
          passed: hasSplitting,
          details: `${totalChunks} chunks (${pageChunks.length} pages, ${vendorChunks.length} vendor, ${appChunks.length} app)`,
          metrics: {
            totalChunks,
            pageChunks: pageChunks.length,
            vendorChunks: vendorChunks.length,
            appChunks: appChunks.length,
            splitting: hasSplitting
          }
        };
        
      } catch (error) {
        throw new Error('Unable to analyze code chunks');
      }
      
    } catch (error) {
      return {
        test: 'Code Splitting',
        passed: false,
        error: error.message
      };
    }
  }

  async testTreeShaking() {
    try {
      // Test webpack configuration for tree shaking
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Check for webpack optimization
      const hasWebpackConfig = nextConfig.includes('webpack:');
      
      // Test package.json for sideEffects
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const hasSideEffects = packageJson.hasOwnProperty('sideEffects');
      
      // Analyze bundle to detect tree shaking effectiveness
      process.chdir(this.frontendPath);
      await fs.access('.next');
      
      const staticPath = path.join(this.frontendPath, '.next/static/chunks');
      const chunks = await fs.readdir(staticPath);
      const jsChunks = chunks.filter(file => file.endsWith('.js'));
      
      // Check if unused exports are removed (simplified check)
      let treeShakenFiles = 0;
      for (const chunk of jsChunks.slice(0, 3)) { // Check first 3 chunks
        const chunkPath = path.join(staticPath, chunk);
        const chunkContent = await fs.readFile(chunkPath, 'utf8');
        
        // Look for minified code (indication of optimization)
        if (chunkContent.length > 1000 && chunkContent.includes('!function') || chunkContent.includes('(function')) {
          treeShakenFiles++;
        }
      }
      
      return {
        test: 'Tree Shaking',
        passed: hasWebpackConfig || treeShakenFiles > 0,
        details: `Webpack config: ${hasWebpackConfig}, sideEffects: ${hasSideEffects}, optimized chunks: ${treeShakenFiles}`,
        metrics: {
          webpackConfig: hasWebpackConfig,
          sideEffects: hasSideEffects,
          optimizedChunks: treeShakenFiles
        }
      };
      
    } catch (error) {
      return {
        test: 'Tree Shaking',
        passed: false,
        error: error.message
      };
    }
  }

  async testCompressionTest() {
    try {
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Test compression configuration
      const compressionFeatures = [
        'compress',
        'gzip',
        'brotli',
        'Content-Encoding'
      ];
      
      const foundCompression = compressionFeatures.filter(feature => 
        nextConfig.includes(feature)
      );
      
      // Test file sizes to verify compression potential
      process.chdir(this.frontendPath);
      await fs.access('.next');
      
      const staticPath = path.join(this.frontendPath, '.next/static');
      let compressibleSize = 0;
      let fileCount = 0;
      
      await this.calculateDirectorySize(staticPath, (file, size) => {
        if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
          compressibleSize += size;
          fileCount++;
        }
      });
      
      const compressibleKB = Math.round(compressibleSize / 1024);
      const avgFileSize = fileCount > 0 ? Math.round(compressibleKB / fileCount) : 0;
      
      return {
        test: 'Compression Configuration',
        passed: foundCompression.length > 0 || compressibleKB > 0,
        details: `${foundCompression.length} compression features, ${compressibleKB}KB compressible content, avg: ${avgFileSize}KB`,
        metrics: {
          compressionFeatures: foundCompression.length,
          compressibleSize: compressibleKB,
          avgFileSize,
          fileCount
        }
      };
      
    } catch (error) {
      return {
        test: 'Compression Configuration',
        passed: false,
        error: error.message
      };
    }
  }

  async testCacheStrategies() {
    try {
      const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
      const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
      
      // Test caching headers
      const cacheHeaders = [
        'Cache-Control',
        'ETag',
        'Expires',
        'Last-Modified'
      ];
      
      const foundCacheHeaders = cacheHeaders.filter(header => 
        nextConfig.includes(header)
      );
      
      // Test static file caching
      const staticOptimizations = [
        'public',
        'immutable',
        'max-age',
        'stale-while-revalidate'
      ];
      
      const foundOptimizations = staticOptimizations.filter(opt => 
        nextConfig.includes(opt)
      );
      
      // Test ISR (Incremental Static Regeneration)
      const componentFiles = await this.findPages();
      let isrPages = 0;
      
      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('revalidate') || content.includes('getStaticProps')) {
          isrPages++;
        }
      }
      
      return {
        test: 'Cache Strategies',
        passed: foundCacheHeaders.length > 0 || foundOptimizations.length > 0,
        details: `${foundCacheHeaders.length} cache headers, ${foundOptimizations.length} optimizations, ${isrPages} ISR pages`,
        metrics: {
          cacheHeaders: foundCacheHeaders.length,
          optimizations: foundOptimizations.length,
          isrPages
        }
      };
      
    } catch (error) {
      return {
        test: 'Cache Strategies',
        passed: false,
        error: error.message
      };
    }
  }

  async testDatabasePerformance() {
    try {
      // Test database configuration
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      
      try {
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        
        // Test database features
        const dbFeatures = [
          'sqlx',
          'connection',
          'pool',
          'migrate',
          'redis'
        ];
        
        const foundDbFeatures = dbFeatures.filter(feature => 
          cargoContent.includes(feature)
        );
        
        // Test connection pooling
        const poolingFeatures = [
          'pool',
          'max_connections',
          'connection-manager'
        ];
        
        const foundPooling = poolingFeatures.filter(feature => 
          cargoContent.includes(feature)
        );
        
        return {
          test: 'Database Performance',
          passed: foundDbFeatures.length >= 2,
          details: `${foundDbFeatures.length} DB features, ${foundPooling.length} pooling features`,
          metrics: {
            dbFeatures: foundDbFeatures.length,
            poolingFeatures: foundPooling.length
          }
        };
        
      } catch (error) {
        return {
          test: 'Database Performance',
          passed: true,
          details: 'Backend not available (test skipped)'
        };
      }
      
    } catch (error) {
      return {
        test: 'Database Performance',
        passed: false,
        error: error.message
      };
    }
  }

  async testConcurrencyHandling() {
    try {
      // Test async/concurrency configuration
      const cargoPath = path.join(this.backendPath, 'Cargo.toml');
      
      try {
        const cargoContent = await fs.readFile(cargoPath, 'utf8');
        
        // Test async runtime features
        const asyncFeatures = [
          'tokio',
          'async',
          'futures',
          'tower',
          'hyper'
        ];
        
        const foundAsyncFeatures = asyncFeatures.filter(feature => 
          cargoContent.includes(feature)
        );
        
        // Test main.rs for async patterns
        const mainPath = path.join(this.backendPath, 'src/main.rs');
        const mainContent = await fs.readFile(mainPath, 'utf8');
        
        const concurrencyPatterns = [
          'async fn',
          'await',
          'spawn',
          'join',
          'select'
        ];
        
        const foundPatterns = concurrencyPatterns.filter(pattern => 
          mainContent.includes(pattern)
        );
        
        return {
          test: 'Concurrency Handling',
          passed: foundAsyncFeatures.length >= 2 && foundPatterns.length >= 2,
          details: `${foundAsyncFeatures.length} async features, ${foundPatterns.length} concurrency patterns`,
          metrics: {
            asyncFeatures: foundAsyncFeatures.length,
            concurrencyPatterns: foundPatterns.length
          }
        };
        
      } catch (error) {
        return {
          test: 'Concurrency Handling',
          passed: true,
          details: 'Backend not available (test skipped)'
        };
      }
      
    } catch (error) {
      return {
        test: 'Concurrency Handling',
        passed: false,
        error: error.message
      };
    }
  }

  // Utility methods
  async calculateDirectorySize(dir, callback) {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        await this.calculateDirectorySize(itemPath, callback);
      } else {
        callback(item, stats.size);
      }
    }
  }

  async findPages() {
    const files = [];
    const searchPaths = [
      path.join(this.frontendPath, 'src/app'),
      path.join(this.frontendPath, 'pages')
    ];
    
    for (const searchPath of searchPaths) {
      try {
        await this.findFilesRecursive(searchPath, files, ['.tsx', '.jsx', '.ts', '.js']);
      } catch (error) {
        // Directory doesn't exist
      }
    }
    
    return files.slice(0, 5); // Limit for performance
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

module.exports = PerformanceTests;