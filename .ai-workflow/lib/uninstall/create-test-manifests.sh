#!/bin/bash

# Test Manifest Generator
# Creates realistic test manifests for Phase 2 testing
# Uses the manifest-writer.sh functions to generate installation-record.json and generation-record.json

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BLUE='\033[0;34m'
DIM='\033[2m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../" && pwd)"
TEST_MANIFEST_DIR="${PROJECT_ROOT}/.ai-workflow"

echo -e "${BLUE}🧪 Test Manifest Generator for AI Workflow Uninstaller${NC}"
echo -e "${DIM}Project Root: ${PROJECT_ROOT}${NC}"
echo -e "${DIM}Test Manifest Dir: ${TEST_MANIFEST_DIR}${NC}"
echo ""

# Source the manifest writer functions
if [[ ! -f "${SCRIPT_DIR}/manifest-writer.sh" ]]; then
    echo -e "${RED}❌ manifest-writer.sh not found at ${SCRIPT_DIR}/manifest-writer.sh${NC}"
    exit 1
fi

echo -e "${GREEN}📝 Loading manifest writer functions...${NC}"
source "${SCRIPT_DIR}/manifest-writer.sh"

# Initialize manifest tracking
echo -e "${GREEN}🚀 Initializing manifest tracking...${NC}"
if ! manifest_init "3.0.0"; then
    echo -e "${RED}❌ Failed to initialize manifest tracking${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Creating Installation Manifest Test Data...${NC}"

# Create realistic installation manifest data
# These represent files that would be installed by the AI workflow system
installation_files=(
    # Core system assets
    ".ai-workflow/lib/core.js:installed_system_asset"
    ".ai-workflow/lib/config-manager.js:installed_system_asset"
    ".ai-workflow/lib/task-runner.js:installed_system_asset"
    ".ai-workflow/lib/uninstall/manifest.js:installed_system_asset"
    ".ai-workflow/lib/uninstall/manifest-writer.sh:installed_system_asset"
    ".ai-workflow/lib/uninstall/classifier.js:installed_system_asset"
    ".ai-workflow/lib/uninstall/plan-builder.js:installed_system_asset"
    
    # Configuration files
    ".ai-workflow/configs/default-config.json:installed_system_asset"
    ".ai-workflow/configs/hive-mind.yaml:installed_system_asset"
    ".ai-workflow/configs/agent-templates.json:installed_system_asset"
    
    # Executable scripts and symlinks
    ".ai-workflow/bin/ai-workflow:symlink_executable"
    ".ai-workflow/bin/claude-flow:symlink_executable"
    ".ai-workflow/bin/hive-mind:symlink_executable"
    
    # Templates and assets
    ".ai-workflow/templates/agent-template.yaml:installed_system_asset"
    ".ai-workflow/templates/task-template.json:installed_system_asset"
    ".ai-workflow/agent-templates/researcher.yaml:installed_system_asset"
    ".ai-workflow/agent-templates/developer.yaml:installed_system_asset"
    
    # Hook scripts
    ".ai-workflow/hooks/pre-task.sh:installed_system_asset"
    ".ai-workflow/hooks/post-task.sh:installed_system_asset"
    
    # Log files and caches (ephemeral)
    ".ai-workflow/logs/installation.log:ephemeral_cache_log"
    ".ai-workflow/logs/task-execution.log:ephemeral_cache_log"
    ".ai-workflow/logs/agents/agent-001.log:ephemeral_cache_log"
    ".ai-workflow/logs/agents/agent-002.log:ephemeral_cache_log"
    ".ai-workflow/logs/sessions/session-2024-08-14.log:ephemeral_cache_log"
    
    # Cache and temporary files
    ".ai-workflow/recovery/checkpoints/checkpoint-001.json:ephemeral_cache_log"
    ".ai-workflow/recovery/backups/config-backup.json:ephemeral_cache_log"
    ".ai-workflow/hive-mind/swarm-1755040698540-o0jq1fsgx/memory/shared-memory.json:ephemeral_cache_log"
    ".ai-workflow/hive-mind/swarm-1755040698540-o0jq1fsgx/tasks/task-queue.json:ephemeral_cache_log"
    
    # Additional system components
    ".ai-workflow/supervisor/supervisor.js:installed_system_asset"
    ".ai-workflow/intelligence-engine/analyzer.js:installed_system_asset"
    ".ai-workflow/slash-commands/commands.json:installed_system_asset"
    ".ai-workflow/tmux-scripts/session-manager.sh:installed_system_asset"
)

echo -e "${YELLOW}📝 Recording ${#installation_files[@]} installation files...${NC}"
if manifest_record_files "${installation_files[@]}"; then
    echo -e "${GREEN}✅ Installation manifest created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create installation manifest${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📄 Creating Generation Manifest Test Data...${NC}"

# Create realistic generation manifest data
# These represent documents that would be generated or modified by the AI system
generated_docs=(
    # Claude configuration and documentation
    ".claude/CLAUDE.md:intelligent:.ai-workflow/backups/CLAUDE.md.bak"
    ".claude/agents/researcher.md:merge:.ai-workflow/backups/researcher.md.bak"
    ".claude/agents/developer.md:merge:.ai-workflow/backups/developer.md.bak"
    ".claude/project-context.md:intelligent:.ai-workflow/backups/project-context.md.bak"
    
    # AI-Dev generated files
    ".ai-dev/analysis.json:replace:.ai-workflow/backups/analysis.json.bak"
    ".ai-dev/task-breakdown.md:intelligent:.ai-workflow/backups/task-breakdown.md.bak"
    ".ai-dev/progress-tracking.json:merge"
    ".ai-dev/metrics.json:replace"
    
    # Agent OS configuration
    ".agent-os/config.yaml:intelligent:.ai-workflow/backups/agent-config.yaml.bak"
    ".agent-os/agents/agent-001.yaml:merge:.ai-workflow/backups/agent-001.yaml.bak"
    ".agent-os/workflows/main-workflow.yaml:intelligent:.ai-workflow/backups/main-workflow.yaml.bak"
    
    # Project documentation
    "docs/README.md:intelligent:.ai-workflow/backups/README.md.bak"
    "docs/API.md:merge:.ai-workflow/backups/API.md.bak"
    "docs/ARCHITECTURE.md:intelligent:.ai-workflow/backups/ARCHITECTURE.md.bak"
    "docs/DEPLOYMENT.md:replace"
    
    # End-of-phase summaries
    "END-OF-PHASE-SUMMARIES/PHASE-ONE/PHASE-1-COMPLETE.md:intelligent"
    "END-OF-PHASE-SUMMARIES/PHASE-ONE/PHASE-1-SUMMARY.md:intelligent"
    
    # Configuration files that might be updated
    "package.json:merge:.ai-workflow/backups/package.json.bak"
    "tsconfig.json:intelligent:.ai-workflow/backups/tsconfig.json.bak"
    ".gitignore:merge:.ai-workflow/backups/gitignore.bak"
    
    # Intelligence engine documents
    "intelligence-engine/.claude/INTELLIGENCE-CLAUDE.md:intelligent:.ai-workflow/backups/INTELLIGENCE-CLAUDE.md.bak"
    "intelligence-engine/docs/FEATURES.md:merge"
    "intelligence-engine/analysis/system-analysis.json:replace"
)

echo -e "${YELLOW}📄 Recording ${#generated_docs[@]} generated documents...${NC}"
if manifest_record_generated_docs "${generated_docs[@]}"; then
    echo -e "${GREEN}✅ Generation manifest created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create generation manifest${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Verifying created manifests...${NC}"

# Verify the manifests were created and are valid JSON
INSTALL_MANIFEST="${TEST_MANIFEST_DIR}/installation-record.json"
GENERATION_MANIFEST="${TEST_MANIFEST_DIR}/generation-record.json"

if [[ -f "$INSTALL_MANIFEST" ]]; then
    echo -e "${GREEN}✅ Installation manifest exists: ${INSTALL_MANIFEST}${NC}"
    if jq . "$INSTALL_MANIFEST" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Installation manifest is valid JSON${NC}"
        INSTALL_COUNT=$(jq '.items | length' "$INSTALL_MANIFEST")
        echo -e "${DIM}   Contains ${INSTALL_COUNT} installation items${NC}"
    else
        echo -e "${RED}❌ Installation manifest is invalid JSON${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Installation manifest not found${NC}"
    exit 1
fi

if [[ -f "$GENERATION_MANIFEST" ]]; then
    echo -e "${GREEN}✅ Generation manifest exists: ${GENERATION_MANIFEST}${NC}"
    if jq . "$GENERATION_MANIFEST" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Generation manifest is valid JSON${NC}"
        GEN_COUNT=$(jq '.updates | length' "$GENERATION_MANIFEST")
        echo -e "${DIM}   Contains ${GEN_COUNT} generation items${NC}"
    else
        echo -e "${RED}❌ Generation manifest is invalid JSON${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Generation manifest not found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📊 Test Manifest Summary:${NC}"
echo -e "${DIM}======================================${NC}"
echo -e "${GREEN}Installation Manifest:${NC} ${INSTALL_COUNT} items"
echo -e "  - System Assets: $(jq '[.items[] | select(.origin == "installed_system_asset")] | length' "$INSTALL_MANIFEST")"
echo -e "  - Symlinks/Executables: $(jq '[.items[] | select(.origin == "symlink_executable")] | length' "$INSTALL_MANIFEST")"
echo -e "  - Cache/Logs: $(jq '[.items[] | select(.origin == "ephemeral_cache_log")] | length' "$INSTALL_MANIFEST")"
echo ""
echo -e "${GREEN}Generation Manifest:${NC} ${GEN_COUNT} items"
echo -e "  - Intelligent Strategy: $(jq '[.updates[] | select(.strategy == "intelligent")] | length' "$GENERATION_MANIFEST")"
echo -e "  - Merge Strategy: $(jq '[.updates[] | select(.strategy == "merge")] | length' "$GENERATION_MANIFEST")"
echo -e "  - Replace Strategy: $(jq '[.updates[] | select(.strategy == "replace")] | length' "$GENERATION_MANIFEST")"
echo -e "  - With Backups: $(jq '[.updates[] | select(.backup != null)] | length' "$GENERATION_MANIFEST")"
echo ""
echo -e "${GREEN}🎉 Test manifests created successfully!${NC}"
echo -e "${DIM}Ready for Phase 2 classifier and plan builder testing.${NC}"