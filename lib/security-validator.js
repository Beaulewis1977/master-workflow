/**
 * Security Validation Module - COMPREHENSIVE INPUT VALIDATION
 * 
 * This module provides comprehensive input validation and sanitization
 * functions to prevent various security vulnerabilities including:
 * - Command injection (CWE-78)
 * - Path traversal (CWE-22)  
 * - SQL injection (CWE-89)
 * - XSS (CWE-79)
 * - Buffer overflow (CWE-120)
 * - Null byte injection (CWE-158)
 * 
 * @author Claude Security Auditor
 * @version 1.0.0
 * @date August 2025
 */

const crypto = require('crypto');
const path = require('path');

class SecurityValidator {
  constructor(options = {}) {
    this.maxStringLength = options.maxStringLength || 10000;
    this.maxArrayLength = options.maxArrayLength || 1000;
    this.maxObjectDepth = options.maxObjectDepth || 10;
    this.enableLogging = options.enableLogging !== false;
    this.logLevel = options.logLevel || 'WARN';
    
    // Security patterns for various attack types
    this.patterns = {
      // Command injection patterns
      commandInjection: [
        /[;&|`$(){}[\]<>\\'"]/,
        /;\s*rm\s+/i,
        /;\s*curl.*\|/i,
        /;\s*wget.*\|/i,
        /&&.*rm/i,
        /\|\|.*rm/i,
        /`.*`/,
        /\$\(.*\)/,
        />\s*\/dev\/null.*&/
      ],
      
      // Path traversal patterns
      pathTraversal: [
        /\.\.\//,
        /\.\.\\/, 
        /%2e%2e%2f/i,
        /%2e%2e%5c/i,
        /\.\.%2f/i,
        /\.\.%5c/i,
        /\0/
      ],
      
      // SQL injection patterns
      sqlInjection: [
        /union\s+select/i,
        /'\s*(or|and)\s+/i,
        /'\s*;\s*drop\s+/i,
        /exec\s*\(/i,
        /sp_\w+/i,
        /xp_\w+/i,
        /information_schema/i,
        /sys\.\w+/i,
        /--\s*$/,
        /\/\*.*\*\//
      ],
      
      // XSS patterns
      xss: [
        /<script[^>]*>/i,
        /<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>/i,
        /<object[^>]*>/i,
        /<embed[^>]*>/i,
        /eval\s*\(/i,
        /expression\s*\(/i
      ],
      
      // General dangerous patterns
      dangerous: [
        /\0/, // Null bytes
        /[\x00-\x1F\x7F]/, // Control characters
        /\uFEFF/, // BOM
        /\u200B/, // Zero-width space
        /\u200C/, // Zero-width non-joiner
        /\u200D/, // Zero-width joiner
        /\u2060/  // Word joiner
      ]
    };
    
    // Allowed characters for different contexts
    this.allowedChars = {
      filename: /^[a-zA-Z0-9._-]+$/,
      alphanumeric: /^[a-zA-Z0-9]+$/,
      identifier: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      path: /^[a-zA-Z0-9._/\\-]+$/,
      url: /^https?:\/\/[a-zA-Z0-9.-]+[a-zA-Z0-9._/\-?=&]*$/
    };
  }

  /**
   * Security logging with context
   */
  log(level, message, context = {}) {
    if (!this.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      component: 'security-validator'
    };
    
    if (level === 'CRITICAL' || level === 'HIGH' || 
        (this.logLevel === 'WARN' && level === 'WARN') ||
        (this.logLevel === 'INFO' && ['INFO', 'WARN'].includes(level))) {
      console.log(`[SECURITY ${level}] ${message}`, context);
    }
    
    if (level === 'CRITICAL' || level === 'HIGH') {
      console.error('SECURITY VALIDATION ALERT:', logEntry);
    }
  }

  /**
   * Validate string input with comprehensive checks
   */
  validateString(input, options = {}) {
    const validation = {
      isValid: true,
      sanitized: input,
      errors: [],
      warnings: []
    };

    // Type check
    if (typeof input !== 'string') {
      if (input === null || input === undefined) {
        validation.sanitized = '';
        return validation;
      }
      input = String(input);
      validation.warnings.push('Input converted to string');
    }

    // Length check
    const maxLength = options.maxLength || this.maxStringLength;
    if (input.length > maxLength) {
      validation.errors.push(`String too long: ${input.length} > ${maxLength}`);
      validation.isValid = false;
      this.log('HIGH', 'String length validation failed', {
        inputLength: input.length,
        maxLength,
        context: options.context
      });
      return validation;
    }

    // Pattern-based validation
    const checkPatterns = options.checkPatterns || ['dangerous'];
    for (const patternType of checkPatterns) {
      if (this.patterns[patternType]) {
        for (const pattern of this.patterns[patternType]) {
          if (pattern.test(input)) {
            validation.errors.push(`Dangerous pattern detected: ${patternType}`);
            validation.isValid = false;
            this.log('CRITICAL', `Dangerous pattern detected: ${patternType}`, {
              input: input.substring(0, 200),
              pattern: pattern.toString(),
              context: options.context
            });
            return validation;
          }
        }
      }
    }

    // Character set validation
    if (options.allowedChars) {
      const charPattern = this.allowedChars[options.allowedChars] || options.allowedChars;
      if (charPattern instanceof RegExp && !charPattern.test(input)) {
        validation.errors.push(`Invalid characters for context: ${options.allowedChars}`);
        validation.isValid = false;
        this.log('HIGH', 'Character validation failed', {
          input: input.substring(0, 100),
          allowedChars: options.allowedChars,
          context: options.context
        });
        return validation;
      }
    }

    // Encoding validation
    try {
      // Check for double encoding
      const decoded = decodeURIComponent(input);
      if (decoded !== input && decoded.length < input.length * 0.7) {
        validation.warnings.push('Potential encoded input detected');
      }
    } catch (e) {
      // URL decoding failed, input might contain % but not be URL encoded
    }

    // Sanitization
    if (options.sanitize) {
      validation.sanitized = this.sanitizeString(input, options.sanitize);
      if (validation.sanitized !== input) {
        validation.warnings.push('Input was sanitized');
      }
    }

    this.log('INFO', 'String validation passed', {
      inputLength: input.length,
      context: options.context
    });

    return validation;
  }

  /**
   * Sanitize string based on context
   */
  sanitizeString(input, sanitizeType) {
    switch (sanitizeType) {
      case 'html':
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
          
      case 'filename':
        return input.replace(/[^a-zA-Z0-9._-]/g, '_');
        
      case 'alphanumeric':
        return input.replace(/[^a-zA-Z0-9]/g, '');
        
      case 'path':
        return input.replace(/[^a-zA-Z0-9._/\\-]/g, '');
        
      case 'trim':
        return input.trim();
        
      default:
        return input;
    }
  }

  /**
   * Validate path for traversal attacks
   */
  validatePath(inputPath, options = {}) {
    const validation = {
      isValid: true,
      sanitized: inputPath,
      errors: [],
      warnings: []
    };

    if (!inputPath || typeof inputPath !== 'string') {
      validation.errors.push('Path must be a non-empty string');
      validation.isValid = false;
      return validation;
    }

    // Check for path traversal patterns
    for (const pattern of this.patterns.pathTraversal) {
      if (pattern.test(inputPath)) {
        validation.errors.push('Path traversal attempt detected');
        validation.isValid = false;
        this.log('CRITICAL', 'Path traversal attempt blocked', {
          path: inputPath,
          pattern: pattern.toString(),
          context: options.context
        });
        return validation;
      }
    }

    try {
      const resolvedPath = path.resolve(inputPath);
      validation.sanitized = resolvedPath;

      // Check against base path if provided
      if (options.basePath) {
        const resolvedBase = path.resolve(options.basePath);
        if (!resolvedPath.startsWith(resolvedBase)) {
          validation.errors.push('Path outside allowed base directory');
          validation.isValid = false;
          this.log('HIGH', 'Path outside base directory blocked', {
            path: resolvedPath,
            basePath: resolvedBase,
            context: options.context
          });
          return validation;
        }
      }

      // Check path length
      if (resolvedPath.length > 260) { // Windows MAX_PATH
        validation.errors.push('Path too long');
        validation.isValid = false;
        return validation;
      }

    } catch (error) {
      validation.errors.push(`Path resolution failed: ${error.message}`);
      validation.isValid = false;
      return validation;
    }

    this.log('INFO', 'Path validation passed', {
      originalPath: inputPath,
      resolvedPath: validation.sanitized,
      context: options.context
    });

    return validation;
  }

  /**
   * Validate array input
   */
  validateArray(input, options = {}) {
    const validation = {
      isValid: true,
      sanitized: input,
      errors: [],
      warnings: []
    };

    if (!Array.isArray(input)) {
      validation.errors.push('Input must be an array');
      validation.isValid = false;
      return validation;
    }

    const maxLength = options.maxLength || this.maxArrayLength;
    if (input.length > maxLength) {
      validation.errors.push(`Array too long: ${input.length} > ${maxLength}`);
      validation.isValid = false;
      this.log('HIGH', 'Array length validation failed', {
        arrayLength: input.length,
        maxLength,
        context: options.context
      });
      return validation;
    }

    // Validate each element if validator provided
    if (options.elementValidator) {
      const sanitizedArray = [];
      for (let i = 0; i < input.length; i++) {
        const elementValidation = options.elementValidator(input[i], { 
          ...options.elementOptions, 
          context: `${options.context}[${i}]` 
        });
        
        if (!elementValidation.isValid) {
          validation.errors.push(`Element ${i}: ${elementValidation.errors.join(', ')}`);
          validation.isValid = false;
          return validation;
        }
        
        sanitizedArray.push(elementValidation.sanitized);
      }
      validation.sanitized = sanitizedArray;
    }

    return validation;
  }

  /**
   * Validate object input with depth checking
   */
  validateObject(input, options = {}, depth = 0) {
    const validation = {
      isValid: true,
      sanitized: input,
      errors: [],
      warnings: []
    };

    if (typeof input !== 'object' || input === null) {
      validation.errors.push('Input must be an object');
      validation.isValid = false;
      return validation;
    }

    // Check depth to prevent stack overflow
    const maxDepth = options.maxDepth || this.maxObjectDepth;
    if (depth > maxDepth) {
      validation.errors.push(`Object depth too deep: ${depth} > ${maxDepth}`);
      validation.isValid = false;
      this.log('HIGH', 'Object depth validation failed', {
        depth,
        maxDepth,
        context: options.context
      });
      return validation;
    }

    // Check number of keys
    const keys = Object.keys(input);
    const maxKeys = options.maxKeys || 100;
    if (keys.length > maxKeys) {
      validation.errors.push(`Too many object keys: ${keys.length} > ${maxKeys}`);
      validation.isValid = false;
      return validation;
    }

    // Validate keys and values if validators provided
    if (options.keyValidator || options.valueValidator) {
      const sanitizedObject = {};
      
      for (const key of keys) {
        // Validate key
        if (options.keyValidator) {
          const keyValidation = options.keyValidator(key, {
            ...options.keyOptions,
            context: `${options.context}.key(${key})`
          });
          
          if (!keyValidation.isValid) {
            validation.errors.push(`Key "${key}": ${keyValidation.errors.join(', ')}`);
            validation.isValid = false;
            return validation;
          }
        }

        // Validate value
        let validatedValue = input[key];
        if (options.valueValidator) {
          const valueValidation = options.valueValidator(input[key], {
            ...options.valueOptions,
            context: `${options.context}.${key}`
          });
          
          if (!valueValidation.isValid) {
            validation.errors.push(`Value for "${key}": ${valueValidation.errors.join(', ')}`);
            validation.isValid = false;
            return validation;
          }
          
          validatedValue = valueValidation.sanitized;
        }

        // Recursively validate nested objects
        if (typeof validatedValue === 'object' && validatedValue !== null) {
          const nestedValidation = this.validateObject(validatedValue, options, depth + 1);
          if (!nestedValidation.isValid) {
            validation.errors.push(`Nested object "${key}": ${nestedValidation.errors.join(', ')}`);
            validation.isValid = false;
            return validation;
          }
          validatedValue = nestedValidation.sanitized;
        }

        sanitizedObject[key] = validatedValue;
      }
      
      validation.sanitized = sanitizedObject;
    }

    return validation;
  }

  /**
   * Validate JSON input
   */
  validateJSON(input, options = {}) {
    const validation = {
      isValid: true,
      sanitized: null,
      errors: [],
      warnings: []
    };

    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        validation.sanitized = parsed;
      } catch (error) {
        validation.errors.push(`Invalid JSON: ${error.message}`);
        validation.isValid = false;
        this.log('HIGH', 'JSON parsing failed', {
          error: error.message,
          input: input.substring(0, 200),
          context: options.context
        });
        return validation;
      }
    } else {
      validation.sanitized = input;
    }

    // Validate the parsed object
    const objectValidation = this.validateObject(validation.sanitized, options);
    if (!objectValidation.isValid) {
      validation.errors = validation.errors.concat(objectValidation.errors);
      validation.isValid = false;
      return validation;
    }

    validation.sanitized = objectValidation.sanitized;
    validation.warnings = validation.warnings.concat(objectValidation.warnings);

    return validation;
  }

  /**
   * Generate secure random values
   */
  generateSecureRandom(type = 'hex', length = 16) {
    const bytes = crypto.randomBytes(length);
    
    switch (type) {
      case 'hex':
        return bytes.toString('hex');
      case 'base64':
        return bytes.toString('base64').replace(/[+/=]/g, '');
      case 'alphanumeric':
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(bytes[i] % chars.length);
        }
        return result;
      default:
        return bytes;
    }
  }

  /**
   * Rate limiting helper
   */
  createRateLimiter(windowMs = 60000, maxRequests = 100) {
    const requests = new Map();
    
    return (identifier) => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      for (const [id, timestamps] of requests) {
        const validTimestamps = timestamps.filter(ts => ts > windowStart);
        if (validTimestamps.length === 0) {
          requests.delete(id);
        } else {
          requests.set(id, validTimestamps);
        }
      }
      
      // Check current identifier
      if (!requests.has(identifier)) {
        requests.set(identifier, []);
      }
      
      const userRequests = requests.get(identifier);
      const validRequests = userRequests.filter(ts => ts > windowStart);
      
      if (validRequests.length >= maxRequests) {
        this.log('HIGH', 'Rate limit exceeded', {
          identifier,
          requests: validRequests.length,
          maxRequests,
          windowMs
        });
        return false;
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true;
    };
  }

  /**
   * Create validation preset for common use cases
   */
  createPreset(presetName, customOptions = {}) {
    const presets = {
      filename: {
        maxLength: 255,
        allowedChars: 'filename',
        sanitize: 'filename',
        checkPatterns: ['pathTraversal', 'dangerous']
      },
      
      userInput: {
        maxLength: 1000,
        sanitize: 'html',
        checkPatterns: ['xss', 'dangerous']
      },
      
      sqlParameter: {
        maxLength: 4000,
        checkPatterns: ['sqlInjection', 'dangerous']
      },
      
      command: {
        maxLength: 2000,
        checkPatterns: ['commandInjection', 'dangerous']
      },
      
      path: {
        maxLength: 260,
        checkPatterns: ['pathTraversal', 'dangerous']
      },
      
      identifier: {
        maxLength: 64,
        allowedChars: 'identifier',
        checkPatterns: ['dangerous']
      }
    };

    const preset = presets[presetName];
    if (!preset) {
      throw new Error(`Unknown validation preset: ${presetName}`);
    }

    return {
      ...preset,
      ...customOptions
    };
  }
}

// Export factory function and class
function createSecurityValidator(options = {}) {
  return new SecurityValidator(options);
}

module.exports = {
  SecurityValidator,
  createSecurityValidator
};