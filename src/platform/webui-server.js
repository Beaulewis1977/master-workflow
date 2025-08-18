/**
 * Cross-Platform Web UI Server for Claude Flow 2.0
 * Universal web dashboard that works across Windows, macOS, and Linux
 * Supports all major browsers with responsive design
 */

const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const PlatformDetector = require('./platform-detector');
const pathHandler = require('./path-handler').default;
const MonitoringWebSocketServer = require('../webui/monitoring-websocket-server');

/**
 * Cross-Platform Web UI Server
 */
class WebUIServer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      port: options.port || 3003,
      host: options.host || 'localhost',
      enableHttps: options.enableHttps || false,
      enableWebSockets: options.enableWebSockets !== false,
      enableCORS: options.enableCORS !== false,
      staticPath: options.staticPath || path.join(__dirname, '../webui'),
      apiPrefix: options.apiPrefix || '/api',
      wsPath: options.wsPath || '/ws',
      maxConnections: options.maxConnections || 1000,
      requestTimeout: options.requestTimeout || 30000,
      enableMonitoring: options.enableMonitoring !== false,
      monitoringPort: options.monitoringPort || 8080,
      ...options
    };

    this.platformDetector = new PlatformDetector();
    this.platform = null;
    this.server = null;
    this.wsServer = null;
    this.monitoringServer = null;
    this.connections = new Map();
    this.apiRoutes = new Map();
    this.staticRoutes = new Map();
    this.isRunning = false;
    this.requestCount = 0;
    this.startTime = null;
  }

  /**
   * Initialize and start the Web UI server
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Web UI Server is already running');
      return;
    }

    console.log('🌐 Starting Cross-Platform Web UI Server...');
    
    // Initialize platform detection
    this.platform = await this.platformDetector.initialize();
    
    // Setup server
    await this.setupServer();
    await this.setupRoutes();
    await this.setupWebSockets();
    await this.setupStaticFiles();
    await this.setupMonitoringServer();
    
    // Start listening
    await this.startListening();
    
    this.isRunning = true;
    this.startTime = new Date();
    
    const protocol = this.options.enableHttps ? 'https' : 'http';
    console.log(`✅ Web UI Server running on ${protocol}://${this.options.host}:${this.options.port}`);
    console.log(`🎨 Dashboard: ${protocol}://${this.options.host}:${this.options.port}/dashboard`);
    console.log(`📊 Real-Time Monitoring: ${protocol}://${this.options.host}:${this.options.port}/monitoring`);
    console.log(`📊 Metrics: ${protocol}://${this.options.host}:${this.options.port}/metrics`);
    
    this.emit('started', {
      protocol,
      host: this.options.host,
      port: this.options.port,
      platform: this.platformDetector.getPlatformDisplay()
    });
  }

  /**
   * Stop the Web UI server
   */
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Web UI Server is not running');
      return;
    }

    console.log('🛑 Stopping Web UI Server...');
    
    // Close monitoring server
    if (this.monitoringServer) {
      await this.monitoringServer.stop();
    }
    
    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    // Close all connections
    this.connections.forEach(connection => {
      try {
        connection.destroy();
      } catch (error) {
        console.warn('Error closing connection:', error.message);
      }
    });
    
    // Close HTTP server
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('✅ Web UI Server stopped');
          this.isRunning = false;
          this.emit('stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Add API route
   */
  addRoute(method, path, handler) {
    const key = `${method.toUpperCase()}:${path}`;
    this.apiRoutes.set(key, handler);
    console.log(`📍 Added route: ${method.toUpperCase()} ${path}`);
  }

  /**
   * Broadcast message to all WebSocket connections
   */
  broadcast(message) {
    if (!this.wsServer) return;

    const data = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...message
    });

    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (error) {
          console.warn('WebSocket broadcast error:', error.message);
        }
      }
    });
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      requestCount: this.requestCount,
      activeConnections: this.connections.size,
      wsConnections: this.wsServer ? this.wsServer.clients.size : 0,
      platform: this.platformDetector.getPlatformDisplay(),
      url: `${this.options.enableHttps ? 'https' : 'http'}://${this.options.host}:${this.options.port}`
    };
  }

  // Private methods

  /**
   * Setup HTTP/HTTPS server
   * @private
   */
  async setupServer() {
    if (this.options.enableHttps) {
      // Setup HTTPS with self-signed certificate for development
      const cert = await this.generateSelfSignedCert();
      this.server = https.createServer(cert, this.handleRequest.bind(this));
    } else {
      this.server = http.createServer(this.handleRequest.bind(this));
    }

    // Track connections
    this.server.on('connection', (connection) => {
      const connId = Date.now() + Math.random();
      this.connections.set(connId, connection);
      
      connection.on('close', () => {
        this.connections.delete(connId);
      });
    });

    // Set server timeout
    this.server.timeout = this.options.requestTimeout;
    this.server.keepAliveTimeout = 5000;
    this.server.headersTimeout = 10000;
  }

  /**
   * Setup API routes
   * @private
   */
  async setupRoutes() {
    // System status endpoint
    this.addRoute('GET', '/api/status', (req, res) => {
      this.sendJSON(res, this.getStatus());
    });

    // Platform information endpoint
    this.addRoute('GET', '/api/platform', (req, res) => {
      this.sendJSON(res, {
        platform: this.platformDetector.getPlatformDisplay(),
        arch: process.arch,
        nodeVersion: process.version,
        platformDetails: this.platform.platformDetails
      });
    });

    // Health check endpoint
    this.addRoute('GET', '/api/health', (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    });

    // Metrics endpoint
    this.addRoute('GET', '/api/metrics', (req, res) => {
      this.sendJSON(res, this.getMetrics());
    });

    // WebSocket info endpoint
    this.addRoute('GET', '/api/websocket', (req, res) => {
      this.sendJSON(res, {
        enabled: this.options.enableWebSockets,
        url: `ws${this.options.enableHttps ? 's' : ''}://${this.options.host}:${this.options.port}${this.options.wsPath}`,
        clients: this.wsServer ? this.wsServer.clients.size : 0
      });
    });

    // Monitoring WebSocket info endpoint
    this.addRoute('GET', '/api/monitoring', (req, res) => {
      this.sendJSON(res, {
        enabled: this.options.enableMonitoring,
        url: `ws${this.options.enableHttps ? 's' : ''}://${this.options.host}:${this.options.monitoringPort}`,
        clients: this.monitoringServer ? this.monitoringServer.clients.size : 0,
        status: this.monitoringServer ? this.monitoringServer.getSystemStatus() : null
      });
    });

    // Agent status endpoint
    this.addRoute('GET', '/api/agents', (req, res) => {
      if (this.monitoringServer) {
        const agents = Array.from(this.monitoringServer.agentStatuses.values());
        this.sendJSON(res, agents);
      } else {
        this.sendJSON(res, []);
      }
    });

    // Server status endpoint
    this.addRoute('GET', '/api/servers', (req, res) => {
      if (this.monitoringServer) {
        const servers = Array.from(this.monitoringServer.serverStatuses.values());
        this.sendJSON(res, servers);
      } else {
        this.sendJSON(res, []);
      }
    });

    // Alerts endpoint
    this.addRoute('GET', '/api/alerts', (req, res) => {
      if (this.monitoringServer) {
        this.sendJSON(res, this.monitoringServer.alerts.slice(0, 50));
      } else {
        this.sendJSON(res, []);
      }
    });
  }

  /**
   * Setup WebSocket server
   * @private
   */
  async setupWebSockets() {
    if (!this.options.enableWebSockets) return;

    this.wsServer = new WebSocket.Server({
      server: this.server,
      path: this.options.wsPath,
      maxPayload: 1024 * 1024 // 1MB
    });

    this.wsServer.on('connection', (ws, req) => {
      const clientInfo = {
        ip: req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        connectedAt: new Date().toISOString()
      };

      console.log(`🔌 WebSocket client connected: ${clientInfo.ip}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to Claude Flow Web UI',
        platform: this.platformDetector.getPlatformDisplay(),
        timestamp: new Date().toISOString()
      }));

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.warn('Invalid WebSocket message:', error.message);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid JSON message',
            timestamp: new Date().toISOString()
          }));
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected: ${clientInfo.ip}`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.warn('WebSocket error:', error.message);
      });

      // Store client info
      ws.clientInfo = clientInfo;
    });

    console.log(`🔌 WebSocket server enabled on ${this.options.wsPath}`);
  }

  /**
   * Setup static file serving
   * @private
   */
  async setupStaticFiles() {
    // Create static directory if it doesn't exist
    await this.ensureStaticDirectory();
    
    // Generate default dashboard if not exists
    await this.generateDefaultDashboard();
  }

  /**
   * Setup monitoring WebSocket server
   * @private
   */
  async setupMonitoringServer() {
    if (!this.options.enableMonitoring) {
      console.log('📊 Monitoring server disabled');
      return;
    }

    try {
      this.monitoringServer = new MonitoringWebSocketServer({
        port: this.options.monitoringPort,
        host: this.options.host
      });

      await this.monitoringServer.start();
      
      console.log(`📊 Real-time monitoring WebSocket server started on ws://${this.options.host}:${this.options.monitoringPort}`);
      
    } catch (error) {
      console.warn('⚠️ Failed to start monitoring server:', error.message);
      console.log('📊 Monitoring will use fallback mode');
    }
  }

  /**
   * Main request handler
   * @private
   */
  async handleRequest(req, res) {
    this.requestCount++;
    
    try {
      // Enable CORS if configured
      if (this.options.enableCORS) {
        this.setCORSHeaders(res);
      }

      // Handle OPTIONS preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      // API routes
      if (pathname.startsWith(this.options.apiPrefix)) {
        await this.handleAPIRequest(req, res, pathname);
        return;
      }

      // Static files
      await this.handleStaticRequest(req, res, pathname);
      
    } catch (error) {
      console.error('Request handling error:', error);
      this.sendError(res, 500, 'Internal Server Error');
    }
  }

  /**
   * Handle API requests
   * @private
   */
  async handleAPIRequest(req, res, pathname) {
    const method = req.method.toUpperCase();
    const key = `${method}:${pathname}`;
    const handler = this.apiRoutes.get(key);

    if (handler) {
      try {
        await handler(req, res);
      } catch (error) {
        console.error(`API error for ${key}:`, error);
        this.sendError(res, 500, 'API Error');
      }
    } else {
      this.sendError(res, 404, 'API endpoint not found');
    }
  }

  /**
   * Handle static file requests
   * @private
   */
  async handleStaticRequest(req, res, pathname) {
    // Default to dashboard for root path
    if (pathname === '/' || pathname === '') {
      pathname = '/dashboard.html';
    }
    
    // Handle monitoring route
    if (pathname === '/monitoring' || pathname === '/monitoring.html') {
      pathname = '/real-time-monitoring-dashboard.html';
    }

    // Security check - prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = pathHandler.join(this.options.staticPath, safePath);

    try {
      const stats = await fs.stat(fullPath);
      
      if (stats.isFile()) {
        const contentType = this.getContentType(fullPath);
        const content = await fs.readFile(fullPath);
        
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': content.length,
          'Cache-Control': 'public, max-age=3600'
        });
        res.end(content);
      } else {
        this.sendError(res, 404, 'File not found');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.sendError(res, 404, 'File not found');
      } else {
        console.error('Static file error:', error);
        this.sendError(res, 500, 'File access error');
      }
    }
  }

  /**
   * Handle WebSocket messages
   * @private
   */
  handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;

      case 'subscribe':
        // Handle subscription to real-time updates
        ws.subscriptions = message.channels || ['system'];
        ws.send(JSON.stringify({
          type: 'subscribed',
          channels: ws.subscriptions,
          timestamp: new Date().toISOString()
        }));
        break;

      case 'getStatus':
        ws.send(JSON.stringify({
          type: 'status',
          data: this.getStatus(),
          timestamp: new Date().toISOString()
        }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${message.type}`,
          timestamp: new Date().toISOString()
        }));
    }
  }

  /**
   * Start listening on configured port
   * @private
   */
  async startListening() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.options.port, this.options.host, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Generate self-signed certificate for HTTPS
   * @private
   */
  async generateSelfSignedCert() {
    // For production, use proper certificates
    // This is a simplified version for development
    const selfsigned = require('selfsigned');
    const attrs = [{ name: 'commonName', value: this.options.host }];
    const pems = selfsigned.generate(attrs, { days: 365 });
    
    return {
      key: pems.private,
      cert: pems.cert
    };
  }

  /**
   * Ensure static directory exists
   * @private
   */
  async ensureStaticDirectory() {
    try {
      await fs.access(this.options.staticPath);
    } catch (error) {
      console.log(`📁 Creating static directory: ${this.options.staticPath}`);
      await fs.mkdir(this.options.staticPath, { recursive: true });
    }
  }

  /**
   * Generate default dashboard HTML
   * @private
   */
  async generateDefaultDashboard() {
    const dashboardPath = pathHandler.join(this.options.staticPath, 'dashboard.html');
    
    try {
      await fs.access(dashboardPath);
      return; // Dashboard already exists
    } catch (error) {
      // Generate default dashboard
    }

    const dashboardHTML = this.createDefaultDashboard();
    await fs.writeFile(dashboardPath, dashboardHTML);
    console.log('📊 Generated default dashboard');
  }

  /**
   * Create default dashboard HTML
   * @private
   */
  createDefaultDashboard() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Flow 2.0 - Cross-Platform Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 1rem 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .header h1 {
            color: white;
            font-size: 1.8rem;
            font-weight: 300;
        }
        
        .platform-info {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
        
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h2 {
            color: #333;
            margin-bottom: 1rem;
            font-size: 1.4rem;
            font-weight: 600;
        }
        
        .status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #4CAF50;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            color: #666;
            font-weight: 500;
        }
        
        .metric-value {
            color: #333;
            font-weight: 600;
        }
        
        .websocket-status {
            background: #e8f5e8;
            color: #2e7d2e;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .disconnected {
            background: #ffe8e8;
            color: #d32f2f;
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 0 1rem;
            }
            
            .header {
                padding: 1rem;
            }
            
            .card {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 Claude Flow 2.0 - Cross-Platform Dashboard</h1>
        <div class="platform-info" id="platformInfo">Loading platform information...</div>
    </div>
    
    <div class="container">
        <div class="grid">
            <div class="card">
                <h2>📊 System Status</h2>
                <div class="status">
                    <div class="status-dot" id="statusDot"></div>
                    <span id="systemStatus">Checking...</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value" id="uptime">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Requests</span>
                    <span class="metric-value" id="requestCount">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Connections</span>
                    <span class="metric-value" id="activeConnections">--</span>
                </div>
            </div>
            
            <div class="card">
                <h2>🤖 Agent System</h2>
                <div class="metric">
                    <span class="metric-label">Active Agents</span>
                    <span class="metric-value" id="activeAgents">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Max Agents</span>
                    <span class="metric-value">4,462</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Tasks Completed</span>
                    <span class="metric-value" id="tasksCompleted">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Queen Controller</span>
                    <span class="metric-value">Active</span>
                </div>
            </div>
            
            <div class="card">
                <h2>🔌 Real-time Connection</h2>
                <div class="websocket-status" id="wsStatus">Connecting...</div>
                <div class="metric">
                    <span class="metric-label">WebSocket Clients</span>
                    <span class="metric-value" id="wsClients">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Update</span>
                    <span class="metric-value" id="lastUpdate">--</span>
                </div>
            </div>
            
            <div class="card">
                <h2>🌍 Platform Info</h2>
                <div class="metric">
                    <span class="metric-label">Operating System</span>
                    <span class="metric-value" id="platform">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Architecture</span>
                    <span class="metric-value" id="arch">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Node.js Version</span>
                    <span class="metric-value" id="nodeVersion">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Cross-Platform</span>
                    <span class="metric-value">✅ Compatible</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        Claude Flow 2.0 - Universal Cross-Platform Compatibility<br>
        Works on Windows, macOS, and Linux with native performance
    </div>
    
    <script>
        class DashboardManager {
            constructor() {
                this.ws = null;
                this.reconnectAttempts = 0;
                this.maxReconnectAttempts = 5;
                this.init();
            }
            
            async init() {
                await this.loadPlatformInfo();
                await this.loadSystemStatus();
                this.connectWebSocket();
                this.startPeriodicUpdates();
            }
            
            async loadPlatformInfo() {
                try {
                    const response = await fetch('/api/platform');
                    const data = await response.json();
                    
                    document.getElementById('platformInfo').textContent = 
                        \`Running on \${data.platform} (\${data.arch}) with Node.js \${data.nodeVersion}\`;
                    document.getElementById('platform').textContent = data.platform;
                    document.getElementById('arch').textContent = data.arch;
                    document.getElementById('nodeVersion').textContent = data.nodeVersion;
                } catch (error) {
                    console.error('Failed to load platform info:', error);
                }
            }
            
            async loadSystemStatus() {
                try {
                    const response = await fetch('/api/status');
                    const data = await response.json();
                    
                    this.updateSystemStatus(data);
                } catch (error) {
                    console.error('Failed to load system status:', error);
                }
            }
            
            updateSystemStatus(data) {
                document.getElementById('systemStatus').textContent = data.isRunning ? 'Running' : 'Stopped';
                document.getElementById('uptime').textContent = this.formatDuration(data.uptime);
                document.getElementById('requestCount').textContent = data.requestCount.toLocaleString();
                document.getElementById('activeConnections').textContent = data.activeConnections;
                document.getElementById('wsClients').textContent = data.wsConnections || 0;
                
                // Update status dot color
                const statusDot = document.getElementById('statusDot');
                statusDot.style.background = data.isRunning ? '#4CAF50' : '#f44336';
            }
            
            connectWebSocket() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
                
                this.ws = new WebSocket(wsUrl);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.updateWebSocketStatus(true);
                    
                    // Subscribe to system updates
                    this.ws.send(JSON.stringify({
                        type: 'subscribe',
                        channels: ['system', 'agents', 'metrics']
                    }));
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleWebSocketMessage(message);
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                };
                
                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.updateWebSocketStatus(false);
                    this.handleReconnect();
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };
            }
            
            handleWebSocketMessage(message) {
                switch (message.type) {
                    case 'status':
                        this.updateSystemStatus(message.data);
                        break;
                    case 'metrics':
                        this.updateMetrics(message.data);
                        break;
                }
                
                document.getElementById('lastUpdate').textContent = 
                    new Date().toLocaleTimeString();
            }
            
            updateWebSocketStatus(connected) {
                const wsStatus = document.getElementById('wsStatus');
                if (connected) {
                    wsStatus.textContent = '🟢 Connected';
                    wsStatus.className = 'websocket-status';
                } else {
                    wsStatus.textContent = '🔴 Disconnected';
                    wsStatus.className = 'websocket-status disconnected';
                }
            }
            
            handleReconnect() {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(\`Reconnecting in 5 seconds... (attempt \${this.reconnectAttempts})\`);
                    setTimeout(() => {
                        this.connectWebSocket();
                    }, 5000);
                }
            }
            
            startPeriodicUpdates() {
                setInterval(async () => {
                    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                        await this.loadSystemStatus();
                    } else {
                        // Request status update via WebSocket
                        this.ws.send(JSON.stringify({ type: 'getStatus' }));
                    }
                }, 5000);
            }
            
            formatDuration(ms) {
                if (!ms) return '--';
                
                const seconds = Math.floor(ms / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                
                if (days > 0) return \`\${days}d \${hours % 24}h\`;
                if (hours > 0) return \`\${hours}h \${minutes % 60}m\`;
                if (minutes > 0) return \`\${minutes}m \${seconds % 60}s\`;
                return \`\${seconds}s\`;
            }
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            new DashboardManager();
        });
    </script>
</body>
</html>
    `;
  }

  /**
   * Get content type for file
   * @private
   */
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    
    return types[ext] || 'application/octet-stream';
  }

  /**
   * Set CORS headers
   * @private
   */
  setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }

  /**
   * Send JSON response
   * @private
   */
  sendJSON(res, data) {
    const json = JSON.stringify(data, null, 2);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(json)
    });
    res.end(json);
  }

  /**
   * Send error response
   * @private
   */
  sendError(res, statusCode, message) {
    const errorData = JSON.stringify({
      error: message,
      timestamp: new Date().toISOString()
    });
    
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(errorData)
    });
    res.end(errorData);
  }

  /**
   * Get system metrics
   * @private
   */
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: new Date().toISOString(),
      server: this.getStatus(),
      system: {
        platform: this.platformDetector.getPlatformDisplay(),
        arch: process.arch,
        nodeVersion: process.version,
        cpus: os.cpus().length,
        memory: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external
        },
        loadAverage: os.loadavg()
      }
    };
  }
}

module.exports = WebUIServer;