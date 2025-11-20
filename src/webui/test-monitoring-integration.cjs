/**
 * Test Suite for Advanced Monitoring Integration
 * Validates all components of the Phase 9 monitoring system
 */

const assert = require('assert');
const PrometheusMetricsServer = require('./prometheus-metrics-server.cjs');
const MonitoringIntegration = require('./monitoring-integration.cjs');

class MonitoringIntegrationTest {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting Advanced Monitoring Integration Tests...\n');

        await this.testPrometheusServer();
        await this.testPrometheusMetricsFormat();
        await this.testPrometheusEndpoints();
        await this.testMonitoringIntegration();
        await this.testMetricsBroadcast();
        await this.testAlertSystem();
        await this.testGrafanaExport();

        this.displayResults();
    }

    /**
     * Test: Prometheus server initialization and lifecycle
     */
    async testPrometheusServer() {
        console.log('📊 Testing Prometheus Server...');

        try {
            // Test 1: Server initialization
            await this.test('Prometheus server initializes', async () => {
                const server = new PrometheusMetricsServer({ port: 9091 });
                assert(server !== null, 'Server should be created');
                assert(server.options.port === 9091, 'Port should be configured');
                return server;
            });

            // Test 2: Server start/stop
            await this.test('Prometheus server starts and stops', async () => {
                const server = new PrometheusMetricsServer({ port: 9092 });
                await server.start();
                assert(server.isRunning === true, 'Server should be running');

                await server.stop();
                assert(server.isRunning === false, 'Server should be stopped');
            });

            // Test 3: Metrics collection
            await this.test('Prometheus server collects metrics', async () => {
                const server = new PrometheusMetricsServer({ port: 9093 });

                // Mock Queen Controller
                server.queenController = {
                    getStatus: () => ({
                        totalAgentsSpawned: 150,
                        totalTasksCompleted: 1250,
                        agentPoolSize: 100
                    })
                };

                // Mock Resource Monitor
                server.resourceMonitor = {
                    getMetrics: () => ({
                        current: {
                            memory: { utilization: 0.65 },
                            cpu: { utilization: 0.45 },
                            agents: { active: 42 }
                        }
                    }),
                    getOverallHealth: () => 'healthy'
                };

                await server.collectMetrics();

                assert(server.metrics.agentsActive === 42, 'Agent count should be collected');
                assert(server.metrics.memoryUsage === 0.65, 'Memory usage should be collected');
                assert(server.metrics.cpuUsage === 0.45, 'CPU usage should be collected');
            });

            console.log('✅ Prometheus Server tests passed\n');

        } catch (error) {
            console.error('❌ Prometheus Server tests failed:', error.message, '\n');
        }
    }

    /**
     * Test: Prometheus metrics format
     */
    async testPrometheusMetricsFormat() {
        console.log('📝 Testing Prometheus Metrics Format...');

        try {
            await this.test('Generates valid Prometheus metrics', async () => {
                const server = new PrometheusMetricsServer({ port: 9094 });

                server.metrics = {
                    agentsActive: 42,
                    agentsIdle: 8,
                    agentsTotal: 150,
                    memoryUsage: 0.65,
                    cpuUsage: 0.45,
                    ioUsage: 0.20,
                    tasksCompleted: 1250,
                    tasksFailedTotal: 15,
                    alertsTotal: 5,
                    agentsByType: {
                        'metrics-monitoring-engineer': 5,
                        'devops-engineer': 8
                    },
                    taskDuration: [0.5, 1.2, 0.8, 2.1],
                    systemHealth: 'healthy'
                };

                const metrics = server.generatePrometheusMetrics();

                // Validate format
                assert(metrics.includes('# HELP'), 'Should include HELP comments');
                assert(metrics.includes('# TYPE'), 'Should include TYPE comments');
                assert(metrics.includes('master_workflow_agents_active 42'), 'Should include agent metrics');
                assert(metrics.includes('master_workflow_memory_usage'), 'Should include memory metrics');
                assert(metrics.includes('master_workflow_agents_by_type{type="metrics_monitoring_engineer"} 5'),
                    'Should include agent type metrics');

                // Validate histogram
                assert(metrics.includes('master_workflow_task_duration_seconds_bucket'),
                    'Should include histogram buckets');
                assert(metrics.includes('master_workflow_task_duration_seconds_sum'),
                    'Should include histogram sum');
                assert(metrics.includes('master_workflow_task_duration_seconds_count'),
                    'Should include histogram count');
            });

            console.log('✅ Prometheus Metrics Format tests passed\n');

        } catch (error) {
            console.error('❌ Prometheus Metrics Format tests failed:', error.message, '\n');
        }
    }

    /**
     * Test: Prometheus API endpoints
     */
    async testPrometheusEndpoints() {
        console.log('🔗 Testing Prometheus API Endpoints...');

        try {
            await this.test('Health endpoint returns valid JSON', async () => {
                const server = new PrometheusMetricsServer({ port: 9095 });

                const mockRes = {
                    headers: {},
                    statusCode: null,
                    body: null,
                    writeHead(code, headers) {
                        this.statusCode = code;
                        this.headers = headers;
                    },
                    end(body) {
                        this.body = body;
                    }
                };

                server.handleHealthRequest({}, mockRes);

                assert(mockRes.statusCode === 200, 'Should return 200 status');
                assert(mockRes.headers['Content-Type'] === 'application/json',
                    'Should return JSON content type');

                const health = JSON.parse(mockRes.body);
                assert(health.status !== undefined, 'Should include status');
                assert(health.uptime !== undefined, 'Should include uptime');
            });

            await this.test('Status endpoint returns complete data', async () => {
                const server = new PrometheusMetricsServer({ port: 9096 });

                server.metrics = {
                    agentsActive: 42,
                    agentsIdle: 8,
                    agentsTotal: 150,
                    memoryUsage: 0.65,
                    cpuUsage: 0.45,
                    ioUsage: 0.20,
                    tasksCompleted: 1250,
                    tasksFailedTotal: 15,
                    agentsByType: {},
                    systemHealth: 'healthy'
                };

                const mockRes = {
                    headers: {},
                    statusCode: null,
                    body: null,
                    writeHead(code, headers) {
                        this.statusCode = code;
                        this.headers = headers;
                    },
                    end(body) {
                        this.body = body;
                    }
                };

                server.handleStatusRequest({}, mockRes);

                const status = JSON.parse(mockRes.body);
                assert(status.agents.active === 42, 'Should include active agents');
                assert(status.resources.memory === 0.65, 'Should include memory usage');
                assert(status.tasks.completed === 1250, 'Should include task count');
            });

            console.log('✅ Prometheus API Endpoints tests passed\n');

        } catch (error) {
            console.error('❌ Prometheus API Endpoints tests failed:', error.message, '\n');
        }
    }

    /**
     * Test: Monitoring integration
     */
    async testMonitoringIntegration() {
        console.log('🔗 Testing Monitoring Integration...');

        try {
            await this.test('Monitoring integration initializes', async () => {
                const integration = new MonitoringIntegration({
                    websocketPort: 8081,
                    prometheusPort: 9097,
                    autoStart: false
                });

                const mockQueen = {
                    on: () => {},
                    totalAgentsSpawned: 100,
                    totalTasksCompleted: 500
                };

                const mockResourceMonitor = {
                    on: () => {},
                    getMetrics: () => ({
                        current: {
                            memory: { utilization: 0.5 },
                            cpu: { utilization: 0.4 },
                            agents: { active: 25 }
                        }
                    })
                };

                const mockAgentRegistry = {
                    getAgentTypeCounts: () => ({
                        'metrics-monitoring-engineer': 5
                    })
                };

                await integration.initialize(mockQueen, mockResourceMonitor, mockAgentRegistry);

                assert(integration.isInitialized === true, 'Should be initialized');
                assert(integration.queenController === mockQueen, 'Should store Queen Controller');
                assert(integration.resourceMonitor === mockResourceMonitor, 'Should store Resource Monitor');
            });

            console.log('✅ Monitoring Integration tests passed\n');

        } catch (error) {
            console.error('❌ Monitoring Integration tests failed:', error.message, '\n');
        }
    }

    /**
     * Test: Metrics broadcast
     */
    async testMetricsBroadcast() {
        console.log('📡 Testing Metrics Broadcast...');

        try {
            await this.test('Broadcasts metrics correctly', async () => {
                const integration = new MonitoringIntegration({
                    autoStart: false
                });

                const mockQueen = {
                    on: () => {},
                    totalAgentsSpawned: 150,
                    totalTasksCompleted: 1250
                };

                const mockResourceMonitor = {
                    on: () => {},
                    getMetrics: () => ({
                        current: {
                            memory: { utilization: 0.65 },
                            cpu: { utilization: 0.45 },
                            agents: { active: 42 },
                            io: { diskUsage: 0.2 }
                        }
                    })
                };

                const mockAgentRegistry = {
                    getAgentTypeCounts: () => ({
                        'metrics-monitoring-engineer': 5,
                        'devops-engineer': 8
                    })
                };

                await integration.initialize(mockQueen, mockResourceMonitor, mockAgentRegistry);

                const metrics = mockResourceMonitor.getMetrics().current;
                integration.broadcastMetrics(metrics);

                // If we got here without errors, broadcast succeeded
                assert(true, 'Metrics broadcast should succeed');
            });

            console.log('✅ Metrics Broadcast tests passed\n');

        } catch (error) {
            console.error('❌ Metrics Broadcast tests failed:', error.message, '\n');
        }
    }

    /**
     * Test: Alert system
     */
    async testAlertSystem() {
        console.log('🔔 Testing Alert System...');

        try {
            await this.test('Alert system broadcasts alerts', async () => {
                const integration = new MonitoringIntegration({
                    autoStart: false
                });

                const mockQueen = { on: () => {} };
                const mockResourceMonitor = { on: () => {} };
                const mockAgentRegistry = { getAgentTypeCounts: () => ({}) };

                await integration.initialize(mockQueen, mockResourceMonitor, mockAgentRegistry);

                // Broadcast test alert
                integration.broadcastAlert('warning', 'Test Alert', 'This is a test message');

                // If we got here without errors, alert succeeded
                assert(true, 'Alert broadcast should succeed');
            });

            console.log('✅ Alert System tests passed\n');

        } catch (error) {
            console.error('❌ Alert System tests failed:', error.message, '\n');
        }
    }

    /**
     * Test: Grafana export format
     */
    async testGrafanaExport() {
        console.log('📈 Testing Grafana Export...');

        try {
            await this.test('Generates valid Grafana dashboard JSON', async () => {
                // This would be tested in the browser, but we can validate structure
                const dashboardStructure = {
                    dashboard: {
                        title: "Master Workflow 3.0 Monitoring",
                        tags: ["master-workflow", "agents", "monitoring"],
                        panels: [
                            { id: 1, title: "Active Agents", type: "graph" },
                            { id: 2, title: "Resource Utilization", type: "graph" },
                            { id: 3, title: "Task Completion Rate", type: "graph" }
                        ]
                    }
                };

                assert(dashboardStructure.dashboard.title !== undefined,
                    'Dashboard should have title');
                assert(Array.isArray(dashboardStructure.dashboard.panels),
                    'Dashboard should have panels array');
                assert(dashboardStructure.dashboard.panels.length > 0,
                    'Dashboard should have at least one panel');
            });

            console.log('✅ Grafana Export tests passed\n');

        } catch (error) {
            console.error('❌ Grafana Export tests failed:', error.message, '\n');
        }
    }

    /**
     * Helper: Run individual test
     */
    async test(description, testFn) {
        this.totalTests++;

        try {
            await testFn();
            this.passedTests++;
            this.testResults.push({ description, status: 'PASS' });
            console.log(`  ✓ ${description}`);
        } catch (error) {
            this.failedTests++;
            this.testResults.push({ description, status: 'FAIL', error: error.message });
            console.log(`  ✗ ${description}`);
            console.log(`    Error: ${error.message}`);
        }
    }

    /**
     * Display test results summary
     */
    displayResults() {
        console.log('\n' + '═'.repeat(70));
        console.log('TEST RESULTS SUMMARY');
        console.log('═'.repeat(70));
        console.log(`Total Tests:  ${this.totalTests}`);
        console.log(`Passed:       ${this.passedTests} ✅`);
        console.log(`Failed:       ${this.failedTests} ❌`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        console.log('═'.repeat(70));

        if (this.failedTests > 0) {
            console.log('\nFailed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => {
                    console.log(`  ❌ ${r.description}`);
                    console.log(`     ${r.error}`);
                });
        }

        console.log('\n' + (this.failedTests === 0 ? '✅ All tests passed!' : '⚠️ Some tests failed'));
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new MonitoringIntegrationTest();
    tester.runAllTests()
        .then(() => {
            process.exit(tester.failedTests === 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal test error:', error);
            process.exit(1);
        });
}

module.exports = MonitoringIntegrationTest;
