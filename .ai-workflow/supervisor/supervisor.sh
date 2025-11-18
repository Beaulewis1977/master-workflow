#!/bin/bash
set -e
INSTALL_DIR="$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"
ANALYSIS_FILE="$PROJECT_DIR/.ai-dev/analysis.json"
APPROACH_JSON="$INSTALL_DIR/configs/approach.json"
LOG_FILE="$INSTALL_DIR/logs/supervisor.log"
INTERVAL=${1:-1800} # seconds

log() { echo "[$(date -Iseconds)] $1" | tee -a "$LOG_FILE"; }

# Optional filesystem event watcher (Linux) using inotifywait
start_inotify_watcher() {
  if command -v inotifywait >/dev/null 2>&1; then
    log "Starting inotify-based file watcher"
    (
      inotifywait -mr -e modify,create,delete --exclude '\\.git|\\.ai-workflow|\\.claude|\\.agent-os|\\.claude-flow|node_modules' "$PROJECT_DIR" 2>/dev/null \
      | while read -r path _ file; do
          log "File change detected: $path$file"
          if [ -f "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" ]; then
            node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" > "$ANALYSIS_FILE" 2>>"$LOG_FILE" || log "Analysis failed (fswatch)"
          fi
          if [ -f "$ANALYSIS_FILE" ]; then
            CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} node "$INSTALL_DIR/lib/select-approach.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Approach selection failed (fswatch)"
            node "$INSTALL_DIR/lib/generate-docs.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Doc generation failed (fswatch)"
          fi
        done
    ) &
  else
    log "inotifywait not found; file watcher disabled"
  fi
}

# Determine latest tmux session started by orchestrator
get_tmux_session() {
  local infoDir="$INSTALL_DIR/logs/sessions"
  local latestFile
  latestFile=$(ls -1t "$infoDir"/*.info 2>/dev/null | head -n 1)
  if [ -n "$latestFile" ] && command -v jq >/dev/null 2>&1; then
    jq -r '.session // empty' "$latestFile"
  fi
}

# macOS fswatch watcher
start_fswatch_watcher() {
  if command -v fswatch >/dev/null 2>&1; then
    log "Starting fswatch-based file watcher"
    (
      fswatch -0 -or --exclude='\.git' --exclude='\.ai-workflow' --exclude='\.claude' --exclude='\.agent-os' --exclude='\.claude-flow' --exclude='node_modules' "$PROJECT_DIR" \
      | while IFS= read -r -d '' event; do
          log "File change detected (fswatch): $event"
          if [ -f "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" ]; then
            node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" > "$ANALYSIS_FILE" 2>>"$LOG_FILE" || log "Analysis failed (fswatch)"
          fi
          if [ -f "$ANALYSIS_FILE" ]; then
            CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} node "$INSTALL_DIR/lib/select-approach.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Approach selection failed (fswatch)"
            node "$INSTALL_DIR/lib/generate-docs.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Doc generation failed (fswatch)"
          fi
        done
    ) &
  else
    log "fswatch not found; macOS watcher disabled"
  fi
}

# Start watcher in background (non-blocking)
start_inotify_watcher
start_fswatch_watcher

# Capture previous selected approach (if any)
PREV_SELECTED=""
if [ -f "$APPROACH_JSON" ]; then
  PREV_SELECTED=$(jq -r '.selected // empty' "$APPROACH_JSON" 2>/dev/null)
fi

while true; do
  log "Supervisor tick - re-analyzing project"
  if [ -f "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" ]; then
    node "$INSTALL_DIR/intelligence-engine/complexity-analyzer.js" > "$ANALYSIS_FILE" 2>>"$LOG_FILE" || log "Analysis failed"
  fi
  if [ -f "$ANALYSIS_FILE" ]; then
    CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} node "$INSTALL_DIR/lib/select-approach.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Approach selection failed"
    # Detect approach change
    # Broadcast approach change to event bus if changed
    BUS_FILE="$INSTALL_DIR/logs/agent-bus.jsonl"
    TS=$(date -Iseconds)
    OLD="$PREV_SELECTED"
    if [ -f "$APPROACH_JSON" ]; then
      NEW_SELECTED=$(jq -r '.selected // empty' "$APPROACH_JSON" 2>/dev/null)
    fi
    if [ -n "$NEW_SELECTED" ] && [ "$NEW_SELECTED" != "$OLD" ]; then
      echo "{\"ts\":\"$TS\",\"type\":\"approach_change\",\"agent\":\"supervisor\",\"role\":\"watcher\",\"from\":\"$OLD\",\"to\":\"$NEW_SELECTED\"}" >> "$BUS_FILE"
    fi

    NEW_SELECTED=""
    if [ -f "$APPROACH_JSON" ]; then
      NEW_SELECTED=$(jq -r '.selected // empty' "$APPROACH_JSON" 2>/dev/null)
    fi
    if [ -n "$NEW_SELECTED" ] && [ "$NEW_SELECTED" != "$PREV_SELECTED" ]; then
      log "Approach changed from '$PREV_SELECTED' to '$NEW_SELECTED'"
      PREV_SELECTED="$NEW_SELECTED"
      # Restart orchestration if tmux is installed and selected
      if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        tmux kill-session -t "$TMUX_SESSION" 2>/dev/null || true
      fi
      if command -v tmux >/dev/null 2>&1; then
        WORKFLOW_TYPE="hive-mind"
        if echo "$NEW_SELECTED" | grep -qi 'hiveMindSparc'; then WORKFLOW_TYPE="hive-mind-sparc"; fi
        if echo "$NEW_SELECTED" | grep -qi 'simpleSwarm'; then WORKFLOW_TYPE="simple-swarm"; fi
        CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION:-alpha} "$INSTALL_DIR/tmux-scripts/orchestrate-workflow.sh" "${PROJECT_NAME:-workflow}" "$WORKFLOW_TYPE" || log "TMux orchestration restart failed"
      fi
    fi
    node "$INSTALL_DIR/lib/generate-docs.js" "$ANALYSIS_FILE" "$APPROACH_JSON" >>"$LOG_FILE" 2>&1 || log "Doc generation failed"
  fi
  sleep "$INTERVAL"
done
