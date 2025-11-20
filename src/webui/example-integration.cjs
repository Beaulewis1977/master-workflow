/**
 * Example Integration - Master Workflow 3.0 Advanced Monitoring
 *
 * This example shows how to integrate the advanced monitoring dashboard
 * with the Queen Controller and Resource Monitor.
 *
 * Usage:
 *   node src/webui/example-integration.js
 */

const path = require('path');
const MonitoringIntegration = require('./monitoring-integration.cjs');

// Import Queen Controller components
const QueenController = require('../platform/queen-controller');
const ResourceMonitor = require('../../.ai-workflow/intelligence-engine/resource-monitor');
const DynamicAgentRegistry = require('../../.ai-workflow/intelligence-engine/dynamic-agent-registry');

async function startMonitoringDemo() {
    console.log('🚀 Starting Master Workflow 3.0 Advanced Monitoring Demo...\n');

    try {
        // 1. Initialize Queen Controller
        console.log('📋 Step 1: Initializing Queen Controller...');
        const queen = new QueenController({
            maxAgents: null, // Unlimited scaling
            unlimitedScaling: true,
            safetyLimit: 4462,
            memoryThreshold: 0.85,
            cpuThreshold: 0.80
        });

        await queen.initialize();
        console.log('✅ Queen Controller initialized\n');

        // 2. Initialize Resource Monitor
        console.log('📋 Step 2: Initializing Resource Monitor...');
        const resourceMonitor = new ResourceMonitor({
            monitoringInterval: 1000,
            memoryThreshold: 0.85,
            cpuThreshold: 0.80
        });

        await resourceMonitor.start();
        console.log('✅ Resource Monitor started\n');

        // 3. Initialize Agent Registry
        console.log('📋 Step 3: Initializing Agent Registry...');
        const agentRegistry = new DynamicAgentRegistry({
            discoveryPath: path.join(process.cwd(), '.claude', 'agents')
        });

        await agentRegistry.discoverAgents();
        console.log(`✅ Agent Registry initialized (${agentRegistry.getAgentTypes().length} types discovered)\n`);

        // 4. Initialize Advanced Monitoring
        console.log('📋 Step 4: Initializing Advanced Monitoring Integration...');
        const monitoring = new MonitoringIntegration({
            websocketPort: 8080,
            prometheusPort: 9090,
            enableWebSocket: true,
            enablePrometheus: true,
            autoStart: true
        });

        await monitoring.initialize(queen, resourceMonitor, agentRegistry);
        console.log('✅ Advanced Monitoring Integration initialized\n');

        // 5. Connect Resource Monitor to Queen Controller
        console.log('📋 Step 5: Connecting components...');

        // Update Queen Controller with resource monitor
        queen.resourceMonitor = resourceMonitor;
        queen.agentRegistry = agentRegistry;

        console.log('✅ All components connected\n');

        // 6. Start monitoring event simulation
        startEventSimulation(queen, resourceMonitor, monitoring);

        // 7. Display access information
        displayAccessInfo();

        // Handle graceful shutdown
        setupGracefulShutdown(queen, resourceMonitor, monitoring);

    } catch (error) {
        console.error('❌ Error starting monitoring demo:', error);
        process.exit(1);
    }
}

/**
 * Simulate system events for demonstration
 */
function startEventSimulation(queen, resourceMonitor, monitoring) {
    console.log('🎭 Starting event simulation...\n');

    // Simulate agent spawning
    setInterval(() => {
        const agentTypes = [
            'metrics-monitoring-engineer',
            'devops-engineer',
            'security-analyst',
            'performance-optimizer',
            'code-reviewer'
        ];

        const randomType = agentTypes[Math.floor(Math.random() * agentTypes.length)];

        // Emit agent spawned event
        if (queen.emit) {
            queen.emit('agent-spawned', {
                id: `agent-${Date.now()}`,
                name: `${randomType}-${Math.floor(Math.random() * 1000)}`,
                type: randomType,
                status: 'active',
                taskCount: 0,
                createdAt: new Date()
            });
        }
    }, 5000);

    // Simulate task completion
    setInterval(() => {
        if (queen.emit) {
            queen.totalTasksCompleted = (queen.totalTasksCompleted || 0) + 1;

            queen.emit('task-completed', {
                id: `task-${Date.now()}`,
                type: 'analysis',
                status: 'completed',
                duration: Math.random() * 5000,
                agentId: `agent-${Math.floor(Math.random() * 100)}`
            });
        }
    }, 3000);

    // Simulate occasional alerts
    setInterval(() => {
        const alertTypes = [
            { severity: 'info', title: 'System Update', message: 'Agent pool optimized successfully' },
            { severity: 'warning', title: 'High Load', message: 'CPU usage approaching 80%' },
            { severity: 'success', title: 'Milestone Reached', message: '1000 tasks completed' }
        ];

        const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];

        monitoring.broadcastAlert(randomAlert.severity, randomAlert.title, randomAlert.message);
    }, 15000);

    console.log('✅ Event simulation active\n');
}

/**
 * Display access information
 */
function displayAccessInfo() {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 ADVANCED MONITORING DASHBOARD - ACCESS INFORMATION');
    console.log('═'.repeat(70));
    console.log('\n🌐 Dashboard URL:');
    console.log('   file://' + path.join(process.cwd(), 'src/webui/advanced-monitoring-dashboard.html'));
    console.log('\n   1. Open the HTML file in your web browser');
    console.log('   2. The dashboard will automatically connect to the WebSocket server');
    console.log('   3. Real-time metrics will start flowing immediately');

    console.log('\n📡 WebSocket Server:');
    console.log('   ws://localhost:8080');
    console.log('   - Real-time data streaming');
    console.log('   - Agent status updates');
    console.log('   - System alerts');

    console.log('\n📊 Prometheus Metrics:');
    console.log('   http://localhost:9090/metrics');
    console.log('   - Prometheus-formatted metrics');
    console.log('   - Ready for Prometheus scraping');

    console.log('\n🔍 API Endpoints:');
    console.log('   http://localhost:9090/health     - Health check');
    console.log('   http://localhost:9090/api/status - JSON status');
    console.log('   http://localhost:9090/api/agents - Agent information');

    console.log('\n📈 Features Available:');
    console.log('   ✓ Real-time agent monitoring (42+ types)');
    console.log('   ✓ Resource utilization graphs');
    console.log('   ✓ Task completion analytics');
    console.log('   ✓ Alert notifications');
    console.log('   ✓ Prometheus metrics export');
    console.log('   ✓ Grafana dashboard export');

    console.log('\n' + '═'.repeat(70));
    console.log('Press Ctrl+C to stop the monitoring system');
    console.log('═'.repeat(70) + '\n');
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(queen, resourceMonitor, monitoring) {
    const shutdown = async () => {
        console.log('\n\n🛑 Shutting down monitoring system...');

        try {
            await monitoring.stop();
            resourceMonitor.stop();
            // Queen controller shutdown if available
            if (queen.shutdown) {
                await queen.shutdown();
            }

            console.log('✅ Shutdown complete');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

// Start the demo
if (require.main === module) {
    startMonitoringDemo().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { startMonitoringDemo };
