# AI Workflow Uninstaller - Backup Module

## Overview

The Backup Module provides comprehensive backup functionality for the AI Workflow Uninstaller. It creates cross-platform archives containing installation manifests, removal plans, and metadata to enable restoration if needed.

## Features

- **Cross-Platform Support**: Automatically detects platform and creates tar.gz (Linux/macOS/WSL) or zip (Windows) archives
- **Progress Reporting**: Real-time progress updates with UI integration
- **Metadata Generation**: Comprehensive backup metadata with checksums
- **Error Handling**: Robust error management and recovery
- **Restore Instructions**: Auto-generated restoration guidance
- **CLI Integration**: Command line and interactive UI support

## Usage

### Basic Usage

```javascript
const { BackupManager } = require('./backup');

// Create backup manager with optional UI integration
const backupManager = new BackupManager(ui);

// Create backup
const config = {
    projectName: 'my-project',
    options: ['config', 'compress'],
    path: null // Auto-generate path
};

const result = await backupManager.createBackup(config, classification, plan);
console.log(`Backup created: ${result.path}`);
```

### Command Line Usage

```bash
# Interactive backup
AIWF_UNINSTALLER=true ./ai-workflow uninstall --interactive

# Auto-generated backup path
AIWF_UNINSTALLER=true ./ai-workflow uninstall --backup

# Custom backup location
AIWF_UNINSTALLER=true ./ai-workflow uninstall --backup=/path/to/backup

# Non-interactive with backup
AIWF_UNINSTALLER=true ./ai-workflow uninstall --yes --backup
```

## API Reference

### BackupManager Class

#### Constructor
```javascript
new BackupManager(ui = null)
```
- `ui`: Optional UI manager for progress reporting

#### Methods

##### createBackup(config, classification, plan)
Creates a backup archive with the specified configuration.

**Parameters:**
- `config`: Backup configuration object
- `classification`: File classification data from Phase 2
- `plan`: Removal plan data from Phase 2

**Returns:**
- Promise resolving to backup result object

**Example:**
```javascript
const backupResult = await backupManager.createBackup(config, classification, plan);
// Returns: { success: true, path: '...', size: 1024, archiveType: 'tar.gz', metadata: {...} }
```

##### determineArchiveType()
Determines the appropriate archive format based on the current platform.

**Returns:**
- `'tar.gz'` for Linux, macOS, WSL
- `'zip'` for Windows

##### getBackupPath(projectName)
Generates a unique backup path with timestamp.

**Parameters:**
- `projectName`: Name of the project for the backup filename

**Returns:**
- Promise resolving to backup file path

##### detectPlatform()
Detects the current platform information.

**Returns:**
- Object with platform details including OS, architecture, and WSL detection

##### setProgressCallback(callback)
Sets a progress callback for non-UI usage.

**Parameters:**
- `callback`: Function to receive progress updates `(current, total, message) => {}`

## Configuration

### Backup Configuration Object

```javascript
{
    projectName: 'string',      // Project name for backup filename
    options: ['array'],         // Backup options: 'config', 'compress', 'logs', etc.
    path: 'string|null'         // Custom path or null for auto-generation
}
```

### Backup Options

- `'config'`: Include configuration files
- `'compress'`: Enable compression (default)
- `'logs'`: Include log files
- `'docs'`: Include generated documents
- `'cache'`: Include cache files

## Backup Structure

```
backup-<timestamp>.tar.gz/
├── manifests/
│   ├── installation-record.json    # Installation manifest
│   └── generation-record.json      # Generation manifest
├── plan/
│   └── removal-plan.json          # Removal plan data
├── metadata.json                  # Backup metadata
└── RESTORE-INSTRUCTIONS.txt       # Restoration guide
```

## Platform Support

### Linux/macOS/WSL
- **Format**: tar.gz
- **Library**: tar module (fallback to system tar)
- **Compression**: gzip

### Windows
- **Format**: zip
- **Library**: archiver module (fallback to PowerShell)
- **Compression**: deflate (level 9)

## Error Handling

The backup module handles various error scenarios:

- **Missing Dependencies**: Falls back to system commands
- **Insufficient Disk Space**: Pre-flight checks with user warnings
- **Permission Errors**: Clear error messages and suggestions
- **Invalid Paths**: Path validation and auto-correction
- **Archive Creation Failures**: Cleanup and user notification

### Error Recovery Example

```javascript
try {
    const result = await backupManager.createBackup(config, classification, plan);
} catch (error) {
    console.error('Backup failed:', error.message);
    // Handle error - continue without backup or retry
}
```

## Testing

### Running Tests

```bash
# Run backup module tests
node .ai-workflow/lib/uninstall/test-phase4-backup.js

# Run complete Phase 4 test suite
node .ai-workflow/lib/uninstall/run-phase4-tests.js

# Run interactive demo
node .ai-workflow/lib/uninstall/demo-phase4-backup.js
```

### Test Coverage

- Platform detection
- Archive type selection
- Backup path generation
- File staging
- Metadata generation
- Archive creation (mocked)
- Error handling
- Progress reporting
- Integration testing

## Dependencies

### Required Dependencies

```json
{
    "tar": "^7.4.3",        // Linux/macOS/WSL archive support
    "archiver": "^7.0.1"    // Windows zip support
}
```

### Optional Dependencies

If the required modules are not available, the backup manager will attempt to use system commands:

- **Linux/macOS**: `tar` command
- **Windows**: PowerShell `Compress-Archive`

## Performance

### Typical Performance Metrics

- **Metadata Generation**: ~1ms
- **File Staging**: ~200ms (varies by file count)
- **Archive Creation**: ~800ms (varies by size)
- **Verification**: ~300ms
- **Total Process**: ~1.5s for typical project

### Memory Usage

- **Staging Directory**: Temporary, automatically cleaned
- **Progress Callbacks**: Minimal overhead
- **Error Handling**: Graceful cleanup on failures

## Security Considerations

- **Temporary Files**: Created in secure temporary directories
- **Path Validation**: Prevents directory traversal attacks
- **Permission Checks**: Verifies write permissions before creation
- **Cleanup**: Automatic cleanup of temporary resources
- **Checksum Verification**: Content integrity validation

## Integration

### UI Integration

```javascript
// Progress reporting
const ui = new UIManager();
const backupManager = new BackupManager(ui);
// Progress automatically shown in UI

// Interactive prompts
const backupConfig = await ui.createBackupPrompt();
```

### Command Line Integration

```javascript
// Check for backup flag
if (config.backup) {
    await this.performCommandLineBackup();
}
```

## Troubleshooting

### Common Issues

1. **Module Not Found**: Install tar or archiver modules
2. **Permission Denied**: Check write permissions for backup directory
3. **Insufficient Space**: Free up disk space
4. **Archive Corruption**: Check available memory and disk space

### Debug Mode

Enable debug mode for detailed logging:

```bash
AIWF_UNINSTALLER=true ./ai-workflow uninstall --backup --debug
```

## Examples

### Complete Backup Example

```javascript
const { BackupManager } = require('./backup');
const { UIManager } = require('./ui');

async function createProjectBackup() {
    const ui = new UIManager();
    const backupManager = new BackupManager(ui);
    
    const config = {
        projectName: 'my-ai-project',
        options: ['config', 'compress'],
        path: null
    };
    
    const classification = {
        manifests: {
            installation: { /* installation data */ },
            generation: { /* generation data */ }
        }
    };
    
    const plan = {
        actions: [
            { type: 'remove', path: '.ai-workflow/', reason: 'System directory' }
        ]
    };
    
    try {
        const result = await backupManager.createBackup(config, classification, plan);
        console.log('✅ Backup created successfully!');
        console.log(`📁 Location: ${result.path}`);
        console.log(`📊 Size: ${result.size} bytes`);
        console.log(`🗜️  Format: ${result.archiveType}`);
        return result;
    } catch (error) {
        console.error('❌ Backup creation failed:', error.message);
        throw error;
    }
}
```

### Progress Callback Example

```javascript
const backupManager = new BackupManager();

backupManager.setProgressCallback((current, total, message) => {
    const percent = Math.round((current / total) * 100);
    console.log(`[${percent}%] ${message}`);
});

await backupManager.createBackup(config, classification, plan);
```

## Version History

- **v1.0.0**: Initial implementation with cross-platform support
- **Phase 4**: Complete implementation with testing and documentation

## License

Part of the AI Workflow Uninstaller project. See main project license.

---

*Generated by deployment-engineer-agent - August 14, 2025*
*Phase 4: Backup & Restore Points Implementation*