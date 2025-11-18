# Process Manager Enhancements - Phase 5 Implementation

## Overview
Enhanced the existing `process.js` file with comprehensive process detection and management capabilities for Phase 5 of the AI Workflow Uninstaller.

## Key Improvements

### 1. Enhanced tmux Session Detection
- **Improved Pattern Matching**: Added support for wildcard patterns (`queen-agent-*`, `ai-workflow-*`, etc.)
- **Detailed Session Information**: Captures session creation time, window count, and running commands
- **Session Validation**: Verifies session content before marking for termination
- **Better Filtering**: More robust detection of workflow-related sessions

```javascript
// Enhanced patterns supported
workflowPatterns: [
    'queen-agent-*',
    'ai-workflow-*', 
    'workflow-*',
    'hive-mind-*',
    'claude-flow-*',
    'sparc-*'
]
```

### 2. Robust Background Process Detection
- **Enhanced Process Patterns**: Extended search patterns for all workflow components
- **Process Tree Analysis**: Tracks parent-child relationships
- **Cross-Platform Support**: Unix and Windows process detection
- **Safety Validation**: Ownership and system process verification

```javascript
// Enhanced process patterns
processPatterns: [
    'ai-workflow',
    'queen-controller',
    'queen-agent', 
    'supervisor',
    'workflow-runner',
    'orchestrator',
    'hive-mind',
    'claude-flow',
    'sparc'
]
```

### 3. Windows PowerShell Support
- **PowerShell Integration**: Uses PowerShell for Windows process detection
- **WMI/CIM Queries**: Leverages Windows Management Instrumentation
- **Process Relationships**: Tracks parent-child processes on Windows
- **Error Handling**: Graceful fallback for PowerShell failures

```javascript
// Windows process detection
const psCommand = `Get-Process | Where-Object {$_.ProcessName -like "*${pattern}*"} | ConvertTo-Json`;
```

### 4. Process Tree Analysis
- **Hierarchical Mapping**: Builds complete process tree structure
- **Child Process Detection**: Identifies all child processes for each parent
- **Dependency Analysis**: Understands process relationships
- **Termination Order**: Stops children before parents

### 5. Safety Verification System
- **Ownership Checks**: Verifies process ownership before termination
- **System Process Protection**: Whitelist for critical system processes
- **Context Validation**: Analyzes process context to avoid false positives
- **Safety Flags**: Each process marked as safe/unsafe to terminate

```javascript
// Safety whitelist
systemProcessWhitelist: [
    'systemd', 'kernel', 'kthreadd', 
    'init', 'dbus', 'networkd', 'resolved'
]
```

## New Features

### 1. Enhanced API
- **Backward Compatibility**: Original `detectProcesses()` function maintained
- **Detailed Detection**: New `detectProcessesDetailed()` with full information
- **Direct Termination**: `stopAllProcesses()` for immediate process management
- **Reporting**: `getProcessReport()` for debugging and monitoring

### 2. Graceful Process Termination
- **Signal Escalation**: SIGTERM → wait → SIGKILL on Unix
- **Windows Taskkill**: Graceful → force termination on Windows
- **Child Process Handling**: Automatic child process termination
- **Verification**: Confirms process termination success

### 3. Dry Run Support
- **Testing Mode**: All operations support dry-run for testing
- **Safe Planning**: Preview what would be terminated
- **Development Safety**: Prevents accidental termination during development

### 4. Comprehensive Reporting
- **Process Reports**: Detailed information about detected processes
- **Safety Analysis**: Summary of safety checks and potential issues
- **Platform Information**: System details and capabilities
- **Debugging Data**: Full context for troubleshooting

## Technical Implementation

### Cross-Platform Compatibility
```javascript
if (this.isWindows) {
    // Windows PowerShell commands
    await execAsync(`taskkill /PID ${process.pid}`);
} else {
    // Unix signal handling
    await execAsync(`kill -TERM ${process.pid}`);
}
```

### Process Tree Building
```javascript
// Unix process tree
const { stdout } = await execAsync('ps axo pid,ppid');

// Windows process tree  
const psCommand = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId';
```

### Safety Verification
```javascript
async isProcessSafe(process) {
    // Check ownership
    if (process.user !== currentUser) return false;
    
    // Check critical processes
    if (criticalProcesses.includes(process.comm)) return false;
    
    // Check PID safety
    if (process.pid === 1) return false;
    
    return true;
}
```

## Usage Examples

### Basic Detection (Backward Compatible)
```javascript
const { detectProcesses } = require('./process.js');
const processes = await detectProcesses();
console.log(`Found ${processes.length} workflow items`);
```

### Enhanced Detection
```javascript
const { detectProcessesDetailed } = require('./process.js');
const result = await detectProcessesDetailed({ dryRun: true });
console.log(`Processes: ${result.processes.length}, Sessions: ${result.tmuxSessions.length}`);
```

### Process Termination
```javascript
const { stopAllProcesses } = require('./process.js');
const result = await stopAllProcesses({ dryRun: false });
console.log(`Stopped: ${result.stopped.length}, Failed: ${result.failed.length}`);
```

### Advanced Usage
```javascript
const { ProcessManager } = require('./process.js');
const manager = new ProcessManager({ dryRun: true });
await manager.detect();
const report = await manager.getProcessReport();
```

## Integration with Uninstaller

The enhanced process manager integrates seamlessly with the existing Phase 5 uninstaller:

1. **Detection Phase**: Identifies all workflow processes and sessions
2. **Planning Phase**: Creates termination plan with safety checks
3. **Execution Phase**: Gracefully terminates processes with verification
4. **Reporting Phase**: Provides detailed results and any failures

## Testing

Run the included test suite:
```bash
node .ai-workflow/lib/uninstall/test-process.js
```

## Error Handling

- **Graceful Degradation**: Continues operation if some detection methods fail
- **Platform Fallbacks**: Alternative methods for different systems
- **Process Validation**: Confirms process existence before termination
- **Safety Nets**: Multiple checks prevent critical system process termination

## Performance Considerations

- **Efficient Queries**: Optimized process queries for large systems
- **Parallel Processing**: Concurrent detection where safe
- **Memory Management**: Cleanup of large process trees
- **Timeout Handling**: Prevents hanging on unresponsive processes

This enhanced implementation provides robust, safe, and comprehensive process management for the AI Workflow Uninstaller while maintaining full backward compatibility with existing code.