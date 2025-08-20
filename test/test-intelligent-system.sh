#!/bin/bash

# Test Suite for Intelligent Workflow Decision System
# Tests complexity analysis, approach selection, and user interaction

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INTELLIGENCE_ENGINE_DIR="$(dirname "$SCRIPT_DIR")/intelligence-engine"
TEST_PROJECTS_DIR="$SCRIPT_DIR/test-projects"
TEST_RESULTS_DIR="$SCRIPT_DIR/results"
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test header
print_test_header() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════${NC}\n"
}

# Function to print test result
print_test_result() {
    local test_name="$1"
    local result="$2"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        ((TESTS_FAILED++))
    fi
}

# Function to create test project
create_test_project() {
    local project_type="$1"
    local project_dir="$TEST_PROJECTS_DIR/$project_type"
    
    rm -rf "$project_dir"
    mkdir -p "$project_dir"
    
    case "$project_type" in
        idea)
            # Create documentation-only project
            cat > "$project_dir/README.md" << EOF
# Project Idea

This project will be a REST API with the following features:
- User authentication with JWT
- MongoDB database
- Real-time notifications
- Docker deployment
EOF
            cat > "$project_dir/requirements.md" << EOF
## Technical Requirements
- Node.js with Express
- React frontend
- PostgreSQL database
- Redis caching
- Kubernetes deployment
EOF
            ;;
            
        simple)
            # Create simple project
            cat > "$project_dir/package.json" << EOF
{
  "name": "simple-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF
            mkdir -p "$project_dir/src"
            echo "console.log('Hello');" > "$project_dir/src/index.js"
            ;;
            
        medium)
            # Create medium complexity project
            cat > "$project_dir/package.json" << EOF
{
  "name": "medium-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^6.0.0",
    "jsonwebtoken": "^8.5.1",
    "bcrypt": "^5.0.1"
  },
  "devDependencies": {
    "jest": "^27.0.0",
    "nodemon": "^2.0.0"
  }
}
EOF
            mkdir -p "$project_dir/src/controllers"
            mkdir -p "$project_dir/src/models"
            mkdir -p "$project_dir/src/routes"
            mkdir -p "$project_dir/tests"
            
            # Add some files
            echo "// User controller" > "$project_dir/src/controllers/userController.js"
            echo "// User model" > "$project_dir/src/models/User.js"
            echo "// API routes" > "$project_dir/src/routes/api.js"
            echo "// User tests" > "$project_dir/tests/user.test.js"
            ;;
            
        complex)
            # Create complex project
            cat > "$project_dir/package.json" << EOF
{
  "name": "complex-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "react": "^18.2.0",
    "mongoose": "^6.0.0",
    "redis": "^4.0.0",
    "socket.io": "^4.0.0",
    "jsonwebtoken": "^8.5.1",
    "passport": "^0.6.0"
  },
  "devDependencies": {
    "jest": "^27.0.0",
    "cypress": "^10.0.0",
    "webpack": "^5.0.0"
  }
}
EOF
            # Create complex directory structure
            mkdir -p "$project_dir/src/frontend/components"
            mkdir -p "$project_dir/src/backend/controllers"
            mkdir -p "$project_dir/src/backend/models"
            mkdir -p "$project_dir/src/backend/services"
            mkdir -p "$project_dir/src/shared/utils"
            mkdir -p "$project_dir/tests/unit"
            mkdir -p "$project_dir/tests/integration"
            mkdir -p "$project_dir/tests/e2e"
            mkdir -p "$project_dir/k8s"
            mkdir -p "$project_dir/.github/workflows"
            
            # Add deployment files
            echo "FROM node:18" > "$project_dir/Dockerfile"
            echo "version: '3'" > "$project_dir/docker-compose.yml"
            echo "apiVersion: apps/v1" > "$project_dir/k8s/deployment.yaml"
            echo "name: CI/CD" > "$project_dir/.github/workflows/ci.yml"
            
            # Add many files
            for i in {1..50}; do
                echo "// Component $i" > "$project_dir/src/frontend/components/Component$i.jsx"
            done
            ;;
    esac
}

# Test 1: Complexity Analysis
test_complexity_analysis() {
    print_test_header "Test 1: Complexity Analysis"
    
    # Test idea stage project
    create_test_project "idea"
    local analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/idea" 2>/dev/null | jq -r '.stage')
    if [ "$analysis" = "idea" ]; then
        print_test_result "Idea stage detection" "PASS"
    else
        print_test_result "Idea stage detection (got: $analysis)" "FAIL"
    fi
    
    # Test simple project
    create_test_project "simple"
    local score=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/simple" 2>/dev/null | jq -r '.score')
    if [ "$score" -lt 30 ]; then
        print_test_result "Simple project score (score: $score)" "PASS"
    else
        print_test_result "Simple project score (score: $score, expected < 30)" "FAIL"
    fi
    
    # Test medium project
    create_test_project "medium"
    local score=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/medium" 2>/dev/null | jq -r '.score')
    if [ "$score" -ge 10 ] && [ "$score" -le 40 ]; then # Adjusted for new weights
        print_test_result "Medium project score (score: $score)" "PASS"
    else
        print_test_result "Medium project score (score: $score, expected 10-40)" "FAIL"
    fi
    
    # Test complex project
    create_test_project "complex"
    local score=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/complex" 2>/dev/null | jq -r '.score')
    if [ "$score" -gt 30 ]; then # Adjusted for new weights
        print_test_result "Complex project score (score: $score)" "PASS"
    else
        print_test_result "Complex project score (score: $score, expected > 30)" "FAIL"
    fi
}

# Test 2: Approach Selection
test_approach_selection() {
    print_test_header "Test 2: Approach Selection"
    
    # Test simple project approach
    create_test_project "simple"
    local analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/simple" 2>/dev/null)
    echo "$analysis" > /tmp/test_analysis.json
    local approach=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" /tmp/test_analysis.json 2>/dev/null | jq -r '.selected')
    
    if [ "$approach" = "simpleSwarm" ]; then
        print_test_result "Simple project → Simple Swarm" "PASS"
    else
        print_test_result "Simple project approach (got: $approach)" "FAIL"
    fi
    
    # Test medium project approach
    create_test_project "medium"
    analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/medium" 2>/dev/null)
    echo "$analysis" > /tmp/test_analysis.json
    approach=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" /tmp/test_analysis.json 2>/dev/null | jq -r '.selected')
    
    if [ "$approach" = "hiveMind" ]; then
        print_test_result "Medium project → Hive-Mind" "PASS"
    else
        print_test_result "Medium project approach (got: $approach)" "FAIL"
    fi
    
    # Test complex project approach
    create_test_project "complex"
    analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/complex" 2>/dev/null)
    echo "$analysis" > /tmp/test_analysis.json
    approach=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" /tmp/test_analysis.json 2>/dev/null | jq -r '.selected')
    
    if [ "$approach" = "hiveMindSparc" ]; then
        print_test_result "Complex project → Hive-Mind + SPARC" "PASS"
    else
        print_test_result "Complex project approach (got: $approach)" "FAIL"
    fi
}

# Test 3: User Choice Override
test_user_choice_override() {
    print_test_header "Test 3: User Choice Override"
    
    # Test forcing Simple Swarm on complex project
    create_test_project "complex"
    local analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/complex" 2>/dev/null)
    echo "$analysis" > /tmp/test_analysis.json
    local result=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" /tmp/test_analysis.json "simple-swarm" 2>/dev/null)
    
    local selected=$(echo "$result" | jq -r '.selected')
    local mismatch=$(echo "$result" | jq -r '.mismatch')
    
    if [ "$selected" = "simpleSwarm" ] && [ "$mismatch" = "true" ]; then
        print_test_result "User override with mismatch warning" "PASS"
    else
        print_test_result "User override detection" "FAIL"
    fi
    
    # Test forcing SPARC on simple project
    create_test_project "simple"
    analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/simple" 2>/dev/null)
    echo "$analysis" > /tmp/test_analysis.json
    result=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" /tmp/test_analysis.json "hive-mind-sparc" 2>/dev/null)
    
    selected=$(echo "$result" | jq -r '.selected')
    mismatch=$(echo "$result" | jq -r '.mismatch')
    
    if [ "$selected" = "hiveMindSparc" ] && [ "$mismatch" = "true" ]; then
        print_test_result "SPARC override on simple project" "PASS"
    else
        print_test_result "SPARC override detection" "FAIL"
    fi
}

# Test 4: Stage Detection
test_stage_detection() {
    print_test_header "Test 4: Project Stage Detection"
    
    # Test each stage
    local stages=("idea" "simple" "medium" "complex")
    local expected_stages=("idea" "early" "active" "mature")
    
    for i in ${!stages[@]}; do
        create_test_project "${stages[$i]}"
        local detected_stage=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/${stages[$i]}" 2>/dev/null | jq -r '.stage')
        
        # Simple and medium might be detected as early/active
        if [ "$i" -eq 0 ] && [ "$detected_stage" = "idea" ]; then
            print_test_result "Stage: ${stages[$i]} → $detected_stage" "PASS"
        elif [ "$i" -eq 1 ] && ([ "$detected_stage" = "early" ] || [ "$detected_stage" = "active" ]); then
            print_test_result "Stage: ${stages[$i]} → $detected_stage" "PASS"
        elif [ "$i" -eq 2 ] && [ "$detected_stage" = "active" ]; then
            print_test_result "Stage: ${stages[$i]} → $detected_stage" "PASS"
        elif [ "$i" -eq 3 ] && ([ "$detected_stage" = "mature" ] || [ "$detected_stage" = "active" ]); then
            print_test_result "Stage: ${stages[$i]} → $detected_stage" "PASS"
        else
            print_test_result "Stage: ${stages[$i]} (got: $detected_stage)" "FAIL"
        fi
    done
}

# Test 5: Command Generation
test_command_generation() {
    print_test_header "Test 5: Command Generation"
    
    # Test Simple Swarm command
    create_test_project "simple"
    local analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/simple" 2>/dev/null)
    echo "$analysis" > /tmp/test_analysis.json
    local command=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" /tmp/test_analysis.json 2>/dev/null | jq -r '.command')
    
    if [[ "$command" == *"npx claude-flow@alpha swarm"* ]]; then
        print_test_result "Simple Swarm command generation" "PASS"
    else
        print_test_result "Simple Swarm command (got: $command)" "FAIL"
    fi
    
    # Test Hive-Mind command
    create_test_project "medium"
    analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/medium" 2>/dev/null)
    echo "$analysis" > /tmp/test_analysis.json
    command=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" /tmp/test_analysis.json 2>/dev/null | jq -r '.command')
    
    if [[ "$command" == *"npx claude-flow@alpha hive-mind spawn"* ]] && [[ "$command" == *"--agents"* ]]; then
        print_test_result "Hive-Mind command generation" "PASS"
    else
        print_test_result "Hive-Mind command (got: $command)" "FAIL"
    fi
    
    # Test SPARC command
    create_test_project "complex"
    analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$TEST_PROJECTS_DIR/complex" 2>/dev/null)
    echo "$analysis" > /tmp/test_analysis.json
    command=$(node "$INTELLIGENCE_ENGINE_DIR/approach-selector.js" /tmp/test_analysis.json 2>/dev/null | jq -r '.command')
    
    if [[ "$command" == *"npx claude-flow@alpha hive-mind spawn"* ]] && [[ "$command" == *"--agents"* ]]; then
        print_test_result "SPARC command generation" "PASS"
    else
        print_test_result "SPARC command (got: $command)" "FAIL"
    fi
}

# Test 6: Feature Detection
test_feature_detection() {
    print_test_header "Test 6: Feature Detection"
    
    # Create project with specific features
    local project_dir="$TEST_PROJECTS_DIR/features"
    rm -rf "$project_dir"
    mkdir -p "$project_dir/src"
    
    cat > "$project_dir/package.json" << EOF
{
  "name": "feature-test",
  "dependencies": {
    "jsonwebtoken": "^8.5.1",
    "socket.io": "^4.0.0",
    "mongoose": "^6.0.0"
  }
}
EOF
    
    echo "// JWT authentication" > "$project_dir/src/auth.js"
    echo "// WebSocket handler" > "$project_dir/src/websocket.js"
    echo "// API endpoints" > "$project_dir/src/api.js"
    echo "FROM node:18" > "$project_dir/Dockerfile"
    mkdir -p "$project_dir/.github/workflows"
    echo "name: CI" > "$project_dir/.github/workflows/ci.yml"
    
    local analysis=$(node "$INTELLIGENCE_ENGINE_DIR/complexity-analyzer.js" "$project_dir" 2>/dev/null)
    local features=$(echo "$analysis" | jq -r '.factors.features.detected')
    
    local auth=$(echo "$features" | jq -r '.authentication')
    local realtime=$(echo "$features" | jq -r '.realtime')
    local docker=$(echo "$features" | jq -r '.docker')
    local cicd=$(echo "$features" | jq -r '.ci_cd')
    
    local all_detected=true
    
    if [ "$auth" = "true" ]; then
        print_test_result "Authentication detection" "PASS"
    else
        print_test_result "Authentication detection" "FAIL"
        all_detected=false
    fi
    
    if [ "$realtime" = "true" ]; then
        print_test_result "Real-time detection" "PASS"
    else
        print_test_result "Real-time detection" "FAIL"
        all_detected=false
    fi
    
    if [ "$docker" = "true" ]; then
        print_test_result "Docker detection" "PASS"
    else
        print_test_result "Docker detection" "FAIL"
        all_detected=false
    fi
    
    if [ "$cicd" = "true" ]; then
        print_test_result "CI/CD detection" "PASS"
    else
        print_test_result "CI/CD detection" "FAIL"
        all_detected=false
    fi
}

# Main test execution
main() {
    echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${MAGENTA}║     Intelligent Workflow Decision System Tests      ║${NC}"
    echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════╝${NC}"
    
    # Check dependencies
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed${NC}"
        exit 1
    fi
    
    # Check if intelligence engine exists
    if [ ! -d "$INTELLIGENCE_ENGINE_DIR" ]; then
        echo -e "${RED}❌ Intelligence engine not found at $INTELLIGENCE_ENGINE_DIR${NC}"
        exit 1
    fi
    
    # Create test directories
    mkdir -p "$TEST_PROJECTS_DIR"
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Run tests
    test_complexity_analysis
    test_approach_selection
    test_user_choice_override
    test_stage_detection
    test_command_generation
    test_feature_detection
    
    # Print summary
    echo -e "\n${BOLD}${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}Test Summary:${NC}"
    echo -e "${GREEN}  Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}  Failed: $TESTS_FAILED${NC}"
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "\n${BOLD}${GREEN}✅ All tests passed!${NC}"
        
        # Save test results
        cat > "$TEST_RESULTS_DIR/test-results.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "passed": $TESTS_PASSED,
  "failed": $TESTS_FAILED,
  "status": "SUCCESS"
}
EOF
        exit 0
    else
        echo -e "\n${BOLD}${RED}❌ Some tests failed${NC}"
        
        # Save test results
        cat > "$TEST_RESULTS_DIR/test-results.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "passed": $TESTS_PASSED,
  "failed": $TESTS_FAILED,
  "status": "FAILURE"
}
EOF
        exit 1
    fi
}

# Clean up function
cleanup() {
    rm -f /tmp/test_analysis.json
}

# Set up trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"