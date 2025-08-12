#!/bin/bash

# Schedule Check-in Script
# Allows agents to schedule their own check-ins for autonomous operation

SCHEDULE_FILE="$(pwd)/.tmux-orchestrator/schedules/checkins.txt"
SESSION_NAME="${TMUX_SESSION:-workflow}"
AGENT_NAME="${1:-agent}"
CHECK_IN_TIME="${2:-30}"  # Minutes
MESSAGE="${3:-Status check}"

mkdir -p "$(dirname "$SCHEDULE_FILE")"

# Add schedule entry
echo "$(date -Iseconds) | $AGENT_NAME | $CHECK_IN_TIME | $MESSAGE" >> "$SCHEDULE_FILE"

# Create scheduled check-in
if command -v at >/dev/null 2>&1; then
  at_time=$(date -d "+${CHECK_IN_TIME} minutes" +"%H:%M" 2>/dev/null || date -v+${CHECK_IN_TIME}M +"%H:%M" 2>/dev/null)
  echo "tmux send-keys -t ${SESSION_NAME}:orchestrator '/agents status' C-m" | at "$at_time" 2>/dev/null || true
  echo "✅ Check-in scheduled for $AGENT_NAME in $CHECK_IN_TIME minutes (via at)"
else
  # Fallback: append to schedule file; external supervisor can poll and trigger
  echo "⚠ 'at' not available. Added to schedule file only. A supervisor should process it."
fi