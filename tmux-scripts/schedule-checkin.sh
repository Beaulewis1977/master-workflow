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

# Create at job for check-in
at_time=$(date -d "+${CHECK_IN_TIME} minutes" +"%H:%M")
echo "tmux send-keys -t ${SESSION_NAME}:orchestrator '/agents status' C-m" | at "$at_time" 2>/dev/null

echo "✅ Check-in scheduled for $AGENT_NAME in $CHECK_IN_TIME minutes"