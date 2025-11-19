#!/bin/bash

# Enhanced MCP Testing and Validation System Runner
# Executes comprehensive testing for enhanced MCP server integrations

set -e  # Exit on any error

echo "🧪 Enhanced MCP Testing and Validation System"
echo "=============================================="
echo ""

# Check Node.js availability
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Set up environment
export NODE_ENV=test
export MCP_TEST_MODE=true

# Create test results directory if it doesn't exist
mkdir -p test-results

# Run the comprehensive test orchestrator
echo "🚀 Starting Enhanced MCP Test Suite..."
echo ""

# Execute the test orchestrator
if node test/enhanced-mcp-test-orchestrator.js; then
    echo ""
    echo "🎉 Testing completed successfully!"
    echo "📊 Check test-results/ directory for detailed reports"
    
    # Move generated reports to test-results directory
    if [ -f "test/ENHANCED-MCP-COMPREHENSIVE-TEST-REPORT.json" ]; then
        mv test/ENHANCED-MCP-COMPREHENSIVE-TEST-REPORT.json test-results/
    fi
    
    if [ -f "test/ENHANCED-MCP-TEST-SUMMARY.md" ]; then
        mv test/ENHANCED-MCP-TEST-SUMMARY.md test-results/
    fi
    
    # Move individual test reports
    mv test/*-TEST-REPORT.json test-results/ 2>/dev/null || true
    
    echo "📄 All reports moved to test-results/ directory"
    echo ""
    echo "🏭 System is ready for production deployment!"
    exit 0
else
    echo ""
    echo "❌ Testing failed - system is not production ready"
    echo "📊 Check individual test reports for details"
    exit 1
fi