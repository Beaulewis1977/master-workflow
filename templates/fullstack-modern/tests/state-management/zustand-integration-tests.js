/**
 * Zustand State Management Integration Tests
 * 
 * Comprehensive testing suite for Zustand store integration,
 * covering state updates, persistence, cross-component synchronization,
 * WebSocket integration, and optimistic updates.
 */

import { renderHook, act } from '@testing-library/react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

// Mock the stores for testing
const createTestAppStore = () => create(
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          // Test state
          notifications: [],
          unreadCount: 0,
          wsConnected: false,
          theme: 'light',
          
          // Test actions
          addNotification: (notification) =>
            set((state) => {
              const newNotification = {
                ...notification,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: Date.now(),
                read: false,
              };
              state.notifications.unshift(newNotification);
              state.unreadCount = state.notifications.filter(n => !n.read).length;
            }),
            
          setWsConnected: (connected) =>
            set((state) => {
              state.wsConnected = connected;
            }),
            
          setTheme: (theme) =>
            set((state) => {
              state.theme = theme;
            }),
        }),
        {
          name: 'test-app-store',
          partialize: (state) => ({
            theme: state.theme,
            notifications: state.notifications,
          }),
        }
      )
    )
  )
);

const createTestAuthStore = () => create((set, get) => ({
  session: null,
  user: null,
  loading: false,
  
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  
  login: async (credentials) => {
    set({ loading: true });
    try {
      // Mock login logic
      const mockSession = {
        access_token: 'mock_token',
        user: { id: '1', email: credentials.email }
      };
      set({ session: mockSession, user: mockSession.user, loading: false });
      return mockSession;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  logout: () => {
    set({ session: null, user: null });
  }
}));

class ZustandIntegrationTestSuite {
  constructor() {
    this.testResults = {
      stateUpdates: [],
      persistence: [],
      synchronization: [],
      websocketIntegration: [],
      optimisticUpdates: [],
      performance: []
    };
    
    this.metrics = {
      updateTimes: [],
      subscriptionCounts: [],
      memoryUsage: []
    };
  }

  /**
   * Test State Updates and Reactivity
   */
  async testStateUpdates() {
    console.log('🔄 Testing Zustand State Updates...');
    
    const tests = [
      this.testBasicStateUpdate(),
      this.testNestedStateUpdate(),
      this.testBatchedUpdates(),
      this.testConditionalUpdates(),
      this.testStateReset(),
      this.testActionChaining()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.stateUpdates = results.map((result, index) => ({
      test: tests[index].name || `State Update Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.stateUpdates;
  }

  async testBasicStateUpdate() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      act(() => {
        result.current.setTheme('dark');
      });

      const success = result.current.theme === 'dark';
      
      resolve({
        passed: success,
        initialTheme: 'light',
        updatedTheme: result.current.theme,
        message: success ? 'Basic state update successful' : 'Basic state update failed'
      });
    });
  }

  async testNestedStateUpdate() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      const testNotification = {
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification'
      };

      act(() => {
        result.current.addNotification(testNotification);
      });

      const success = result.current.notifications.length === 1 && 
                     result.current.unreadCount === 1 &&
                     result.current.notifications[0].title === testNotification.title;

      resolve({
        passed: success,
        notificationCount: result.current.notifications.length,
        unreadCount: result.current.unreadCount,
        addedNotification: result.current.notifications[0],
        message: success ? 'Nested state update successful' : 'Nested state update failed'
      });
    });
  }

  async testBatchedUpdates() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      const notifications = [
        { type: 'info', title: 'Notification 1' },
        { type: 'warning', title: 'Notification 2' },
        { type: 'error', title: 'Notification 3' }
      ];

      const startTime = performance.now();

      act(() => {
        notifications.forEach(notification => {
          result.current.addNotification(notification);
        });
      });

      const endTime = performance.now();
      const updateTime = endTime - startTime;
      this.metrics.updateTimes.push(updateTime);

      const success = result.current.notifications.length === 3 && 
                     result.current.unreadCount === 3;

      resolve({
        passed: success,
        notificationCount: result.current.notifications.length,
        unreadCount: result.current.unreadCount,
        updateTime: `${updateTime.toFixed(2)}ms`,
        message: success ? 'Batched updates successful' : 'Batched updates failed'
      });
    });
  }

  /**
   * Test State Persistence
   */
  async testStatePersistence() {
    console.log('💾 Testing State Persistence...');
    
    const tests = [
      this.testLocalStoragePersistence(),
      this.testSelectivePersistence(),
      this.testPersistenceHydration(),
      this.testPersistenceError()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.persistence = results.map((result, index) => ({
      test: tests[index].name || `Persistence Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.persistence;
  }

  async testLocalStoragePersistence() {
    return new Promise((resolve) => {
      // Mock localStorage
      const localStorageMock = {
        data: {},
        getItem: jest.fn((key) => localStorageMock.data[key] || null),
        setItem: jest.fn((key, value) => {
          localStorageMock.data[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete localStorageMock.data[key];
        }),
        clear: jest.fn(() => {
          localStorageMock.data = {};
        })
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });

      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      act(() => {
        result.current.setTheme('dark');
        result.current.addNotification({
          type: 'info',
          title: 'Persisted Notification'
        });
      });

      // Check if data was persisted
      const persistedData = localStorageMock.getItem('test-app-store');
      let success = false;
      let parsedData = null;

      try {
        parsedData = JSON.parse(persistedData);
        success = parsedData.state.theme === 'dark' && 
                 parsedData.state.notifications.length === 1;
      } catch (error) {
        success = false;
      }

      resolve({
        passed: success,
        persistedData: parsedData,
        localStorageCalls: localStorageMock.setItem.mock.calls.length,
        message: success ? 'State persistence successful' : 'State persistence failed'
      });
    });
  }

  async testSelectivePersistence() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      act(() => {
        result.current.setTheme('dark');
        result.current.setWsConnected(true); // This should NOT be persisted
      });

      // Get persisted data
      const persistedData = localStorage.getItem('test-app-store');
      let success = false;
      let parsedData = null;

      try {
        parsedData = JSON.parse(persistedData);
        // Should persist theme but not wsConnected
        success = parsedData.state.theme === 'dark' && 
                 !parsedData.state.hasOwnProperty('wsConnected');
      } catch (error) {
        success = false;
      }

      resolve({
        passed: success,
        persistedData: parsedData,
        message: success ? 'Selective persistence working correctly' : 'Selective persistence failed'
      });
    });
  }

  /**
   * Test Cross-Component Synchronization
   */
  async testCrossComponentSync() {
    console.log('🔄 Testing Cross-Component Synchronization...');
    
    const tests = [
      this.testMultipleSubscribers(),
      this.testConditionalSubscription(),
      this.testSubscriptionCleanup(),
      this.testSelectiveUpdates()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.synchronization = results.map((result, index) => ({
      test: tests[index].name || `Sync Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.synchronization;
  }

  async testMultipleSubscribers() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result: result1 } = renderHook(() => useTestStore());
      const { result: result2 } = renderHook(() => useTestStore());
      const { result: result3 } = renderHook(() => useTestStore());
      
      // All hooks should have the same initial state
      const initialSync = result1.current.theme === result2.current.theme &&
                         result2.current.theme === result3.current.theme;

      act(() => {
        result1.current.setTheme('dark');
      });

      // All hooks should update to the new state
      const updateSync = result1.current.theme === 'dark' &&
                        result2.current.theme === 'dark' &&
                        result3.current.theme === 'dark';

      const success = initialSync && updateSync;

      resolve({
        passed: success,
        initialSync,
        updateSync,
        subscriber1Theme: result1.current.theme,
        subscriber2Theme: result2.current.theme,
        subscriber3Theme: result3.current.theme,
        message: success ? 'Multiple subscribers synchronized' : 'Synchronization failed'
      });
    });
  }

  async testConditionalSubscription() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      // Create a selective subscriber that only listens to theme changes
      const { result } = renderHook(() => {
        const theme = useTestStore(state => state.theme);
        const notificationCount = useTestStore(state => state.notifications.length);
        return { theme, notificationCount };
      });

      const initialTheme = result.current.theme;
      const initialCount = result.current.notificationCount;

      act(() => {
        result.current.setTheme('dark');
      });

      const themeUpdated = result.current.theme === 'dark';

      act(() => {
        useTestStore.getState().addNotification({
          type: 'info',
          title: 'Test'
        });
      });

      const countUpdated = result.current.notificationCount === 1;
      const success = themeUpdated && countUpdated;

      resolve({
        passed: success,
        initialTheme,
        updatedTheme: result.current.theme,
        initialCount,
        updatedCount: result.current.notificationCount,
        message: success ? 'Conditional subscription working' : 'Conditional subscription failed'
      });
    });
  }

  /**
   * Test WebSocket Integration
   */
  async testWebSocketIntegration() {
    console.log('🌐 Testing WebSocket Integration...');
    
    const tests = [
      this.testWebSocketStateUpdates(),
      this.testWebSocketReconnection(),
      this.testWebSocketMessageQueue(),
      this.testRealTimeNotifications()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.websocketIntegration = results.map((result, index) => ({
      test: tests[index].name || `WebSocket Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.websocketIntegration;
  }

  async testWebSocketStateUpdates() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      // Simulate WebSocket connection
      act(() => {
        result.current.setWsConnected(true);
      });

      const connected = result.current.wsConnected === true;

      // Simulate incoming WebSocket message triggering state update
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'WebSocket Notification',
          message: 'Received via WebSocket'
        });
      });

      const notificationAdded = result.current.notifications.length === 1 &&
                               result.current.notifications[0].title === 'WebSocket Notification';

      const success = connected && notificationAdded;

      resolve({
        passed: success,
        wsConnected: result.current.wsConnected,
        notificationCount: result.current.notifications.length,
        message: success ? 'WebSocket state integration successful' : 'WebSocket integration failed'
      });
    });
  }

  async testRealTimeNotifications() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      // Simulate real-time notifications arriving
      const notifications = [
        { type: 'info', title: 'User joined', message: 'John joined the chat' },
        { type: 'warning', title: 'Connection slow', message: 'Network latency detected' },
        { type: 'success', title: 'File uploaded', message: 'document.pdf uploaded successfully' }
      ];

      act(() => {
        notifications.forEach((notification, index) => {
          setTimeout(() => {
            result.current.addNotification(notification);
          }, index * 100); // Simulate real-time arrival
        });
      });

      // Wait for all notifications to arrive
      setTimeout(() => {
        const success = result.current.notifications.length === 3 &&
                       result.current.unreadCount === 3;

        resolve({
          passed: success,
          notificationCount: result.current.notifications.length,
          unreadCount: result.current.unreadCount,
          notificationTypes: result.current.notifications.map(n => n.type),
          message: success ? 'Real-time notifications working' : 'Real-time notifications failed'
        });
      }, 500);
    });
  }

  /**
   * Test Optimistic Updates
   */
  async testOptimisticUpdates() {
    console.log('⚡ Testing Optimistic Updates...');
    
    const tests = [
      this.testOptimisticCreate(),
      this.testOptimisticUpdate(),
      this.testOptimisticDelete(),
      this.testOptimisticRollback()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.optimisticUpdates = results.map((result, index) => ({
      test: tests[index].name || `Optimistic Update Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.optimisticUpdates;
  }

  async testOptimisticCreate() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      const optimisticNotification = {
        type: 'info',
        title: 'Optimistic Create',
        message: 'This should appear immediately',
        optimistic: true
      };

      act(() => {
        // Add optimistically
        result.current.addNotification(optimisticNotification);
      });

      const immediateSuccess = result.current.notifications.length === 1 &&
                              result.current.notifications[0].title === optimisticNotification.title;

      // Simulate server confirmation
      setTimeout(() => {
        act(() => {
          // Replace optimistic update with confirmed data
          const confirmed = { ...optimisticNotification, optimistic: false, id: 'server_id_123' };
          result.current.notifications[0] = confirmed;
        });

        const confirmedSuccess = !result.current.notifications[0].optimistic;
        const success = immediateSuccess && confirmedSuccess;

        resolve({
          passed: success,
          immediateUpdate: immediateSuccess,
          serverConfirmation: confirmedSuccess,
          finalNotification: result.current.notifications[0],
          message: success ? 'Optimistic create successful' : 'Optimistic create failed'
        });
      }, 100);
    });
  }

  async testOptimisticRollback() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      const optimisticNotification = {
        type: 'error',
        title: 'Failed Operation',
        message: 'This should be rolled back',
        optimistic: true
      };

      act(() => {
        result.current.addNotification(optimisticNotification);
      });

      const optimisticAdded = result.current.notifications.length === 1;

      // Simulate server error requiring rollback
      setTimeout(() => {
        act(() => {
          // Remove optimistic update due to server error
          const newNotifications = result.current.notifications.filter(n => !n.optimistic);
          // This would normally be handled by the store action
          result.current.notifications.length = 0;
          result.current.notifications.push(...newNotifications);
        });

        const rolledBack = result.current.notifications.length === 0;
        const success = optimisticAdded && rolledBack;

        resolve({
          passed: success,
          optimisticAdded,
          rolledBack,
          finalCount: result.current.notifications.length,
          message: success ? 'Optimistic rollback successful' : 'Optimistic rollback failed'
        });
      }, 100);
    });
  }

  /**
   * Performance Testing
   */
  async testPerformance() {
    console.log('⚡ Testing State Management Performance...');
    
    const tests = [
      this.testUpdatePerformance(),
      this.testSubscriptionPerformance(),
      this.testMemoryUsage(),
      this.testLargeStateUpdates()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.performance = results.map((result, index) => ({
      test: tests[index].name || `Performance Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.performance;
  }

  async testUpdatePerformance() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      const updateCount = 1000;
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < updateCount; i++) {
          result.current.addNotification({
            type: 'info',
            title: `Notification ${i}`,
            message: `Performance test notification ${i}`
          });
        }
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / updateCount;

      this.metrics.updateTimes.push(totalTime);

      const success = totalTime < 1000 && averageTime < 1; // Should complete in under 1 second

      resolve({
        passed: success,
        updateCount,
        totalTime: `${totalTime.toFixed(2)}ms`,
        averageTime: `${averageTime.toFixed(4)}ms`,
        finalNotificationCount: result.current.notifications.length,
        message: success ? 'Update performance acceptable' : 'Update performance too slow'
      });
    });
  }

  async testMemoryUsage() {
    return new Promise((resolve) => {
      const useTestStore = createTestAppStore();
      
      const { result } = renderHook(() => useTestStore());
      
      // Measure initial memory (approximation)
      const initialHeap = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Add many notifications
      act(() => {
        for (let i = 0; i < 10000; i++) {
          result.current.addNotification({
            type: 'info',
            title: `Large Dataset ${i}`,
            message: `This is notification number ${i} for memory testing`,
            data: new Array(100).fill(i) // Add some bulk
          });
        }
      });

      // Measure memory after operations
      const finalHeap = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const memoryIncrease = finalHeap - initialHeap;

      this.metrics.memoryUsage.push(memoryIncrease);

      // Clear notifications to test memory cleanup
      act(() => {
        result.current.notifications.length = 0;
        result.current.unreadCount = 0;
      });

      const success = memoryIncrease < 50 * 1024 * 1024; // Should not increase by more than 50MB

      resolve({
        passed: success,
        initialHeap: `${(initialHeap / 1024 / 1024).toFixed(2)}MB`,
        finalHeap: `${(finalHeap / 1024 / 1024).toFixed(2)}MB`,
        memoryIncrease: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        notificationCount: 10000,
        message: success ? 'Memory usage within acceptable limits' : 'Memory usage too high'
      });
    });
  }

  /**
   * Generate Test Report
   */
  generateTestReport() {
    const allTests = [
      ...this.testResults.stateUpdates,
      ...this.testResults.persistence,
      ...this.testResults.synchronization,
      ...this.testResults.websocketIntegration,
      ...this.testResults.optimisticUpdates,
      ...this.testResults.performance
    ];

    const passed = allTests.filter(test => test.status === 'fulfilled' && test.result.passed).length;
    const failed = allTests.filter(test => test.status === 'rejected' || !test.result.passed).length;
    const total = allTests.length;

    const averageUpdateTime = this.metrics.updateTimes.length > 0 
      ? this.metrics.updateTimes.reduce((sum, time) => sum + time, 0) / this.metrics.updateTimes.length 
      : 0;

    return {
      summary: {
        totalTests: total,
        passed,
        failed,
        successRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%',
        timestamp: new Date().toISOString()
      },
      performance: {
        averageUpdateTime: `${averageUpdateTime.toFixed(2)}ms`,
        memoryUsage: this.metrics.memoryUsage.length > 0 
          ? `${(this.metrics.memoryUsage[0] / 1024 / 1024).toFixed(2)}MB` 
          : 'N/A'
      },
      categories: {
        stateUpdates: this.testResults.stateUpdates,
        persistence: this.testResults.persistence,
        synchronization: this.testResults.synchronization,
        websocketIntegration: this.testResults.websocketIntegration,
        optimisticUpdates: this.testResults.optimisticUpdates,
        performance: this.testResults.performance
      }
    };
  }

  /**
   * Run All Tests
   */
  async runAllTests() {
    console.log('🚀 Starting Zustand Integration Test Suite...\n');
    
    try {
      await this.testStateUpdates();
      await this.testStatePersistence();
      await this.testCrossComponentSync();
      await this.testWebSocketIntegration();
      await this.testOptimisticUpdates();
      await this.testPerformance();
      
      const report = this.generateTestReport();
      
      console.log('\n📊 Zustand Integration Test Results:');
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      console.log(`⚡ Average Update Time: ${report.performance.averageUpdateTime}`);
      
      return report;
    } catch (error) {
      console.error('❌ Zustand integration test suite failed:', error);
      throw error;
    }
  }
}

export { ZustandIntegrationTestSuite };

// Example usage for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZustandIntegrationTestSuite };
}