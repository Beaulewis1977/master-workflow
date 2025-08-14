/**
 * Security Logger Module - COMPREHENSIVE SECURITY LOGGING
 * 
 * This module provides comprehensive security logging and error handling
 * with features including:
 * - Structured security event logging
 * - Threat detection and alerting  
 * - Performance monitoring
 * - Error sanitization and safe reporting
 * - SIEM integration support
 * - Compliance logging (GDPR, SOX, etc.)
 * 
 * @author Claude Security Auditor
 * @version 1.0.0
 * @date August 2025
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class SecurityLogger extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.logDir = options.logDir || path.join(process.cwd(), '.ai-workflow', 'logs', 'security');
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB
    this.maxLogFiles = options.maxLogFiles || 10;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.enableSIEM = options.enableSIEM || false;
    this.siemEndpoint = options.siemEndpoint;
    this.environment = options.environment || 'development';
    
    // Security event categories
    this.categories = {
      AUTHENTICATION: 'authentication',
      AUTHORIZATION: 'authorization', 
      INPUT_VALIDATION: 'input_validation',
      COMMAND_INJECTION: 'command_injection',
      PATH_TRAVERSAL: 'path_traversal',
      SQL_INJECTION: 'sql_injection',
      XSS: 'xss',
      RATE_LIMITING: 'rate_limiting',
      FILE_ACCESS: 'file_access',
      NETWORK_ACCESS: 'network_access',
      CONFIGURATION: 'configuration',
      SYSTEM_ERROR: 'system_error',
      PERFORMANCE: 'performance',
      COMPLIANCE: 'compliance'
    };
    
    // Severity levels
    this.severity = {
      CRITICAL: { level: 0, color: '\x1b[35m', name: 'CRITICAL' },
      HIGH: { level: 1, color: '\x1b[31m', name: 'HIGH' },
      MEDIUM: { level: 2, color: '\x1b[33m', name: 'MEDIUM' },
      LOW: { level: 3, color: '\x1b[36m', name: 'LOW' },
      INFO: { level: 4, color: '\x1b[37m', name: 'INFO' },
      DEBUG: { level: 5, color: '\x1b[90m', name: 'DEBUG' }
    };
    
    this.minSeverity = options.minSeverity || 'LOW';
    this.minSeverityLevel = this.severity[this.minSeverity]?.level || 3;
    
    // Metrics tracking
    this.metrics = {
      totalEvents: 0,
      eventsByCategory: {},
      eventsBySeverity: {},
      lastLogRotation: Date.now(),
      errors: 0
    };
    
    // Rate limiting for log spam prevention
    this.recentEvents = new Map();
    this.duplicateThreshold = 5; // Max 5 identical events per minute
    
    this.init();
  }
  
  async init() {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDir, { recursive: true, mode: 0o750 });
      
      // Start log rotation timer
      setInterval(() => this.rotateLogsIfNeeded(), 60 * 1000); // Check every minute
      
      // Clean up old events from memory periodically
      setInterval(() => this.cleanupRecentEvents(), 5 * 60 * 1000); // Every 5 minutes
      
      this.log('INFO', this.categories.SYSTEM_ERROR, 'Security logger initialized', {
        logDir: this.logDir,
        enableConsole: this.enableConsole,
        enableFile: this.enableFile,
        environment: this.environment
      });
      
    } catch (error) {
      console.error('Failed to initialize security logger:', error);
    }
  }
  
  /**
   * Main logging method with comprehensive security features
   */
  async log(severity, category, message, context = {}, options = {}) {
    try {
      // Validate inputs
      if (!this.severity[severity]) {
        severity = 'INFO';
      }
      
      if (this.severity[severity].level > this.minSeverityLevel) {
        return; // Below minimum severity
      }
      
      // Create log entry
      const logEntry = this.createLogEntry(severity, category, message, context, options);
      
      // Check for duplicate events (spam prevention)
      if (this.isDuplicateEvent(logEntry)) {
        return;
      }
      
      // Update metrics
      this.updateMetrics(severity, category);
      
      // Log to console if enabled
      if (this.enableConsole) {
        this.logToConsole(logEntry);
      }
      
      // Log to file if enabled
      if (this.enableFile) {
        await this.logToFile(logEntry);
      }
      
      // Send to SIEM if enabled
      if (this.enableSIEM && this.siemEndpoint) {
        await this.logToSIEM(logEntry);
      }
      
      // Emit event for external listeners
      this.emit('securityEvent', logEntry);
      
      // Trigger alerts for critical events
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        this.triggerAlert(logEntry);
      }
      
    } catch (error) {
      this.metrics.errors++;
      console.error('Security logging error:', error);
    }
  }
  
  /**
   * Create structured log entry
   */
  createLogEntry(severity, category, message, context, options) {
    const timestamp = new Date().toISOString();
    const eventId = crypto.randomBytes(8).toString('hex');
    
    // Sanitize sensitive data from context
    const sanitizedContext = this.sanitizeContext(context);
    
    return {
      eventId,
      timestamp,
      severity,
      category,
      message: this.sanitizeMessage(message),
      context: sanitizedContext,
      environment: this.environment,
      component: options.component || 'unknown',
      sourceIP: context.ip || context.sourceIP || 'unknown',
      userAgent: context.userAgent || 'unknown',
      sessionId: context.sessionId || context.requestId || 'unknown',
      duration: context.duration || 0,
      resourcesUsed: {
        cpu: context.cpuUsage || 0,
        memory: context.memoryUsage || 0,
        disk: context.diskUsage || 0
      },
      metadata: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
        hostname: require('os').hostname()
      }
    };
  }
  
  /**
   * Sanitize message to prevent log injection
   */
  sanitizeMessage(message) {
    if (typeof message !== 'string') {
      message = String(message);
    }
    
    // Remove or escape dangerous characters
    return message
      .replace(/\r\n|\r|\n/g, ' ') // Replace line breaks
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 1000); // Limit length
  }
  
  /**
   * Sanitize context to remove sensitive information
   */
  sanitizeContext(context) {
    if (!context || typeof context !== 'object') {
      return {};
    }
    
    const sensitiveKeys = [
      'password', 'passwd', 'pwd', 'secret', 'key', 'token',
      'authorization', 'auth', 'cookie', 'session', 'apikey',
      'private', 'credential', 'cert', 'certificate'
    ];
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive terms
      const isSensitive = sensitiveKeys.some(sensitive => 
        lowerKey.includes(sensitive)
      );
      
      if (isSensitive) {
        if (typeof value === 'string' && value.length > 0) {
          sanitized[key] = `[REDACTED:${value.length}chars]`;
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        // Recursively sanitize nested objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          sanitized[key] = this.sanitizeContext(value);
        } else if (typeof value === 'string') {
          sanitized[key] = value.substring(0, 500); // Limit string length
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }
  
  /**
   * Check for duplicate events to prevent spam
   */
  isDuplicateEvent(logEntry) {
    const eventKey = `${logEntry.category}:${logEntry.message}:${logEntry.sourceIP}`;
    const now = Date.now();
    
    if (!this.recentEvents.has(eventKey)) {
      this.recentEvents.set(eventKey, { count: 1, firstSeen: now, lastSeen: now });
      return false;
    }
    
    const eventInfo = this.recentEvents.get(eventKey);
    
    // If more than a minute has passed, reset counter
    if (now - eventInfo.firstSeen > 60000) {
      this.recentEvents.set(eventKey, { count: 1, firstSeen: now, lastSeen: now });
      return false;
    }
    
    eventInfo.count++;
    eventInfo.lastSeen = now;
    
    // If we've seen this event too many times, it's a duplicate
    if (eventInfo.count > this.duplicateThreshold) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Update metrics
   */
  updateMetrics(severity, category) {
    this.metrics.totalEvents++;
    
    if (!this.metrics.eventsByCategory[category]) {
      this.metrics.eventsByCategory[category] = 0;
    }
    this.metrics.eventsByCategory[category]++;
    
    if (!this.metrics.eventsBySeverity[severity]) {
      this.metrics.eventsBySeverity[severity] = 0;
    }
    this.metrics.eventsBySeverity[severity]++;
  }
  
  /**
   * Log to console with colors
   */
  logToConsole(logEntry) {
    const severityInfo = this.severity[logEntry.severity];
    const color = severityInfo.color;
    const reset = '\x1b[0m';
    
    console.log(
      `${color}[${logEntry.timestamp}] ${logEntry.severity} [${logEntry.category}] ${logEntry.message}${reset}`,
      logEntry.context
    );
  }
  
  /**
   * Log to file with rotation
   */
  async logToFile(logEntry) {
    const filename = `security-${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(this.logDir, filename);
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      await fs.appendFile(filepath, logLine);
      await this.checkLogRotation(filepath);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  /**
   * Send to SIEM system
   */
  async logToSIEM(logEntry) {
    if (!this.siemEndpoint) return;
    
    try {
      const response = await fetch(this.siemEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Workflow-Security-Logger/1.0'
        },
        body: JSON.stringify(logEntry)
      });
      
      if (!response.ok) {
        console.warn('SIEM logging failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('SIEM logging error:', error.message);
    }
  }
  
  /**
   * Trigger alerts for critical events
   */
  triggerAlert(logEntry) {
    // Emit alert event
    this.emit('alert', logEntry);
    
    // Log alert trigger
    if (logEntry.severity === 'CRITICAL') {
      console.error('🚨 CRITICAL SECURITY ALERT:', {
        eventId: logEntry.eventId,
        category: logEntry.category,
        message: logEntry.message,
        sourceIP: logEntry.sourceIP,
        timestamp: logEntry.timestamp
      });
    }
  }
  
  /**
   * Check if log rotation is needed
   */
  async checkLogRotation(filepath) {
    try {
      const stats = await fs.stat(filepath);
      if (stats.size > this.maxLogSize) {
        await this.rotateLogs();
      }
    } catch (error) {
      // File might not exist yet, that's OK
    }
  }
  
  /**
   * Rotate logs when they get too large
   */
  async rotateLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(f => f.startsWith('security-') && f.endsWith('.log'))
        .sort()
        .reverse();
      
      // Remove old log files if we have too many
      if (logFiles.length > this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(this.logDir, file));
        }
      }
      
      this.metrics.lastLogRotation = Date.now();
    } catch (error) {
      console.error('Log rotation failed:', error);
    }
  }
  
  /**
   * Rotate logs if needed (periodic check)
   */
  async rotateLogsIfNeeded() {
    // Check if any log files are too large
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(f => f.startsWith('security-') && f.endsWith('.log'));
      
      for (const file of logFiles) {
        const filepath = path.join(this.logDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.size > this.maxLogSize) {
          await this.rotateLogs();
          break;
        }
      }
    } catch (error) {
      // Directory might not exist or other issues
    }
  }
  
  /**
   * Clean up recent events from memory
   */
  cleanupRecentEvents() {
    const now = Date.now();
    const cutoff = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, eventInfo] of this.recentEvents) {
      if (now - eventInfo.lastSeen > cutoff) {
        this.recentEvents.delete(key);
      }
    }
  }
  
  /**
   * Get security metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      recentEventTypes: this.recentEvents.size
    };
  }
  
  /**
   * Convenience methods for common security events
   */
  
  async logAuthFailure(context = {}) {
    await this.log('HIGH', this.categories.AUTHENTICATION, 'Authentication failure', context);
  }
  
  async logAuthSuccess(context = {}) {
    await this.log('INFO', this.categories.AUTHENTICATION, 'Authentication success', context);
  }
  
  async logAuthorizationFailure(context = {}) {
    await this.log('HIGH', this.categories.AUTHORIZATION, 'Authorization failure', context);
  }
  
  async logCommandInjectionAttempt(context = {}) {
    await this.log('CRITICAL', this.categories.COMMAND_INJECTION, 'Command injection attempt detected', context);
  }
  
  async logPathTraversalAttempt(context = {}) {
    await this.log('CRITICAL', this.categories.PATH_TRAVERSAL, 'Path traversal attempt detected', context);
  }
  
  async logSQLInjectionAttempt(context = {}) {
    await this.log('CRITICAL', this.categories.SQL_INJECTION, 'SQL injection attempt detected', context);
  }
  
  async logXSSAttempt(context = {}) {
    await this.log('HIGH', this.categories.XSS, 'XSS attempt detected', context);
  }
  
  async logRateLimitExceeded(context = {}) {
    await this.log('MEDIUM', this.categories.RATE_LIMITING, 'Rate limit exceeded', context);
  }
  
  async logUnauthorizedFileAccess(context = {}) {
    await this.log('HIGH', this.categories.FILE_ACCESS, 'Unauthorized file access attempt', context);
  }
  
  async logSuspiciousNetworkActivity(context = {}) {
    await this.log('MEDIUM', this.categories.NETWORK_ACCESS, 'Suspicious network activity', context);
  }
  
  async logConfigurationChange(context = {}) {
    await this.log('MEDIUM', this.categories.CONFIGURATION, 'Configuration change', context);
  }
  
  async logPerformanceAnomaly(context = {}) {
    await this.log('LOW', this.categories.PERFORMANCE, 'Performance anomaly detected', context);
  }
  
  /**
   * Create a child logger with context
   */
  createChild(defaultContext = {}) {
    return {
      log: async (severity, category, message, context = {}) => {
        await this.log(severity, category, message, { ...defaultContext, ...context });
      },
      
      // Convenience methods with default context
      logAuthFailure: (context = {}) => this.logAuthFailure({ ...defaultContext, ...context }),
      logAuthSuccess: (context = {}) => this.logAuthSuccess({ ...defaultContext, ...context }),
      logCommandInjectionAttempt: (context = {}) => this.logCommandInjectionAttempt({ ...defaultContext, ...context }),
      logPathTraversalAttempt: (context = {}) => this.logPathTraversalAttempt({ ...defaultContext, ...context }),
      // ... add other methods as needed
    };
  }
}

// Factory function
function createSecurityLogger(options = {}) {
  return new SecurityLogger(options);
}

// Singleton for global use
let globalLogger = null;

function getGlobalSecurityLogger(options = {}) {
  if (!globalLogger) {
    globalLogger = new SecurityLogger(options);
  }
  return globalLogger;
}

module.exports = {
  SecurityLogger,
  createSecurityLogger,
  getGlobalSecurityLogger
};