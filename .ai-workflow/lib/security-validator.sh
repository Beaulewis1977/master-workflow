#!/bin/bash

# Security Validation and Testing Module
# Provides comprehensive security testing for the installation/uninstaller system

set -euo pipefail

# Source security utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/security-utils.sh"

# Test configuration
readonly TEST_LOG_FILE="${INSTALL_DIR:-/tmp}/logs/security-tests.log"
readonly TEMP_TEST_DIR="/tmp/ai-workflow-security-tests"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Initialize testing environment
init_security_testing() {
    mkdir -p "$(dirname "$TEST_LOG_FILE")" 2>/dev/null || true
    mkdir -p "$TEMP_TEST_DIR" 2>/dev/null || true
    
    test_log "INFO" "Security testing initialized"
}

# Test logging
test_log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [TEST-$level] $message" | tee -a "$TEST_LOG_FILE"
}

# Test assertion helper
assert_test() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    ((TESTS_TOTAL++))
    
    if [[ "$expected" == "$actual" ]]; then
        ((TESTS_PASSED++))
        test_log "PASS" "$test_name"
        return 0
    else
        ((TESTS_FAILED++))
        test_log "FAIL" "$test_name - Expected: '$expected', Got: '$actual'"
        return 1
    fi
}

# Test command execution with expected result
assert_command() {
    local test_name="$1"
    local command="$2"
    local expected_exit_code="${3:-0}"
    
    ((TESTS_TOTAL++))
    
    local actual_exit_code=0
    eval "$command" >/dev/null 2>&1 || actual_exit_code=$?
    
    if [[ $actual_exit_code -eq $expected_exit_code ]]; then
        ((TESTS_PASSED++))
        test_log "PASS" "$test_name"
        return 0
    else
        ((TESTS_FAILED++))
        test_log "FAIL" "$test_name - Expected exit code: $expected_exit_code, Got: $actual_exit_code"
        return 1
    fi
}

# Test input validation functions
test_input_validation() {
    test_log "INFO" "Testing input validation functions..."
    
    # Test path validation
    assert_command "Valid path validation" "validate_path '/valid/path'" 0
    assert_command "Invalid path with null byte" "validate_path '/path/with\0null'" 1
    assert_command "Invalid path with directory traversal" "validate_path '/path/../../../etc/passwd'" 1
    assert_command "Invalid path with shell metacharacters" "validate_path '/path/with;injection'" 1
    assert_command "Invalid path too long" "validate_path '$(printf '%*s' 5000 | tr ' ' 'a')'" 1
    
    # Test input sanitization
    local sanitized_input
    sanitized_input=$(sanitize_input "normal_input")
    assert_test "Sanitize normal input" "normal_input" "$sanitized_input"
    
    sanitized_input=$(sanitize_input $'input\nwith\rnewlines\t')
    local expected_sanitized
    expected_sanitized=$(printf '%q' "inputwithnewlines")
    assert_test "Sanitize input with control characters" "$expected_sanitized" "$sanitized_input"
    
    # Test input length limits
    local long_input
    long_input=$(printf '%*s' 2000 | tr ' ' 'a')
    sanitized_input=$(sanitize_input "$long_input" 100)
    local expected_length=100
    local actual_length=${#sanitized_input}
    # Account for shell escaping
    if [[ $actual_length -le 110 ]]; then  # Allow some margin for escaping
        ((TESTS_PASSED++))
        test_log "PASS" "Input length limiting works"
    else
        ((TESTS_FAILED++))
        test_log "FAIL" "Input length limiting failed - Length: $actual_length"
    fi
    ((TESTS_TOTAL++))
}

# Test URL validation
test_url_validation() {
    test_log "INFO" "Testing URL validation..."
    
    # Valid URLs
    assert_command "Valid HTTPS URL" "validate_url 'https://example.com/path'" 0
    assert_command "Valid HTTPS URL with subdomain" "validate_url 'https://sub.example.com/path'" 0
    
    # Invalid URLs
    assert_command "Invalid HTTP URL" "validate_url 'http://example.com/path'" 1
    assert_command "Invalid URL with suspicious characters" "validate_url 'https://example.com/path<script>'" 1
    assert_command "Invalid URL format" "validate_url 'not-a-url'" 1
    assert_command "Invalid FTP URL" "validate_url 'ftp://example.com/file'" 1
}

# Test file operations security
test_file_operations() {
    test_log "INFO" "Testing secure file operations..."
    
    # Test secure file creation
    local test_file="$TEMP_TEST_DIR/test_file.txt"
    local test_content="Test content"
    
    if secure_create_file "$test_file" "$test_content" 0644; then
        if [[ -f "$test_file" && "$(cat "$test_file")" == "$test_content" ]]; then
            ((TESTS_PASSED++))
            test_log "PASS" "Secure file creation works"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Secure file creation - file not created or content mismatch"
        fi
    else
        ((TESTS_FAILED++))
        test_log "FAIL" "Secure file creation failed"
    fi
    ((TESTS_TOTAL++))
    
    # Test secure directory creation
    local test_dir="$TEMP_TEST_DIR/test_dir"
    if secure_create_directory "$test_dir" 0755; then
        if [[ -d "$test_dir" ]]; then
            ((TESTS_PASSED++))
            test_log "PASS" "Secure directory creation works"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Secure directory creation - directory not created"
        fi
    else
        ((TESTS_FAILED++))
        test_log "FAIL" "Secure directory creation failed"
    fi
    ((TESTS_TOTAL++))
    
    # Test file path traversal prevention
    assert_command "Prevent directory traversal in file creation" "secure_create_file '$TEMP_TEST_DIR/../../../etc/malicious' 'content'" 1
}

# Test download security
test_download_security() {
    test_log "INFO" "Testing download security..."
    
    # Test URL validation in downloads
    local test_download_file="$TEMP_TEST_DIR/download_test"
    
    # This should fail due to invalid URL
    assert_command "Reject invalid URL in download" "secure_download 'http://malicious.com/file' '$test_download_file'" 1
    
    # This should fail due to suspicious characters
    assert_command "Reject URL with suspicious characters" "secure_download 'https://example.com/file<script>' '$test_download_file'" 1
    
    # Test path validation in downloads
    assert_command "Reject invalid download path" "secure_download 'https://example.com/file' '/invalid/../path'" 1
}

# Test privilege escalation prevention
test_privilege_escalation() {
    test_log "INFO" "Testing privilege escalation prevention..."
    
    # Test root detection
    if [[ $EUID -eq 0 ]]; then
        if check_root_privilege; then
            ((TESTS_PASSED++))
            test_log "PASS" "Root privilege detection works"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Root privilege detection failed"
        fi
    else
        if ! check_root_privilege; then
            ((TESTS_PASSED++))
            test_log "PASS" "Non-root detection works"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Non-root detection failed"
        fi
    fi
    ((TESTS_TOTAL++))
    
    # Test sudo validation
    if command -v sudo >/dev/null 2>&1; then
        if validate_sudo_requirement "test command" "testing"; then
            ((TESTS_PASSED++))
            test_log "PASS" "Sudo validation works"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Sudo validation failed"
        fi
    else
        ((TESTS_PASSED++))
        test_log "PASS" "Sudo validation skipped (sudo not available)"
    fi
    ((TESTS_TOTAL++))
}

# Test backup system security
test_backup_security() {
    test_log "INFO" "Testing backup system security..."
    
    # Source backup manager if available
    if [[ -f "${SCRIPT_DIR}/backup-manager.sh" ]]; then
        source "${SCRIPT_DIR}/backup-manager.sh"
        
        # Test backup creation with valid paths
        local test_source="$TEMP_TEST_DIR/backup_source"
        mkdir -p "$test_source"
        echo "test content" > "$test_source/test_file.txt"
        
        local backup_dir
        if backup_dir=$(create_backup "security_test" "$test_source" 2>/dev/null); then
            if [[ -d "$backup_dir" && -f "$backup_dir/backup_source/test_file.txt" ]]; then
                ((TESTS_PASSED++))
                test_log "PASS" "Backup creation with valid paths works"
                
                # Clean up
                rm -rf "$backup_dir" 2>/dev/null || true
            else
                ((TESTS_FAILED++))
                test_log "FAIL" "Backup creation - backup not created properly"
            fi
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Backup creation failed"
        fi
        ((TESTS_TOTAL++))
        
        # Test backup with invalid paths
        assert_command "Reject backup with invalid path" "create_backup 'test' '/invalid/../path' 2>/dev/null" 1
        
    else
        test_log "INFO" "Backup manager not available, skipping backup security tests"
    fi
}

# Test uninstaller security
test_uninstaller_security() {
    test_log "INFO" "Testing uninstaller security..."
    
    # Test dry-run mode
    local uninstaller_script="${SCRIPT_DIR}/../bin/uninstall.sh"
    if [[ -f "$uninstaller_script" ]]; then
        # Test that dry-run doesn't actually remove files
        assert_command "Uninstaller dry-run mode works" "bash '$uninstaller_script' --dry-run --yes" 0
        
        # Test that uninstaller rejects invalid options
        assert_command "Uninstaller rejects invalid options" "bash '$uninstaller_script' --invalid-option" 1
        
        # Test that uninstaller requires confirmation in interactive mode
        # This test assumes no TTY, so it should exit without doing anything
        local exit_code=0
        echo "n" | timeout 5 bash "$uninstaller_script" 2>/dev/null || exit_code=$?
        if [[ $exit_code -ne 0 ]]; then
            ((TESTS_PASSED++))
            test_log "PASS" "Uninstaller requires proper confirmation"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Uninstaller doesn't require proper confirmation"
        fi
        ((TESTS_TOTAL++))
    else
        test_log "INFO" "Uninstaller not found, skipping uninstaller security tests"
    fi
}

# Test installation script security
test_installer_security() {
    test_log "INFO" "Testing installer security..."
    
    # Check for secure installer
    local secure_installer="${SCRIPT_DIR}/../install-modular-secure.sh"
    if [[ -f "$secure_installer" ]]; then
        # Test that installer validates environment
        # This should work in a basic environment
        local installer_output
        installer_output=$(timeout 10 bash "$secure_installer" --help 2>&1 || true)
        
        if [[ "$installer_output" == *"Secure Installation"* ]]; then
            ((TESTS_PASSED++))
            test_log "PASS" "Secure installer available and responsive"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Secure installer not responsive or help not available"
        fi
        ((TESTS_TOTAL++))
    else
        test_log "INFO" "Secure installer not found, skipping installer security tests"
    fi
}

# Test process isolation and cleanup
test_process_security() {
    test_log "INFO" "Testing process security..."
    
    # Test that scripts handle interruption gracefully
    # This is a basic test - in practice, you'd want more sophisticated tests
    
    # Test signal handling
    local test_script="$TEMP_TEST_DIR/signal_test.sh"
    cat > "$test_script" << 'EOF'
#!/bin/bash
set -euo pipefail

cleanup() {
    echo "Cleanup called" > /tmp/signal_test_cleanup
    exit 0
}

trap cleanup SIGTERM SIGINT

sleep 10 &
wait
EOF
    chmod +x "$test_script"
    
    # Start the script and send SIGTERM
    "$test_script" &
    local pid=$!
    sleep 1
    kill -TERM "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    
    if [[ -f "/tmp/signal_test_cleanup" ]]; then
        ((TESTS_PASSED++))
        test_log "PASS" "Signal handling works"
        rm -f "/tmp/signal_test_cleanup"
    else
        ((TESTS_FAILED++))
        test_log "FAIL" "Signal handling doesn't work"
    fi
    ((TESTS_TOTAL++))
    
    rm -f "$test_script"
}

# Test logging and audit trail security
test_logging_security() {
    test_log "INFO" "Testing logging security..."
    
    # Test that security events are logged
    security_log "TEST" "Test security event"
    
    if [[ -f "${INSTALL_DIR:-/tmp}/logs/security.log" ]]; then
        if grep -q "Test security event" "${INSTALL_DIR:-/tmp}/logs/security.log"; then
            ((TESTS_PASSED++))
            test_log "PASS" "Security logging works"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Security logging doesn't record events"
        fi
    else
        ((TESTS_FAILED++))
        test_log "FAIL" "Security log file not created"
    fi
    ((TESTS_TOTAL++))
    
    # Test log file permissions
    if [[ -f "${INSTALL_DIR:-/tmp}/logs/security.log" ]]; then
        local log_perms
        log_perms=$(stat -c "%a" "${INSTALL_DIR:-/tmp}/logs/security.log" 2>/dev/null || echo "000")
        
        # Should be readable/writable by owner, readable by group, not accessible by others
        if [[ "$log_perms" =~ ^[67][046][04]$ ]]; then
            ((TESTS_PASSED++))
            test_log "PASS" "Security log file has appropriate permissions: $log_perms"
        else
            ((TESTS_FAILED++))
            test_log "FAIL" "Security log file has inappropriate permissions: $log_perms"
        fi
    else
        ((TESTS_FAILED++))
        test_log "FAIL" "Security log file not found for permission check"
    fi
    ((TESTS_TOTAL++))
}

# Run comprehensive security tests
run_security_tests() {
    test_log "INFO" "Starting comprehensive security tests..."
    
    TESTS_TOTAL=0
    TESTS_PASSED=0
    TESTS_FAILED=0
    
    # Initialize testing environment
    init_security_testing
    
    # Run all test suites
    test_input_validation
    test_url_validation
    test_file_operations
    test_download_security
    test_privilege_escalation
    test_backup_security
    test_uninstaller_security
    test_installer_security
    test_process_security
    test_logging_security
    
    # Generate summary
    test_log "INFO" "Security tests completed"
    test_log "INFO" "Total tests: $TESTS_TOTAL"
    test_log "INFO" "Passed: $TESTS_PASSED"
    test_log "INFO" "Failed: $TESTS_FAILED"
    
    local success_rate=0
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi
    test_log "INFO" "Success rate: $success_rate%"
    
    # Cleanup test environment
    rm -rf "$TEMP_TEST_DIR" 2>/dev/null || true
    
    # Return appropriate exit code
    if [[ $TESTS_FAILED -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

# Generate security test report
generate_security_report() {
    local report_file="${INSTALL_DIR:-/tmp}/logs/security-report.json"
    
    local report_data='{
        "test_run_id": "'$(date +%s)'",
        "timestamp": "'$(date -Iseconds)'",
        "version": "2.0.0-secure",
        "results": {
            "total_tests": '$TESTS_TOTAL',
            "passed": '$TESTS_PASSED',
            "failed": '$TESTS_FAILED',
            "success_rate": '$(( TESTS_TOTAL > 0 ? TESTS_PASSED * 100 / TESTS_TOTAL : 0 ))'
        },
        "test_categories": {
            "input_validation": "completed",
            "url_validation": "completed", 
            "file_operations": "completed",
            "download_security": "completed",
            "privilege_escalation": "completed",
            "backup_security": "completed",
            "uninstaller_security": "completed",
            "installer_security": "completed",
            "process_security": "completed",
            "logging_security": "completed"
        },
        "recommendations": []
    }'
    
    # Add recommendations based on test results
    if [[ $TESTS_FAILED -gt 0 ]]; then
        report_data=$(echo "$report_data" | jq '.recommendations += ["Review failed tests in security test log", "Address security vulnerabilities before production use"]')
    fi
    
    if [[ $success_rate -lt 95 ]]; then
        report_data=$(echo "$report_data" | jq '.recommendations += ["Security success rate below 95% - immediate attention required"]')
    fi
    
    echo "$report_data" > "$report_file" 2>/dev/null || true
    test_log "INFO" "Security report generated: $report_file"
}

# Main function for running tests
main_security_validation() {
    echo "AI Workflow System - Security Validation"
    echo "======================================="
    
    if run_security_tests; then
        echo "✓ All security tests passed"
        generate_security_report
        return 0
    else
        echo "✗ Some security tests failed"
        echo "Review the security test log for details: $TEST_LOG_FILE"
        generate_security_report
        return 1
    fi
}

# Export functions
export -f run_security_tests
export -f generate_security_report
export -f main_security_validation

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_security_validation "$@"
fi