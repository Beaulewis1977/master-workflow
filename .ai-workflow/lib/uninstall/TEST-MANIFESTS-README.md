# Test Manifests for Phase 2 - AI Workflow Uninstaller

## Overview

This directory contains test manifests created for Phase 2 testing of the AI Workflow Uninstaller. These manifests provide realistic test data for validating the classifier and plan builder functionality.

## Created Files

### 1. Test Manifests
- **`installation-record.json`** - Test installation manifest with 32 items
- **`generation-record.json`** - Test generation manifest with 23 updates

### 2. Generator Scripts
- **`create-test-manifests.sh`** - Script that generates test manifests using manifest-writer.sh
- **`validate-test-manifests.sh`** - Validation script that verifies manifest structure and content

## Test Data Structure

### Installation Manifest (32 items)

**Origin Distribution:**
- **System Assets (20)**: Core libraries, configurations, templates
  - `.ai-workflow/lib/core.js`
  - `.ai-workflow/configs/default-config.json`
  - `.ai-workflow/templates/agent-template.yaml`
  - etc.

- **Symlinks/Executables (3)**: Executable scripts and launchers
  - `.ai-workflow/bin/ai-workflow`
  - `.ai-workflow/bin/claude-flow`
  - `.ai-workflow/bin/hive-mind`

- **Cache/Logs (9)**: Temporary files, logs, and ephemeral data
  - `.ai-workflow/logs/installation.log`
  - `.ai-workflow/logs/agents/agent-001.log`
  - `.ai-workflow/recovery/checkpoints/checkpoint-001.json`
  - etc.

### Generation Manifest (23 updates)

**Strategy Distribution:**
- **Intelligent Strategy (11)**: Smart merge with existing content
  - `.claude/CLAUDE.md`
  - `.ai-dev/task-breakdown.md`
  - `docs/README.md`
  - etc.

- **Merge Strategy (8)**: Append to existing content
  - `.claude/agents/researcher.md`
  - `.ai-dev/progress-tracking.json`
  - `docs/API.md`
  - etc.

- **Replace Strategy (4)**: Overwrite existing content
  - `.ai-dev/analysis.json`
  - `.ai-dev/metrics.json`
  - `docs/DEPLOYMENT.md`
  - etc.

**Backup Coverage:**
- **16 items** have backup paths specified
- **7 items** have no backup (typically for replaceable files)

## Usage for Phase 2 Testing

### Running the Generator
```bash
# Navigate to the uninstall directory
cd .ai-workflow/lib/uninstall

# Generate test manifests
./create-test-manifests.sh

# Validate the generated manifests
./validate-test-manifests.sh
```

### Test Coverage

These manifests provide comprehensive test data for:

1. **File Classification Testing**
   - Tests all three origin types (system_asset, symlink_executable, ephemeral_cache_log)
   - Various file types and locations
   - Mixed directory structures

2. **Strategy Handling Verification**
   - All three generation strategies (intelligent, merge, replace)
   - Files with and without backups
   - Different document types

3. **Risk Assessment Validation**
   - Critical system files vs. ephemeral files
   - Configuration files vs. generated documents
   - Files in different AI workflow directories

4. **Plan Generation Testing**
   - Complex dependency scenarios
   - Mixed file types requiring different handling
   - Backup restoration scenarios

## Integration with Phase 1

The test manifests were created using the **Phase 1 manifest-writer.sh** functions:

- `manifest_init()` - Initialize tracking
- `manifest_record_files()` - Batch record installation items
- `manifest_record_generated_docs()` - Batch record generation items

This ensures the test data follows the exact same format and structure as real manifests created by the Phase 1 implementation.

## Validation

The validator script performs comprehensive checks:

### JSON Validation
- Valid JSON structure
- No syntax errors
- Proper encoding

### Structural Validation
- Required fields present
- Correct data types
- Valid strategy values
- Proper timestamp formats

### Content Validation
- Appropriate origin distribution
- Strategy coverage
- Backup path consistency
- Cross-manifest consistency

### Requirements Coverage
- Minimum 30+ installation items ✅ (32 items)
- Minimum 20+ generation updates ✅ (23 updates)
- All origin types represented ✅
- All strategies represented ✅
- Mix of files with/without backups ✅

## Next Steps for Phase 2

These test manifests are ready for Phase 2 development:

1. **Classifier Testing** - Use to test file categorization and risk assessment
2. **Plan Builder Testing** - Use to test uninstall plan generation
3. **Strategy Testing** - Validate handling of different generation strategies
4. **Integration Testing** - End-to-end testing with real manifest data

The manifests represent a realistic AI workflow installation with mixed file types, strategies, and complexity levels suitable for comprehensive Phase 2 testing.