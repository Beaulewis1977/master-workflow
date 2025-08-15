#!/bin/bash

# Template Generation Test Execution Script
# 
# Automated script for running comprehensive template generation tests
# Supports CI/CD pipeline integration and local development

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NODE_VERSION_REQUIRED="18"
TIMEOUT_MINUTES=30
RUN_ID=$(date +%Y%m%d_%H%M%S)

# Default options
RUN_MODE="full"
PARALLEL=false
CRITICAL_ONLY=false
VERBOSE=false
CLEANUP=true
GENERATE_ARTIFACTS=true

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Template Generation Test Runner

Usage: $0 [OPTIONS]

Options:
    --mode <full|quick|critical>    Test mode (default: full)
    --parallel                      Run tests in parallel
    --critical-only                 Run only critical tests
    --verbose                       Enable verbose output
    --no-cleanup                    Skip cleanup after tests
    --no-artifacts                  Skip artifact generation
    --timeout <minutes>             Test timeout in minutes (default: 30)
    --help                          Show this help message

Test Modes:
    full        Run all test suites
    quick       Run unit and integration tests only
    critical    Run only critical test suites

Examples:
    $0                              # Run all tests
    $0 --mode quick --parallel      # Quick parallel run
    $0 --critical-only --verbose    # Critical tests with verbose output

Environment Variables:
    CI                              Set to 'true' for CI environment
    NODE_ENV                        Node environment (default: test)
    CLAUDE_FLOW_TEST_TIMEOUT        Override timeout in seconds
    CLAUDE_FLOW_TEST_PARALLEL       Enable parallel execution
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --mode)
                RUN_MODE="$2"
                shift 2
                ;;
            --parallel)
                PARALLEL=true
                shift
                ;;
            --critical-only)
                CRITICAL_ONLY=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --no-cleanup)
                CLEANUP=false
                shift
                ;;
            --no-artifacts)
                GENERATE_ARTIFACTS=false
                shift
                ;;
            --timeout)
                TIMEOUT_MINUTES="$2"
                shift 2
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Check environment and prerequisites
check_environment() {
    print_status "Checking environment..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_MAJOR_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [[ $NODE_MAJOR_VERSION -lt $NODE_VERSION_REQUIRED ]]; then
        print_error "Node.js version $NODE_VERSION_REQUIRED or higher is required (found: $(node -v))"
        exit 1
    fi
    
    print_success "Node.js version: $(node -v)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "npm version: $(npm -v)"
    
    # Check if we're in the correct directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        print_error "Not in a valid project directory (package.json not found)"
        exit 1
    fi
    
    # Check test files exist
    local test_runner="$SCRIPT_DIR/template-generation-test-runner.js"
    if [[ ! -f "$test_runner" ]]; then
        print_error "Test runner not found: $test_runner"
        exit 1
    fi
    
    # Set environment variables
    export NODE_ENV="${NODE_ENV:-test}"
    export CLAUDE_FLOW_TEST_RUN_ID="$RUN_ID"
    
    # Apply environment variable overrides
    if [[ -n "$CLAUDE_FLOW_TEST_TIMEOUT" ]]; then
        TIMEOUT_MINUTES=$((CLAUDE_FLOW_TEST_TIMEOUT / 60))
    fi
    
    if [[ "$CLAUDE_FLOW_TEST_PARALLEL" == "true" ]]; then
        PARALLEL=true
    fi
    
    # Detect CI environment
    if [[ "$CI" == "true" || -n "$GITHUB_ACTIONS" || -n "$GITLAB_CI" || -n "$JENKINS_URL" ]]; then
        print_status "CI environment detected"
        export CLAUDE_FLOW_CI=true
        VERBOSE=true  # Enable verbose output in CI
    fi
    
    print_success "Environment check completed"
}

# Install dependencies if needed
install_dependencies() {
    print_status "Checking dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Check if node_modules exists and package-lock.json is newer
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]] || [[ "package-lock.json" -nt "node_modules" ]]; then
        print_status "Installing dependencies..."
        npm ci --silent
        print_success "Dependencies installed"
    else
        print_success "Dependencies up to date"
    fi
    
    # Install test dependencies if in test directory
    cd "$SCRIPT_DIR"
    if [[ -f "package.json" ]]; then
        if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
            print_status "Installing test dependencies..."
            npm install --silent
            print_success "Test dependencies installed"
        else
            print_success "Test dependencies up to date"
        fi
    fi
}

# Setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."
    
    # Create test output directory
    export CLAUDE_FLOW_TEST_OUTPUT_DIR="$PROJECT_ROOT/test-output/$RUN_ID"
    mkdir -p "$CLAUDE_FLOW_TEST_OUTPUT_DIR"
    
    # Set up logging
    export CLAUDE_FLOW_TEST_LOG_FILE="$CLAUDE_FLOW_TEST_OUTPUT_DIR/test-execution.log"
    touch "$CLAUDE_FLOW_TEST_LOG_FILE"
    
    # Create temporary directory for test artifacts
    export CLAUDE_FLOW_TEST_TEMP_DIR=$(mktemp -d)
    
    # Set test configuration
    export CLAUDE_FLOW_TEST_VERBOSE="$VERBOSE"
    export CLAUDE_FLOW_TEST_PARALLEL="$PARALLEL"
    export CLAUDE_FLOW_TEST_CRITICAL_ONLY="$CRITICAL_ONLY"
    
    print_success "Test environment setup completed"
    print_status "Output directory: $CLAUDE_FLOW_TEST_OUTPUT_DIR"
    print_status "Temp directory: $CLAUDE_FLOW_TEST_TEMP_DIR"
}

# Build test runner arguments
build_test_args() {
    local args=()
    
    if [[ "$PARALLEL" == "true" ]]; then
        args+=(--parallel)
    fi
    
    if [[ "$CRITICAL_ONLY" == "true" ]]; then
        args+=(--critical-only)
    fi
    
    # Mode-specific arguments
    case $RUN_MODE in
        quick)
            args+=(--suites "unit,integration")
            ;;
        critical)
            args+=(--critical-only)
            ;;
        full)
            # No additional arguments for full mode
            ;;
        *)
            print_error "Unknown run mode: $RUN_MODE"
            exit 1
            ;;
    esac
    
    echo "${args[@]}"
}

# Run the tests
run_tests() {
    print_status "Starting template generation tests..."
    print_status "Run ID: $RUN_ID"
    print_status "Mode: $RUN_MODE"
    print_status "Parallel: $PARALLEL"
    print_status "Critical only: $CRITICAL_ONLY"
    print_status "Timeout: ${TIMEOUT_MINUTES} minutes"
    
    cd "$SCRIPT_DIR"
    
    local test_args
    test_args=($(build_test_args))
    
    local start_time
    start_time=$(date +%s)
    
    local exit_code=0
    
    # Run the test runner with timeout
    if [[ "$VERBOSE" == "true" ]]; then
        timeout "${TIMEOUT_MINUTES}m" node template-generation-test-runner.js "${test_args[@]}" 2>&1 | tee "$CLAUDE_FLOW_TEST_LOG_FILE"
        exit_code=${PIPESTATUS[0]}
    else
        timeout "${TIMEOUT_MINUTES}m" node template-generation-test-runner.js "${test_args[@]}" > "$CLAUDE_FLOW_TEST_LOG_FILE" 2>&1
        exit_code=$?
    fi
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Handle timeout
    if [[ $exit_code -eq 124 ]]; then
        print_error "Tests timed out after ${TIMEOUT_MINUTES} minutes"
        return 124
    fi
    
    print_status "Test execution completed in ${duration} seconds"
    
    # Show test results summary
    if [[ -f "$CLAUDE_FLOW_TEST_LOG_FILE" ]]; then
        echo ""
        print_status "Test Results Summary:"
        echo "========================"
        
        # Extract key information from log
        if grep -q "Template Generation Test Run Complete" "$CLAUDE_FLOW_TEST_LOG_FILE"; then
            grep -A 20 "Template Generation Test Run Complete" "$CLAUDE_FLOW_TEST_LOG_FILE" | head -20
        else
            tail -20 "$CLAUDE_FLOW_TEST_LOG_FILE"
        fi
    fi
    
    return $exit_code
}

# Generate test artifacts
generate_artifacts() {
    if [[ "$GENERATE_ARTIFACTS" != "true" ]]; then
        print_status "Skipping artifact generation"
        return 0
    fi
    
    print_status "Generating test artifacts..."
    
    # Copy test reports to output directory
    find "$PROJECT_ROOT" -name "*test-report*.json" -newer "$CLAUDE_FLOW_TEST_OUTPUT_DIR" -exec cp {} "$CLAUDE_FLOW_TEST_OUTPUT_DIR/" \; 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*test-summary*.md" -newer "$CLAUDE_FLOW_TEST_OUTPUT_DIR" -exec cp {} "$CLAUDE_FLOW_TEST_OUTPUT_DIR/" \; 2>/dev/null || true
    
    # Create execution summary
    cat > "$CLAUDE_FLOW_TEST_OUTPUT_DIR/execution-summary.txt" << EOF
Template Generation Test Execution Summary
==========================================

Run ID: $RUN_ID
Date: $(date)
Mode: $RUN_MODE
Parallel: $PARALLEL
Critical Only: $CRITICAL_ONLY
Timeout: ${TIMEOUT_MINUTES} minutes

Environment:
- Node.js: $(node -v)
- npm: $(npm -v)
- Platform: $(uname -s) $(uname -m)
- Working Directory: $PROJECT_ROOT

CI Environment: ${CI:-false}

Test Output Directory: $CLAUDE_FLOW_TEST_OUTPUT_DIR
Log File: $CLAUDE_FLOW_TEST_LOG_FILE
EOF
    
    # Generate test file listing
    find "$CLAUDE_FLOW_TEST_OUTPUT_DIR" -type f > "$CLAUDE_FLOW_TEST_OUTPUT_DIR/generated-files.txt"
    
    local artifact_count
    artifact_count=$(wc -l < "$CLAUDE_FLOW_TEST_OUTPUT_DIR/generated-files.txt")
    
    print_success "Generated $artifact_count test artifacts"
}

# Cleanup function
cleanup() {
    if [[ "$CLEANUP" != "true" ]]; then
        print_status "Skipping cleanup"
        return 0
    fi
    
    print_status "Cleaning up..."
    
    # Remove temporary directory
    if [[ -n "$CLAUDE_FLOW_TEST_TEMP_DIR" && -d "$CLAUDE_FLOW_TEST_TEMP_DIR" ]]; then
        rm -rf "$CLAUDE_FLOW_TEST_TEMP_DIR"
        print_success "Removed temporary directory"
    fi
    
    # Clean up old test reports in project root (keep latest 5)
    cd "$PROJECT_ROOT"
    ls -t *test-report*.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    ls -t *test-summary*.md 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main execution function
main() {
    local exit_code=0
    
    # Parse arguments
    parse_args "$@"
    
    # Setup trap for cleanup
    trap cleanup EXIT
    
    print_status "Template Generation Test Runner"
    print_status "==============================="
    
    # Run all setup steps
    check_environment
    install_dependencies
    setup_test_environment
    
    # Run tests
    if ! run_tests; then
        exit_code=$?
        print_error "Tests failed with exit code $exit_code"
    else
        print_success "All tests completed successfully"
    fi
    
    # Generate artifacts regardless of test outcome
    generate_artifacts
    
    # Final status
    if [[ $exit_code -eq 0 ]]; then
        print_success "Template generation tests completed successfully"
        print_status "Results available in: $CLAUDE_FLOW_TEST_OUTPUT_DIR"
    else
        print_error "Template generation tests failed"
        print_status "Check logs at: $CLAUDE_FLOW_TEST_LOG_FILE"
    fi
    
    return $exit_code
}

# Run main function with all arguments
main "$@"