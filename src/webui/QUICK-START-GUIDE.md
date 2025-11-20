# Quick Start Guide - Advanced Monitoring Dashboard

## 5-Minute Setup

### Step 1: Start the Monitoring System (30 seconds)
```bash
cd /home/user/master-workflow
node src/webui/example-integration.js
```

You'll see output like:
```text
🚀 Starting Master Workflow 3.0 Advanced Monitoring Demo...
✅ Queen Controller initialized
✅ Resource Monitor started
✅ Agent Registry initialized (42 types discovered)
✅ Advanced Monitoring Integration initialized

╔═══════════════════════════════════════════════════════════════╗
║     🎯 Master Workflow 3.0 - Advanced Monitoring Active      ║
╠═══════════════════════════════════════════════════════════════╣
║  📡 Real-Time Dashboard:                                      ║
║     http://localhost:8080                                     ║
║     Open: src/webui/advanced-monitoring-dashboard.html       ║
║  📊 Prometheus Metrics:                                       ║
║     http://localhost:9090/metrics                            ║
╚═══════════════════════════════════════════════════════════════╝
```

### Step 2: Open the Dashboard (10 seconds)
1. Open your web browser
2. Navigate to: `file:///home/user/master-workflow/src/webui/advanced-monitoring-dashboard.html`
3. The dashboard will automatically connect to the WebSocket server
4. You'll see "Connected to WebSocket" in the bottom-right corner

### Step 3: Verify It's Working (5 seconds)
- Check the **Active Agents** counter is updating
- Watch the **Agent Activity Over Time** graph populate
- Look for the "Dashboard Initialized" alert

## What You're Seeing

### Top Row - System Overview
- **Active Agents**: Current agents / 4,462 max capacity
- **Memory Usage**: Real-time memory utilization (target: <85%)
- **CPU Usage**: Real-time CPU utilization (target: <80%)
- **Tasks Completed**: Total tasks with rate per minute

### Middle Section - Performance Graphs
- **Agent Activity**: Line chart showing agent count trends
- **Resource Utilization**: Memory and CPU over time
- **Task Completion Rate**: Tasks/minute bar chart
- **Agent Type Distribution**: Breakdown of 42+ agent types

### Bottom Section - Details
- **Agent Registry**: Searchable list of all agent types
- **System Alerts**: Real-time notifications and warnings

## Testing the Features

### 1. Export Prometheus Metrics
- Click "📊 Export Prometheus" button
- File `prometheus-metrics.txt` downloads
- Contains all metrics in Prometheus format

### 2. Export Grafana Dashboard
- Click "📈 Export Grafana" button
- File `grafana-dashboard.json` downloads
- Import into Grafana for advanced visualization

### 3. Search Agents
- Type in the agent search box (e.g., "metrics")
- Agent list filters in real-time

### 4. Monitor Alerts
- Watch the alerts panel for system notifications
- Click "🗑️ Clear Alerts" to reset

## Access Prometheus Metrics Directly

```bash
# View all metrics
curl http://localhost:9090/metrics

# View system status (JSON)
curl http://localhost:9090/api/status

# View agent information (JSON)
curl http://localhost:9090/api/agents

# Health check
curl http://localhost:9090/health
```

## Stopping the System

Press `Ctrl+C` in the terminal where you ran `example-integration.js`

## Dashboard Layout Description

```text
┌─────────────────────────────────────────────────────────────┐
│ Master Workflow 3.0 - Advanced Monitoring    [Status: ●]   │
│ [Export Prometheus] [Export Grafana] [Refresh] [Clear]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Active   │ │  Memory   │ │   CPU    │ │  Tasks   │    │
│  │  Agents   │ │   Usage   │ │  Usage   │ │Completed │    │
│  │    42     │ │   65.3%   │ │  45.2%   │ │   1,250  │    │
│  │ ↑ 42/4462 │ │ ████████  │ │ ████▁▁▁  │ │ ↑ 42/min │    │
│  └───────────┘ └───────────┘ └──────────┘ └──────────┘    │
│                                                              │
│  ┌────────────────────────┐ ┌────────────────────────┐     │
│  │ Agent Activity         │ │ Resource Utilization   │     │
│  │ Over Time             │ │ CPU, Memory, I/O       │     │
│  │                       │ │                        │     │
│  │    ╱╲                │ │  ━━━━ Memory          │     │
│  │   ╱  ╲    ╱╲         │ │  ····· CPU            │     │
│  │  ╱    ╲  ╱  ╲        │ │                        │     │
│  │ ╱      ╲╱    ╲       │ │                        │     │
│  └────────────────────────┘ └────────────────────────┘     │
│                                                              │
│  ┌────────────────────────┐ ┌────────────────────────┐     │
│  │ Task Completion Rate   │ │ Agent Type             │     │
│  │ Tasks per minute       │ │ Distribution           │     │
│  │                       │ │                        │     │
│  │  ▂▅█▆▄▃▂             │ │      ◐ Metrics (5)    │     │
│  │                       │ │      ◑ DevOps (8)     │     │
│  │                       │ │      ◒ Security (3)   │     │
│  └────────────────────────┘ └────────────────────────┘     │
│                                                              │
│  ┌────────────────────────┐ ┌────────────────────────┐     │
│  │ Agent Registry (42+)   │ │ System Alerts [5]      │     │
│  │ [Search: _________]    │ │                        │     │
│  │                       │ │ ✅ Dashboard Init     │     │
│  │ ● metrics-monitoring  │ │ ⚠️ High CPU Load      │     │
│  │ ● devops-engineer     │ │ ℹ️ Agent Pool Opt    │     │
│  │ ● security-analyst    │ │                        │     │
│  └────────────────────────┘ └────────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Detailed System Statistics                           │  │
│  │  [150 Total] [42 Types] [4,462 Max] [5ms Latency]   │  │
│  │  [0% Errors] [24h Uptime]                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                     [● Connected to WebSocket]
```

## Key Metrics Explained

### Active Agents
- **Current**: Number of agents currently executing tasks
- **Maximum**: 4,462 (calculated based on system resources)
- **Trend**: Shows increase/decrease from last measurement

### Memory Usage
- **Green (<80%)**: Healthy operation
- **Orange (80-90%)**: Warning threshold
- **Red (>90%)**: Critical - scaling may be limited

### CPU Usage
- **Target**: <80% for optimal performance
- **Calculation**: Average across all cores
- **Load Average**: Available in detailed stats

### Tasks Completed
- **Counter**: Total since system start
- **Rate**: Tasks completed per minute (rolling average)

### Agent Types
- **Total Types**: 42+ specialized agent types
- **Distribution**: Shows most active agent types
- **Search**: Filter by name or capability

## Troubleshooting

### "Reconnecting..." Status
**Cause**: WebSocket server not running or port blocked
**Fix**: Ensure `example-integration.js` is running, check port 8080

### No Data Updating
**Cause**: Queen Controller not emitting events
**Fix**: Verify Queen Controller is initialized and running

### High Memory/CPU
**Cause**: Too many agents spawned
**Fix**: System will auto-scale down based on thresholds

### Charts Not Loading
**Cause**: Chart.js CDN not accessible
**Fix**: Check internet connection or use local Chart.js

## Next Steps

### Set Up Grafana
1. Install Grafana: `docker run -d -p 3000:3000 grafana/grafana`
2. Add Prometheus data source: `http://localhost:9090`
3. Import dashboard: Click "Export Grafana" and upload JSON

### Configure Alerts
Edit `monitoring-integration.js` to add custom alert thresholds:
```javascript
resourceMonitor.on('metrics-updated', (data) => {
    if (data.metrics.memory.utilization > 0.75) {
        monitoring.broadcastAlert('warning', 'Memory Alert',
            'Memory usage above 75%');
    }
});
```

### Add Custom Metrics
In your Queen Controller code:
```javascript
queen.emit('custom-metric', {
    name: 'deployment_count',
    value: 42,
    type: 'counter'
});
```

## Production Checklist

- [ ] Set up authentication for WebSocket
- [ ] Configure HTTPS/WSS for secure connections
- [ ] Set up Prometheus scraping (5s interval recommended)
- [ ] Import Grafana dashboard
- [ ] Configure alert routing (Slack, PagerDuty, etc.)
- [ ] Set up log aggregation (ELK, Loki)
- [ ] Configure backup for metrics data
- [ ] Set up monitoring for the monitoring system itself

---

**Need Help?** Check `ADVANCED-MONITORING-README.md` for detailed documentation
