# Advanced Monitoring Dashboard - Master Workflow 3.0

## Overview

The Advanced Monitoring Dashboard provides comprehensive real-time observability for the Master Workflow 3.0 autonomous agent system. Built for Phase 9, it supports monitoring of 4,462+ concurrent agents with Prometheus metrics integration and Grafana-compatible exports.

## Features

### Real-Time Monitoring
- **Live WebSocket Updates**: Sub-second metric updates
- **Agent Activity Tracking**: Monitor all 42+ agent types
- **Resource Utilization**: CPU, Memory, I/O in real-time
- **Task Analytics**: Completion rates and performance metrics

### Prometheus Integration
- **Metrics Endpoint**: Standard Prometheus format at `/metrics`
- **Histogram Support**: Task duration and latency tracking
- **Counter Metrics**: Agent spawns, task completions, errors
- **Gauge Metrics**: Current resource utilization

### Advanced Visualizations
- **Chart.js Graphs**: High-performance, responsive charts
- **Agent Distribution**: Doughnut chart showing agent type breakdown
- **Trend Analysis**: Historical data over 5-minute windows
- **Performance Metrics**: Task completion rate analysis

### Intelligent Alerting
- **Threshold Monitoring**: Automatic alerts for resource limits
- **Alert Severity Levels**: Info, Warning, Error, Success
- **Real-Time Notifications**: Instant alert delivery via WebSocket
- **Alert History**: Track all system events

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Queen Controller                         │
│                  (4,462+ Agent Capacity)                    │
└───────────────┬─────────────────────────────────────┬───────┘
                │                                     │
                ▼                                     ▼
┌───────────────────────────┐       ┌────────────────────────┐
│   Resource Monitor        │       │   Agent Registry       │
│   - Memory tracking       │       │   - 42+ agent types    │
│   - CPU monitoring        │       │   - Capability matrix  │
│   - I/O metrics          │       │   - Performance data   │
└────────────┬──────────────┘       └───────────┬────────────┘
             │                                   │
             └───────────────┬───────────────────┘
                             ▼
                 ┌───────────────────────┐
                 │ Monitoring Integration│
                 └───────┬───────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
┌──────────────────────┐  ┌─────────────────────────┐
│ WebSocket Server     │  │ Prometheus Server       │
│ Port: 8080           │  │ Port: 9090              │
│ - Real-time updates  │  │ - /metrics endpoint     │
│ - Agent events       │  │ - /api/status           │
│ - Alert broadcasts   │  │ - /api/agents           │
└──────────┬───────────┘  └───────────┬─────────────┘
           │                          │
           ▼                          ▼
┌──────────────────────┐  ┌─────────────────────────┐
│ Advanced Dashboard   │  │ Grafana / Prometheus    │
│ (HTML/JS/Chart.js)   │  │ External Monitoring     │
└──────────────────────┘  └─────────────────────────┘
```

## Installation

### Prerequisites
- Node.js 18+ (required for worker threads)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Queen Controller v3.0+
- Resource Monitor v3.0+

### Quick Start

1. **Install Dependencies**
```bash
cd /home/user/master-workflow
npm install ws chart.js
```

2. **Start Monitoring System**
```bash
node src/webui/example-integration.js
```

3. **Open Dashboard**
```bash
# Open in browser
file:///home/user/master-workflow/src/webui/advanced-monitoring-dashboard.html
```

## Configuration

### WebSocket Server Options
```javascript
const monitoring = new MonitoringIntegration({
    websocketPort: 8080,        // WebSocket port
    prometheusPort: 9090,       // Prometheus metrics port
    enableWebSocket: true,      // Enable WebSocket server
    enablePrometheus: true,     // Enable Prometheus server
    autoStart: true            // Auto-start on initialization
});
```

### Resource Monitor Options
```javascript
const resourceMonitor = new ResourceMonitor({
    monitoringInterval: 1000,   // Update interval (ms)
    memoryThreshold: 0.85,      // 85% memory alert
    cpuThreshold: 0.80,         // 80% CPU alert
    contextThreshold: 0.90      // 90% context alert
});
```

## API Endpoints

### WebSocket API
**Endpoint**: `ws://localhost:8080`

**Message Types**:
- `metrics`: System metrics update
- `agent-update`: Agent spawn/termination
- `task-update`: Task completion/failure
- `alert`: System alert notification
- `system-status`: System status update

**Example WebSocket Message**:
```json
{
    "type": "metrics",
    "payload": {
        "agents": {
            "active": 42,
            "total": 150,
            "types": {
                "metrics-monitoring-engineer": 5,
                "devops-engineer": 8
            }
        },
        "resources": {
            "memory": 0.65,
            "cpu": 0.45,
            "io": 0.20
        },
        "tasks": {
            "completed": 1250,
            "rate": 42
        }
    },
    "timestamp": 1700000000000
}
```

### Prometheus Metrics API

#### `/metrics` - Prometheus Metrics
**Format**: Prometheus exposition format
**Update**: Every 5 seconds

**Available Metrics**:
```
# Agent Metrics
master_workflow_agents_active          - Currently active agents
master_workflow_agents_idle            - Idle agents in pool
master_workflow_agents_total           - Total agents spawned (counter)
master_workflow_agents_by_type{type}   - Agents by type

# Resource Metrics
master_workflow_memory_usage           - Memory utilization (0-1)
master_workflow_cpu_usage              - CPU utilization (0-1)
master_workflow_io_usage               - I/O utilization (0-1)

# Task Metrics
master_workflow_tasks_completed        - Total tasks completed
master_workflow_tasks_failed_total     - Total failed tasks
master_workflow_task_duration_seconds  - Task duration histogram

# System Metrics
master_workflow_alerts_total           - Total alerts triggered
master_workflow_uptime_seconds         - System uptime
master_workflow_health{status}         - System health status
```

#### `/api/status` - JSON Status
**Format**: JSON
**Example Response**:
```json
{
    "agents": {
        "active": 42,
        "idle": 8,
        "total": 150,
        "byType": {
            "metrics-monitoring-engineer": 5
        }
    },
    "resources": {
        "memory": 0.65,
        "cpu": 0.45,
        "io": 0.20
    },
    "tasks": {
        "completed": 1250,
        "failed": 15
    },
    "system": {
        "health": "healthy",
        "uptime": 86400,
        "timestamp": "2025-11-20T12:00:00.000Z"
    }
}
```

#### `/api/agents` - Agent Information
**Format**: JSON
**Example Response**:
```json
{
    "total": 150,
    "active": 42,
    "idle": 8,
    "types": {
        "metrics-monitoring-engineer": 5,
        "devops-engineer": 8,
        "security-analyst": 3
    },
    "maxCapacity": 4462
}
```

#### `/health` - Health Check
**Format**: JSON
**Example Response**:
```json
{
    "status": "healthy",
    "uptime": 86400,
    "timestamp": "2025-11-20T12:00:00.000Z",
    "checks": {
        "server": "ok",
        "metrics": "ok"
    }
}
```

## Dashboard Features

### System Overview Panel
- **Active Agents**: Current agent count vs. max capacity (4,462)
- **Memory Usage**: Real-time memory utilization with threshold indicators
- **CPU Usage**: CPU utilization with visual progress bars
- **Tasks Completed**: Total tasks with completion rate

### Real-Time Metrics Graphs
1. **Agent Activity Over Time**
   - Line chart showing agent count over 5 minutes
   - Smooth animations with 1-second updates

2. **Resource Utilization**
   - Multi-line chart: Memory % and CPU %
   - Color-coded: Green (Memory), Orange (CPU)
   - Threshold indicators at 80% and 90%

3. **Task Completion Rate**
   - Bar chart showing tasks/minute
   - Last 10 data points
   - Auto-scaling Y-axis

4. **Agent Type Distribution**
   - Doughnut chart showing top 8 agent types
   - Interactive legend
   - Percentage breakdown

### Agent Registry Panel
- **Search Functionality**: Filter agents by name or type
- **Agent Cards**: Display name, type, status, task count
- **Status Badges**: Active (green), Idle (gray)
- **Real-time Updates**: Instant reflection of agent changes

### Alerts & Notifications
- **Severity Levels**: Info, Warning, Error, Success
- **Icons**: Visual indicators for each severity
- **Timestamps**: Precise alert timing
- **Message Details**: Comprehensive alert information
- **Alert History**: Last 50 alerts retained

### Export Functions

#### Prometheus Export
Click "📊 Export Prometheus" to download `prometheus-metrics.txt`:
```
# HELP master_workflow_agents_active Number of active agents
# TYPE master_workflow_agents_active gauge
master_workflow_agents_active 42
...
```

#### Grafana Export
Click "📈 Export Grafana" to download `grafana-dashboard.json`:
```json
{
    "dashboard": {
        "title": "Master Workflow 3.0 Monitoring",
        "panels": [...]
    }
}
```

## Integration Examples

### Basic Integration
```javascript
const MonitoringIntegration = require('./src/webui/monitoring-integration');

// Initialize monitoring
const monitoring = new MonitoringIntegration();
await monitoring.initialize(queenController, resourceMonitor, agentRegistry);
```

### Custom WebSocket Port
```javascript
const monitoring = new MonitoringIntegration({
    websocketPort: 3000,
    prometheusPort: 9091
});
```

### Prometheus-Only Mode
```javascript
const monitoring = new MonitoringIntegration({
    enableWebSocket: false,
    enablePrometheus: true
});
```

### Manual Start
```javascript
const monitoring = new MonitoringIntegration({
    autoStart: false
});

await monitoring.initialize(queen, resourceMonitor, agentRegistry);
// ... do other setup ...
await monitoring.start();
```

## Grafana Configuration

### Add Prometheus Data Source
1. Open Grafana → Configuration → Data Sources
2. Add Prometheus data source
3. URL: `http://localhost:9090`
4. Save & Test

### Import Dashboard
1. Click "📈 Export Grafana" in dashboard
2. Grafana → Dashboards → Import
3. Upload `grafana-dashboard.json`
4. Select Prometheus data source
5. Import

### Custom Panels
```json
{
    "title": "Active Agents",
    "type": "graph",
    "targets": [{
        "expr": "master_workflow_agents_active",
        "refId": "A"
    }]
}
```

## Performance Optimization

### Dashboard Performance
- **Chart Updates**: Uses `update('none')` for 60fps rendering
- **History Length**: Limited to 300 data points (5 minutes)
- **Lazy Loading**: Charts initialized only when visible
- **Debouncing**: Search input debounced to 300ms

### Server Performance
- **WebSocket Compression**: Enabled by default
- **Metrics Caching**: 5-second cache for Prometheus metrics
- **Event Batching**: Metrics updates batched per second
- **Connection Limits**: Max 1000 WebSocket clients

### Memory Management
- **Alert Limit**: 50 most recent alerts retained
- **Metric History**: 1000 measurements for histograms
- **Client Cleanup**: Automatic stale connection removal

## Troubleshooting

### WebSocket Connection Issues
**Problem**: "Reconnecting..." message persists
**Solution**:
```bash
# Check if WebSocket server is running
netstat -an | grep 8080

# Restart monitoring system
node src/webui/example-integration.js
```

### Prometheus Metrics Not Available
**Problem**: `/metrics` returns 404
**Solution**:
```bash
# Check Prometheus server status
curl http://localhost:9090/health

# Verify server is running
ps aux | grep prometheus-metrics-server
```

### Dashboard Not Updating
**Problem**: Static data, no real-time updates
**Solution**:
1. Open browser console (F12)
2. Check for WebSocket errors
3. Verify WebSocket URL in dashboard HTML
4. Ensure firewall allows port 8080

### High Memory Usage
**Problem**: Dashboard consuming excessive memory
**Solution**:
1. Reduce `historyLength` in dashboard config
2. Clear browser cache
3. Close other browser tabs
4. Limit alert retention to 25

## Security Considerations

### Production Deployment
- **Authentication**: Add JWT authentication to WebSocket
- **HTTPS**: Use TLS for WebSocket (wss://)
- **CORS**: Restrict allowed origins
- **Rate Limiting**: Implement connection rate limits
- **Firewall**: Restrict access to monitoring ports

### Recommended Configuration
```javascript
const monitoring = new MonitoringIntegration({
    websocketPort: 8080,
    prometheusPort: 9090,
    maxConnections: 100,           // Limit connections
    requireAuth: true,             // Enable authentication
    allowedOrigins: ['app.com'],   // CORS whitelist
    enableCompression: true        // Reduce bandwidth
});
```

## Contributing

### Adding Custom Metrics
```javascript
// In Queen Controller
this.emit('custom-metric', {
    name: 'my_metric',
    value: 42,
    type: 'gauge'
});

// In Prometheus Server
prometheusServer.metrics.customMetrics['my_metric'] = 42;
```

### Adding Dashboard Panels
1. Edit `advanced-monitoring-dashboard.html`
2. Add new card in appropriate grid section
3. Initialize new Chart.js chart in `initializeCharts()`
4. Update data in `updateCharts()`

## License

Master Workflow 3.0 - Advanced Monitoring Dashboard
© 2025 Master Workflow Project

## Support

- **Documentation**: `/src/webui/ADVANCED-MONITORING-README.md`
- **Examples**: `/src/webui/example-integration.js`
- **Issues**: Report via GitHub Issues
- **Updates**: Check Phase 9 release notes

## Version History

- **v3.0.0** (2025-11-20): Initial Phase 9 release
  - Advanced monitoring dashboard
  - Prometheus metrics integration
  - Grafana export support
  - 42+ agent type tracking
  - 4,462 agent capacity support

---

**Last Updated**: 2025-11-20
**Phase**: 9 - Multi-Node Scaling & Advanced Analytics
**Status**: Production Ready
