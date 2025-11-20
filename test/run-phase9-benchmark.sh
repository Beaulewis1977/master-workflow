#!/bin/bash

# Phase 9 Performance Benchmark Runner
# Quick script to run the comprehensive Phase 9 benchmark suite

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Phase 9 Performance Benchmark Suite Runner                   ║"
echo "║  Master Workflow 3.0 - Multi-Node Scaling & Analytics         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required (found: v$NODE_VERSION)"
    echo "   Please upgrade Node.js to v18 or higher"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check available memory
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
echo "💾 Available memory: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "⚠️  Warning: Less than 2GB RAM available. Some tests may fail."
    echo "   Recommended: 4GB+ RAM for full benchmark suite"
    echo ""
fi

# Check disk space
DISK_SPACE=$(df -h . | awk 'NR==2{print $4}')
echo "💿 Available disk space: ${DISK_SPACE}"
echo ""

# Parse arguments
QUICK_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            QUICK_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --quick     Run quick benchmark (reduced iterations)"
            echo "  --verbose   Show detailed output"
            echo "  --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                  # Run full benchmark"
            echo "  $0 --quick          # Run quick benchmark"
            echo "  $0 --verbose        # Run with detailed output"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Set environment variables
if [ "$QUICK_MODE" = true ]; then
    echo "🚀 Running in QUICK mode (reduced iterations)"
    export BENCHMARK_ITERATIONS=3
    export MAX_AGENTS_TEST=500
    echo ""
fi

# Run the benchmark
echo "▶️  Starting benchmark suite..."
echo "   Expected duration: $([ "$QUICK_MODE" = true ] && echo "5-10 minutes" || echo "15-20 minutes")"
echo "   Press Ctrl+C to cancel"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Record start time
START_TIME=$(date +%s)

# Run benchmark with appropriate memory settings
if [ "$VERBOSE" = true ]; then
    node --max-old-space-size=4096 test/phase9-performance-benchmark.js
else
    node --max-old-space-size=4096 test/phase9-performance-benchmark.js 2>&1
fi

EXIT_CODE=$?

# Record end time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏱️  Total execution time: ${MINUTES}m ${SECONDS}s"

# Find latest result files
LATEST_JSON=$(ls -t test/phase9-benchmark-*.json 2>/dev/null | head -1)
LATEST_CSV=$(ls -t test/phase9-benchmark-*.csv 2>/dev/null | head -1)

if [ -n "$LATEST_JSON" ]; then
    echo "📄 Results: $LATEST_JSON"

    # Extract key metrics
    SUCCESS_RATE=$(grep -o '"successRate":[0-9.]*' "$LATEST_JSON" | cut -d':' -f2)
    if [ -n "$SUCCESS_RATE" ]; then
        echo "📊 Success Rate: ${SUCCESS_RATE}%"
    fi
fi

if [ -n "$LATEST_CSV" ]; then
    echo "📊 CSV Summary: $LATEST_CSV"
fi

echo ""

# Exit with benchmark exit code
if [ $EXIT_CODE -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║               🎉 BENCHMARK COMPLETED SUCCESSFULLY 🎉           ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
else
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                  ⚠️  BENCHMARK COMPLETED WITH WARNINGS         ║"
    echo "║                  Review results above for details              ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
fi

echo ""

exit $EXIT_CODE
