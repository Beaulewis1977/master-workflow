#!/bin/bash

# Test Manifest Validator
# Validates that the created test manifests meet Phase 2 requirements
# Ensures proper structure, data types, and coverage for testing

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
INSTALL_MANIFEST="${PROJECT_ROOT}/.ai-workflow/installation-record.json"
GENERATION_MANIFEST="${PROJECT_ROOT}/.ai-workflow/generation-record.json"

echo -e "${BLUE}🔍 Test Manifest Validator${NC}"
echo -e "${DIM}Validating manifests for Phase 2 testing requirements${NC}"
echo ""

# Function to check JSON validity
validate_json() {
    local file="$1"
    local name="$2"
    
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ ${name} not found: ${file}${NC}"
        return 1
    fi
    
    if ! jq . "$file" >/dev/null 2>&1; then
        echo -e "${RED}❌ ${name} is not valid JSON${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ ${name} is valid JSON${NC}"
    return 0
}

# Function to validate installation manifest structure
validate_installation_manifest() {
    local file="$1"
    
    echo -e "${BLUE}📦 Validating Installation Manifest Structure...${NC}"
    
    # Check required top-level fields
    if ! jq -e '.installerVersion' "$file" >/dev/null; then
        echo -e "${RED}❌ Missing installerVersion field${NC}"
        return 1
    fi
    
    if ! jq -e '.installedAt' "$file" >/dev/null; then
        echo -e "${RED}❌ Missing installedAt field${NC}"
        return 1
    fi
    
    if ! jq -e '.items' "$file" >/dev/null; then
        echo -e "${RED}❌ Missing items array${NC}"
        return 1
    fi
    
    # Check items structure
    local item_count=$(jq '.items | length' "$file")
    if [[ "$item_count" -eq 0 ]]; then
        echo -e "${RED}❌ No items in installation manifest${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Installation manifest has ${item_count} items${NC}"
    
    # Check required item fields
    local invalid_items=0
    for i in $(seq 0 $((item_count - 1))); do
        local item=$(jq -r ".items[$i]" "$file")
        
        if ! echo "$item" | jq -e '.path' >/dev/null; then
            echo -e "${RED}❌ Item $i missing path field${NC}"
            ((invalid_items++))
        fi
        
        if ! echo "$item" | jq -e '.origin' >/dev/null; then
            echo -e "${RED}❌ Item $i missing origin field${NC}"
            ((invalid_items++))
        fi
        
        if ! echo "$item" | jq -e '.timestamp' >/dev/null; then
            echo -e "${RED}❌ Item $i missing timestamp field${NC}"
            ((invalid_items++))
        fi
    done
    
    if [[ "$invalid_items" -gt 0 ]]; then
        echo -e "${RED}❌ ${invalid_items} items have invalid structure${NC}"
        return 1
    fi
    
    # Check origin distribution
    local system_assets=$(jq '[.items[] | select(.origin == "installed_system_asset")] | length' "$file")
    local symlinks=$(jq '[.items[] | select(.origin == "symlink_executable")] | length' "$file")
    local cache_logs=$(jq '[.items[] | select(.origin == "ephemeral_cache_log")] | length' "$file")
    
    echo -e "${DIM}  - System Assets: ${system_assets}${NC}"
    echo -e "${DIM}  - Symlinks/Executables: ${symlinks}${NC}"
    echo -e "${DIM}  - Cache/Logs: ${cache_logs}${NC}"
    
    # Require at least one of each type for comprehensive testing
    if [[ "$system_assets" -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No system assets found - recommend adding some for comprehensive testing${NC}"
    fi
    
    if [[ "$symlinks" -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No symlinks/executables found - recommend adding some for comprehensive testing${NC}"
    fi
    
    if [[ "$cache_logs" -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No cache/log files found - recommend adding some for comprehensive testing${NC}"
    fi
    
    echo -e "${GREEN}✅ Installation manifest structure is valid${NC}"
    return 0
}

# Function to validate generation manifest structure
validate_generation_manifest() {
    local file="$1"
    
    echo -e "${BLUE}📄 Validating Generation Manifest Structure...${NC}"
    
    # Check required top-level fields
    if ! jq -e '.generatedAt' "$file" >/dev/null; then
        echo -e "${RED}❌ Missing generatedAt field${NC}"
        return 1
    fi
    
    if ! jq -e '.updates' "$file" >/dev/null; then
        echo -e "${RED}❌ Missing updates array${NC}"
        return 1
    fi
    
    # Check updates structure
    local update_count=$(jq '.updates | length' "$file")
    if [[ "$update_count" -eq 0 ]]; then
        echo -e "${RED}❌ No updates in generation manifest${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Generation manifest has ${update_count} updates${NC}"
    
    # Check required update fields
    local invalid_updates=0
    for i in $(seq 0 $((update_count - 1))); do
        local update=$(jq -r ".updates[$i]" "$file")
        
        if ! echo "$update" | jq -e '.path' >/dev/null; then
            echo -e "${RED}❌ Update $i missing path field${NC}"
            ((invalid_updates++))
        fi
        
        if ! echo "$update" | jq -e '.origin' >/dev/null; then
            echo -e "${RED}❌ Update $i missing origin field${NC}"
            ((invalid_updates++))
        fi
        
        if ! echo "$update" | jq -e '.strategy' >/dev/null; then
            echo -e "${RED}❌ Update $i missing strategy field${NC}"
            ((invalid_updates++))
        fi
        
        # Check valid strategy values
        local strategy=$(echo "$update" | jq -r '.strategy // "unknown"')
        if [[ "$strategy" != "intelligent" && "$strategy" != "merge" && "$strategy" != "replace" ]]; then
            echo -e "${RED}❌ Update $i has invalid strategy: ${strategy}${NC}"
            ((invalid_updates++))
        fi
    done
    
    if [[ "$invalid_updates" -gt 0 ]]; then
        echo -e "${RED}❌ ${invalid_updates} updates have invalid structure${NC}"
        return 1
    fi
    
    # Check strategy distribution
    local intelligent=$(jq '[.updates[] | select(.strategy == "intelligent")] | length' "$file")
    local merge=$(jq '[.updates[] | select(.strategy == "merge")] | length' "$file")
    local replace=$(jq '[.updates[] | select(.strategy == "replace")] | length' "$file")
    local with_backups=$(jq '[.updates[] | select(.backup != null and .backup != "")] | length' "$file")
    
    echo -e "${DIM}  - Intelligent Strategy: ${intelligent}${NC}"
    echo -e "${DIM}  - Merge Strategy: ${merge}${NC}"
    echo -e "${DIM}  - Replace Strategy: ${replace}${NC}"
    echo -e "${DIM}  - With Backups: ${with_backups}${NC}"
    
    # Require at least one of each strategy for comprehensive testing
    if [[ "$intelligent" -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No intelligent strategy items - recommend adding some for comprehensive testing${NC}"
    fi
    
    if [[ "$merge" -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No merge strategy items - recommend adding some for comprehensive testing${NC}"
    fi
    
    if [[ "$replace" -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No replace strategy items - recommend adding some for comprehensive testing${NC}"
    fi
    
    echo -e "${GREEN}✅ Generation manifest structure is valid${NC}"
    return 0
}

# Function to validate cross-manifest consistency
validate_cross_manifest_consistency() {
    echo -e "${BLUE}🔗 Validating Cross-Manifest Consistency...${NC}"
    
    # Check that installation and generation manifests don't overlap inappropriately
    local install_paths=$(jq -r '.items[].path' "$INSTALL_MANIFEST" | sort)
    local gen_paths=$(jq -r '.updates[].path' "$GENERATION_MANIFEST" | sort)
    
    # Check for overlapping paths (which is actually expected for some cases)
    local overlaps=$(comm -12 <(echo "$install_paths") <(echo "$gen_paths") | wc -l)
    if [[ "$overlaps" -gt 0 ]]; then
        echo -e "${DIM}  - Found ${overlaps} overlapping paths (this is normal for files that are both installed and generated)${NC}"
    fi
    
    # Check version consistency
    local install_version=$(jq -r '.installerVersion' "$INSTALL_MANIFEST")
    echo -e "${DIM}  - Installation version: ${install_version}${NC}"
    
    # Check timestamp formats
    local install_timestamp=$(jq -r '.installedAt' "$INSTALL_MANIFEST")
    local gen_timestamp=$(jq -r '.generatedAt' "$GENERATION_MANIFEST")
    
    if ! date -d "$install_timestamp" >/dev/null 2>&1; then
        echo -e "${RED}❌ Invalid installation timestamp format${NC}"
        return 1
    fi
    
    if ! date -d "$gen_timestamp" >/dev/null 2>&1; then
        echo -e "${RED}❌ Invalid generation timestamp format${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Cross-manifest consistency validated${NC}"
    return 0
}

# Main validation
echo -e "${YELLOW}Starting manifest validation...${NC}"
echo ""

# Validate JSON structure
if ! validate_json "$INSTALL_MANIFEST" "Installation Manifest"; then
    exit 1
fi

if ! validate_json "$GENERATION_MANIFEST" "Generation Manifest"; then
    exit 1
fi

echo ""

# Validate manifest structures
if ! validate_installation_manifest "$INSTALL_MANIFEST"; then
    exit 1
fi

echo ""

if ! validate_generation_manifest "$GENERATION_MANIFEST"; then
    exit 1
fi

echo ""

# Validate cross-manifest consistency
if ! validate_cross_manifest_consistency; then
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All validations passed!${NC}"
echo -e "${DIM}Test manifests are ready for Phase 2 classifier and plan builder testing.${NC}"

# Print summary for Phase 2 testing
echo ""
echo -e "${BLUE}📋 Phase 2 Testing Summary:${NC}"
echo -e "${DIM}============================${NC}"
echo -e "${GREEN}Installation Manifest:${NC}"
echo -e "  - Location: ${INSTALL_MANIFEST}"
echo -e "  - Items: $(jq '.items | length' "$INSTALL_MANIFEST")"
echo -e "  - Origins: $(jq '[.items[].origin] | unique | length' "$INSTALL_MANIFEST") types"
echo ""
echo -e "${GREEN}Generation Manifest:${NC}"
echo -e "  - Location: ${GENERATION_MANIFEST}"
echo -e "  - Updates: $(jq '.updates | length' "$GENERATION_MANIFEST")"
echo -e "  - Strategies: $(jq '[.updates[].strategy] | unique | length' "$GENERATION_MANIFEST") types"
echo -e "  - Backups: $(jq '[.updates[] | select(.backup != null and .backup != "")] | length' "$GENERATION_MANIFEST") items"
echo ""
echo -e "${DIM}These manifests provide comprehensive test data for:${NC}"
echo -e "${DIM}  • File classification testing${NC}"
echo -e "${DIM}  • Uninstall plan generation${NC}"
echo -e "${DIM}  • Risk assessment validation${NC}"
echo -e "${DIM}  • Strategy handling verification${NC}"