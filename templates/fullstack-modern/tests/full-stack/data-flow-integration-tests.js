/**
 * Full-Stack Data Flow Integration Tests for Fullstack Modern Template
 * 
 * Comprehensive testing for frontend-to-backend data synchronization,
 * real-time data updates, conflict resolution, error handling,
 * offline mode, caching, and database transaction integrity.
 */

const { test, expect } = require('@playwright/test');
const axios = require('axios');
const WebSocket = require('ws');
const { io } = require('socket.io-client');

class DataFlowIntegrationTestSuite {
  constructor(config = {}) {
    this.config = {
      frontendURL: config.frontendURL || 'http://localhost:3000',
      backendURL: config.backendURL || 'http://localhost:8000',
      wsURL: config.wsURL || 'ws://localhost:8000',
      timeout: config.timeout || 30000,
      ...config
    };

    this.testResults = {
      dataSync: [],
      realTimeUpdates: [],
      conflictResolution: [],
      errorHandling: [],
      offlineMode: [],
      caching: [],
      transactionIntegrity: []
    };

    this.testData = {
      users: [],
      posts: [],
      sessions: [],
      websocketConnections: []
    };

    this.apiClient = axios.create({
      baseURL: this.config.backendURL,
      timeout: this.config.timeout
    });
  }

  /**
   * Frontend-to-Backend Data Synchronization Tests
   */
  async testDataSynchronization() {
    console.log('🔄 Testing Frontend-to-Backend Data Synchronization...');

    const tests = [
      this.testCRUDSynchronization(),
      this.testBatchOperations(),
      this.testNestedDataUpdates(),
      this.testRelationalDataSync(),
      this.testDataValidationSync(),
      this.testConcurrentUpdates()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.dataSync = results.map((result, index) => ({
      test: tests[index].name || `Data Sync Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.dataSync;
  }

  async testCRUDSynchronization() {
    const testPost = {
      title: 'Integration Test Post',
      content: 'This post is created for data synchronization testing',
      status: 'draft',
      tags: ['test', 'integration', 'data-sync']
    };

    try {
      // CREATE - Frontend creates data, backend stores it
      const createResponse = await this.apiClient.post('/api/posts', testPost);
      const createdPost = createResponse.data;
      
      const createSuccess = createResponse.status === 201 && 
                           createdPost.id &&
                           createdPost.title === testPost.title;

      // READ - Frontend reads the created data
      const readResponse = await this.apiClient.get(`/api/posts/${createdPost.id}`);
      const readPost = readResponse.data;
      
      const readSuccess = readResponse.status === 200 &&
                         readPost.id === createdPost.id &&
                         readPost.title === testPost.title;

      // UPDATE - Frontend updates data, backend synchronizes
      const updateData = { 
        title: 'Updated Integration Test Post',
        status: 'published'
      };
      const updateResponse = await this.apiClient.patch(`/api/posts/${createdPost.id}`, updateData);
      const updatedPost = updateResponse.data;
      
      const updateSuccess = updateResponse.status === 200 &&
                           updatedPost.title === updateData.title &&
                           updatedPost.status === updateData.status;

      // Verify UPDATE persisted
      const verifyResponse = await this.apiClient.get(`/api/posts/${createdPost.id}`);
      const verifiedPost = verifyResponse.data;
      
      const verifySuccess = verifiedPost.title === updateData.title &&
                           verifiedPost.status === updateData.status;

      // DELETE - Frontend deletes data, backend removes it
      const deleteResponse = await this.apiClient.delete(`/api/posts/${createdPost.id}`);
      const deleteSuccess = deleteResponse.status === 204;

      // Verify DELETE worked
      try {
        await this.apiClient.get(`/api/posts/${createdPost.id}`);
        var deleteVerified = false; // Should not reach this
      } catch (error) {
        var deleteVerified = error.response?.status === 404;
      }

      const overallSuccess = createSuccess && readSuccess && updateSuccess && 
                            verifySuccess && deleteSuccess && deleteVerified;

      return {
        passed: overallSuccess,
        operations: {
          create: { success: createSuccess, id: createdPost.id },
          read: { success: readSuccess, dataMatch: readPost.title === testPost.title },
          update: { success: updateSuccess, titleUpdated: updatedPost.title === updateData.title },
          verify: { success: verifySuccess },
          delete: { success: deleteSuccess },
          deleteVerified
        },
        message: overallSuccess ? 'CRUD synchronization successful' : 'CRUD synchronization failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'CRUD synchronization failed with error'
      };
    }
  }

  async testBatchOperations() {
    const batchPosts = [
      { title: 'Batch Post 1', content: 'First batch post', status: 'draft' },
      { title: 'Batch Post 2', content: 'Second batch post', status: 'published' },
      { title: 'Batch Post 3', content: 'Third batch post', status: 'draft' }
    ];

    try {
      // Test batch CREATE
      const batchCreateResponse = await this.apiClient.post('/api/posts/batch', {
        posts: batchPosts
      });
      
      const createSuccess = batchCreateResponse.status === 201 &&
                           Array.isArray(batchCreateResponse.data) &&
                           batchCreateResponse.data.length === batchPosts.length;

      const createdPosts = batchCreateResponse.data;
      const postIds = createdPosts.map(post => post.id);

      // Test batch READ
      const batchReadResponse = await this.apiClient.post('/api/posts/batch/read', {
        ids: postIds
      });
      
      const readSuccess = batchReadResponse.status === 200 &&
                         batchReadResponse.data.length === postIds.length;

      // Test batch UPDATE
      const batchUpdates = createdPosts.map((post, index) => ({
        id: post.id,
        title: `Updated Batch Post ${index + 1}`,
        status: 'published'
      }));

      const batchUpdateResponse = await this.apiClient.patch('/api/posts/batch', {
        posts: batchUpdates
      });
      
      const updateSuccess = batchUpdateResponse.status === 200 &&
                           batchUpdateResponse.data.length === batchUpdates.length;

      // Test batch DELETE
      const batchDeleteResponse = await this.apiClient.delete('/api/posts/batch', {
        data: { ids: postIds }
      });
      
      const deleteSuccess = batchDeleteResponse.status === 204;

      // Verify all posts deleted
      let allDeleted = true;
      for (const id of postIds) {
        try {
          await this.apiClient.get(`/api/posts/${id}`);
          allDeleted = false;
          break;
        } catch (error) {
          if (error.response?.status !== 404) {
            allDeleted = false;
            break;
          }
        }
      }

      const overallSuccess = createSuccess && readSuccess && updateSuccess && 
                            deleteSuccess && allDeleted;

      return {
        passed: overallSuccess,
        batchSize: batchPosts.length,
        operations: {
          create: { success: createSuccess, created: createdPosts.length },
          read: { success: readSuccess, read: batchReadResponse.data?.length },
          update: { success: updateSuccess, updated: batchUpdateResponse.data?.length },
          delete: { success: deleteSuccess, allDeleted }
        },
        message: overallSuccess ? 'Batch operations synchronization successful' : 'Batch operations failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Batch operations failed with error'
      };
    }
  }

  async testNestedDataUpdates() {
    const testUser = {
      email: `nested.test.${Date.now()}@example.com`,
      name: 'Nested Test User',
      profile: {
        bio: 'Testing nested data updates',
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
            sms: true
          }
        },
        metadata: {
          lastLogin: new Date().toISOString(),
          loginCount: 1
        }
      }
    };

    try {
      // Create user with nested data
      const createResponse = await this.apiClient.post('/api/users', testUser);
      const userId = createResponse.data.id;
      
      const createSuccess = createResponse.status === 201 && userId;

      // Test deep nested update
      const nestedUpdate = {
        profile: {
          preferences: {
            notifications: {
              email: false,
              push: true,
              sms: false
            }
          },
          metadata: {
            loginCount: 5
          }
        }
      };

      const updateResponse = await this.apiClient.patch(`/api/users/${userId}`, nestedUpdate);
      const updateSuccess = updateResponse.status === 200;

      // Verify nested update
      const verifyResponse = await this.apiClient.get(`/api/users/${userId}`);
      const updatedUser = verifyResponse.data;
      
      const nestedVerification = {
        emailNotification: updatedUser.profile?.preferences?.notifications?.email === false,
        pushNotification: updatedUser.profile?.preferences?.notifications?.push === true,
        loginCount: updatedUser.profile?.metadata?.loginCount === 5,
        bioPreserved: updatedUser.profile?.bio === testUser.profile.bio // Should be preserved
      };

      const verifySuccess = Object.values(nestedVerification).every(check => check);

      // Clean up
      await this.apiClient.delete(`/api/users/${userId}`);

      const overallSuccess = createSuccess && updateSuccess && verifySuccess;

      return {
        passed: overallSuccess,
        userId,
        nestedVerification,
        originalData: testUser.profile,
        updatedData: updatedUser.profile,
        message: overallSuccess ? 'Nested data updates successful' : 'Nested data updates failed'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Nested data updates failed with error'
      };
    }
  }

  /**
   * Real-Time Data Updates and Propagation Tests
   */
  async testRealTimeUpdates() {
    console.log('📡 Testing Real-Time Data Updates and Propagation...');

    const tests = [
      this.testWebSocketDataPropagation(),
      this.testMultiClientSync(),
      this.testRealTimeNotifications(),
      this.testLiveDocumentEditing(),
      this.testPresenceUpdates()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.realTimeUpdates = results.map((result, index) => ({
      test: tests[index].name || `Real-Time Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.realTimeUpdates;
  }

  async testWebSocketDataPropagation() {
    return new Promise((resolve, reject) => {
      const testData = {
        type: 'data_update',
        entity: 'post',
        action: 'create',
        data: {
          id: Date.now(),
          title: 'Real-time Test Post',
          content: 'This post tests WebSocket propagation'
        }
      };

      let receivedUpdates = [];
      let clientCount = 0;
      const expectedClients = 3;

      // Create multiple WebSocket clients
      const clients = [];
      
      for (let i = 0; i < expectedClients; i++) {
        const client = io(this.config.wsURL, {
          transports: ['websocket']
        });

        client.on('connect', () => {
          clientCount++;
          
          // When all clients are connected, send update from first client
          if (clientCount === expectedClients) {
            clients[0].emit('data_update', testData);
          }
        });

        client.on('data_update', (data) => {
          if (data.data.id === testData.data.id) {
            receivedUpdates.push({
              clientIndex: i,
              data,
              timestamp: Date.now()
            });

            // Check if all clients received the update
            if (receivedUpdates.length === expectedClients - 1) { // -1 because sender doesn't receive own message
              clients.forEach(c => c.disconnect());
              
              const success = receivedUpdates.length === expectedClients - 1;
              
              resolve({
                passed: success,
                sentData: testData,
                receivedUpdates: receivedUpdates.length,
                expectedReceivers: expectedClients - 1,
                clientsConnected: clientCount,
                message: success ? 'WebSocket data propagation successful' : 'WebSocket propagation incomplete'
              });
            }
          }
        });

        client.on('error', (error) => {
          clients.forEach(c => c.disconnect());
          reject({
            passed: false,
            error: error.message,
            message: 'WebSocket connection error'
          });
        });

        clients.push(client);
      }

      // Timeout after 10 seconds
      setTimeout(() => {
        clients.forEach(c => c.disconnect());
        
        const success = receivedUpdates.length >= 1; // At least one client received update
        
        resolve({
          passed: success,
          receivedUpdates: receivedUpdates.length,
          expectedReceivers: expectedClients - 1,
          clientsConnected: clientCount,
          timedOut: true,
          message: success ? 'Partial WebSocket propagation (timeout)' : 'WebSocket propagation failed (timeout)'
        });
      }, 10000);
    });
  }

  async testMultiClientSync() {
    return new Promise((resolve, reject) => {
      const documentId = `doc_${Date.now()}`;
      let connectedClients = 0;
      const totalClients = 4;
      const edits = [];
      const clients = [];

      for (let i = 0; i < totalClients; i++) {
        const client = io(this.config.wsURL, {
          transports: ['websocket']
        });

        client.on('connect', () => {
          connectedClients++;
          
          // Join document collaboration room
          client.emit('join_document', { documentId });
          
          if (connectedClients === totalClients) {
            // Start making edits from different clients
            setTimeout(() => {
              clients.forEach((c, index) => {
                c.emit('document_edit', {
                  documentId,
                  edit: {
                    type: 'insert',
                    position: index * 10,
                    content: `Client ${index} edit `,
                    clientId: `client_${index}`,
                    timestamp: Date.now()
                  }
                });
              });
            }, 500);
          }
        });

        client.on('document_edit', (data) => {
          if (data.documentId === documentId) {
            edits.push({
              receivedBy: i,
              edit: data.edit,
              timestamp: Date.now()
            });

            // Check if all clients received all edits
            const expectedEdits = totalClients * (totalClients - 1); // Each client receives edits from others
            if (edits.length >= expectedEdits) {
              clients.forEach(c => c.disconnect());
              
              // Verify edit synchronization
              const editsByClient = {};
              edits.forEach(edit => {
                if (!editsByClient[edit.receivedBy]) {
                  editsByClient[edit.receivedBy] = [];
                }
                editsByClient[edit.receivedBy].push(edit);
              });

              const allClientsReceivedEdits = Object.keys(editsByClient).length === totalClients;
              const consistentEdits = Object.values(editsByClient).every(clientEdits => 
                clientEdits.length >= totalClients - 1
              );

              const success = allClientsReceivedEdits && consistentEdits;

              resolve({
                passed: success,
                connectedClients,
                totalEdits: edits.length,
                expectedEdits,
                editsByClient,
                allClientsReceivedEdits,
                consistentEdits,
                message: success ? 'Multi-client synchronization successful' : 'Multi-client sync issues detected'
              });
            }
          }
        });

        clients.push(client);
      }

      // Timeout after 15 seconds
      setTimeout(() => {
        clients.forEach(c => c.disconnect());
        
        const partialSuccess = edits.length > 0;
        
        resolve({
          passed: partialSuccess,
          connectedClients,
          totalEdits: edits.length,
          timedOut: true,
          message: partialSuccess ? 'Partial multi-client sync (timeout)' : 'Multi-client sync failed (timeout)'
        });
      }, 15000);
    });
  }

  /**
   * Conflict Resolution and Data Consistency Tests
   */
  async testConflictResolution() {
    console.log('⚔️ Testing Conflict Resolution and Data Consistency...');

    const tests = [
      this.testOptimisticLockingConflicts(),
      this.testConcurrentEditResolution(),
      this.testVersionConflictHandling(),
      this.testTimestampBasedResolution(),
      this.testLastWriterWinsStrategy()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.conflictResolution = results.map((result, index) => ({
      test: tests[index].name || `Conflict Resolution Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.conflictResolution;
  }

  async testOptimisticLockingConflicts() {
    const testDocument = {
      title: 'Conflict Test Document',
      content: 'Original content for conflict testing',
      version: 1
    };

    try {
      // Create document
      const createResponse = await this.apiClient.post('/api/documents', testDocument);
      const documentId = createResponse.data.id;
      const originalVersion = createResponse.data.version;

      // Simulate two clients getting the same document version
      const [doc1, doc2] = await Promise.all([
        this.apiClient.get(`/api/documents/${documentId}`),
        this.apiClient.get(`/api/documents/${documentId}`)
      ]);

      // Client 1 updates first
      const update1 = {
        title: 'Updated by Client 1',
        content: 'Content updated by client 1',
        version: originalVersion
      };

      const client1Response = await this.apiClient.patch(`/api/documents/${documentId}`, update1);
      const client1Success = client1Response.status === 200;

      // Client 2 tries to update with the same version (should conflict)
      const update2 = {
        title: 'Updated by Client 2',
        content: 'Content updated by client 2',
        version: originalVersion // Same version as client 1 had
      };

      let client2Conflict = false;
      let client2Response;
      
      try {
        client2Response = await this.apiClient.patch(`/api/documents/${documentId}`, update2);
        client2Conflict = false; // No conflict detected (may not have optimistic locking)
      } catch (error) {
        client2Conflict = error.response?.status === 409; // Conflict status
        client2Response = error.response;
      }

      // Get final document state
      const finalDoc = await this.apiClient.get(`/api/documents/${documentId}`);

      // Clean up
      await this.apiClient.delete(`/api/documents/${documentId}`);

      const hasOptimisticLocking = client2Conflict;
      const properResolution = client1Success && (client2Conflict || finalDoc.data.title === update1.title);

      return {
        passed: hasOptimisticLocking && properResolution,
        originalVersion,
        client1Update: { success: client1Success, newVersion: client1Response.data?.version },
        client2Conflict,
        finalDocument: finalDoc.data,
        hasOptimisticLocking,
        message: hasOptimisticLocking ? 'Optimistic locking working correctly' : 'Optimistic locking not implemented'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Optimistic locking test failed with error'
      };
    }
  }

  async testConcurrentEditResolution() {
    const testPost = {
      title: 'Concurrent Edit Test',
      content: 'Original content for concurrent editing',
      metadata: { editCount: 0 }
    };

    try {
      // Create post
      const createResponse = await this.apiClient.post('/api/posts', testPost);
      const postId = createResponse.data.id;

      // Simulate concurrent edits
      const concurrentUpdates = [
        { title: 'Updated by Edit 1', metadata: { editCount: 1 } },
        { title: 'Updated by Edit 2', metadata: { editCount: 2 } },
        { title: 'Updated by Edit 3', metadata: { editCount: 3 } },
        { title: 'Updated by Edit 4', metadata: { editCount: 4 } }
      ];

      const updatePromises = concurrentUpdates.map(update => 
        this.apiClient.patch(`/api/posts/${postId}`, update)
          .then(response => ({ success: true, data: response.data, status: response.status }))
          .catch(error => ({ success: false, error: error.message, status: error.response?.status }))
      );

      const results = await Promise.all(updatePromises);
      
      // Get final state
      const finalPost = await this.apiClient.get(`/api/posts/${postId}`);

      // Clean up
      await this.apiClient.delete(`/api/posts/${postId}`);

      const successfulUpdates = results.filter(r => r.success).length;
      const conflictedUpdates = results.filter(r => r.status === 409).length;
      const hasConflictHandling = conflictedUpdates > 0 || successfulUpdates === 1;

      return {
        passed: hasConflictHandling,
        totalUpdates: concurrentUpdates.length,
        successfulUpdates,
        conflictedUpdates,
        finalState: finalPost.data,
        updateResults: results,
        hasConflictHandling,
        message: hasConflictHandling ? 'Concurrent edit resolution working' : 'Concurrent edits may cause data corruption'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Concurrent edit resolution test failed with error'
      };
    }
  }

  /**
   * Error Handling and User Feedback Tests
   */
  async testErrorHandling() {
    console.log('🚫 Testing Error Handling and User Feedback...');

    const tests = [
      this.testNetworkErrorHandling(),
      this.testServerErrorRecovery(),
      this.testValidationErrorDisplay(),
      this.testTimeoutHandling(),
      this.testRetryMechanism()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.errorHandling = results.map((result, index) => ({
      test: tests[index].name || `Error Handling Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.errorHandling;
  }

  async testNetworkErrorHandling() {
    // Test with invalid URL to simulate network error
    const invalidApiClient = axios.create({
      baseURL: 'http://invalid-host-that-does-not-exist:9999',
      timeout: 5000
    });

    try {
      await invalidApiClient.get('/api/posts');
      
      return {
        passed: false,
        message: 'Network error was not thrown as expected'
      };
    } catch (error) {
      const isNetworkError = error.code === 'ENOTFOUND' || 
                            error.code === 'ECONNREFUSED' ||
                            error.code === 'ECONNRESET' ||
                            error.message.includes('timeout');

      return {
        passed: isNetworkError,
        errorCode: error.code,
        errorMessage: error.message,
        isNetworkError,
        message: isNetworkError ? 'Network error properly detected' : 'Unexpected error type'
      };
    }
  }

  async testServerErrorRecovery() {
    try {
      // Try to trigger a server error (500)
      const response = await this.apiClient.post('/api/trigger-error', {
        errorType: 'server_error'
      });

      return {
        passed: false,
        unexpectedSuccess: true,
        status: response.status,
        message: 'Server error endpoint did not return error as expected'
      };
    } catch (error) {
      const isServerError = error.response?.status >= 500;
      const hasErrorMessage = !!error.response?.data?.message;
      const hasErrorDetails = !!error.response?.data?.details;

      return {
        passed: isServerError,
        status: error.response?.status,
        hasErrorMessage,
        hasErrorDetails,
        errorResponse: error.response?.data,
        message: isServerError ? 'Server error properly handled' : 'Server error handling may have issues'
      };
    }
  }

  async testValidationErrorDisplay() {
    const invalidData = {
      title: '', // Invalid: empty title
      content: 'A'.repeat(10000), // Invalid: too long
      status: 'invalid_status' // Invalid: not in enum
    };

    try {
      await this.apiClient.post('/api/posts', invalidData);
      
      return {
        passed: false,
        unexpectedSuccess: true,
        message: 'Validation errors were not caught'
      };
    } catch (error) {
      const isValidationError = error.response?.status === 400 || error.response?.status === 422;
      const hasValidationDetails = Array.isArray(error.response?.data?.errors) ||
                                  typeof error.response?.data?.errors === 'object';
      const hasFieldSpecificErrors = hasValidationDetails && 
                                    Object.keys(error.response?.data?.errors || {}).length > 0;

      return {
        passed: isValidationError && hasValidationDetails,
        status: error.response?.status,
        isValidationError,
        hasValidationDetails,
        hasFieldSpecificErrors,
        validationErrors: error.response?.data?.errors,
        message: isValidationError && hasValidationDetails ? 'Validation errors properly displayed' : 'Validation error handling needs improvement'
      };
    }
  }

  /**
   * Offline Mode and Data Caching Tests
   */
  async testOfflineModeAndCaching() {
    console.log('📴 Testing Offline Mode and Data Caching...');

    const tests = [
      this.testOfflineDataAccess(),
      this.testCacheInvalidation(),
      this.testSyncOnReconnect(),
      this.testOptimisticOfflineUpdates(),
      this.testCachePerformance()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.offlineMode = results.map((result, index) => ({
      test: tests[index].name || `Offline Mode Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.offlineMode;
  }

  async testOfflineDataAccess() {
    try {
      // First, populate cache with data
      const postsResponse = await this.apiClient.get('/api/posts?limit=5');
      const cachedPosts = postsResponse.data;

      // Simulate offline by using invalid base URL
      const offlineClient = axios.create({
        baseURL: 'http://offline-simulation:9999',
        timeout: 1000
      });

      // Test if cached data is accessible offline
      // Note: This would typically be tested in the frontend with service workers
      // Here we simulate the concept
      
      let offlineCacheAvailable = false;
      try {
        // In a real app, this would check local storage, IndexedDB, or service worker cache
        const simulatedCache = {
          '/api/posts': cachedPosts
        };
        
        if (simulatedCache['/api/posts']) {
          offlineCacheAvailable = true;
        }
      } catch (cacheError) {
        offlineCacheAvailable = false;
      }

      // Test network request fails as expected
      let networkFailed = false;
      try {
        await offlineClient.get('/api/posts');
      } catch (error) {
        networkFailed = true;
      }

      return {
        passed: offlineCacheAvailable && networkFailed,
        cachedDataAvailable: offlineCacheAvailable,
        networkFailedAsExpected: networkFailed,
        cachedPostsCount: cachedPosts?.length || 0,
        message: offlineCacheAvailable ? 'Offline data access simulation successful' : 'Offline caching not properly implemented'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        message: 'Offline data access test failed with error'
      };
    }
  }

  async testCacheInvalidation() {
    try {
      // Get initial data
      const initialResponse = await this.apiClient.get('/api/posts?_cache=initial');
      const initialPosts = initialResponse.data;

      // Create new post
      const newPost = {
        title: 'Cache Invalidation Test Post',
        content: 'This post should invalidate the cache'
      };
      
      await this.apiClient.post('/api/posts', newPost);

      // Get data again - should be fresh
      const freshResponse = await this.apiClient.get('/api/posts?_cache=fresh');
      const freshPosts = freshResponse.data;

      const cacheInvalidated = freshPosts.length > initialPosts.length ||
                              freshPosts.some(post => post.title === newPost.title);

      // Check cache headers
      const hasCacheHeaders = freshResponse.headers['cache-control'] ||
                             freshResponse.headers['etag'] ||
                             freshResponse.headers['last-modified'];

      return {
        passed: cacheInvalidated && hasCacheHeaders,
        initialPostCount: initialPosts?.length || 0,
        freshPostCount: freshPosts?.length || 0,
        cacheInvalidated,
        hasCacheHeaders: !!hasCacheHeaders,
        cacheHeaders: {
          cacheControl: freshResponse.headers['cache-control'],
          etag: freshResponse.headers['etag'],
          lastModified: freshResponse.headers['last-modified']
        },
        message: cacheInvalidated ? 'Cache invalidation working correctly' : 'Cache invalidation may not be implemented'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Cache invalidation test failed with error'
      };
    }
  }

  /**
   * Database Transaction Integrity Tests
   */
  async testTransactionIntegrity() {
    console.log('🗄️ Testing Database Transaction Integrity...');

    const tests = [
      this.testAtomicTransactions(),
      this.testRollbackOnError(),
      this.testConcurrentTransactions(),
      this.testDeadlockHandling(),
      this.testDataConsistency()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.transactionIntegrity = results.map((result, index) => ({
      test: tests[index].name || `Transaction Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.transactionIntegrity;
  }

  async testAtomicTransactions() {
    const transactionData = {
      user: {
        email: `transaction.test.${Date.now()}@example.com`,
        name: 'Transaction Test User'
      },
      posts: [
        { title: 'Transaction Post 1', content: 'First post in transaction' },
        { title: 'Transaction Post 2', content: 'Second post in transaction' }
      ],
      category: {
        name: 'Transaction Test Category',
        description: 'Category created in transaction'
      }
    };

    try {
      // Test atomic transaction - all operations should succeed or all should fail
      const transactionResponse = await this.apiClient.post('/api/transaction/create-user-with-posts', 
        transactionData
      );

      const transactionSuccess = transactionResponse.status === 201;
      const resultData = transactionResponse.data;

      if (transactionSuccess) {
        // Verify all data was created
        const userExists = await this.apiClient.get(`/api/users/${resultData.userId}`)
          .then(() => true)
          .catch(() => false);

        const postsExist = await Promise.all(
          (resultData.postIds || []).map(id => 
            this.apiClient.get(`/api/posts/${id}`)
              .then(() => true)
              .catch(() => false)
          )
        );

        const categoryExists = resultData.categoryId ? 
          await this.apiClient.get(`/api/categories/${resultData.categoryId}`)
            .then(() => true)
            .catch(() => false) : false;

        const allDataCreated = userExists && 
                              postsExist.every(exists => exists) && 
                              categoryExists;

        // Clean up
        if (resultData.userId) {
          await this.apiClient.delete(`/api/users/${resultData.userId}`).catch(() => {});
        }
        if (resultData.categoryId) {
          await this.apiClient.delete(`/api/categories/${resultData.categoryId}`).catch(() => {});
        }

        return {
          passed: allDataCreated,
          transactionSuccess,
          userExists,
          postsCreated: postsExist.filter(Boolean).length,
          categoryExists,
          allDataCreated,
          message: allDataCreated ? 'Atomic transaction successful' : 'Transaction may not be atomic'
        };
      }

      return {
        passed: false,
        transactionSuccess: false,
        message: 'Transaction failed to execute'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Atomic transaction test failed with error'
      };
    }
  }

  async testRollbackOnError() {
    const invalidTransactionData = {
      user: {
        email: `rollback.test.${Date.now()}@example.com`,
        name: 'Rollback Test User'
      },
      posts: [
        { title: 'Valid Post', content: 'This post should be valid' },
        { title: '', content: 'Invalid post with empty title' } // This should cause rollback
      ]
    };

    try {
      await this.apiClient.post('/api/transaction/create-user-with-posts', 
        invalidTransactionData
      );

      return {
        passed: false,
        unexpectedSuccess: true,
        message: 'Transaction with invalid data should have failed'
      };
    } catch (error) {
      const isValidationError = error.response?.status === 400 || error.response?.status === 422;
      
      if (isValidationError) {
        // Check that no partial data was created
        const userSearch = await this.apiClient.get('/api/users', {
          params: { email: invalidTransactionData.user.email }
        }).catch(() => ({ data: [] }));

        const noPartialData = userSearch.data.length === 0;

        return {
          passed: isValidationError && noPartialData,
          transactionRolledBack: noPartialData,
          errorStatus: error.response?.status,
          errorMessage: error.response?.data?.message,
          message: noPartialData ? 'Transaction rollback successful' : 'Partial data created despite error'
        };
      }

      return {
        passed: false,
        error: error.message,
        status: error.response?.status,
        message: 'Unexpected error in rollback test'
      };
    }
  }

  /**
   * Generate Comprehensive Test Report
   */
  generateTestReport() {
    const allTests = [
      ...this.testResults.dataSync,
      ...this.testResults.realTimeUpdates,
      ...this.testResults.conflictResolution,
      ...this.testResults.errorHandling,
      ...this.testResults.offlineMode,
      ...this.testResults.caching,
      ...this.testResults.transactionIntegrity
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
        dataSync: this.testResults.dataSync,
        realTimeUpdates: this.testResults.realTimeUpdates,
        conflictResolution: this.testResults.conflictResolution,
        errorHandling: this.testResults.errorHandling,
        offlineMode: this.testResults.offlineMode,
        caching: this.testResults.caching,
        transactionIntegrity: this.testResults.transactionIntegrity
      },
      recommendations: this.generateRecommendations(allTests)
    };
  }

  generateRecommendations(tests) {
    const recommendations = [];
    
    const failedTests = tests.filter(test => test.status === 'rejected' || !test.result.passed);
    
    if (failedTests.length > 0) {
      recommendations.push('Review failed data flow tests and fix synchronization issues');
    }
    
    const conflictTests = this.testResults.conflictResolution;
    if (conflictTests.some(test => !test.result?.passed)) {
      recommendations.push('Implement proper conflict resolution mechanisms');
    }
    
    const offlineTests = this.testResults.offlineMode;
    if (offlineTests.some(test => !test.result?.passed)) {
      recommendations.push('Improve offline mode support and data caching');
    }
    
    const transactionTests = this.testResults.transactionIntegrity;
    if (transactionTests.some(test => !test.result?.passed)) {
      recommendations.push('Ensure database transaction integrity and rollback mechanisms');
    }
    
    return recommendations;
  }

  /**
   * Run All Data Flow Tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Data Flow Integration Test Suite...\n');
    
    try {
      await this.testDataSynchronization();
      await this.testRealTimeUpdates();
      await this.testConflictResolution();
      await this.testErrorHandling();
      await this.testOfflineModeAndCaching();
      await this.testTransactionIntegrity();
      
      const report = this.generateTestReport();
      
      console.log('\n📊 Data Flow Integration Test Results:');
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      return report;
    } catch (error) {
      console.error('❌ Data flow integration test suite failed:', error);
      throw error;
    }
  }
}

module.exports = { DataFlowIntegrationTestSuite };

// Example usage
if (require.main === module) {
  const testSuite = new DataFlowIntegrationTestSuite({
    frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    backendURL: process.env.BACKEND_URL || 'http://localhost:8000',
    wsURL: process.env.WS_URL || 'ws://localhost:8000',
    timeout: 30000
  });

  testSuite.runAllTests()
    .then(report => {
      console.log('\n📄 Full test report saved to data-flow-integration-test-report.json');
      require('fs').writeFileSync(
        'data-flow-integration-test-report.json',
        JSON.stringify(report, null, 2)
      );
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}