/**
 * Authentication Flow Test Automation for Fullstack Modern Template
 * 
 * Comprehensive testing for user registration, login flows, JWT token management,
 * OAuth provider integration, session management, multi-factor authentication,
 * and security validation.
 */

const { test, expect } = require('@playwright/test');
const axios = require('axios');
const jwt = require('jsonwebtoken');

class AuthenticationFlowTestSuite {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:3000',
      apiURL: config.apiURL || 'http://localhost:8000',
      timeout: config.timeout || 30000,
      supabaseURL: config.supabaseURL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: config.supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ...config
    };

    this.testResults = {
      registration: [],
      login: [],
      tokenManagement: [],
      oauth: [],
      sessionManagement: [],
      mfa: [],
      security: []
    };

    this.testUsers = {
      valid: {
        email: 'test.user@example.com',
        password: 'SecurePassword123!',
        name: 'Test User'
      },
      weak: {
        email: 'weak@example.com',
        password: '123',
        name: 'Weak User'
      },
      duplicate: {
        email: 'duplicate@example.com',
        password: 'Password123!',
        name: 'Duplicate User'
      }
    };

    this.apiClient = axios.create({
      baseURL: this.config.apiURL,
      timeout: this.config.timeout
    });
  }

  /**
   * User Registration Flow Tests
   */
  async testUserRegistration() {
    console.log('📝 Testing User Registration Flows...');

    const tests = [
      this.testValidRegistration(),
      this.testInvalidEmailRegistration(),
      this.testWeakPasswordRegistration(),
      this.testDuplicateEmailRegistration(),
      this.testRegistrationValidation(),
      this.testEmailVerification()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.registration = results.map((result, index) => ({
      test: tests[index].name || `Registration Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.registration;
  }

  async testValidRegistration() {
    const testUser = {
      ...this.testUsers.valid,
      email: `valid.${Date.now()}@example.com`
    };

    try {
      const response = await this.apiClient.post('/api/auth/register', testUser);
      
      const success = response.status === 201 && 
                     response.data.user && 
                     response.data.user.email === testUser.email;

      // Clean up created user
      if (success && response.data.user.id) {
        try {
          await this.apiClient.delete(`/api/users/${response.data.user.id}`);
        } catch (cleanupError) {
          console.warn('Failed to clean up test user:', cleanupError.message);
        }
      }

      return {
        passed: success,
        status: response.status,
        userId: response.data.user?.id,
        email: response.data.user?.email,
        hasToken: !!response.data.access_token,
        emailVerificationSent: !!response.data.email_verification_sent,
        message: success ? 'Valid registration successful' : 'Valid registration failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        message: 'Valid registration failed with error'
      };
    }
  }

  async testInvalidEmailRegistration() {
    const invalidEmails = [
      'invalid-email',
      'test@',
      '@example.com',
      'test..test@example.com',
      'test@.com',
      ''
    ];

    const results = [];

    for (const email of invalidEmails) {
      try {
        const response = await this.apiClient.post('/api/auth/register', {
          email,
          password: 'ValidPassword123!',
          name: 'Test User'
        });

        results.push({
          email,
          passed: false, // Should have failed
          status: response.status,
          unexpectedSuccess: true
        });
      } catch (error) {
        const expectedError = error.response?.status === 400 || error.response?.status === 422;
        results.push({
          email,
          passed: expectedError,
          status: error.response?.status,
          error: error.response?.data?.message
        });
      }
    }

    const allPassed = results.every(result => result.passed);

    return {
      passed: allPassed,
      testResults: results,
      testedEmails: invalidEmails.length,
      passedTests: results.filter(r => r.passed).length,
      message: allPassed ? 'Invalid email validation working' : 'Invalid email validation has issues'
    };
  }

  async testWeakPasswordRegistration() {
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'qwerty',
      'abc123',
      ''
    ];

    const results = [];

    for (const password of weakPasswords) {
      try {
        const response = await this.apiClient.post('/api/auth/register', {
          email: `test.${Date.now()}@example.com`,
          password,
          name: 'Test User'
        });

        results.push({
          password: password || '[empty]',
          passed: false, // Should have failed
          status: response.status,
          unexpectedSuccess: true
        });
      } catch (error) {
        const expectedError = error.response?.status === 400 || error.response?.status === 422;
        results.push({
          password: password || '[empty]',
          passed: expectedError,
          status: error.response?.status,
          error: error.response?.data?.message
        });
      }
    }

    const allPassed = results.every(result => result.passed);

    return {
      passed: allPassed,
      testResults: results,
      testedPasswords: weakPasswords.length,
      passedTests: results.filter(r => r.passed).length,
      message: allPassed ? 'Weak password validation working' : 'Weak password validation has issues'
    };
  }

  /**
   * Login Flow Tests
   */
  async testLoginFlows() {
    console.log('🔑 Testing Login Flows...');

    const tests = [
      this.testValidLogin(),
      this.testInvalidCredentials(),
      this.testAccountLockout(),
      this.testRememberMe(),
      this.testLoginRateLimit(),
      this.testPasswordRecovery()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.login = results.map((result, index) => ({
      test: tests[index].name || `Login Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.login;
  }

  async testValidLogin() {
    // First, create a test user
    const testUser = {
      email: `login.test.${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Login Test User'
    };

    try {
      // Register user
      await this.apiClient.post('/api/auth/register', testUser);

      // Attempt login
      const loginResponse = await this.apiClient.post('/api/auth/login', {
        email: testUser.email,
        password: testUser.password
      });

      const success = loginResponse.status === 200 && 
                     loginResponse.data.access_token &&
                     loginResponse.data.user &&
                     loginResponse.data.user.email === testUser.email;

      // Validate token structure
      let tokenValid = false;
      try {
        const decoded = jwt.decode(loginResponse.data.access_token);
        tokenValid = decoded && decoded.sub && decoded.exp;
      } catch (tokenError) {
        tokenValid = false;
      }

      return {
        passed: success && tokenValid,
        status: loginResponse.status,
        hasAccessToken: !!loginResponse.data.access_token,
        hasRefreshToken: !!loginResponse.data.refresh_token,
        tokenValid,
        user: loginResponse.data.user,
        expiresIn: loginResponse.data.expires_in,
        message: success && tokenValid ? 'Valid login successful' : 'Valid login failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        message: 'Valid login failed with error'
      };
    }
  }

  async testInvalidCredentials() {
    const invalidCredentials = [
      { email: 'nonexistent@example.com', password: 'AnyPassword123!' },
      { email: this.testUsers.valid.email, password: 'WrongPassword123!' },
      { email: '', password: 'ValidPassword123!' },
      { email: 'test@example.com', password: '' },
      { email: '', password: '' }
    ];

    const results = [];

    for (const credentials of invalidCredentials) {
      try {
        const response = await this.apiClient.post('/api/auth/login', credentials);

        results.push({
          credentials: { email: credentials.email || '[empty]', password: '[hidden]' },
          passed: false, // Should have failed
          status: response.status,
          unexpectedSuccess: true
        });
      } catch (error) {
        const expectedError = error.response?.status === 401 || 
                             error.response?.status === 400 ||
                             error.response?.status === 422;
        results.push({
          credentials: { email: credentials.email || '[empty]', password: '[hidden]' },
          passed: expectedError,
          status: error.response?.status,
          error: error.response?.data?.message
        });
      }
    }

    const allPassed = results.every(result => result.passed);

    return {
      passed: allPassed,
      testResults: results,
      testedCredentials: invalidCredentials.length,
      passedTests: results.filter(r => r.passed).length,
      message: allPassed ? 'Invalid credentials properly rejected' : 'Invalid credentials validation has issues'
    };
  }

  async testAccountLockout() {
    const testEmail = `lockout.test.${Date.now()}@example.com`;
    const validPassword = 'SecurePassword123!';
    const wrongPassword = 'WrongPassword123!';

    try {
      // Create test user
      await this.apiClient.post('/api/auth/register', {
        email: testEmail,
        password: validPassword,
        name: 'Lockout Test User'
      });

      // Attempt multiple failed logins
      const maxAttempts = 5;
      const failedAttempts = [];

      for (let i = 0; i < maxAttempts; i++) {
        try {
          await this.apiClient.post('/api/auth/login', {
            email: testEmail,
            password: wrongPassword
          });
          failedAttempts.push({ attempt: i + 1, locked: false });
        } catch (error) {
          failedAttempts.push({ 
            attempt: i + 1, 
            status: error.response?.status,
            locked: error.response?.status === 423 || // Account locked
                   error.response?.data?.message?.includes('locked')
          });
        }
      }

      // Try with correct password after lockout
      let lockedOut = false;
      try {
        await this.apiClient.post('/api/auth/login', {
          email: testEmail,
          password: validPassword
        });
      } catch (error) {
        lockedOut = error.response?.status === 423 ||
                   error.response?.data?.message?.includes('locked');
      }

      const lockoutTriggered = failedAttempts.some(attempt => attempt.locked) || lockedOut;

      return {
        passed: lockoutTriggered,
        failedAttempts,
        lockedOutAfterValidAttempt: lockedOut,
        maxAttempts,
        lockoutTriggered,
        message: lockoutTriggered ? 'Account lockout working correctly' : 'Account lockout may not be configured'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        message: 'Account lockout test failed with error'
      };
    }
  }

  /**
   * JWT Token Management Tests
   */
  async testJWTTokenManagement() {
    console.log('🎟️ Testing JWT Token Management...');

    const tests = [
      this.testTokenValidation(),
      this.testTokenExpiration(),
      this.testTokenRefresh(),
      this.testTokenRevocation(),
      this.testTokenClaims(),
      this.testTokenSecurity()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.tokenManagement = results.map((result, index) => ({
      test: tests[index].name || `Token Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.tokenManagement;
  }

  async testTokenValidation() {
    // Get a valid token first
    const testUser = {
      email: `token.test.${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Token Test User'
    };

    try {
      // Register and login
      await this.apiClient.post('/api/auth/register', testUser);
      const loginResponse = await this.apiClient.post('/api/auth/login', testUser);
      const validToken = loginResponse.data.access_token;

      // Test valid token
      const validResponse = await this.apiClient.get('/api/auth/validate', {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      const validTokenWorks = validResponse.status === 200;

      // Test invalid tokens
      const invalidTokens = [
        'invalid.token.here',
        'Bearer invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        ''
      ];

      const invalidResults = [];

      for (const token of invalidTokens) {
        try {
          const response = await this.apiClient.get('/api/auth/validate', {
            headers: { Authorization: token ? `Bearer ${token}` : '' }
          });
          invalidResults.push({
            token: token || '[empty]',
            passed: false, // Should have failed
            status: response.status
          });
        } catch (error) {
          const expectedError = error.response?.status === 401 || error.response?.status === 403;
          invalidResults.push({
            token: token || '[empty]',
            passed: expectedError,
            status: error.response?.status
          });
        }
      }

      const allInvalidPassed = invalidResults.every(result => result.passed);
      const success = validTokenWorks && allInvalidPassed;

      return {
        passed: success,
        validTokenValidation: validTokenWorks,
        invalidTokenResults: invalidResults,
        decodedToken: jwt.decode(validToken),
        message: success ? 'Token validation working correctly' : 'Token validation has issues'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Token validation test failed with error'
      };
    }
  }

  async testTokenRefresh() {
    const testUser = {
      email: `refresh.test.${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Refresh Test User'
    };

    try {
      // Register and login
      await this.apiClient.post('/api/auth/register', testUser);
      const loginResponse = await this.apiClient.post('/api/auth/login', testUser);
      
      const originalToken = loginResponse.data.access_token;
      const refreshToken = loginResponse.data.refresh_token;

      if (!refreshToken) {
        return {
          passed: false,
          message: 'No refresh token provided in login response'
        };
      }

      // Use refresh token to get new access token
      const refreshResponse = await this.apiClient.post('/api/auth/refresh', {
        refresh_token: refreshToken
      });

      const newToken = refreshResponse.data.access_token;
      const tokenRefreshed = refreshResponse.status === 200 && 
                            newToken && 
                            newToken !== originalToken;

      // Validate new token works
      let newTokenValid = false;
      try {
        const validateResponse = await this.apiClient.get('/api/auth/validate', {
          headers: { Authorization: `Bearer ${newToken}` }
        });
        newTokenValid = validateResponse.status === 200;
      } catch (validateError) {
        newTokenValid = false;
      }

      const success = tokenRefreshed && newTokenValid;

      return {
        passed: success,
        tokenRefreshed,
        newTokenValid,
        originalTokenLength: originalToken?.length,
        newTokenLength: newToken?.length,
        tokensAreDifferent: originalToken !== newToken,
        message: success ? 'Token refresh working correctly' : 'Token refresh failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Token refresh test failed with error'
      };
    }
  }

  /**
   * OAuth Provider Integration Tests
   */
  async testOAuthIntegration() {
    console.log('🔗 Testing OAuth Provider Integration...');

    const tests = [
      this.testGoogleOAuth(),
      this.testGitHubOAuth(),
      this.testOAuthErrorHandling(),
      this.testOAuthAccountLinking()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.oauth = results.map((result, index) => ({
      test: tests[index].name || `OAuth Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.oauth;
  }

  async testGoogleOAuth() {
    try {
      // Test OAuth configuration endpoint
      const configResponse = await this.apiClient.get('/api/auth/oauth/google/config');
      
      const hasConfig = configResponse.status === 200 && 
                       configResponse.data.client_id &&
                       configResponse.data.redirect_uri;

      // Test OAuth initiation endpoint
      const initiateResponse = await this.apiClient.get('/api/auth/oauth/google/initiate');
      
      const hasInitiate = initiateResponse.status === 200 && 
                         (initiateResponse.data.auth_url || initiateResponse.data.authorization_url);

      const success = hasConfig && hasInitiate;

      return {
        passed: success,
        configurationAvailable: hasConfig,
        initiationAvailable: hasInitiate,
        clientId: configResponse.data?.client_id ? '[configured]' : '[missing]',
        authUrl: initiateResponse.data?.auth_url || initiateResponse.data?.authorization_url,
        message: success ? 'Google OAuth configuration available' : 'Google OAuth configuration incomplete'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Google OAuth test failed - may not be configured'
      };
    }
  }

  async testGitHubOAuth() {
    try {
      // Test GitHub OAuth configuration
      const configResponse = await this.apiClient.get('/api/auth/oauth/github/config');
      
      const hasConfig = configResponse.status === 200 && 
                       configResponse.data.client_id;

      const initiateResponse = await this.apiClient.get('/api/auth/oauth/github/initiate');
      
      const hasInitiate = initiateResponse.status === 200 && 
                         initiateResponse.data.auth_url;

      const success = hasConfig && hasInitiate;

      return {
        passed: success,
        configurationAvailable: hasConfig,
        initiationAvailable: hasInitiate,
        clientId: configResponse.data?.client_id ? '[configured]' : '[missing]',
        message: success ? 'GitHub OAuth configuration available' : 'GitHub OAuth configuration incomplete'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'GitHub OAuth test failed - may not be configured'
      };
    }
  }

  /**
   * Session Management Tests
   */
  async testSessionManagement() {
    console.log('🎯 Testing Session Management...');

    const tests = [
      this.testSessionCreation(),
      this.testSessionValidation(),
      this.testSessionTimeout(),
      this.testConcurrentSessions(),
      this.testSessionTermination()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.sessionManagement = results.map((result, index) => ({
      test: tests[index].name || `Session Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.sessionManagement;
  }

  async testSessionCreation() {
    const testUser = {
      email: `session.test.${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Session Test User'
    };

    try {
      // Register and login
      await this.apiClient.post('/api/auth/register', testUser);
      const loginResponse = await this.apiClient.post('/api/auth/login', testUser);

      // Check if session info is provided
      const hasSessionId = !!loginResponse.data.session_id;
      const hasSessionExpiry = !!loginResponse.data.session_expires;
      const hasUserInfo = !!loginResponse.data.user;

      // Test session validation
      let sessionValid = false;
      if (hasSessionId) {
        try {
          const sessionResponse = await this.apiClient.get(`/api/auth/session/${loginResponse.data.session_id}`, {
            headers: { Authorization: `Bearer ${loginResponse.data.access_token}` }
          });
          sessionValid = sessionResponse.status === 200;
        } catch (sessionError) {
          sessionValid = false;
        }
      }

      const success = hasSessionId && hasUserInfo && sessionValid;

      return {
        passed: success,
        sessionId: hasSessionId ? '[created]' : '[missing]',
        sessionExpiry: hasSessionExpiry ? loginResponse.data.session_expires : '[missing]',
        userInfo: hasUserInfo,
        sessionValidation: sessionValid,
        message: success ? 'Session creation working correctly' : 'Session creation has issues'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Session creation test failed with error'
      };
    }
  }

  async testConcurrentSessions() {
    const testUser = {
      email: `concurrent.session.${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Concurrent Session Test User'
    };

    try {
      // Register user
      await this.apiClient.post('/api/auth/register', testUser);

      // Create multiple sessions
      const sessionCount = 3;
      const sessions = [];

      for (let i = 0; i < sessionCount; i++) {
        const loginResponse = await this.apiClient.post('/api/auth/login', testUser);
        sessions.push({
          token: loginResponse.data.access_token,
          sessionId: loginResponse.data.session_id
        });
      }

      // Validate all sessions are active
      const sessionValidations = [];
      
      for (const session of sessions) {
        try {
          const validateResponse = await this.apiClient.get('/api/auth/validate', {
            headers: { Authorization: `Bearer ${session.token}` }
          });
          sessionValidations.push({
            sessionId: session.sessionId,
            valid: validateResponse.status === 200
          });
        } catch (error) {
          sessionValidations.push({
            sessionId: session.sessionId,
            valid: false,
            error: error.message
          });
        }
      }

      const allSessionsValid = sessionValidations.every(validation => validation.valid);
      const validSessionCount = sessionValidations.filter(v => v.valid).length;

      return {
        passed: allSessionsValid,
        createdSessions: sessionCount,
        validSessions: validSessionCount,
        sessionValidations,
        message: allSessionsValid ? 'Concurrent sessions working correctly' : 'Concurrent sessions have issues'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Concurrent sessions test failed with error'
      };
    }
  }

  /**
   * Security Validation Tests
   */
  async testSecurityValidation() {
    console.log('🔒 Testing Security Validation...');

    const tests = [
      this.testPasswordStrengthEnforcement(),
      this.testSQLInjectionPrevention(),
      this.testXSSPrevention(),
      this.testCSRFProtection(),
      this.testBruteForceProtection()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.security = results.map((result, index) => ({
      test: tests[index].name || `Security Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.security;
  }

  async testPasswordStrengthEnforcement() {
    const passwordTests = [
      { password: 'Secure123!', shouldPass: true, description: 'Strong password' },
      { password: 'weak', shouldPass: false, description: 'Too short' },
      { password: 'onlylowercase', shouldPass: false, description: 'No uppercase/numbers' },
      { password: 'ONLYUPPERCASE', shouldPass: false, description: 'No lowercase/numbers' },
      { password: 'NoSpecialChars123', shouldPass: false, description: 'No special characters' },
      { password: 'NoNumbers!', shouldPass: false, description: 'No numbers' }
    ];

    const results = [];

    for (const passwordTest of passwordTests) {
      try {
        const response = await this.apiClient.post('/api/auth/register', {
          email: `pwd.test.${Date.now()}@example.com`,
          password: passwordTest.password,
          name: 'Password Test User'
        });

        const actualResult = response.status === 201;
        results.push({
          ...passwordTest,
          passed: actualResult === passwordTest.shouldPass,
          actualResult,
          status: response.status
        });
      } catch (error) {
        const actualResult = false; // Registration failed
        results.push({
          ...passwordTest,
          passed: actualResult === passwordTest.shouldPass,
          actualResult,
          status: error.response?.status,
          error: error.response?.data?.message
        });
      }
    }

    const allPassed = results.every(result => result.passed);

    return {
      passed: allPassed,
      testResults: results,
      testedPasswords: passwordTests.length,
      passedTests: results.filter(r => r.passed).length,
      message: allPassed ? 'Password strength enforcement working' : 'Password strength enforcement has issues'
    };
  }

  async testSQLInjectionPrevention() {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; UPDATE users SET password = 'hacked' WHERE id = 1; --",
      "' UNION SELECT * FROM users --",
      "admin'--"
    ];

    const results = [];

    for (const payload of sqlInjectionPayloads) {
      try {
        const response = await this.apiClient.post('/api/auth/login', {
          email: payload,
          password: 'anypassword'
        });

        results.push({
          payload,
          passed: false, // Should not succeed
          status: response.status,
          unexpectedSuccess: true
        });
      } catch (error) {
        const properlyBlocked = error.response?.status === 400 || 
                               error.response?.status === 401 ||
                               error.response?.status === 422;
        results.push({
          payload,
          passed: properlyBlocked,
          status: error.response?.status,
          error: error.response?.data?.message
        });
      }
    }

    const allPassed = results.every(result => result.passed);

    return {
      passed: allPassed,
      testResults: results,
      testedPayloads: sqlInjectionPayloads.length,
      blockedPayloads: results.filter(r => r.passed).length,
      message: allPassed ? 'SQL injection prevention working' : 'SQL injection prevention may have vulnerabilities'
    };
  }

  /**
   * Generate Comprehensive Test Report
   */
  generateTestReport() {
    const allTests = [
      ...this.testResults.registration,
      ...this.testResults.login,
      ...this.testResults.tokenManagement,
      ...this.testResults.oauth,
      ...this.testResults.sessionManagement,
      ...this.testResults.mfa,
      ...this.testResults.security
    ];

    const passed = allTests.filter(test => test.status === 'fulfilled' && test.result.passed).length;
    const failed = allTests.filter(test => test.status === 'rejected' || !test.result.passed).length;
    const total = allTests.length;

    return {
      summary: {
        totalTests: total,
        passed,
        failed,
        successRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%',
        timestamp: new Date().toISOString()
      },
      categories: {
        registration: this.testResults.registration,
        login: this.testResults.login,
        tokenManagement: this.testResults.tokenManagement,
        oauth: this.testResults.oauth,
        sessionManagement: this.testResults.sessionManagement,
        mfa: this.testResults.mfa,
        security: this.testResults.security
      },
      recommendations: this.generateRecommendations(allTests)
    };
  }

  generateRecommendations(tests) {
    const recommendations = [];
    
    const failedTests = tests.filter(test => test.status === 'rejected' || !test.result.passed);
    
    if (failedTests.length > 0) {
      recommendations.push('Review failed authentication tests and fix security issues');
    }
    
    const securityTests = this.testResults.security;
    if (securityTests.some(test => !test.result?.passed)) {
      recommendations.push('Address security vulnerabilities in authentication system');
    }
    
    const oauthTests = this.testResults.oauth;
    if (oauthTests.some(test => !test.result?.passed)) {
      recommendations.push('Configure OAuth providers or fix OAuth integration issues');
    }
    
    const tokenTests = this.testResults.tokenManagement;
    if (tokenTests.some(test => !test.result?.passed)) {
      recommendations.push('Fix JWT token management and validation issues');
    }
    
    return recommendations;
  }

  /**
   * Run All Authentication Tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Authentication Flow Test Suite...\n');
    
    try {
      await this.testUserRegistration();
      await this.testLoginFlows();
      await this.testJWTTokenManagement();
      await this.testOAuthIntegration();
      await this.testSessionManagement();
      await this.testSecurityValidation();
      
      const report = this.generateTestReport();
      
      console.log('\n📊 Authentication Flow Test Results:');
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      return report;
    } catch (error) {
      console.error('❌ Authentication flow test suite failed:', error);
      throw error;
    }
  }
}

module.exports = { AuthenticationFlowTestSuite };

// Example usage
if (require.main === module) {
  const testSuite = new AuthenticationFlowTestSuite({
    baseURL: process.env.APP_URL || 'http://localhost:3000',
    apiURL: process.env.API_URL || 'http://localhost:8000',
    timeout: 30000
  });

  testSuite.runAllTests()
    .then(report => {
      console.log('\n📄 Full test report saved to auth-flow-test-report.json');
      require('fs').writeFileSync(
        'auth-flow-test-report.json',
        JSON.stringify(report, null, 2)
      );
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}