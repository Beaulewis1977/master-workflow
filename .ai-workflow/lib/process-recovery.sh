#!/bin/bash

# Process Recovery and Error Handling System
# Provides comprehensive process state recovery and error handling

set -euo pipefail

# Source security utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/security-utils.sh"

# Configuration
readonly RECOVERY_LOG_FILE="${INSTALL_DIR:-/tmp}/logs/recovery.log"
readonly PROCESS_STATE_DIR="${INSTALL_DIR:-/tmp}/recovery/process-states"
readonly CHECKPOINT_DIR="${INSTALL_DIR:-/tmp}/recovery/checkpoints"
readonly MAX_RECOVERY_ATTEMPTS=3
readonly PROCESS_TIMEOUT=300  # 5 minutes

# Initialize recovery system
init_recovery_system() {
    secure_create_directory "$(dirname "$RECOVERY_LOG_FILE")" 0755
    secure_create_directory "$PROCESS_STATE_DIR" 0700
    secure_create_directory "$CHECKPOINT_DIR" 0700
    
    recovery_log "INFO" "Process recovery system initialized"
}

# Recovery logging
recovery_log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [RECOVERY-$level] $message" | tee -a "$RECOVERY_LOG_FILE"
    
    if [[ "$level" == "ERROR" || "$level" == "WARNING" ]]; then
        security_log "$level" "RECOVERY: $message"
    fi
}

# Create process checkpoint
create_checkpoint() {
    local process_name="$1"
    local checkpoint_data="$2"
    local priority="${3:-normal}"
    
    if [[ -z "$process_name" ]]; then
        recovery_log "ERROR" "Process name required for checkpoint"
        return 1
    fi
    
    local checkpoint_id="${process_name}_$(date +%s)"
    local checkpoint_file="$CHECKPOINT_DIR/${checkpoint_id}.json"
    
    local checkpoint_json='{
        "checkpoint_id": "'$checkpoint_id'",
        "process_name": "'$process_name'",
        "created_at": "'$(date -Iseconds)'",
        "priority": "'$priority'",
        "data": '$checkpoint_data',
        "recovery_attempts": 0,
        "status": "active"
    }'
    
    if ! secure_create_file "$checkpoint_file" "$checkpoint_json" 0600; then
        recovery_log "ERROR" "Failed to create checkpoint: $checkpoint_id"
        return 1
    fi
    
    recovery_log "INFO" "Checkpoint created: $checkpoint_id"
    echo "$checkpoint_id"
    return 0
}

# Update checkpoint status
update_checkpoint_status() {
    local checkpoint_id="$1"
    local new_status="$2"
    local additional_data="${3:-{}}"
    
    local checkpoint_file="$CHECKPOINT_DIR/${checkpoint_id}.json"
    
    if [[ ! -f "$checkpoint_file" ]]; then
        recovery_log "ERROR" "Checkpoint not found: $checkpoint_id"
        return 1
    fi
    
    local temp_file="${checkpoint_file}.tmp"
    if ! jq --arg status "$new_status" \
           --argjson data "$additional_data" \
           --arg timestamp "$(date -Iseconds)" \
           '.status = $status | .updated_at = $timestamp | .additional_data = $data' \
           "$checkpoint_file" > "$temp_file" 2>/dev/null; then
        recovery_log "ERROR" "Failed to update checkpoint status: $checkpoint_id"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    if ! mv "$temp_file" "$checkpoint_file" 2>/dev/null; then
        recovery_log "ERROR" "Failed to save checkpoint update: $checkpoint_id"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    recovery_log "INFO" "Checkpoint status updated: $checkpoint_id -> $new_status"
    return 0
}

# Save process state
save_process_state() {
    local process_name="$1"
    local state_data="$2"
    local process_id="${3:-$$}"
    
    if [[ -z "$process_name" ]]; then
        recovery_log "ERROR" "Process name required for state save"
        return 1
    fi
    
    local state_file="$PROCESS_STATE_DIR/${process_name}.json"
    local state_json='{
        "process_name": "'$process_name'",
        "process_id": '$process_id',
        "saved_at": "'$(date -Iseconds)'",
        "hostname": "'$(hostname)'",
        "working_directory": "'$(pwd)'",
        "environment": {
            "USER": "'${USER:-unknown}'",
            "HOME": "'${HOME:-unknown}'",
            "PATH": "'${PATH:-unknown}'"
        },
        "state": '$state_data'
    }'
    
    if ! secure_create_file "$state_file" "$state_json" 0600; then
        recovery_log "ERROR" "Failed to save process state: $process_name"
        return 1
    fi
    
    recovery_log "INFO" "Process state saved: $process_name (PID: $process_id)"
    return 0
}

# Load process state
load_process_state() {
    local process_name="$1"
    local state_file="$PROCESS_STATE_DIR/${process_name}.json"
    
    if [[ ! -f "$state_file" ]]; then
        recovery_log "WARNING" "Process state not found: $process_name"
        return 1
    fi
    
    if ! jq empty "$state_file" 2>/dev/null; then
        recovery_log "ERROR" "Process state file corrupted: $process_name"
        return 1
    fi
    
    recovery_log "INFO" "Process state loaded: $process_name"
    cat "$state_file"
    return 0
}

# Check if process is still running
is_process_running() {
    local process_id="$1"
    
    if [[ -z "$process_id" || ! "$process_id" =~ ^[0-9]+$ ]]; then
        return 1
    fi
    
    if kill -0 "$process_id" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Monitor process health
monitor_process_health() {
    local process_name="$1"
    local process_id="$2"
    local check_interval="${3:-30}"
    local max_checks="${4:-10}"
    
    recovery_log "INFO" "Starting health monitoring: $process_name (PID: $process_id)"
    
    local check_count=0
    while [[ $check_count -lt $max_checks ]]; do
        if is_process_running "$process_id"; then
            recovery_log "DEBUG" "Process health check passed: $process_name (PID: $process_id)"
        else
            recovery_log "ERROR" "Process health check failed: $process_name (PID: $process_id)"
            return 1
        fi
        
        sleep "$check_interval"
        ((check_count++))
    done
    
    recovery_log "INFO" "Process health monitoring completed: $process_name"
    return 0
}

# Attempt process recovery
attempt_recovery() {
    local checkpoint_id="$1"
    local recovery_command="$2"
    
    local checkpoint_file="$CHECKPOINT_DIR/${checkpoint_id}.json"
    
    if [[ ! -f "$checkpoint_file" ]]; then
        recovery_log "ERROR" "Checkpoint not found for recovery: $checkpoint_id"
        return 1
    fi
    
    # Get current recovery attempt count
    local current_attempts
    current_attempts=$(jq -r '.recovery_attempts // 0' "$checkpoint_file" 2>/dev/null || echo 0)
    
    if [[ $current_attempts -ge $MAX_RECOVERY_ATTEMPTS ]]; then
        recovery_log "ERROR" "Maximum recovery attempts reached: $checkpoint_id"
        update_checkpoint_status "$checkpoint_id" "failed" '{"reason": "max_attempts_exceeded"}'
        return 1
    fi
    
    # Increment attempt counter
    local new_attempts=$((current_attempts + 1))
    local temp_file="${checkpoint_file}.tmp"
    if ! jq --arg attempts "$new_attempts" \
           --arg timestamp "$(date -Iseconds)" \
           '.recovery_attempts = ($attempts | tonumber) | .last_recovery_attempt = $timestamp' \
           "$checkpoint_file" > "$temp_file" 2>/dev/null; then
        recovery_log "ERROR" "Failed to update recovery attempt count"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    mv "$temp_file" "$checkpoint_file"
    
    recovery_log "INFO" "Attempting recovery: $checkpoint_id (attempt $new_attempts/$MAX_RECOVERY_ATTEMPTS)"
    
    # Execute recovery command with timeout
    local recovery_exit_code=0
    if timeout "$PROCESS_TIMEOUT" bash -c "$recovery_command" 2>&1 | tee -a "$RECOVERY_LOG_FILE"; then
        recovery_log "INFO" "Recovery successful: $checkpoint_id"
        update_checkpoint_status "$checkpoint_id" "recovered" '{"attempt": '$new_attempts'}'
        return 0
    else
        recovery_exit_code=$?
        recovery_log "ERROR" "Recovery failed: $checkpoint_id (exit code: $recovery_exit_code)"
        
        if [[ $new_attempts -ge $MAX_RECOVERY_ATTEMPTS ]]; then
            update_checkpoint_status "$checkpoint_id" "failed" '{"reason": "recovery_failed", "exit_code": '$recovery_exit_code'}'
        else
            update_checkpoint_status "$checkpoint_id" "retry_pending" '{"last_exit_code": '$recovery_exit_code'}'
        fi
        
        return 1
    fi
}

# Handle critical errors with recovery
handle_critical_error() {
    local error_context="$1"
    local error_message="$2"
    local recovery_action="${3:-}"
    local error_code="${4:-1}"
    
    recovery_log "ERROR" "Critical error in $error_context: $error_message"
    
    # Create error checkpoint
    local error_data='{
        "context": "'$error_context'",
        "message": "'$error_message'",
        "error_code": '$error_code',
        "timestamp": "'$(date -Iseconds)'",
        "environment": {
            "pwd": "'$(pwd)'",
            "user": "'${USER:-unknown}'",
            "hostname": "'$(hostname)'"
        }
    }'
    
    local checkpoint_id
    if checkpoint_id=$(create_checkpoint "error_$error_context" "$error_data" "critical"); then
        recovery_log "INFO" "Error checkpoint created: $checkpoint_id"
        
        # Attempt recovery if action provided
        if [[ -n "$recovery_action" ]]; then
            recovery_log "INFO" "Attempting automatic recovery for: $error_context"
            if attempt_recovery "$checkpoint_id" "$recovery_action"; then
                recovery_log "INFO" "Automatic recovery successful for: $error_context"
                return 0
            else
                recovery_log "ERROR" "Automatic recovery failed for: $error_context"
            fi
        fi
    fi
    
    # Send error notification
    send_error_notification "$error_context" "$error_message" "$error_code"
    
    return "$error_code"
}

# Send error notification
send_error_notification() {
    local context="$1"
    local message="$2"
    local error_code="$3"
    
    # Log to system log if available
    if command -v logger >/dev/null 2>&1; then
        logger -t "ai-workflow" -p user.error "Critical error in $context: $message (code: $error_code)"
    fi
    
    # Create notification file for external monitoring
    local notification_file="${INSTALL_DIR:-/tmp}/logs/error-notifications.log"
    local notification='{
        "timestamp": "'$(date -Iseconds)'",
        "context": "'$context'",
        "message": "'$message'",
        "error_code": '$error_code',
        "hostname": "'$(hostname)'",
        "process_id": '$$'
    }'
    
    echo "$notification" >> "$notification_file" 2>/dev/null || true
    
    recovery_log "INFO" "Error notification sent for: $context"
}

# Cleanup orphaned processes
cleanup_orphaned_processes() {
    recovery_log "INFO" "Cleaning up orphaned processes..."
    
    local cleanup_count=0
    
    # Find and clean up orphaned workflow processes
    if command -v pgrep >/dev/null 2>&1; then
        local orphaned_processes
        orphaned_processes=$(pgrep -f "ai-workflow\|workflow-runner\|agent-bus" || true)
        
        if [[ -n "$orphaned_processes" ]]; then
            while IFS= read -r pid; do
                if [[ -n "$pid" && "$pid" != "$$" ]]; then
                    local cmd
                    cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                    
                    # Check if process is actually orphaned (no parent or parent is init)
                    local ppid
                    ppid=$(ps -p "$pid" -o ppid= 2>/dev/null | tr -d ' ' || echo "1")
                    
                    if [[ "$ppid" == "1" ]] || ! is_process_running "$ppid"; then
                        recovery_log "INFO" "Cleaning up orphaned process: $cmd (PID: $pid)"
                        if kill -TERM "$pid" 2>/dev/null; then
                            sleep 2
                            if is_process_running "$pid"; then
                                kill -KILL "$pid" 2>/dev/null || true
                            fi
                            ((cleanup_count++))
                        fi
                    fi
                fi
            done <<< "$orphaned_processes"
        fi
    fi
    
    recovery_log "INFO" "Orphaned process cleanup completed: $cleanup_count processes cleaned"
    return 0
}

# Recover from installation failures
recover_installation_failure() {
    local installation_state="$1"
    local failure_point="$2"
    
    recovery_log "INFO" "Recovering from installation failure at: $failure_point"
    
    # Parse installation state
    local transaction_id
    transaction_id=$(echo "$installation_state" | jq -r '.transaction_id // empty' 2>/dev/null)
    
    if [[ -n "$transaction_id" ]]; then
        recovery_log "INFO" "Found transaction ID: $transaction_id"
        
        # Attempt transaction rollback if backup manager available
        if [[ -f "${SCRIPT_DIR}/backup-manager.sh" ]]; then
            source "${SCRIPT_DIR}/backup-manager.sh"
            
            if rollback_transaction "$transaction_id" 2>/dev/null; then
                recovery_log "INFO" "Transaction rollback successful: $transaction_id"
                return 0
            else
                recovery_log "ERROR" "Transaction rollback failed: $transaction_id"
            fi
        fi
    fi
    
    # Manual cleanup based on failure point
    case "$failure_point" in
        "directory_creation")
            recovery_log "INFO" "Cleaning up partially created directories"
            cleanup_partial_directories
            ;;
        "file_copy")
            recovery_log "INFO" "Cleaning up partially copied files"
            cleanup_partial_files
            ;;
        "package_installation")
            recovery_log "INFO" "Cleaning up failed package installations"
            cleanup_failed_packages
            ;;
        *)
            recovery_log "WARNING" "Unknown failure point, performing general cleanup"
            cleanup_general_failure
            ;;
    esac
    
    return 0
}

# Helper functions for specific cleanup scenarios
cleanup_partial_directories() {
    local install_dir="${INSTALL_DIR:-/tmp/.ai-workflow}"
    
    if [[ -d "$install_dir" ]]; then
        # Check if directory is empty or contains only partial content
        local file_count
        file_count=$(find "$install_dir" -type f | wc -l)
        
        if [[ $file_count -lt 5 ]]; then  # Arbitrary threshold for "partial"
            recovery_log "INFO" "Removing partially created directory: $install_dir"
            rm -rf "$install_dir" 2>/dev/null || true
        fi
    fi
}

cleanup_partial_files() {
    local install_dir="${INSTALL_DIR:-/tmp/.ai-workflow}"
    
    if [[ -d "$install_dir" ]]; then
        # Remove incomplete files (files smaller than expected or with .tmp extension)
        find "$install_dir" -name "*.tmp" -delete 2>/dev/null || true
        find "$install_dir" -type f -size 0 -delete 2>/dev/null || true
    fi
}

cleanup_failed_packages() {
    # This would depend on the package manager and specific packages
    # For now, log the need for manual cleanup
    recovery_log "INFO" "Package cleanup may require manual intervention"
}

cleanup_general_failure() {
    cleanup_partial_directories
    cleanup_partial_files
    cleanup_orphaned_processes
}

# Generate recovery report
generate_recovery_report() {
    local report_file="${INSTALL_DIR:-/tmp}/logs/recovery-report.json"
    
    # Count checkpoints by status
    local total_checkpoints=0
    local active_checkpoints=0
    local recovered_checkpoints=0
    local failed_checkpoints=0
    
    if [[ -d "$CHECKPOINT_DIR" ]]; then
        for checkpoint_file in "$CHECKPOINT_DIR"/*.json; do
            [[ -f "$checkpoint_file" ]] || continue
            
            ((total_checkpoints++))
            
            local status
            status=$(jq -r '.status // "unknown"' "$checkpoint_file" 2>/dev/null)
            
            case "$status" in
                "active") ((active_checkpoints++)) ;;
                "recovered") ((recovered_checkpoints++)) ;;
                "failed") ((failed_checkpoints++)) ;;
            esac
        done
    fi
    
    local report_data='{
        "report_id": "'$(date +%s)'",
        "generated_at": "'$(date -Iseconds)'",
        "recovery_system_version": "2.0.0-secure",
        "checkpoint_summary": {
            "total": '$total_checkpoints',
            "active": '$active_checkpoints',
            "recovered": '$recovered_checkpoints',
            "failed": '$failed_checkpoints'
        },
        "system_status": {
            "recovery_log_size": '$(stat -c%s "$RECOVERY_LOG_FILE" 2>/dev/null || echo 0)',
            "checkpoint_directory_size": '$(du -sb "$CHECKPOINT_DIR" 2>/dev/null | cut -f1 || echo 0)',
            "orphaned_processes": []
        }
    }'
    
    # Add orphaned process information
    if command -v pgrep >/dev/null 2>&1; then
        local orphaned_pids
        orphaned_pids=$(pgrep -f "ai-workflow\|workflow-runner\|agent-bus" || true)
        
        if [[ -n "$orphaned_pids" ]]; then
            local orphaned_json="[]"
            while IFS= read -r pid; do
                if [[ -n "$pid" ]]; then
                    local cmd
                    cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                    orphaned_json=$(echo "$orphaned_json" | jq --arg pid "$pid" --arg cmd "$cmd" '. += [{"pid": ($pid | tonumber), "command": $cmd}]')
                fi
            done <<< "$orphaned_pids"
            
            report_data=$(echo "$report_data" | jq --argjson orphaned "$orphaned_json" '.system_status.orphaned_processes = $orphaned')
        fi
    fi
    
    echo "$report_data" > "$report_file" 2>/dev/null || true
    recovery_log "INFO" "Recovery report generated: $report_file"
}

# Main recovery system check
main_recovery_check() {
    recovery_log "INFO" "Starting recovery system check..."
    
    init_recovery_system
    
    # Check for orphaned processes
    cleanup_orphaned_processes
    
    # Check for failed checkpoints that need attention
    if [[ -d "$CHECKPOINT_DIR" ]]; then
        local failed_checkpoints=0
        for checkpoint_file in "$CHECKPOINT_DIR"/*.json; do
            [[ -f "$checkpoint_file" ]] || continue
            
            local status
            status=$(jq -r '.status // "unknown"' "$checkpoint_file" 2>/dev/null)
            
            if [[ "$status" == "failed" ]]; then
                ((failed_checkpoints++))
                local checkpoint_id
                checkpoint_id=$(basename "$checkpoint_file" .json)
                recovery_log "WARNING" "Failed checkpoint found: $checkpoint_id"
            fi
        done
        
        if [[ $failed_checkpoints -gt 0 ]]; then
            recovery_log "WARNING" "Found $failed_checkpoints failed checkpoint(s) requiring attention"
        fi
    fi
    
    # Generate recovery report
    generate_recovery_report
    
    recovery_log "INFO" "Recovery system check completed"
    return 0
}

# Export functions
export -f create_checkpoint
export -f update_checkpoint_status
export -f save_process_state
export -f load_process_state
export -f handle_critical_error
export -f attempt_recovery
export -f cleanup_orphaned_processes
export -f recover_installation_failure
export -f main_recovery_check

# Initialize recovery system on module load
init_recovery_system

# Run recovery check if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_recovery_check "$@"
fi