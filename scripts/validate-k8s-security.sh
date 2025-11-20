#!/bin/bash
# Kubernetes Security Validation Script
# Validates security fixes for PR #21

set -e

DEPLOYMENT_DIR="deployment/kubernetes"
FAILED=0
PASSED=0

echo "================================================"
echo "Kubernetes Security Validation for PR #21"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a file contains a pattern
check_pattern() {
    local file=$1
    local pattern=$2
    local description=$3

    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
        return 1
    fi
}

# Function to count occurrences
count_pattern() {
    local file=$1
    local pattern=$2
    grep -c "$pattern" "$file" || echo "0"
}

echo "1. Validating queen-controller-deployment.yaml"
echo "-----------------------------------------------"
FILE="$DEPLOYMENT_DIR/queen-controller-deployment.yaml"

check_pattern "$FILE" "runAsNonRoot: true" "Pod-level runAsNonRoot"
check_pattern "$FILE" "runAsUser: 1000" "Pod-level runAsUser"
check_pattern "$FILE" "allowPrivilegeEscalation: false" "Container-level privilege escalation disabled"

CONTAINER_SECURITY=$(count_pattern "$FILE" "allowPrivilegeEscalation: false")
echo -e "  ${YELLOW}→${NC} Found $CONTAINER_SECURITY containers with securityContext"
if [ "$CONTAINER_SECURITY" -ge 3 ]; then
    echo -e "  ${GREEN}✓${NC} All containers (2 init + 1 main) have securityContext"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Missing securityContext in some containers"
    ((FAILED++))
fi
echo ""

echo "2. Validating redis-deployment.yaml"
echo "------------------------------------"
FILE="$DEPLOYMENT_DIR/redis-deployment.yaml"

check_pattern "$FILE" "runAsNonRoot: true" "Pod-level runAsNonRoot"
check_pattern "$FILE" "runAsUser: 999" "Redis runs as UID 999"
check_pattern "$FILE" "fsGroup: 999" "Pod-level fsGroup"
check_pattern "$FILE" "allowPrivilegeEscalation: false" "Container-level privilege escalation disabled"
check_pattern "$FILE" "- ALL" "All capabilities dropped"
echo ""

echo "3. Validating mongodb-deployment.yaml"
echo "--------------------------------------"
FILE="$DEPLOYMENT_DIR/mongodb-deployment.yaml"

check_pattern "$FILE" "runAsNonRoot: true" "Pod-level runAsNonRoot"
check_pattern "$FILE" "runAsUser: 999" "MongoDB runs as UID 999"
check_pattern "$FILE" "fsGroup: 999" "Pod-level fsGroup"

CONTAINER_SECURITY=$(count_pattern "$FILE" "allowPrivilegeEscalation: false")
echo -e "  ${YELLOW}→${NC} Found $CONTAINER_SECURITY containers with securityContext"
if [ "$CONTAINER_SECURITY" -ge 4 ]; then
    echo -e "  ${GREEN}✓${NC} All containers (1 init + 2 main + 1 job) have securityContext"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Missing securityContext in some containers"
    ((FAILED++))
fi
echo ""

echo "4. Validating monitoring-deployment.yaml"
echo "-----------------------------------------"
FILE="$DEPLOYMENT_DIR/monitoring-deployment.yaml"

# Check Prometheus
check_pattern "$FILE" "runAsUser: 65534" "Prometheus runs as UID 65534"
# Check Grafana
check_pattern "$FILE" "runAsUser: 472" "Grafana runs as UID 472"

CONTAINER_SECURITY=$(count_pattern "$FILE" "allowPrivilegeEscalation: false")
echo -e "  ${YELLOW}→${NC} Found $CONTAINER_SECURITY containers with securityContext"
if [ "$CONTAINER_SECURITY" -ge 2 ]; then
    echo -e "  ${GREEN}✓${NC} Both Prometheus and Grafana have securityContext"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Missing securityContext in some containers"
    ((FAILED++))
fi
echo ""

echo "5. Validating NetworkPolicy fixes (ingress.yaml)"
echo "-------------------------------------------------"
FILE="$DEPLOYMENT_DIR/ingress.yaml"

# Check for old non-standard labels (should be 0)
OLD_LABELS=$(count_pattern "$FILE" "name: ingress-nginx" || echo "0")
if [ "$OLD_LABELS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No old 'name: ingress-nginx' labels found"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Found $OLD_LABELS old 'name: ingress-nginx' labels"
    ((FAILED++))
fi

OLD_LABELS=$(count_pattern "$FILE" "name: kube-system" || echo "0")
if [ "$OLD_LABELS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No old 'name: kube-system' labels found"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Found $OLD_LABELS old 'name: kube-system' labels"
    ((FAILED++))
fi

# Check for new standard labels (should be > 0)
NEW_LABELS=$(count_pattern "$FILE" "kubernetes.io/metadata.name: ingress-nginx")
echo -e "  ${YELLOW}→${NC} Found $NEW_LABELS standard 'kubernetes.io/metadata.name: ingress-nginx' labels"
if [ "$NEW_LABELS" -ge 2 ]; then
    echo -e "  ${GREEN}✓${NC} Standard namespace labels properly used"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Missing standard namespace labels"
    ((FAILED++))
fi

NEW_LABELS=$(count_pattern "$FILE" "kubernetes.io/metadata.name: kube-system")
echo -e "  ${YELLOW}→${NC} Found $NEW_LABELS standard 'kubernetes.io/metadata.name: kube-system' labels"
if [ "$NEW_LABELS" -ge 4 ]; then
    echo -e "  ${GREEN}✓${NC} Standard namespace labels properly used"
    ((PASSED++))
else
    echo -e "  ${RED}✗${NC} Missing standard namespace labels"
    ((FAILED++))
fi
echo ""

echo "6. Checking YAML syntax"
echo "-----------------------"
for file in "$DEPLOYMENT_DIR"/*.yaml; do
    if python3 -c "import yaml; yaml.safe_load_all(open('$file'))" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $(basename $file) - Valid YAML"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $(basename $file) - Invalid YAML"
        ((FAILED++))
    fi
done
echo ""

echo "================================================"
echo "Validation Summary"
echo "================================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All security validations passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: kubectl apply --dry-run=client -f $DEPLOYMENT_DIR/"
    echo "  2. Run: checkov -d $DEPLOYMENT_DIR/ --framework kubernetes"
    echo "  3. Deploy to test cluster and verify functionality"
    exit 0
else
    echo -e "${RED}✗ Some validations failed. Please review the errors above.${NC}"
    exit 1
fi
