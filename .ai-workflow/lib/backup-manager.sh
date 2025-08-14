#!/bin/bash

# Backup and Restore Manager
# Provides comprehensive backup and restore functionality with transaction support

set -euo pipefail

# Source security utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/security-utils.sh"

# Backup configuration
readonly BACKUP_ROOT="${HOME}/.ai-workflow-backups"
readonly TRANSACTION_ROOT="${INSTALL_DIR:-/tmp}/transactions"
readonly MANIFEST_FILE="${INSTALL_DIR:-/tmp}/installation-manifest.json"
readonly BACKUP_LOG_FILE="${INSTALL_DIR:-/tmp}/logs/backup.log"

# Initialize backup system
init_backup_system() {
    secure_create_directory "$BACKUP_ROOT" 0700
    secure_create_directory "$TRANSACTION_ROOT" 0700
    secure_create_directory "$(dirname "$BACKUP_LOG_FILE")" 0755
    
    backup_log "INFO" "Backup system initialized"
}

# Backup logging
backup_log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[${timestamp}] [BACKUP-${level}] ${message}" | tee -a "$BACKUP_LOG_FILE" 2>/dev/null || true
}

# Create installation manifest
create_installation_manifest() {
    local manifest_data='{
        "version": "1.0",
        "created_at": "'$(date -Iseconds)'",
        "project_dir": "'${PROJECT_DIR:-$(pwd)}'",
        "install_dir": "'${INSTALL_DIR:-/tmp}'",
        "system_assets": [],
        "generated_artifacts": [],
        "ephemeral_cache": [],
        "symlinks": []
    }'
    
    if ! secure_create_file "$MANIFEST_FILE" "$manifest_data" 0644; then
        backup_log "ERROR" "Failed to create installation manifest"
        return 1
    fi
    
    backup_log "INFO" "Installation manifest created: $MANIFEST_FILE"
    return 0
}

# Add entry to manifest
add_to_manifest() {
    local category="$1"
    local file_path="$2"
    local description="$3"
    
    if ! validate_path "$file_path"; then
        backup_log "ERROR" "Invalid path for manifest: $file_path"
        return 1
    fi
    
    if [[ ! -f "$MANIFEST_FILE" ]]; then
        create_installation_manifest
    fi
    
    # Create temp file for JSON manipulation
    local temp_manifest="${MANIFEST_FILE}.tmp.$$"
    
    # Add entry using jq
    if ! jq --arg category "$category" \
           --arg path "$file_path" \
           --arg desc "$description" \
           --arg timestamp "$(date -Iseconds)" \
           '.[$category] += [{"path": $path, "description": $desc, "added_at": $timestamp}]' \
           "$MANIFEST_FILE" > "$temp_manifest" 2>/dev/null; then
        backup_log "ERROR" "Failed to update manifest for: $file_path"
        rm -f "$temp_manifest" 2>/dev/null || true
        return 1
    fi
    
    if ! mv "$temp_manifest" "$MANIFEST_FILE" 2>/dev/null; then
        backup_log "ERROR" "Failed to save updated manifest"
        rm -f "$temp_manifest" 2>/dev/null || true
        return 1
    fi
    
    backup_log "INFO" "Added to manifest ($category): $file_path"
    return 0
}

# Create backup
create_backup() {
    local backup_name="$1"
    local source_paths=("${@:2}")
    
    if [[ -z "$backup_name" ]]; then
        backup_log "ERROR" "Backup name is required"
        return 1
    fi
    
    # Sanitize backup name
    backup_name=$(sanitize_input "$backup_name" 100)
    backup_name=$(echo "$backup_name" | tr ' ' '_' | tr -cd '[:alnum:]_-')
    
    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_dir="${BACKUP_ROOT}/${backup_name}_${timestamp}"
    
    if ! secure_create_directory "$backup_dir" 0700; then
        backup_log "ERROR" "Failed to create backup directory: $backup_dir"
        return 1
    fi
    
    # Create backup metadata
    local metadata='{
        "backup_name": "'$backup_name'",
        "created_at": "'$(date -Iseconds)'",
        "source_paths": [],
        "files_backed_up": [],
        "total_size": 0,
        "checksum": ""
    }'
    
    if ! secure_create_file "${backup_dir}/metadata.json" "$metadata" 0644; then
        backup_log "ERROR" "Failed to create backup metadata"
        return 1
    fi
    
    # Backup each source path
    local total_files=0
    local total_size=0
    local temp_metadata="${backup_dir}/metadata.json.tmp"
    
    for source_path in "${source_paths[@]}"; do
        if ! validate_path "$source_path" true; then
            backup_log "WARNING" "Skipping invalid path: $source_path"
            continue
        fi
        
        if [[ ! -e "$source_path" ]]; then
            backup_log "WARNING" "Source path does not exist: $source_path"
            continue
        fi
        
        local relative_path
        relative_path=$(basename "$source_path")
        local backup_dest="${backup_dir}/${relative_path}"
        
        backup_log "INFO" "Backing up: $source_path -> $backup_dest"
        
        if [[ -d "$source_path" ]]; then
            if ! cp -r "$source_path" "$backup_dest" 2>/dev/null; then
                backup_log "ERROR" "Failed to backup directory: $source_path"
                continue
            fi
        elif [[ -f "$source_path" ]]; then
            if ! cp "$source_path" "$backup_dest" 2>/dev/null; then
                backup_log "ERROR" "Failed to backup file: $source_path"
                continue
            fi
        fi
        
        # Update metadata
        local file_size
        if [[ -f "$source_path" ]]; then
            file_size=$(stat -c%s "$source_path" 2>/dev/null || echo 0)
            ((total_files++))
        elif [[ -d "$source_path" ]]; then
            file_size=$(du -sb "$source_path" 2>/dev/null | cut -f1 || echo 0)
            local dir_files
            dir_files=$(find "$source_path" -type f 2>/dev/null | wc -l)
            ((total_files += dir_files))
        fi
        ((total_size += file_size))
        
        # Add to metadata
        if ! jq --arg path "$source_path" \
               --arg size "$file_size" \
               '.source_paths += [$path] | .files_backed_up += [{"path": $path, "size": ($size | tonumber)}]' \
               "${backup_dir}/metadata.json" > "$temp_metadata" 2>/dev/null; then
            backup_log "WARNING" "Failed to update metadata for: $source_path"
            continue
        fi
        
        mv "$temp_metadata" "${backup_dir}/metadata.json"
    done
    
    # Finalize metadata
    if ! jq --arg total_files "$total_files" \
           --arg total_size "$total_size" \
           '.total_files = ($total_files | tonumber) | .total_size = ($total_size | tonumber)' \
           "${backup_dir}/metadata.json" > "$temp_metadata" 2>/dev/null; then
        backup_log "WARNING" "Failed to finalize backup metadata"
    else
        mv "$temp_metadata" "${backup_dir}/metadata.json"
    fi
    
    # Create checksum of backup
    local backup_checksum
    backup_checksum=$(find "$backup_dir" -type f -exec sha256sum {} \; 2>/dev/null | sha256sum | cut -d' ' -f1)
    
    if ! jq --arg checksum "$backup_checksum" \
           '.checksum = $checksum' \
           "${backup_dir}/metadata.json" > "$temp_metadata" 2>/dev/null; then
        backup_log "WARNING" "Failed to add checksum to metadata"
    else
        mv "$temp_metadata" "${backup_dir}/metadata.json"
    fi
    
    backup_log "INFO" "Backup completed: $backup_dir ($total_files files, $total_size bytes)"
    echo "$backup_dir"
    return 0
}

# Restore from backup
restore_backup() {
    local backup_dir="$1"
    local target_base="${2:-}"
    
    if ! validate_path "$backup_dir"; then
        backup_log "ERROR" "Invalid backup directory path: $backup_dir"
        return 1
    fi
    
    if [[ ! -d "$backup_dir" ]]; then
        backup_log "ERROR" "Backup directory does not exist: $backup_dir"
        return 1
    fi
    
    local metadata_file="${backup_dir}/metadata.json"
    if [[ ! -f "$metadata_file" ]]; then
        backup_log "ERROR" "Backup metadata not found: $metadata_file"
        return 1
    fi
    
    # Verify backup integrity
    if ! verify_backup_integrity "$backup_dir"; then
        backup_log "ERROR" "Backup integrity verification failed: $backup_dir"
        return 1
    fi
    
    backup_log "INFO" "Starting restore from: $backup_dir"
    
    # Read source paths from metadata
    local source_paths
    if ! source_paths=$(jq -r '.source_paths[]' "$metadata_file" 2>/dev/null); then
        backup_log "ERROR" "Failed to read source paths from metadata"
        return 1
    fi
    
    local restored_count=0
    while IFS= read -r source_path; do
        [[ -z "$source_path" ]] && continue
        
        local relative_path
        relative_path=$(basename "$source_path")
        local backup_item="${backup_dir}/${relative_path}"
        
        if [[ ! -e "$backup_item" ]]; then
            backup_log "WARNING" "Backup item not found: $backup_item"
            continue
        fi
        
        local restore_target
        if [[ -n "$target_base" ]]; then
            restore_target="${target_base}/${relative_path}"
        else
            restore_target="$source_path"
        fi
        
        if ! validate_path "$restore_target" true; then
            backup_log "WARNING" "Invalid restore target: $restore_target"
            continue
        fi
        
        backup_log "INFO" "Restoring: $backup_item -> $restore_target"
        
        # Create target directory if needed
        local target_dir
        if [[ -f "$backup_item" ]]; then
            target_dir=$(dirname "$restore_target")
        else
            target_dir=$(dirname "$restore_target")
        fi
        
        if ! secure_create_directory "$target_dir" 0755; then
            backup_log "WARNING" "Failed to create target directory: $target_dir"
            continue
        fi
        
        # Remove existing target if it exists
        if [[ -e "$restore_target" ]]; then
            if ! rm -rf "$restore_target" 2>/dev/null; then
                backup_log "WARNING" "Failed to remove existing target: $restore_target"
                continue
            fi
        fi
        
        # Restore item
        if ! cp -r "$backup_item" "$restore_target" 2>/dev/null; then
            backup_log "ERROR" "Failed to restore: $backup_item -> $restore_target"
            continue
        fi
        
        ((restored_count++))
        backup_log "INFO" "Restored: $restore_target"
        
    done <<< "$source_paths"
    
    backup_log "INFO" "Restore completed: $restored_count items restored"
    return 0
}

# Verify backup integrity
verify_backup_integrity() {
    local backup_dir="$1"
    
    if ! validate_path "$backup_dir"; then
        return 1
    fi
    
    local metadata_file="${backup_dir}/metadata.json"
    if [[ ! -f "$metadata_file" ]]; then
        backup_log "ERROR" "Metadata file missing: $metadata_file"
        return 1
    fi
    
    # Get stored checksum
    local stored_checksum
    if ! stored_checksum=$(jq -r '.checksum // empty' "$metadata_file" 2>/dev/null); then
        backup_log "ERROR" "Failed to read stored checksum"
        return 1
    fi
    
    if [[ -z "$stored_checksum" ]]; then
        backup_log "WARNING" "No checksum available for verification"
        return 0
    fi
    
    # Calculate current checksum
    local current_checksum
    current_checksum=$(find "$backup_dir" -type f -exec sha256sum {} \; 2>/dev/null | sha256sum | cut -d' ' -f1)
    
    if [[ "$stored_checksum" != "$current_checksum" ]]; then
        backup_log "ERROR" "Backup integrity check failed: checksum mismatch"
        return 1
    fi
    
    backup_log "INFO" "Backup integrity verified: $backup_dir"
    return 0
}

# List available backups
list_backups() {
    if [[ ! -d "$BACKUP_ROOT" ]]; then
        backup_log "INFO" "No backup directory found"
        return 0
    fi
    
    echo "Available backups:"
    local backup_count=0
    
    for backup_dir in "$BACKUP_ROOT"/*; do
        [[ ! -d "$backup_dir" ]] && continue
        
        local metadata_file="${backup_dir}/metadata.json"
        if [[ ! -f "$metadata_file" ]]; then
            continue
        fi
        
        local backup_name created_at total_files total_size
        backup_name=$(jq -r '.backup_name // "unknown"' "$metadata_file" 2>/dev/null)
        created_at=$(jq -r '.created_at // "unknown"' "$metadata_file" 2>/dev/null)
        total_files=$(jq -r '.total_files // 0' "$metadata_file" 2>/dev/null)
        total_size=$(jq -r '.total_size // 0' "$metadata_file" 2>/dev/null)
        
        # Format size
        local size_formatted
        if [[ $total_size -lt 1024 ]]; then
            size_formatted="${total_size}B"
        elif [[ $total_size -lt 1048576 ]]; then
            size_formatted="$((total_size / 1024))KB"
        else
            size_formatted="$((total_size / 1048576))MB"
        fi
        
        echo "  - $backup_name ($created_at) - $total_files files, $size_formatted"
        echo "    Path: $backup_dir"
        ((backup_count++))
    done
    
    if [[ $backup_count -eq 0 ]]; then
        echo "  No backups found."
    fi
    
    return 0
}

# Transaction support functions
begin_transaction() {
    local transaction_name="$1"
    
    if [[ -z "$transaction_name" ]]; then
        backup_log "ERROR" "Transaction name is required"
        return 1
    fi
    
    # Sanitize transaction name
    transaction_name=$(sanitize_input "$transaction_name" 100)
    transaction_name=$(echo "$transaction_name" | tr ' ' '_' | tr -cd '[:alnum:]_-')
    
    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    local transaction_id="${transaction_name}_${timestamp}"
    local transaction_dir="${TRANSACTION_ROOT}/${transaction_id}"
    
    if ! secure_create_directory "$transaction_dir" 0700; then
        backup_log "ERROR" "Failed to create transaction directory: $transaction_dir"
        return 1
    fi
    
    # Create transaction metadata
    local transaction_data='{
        "transaction_id": "'$transaction_id'",
        "name": "'$transaction_name'",
        "started_at": "'$(date -Iseconds)'",
        "status": "active",
        "operations": [],
        "rollback_data": []
    }'
    
    if ! secure_create_file "${transaction_dir}/transaction.json" "$transaction_data" 0644; then
        backup_log "ERROR" "Failed to create transaction metadata"
        return 1
    fi
    
    backup_log "INFO" "Transaction started: $transaction_id"
    echo "$transaction_id"
    return 0
}

# Record operation in transaction
record_operation() {
    local transaction_id="$1"
    local operation_type="$2"
    local target_path="$3"
    local description="$4"
    
    local transaction_dir="${TRANSACTION_ROOT}/${transaction_id}"
    local transaction_file="${transaction_dir}/transaction.json"
    
    if [[ ! -f "$transaction_file" ]]; then
        backup_log "ERROR" "Transaction not found: $transaction_id"
        return 1
    fi
    
    # Backup original file/directory if it exists
    if [[ -e "$target_path" ]]; then
        local backup_name="rollback_$(basename "$target_path")_$(date +%s)"
        local backup_path="${transaction_dir}/${backup_name}"
        
        if cp -r "$target_path" "$backup_path" 2>/dev/null; then
            backup_log "INFO" "Created rollback backup: $backup_path"
        fi
    fi
    
    # Record operation in transaction log
    local temp_transaction="${transaction_file}.tmp"
    if ! jq --arg op_type "$operation_type" \
           --arg target "$target_path" \
           --arg desc "$description" \
           --arg timestamp "$(date -Iseconds)" \
           '.operations += [{"type": $op_type, "target": $target, "description": $desc, "timestamp": $timestamp}]' \
           "$transaction_file" > "$temp_transaction" 2>/dev/null; then
        backup_log "ERROR" "Failed to record operation in transaction"
        rm -f "$temp_transaction" 2>/dev/null || true
        return 1
    fi
    
    mv "$temp_transaction" "$transaction_file"
    backup_log "INFO" "Recorded operation: $operation_type on $target_path"
    return 0
}

# Commit transaction
commit_transaction() {
    local transaction_id="$1"
    
    local transaction_dir="${TRANSACTION_ROOT}/${transaction_id}"
    local transaction_file="${transaction_dir}/transaction.json"
    
    if [[ ! -f "$transaction_file" ]]; then
        backup_log "ERROR" "Transaction not found: $transaction_id"
        return 1
    fi
    
    # Update transaction status
    local temp_transaction="${transaction_file}.tmp"
    if ! jq --arg timestamp "$(date -Iseconds)" \
           '.status = "committed" | .committed_at = $timestamp' \
           "$transaction_file" > "$temp_transaction" 2>/dev/null; then
        backup_log "ERROR" "Failed to commit transaction"
        rm -f "$temp_transaction" 2>/dev/null || true
        return 1
    fi
    
    mv "$temp_transaction" "$transaction_file"
    backup_log "INFO" "Transaction committed: $transaction_id"
    return 0
}

# Rollback transaction
rollback_transaction() {
    local transaction_id="$1"
    
    local transaction_dir="${TRANSACTION_ROOT}/${transaction_id}"
    local transaction_file="${transaction_dir}/transaction.json"
    
    if [[ ! -f "$transaction_file" ]]; then
        backup_log "ERROR" "Transaction not found: $transaction_id"
        return 1
    fi
    
    backup_log "INFO" "Rolling back transaction: $transaction_id"
    
    # Get operations in reverse order
    local operations
    if ! operations=$(jq -r '.operations[] | [.type, .target, .description] | @tsv' "$transaction_file" 2>/dev/null); then
        backup_log "ERROR" "Failed to read transaction operations"
        return 1
    fi
    
    # Rollback each operation
    local rollback_count=0
    while IFS=$'\t' read -r op_type target_path description; do
        [[ -z "$op_type" ]] && continue
        
        case "$op_type" in
            "create_file"|"create_directory")
                if [[ -e "$target_path" ]]; then
                    backup_log "INFO" "Rollback: removing $target_path"
                    rm -rf "$target_path" 2>/dev/null || backup_log "WARNING" "Failed to remove $target_path"
                    ((rollback_count++))
                fi
                ;;
            "modify_file")
                # Restore from backup if available
                local backup_name="rollback_$(basename "$target_path")_*"
                local backup_files=("${transaction_dir}/"$backup_name)
                if [[ -f "${backup_files[0]}" ]]; then
                    backup_log "INFO" "Rollback: restoring $target_path"
                    cp "${backup_files[0]}" "$target_path" 2>/dev/null || backup_log "WARNING" "Failed to restore $target_path"
                    ((rollback_count++))
                fi
                ;;
        esac
    done <<< "$operations"
    
    # Update transaction status
    local temp_transaction="${transaction_file}.tmp"
    if ! jq --arg timestamp "$(date -Iseconds)" \
           --arg count "$rollback_count" \
           '.status = "rolled_back" | .rolled_back_at = $timestamp | .rollback_count = ($count | tonumber)' \
           "$transaction_file" > "$temp_transaction" 2>/dev/null; then
        backup_log "WARNING" "Failed to update transaction status after rollback"
    else
        mv "$temp_transaction" "$transaction_file"
    fi
    
    backup_log "INFO" "Transaction rolled back: $transaction_id ($rollback_count operations)"
    return 0
}

# Initialize backup system on module load
init_backup_system

# Export functions
export -f create_backup
export -f restore_backup
export -f verify_backup_integrity
export -f list_backups
export -f begin_transaction
export -f record_operation
export -f commit_transaction
export -f rollback_transaction
export -f add_to_manifest
export -f backup_log