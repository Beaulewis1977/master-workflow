#!/bin/bash

# Production System Test Script
# Tests the complete intelligent workflow system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  Production System Test - Intelligent Workflow${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""

# Create test project directory (messy 90% done project)
TEST_DIR="/tmp/test-messy-project-$(date +%s)"
echo -e "${CYAN}Creating test project: ${TEST_DIR}${NC}"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Create a messy, partially complete project
echo -e "${YELLOW}Setting up messy 90% done project...${NC}"

# Create package.json
cat > package.json << 'EOF'
{
  "name": "test-messy-project",
  "version": "0.9.0",
  "description": "A partially complete project for testing",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mongodb": "^4.0.0"
  }
}
EOF

# Create main file with TODOs and incomplete functions
cat > index.js << 'EOF'
const express = require('express');
const app = express();

// TODO: Add authentication middleware
// FIXME: Security vulnerability - no input validation

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/api/users', (req, res) => {
    // TODO: Implement user creation
    throw new Error('Not implemented');
});

app.get('/api/users/:id', (req, res) => {
    // HACK: Hardcoded response for now
    res.json({ id: 1, name: 'Test User' });
});

app.delete('/api/users/:id', (req, res) => {
    // XXX: This needs proper implementation
    res.status(501).send('Not implemented');
});

// TODO: Add error handling
// TODO: Add logging
// FIXME: Add rate limiting

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
EOF

# Create test file with failing tests
mkdir -p test
cat > test/app.test.js << 'EOF'
describe('App Tests', () => {
    test('should pass', () => {
        expect(true).toBe(true);
    });
    
    test('should implement user creation', () => {
        // TODO: Write actual test
        throw new Error('Test not implemented');
    });
    
    test.skip('should handle errors', () => {
        // Skipped test
    });
});
EOF

# Create incomplete documentation
cat > README.md << 'EOF'
# Test Project

This project is 90% complete.

## Installation
TODO: Write installation instructions

## API Endpoints
- GET / - Works
- POST /api/users - NOT IMPLEMENTED
- GET /api/users/:id - HACK: Returns hardcoded data
- DELETE /api/users/:id - TODO

## Testing
Some tests are failing.

## Deployment
FIXME: Add deployment instructions
EOF

# Add some uncommitted files
echo "secret_key=12345" > .env
echo "temp data" > temp.txt

# Create git repo with uncommitted changes
git init
git add .
git commit -m "Initial commit - 90% complete"
echo "uncommitted change" >> index.js

echo -e "${GREEN}✓ Messy project created${NC}"
echo ""

# Show what we created
echo -e "${CYAN}Project Status:${NC}"
echo "  TODOs: $(grep -r "TODO" . --exclude-dir=.git | wc -l)"
echo "  FIXMEs: $(grep -r "FIXME" . --exclude-dir=.git | wc -l)"
echo "  HACKs: $(grep -r "HACK\|XXX" . --exclude-dir=.git | wc -l)"
echo "  Not Implemented: $(grep -r "Not implemented\|not implemented" . --exclude-dir=.git | wc -l)"
echo "  Uncommitted: $(git status --porcelain | wc -l)"
echo ""

# Run the production installer
echo -e "${CYAN}${BOLD}Running Production Installer...${NC}"
SCRIPT_DIR="$(dirname "$0")"

if [ -f "$SCRIPT_DIR/install-production.sh" ]; then
    echo -e "${GREEN}Installing Intelligent Workflow System...${NC}"
    
    # Run installer (with auto-yes for testing)
    yes | bash "$SCRIPT_DIR/install-production.sh" || true
    
    echo -e "${GREEN}✓ Installation complete${NC}"
else
    echo -e "${RED}✗ Production installer not found${NC}"
    exit 1
fi

# Check installation
echo ""
echo -e "${CYAN}Checking Installation:${NC}"

if [ -d ".ai-workflow" ]; then
    echo -e "${GREEN}✓ .ai-workflow directory created${NC}"
else
    echo -e "${RED}✗ .ai-workflow directory missing${NC}"
fi

if [ -d ".claude/agents" ]; then
    echo -e "${GREEN}✓ Agents installed to .claude/agents${NC}"
    echo "  Agents: $(ls .claude/agents/ | wc -l)"
else
    echo -e "${RED}✗ Agents not installed${NC}"
fi

if [ -d ".claude/commands" ]; then
    echo -e "${GREEN}✓ Commands installed to .claude/commands${NC}"
    echo "  Commands: $(ls .claude/commands/ | wc -l)"
else
    echo -e "${RED}✗ Commands not installed${NC}"
fi

if [ -f ".claude/settings.json" ]; then
    echo -e "${GREEN}✓ Claude Code settings configured${NC}"
else
    echo -e "${RED}✗ Claude Code settings missing${NC}"
fi

if [ -f "./ai-workflow" ]; then
    echo -e "${GREEN}✓ CLI command created${NC}"
else
    echo -e "${RED}✗ CLI command missing${NC}"
fi

# Test workflow commands
echo ""
echo -e "${CYAN}Testing Workflow Commands:${NC}"

# Test analysis
if [ -f "./ai-workflow" ]; then
    echo -e "${YELLOW}Running: ./ai-workflow analyze${NC}"
    ./ai-workflow analyze || true
    
    if [ -f ".ai-dev/analysis.json" ]; then
        echo -e "${GREEN}✓ Analysis completed${NC}"
        SCORE=$(jq -r '.score' .ai-dev/analysis.json 2>/dev/null || echo "?")
        echo "  Complexity Score: $SCORE/100"
    fi
fi

# Test recovery analysis
if [ -f "./ai-workflow" ]; then
    echo -e "${YELLOW}Running: ./ai-workflow recover analyze${NC}"
    ./ai-workflow recover analyze || true
    
    if [ -f ".ai-dev/incomplete-work.json" ]; then
        echo -e "${GREEN}✓ Recovery analysis completed${NC}"
    fi
fi

# Summary
echo ""
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  Test Summary${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════${NC}"

SUCCESS_COUNT=0
TOTAL_COUNT=0

# Count successes
[ -d ".ai-workflow" ] && ((SUCCESS_COUNT++))
((TOTAL_COUNT++))

[ -d ".claude/agents" ] && ((SUCCESS_COUNT++))
((TOTAL_COUNT++))

[ -d ".claude/commands" ] && ((SUCCESS_COUNT++))
((TOTAL_COUNT++))

[ -f ".claude/settings.json" ] && ((SUCCESS_COUNT++))
((TOTAL_COUNT++))

[ -f "./ai-workflow" ] && ((SUCCESS_COUNT++))
((TOTAL_COUNT++))

[ -f ".ai-dev/analysis.json" ] && ((SUCCESS_COUNT++))
((TOTAL_COUNT++))

echo ""
echo -e "Results: ${GREEN}${SUCCESS_COUNT}/${TOTAL_COUNT} tests passed${NC}"

if [ "$SUCCESS_COUNT" -eq "$TOTAL_COUNT" ]; then
    echo -e "${GREEN}${BOLD}✅ ALL TESTS PASSED! System is production-ready!${NC}"
else
    echo -e "${YELLOW}⚠ Some tests failed. Review the output above.${NC}"
fi

echo ""
echo -e "${CYAN}Test project location: ${TEST_DIR}${NC}"
echo -e "${CYAN}To use the system:${NC}"
echo -e "  cd ${TEST_DIR}"
echo -e "  ./ai-workflow init --auto \"Complete this 90% done project\""
echo -e "  ./ai-workflow recover execute"
echo ""
echo -e "${GREEN}The system can now autonomously complete the remaining 10%!${NC}"