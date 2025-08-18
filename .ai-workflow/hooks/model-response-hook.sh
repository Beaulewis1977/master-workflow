#!/bin/bash
# Logs model responses

RESPONSE="$1"
LOG_FILE="$(dirname "$0")/../logs/responses.log"

mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Response: ${RESPONSE:0:200}..." >> "$LOG_FILE"
# Broadcast to agent bus as JSONL (truncated excerpt)
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"
EXCERPT=$(echo "$RESPONSE" | head -c 500 | sed 's/"/\\"/g')
AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-response-hook}"
if [ "${AI_BUS_ENABLED:-true}" = "true" ]; then
BUS_FILE="$(dirname "$0")/../logs/agent-bus.jsonl"
TS="$(date -Iseconds)"; AGN="${CLAUDE_AGENT_NAME:-unknown}"; ROL="${CLAUDE_ROLE:-response-hook}"
echo "{\"ts\":\"$TS\",\"type\":\"response\",\"agent\":\"$AGN\",\"role\":\"$ROL\",\"excerpt\":\"$EXCERPT\"}" >> "$BUS_FILE"
fi
