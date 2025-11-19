#!/bin/bash

# AI Workflow System - Secure Uninstaller
# Provides safe, comprehensive uninstallation with backup and restore capabilities

set -euo pipefail

# Version and configuration
readonly UNINSTALLER_VERSION="2.0.0-secure"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly INSTALL_DIR="$(dirname "$SCRIPT_DIR")"
readonly PROJECT_DIR="$(pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
readonly TIMEOUT_INTERACTIVE=300
readonly BACKUP_ROOT="$HOME/.ai-workflow-uninstall-backups"
readonly UNINSTALL_LOG="$HOME/.ai-workflow-uninstall-logs"

# Default options
DRY_RUN=false
NON_INTERACTIVE=false
KEEP_GENERATED=true
PURGE_CACHES=true
GIT_PROTECT=true
CREATE_BACKUP=true
IGNORE_GIT=false
BACKUP_PATH=""

# Load security utilities if available
if [[ -f "$INSTALL_DIR/lib/security-utils.sh" ]]; then
    source "$INSTALL_DIR/lib/security-utils.sh"
else
    # Minimal security functions
    validate_path() {
        local path="$1"
        [[ ${#path} -le 4096 ]] || return 1
        [[ "$path" != *$'\0'* ]] || return 1
        [[ ! "$path" =~ [\;\|\&\`\$\(\)] ]] || return 1
        return 0
    }
    
    sanitize_input() {
        local input="$1"
        local max_length="${2:-1024}"
        input="${input:0:$max_length}"
        input=$(echo "$input" | tr -d '\0\r\n\t')
        printf '%q' "$input"
    }
    
    security_log() {
        local level="$1"
        local message="$2"
        mkdir -p "${UNINSTALL_LOG}" 2>/dev/null || true
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SECURITY-${level}] ${message}" >> "${UNINSTALL_LOG}/security.log"
    }
fi

# Logging functions
init_logging() {
    mkdir -p "$UNINSTALL_LOG" 2>/dev/null || true
    touch "$UNINSTALL_LOG/uninstall.log" 2>/dev/null || true
    touch "$UNINSTALL_LOG/security.log" 2>/dev/null || true
}

log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$UNINSTALL_LOG/uninstall.log" 2>/dev/null || true
    
    if [[ "$level" == "ERROR" || "$level" == "WARNING" ]]; then
        security_log "$level" "$message"
    fi
}

print_header() {
    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    log "INFO" "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    log "ERROR" "$1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    log "WARNING" "$1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
    log "INFO" "$1"
}

# Usage information
show_usage() {
    cat << EOF
AI Workflow System Uninstaller v$UNINSTALLER_VERSION

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --dry-run                   Show what would be removed without actually removing
    --yes, --non-interactive    Proceed without interactive prompts
    --keep-generated=BOOL       Keep generated documents (default: true)
    --purge-caches=BOOL         Remove cache and log files (default: true)
    --git-protect=BOOL          Protect Git-tracked files (default: true)
    --backup=PATH              Create backup at specified path
    --ignore-git               Override Git protection (use with caution)
    --help                     Show this help message

EXAMPLES:
    $0                         Interactive uninstallation with default settings
    $0 --dry-run              Preview what would be removed
    $0 --yes --backup=/backup Safe automated uninstallation with backup
    $0 --purge-caches=false   Uninstall but keep log files

SAFETY:
    - Generated documents are preserved by default
    - Git-tracked files are protected unless explicitly overridden
    - Backups are created automatically unless disabled
    - Dry-run mode is available for preview
EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)
                DRY_RUN=true
                ;;
            --yes|--non-interactive)
                NON_INTERACTIVE=true
                ;;
            --keep-generated=*)
                KEEP_GENERATED="${1#*=}"
                ;;
            --purge-caches=*)
                PURGE_CACHES="${1#*=}"
                ;;
            --git-protect=*)
                GIT_PROTECT="${1#*=}"
                ;;
            --backup=*)
                BACKUP_PATH="${1#*=}"
                CREATE_BACKUP=true
                ;;
            --ignore-git)
                IGNORE_GIT=true
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
        shift
    done
}

# Load installation manifest
load_manifest() {
    local manifest_file="$INSTALL_DIR/installation-manifest.json"
    
    if [[ -f "$manifest_file" ]]; then
        if ! jq empty "$manifest_file" 2>/dev/null; then
            print_warning "Installation manifest is corrupted, using fallback detection"
            return 1
        fi
        return 0
    else
        print_warning "No installation manifest found, using fallback detection"
        return 1
    fi
}

# Classify files for removal
classify_files() {
    local manifest_file="$INSTALL_DIR/installation-manifest.json"
    
    # Initialize categories
    SYSTEM_ASSETS=()
    GENERATED_ARTIFACTS=()
    EPHEMERAL_CACHE=()
    UNKNOWN_FILES=()
    
    if [[ -f "$manifest_file" ]]; then
        # Use manifest-based classification
        print_info "Classifying files using installation manifest..."
        
        # System assets
        if command -v jq >/dev/null 2>&1; then
            while IFS= read -r -d '' file; do
                if validate_path "$file" && [[ -e "$file" ]]; then
                    SYSTEM_ASSETS+=("$file")
                fi
            done < <(jq -r '.system_assets[]?.path // empty' "$manifest_file" 2>/dev/null | tr '\n' '\0')
        fi
    else
        # Fallback heuristic classification
        print_info "Using fallback heuristic classification..."
        
        # System assets (directories and files installed by the system)
        local system_paths=(
            "$INSTALL_DIR/intelligence-engine"
            "$INSTALL_DIR/bin"
            "$INSTALL_DIR/lib"
            "$INSTALL_DIR/hooks"
            "$INSTALL_DIR/configs"
            "$INSTALL_DIR/supervisor"
            "$INSTALL_DIR/tmux-scripts"
            "$PROJECT_DIR/ai-workflow"
        )
        
        for path in "${system_paths[@]}"; do
            if [[ -e "$path" ]]; then
                SYSTEM_ASSETS+=("$path")
            fi
        done
        
        # Generated artifacts (user-customized documents)
        local generated_paths=(
            "$PROJECT_DIR/.claude/CLAUDE.md"
            "$PROJECT_DIR/.agent-os"
            "$PROJECT_DIR/.ai-dev/analysis.json"
        )
        
        for path in "${generated_paths[@]}"; do
            if [[ -e "$path" ]]; then
                GENERATED_ARTIFACTS+=("$path")
            fi
        done
        
        # Ephemeral cache (logs and temporary files)
        local cache_paths=(
            "$INSTALL_DIR/logs"
            "$INSTALL_DIR/recovery/checkpoints"
            "$PROJECT_DIR/.claude-flow/memory"
        )
        
        for path in "${cache_paths[@]}"; do
            if [[ -e "$path" ]]; then
                EPHEMERAL_CACHE+=("$path")
            fi
        done
    fi
    
    # Git protection check
    if [[ "$GIT_PROTECT" == true && "$IGNORE_GIT" != true ]]; then
        check_git_protection
    fi
    
    return 0
}

# Check Git protection for files
check_git_protection() {
    if ! command -v git >/dev/null 2>&1 || ! git rev-parse --git-dir >/dev/null 2>&1; then
        return 0  # Not a Git repository
    fi
    
    print_info "Checking Git protection for tracked files..."
    
    local protected_files=()
    
    # Check system assets for Git tracking
    for file in "${SYSTEM_ASSETS[@]}"; do
        if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
            protected_files+=("$file")
        fi
    done
    
    if [[ ${#protected_files[@]} -gt 0 ]]; then
        print_warning "Found ${#protected_files[@]} Git-tracked files in system assets:"
        for file in "${protected_files[@]}"; do
            echo "  - $file"
        done
        
        if [[ "$NON_INTERACTIVE" != true ]]; then
            local choice=""
            read -p "Remove Git-tracked files? (y/N): " -r choice || choice="N"
            
            if [[ "$choice" != "y" && "$choice" != "Y" ]]; then
                # Move protected files to generated artifacts
                for file in "${protected_files[@]}"; do
                    # Remove from system assets array
                    local new_assets=()
                    for asset in "${SYSTEM_ASSETS[@]}"; do
                        if [[ "$asset" != "$file" ]]; then
                            new_assets+=("$asset")
                        fi
                    done
                    SYSTEM_ASSETS=("${new_assets[@]}")
                    GENERATED_ARTIFACTS+=("$file")  # Add to generated artifacts
                done
                print_info "Git-tracked files moved to preserved artifacts"
            fi
        else
            # In non-interactive mode, preserve Git-tracked files by default
            for file in "${protected_files[@]}"; do
                # Remove from system assets array
                local new_assets=()
                for asset in "${SYSTEM_ASSETS[@]}"; do
                    if [[ "$asset" != "$file" ]]; then
                        new_assets+=("$asset")
                    fi
                done
                SYSTEM_ASSETS=("${new_assets[@]}")
                GENERATED_ARTIFACTS+=("$file")
            done
            print_info "Git-tracked files automatically preserved (non-interactive mode)"
        fi
    fi
}

# Stop running processes
stop_processes() {
    print_info "Stopping AI Workflow processes..."
    
    local stopped_count=0
    
    # Stop tmux sessions
    if command -v tmux >/dev/null 2>&1; then
        local tmux_sessions
        tmux_sessions=$(tmux list-sessions -F '#{session_name}' 2>/dev/null | grep '^queen-agent-' || true)
        
        if [[ -n "$tmux_sessions" ]]; then
            while IFS= read -r session; do
                if [[ -n "$session" ]]; then
                    print_info "Stopping tmux session: $session"
                    if [[ "$DRY_RUN" != true ]]; then
                        tmux kill-session -t "$session" 2>/dev/null || true
                    fi
                    ((stopped_count++))
                fi
            done <<< "$tmux_sessions"
        fi
    fi
    
    # Stop supervisor processes
    local supervisor_pid_file="$INSTALL_DIR/supervisor/supervisor.pid"
    if [[ -f "$supervisor_pid_file" ]]; then
        local supervisor_pid
        supervisor_pid=$(cat "$supervisor_pid_file" 2>/dev/null || echo "")
        
        if [[ -n "$supervisor_pid" ]] && kill -0 "$supervisor_pid" 2>/dev/null; then
            print_info "Stopping supervisor process (PID: $supervisor_pid)"
            if [[ "$DRY_RUN" != true ]]; then
                kill "$supervisor_pid" 2>/dev/null || true
                sleep 2
                kill -9 "$supervisor_pid" 2>/dev/null || true
            fi
            ((stopped_count++))
        fi
    fi
    
    # Stop any remaining workflow processes
    if command -v pgrep >/dev/null 2>&1; then
        local workflow_processes
        workflow_processes=$(pgrep -f "ai-workflow\|workflow-runner\|agent-bus" || true)
        
        if [[ -n "$workflow_processes" ]]; then
            while IFS= read -r pid; do
                if [[ -n "$pid" ]]; then
                    local cmd
                    cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                    print_info "Stopping workflow process: $cmd (PID: $pid)"
                    if [[ "$DRY_RUN" != true ]]; then
                        kill "$pid" 2>/dev/null || true
                        sleep 1
                        kill -9 "$pid" 2>/dev/null || true
                    fi
                    ((stopped_count++))
                fi
            done <<< "$workflow_processes"
        fi
    fi
    
    if [[ $stopped_count -gt 0 ]]; then
        print_success "Stopped $stopped_count process(es)"
    else
        print_info "No running processes found"
    fi
    
    return 0
}

# Create backup
create_uninstall_backup() {
    if [[ "$CREATE_BACKUP" != true ]]; then
        return 0
    fi
    
    local backup_name
    backup_name="$(basename "$PROJECT_DIR")_$(date +%Y%m%d_%H%M%S)"
    
    if [[ -n "$BACKUP_PATH" ]]; then
        if ! validate_path "$BACKUP_PATH"; then
            print_error "Invalid backup path: $BACKUP_PATH"
            return 1
        fi
        BACKUP_DIR="$BACKUP_PATH"
    else
        BACKUP_DIR="$BACKUP_ROOT/$backup_name"
    fi
    
    print_info "Creating backup: $BACKUP_DIR"
    
    if [[ "$DRY_RUN" == true ]]; then
        print_info "[DRY RUN] Would create backup at: $BACKUP_DIR"
        return 0
    fi
    
    if ! mkdir -p "$BACKUP_DIR" 2>/dev/null; then
        print_error "Failed to create backup directory: $BACKUP_DIR"
        return 1
    fi
    
    # Backup system assets
    if [[ ${#SYSTEM_ASSETS[@]} -gt 0 ]]; then
        local system_backup_dir="$BACKUP_DIR/system_assets"
        mkdir -p "$system_backup_dir" 2>/dev/null || true
        
        for asset in "${SYSTEM_ASSETS[@]}"; do
            if [[ -e "$asset" ]]; then
                local asset_name
                asset_name=$(basename "$asset")
                local backup_dest="$system_backup_dir/$asset_name"
                
                cp -r "$asset" "$backup_dest" 2>/dev/null || print_warning "Failed to backup: $asset"
            fi
        done
    fi
    
    # Create backup metadata
    local backup_metadata='{
        "created_at": "'$(date -Iseconds)'",
        "project_dir": "'$PROJECT_DIR'",
        "uninstaller_version": "'$UNINSTALLER_VERSION'",
        "options": {
            "keep_generated": '$KEEP_GENERATED',
            "purge_caches": '$PURGE_CACHES',
            "git_protect": '$GIT_PROTECT'
        },
        "file_counts": {
            "system_assets": '${#SYSTEM_ASSETS[@]}',
            "generated_artifacts": '${#GENERATED_ARTIFACTS[@]}',
            "ephemeral_cache": '${#EPHEMERAL_CACHE[@]}'
        }
    }'
    
    echo "$backup_metadata" > "$BACKUP_DIR/backup_metadata.json" 2>/dev/null || true
    
    print_success "Backup created: $BACKUP_DIR"
    return 0
}

# Main uninstallation function
main_uninstall() {
    print_header "AI Workflow System Secure Uninstaller v$UNINSTALLER_VERSION"
    
    # Validate environment
    if [[ ! -d "$INSTALL_DIR" ]]; then
        print_error "AI Workflow System installation not found in: $INSTALL_DIR"
        return 1
    fi
    
    # Load and classify files
    load_manifest || true
    classify_files
    
    # Show what will be done
    print_info "System assets to remove: ${#SYSTEM_ASSETS[@]}"
    print_info "Generated artifacts to preserve: ${#GENERATED_ARTIFACTS[@]}"
    print_info "Cache items to $([ "$PURGE_CACHES" == true ] && echo "remove" || echo "preserve"): ${#EPHEMERAL_CACHE[@]}"
    
    # Get confirmation
    if [[ "$NON_INTERACTIVE" != true && "$DRY_RUN" != true ]]; then
        echo -e "\n${RED}${BOLD}WARNING: This will permanently remove the AI Workflow System.${NC}"
        local confirmation=""
        read -p "Type \"I UNDERSTAND AND ACCEPT\" to continue: " -r confirmation
        
        if [[ "$confirmation" != "I UNDERSTAND AND ACCEPT" ]]; then
            print_info "Uninstallation cancelled by user"
            return 1
        fi
    fi
    
    # Create backup if requested
    create_uninstall_backup
    
    # Stop processes
    stop_processes
    
    # Remove system assets
    if [[ ${#SYSTEM_ASSETS[@]} -gt 0 ]]; then
        print_info "Removing system assets (${#SYSTEM_ASSETS[@]} items)..."
        
        for asset in "${SYSTEM_ASSETS[@]}"; do
            if [[ ! -e "$asset" ]]; then
                continue
            fi
            
            if [[ "$DRY_RUN" == true ]]; then
                print_info "[DRY RUN] Would remove: $asset"
                continue
            fi
            
            print_info "Removing: $asset"
            
            if rm -rf "$asset" 2>/dev/null; then
                log "INFO" "Removed: $asset"
            else
                print_warning "Failed to remove: $asset"
                log "WARNING" "Failed to remove: $asset"
            fi
        done
    fi
    
    # Remove caches if requested
    if [[ "$PURGE_CACHES" == true && ${#EPHEMERAL_CACHE[@]} -gt 0 ]]; then
        print_info "Removing cache and logs (${#EPHEMERAL_CACHE[@]} items)..."
        
        for cache in "${EPHEMERAL_CACHE[@]}"; do
            if [[ ! -e "$cache" ]]; then
                continue
            fi
            
            if [[ "$DRY_RUN" == true ]]; then
                print_info "[DRY RUN] Would remove: $cache"
                continue
            fi
            
            print_info "Removing: $cache"
            
            if rm -rf "$cache" 2>/dev/null; then
                log "INFO" "Removed: $cache"
            else
                print_warning "Failed to remove: $cache"
                log "WARNING" "Failed to remove: $cache"
            fi
        done
    fi
    
    if [[ "$DRY_RUN" != true ]]; then
        print_success "AI Workflow System uninstalled successfully!"
        
        if [[ "$CREATE_BACKUP" == true && -n "${BACKUP_DIR:-}" ]]; then
            echo -e "\n${GREEN}${BOLD}Backup Information:${NC}"
            echo "  Location: $BACKUP_DIR"
            echo "  Contains: System assets and metadata"
        fi
    else
        print_success "Dry run completed - no files were actually removed"
    fi
    
    return 0
}

# Error handling
error_handler() {
    local line_no="$1"
    local error_code="$2"
    
    print_error "Error occurred at line $line_no (exit code: $error_code)"
    log "ERROR" "Script error at line $line_no, exit code $error_code"
    
    exit "$error_code"
}

trap 'error_handler $LINENO $?' ERR

# Signal handling
cleanup() {
    print_info "Uninstaller interrupted"
    exit 130
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Initialize logging
    init_logging
    
    # Parse arguments
    parse_arguments "$@"
    
    # Log start
    log "INFO" "Starting uninstaller (version $UNINSTALLER_VERSION)"
    log "INFO" "Options: dry_run=$DRY_RUN, non_interactive=$NON_INTERACTIVE, keep_generated=$KEEP_GENERATED"
    
    if main_uninstall; then
        log "INFO" "Uninstaller completed successfully"
        exit 0
    else
        log "ERROR" "Uninstaller failed"
        exit 1
    fi
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi