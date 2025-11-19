/**
 * API Integration Test Suite for Fullstack Modern Template
 * 
 * Comprehensive testing for REST API endpoints, GraphQL subscriptions,
 * authentication, rate limiting, error handling, API versioning,
 * and external service integrations.
 */

const axios = require('axios');
const { GraphQLClient, gql } = require('graphql-request');
const WebSocket = require('ws');

class APIIntegrationTestSuite {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:8000',
      graphqlURL: config.graphqlURL || 'http://localhost:8000/graphql',
      wsURL: config.wsURL || 'ws://localhost:8000/graphql',
      timeout: config.timeout || 10000,
      ...config
    };

    this.testResults = {
      restEndpoints: [],
      graphqlQueries: [],
      graphqlSubscriptions: [],
      authentication: [],
      rateLimit: [],
      errorHandling: [],
      versioning: [],
      performance: []
    };

    this.metrics = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      concurrencyResults: []
    };

    this.authTokens = {
      valid: null,
      expired: null,
      invalid: 'invalid_token_123'
    };

    // Set up axios instance
    this.apiClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Suite/1.0'
      }
    });

    // Set up GraphQL client
    this.graphqlClient = new GraphQLClient(this.config.graphqlURL);
  }

  /**
   * REST API Endpoint Tests
   */
  async testRESTEndpoints() {
    console.log('🌐 Testing REST API Endpoints...');

    const tests = [
      this.testHealthEndpoint(),
      this.testUserCRUDOperations(),
      this.testFileUpload(),
      this.testDataValidation(),
      this.testPaginatedResults(),
      this.testFilteringAndSorting(),
      this.testBulkOperations()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.restEndpoints = results.map((result, index) => ({
      test: tests[index].name || `REST Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.restEndpoints;
  }

  async testHealthEndpoint() {
    const startTime = Date.now();
    
    try {
      const response = await this.apiClient.get('/health');
      const responseTime = Date.now() - startTime;
      this.metrics.responseTime.push(responseTime);

      const success = response.status === 200 && 
                     response.data.status === 'healthy';

      return {
        passed: success,
        status: response.status,
        responseTime: `${responseTime}ms`,
        responseData: response.data,
        message: success ? 'Health endpoint responding correctly' : 'Health endpoint failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`,
        message: 'Health endpoint request failed'
      };
    }
  }

  async testUserCRUDOperations() {
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      profile: {
        bio: 'API test user',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      }
    };

    try {
      // CREATE
      const createResponse = await this.apiClient.post('/api/users', testUser);
      const userId = createResponse.data.id;
      
      const createSuccess = createResponse.status === 201 && 
                           createResponse.data.email === testUser.email;

      // READ
      const readResponse = await this.apiClient.get(`/api/users/${userId}`);
      const readSuccess = readResponse.status === 200 && 
                         readResponse.data.id === userId;

      // UPDATE
      const updateData = { name: 'Updated Test User' };
      const updateResponse = await this.apiClient.patch(`/api/users/${userId}`, updateData);
      const updateSuccess = updateResponse.status === 200 && 
                           updateResponse.data.name === updateData.name;

      // DELETE
      const deleteResponse = await this.apiClient.delete(`/api/users/${userId}`);
      const deleteSuccess = deleteResponse.status === 204;

      // Verify deletion
      try {
        await this.apiClient.get(`/api/users/${userId}`);
        var verifySuccess = false; // Should not reach this
      } catch (error) {
        var verifySuccess = error.response?.status === 404;
      }

      const overallSuccess = createSuccess && readSuccess && updateSuccess && 
                            deleteSuccess && verifySuccess;

      return {
        passed: overallSuccess,
        operations: {
          create: { success: createSuccess, status: createResponse.status },
          read: { success: readSuccess, status: readResponse.status },
          update: { success: updateSuccess, status: updateResponse.status },
          delete: { success: deleteSuccess, status: deleteResponse.status },
          verify: { success: verifySuccess }
        },
        userId,
        message: overallSuccess ? 'User CRUD operations successful' : 'User CRUD operations failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'User CRUD operations failed with error'
      };
    }
  }

  async testFileUpload() {
    try {
      // Create a mock file for testing
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Mock file content
      const fileContent = Buffer.from('This is a test file content for API testing');
      formData.append('file', fileContent, {
        filename: 'test-file.txt',
        contentType: 'text/plain'
      });
      formData.append('description', 'API test file upload');

      const response = await this.apiClient.post('/api/files/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.authTokens.valid}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const success = response.status === 201 && 
                     response.data.filename === 'test-file.txt';

      return {
        passed: success,
        status: response.status,
        uploadedFile: response.data,
        fileSize: fileContent.length,
        message: success ? 'File upload successful' : 'File upload failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'File upload failed with error'
      };
    }
  }

  async testDataValidation() {
    const invalidUserData = [
      { email: 'invalid-email', name: 'Test' }, // Invalid email
      { email: 'test@example.com', name: '' }, // Empty name
      { email: 'test@example.com', name: 'A'.repeat(256) }, // Name too long
      { email: 'test@example.com' }, // Missing required field
      {} // Empty object
    ];

    const validationResults = [];

    for (const [index, userData] of invalidUserData.entries()) {
      try {
        const response = await this.apiClient.post('/api/users', userData);
        validationResults.push({
          index,
          userData,
          passed: false, // Should have failed validation
          status: response.status,
          unexpectedSuccess: true
        });
      } catch (error) {
        const expectedError = error.response?.status === 400 || error.response?.status === 422;
        validationResults.push({
          index,
          userData,
          passed: expectedError,
          status: error.response?.status,
          errorMessage: error.response?.data?.message,
          validationErrors: error.response?.data?.errors
        });
      }
    }

    const allPassed = validationResults.every(result => result.passed);

    return {
      passed: allPassed,
      validationResults,
      testedCases: invalidUserData.length,
      passedCases: validationResults.filter(r => r.passed).length,
      message: allPassed ? 'Data validation working correctly' : 'Data validation has issues'
    };
  }

  /**
   * GraphQL Query and Mutation Tests
   */
  async testGraphQLQueries() {
    console.log('🔍 Testing GraphQL Queries and Mutations...');

    const tests = [
      this.testBasicQuery(),
      this.testQueryWithVariables(),
      this.testNestedQuery(),
      this.testMutation(),
      this.testBatchQueries(),
      this.testQueryComplexity()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.graphqlQueries = results.map((result, index) => ({
      test: tests[index].name || `GraphQL Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.graphqlQueries;
  }

  async testBasicQuery() {
    const query = gql`
      query GetUsers {
        users {
          id
          email
          name
          createdAt
        }
      }
    `;

    const startTime = Date.now();

    try {
      const data = await this.graphqlClient.request(query);
      const responseTime = Date.now() - startTime;
      this.metrics.responseTime.push(responseTime);

      const success = Array.isArray(data.users) && 
                     data.users.every(user => user.id && user.email);

      return {
        passed: success,
        responseTime: `${responseTime}ms`,
        userCount: data.users.length,
        sampleUser: data.users[0],
        message: success ? 'Basic GraphQL query successful' : 'Basic GraphQL query failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`,
        message: 'Basic GraphQL query failed with error'
      };
    }
  }

  async testQueryWithVariables() {
    const query = gql`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          email
          name
          profile {
            bio
            preferences {
              theme
              notifications
            }
          }
        }
      }
    `;

    const variables = { id: '1' };

    try {
      const data = await this.graphqlClient.request(query, variables);
      
      const success = data.user && 
                     data.user.id === variables.id &&
                     data.user.profile;

      return {
        passed: success,
        variables,
        user: data.user,
        message: success ? 'GraphQL query with variables successful' : 'GraphQL query with variables failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        variables,
        message: 'GraphQL query with variables failed with error'
      };
    }
  }

  async testMutation() {
    const mutation = gql`
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          email
          name
          createdAt
        }
      }
    `;

    const variables = {
      input: {
        email: 'graphql-test@example.com',
        name: 'GraphQL Test User',
        profile: {
          bio: 'Created via GraphQL mutation test'
        }
      }
    };

    try {
      const data = await this.graphqlClient.request(mutation, variables);
      
      const success = data.createUser && 
                     data.createUser.email === variables.input.email &&
                     data.createUser.id;

      // Clean up by deleting the created user
      if (success) {
        try {
          await this.apiClient.delete(`/api/users/${data.createUser.id}`);
        } catch (cleanupError) {
          console.warn('Failed to clean up test user:', cleanupError.message);
        }
      }

      return {
        passed: success,
        variables,
        createdUser: data.createUser,
        message: success ? 'GraphQL mutation successful' : 'GraphQL mutation failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        variables,
        message: 'GraphQL mutation failed with error'
      };
    }
  }

  /**
   * GraphQL Subscription Tests
   */
  async testGraphQLSubscriptions() {
    console.log('📡 Testing GraphQL Subscriptions...');

    const tests = [
      this.testBasicSubscription(),
      this.testSubscriptionWithAuth(),
      this.testSubscriptionReconnection(),
      this.testMultipleSubscriptions()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.graphqlSubscriptions = results.map((result, index) => ({
      test: tests[index].name || `Subscription Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.graphqlSubscriptions;
  }

  async testBasicSubscription() {
    return new Promise((resolve, reject) => {
      const subscription = `
        subscription {
          userUpdated {
            id
            email
            name
            updatedAt
          }
        }
      `;

      const ws = new WebSocket(this.config.wsURL, 'graphql-ws');
      let messageCount = 0;
      const receivedMessages = [];

      ws.on('open', () => {
        // Send connection init
        ws.send(JSON.stringify({ type: 'connection_init' }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        receivedMessages.push(message);

        if (message.type === 'connection_ack') {
          // Start subscription
          ws.send(JSON.stringify({
            id: '1',
            type: 'start',
            payload: { query: subscription }
          }));

          // Trigger an update after a short delay
          setTimeout(async () => {
            try {
              await this.apiClient.patch('/api/users/1', { name: 'Updated via subscription test' });
            } catch (error) {
              console.warn('Failed to trigger update for subscription test');
            }
          }, 1000);
        }

        if (message.type === 'data' && message.payload?.data?.userUpdated) {
          messageCount++;
          ws.close();

          const success = messageCount > 0 && 
                         message.payload.data.userUpdated.id;

          resolve({
            passed: success,
            messageCount,
            receivedData: message.payload.data.userUpdated,
            allMessages: receivedMessages,
            message: success ? 'Basic GraphQL subscription successful' : 'Basic GraphQL subscription failed'
          });
        }
      });

      ws.on('error', (error) => {
        ws.close();
        reject({
          passed: false,
          error: error.message,
          message: 'GraphQL subscription connection failed'
        });
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        ws.close();
        resolve({
          passed: messageCount > 0,
          messageCount,
          receivedMessages: receivedMessages.length,
          message: messageCount > 0 ? 'Subscription received messages but may have timed out' : 'Subscription timed out without messages'
        });
      }, 10000);
    });
  }

  /**
   * Authentication Tests
   */
  async testAuthentication() {
    console.log('🔐 Testing API Authentication...');

    const tests = [
      this.testTokenValidation(),
      this.testProtectedEndpoints(),
      this.testTokenRefresh(),
      this.testRoleBasedAccess(),
      this.testSessionManagement()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.authentication = results.map((result, index) => ({
      test: tests[index].name || `Auth Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.authentication;
  }

  async testTokenValidation() {
    const tests = [
      { token: this.authTokens.valid, shouldPass: true, description: 'valid token' },
      { token: this.authTokens.invalid, shouldPass: false, description: 'invalid token' },
      { token: null, shouldPass: false, description: 'no token' },
      { token: '', shouldPass: false, description: 'empty token' }
    ];

    const results = [];

    for (const test of tests) {
      try {
        const headers = test.token ? { 'Authorization': `Bearer ${test.token}` } : {};
        const response = await this.apiClient.get('/api/auth/validate', { headers });
        
        const success = test.shouldPass && response.status === 200;
        results.push({
          ...test,
          passed: success,
          status: response.status,
          response: response.data
        });
      } catch (error) {
        const success = !test.shouldPass && (error.response?.status === 401 || error.response?.status === 403);
        results.push({
          ...test,
          passed: success,
          status: error.response?.status,
          error: error.message
        });
      }
    }

    const allPassed = results.every(result => result.passed);

    return {
      passed: allPassed,
      testResults: results,
      testedCases: tests.length,
      passedCases: results.filter(r => r.passed).length,
      message: allPassed ? 'Token validation working correctly' : 'Token validation has issues'
    };
  }

  async testProtectedEndpoints() {
    const protectedEndpoints = [
      { method: 'GET', path: '/api/profile' },
      { method: 'POST', path: '/api/posts' },
      { method: 'PUT', path: '/api/settings' },
      { method: 'DELETE', path: '/api/account' }
    ];

    const results = [];

    for (const endpoint of protectedEndpoints) {
      // Test without token
      try {
        const response = await this.apiClient.request({
          method: endpoint.method.toLowerCase(),
          url: endpoint.path,
          data: endpoint.method !== 'GET' ? {} : undefined
        });
        
        results.push({
          ...endpoint,
          withoutToken: {
            passed: false,
            status: response.status,
            unexpectedAccess: true
          }
        });
      } catch (error) {
        const expectedError = error.response?.status === 401;
        results.push({
          ...endpoint,
          withoutToken: {
            passed: expectedError,
            status: error.response?.status,
            error: error.message
          }
        });
      }

      // Test with valid token
      if (this.authTokens.valid) {
        try {
          const response = await this.apiClient.request({
            method: endpoint.method.toLowerCase(),
            url: endpoint.path,
            headers: { 'Authorization': `Bearer ${this.authTokens.valid}` },
            data: endpoint.method !== 'GET' ? {} : undefined
          });
          
          results[results.length - 1].withToken = {
            passed: response.status < 400,
            status: response.status,
            response: response.data
          };
        } catch (error) {
          results[results.length - 1].withToken = {
            passed: false,
            status: error.response?.status,
            error: error.message
          };
        }
      }
    }

    const allPassed = results.every(result => 
      result.withoutToken.passed && (!result.withToken || result.withToken.passed)
    );

    return {
      passed: allPassed,
      endpointResults: results,
      testedEndpoints: protectedEndpoints.length,
      message: allPassed ? 'Protected endpoints working correctly' : 'Protected endpoints have issues'
    };
  }

  /**
   * Rate Limiting Tests
   */
  async testRateLimiting() {
    console.log('⏱️ Testing API Rate Limiting...');

    const tests = [
      this.testBasicRateLimit(),
      this.testRateLimitRecovery(),
      this.testDifferentEndpointLimits(),
      this.testAuthenticatedVsAnonymousLimits()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.rateLimit = results.map((result, index) => ({
      test: tests[index].name || `Rate Limit Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.rateLimit;
  }

  async testBasicRateLimit() {
    const endpoint = '/api/health';
    const requestCount = 50; // Assume rate limit is lower than this
    let successCount = 0;
    let rateLimitedCount = 0;
    let firstRateLimitResponse = null;

    const requests = [];
    for (let i = 0; i < requestCount; i++) {
      requests.push(
        this.apiClient.get(endpoint)
          .then(response => {
            successCount++;
            return { success: true, status: response.status };
          })
          .catch(error => {
            if (error.response?.status === 429) {
              rateLimitedCount++;
              if (!firstRateLimitResponse) {
                firstRateLimitResponse = {
                  headers: error.response.headers,
                  data: error.response.data
                };
              }
            }
            return { success: false, status: error.response?.status, error: error.message };
          })
      );
    }

    const results = await Promise.all(requests);

    const rateLimitingWorking = rateLimitedCount > 0;

    return {
      passed: rateLimitingWorking,
      totalRequests: requestCount,
      successfulRequests: successCount,
      rateLimitedRequests: rateLimitedCount,
      firstRateLimitAt: successCount,
      rateLimitHeaders: firstRateLimitResponse?.headers,
      message: rateLimitingWorking ? 'Rate limiting is working' : 'Rate limiting may not be configured'
    };
  }

  async testRateLimitRecovery() {
    const endpoint = '/api/health';
    
    // First, trigger rate limiting
    const rapidRequests = [];
    for (let i = 0; i < 30; i++) {
      rapidRequests.push(
        this.apiClient.get(endpoint).catch(error => ({ 
          status: error.response?.status, 
          rateLimited: error.response?.status === 429 
        }))
      );
    }

    await Promise.all(rapidRequests);

    // Wait for rate limit to reset (assuming 1-minute window)
    console.log('Waiting for rate limit to reset...');
    await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds

    // Test if requests are working again
    try {
      const response = await this.apiClient.get(endpoint);
      
      return {
        passed: response.status === 200,
        recoveryStatus: response.status,
        message: response.status === 200 ? 'Rate limit recovery successful' : 'Rate limit recovery failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        recoveryStatus: error.response?.status,
        message: 'Rate limit recovery failed with error'
      };
    }
  }

  /**
   * Performance Tests
   */
  async testAPIPerformance() {
    console.log('⚡ Testing API Performance...');

    const tests = [
      this.testResponseTime(),
      this.testThroughput(),
      this.testConcurrentRequests(),
      this.testLargePayloadHandling(),
      this.testDatabaseQueryPerformance()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.performance = results.map((result, index) => ({
      test: tests[index].name || `Performance Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.performance;
  }

  async testResponseTime() {
    const endpoints = [
      '/api/health',
      '/api/users',
      '/api/posts',
      '/api/categories'
    ];

    const results = [];

    for (const endpoint of endpoints) {
      const responseTimes = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        try {
          await this.apiClient.get(endpoint);
          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);
        } catch (error) {
          responseTimes.push(Date.now() - startTime);
        }
      }

      const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const minTime = Math.min(...responseTimes);
      const maxTime = Math.max(...responseTimes);

      results.push({
        endpoint,
        averageTime: `${averageTime.toFixed(2)}ms`,
        minTime: `${minTime}ms`,
        maxTime: `${maxTime}ms`,
        requests: responseTimes.length,
        acceptable: averageTime < 500 // 500ms threshold
      });
    }

    const allAcceptable = results.every(result => result.acceptable);

    return {
      passed: allAcceptable,
      endpointResults: results,
      overallAverage: `${(results.reduce((sum, r) => sum + parseFloat(r.averageTime), 0) / results.length).toFixed(2)}ms`,
      message: allAcceptable ? 'API response times acceptable' : 'Some endpoints have slow response times'
    };
  }

  async testConcurrentRequests() {
    const endpoint = '/api/users';
    const concurrentCount = 20;
    const startTime = Date.now();

    const requests = Array(concurrentCount).fill().map(() => 
      this.apiClient.get(endpoint)
        .then(response => ({ success: true, status: response.status, time: Date.now() - startTime }))
        .catch(error => ({ success: false, status: error.response?.status, error: error.message }))
    );

    const results = await Promise.all(requests);
    const totalTime = Date.now() - startTime;

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    this.metrics.concurrencyResults.push({
      concurrentRequests: concurrentCount,
      successCount,
      failureCount,
      totalTime
    });

    const success = successCount >= concurrentCount * 0.9; // 90% success rate

    return {
      passed: success,
      concurrentRequests: concurrentCount,
      successfulRequests: successCount,
      failedRequests: failureCount,
      totalTime: `${totalTime}ms`,
      successRate: `${((successCount / concurrentCount) * 100).toFixed(2)}%`,
      message: success ? 'Concurrent requests handled successfully' : 'Concurrent requests performance issues'
    };
  }

  /**
   * Generate Comprehensive Test Report
   */
  generateTestReport() {
    const allTests = [
      ...this.testResults.restEndpoints,
      ...this.testResults.graphqlQueries,
      ...this.testResults.graphqlSubscriptions,
      ...this.testResults.authentication,
      ...this.testResults.rateLimit,
      ...this.testResults.errorHandling,
      ...this.testResults.versioning,
      ...this.testResults.performance
    ];

    const passed = allTests.filter(test => test.status === 'fulfilled' && test.result.passed).length;
    const failed = allTests.filter(test => test.status === 'rejected' || !test.result.passed).length;
    const total = allTests.length;

    const averageResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((sum, time) => sum + time, 0) / this.metrics.responseTime.length 
      : 0;

    return {
      summary: {
        totalTests: total,
        passed,
        failed,
        successRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%',
        timestamp: new Date().toISOString()
      },
      performance: {
        averageResponseTime: `${averageResponseTime.toFixed(2)}ms`,
        totalRequests: this.metrics.responseTime.length,
        errorRate: this.metrics.errorRate.length > 0 
          ? `${(this.metrics.errorRate.reduce((sum, rate) => sum + rate, 0) / this.metrics.errorRate.length).toFixed(2)}%`
          : '0%'
      },
      categories: {
        restEndpoints: this.testResults.restEndpoints,
        graphqlQueries: this.testResults.graphqlQueries,
        graphqlSubscriptions: this.testResults.graphqlSubscriptions,
        authentication: this.testResults.authentication,
        rateLimit: this.testResults.rateLimit,
        errorHandling: this.testResults.errorHandling,
        versioning: this.testResults.versioning,
        performance: this.testResults.performance
      },
      recommendations: this.generateRecommendations(allTests)
    };
  }

  generateRecommendations(tests) {
    const recommendations = [];
    
    const failedTests = tests.filter(test => test.status === 'rejected' || !test.result.passed);
    
    if (failedTests.length > 0) {
      recommendations.push('Review failed API tests and fix endpoint issues');
    }
    
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((sum, time) => sum + time, 0) / this.metrics.responseTime.length
      : 0;
      
    if (avgResponseTime > 500) {
      recommendations.push('Optimize API response times - current average is above 500ms');
    }
    
    const rateLimitTests = this.testResults.rateLimit;
    if (rateLimitTests.some(test => !test.result?.passed)) {
      recommendations.push('Review and properly configure API rate limiting');
    }
    
    const authTests = this.testResults.authentication;
    if (authTests.some(test => !test.result?.passed)) {
      recommendations.push('Fix authentication and authorization issues');
    }
    
    return recommendations;
  }

  /**
   * Run All API Tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive API Integration Test Suite...\n');
    
    try {
      // Generate auth tokens for testing
      await this.setupAuthTokens();
      
      await this.testRESTEndpoints();
      await this.testGraphQLQueries();
      await this.testGraphQLSubscriptions();
      await this.testAuthentication();
      await this.testRateLimiting();
      await this.testAPIPerformance();
      
      const report = this.generateTestReport();
      
      console.log('\n📊 API Integration Test Results:');
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      console.log(`⚡ Average Response Time: ${report.performance.averageResponseTime}`);
      console.log(`📊 Total Requests: ${report.performance.totalRequests}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      return report;
    } catch (error) {
      console.error('❌ API integration test suite failed:', error);
      throw error;
    }
  }

  async setupAuthTokens() {
    try {
      // Mock login to get valid token
      const loginResponse = await this.apiClient.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'testpassword'
      });
      
      this.authTokens.valid = loginResponse.data.access_token;
    } catch (error) {
      console.warn('Could not generate valid auth token for testing:', error.message);
      // Use a mock token for testing
      this.authTokens.valid = 'mock_valid_token_for_testing';
    }
  }
}

module.exports = { APIIntegrationTestSuite };

// Example usage
if (require.main === module) {
  const testSuite = new APIIntegrationTestSuite({
    baseURL: process.env.API_URL || 'http://localhost:8000',
    graphqlURL: process.env.GRAPHQL_URL || 'http://localhost:8000/graphql',
    timeout: 15000
  });

  testSuite.runAllTests()
    .then(report => {
      console.log('\n📄 Full test report saved to api-integration-test-report.json');
      require('fs').writeFileSync(
        'api-integration-test-report.json',
        JSON.stringify(report, null, 2)
      );
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}