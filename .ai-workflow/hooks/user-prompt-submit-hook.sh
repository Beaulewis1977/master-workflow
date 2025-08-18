#!/bin/bash
# Intercepts prompts to trigger workflow automation

PROMPT="$1"
LOG_FILE="$(dirname "$0")/../logs/hooks.log"

mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Prompt: $PROMPT" >> "$LOG_FILE"
# Broadcast to agent bus as JSONL
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"
ESC_PROMPT=$(echo "$PROMPT" | head -c 1000 | sed 's/"/\\"/g')
AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-prompt-hook}"
if [ "${AI_BUS_ENABLED:-true}" = "true" ]; then
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"; AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-prompt-hook}"
echo "{\"ts\":\"$TS\",\"type\":\"prompt\",\"agent\":\"$AGN\",\"role\":\"$ROL\",\"prompt\":\"$ESC_PROMPT\"}" >> "$BUS_FILE"
fi

# Trigger workflows based on keywords
if [[ "$PROMPT" == *"complete"* ]] || [[ "$PROMPT" == *"finish"* ]] || [[ "$PROMPT" == *"fix"* ]]; then
    echo "🚀 Triggering completion workflow..."
    WORKFLOW_DIR="$(dirname "$0")/.."
    node "$WORKFLOW_DIR/workflow-runner.js" --mode recovery --async &
fi

if [[ "$PROMPT" == *"analyze"* ]]; then
    echo "🔍 Triggering analysis..."
    WORKFLOW_DIR="$(dirname "$0")/.."
    node "$WORKFLOW_DIR/intelligence-engine/complexity-analyzer.js" &
fi
