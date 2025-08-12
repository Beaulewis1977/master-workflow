#!/usr/bin/env bash
set -euo pipefail
if ! command -v shellcheck >/dev/null 2>&1; then
  echo "shellcheck not found. Install: brew install shellcheck | sudo apt-get install shellcheck"
  exit 1
fi
shellcheck install-modular.sh tmux-scripts/*.sh .ai-workflow/hooks/*.sh 2>/dev/null || true
