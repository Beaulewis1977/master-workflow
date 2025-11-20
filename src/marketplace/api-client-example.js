/**
 * Agent Marketplace API Client Example
 *
 * Demonstrates how to interact with the Marketplace API
 *
 * @module api-client-example
 */

import fetch from 'node-fetch';

/**
 * Marketplace API Client
 */
export class MarketplaceClient {
  constructor(baseURL = 'http://localhost:3000/api/v1', apiKey = null) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // ===== Agent Management =====

  async publishAgent(agentData) {
    return this.request('/marketplace/publish', {
      method: 'POST',
      body: JSON.stringify(agentData)
    });
  }

  async getAgent(agentId) {
    return this.request(`/marketplace/agent/${agentId}`);
  }

  async updateAgent(agentId, updates) {
    return this.request(`/marketplace/agent/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteAgent(agentId) {
    return this.request(`/marketplace/agent/${agentId}`, {
      method: 'DELETE'
    });
  }

  // ===== Search and Discovery =====

  async searchAgents(query, filters = {}) {
    const params = new URLSearchParams({
      q: query,
      ...filters
    });
    return this.request(`/marketplace/search?${params}`);
  }

  async getTrendingAgents(timeframe = '7d', limit = 10) {
    return this.request(`/marketplace/trending?timeframe=${timeframe}&limit=${limit}`);
  }

  async getRecommendations(limit = 10) {
    return this.request(`/marketplace/recommended?limit=${limit}`);
  }

  async getCategories() {
    return this.request('/marketplace/categories');
  }

  // ===== Installation =====

  async installAgent(agentId) {
    return this.request('/marketplace/install', {
      method: 'POST',
      body: JSON.stringify({ agentId })
    });
  }

  async checkUpdates(installedAgents) {
    return this.request('/marketplace/updates', {
      method: 'GET',
      body: JSON.stringify({ installed: installedAgents })
    });
  }

  async updateInstalledAgent(agentId) {
    return this.request(`/marketplace/update/${agentId}`, {
      method: 'POST'
    });
  }

  // ===== Reviews and Ratings =====

  async rateAgent(agentId, rating) {
    return this.request('/marketplace/rate', {
      method: 'POST',
      body: JSON.stringify({ agentId, rating })
    });
  }

  async submitReview(agentId, rating, comment) {
    return this.request('/marketplace/review', {
      method: 'POST',
      body: JSON.stringify({ agentId, rating, comment })
    });
  }

  async getReviews(agentId, page = 1, limit = 10) {
    return this.request(`/marketplace/reviews/${agentId}?page=${page}&limit=${limit}`);
  }

  // ===== Analytics =====

  async getAgentStats(agentId) {
    return this.request(`/marketplace/stats/${agentId}`);
  }

  async getPlatformAnalytics() {
    return this.request('/marketplace/analytics');
  }

  // ===== Health Check =====

  async healthCheck() {
    return this.request('/health');
  }
}

/**
 * Example Usage
 */
export async function runExamples() {
  console.log('Agent Marketplace API Client Examples\n');

  // Initialize client (replace with your API key)
  const client = new MarketplaceClient('http://localhost:3000/api/v1', 'mk_admin_...');

  try {
    // Example 1: Health Check
    console.log('1. Health Check');
    const health = await client.healthCheck();
    console.log('   Status:', health.status);
    console.log('   Version:', health.version);
    console.log('');

    // Example 2: Publish a New Agent
    console.log('2. Publish New Agent');
    const newAgent = {
      name: 'example-agent',
      version: '1.0.0',
      author: 'Developer',
      description: 'An example agent for demonstration purposes',
      capabilities: ['example-capability-1', 'example-capability-2'],
      dependencies: [],
      mcp_servers: ['context7', 'github'],
      test_coverage: 85.0,
      performance_rating: 4.5,
      license: 'MIT',
      source_url: 'https://github.com/example/example-agent',
      category: 'general',
      tags: ['example', 'demo']
    };

    const publishResult = await client.publishAgent(newAgent);
    console.log('   Published:', publishResult.agent.name);
    console.log('   Agent ID:', publishResult.agent.id);
    console.log('');

    // Example 3: Search for Agents
    console.log('3. Search Agents');
    const searchResults = await client.searchAgents('test', {
      category: 'testing',
      sort: 'downloads',
      order: 'desc',
      limit: 5
    });
    console.log('   Found:', searchResults.pagination.total, 'agents');
    searchResults.results.forEach(agent => {
      console.log(`   - ${agent.name} v${agent.version} (${agent.downloads} downloads)`);
    });
    console.log('');

    // Example 4: Get Trending Agents
    console.log('4. Get Trending Agents');
    const trending = await client.getTrendingAgents('7d', 5);
    console.log('   Trending in last 7 days:');
    trending.trending.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent.name} (score: ${agent.trendingScore.toFixed(2)})`);
    });
    console.log('');

    // Example 5: Install an Agent
    console.log('5. Install Agent');
    const agentId = publishResult.agent.id;
    const installResult = await client.installAgent(agentId);
    console.log('   Installed:', installResult.agent.name);
    console.log('   Install ID:', installResult.installId);
    console.log('');

    // Example 6: Submit a Review
    console.log('6. Submit Review');
    const reviewResult = await client.submitReview(
      agentId,
      5,
      'Excellent agent! Very helpful and well-documented.'
    );
    console.log('   Review submitted successfully');
    console.log('   Review ID:', reviewResult.review.id);
    console.log('');

    // Example 7: Get Agent Statistics
    console.log('7. Get Agent Statistics');
    const stats = await client.getAgentStats(agentId);
    console.log('   Downloads:', stats.stats.totalDownloads);
    console.log('   Reviews:', stats.stats.totalReviews);
    console.log('   Rating:', stats.stats.averageRating.toFixed(1));
    console.log('');

    // Example 8: Get Categories
    console.log('8. Get Categories');
    const categories = await client.getCategories();
    console.log('   Available categories:');
    categories.categories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.count} agents`);
    });
    console.log('');

    // Example 9: Get Recommendations
    console.log('9. Get Recommendations');
    const recommendations = await client.getRecommendations(5);
    console.log('   Recommended agents:');
    recommendations.recommended.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent.name} (${agent.rating.toFixed(1)}⭐)`);
    });
    console.log('');

    // Example 10: Update Agent
    console.log('10. Update Agent');
    const updateResult = await client.updateAgent(agentId, {
      description: 'Updated description with more details',
      version: '1.0.1'
    });
    console.log('   Updated:', updateResult.agent.name);
    console.log('   New version:', updateResult.agent.version);
    console.log('');

    console.log('All examples completed successfully!');

  } catch (error) {
    console.error('Error running examples:', error.message);
  }
}

/**
 * Advanced Usage Examples
 */
export async function advancedExamples() {
  const client = new MarketplaceClient('http://localhost:3000/api/v1', 'mk_admin_...');

  // Batch operations
  async function batchInstall(agentIds) {
    const results = await Promise.all(
      agentIds.map(id => client.installAgent(id).catch(err => ({ error: err.message })))
    );
    return results;
  }

  // Search with multiple filters
  async function advancedSearch(criteria) {
    const { categories, tags, minRating, minDownloads } = criteria;

    let allResults = [];

    for (const category of categories) {
      const results = await client.searchAgents('', {
        category,
        tags: tags.join(','),
        limit: 100
      });

      const filtered = results.results.filter(agent =>
        agent.rating >= minRating && agent.downloads >= minDownloads
      );

      allResults = allResults.concat(filtered);
    }

    return allResults;
  }

  // Monitor agent performance over time
  async function trackAgentPerformance(agentId, interval = 3600000) {
    setInterval(async () => {
      const stats = await client.getAgentStats(agentId);
      console.log(`[${new Date().toISOString()}] ${stats.stats.name}:`, {
        downloads: stats.stats.totalDownloads,
        rating: stats.stats.averageRating,
        reviews: stats.stats.totalReviews
      });
    }, interval);
  }

  return { batchInstall, advancedSearch, trackAgentPerformance };
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
