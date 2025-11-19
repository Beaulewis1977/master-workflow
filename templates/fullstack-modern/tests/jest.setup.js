/**
 * Jest Setup for Fullstack Modern Template Tests
 * 
 * Global test configuration and setup for Jest test environment.
 */

import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true
  }))
}));

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10, // 10MB
      totalJSHeapSize: 1024 * 1024 * 50, // 50MB
      jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
    },
    now: jest.fn(() => Date.now())
  }
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Only log actual errors, not React warnings
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning:')
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Filter out known warnings
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('componentWillReceiveProps') ||
     args[0].includes('componentWillUpdate'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Global test timeout
jest.setTimeout(30000);

// Setup and teardown for each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset fetch mock
  fetch.mockClear();
});

afterEach(() => {
  // Cleanup any pending timers
  jest.clearAllTimers();
  
  // Reset modules
  jest.resetModules();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests
});

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveValidJWT(received) {
    const pass = typeof received === 'string' && 
                 received.split('.').length === 3;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },
  
  toBeValidWebSocketMessage(received) {
    const pass = received && 
                 typeof received === 'object' &&
                 received.type &&
                 received.timestamp;
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid WebSocket message`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid WebSocket message`,
        pass: false,
      };
    }
  }
});

// Export test utilities
export const testUtils = {
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  // Create mock auth session
  createMockSession: (overrides = {}) => ({
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    expires_in: 3600,
    user: testUtils.createMockUser(),
    ...overrides
  }),
  
  // Create mock WebSocket message
  createMockWebSocketMessage: (type, data, overrides = {}) => ({
    type,
    data,
    timestamp: Date.now(),
    ...overrides
  }),
  
  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock API response
  mockApiResponse: (data, status = 200) => {
    fetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(data),
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
      headers: new Map([
        ['content-type', 'application/json']
      ])
    });
  },
  
  // Mock API error
  mockApiError: (error, status = 500) => {
    fetch.mockRejectedValueOnce({
      response: {
        status,
        data: error
      },
      message: error.message || 'API Error'
    });
  }
};

// Make test utilities globally available
global.testUtils = testUtils;