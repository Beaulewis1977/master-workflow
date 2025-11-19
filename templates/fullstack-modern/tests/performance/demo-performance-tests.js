#!/usr/bin/env node

/**
 * Performance Testing Demonstration Script
 * 
 * Demonstrates the comprehensive performance testing capabilities
 * of the Fullstack Modern Template
 */

const { PerformanceTestRunner } = require('./run-performance-tests');
const { ComprehensivePerformanceTestingSuite } = require('./comprehensive-performance-testing-suite');
const PerformanceConfig = require('./performance-config');

class PerformanceTestingDemo {
  constructor() {
    this.demoConfig = {
      // Use mock URLs for demonstration
      apiBaseURL: 'http://localhost:8000/api',
      frontendURL: 'http://localhost:3000',
      wsURL: 'ws://localhost:8000',
      
      // Quick demo settings
      maxVirtualUsers: 50,
      testDuration: 30000, // 30 seconds for demo
      
      // Demo output
      outputDir: './demo-reports',
      demoMode: true
    };

    this.results = {};
  }

  async runDemo() {
    console.log('🎬 Starting Performance Testing Demonstration\n');
    console.log('================================================');
    console.log('Fullstack Modern Template');
    console.log('Comprehensive Performance Testing Suite');
    console.log('================================================\n');

    try {
      // Show configuration overview
      await this.showConfigurationOverview();

      // Demonstrate test suites
      await this.demonstrateTestSuites();

      // Show performance metrics
      await this.showPerformanceMetrics();

      // Generate demo reports
      await this.generateDemoReports();

      // Show optimization recommendations
      await this.showOptimizationRecommendations();

      console.log('\n✅ Performance Testing Demonstration Complete!');
      console.log('📊 Check the demo-reports directory for sample outputs');

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      throw error;
    }
  }

  async showConfigurationOverview() {
    console.log('📋 Performance Testing Configuration Overview\n');

    const environments = ['development', 'staging', 'production'];
    
    console.log('Available Environments:');
    environments.forEach(env => {
      const config = PerformanceConfig.getEnvironmentConfig(env);
      console.log(`  🏢 ${env.toUpperCase()}`);
      console.log(`     API: ${config.environment.apiBaseURL}`);
      console.log(`     Frontend: ${config.environment.frontendURL}`);
      console.log(`     WebSocket: ${config.environment.wsURL}`);
      console.log(`     Response Time Threshold: ${config.thresholds.backend.apiResponseTime}ms`);
      console.log(`     Error Rate Threshold: ${config.thresholds.backend.errorRate}%`);
      console.log('');
    });

    console.log('Available Test Suites:');
    const testTypes = ['comprehensive', 'load', 'stress', 'websocket', 'database'];
    testTypes.forEach(type => {
      if (PerformanceConfig.testConfig[type]) {
        console.log(`  ⚡ ${type.toUpperCase()}`);
        const config = PerformanceConfig.getTestConfig(type);
        if (config.duration) {
          console.log(`     Duration: ${config.duration / 1000}s`);
        }
        if (config.maxVirtualUsers) {
          console.log(`     Max Users: ${config.maxVirtualUsers}`);
        }
        console.log('');
      }
    });
  }

  async demonstrateTestSuites() {
    console.log('🧪 Demonstrating Performance Test Suites\n');

    // Simulate comprehensive performance testing
    console.log('1. 🎨 Frontend Performance Testing');
    console.log('   ✓ Core Web Vitals measurement');
    console.log('   ✓ Bundle size analysis');
    console.log('   ✓ JavaScript performance metrics');
    console.log('   ✓ PWA performance validation');
    console.log('   ✓ Mobile vs desktop comparison');
    
    await this.simulateProgress('Frontend tests', 3000);

    console.log('\n2. ⚙️ Backend Performance Testing');
    console.log('   ✓ API endpoint response times');
    console.log('   ✓ Memory usage analysis');
    console.log('   ✓ CPU utilization monitoring');
    console.log('   ✓ Concurrent request handling');
    console.log('   ✓ Rate limiting validation');
    
    await this.simulateProgress('Backend tests', 4000);

    console.log('\n3. 🗄️ Database Performance Testing');
    console.log('   ✓ Query execution time analysis');
    console.log('   ✓ Connection pool performance');
    console.log('   ✓ Index effectiveness validation');
    console.log('   ✓ Concurrent operation testing');
    console.log('   ✓ Transaction performance');
    
    await this.simulateProgress('Database tests', 3500);

    console.log('\n4. 🚀 Load and Stress Testing');
    console.log('   ✓ Gradual load increase testing');
    console.log('   ✓ Peak load handling validation');
    console.log('   ✓ Breaking point identification');
    console.log('   ✓ Resource exhaustion scenarios');
    console.log('   ✓ System recovery testing');
    
    await this.simulateProgress('Load tests', 5000);

    console.log('\n5. 🔌 WebSocket Performance Testing');
    console.log('   ✓ Connection scalability testing');
    console.log('   ✓ Message throughput analysis');
    console.log('   ✓ Latency measurement');
    console.log('   ✓ Broadcasting efficiency');
    console.log('   ✓ Reconnection handling');
    
    await this.simulateProgress('WebSocket tests', 3000);
  }

  async showPerformanceMetrics() {
    console.log('\n📊 Sample Performance Metrics\n');

    // Generate sample metrics
    const sampleMetrics = this.generateSampleMetrics();

    console.log('Frontend Performance:');
    console.log(`  First Contentful Paint: ${sampleMetrics.frontend.fcp}ms`);
    console.log(`  Largest Contentful Paint: ${sampleMetrics.frontend.lcp}ms`);
    console.log(`  First Input Delay: ${sampleMetrics.frontend.fid}ms`);
    console.log(`  Cumulative Layout Shift: ${sampleMetrics.frontend.cls}`);
    console.log(`  Bundle Size: ${(sampleMetrics.frontend.bundleSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Performance Score: ${sampleMetrics.frontend.score}/100`);

    console.log('\nBackend Performance:');
    console.log(`  Average Response Time: ${sampleMetrics.backend.avgResponseTime}ms`);
    console.log(`  P95 Response Time: ${sampleMetrics.backend.p95ResponseTime}ms`);
    console.log(`  Throughput: ${sampleMetrics.backend.throughput} RPS`);
    console.log(`  Error Rate: ${sampleMetrics.backend.errorRate}%`);
    console.log(`  Memory Usage: ${sampleMetrics.backend.memoryUsage}MB`);
    console.log(`  CPU Usage: ${sampleMetrics.backend.cpuUsage}%`);

    console.log('\nDatabase Performance:');
    console.log(`  Average Query Time: ${sampleMetrics.database.avgQueryTime}ms`);
    console.log(`  Connection Pool Efficiency: ${sampleMetrics.database.poolEfficiency}%`);
    console.log(`  Concurrent Queries: ${sampleMetrics.database.concurrentQueries}`);
    console.log(`  Index Hit Ratio: ${sampleMetrics.database.indexHitRatio}%`);

    console.log('\nWebSocket Performance:');
    console.log(`  Connection Time: ${sampleMetrics.websocket.connectionTime}ms`);
    console.log(`  Message Latency: ${sampleMetrics.websocket.messageLatency}ms`);
    console.log(`  Throughput: ${sampleMetrics.websocket.throughput} msg/s`);
    console.log(`  Concurrent Connections: ${sampleMetrics.websocket.connections}`);

    console.log('\nLoad Testing Results:');
    console.log(`  Max Concurrent Users: ${sampleMetrics.load.maxUsers}`);
    console.log(`  Breaking Point: ${sampleMetrics.load.breakingPoint} users`);
    console.log(`  System Recovery Time: ${sampleMetrics.load.recoveryTime}s`);
    console.log(`  Scalability Pattern: ${sampleMetrics.load.scalabilityPattern}`);

    // Store results for report generation
    this.results = sampleMetrics;
  }

  generateSampleMetrics() {
    return {
      frontend: {
        fcp: Math.floor(Math.random() * 800 + 1200), // 1200-2000ms
        lcp: Math.floor(Math.random() * 1000 + 1500), // 1500-2500ms
        fid: Math.floor(Math.random() * 50 + 50), // 50-100ms
        cls: Math.round((Math.random() * 0.05 + 0.05) * 1000) / 1000, // 0.05-0.1
        bundleSize: Math.floor(Math.random() * 2 * 1024 * 1024 + 3 * 1024 * 1024), // 3-5MB
        score: Math.floor(Math.random() * 20 + 75) // 75-95
      },
      backend: {
        avgResponseTime: Math.floor(Math.random() * 200 + 150), // 150-350ms
        p95ResponseTime: Math.floor(Math.random() * 400 + 400), // 400-800ms
        throughput: Math.floor(Math.random() * 100 + 120), // 120-220 RPS
        errorRate: Math.round((Math.random() * 0.8 + 0.1) * 100) / 100, // 0.1-0.9%
        memoryUsage: Math.floor(Math.random() * 300 + 400), // 400-700MB
        cpuUsage: Math.floor(Math.random() * 30 + 40) // 40-70%
      },
      database: {
        avgQueryTime: Math.floor(Math.random() * 100 + 50), // 50-150ms
        poolEfficiency: Math.floor(Math.random() * 15 + 85), // 85-100%
        concurrentQueries: Math.floor(Math.random() * 50 + 80), // 80-130
        indexHitRatio: Math.floor(Math.random() * 10 + 90) // 90-100%
      },
      websocket: {
        connectionTime: Math.floor(Math.random() * 500 + 200), // 200-700ms
        messageLatency: Math.floor(Math.random() * 30 + 20), // 20-50ms
        throughput: Math.floor(Math.random() * 800 + 1200), // 1200-2000 msg/s
        connections: Math.floor(Math.random() * 300 + 700) // 700-1000
      },
      load: {
        maxUsers: Math.floor(Math.random() * 500 + 800), // 800-1300
        breakingPoint: Math.floor(Math.random() * 1000 + 1500), // 1500-2500
        recoveryTime: Math.floor(Math.random() * 20 + 10), // 10-30s
        scalabilityPattern: ['linear', 'sub-linear', 'logarithmic'][Math.floor(Math.random() * 3)]
      }
    };
  }

  async generateDemoReports() {
    console.log('\n📄 Generating Sample Performance Reports\n');

    const fs = require('fs').promises;
    const path = require('path');

    // Ensure demo reports directory exists
    try {
      await fs.mkdir(this.demoConfig.outputDir, { recursive: true });
    } catch {
      // Directory already exists
    }

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      environment: 'demo',
      configuration: this.demoConfig,
      metrics: this.results,
      summary: {
        overallScore: Math.floor(Math.random() * 15 + 80), // 80-95
        totalTests: 47,
        passedTests: Math.floor(Math.random() * 5 + 42), // 42-47
        failedTests: Math.floor(Math.random() * 5 + 0), // 0-5
        successRate: '89.4%',
        recommendations: [
          'Optimize bundle size by implementing code splitting',
          'Add database indexes for frequently queried columns',
          'Implement response caching for static content',
          'Optimize WebSocket message serialization'
        ]
      }
    };

    const jsonPath = path.join(this.demoConfig.outputDir, 'demo-performance-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(`✓ JSON Report: ${jsonPath}`);

    // Generate HTML report
    const htmlReport = this.generateDemoHTMLReport(jsonReport);
    const htmlPath = path.join(this.demoConfig.outputDir, 'demo-performance-report.html');
    await fs.writeFile(htmlPath, htmlReport);
    console.log(`✓ HTML Report: ${htmlPath}`);

    // Generate Markdown report
    const markdownReport = this.generateDemoMarkdownReport(jsonReport);
    const markdownPath = path.join(this.demoConfig.outputDir, 'demo-performance-report.md');
    await fs.writeFile(markdownPath, markdownReport);
    console.log(`✓ Markdown Report: ${markdownPath}`);

    console.log('\n📊 Report Generation Complete!');
  }

  generateDemoHTMLReport(data) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Demo Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .score-section { padding: 40px; text-align: center; border-bottom: 1px solid #e2e8f0; }
        .score-circle { display: inline-block; width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#4ade80 ${data.summary.overallScore}%, #e2e8f0 0%); position: relative; margin-bottom: 20px; }
        .score-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 28px; font-weight: bold; color: #1e293b; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; padding: 40px; }
        .metric-card { background: #f8fafc; border-radius: 8px; padding: 24px; border-left: 4px solid #3b82f6; }
        .metric-title { font-size: 1.1em; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
        .metric-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .metric-label { color: #64748b; }
        .metric-value { font-weight: 600; color: #1e293b; }
        .recommendations { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 24px; margin: 20px 40px; }
        .recommendations h3 { margin-top: 0; color: #92400e; }
        .rec-list { list-style: none; padding: 0; }
        .rec-list li { padding: 8px 0; border-bottom: 1px solid #fde68a; }
        .rec-list li:last-child { border-bottom: none; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Test Report</h1>
            <p>Fullstack Modern Template - Demo Results</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="score-section">
            <div class="score-circle">
                <div class="score-text">${data.summary.overallScore}</div>
            </div>
            <h2>Overall Performance Score</h2>
            <p>Tests Passed: ${data.summary.passedTests}/${data.summary.totalTests} (${data.summary.successRate})</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">🎨 Frontend Performance</div>
                <div class="metric-item">
                    <span class="metric-label">First Contentful Paint</span>
                    <span class="metric-value">${data.metrics.frontend.fcp}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Largest Contentful Paint</span>
                    <span class="metric-value">${data.metrics.frontend.lcp}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Bundle Size</span>
                    <span class="metric-value">${(data.metrics.frontend.bundleSize / 1024 / 1024).toFixed(1)}MB</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Performance Score</span>
                    <span class="metric-value">${data.metrics.frontend.score}/100</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">⚙️ Backend Performance</div>
                <div class="metric-item">
                    <span class="metric-label">Avg Response Time</span>
                    <span class="metric-value">${data.metrics.backend.avgResponseTime}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Throughput</span>
                    <span class="metric-value">${data.metrics.backend.throughput} RPS</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Error Rate</span>
                    <span class="metric-value">${data.metrics.backend.errorRate}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value">${data.metrics.backend.memoryUsage}MB</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">🗄️ Database Performance</div>
                <div class="metric-item">
                    <span class="metric-label">Avg Query Time</span>
                    <span class="metric-value">${data.metrics.database.avgQueryTime}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Pool Efficiency</span>
                    <span class="metric-value">${data.metrics.database.poolEfficiency}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Concurrent Queries</span>
                    <span class="metric-value">${data.metrics.database.concurrentQueries}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Index Hit Ratio</span>
                    <span class="metric-value">${data.metrics.database.indexHitRatio}%</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">🔌 WebSocket Performance</div>
                <div class="metric-item">
                    <span class="metric-label">Connection Time</span>
                    <span class="metric-value">${data.metrics.websocket.connectionTime}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Message Latency</span>
                    <span class="metric-value">${data.metrics.websocket.messageLatency}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Throughput</span>
                    <span class="metric-value">${data.metrics.websocket.throughput} msg/s</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Max Connections</span>
                    <span class="metric-value">${data.metrics.websocket.connections}</span>
                </div>
            </div>
        </div>
        
        <div class="recommendations">
            <h3>💡 Performance Recommendations</h3>
            <ul class="rec-list">
                ${data.summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="footer">
            <p>Report generated by Fullstack Modern Template Performance Testing Suite</p>
            <p>This is a demonstration report with simulated data</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateDemoMarkdownReport(data) {
    return `# Performance Test Demo Report

**Generated:** ${new Date().toISOString()}  
**Environment:** Demo  
**Test Suite:** Comprehensive Performance Testing

## Overall Performance Score: ${data.summary.overallScore}/100

### Test Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${data.summary.totalTests} |
| Passed Tests | ${data.summary.passedTests} |
| Failed Tests | ${data.summary.failedTests} |
| Success Rate | ${data.summary.successRate} |

## Performance Metrics

### 🎨 Frontend Performance

| Metric | Value | Status |
|--------|-------|--------|
| First Contentful Paint | ${data.metrics.frontend.fcp}ms | ${data.metrics.frontend.fcp < 1800 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} |
| Largest Contentful Paint | ${data.metrics.frontend.lcp}ms | ${data.metrics.frontend.lcp < 2500 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} |
| Bundle Size | ${(data.metrics.frontend.bundleSize / 1024 / 1024).toFixed(1)}MB | ${data.metrics.frontend.bundleSize < 5 * 1024 * 1024 ? '✅ GOOD' : '⚠️ LARGE'} |
| Performance Score | ${data.metrics.frontend.score}/100 | ${data.metrics.frontend.score >= 80 ? '✅ EXCELLENT' : '⚠️ NEEDS IMPROVEMENT'} |

### ⚙️ Backend Performance

| Metric | Value | Status |
|--------|-------|--------|
| Average Response Time | ${data.metrics.backend.avgResponseTime}ms | ${data.metrics.backend.avgResponseTime < 500 ? '✅ EXCELLENT' : '⚠️ SLOW'} |
| P95 Response Time | ${data.metrics.backend.p95ResponseTime}ms | ${data.metrics.backend.p95ResponseTime < 1000 ? '✅ GOOD' : '⚠️ SLOW'} |
| Throughput | ${data.metrics.backend.throughput} RPS | ${data.metrics.backend.throughput > 100 ? '✅ GOOD' : '⚠️ LOW'} |
| Error Rate | ${data.metrics.backend.errorRate}% | ${data.metrics.backend.errorRate < 1 ? '✅ EXCELLENT' : '⚠️ HIGH'} |

### 🗄️ Database Performance

| Metric | Value | Status |
|--------|-------|--------|
| Average Query Time | ${data.metrics.database.avgQueryTime}ms | ${data.metrics.database.avgQueryTime < 200 ? '✅ FAST' : '⚠️ SLOW'} |
| Pool Efficiency | ${data.metrics.database.poolEfficiency}% | ${data.metrics.database.poolEfficiency > 90 ? '✅ EFFICIENT' : '⚠️ INEFFICIENT'} |
| Concurrent Queries | ${data.metrics.database.concurrentQueries} | ✅ GOOD |
| Index Hit Ratio | ${data.metrics.database.indexHitRatio}% | ${data.metrics.database.indexHitRatio > 95 ? '✅ EXCELLENT' : '⚠️ NEEDS OPTIMIZATION'} |

### 🔌 WebSocket Performance

| Metric | Value | Status |
|--------|-------|--------|
| Connection Time | ${data.metrics.websocket.connectionTime}ms | ${data.metrics.websocket.connectionTime < 1000 ? '✅ FAST' : '⚠️ SLOW'} |
| Message Latency | ${data.metrics.websocket.messageLatency}ms | ${data.metrics.websocket.messageLatency < 50 ? '✅ EXCELLENT' : '⚠️ HIGH'} |
| Throughput | ${data.metrics.websocket.throughput} msg/s | ${data.metrics.websocket.throughput > 1000 ? '✅ HIGH' : '⚠️ LOW'} |
| Max Connections | ${data.metrics.websocket.connections} | ✅ GOOD |

## 💡 Performance Recommendations

${data.summary.recommendations.map(rec => `- ${rec}`).join('\\n')}

## Load Testing Results

- **Max Concurrent Users:** ${data.metrics.load.maxUsers}
- **Breaking Point:** ${data.metrics.load.breakingPoint} users
- **Recovery Time:** ${data.metrics.load.recoveryTime}s
- **Scalability Pattern:** ${data.metrics.load.scalabilityPattern}

---

*This is a demonstration report generated by the Fullstack Modern Template Performance Testing Suite with simulated data.*
`;
  }

  async showOptimizationRecommendations() {
    console.log('\n💡 Performance Optimization Recommendations\n');

    const recommendations = PerformanceConfig.generateRecommendations(this.results);

    if (recommendations.length === 0) {
      console.log('🎉 No optimization recommendations - performance is excellent!');
      return;
    }

    recommendations.forEach((rec, index) => {
      const priority = rec.priority.toUpperCase();
      const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      
      console.log(`${index + 1}. ${icon} ${priority} PRIORITY`);
      console.log(`   Category: ${rec.category.toUpperCase()}`);
      console.log(`   Recommendation: ${rec.recommendation}`);
      console.log('');
    });

    console.log('📚 Implementation Guide:');
    console.log('   • High Priority: Implement immediately for significant impact');
    console.log('   • Medium Priority: Schedule for next development cycle');
    console.log('   • Low Priority: Consider for future optimization efforts');
  }

  async simulateProgress(taskName, duration) {
    const steps = 20;
    const stepDuration = duration / steps;
    
    process.stdout.write(`   Running ${taskName}: [`);
    
    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      process.stdout.write('█');
    }
    
    console.log('] ✓\n');
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new PerformanceTestingDemo();
  
  demo.runDemo()
    .then(() => {
      console.log('\n🎯 Next Steps:');
      console.log('   1. Run actual performance tests: npm run perf');
      console.log('   2. Check the performance configuration: performance-config.js');
      console.log('   3. Customize thresholds for your environment');
      console.log('   4. Integrate with CI/CD pipeline');
      console.log('   5. Set up performance monitoring alerts');
      console.log('\n📚 Learn more: https://github.com/fullstack-modern-template/performance-testing');
    })
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { PerformanceTestingDemo };