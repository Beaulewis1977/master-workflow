# Master Workflow 3.0 - Production Dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build stage
FROM node:18-alpine AS builder

LABEL maintainer="Master Workflow Team"
LABEL version="3.0.0"
LABEL description="Master Workflow 3.0 - Distributed Agent Orchestration System"

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY . .

# Remove development files
RUN rm -rf \
    .git \
    .github \
    tests \
    docs \
    *.md \
    .env.example

# Stage 2: Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1000 workflow && \
    adduser -D -u 1000 -G workflow workflow

# Set working directory
WORKDIR /app

# Copy from builder
COPY --from=builder --chown=workflow:workflow /app /app

# Create necessary directories
RUN mkdir -p \
    /app/logs \
    /app/temp \
    /app/.ai-workflow/intelligence-engine \
    /app/.claude/agents \
    && chown -R workflow:workflow /app

# Switch to non-root user
USER workflow

# Environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=8192" \
    PORT=3000 \
    WEBSOCKET_PORT=8080 \
    METRICS_PORT=9090

# Expose ports
EXPOSE 3000 8080 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9090/health', (r) => { \
        let data = ''; \
        r.on('data', (chunk) => data += chunk); \
        r.on('end', () => process.exit(JSON.parse(data).healthy ? 0 : 1)); \
    }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start application
CMD ["node", "intelligence-engine/queen-controller.js"]
