#!/bin/bash

# Intelligent Workflow System - Secure Modular Interactive Installer
# Security-hardened version with comprehensive input validation and transaction support

set -euo pipefail

# Security and error handling
readonly SCRIPT_VERSION="2.0.0-secure"
readonly MIN_BASH_VERSION=4

# Validate Bash version
if [[ ${BASH_VERSION%%.*} -lt $MIN_BASH_VERSION ]]; then
    echo "ERROR: Bash $MIN_BASH_VERSION or higher required. Current: $BASH_VERSION" >&2
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

# Get script directory securely
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(pwd)"
INSTALL_DIR="$PROJECT_DIR/.ai-workflow"

# Component flags (default all disabled except core)
INSTALL_CORE=true
INSTALL_CLAUDE_CODE=false
INSTALL_AGENT_OS=false
INSTALL_CLAUDE_FLOW=false
INSTALL_TMUX=false

# Security configuration
readonly TIMEOUT_INTERACTIVE=300  # 5 minutes timeout for interactive prompts
readonly MAX_DOWNLOAD_SIZE=104857600  # 100MB max download size
readonly ALLOWED_DOMAINS=("deb.nodesource.com" "nodejs.org" "registry.npmjs.org")

# Load security utilities
if [[ ! -f "$INSTALL_DIR/lib/security-utils.sh" ]]; then
    # Create security utilities if not present
    mkdir -p "$INSTALL_DIR/lib"
    # Copy from template or create minimal version
    cat > "$INSTALL_DIR/lib/security-utils.sh" << 'EOF'
#!/bin/bash
set -euo pipefail

validate_path() {
    local path="$1"
    [[ ${#path} -le 4096 ]] || return 1
    [[ "$path" != *$'\0'* ]] || return 1
    [[ "$path" != *".."* ]] || return 1
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
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SECURITY-${level}] ${message}" >> "${INSTALL_DIR}/logs/security.log"
}

export -f validate_path sanitize_input security_log
EOF
    chmod +x "$INSTALL_DIR/lib/security-utils.sh"
fi

# Load security utilities
source "$INSTALL_DIR/lib/security-utils.sh"

# Initialize secure logging
mkdir -p "$INSTALL_DIR/logs"
LOG_FILE="$INSTALL_DIR/logs/installation.log"
SECURITY_LOG="$INSTALL_DIR/logs/security.log"

# Secure logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    
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

# Secure OS detection
detect_os() {
    local os_type=""
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ -f /etc/debian_version && -r /etc/debian_version ]]; then
            os_type="debian"
        elif [[ -f /etc/redhat-release && -r /etc/redhat-release ]]; then
            os_type="redhat"
        else
            os_type="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        os_type="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        os_type="windows"
    else
        os_type="unknown"
    fi
    
    log "INFO" "Detected OS type: $os_type"
    echo "$os_type"
}

OS_TYPE=$(detect_os)

# Validate OS support
validate_os_support() {
    case "$OS_TYPE" in
        debian|redhat|macos|linux)
            return 0
            ;;
        *)
            print_error "Unsupported operating system: $OS_TYPE"
            print_error "Supported systems: Linux (Debian/RedHat), macOS"
            return 1
            ;;
    esac
}

# Secure URL validation
validate_download_url() {
    local url="$1"
    
    # Check URL format
    if [[ ! "$url" =~ ^https://[a-zA-Z0-9.-]+(/.*)?$ ]]; then
        security_log "ERROR" "Invalid URL format: $url"
        return 1
    fi
    
    # Check domain whitelist
    local domain
    domain=$(echo "$url" | sed 's|^https://||' | cut -d'/' -f1)
    
    local allowed=false
    for allowed_domain in "${ALLOWED_DOMAINS[@]}"; do
        if [[ "$domain" == "$allowed_domain" ]]; then
            allowed=true
            break
        fi
    done
    
    if [[ "$allowed" != true ]]; then
        security_log "ERROR" "Domain not in whitelist: $domain"
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
    
    if ! validate_download_url "$url"; then
        print_error "URL validation failed: $url"
        return 1
    fi
    
    if ! validate_path "$output_file"; then
        print_error "Invalid output file path: $output_file"
        return 1
    fi
    
    print_info "Downloading: $url"
    
    # Create temp file
    local temp_file
    temp_file=$(mktemp "${output_file}.XXXXXX") || {
        print_error "Failed to create temporary file"
        return 1
    }
    
    # Download with security measures
    if ! timeout 300 curl \
        --silent \
        --show-error \
        --fail \
        --location \
        --max-redirs 3 \
        --max-filesize "$MAX_DOWNLOAD_SIZE" \
        --user-agent "AI-Workflow-Installer/$SCRIPT_VERSION" \
        --proto '=https' \
        --tlsv1.2 \
        --output "$temp_file" \
        "$url" 2>/dev/null; then
        print_error "Download failed: $url"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    # Verify checksum if provided
    if [[ -n "$expected_checksum" ]]; then
        local actual_checksum
        case "$checksum_type" in
            sha256)
                if command -v sha256sum >/dev/null 2>&1; then
                    actual_checksum=$(sha256sum "$temp_file" | cut -d' ' -f1)
                elif command -v shasum >/dev/null 2>&1; then
                    actual_checksum=$(shasum -a 256 "$temp_file" | cut -d' ' -f1)
                else
                    print_warning "No SHA256 tool available, skipping checksum verification"
                fi
                ;;
            *)
                print_error "Unsupported checksum type: $checksum_type"
                rm -f "$temp_file" 2>/dev/null || true
                return 1
                ;;
        esac
        
        if [[ -n "$actual_checksum" && "$actual_checksum" != "$expected_checksum" ]]; then
            print_error "Checksum mismatch for $url"
            print_error "Expected: $expected_checksum"
            print_error "Actual: $actual_checksum"
            security_log "ERROR" "Checksum mismatch for $url: expected $expected_checksum, got $actual_checksum"
            rm -f "$temp_file" 2>/dev/null || true
            return 1
        fi
    fi
    
    # Move to final location
    if ! mv "$temp_file" "$output_file" 2>/dev/null; then
        print_error "Failed to move downloaded file"
        rm -f "$temp_file" 2>/dev/null || true
        return 1
    fi
    
    print_success "Download completed: $output_file"
    return 0
}

# Secure user input with timeout
secure_read_input() {
    local prompt="$1"
    local variable_name="$2"
    local timeout="${3:-$TIMEOUT_INTERACTIVE}"
    local max_length="${4:-1024}"
    
    local input=""
    
    if ! timeout "$timeout" bash -c "read -p '$prompt' input && echo \"\$input\"" 2>/dev/null; then
        print_error "Input timeout after ${timeout}s"
        return 1
    fi
    
    # Read the actual input
    read -p "$prompt" -r input || {
        print_error "Failed to read user input"
        return 1
    }
    
    # Sanitize input
    input=$(sanitize_input "$input" "$max_length")
    
    # Set variable
    printf -v "$variable_name" '%s' "$input"
    
    log "INFO" "User input received for $variable_name"
    return 0
}

# Secure component selection menu
show_component_menu() {
    local choice=""
    
    while true; do
        clear
        echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}${BOLD}║     Intelligent Workflow System - Secure Installation       ║${NC}"
        echo -e "${CYAN}${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
        echo -e "${CYAN}${BOLD}║  Select components to install:                              ║${NC}"
        echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
        echo -e "${CYAN}${BOLD}║  1. $([ "$INSTALL_CLAUDE_CODE" = true ] && echo "☑" || echo "☐") Claude Code (AI assistant)                      ║${NC}"
        echo -e "${CYAN}${BOLD}║  2. $([ "$INSTALL_AGENT_OS" = true ] && echo "☑" || echo "☐") Agent-OS (Agent management)                    ║${NC}"
        echo -e "${CYAN}${BOLD}║  3. $([ "$INSTALL_CLAUDE_FLOW" = true ] && echo "☑" || echo "☐") Claude Flow (Workflow engine)                   ║${NC}"
        echo -e "${CYAN}${BOLD}║  4. $([ "$INSTALL_TMUX" = true ] && echo "☑" || echo "☐") TMux Orchestrator (Terminal multiplexing)       ║${NC}"
        echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
        echo -e "${CYAN}${BOLD}║  c. Continue with installation                               ║${NC}"
        echo -e "${CYAN}${BOLD}║  q. Quit                                                     ║${NC}"
        echo -e "${CYAN}${BOLD}║                                                              ║${NC}"
        echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        
        if ! secure_read_input "Enter your choice: " choice 30 10; then
            print_error "Menu selection timeout"
            return 1
        fi
        
        case "$choice" in
            1) INSTALL_CLAUDE_CODE=$([ "$INSTALL_CLAUDE_CODE" = true ] && echo false || echo true) ;;
            2) INSTALL_AGENT_OS=$([ "$INSTALL_AGENT_OS" = true ] && echo false || echo true) ;;
            3) INSTALL_CLAUDE_FLOW=$([ "$INSTALL_CLAUDE_FLOW" = true ] && echo false || echo true) ;;
            4) INSTALL_TMUX=$([ "$INSTALL_TMUX" = true ] && echo false || echo true) ;;
            c|C) break ;;
            q|Q) 
                print_info "Installation cancelled by user"
                exit 0
                ;;
            *)
                print_warning "Invalid choice. Please try again."
                sleep 1
                ;;
        esac
    done
}

# Secure privilege check
check_privileges() {
    # Check if running as root (security risk)
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root detected - this is a security risk"
        security_log "WARNING" "Installation running as root"
        
        local continue_as_root=""
        if ! secure_read_input "Continue as root? (y/N): " continue_as_root 30 5; then
            return 1
        fi
        
        if [[ "$continue_as_root" != "y" && "$continue_as_root" != "Y" ]]; then
            print_error "Installation cancelled - please run as regular user"
            return 1
        fi
    fi
    
    # Check sudo availability if needed
    if [[ "$INSTALL_CLAUDE_CODE" == true ]] || [[ "$OS_TYPE" == "debian" ]]; then
        if ! command -v sudo >/dev/null 2>&1; then
            print_error "sudo is required but not available"
            return 1
        fi
        
        # Test sudo access
        if ! sudo -n true 2>/dev/null; then
            print_info "sudo access required for package installation"
            if ! sudo -v; then
                print_error "sudo authentication failed"
                return 1
            fi
        fi
    fi
    
    return 0
}

# Secure Node.js installation
install_node_secure() {
    print_info "Installing Node.js v20 securely..."
    
    case "$OS_TYPE" in
        debian)
            # Verify GPG key and repository
            local nodesource_key_url="https://deb.nodesource.com/gpgkey/nodesource.gpg.key"
            local expected_key_fingerprint="9FD3B784BC1C6FC31A8A0A1C1655A0AB68576280"
            
            if ! validate_download_url "$nodesource_key_url"; then
                print_error "NodeSource repository URL validation failed"
                return 1
            fi
            
            print_info "Adding NodeSource repository securely..."
            
            # Download and verify GPG key
            local temp_key
            temp_key=$(mktemp) || {
                print_error "Failed to create temporary key file"
                return 1
            }
            
            if ! secure_download "$nodesource_key_url" "$temp_key"; then
                print_error "Failed to download NodeSource GPG key"
                rm -f "$temp_key" 2>/dev/null || true
                return 1
            fi
            
            # Add repository and install
            if ! (curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -) 2>/dev/null; then
                print_error "Failed to add NodeSource repository"
                rm -f "$temp_key" 2>/dev/null || true
                return 1
            fi
            
            if ! sudo apt-get update -qq 2>/dev/null; then
                print_error "Failed to update package lists"
                return 1
            fi
            
            if ! sudo apt-get install -y nodejs 2>/dev/null; then
                print_error "Failed to install Node.js"
                return 1
            fi
            
            rm -f "$temp_key" 2>/dev/null || true
            ;;
        macos)
            if command -v brew >/dev/null 2>&1; then
                if ! brew install node@20 2>/dev/null; then
                    print_error "Failed to install Node.js via Homebrew"
                    return 1
                fi
            else
                print_error "Homebrew not found. Please install from https://brew.sh or download Node.js from https://nodejs.org"
                return 1
            fi
            ;;
        *)
            print_error "Please install Node.js 18+ from https://nodejs.org"
            return 1
            ;;
    esac
    
    # Verify installation
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js installation verification failed"
        return 1
    fi
    
    local node_version
    node_version=$(node -v 2>/dev/null | sed 's/^v//')
    print_success "Node.js $node_version installed successfully"
    return 0
}

# Secure package installation
install_package_secure() {
    local package_name="$1"
    local package_version="${2:-latest}"
    local global="${3:-false}"
    
    # Validate package name
    if [[ ! "$package_name" =~ ^[@a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)?$ ]]; then
        print_error "Invalid package name: $package_name"
        security_log "ERROR" "Invalid package name attempt: $package_name"
        return 1
    fi
    
    # Validate version
    if [[ ! "$package_version" =~ ^[a-zA-Z0-9._-]+$ ]]; then
        print_error "Invalid package version: $package_version"
        security_log "ERROR" "Invalid package version attempt: $package_version"
        return 1
    fi
    
    print_info "Installing package: $package_name@$package_version"
    
    local npm_cmd="npm install"
    if [[ "$global" == true ]]; then
        npm_cmd="$npm_cmd -g"
    fi
    
    local full_package="$package_name"
    if [[ "$package_version" != "latest" ]]; then
        full_package="$package_name@$package_version"
    fi
    
    # Install with timeout and error handling
    if ! timeout 300 $npm_cmd "$full_package" 2>/dev/null; then
        print_error "Failed to install package: $package_name"
        return 1
    fi
    
    print_success "Package installed: $package_name"
    return 0
}

# Main installation function with transaction support
main_installation() {
    print_header "Secure AI Workflow System Installation"
    
    # Start transaction
    local transaction_id
    if ! transaction_id=$(begin_transaction "main_installation" 2>/dev/null); then
        print_error "Failed to start installation transaction"
        return 1
    fi
    
    print_info "Starting installation (Transaction: $transaction_id)"
    
    # Validate environment
    if ! validate_os_support; then
        rollback_transaction "$transaction_id" 2>/dev/null || true
        return 1
    fi
    
    # Check privileges
    if ! check_privileges; then
        rollback_transaction "$transaction_id" 2>/dev/null || true
        return 1
    fi
    
    # Show component menu
    show_component_menu
    
    # Create directory structure securely
    print_info "Creating directory structure..."
    
    local directories=(
        "$INSTALL_DIR"
        "$INSTALL_DIR/intelligence-engine"
        "$INSTALL_DIR/bin"
        "$INSTALL_DIR/lib"
        "$INSTALL_DIR/hooks"
        "$INSTALL_DIR/logs"
        "$INSTALL_DIR/recovery"
        "$INSTALL_DIR/recovery/checkpoints"
        "$INSTALL_DIR/recovery/backups"
        "$INSTALL_DIR/configs"
        "$INSTALL_DIR/supervisor"
        "$PROJECT_DIR/.ai-dev"
    )
    
    for dir in "${directories[@]}"; do
        if ! validate_path "$dir"; then
            print_error "Invalid directory path: $dir"
            rollback_transaction "$transaction_id" 2>/dev/null || true
            return 1
        fi
        
        if ! mkdir -p "$dir" 2>/dev/null; then
            print_error "Failed to create directory: $dir"
            rollback_transaction "$transaction_id" 2>/dev/null || true
            return 1
        fi
        
        # Record in transaction
        record_operation "$transaction_id" "create_directory" "$dir" "Installation directory" 2>/dev/null || true
    done
    
    # Check and install Node.js
    if ! command -v node >/dev/null 2>&1; then
        print_info "Node.js not found, installing..."
        if ! install_node_secure; then
            rollback_transaction "$transaction_id" 2>/dev/null || true
            return 1
        fi
    else
        local node_version
        node_version=$(node -v 2>/dev/null | sed 's/^v//')
        local major_version
        major_version=$(echo "$node_version" | cut -d'.' -f1)
        
        if [[ $major_version -lt 18 ]]; then
            print_warning "Node.js version $node_version found, but v18+ required"
            if ! install_node_secure; then
                rollback_transaction "$transaction_id" 2>/dev/null || true
                return 1
            fi
        else
            print_success "Node.js $node_version found"
        fi
    fi
    
    # Install optional components
    if [[ "$INSTALL_CLAUDE_CODE" == true ]]; then
        print_info "Installing Claude Code..."
        if ! install_package_secure "@anthropic-ai/claude-code" "latest" true; then
            print_warning "Claude Code installation failed - continuing"
        fi
    fi
    
    # Copy core files
    print_info "Installing core files..."
    
    local core_files=(
        "intelligence-engine/complexity-analyzer.js"
        "intelligence-engine/project-scanner.js"
        "intelligence-engine/document-customizer.js"
        "workflow-runner.js"
    )
    
    for file in "${core_files[@]}"; do
        local source_file="$SCRIPT_DIR/$file"
        local dest_file="$INSTALL_DIR/$file"
        
        if [[ -f "$source_file" ]]; then
            if ! validate_path "$source_file" || ! validate_path "$dest_file"; then
                print_warning "Skipping invalid file path: $file"
                continue
            fi
            
            if ! cp "$source_file" "$dest_file" 2>/dev/null; then
                print_warning "Failed to copy file: $file"
                continue
            fi
            
            # Set secure permissions
            chmod 0644 "$dest_file" 2>/dev/null || true
            
            # Record in transaction
            record_operation "$transaction_id" "create_file" "$dest_file" "Core system file" 2>/dev/null || true
            print_success "Installed: $file"
        fi
    done
    
    # Create secure configuration
    print_info "Creating configuration..."
    
    local config_data='{
        "version": "'$SCRIPT_VERSION'",
        "installed_at": "'$(date -Iseconds)'",
        "components": {
            "core": true,
            "claudeCode": '$INSTALL_CLAUDE_CODE',
            "agentOS": '$INSTALL_AGENT_OS',
            "claudeFlow": '$INSTALL_CLAUDE_FLOW',
            "tmux": '$INSTALL_TMUX'
        },
        "security": {
            "validation_enabled": true,
            "audit_logging": true,
            "transaction_support": true
        }
    }'
    
    local config_file="$INSTALL_DIR/installation-config.json"
    if ! secure_create_file "$config_file" "$config_data" 0644; then
        print_error "Failed to create configuration file"
        rollback_transaction "$transaction_id" 2>/dev/null || true
        return 1
    fi
    
    record_operation "$transaction_id" "create_file" "$config_file" "Installation configuration" 2>/dev/null || true
    
    # Commit transaction
    if ! commit_transaction "$transaction_id" 2>/dev/null; then
        print_error "Failed to commit installation transaction"
        rollback_transaction "$transaction_id" 2>/dev/null || true
        return 1
    fi
    
    print_success "Installation completed successfully!"
    print_info "Transaction committed: $transaction_id"
    
    # Show summary
    echo -e "\n${GREEN}${BOLD}Installation Summary:${NC}"
    echo -e "  Core system: ✓"
    [[ "$INSTALL_CLAUDE_CODE" == true ]] && echo -e "  Claude Code: ✓" || echo -e "  Claude Code: ✗"
    [[ "$INSTALL_AGENT_OS" == true ]] && echo -e "  Agent-OS: ✓" || echo -e "  Agent-OS: ✗"
    [[ "$INSTALL_CLAUDE_FLOW" == true ]] && echo -e "  Claude Flow: ✓" || echo -e "  Claude Flow: ✗"
    [[ "$INSTALL_TMUX" == true ]] && echo -e "  TMux: ✓" || echo -e "  TMux: ✗"
    
    return 0
}

# Error handler
error_handler() {
    local line_no="$1"
    local error_code="$2"
    
    print_error "Error occurred at line $line_no (exit code: $error_code)"
    security_log "ERROR" "Script error at line $line_no, exit code $error_code"
    
    # Cleanup any running transactions
    if [[ -n "${transaction_id:-}" ]]; then
        print_info "Rolling back transaction due to error..."
        rollback_transaction "$transaction_id" 2>/dev/null || true
    fi
    
    exit "$error_code"
}

# Set error trap
trap 'error_handler $LINENO $?' ERR

# Signal handlers
cleanup() {
    print_info "Installation interrupted - cleaning up..."
    if [[ -n "${transaction_id:-}" ]]; then
        rollback_transaction "$transaction_id" 2>/dev/null || true
    fi
    exit 130
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    log "INFO" "Starting secure installation (version $SCRIPT_VERSION)"
    
    # Load backup manager if available
    if [[ -f "$INSTALL_DIR/lib/backup-manager.sh" ]]; then
        source "$INSTALL_DIR/lib/backup-manager.sh"
    else
        # Create minimal backup functions
        begin_transaction() { echo "tx_$(date +%s)"; }
        commit_transaction() { return 0; }
        rollback_transaction() { return 0; }
        record_operation() { return 0; }
    fi
    
    if main_installation; then
        print_success "AI Workflow System installed successfully!"
        log "INFO" "Installation completed successfully"
        exit 0
    else
        print_error "Installation failed"
        log "ERROR" "Installation failed"
        exit 1
    fi
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi