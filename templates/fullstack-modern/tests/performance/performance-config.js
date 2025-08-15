/**
 * Performance Testing Configuration
 * 
 * Centralized configuration for all performance testing suites
 */

const os = require('os');

const PerformanceConfig = {
  // Environment Configuration
  environments: {
    development: {
      apiBaseURL: 'http://localhost:8000/api',
      frontendURL: 'http://localhost:3000',
      wsURL: 'ws://localhost:8000',
      database: {
        host: 'localhost',
        port: 5432
      }
    },
    staging: {
      apiBaseURL: 'https://staging-api.example.com/api',
      frontendURL: 'https://staging.example.com',
      wsURL: 'wss://staging-api.example.com',
      database: {
        host: 'staging-db.example.com',
        port: 5432
      }
    },
    production: {
      apiBaseURL: 'https://api.example.com/api',
      frontendURL: 'https://example.com',
      wsURL: 'wss://api.example.com',
      database: {
        host: 'prod-db.example.com',
        port: 5432
      }
    }
  },

  // Performance Thresholds by Environment
  thresholds: {
    development: {
      frontend: {
        firstContentfulPaint: 2000, // ms - more lenient for dev
        largestContentfulPaint: 3000, // ms
        firstInputDelay: 150, // ms
        cumulativeLayoutShift: 0.15,
        bundleSize: 8 * 1024 * 1024, // 8MB
        timeToInteractive: 4000 // ms
      },
      backend: {
        apiResponseTime: 1000, // ms - more lenient for dev
        p95ResponseTime: 2000, // ms
        errorRate: 2, // %
        throughput: 50, // requests/second
        memoryUsage: 2048, // MB
        cpuUsage: 90 // %
      },
      database: {
        queryTime: 500, // ms
        connectionTime: 100, // ms
        concurrentQueries: 50,
        connectionPoolSize: 10
      },
      websocket: {
        connectionTime: 2000, // ms
        messageLatency: 100, // ms
        throughput: 500, // messages/second
        concurrentConnections: 200
      },
      load: {
        maxVirtualUsers: 100,
        breakingPoint: 200,
        responseTimeDegradation: 10, // 10x baseline acceptable
        errorRateIncrease: 20 // 20% increase acceptable
      }
    },
    
    staging: {
      frontend: {
        firstContentfulPaint: 1800, // ms
        largestContentfulPaint: 2500, // ms
        firstInputDelay: 100, // ms
        cumulativeLayoutShift: 0.1,
        bundleSize: 5 * 1024 * 1024, // 5MB
        timeToInteractive: 3800 // ms
      },
      backend: {
        apiResponseTime: 500, // ms
        p95ResponseTime: 1000, // ms
        errorRate: 1, // %
        throughput: 100, // requests/second
        memoryUsage: 1024, // MB
        cpuUsage: 80 // %
      },
      database: {
        queryTime: 200, // ms
        connectionTime: 50, // ms
        concurrentQueries: 100,
        connectionPoolSize: 20
      },
      websocket: {
        connectionTime: 1000, // ms
        messageLatency: 50, // ms
        throughput: 1000, // messages/second
        concurrentConnections: 500
      },
      load: {
        maxVirtualUsers: 500,
        breakingPoint: 1000,
        responseTimeDegradation: 5, // 5x baseline acceptable
        errorRateIncrease: 10 // 10% increase acceptable
      }
    },
    
    production: {
      frontend: {
        firstContentfulPaint: 1500, // ms - strict for production
        largestContentfulPaint: 2000, // ms
        firstInputDelay: 75, // ms
        cumulativeLayoutShift: 0.08,
        bundleSize: 3 * 1024 * 1024, // 3MB
        timeToInteractive: 3000 // ms
      },
      backend: {
        apiResponseTime: 300, // ms - strict for production
        p95ResponseTime: 800, // ms
        errorRate: 0.5, // %
        throughput: 200, // requests/second
        memoryUsage: 512, // MB
        cpuUsage: 70 // %
      },
      database: {
        queryTime: 100, // ms
        connectionTime: 30, // ms
        concurrentQueries: 200,
        connectionPoolSize: 50
      },
      websocket: {
        connectionTime: 500, // ms
        messageLatency: 25, // ms
        throughput: 2000, // messages/second
        concurrentConnections: 1000
      },
      load: {
        maxVirtualUsers: 1000,
        breakingPoint: 2000,
        responseTimeDegradation: 3, // 3x baseline acceptable
        errorRateIncrease: 5 // 5% increase acceptable
      }
    }
  },

  // Test Configuration by Type
  testConfig: {
    comprehensive: {
      duration: 300000, // 5 minutes
      rampUpTime: 60000, // 1 minute
      maxVirtualUsers: 1000,
      scenarios: [
        { name: 'browse_posts', weight: 40, endpoint: '/posts', method: 'GET' },
        { name: 'view_profile', weight: 20, endpoint: '/users/profile', method: 'GET' },
        { name: 'create_post', weight: 15, endpoint: '/posts', method: 'POST' },
        { name: 'update_post', weight: 10, endpoint: '/posts/:id', method: 'PUT' },
        { name: 'search', weight: 10, endpoint: '/search', method: 'GET' },
        { name: 'analytics', weight: 5, endpoint: '/analytics', method: 'GET' }
      ]
    },
    
    load: {
      stages: [
        { users: 10, duration: 30000, name: 'warmup' },
        { users: 25, duration: 60000, name: 'ramp_up' },
        { users: 50, duration: 120000, name: 'normal_load' },
        { users: 100, duration: 180000, name: 'increased_load' },
        { users: 200, duration: 240000, name: 'high_load' },
        { users: 50, duration: 60000, name: 'cool_down' }
      ],
      scenarios: [
        { name: 'read_heavy', weight: 70, operations: ['GET /posts', 'GET /users', 'GET /search'] },
        { name: 'write_operations', weight: 20, operations: ['POST /posts', 'PUT /posts/:id'] },
        { name: 'analytics', weight: 10, operations: ['GET /analytics', 'GET /metrics'] }
      ]
    },
    
    stress: {
      breakingPointTest: {
        startUsers: 100,
        maxUsers: 5000,
        increment: 100,
        testDuration: 60000, // 1 minute per level
        breakingCriteria: {
          responseTimeThreshold: 10000, // 10 seconds
          errorRateThreshold: 50, // 50%
          throughputThreshold: 0.1, // 0.1 RPS per user
          resourceThreshold: 95 // 95% CPU/Memory
        }
      },
      memoryStress: {
        payloadSizes: [1024, 10240, 102400, 1048576], // 1KB to 1MB
        virtualUsers: 50,
        duration: 120000 // 2 minutes
      },
      concurrencyStress: {
        levels: [50, 100, 200, 500, 1000],
        duration: 60000, // 1 minute per level
        timeout: 30000 // 30 second timeout
      }
    },
    
    websocket: {
      connectionScaling: {
        levels: [10, 50, 100, 250, 500, 1000],
        connectionTimeout: 10000,
        messageInterval: 1000
      },
      throughputTest: {
        messageIntervals: [10, 50, 100, 250, 500], // ms
        testDuration: 60000,
        messageSize: 1024 // 1KB messages
      },
      latencyTest: {
        sampleSize: 1000,
        messageTypes: ['ping', 'data', 'event'],
        concurrentConnections: 100
      }
    },
    
    database: {
      queryPerformance: [
        { name: 'simple_select', query: 'SELECT * FROM posts LIMIT 10' },
        { name: 'complex_join', query: 'SELECT p.*, u.name, COUNT(c.id) FROM posts p JOIN users u ON p.user_id = u.id LEFT JOIN comments c ON p.id = c.post_id GROUP BY p.id, u.name LIMIT 10' },
        { name: 'aggregation', query: 'SELECT DATE(created_at) as date, COUNT(*) as count FROM posts GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30' },
        { name: 'search', query: 'SELECT * FROM posts WHERE title ILIKE \\'%performance%\\' OR content ILIKE \\'%performance%\\' LIMIT 10' },
        { name: 'pagination', query: 'SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 100' }
      ],
      connectionPool: {
        sizes: [5, 10, 20, 50, 100],
        testDuration: 60000,
        queryFrequency: 100 // queries per second
      },
      concurrency: {
        readWriteRatio: 0.8, // 80% reads, 20% writes
        virtualUsers: 100,
        duration: 120000
      }
    }
  },

  // System Resource Monitoring
  monitoring: {
    metrics: [
      'cpu_usage',
      'memory_usage',
      'network_io',
      'disk_io',
      'open_connections',
      'response_times',
      'error_rates',
      'throughput'
    ],
    intervals: {
      realTime: 1000, // 1 second
      performance: 5000, // 5 seconds
      resource: 10000, // 10 seconds
      summary: 60000 // 1 minute
    },
    retention: {
      realTime: 3600000, // 1 hour
      performance: 86400000, // 24 hours
      summary: 2592000000 // 30 days
    }
  },

  // CI/CD Integration
  cicd: {
    failureThresholds: {
      overallScore: 80,
      successRate: 95,
      responseTime: 500,
      errorRate: 1.0,
      throughput: 100
    },
    reportFormats: ['json', 'junit', 'html'],
    notifications: {
      slack: process.env.SLACK_WEBHOOK_URL,
      email: process.env.NOTIFICATION_EMAIL,
      teams: process.env.TEAMS_WEBHOOK_URL
    },
    artifacts: {
      retention: 30, // days
      maxSize: 100 * 1024 * 1024, // 100MB
      compression: true
    }
  },

  // Performance Benchmarks
  benchmarks: {
    baseline: {
      responseTime: 200, // ms
      throughput: 100, // RPS
      errorRate: 0.1, // %
      memoryUsage: 256, // MB
      cpuUsage: 30 // %
    },
    targets: {
      responseTime: 150, // ms
      throughput: 200, // RPS
      errorRate: 0.05, // %
      memoryUsage: 200, // MB
      cpuUsage: 25 // %
    },
    regressionThresholds: {
      responseTime: 1.5, // 50% increase triggers alert
      throughput: 0.8, // 20% decrease triggers alert
      errorRate: 2.0, // 100% increase triggers alert
      memoryUsage: 1.3, // 30% increase triggers alert
      cpuUsage: 1.4 // 40% increase triggers alert
    }
  },

  // Hardware Configuration
  hardware: {
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'Unknown',
      speed: os.cpus()[0]?.speed || 0
    },
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024), // MB
      available: Math.round(os.freemem() / 1024 / 1024) // MB
    },
    platform: {
      os: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname()
    }
  },

  // Optimization Recommendations
  optimizationRules: {
    frontend: [
      {
        condition: (metrics) => metrics.firstContentfulPaint > 2000,
        recommendation: 'Optimize critical rendering path - reduce server response time and minimize render-blocking resources',
        priority: 'high'
      },
      {
        condition: (metrics) => metrics.bundleSize > 5 * 1024 * 1024,
        recommendation: 'Implement code splitting and tree shaking to reduce bundle size',
        priority: 'high'
      },
      {
        condition: (metrics) => metrics.cumulativeLayoutShift > 0.1,
        recommendation: 'Add size attributes to images and reserve space for dynamic content',
        priority: 'medium'
      }
    ],
    backend: [
      {
        condition: (metrics) => metrics.avgResponseTime > 500,
        recommendation: 'Optimize API endpoints - add caching, optimize database queries, and implement response compression',
        priority: 'high'
      },
      {
        condition: (metrics) => metrics.errorRate > 1,
        recommendation: 'Investigate and fix error sources - implement better error handling and monitoring',
        priority: 'high'
      },
      {
        condition: (metrics) => metrics.memoryUsage > 1024,
        recommendation: 'Optimize memory usage - fix memory leaks and implement garbage collection strategies',
        priority: 'medium'
      }
    ],
    database: [
      {
        condition: (metrics) => metrics.avgQueryTime > 200,
        recommendation: 'Optimize database queries - add indexes, review query execution plans, and implement query caching',
        priority: 'high'
      },
      {
        condition: (metrics) => metrics.connectionErrors > 5,
        recommendation: 'Optimize connection pool configuration and implement connection retry logic',
        priority: 'medium'
      }
    ],
    websocket: [
      {
        condition: (metrics) => metrics.messageLatency > 100,
        recommendation: 'Optimize WebSocket message processing - implement message batching and optimize serialization',
        priority: 'medium'
      },
      {
        condition: (metrics) => metrics.connectionFailures > 10,
        recommendation: 'Improve WebSocket connection handling - implement proper reconnection logic and load balancing',
        priority: 'high'
      }
    ]
  }
};

// Utility function to get configuration for current environment
PerformanceConfig.getEnvironmentConfig = function(environment = 'development') {
  const env = environment.toLowerCase();
  
  if (!this.environments[env]) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  
  return {
    environment: this.environments[env],
    thresholds: this.thresholds[env],
    hardware: this.hardware
  };
};

// Utility function to get test configuration
PerformanceConfig.getTestConfig = function(testType = 'comprehensive') {
  if (!this.testConfig[testType]) {
    throw new Error(`Unknown test type: ${testType}`);
  }
  
  return this.testConfig[testType];
};

// Utility function to evaluate performance against thresholds
PerformanceConfig.evaluatePerformance = function(metrics, environment = 'development') {
  const thresholds = this.thresholds[environment.toLowerCase()];
  const results = {};
  
  Object.keys(thresholds).forEach(category => {
    results[category] = {};
    
    Object.keys(thresholds[category]).forEach(metric => {
      const threshold = thresholds[category][metric];
      const value = metrics[category]?.[metric];
      
      if (value !== undefined) {
        // Determine if metric passed based on metric type
        let passed = false;
        
        if (['responseTime', 'queryTime', 'connectionTime', 'messageLatency', 'errorRate', 'memoryUsage', 'cpuUsage'].includes(metric)) {
          passed = value <= threshold; // Lower is better
        } else {
          passed = value >= threshold; // Higher is better
        }
        
        results[category][metric] = {
          value,
          threshold,
          passed,
          ratio: threshold > 0 ? value / threshold : 0
        };
      }
    });
  });
  
  return results;
};

// Utility function to generate optimization recommendations
PerformanceConfig.generateRecommendations = function(metrics) {
  const recommendations = [];
  
  Object.keys(this.optimizationRules).forEach(category => {
    this.optimizationRules[category].forEach(rule => {
      if (rule.condition(metrics[category] || {})) {
        recommendations.push({
          category,
          recommendation: rule.recommendation,
          priority: rule.priority
        });
      }
    });
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

module.exports = PerformanceConfig;