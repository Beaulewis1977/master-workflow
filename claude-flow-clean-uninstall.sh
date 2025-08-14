#!/bin/bash
# Claude Flow 2.0 Clean Uninstall Script
# Cross-platform shell script for easy uninstallation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
DRY_RUN=false
FORCE=false
NO_BACKUP=false
VERBOSE=false
HELP=false

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to show help
show_help() {
    cat << EOF
Claude Flow 2.0 Clean Uninstaller

USAGE:
    $0 [OPTIONS]
    $0 recover --from-backup <backup-path>

OPTIONS:
    --dry-run       Preview what will be removed without actually removing
    --force         Skip confirmation prompts and stop running processes
    --no-backup     Skip backup creation (not recommended)
    --verbose       Show detailed output during uninstall
    --help, -h      Show this help message

RECOVERY:
    recover --from-backup <path>    Restore from a backup directory

EXAMPLES:
    $0 --dry-run                    # Preview what will be removed
    $0 --force --verbose            # Force uninstall with detailed output
    $0 --no-backup                  # Skip backup (faster but not recommended)
    $0 recover --from-backup /tmp/claude-flow-backup-123456

DESCRIPTION:
    This script safely removes ALL Claude Flow 2.0 components while preserving
    100% of your original project files. It includes:
    
    - Comprehensive backup system
    - Component scanner to find all Claude Flow files
    - Safe removal with verification
    - Project integrity checks
    - Recovery system for failed uninstalls
    - Cross-platform compatibility

SAFETY FEATURES:
    - Creates backup before removal (unless --no-backup)
    - Scans for running processes and stops them safely
    - Verifies project integrity after removal
    - Can restore from backup if anything goes wrong
    - Never removes user's source code or project files

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --no-backup)
            NO_BACKUP=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            HELP=true
            shift
            ;;
        recover)
            RECOVER=true
            shift
            ;;
        --from-backup)
            BACKUP_PATH="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Show help if requested
if [ "$HELP" = true ]; then
    show_help
    exit 0
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
UNINSTALLER_JS="$SCRIPT_DIR/claude-flow-uninstaller.js"

# Check if the uninstaller exists
if [ ! -f "$UNINSTALLER_JS" ]; then
    print_error "claude-flow-uninstaller.js not found in $SCRIPT_DIR"
    print_error "Please ensure both files are in the same directory."
    exit 1
fi

# Handle recovery command
if [ "$RECOVER" = true ]; then
    if [ -z "$BACKUP_PATH" ]; then
        print_error "Recovery requires --from-backup <backup-path>"
        print_error "Usage: $0 recover --from-backup <backup-path>"
        exit 1
    fi
    
    if [ ! -d "$BACKUP_PATH" ]; then
        print_error "Backup directory does not exist: $BACKUP_PATH"
        exit 1
    fi
    
    print_info "Starting recovery from backup: $BACKUP_PATH"
    node "$UNINSTALLER_JS" recover --from-backup "$BACKUP_PATH"
    exit $?
fi

# Build command line arguments for Node.js script
NODE_ARGS=()

if [ "$DRY_RUN" = true ]; then
    NODE_ARGS+=(--dry-run)
fi

if [ "$FORCE" = true ]; then
    NODE_ARGS+=(--force)
fi

if [ "$NO_BACKUP" = true ]; then
    NODE_ARGS+=(--no-backup)
fi

if [ "$VERBOSE" = true ]; then
    NODE_ARGS+=(--verbose)
fi

# Pre-flight checks
print_info "Claude Flow 2.0 Clean Uninstaller"
print_info "Performing pre-flight checks..."

# Check if we're in a valid directory
if [ ! -f "package.json" ] && [ ! -d ".claude-flow" ] && [ ! -f "claude-flow-cli.js" ]; then
    print_warning "This doesn't appear to be a Claude Flow project directory."
    print_warning "No package.json, .claude-flow directory, or claude-flow-cli.js found."
    
    if [ "$FORCE" != true ]; then
        echo -n "Continue anyway? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_info "Uninstall cancelled."
            exit 0
        fi
    fi
fi

# Check for running processes before starting
print_info "Checking for running Claude Flow processes..."

# Function to check for running processes
check_processes() {
    local processes=("claude-flow" "hive-mind" "queen-controller" "node.*claude-flow")
    local found_processes=()
    
    for process in "${processes[@]}"; do
        if command -v pgrep &> /dev/null; then
            if pgrep -f "$process" > /dev/null 2>&1; then
                found_processes+=("$process")
            fi
        elif command -v ps &> /dev/null; then
            if ps aux | grep -v grep | grep -q "$process"; then
                found_processes+=("$process")
            fi
        fi
    done
    
    if [ ${#found_processes[@]} -gt 0 ]; then
        print_warning "Found running Claude Flow processes: ${found_processes[*]}"
        if [ "$FORCE" = true ]; then
            print_info "Force mode enabled - processes will be terminated during uninstall"
        else
            print_warning "Please stop these processes before uninstalling, or use --force to terminate them automatically."
            echo -n "Continue with force termination? (y/N): "
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                NODE_ARGS+=(--force)
            else
                print_info "Please stop the processes manually and try again."
                exit 1
            fi
        fi
    fi
}

# Only check processes if not in dry-run mode
if [ "$DRY_RUN" != true ]; then
    check_processes
fi

# Show what will be done
if [ "$DRY_RUN" = true ]; then
    print_info "DRY RUN MODE - Nothing will actually be removed"
else
    print_info "Starting Claude Flow 2.0 uninstallation..."
fi

# Create a trap to handle interruption
cleanup() {
    print_warning "Uninstall interrupted. Cleaning up..."
    # The Node.js script handles its own cleanup
    exit 1
}
trap cleanup INT TERM

# Run the Node.js uninstaller
print_info "Executing uninstaller..."
if node "$UNINSTALLER_JS" "${NODE_ARGS[@]}"; then
    if [ "$DRY_RUN" = true ]; then
        print_success "Dry run completed successfully!"
        print_info "Use '$(basename "$0")' without --dry-run to perform the actual uninstall."
    else
        print_success "Claude Flow 2.0 has been successfully uninstalled!"
        print_info "Your project files have been preserved."
        
        # Check if backup was created
        if [ -f ".claude-flow-backup-location.txt" ]; then
            BACKUP_LOC=$(cat .claude-flow-backup-location.txt)
            print_info "Backup created at: $BACKUP_LOC"
            print_info "You can recover using: $0 recover --from-backup '$BACKUP_LOC'"
            
            # Clean up the backup location file
            rm -f .claude-flow-backup-location.txt
        fi
        
        # Check if uninstall report was created
        if [ -f "claude-flow-uninstall-report.json" ]; then
            print_info "Uninstall report available: claude-flow-uninstall-report.json"
        fi
    fi
else
    EXIT_CODE=$?
    print_error "Uninstall failed with exit code $EXIT_CODE"
    
    # Check if backup exists for recovery
    if [ -f ".claude-flow-backup-location.txt" ]; then
        BACKUP_LOC=$(cat .claude-flow-backup-location.txt)
        print_info "Backup available at: $BACKUP_LOC"
        print_info "You can attempt recovery using: $0 recover --from-backup '$BACKUP_LOC'"
    fi
    
    exit $EXIT_CODE
fi