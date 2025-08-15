# Comprehensive Performance Testing Suite

This directory contains a comprehensive performance testing suite for the Fullstack Modern Template, designed to validate and benchmark application performance across all layers.

## 🎯 Overview

The performance testing suite provides:

- **Frontend Performance Testing** - Core Web Vitals, bundle analysis, PWA metrics
- **Backend Performance Testing** - API response times, memory usage, CPU utilization
- **Database Performance Testing** - Query optimization, connection pooling, concurrency
- **Load Testing** - Gradual load increases, peak load handling, sustained load
- **Stress Testing** - Breaking point identification, resource exhaustion, recovery
- **WebSocket Performance Testing** - Real-time feature performance, broadcasting efficiency
- **Comprehensive Benchmarking** - Performance baselines, regression detection

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
cd tests
npm install

# Ensure services are running
docker-compose up -d  # Start backend services
npm run dev           # Start frontend (in another terminal)
```

### Basic Usage

```bash
# Run comprehensive performance tests
npm run perf

# Run specific test suites
npm run perf:benchmark        # Basic performance benchmarks
npm run perf:load            # Load testing
npm run perf:comprehensive   # Full comprehensive suite

# Quick performance check
npm run perf:quick

# Generate HTML reports
npm run perf:reports
```

## 📊 Test Suites

### 1. Comprehensive Performance Suite

```bash
npm run perf:comprehensive
```

**Features:**
- Frontend performance (Core Web Vitals, bundle analysis)
- Backend API performance (response times, concurrency)
- Database performance (query optimization, connection pooling)
- WebSocket performance (latency, throughput)
- Memory and resource analysis
- Performance regression detection

**Duration:** ~5-10 minutes
**Virtual Users:** Up to 1000
**Output:** JSON, HTML, and Markdown reports

### 2. Benchmark Suite

```bash
npm run perf:benchmark
```

**Features:**
- Basic performance benchmarks
- Response time measurement
- Throughput analysis
- Error rate monitoring
- Resource utilization

**Duration:** ~2-3 minutes
**Virtual Users:** Up to 200
**Output:** Performance baseline data

### 3. Load Testing Suite

```bash
npm run perf:load
```

**Features:**
- Gradual load increase testing
- Peak load handling
- Sustained load testing
- Traffic spike simulation
- Breaking point identification

**Duration:** ~5-15 minutes
**Virtual Users:** Up to 2000
**Output:** Load testing analysis

## 🔧 Configuration

### Environment Variables

```bash
# Service URLs
export API_URL="http://localhost:8000/api"
export FRONTEND_URL="http://localhost:3000"
export WS_URL="ws://localhost:8000"

# Test Configuration
export TEST_SUITE="comprehensive"        # comprehensive, benchmark, load, all
export MAX_VIRTUAL_USERS="1000"         # Maximum concurrent users
export TEST_DURATION="300000"           # Test duration in milliseconds (5 minutes)

# Output Configuration
export OUTPUT_DIR="./performance-reports"
export REPORT_FORMAT="all"              # json, html, markdown, all

# CI/CD Configuration
export CI="true"                         # Enable CI mode
export FAIL_ON_THRESHOLDS="true"        # Fail if thresholds not met
export MIN_PERFORMANCE_SCORE="80"       # Minimum overall score
export MAX_RESPONSE_TIME="500"          # Maximum response time (ms)
export MAX_ERROR_RATE="1.0"             # Maximum error rate (%)
export MIN_THROUGHPUT="100"             # Minimum throughput (RPS)
```

### Custom Configuration

Create a `performance-config.custom.js` file to override default settings:

```javascript
const defaultConfig = require('./performance-config');

module.exports = {
  ...defaultConfig,
  environments: {
    ...defaultConfig.environments,
    custom: {
      apiBaseURL: 'https://your-api.com/api',
      frontendURL: 'https://your-app.com',
      wsURL: 'wss://your-api.com'
    }
  },
  thresholds: {
    ...defaultConfig.thresholds,
    custom: {
      frontend: {
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2000,
        // ... other thresholds
      }
    }
  }
};
```

## 📈 Performance Metrics

### Frontend Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.8s | Time to first content render |
| Largest Contentful Paint (LCP) | < 2.5s | Time to largest content render |
| First Input Delay (FID) | < 100ms | Time to first user interaction |
| Cumulative Layout Shift (CLS) | < 0.1 | Visual stability score |
| Bundle Size | < 5MB | Total JavaScript bundle size |
| Time to Interactive (TTI) | < 3.8s | Time to full interactivity |

### Backend Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Average Response Time | < 500ms | Mean API response time |
| P95 Response Time | < 1000ms | 95th percentile response time |
| Error Rate | < 1% | Percentage of failed requests |
| Throughput | > 100 RPS | Requests per second |
| Memory Usage | < 1GB | Peak memory consumption |
| CPU Usage | < 80% | Peak CPU utilization |

### Database Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Query Execution Time | < 200ms | Average query response time |
| Connection Time | < 50ms | Database connection establishment |
| Concurrent Queries | > 100 | Simultaneous query capacity |
| Connection Pool Size | 20-50 | Optimal pool configuration |

### WebSocket Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Connection Time | < 1000ms | WebSocket connection establishment |
| Message Latency | < 50ms | Round-trip message time |
| Throughput | > 1000 msg/s | Messages per second capacity |
| Concurrent Connections | > 500 | Simultaneous connection capacity |

## 🎯 Performance Thresholds

### Development Environment

- More lenient thresholds for development
- Focus on functionality over performance
- Allows for debugging overhead

### Staging Environment

- Production-like performance expectations
- Validation of optimization efforts
- Performance regression detection

### Production Environment

- Strict performance requirements
- Optimal user experience targets
- Business impact considerations

## 📊 Reports and Analysis

### Generated Reports

1. **JSON Report** (`performance-report-{timestamp}.json`)
   - Machine-readable test results
   - Detailed metrics and timings
   - CI/CD integration data

2. **HTML Report** (`performance-report-{timestamp}.html`)
   - Visual performance dashboard
   - Interactive charts and graphs
   - Executive summary

3. **Markdown Report** (`performance-report-{timestamp}.md`)
   - Documentation-friendly format
   - Suitable for Git repositories
   - Summary tables and recommendations

4. **CI Report** (`ci-performance-report-{timestamp}.json`)
   - CI/CD pipeline integration
   - Pass/fail status
   - Threshold compliance

### Performance Analysis

#### Response Time Distribution
- Percentile analysis (P50, P90, P95, P99)
- Response time trends over load
- Bottleneck identification

#### Throughput Analysis
- Requests per second capacity
- Scalability patterns
- Resource efficiency

#### Error Rate Analysis
- Error type categorization
- Failure mode identification
- Reliability assessment

#### Resource Utilization
- CPU and memory usage patterns
- Resource leak detection
- Optimization opportunities

## 🔍 Advanced Features

### 1. Breaking Point Analysis

Automatically identifies system breaking points:

```bash
# Run stress testing to find breaking point
npm run perf:stress
```

- Gradually increases load until system failure
- Identifies failure modes and resource limits
- Provides capacity planning data

### 2. Performance Regression Detection

Compares current performance with historical baselines:

- Automatic baseline establishment
- Statistical regression analysis
- Alerting on performance degradation

### 3. Real-World Scenario Simulation

Simulates realistic user behavior patterns:

- Mixed read/write operations
- Varying user think times
- Complex user workflows

### 4. Multi-Environment Testing

Tests across different deployment environments:

- Development vs. staging vs. production
- Different infrastructure configurations
- Cloud provider comparisons

## 🚨 CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  performance:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd tests
        npm install
        
    - name: Start services
      run: |
        docker-compose up -d
        sleep 30
        
    - name: Run performance tests
      run: |
        cd tests
        npm run perf:ci
      env:
        CI: true
        FAIL_ON_THRESHOLDS: true
        MIN_PERFORMANCE_SCORE: 80
        MAX_RESPONSE_TIME: 500
        
    - name: Upload reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: performance-reports
        path: tests/performance-reports/
```

### Performance Gates

Set up performance gates to prevent regression:

```javascript
// In your CI configuration
const performanceThresholds = {
  overallScore: 80,      // Minimum performance score
  responseTime: 500,     // Maximum response time (ms)
  errorRate: 1.0,        // Maximum error rate (%)
  throughput: 100        // Minimum throughput (RPS)
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **Services Not Available**
   ```bash
   # Check service status
   curl http://localhost:8000/health
   curl http://localhost:3000
   
   # Restart services
   docker-compose restart
   ```

2. **High Memory Usage**
   ```bash
   # Monitor memory during tests
   watch -n 1 'free -m'
   
   # Reduce virtual users
   export MAX_VIRTUAL_USERS="100"
   ```

3. **Test Timeouts**
   ```bash
   # Increase test duration
   export TEST_DURATION="600000"  # 10 minutes
   
   # Reduce load
   export MAX_VIRTUAL_USERS="200"
   ```

4. **Connection Errors**
   ```bash
   # Check connection limits
   ulimit -n
   
   # Increase if needed
   ulimit -n 65536
   ```

### Performance Optimization Tips

1. **Frontend Optimization**
   - Implement code splitting
   - Optimize images and assets
   - Use CDN for static resources
   - Enable compression

2. **Backend Optimization**
   - Implement response caching
   - Optimize database queries
   - Use connection pooling
   - Enable compression

3. **Database Optimization**
   - Add appropriate indexes
   - Optimize query execution plans
   - Implement query caching
   - Monitor connection usage

4. **WebSocket Optimization**
   - Implement message batching
   - Optimize serialization
   - Use connection pooling
   - Implement backpressure handling

## 📚 Additional Resources

- [Web Performance Best Practices](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Load Testing Best Practices](https://k6.io/docs/)
- [Database Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

## 🤝 Contributing

To contribute to the performance testing suite:

1. Fork the repository
2. Create a feature branch
3. Add new performance tests or improvements
4. Ensure all tests pass
5. Submit a pull request

### Adding New Performance Tests

1. Create test file in appropriate subdirectory
2. Extend existing test suites or create new ones
3. Add configuration to `performance-config.js`
4. Update documentation
5. Add npm scripts for easy execution

## 📄 License

This performance testing suite is part of the Fullstack Modern Template and is licensed under the MIT License.