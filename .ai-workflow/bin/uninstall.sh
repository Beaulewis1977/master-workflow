#!/bin/bash

# AI Workflow Uninstaller - Bash Shim
# Cross-platform uninstaller for Linux/macOS/WSL
# Version: 1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo "Please install Node.js to use the uninstaller"
    exit 1
fi

# Check feature flag
if [ "$AIWF_UNINSTALLER" != "true" ] && [[ ! "$*" =~ "--force-enable" ]]; then
    echo -e "${YELLOW}⚠️  Uninstaller is currently in preview mode${NC}"
    echo "Set AIWF_UNINSTALLER=true to enable or use --force-enable flag"
    exit 0
fi

# Function to print banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║         AI WORKFLOW UNINSTALLER v1.0.0                 ║"
    echo "║         Safe removal of system components              ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    local issues=0
    
    # Check if we're in the right directory
    if [ ! -d "$PROJECT_ROOT/.ai-workflow" ]; then
        echo -e "${YELLOW}⚠️  Warning: .ai-workflow directory not found${NC}"
        echo "Are you in the correct project directory?"
        issues=$((issues + 1))
    fi
    
    # Check for write permissions
    if [ ! -w "$PROJECT_ROOT" ]; then
        echo -e "${RED}❌ Error: No write permission in project directory${NC}"
        issues=$((issues + 1))
    fi
    
    # Check if git repo
    if [ -d "$PROJECT_ROOT/.git" ]; then
        echo -e "${GREEN}✓ Git repository detected - git protection enabled${NC}"
    fi
    
    return $issues
}

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="Linux";;
        Darwin*)    OS="macOS";;
        CYGWIN*)    OS="Windows/Cygwin";;
        MINGW*)     OS="Windows/MinGW";;
        MSYS*)      OS="Windows/MSYS";;
        *)          OS="Unknown";;
    esac
    
    # Check if WSL
    if grep -qi microsoft /proc/version 2>/dev/null; then
        OS="WSL"
    fi
    
    echo -e "${BLUE}ℹ️  Detected OS: $OS${NC}"
}

# Main execution
main() {
    print_banner
    detect_os
    
    echo -e "${BLUE}📋 Pre-flight checks...${NC}"
    if ! check_prerequisites; then
        if [ $? -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Some issues detected, but continuing...${NC}"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}🚀 Starting uninstaller...${NC}"
    echo "─────────────────────────────────────────────────────────"
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Run the Node.js uninstaller
    node "$SCRIPT_DIR/../lib/uninstall/index.js" "$@"
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✨ Uninstaller completed successfully${NC}"
    else
        echo -e "${RED}❌ Uninstaller exited with code: $EXIT_CODE${NC}"
    fi
    
    exit $EXIT_CODE
}

# Handle interrupts
trap 'echo -e "\n${YELLOW}⚠️  Uninstall interrupted by user${NC}"; exit 130' INT TERM

# Run main function
main "$@"