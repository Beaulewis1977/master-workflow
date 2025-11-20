/**
 * Agent Marketplace API Test Suite
 *
 * Comprehensive tests for the Marketplace API
 *
 * @module test-api
 */

import { createMarketplaceAPI } from './agent-registry-api.js';
import { SampleAgents } from './database-models.js';

/**
 * Test Suite Runner
 */
export class MarketplaceAPITester {
  constructor() {
    this.api = null;
    this.testResults = [];
    this.apiKey = null;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║       Agent Marketplace API - Test Suite                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    try {
      await this.setup();
      await this.testHealthCheck();
      await this.testPublishAgent();
      await this.testGetAgent();
      await this.testSearchAgents();
      await this.testCategories();
      await this.testTrending();
      await this.testInstallAgent();
      await this.testRatingSystem();
      await this.testReviewSystem();
      await this.testAgentStatistics();
      await this.testUpdateAgent();
      await this.testRateLimiting();
      await this.testAuthentication();
      await this.testValidation();
      await this.teardown();

      this.printResults();
    } catch (error) {
      console.error('Test suite failed:', error);
      process.exit(1);
    }
  }

  /**
   * Setup test environment
   */
  async setup() {
    console.log('🔧 Setting up test environment...');

    // Create API instance on a different port to avoid conflicts
    this.api = createMarketplaceAPI({
      port: 3001,
      host: 'localhost'
    });

    // Start server
    await this.api.start();

    // Get admin API key from the database
    this.apiKey = Array.from(this.api.db.apiKeys.keys())[0];

    console.log('✅ Test environment ready\n');
  }

  /**
   * Teardown test environment
   */
  async teardown() {
    console.log('\n🧹 Cleaning up test environment...');
    await this.api.stop();
    console.log('✅ Cleanup complete\n');
  }

  /**
   * Test helper - make request
   */
  async makeRequest(endpoint, options = {}) {
    const url = `http://localhost:3001/api/v1${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.authenticated && { 'X-API-Key': this.apiKey }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    return { status: response.status, data };
  }

  /**
   * Test helper - record result
   */
  recordTest(name, passed, error = null) {
    this.testResults.push({ name, passed, error });
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`${icon} ${name}: ${status}`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
  }

  /**
   * Test 1: Health Check
   */
  async testHealthCheck() {
    console.log('Test 1: Health Check');
    try {
      const { status, data } = await this.makeRequest('/health');

      const passed = status === 200 &&
                     data.status === 'healthy' &&
                     data.version === 'v1';

      this.recordTest('Health Check', passed);
    } catch (error) {
      this.recordTest('Health Check', false, error.message);
    }
  }

  /**
   * Test 2: Publish Agent
   */
  async testPublishAgent() {
    console.log('\nTest 2: Publish Agent');
    try {
      const agentData = {
        ...SampleAgents[0],
        publishedAt: new Date(),
        updatedAt: new Date()
      };

      const { status, data } = await this.makeRequest('/marketplace/publish', {
        method: 'POST',
        body: JSON.stringify(agentData),
        authenticated: true
      });

      const passed = status === 201 && data.success === true;

      this.recordTest('Publish Agent', passed);
      this.testAgentId = data.agent?.id;
    } catch (error) {
      this.recordTest('Publish Agent', false, error.message);
    }
  }

  /**
   * Test 3: Get Agent
   */
  async testGetAgent() {
    console.log('\nTest 3: Get Agent Details');
    try {
      if (!this.testAgentId) {
        throw new Error('No agent ID from publish test');
      }

      const { status, data } = await this.makeRequest(`/marketplace/agent/${this.testAgentId}`);

      const passed = status === 200 &&
                     data.success === true &&
                     data.agent.id === this.testAgentId;

      this.recordTest('Get Agent Details', passed);
    } catch (error) {
      this.recordTest('Get Agent Details', false, error.message);
    }
  }

  /**
   * Test 4: Search Agents
   */
  async testSearchAgents() {
    console.log('\nTest 4: Search Agents');
    try {
      const { status, data } = await this.makeRequest('/marketplace/search?q=test&limit=10');

      const passed = status === 200 &&
                     data.success === true &&
                     Array.isArray(data.results) &&
                     data.pagination !== undefined;

      this.recordTest('Search Agents', passed);
    } catch (error) {
      this.recordTest('Search Agents', false, error.message);
    }
  }

  /**
   * Test 5: Categories
   */
  async testCategories() {
    console.log('\nTest 5: Get Categories');
    try {
      const { status, data } = await this.makeRequest('/marketplace/categories');

      const passed = status === 200 &&
                     data.success === true &&
                     Array.isArray(data.categories);

      this.recordTest('Get Categories', passed);
    } catch (error) {
      this.recordTest('Get Categories', false, error.message);
    }
  }

  /**
   * Test 6: Trending
   */
  async testTrending() {
    console.log('\nTest 6: Get Trending Agents');
    try {
      const { status, data } = await this.makeRequest('/marketplace/trending?timeframe=7d&limit=5');

      const passed = status === 200 &&
                     data.success === true &&
                     Array.isArray(data.trending);

      this.recordTest('Get Trending Agents', passed);
    } catch (error) {
      this.recordTest('Get Trending Agents', false, error.message);
    }
  }

  /**
   * Test 7: Install Agent
   */
  async testInstallAgent() {
    console.log('\nTest 7: Install Agent');
    try {
      if (!this.testAgentId) {
        throw new Error('No agent ID available');
      }

      const { status, data } = await this.makeRequest('/marketplace/install', {
        method: 'POST',
        body: JSON.stringify({ agentId: this.testAgentId }),
        authenticated: true
      });

      const passed = status === 200 &&
                     data.success === true &&
                     data.installId !== undefined;

      this.recordTest('Install Agent', passed);
    } catch (error) {
      this.recordTest('Install Agent', false, error.message);
    }
  }

  /**
   * Test 8: Rating System
   */
  async testRatingSystem() {
    console.log('\nTest 8: Rating System');
    try {
      if (!this.testAgentId) {
        throw new Error('No agent ID available');
      }

      const { status, data } = await this.makeRequest('/marketplace/rate', {
        method: 'POST',
        body: JSON.stringify({
          agentId: this.testAgentId,
          rating: 5
        }),
        authenticated: true
      });

      const passed = status === 200 &&
                     data.success === true &&
                     data.newRating !== undefined;

      this.recordTest('Submit Rating', passed);
    } catch (error) {
      this.recordTest('Submit Rating', false, error.message);
    }
  }

  /**
   * Test 9: Review System
   */
  async testReviewSystem() {
    console.log('\nTest 9: Review System');
    try {
      if (!this.testAgentId) {
        throw new Error('No agent ID available');
      }

      // Submit review
      const submitResult = await this.makeRequest('/marketplace/review', {
        method: 'POST',
        body: JSON.stringify({
          agentId: this.testAgentId,
          rating: 5,
          comment: 'Excellent agent! Very useful and well-documented.'
        }),
        authenticated: true
      });

      // Get reviews
      const getResult = await this.makeRequest(`/marketplace/reviews/${this.testAgentId}`);

      const passed = submitResult.status === 201 &&
                     submitResult.data.success === true &&
                     getResult.status === 200 &&
                     Array.isArray(getResult.data.reviews);

      this.recordTest('Review System', passed);
    } catch (error) {
      this.recordTest('Review System', false, error.message);
    }
  }

  /**
   * Test 10: Agent Statistics
   */
  async testAgentStatistics() {
    console.log('\nTest 10: Agent Statistics');
    try {
      if (!this.testAgentId) {
        throw new Error('No agent ID available');
      }

      const { status, data } = await this.makeRequest(`/marketplace/stats/${this.testAgentId}`);

      const passed = status === 200 &&
                     data.success === true &&
                     data.stats.totalDownloads !== undefined &&
                     data.stats.averageRating !== undefined;

      this.recordTest('Get Agent Statistics', passed);
    } catch (error) {
      this.recordTest('Get Agent Statistics', false, error.message);
    }
  }

  /**
   * Test 11: Update Agent
   */
  async testUpdateAgent() {
    console.log('\nTest 11: Update Agent');
    try {
      if (!this.testAgentId) {
        throw new Error('No agent ID available');
      }

      const { status, data } = await this.makeRequest(`/marketplace/agent/${this.testAgentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: 'Updated description for testing'
        }),
        authenticated: true
      });

      const passed = status === 200 &&
                     data.success === true &&
                     data.agent.description === 'Updated description for testing';

      this.recordTest('Update Agent', passed);
    } catch (error) {
      this.recordTest('Update Agent', false, error.message);
    }
  }

  /**
   * Test 12: Rate Limiting
   */
  async testRateLimiting() {
    console.log('\nTest 12: Rate Limiting');
    try {
      // Make requests until rate limit is hit
      let rateLimitHit = false;

      for (let i = 0; i < 105; i++) {
        const { status } = await this.makeRequest('/health');
        if (status === 429) {
          rateLimitHit = true;
          break;
        }
      }

      this.recordTest('Rate Limiting', rateLimitHit);
    } catch (error) {
      this.recordTest('Rate Limiting', false, error.message);
    }
  }

  /**
   * Test 13: Authentication
   */
  async testAuthentication() {
    console.log('\nTest 13: Authentication');
    try {
      // Try to publish without API key
      const { status, data } = await this.makeRequest('/marketplace/publish', {
        method: 'POST',
        body: JSON.stringify(SampleAgents[1])
      });

      const passed = status === 401 && data.error === 'UNAUTHORIZED';

      this.recordTest('Authentication Required', passed);
    } catch (error) {
      this.recordTest('Authentication Required', false, error.message);
    }
  }

  /**
   * Test 14: Input Validation
   */
  async testValidation() {
    console.log('\nTest 14: Input Validation');
    try {
      // Try to publish with invalid data
      const { status, data } = await this.makeRequest('/marketplace/publish', {
        method: 'POST',
        body: JSON.stringify({
          name: 'a', // Too short
          version: 'invalid' // Invalid format
        }),
        authenticated: true
      });

      const passed = status === 400 && data.error === 'VALIDATION_ERROR';

      this.recordTest('Input Validation', passed);
    } catch (error) {
      this.recordTest('Input Validation', false, error.message);
    }
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    Test Results Summary                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Pass Rate: ${percentage}%\n`);

    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed. Review the output above for details.');

      console.log('\nFailed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`);
        });
    }

    console.log('');
  }
}

/**
 * Run tests if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MarketplaceAPITester();
  tester.runAllTests()
    .then(() => {
      process.exit(tester.testResults.every(r => r.passed) ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default MarketplaceAPITester;
