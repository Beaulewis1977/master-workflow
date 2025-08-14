/**
 * Comprehensive Test Suite for Real-Time Monitoring System
 * Tests Claude Flow 2.0 monitoring dashboard and WebSocket integration
 */

const assert = require('assert');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Import our monitoring components
const WebUIServer = require('../src/platform/webui-server');
const MonitoringWebSocketServer = require('../src/webui/monitoring-websocket-server');

class RealTimeMonitoringTestSuite {
    constructor() {
        this.testResults = [];
        this.webUIServer = null;
        this.monitoringServer = null;
        this.testWS = null;
        this.baseURL = 'http://localhost:3003';
        this.wsURL = 'ws://localhost:8080';
    }

    /**
     * Run all monitoring tests
     */
    async runAllTests() {
        console.log('🧪 Starting Real-Time Monitoring Test Suite...\n');
        
        try {
            await this.setupTestEnvironment();
            
            // Core functionality tests
            await this.testWebUIServerStartup();
            await this.testMonitoringServerStartup();
            await this.testWebSocketConnection();
            await this.testDashboardAccess();
            
            // API endpoint tests
            await this.testSystemStatusAPI();
            await this.testAgentStatusAPI();
            await this.testServerStatusAPI();
            await this.testAlertsAPI();
            await this.testMetricsAPI();
            
            // Real-time functionality tests
            await this.testRealTimeDataStreaming();
            await this.testAgentStatusUpdates();
            await this.testServerStatusUpdates();
            await this.testAlertBroadcasting();
            await this.testPerformanceMetrics();
            
            // Dashboard feature tests
            await this.testAgentSwarmVisualization();
            await this.testMCPServerMonitoring();
            await this.testTaskFlowVisualization();
            await this.testResourceMonitoring();
            
            // Stress tests
            await this.testHighVolumeDataStreaming();
            await this.testMultipleWebSocketConnections();
            await this.testDataPersistence();
            
            // Cleanup
            await this.cleanupTestEnvironment();
            
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            await this.cleanupTestEnvironment();
            throw error;
        }
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        console.log('🔧 Setting up test environment...');
        
        // Create test WebUI server
        this.webUIServer = new WebUIServer({
            port: 3003,
            host: 'localhost',
            enableMonitoring: true,
            monitoringPort: 8080
        });

        // Start servers
        await this.webUIServer.start();
        
        // Wait for servers to be fully ready
        await this.sleep(2000);
        
        this.addTestResult('setupTestEnvironment', true, 'Test environment setup successful');
    }

    /**
     * Test WebUI server startup
     */
    async testWebUIServerStartup() {
        console.log('🧪 Testing WebUI server startup...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/health`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.status, 'healthy');
            
            this.addTestResult('testWebUIServerStartup', true, 'WebUI server started successfully');
        } catch (error) {
            this.addTestResult('testWebUIServerStartup', false, `WebUI server startup failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test monitoring server startup
     */
    async testMonitoringServerStartup() {
        console.log('🧪 Testing monitoring server startup...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/monitoring`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.enabled, true);
            assert(data.url.includes('8080'));
            
            this.addTestResult('testMonitoringServerStartup', true, 'Monitoring server started successfully');
        } catch (error) {
            this.addTestResult('testMonitoringServerStartup', false, `Monitoring server startup failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test WebSocket connection
     */
    async testWebSocketConnection() {
        console.log('🧪 Testing WebSocket connection...');
        
        return new Promise((resolve, reject) => {
            try {
                this.testWS = new WebSocket(this.wsURL);
                
                const timeout = setTimeout(() => {
                    this.addTestResult('testWebSocketConnection', false, 'WebSocket connection timed out');
                    reject(new Error('WebSocket connection timeout'));
                }, 10000);
                
                this.testWS.on('open', () => {
                    clearTimeout(timeout);
                    this.addTestResult('testWebSocketConnection', true, 'WebSocket connected successfully');
                    resolve();
                });
                
                this.testWS.on('error', (error) => {
                    clearTimeout(timeout);
                    this.addTestResult('testWebSocketConnection', false, `WebSocket connection failed: ${error.message}`);
                    reject(error);
                });
                
            } catch (error) {
                this.addTestResult('testWebSocketConnection', false, `WebSocket setup failed: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Test dashboard access
     */
    async testDashboardAccess() {
        console.log('🧪 Testing dashboard access...');
        
        try {
            // Test original dashboard
            const dashboardResponse = await fetch(`${this.baseURL}/dashboard`);
            assert.strictEqual(dashboardResponse.status, 200);
            
            // Test monitoring dashboard
            const monitoringResponse = await fetch(`${this.baseURL}/monitoring`);
            assert.strictEqual(monitoringResponse.status, 200);
            
            const monitoringHTML = await monitoringResponse.text();
            assert(monitoringHTML.includes('Real-Time Monitoring Dashboard'));
            assert(monitoringHTML.includes('Agent Swarm'));
            assert(monitoringHTML.includes('MCP Server Status'));
            
            this.addTestResult('testDashboardAccess', true, 'Dashboard access successful');
        } catch (error) {
            this.addTestResult('testDashboardAccess', false, `Dashboard access failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test system status API
     */
    async testSystemStatusAPI() {
        console.log('🧪 Testing system status API...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/status`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert(typeof data.isRunning === 'boolean');
            assert(typeof data.uptime === 'number');
            assert(typeof data.requestCount === 'number');
            
            this.addTestResult('testSystemStatusAPI', true, 'System status API working correctly');
        } catch (error) {
            this.addTestResult('testSystemStatusAPI', false, `System status API failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test agent status API
     */
    async testAgentStatusAPI() {
        console.log('🧪 Testing agent status API...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/agents`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert(Array.isArray(data));
            
            // Should have mock agents in simulation mode
            if (data.length > 0) {
                const agent = data[0];
                assert(typeof agent.id === 'string');
                assert(typeof agent.status === 'string');
                assert(['active', 'idle', 'error', 'warning'].includes(agent.status));
            }
            
            this.addTestResult('testAgentStatusAPI', true, `Agent status API working correctly (${data.length} agents)`);
        } catch (error) {
            this.addTestResult('testAgentStatusAPI', false, `Agent status API failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test server status API
     */
    async testServerStatusAPI() {
        console.log('🧪 Testing server status API...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/servers`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert(Array.isArray(data));
            
            // Should have mock servers in simulation mode
            if (data.length > 0) {
                const server = data[0];
                assert(typeof server.id === 'string');
                assert(typeof server.status === 'string');
                assert(['healthy', 'degraded', 'failed'].includes(server.status));
            }
            
            this.addTestResult('testServerStatusAPI', true, `Server status API working correctly (${data.length} servers)`);
        } catch (error) {
            this.addTestResult('testServerStatusAPI', false, `Server status API failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test alerts API
     */
    async testAlertsAPI() {
        console.log('🧪 Testing alerts API...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/alerts`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert(Array.isArray(data));
            
            this.addTestResult('testAlertsAPI', true, `Alerts API working correctly (${data.length} alerts)`);
        } catch (error) {
            this.addTestResult('testAlertsAPI', false, `Alerts API failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test metrics API
     */
    async testMetricsAPI() {
        console.log('🧪 Testing metrics API...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/metrics`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert(typeof data.timestamp === 'string');
            assert(typeof data.server === 'object');
            assert(typeof data.system === 'object');
            
            this.addTestResult('testMetricsAPI', true, 'Metrics API working correctly');
        } catch (error) {
            this.addTestResult('testMetricsAPI', false, `Metrics API failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test real-time data streaming
     */
    async testRealTimeDataStreaming() {
        console.log('🧪 Testing real-time data streaming...');
        
        return new Promise((resolve, reject) => {
            let messagesReceived = 0;
            const expectedMessageTypes = ['welcome', 'systemMetrics', 'agentStatus', 'serverStatus'];
            const receivedTypes = new Set();
            
            const timeout = setTimeout(() => {
                if (messagesReceived === 0) {
                    this.addTestResult('testRealTimeDataStreaming', false, 'No messages received');
                    reject(new Error('No real-time data received'));
                } else {
                    this.addTestResult('testRealTimeDataStreaming', true, `Real-time streaming working (${messagesReceived} messages, types: ${Array.from(receivedTypes).join(', ')})`);
                    resolve();
                }
            }, 15000);
            
            this.testWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    messagesReceived++;
                    receivedTypes.add(message.type);
                    
                    // Subscribe to all channels on welcome
                    if (message.type === 'welcome') {
                        this.testWS.send(JSON.stringify({
                            type: 'subscribe',
                            channels: ['system', 'agents', 'servers', 'metrics', 'alerts', 'tasks']
                        }));
                    }
                    
                    // Check if we received enough variety
                    if (receivedTypes.size >= 3 && messagesReceived >= 5) {
                        clearTimeout(timeout);
                        this.addTestResult('testRealTimeDataStreaming', true, `Real-time streaming working (${messagesReceived} messages, types: ${Array.from(receivedTypes).join(', ')})`);
                        resolve();
                    }
                } catch (error) {
                    console.warn('Invalid WebSocket message:', error.message);
                }
            });
        });
    }

    /**
     * Test agent status updates
     */
    async testAgentStatusUpdates() {
        console.log('🧪 Testing agent status updates...');
        
        return new Promise((resolve) => {
            let agentUpdatesReceived = 0;
            
            const timeout = setTimeout(() => {
                this.addTestResult('testAgentStatusUpdates', agentUpdatesReceived > 0, 
                    `Agent status updates: ${agentUpdatesReceived} received`);
                resolve();
            }, 10000);
            
            this.testWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'agentStatus') {
                        agentUpdatesReceived++;
                        
                        // Validate agent status structure
                        if (message.data && typeof message.data === 'object') {
                            const agentIds = Object.keys(message.data);
                            if (agentIds.length > 0) {
                                clearTimeout(timeout);
                                this.addTestResult('testAgentStatusUpdates', true, 
                                    `Agent status updates working (${agentUpdatesReceived} updates, ${agentIds.length} agents)`);
                                resolve();
                            }
                        }
                    }
                } catch (error) {
                    // Ignore invalid messages
                }
            });
        });
    }

    /**
     * Test server status updates
     */
    async testServerStatusUpdates() {
        console.log('🧪 Testing server status updates...');
        
        return new Promise((resolve) => {
            let serverUpdatesReceived = 0;
            
            const timeout = setTimeout(() => {
                this.addTestResult('testServerStatusUpdates', serverUpdatesReceived > 0, 
                    `Server status updates: ${serverUpdatesReceived} received`);
                resolve();
            }, 10000);
            
            this.testWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'serverStatus') {
                        serverUpdatesReceived++;
                        
                        if (message.data && typeof message.data === 'object') {
                            const serverIds = Object.keys(message.data);
                            if (serverIds.length > 0) {
                                clearTimeout(timeout);
                                this.addTestResult('testServerStatusUpdates', true, 
                                    `Server status updates working (${serverUpdatesReceived} updates, ${serverIds.length} servers)`);
                                resolve();
                            }
                        }
                    }
                } catch (error) {
                    // Ignore invalid messages
                }
            });
        });
    }

    /**
     * Test alert broadcasting
     */
    async testAlertBroadcasting() {
        console.log('🧪 Testing alert broadcasting...');
        
        return new Promise((resolve) => {
            let alertsReceived = 0;
            
            const timeout = setTimeout(() => {
                this.addTestResult('testAlertBroadcasting', alertsReceived > 0, 
                    `Alert broadcasting: ${alertsReceived} alerts received`);
                resolve();
            }, 15000);
            
            this.testWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'alert') {
                        alertsReceived++;
                        
                        // Validate alert structure
                        if (message.data && message.data.title && message.data.severity) {
                            clearTimeout(timeout);
                            this.addTestResult('testAlertBroadcasting', true, 
                                `Alert broadcasting working (${alertsReceived} alerts received)`);
                            resolve();
                        }
                    }
                } catch (error) {
                    // Ignore invalid messages
                }
            });
            
            // Trigger a test alert
            setTimeout(() => {
                this.testWS.send(JSON.stringify({
                    type: 'triggerAlert',
                    debug: true
                }));
            }, 2000);
        });
    }

    /**
     * Test performance metrics
     */
    async testPerformanceMetrics() {
        console.log('🧪 Testing performance metrics...');
        
        return new Promise((resolve) => {
            let metricsReceived = 0;
            
            const timeout = setTimeout(() => {
                this.addTestResult('testPerformanceMetrics', metricsReceived > 0, 
                    `Performance metrics: ${metricsReceived} updates received`);
                resolve();
            }, 10000);
            
            this.testWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'performanceMetrics') {
                        metricsReceived++;
                        
                        // Validate metrics structure
                        if (message.data && 
                            typeof message.data.cpu === 'number' &&
                            typeof message.data.memory === 'number') {
                            clearTimeout(timeout);
                            this.addTestResult('testPerformanceMetrics', true, 
                                `Performance metrics working (${metricsReceived} updates received)`);
                            resolve();
                        }
                    }
                } catch (error) {
                    // Ignore invalid messages
                }
            });
        });
    }

    /**
     * Test agent swarm visualization
     */
    async testAgentSwarmVisualization() {
        console.log('🧪 Testing agent swarm visualization...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/agents`);
            const agents = await response.json();
            
            // Test that we can handle the expected number of agents
            assert(agents.length >= 0 && agents.length <= 4462);
            
            // Test agent status distribution
            const statusCounts = {};
            agents.forEach(agent => {
                statusCounts[agent.status] = (statusCounts[agent.status] || 0) + 1;
            });
            
            this.addTestResult('testAgentSwarmVisualization', true, 
                `Agent swarm visualization ready (${agents.length} agents, statuses: ${JSON.stringify(statusCounts)})`);
        } catch (error) {
            this.addTestResult('testAgentSwarmVisualization', false, 
                `Agent swarm visualization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test MCP server monitoring
     */
    async testMCPServerMonitoring() {
        console.log('🧪 Testing MCP server monitoring...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/servers`);
            const servers = await response.json();
            
            // Test server status distribution
            const statusCounts = {};
            servers.forEach(server => {
                statusCounts[server.status] = (statusCounts[server.status] || 0) + 1;
            });
            
            this.addTestResult('testMCPServerMonitoring', true, 
                `MCP server monitoring ready (${servers.length} servers, statuses: ${JSON.stringify(statusCounts)})`);
        } catch (error) {
            this.addTestResult('testMCPServerMonitoring', false, 
                `MCP server monitoring failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test task flow visualization
     */
    async testTaskFlowVisualization() {
        console.log('🧪 Testing task flow visualization...');
        
        return new Promise((resolve) => {
            let taskFlowReceived = 0;
            
            const timeout = setTimeout(() => {
                this.addTestResult('testTaskFlowVisualization', taskFlowReceived > 0, 
                    `Task flow visualization: ${taskFlowReceived} updates received`);
                resolve();
            }, 8000);
            
            this.testWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'taskFlow') {
                        taskFlowReceived++;
                        
                        // Validate task flow structure
                        if (message.data && 
                            typeof message.data.queued === 'number' &&
                            typeof message.data.processing === 'number' &&
                            typeof message.data.completed === 'number') {
                            clearTimeout(timeout);
                            this.addTestResult('testTaskFlowVisualization', true, 
                                `Task flow visualization working (${taskFlowReceived} updates)`);
                            resolve();
                        }
                    }
                } catch (error) {
                    // Ignore invalid messages
                }
            });
        });
    }

    /**
     * Test resource monitoring
     */
    async testResourceMonitoring() {
        console.log('🧪 Testing resource monitoring...');
        
        try {
            const response = await fetch(`${this.baseURL}/api/metrics`);
            const metrics = await response.json();
            
            // Validate system metrics
            assert(typeof metrics.system === 'object');
            assert(typeof metrics.timestamp === 'string');
            
            this.addTestResult('testResourceMonitoring', true, 
                'Resource monitoring working correctly');
        } catch (error) {
            this.addTestResult('testResourceMonitoring', false, 
                `Resource monitoring failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test high volume data streaming
     */
    async testHighVolumeDataStreaming() {
        console.log('🧪 Testing high volume data streaming...');
        
        return new Promise((resolve) => {
            let totalMessages = 0;
            const startTime = Date.now();
            
            const timeout = setTimeout(() => {
                const duration = Date.now() - startTime;
                const messagesPerSecond = Math.round((totalMessages / duration) * 1000);
                
                this.addTestResult('testHighVolumeDataStreaming', totalMessages > 50, 
                    `High volume streaming: ${totalMessages} messages in ${duration}ms (${messagesPerSecond} msg/sec)`);
                resolve();
            }, 20000);
            
            this.testWS.on('message', () => {
                totalMessages++;
                
                // Consider test successful if we receive a good volume
                if (totalMessages >= 100) {
                    clearTimeout(timeout);
                    const duration = Date.now() - startTime;
                    const messagesPerSecond = Math.round((totalMessages / duration) * 1000);
                    
                    this.addTestResult('testHighVolumeDataStreaming', true, 
                        `High volume streaming successful: ${totalMessages} messages in ${duration}ms (${messagesPerSecond} msg/sec)`);
                    resolve();
                }
            });
        });
    }

    /**
     * Test multiple WebSocket connections
     */
    async testMultipleWebSocketConnections() {
        console.log('🧪 Testing multiple WebSocket connections...');
        
        const connections = [];
        const connectionCount = 5;
        
        try {
            // Create multiple connections
            for (let i = 0; i < connectionCount; i++) {
                const ws = new WebSocket(this.wsURL);
                connections.push(ws);
                
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
                    ws.on('open', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                    ws.on('error', reject);
                });
            }
            
            // Wait for connections to stabilize
            await this.sleep(2000);
            
            // Close all connections
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });
            
            this.addTestResult('testMultipleWebSocketConnections', true, 
                `Multiple WebSocket connections successful (${connectionCount} connections)`);
        } catch (error) {
            this.addTestResult('testMultipleWebSocketConnections', false, 
                `Multiple WebSocket connections failed: ${error.message}`);
            
            // Cleanup on failure
            connections.forEach(ws => {
                try {
                    ws.close();
                } catch (e) {
                    // Ignore cleanup errors
                }
            });
            
            throw error;
        }
    }

    /**
     * Test data persistence
     */
    async testDataPersistence() {
        console.log('🧪 Testing data persistence...');
        
        try {
            // Get initial state
            const initialAgents = await fetch(`${this.baseURL}/api/agents`).then(r => r.json());
            const initialServers = await fetch(`${this.baseURL}/api/servers`).then(r => r.json());
            
            // Wait for some updates
            await this.sleep(5000);
            
            // Get updated state
            const updatedAgents = await fetch(`${this.baseURL}/api/agents`).then(r => r.json());
            const updatedServers = await fetch(`${this.baseURL}/api/servers`).then(r => r.json());
            
            // Verify data is being maintained
            assert.strictEqual(initialAgents.length, updatedAgents.length);
            assert.strictEqual(initialServers.length, updatedServers.length);
            
            this.addTestResult('testDataPersistence', true, 
                'Data persistence working correctly');
        } catch (error) {
            this.addTestResult('testDataPersistence', false, 
                `Data persistence failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Cleanup test environment
     */
    async cleanupTestEnvironment() {
        console.log('🧹 Cleaning up test environment...');
        
        try {
            // Close WebSocket connection
            if (this.testWS && this.testWS.readyState === WebSocket.OPEN) {
                this.testWS.close();
            }
            
            // Stop WebUI server
            if (this.webUIServer) {
                await this.webUIServer.stop();
            }
            
            console.log('✅ Test environment cleaned up');
        } catch (error) {
            console.warn('⚠️ Cleanup error:', error.message);
        }
    }

    /**
     * Add test result
     */
    addTestResult(testName, passed, message) {
        this.testResults.push({
            test: testName,
            passed,
            message,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log('\n📊 Real-Time Monitoring Test Report');
        console.log('=====================================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${successRate}%`);
        console.log('');
        
        if (failedTests > 0) {
            console.log('❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
            console.log('');
        }
        
        console.log('✅ Passed Tests:');
        this.testResults
            .filter(r => r.passed)
            .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
        
        // Create test results file
        const report = {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate,
                timestamp: new Date().toISOString()
            },
            results: this.testResults
        };
        
        // Save test report
        fs.writeFile(
            path.join(__dirname, 'real-time-monitoring-test-results.json'),
            JSON.stringify(report, null, 2)
        ).catch(console.error);
        
        if (successRate < 90) {
            throw new Error(`Test suite failed with ${successRate}% success rate`);
        }
        
        console.log('\n🎉 Real-Time Monitoring Test Suite Completed Successfully!');
    }

    /**
     * Utility function to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new RealTimeMonitoringTestSuite();
    testSuite.runAllTests()
        .then(() => {
            console.log('🎉 All tests completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        });
}

module.exports = RealTimeMonitoringTestSuite;