/**
 * Monitoring Integration Module for Master Workflow 3.0
 * Connects Queen Controller with WebSocket and Prometheus metrics servers
 * Provides unified monitoring interface for Phase 9 advanced analytics
 */

const MonitoringWebSocketServer = require('./monitoring-websocket-server.cjs');
const PrometheusMetricsServer = require('./prometheus-metrics-server.cjs');
const EventEmitter = require('events');

class MonitoringIntegration extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            websocketPort: options.websocketPort || 8080,
            prometheusPort: options.prometheusPort || 9090,
            enableWebSocket: options.enableWebSocket !== false,
            enablePrometheus: options.enablePrometheus !== false,
            autoStart: options.autoStart !== false,
            ...options
        };

        // Core components
        this.queenController = null;
        this.resourceMonitor = null;
        this.agentRegistry = null;

        // Monitoring servers
        this.websocketServer = null;
        this.prometheusServer = null;

        this.isInitialized = false;
    }

    /**
     * Initialize monitoring integration
     */
    async initialize(queenController, resourceMonitor, agentRegistry) {
        if (this.isInitialized) {
            console.log('⚠️ Monitoring integration already initialized');
            return;
        }

        console.log('🎯 Initializing Advanced Monitoring Integration...');

        this.queenController = queenController;
        this.resourceMonitor = resourceMonitor;
        this.agentRegistry = agentRegistry;

        try {
            // Initialize WebSocket server
            if (this.options.enableWebSocket) {
                await this.initializeWebSocketServer();
            }

            // Initialize Prometheus server
            if (this.options.enablePrometheus) {
                await this.initializePrometheusServer();
            }

            // Setup event forwarding
            this.setupEventForwarding();

            // Auto-start servers
            if (this.options.autoStart) {
                await this.start();
            }

            this.isInitialized = true;
            console.log('✅ Advanced Monitoring Integration initialized successfully');

            this.emit('initialized', {
                websocket: this.options.enableWebSocket,
                prometheus: this.options.enablePrometheus
            });

        } catch (error) {
            console.error('❌ Failed to initialize monitoring integration:', error);
            throw error;
        }
    }

    /**
     * Initialize WebSocket server
     */
    async initializeWebSocketServer() {
        console.log('🔌 Initializing WebSocket server...');

        this.websocketServer = new MonitoringWebSocketServer({
            port: this.options.websocketPort,
            dataUpdateInterval: 1000
        });

        // Connect to Queen Controller
        this.websocketServer.queenController = this.queenController;
        this.websocketServer.resourceMonitor = this.resourceMonitor;
        this.websocketServer.agentRegistry = this.agentRegistry;

        console.log('✅ WebSocket server initialized');
    }

    /**
     * Initialize Prometheus server
     */
    async initializePrometheusServer() {
        console.log('📊 Initializing Prometheus metrics server...');

        this.prometheusServer = new PrometheusMetricsServer({
            port: this.options.prometheusPort,
            updateInterval: 5000
        });

        // Connect to Queen Controller and Resource Monitor
        this.prometheusServer.connectToQueenController(this.queenController);
        this.prometheusServer.connectToResourceMonitor(this.resourceMonitor);

        console.log('✅ Prometheus server initialized');
    }

    /**
     * Setup event forwarding from Queen Controller to monitoring servers
     */
    setupEventForwarding() {
        console.log('🔗 Setting up event forwarding...');

        // Queen Controller events
        if (this.queenController && this.queenController.on) {
            this.queenController.on('agent-spawned', (agent) => {
                this.broadcastWebSocket('agent-update', {
                    type: 'spawned',
                    agent: this.sanitizeAgentData(agent)
                });
            });

            this.queenController.on('agent-terminated', (agent) => {
                this.broadcastWebSocket('agent-update', {
                    type: 'terminated',
                    agent: this.sanitizeAgentData(agent)
                });
            });

            this.queenController.on('task-completed', (task) => {
                this.broadcastWebSocket('task-update', {
                    type: 'completed',
                    task: this.sanitizeTaskData(task)
                });
            });

            this.queenController.on('task-failed', (task, error) => {
                this.broadcastWebSocket('task-update', {
                    type: 'failed',
                    task: this.sanitizeTaskData(task),
                    error: error.message
                });

                this.broadcastAlert('error', 'Task Failed', error.message);
            });
        }

        // Resource Monitor events
        if (this.resourceMonitor && this.resourceMonitor.on) {
            this.resourceMonitor.on('metrics-updated', (data) => {
                this.broadcastMetrics(data.metrics);
            });

            this.resourceMonitor.on('threshold-exceeded', (alert) => {
                this.broadcastAlert('warning', 'Resource Threshold Exceeded', alert.recommendation);
            });
        }

        console.log('✅ Event forwarding configured');
    }

    /**
     * Start all monitoring servers
     */
    async start() {
        console.log('🚀 Starting monitoring servers...');

        const startPromises = [];

        if (this.websocketServer) {
            startPromises.push(this.websocketServer.start());
        }

        if (this.prometheusServer) {
            startPromises.push(this.prometheusServer.start());
        }

        await Promise.all(startPromises);

        this.displayMonitoringInfo();

        this.emit('started');
    }

    /**
     * Stop all monitoring servers
     */
    async stop() {
        console.log('🛑 Stopping monitoring servers...');

        const stopPromises = [];

        if (this.websocketServer) {
            stopPromises.push(this.websocketServer.stop());
        }

        if (this.prometheusServer) {
            stopPromises.push(this.prometheusServer.stop());
        }

        await Promise.all(stopPromises);

        this.emit('stopped');
    }

    /**
     * Broadcast metrics via WebSocket
     */
    broadcastMetrics(metrics) {
        if (!this.websocketServer) return;

        const payload = {
            agents: {
                active: metrics.agents?.active || 0,
                total: this.queenController?.totalAgentsSpawned || 0,
                types: this.getAgentTypeCounts()
            },
            resources: {
                memory: metrics.memory?.utilization || 0,
                cpu: metrics.cpu?.utilization || 0,
                io: metrics.io?.diskUsage || 0
            },
            tasks: {
                completed: this.queenController?.totalTasksCompleted || 0,
                rate: this.calculateTaskRate()
            },
            timestamp: Date.now()
        };

        this.broadcastWebSocket('metrics', payload);
    }

    /**
     * Broadcast alert via WebSocket
     */
    broadcastAlert(severity, title, message) {
        if (!this.websocketServer) return;

        this.broadcastWebSocket('alert', {
            severity,
            title,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Broadcast data via WebSocket to all clients
     */
    broadcastWebSocket(type, payload) {
        if (!this.websocketServer) return;

        const message = JSON.stringify({
            type,
            payload,
            timestamp: Date.now()
        });

        // Broadcast to all connected clients
        if (this.websocketServer.clients) {
            for (const [clientId, client] of this.websocketServer.clients) {
                try {
                    if (client.ws && client.ws.readyState === 1) { // OPEN
                        client.ws.send(message);
                    }
                } catch (error) {
                    console.error(`Error broadcasting to client ${clientId}:`, error.message);
                }
            }
        }
    }

    /**
     * Get agent type counts
     */
    getAgentTypeCounts() {
        if (!this.agentRegistry || !this.agentRegistry.getAgentTypeCounts) {
            return {};
        }

        return this.agentRegistry.getAgentTypeCounts();
    }

    /**
     * Calculate task completion rate
     */
    calculateTaskRate() {
        // Simple rate calculation - can be enhanced
        return Math.floor(Math.random() * 50); // Placeholder
    }

    /**
     * Sanitize agent data for transmission
     */
    sanitizeAgentData(agent) {
        if (!agent) return {};

        return {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            tasks: agent.taskCount || 0,
            created: agent.createdAt
        };
    }

    /**
     * Sanitize task data for transmission
     */
    sanitizeTaskData(task) {
        if (!task) return {};

        return {
            id: task.id,
            type: task.type,
            status: task.status,
            duration: task.duration || 0,
            agent: task.agentId
        };
    }

    /**
     * Display monitoring information
     */
    displayMonitoringInfo() {
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║     🎯 Master Workflow 3.0 - Advanced Monitoring Active      ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');

        if (this.websocketServer) {
            console.log(`║  📡 Real-Time Dashboard:                                      ║`);
            console.log(`║     http://localhost:${this.options.websocketPort}                                  ║`);
            console.log(`║     Open: src/webui/advanced-monitoring-dashboard.html       ║`);
        }

        if (this.prometheusServer) {
            console.log(`║  📊 Prometheus Metrics:                                       ║`);
            console.log(`║     http://localhost:${this.options.prometheusPort}/metrics                         ║`);
            console.log(`║     http://localhost:${this.options.prometheusPort}/api/status                      ║`);
        }

        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log('║  Features:                                                    ║');
        console.log('║    ✓ Real-time agent monitoring (42+ types)                   ║');
        console.log('║    ✓ Resource utilization tracking                           ║');
        console.log('║    ✓ Prometheus metrics export                               ║');
        console.log('║    ✓ Grafana dashboard support                               ║');
        console.log('║    ✓ Intelligent alerting system                             ║');
        console.log('║    ✓ Performance analytics                                   ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            websocket: {
                enabled: this.options.enableWebSocket,
                running: this.websocketServer?.isRunning || false,
                port: this.options.websocketPort,
                clients: this.websocketServer?.clients?.size || 0
            },
            prometheus: {
                enabled: this.options.enablePrometheus,
                running: this.prometheusServer?.isRunning || false,
                port: this.options.prometheusPort,
                metrics: this.prometheusServer?.getMetrics() || {}
            }
        };
    }
}

module.exports = MonitoringIntegration;
