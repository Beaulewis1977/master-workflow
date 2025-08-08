#!/bin/bash

# Send Message to Agent in TMux Window
# Enables inter-agent communication

SESSION_NAME="${1:-workflow}"
WINDOW_NAME="${2:-orchestrator}"
MESSAGE="${3:-Hello Agent}"

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "❌ Session $SESSION_NAME does not exist"
    exit 1
fi

# Send message to window
tmux send-keys -t "${SESSION_NAME}:${WINDOW_NAME}" "$MESSAGE" C-m

echo "✅ Message sent to ${WINDOW_NAME} in ${SESSION_NAME}"

# Log the message
LOG_FILE="$(pwd)/.ai-workflow/logs/messages.log"
echo "[$(date -Iseconds)] ${WINDOW_NAME}: ${MESSAGE}" >> "$LOG_FILE"