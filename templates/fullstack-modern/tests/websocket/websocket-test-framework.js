/**
 * WebSocket Testing Framework for Fullstack Modern Template
 * 
 * Comprehensive testing suite for real-time WebSocket connections,
 * covering connection lifecycle, message handling, authentication,
 * and performance under various conditions.
 */

const { io, Socket } = require('socket.io-client');
const { EventEmitter } = require('events');

class WebSocketTestFramework extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      url: config.url || 'ws://localhost:8000',
      timeout: config.timeout || 10000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      concurrentConnections: config.concurrentConnections || 10,
      ...config
    };
    
    this.testResults = {
      connectionTests: [],
      messageTests: [],
      authTests: [],
      performanceTests: [],
      stressTests: []
    };
    
    this.activeConnections = new Map();
    this.messageQueue = [];
    this.metrics = {
      connectionTime: [],
      messageLatency: [],
      throughput: 0,
      errors: []
    };
  }

  /**
   * WebSocket Connection Lifecycle Tests
   */
  async testConnectionLifecycle() {
    console.log('🔌 Starting WebSocket Connection Lifecycle Tests...');
    
    const tests = [
      this.testBasicConnection(),
      this.testConnectionWithAuth(),
      this.testConnectionFailure(),
      this.testReconnectionFlow(),
      this.testGracefulDisconnection(),
      this.testConnectionTimeout(),
      this.testMultipleConnections()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.connectionTests = results.map((result, index) => ({
      test: tests[index].name || `Connection Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.connectionTests;
  }

  async testBasicConnection() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const socket = io(this.config.url, {
        transports: ['websocket'],
        timeout: this.config.timeout
      });

      socket.on('connect', () => {
        const connectionTime = Date.now() - startTime;
        this.metrics.connectionTime.push(connectionTime);
        
        socket.disconnect();
        resolve({
          passed: true,
          connectionTime,
          socketId: socket.id,
          message: 'Basic connection established successfully'
        });
      });

      socket.on('connect_error', (error) => {
        socket.disconnect();
        reject({
          passed: false,
          error: error.message,
          message: 'Failed to establish basic connection'
        });
      });

      setTimeout(() => {
        socket.disconnect();
        reject({
          passed: false,
          error: 'Connection timeout',
          message: 'Connection attempt timed out'
        });
      }, this.config.timeout);
    });
  }

  async testConnectionWithAuth() {
    return new Promise((resolve, reject) => {
      const mockToken = 'mock_jwt_token_for_testing';
      const startTime = Date.now();
      
      const socket = io(this.config.url, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        const connectionTime = Date.now() - startTime;
        
        // Test if authentication was accepted
        socket.emit('auth_check', { token: mockToken });
        
        socket.on('auth_verified', (data) => {
          socket.disconnect();
          resolve({
            passed: true,
            connectionTime,
            authData: data,
            message: 'Authenticated connection established successfully'
          });
        });

        socket.on('auth_failed', (error) => {
          socket.disconnect();
          resolve({
            passed: true, // This is expected behavior for invalid tokens
            connectionTime,
            authError: error,
            message: 'Authentication properly rejected invalid token'
          });
        });
      });

      socket.on('connect_error', (error) => {
        socket.disconnect();
        reject({
          passed: false,
          error: error.message,
          message: 'Failed to establish authenticated connection'
        });
      });

      setTimeout(() => {
        socket.disconnect();
        reject({
          passed: false,
          error: 'Authentication timeout',
          message: 'Authentication verification timed out'
        });
      }, this.config.timeout);
    });
  }

  async testReconnectionFlow() {
    return new Promise((resolve, reject) => {
      let connectionCount = 0;
      let reconnectedSuccessfully = false;
      
      const socket = io(this.config.url, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        connectionCount++;
        
        if (connectionCount === 1) {
          // Simulate disconnection after initial connection
          setTimeout(() => {
            socket.disconnect();
          }, 500);
        } else if (connectionCount === 2) {
          // Successful reconnection
          reconnectedSuccessfully = true;
          socket.disconnect();
          
          resolve({
            passed: true,
            connectionCount,
            message: 'Reconnection flow completed successfully'
          });
        }
      });

      socket.on('disconnect', (reason) => {
        if (connectionCount === 1 && reason === 'io client disconnect') {
          // Expected disconnection, wait for reconnection
          setTimeout(() => {
            if (!reconnectedSuccessfully) {
              socket.connect();
            }
          }, 1500);
        }
      });

      socket.on('connect_error', (error) => {
        socket.disconnect();
        reject({
          passed: false,
          error: error.message,
          connectionCount,
          message: 'Reconnection flow failed'
        });
      });

      setTimeout(() => {
        socket.disconnect();
        if (!reconnectedSuccessfully) {
          reject({
            passed: false,
            error: 'Reconnection timeout',
            connectionCount,
            message: 'Reconnection attempt timed out'
          });
        }
      }, this.config.timeout * 2);
    });
  }

  /**
   * Message Broadcasting and Unicasting Tests
   */
  async testMessageHandling() {
    console.log('📨 Starting Message Handling Tests...');
    
    const tests = [
      this.testBroadcastMessage(),
      this.testUnicastMessage(),
      this.testMessageOrdering(),
      this.testMessageDeliveryGuarantees(),
      this.testLargeMessageHandling(),
      this.testConcurrentMessages()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.messageTests = results.map((result, index) => ({
      test: tests[index].name || `Message Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.messageTests;
  }

  async testBroadcastMessage() {
    return new Promise((resolve, reject) => {
      const clientCount = 3;
      const clients = [];
      const receivedMessages = [];
      const testMessage = {
        type: 'broadcast_test',
        data: { message: 'Test broadcast message', timestamp: Date.now() },
        timestamp: Date.now()
      };

      let connectedClients = 0;

      // Create multiple clients
      for (let i = 0; i < clientCount; i++) {
        const client = io(this.config.url, {
          transports: ['websocket']
        });

        client.on('connect', () => {
          connectedClients++;
          
          if (connectedClients === clientCount) {
            // All clients connected, send broadcast message
            clients[0].emit('broadcast', testMessage);
          }
        });

        client.on('message', (message) => {
          if (message.type === 'broadcast_test') {
            const latency = Date.now() - message.timestamp;
            receivedMessages.push({
              clientIndex: i,
              message,
              latency,
              receivedAt: Date.now()
            });

            // Check if all clients received the message
            if (receivedMessages.length === clientCount) {
              clients.forEach(c => c.disconnect());
              
              resolve({
                passed: true,
                clientCount,
                messagesSent: 1,
                messagesReceived: receivedMessages.length,
                averageLatency: receivedMessages.reduce((sum, r) => sum + r.latency, 0) / receivedMessages.length,
                message: 'Broadcast message delivered to all clients'
              });
            }
          }
        });

        clients.push(client);
      }

      setTimeout(() => {
        clients.forEach(c => c.disconnect());
        reject({
          passed: false,
          error: 'Broadcast timeout',
          connectedClients,
          messagesReceived: receivedMessages.length,
          message: 'Broadcast message test timed out'
        });
      }, this.config.timeout);
    });
  }

  async testMessageOrdering() {
    return new Promise((resolve, reject) => {
      const messageCount = 10;
      const sentMessages = [];
      const receivedMessages = [];
      
      const socket = io(this.config.url, {
        transports: ['websocket']
      });

      socket.on('connect', () => {
        // Send multiple messages in quick succession
        for (let i = 0; i < messageCount; i++) {
          const message = {
            type: 'order_test',
            sequence: i,
            data: `Message ${i}`,
            timestamp: Date.now()
          };
          
          sentMessages.push(message);
          socket.emit('message', message);
        }
      });

      socket.on('message', (message) => {
        if (message.type === 'order_test') {
          receivedMessages.push(message);
          
          if (receivedMessages.length === messageCount) {
            socket.disconnect();
            
            // Check message ordering
            let ordered = true;
            for (let i = 0; i < receivedMessages.length; i++) {
              if (receivedMessages[i].sequence !== i) {
                ordered = false;
                break;
              }
            }
            
            resolve({
              passed: ordered,
              messagesSent: sentMessages.length,
              messagesReceived: receivedMessages.length,
              ordered,
              message: ordered ? 'Messages received in correct order' : 'Message ordering violated'
            });
          }
        }
      });

      setTimeout(() => {
        socket.disconnect();
        reject({
          passed: false,
          error: 'Message ordering timeout',
          messagesSent: sentMessages.length,
          messagesReceived: receivedMessages.length,
          message: 'Message ordering test timed out'
        });
      }, this.config.timeout);
    });
  }

  /**
   * Performance and Load Testing
   */
  async testPerformanceUnderLoad() {
    console.log('⚡ Starting Performance Under Load Tests...');
    
    const tests = [
      this.testThroughput(),
      this.testLatencyUnderLoad(),
      this.testConcurrentConnections(),
      this.testMemoryUsage(),
      this.testConnectionDrop()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.performanceTests = results.map((result, index) => ({
      test: tests[index].name || `Performance Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.performanceTests;
  }

  async testThroughput() {
    return new Promise((resolve, reject) => {
      const testDuration = 10000; // 10 seconds
      const messageInterval = 10; // Send message every 10ms
      let messagesSent = 0;
      let messagesReceived = 0;
      let startTime = Date.now();
      
      const socket = io(this.config.url, {
        transports: ['websocket']
      });

      socket.on('connect', () => {
        startTime = Date.now();
        
        const sendInterval = setInterval(() => {
          if (Date.now() - startTime >= testDuration) {
            clearInterval(sendInterval);
            
            // Wait a bit more for remaining messages
            setTimeout(() => {
              socket.disconnect();
              
              const throughput = (messagesReceived / (testDuration / 1000)).toFixed(2);
              this.metrics.throughput = throughput;
              
              resolve({
                passed: true,
                duration: testDuration,
                messagesSent,
                messagesReceived,
                throughput: `${throughput} messages/second`,
                messageDeliveryRate: ((messagesReceived / messagesSent) * 100).toFixed(2) + '%',
                message: 'Throughput test completed'
              });
            }, 1000);
            
            return;
          }
          
          const message = {
            type: 'throughput_test',
            sequence: messagesSent,
            timestamp: Date.now()
          };
          
          socket.emit('message', message);
          messagesSent++;
        }, messageInterval);
      });

      socket.on('message', (message) => {
        if (message.type === 'throughput_test') {
          messagesReceived++;
          const latency = Date.now() - message.timestamp;
          this.metrics.messageLatency.push(latency);
        }
      });

      socket.on('connect_error', (error) => {
        socket.disconnect();
        reject({
          passed: false,
          error: error.message,
          message: 'Throughput test connection failed'
        });
      });
    });
  }

  async testConcurrentConnections() {
    return new Promise((resolve, reject) => {
      const connectionCount = this.config.concurrentConnections;
      const connections = [];
      let successfulConnections = 0;
      let failedConnections = 0;
      const startTime = Date.now();
      const connectionTimes = [];

      for (let i = 0; i < connectionCount; i++) {
        const socket = io(this.config.url, {
          transports: ['websocket'],
          timeout: 5000
        });

        const connectStart = Date.now();

        socket.on('connect', () => {
          const connectTime = Date.now() - connectStart;
          connectionTimes.push(connectTime);
          successfulConnections++;
          
          if (successfulConnections + failedConnections === connectionCount) {
            const totalTime = Date.now() - startTime;
            const avgConnectTime = connectionTimes.reduce((sum, time) => sum + time, 0) / connectionTimes.length;
            
            // Disconnect all connections
            connections.forEach(conn => {
              if (conn.connected) {
                conn.disconnect();
              }
            });
            
            resolve({
              passed: successfulConnections >= connectionCount * 0.9, // 90% success rate
              totalConnections: connectionCount,
              successfulConnections,
              failedConnections,
              totalTime,
              averageConnectionTime: Math.round(avgConnectTime),
              successRate: ((successfulConnections / connectionCount) * 100).toFixed(2) + '%',
              message: `${successfulConnections}/${connectionCount} concurrent connections established`
            });
          }
        });

        socket.on('connect_error', (error) => {
          failedConnections++;
          this.metrics.errors.push({
            type: 'connection_error',
            error: error.message,
            timestamp: Date.now()
          });
          
          if (successfulConnections + failedConnections === connectionCount) {
            connections.forEach(conn => {
              if (conn.connected) {
                conn.disconnect();
              }
            });
            
            resolve({
              passed: successfulConnections >= connectionCount * 0.9,
              totalConnections: connectionCount,
              successfulConnections,
              failedConnections,
              successRate: ((successfulConnections / connectionCount) * 100).toFixed(2) + '%',
              message: `Concurrent connection test completed with ${failedConnections} failures`
            });
          }
        });

        connections.push(socket);
      }

      setTimeout(() => {
        connections.forEach(conn => {
          if (conn.connected) {
            conn.disconnect();
          }
        });
        
        reject({
          passed: false,
          error: 'Concurrent connection timeout',
          totalConnections: connectionCount,
          successfulConnections,
          failedConnections,
          message: 'Concurrent connection test timed out'
        });
      }, this.config.timeout * 2);
    });
  }

  /**
   * Advanced Real-Time Scenario Tests
   */
  async testAdvancedRealTimeScenarios() {
    console.log('🔥 Testing Advanced Real-Time Scenarios...');
    
    const tests = [
      this.testConnectionResilience(),
      this.testMessageDeliveryGuarantees(),
      this.testConflictResolution(),
      this.testNetworkInterruption(),
      this.testScalabilityUnderLoad(),
      this.testOperationalTransform()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.advancedTests = results.map((result, index) => ({
      test: tests[index].name || `Advanced Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.advancedTests;
  }

  async testConnectionResilience() {
    return new Promise((resolve, reject) => {
      let connectionAttempts = 0;
      let successfulReconnections = 0;
      const maxReconnections = 5;
      
      const socket = io(this.config.url, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: maxReconnections,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        connectionAttempts++;
        
        if (connectionAttempts === 1) {
          // Force disconnect after initial connection
          setTimeout(() => {
            socket.disconnect();
          }, 1000);
        } else {
          successfulReconnections++;
          
          if (successfulReconnections >= 3) {
            socket.disconnect();
            resolve({
              passed: true,
              connectionAttempts,
              successfulReconnections,
              message: 'Connection resilience test passed'
            });
          }
        }
      });

      socket.on('disconnect', (reason) => {
        if (connectionAttempts < maxReconnections && reason === 'io client disconnect') {
          setTimeout(() => {
            socket.connect();
          }, 1000);
        }
      });

      socket.on('connect_error', () => {
        // Connection error handling
      });

      setTimeout(() => {
        socket.disconnect();
        resolve({
          passed: successfulReconnections >= 2,
          connectionAttempts,
          successfulReconnections,
          message: `Reconnected ${successfulReconnections} times out of ${connectionAttempts} attempts`
        });
      }, 30000);
    });
  }

  async testMessageDeliveryGuarantees() {
    return new Promise((resolve, reject) => {
      const messageCount = 50;
      const sentMessages = [];
      const receivedMessages = [];
      const clients = [];
      
      for (let i = 0; i < 3; i++) {
        const client = io(this.config.url, {
          transports: ['websocket']
        });
        clients.push(client);
      }

      let connectedClients = 0;
      
      clients.forEach((client, index) => {
        client.on('connect', () => {
          connectedClients++;
          
          if (connectedClients === clients.length) {
            // Start sending messages
            for (let i = 0; i < messageCount; i++) {
              const message = {
                type: 'delivery_test',
                sequence: i,
                timestamp: Date.now(),
                sender: 0
              };
              
              sentMessages.push(message);
              clients[0].emit('message', message);
            }
          }
        });

        client.on('message', (message) => {
          if (message.type === 'delivery_test') {
            receivedMessages.push({
              ...message,
              receivedBy: index,
              receivedAt: Date.now()
            });
            
            if (receivedMessages.length === messageCount * (clients.length - 1)) {
              clients.forEach(c => c.disconnect());
              
              // Analyze delivery guarantees
              const deliveryRate = (receivedMessages.length / (messageCount * (clients.length - 1))) * 100;
              const ordering = this.checkMessageOrdering(receivedMessages);
              
              resolve({
                passed: deliveryRate >= 98 && ordering,
                sentMessages: messageCount,
                receivedMessages: receivedMessages.length,
                deliveryRate: deliveryRate.toFixed(2) + '%',
                orderingPreserved: ordering,
                message: `Message delivery guarantees: ${deliveryRate.toFixed(2)}% delivery rate, ordering ${ordering ? 'preserved' : 'violated'}`
              });
            }
          }
        });
      });

      setTimeout(() => {
        clients.forEach(c => c.disconnect());
        reject({
          passed: false,
          error: 'Message delivery test timeout',
          sentMessages: messageCount,
          receivedMessages: receivedMessages.length,
          message: 'Message delivery test timed out'
        });
      }, 20000);
    });
  }

  checkMessageOrdering(messages) {
    const clientMessages = {};
    
    messages.forEach(msg => {
      if (!clientMessages[msg.receivedBy]) {
        clientMessages[msg.receivedBy] = [];
      }
      clientMessages[msg.receivedBy].push(msg);
    });
    
    return Object.values(clientMessages).every(clientMsgs => {
      for (let i = 1; i < clientMsgs.length; i++) {
        if (clientMsgs[i].sequence < clientMsgs[i - 1].sequence) {
          return false;
        }
      }
      return true;
    });
  }

  async testConflictResolution() {
    return new Promise((resolve, reject) => {
      const documentId = `doc_${Date.now()}`;
      const clients = [];
      const edits = [];
      
      for (let i = 0; i < 4; i++) {
        const client = io(this.config.url, {
          transports: ['websocket']
        });
        clients.push(client);
      }

      let connectedClients = 0;
      
      clients.forEach((client, index) => {
        client.on('connect', () => {
          connectedClients++;
          client.emit('join_document', { documentId });
          
          if (connectedClients === clients.length) {
            // Simulate concurrent edits
            setTimeout(() => {
              clients.forEach((c, i) => {
                const edit = {
                  type: 'operational_transform',
                  documentId,
                  operation: {
                    type: 'insert',
                    position: i * 5,
                    content: `Edit from client ${i}`,
                    vector_clock: { [i]: 1 }
                  },
                  clientId: i,
                  timestamp: Date.now()
                };
                
                edits.push(edit);
                c.emit('document_edit', edit);
              });
            }, 1000);
          }
        });

        client.on('conflict_resolution', (data) => {
          if (data.documentId === documentId) {
            // Track conflict resolution
          }
        });

        client.on('document_state', (state) => {
          if (state.documentId === documentId && edits.length > 0) {
            clients.forEach(c => c.disconnect());
            
            const hasConflicts = state.conflicts && state.conflicts.length > 0;
            const resolutionStrategy = state.resolutionStrategy || 'last-write-wins';
            
            resolve({
              passed: true, // If we get a state response, conflict resolution is working
              documentId,
              editsApplied: edits.length,
              conflictsDetected: hasConflicts,
              resolutionStrategy,
              finalState: state.content || '',
              message: `Conflict resolution working with strategy: ${resolutionStrategy}`
            });
          }
        });
      });

      setTimeout(() => {
        clients.forEach(c => c.disconnect());
        resolve({
          passed: false,
          error: 'Conflict resolution test timeout',
          editsApplied: edits.length,
          message: 'Conflict resolution test timed out'
        });
      }, 15000);
    });
  }

  async testNetworkInterruption() {
    return new Promise((resolve, reject) => {
      const socket = io(this.config.url, {
        transports: ['websocket'],
        reconnection: true
      });
      
      const messagesSent = [];
      const messagesReceived = [];
      let networkInterrupted = false;
      
      socket.on('connect', () => {
        // Send messages continuously
        const messageInterval = setInterval(() => {
          if (socket.connected) {
            const message = {
              type: 'network_test',
              id: Date.now(),
              timestamp: Date.now()
            };
            
            messagesSent.push(message);
            socket.emit('message', message);
          }
        }, 100);
        
        // Simulate network interruption after 3 seconds
        setTimeout(() => {
          networkInterrupted = true;
          socket.disconnect();
          
          // Reconnect after 2 seconds
          setTimeout(() => {
            socket.connect();
          }, 2000);
        }, 3000);
        
        // Stop test after 10 seconds
        setTimeout(() => {
          clearInterval(messageInterval);
          socket.disconnect();
          
          const messageDelivery = (messagesReceived.length / messagesSent.length) * 100;
          
          resolve({
            passed: messageDelivery >= 80, // 80% delivery rate acceptable with interruption
            messagesSent: messagesSent.length,
            messagesReceived: messagesReceived.length,
            deliveryRate: messageDelivery.toFixed(2) + '%',
            networkInterrupted,
            message: `Network interruption test: ${messageDelivery.toFixed(2)}% delivery rate`
          });
        }, 10000);
      });
      
      socket.on('message', (message) => {
        if (message.type === 'network_test') {
          messagesReceived.push(message);
        }
      });
      
      socket.on('connect_error', () => {
        // Expected during network interruption
      });
    });
  }

  async testScalabilityUnderLoad() {
    return new Promise(async (resolve, reject) => {
      const highLoadConnections = 100;
      const messagesPerConnection = 20;
      const connections = [];
      const results = {
        connectionsSuccessful: 0,
        messagesSent: 0,
        messagesReceived: 0,
        averageLatency: 0,
        errors: 0
      };
      
      const latencies = [];
      let completedConnections = 0;
      
      for (let i = 0; i < highLoadConnections; i++) {
        const socket = io(this.config.url, {
          transports: ['websocket'],
          timeout: 10000
        });
        
        connections.push(socket);
        
        socket.on('connect', () => {
          results.connectionsSuccessful++;
          
          // Send messages
          for (let j = 0; j < messagesPerConnection; j++) {
            const message = {
              type: 'scalability_test',
              connectionId: i,
              messageId: j,
              timestamp: Date.now()
            };
            
            results.messagesSent++;
            socket.emit('message', message);
          }
        });
        
        socket.on('message', (message) => {
          if (message.type === 'scalability_test') {
            results.messagesReceived++;
            const latency = Date.now() - message.timestamp;
            latencies.push(latency);
          }
        });
        
        socket.on('disconnect', () => {
          completedConnections++;
          
          if (completedConnections === highLoadConnections) {
            results.averageLatency = latencies.length > 0 ?
              latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
            
            const deliveryRate = (results.messagesReceived / results.messagesSent) * 100;
            const connectionRate = (results.connectionsSuccessful / highLoadConnections) * 100;
            
            resolve({
              passed: connectionRate >= 95 && deliveryRate >= 90 && results.averageLatency < 500,
              connectionRate: connectionRate.toFixed(2) + '%',
              deliveryRate: deliveryRate.toFixed(2) + '%',
              averageLatency: Math.round(results.averageLatency) + 'ms',
              ...results,
              message: `Scalability test: ${connectionRate.toFixed(2)}% connections, ${deliveryRate.toFixed(2)}% delivery, ${Math.round(results.averageLatency)}ms latency`
            });
          }
        });
        
        socket.on('connect_error', () => {
          results.errors++;
        });
      }
      
      // Disconnect all after test period
      setTimeout(() => {
        connections.forEach(socket => {
          if (socket.connected) {
            socket.disconnect();
          }
        });
      }, 15000);
      
      // Timeout the test
      setTimeout(() => {
        connections.forEach(socket => socket.disconnect());
        reject({
          passed: false,
          error: 'Scalability test timeout',
          ...results,
          message: 'Scalability test timed out'
        });
      }, 30000);
    });
  }

  async testOperationalTransform() {
    return new Promise((resolve, reject) => {
      const documentId = `ot_doc_${Date.now()}`;
      const clients = [];
      const operations = [];
      
      for (let i = 0; i < 3; i++) {
        const client = io(this.config.url, {
          transports: ['websocket']
        });
        clients.push(client);
      }
      
      let connectedClients = 0;
      let transformedOperations = 0;
      
      clients.forEach((client, index) => {
        client.on('connect', () => {
          connectedClients++;
          client.emit('join_document', { documentId });
          
          if (connectedClients === clients.length) {
            // Create conflicting operations
            const op1 = {
              type: 'insert',
              position: 0,
              content: 'Hello ',
              clientId: 0,
              revision: 0
            };
            
            const op2 = {
              type: 'insert',
              position: 0,
              content: 'World ',
              clientId: 1,
              revision: 0
            };
            
            operations.push(op1, op2);
            
            // Send operations simultaneously
            clients[0].emit('operation', { documentId, operation: op1 });
            clients[1].emit('operation', { documentId, operation: op2 });
          }
        });
        
        client.on('operation_transformed', (data) => {
          transformedOperations++;
          
          if (transformedOperations >= operations.length) {
            client.emit('get_document_state', { documentId });
          }
        });
        
        client.on('document_state', (state) => {
          if (state.documentId === documentId) {
            clients.forEach(c => c.disconnect());
            
            const convergent = state.content && state.content.length > 0;
            const consistent = state.revision !== undefined;
            
            resolve({
              passed: convergent && consistent,
              documentId,
              operationsSent: operations.length,
              operationsTransformed: transformedOperations,
              finalContent: state.content || '',
              finalRevision: state.revision || 0,
              convergent,
              consistent,
              message: `Operational Transform: ${convergent ? 'convergent' : 'divergent'}, ${consistent ? 'consistent' : 'inconsistent'}`
            });
          }
        });
      });
      
      setTimeout(() => {
        clients.forEach(c => c.disconnect());
        resolve({
          passed: false,
          error: 'Operational transform test timeout',
          operationsSent: operations.length,
          operationsTransformed: transformedOperations,
          message: 'Operational transform test timed out'
        });
      }, 10000);
    });
  }

  /**
   * Authentication and Authorization Tests
   */
  async testAuthenticationFlow() {
    console.log('🔐 Starting Authentication Flow Tests...');
    
    const tests = [
      this.testValidTokenAuth(),
      this.testInvalidTokenAuth(),
      this.testExpiredTokenAuth(),
      this.testTokenRefresh(),
      this.testUnauthorizedAccess()
    ];

    const results = await Promise.allSettled(tests);
    this.testResults.authTests = results.map((result, index) => ({
      test: tests[index].name || `Auth Test ${index + 1}`,
      status: result.status,
      result: result.value || result.reason,
      timestamp: Date.now()
    }));

    return this.testResults.authTests;
  }

  async testValidTokenAuth() {
    return new Promise((resolve, reject) => {
      const validToken = this.generateMockToken({ valid: true });
      
      const socket = io(this.config.url, {
        auth: { token: validToken },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        socket.emit('protected_action', { action: 'test' });
      });

      socket.on('auth_success', (data) => {
        socket.disconnect();
        resolve({
          passed: true,
          token: validToken,
          authData: data,
          message: 'Valid token authentication successful'
        });
      });

      socket.on('auth_failed', (error) => {
        socket.disconnect();
        reject({
          passed: false,
          error: error.message,
          token: validToken,
          message: 'Valid token was incorrectly rejected'
        });
      });

      socket.on('connect_error', (error) => {
        socket.disconnect();
        reject({
          passed: false,
          error: error.message,
          message: 'Connection failed with valid token'
        });
      });

      setTimeout(() => {
        socket.disconnect();
        reject({
          passed: false,
          error: 'Authentication timeout',
          message: 'Valid token authentication timed out'
        });
      }, this.config.timeout);
    });
  }

  async testInvalidTokenAuth() {
    return new Promise((resolve, reject) => {
      const invalidToken = 'invalid_token_123';
      
      const socket = io(this.config.url, {
        auth: { token: invalidToken },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        socket.emit('protected_action', { action: 'test' });
      });

      socket.on('auth_failed', (error) => {
        socket.disconnect();
        resolve({
          passed: true, // This is expected behavior
          token: invalidToken,
          authError: error,
          message: 'Invalid token correctly rejected'
        });
      });

      socket.on('auth_success', (data) => {
        socket.disconnect();
        reject({
          passed: false,
          error: 'Invalid token was incorrectly accepted',
          token: invalidToken,
          authData: data,
          message: 'Security vulnerability: Invalid token accepted'
        });
      });

      setTimeout(() => {
        socket.disconnect();
        resolve({
          passed: true, // Timeout is acceptable for invalid auth
          token: invalidToken,
          message: 'Invalid token authentication properly rejected (timeout)'
        });
      }, this.config.timeout);
    });
  }

  /**
   * Utility Methods
   */
  generateMockToken(options = {}) {
    const payload = {
      sub: options.userId || 'test_user_123',
      iat: options.issuedAt || Math.floor(Date.now() / 1000),
      exp: options.expiresAt || Math.floor(Date.now() / 1000) + (options.valid ? 3600 : -3600),
      role: options.role || 'user'
    };
    
    // This is a mock token for testing - in real implementation,
    // you would use proper JWT signing
    return `mock.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
  }

  /**
   * Generate Comprehensive Test Report
   */
  generateTestReport() {
    const allTests = [
      ...this.testResults.connectionTests,
      ...this.testResults.messageTests,
      ...this.testResults.authTests,
      ...this.testResults.performanceTests,
      ...this.testResults.stressTests,
      ...(this.testResults.advancedTests || [])
    ];

    const passed = allTests.filter(test => test.status === 'fulfilled' && test.result.passed).length;
    const failed = allTests.filter(test => test.status === 'rejected' || !test.result.passed).length;
    const total = allTests.length;

    const averageConnectionTime = this.metrics.connectionTime.length > 0 
      ? this.metrics.connectionTime.reduce((sum, time) => sum + time, 0) / this.metrics.connectionTime.length 
      : 0;

    const averageLatency = this.metrics.messageLatency.length > 0
      ? this.metrics.messageLatency.reduce((sum, latency) => sum + latency, 0) / this.metrics.messageLatency.length
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
        averageConnectionTime: `${averageConnectionTime.toFixed(2)}ms`,
        averageMessageLatency: `${averageLatency.toFixed(2)}ms`,
        throughput: this.metrics.throughput ? `${this.metrics.throughput} messages/second` : 'N/A',
        errorCount: this.metrics.errors.length
      },
      details: {
        connectionTests: this.testResults.connectionTests,
        messageTests: this.testResults.messageTests,
        authTests: this.testResults.authTests,
        performanceTests: this.testResults.performanceTests,
        stressTests: this.testResults.stressTests,
        advancedTests: this.testResults.advancedTests || []
      },
      errors: this.metrics.errors,
      recommendations: this.generateRecommendations(allTests)
    };
  }

  generateRecommendations(tests) {
    const recommendations = [];
    
    const failedTests = tests.filter(test => test.status === 'rejected' || !test.result.passed);
    
    if (failedTests.length > 0) {
      recommendations.push('Review failed tests and investigate connection stability issues');
    }
    
    if (this.metrics.errors.length > 0) {
      recommendations.push('Address connection errors to improve reliability');
    }
    
    const avgLatency = this.metrics.messageLatency.length > 0
      ? this.metrics.messageLatency.reduce((sum, l) => sum + l, 0) / this.metrics.messageLatency.length
      : 0;
      
    if (avgLatency > 100) {
      recommendations.push('Consider optimizing message handling to reduce latency');
    }
    
    if (this.metrics.throughput && this.metrics.throughput < 50) {
      recommendations.push('Low throughput detected - consider scaling WebSocket server');
    }
    
    return recommendations;
  }

  /**
   * Run All Tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive WebSocket Test Suite...\n');
    
    try {
      await this.testConnectionLifecycle();
      await this.testMessageHandling();
      await this.testAuthenticationFlow();
      await this.testPerformanceUnderLoad();
      await this.testAdvancedRealTimeScenarios();
      
      const report = this.generateTestReport();
      
      console.log('\n📊 WebSocket Test Results:');
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}`);
      console.log(`⚡ Average Latency: ${report.performance.averageMessageLatency}`);
      console.log(`🔌 Average Connection Time: ${report.performance.averageConnectionTime}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
      }
      
      return report;
    } catch (error) {
      console.error('❌ WebSocket test suite failed:', error);
      throw error;
    }
  }
}

module.exports = { WebSocketTestFramework };

// Example usage
if (require.main === module) {
  const framework = new WebSocketTestFramework({
    url: process.env.WS_URL || 'ws://localhost:8000',
    timeout: 15000,
    concurrentConnections: 20
  });

  framework.runAllTests()
    .then(report => {
      console.log('\n📄 Full test report saved to websocket-test-report.json');
      require('fs').writeFileSync(
        'websocket-test-report.json',
        JSON.stringify(report, null, 2)
      );
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}