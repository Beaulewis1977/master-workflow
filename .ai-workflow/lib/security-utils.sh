#!/bin/bash

# Security Utilities Module
# Provides functions for secure handling of user input, file operations, and system interactions

# Enable strict error handling
set -euo pipefail

# Security configuration
readonly SECURITY_LOG_FILE="${INSTALL_DIR:-/tmp}/logs/security.log"
readonly MAX_PATH_LENGTH=4096
readonly MAX_INPUT_LENGTH=1024
readonly ALLOWED_CHARS_PATTERN='^[a-zA-Z0-9._/-]+$'

# Initialize security logging
init_security_logging() {
    local log_dir
    log_dir=$(dirname "$SECURITY_LOG_FILE")
    mkdir -p "$log_dir" 2>/dev/null || true
    
    if [[ -w "$log_dir" ]]; then
        touch "$SECURITY_LOG_FILE" 2>/dev/null || true
    fi
}

# Security logging function
security_log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[${timestamp}] [SECURITY-${level}] ${message}" >> "$SECURITY_LOG_FILE" 2>/dev/null || true
}

# Validate and sanitize file paths
validate_path() {
    local path="$1"
    local allow_relative="${2:-false}"
    
    # Check path length
    if [[ ${#path} -gt $MAX_PATH_LENGTH ]]; then
        security_log "ERROR" "Path too long: ${#path} chars"
        return 1
    fi
    
    # Check for null bytes
    if [[ "$path" == *$'\0'* ]]; then
        security_log "ERROR" "Path contains null bytes"
        return 1
    fi
    
    # Check for dangerous patterns
    if [[ "$path" == *".."* ]]; then
        security_log "WARNING" "Path contains directory traversal: $path"
        if [[ "$allow_relative" != "true" ]]; then
            return 1
        fi
    fi
    
    # Check for suspicious characters
    if [[ "$path" =~ [\;\|\&\`\$\(\)] ]]; then
        security_log "ERROR" "Path contains suspicious characters: $path"
        return 1
    fi
    
    return 0
}

# Sanitize user input
sanitize_input() {
    local input="$1"
    local max_length="${2:-$MAX_INPUT_LENGTH}"
    
    # Truncate if too long
    if [[ ${#input} -gt $max_length ]]; then
        input="${input:0:$max_length}"
        security_log "WARNING" "Input truncated to $max_length characters"
    fi
    
    # Remove dangerous characters
    input=$(echo "$input" | tr -d '\0\r\n\t')
    
    # Escape shell metacharacters
    input=$(printf '%q' "$input")
    
    echo "$input"
}

# Validate file exists and is readable
validate_file_readable() {
    local file="$1"
    
    if ! validate_path "$file"; then
        return 1
    fi
    
    if [[ ! -f "$file" ]]; then
        security_log "ERROR" "File does not exist: $file"
        return 1
    fi
    
    if [[ ! -r "$file" ]]; then
        security_log "ERROR" "File not readable: $file"
        return 1
    fi
    
    return 0
}

# Validate directory exists and is writable
validate_directory_writable() {
    local dir="$1"
    
    if ! validate_path "$dir"; then
        return 1
    fi
    
    if [[ ! -d "$dir" ]]; then
        security_log "ERROR" "Directory does not exist: $dir"
        return 1
    fi
    
    if [[ ! -w "$dir" ]]; then
        security_log "ERROR" "Directory not writable: $dir"
        return 1
    fi
    
    return 0
}

# Secure file creation with proper permissions
secure_create_file() {
    local file="$1"
    local content="$2"
    local permissions="${3:-0644}"
    
    if ! validate_path "$file"; then
        return 1
    fi
    
    # Create directory if needed
    local dir
    dir=$(dirname "$file")
    if ! mkdir -p "$dir" 2>/dev/null; then
        security_log "ERROR" "Failed to create directory: $dir"
        return 1
    fi
    
    # Create file atomically
    local temp_file="${file}.tmp.$$"
    
    if ! echo "$content" > "$temp_file" 2>/dev/null; then
        security_log "ERROR" "Failed to create temporary file: $temp_file"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    # Set permissions
    if ! chmod "$permissions" "$temp_file" 2>/dev/null; then
        security_log "ERROR" "Failed to set permissions on: $temp_file"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    # Atomic move
    if ! mv "$temp_file" "$file" 2>/dev/null; then
        security_log "ERROR" "Failed to move file: $temp_file -> $file"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    security_log "INFO" "Securely created file: $file"
    return 0
}

# Secure directory creation with proper permissions
secure_create_directory() {
    local dir="$1"
    local permissions="${2:-0755}"
    
    if ! validate_path "$dir"; then
        return 1
    fi
    
    if ! mkdir -p "$dir" 2>/dev/null; then
        security_log "ERROR" "Failed to create directory: $dir"
        return 1
    fi
    
    if ! chmod "$permissions" "$dir" 2>/dev/null; then
        security_log "ERROR" "Failed to set directory permissions: $dir"
        return 1
    fi
    
    security_log "INFO" "Securely created directory: $dir"
    return 0
}

# Validate URL for downloads
validate_url() {
    local url="$1"
    
    # Check URL format
    if [[ ! "$url" =~ ^https://[a-zA-Z0-9.-]+(/.*)?$ ]]; then
        security_log "ERROR" "Invalid URL format: $url"
        return 1
    fi
    
    # Check for suspicious patterns
    if [[ "$url" =~ [<>\"\'\\] ]]; then
        security_log "ERROR" "URL contains suspicious characters: $url"
        return 1
    fi
    
    return 0
}

# Secure download with checksum verification
secure_download() {
    local url="$1"
    local output_file="$2"
    local expected_checksum="${3:-}"
    local checksum_type="${4:-sha256}"
    
    if ! validate_url "$url"; then
        return 1
    fi
    
    if ! validate_path "$output_file"; then
        return 1
    fi
    
    # Create temp file
    local temp_file="${output_file}.download.$$"
    
    # Download with timeout and user agent
    if ! timeout 300 curl \
        --silent \
        --show-error \
        --fail \
        --location \
        --max-redirs 5 \
        --max-filesize 104857600 \
        --user-agent "AI-Workflow-Installer/1.0" \
        --output "$temp_file" \
        "$url" 2>/dev/null; then
        security_log "ERROR" "Download failed: $url"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    # Verify checksum if provided
    if [[ -n "$expected_checksum" ]]; then
        local actual_checksum
        case "$checksum_type" in
            sha256)
                actual_checksum=$(sha256sum "$temp_file" 2>/dev/null | cut -d' ' -f1)
                ;;
            sha1)
                actual_checksum=$(sha1sum "$temp_file" 2>/dev/null | cut -d' ' -f1)
                ;;
            md5)
                actual_checksum=$(md5sum "$temp_file" 2>/dev/null | cut -d' ' -f1)
                ;;
            *)
                security_log "ERROR" "Unsupported checksum type: $checksum_type"
                rm -f "$temp_file" 2>/dev/null || true
                return 1
                ;;
        esac
        
        if [[ "$actual_checksum" != "$expected_checksum" ]]; then
            security_log "ERROR" "Checksum mismatch for $url: expected $expected_checksum, got $actual_checksum"
            rm -f "$temp_file" 2>/dev/null || true
            return 1
        fi
    fi
    
    # Move to final location
    if ! mv "$temp_file" "$output_file" 2>/dev/null; then
        security_log "ERROR" "Failed to move downloaded file: $temp_file -> $output_file"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    security_log "INFO" "Securely downloaded: $url -> $output_file"
    return 0
}

# Check if running as root (security warning)
check_root_privilege() {
    if [[ $EUID -eq 0 ]]; then
        security_log "WARNING" "Running as root - security risk"
        return 0
    fi
    return 1
}

# Validate sudo requirement
validate_sudo_requirement() {
    local command="$1"
    local reason="$2"
    
    # Log sudo usage
    security_log "WARNING" "Sudo required for: $command (reason: $reason)"
    
    # Check if sudo is available
    if ! command -v sudo >/dev/null 2>&1; then
        security_log "ERROR" "Sudo not available but required for: $command"
        return 1
    fi
    
    return 0
}

# Execute command with security logging
secure_execute() {
    local description="$1"
    shift
    local cmd=("$@")
    
    security_log "INFO" "Executing: $description"
    
    if ! "${cmd[@]}" 2>/dev/null; then
        security_log "ERROR" "Command failed: $description"
        return 1
    fi
    
    security_log "INFO" "Command succeeded: $description"
    return 0
}

# Initialize security logging on module load
init_security_logging

# Export functions for use in other scripts
export -f validate_path
export -f sanitize_input
export -f validate_file_readable
export -f validate_directory_writable
export -f secure_create_file
export -f secure_create_directory
export -f validate_url
export -f secure_download
export -f check_root_privilege
export -f validate_sudo_requirement
export -f secure_execute
export -f security_log