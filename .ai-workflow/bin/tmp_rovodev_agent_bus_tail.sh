#!/bin/bash
# Simple tail-like live dashboard for agent-bus JSONL
BUS_FILE=".ai-workflow/logs/agent-bus.jsonl"
if [ ! -f "$BUS_FILE" ]; then
  echo "No agent bus found: $BUS_FILE"
  exit 1
fi

TYPE=""; AGENT=""; ROLE=""; while [ $# -gt 0 ]; do case "$1" in --type) TYPE="$2"; shift 2;; --agent) AGENT="$2"; shift 2;; --role) ROLE="$2"; shift 2;; *) shift;; esac; done

tail -n 50 -f "$BUS_FILE" | while read -r line; do
  type=$(echo "$line" | sed -n 's/.*"type":"\([^"]*\)".*/\1/p')
  ts=$(echo "$line" | sed -n 's/.*"ts":"\([^"]*\)".*/\1/p')
  if [ -n "$TYPE" ] && [ "$TYPE" != "$type" ]; then continue; fi
  agent=$(echo "$line" | sed -n 's/.*"agent":"\([^"]*\)".*/\1/p')
  role=$(echo "$line" | sed -n 's/.*"role":"\([^"]*\)".*/\1/p')
  if [ -n "$AGENT" ] && [ "$AGENT" != "$agent" ]; then continue; fi
  if [ -n "$ROLE" ] && [ "$ROLE" != "$role" ]; then continue; fi
  case "$type" in
    prompt)
      prompt=$(echo "$line" | sed -n 's/.*"prompt":"\(.*\)".*/\1/p' | sed 's/\\n/ /g' | cut -c1-120)
      echo "[$ts] PROMPT: $prompt"
      ;;
    tool)
      tool=$(echo "$line" | sed -n 's/.*"tool":"\([^"]*\)".*/\1/p')
      echo "[$ts] TOOL: $tool"
      ;;
    response)
      excerpt=$(echo "$line" | sed -n 's/.*"excerpt":"\(.*\)".*/\1/p' | sed 's/\\n/ /g' | cut -c1-120)
      echo "[$ts] RESPONSE: $excerpt"
      ;;
    *)
      echo "[$ts] EVENT: $line" | cut -c1-160
      ;;
  esac
done
