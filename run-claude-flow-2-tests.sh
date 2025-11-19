#!/bin/bash

# Claude Flow 2.0 - Complete Workflow Test Execution Script
# 
# Comprehensive test runner that validates the entire Claude Flow 2.0 system
# from project analysis to deployment readiness.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/test"
OUTPUT_DIR="$TEST_DIR/claude-flow-2-test-results-$(date +%Y%m%d_%H%M%S)"
VERBOSE=${VERBOSE:-false}
PARALLEL=${PARALLEL:-true}
WORKERS=${WORKERS:-4}
TIMEOUT=${TIMEOUT:-300}

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                   Claude Flow 2.0 - Complete Test Suite                    ║"
echo "║                                                                              ║"
echo "║                     Comprehensive Workflow Validation                      ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}🔧 Configuration:${NC}"
echo "   Test Directory: $TEST_DIR"
echo "   Output Directory: $OUTPUT_DIR"
echo "   Parallel Execution: $PARALLEL"
echo "   Workers: $WORKERS"
echo "   Timeout: ${TIMEOUT}s"
echo "   Verbose: $VERBOSE"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to log with timestamp
log() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')]${NC} $1"
}

# Function to log success
log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

# Function to log error
log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

# Function to log warning
log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local major_version=$(echo $node_version | cut -d'.' -f1)
    
    if [ "$major_version" -lt 18 ]; then
        log_error "Node.js version $node_version is too old. Required: >=18.0.0"
        exit 1
    fi
    
    log_success "Node.js version $node_version is compatible"
    
    # Check if test files exist
    local required_files=(
        "claude-flow-2-complete-workflow-test.js"
        "claude-flow-2-test-runner.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$TEST_DIR/$file" ]; then
            log_error "Required test file not found: $file"
            exit 1
        fi
    done
    
    log_success "All required test files found"
}

# Run specific test
run_test() {
    local test_name="$1"
    local test_file="$2"
    local start_time=$(date +%s)
    
    log "Running $test_name..."
    
    local output_file="$OUTPUT_DIR/${test_name}-output.log"
    local error_file="$OUTPUT_DIR/${test_name}-error.log"
    
    if [ "$VERBOSE" = true ]; then
        if timeout $TIMEOUT node "$TEST_DIR/$test_file" 2>&1 | tee "$output_file"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log_success "$test_name completed in ${duration}s"
            echo "$test_name:PASSED:${duration}" >> "$OUTPUT_DIR/test-results.txt"
            return 0
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log_error "$test_name failed after ${duration}s"
            echo "$test_name:FAILED:${duration}" >> "$OUTPUT_DIR/test-results.txt"
            return 1
        fi
    else
        if timeout $TIMEOUT node "$TEST_DIR/$test_file" > "$output_file" 2> "$error_file"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log_success "$test_name completed in ${duration}s"
            echo "$test_name:PASSED:${duration}" >> "$OUTPUT_DIR/test-results.txt"
            return 0
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            log_error "$test_name failed after ${duration}s"
            echo "$test_name:FAILED:${duration}" >> "$OUTPUT_DIR/test-results.txt"
            
            # Show error details
            if [ -s "$error_file" ]; then
                echo -e "${RED}Error details:${NC}"
                cat "$error_file"
            fi
            
            return 1
        fi
    fi
}

# Run test runner with options
run_test_runner() {
    log "Running Claude Flow 2.0 Test Runner..."
    
    local runner_args=""
    
    if [ "$PARALLEL" = true ]; then
        runner_args="$runner_args --parallel --workers $WORKERS"
    else
        runner_args="$runner_args --sequential"
    fi
    
    if [ "$VERBOSE" = true ]; then
        runner_args="$runner_args --verbose"
    fi
    
    runner_args="$runner_args --timeout $TIMEOUT --coverage --performance"
    
    local start_time=$(date +%s)
    local output_file="$OUTPUT_DIR/test-runner-output.log"
    local error_file="$OUTPUT_DIR/test-runner-error.log"
    
    if timeout $((TIMEOUT * 2)) node "$TEST_DIR/claude-flow-2-test-runner.js" $runner_args > "$output_file" 2> "$error_file"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "Test Runner completed in ${duration}s"
        
        # Copy test runner results
        if [ -d "$TEST_DIR/test-results" ]; then
            cp -r "$TEST_DIR/test-results"/* "$OUTPUT_DIR/" 2>/dev/null || true
        fi
        
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_error "Test Runner failed after ${duration}s"
        
        # Show error details
        if [ -s "$error_file" ]; then
            echo -e "${RED}Error details:${NC}"
            cat "$error_file"
        fi
        
        return 1
    fi
}

# Generate summary report
generate_summary() {
    log "Generating test summary..."
    
    local summary_file="$OUTPUT_DIR/test-summary.md"
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local total_duration=0
    
    if [ -f "$OUTPUT_DIR/test-results.txt" ]; then
        while IFS=':' read -r test_name status duration; do
            total_tests=$((total_tests + 1))
            total_duration=$((total_duration + duration))
            
            if [ "$status" = "PASSED" ]; then
                passed_tests=$((passed_tests + 1))
            else
                failed_tests=$((failed_tests + 1))
            fi
        done < "$OUTPUT_DIR/test-results.txt"
    fi
    
    local success_rate=0
    if [ $total_tests -gt 0 ]; then
        success_rate=$((passed_tests * 100 / total_tests))
    fi
    
    cat > "$summary_file" << EOF
# Claude Flow 2.0 - Test Execution Summary

## Overview

- **Execution Date**: $(date)
- **Total Tests**: $total_tests
- **Passed**: $passed_tests
- **Failed**: $failed_tests
- **Success Rate**: ${success_rate}%
- **Total Duration**: ${total_duration}s

## Test Results

| Test Name | Status | Duration |
|-----------|---------|----------|
EOF
    
    if [ -f "$OUTPUT_DIR/test-results.txt" ]; then
        while IFS=':' read -r test_name status duration; do
            local status_emoji="❌"
            if [ "$status" = "PASSED" ]; then
                status_emoji="✅"
            fi
            echo "| $test_name | $status_emoji $status | ${duration}s |" >> "$summary_file"
        done < "$OUTPUT_DIR/test-results.txt"
    fi
    
    cat >> "$summary_file" << EOF

## Configuration

- **Parallel Execution**: $PARALLEL
- **Workers**: $WORKERS
- **Timeout**: ${TIMEOUT}s
- **Verbose**: $VERBOSE

## Files Generated

EOF
    
    # List all generated files
    find "$OUTPUT_DIR" -type f -name "*.log" -o -name "*.json" -o -name "*.html" | while read -r file; do
        local basename=$(basename "$file")
        echo "- $basename" >> "$summary_file"
    done
    
    cat >> "$summary_file" << EOF

## Conclusion

EOF
    
    if [ $success_rate -ge 95 ]; then
        echo "✅ **ALL TESTS PASSED** - Claude Flow 2.0 workflow validation successful!" >> "$summary_file"
    elif [ $success_rate -ge 80 ]; then
        echo "⚠️  **MOSTLY PASSED** - Some tests failed, review required." >> "$summary_file"
    else
        echo "❌ **TESTS FAILED** - Significant issues detected, immediate attention required." >> "$summary_file"
    fi
    
    echo "" >> "$summary_file"
    echo "---" >> "$summary_file"
    echo "*Generated by Claude Flow 2.0 Test Suite*" >> "$summary_file"
    
    log_success "Summary report generated: $summary_file"
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --sequential|-s)
                PARALLEL=false
                shift
                ;;
            --workers|-w)
                WORKERS="$2"
                shift 2
                ;;
            --timeout|-t)
                TIMEOUT="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --verbose, -v         Enable verbose output"
                echo "  --sequential, -s      Disable parallel execution"
                echo "  --workers, -w <n>     Number of parallel workers (default: 4)"
                echo "  --timeout, -t <s>     Test timeout in seconds (default: 300)"
                echo "  --help, -h            Show this help message"
                echo ""
                echo "Environment Variables:"
                echo "  VERBOSE              Set to 'true' for verbose output"
                echo "  PARALLEL             Set to 'false' to disable parallel execution"
                echo "  WORKERS              Number of parallel workers"
                echo "  TIMEOUT              Test timeout in seconds"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check dependencies
    check_dependencies
    
    # Change to test directory
    cd "$TEST_DIR"
    
    log "Starting Claude Flow 2.0 test execution..."
    
    # Initialize results file
    echo "# Test Results" > "$OUTPUT_DIR/test-results.txt"
    
    local overall_success=true
    
    # Run individual workflow test
    if run_test "Complete Workflow Test" "claude-flow-2-complete-workflow-test.js"; then
        log_success "Complete Workflow Test passed"
    else
        log_error "Complete Workflow Test failed"
        overall_success=false
    fi
    
    # Run comprehensive test runner
    if run_test_runner; then
        log_success "Test Runner execution passed"
    else
        log_error "Test Runner execution failed"
        overall_success=false
    fi
    
    # Generate summary
    generate_summary
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    echo ""
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║                         🎉 TEST EXECUTION COMPLETE! 🎉                     ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}📊 Execution Summary:${NC}"
    echo "   Total Duration: ${total_duration}s"
    echo "   Output Directory: $OUTPUT_DIR"
    
    if [ -f "$OUTPUT_DIR/test-summary.md" ]; then
        echo "   Summary Report: $OUTPUT_DIR/test-summary.md"
    fi
    
    echo ""
    
    if [ "$overall_success" = true ]; then
        log_success "All tests completed successfully!"
        echo -e "${GREEN}✅ Claude Flow 2.0 workflow validation: PASSED${NC}"
        exit 0
    else
        log_error "Some tests failed!"
        echo -e "${RED}❌ Claude Flow 2.0 workflow validation: FAILED${NC}"
        echo -e "${YELLOW}Please review the test outputs in: $OUTPUT_DIR${NC}"
        exit 1
    fi
}

# Run main function
main "$@"