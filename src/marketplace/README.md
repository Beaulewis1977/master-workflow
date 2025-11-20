# Agent Marketplace API

Comprehensive REST API for community-driven agent sharing and discovery.

## Overview

The Agent Marketplace API provides a complete platform for publishing, discovering, installing, and managing AI agents. It includes features for search, ratings, reviews, analytics, and more.

## Features

### Core Features
- **Agent Package Management**: Publish, update, and manage agent packages
- **Search and Discovery**: Advanced search with filtering, sorting, and pagination
- **Installation Management**: Install agents and check for updates
- **Ratings and Reviews**: Community feedback and quality metrics
- **Analytics**: Comprehensive statistics and platform analytics
- **Security**: API key authentication, rate limiting, input validation

### API Endpoints

#### Agent Management
```
POST   /api/v1/marketplace/publish       - Publish new agent
GET    /api/v1/marketplace/agent/:id     - Get agent details
PUT    /api/v1/marketplace/agent/:id     - Update agent
DELETE /api/v1/marketplace/agent/:id     - Delete agent (owner/admin)
```

#### Search and Discovery
```
GET /api/v1/marketplace/search           - Search agents
GET /api/v1/marketplace/trending         - Get trending agents
GET /api/v1/marketplace/recommended      - Get personalized recommendations
GET /api/v1/marketplace/categories       - List all categories
```

#### Installation
```
POST /api/v1/marketplace/install         - Install agent
GET  /api/v1/marketplace/updates         - Check for updates
POST /api/v1/marketplace/update/:id      - Update installed agent
```

#### Reviews and Ratings
```
POST /api/v1/marketplace/rate            - Submit rating
GET  /api/v1/marketplace/reviews/:agentId - Get reviews
POST /api/v1/marketplace/review          - Submit review
```

#### Analytics
```
GET /api/v1/marketplace/stats/:agentId   - Agent statistics
GET /api/v1/marketplace/analytics        - Platform analytics (admin)
```

## Quick Start

### Installation

```bash
npm install
```

### Start Server

```bash
# Using npm script
npm run marketplace:start

# Or directly
node src/marketplace/agent-registry-api.js
```

### Environment Variables

```bash
PORT=3000
HOST=0.0.0.0
API_VERSION=v1
```

## Usage Examples

### Using the Client Library

```javascript
import { MarketplaceClient } from './api-client-example.js';

// Initialize client
const client = new MarketplaceClient('http://localhost:3000/api/v1', 'your-api-key');

// Publish an agent
const agent = await client.publishAgent({
  name: 'my-agent',
  version: '1.0.0',
  author: 'Developer',
  description: 'My custom agent',
  capabilities: ['feature1', 'feature2'],
  license: 'MIT'
});

// Search for agents
const results = await client.searchAgents('test', {
  category: 'testing',
  sort: 'downloads'
});

// Install an agent
const install = await client.installAgent('agent-id');

// Submit a review
const review = await client.submitReview('agent-id', 5, 'Great agent!');
```

### Using cURL

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Search agents
curl "http://localhost:3000/api/v1/marketplace/search?q=test&category=testing"

# Get trending agents
curl "http://localhost:3000/api/v1/marketplace/trending?timeframe=7d&limit=10"

# Publish agent (requires API key)
curl -X POST http://localhost:3000/api/v1/marketplace/publish \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "my-agent",
    "version": "1.0.0",
    "author": "Developer",
    "description": "My custom agent",
    "capabilities": ["feature1"],
    "license": "MIT"
  }'

# Get agent details
curl http://localhost:3000/api/v1/marketplace/agent/my-agent@1.0.0

# Install agent (requires API key)
curl -X POST http://localhost:3000/api/v1/marketplace/install \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"agentId": "my-agent@1.0.0"}'

# Submit review (requires API key)
curl -X POST http://localhost:3000/api/v1/marketplace/review \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "agentId": "my-agent@1.0.0",
    "rating": 5,
    "comment": "Excellent agent!"
  }'
```

## Agent Package Format

```json
{
  "name": "agent-name",
  "version": "1.0.0",
  "author": "Developer Name",
  "description": "Brief description of the agent",
  "capabilities": ["capability1", "capability2"],
  "dependencies": ["other-agent@1.0.0"],
  "mcp_servers": ["context7", "github"],
  "test_coverage": 85.5,
  "performance_rating": 4.5,
  "license": "MIT",
  "source_url": "https://github.com/user/repo",
  "category": "development",
  "tags": ["testing", "automation"],
  "config_schema": {
    "type": "object",
    "properties": {
      "apiKey": { "type": "string" }
    }
  }
}
```

## Authentication

All authenticated endpoints require an API key:

```javascript
// Header method
headers: {
  'X-API-Key': 'your-api-key'
}

// Or Bearer token
headers: {
  'Authorization': 'Bearer your-api-key'
}
```

### Getting an API Key

API keys are generated by the admin. When the server starts, an admin API key is displayed in the console:

```
Admin API Key: mk_admin_xxxxxxxxxxxx
```

## Rate Limiting

Default rate limits:
- **100 requests per 15 minutes** per IP address
- **429 Too Many Requests** response when exceeded
- Response includes `retryAfter` field with seconds until reset

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": ["Additional error details"]
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing API key
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Search Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `category` | string | Filter by category |
| `tags` | string | Comma-separated tags |
| `sort` | string | Sort field (downloads, rating, publishedAt) |
| `order` | string | Sort order (asc, desc) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

## Categories

Available agent categories:
- `general` - General purpose agents
- `development` - Development and coding
- `testing` - Testing and QA
- `deployment` - Deployment and DevOps
- `security` - Security and auditing
- `database` - Database management
- `api` - API development
- `frontend` - Frontend development
- `backend` - Backend development
- `ml` - Machine learning

## Statistics and Analytics

### Agent Statistics
```javascript
{
  "totalDownloads": 1250,
  "totalReviews": 45,
  "averageRating": 4.5,
  "views": 3200,
  "downloadsLast7Days": 85,
  "downloadsLast30Days": 450,
  "ratingDistribution": {
    "1": 2,
    "2": 3,
    "3": 5,
    "4": 10,
    "5": 25
  }
}
```

### Platform Analytics (Admin Only)
```javascript
{
  "platform": {
    "totalAgents": 150,
    "totalDownloads": 45000,
    "totalReviews": 1200,
    "activeUsers": 350
  },
  "topAgents": [...],
  "categoryDistribution": {...},
  "recentActivity": [...]
}
```

## Security Features

### Input Validation
- Schema-based validation for all inputs
- SQL injection prevention
- XSS protection
- Maximum payload sizes

### Code Scanning
- Agent packages can be flagged for security review
- Malware detection hooks (extensible)
- Dependency vulnerability checks

### Access Control
- Role-based permissions (user, developer, admin)
- Resource ownership validation
- Admin-only endpoints

## Performance

- **Target Response Time**: < 100ms (p95)
- **Rate Limiting**: 100 req/15min per IP
- **Caching**: In-memory cache for frequent queries
- **Pagination**: Efficient large dataset handling

## Database Schema

The API uses the following data structures:
- **Agents**: Agent package metadata
- **Reviews**: User reviews and ratings
- **Downloads**: Download history
- **Analytics**: Event tracking
- **Users**: User accounts
- **API Keys**: Authentication tokens

See `database-models.js` for detailed schemas.

## Development

### Running Tests

```bash
npm test
```

### Running Examples

```bash
node src/marketplace/api-client-example.js
```

### Extending the API

To add new endpoints:

1. Add route in `setupRoutes()` method
2. Implement validation schema
3. Add authentication if needed
4. Update documentation

## Production Deployment

### Recommendations

1. **Database**: Replace in-memory storage with MongoDB/PostgreSQL
2. **Caching**: Add Redis for better performance
3. **Security**: Implement JWT with refresh tokens
4. **Monitoring**: Add Prometheus metrics
5. **Logging**: Use structured logging (Winston/Pino)
6. **Load Balancing**: Use Nginx or cloud load balancer
7. **HTTPS**: Enable SSL/TLS certificates
8. **Backups**: Regular database backups

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
LOG_LEVEL=info
```

## API Versioning

The API uses URL-based versioning:
- Current version: `v1`
- Base URL: `/api/v1/...`

Future versions will maintain backward compatibility.

## Support

For issues and questions:
- GitHub Issues: [project-url/issues]
- Documentation: [docs-url]
- Community: [community-url]

## License

MIT License - see LICENSE file for details

## Changelog

### v1.0.0 (2025-11-20)
- Initial release
- Agent package management
- Search and discovery
- Reviews and ratings
- Analytics system
- Authentication and security
- Rate limiting
- Comprehensive documentation
