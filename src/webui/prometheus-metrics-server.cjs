/**
 * Prometheus Metrics Server for Master Workflow 3.0
 * Exposes metrics in Prometheus format for scraping
 * Integrates with Queen Controller and Resource Monitor
 */

const http = require('http');
const EventEmitter = require('events');

class PrometheusMetricsServer extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            port: options.port || 9090,
            host: options.host || 'localhost',
            metricsPath: options.metricsPath || '/metrics',
            healthPath: options.healthPath || '/health',
            updateInterval: options.updateInterval || 5000,
            ...options
        };

        this.server = null;
        this.isRunning = false;
        this.queenController = null;
        this.resourceMonitor = null;

        // Metrics storage
        this.metrics = {
            // Gauges
            agentsActive: 0,
            agentsIdle: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            ioUsage: 0,

            // Counters
            agentsTotal: 0,
            tasksCompleted: 0,
            tasksFailedTotal: 0,
            alertsTotal: 0,

            // Histograms
            taskDuration: [],
            agentSpawnDuration: [],

            // Agent types
            agentsByType: {},

            // System info
            systemUptime: 0,
            systemHealth: 'healthy'
        };

        this.startTime = Date.now();
    }

    /**
     * Start the Prometheus metrics server
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Prometheus metrics server is already running');
            return;
        }

        console.log('🚀 Starting Prometheus Metrics Server...');

        try {
            await this.createHttpServer();
            await this.startMetricsCollection();

            this.isRunning = true;
            console.log(`✅ Prometheus metrics server running on http://${this.options.host}:${this.options.port}${this.options.metricsPath}`);

            this.emit('started', {
                host: this.options.host,
                port: this.options.port,
                metricsEndpoint: `http://${this.options.host}:${this.options.port}${this.options.metricsPath}`
            });

        } catch (error) {
            console.error('❌ Failed to start Prometheus metrics server:', error);
            throw error;
        }
    }

    /**
     * Stop the Prometheus metrics server
     */
    async stop() {
        if (!this.isRunning) {
            console.log('⚠️ Prometheus metrics server is not running');
            return;
        }

        console.log('🛑 Stopping Prometheus Metrics Server...');

        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.isRunning = false;
                    this.emit('stopped');
                    console.log('✅ Prometheus metrics server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Create HTTP server for metrics
     */
    async createHttpServer() {
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // Route handling
            if (req.url === this.options.metricsPath) {
                this.handleMetricsRequest(req, res);
            } else if (req.url === this.options.healthPath) {
                this.handleHealthRequest(req, res);
            } else if (req.url === '/api/status') {
                this.handleStatusRequest(req, res);
            } else if (req.url === '/api/agents') {
                this.handleAgentsRequest(req, res);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });

        return new Promise((resolve, reject) => {
            this.server.listen(this.options.port, this.options.host, () => {
                resolve();
            });

            this.server.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Handle metrics request - Prometheus format
     */
    handleMetricsRequest(req, res) {
        const prometheusMetrics = this.generatePrometheusMetrics();

        res.writeHead(200, {
            'Content-Type': 'text/plain; version=0.0.4',
            'Cache-Control': 'no-cache'
        });

        res.end(prometheusMetrics);
    }

    /**
     * Generate Prometheus-formatted metrics
     */
    generatePrometheusMetrics() {
        const lines = [];

        // Agent metrics
        lines.push('# HELP master_workflow_agents_active Number of currently active agents');
        lines.push('# TYPE master_workflow_agents_active gauge');
        lines.push(`master_workflow_agents_active ${this.metrics.agentsActive}`);
        lines.push('');

        lines.push('# HELP master_workflow_agents_idle Number of idle agents in pool');
        lines.push('# TYPE master_workflow_agents_idle gauge');
        lines.push(`master_workflow_agents_idle ${this.metrics.agentsIdle}`);
        lines.push('');

        lines.push('# HELP master_workflow_agents_total Total number of agents spawned since start');
        lines.push('# TYPE master_workflow_agents_total counter');
        lines.push(`master_workflow_agents_total ${this.metrics.agentsTotal}`);
        lines.push('');

        // Agent types
        lines.push('# HELP master_workflow_agents_by_type Number of agents by type');
        lines.push('# TYPE master_workflow_agents_by_type gauge');
        for (const [type, count] of Object.entries(this.metrics.agentsByType)) {
            const sanitizedType = type.replace(/[^a-zA-Z0-9_]/g, '_');
            lines.push(`master_workflow_agents_by_type{type="${sanitizedType}"} ${count}`);
        }
        lines.push('');

        // Resource metrics
        lines.push('# HELP master_workflow_memory_usage Memory utilization (0-1)');
        lines.push('# TYPE master_workflow_memory_usage gauge');
        lines.push(`master_workflow_memory_usage ${this.metrics.memoryUsage.toFixed(4)}`);
        lines.push('');

        lines.push('# HELP master_workflow_cpu_usage CPU utilization (0-1)');
        lines.push('# TYPE master_workflow_cpu_usage gauge');
        lines.push(`master_workflow_cpu_usage ${this.metrics.cpuUsage.toFixed(4)}`);
        lines.push('');

        lines.push('# HELP master_workflow_io_usage I/O utilization (0-1)');
        lines.push('# TYPE master_workflow_io_usage gauge');
        lines.push(`master_workflow_io_usage ${this.metrics.ioUsage.toFixed(4)}`);
        lines.push('');

        // Task metrics
        lines.push('# HELP master_workflow_tasks_completed Total tasks completed');
        lines.push('# TYPE master_workflow_tasks_completed counter');
        lines.push(`master_workflow_tasks_completed ${this.metrics.tasksCompleted}`);
        lines.push('');

        lines.push('# HELP master_workflow_tasks_failed_total Total tasks that failed');
        lines.push('# TYPE master_workflow_tasks_failed_total counter');
        lines.push(`master_workflow_tasks_failed_total ${this.metrics.tasksFailedTotal}`);
        lines.push('');

        // Task duration histogram
        if (this.metrics.taskDuration.length > 0) {
            const buckets = this.calculateHistogramBuckets(this.metrics.taskDuration);
            lines.push('# HELP master_workflow_task_duration_seconds Task execution duration');
            lines.push('# TYPE master_workflow_task_duration_seconds histogram');

            let cumulativeCount = 0;
            for (const bucket of buckets) {
                cumulativeCount += bucket.count;
                lines.push(`master_workflow_task_duration_seconds_bucket{le="${bucket.le}"} ${cumulativeCount}`);
            }

            lines.push(`master_workflow_task_duration_seconds_bucket{le="+Inf"} ${this.metrics.taskDuration.length}`);
            lines.push(`master_workflow_task_duration_seconds_sum ${this.metrics.taskDuration.reduce((a, b) => a + b, 0)}`);
            lines.push(`master_workflow_task_duration_seconds_count ${this.metrics.taskDuration.length}`);
            lines.push('');
        }

        // Alert metrics
        lines.push('# HELP master_workflow_alerts_total Total number of alerts triggered');
        lines.push('# TYPE master_workflow_alerts_total counter');
        lines.push(`master_workflow_alerts_total ${this.metrics.alertsTotal}`);
        lines.push('');

        // System metrics
        lines.push('# HELP master_workflow_uptime_seconds System uptime in seconds');
        lines.push('# TYPE master_workflow_uptime_seconds gauge');
        lines.push(`master_workflow_uptime_seconds ${Math.floor((Date.now() - this.startTime) / 1000)}`);
        lines.push('');

        lines.push('# HELP master_workflow_health System health status (1=healthy, 0=unhealthy)');
        lines.push('# TYPE master_workflow_health gauge');
        lines.push(`master_workflow_health{status="${this.metrics.systemHealth}"} ${this.metrics.systemHealth === 'healthy' ? 1 : 0}`);
        lines.push('');

        // Process metrics
        const memUsage = process.memoryUsage();
        lines.push('# HELP process_resident_memory_bytes Resident memory size in bytes');
        lines.push('# TYPE process_resident_memory_bytes gauge');
        lines.push(`process_resident_memory_bytes ${memUsage.rss}`);
        lines.push('');

        lines.push('# HELP process_heap_bytes Process heap size in bytes');
        lines.push('# TYPE process_heap_bytes gauge');
        lines.push(`process_heap_bytes ${memUsage.heapUsed}`);
        lines.push('');

        return lines.join('\n');
    }

    /**
     * Calculate histogram buckets
     */
    calculateHistogramBuckets(values) {
        const buckets = [
            { le: 0.1, count: 0 },
            { le: 0.5, count: 0 },
            { le: 1.0, count: 0 },
            { le: 2.0, count: 0 },
            { le: 5.0, count: 0 },
            { le: 10.0, count: 0 },
            { le: 30.0, count: 0 },
            { le: 60.0, count: 0 }
        ];

        for (const value of values) {
            for (const bucket of buckets) {
                if (value <= bucket.le) {
                    bucket.count++;
                }
            }
        }

        return buckets;
    }

    /**
     * Handle health check request
     */
    handleHealthRequest(req, res) {
        const health = {
            status: this.metrics.systemHealth,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            timestamp: new Date().toISOString(),
            checks: {
                server: 'ok',
                metrics: this.isRunning ? 'ok' : 'degraded'
            }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
    }

    /**
     * Handle status request - JSON format
     */
    handleStatusRequest(req, res) {
        const status = {
            agents: {
                active: this.metrics.agentsActive,
                idle: this.metrics.agentsIdle,
                total: this.metrics.agentsTotal,
                byType: this.metrics.agentsByType
            },
            resources: {
                memory: this.metrics.memoryUsage,
                cpu: this.metrics.cpuUsage,
                io: this.metrics.ioUsage
            },
            tasks: {
                completed: this.metrics.tasksCompleted,
                failed: this.metrics.tasksFailedTotal
            },
            system: {
                health: this.metrics.systemHealth,
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                timestamp: new Date().toISOString()
            }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }

    /**
     * Handle agents request - JSON format
     */
    handleAgentsRequest(req, res) {
        const agents = {
            total: this.metrics.agentsTotal,
            active: this.metrics.agentsActive,
            idle: this.metrics.agentsIdle,
            types: this.metrics.agentsByType,
            maxCapacity: 4462
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(agents, null, 2));
    }

    /**
     * Start automatic metrics collection
     */
    async startMetricsCollection() {
        // Collect metrics at regular intervals
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, this.options.updateInterval);

        // Initial collection
        await this.collectMetrics();
    }

    /**
     * Collect metrics from Queen Controller and Resource Monitor
     */
    async collectMetrics() {
        try {
            // Collect from Resource Monitor
            if (this.resourceMonitor) {
                const resourceMetrics = this.resourceMonitor.getMetrics();

                this.metrics.memoryUsage = resourceMetrics.current.memory?.utilization || 0;
                this.metrics.cpuUsage = resourceMetrics.current.cpu?.utilization || 0;
                this.metrics.agentsActive = resourceMetrics.current.agents?.active || 0;
                this.metrics.systemHealth = this.resourceMonitor.getOverallHealth() || 'healthy';
            }

            // Collect from Queen Controller
            if (this.queenController) {
                const status = this.queenController.getStatus ? this.queenController.getStatus() : {};

                this.metrics.agentsTotal = status.totalAgentsSpawned || 0;
                this.metrics.tasksCompleted = status.totalTasksCompleted || 0;
                this.metrics.agentsIdle = (status.agentPoolSize || 0) - this.metrics.agentsActive;

                // Collect agent types
                if (this.queenController.agentRegistry) {
                    this.metrics.agentsByType = this.queenController.agentRegistry.getAgentTypeCounts ?
                        this.queenController.agentRegistry.getAgentTypeCounts() : {};
                }
            }

            this.emit('metrics-collected', this.metrics);

        } catch (error) {
            console.error('Error collecting metrics:', error);
            this.emit('collection-error', error);
        }
    }

    /**
     * Connect to Queen Controller
     */
    connectToQueenController(queenController) {
        this.queenController = queenController;
        console.log('✅ Prometheus server connected to Queen Controller');

        // Listen for Queen Controller events
        if (queenController.on) {
            queenController.on('task-completed', () => {
                this.metrics.tasksCompleted++;
            });

            queenController.on('task-failed', () => {
                this.metrics.tasksFailedTotal++;
            });

            queenController.on('agent-spawned', (agent) => {
                this.metrics.agentsTotal++;
                if (agent.type) {
                    this.metrics.agentsByType[agent.type] = (this.metrics.agentsByType[agent.type] || 0) + 1;
                }
            });

            queenController.on('alert', () => {
                this.metrics.alertsTotal++;
            });
        }
    }

    /**
     * Connect to Resource Monitor
     */
    connectToResourceMonitor(resourceMonitor) {
        this.resourceMonitor = resourceMonitor;
        console.log('✅ Prometheus server connected to Resource Monitor');

        // Listen for Resource Monitor events
        if (resourceMonitor.on) {
            resourceMonitor.on('metrics-updated', (data) => {
                this.metrics.memoryUsage = data.metrics?.memory?.utilization || 0;
                this.metrics.cpuUsage = data.metrics?.cpu?.utilization || 0;
                this.metrics.ioUsage = data.metrics?.io?.diskUsage || 0;
            });

            resourceMonitor.on('threshold-exceeded', () => {
                this.metrics.alertsTotal++;
            });
        }
    }

    /**
     * Record task duration
     */
    recordTaskDuration(durationSeconds) {
        this.metrics.taskDuration.push(durationSeconds);

        // Keep only last 1000 measurements
        if (this.metrics.taskDuration.length > 1000) {
            this.metrics.taskDuration = this.metrics.taskDuration.slice(-1000);
        }
    }

    /**
     * Record agent spawn duration
     */
    recordAgentSpawnDuration(durationSeconds) {
        this.metrics.agentSpawnDuration.push(durationSeconds);

        // Keep only last 1000 measurements
        if (this.metrics.agentSpawnDuration.length > 1000) {
            this.metrics.agentSpawnDuration = this.metrics.agentSpawnDuration.slice(-1000);
        }
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
}

module.exports = PrometheusMetricsServer;
