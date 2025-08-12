# FAQ

Common issues and fixes for the Intelligent Workflow System.

## Missing jq
- Symptom: JSON processing or table views fail.
- Fix (Debian/Ubuntu): `sudo apt-get update && sudo apt-get install -y jq`
- Fix (macOS): `brew install jq`
- Fix (Windows): Use Git Bash + `choco install jq` or rely on raw JSON output.

## Missing tmux
- Symptom: TMux orchestration not available.
- Fix (Debian/Ubuntu): `sudo apt-get install -y tmux`
- Fix (macOS): `brew install tmux`
- Fix (Windows): Skip tmux and run in process mode. Use the PowerShell supervisor.

## Missing fswatch (macOS)
- Symptom: File changes not triggering supervisor updates.
- Fix (macOS): `brew install fswatch`
- Note: The system still runs on interval without fswatch.

## Missing inotifywait (Linux)
- Symptom: File changes not triggering supervisor updates.
- Fix (Debian/Ubuntu): `sudo apt-get install -y inotify-tools`
- Note: The system still runs on interval without inotifywait.

## PowerShell execution policy (Windows)
- Symptom: `install-modular.ps1` fails to run.
- Fix: Start PowerShell as user and run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Node version issues
- Symptom: Scripts fail with syntax errors or wrong features.
- Fix: Install Node.js 18+ (Node 20 recommended).

## Git Bash not found (Windows)
- Symptom: PowerShell wrapper says Git Bash not found.
- Fix: Install Git for Windows. Relaunch PowerShell.

## Ports in use (dashboard)
- Symptom: Dashboard port 8787 already used.
- Fix: Start with another port: `./ai-workflow status-dashboard 8888`.

## Claude Flow version
- Symptom: Using wrong flow version.
- Fix: Override env: `CLAUDE_FLOW_VERSION=stable ./ai-workflow init --auto`.

