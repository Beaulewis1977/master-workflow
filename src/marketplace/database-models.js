/**
 * Database Models and Schemas for Agent Marketplace
 *
 * Defines data structures for agents, reviews, downloads, and analytics
 *
 * @module database-models
 */

/**
 * Agent Package Schema
 */
export const AgentSchema = {
  // Identifiers
  id: { type: 'string', required: true, unique: true },
  name: { type: 'string', required: true, pattern: /^[a-z0-9-]+$/, minLength: 3, maxLength: 50 },
  version: { type: 'string', required: true, pattern: /^\d+\.\d+\.\d+$/ },

  // Metadata
  author: { type: 'string', required: true },
  publisherId: { type: 'string', required: true },
  description: { type: 'string', required: true, minLength: 10, maxLength: 500 },
  longDescription: { type: 'string', maxLength: 5000 },

  // Categorization
  category: { type: 'string', enum: ['general', 'development', 'testing', 'deployment', 'security', 'database', 'api', 'frontend', 'backend', 'ml'] },
  tags: { type: 'array', items: { type: 'string' }, maxItems: 10 },

  // Technical Details
  capabilities: { type: 'array', required: true, items: { type: 'string' } },
  dependencies: { type: 'array', items: { type: 'string', pattern: /^[a-z0-9-]+@\d+\.\d+\.\d+$/ } },
  mcp_servers: { type: 'array', items: { type: 'string' } },
  config_schema: { type: 'object' },

  // Licensing
  license: { type: 'string', required: true, enum: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC'] },
  source_url: { type: 'string', pattern: /^https?:\/\/.+/ },
  repository: { type: 'object' },

  // Quality Metrics
  test_coverage: { type: 'number', min: 0, max: 100 },
  performance_rating: { type: 'number', min: 0, max: 5 },
  security_scan_passed: { type: 'boolean' },

  // Statistics
  downloads: { type: 'number', default: 0 },
  views: { type: 'number', default: 0 },
  rating: { type: 'number', min: 0, max: 5, default: 0 },
  reviewCount: { type: 'number', default: 0 },

  // Status
  status: { type: 'string', enum: ['active', 'deprecated', 'archived', 'pending'], default: 'active' },
  verified: { type: 'boolean', default: false },

  // Timestamps
  publishedAt: { type: 'date', required: true },
  updatedAt: { type: 'date', required: true },
  deprecatedAt: { type: 'date' }
};

/**
 * Review Schema
 */
export const ReviewSchema = {
  id: { type: 'string', required: true, unique: true },
  agentId: { type: 'string', required: true, ref: 'Agent' },
  userId: { type: 'string', required: true, ref: 'User' },
  rating: { type: 'number', required: true, min: 1, max: 5 },
  comment: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
  helpful: { type: 'number', default: 0 },
  verified_purchase: { type: 'boolean', default: false },
  createdAt: { type: 'date', required: true },
  updatedAt: { type: 'date' }
};

/**
 * Download Schema
 */
export const DownloadSchema = {
  id: { type: 'string', required: true, unique: true },
  agentId: { type: 'string', required: true, ref: 'Agent' },
  userId: { type: 'string', required: true, ref: 'User' },
  version: { type: 'string', required: true },
  ip_address: { type: 'string' },
  user_agent: { type: 'string' },
  timestamp: { type: 'date', required: true }
};

/**
 * Analytics Event Schema
 */
export const AnalyticsSchema = {
  id: { type: 'string', required: true, unique: true },
  event: { type: 'string', required: true, enum: ['agent_published', 'agent_installed', 'agent_updated', 'agent_viewed', 'search_performed'] },
  agentId: { type: 'string', ref: 'Agent' },
  userId: { type: 'string', ref: 'User' },
  metadata: { type: 'object' },
  timestamp: { type: 'date', required: true }
};

/**
 * User Schema
 */
export const UserSchema = {
  id: { type: 'string', required: true, unique: true },
  username: { type: 'string', required: true, unique: true, minLength: 3, maxLength: 30 },
  email: { type: 'string', required: true, unique: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  role: { type: 'string', enum: ['user', 'developer', 'admin'], default: 'user' },
  verified: { type: 'boolean', default: false },
  createdAt: { type: 'date', required: true },
  lastLoginAt: { type: 'date' }
};

/**
 * API Key Schema
 */
export const APIKeySchema = {
  key: { type: 'string', required: true, unique: true },
  userId: { type: 'string', required: true, ref: 'User' },
  role: { type: 'string', enum: ['user', 'developer', 'admin'], default: 'user' },
  permissions: { type: 'array', items: { type: 'string', enum: ['read', 'write', 'delete', 'admin'] } },
  createdAt: { type: 'date', required: true },
  expiresAt: { type: 'date' },
  lastUsedAt: { type: 'date' }
};

/**
 * Database Indexes for Performance
 */
export const Indexes = {
  agents: [
    { fields: ['name', 'version'], unique: true },
    { fields: ['category'] },
    { fields: ['publisherId'] },
    { fields: ['downloads'], order: 'desc' },
    { fields: ['rating'], order: 'desc' },
    { fields: ['publishedAt'], order: 'desc' },
    { fields: ['tags'] }
  ],
  reviews: [
    { fields: ['agentId', 'userId'], unique: true },
    { fields: ['agentId'] },
    { fields: ['userId'] },
    { fields: ['createdAt'], order: 'desc' }
  ],
  downloads: [
    { fields: ['agentId'] },
    { fields: ['userId'] },
    { fields: ['timestamp'], order: 'desc' }
  ],
  analytics: [
    { fields: ['event'] },
    { fields: ['agentId'] },
    { fields: ['timestamp'], order: 'desc' }
  ],
  users: [
    { fields: ['username'], unique: true },
    { fields: ['email'], unique: true }
  ]
};

/**
 * Validation Helper
 */
export class SchemaValidator {
  static validate(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required check
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      if (value === undefined || value === null) {
        continue; // Skip optional fields
      }

      // Type check
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type && rules.type !== 'date') {
          errors.push(`Field '${field}' must be of type ${rules.type}`);
          continue;
        }
      }

      // String validations
      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Field '${field}' must not exceed ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`Field '${field}' has invalid format`);
        }
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`Field '${field}' must be one of: ${rules.enum.join(', ')}`);
        }
      }

      // Number validations
      if (rules.type === 'number' && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`Field '${field}' must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`Field '${field}' must not exceed ${rules.max}`);
        }
      }

      // Array validations
      if (rules.type === 'array' && Array.isArray(value)) {
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`Field '${field}' must not exceed ${rules.maxItems} items`);
        }
        if (rules.items) {
          value.forEach((item, index) => {
            if (rules.items.type && typeof item !== rules.items.type) {
              errors.push(`Field '${field}[${index}]' must be of type ${rules.items.type}`);
            }
            if (rules.items.pattern && !rules.items.pattern.test(item)) {
              errors.push(`Field '${field}[${index}]' has invalid format`);
            }
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Sample Agent Package Data
 */
export const SampleAgents = [
  {
    name: 'test-automation-agent',
    version: '1.0.0',
    author: 'TestMaster',
    description: 'Automated testing agent with Jest and Playwright integration',
    capabilities: ['unit-testing', 'e2e-testing', 'test-generation'],
    dependencies: [],
    mcp_servers: ['github', 'jira'],
    test_coverage: 95.5,
    performance_rating: 4.8,
    license: 'MIT',
    source_url: 'https://github.com/example/test-automation-agent',
    category: 'testing',
    tags: ['testing', 'automation', 'jest', 'playwright']
  },
  {
    name: 'api-builder-agent',
    version: '2.1.0',
    author: 'DevTools',
    description: 'REST API builder with OpenAPI specification generation',
    capabilities: ['api-design', 'code-generation', 'documentation'],
    dependencies: ['database-agent@1.0.0'],
    mcp_servers: ['openapi', 'swagger'],
    test_coverage: 88.3,
    performance_rating: 4.6,
    license: 'MIT',
    source_url: 'https://github.com/example/api-builder-agent',
    category: 'api',
    tags: ['api', 'rest', 'openapi', 'swagger']
  },
  {
    name: 'security-scanner-agent',
    version: '1.5.2',
    author: 'SecTeam',
    description: 'Comprehensive security scanner for code and dependencies',
    capabilities: ['vulnerability-scan', 'code-analysis', 'dependency-check'],
    dependencies: [],
    mcp_servers: ['github', 'npm'],
    test_coverage: 92.1,
    performance_rating: 4.9,
    license: 'Apache-2.0',
    source_url: 'https://github.com/example/security-scanner-agent',
    category: 'security',
    tags: ['security', 'scanning', 'vulnerability', 'audit']
  }
];
