#!/bin/bash

# List all available workflows
# Simple Workflow System

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
WORKFLOWS_DIR="${BASE_DIR}/workflows"

# Colors
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}Available Workflows:${NC}\n"

for workflow in "$WORKFLOWS_DIR"/*.json; do
    if [ -f "$workflow" ]; then
        name=$(basename "$workflow" .json)
        desc=$(jq -r '.description // "No description"' "$workflow" 2>/dev/null || echo "Invalid JSON")
        version=$(jq -r '.version // "1.0"' "$workflow" 2>/dev/null)
        author=$(jq -r '.author // "Unknown"' "$workflow" 2>/dev/null)
        
        echo -e "${BOLD}${GREEN}$name${NC} (v$version)"
        echo -e "  ${CYAN}Description:${NC} $desc"
        echo -e "  ${CYAN}Author:${NC} $author"
        echo -e "  ${CYAN}Path:${NC} $workflow"
        echo
    fi
done

echo -e "${YELLOW}Run a workflow with:${NC}"
echo -e "  ./scripts/run-workflow.sh workflows/<name>.json"