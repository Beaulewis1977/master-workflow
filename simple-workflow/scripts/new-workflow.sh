#!/bin/bash

# Create a new workflow from template
# Simple Workflow System

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
WORKFLOWS_DIR="${BASE_DIR}/workflows"
TEMPLATES_DIR="${BASE_DIR}/templates"

# Colors
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <workflow-name> [template]"
    echo "Example: $0 my-feature basic"
    exit 1
fi

WORKFLOW_NAME="$1"
TEMPLATE="${2:-basic}"
WORKFLOW_FILE="$WORKFLOWS_DIR/${WORKFLOW_NAME}.json"

# Check if workflow already exists
if [ -f "$WORKFLOW_FILE" ]; then
    echo -e "${YELLOW}Workflow already exists: $WORKFLOW_FILE${NC}"
    echo "Overwrite? (y/n)"
    read -n 1 -r response
    echo
    if [[ ! $response =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create workflow from template
echo -e "${CYAN}Creating new workflow: ${BOLD}$WORKFLOW_NAME${NC}"

cat > "$WORKFLOW_FILE" << EOF
{
  "workflow": "$WORKFLOW_NAME",
  "version": "1.0",
  "description": "Description of $WORKFLOW_NAME workflow",
  "author": "$(whoami)",
  "created": "$(date -I)",
  
  "variables": {
    "example_var": "example_value"
  },
  
  "steps": [
    {
      "id": "step1",
      "name": "First Step",
      "type": "claude",
      "prompt": "Describe what this step should do",
      "options": {
        "timeout": 60
      }
    },
    {
      "id": "step2",
      "name": "Second Step",
      "type": "agent-os",
      "command": "create-spec",
      "prompt": "Create specification for {{example_var}}",
      "output": "specs/output.md"
    },
    {
      "id": "step3",
      "name": "Implementation",
      "type": "claude-flow",
      "mode": "swarm",
      "prompt": "Implement based on specifications"
    },
    {
      "id": "step4",
      "name": "Testing",
      "type": "sub-agent",
      "agent": "test-engineer",
      "prompt": "Create tests for the implementation"
    }
  ],
  
  "on_success": "✅ Workflow $WORKFLOW_NAME completed successfully!",
  "on_failure": "❌ Workflow $WORKFLOW_NAME failed. Check logs for details."
}
EOF

echo -e "${GREEN}✅ Workflow created: $WORKFLOW_FILE${NC}"
echo
echo -e "${CYAN}Next steps:${NC}"
echo "1. Edit the workflow: nano $WORKFLOW_FILE"
echo "2. Test the workflow: ./scripts/run-workflow.sh $WORKFLOW_FILE --dry-run"
echo "3. Run the workflow: ./scripts/run-workflow.sh $WORKFLOW_FILE"