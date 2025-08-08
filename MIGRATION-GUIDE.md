# Migration Guide: Standard → Intelligent Workflow System

## Overview
This guide helps you migrate from the standard AI Dev OS to the enhanced Intelligent Workflow Decision System with automated approach selection.

## What's New

### Intelligent Features
- **Automatic Complexity Analysis**: Projects are analyzed across 8 dimensions
- **Smart Approach Selection**: AI recommends optimal Claude Flow version
- **User Choice Mode**: Interactive selection with AI guidance
- **Project Stage Detection**: Adapts to idea/early/active/mature stages
- **Learning System**: Remembers user preferences and improves over time

### Enhanced Commands
```bash
# Old (standard)
ai-dev init                    # Basic project detection

# New (intelligent)
ai-dev init --auto             # AI selects optimal approach
ai-dev init --interactive      # Show analysis, user chooses
ai-dev init --swarm           # Force Simple Swarm
ai-dev init --hive            # Force Hive-Mind
ai-dev init --sparc           # Force SPARC methodology
ai-dev analyze                # Analyze project complexity
```

## Migration Steps

### Step 1: Backup Current Configuration
```bash
# Backup existing AI Dev OS configuration
cp -r ~/.ai-dev-os ~/.ai-dev-os-backup
cp -r ~/.claude ~/.claude-backup

# Backup project-specific configs if needed
cp -r .ai-dev .ai-dev-backup
cp -r .claude .claude-backup
```

### Step 2: Update Installation
```bash
# Navigate to MASTER-WORKFLOW directory
cd /path/to/MASTER-WORKFLOW

# Pull latest changes (if using git)
git pull

# Re-run installer (will detect and upgrade)
./install-ai-dev-os.sh
```

The installer will:
- Detect existing installation
- Install intelligence engine components
- Update CLI commands
- Preserve existing configurations

### Step 3: Verify Installation
```bash
# Check system status
ai-dev status

# Verify intelligence engine
ls ~/.ai-dev-os/intelligence-engine/

# Test analysis on current project
ai-dev analyze
```

Expected output:
- Intelligence engine files present
- Analysis shows complexity score and recommendations

### Step 4: Migrate Existing Projects

#### For Active Projects
```bash
# Navigate to project
cd /path/to/your/project

# Run interactive initialization
ai-dev init --interactive

# System will:
# 1. Analyze existing codebase
# 2. Detect project stage
# 3. Recommend optimal approach
# 4. Let you confirm or override
```

#### For New Projects
```bash
# Create project directory
mkdir new-project && cd new-project

# Use automatic mode for new projects
ai-dev init --auto "Build REST API with authentication"
```

## Configuration Migration

### Old Configuration Files
```
~/.ai-dev-os/
├── configs/system.conf        # System configuration
├── templates/                 # Project templates
└── bin/                      # CLI scripts

.ai-dev/
├── project.json              # Basic project config
└── activity.log              # Activity logging
```

### New Configuration Files
```
~/.ai-dev-os/
├── intelligence-engine/       # NEW: Analysis engine
│   ├── complexity-analyzer.js
│   ├── approach-selector.js
│   └── user-choice-handler.sh
├── user-preferences.json      # NEW: Learning system
├── configs/system.conf
├── templates/
└── bin/
    ├── ai-dev-init-enhanced  # NEW: Enhanced initializer
    └── ai-dev-init           # Wrapper (backward compatible)

.ai-dev/
├── project.json
├── approach-selection.json   # NEW: Selected approach details
├── analysis-cache.json       # NEW: Cached analysis results
└── activity.log
```

## Backward Compatibility

### Maintained Features
All existing commands continue to work:
- `ai-dev start` - Start systems
- `ai-dev stop` - Stop systems
- `ai-dev status` - Check status
- `ai-dev orchestrate` - 24/7 mode
- `ai-dev flow` - Claude Flow commands
- `ai-dev agent` - Agent OS commands

### Enhanced Features
Existing commands gain intelligence:
- `ai-dev init` - Now uses intelligent analysis
- `ai-dev init [type]` - Still works but enhanced

### Fallback Mode
If intelligence engine fails:
- System falls back to standard initialization
- Warning message displayed
- Basic functionality preserved

## Common Migration Scenarios

### Scenario 1: Simple Project → Intelligent System
```bash
# Before: Manual project type detection
ai-dev init web-app

# After: Automatic intelligent detection
ai-dev init --auto
# System analyzes and selects Simple Swarm
```

### Scenario 2: Complex Project → SPARC Integration
```bash
# Before: Generic initialization
ai-dev init api-service

# After: Intelligent SPARC recommendation
ai-dev init --interactive
# System detects complexity and recommends Hive-Mind + SPARC
```

### Scenario 3: Team Standardization
```bash
# Set team defaults
ai-dev config set default-mode interactive
ai-dev config set swarm-threshold 25
ai-dev config set sparc-threshold 75

# All team members get consistent recommendations
```

## Troubleshooting

### Issue: Intelligence Engine Not Found
```bash
# Error: Intelligence engine not installed

# Solution: Reinstall from MASTER-WORKFLOW
cd /path/to/MASTER-WORKFLOW
./install-ai-dev-os.sh
```

### Issue: Analysis Fails
```bash
# Error: Analysis failed

# Check Node.js version
node --version  # Should be v18+

# Test analyzer directly
node ~/.ai-dev-os/intelligence-engine/complexity-analyzer.js .
```

### Issue: Wrong Approach Selected
```bash
# Override with manual selection
ai-dev init --sparc  # Force SPARC

# Or adjust thresholds
ai-dev config set hive-threshold 60
```

## Benefits After Migration

### Immediate Benefits
- **Optimal Approach Selection**: Right tool for the job
- **Time Savings**: No manual configuration needed
- **Better Recommendations**: AI-guided decisions
- **Stage Awareness**: Adapts to project lifecycle

### Long-term Benefits
- **Learning System**: Improves with usage
- **Team Consistency**: Standardized approaches
- **Reduced Complexity**: Automatic configuration
- **Better Documentation**: Stage-appropriate docs

## Rollback Procedure

If you need to rollback:
```bash
# Restore backup
rm -rf ~/.ai-dev-os
mv ~/.ai-dev-os-backup ~/.ai-dev-os

# Restore Claude config
rm -rf ~/.claude
mv ~/.claude-backup ~/.claude

# Remove intelligence engine references
rm -f ~/.ai-dev-os/bin/ai-dev-init-enhanced
```

## FAQ

**Q: Will my existing projects break?**
A: No, full backward compatibility is maintained.

**Q: Can I disable intelligent features?**
A: Yes, use standard commands or force specific approaches.

**Q: Does it work offline?**
A: Yes, analysis is local. Only Claude Flow commands need internet.

**Q: Can I customize complexity thresholds?**
A: Yes, via `ai-dev config set [threshold] [value]`

**Q: Is my project data sent anywhere?**
A: No, all analysis is performed locally.

## Getting Help

- Run tests: `node test/test-basic.js`
- Check logs: `tail -f .ai-dev/activity.log`
- View analysis: `ai-dev analyze`
- See options: `ai-dev init --help`

## Next Steps

1. Complete migration using this guide
2. Test on a sample project
3. Configure team preferences
4. Start using intelligent features
5. Provide feedback for improvements

The Intelligent Workflow Decision System is designed to enhance, not replace, your existing workflow. Take advantage of the new features while maintaining full compatibility with your current setup.