# Claude Flow 2.0 - Real-Time Monitoring Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- Node.js 18+ installed
- Claude Flow 2.0 system
- Network access to ports 3003 and 8080

### One-Command Deployment
```bash
# Initialize Claude Flow with real-time monitoring
npx claude-flow@2.0.0 init --claude --webui --monitoring

# Start with monitoring enabled
npx claude-flow start --monitoring --dashboard
```

### Verify Deployment
```bash
# Check system health
curl http://localhost:3003/api/health

# Check monitoring WebSocket
curl http://localhost:3003/api/monitoring

# Access dashboards
open http://localhost:3003/monitoring
```

## 🏗️ Manual Deployment

### Step 1: Install Dependencies
```bash
# Core dependencies
npm install ws express node-fetch chart.js

# Optional dependencies for enhanced features
npm install compression helmet rate-limiter-flexible
```

### Step 2: Configure Environment
```bash
# Create environment configuration
cat > .env << EOF
NODE_ENV=production
WEBUI_PORT=3003
WEBUI_HOST=0.0.0.0
MONITORING_PORT=8080
ENABLE_MONITORING=true
ENABLE_HTTPS=false
ENABLE_CORS=true
EOF
```

### Step 3: Start Services
```bash
# Start Web UI Server
node src/platform/webui-server.js &

# Or use PM2 for production
pm2 start src/platform/webui-server.js --name "claude-flow-webui"
```

### Step 4: Verify Installation
```bash
# Run test suite
npm test -- test/real-time-monitoring-test.js

# Check service status
pm2 status
```

## 🐳 Docker Deployment

### Build Docker Image
```dockerfile
# Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY src/ ./src/
COPY docs/ ./docs/
COPY test/ ./test/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S claude -u 1001 -G nodejs

# Change ownership
RUN chown -R claude:nodejs /app
USER claude

# Expose ports
EXPOSE 3003 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/api/health || exit 1

# Start application
CMD ["node", "src/platform/webui-server.js"]
```

### Build and Run
```bash
# Build image
docker build -t claude-flow-monitoring:2.0.0 .

# Run container
docker run -d \
  --name claude-flow-monitoring \
  --restart unless-stopped \
  -p 3003:3003 \
  -p 8080:8080 \
  -e NODE_ENV=production \
  claude-flow-monitoring:2.0.0

# Check logs
docker logs -f claude-flow-monitoring
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  claude-flow-monitoring:
    build: .
    container_name: claude-flow-monitoring
    restart: unless-stopped
    ports:
      - "3003:3003"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - WEBUI_PORT=3003
      - MONITORING_PORT=8080
      - ENABLE_MONITORING=true
    volumes:
      - ./logs:/app/logs
    networks:
      - claude-flow-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Reverse proxy
  nginx:
    image: nginx:alpine
    container_name: claude-flow-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - claude-flow-monitoring
    networks:
      - claude-flow-network

networks:
  claude-flow-network:
    driver: bridge
```

### Start with Docker Compose
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f claude-flow-monitoring
```

## ☸️ Kubernetes Deployment

### Namespace
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: claude-flow
  labels:
    name: claude-flow
```

### ConfigMap
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: claude-flow-config
  namespace: claude-flow
data:
  NODE_ENV: "production"
  WEBUI_PORT: "3003"
  MONITORING_PORT: "8080"
  ENABLE_MONITORING: "true"
  ENABLE_CORS: "true"
```

### Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claude-flow-monitoring
  namespace: claude-flow
  labels:
    app: claude-flow-monitoring
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: claude-flow-monitoring
  template:
    metadata:
      labels:
        app: claude-flow-monitoring
    spec:
      containers:
      - name: monitoring
        image: claude-flow-monitoring:2.0.0
        ports:
        - containerPort: 3003
          name: http
        - containerPort: 8080
          name: websocket
        envFrom:
        - configMapRef:
            name: claude-flow-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3003
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3003
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          runAsGroup: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

### Service
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: claude-flow-monitoring-service
  namespace: claude-flow
  labels:
    app: claude-flow-monitoring
spec:
  type: ClusterIP
  ports:
  - port: 3003
    targetPort: 3003
    protocol: TCP
    name: http
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: websocket
  selector:
    app: claude-flow-monitoring
```

### Ingress
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: claude-flow-ingress
  namespace: claude-flow
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/websocket-services: claude-flow-monitoring-service
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  tls:
  - hosts:
    - claude-flow.yourdomain.com
    secretName: claude-flow-tls
  rules:
  - host: claude-flow.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: claude-flow-monitoring-service
            port:
              number: 3003
      - path: /ws
        pathType: Prefix
        backend:
          service:
            name: claude-flow-monitoring-service
            port:
              number: 8080
```

### Deploy to Kubernetes
```bash
# Apply all resources
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Check deployment status
kubectl get pods -n claude-flow
kubectl get services -n claude-flow
kubectl get ingress -n claude-flow

# Check logs
kubectl logs -f deployment/claude-flow-monitoring -n claude-flow
```

## 🌐 Production Configuration

### Nginx Reverse Proxy
```nginx
# nginx.conf
upstream claude_flow_backend {
    server localhost:3003;
    keepalive 32;
}

upstream claude_flow_websocket {
    server localhost:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name claude-flow.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name claude-flow.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Main application
    location / {
        proxy_pass http://claude_flow_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://claude_flow_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://claude_flow_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d claude-flow.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Environment Configuration
```bash
# Production environment variables
export NODE_ENV=production
export WEBUI_PORT=3003
export WEBUI_HOST=127.0.0.1
export MONITORING_PORT=8080
export ENABLE_HTTPS=false  # Let nginx handle SSL
export ENABLE_MONITORING=true
export ENABLE_COMPRESSION=true
export MAX_CONNECTIONS=1000
export RATE_LIMIT_REQUESTS=1000
export RATE_LIMIT_WINDOW=60000
```

## 📊 Monitoring and Observability

### Prometheus Integration
```javascript
// prometheus-metrics.js
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
    name: 'claude_flow_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status']
});

const websocketConnections = new prometheus.Gauge({
    name: 'claude_flow_websocket_connections',
    help: 'Number of active WebSocket connections'
});

const agentCount = new prometheus.Gauge({
    name: 'claude_flow_agents_total',
    help: 'Total number of agents',
    labelNames: ['status']
});

// Export metrics endpoint
app.get('/metrics', (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(prometheus.register.metrics());
});
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "Claude Flow 2.0 Monitoring",
    "tags": ["claude-flow", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Health",
        "type": "stat",
        "targets": [
          {
            "expr": "claude_flow_system_health",
            "legendFormat": "Health %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "min": 0,
            "max": 100,
            "unit": "percent"
          }
        }
      },
      {
        "id": 2,
        "title": "Active Agents",
        "type": "graph",
        "targets": [
          {
            "expr": "claude_flow_agents_total{status=\"active\"}",
            "legendFormat": "Active Agents"
          }
        ]
      },
      {
        "id": 3,
        "title": "WebSocket Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "claude_flow_websocket_connections",
            "legendFormat": "Connections"
          }
        ]
      }
    ]
  }
}
```

### Logging Configuration
```javascript
// logging.js
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'claude-flow-monitoring' },
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
```

## 🔒 Security Hardening

### Application Security
```javascript
// security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### WebSocket Security
```javascript
// websocket-security.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8080,
    verifyClient: (info) => {
        // Implement authentication logic
        const token = info.req.headers.authorization;
        return verifyToken(token);
    }
});

// Connection limits
const connectionLimiter = new Map();

wss.on('connection', (ws, req) => {
    const clientIP = req.connection.remoteAddress;
    
    // Limit connections per IP
    const connections = connectionLimiter.get(clientIP) || 0;
    if (connections >= 10) {
        ws.close(1008, 'Too many connections');
        return;
    }
    
    connectionLimiter.set(clientIP, connections + 1);
    
    ws.on('close', () => {
        const current = connectionLimiter.get(clientIP) || 0;
        connectionLimiter.set(clientIP, Math.max(0, current - 1));
    });
});
```

### Environment Security
```bash
# File permissions
chmod 600 .env
chmod 700 logs/
chmod 755 src/

# Firewall rules (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3003/tcp   # Block direct access
sudo ufw deny 8080/tcp   # Block direct WebSocket access
sudo ufw enable

# Process isolation
sudo systemctl edit --force --full claude-flow-monitoring.service
```

### Service Configuration
```ini
# /etc/systemd/system/claude-flow-monitoring.service
[Unit]
Description=Claude Flow 2.0 Monitoring System
After=network.target

[Service]
Type=simple
User=claude-flow
Group=claude-flow
WorkingDirectory=/opt/claude-flow
Environment=NODE_ENV=production
Environment=WEBUI_PORT=3003
Environment=MONITORING_PORT=8080
ExecStart=/usr/bin/node src/platform/webui-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=claude-flow-monitoring

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/claude-flow/logs
ProtectKernelTunables=true
ProtectControlGroups=true
ProtectKernelModules=true
RestrictSUIDSGID=true
RestrictRealtime=true
RestrictNamespaces=true
LockPersonality=true
MemoryDenyWriteExecute=true
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM

[Install]
WantedBy=multi-user.target
```

## 🚀 Performance Optimization

### Node.js Optimization
```javascript
// performance.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    // Worker process
    require('./src/platform/webui-server.js');
    console.log(`Worker ${process.pid} started`);
}
```

### Memory Management
```javascript
// memory-optimization.js
// Set memory limits
process.env.NODE_OPTIONS = '--max-old-space-size=1024';

// Memory monitoring
setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
        console.warn('High memory usage detected');
        // Trigger cleanup
        global.gc && global.gc();
    }
}, 30000);
```

### Database Optimization
```javascript
// cache-optimization.js
const NodeCache = require('node-cache');

// Create cache instances
const agentCache = new NodeCache({ 
    stdTTL: 60,        // 1 minute TTL
    checkperiod: 120   // Check every 2 minutes
});

const serverCache = new NodeCache({ 
    stdTTL: 300,       // 5 minute TTL
    checkperiod: 600   // Check every 10 minutes
});

// Cache middleware
const cacheMiddleware = (cache, keyGenerator) => {
    return (req, res, next) => {
        const key = keyGenerator(req);
        const cached = cache.get(key);
        
        if (cached) {
            return res.json(cached);
        }
        
        // Override res.json to cache response
        const originalJson = res.json;
        res.json = function(data) {
            cache.set(key, data);
            originalJson.call(this, data);
        };
        
        next();
    };
};
```

## 📈 Scaling Strategies

### Horizontal Scaling
```yaml
# horizontal-pod-autoscaler.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: claude-flow-monitoring-hpa
  namespace: claude-flow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: claude-flow-monitoring
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Balancing
```yaml
# load-balancer.yaml
apiVersion: v1
kind: Service
metadata:
  name: claude-flow-monitoring-lb
  namespace: claude-flow
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
spec:
  type: LoadBalancer
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  ports:
  - port: 80
    targetPort: 3003
    protocol: TCP
    name: http
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: websocket
  selector:
    app: claude-flow-monitoring
```

### CDN Configuration
```javascript
// cdn-integration.js
const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront();

// Static asset distribution
const distributionConfig = {
    CallerReference: Date.now().toString(),
    Comment: 'Claude Flow Monitoring Assets',
    DefaultCacheBehavior: {
        TargetOriginId: 'claude-flow-origin',
        ViewerProtocolPolicy: 'redirect-to-https',
        Compress: true,
        CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad' // Managed-CachingOptimized
    },
    Origins: {
        Quantity: 1,
        Items: [
            {
                Id: 'claude-flow-origin',
                DomainName: 'claude-flow.yourdomain.com',
                CustomOriginConfig: {
                    HTTPPort: 443,
                    HTTPSPort: 443,
                    OriginProtocolPolicy: 'https-only'
                }
            }
        ]
    },
    Enabled: true
};
```

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Firewall rules configured
- [ ] Database connections tested
- [ ] Backup strategy implemented
- [ ] Monitoring setup verified

### Deployment
- [ ] Application deployed successfully
- [ ] Health checks passing
- [ ] WebSocket connections working
- [ ] Dashboard accessible
- [ ] API endpoints responding
- [ ] Alerts functioning

### Post-Deployment
- [ ] Performance metrics baseline established
- [ ] Monitoring alerts configured
- [ ] Log aggregation working
- [ ] Backup verification completed
- [ ] Security scan passed
- [ ] Load testing completed

### Production Verification
- [ ] Real-time data streaming
- [ ] Agent status updates
- [ ] Server health monitoring
- [ ] Alert notifications
- [ ] Performance charts updating
- [ ] Resource utilization tracking

---

## 🆘 Troubleshooting

### Common Deployment Issues

#### Port Conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :3003
sudo netstat -tulpn | grep :8080

# Kill conflicting processes
sudo fuser -k 3003/tcp
sudo fuser -k 8080/tcp
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R claude-flow:claude-flow /opt/claude-flow
sudo chmod -R 755 /opt/claude-flow
sudo chmod 600 /opt/claude-flow/.env
```

#### Memory Issues
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### WebSocket Issues
```bash
# Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:8080

# Check nginx WebSocket configuration
nginx -t
sudo systemctl reload nginx
```

## 📞 Support

For deployment assistance:
- 📧 Email: support@claude-flow.com
- 💬 Discord: https://discord.gg/claude-flow
- 📖 Documentation: https://docs.claude-flow.com
- 🐛 Issues: https://github.com/claude-flow/issues

---

**Claude Flow 2.0 Real-Time Monitoring System** - Production-ready deployment for unlimited scale AI workflow monitoring.

*Generated by Claude Flow 2.0 Deployment Engineer*