/**
 * Security Analysis Engine - Simplified Stub Version
 * Analyzes security vulnerabilities and patterns without external dependencies
 * 
 * @author Claude Code Analyzer Agent
 * @version 1.0.0-stub
 */

const fs = require('fs').promises;
const path = require('path');

class SecurityAnalysisEngine {
  constructor(sharedMemory) {
    this.sharedMemory = sharedMemory;
    this.detectedVulnerabilities = new Map();
    
    // Security vulnerability patterns
    this.vulnerabilityPatterns = {
      'sql-injection': {
        patterns: ['${', '" + ', '\' + ', 'query.raw(', 'execute(', 'SELECT.*\\+'],
        severity: 'critical',
        description: 'Potential SQL injection vulnerability'
      },
      'xss': {
        patterns: ['innerHTML', 'document.write', 'eval(', 'dangerouslySetInnerHTML'],
        severity: 'high',
        description: 'Cross-site scripting (XSS) vulnerability'
      },
      'csrf': {
        patterns: ['POST.*without.*csrf', 'form.*method=.post.*without.*token'],
        severity: 'medium',
        description: 'Cross-site request forgery (CSRF) vulnerability'
      },
      'path-traversal': {
        patterns: ['../../../', '..\\\\..\\\\', 'path.join.*req.', '__dirname.*req.'],
        severity: 'high',
        description: 'Path traversal vulnerability'
      },
      'insecure-crypto': {
        patterns: ['md5', 'sha1', 'DES', 'RC4', 'crypto.createHash\\(.*md5'],
        severity: 'medium',
        description: 'Weak cryptographic algorithm'
      },
      'hardcoded-secrets': {
        patterns: ['password\\s*=\\s*[\'"][^\'"]{8,}', 'api_key\\s*=\\s*[\'"][^\'"]+', 'secret\\s*=\\s*[\'"][^\'"]+'],
        severity: 'high',
        description: 'Hardcoded credentials or secrets'
      },
      'insecure-random': {
        patterns: ['Math.random()', 'Random\\(\\)', 'new Random\\(\\)'],
        severity: 'medium',
        description: 'Insecure random number generation'
      }
    };
    
    // Security best practice patterns
    this.securityPractices = {
      authentication: {
        good: ['bcrypt', 'passport', 'jwt', '@auth0', 'helmet'],
        bad: ['plaintext', 'base64.*password', 'localStorage.*password']
      },
      authorization: {
        good: ['middleware.*auth', 'verifyToken', 'checkPermission'],
        bad: ['req.user.*admin', 'if.*user.role']
      },
      validation: {
        good: ['joi', 'express-validator', 'yup', 'validate'],
        bad: ['req.body.*without.*validation']
      },
      headers: {
        good: ['helmet', 'cors', 'X-Frame-Options', 'Content-Security-Policy'],
        bad: ['Access-Control-Allow-Origin.*\\*']
      }
    };
    
    // OWASP Top 10 patterns
    this.owaspPatterns = {
      'A01-broken-access-control': ['bypass.*auth', 'admin.*hardcoded', 'privilege.*escalation'],
      'A02-cryptographic-failures': ['http://', 'md5', 'sha1', 'weak.*encryption'],
      'A03-injection': ['sql.*injection', 'command.*injection', 'ldap.*injection'],
      'A04-insecure-design': ['security.*by.*obscurity', 'client.*side.*validation.*only'],
      'A05-security-misconfiguration': ['debug.*true', 'error.*stack.*trace', 'default.*credentials'],
      'A06-vulnerable-components': ['outdated.*dependencies', 'known.*vulnerabilities'],
      'A07-identification-failures': ['weak.*password', 'session.*fixation', 'brute.*force'],
      'A08-data-integrity-failures': ['unsigned.*code', 'untrusted.*sources'],
      'A09-logging-failures': ['no.*logging', 'insufficient.*monitoring'],
      'A10-ssrf': ['server.*side.*request.*forgery', 'fetch.*user.*input']
    };
  }
  
  /**
   * Main security analysis method
   */
  async analyzeSecurity(projectPath) {
    const analysisId = `security-${Date.now()}`;
    
    try {
      const files = await this.scanCodeFiles(projectPath);
      const packageInfo = await this.analyzePackageFiles(projectPath);
      
      const result = {
        vulnerabilities: [],
        practices: {},
        owaspFindings: {},
        dependencies: {},
        configuration: {},
        recommendations: [],
        riskScore: 0,
        timestamp: Date.now()
      };
      
      // Analyze code for vulnerabilities
      for (const file of files) {
        const content = await this.readFile(file.path);
        if (content) {
          await this.analyzeFileForSecurity(file, content, result);
        }
      }
      
      // Analyze security practices
      result.practices = this.analyzeSecurityPractices(files, packageInfo);
      
      // Check OWASP Top 10
      result.owaspFindings = this.checkOwaspTop10(result.vulnerabilities);
      
      // Analyze dependencies
      result.dependencies = this.analyzeDependencySecurity(packageInfo);
      
      // Analyze configuration security
      result.configuration = await this.analyzeConfigurationSecurity(projectPath);
      
      // Calculate risk score
      result.riskScore = this.calculateRiskScore(result);
      
      // Generate recommendations
      result.recommendations = this.generateSecurityRecommendations(result);
      
      // Store results
      await this.storeResults(analysisId, result);
      
      return result;
      
    } catch (error) {
      console.error('Security analysis error:', error);
      return {
        vulnerabilities: [],
        practices: {},
        owaspFindings: {},
        dependencies: {},
        configuration: {},
        recommendations: [],
        riskScore: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Analyze file for security issues
   */
  async analyzeFileForSecurity(file, content, result) {
    // Check for vulnerability patterns
    for (const [vulnType, config] of Object.entries(this.vulnerabilityPatterns)) {
      for (const pattern of config.patterns) {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          const lines = this.findMatchingLines(content, pattern);
          
          result.vulnerabilities.push({
            type: vulnType,
            severity: config.severity,
            description: config.description,
            file: file.path,
            matches: matches.length,
            lines: lines,
            pattern: pattern
          });
        }
      }
    }
  }
  
  /**
   * Find lines containing pattern matches
   */
  findMatchingLines(content, pattern) {
    const lines = content.split('\n');
    const matchingLines = [];
    const regex = new RegExp(pattern, 'gi');
    
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        matchingLines.push({
          number: i + 1,
          content: lines[i].trim()
        });
      }
    }
    
    return matchingLines;
  }
  
  /**
   * Analyze security practices
   */
  analyzeSecurityPractices(files, packageInfo) {
    const practices = {
      authentication: { score: 0, findings: [] },
      authorization: { score: 0, findings: [] },
      validation: { score: 0, findings: [] },
      headers: { score: 0, findings: [] }
    };
    
    const allDeps = [...packageInfo.dependencies, ...packageInfo.devDependencies];
    
    for (const [practiceType, patterns] of Object.entries(this.securityPractices)) {
      const practice = practices[practiceType];
      
      // Check for good practices in dependencies
      for (const goodPattern of patterns.good) {
        if (allDeps.some(dep => dep.includes(goodPattern))) {
          practice.score += 20;
          practice.findings.push(`Good: Uses ${goodPattern}`);
        }
      }
      
      // Check for bad practices in files
      for (const file of files) {
        if (file.content) {
          for (const badPattern of patterns.bad) {
            const regex = new RegExp(badPattern, 'gi');
            if (regex.test(file.content)) {
              practice.score -= 10;
              practice.findings.push(`Bad: ${badPattern} found in ${file.path}`);
            }
          }
        }
      }
      
      practice.score = Math.max(0, Math.min(100, practice.score));
    }
    
    return practices;
  }
  
  /**
   * Check against OWASP Top 10
   */
  checkOwaspTop10(vulnerabilities) {
    const findings = {};
    
    for (const [owaspId, patterns] of Object.entries(this.owaspPatterns)) {
      findings[owaspId] = {
        detected: false,
        count: 0,
        vulnerabilities: []
      };
      
      for (const vuln of vulnerabilities) {
        if (patterns.some(pattern => 
          vuln.type.includes(pattern.replace(/\.\*/g, '')) ||
          vuln.description.toLowerCase().includes(pattern.replace(/\.\*/g, ''))
        )) {
          findings[owaspId].detected = true;
          findings[owaspId].count++;
          findings[owaspId].vulnerabilities.push(vuln);
        }
      }
    }
    
    return findings;
  }
  
  /**
   * Analyze dependency security
   */
  analyzeDependencySecurity(packageInfo) {
    const analysis = {
      totalDependencies: 0,
      potentiallyVulnerable: 0,
      outdatedPatterns: 0,
      recommendations: []
    };
    
    const allDeps = [...packageInfo.dependencies, ...packageInfo.devDependencies];
    analysis.totalDependencies = allDeps.length;
    
    // Check for potentially vulnerable packages (simplified heuristics)
    const riskyPatterns = ['eval', 'exec', 'serialize', 'unserialize', 'pickle'];
    const outdatedPatterns = ['jquery@1', 'angular@1', 'lodash@3'];
    
    for (const dep of allDeps) {
      if (riskyPatterns.some(pattern => dep.includes(pattern))) {
        analysis.potentiallyVulnerable++;
        analysis.recommendations.push(`Review ${dep} for security implications`);
      }
      
      if (outdatedPatterns.some(pattern => dep.includes(pattern))) {
        analysis.outdatedPatterns++;
        analysis.recommendations.push(`Update ${dep} to latest version`);
      }
    }
    
    return analysis;
  }
  
  /**
   * Analyze configuration security
   */
  async analyzeConfigurationSecurity(projectPath) {
    const config = {
      httpsUsage: false,
      environmentVariables: false,
      secretsInConfig: 0,
      securityHeaders: false,
      recommendations: []
    };
    
    try {
      // Check for HTTPS usage
      const files = await this.scanConfigFiles(projectPath);
      
      for (const file of files) {
        const content = await this.readFile(file.path);
        if (content) {
          // Check for HTTPS
          if (content.includes('https://') || content.includes('ssl: true')) {
            config.httpsUsage = true;
          }
          
          // Check for environment variables
          if (content.includes('process.env') || content.includes('$ENV')) {
            config.environmentVariables = true;
          }
          
          // Check for secrets in config
          const secretPatterns = ['password', 'secret', 'key', 'token'];
          for (const pattern of secretPatterns) {
            const regex = new RegExp(`${pattern}.*[:=].*['"][^'"]{8,}['"]`, 'gi');
            const matches = content.match(regex);
            if (matches) {
              config.secretsInConfig += matches.length;
            }
          }
          
          // Check for security headers
          if (content.includes('helmet') || content.includes('security-headers')) {
            config.securityHeaders = true;
          }
        }
      }
      
      // Generate configuration recommendations
      if (!config.httpsUsage) {
        config.recommendations.push('Enable HTTPS for secure communication');
      }
      
      if (!config.environmentVariables) {
        config.recommendations.push('Use environment variables for configuration');
      }
      
      if (config.secretsInConfig > 0) {
        config.recommendations.push('Move secrets from config files to environment variables');
      }
      
      if (!config.securityHeaders) {
        config.recommendations.push('Implement security headers (helmet.js)');
      }
      
    } catch (error) {
      config.recommendations.push('Unable to analyze configuration files');
    }
    
    return config;
  }
  
  /**
   * Calculate overall risk score
   */
  calculateRiskScore(result) {
    let score = 0;
    
    // Vulnerability scoring
    for (const vuln of result.vulnerabilities) {
      switch (vuln.severity) {
        case 'critical': score += 10; break;
        case 'high': score += 7; break;
        case 'medium': score += 4; break;
        case 'low': score += 2; break;
      }
    }
    
    // Security practices scoring (negative impact)
    const practicesAvg = Object.values(result.practices)
      .reduce((sum, p) => sum + p.score, 0) / Object.keys(result.practices).length;
    score += Math.max(0, (100 - practicesAvg) / 10);
    
    // OWASP findings scoring
    const owaspFindings = Object.values(result.owaspFindings).filter(f => f.detected).length;
    score += owaspFindings * 5;
    
    // Configuration issues
    if (result.configuration.secretsInConfig > 0) score += 5;
    if (!result.configuration.httpsUsage) score += 3;
    if (!result.configuration.securityHeaders) score += 2;
    
    return Math.min(100, Math.round(score));
  }
  
  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations(result) {
    const recommendations = [];
    
    // Critical vulnerabilities
    const criticalVulns = result.vulnerabilities.filter(v => v.severity === 'critical');
    if (criticalVulns.length > 0) {
      recommendations.push({
        type: 'vulnerability',
        priority: 'critical',
        title: `${criticalVulns.length} Critical Security Vulnerabilities`,
        description: 'Immediate action required to fix critical security issues',
        impact: 'security'
      });
    }
    
    // High-risk vulnerabilities
    const highVulns = result.vulnerabilities.filter(v => v.severity === 'high');
    if (highVulns.length > 0) {
      recommendations.push({
        type: 'vulnerability',
        priority: 'high',
        title: `${highVulns.length} High-Risk Security Issues`,
        description: 'Address high-risk security vulnerabilities promptly',
        impact: 'security'
      });
    }
    
    // Security practices
    const lowPractices = Object.entries(result.practices)
      .filter(([_, practice]) => practice.score < 50);
    
    if (lowPractices.length > 0) {
      recommendations.push({
        type: 'practices',
        priority: 'high',
        title: 'Improve Security Practices',
        description: `Poor security practices detected: ${lowPractices.map(([name]) => name).join(', ')}`,
        impact: 'security'
      });
    }
    
    // OWASP Top 10 issues
    const owaspIssues = Object.entries(result.owaspFindings)
      .filter(([_, finding]) => finding.detected);
    
    if (owaspIssues.length > 0) {
      recommendations.push({
        type: 'owasp',
        priority: 'high',
        title: 'OWASP Top 10 Violations',
        description: `Address OWASP security issues: ${owaspIssues.length} categories affected`,
        impact: 'security'
      });
    }
    
    // Configuration issues
    if (result.configuration.recommendations.length > 0) {
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        title: 'Security Configuration Issues',
        description: 'Improve security configuration settings',
        impact: 'security'
      });
    }
    
    // Dependency issues
    if (result.dependencies.potentiallyVulnerable > 0) {
      recommendations.push({
        type: 'dependencies',
        priority: 'medium',
        title: 'Vulnerable Dependencies',
        description: `${result.dependencies.potentiallyVulnerable} potentially vulnerable dependencies detected`,
        impact: 'security'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Helper methods
   */
  
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }
  
  async scanCodeFiles(projectPath) {
    const files = [];
    
    const scanDir = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDir(fullPath);
          } else if (entry.isFile() && this.isCodeFile(entry.name)) {
            files.push({
              path: fullPath,
              name: entry.name
            });
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    await scanDir(projectPath);
    return files;
  }
  
  async scanConfigFiles(projectPath) {
    const files = [];
    const configExtensions = ['.json', '.yml', '.yaml', '.env', '.config', '.ini'];
    
    const scanDir = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDir(fullPath);
          } else if (entry.isFile() && 
                     (configExtensions.some(ext => entry.name.endsWith(ext)) ||
                      entry.name.includes('config'))) {
            files.push({
              path: fullPath,
              name: entry.name
            });
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    await scanDir(projectPath);
    return files;
  }
  
  async analyzePackageFiles(projectPath) {
    const packageInfo = {
      dependencies: [],
      devDependencies: []
    };
    
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(packageContent);
      
      packageInfo.dependencies = Object.keys(pkg.dependencies || {});
      packageInfo.devDependencies = Object.keys(pkg.devDependencies || {});
    } catch (error) {
      // package.json doesn't exist or is invalid
    }
    
    return packageInfo;
  }
  
  shouldSkipDirectory(name) {
    return ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(name);
  }
  
  isCodeFile(fileName) {
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.go', '.php', '.rb'];
    return codeExtensions.some(ext => fileName.endsWith(ext));
  }
  
  /**
   * Store results in shared memory
   */
  async storeResults(analysisId, results) {
    try {
      await this.sharedMemory.set(
        `security-analysis:${analysisId}`,
        results,
        {
          namespace: this.sharedMemory.namespaces?.TASK_RESULTS || 'task-results',
          dataType: this.sharedMemory.dataTypes?.PERSISTENT || 'persistent',
          ttl: 3600000 // 1 hour
        }
      );
    } catch (error) {
      console.warn('Failed to store security analysis results:', error);
    }
  }
  
  /**
   * Get analysis summary
   */
  getAnalysisSummary(result) {
    return {
      vulnerabilityCount: result.vulnerabilities.length,
      criticalIssues: result.vulnerabilities.filter(v => v.severity === 'critical').length,
      highIssues: result.vulnerabilities.filter(v => v.severity === 'high').length,
      owaspViolations: Object.values(result.owaspFindings).filter(f => f.detected).length,
      riskScore: result.riskScore,
      securityPracticesScore: Math.round(
        Object.values(result.practices).reduce((sum, p) => sum + p.score, 0) / 
        Object.keys(result.practices).length
      ),
      recommendationCount: result.recommendations.length
    };
  }
}

module.exports = SecurityAnalysisEngine;