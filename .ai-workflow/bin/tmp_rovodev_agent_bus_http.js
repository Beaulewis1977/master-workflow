#!/usr/bin/env node
/**
 * Agent Bus HTTP Server - SECURITY HARDENED
 * - Implements authentication and access controls
 * - Prevents unauthorized access (CWE-306)
 * - Adds rate limiting and request validation
 * - Implements security logging and monitoring
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const busFile = path.join(process.cwd(), '.ai-workflow', 'logs', 'agent-bus.jsonl');
const port = process.env.AGENT_BUS_PORT ? parseInt(process.env.AGENT_BUS_PORT, 10) : 8787;

// Security Configuration
const SECURITY_CONFIG = {
  // Authentication
  enableAuth: process.env.AGENT_BUS_DISABLE_AUTH !== 'true', // Auth enabled by default
  apiKey: process.env.AGENT_BUS_API_KEY || generateSecureApiKey(),
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  
  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // Max 100 requests per minute per IP
    maxAuthFailures: 5 // Max 5 auth failures per IP per window
  },
  
  // Security headers
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  },
  
  // Access control
  allowedOrigins: ['http://localhost:' + port, 'http://127.0.0.1:' + port],
  maxRequestSize: 10 * 1024 * 1024, // 10MB max request size
  
  // Logging
  enableSecurityLogging: true,
  logLevel: process.env.AGENT_BUS_LOG_LEVEL || 'INFO'
};

// Rate limiting storage
const rateLimits = new Map();
const authFailures = new Map();
const activeSessions = new Map();

/**
 * Generate a secure API key if none provided
 */
function generateSecureApiKey() {
  const apiKey = crypto.randomBytes(32).toString('hex');
  console.log(`Generated API Key: ${apiKey}`);
  console.log('Store this key securely and set AGENT_BUS_API_KEY environment variable');
  return apiKey;
}

/**
 * Security logging function
 */
function securityLog(level, message, context = {}) {
  if (!SECURITY_CONFIG.enableSecurityLogging) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    context,
    component: 'agent-bus-http'
  };
  
  console.log(`[SECURITY ${level}] ${message}`, context);
  
  if (level === 'CRITICAL' || level === 'HIGH') {
    console.error('SECURITY ALERT:', logEntry);
  }
}

/**
 * Get client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         'unknown';
}

/**
 * Check rate limits for IP address
 */
function checkRateLimit(ip, type = 'general') {
  const now = Date.now();
  const key = `${ip}:${type}`;
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, { count: 0, windowStart: now });
  }
  
  const record = rateLimits.get(key);
  
  // Reset window if expired
  if (now - record.windowStart > SECURITY_CONFIG.rateLimit.windowMs) {
    record.count = 0;
    record.windowStart = now;
  }
  
  record.count++;
  
  const maxRequests = type === 'auth' ? 
    SECURITY_CONFIG.rateLimit.maxAuthFailures : 
    SECURITY_CONFIG.rateLimit.maxRequests;
  
  if (record.count > maxRequests) {
    securityLog('HIGH', 'Rate limit exceeded', {
      ip: ip,
      type: type,
      count: record.count,
      maxRequests: maxRequests
    });
    return false;
  }
  
  return true;
}

/**
 * Authenticate request
 */
function authenticateRequest(req) {
  if (!SECURITY_CONFIG.enableAuth) {
    return { success: true, reason: 'Authentication disabled' };
  }
  
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  // Check for API key in header or authorization bearer
  let providedKey = null;
  if (apiKey) {
    providedKey = apiKey;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.substring(7);
  }
  
  if (!providedKey) {
    return { success: false, reason: 'Missing API key' };
  }
  
  // Constant-time comparison to prevent timing attacks
  const expectedKey = Buffer.from(SECURITY_CONFIG.apiKey);
  const providedKeyBuffer = Buffer.from(providedKey);
  
  if (expectedKey.length !== providedKeyBuffer.length) {
    return { success: false, reason: 'Invalid API key' };
  }
  
  const isValid = crypto.timingSafeEqual(expectedKey, providedKeyBuffer);
  
  if (!isValid) {
    return { success: false, reason: 'Invalid API key' };
  }
  
  return { success: true, reason: 'Valid API key' };
}

/**
 * Validate request for security issues
 */
function validateRequest(req, res) {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Check rate limits
  if (!checkRateLimit(ip)) {
    securityLog('HIGH', 'Request blocked - rate limit exceeded', {
      ip: ip,
      userAgent: userAgent,
      url: req.url
    });
    return { valid: false, statusCode: 429, message: 'Too Many Requests' };
  }
  
  // Validate request size
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > SECURITY_CONFIG.maxRequestSize) {
    securityLog('HIGH', 'Request blocked - size too large', {
      ip: ip,
      contentLength: contentLength,
      maxSize: SECURITY_CONFIG.maxRequestSize
    });
    return { valid: false, statusCode: 413, message: 'Request Too Large' };
  }
  
  // Validate URL path for traversal attempts
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname.includes('..') || parsedUrl.pathname.includes('\0')) {
    securityLog('HIGH', 'Request blocked - path traversal attempt', {
      ip: ip,
      path: parsedUrl.pathname,
      userAgent: userAgent
    });
    return { valid: false, statusCode: 400, message: 'Invalid Request Path' };
  }
  
  // Check for suspicious user agents
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /\.\.\/\.\.\//,
    /<script>/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent) || pattern.test(req.url)) {
      securityLog('HIGH', 'Request blocked - suspicious pattern detected', {
        ip: ip,
        userAgent: userAgent,
        url: req.url
      });
      return { valid: false, statusCode: 400, message: 'Suspicious Request Detected' };
    }
  }
  
  return { valid: true };
}

/**
 * Secure file reading with validation
 */
function readTail(n = 200) {
  try {
    // Validate the bus file path to prevent traversal
    const resolvedBusFile = path.resolve(busFile);
    const allowedDir = path.resolve(process.cwd(), '.ai-workflow', 'logs');
    
    if (!resolvedBusFile.startsWith(allowedDir)) {
      securityLog('HIGH', 'Attempted access to file outside allowed directory', {
        requestedPath: busFile,
        resolvedPath: resolvedBusFile,
        allowedDir: allowedDir
      });
      return [];
    }
    
    if (!fs.existsSync(resolvedBusFile)) return [];
    
    const stats = fs.statSync(resolvedBusFile);
    if (stats.size > 50 * 1024 * 1024) { // 50MB limit
      securityLog('WARN', 'Bus file too large, limiting read', {
        fileSize: stats.size,
        maxSize: 50 * 1024 * 1024
      });
      n = Math.min(n, 100); // Reduce tail size for large files
    }
    
    const lines = fs.readFileSync(resolvedBusFile, 'utf8').trim().split('\n');
    const tail = lines.slice(-n);
    
    return tail.map(l => {
      try {
        const parsed = JSON.parse(l);
        // Sanitize sensitive data from logs
        if (parsed.apiKey) delete parsed.apiKey;
        if (parsed.authorization) delete parsed.authorization;
        return parsed;
      } catch {
        return { raw: l.substring(0, 1000) }; // Limit raw line length
      }
    });
  } catch (error) {
    securityLog('HIGH', 'Error reading bus file', {
      error: error.message,
      busFile: busFile
    });
    return [];
  }
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(res) {
  for (const [header, value] of Object.entries(SECURITY_CONFIG.securityHeaders)) {
    res.setHeader(header, value);
  }
}

/**
 * Send secure error response
 */
function sendErrorResponse(res, statusCode, message, logContext = {}) {
  applySecurityHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: message, 
    timestamp: new Date().toISOString(),
    requestId: crypto.randomBytes(8).toString('hex')
  }));
  
  securityLog('WARN', `HTTP ${statusCode} response sent`, {
    statusCode,
    message,
    ...logContext
  });
}

const server = http.createServer((req, res) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const requestId = crypto.randomBytes(8).toString('hex');
  
  // Log all requests for security monitoring
  securityLog('INFO', 'HTTP request received', {
    requestId,
    ip,
    method: req.method,
    url: req.url,
    userAgent
  });

  // Validate request
  const validation = validateRequest(req, res);
  if (!validation.valid) {
    return sendErrorResponse(res, validation.statusCode, validation.message, {
      requestId,
      ip,
      userAgent
    });
  }

  // Apply security headers to all responses
  applySecurityHeaders(res);

  // Handle UI endpoint
  if (req.url === '/ui' || req.url.startsWith('/ui?')) {
    // Authenticate UI access
    const auth = authenticateRequest(req);
    if (!auth.success) {
      if (!checkRateLimit(ip, 'auth')) {
        return sendErrorResponse(res, 429, 'Too Many Authentication Attempts', {
          requestId, ip
        });
      }
      
      securityLog('HIGH', 'Unauthorized UI access attempt', {
        requestId,
        ip,
        userAgent,
        reason: auth.reason
      });
      
      res.setHeader('WWW-Authenticate', 'Bearer');
      return sendErrorResponse(res, 401, 'Authentication Required', {
        requestId, ip
      });
    }
    
    securityLog('INFO', 'Authenticated UI access', {
      requestId,
      ip,
      userAgent
    });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`<!doctype html><html><head><meta charset="utf-8"/><title>Agent Bus (Secure)</title>
<style>
  body{font-family:sans-serif;margin:20px;} 
  .header{background:#f0f0f0;padding:10px;margin-bottom:20px;border-radius:5px;}
  .ev{padding:4px;border-bottom:1px solid #eee} 
  .t{font-weight:bold} 
  .a{color:#06c} 
  .r{color:#690}
  .security-info{background:#ffe6e6;padding:10px;border-radius:5px;margin-bottom:20px;}
</style>
</head><body>
<div class="security-info">
  <strong>Security Notice:</strong> This is a secure Agent Bus interface. All access is authenticated and logged.
</div>
<div class="header">
<h1>Agent Bus Dashboard</h1>
<p>Request ID: ${requestId} | Connected from: ${ip}</p>
</div>
<label>Type <select id="type"><option value="">(all)</option><option>prompt</option><option>tool</option><option>response</option><option>approach_change</option></select></label>
<label>Agent <input id="agent" placeholder="(any)" maxlength="50"/></label>
<label>Role <input id="role" placeholder="(any)" maxlength="50"/></label>
<button id="apply">Apply Filter</button>
<pre id="log"></pre>
<script>
(function(){
  // Security: CSP-compliant inline script
  function connect() {
    const type = document.getElementById('type').value;
    const params = new URLSearchParams(); 
    if(type) params.set('type', type.substring(0,20)); // Limit parameter length
    const agent = document.getElementById('agent').value.trim(); 
    if(agent) params.set('agent', agent.substring(0,50));
    const role = document.getElementById('role').value.trim(); 
    if(role) params.set('role', role.substring(0,50));
    
    const es = new EventSource('/events/stream' + (params.toString()? ('?' + params.toString()):''));
    const log = document.getElementById('log');
    
    es.onmessage = function(e) {
      try {
        const ev = JSON.parse(e.data); 
        const t = ev.type || 'event';
        // Sanitize output to prevent XSS
        const line = '[' + (ev.ts || 'unknown') + '] ' + 
          t.toUpperCase() + 
          (ev.agent ? ' ' + ev.agent.substring(0,20) : '') + 
          (ev.role ? ' ' + ev.role.substring(0,20) : '') + ' ' + 
          (ev.prompt || ev.excerpt || ev.tool || '').substring(0,200);
        log.textContent += line + '\\n'; 
        log.scrollTop = log.scrollHeight;
      } catch(err) {
        console.error('Error parsing event:', err);
      }
    };
    es.onerror = function() { 
      es.close(); 
      setTimeout(connect, 2000); 
    };
  }
  
  document.getElementById('apply').onclick = function() { 
    const params = new URLSearchParams(); 
    const type = document.getElementById('type').value.substring(0,20); 
    if(type) params.set('type', type);
    const agent = document.getElementById('agent').value.trim().substring(0,50); 
    if(agent) params.set('agent', agent);
    const role = document.getElementById('role').value.trim().substring(0,50); 
    if(role) params.set('role', role);
    location.href = '/ui' + (params.toString() ? ('?' + params.toString()) : ''); 
  };
  
  document.getElementById('type').onchange = function() { 
    document.getElementById('apply').click(); 
  };
  
  const urlParams = new URLSearchParams(location.search);
  const typeParam = urlParams.get('type'); 
  if(typeParam) document.getElementById('type').value = typeParam.substring(0,20);
  
  connect();
})();
</script>
</body></html>`);
  }

  // Handle events stream endpoint
  if (req.url.startsWith('/events/stream')) {
    // Authenticate stream access
    const auth = authenticateRequest(req);
    if (!auth.success) {
      securityLog('HIGH', 'Unauthorized stream access attempt', {
        requestId, ip, userAgent, reason: auth.reason
      });
      res.setHeader('WWW-Authenticate', 'Bearer');
      return sendErrorResponse(res, 401, 'Authentication Required', { requestId, ip });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'null' // Restrict CORS
    });

    let lastSize = 0;
    let connectionOpen = true;
    
    const timer = setInterval(() => {
      if (!connectionOpen) {
        clearInterval(timer);
        return;
      }
      
      try {
        const resolvedBusFile = path.resolve(busFile);
        const allowedDir = path.resolve(process.cwd(), '.ai-workflow', 'logs');
        
        if (!resolvedBusFile.startsWith(allowedDir)) {
          securityLog('HIGH', 'Stream attempted to access file outside allowed directory', {
            requestId, ip, busFile
          });
          res.end();
          connectionOpen = false;
          return;
        }
        
        if (fs.existsSync(resolvedBusFile)) {
          const stat = fs.statSync(resolvedBusFile);
          if (stat.size > lastSize) {
            const data = fs.readFileSync(resolvedBusFile, 'utf8');
            const lines = data.trim().split('\n').slice(-50);
            
            // Parse URL parameters securely
            const parsedUrl = new URL(req.url, \`http://localhost:\${port}\`);
            const typeFilter = parsedUrl.searchParams.get('type')?.substring(0, 20);
            const agentFilter = parsedUrl.searchParams.get('agent')?.substring(0, 50);
            const roleFilter = parsedUrl.searchParams.get('role')?.substring(0, 50);
            
            const filtered = lines
              .map(l => { 
                try { 
                  const parsed = JSON.parse(l);
                  // Remove sensitive fields
                  delete parsed.apiKey;
                  delete parsed.authorization;
                  delete parsed.password;
                  return parsed;
                } catch { 
                  return null; 
                } 
              })
              .filter(ev => ev && (!typeFilter || ev.type === typeFilter))
              .filter(ev => ev && (!agentFilter || ev.agent === agentFilter))
              .filter(ev => ev && (!roleFilter || ev.role === roleFilter));
            
            for (const ev of filtered) {
              if (connectionOpen) {
                try {
                  res.write(\`data: \${JSON.stringify(ev)}\\n\\n\`);
                } catch (writeError) {
                  connectionOpen = false;
                  break;
                }
              }
            }
            lastSize = stat.size;
          }
        }
      } catch (e) {
        securityLog('WARN', 'Error in stream processing', {
          requestId, error: e.message
        });
      }
    }, 1000);
    
    req.on('close', () => {
      connectionOpen = false;
      clearInterval(timer);
      securityLog('INFO', 'Stream connection closed', { requestId, ip });
    });
    
    return;
  }

  // Handle events endpoint
  if (req.url === '/' || req.url.startsWith('/events')) {
    // Authenticate API access
    const auth = authenticateRequest(req);
    if (!auth.success) {
      securityLog('HIGH', 'Unauthorized API access attempt', {
        requestId, ip, userAgent, reason: auth.reason
      });
      res.setHeader('WWW-Authenticate', 'Bearer');
      return sendErrorResponse(res, 401, 'Authentication Required', { requestId, ip });
    }

    try {
      const events = readTail();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        events, 
        count: events.length, 
        ts: new Date().toISOString(),
        requestId: requestId,
        secure: true
      }, null, 2));
    } catch (error) {
      securityLog('HIGH', 'Error processing events request', {
        requestId, error: error.message
      });
      return sendErrorResponse(res, 500, 'Internal Server Error', { requestId });
    }
  }

  // Handle event publishing (POST)
  if (req.url === '/events/publish' && req.method === 'POST') {
    // Authenticate publish access
    const auth = authenticateRequest(req);
    if (!auth.success) {
      securityLog('HIGH', 'Unauthorized publish attempt', {
        requestId, ip, userAgent, reason: auth.reason
      });
      res.setHeader('WWW-Authenticate', 'Bearer');
      return sendErrorResponse(res, 401, 'Authentication Required', { requestId, ip });
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > SECURITY_CONFIG.maxRequestSize) {
        securityLog('HIGH', 'Publish request body too large', {
          requestId, ip, bodySize: body.length
        });
        return sendErrorResponse(res, 413, 'Request Too Large', { requestId });
      }
    });

    req.on('end', () => {
      try {
        const eventData = JSON.parse(body);
        
        // Validate and sanitize event data
        const sanitizedEvent = {
          type: eventData.type?.toString().substring(0, 50) || 'unknown',
          payload: eventData.payload || {},
          timestamp: new Date().toISOString(),
          source: 'agent-bus',
          requestId: requestId
        };

        // Remove sensitive fields from payload
        if (sanitizedEvent.payload.apiKey) delete sanitizedEvent.payload.apiKey;
        if (sanitizedEvent.payload.authorization) delete sanitizedEvent.payload.authorization;
        if (sanitizedEvent.payload.password) delete sanitizedEvent.payload.password;

        securityLog('INFO', 'Event published', {
          requestId, ip, eventType: sanitizedEvent.type
        });

        res.writeHead(204);
        res.end();
      } catch (error) {
        securityLog('HIGH', 'Invalid event publish request', {
          requestId, ip, error: error.message
        });
        return sendErrorResponse(res, 400, 'Invalid JSON', { requestId });
      }
    });

    return;
  }

  // Default 404 for unknown endpoints
  securityLog('WARN', 'Request to unknown endpoint', {
    requestId, ip, url: req.url, method: req.method
  });
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    requestId: requestId,
    timestamp: new Date().toISOString()
  }));
});

// Error handling for the server
server.on('error', (error) => {
  securityLog('CRITICAL', 'Server error occurred', {
    error: error.message,
    code: error.code,
    port: port
  });
  
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please set a different AGENT_BUS_PORT.`);
    process.exit(1);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  securityLog('INFO', 'Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Agent Bus HTTP server shut down');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  securityLog('INFO', 'Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Agent Bus HTTP server shut down');
    process.exit(0);
  });
});

// Start the server with security logging
server.listen(port, '127.0.0.1', () => {
  console.log(`\n🔒 SECURE Agent Bus HTTP Server Started`);
  console.log(`📍 URL: http://localhost:${port}`);
  console.log(`🔐 Authentication: ${SECURITY_CONFIG.enableAuth ? 'ENABLED' : 'DISABLED'}`);
  
  if (SECURITY_CONFIG.enableAuth) {
    console.log(`🗝️  API Key: ${SECURITY_CONFIG.apiKey.substring(0, 8)}...`);
    console.log(`📝 Usage: Add header 'X-API-Key: ${SECURITY_CONFIG.apiKey}' or 'Authorization: Bearer ${SECURITY_CONFIG.apiKey}'`);
  }
  
  console.log(`🛡️  Security Features:`);
  console.log(`   ✅ Rate limiting (${SECURITY_CONFIG.rateLimit.maxRequests}/min)`);
  console.log(`   ✅ Request validation`);
  console.log(`   ✅ Path traversal prevention`);
  console.log(`   ✅ Security headers`);
  console.log(`   ✅ Input sanitization`);
  console.log(`   ✅ Security logging`);
  
  securityLog('INFO', 'Agent Bus HTTP server started securely', {
    port: port,
    authEnabled: SECURITY_CONFIG.enableAuth,
    securityFeatures: [
      'authentication',
      'rate_limiting', 
      'input_validation',
      'path_traversal_prevention',
      'security_headers',
      'request_logging'
    ]
  });
});

// Periodic cleanup of rate limit storage
setInterval(() => {
  const now = Date.now();
  let cleanupCount = 0;
  
  // Clean up expired rate limit entries
  for (const [key, record] of rateLimits) {
    if (now - record.windowStart > SECURITY_CONFIG.rateLimit.windowMs * 2) {
      rateLimits.delete(key);
      cleanupCount++;
    }
  }
  
  // Clean up expired auth failure entries
  for (const [key, record] of authFailures) {
    if (now - record.windowStart > SECURITY_CONFIG.rateLimit.windowMs * 2) {
      authFailures.delete(key);
    }
  }
  
  if (cleanupCount > 0) {
    securityLog('INFO', 'Rate limit storage cleanup completed', {
      entriesRemoved: cleanupCount,
      remainingEntries: rateLimits.size
    });
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes
