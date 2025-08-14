# Phase 5 Process Management Test Suite Documentation

## Overview

The Phase 5 test suite provides comprehensive testing for the AI Workflow Uninstaller's process management capabilities, including tmux session detection, background process management, and cross-platform process termination with safety mechanisms.

## Test Files

### Main Test File
- **File**: `test-phase5-process.js`
- **Purpose**: Comprehensive test suite for all Phase 5 functionality
- **Executable**: Yes (`chmod +x`)

### Test Runner
- **File**: `run-phase5-tests.js`
- **Purpose**: Simplified runner following the pattern of other phases
- **Usage**: `node run-phase5-tests.js`

## Test Coverage

### 1. Platform Detection & Compatibility
- Tests cross-platform detection (Linux, macOS, Windows)
- Verifies platform-specific logic paths
- Validates architecture and release information

### 2. ProcessManager Initialization
- Tests default and custom initialization options
- Verifies pattern arrays and configuration
- Validates dry-run mode setup

### 3. Tmux Session Detection (Mocked)
- **Platform**: Unix/Linux only (skipped on Windows)
- Tests workflow pattern matching
- Validates session filtering and data structure
- Uses mock data to avoid requiring actual tmux sessions

### 4. Background Process Detection
- Tests Unix and Windows process discovery
- Validates workflow pattern matching
- Tests process filtering and validation logic
- Uses mock data for consistent testing

### 5. Windows Process Detection (Conditional)
- **Platform**: Windows only (skipped on other platforms)
- Tests PowerShell-based process detection
- Validates Windows-specific process structure
- Uses mock Windows process data

### 6. Process Tree Building
- Tests parent-child relationship mapping
- Validates cross-platform tree construction
- Tests tree structure integrity

### 7. Safety Mechanisms & Whitelisting
- Tests process ownership validation
- Validates system process protection
- Tests tmux session safety checks
- Ensures critical processes are protected

### 8. Cross-Platform Process Validation
- Tests platform-specific command generation
- Validates process running detection
- Tests with actual running processes

### 9. Dry-Run Mode Testing
- Tests non-destructive operation mode
- Validates reporting without actual termination
- Tests all termination paths in dry-run

### 10. Graceful Process Termination (Mocked)
- Tests signal-based termination (Unix)
- Tests taskkill termination (Windows)
- Validates graceful vs. force termination logic

### 11. Child Process Management
- Tests child process discovery
- Validates recursive termination logic
- Tests child process data structures

### 12. Error Handling & Edge Cases
- Tests command failure scenarios
- Validates invalid data handling
- Tests error recovery mechanisms

### 13. Process Running Detection
- Tests with current process (guaranteed running)
- Tests with non-existent processes
- Validates platform-specific detection

### 14. Backward Compatibility
- Tests legacy function interfaces
- Validates utility function exports
- Ensures existing code continues working

### 15. Performance Benchmarks
- Measures process tree building speed
- Tests process running check performance
- Benchmarks full detection cycle
- Provides performance thresholds

## Running Tests

### Quick Test Run
```bash
cd /workspaces/MASTER-WORKFLOW/.ai-workflow/lib/uninstall
node run-phase5-tests.js
```

### Direct Test Execution
```bash
cd /workspaces/MASTER-WORKFLOW/.ai-workflow/lib/uninstall
./test-phase5-process.js
```

### With Debug Information
```bash
DEBUG_TESTS=1 node test-phase5-process.js
```

## Test Results Interpretation

### Success Indicators
- **✅ ALL TESTS PASSED**: All functionality working correctly
- **Performance metrics**: Within acceptable thresholds
- **Platform notes**: Appropriate tests run for current platform

### Failure Analysis
- **Failed test count**: Number and names of failing tests
- **Error messages**: Specific failure reasons
- **Stack traces**: Available with DEBUG_TESTS=1

### Performance Thresholds
- **Process Tree Building**: < 5000ms
- **Process Running Check**: < 1000ms
- **Full Detection Cycle**: < 10000ms

## Mock Data Strategy

### Why Mocking?
- **Consistency**: Tests produce same results across environments
- **Safety**: No risk of terminating real processes during testing
- **Speed**: Faster execution without external dependencies
- **Isolation**: Tests don't depend on system state

### Mock Data Types
1. **Tmux Sessions**: Predefined session names and metadata
2. **Unix Processes**: Process list with PIDs, users, commands
3. **Windows Processes**: PowerShell-style process objects
4. **Process Trees**: Parent-child relationships

### Real System Integration
- Current process detection (using actual PID)
- Platform detection (using actual OS)
- Process running checks (with live validation)
- File system operations (temporary files)

## Cross-Platform Considerations

### Linux/Unix
- Full test suite execution
- Tmux session detection included
- Signal-based termination testing
- Process ownership validation

### macOS
- Same as Linux/Unix
- Additional BSD-specific considerations
- Homebrew tmux installation support

### Windows
- Windows-specific process detection
- PowerShell integration testing
- Taskkill termination methods
- WSL compatibility notes

### WSL (Windows Subsystem for Linux)
- Hybrid environment testing
- Both Unix and Windows process access
- Cross-platform detection verification

## Integration with AI Workflow Uninstaller

### Phase Integration
- Follows established test patterns from Phases 1-4
- Compatible with existing test runners
- Maintains backward compatibility

### CI/CD Integration
- Exit codes: 0 = success, 1 = failure
- JSON-compatible output available
- Performance metrics for monitoring
- Platform-specific test filtering

### Development Workflow
- Run tests after process.js modifications
- Use dry-run mode for development testing
- Mock data allows safe testing
- Performance benchmarks catch regressions

## Extending Tests

### Adding New Tests
1. Add test function to ProcessTester class
2. Add to tests array in runTests()
3. Follow arrange-act-assert pattern
4. Use appropriate mocking strategy

### Mock Data Updates
1. Update setupTestEnvironment() method
2. Maintain cross-platform compatibility
3. Include edge cases and error scenarios
4. Document mock data structure

### Performance Testing
1. Add benchmarks to testPerformanceBenchmarks()
2. Set appropriate thresholds
3. Include in summary reporting
4. Monitor for regressions

## Troubleshooting

### Common Issues
1. **Permission errors**: Ensure test files are executable
2. **Platform mismatches**: Check platform-specific test skipping
3. **Mock data issues**: Verify test environment setup
4. **Performance failures**: Check system load and thresholds

### Debug Strategies
1. Enable DEBUG_TESTS environment variable
2. Check individual test outputs
3. Verify mock data integrity
4. Test on different platforms

### Known Limitations
1. Real tmux sessions not tested (by design)
2. Actual process termination not tested (safety)
3. Some platform-specific features require real systems
4. Performance thresholds may vary by hardware

## Maintenance

### Regular Updates
- Update mock data for new workflow patterns
- Adjust performance thresholds as needed
- Add tests for new process.js features
- Maintain cross-platform compatibility

### Version Compatibility
- Test with different Node.js versions
- Verify tmux version compatibility
- Check PowerShell version requirements
- Update system process whitelists

This comprehensive test suite ensures the reliability and safety of the Phase 5 Process Management implementation across all supported platforms.