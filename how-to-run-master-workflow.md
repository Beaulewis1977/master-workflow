./ai-workflow init --interactive

./scripts/install-modular-fixed.sh --code --agent-os --flow --no-autorun --yes

./scripts/install-modular-fixed.sh
# Press: 1/2/3/4 to toggle, then C to continue

npx claude-flow@alpha hive-mind spawn "your objective" --agents 6 --claude

npx --yes claude-flow@latest hive-mind spawn "MASTER-WORKFLOW" --sparc --agents 10 --claude

./ai-workflow init --sparc
./ai-workflow init --hive
./ai-workflow init --swarm "short objective"
./ai-workflow init --auto


./install-modular.sh

npx --yes claude-flow@latest hive-mind spawn "your objective" --claude

claude-flow hive-mind spawn "your objective" --claude

./ai-workflow status-dashboard 8787




Do one of these:
Open a new terminal tab/window and run commands there (recommended)
Examples to generate dashboard events:
./ai-workflow verify
./ai-workflow analyze
./ai-workflow mcp refresh
Pause and resume
Press Ctrl+C to pause safely
Resume later: claude-flow hive-mind resume <session-id>
Background the current run
Press Ctrl+Z, then run: bg; disown
Bring it back: fg
Start in background from the start
npx --yes claude-flow@latest hive-mind spawn "your objective" --claude &> /tmp/swarm.log & disown
tail -f /tmp/swarm.log
Open the dashboard at /ui while you run those commands:
http://localhost:8787/ui (or your chosen port)






Use Claude Code with the swarm
Ensure CLAUDE CLI is installed and selected:
claude --version
jq '.claudeCommand="claude" | .skipPermissions=false' .ai-workflow/installation-config.json > /tmp/ic.json && mv /tmp/ic.json .ai-workflow/installation-config.json
Spawn Hive‑Mind with coordinated Claude Code
Manual:
npx claude-flow@alpha hive-mind spawn "your objective" --agents 6 --claude
With tmux:
tmux new -s ai-swarm -d
tmux send-keys -t ai-swarm 'npx claude-flow@alpha hive-mind spawn "your objective" --agents 6 --claude' C-m


tmux attach -t ai-swarm
Via our runner (auto-publishes events and adds --claude for Hive‑Mind/SPARC):
AIWF_AUTORUN=true ./ai-workflow init --auto "your objective"
Who orchestrates?
Claude Flow runs the multi-agent swarm (queen + workers).
Our runner picks the approach, builds the exact command (with --claude), and can launch it.
TMux (optional) keeps it alive; Agent‑OS files document the plan/specs/tasks.
How to see what’s happening
Claude Flow:
npx claude-flow@alpha hive-mind status
npx claude-flow@alpha hive-mind resume <session-id>
Logs: .claude-flow/memory/logs and artifacts
Event bus (JSON/SSE; no HTML UI):
AGENT_BUS_PORT=8787 node package-tools/bin/agent-bus-http.js &
Live: curl -N http://127.0.0.1:8787/events/stream
Snapshot: curl -sS http://127.0.0.1:8787/ | jq
Note: to see workflow events here, launch via ./ai-workflow init; plain npx claude-flow won’t publish to our bus.
Engine API (optional checks)
curl -sS http://127.0.0.1:13800/health | jq
curl -sS http://127.0.0.1:13800/api/env/scan | jq