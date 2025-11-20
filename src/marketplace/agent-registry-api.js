/**
 * Agent Marketplace REST API
 *
 * Comprehensive API for community-driven agent sharing and discovery
 *
 * Features:
 * - Agent package management (publish, update, delete)
 * - Search and discovery with advanced filtering
 * - Installation and update management
 * - Ratings and reviews system
 * - Analytics and statistics
 *
 * @module agent-registry-api
 * @version 1.0.0
 */

import express from 'express';
import { createServer } from 'http';
import crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * Agent Marketplace API Server
 * Provides REST endpoints for agent package management
 */
export class AgentMarketplaceAPI extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      port: options.port || 3000,
      host: options.host || '0.0.0.0',
      apiVersion: 'v1',
      rateLimit: options.rateLimit || { windowMs: 15 * 60 * 1000, max: 100 },
      dbPath: options.dbPath || './data/marketplace.db',
      maxPackageSize: options.maxPackageSize || 10 * 1024 * 1024, // 10MB
      ...options
    };

    this.app = express();
    this.server = null;
    this.db = null;
    this.cache = new Map();
    this.rateLimitStore = new Map();

    // Statistics
    this.stats = {
      totalAgents: 0,
      totalDownloads: 0,
      totalReviews: 0,
      activeUsers: 0,
      apiCalls: 0,
      avgResponseTime: 0
    };

    this.setupMiddleware();
    this.setupRoutes();
    this.initializeDatabase();
  }

  /**
   * Initialize database and create tables
   */
  async initializeDatabase() {
    try {
      // Use in-memory storage for now (can be extended to SQLite/MongoDB)
      this.db = {
        agents: new Map(),
        reviews: new Map(),
        downloads: new Map(),
        analytics: new Map(),
        users: new Map(),
        apiKeys: new Map()
      };

      // Create admin API key
      const adminKey = this.generateAPIKey('admin');
      this.db.apiKeys.set(adminKey, {
        userId: 'admin',
        role: 'admin',
        createdAt: new Date(),
        permissions: ['read', 'write', 'delete', 'admin']
      });

      console.log(`[Marketplace API] Database initialized`);
      console.log(`[Marketplace API] Admin API Key: ${adminKey}`);

      this.emit('database:ready');
    } catch (error) {
      console.error('[Marketplace API] Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.stats.apiCalls++;
        this.stats.avgResponseTime = (this.stats.avgResponseTime + duration) / 2;
        console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });

    // Rate limiting
    this.app.use(this.rateLimiterMiddleware.bind(this));
  }

  /**
   * Rate limiter middleware
   */
  rateLimiterMiddleware(req, res, next) {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, { count: 1, resetTime: now + this.config.rateLimit.windowMs });
      return next();
    }

    const rateData = this.rateLimitStore.get(key);

    if (now > rateData.resetTime) {
      rateData.count = 1;
      rateData.resetTime = now + this.config.rateLimit.windowMs;
      return next();
    }

    if (rateData.count >= this.config.rateLimit.max) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((rateData.resetTime - now) / 1000)
      });
    }

    rateData.count++;
    next();
  }

  /**
   * Authentication middleware
   */
  authenticateMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'API key required'
      });
    }

    const keyData = this.db.apiKeys.get(apiKey);
    if (!keyData) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid API key'
      });
    }

    req.user = {
      userId: keyData.userId,
      role: keyData.role,
      permissions: keyData.permissions
    };

    next();
  }

  /**
   * Admin-only middleware
   */
  adminOnlyMiddleware(req, res, next) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }
    next();
  }

  /**
   * Input validation middleware factory
   */
  validateInput(schema) {
    return (req, res, next) => {
      const errors = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];

        if (rules.required && !value) {
          errors.push(`${field} is required`);
          continue;
        }

        if (value && rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }

        if (value && rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }

        if (value && rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        }

        if (value && rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} has invalid format`);
        }

        if (value && rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: errors
        });
      }

      next();
    };
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    const router = express.Router();

    // Health check
    router.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        version: this.config.apiVersion,
        uptime: process.uptime(),
        stats: this.stats
      });
    });

    // ===== Agent Package Management =====

    /**
     * POST /api/v1/marketplace/publish
     * Publish a new agent to the marketplace
     */
    router.post('/marketplace/publish',
      this.authenticateMiddleware.bind(this),
      this.validateInput({
        name: { required: true, type: 'string', pattern: /^[a-z0-9-]+$/, minLength: 3, maxLength: 50 },
        version: { required: true, type: 'string', pattern: /^\d+\.\d+\.\d+$/ },
        description: { required: true, type: 'string', minLength: 10, maxLength: 500 },
        author: { required: true, type: 'string' },
        capabilities: { required: true, type: 'object' },
        license: { required: true, type: 'string', enum: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause'] }
      }),
      async (req, res) => {
        try {
          const agentData = req.body;
          const agentId = this.generateAgentId(agentData.name, agentData.version);

          // Check if agent already exists
          if (this.db.agents.has(agentId)) {
            return res.status(409).json({
              error: 'AGENT_EXISTS',
              message: 'Agent with this name and version already exists'
            });
          }

          // Validate package structure
          const validationResult = this.validateAgentPackage(agentData);
          if (!validationResult.valid) {
            return res.status(400).json({
              error: 'INVALID_PACKAGE',
              message: 'Agent package validation failed',
              details: validationResult.errors
            });
          }

          // Create agent record
          const agent = {
            id: agentId,
            ...agentData,
            publisherId: req.user.userId,
            publishedAt: new Date(),
            updatedAt: new Date(),
            downloads: 0,
            rating: 0,
            reviewCount: 0,
            status: 'active',
            tags: agentData.tags || [],
            category: agentData.category || 'general'
          };

          this.db.agents.set(agentId, agent);
          this.stats.totalAgents++;

          // Track analytics
          this.trackAnalytics('agent_published', {
            agentId,
            userId: req.user.userId,
            timestamp: new Date()
          });

          this.emit('agent:published', agent);

          res.status(201).json({
            success: true,
            message: 'Agent published successfully',
            agent: this.sanitizeAgent(agent)
          });

        } catch (error) {
          console.error('[Marketplace API] Publish error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to publish agent'
          });
        }
      }
    );

    /**
     * GET /api/v1/marketplace/agent/:id
     * Get agent details by ID
     */
    router.get('/marketplace/agent/:id', async (req, res) => {
      try {
        const agentId = req.params.id;
        const agent = this.db.agents.get(agentId);

        if (!agent) {
          return res.status(404).json({
            error: 'AGENT_NOT_FOUND',
            message: 'Agent not found'
          });
        }

        // Increment view count
        agent.views = (agent.views || 0) + 1;

        res.json({
          success: true,
          agent: this.sanitizeAgent(agent)
        });

      } catch (error) {
        console.error('[Marketplace API] Get agent error:', error);
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Failed to retrieve agent'
        });
      }
    });

    /**
     * PUT /api/v1/marketplace/agent/:id
     * Update an existing agent
     */
    router.put('/marketplace/agent/:id',
      this.authenticateMiddleware.bind(this),
      async (req, res) => {
        try {
          const agentId = req.params.id;
          const agent = this.db.agents.get(agentId);

          if (!agent) {
            return res.status(404).json({
              error: 'AGENT_NOT_FOUND',
              message: 'Agent not found'
            });
          }

          // Check ownership
          if (agent.publisherId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({
              error: 'FORBIDDEN',
              message: 'You do not have permission to update this agent'
            });
          }

          // Update agent
          const updates = req.body;
          const updatedAgent = {
            ...agent,
            ...updates,
            id: agentId, // Prevent ID change
            publisherId: agent.publisherId, // Prevent publisher change
            publishedAt: agent.publishedAt, // Prevent publish date change
            updatedAt: new Date()
          };

          this.db.agents.set(agentId, updatedAgent);

          this.emit('agent:updated', updatedAgent);

          res.json({
            success: true,
            message: 'Agent updated successfully',
            agent: this.sanitizeAgent(updatedAgent)
          });

        } catch (error) {
          console.error('[Marketplace API] Update error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to update agent'
          });
        }
      }
    );

    /**
     * DELETE /api/v1/marketplace/agent/:id
     * Delete an agent (admin/owner only)
     */
    router.delete('/marketplace/agent/:id',
      this.authenticateMiddleware.bind(this),
      async (req, res) => {
        try {
          const agentId = req.params.id;
          const agent = this.db.agents.get(agentId);

          if (!agent) {
            return res.status(404).json({
              error: 'AGENT_NOT_FOUND',
              message: 'Agent not found'
            });
          }

          // Check ownership
          if (agent.publisherId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({
              error: 'FORBIDDEN',
              message: 'You do not have permission to delete this agent'
            });
          }

          this.db.agents.delete(agentId);
          this.stats.totalAgents--;

          this.emit('agent:deleted', { agentId, userId: req.user.userId });

          res.json({
            success: true,
            message: 'Agent deleted successfully'
          });

        } catch (error) {
          console.error('[Marketplace API] Delete error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to delete agent'
          });
        }
      }
    );

    // ===== Search and Discovery =====

    /**
     * GET /api/v1/marketplace/search
     * Search agents with filters
     */
    router.get('/marketplace/search', async (req, res) => {
      try {
        const {
          q = '',
          category = '',
          sort = 'downloads',
          order = 'desc',
          page = 1,
          limit = 20,
          tags = ''
        } = req.query;

        let agents = Array.from(this.db.agents.values());

        // Filter by search query
        if (q) {
          const query = q.toLowerCase();
          agents = agents.filter(agent =>
            agent.name.toLowerCase().includes(query) ||
            agent.description.toLowerCase().includes(query) ||
            agent.author.toLowerCase().includes(query)
          );
        }

        // Filter by category
        if (category) {
          agents = agents.filter(agent => agent.category === category);
        }

        // Filter by tags
        if (tags) {
          const tagList = tags.split(',').map(t => t.trim());
          agents = agents.filter(agent =>
            tagList.some(tag => agent.tags?.includes(tag))
          );
        }

        // Sort
        agents.sort((a, b) => {
          const aVal = a[sort] || 0;
          const bVal = b[sort] || 0;
          return order === 'desc' ? bVal - aVal : aVal - bVal;
        });

        // Paginate
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedAgents = agents.slice(startIndex, endIndex);

        res.json({
          success: true,
          results: paginatedAgents.map(a => this.sanitizeAgent(a)),
          pagination: {
            total: agents.length,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(agents.length / limit)
          }
        });

      } catch (error) {
        console.error('[Marketplace API] Search error:', error);
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Search failed'
        });
      }
    });

    /**
     * GET /api/v1/marketplace/trending
     * Get trending agents
     */
    router.get('/marketplace/trending', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 10;
        const timeframe = req.query.timeframe || '7d'; // 1d, 7d, 30d

        // Calculate trending score based on recent downloads and views
        const agents = Array.from(this.db.agents.values())
          .map(agent => ({
            ...agent,
            trendingScore: this.calculateTrendingScore(agent, timeframe)
          }))
          .sort((a, b) => b.trendingScore - a.trendingScore)
          .slice(0, limit);

        res.json({
          success: true,
          trending: agents.map(a => this.sanitizeAgent(a)),
          timeframe
        });

      } catch (error) {
        console.error('[Marketplace API] Trending error:', error);
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get trending agents'
        });
      }
    });

    /**
     * GET /api/v1/marketplace/recommended
     * Get personalized recommendations
     */
    router.get('/marketplace/recommended',
      this.authenticateMiddleware.bind(this),
      async (req, res) => {
        try {
          const limit = parseInt(req.query.limit) || 10;

          // Get user's installed agents and preferences
          const userHistory = this.getUserHistory(req.user.userId);

          // Simple recommendation algorithm based on category and tags
          const recommendations = this.generateRecommendations(userHistory, limit);

          res.json({
            success: true,
            recommended: recommendations.map(a => this.sanitizeAgent(a))
          });

        } catch (error) {
          console.error('[Marketplace API] Recommendations error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to get recommendations'
          });
        }
      }
    );

    /**
     * GET /api/v1/marketplace/categories
     * List all categories
     */
    router.get('/marketplace/categories', async (req, res) => {
      try {
        const agents = Array.from(this.db.agents.values());
        const categoryCounts = {};

        agents.forEach(agent => {
          const category = agent.category || 'general';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const categories = Object.entries(categoryCounts).map(([name, count]) => ({
          name,
          count,
          description: this.getCategoryDescription(name)
        }));

        res.json({
          success: true,
          categories
        });

      } catch (error) {
        console.error('[Marketplace API] Categories error:', error);
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get categories'
        });
      }
    });

    // ===== Installation and Updates =====

    /**
     * POST /api/v1/marketplace/install
     * Install an agent
     */
    router.post('/marketplace/install',
      this.authenticateMiddleware.bind(this),
      this.validateInput({
        agentId: { required: true, type: 'string' }
      }),
      async (req, res) => {
        try {
          const { agentId } = req.body;
          const agent = this.db.agents.get(agentId);

          if (!agent) {
            return res.status(404).json({
              error: 'AGENT_NOT_FOUND',
              message: 'Agent not found'
            });
          }

          // Increment download count
          agent.downloads = (agent.downloads || 0) + 1;
          this.stats.totalDownloads++;

          // Record download
          const downloadId = crypto.randomUUID();
          this.db.downloads.set(downloadId, {
            id: downloadId,
            agentId,
            userId: req.user.userId,
            timestamp: new Date()
          });

          // Track analytics
          this.trackAnalytics('agent_installed', {
            agentId,
            userId: req.user.userId,
            timestamp: new Date()
          });

          this.emit('agent:installed', { agentId, userId: req.user.userId });

          res.json({
            success: true,
            message: 'Agent installed successfully',
            agent: this.sanitizeAgent(agent),
            installId: downloadId
          });

        } catch (error) {
          console.error('[Marketplace API] Install error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Installation failed'
          });
        }
      }
    );

    /**
     * GET /api/v1/marketplace/updates
     * Check for agent updates
     */
    router.get('/marketplace/updates',
      this.authenticateMiddleware.bind(this),
      async (req, res) => {
        try {
          const installedAgents = req.body.installed || [];
          const updates = [];

          for (const installed of installedAgents) {
            const latestVersion = this.getLatestVersion(installed.name);
            if (latestVersion && this.compareVersions(latestVersion.version, installed.version) > 0) {
              updates.push({
                name: installed.name,
                currentVersion: installed.version,
                latestVersion: latestVersion.version,
                agent: this.sanitizeAgent(latestVersion)
              });
            }
          }

          res.json({
            success: true,
            updates,
            count: updates.length
          });

        } catch (error) {
          console.error('[Marketplace API] Updates check error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to check for updates'
          });
        }
      }
    );

    /**
     * POST /api/v1/marketplace/update/:id
     * Update an installed agent
     */
    router.post('/marketplace/update/:id',
      this.authenticateMiddleware.bind(this),
      async (req, res) => {
        try {
          const agentId = req.params.id;
          const agent = this.db.agents.get(agentId);

          if (!agent) {
            return res.status(404).json({
              error: 'AGENT_NOT_FOUND',
              message: 'Agent not found'
            });
          }

          // Track analytics
          this.trackAnalytics('agent_updated', {
            agentId,
            userId: req.user.userId,
            timestamp: new Date()
          });

          this.emit('agent:updated', { agentId, userId: req.user.userId });

          res.json({
            success: true,
            message: 'Agent updated successfully',
            agent: this.sanitizeAgent(agent)
          });

        } catch (error) {
          console.error('[Marketplace API] Update error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Update failed'
          });
        }
      }
    );

    // ===== Ratings and Reviews =====

    /**
     * POST /api/v1/marketplace/rate
     * Submit a rating
     */
    router.post('/marketplace/rate',
      this.authenticateMiddleware.bind(this),
      this.validateInput({
        agentId: { required: true, type: 'string' },
        rating: { required: true, type: 'number' }
      }),
      async (req, res) => {
        try {
          const { agentId, rating } = req.body;

          if (rating < 1 || rating > 5) {
            return res.status(400).json({
              error: 'INVALID_RATING',
              message: 'Rating must be between 1 and 5'
            });
          }

          const agent = this.db.agents.get(agentId);
          if (!agent) {
            return res.status(404).json({
              error: 'AGENT_NOT_FOUND',
              message: 'Agent not found'
            });
          }

          // Update agent rating
          const currentTotal = agent.rating * (agent.reviewCount || 0);
          agent.reviewCount = (agent.reviewCount || 0) + 1;
          agent.rating = (currentTotal + rating) / agent.reviewCount;

          res.json({
            success: true,
            message: 'Rating submitted successfully',
            newRating: agent.rating
          });

        } catch (error) {
          console.error('[Marketplace API] Rating error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to submit rating'
          });
        }
      }
    );

    /**
     * GET /api/v1/marketplace/reviews/:agentId
     * Get reviews for an agent
     */
    router.get('/marketplace/reviews/:agentId', async (req, res) => {
      try {
        const agentId = req.params.agentId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const allReviews = Array.from(this.db.reviews.values())
          .filter(review => review.agentId === agentId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const startIndex = (page - 1) * limit;
        const paginatedReviews = allReviews.slice(startIndex, startIndex + limit);

        res.json({
          success: true,
          reviews: paginatedReviews,
          pagination: {
            total: allReviews.length,
            page,
            limit,
            pages: Math.ceil(allReviews.length / limit)
          }
        });

      } catch (error) {
        console.error('[Marketplace API] Get reviews error:', error);
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get reviews'
        });
      }
    });

    /**
     * POST /api/v1/marketplace/review
     * Submit a review
     */
    router.post('/marketplace/review',
      this.authenticateMiddleware.bind(this),
      this.validateInput({
        agentId: { required: true, type: 'string' },
        rating: { required: true, type: 'number' },
        comment: { required: true, type: 'string', minLength: 10, maxLength: 1000 }
      }),
      async (req, res) => {
        try {
          const { agentId, rating, comment } = req.body;

          if (rating < 1 || rating > 5) {
            return res.status(400).json({
              error: 'INVALID_RATING',
              message: 'Rating must be between 1 and 5'
            });
          }

          const agent = this.db.agents.get(agentId);
          if (!agent) {
            return res.status(404).json({
              error: 'AGENT_NOT_FOUND',
              message: 'Agent not found'
            });
          }

          const reviewId = crypto.randomUUID();
          const review = {
            id: reviewId,
            agentId,
            userId: req.user.userId,
            rating,
            comment,
            createdAt: new Date(),
            helpful: 0
          };

          this.db.reviews.set(reviewId, review);
          this.stats.totalReviews++;

          // Update agent rating
          const currentTotal = agent.rating * (agent.reviewCount || 0);
          agent.reviewCount = (agent.reviewCount || 0) + 1;
          agent.rating = (currentTotal + rating) / agent.reviewCount;

          this.emit('review:created', review);

          res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
          });

        } catch (error) {
          console.error('[Marketplace API] Review error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to submit review'
          });
        }
      }
    );

    // ===== Analytics =====

    /**
     * GET /api/v1/marketplace/stats/:agentId
     * Get agent statistics
     */
    router.get('/marketplace/stats/:agentId', async (req, res) => {
      try {
        const agentId = req.params.agentId;
        const agent = this.db.agents.get(agentId);

        if (!agent) {
          return res.status(404).json({
            error: 'AGENT_NOT_FOUND',
            message: 'Agent not found'
          });
        }

        const downloads = Array.from(this.db.downloads.values())
          .filter(d => d.agentId === agentId);

        const reviews = Array.from(this.db.reviews.values())
          .filter(r => r.agentId === agentId);

        const stats = {
          agentId,
          name: agent.name,
          version: agent.version,
          totalDownloads: agent.downloads || 0,
          totalReviews: reviews.length,
          averageRating: agent.rating || 0,
          views: agent.views || 0,
          downloadsLast7Days: downloads.filter(d =>
            new Date() - new Date(d.timestamp) < 7 * 24 * 60 * 60 * 1000
          ).length,
          downloadsLast30Days: downloads.filter(d =>
            new Date() - new Date(d.timestamp) < 30 * 24 * 60 * 60 * 1000
          ).length,
          ratingDistribution: this.getRatingDistribution(reviews)
        };

        res.json({
          success: true,
          stats
        });

      } catch (error) {
        console.error('[Marketplace API] Stats error:', error);
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get statistics'
        });
      }
    });

    /**
     * GET /api/v1/marketplace/analytics
     * Get platform analytics (admin only)
     */
    router.get('/marketplace/analytics',
      this.authenticateMiddleware.bind(this),
      this.adminOnlyMiddleware.bind(this),
      async (req, res) => {
        try {
          const analytics = {
            platform: this.stats,
            topAgents: this.getTopAgents(10),
            categoryDistribution: this.getCategoryDistribution(),
            recentActivity: this.getRecentActivity(50),
            userStats: {
              totalUsers: this.db.users.size,
              activeUsers: this.stats.activeUsers
            }
          };

          res.json({
            success: true,
            analytics
          });

        } catch (error) {
          console.error('[Marketplace API] Analytics error:', error);
          res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'Failed to get analytics'
          });
        }
      }
    );

    // Mount router with API version prefix
    this.app.use(`/api/${this.config.apiVersion}`, router);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Endpoint not found',
        path: req.path
      });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      console.error('[Marketplace API] Unhandled error:', err);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      });
    });
  }

  /**
   * Utility Methods
   */

  generateAgentId(name, version) {
    return `${name}@${version}`;
  }

  generateAPIKey(userId) {
    return `mk_${userId}_${crypto.randomBytes(32).toString('hex')}`;
  }

  validateAgentPackage(agentData) {
    const errors = [];

    // Required fields
    const required = ['name', 'version', 'description', 'author', 'capabilities'];
    for (const field of required) {
      if (!agentData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Version format
    if (agentData.version && !/^\d+\.\d+\.\d+$/.test(agentData.version)) {
      errors.push('Invalid version format (use semver: x.y.z)');
    }

    // Capabilities
    if (agentData.capabilities && !Array.isArray(agentData.capabilities)) {
      errors.push('Capabilities must be an array');
    }

    // Dependencies
    if (agentData.dependencies) {
      if (!Array.isArray(agentData.dependencies)) {
        errors.push('Dependencies must be an array');
      } else {
        for (const dep of agentData.dependencies) {
          if (typeof dep !== 'string' || !dep.includes('@')) {
            errors.push(`Invalid dependency format: ${dep} (use name@version)`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  sanitizeAgent(agent) {
    // Remove sensitive fields before returning
    const { ...sanitized } = agent;
    return sanitized;
  }

  calculateTrendingScore(agent, timeframe) {
    const hours = timeframe === '1d' ? 24 : timeframe === '7d' ? 168 : 720;
    const recentDownloads = agent.downloads || 0;
    const views = agent.views || 0;
    const rating = agent.rating || 0;

    // Weighted score: downloads (40%), views (30%), rating (30%)
    return (recentDownloads * 0.4) + (views * 0.3) + (rating * 20 * 0.3);
  }

  getUserHistory(userId) {
    // Get user's download history
    const downloads = Array.from(this.db.downloads.values())
      .filter(d => d.userId === userId);

    return downloads;
  }

  generateRecommendations(userHistory, limit) {
    // Simple recommendation based on user's download history
    const agents = Array.from(this.db.agents.values());

    if (userHistory.length === 0) {
      // Return top rated agents for new users
      return agents
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, limit);
    }

    // Get categories from user history
    const userCategories = new Set();
    userHistory.forEach(download => {
      const agent = this.db.agents.get(download.agentId);
      if (agent) {
        userCategories.add(agent.category);
      }
    });

    // Recommend agents from similar categories
    return agents
      .filter(agent => userCategories.has(agent.category))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }

  getCategoryDescription(category) {
    const descriptions = {
      'general': 'General purpose agents',
      'development': 'Development and coding agents',
      'testing': 'Testing and QA agents',
      'deployment': 'Deployment and DevOps agents',
      'security': 'Security and audit agents',
      'database': 'Database management agents',
      'api': 'API development agents',
      'frontend': 'Frontend development agents',
      'backend': 'Backend development agents',
      'ml': 'Machine learning agents'
    };
    return descriptions[category] || 'No description available';
  }

  getLatestVersion(agentName) {
    const versions = Array.from(this.db.agents.values())
      .filter(agent => agent.name === agentName)
      .sort((a, b) => this.compareVersions(b.version, a.version));

    return versions[0] || null;
  }

  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }

  getRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[Math.round(review.rating)]++;
    });
    return distribution;
  }

  getTopAgents(limit) {
    return Array.from(this.db.agents.values())
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, limit)
      .map(a => ({
        id: a.id,
        name: a.name,
        downloads: a.downloads,
        rating: a.rating
      }));
  }

  getCategoryDistribution() {
    const distribution = {};
    Array.from(this.db.agents.values()).forEach(agent => {
      const category = agent.category || 'general';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  getRecentActivity(limit) {
    const activities = [];

    // Get recent downloads
    Array.from(this.db.downloads.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit / 2)
      .forEach(download => {
        activities.push({
          type: 'download',
          agentId: download.agentId,
          timestamp: download.timestamp
        });
      });

    // Get recent reviews
    Array.from(this.db.reviews.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit / 2)
      .forEach(review => {
        activities.push({
          type: 'review',
          agentId: review.agentId,
          rating: review.rating,
          timestamp: review.createdAt
        });
      });

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  trackAnalytics(event, data) {
    const analyticsId = crypto.randomUUID();
    this.db.analytics.set(analyticsId, {
      id: analyticsId,
      event,
      ...data
    });
  }

  /**
   * Start the API server
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(this.app);

        this.server.listen(this.config.port, this.config.host, () => {
          console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Agent Marketplace API Server Started                 ║
╠════════════════════════════════════════════════════════════════╣
║  Version: ${this.config.apiVersion.padEnd(50)} ║
║  Host: ${this.config.host.padEnd(53)} ║
║  Port: ${String(this.config.port).padEnd(53)} ║
║  Base URL: http://${this.config.host}:${this.config.port}/api/${this.config.apiVersion.padEnd(32)} ║
╠════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                    ║
║    GET  /api/v1/health                                         ║
║    POST /api/v1/marketplace/publish                            ║
║    GET  /api/v1/marketplace/agent/:id                          ║
║    PUT  /api/v1/marketplace/agent/:id                          ║
║    DELETE /api/v1/marketplace/agent/:id                        ║
║    GET  /api/v1/marketplace/search                             ║
║    GET  /api/v1/marketplace/trending                           ║
║    GET  /api/v1/marketplace/recommended                        ║
║    GET  /api/v1/marketplace/categories                         ║
║    POST /api/v1/marketplace/install                            ║
║    GET  /api/v1/marketplace/updates                            ║
║    POST /api/v1/marketplace/update/:id                         ║
║    POST /api/v1/marketplace/rate                               ║
║    GET  /api/v1/marketplace/reviews/:agentId                   ║
║    POST /api/v1/marketplace/review                             ║
║    GET  /api/v1/marketplace/stats/:agentId                     ║
║    GET  /api/v1/marketplace/analytics                          ║
╚════════════════════════════════════════════════════════════════╝
          `);

          this.emit('server:started');
          resolve();
        });

        this.server.on('error', (error) => {
          console.error('[Marketplace API] Server error:', error);
          this.emit('server:error', error);
          reject(error);
        });

      } catch (error) {
        console.error('[Marketplace API] Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the API server
   */
  async stop() {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        return resolve();
      }

      this.server.close((error) => {
        if (error) {
          console.error('[Marketplace API] Error stopping server:', error);
          reject(error);
        } else {
          console.log('[Marketplace API] Server stopped');
          this.emit('server:stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      agentCount: this.db.agents.size,
      reviewCount: this.db.reviews.size,
      downloadCount: this.db.downloads.size
    };
  }
}

/**
 * Export factory function for easy instantiation
 */
export function createMarketplaceAPI(options = {}) {
  return new AgentMarketplaceAPI(options);
}

/**
 * CLI Entry Point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const api = createMarketplaceAPI({
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  });

  api.start().catch(error => {
    console.error('Failed to start Marketplace API:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Marketplace API] Shutting down gracefully...');
    await api.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n[Marketplace API] Shutting down gracefully...');
    await api.stop();
    process.exit(0);
  });
}
