#!/bin/bash
# Monitors tool usage

TOOL="$1"
ARGS="$2"
LOG_FILE="$(dirname "$0")/../logs/tools.log"

mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Tool: $TOOL, Args: $ARGS" >> "$LOG_FILE"
# Broadcast to agent bus as JSONL
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"
AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-tool-hook}"
if [ "${AI_BUS_ENABLED:-true}" = "true" ]; then
TS="$(date -Iseconds)"; AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-tool-hook}"
echo "{\"ts\":\"$TS\",\"type\":\"tool\",\"agent\":\"$AGN\",\"role\":\"$ROL\",\"tool\":\"$TOOL\",\"args\":\"$ARGS\"}" >> "$BUS_FILE"
fi
