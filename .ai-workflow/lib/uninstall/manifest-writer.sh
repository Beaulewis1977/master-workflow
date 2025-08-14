#!/bin/bash

# Manifest Writer Integration Script
# For integrating with existing installer scripts
# Usage: source this script in installers to enable manifest tracking

# Colors for output
MANIFEST_GREEN='\033[0;32m'
MANIFEST_YELLOW='\033[1;33m'
MANIFEST_RED='\033[0;31m'
MANIFEST_NC='\033[0m'
MANIFEST_DIM='\033[2m'

# Configuration
MANIFEST_PROJECT_ROOT="${MANIFEST_PROJECT_ROOT:-$(pwd)}"
MANIFEST_AI_WORKFLOW_DIR="${MANIFEST_PROJECT_ROOT}/.ai-workflow"
MANIFEST_LIB_DIR="${MANIFEST_AI_WORKFLOW_DIR}/lib/uninstall"
MANIFEST_VERSION="${MANIFEST_VERSION:-3.0.0}"

# Logging
MANIFEST_LOG_FILE="${MANIFEST_AI_WORKFLOW_DIR}/logs/manifest-writer.log"

# Ensure directories exist
manifest_ensure_dirs() {
    mkdir -p "${MANIFEST_AI_WORKFLOW_DIR}/logs" 2>/dev/null || true
    mkdir -p "${MANIFEST_AI_WORKFLOW_DIR}/lib/uninstall" 2>/dev/null || true
}

# Logging function
manifest_log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" >> "${MANIFEST_LOG_FILE}"
}

# Print colored output
manifest_print() {
    local color="$1"
    local message="$2"
    echo -e "${color}${message}${MANIFEST_NC}"
}

# Check if manifest system is available
manifest_check_available() {
    if [[ ! -f "${MANIFEST_LIB_DIR}/manifest.js" ]]; then
        manifest_log "WARN" "Manifest system not available, skipping tracking"
        return 1
    fi
    
    if ! command -v node >/dev/null 2>&1; then
        manifest_log "WARN" "Node.js not available, skipping manifest tracking"
        return 1
    fi
    
    return 0
}

# Record installed file
manifest_record_file() {
    local file_path="$1"
    local origin="${2:-installed_system_asset}"
    
    if ! manifest_check_available; then
        return 0
    fi
    
    manifest_ensure_dirs
    
    # Use Node.js to record the file
    node -e "
        const { ManifestManager } = require('${MANIFEST_LIB_DIR}/manifest.js');
        const manager = new ManifestManager('${MANIFEST_PROJECT_ROOT}');
        
        manager.addInstalledItem('${file_path}', '${origin}')
            .then(() => {
                console.log('📝 Recorded: ${file_path}');
            })
            .catch(error => {
                console.error('❌ Failed to record ${file_path}:', error.message);
                process.exit(1);
            });
    " || {
        manifest_log "ERROR" "Failed to record file: ${file_path}"
        manifest_print "${MANIFEST_RED}" "❌ Failed to record: ${file_path}"
        return 1
    }
    
    manifest_log "INFO" "Recorded file: ${file_path} (${origin})"
}

# Record multiple files at once (more efficient)
manifest_record_files() {
    local files=("$@")
    
    if ! manifest_check_available; then
        return 0
    fi
    
    if [[ ${#files[@]} -eq 0 ]]; then
        manifest_log "WARN" "No files provided to record"
        return 0
    fi
    
    manifest_ensure_dirs
    
    # Build JavaScript array
    local js_items="["
    for file_info in "${files[@]}"; do
        # Parse "path:origin" format
        local file_path="${file_info%%:*}"
        local origin="${file_info##*:}"
        if [[ "$origin" == "$file_path" ]]; then
            origin="installed_system_asset"
        fi
        
        js_items="${js_items}{ path: '${file_path}', origin: '${origin}' },"
    done
    js_items="${js_items%,}]" # Remove trailing comma
    
    # Record all files
    node -e "
        const { ManifestManager } = require('${MANIFEST_LIB_DIR}/manifest.js');
        const manager = new ManifestManager('${MANIFEST_PROJECT_ROOT}');
        
        const items = ${js_items};
        
        manager.writeInstallationManifest(items, '${MANIFEST_VERSION}')
            .then(manifest => {
                console.log('📝 Recorded \${items.length} files in manifest');
                console.log('   Version: \${manifest.installerVersion}');
            })
            .catch(error => {
                console.error('❌ Failed to record files:', error.message);
                process.exit(1);
            });
    " || {
        manifest_log "ERROR" "Failed to record files batch"
        manifest_print "${MANIFEST_RED}" "❌ Failed to record files batch"
        return 1
    }
    
    manifest_log "INFO" "Recorded ${#files[@]} files in batch"
    manifest_print "${MANIFEST_GREEN}" "📝 Recorded ${#files[@]} files in manifest"
}

# Record generated document
manifest_record_generated() {
    local file_path="$1"
    local strategy="${2:-intelligent}"
    local backup_path="$3"
    
    if ! manifest_check_available; then
        return 0
    fi
    
    manifest_ensure_dirs
    
    # Use Node.js to record the generated document
    node -e "
        const { ManifestManager } = require('${MANIFEST_LIB_DIR}/manifest.js');
        const manager = new ManifestManager('${MANIFEST_PROJECT_ROOT}');
        
        manager.addGeneratedItem('${file_path}', '${strategy}', ${backup_path:+'\"${backup_path}\"'})
            .then(() => {
                console.log('📄 Recorded generated: ${file_path}');
            })
            .catch(error => {
                console.error('❌ Failed to record generated ${file_path}:', error.message);
                process.exit(1);
            });
    " || {
        manifest_log "ERROR" "Failed to record generated file: ${file_path}"
        manifest_print "${MANIFEST_RED}" "❌ Failed to record generated: ${file_path}"
        return 1
    }
    
    manifest_log "INFO" "Recorded generated file: ${file_path} (${strategy})"
}

# Record multiple generated documents
manifest_record_generated_docs() {
    local docs=("$@")
    
    if ! manifest_check_available; then
        return 0
    fi
    
    if [[ ${#docs[@]} -eq 0 ]]; then
        manifest_log "WARN" "No generated documents provided"
        return 0
    fi
    
    manifest_ensure_dirs
    
    # Build JavaScript array
    local js_updates="["
    for doc_info in "${docs[@]}"; do
        # Parse "path:strategy:backup" format
        IFS=':' read -r doc_path doc_strategy doc_backup <<< "$doc_info"
        if [[ -z "$doc_strategy" ]]; then
            doc_strategy="intelligent"
        fi
        
        js_updates="${js_updates}{ path: '${doc_path}', origin: 'generated_document', strategy: '${doc_strategy}'"
        if [[ -n "$doc_backup" ]]; then
            js_updates="${js_updates}, backup: '${doc_backup}'"
        fi
        js_updates="${js_updates} },"
    done
    js_updates="${js_updates%,}]" # Remove trailing comma
    
    # Record all documents
    node -e "
        const { ManifestManager } = require('${MANIFEST_LIB_DIR}/manifest.js');
        const manager = new ManifestManager('${MANIFEST_PROJECT_ROOT}');
        
        const updates = ${js_updates};
        
        manager.writeGenerationManifest(updates)
            .then(manifest => {
                console.log('📄 Recorded \${updates.length} generated documents');
            })
            .catch(error => {
                console.error('❌ Failed to record generated documents:', error.message);
                process.exit(1);
            });
    " || {
        manifest_log "ERROR" "Failed to record generated documents batch"
        manifest_print "${MANIFEST_RED}" "❌ Failed to record generated documents"
        return 1
    }
    
    manifest_log "INFO" "Recorded ${#docs[@]} generated documents"
    manifest_print "${MANIFEST_GREEN}" "📄 Recorded ${#docs[@]} generated documents"
}

# Initialize manifest tracking
manifest_init() {
    local version="${1:-${MANIFEST_VERSION}}"
    
    manifest_ensure_dirs
    manifest_log "INFO" "Initializing manifest tracking (version: ${version})"
    manifest_print "${MANIFEST_GREEN}" "📝 Initializing manifest tracking..."
    
    MANIFEST_VERSION="$version"
    
    if manifest_check_available; then
        manifest_print "${MANIFEST_GREEN}" "✅ Manifest system ready"
        return 0
    else
        manifest_print "${MANIFEST_YELLOW}" "⚠️  Manifest system not available"
        return 1
    fi
}

# Show usage information
manifest_usage() {
    cat << 'EOF'
Manifest Writer Integration - Usage:

# Initialize (call once at start of installer)
manifest_init "3.0.0"

# Record single installed file
manifest_record_file ".ai-workflow/lib/core.js" "installed_system_asset"
manifest_record_file ".ai-workflow/bin/launcher" "symlink_executable"

# Record multiple files (more efficient)
manifest_record_files \
    ".ai-workflow/lib/core.js:installed_system_asset" \
    ".ai-workflow/bin/launcher:symlink_executable" \
    ".ai-workflow/configs/config.json"

# Record generated document
manifest_record_generated ".claude/CLAUDE.md" "intelligent" ".ai-workflow/backups/CLAUDE.md.bak"

# Record multiple generated documents
manifest_record_generated_docs \
    ".claude/CLAUDE.md:intelligent:.ai-workflow/backups/CLAUDE.md.bak" \
    "docs/README.md:replace"

Origins:
  - installed_system_asset: System files, libraries, configs
  - symlink_executable: Executable scripts, launchers
  - ephemeral_cache_log: Temporary files, logs, caches

Strategies:
  - intelligent: Smart merge with existing content
  - merge: Append to existing content
  - replace: Overwrite existing content

EOF
}

# Export functions for use in other scripts
export -f manifest_init
export -f manifest_record_file
export -f manifest_record_files
export -f manifest_record_generated
export -f manifest_record_generated_docs
export -f manifest_check_available
export -f manifest_usage

# Print initialization message if sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    manifest_print "${MANIFEST_DIM}" "📝 Manifest Writer functions loaded"
fi