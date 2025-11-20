# Master Workflow 3.0 - Comprehensive Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Options](#deployment-options)
4. [Quick Start](#quick-start)
5. [Local Development Deployment](#local-development-deployment)
6. [Multi-Node Testing Deployment](#multi-node-testing-deployment)
7. [Production Kubernetes Deployment](#production-kubernetes-deployment)
8. [Cloud Provider Deployments](#cloud-provider-deployments)
9. [Configuration](#configuration)
10. [Security Best Practices](#security-best-practices)
11. [Monitoring and Observability](#monitoring-and-observability)
12. [Scaling and Optimization](#scaling-and-optimization)
13. [Backup and Recovery](#backup-and-recovery)
14. [Troubleshooting](#troubleshooting)

---

## Overview

Master Workflow 3.0 is a distributed agent orchestration system capable of managing up to 4,462 concurrent agents across multiple nodes. This guide covers all deployment scenarios from local development to production cloud deployments.

### Key Capabilities
- **Unlimited Agent Scaling**: 4,462 concurrent agents with 42+ specialized types
- **Distributed Coordination**: Multi-node deployment with Redis/MongoDB state management
- **GPU Acceleration**: Optional GPU support for neural computations
- **High Availability**: Multi-replica deployments with automatic failover
- **Real-time Monitoring**: Prometheus + Grafana dashboards

### Architecture Components
- **Queen Controller**: Main orchestration engine (Node.js 18+)
- **Redis**: Distributed state and pub/sub (7.0+)
- **MongoDB**: Persistent storage and replica set (6.0+)
- **Prometheus**: Metrics collection (2.48+)
- **Grafana**: Visualization dashboards (10.2+)

---

## Prerequisites

### Common Requirements

#### Software
- **Operating System**: Linux (Ubuntu 20.04+), macOS (12+), or Windows WSL2
- **Container Runtime**: Docker 24.0+ or Kubernetes 1.24+
- **Memory**: Minimum 16 GB RAM (32 GB+ recommended)
- **CPU**: Minimum 8 cores (16+ recommended)
- **Storage**: Minimum 200 GB SSD

#### Tools
```bash
# Docker & Docker Compose
docker --version  # Should be 24.0+
docker compose version  # Should be 2.20+

# Kubernetes (if deploying to K8s)
kubectl version --client  # Should be 1.24+

# Cloud CLI (if deploying to cloud)
aws --version      # AWS CLI v2
gcloud version     # Google Cloud SDK
az version         # Azure CLI
```

### Cloud-Specific Prerequisites

#### AWS
- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- eksctl installed for EKS
- kubectl configured

#### GCP
- Google Cloud Project with billing enabled
- gcloud CLI authenticated (`gcloud auth login`)
- Container API, GKE API enabled

#### Azure
- Azure subscription
- Azure CLI authenticated (`az login`)
- AKS service enabled

---

## Deployment Options

Master Workflow 3.0 supports four primary deployment options:

| Option | Use Case | Complexity | Scalability | HA |
|--------|----------|------------|-------------|-----|
| **Local Development** | Development, testing | Low | Single node | No |
| **Multi-Node Docker** | Testing, staging | Medium | 3 nodes | Yes |
| **Kubernetes** | Production | High | Unlimited | Yes |
| **Cloud Managed** | Production | High | Unlimited | Yes |

Choose based on your requirements:
- **Development**: Use Local Development
- **Testing/Staging**: Use Multi-Node Docker
- **Production**: Use Kubernetes or Cloud Managed

---

## Quick Start

### Option 1: Local Development (Fastest)

```bash
# Clone repository
git clone https://github.com/your-org/master-workflow.git
cd master-workflow

# Start development environment
cd deployment/docker
docker compose -f docker-compose.dev.yml up -d

# Access services
# Dashboard: http://localhost:3000
# WebSocket: ws://localhost:8080
# Metrics: http://localhost:9090
# Redis Commander: http://localhost:8081
# Mongo Express: http://localhost:8082
```

### Option 2: Multi-Node Testing

```bash
# Set environment variables
export REDIS_PASSWORD="your-secure-password"
export MONGODB_ROOT_PASSWORD="your-secure-password"
export MONGODB_PASSWORD="your-secure-password"

# Start 3-node cluster
cd deployment/docker
docker compose -f docker-compose.distributed.yml up -d

# Verify cluster
docker ps | grep master-workflow
```

### Option 3: Kubernetes (Production)

```bash
# Create namespace
kubectl apply -f deployment/kubernetes/namespace.yaml

# Create secrets
kubectl create secret generic master-workflow-secrets \
  --from-literal=REDIS_PASSWORD='your-redis-password' \
  --from-literal=MONGODB_ROOT_PASSWORD='your-mongodb-root-password' \
  --from-literal=MONGODB_PASSWORD='your-mongodb-user-password' \
  --from-literal=MONGODB_USERNAME='masterworkflow' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  --from-literal=API_KEY='your-api-key' \
  --namespace=master-workflow

# Deploy infrastructure
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/redis-deployment.yaml
kubectl apply -f deployment/kubernetes/mongodb-deployment.yaml

# Wait for databases
kubectl wait --for=condition=ready pod -l app=redis -n master-workflow --timeout=300s
kubectl wait --for=condition=ready pod -l app=mongodb -n master-workflow --timeout=300s

# Deploy Queen Controller
kubectl apply -f deployment/kubernetes/queen-controller-deployment.yaml

# Deploy monitoring
kubectl apply -f deployment/kubernetes/monitoring-deployment.yaml

# Deploy ingress
kubectl apply -f deployment/kubernetes/ingress.yaml

# Get service URLs
kubectl get ingress -n master-workflow
```

---

## Local Development Deployment

### Step 1: Prerequisites Check

```bash
# Verify Docker
docker info

# Verify Docker Compose
docker compose version

# Check available resources
docker system df
```

### Step 2: Environment Setup

```bash
# Navigate to deployment directory
cd deployment/docker

# Copy environment template
cat > .env <<EOF
NODE_ENV=development
REDIS_PASSWORD=devpassword
MONGODB_ROOT_PASSWORD=devpassword
MONGODB_PASSWORD=devpassword
EOF
```

### Step 3: Start Services

```bash
# Start all services
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f queen-controller

# Check service health
docker compose -f docker-compose.dev.yml ps
```

### Step 4: Verify Deployment

```bash
# Test Queen Controller health
curl http://localhost:9090/health

# Test WebSocket connection
wscat -c ws://localhost:8080

# Access dashboards
open http://localhost:3000          # Main dashboard
open http://localhost:8081          # Redis Commander
open http://localhost:8082          # Mongo Express (admin/admin)
```

### Step 5: Development Workflow

```bash
# Watch logs
docker compose -f docker-compose.dev.yml logs -f

# Restart specific service
docker compose -f docker-compose.dev.yml restart queen-controller

# Execute commands in container
docker compose -f docker-compose.dev.yml exec queen-controller sh

# Stop all services
docker compose -f docker-compose.dev.yml down

# Clean up volumes (WARNING: deletes data)
docker compose -f docker-compose.dev.yml down -v
```

---

## Multi-Node Testing Deployment

### Step 1: Environment Configuration

```bash
# Create .env file
cat > deployment/docker/.env <<EOF
# Security
REDIS_PASSWORD=$(openssl rand -base64 32)
MONGODB_ROOT_PASSWORD=$(openssl rand -base64 32)
MONGODB_PASSWORD=$(openssl rand -base64 32)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 16)

# Configuration
MAX_CONCURRENT_AGENTS=4462
SAFETY_LIMIT=1000
DISTRIBUTED_MODE=true
CLUSTER_NAME=master-workflow-cluster
EOF

# Source environment
source deployment/docker/.env
```

### Step 2: Deploy Infrastructure

```bash
cd deployment/docker

# Start Redis cluster (3 nodes)
docker compose -f docker-compose.distributed.yml up -d redis-1 redis-2 redis-3

# Wait for Redis to be healthy
sleep 30

# Start MongoDB replica set (3 nodes)
docker compose -f docker-compose.distributed.yml up -d mongodb-1 mongodb-2 mongodb-3

# Wait for MongoDB to be healthy
sleep 60
```

### Step 3: Initialize Databases

```bash
# Initialize Redis cluster (if using cluster mode)
docker exec -it master-workflow-redis-1 redis-cli --cluster create \
  172.20.0.10:6379 172.20.0.11:6379 172.20.0.12:6379 \
  --cluster-replicas 0 --cluster-yes

# Initialize MongoDB replica set
docker exec -it master-workflow-mongodb-1 mongosh --eval '
rs.initiate({
  _id: "master-workflow-rs",
  members: [
    { _id: 0, host: "mongodb-1:27017" },
    { _id: 1, host: "mongodb-2:27017" },
    { _id: 2, host: "mongodb-3:27017" }
  ]
})
'

# Create MongoDB user
sleep 30
docker exec -it master-workflow-mongodb-1 mongosh -u root -p $MONGODB_ROOT_PASSWORD --authenticationDatabase admin --eval '
db.getSiblingDB("master-workflow").createUser({
  user: "masterworkflow",
  pwd: "'$MONGODB_PASSWORD'",
  roles: [
    { role: "readWrite", db: "master-workflow" },
    { role: "dbAdmin", db: "master-workflow" }
  ]
})
'
```

### Step 4: Deploy Queen Controller Nodes

```bash
# Start all 3 Queen Controller nodes
docker compose -f docker-compose.distributed.yml up -d queen-node-1 queen-node-2 queen-node-3

# Verify nodes are running
docker compose -f docker-compose.distributed.yml ps | grep queen

# Check logs
docker compose -f docker-compose.distributed.yml logs -f queen-node-1
```

### Step 5: Deploy Monitoring Stack

```bash
# Start Prometheus and Grafana
docker compose -f docker-compose.distributed.yml up -d prometheus grafana

# Access monitoring
open http://localhost:9093  # Prometheus
open http://localhost:3003  # Grafana (admin/<password from .env>)
```

### Step 6: Verify Distributed Deployment

```bash
# Check all services
docker compose -f docker-compose.distributed.yml ps

# Test load balancing - access each node
curl http://localhost:3000/health  # Node 1
curl http://localhost:3001/health  # Node 2
curl http://localhost:3002/health  # Node 3

# Check cluster status
curl http://localhost:9090/cluster/status | jq

# Verify distributed coordination
docker compose -f docker-compose.distributed.yml logs | grep "cluster"
```

---

## Production Kubernetes Deployment

### Step 1: Cluster Preparation

```bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes

# Create storage class for fast SSD (if not exists)
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/gce-pd  # Adjust for your cloud provider
parameters:
  type: pd-ssd
  replication-type: regional-pd
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
EOF
```

### Step 2: Create Namespace and Resources

```bash
# Create namespace with resource quotas
kubectl apply -f deployment/kubernetes/namespace.yaml

# Verify namespace
kubectl get namespace master-workflow
kubectl describe namespace master-workflow
```

### Step 3: Configure Secrets

```bash
# Generate secure passwords
REDIS_PASSWORD=$(openssl rand -base64 32)
MONGODB_ROOT_PASSWORD=$(openssl rand -base64 32)
MONGODB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
API_KEY=$(uuidgen)

# Create secrets
kubectl create secret generic master-workflow-secrets \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
  --from-literal=MONGODB_ROOT_PASSWORD="$MONGODB_ROOT_PASSWORD" \
  --from-literal=MONGODB_PASSWORD="$MONGODB_PASSWORD" \
  --from-literal=MONGODB_USERNAME="masterworkflow" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=API_KEY="$API_KEY" \
  --from-literal=GRAFANA_ADMIN_PASSWORD="$(openssl rand -base64 16)" \
  --namespace=master-workflow

# Verify secrets
kubectl get secrets -n master-workflow
```

### Step 4: Deploy Configuration

```bash
# Apply ConfigMaps
kubectl apply -f deployment/kubernetes/configmap.yaml

# Verify ConfigMaps
kubectl get configmap -n master-workflow
kubectl describe configmap master-workflow-config -n master-workflow
```

### Step 5: Deploy Database Layer

```bash
# Deploy Redis
kubectl apply -f deployment/kubernetes/redis-deployment.yaml

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod -l app=redis -n master-workflow --timeout=300s

# Verify Redis
kubectl get statefulset redis -n master-workflow
kubectl get pods -l app=redis -n master-workflow

# Deploy MongoDB
kubectl apply -f deployment/kubernetes/mongodb-deployment.yaml

# Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n master-workflow --timeout=300s

# Initialize MongoDB replica set (run job)
kubectl apply -f deployment/kubernetes/mongodb-deployment.yaml | grep Job

# Wait for initialization job
kubectl wait --for=condition=complete job/mongodb-replicaset-init -n master-workflow --timeout=300s

# Verify MongoDB replica set
kubectl exec -it mongodb-0 -n master-workflow -- mongosh \
  --username root \
  --password "$MONGODB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --eval "rs.status()"
```

### Step 6: Deploy Queen Controller

```bash
# Deploy Queen Controller
kubectl apply -f deployment/kubernetes/queen-controller-deployment.yaml

# Watch deployment
kubectl rollout status deployment/queen-controller -n master-workflow

# Verify deployment
kubectl get deployment queen-controller -n master-workflow
kubectl get pods -l app=queen-controller -n master-workflow
kubectl get hpa queen-controller-hpa -n master-workflow

# Check logs
kubectl logs -f deployment/queen-controller -n master-workflow
```

### Step 7: Deploy Monitoring

```bash
# Deploy Prometheus and Grafana
kubectl apply -f deployment/kubernetes/monitoring-deployment.yaml

# Wait for monitoring to be ready
kubectl wait --for=condition=ready pod -l app=prometheus -n master-workflow --timeout=300s
kubectl wait --for=condition=ready pod -l app=grafana -n master-workflow --timeout=300s

# Get Grafana admin password
kubectl get secret master-workflow-secrets -n master-workflow -o jsonpath='{.data.GRAFANA_ADMIN_PASSWORD}' | base64 -d

# Verify monitoring
kubectl get pods -l component=monitoring -n master-workflow
```

### Step 8: Configure Ingress

```bash
# Update ingress.yaml with your domain names
sed -i 's/master-workflow.example.com/your-domain.com/g' deployment/kubernetes/ingress.yaml

# Deploy ingress
kubectl apply -f deployment/kubernetes/ingress.yaml

# Get ingress IP/hostname
kubectl get ingress -n master-workflow

# Wait for SSL certificate (if using cert-manager)
kubectl get certificate -n master-workflow
```

### Step 9: Verify Production Deployment

```bash
# Check all resources
kubectl get all -n master-workflow

# Check pod status
kubectl get pods -n master-workflow -o wide

# Check services
kubectl get svc -n master-workflow

# Check persistent volumes
kubectl get pvc -n master-workflow

# Test health endpoints
INGRESS_IP=$(kubectl get ingress master-workflow-ingress -n master-workflow -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -k https://$INGRESS_IP/health

# View logs
kubectl logs -f -l app=queen-controller -n master-workflow --tail=100
```

### Step 10: Enable Autoscaling

```bash
# Verify HPA
kubectl get hpa -n master-workflow

# Describe HPA
kubectl describe hpa queen-controller-hpa -n master-workflow

# Monitor autoscaling
watch kubectl get hpa -n master-workflow
```

---

## Cloud Provider Deployments

### AWS EKS Deployment

#### Prerequisites
```bash
# Install eksctl
brew install eksctl  # macOS
# or download from: https://github.com/weaveworks/eksctl

# Configure AWS CLI
aws configure

# Verify access
aws sts get-caller-identity
```

#### Step 1: Create EKS Cluster
```bash
# Navigate to AWS deployment directory
cd deployment/aws

# Review and customize cluster configuration
vim eks-cluster.yaml

# Create cluster (takes 15-20 minutes)
eksctl create cluster -f eks-cluster.yaml

# Update kubeconfig
aws eks update-kubeconfig --name master-workflow-cluster --region us-east-1

# Verify cluster
kubectl get nodes
```

#### Step 2: Install AWS Load Balancer Controller
```bash
# Create IAM policy
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam-policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=master-workflow-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=master-workflow-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

#### Step 3: Deploy to EKS
```bash
# Follow standard Kubernetes deployment steps
cd ../kubernetes
kubectl apply -f namespace.yaml

# Create secrets
kubectl create secret generic master-workflow-secrets \
  --from-literal=REDIS_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGODB_ROOT_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGODB_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGODB_USERNAME="masterworkflow" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=API_KEY="$(uuidgen)" \
  --namespace=master-workflow

# Deploy components
kubectl apply -f configmap.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f queen-controller-deployment.yaml
kubectl apply -f monitoring-deployment.yaml

# Deploy ALB ingress
cd ../aws
kubectl apply -f alb-ingress.yaml
```

#### Step 4: Use Managed Services (Optional)
```bash
# Deploy ElastiCache Redis instead of self-hosted
aws cloudformation create-stack \
  --stack-name mw-redis \
  --template-body file://elasticache-redis.yaml \
  --parameters \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=SubnetIds,ParameterValue="subnet-xxxxx\\,subnet-yyyyy"

# Get Redis endpoint
aws cloudformation describe-stacks --stack-name mw-redis \
  --query 'Stacks[0].Outputs[?OutputKey==`RedisPrimaryEndpoint`].OutputValue' \
  --output text

# Update ConfigMap with ElastiCache endpoint
kubectl patch configmap master-workflow-config -n master-workflow \
  --patch '{"data":{"REDIS_HOST":"<elasticache-endpoint>"}}'
```

### GCP GKE Deployment

#### Prerequisites
```bash
# Install gcloud
# Download from: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable container.googleapis.com
gcloud services enable redis.googleapis.com
```

#### Step 1: Create GKE Cluster
```bash
# Navigate to GCP deployment directory
cd deployment/gcp

# Create cluster using gcloud (alternative to YAML)
gcloud container clusters create master-workflow-cluster \
  --region us-central1 \
  --release-channel regular \
  --machine-type n2-standard-8 \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10 \
  --enable-network-policy \
  --enable-ip-alias \
  --enable-autorepair \
  --enable-autoupgrade \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver

# Get credentials
gcloud container clusters get-credentials master-workflow-cluster --region us-central1

# Verify cluster
kubectl get nodes
```

#### Step 2: Add GPU Node Pool (Optional)
```bash
gcloud container node-pools create gpu-pool \
  --cluster master-workflow-cluster \
  --region us-central1 \
  --machine-type n1-standard-8 \
  --accelerator type=nvidia-tesla-t4,count=1 \
  --num-nodes 1 \
  --min-nodes 0 \
  --max-nodes 5 \
  --enable-autoscaling \
  --node-labels accelerator=nvidia-gpu \
  --node-taints nvidia.com/gpu=true:NoSchedule
```

#### Step 3: Deploy to GKE
```bash
# Follow standard Kubernetes deployment
cd ../kubernetes
kubectl apply -f namespace.yaml
# ... continue with standard deployment steps
```

#### Step 4: Use Memorystore (Optional)
```bash
# Create Memorystore Redis
gcloud redis instances create master-workflow-redis \
  --size=16 \
  --region=us-central1 \
  --tier=STANDARD_HA \
  --redis-version=redis_7_0 \
  --network=default \
  --connect-mode=PRIVATE_SERVICE_ACCESS \
  --enable-auth

# Get connection details
gcloud redis instances describe master-workflow-redis --region=us-central1

# Update ConfigMap
kubectl patch configmap master-workflow-config -n master-workflow \
  --patch '{"data":{"REDIS_HOST":"<memorystore-ip>"}}'
```

### Azure AKS Deployment

#### Prerequisites
```bash
# Install Azure CLI
# Download from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Set subscription
az account set --subscription "Your Subscription"
```

#### Step 1: Create Resource Group
```bash
az group create \
  --name master-workflow-rg \
  --location eastus
```

#### Step 2: Create AKS Cluster
```bash
# Create cluster
az aks create \
  --resource-group master-workflow-rg \
  --name master-workflow-cluster \
  --location eastus \
  --kubernetes-version 1.28.0 \
  --node-count 3 \
  --node-vm-size Standard_D8s_v3 \
  --enable-managed-identity \
  --enable-addons monitoring \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 10 \
  --network-plugin azure \
  --network-policy calico \
  --zones 1 2 3

# Get credentials
az aks get-credentials \
  --resource-group master-workflow-rg \
  --name master-workflow-cluster

# Verify cluster
kubectl get nodes
```

#### Step 3: Add GPU Node Pool (Optional)
```bash
az aks nodepool add \
  --resource-group master-workflow-rg \
  --cluster-name master-workflow-cluster \
  --name gpupool \
  --node-count 1 \
  --node-vm-size Standard_NC6s_v3 \
  --enable-cluster-autoscaler \
  --min-count 0 \
  --max-count 5 \
  --nodepool-labels accelerator=nvidia-gpu \
  --nodepool-taints nvidia.com/gpu=true:NoSchedule
```

#### Step 4: Deploy to AKS
```bash
# Follow standard Kubernetes deployment
cd deployment/kubernetes
kubectl apply -f namespace.yaml
# ... continue with standard deployment steps
```

#### Step 5: Use Azure Cache for Redis (Optional)
```bash
# Deploy Azure Cache for Redis
cd ../azure
az deployment group create \
  --resource-group master-workflow-rg \
  --template-file redis-cache.yaml

# Get connection details
az redis show \
  --name <redis-name> \
  --resource-group master-workflow-rg \
  --query "{hostname:hostName,port:sslPort,key:accessKeys.primaryKey}"
```

---

## Configuration

### Environment Variables

#### Queen Controller
```bash
# Scaling Configuration
MAX_CONCURRENT_AGENTS=4462      # Maximum concurrent agents
UNLIMITED_SCALING=true          # Enable unlimited scaling
SAFETY_LIMIT=1000              # Safety limit for agents
MEMORY_THRESHOLD=0.85          # Memory usage threshold
CPU_THRESHOLD=0.80             # CPU usage threshold

# Distributed Configuration
DISTRIBUTED_MODE=true          # Enable distributed mode
CLUSTER_NAME=master-workflow   # Cluster name
LOAD_BALANCING_STRATEGY=consistent-hashing  # Load balancing strategy

# Redis Configuration
REDIS_ENABLED=true             # Enable Redis
REDIS_HOST=redis-service       # Redis host
REDIS_PORT=6379                # Redis port
REDIS_PASSWORD=changeme        # Redis password
REDIS_DB=0                     # Redis database number
REDIS_KEY_PREFIX=mw:          # Key prefix

# MongoDB Configuration
MONGODB_ENABLED=true           # Enable MongoDB
MONGODB_HOST=mongodb-service   # MongoDB host
MONGODB_PORT=27017             # MongoDB port
MONGODB_USERNAME=masterworkflow # MongoDB username
MONGODB_PASSWORD=changeme      # MongoDB password
MONGODB_DATABASE=master-workflow # Database name

# WebSocket Configuration
WEBSOCKET_ENABLED=true         # Enable WebSocket
WEBSOCKET_PORT=8080           # WebSocket port
WEBSOCKET_PATH=/ws            # WebSocket path

# GPU Configuration
GPU_ENABLED=true              # Enable GPU acceleration
GPU_BACKEND=auto              # GPU backend (auto, cuda, webgpu, cpu)
GPU_FALLBACK_TO_CPU=true      # Fallback to CPU if GPU unavailable

# Monitoring Configuration
MONITORING_ENABLED=true        # Enable monitoring
METRICS_PORT=9090             # Metrics port
PROMETHEUS_ENABLED=true        # Enable Prometheus
GRAFANA_ENABLED=true          # Enable Grafana

# Logging Configuration
LOG_LEVEL=info                # Log level (debug, info, warn, error)
LOG_FORMAT=json               # Log format (json, text)

# Node.js Configuration
NODE_ENV=production           # Environment (development, production)
NODE_OPTIONS=--max-old-space-size=8192  # Node.js options
```

### ConfigMap Customization

Edit `deployment/kubernetes/configmap.yaml` to customize configuration.

### Secrets Management

#### Best Practices
1. **Never commit secrets to version control**
2. **Use strong passwords** (minimum 32 characters)
3. **Rotate secrets regularly** (every 90 days)
4. **Use external secret managers** (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)

#### External Secrets Integration

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace

# Create SecretStore (AWS example)
cat <<EOF | kubectl apply -f -
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: master-workflow
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
EOF

# Create ExternalSecret
cat <<EOF | kubectl apply -f -
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: master-workflow-secrets
  namespace: master-workflow
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: master-workflow-secrets
    creationPolicy: Owner
  data:
  - secretKey: REDIS_PASSWORD
    remoteRef:
      key: master-workflow/redis
      property: password
  # ... other secrets
EOF
```

---

## Security Best Practices

### Network Security

#### Network Policies
Network policies are included in `ingress.yaml` to restrict traffic between components.

#### TLS/SSL Configuration
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Pod Security

#### Security Context
All deployments include security contexts:
- Non-root user execution
- Read-only root filesystem
- No privilege escalation

#### Pod Security Policies
```bash
# Create Pod Security Policy
cat <<EOF | kubectl apply -f -
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: master-workflow-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
  - ALL
  runAsUser:
    rule: MustRunAsNonRoot
  fsGroup:
    rule: RunAsAny
  seLinux:
    rule: RunAsAny
  volumes:
  - configMap
  - emptyDir
  - projected
  - secret
  - downwardAPI
  - persistentVolumeClaim
EOF
```

### RBAC Configuration

```bash
# Create ServiceAccount
kubectl create serviceaccount master-workflow-sa -n master-workflow

# Create Role
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: master-workflow-role
  namespace: master-workflow
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets"]
  verbs: ["get", "list", "watch"]
EOF

# Create RoleBinding
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: master-workflow-rolebinding
  namespace: master-workflow
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: master-workflow-role
subjects:
- kind: ServiceAccount
  name: master-workflow-sa
  namespace: master-workflow
EOF
```

### Secrets Encryption at Rest

#### Enable encryption in EKS
```bash
# Create KMS key
aws kms create-key --description "EKS secrets encryption"

# Enable encryption
aws eks associate-encryption-config \
  --cluster-name master-workflow-cluster \
  --encryption-config '[{"resources":["secrets"],"provider":{"keyArn":"arn:aws:kms:region:account:key/key-id"}}]'
```

#### Enable encryption in GKE
```bash
# Create KMS keyring and key
gcloud kms keyrings create master-workflow \
  --location us-central1

gcloud kms keys create gke-secrets \
  --location us-central1 \
  --keyring master-workflow \
  --purpose encryption

# Create cluster with encryption
gcloud container clusters create ... \
  --database-encryption-key projects/PROJECT_ID/locations/us-central1/keyRings/master-workflow/cryptoKeys/gke-secrets
```

---

## Monitoring and Observability

### Prometheus Metrics

#### Available Metrics
```
# Agent metrics
master_workflow_agents_active           # Current active agents
master_workflow_agents_total            # Total agents spawned
master_workflow_agent_spawn_duration    # Agent spawn duration
master_workflow_agent_completion_time   # Agent task completion time

# Resource metrics
master_workflow_memory_usage            # Memory utilization (0-1)
master_workflow_cpu_usage              # CPU utilization (0-1)

# Task metrics
master_workflow_tasks_completed        # Total tasks completed
master_workflow_task_rate              # Tasks per minute
master_workflow_task_errors_total      # Task errors

# Distributed metrics
master_workflow_cluster_nodes          # Number of cluster nodes
master_workflow_cluster_latency        # Cross-node latency
master_workflow_agents_migrated        # Agent migrations
```

#### Custom Alerts

```yaml
# Add to deployment/kubernetes/monitoring-deployment.yaml
groups:
- name: master_workflow_critical
  interval: 30s
  rules:
  - alert: HighAgentFailureRate
    expr: rate(master_workflow_agent_errors_total[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High agent failure rate"
      description: "Agent failure rate is {{ $value }} per second"

  - alert: ClusterNodeDown
    expr: up{job="queen-controller"} == 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Cluster node is down"
      description: "Queen Controller node {{ $labels.instance }} is down"
```

### Grafana Dashboards

#### Import Dashboards

```bash
# Access Grafana
kubectl port-forward -n master-workflow svc/grafana-service 3000:3000

# Navigate to http://localhost:3000
# Login: admin / <password from secret>

# Import pre-built dashboards
# 1. Go to Dashboards > Import
# 2. Upload dashboard JSON or enter dashboard ID
# 3. Select Prometheus datasource
```

#### Custom Dashboard Example

```json
{
  "dashboard": {
    "title": "Master Workflow Overview",
    "panels": [
      {
        "id": 1,
        "title": "Active Agents",
        "type": "graph",
        "targets": [{
          "expr": "master_workflow_agents_active",
          "legendFormat": "Active Agents"
        }]
      },
      {
        "id": 2,
        "title": "Resource Utilization",
        "type": "graph",
        "targets": [
          {
            "expr": "master_workflow_memory_usage * 100",
            "legendFormat": "Memory %"
          },
          {
            "expr": "master_workflow_cpu_usage * 100",
            "legendFormat": "CPU %"
          }
        ]
      }
    ]
  }
}
```

### Logging

#### Centralized Logging with ELK Stack

```bash
# Install Elasticsearch
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch \
  -n logging \
  --create-namespace \
  --set replicas=3

# Install Kibana
helm install kibana elastic/kibana \
  -n logging

# Install Filebeat
helm install filebeat elastic/filebeat \
  -n logging \
  --set daemonset.enabled=true
```

#### CloudWatch Logs (AWS)

```bash
# Install Fluent Bit
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml
```

#### Cloud Logging (GCP)

```bash
# Logging is enabled by default in GKE
# View logs in Cloud Logging console
gcloud logging read "resource.type=k8s_container AND resource.labels.namespace_name=master-workflow" --limit 50
```

---

## Scaling and Optimization

### Horizontal Pod Autoscaling

HPA is configured in `queen-controller-deployment.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: queen-controller-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: queen-controller
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Monitor HPA
```bash
# Watch HPA
watch kubectl get hpa -n master-workflow

# Describe HPA
kubectl describe hpa queen-controller-hpa -n master-workflow

# View HPA events
kubectl get events -n master-workflow --field-selector involvedObject.name=queen-controller-hpa
```

### Cluster Autoscaling

#### EKS Cluster Autoscaler
```bash
# Install Cluster Autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Annotate deployment
kubectl -n kube-system annotate deployment.apps/cluster-autoscaler \
  cluster-autoscaler.kubernetes.io/safe-to-evict="false"

# Add cluster name
kubectl -n kube-system set image deployment.apps/cluster-autoscaler \
  cluster-autoscaler=registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
```

#### GKE Cluster Autoscaler
Enabled by default in GKE node pools.

#### AKS Cluster Autoscaler
Enabled via `--enable-cluster-autoscaler` during cluster creation.

### Performance Tuning

#### Node.js Optimization
```bash
# Update Queen Controller deployment
kubectl set env deployment/queen-controller \
  NODE_OPTIONS="--max-old-space-size=16384 --max-http-header-size=16384" \
  -n master-workflow
```

#### Redis Optimization
```yaml
# Update Redis ConfigMap
redis.conf: |
  maxmemory 8gb
  maxmemory-policy allkeys-lru
  maxclients 10000
  tcp-backlog 511
  timeout 300
  tcp-keepalive 300
```

#### MongoDB Optimization
```yaml
# Update MongoDB configuration
mongod.conf: |
  storage:
    wiredTiger:
      engineConfig:
        cacheSizeGB: 4
      collectionConfig:
        blockCompressor: snappy
  net:
    maxIncomingConnections: 1000
```

### GPU Optimization

#### Enable GPU Support
```bash
# Install NVIDIA device plugin
kubectl create -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.0/nvidia-device-plugin.yml

# Verify GPU nodes
kubectl get nodes -o custom-columns=NAME:.metadata.name,GPUs:.status.capacity.nvidia\\.com/gpu
```

#### Configure GPU Workloads
```yaml
# Update Queen Controller for GPU
spec:
  template:
    spec:
      containers:
      - name: queen-controller
        resources:
          limits:
            nvidia.com/gpu: 1
```

---

## Backup and Recovery

### Backup Strategy

#### Redis Backup
```bash
# Manual backup
kubectl exec -it redis-0 -n master-workflow -- redis-cli --rdb /data/backup.rdb

# Copy backup
kubectl cp master-workflow/redis-0:/data/backup.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

#### MongoDB Backup
```bash
# Create backup
kubectl exec -it mongodb-0 -n master-workflow -- mongodump \
  --username root \
  --password $MONGODB_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --out /data/backup

# Copy backup
kubectl cp master-workflow/mongodb-0:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

#### Automated Backups with Velero
```bash
# Install Velero
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.8.0 \
  --bucket master-workflow-backups \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1

# Create backup schedule
velero schedule create master-workflow-daily \
  --schedule="0 2 * * *" \
  --include-namespaces master-workflow

# Create manual backup
velero backup create master-workflow-$(date +%Y%m%d) \
  --include-namespaces master-workflow
```

### Disaster Recovery

#### Restore from Backup
```bash
# Redis restore
kubectl cp ./redis-backup.rdb master-workflow/redis-0:/data/dump.rdb
kubectl exec -it redis-0 -n master-workflow -- redis-cli SHUTDOWN
# Pod will restart and load from dump.rdb

# MongoDB restore
kubectl cp ./mongodb-backup master-workflow/mongodb-0:/data/restore
kubectl exec -it mongodb-0 -n master-workflow -- mongorestore \
  --username root \
  --password $MONGODB_ROOT_PASSWORD \
  --authenticationDatabase admin \
  /data/restore

# Velero restore
velero restore create --from-backup master-workflow-$(date +%Y%m%d)
```

#### High Availability Setup

##### Multi-Region Deployment
```bash
# Deploy to multiple regions
eksctl create cluster -f eks-cluster-us-east-1.yaml
eksctl create cluster -f eks-cluster-eu-west-1.yaml

# Set up cross-region replication for Redis and MongoDB
# Configure global load balancer (AWS Route 53, GCP Cloud Load Balancing)
```

---

## Troubleshooting

### Common Issues

#### Issue: Pods stuck in Pending state
```bash
# Check pod events
kubectl describe pod <pod-name> -n master-workflow

# Common causes:
# 1. Insufficient resources
kubectl top nodes
kubectl describe nodes | grep -A 5 "Allocated resources"

# 2. Storage class issues
kubectl get pvc -n master-workflow
kubectl describe pvc <pvc-name> -n master-workflow

# 3. Node affinity/taints
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints
```

#### Issue: Connection to Redis/MongoDB fails
```bash
# Check service endpoints
kubectl get endpoints -n master-workflow

# Test connection from pod
kubectl run -it --rm debug --image=alpine --restart=Never -n master-workflow -- sh
apk add redis mongodb-tools
redis-cli -h redis-service ping
mongosh mongodb-service:27017

# Check network policies
kubectl get networkpolicies -n master-workflow
```

#### Issue: High memory usage
```bash
# Check resource usage
kubectl top pods -n master-workflow
kubectl top nodes

# Describe pod for OOMKilled events
kubectl describe pod <pod-name> -n master-workflow | grep -A 10 "Last State"

# Increase memory limits
kubectl set resources deployment queen-controller \
  --limits=memory=16Gi \
  --requests=memory=8Gi \
  -n master-workflow
```

#### Issue: Ingress not working
```bash
# Check ingress
kubectl get ingress -n master-workflow
kubectl describe ingress master-workflow-ingress -n master-workflow

# Check ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify DNS
nslookup your-domain.com

# Check SSL certificate
kubectl get certificate -n master-workflow
kubectl describe certificate <cert-name> -n master-workflow
```

### Debug Techniques

#### View Logs
```bash
# Pod logs
kubectl logs <pod-name> -n master-workflow
kubectl logs <pod-name> -n master-workflow --previous  # Previous container
kubectl logs -f <pod-name> -n master-workflow  # Follow logs

# All pod logs for deployment
kubectl logs -f deployment/queen-controller -n master-workflow

# Logs with timestamps
kubectl logs <pod-name> -n master-workflow --timestamps
```

#### Execute Commands in Pod
```bash
# Interactive shell
kubectl exec -it <pod-name> -n master-workflow -- sh

# Run single command
kubectl exec <pod-name> -n master-workflow -- ps aux
kubectl exec <pod-name> -n master-workflow -- netstat -tulpn
```

#### Port Forwarding
```bash
# Forward pod port
kubectl port-forward <pod-name> 3000:3000 -n master-workflow

# Forward service port
kubectl port-forward svc/queen-controller-service 3000:3000 -n master-workflow

# Access from browser
open http://localhost:3000
```

#### Resource Usage
```bash
# Current usage
kubectl top pods -n master-workflow
kubectl top nodes

# Resource requests/limits
kubectl describe pod <pod-name> -n master-workflow | grep -A 5 "Requests:"

# Node capacity
kubectl describe nodes | grep -A 5 "Capacity:"
```

### Emergency Procedures

#### Rollback Deployment
```bash
# View rollout history
kubectl rollout history deployment/queen-controller -n master-workflow

# Rollback to previous version
kubectl rollout undo deployment/queen-controller -n master-workflow

# Rollback to specific revision
kubectl rollout undo deployment/queen-controller --to-revision=2 -n master-workflow

# Check rollout status
kubectl rollout status deployment/queen-controller -n master-workflow
```

#### Scale Down During Incident
```bash
# Manually scale down
kubectl scale deployment queen-controller --replicas=1 -n master-workflow

# Disable autoscaling temporarily
kubectl patch hpa queen-controller-hpa -n master-workflow \
  -p '{"spec":{"minReplicas":1,"maxReplicas":1}}'
```

#### Emergency Maintenance Window
```bash
# Cordon nodes (prevent new pods)
kubectl cordon <node-name>

# Drain node (evict pods)
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon when done
kubectl uncordon <node-name>
```

---

## Quick Reference

### Essential Commands

```bash
# Deployment
kubectl apply -f deployment/kubernetes/
kubectl get all -n master-workflow
kubectl get pods -n master-workflow -o wide

# Logs
kubectl logs -f deployment/queen-controller -n master-workflow
kubectl logs -f -l app=queen-controller -n master-workflow --tail=100

# Status
kubectl get pods -n master-workflow
kubectl get svc -n master-workflow
kubectl get ingress -n master-workflow
kubectl get pvc -n master-workflow

# Troubleshooting
kubectl describe pod <pod-name> -n master-workflow
kubectl exec -it <pod-name> -n master-workflow -- sh
kubectl port-forward svc/queen-controller-service 3000:3000 -n master-workflow

# Scaling
kubectl scale deployment queen-controller --replicas=5 -n master-workflow
kubectl autoscale deployment queen-controller --min=3 --max=10 --cpu-percent=70 -n master-workflow

# Updates
kubectl set image deployment/queen-controller queen-controller=master-workflow:3.1 -n master-workflow
kubectl rollout status deployment/queen-controller -n master-workflow
kubectl rollout undo deployment/queen-controller -n master-workflow

# Cleanup
kubectl delete -f deployment/kubernetes/
kubectl delete namespace master-workflow
```

### Service URLs

| Service | Development | Production |
|---------|-------------|------------|
| Dashboard | http://localhost:3000 | https://master-workflow.example.com |
| WebSocket | ws://localhost:8080 | wss://master-workflow.example.com/ws |
| Prometheus | http://localhost:9090 | https://prometheus.master-workflow.example.com |
| Grafana | http://localhost:3003 | https://grafana.master-workflow.example.com |
| Redis | localhost:6379 | redis-service:6379 |
| MongoDB | localhost:27017 | mongodb-service:27017 |

### Support and Resources

- **Documentation**: https://github.com/your-org/master-workflow/tree/main/docs
- **Issues**: https://github.com/your-org/master-workflow/issues
- **Discussions**: https://github.com/your-org/master-workflow/discussions
- **Slack**: https://your-org.slack.com/channels/master-workflow

---

## Appendix

### A. Architecture Diagrams

```text
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer / Ingress                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬───────────────┐
        │            │            │               │
┌───────▼──────┐ ┌──▼──────────┐ ┌▼─────────────┐ │
│   Queen      │ │   Queen     │ │   Queen      │ │
│ Controller 1 │ │ Controller 2│ │ Controller 3 │ │
└───────┬──────┘ └──┬──────────┘ └┬─────────────┘ │
        │           │             │               │
        └───────────┼─────────────┴───────────────┘
                    │
        ┌───────────┼────────────┐
        │           │            │
    ┌───▼────┐  ┌──▼──────┐  ┌──▼──────┐
    │ Redis  │  │ MongoDB │  │  GPU    │
    │Cluster │  │ Replica │  │ Nodes   │
    └────────┘  └─────────┘  └─────────┘
```

### B. Port Reference

| Component | Port | Protocol | Purpose |
|-----------|------|----------|---------|
| Queen Controller Dashboard | 3000 | HTTP | Web UI |
| Queen Controller WebSocket | 8080 | WS | Real-time coordination |
| Queen Controller Metrics | 9090 | HTTP | Prometheus metrics |
| Redis | 6379 | TCP | Key-value store |
| Redis Cluster | 16379 | TCP | Cluster bus |
| MongoDB | 27017 | TCP | Database |
| Prometheus | 9090 | HTTP | Metrics scraping |
| Grafana | 3000 | HTTP | Visualization |

### C. Resource Requirements

#### Minimum Requirements (Development)
- CPU: 8 cores
- Memory: 16 GB RAM
- Storage: 100 GB SSD

#### Recommended Requirements (Production)
- CPU: 32+ cores (distributed across nodes)
- Memory: 128+ GB RAM (distributed across nodes)
- Storage: 1+ TB SSD (for persistent data)

#### Per-Component Requirements

| Component | CPU | Memory | Storage |
|-----------|-----|--------|---------|
| Queen Controller (per pod) | 2-4 cores | 4-8 GB | Minimal |
| Redis (per instance) | 0.5-2 cores | 1-4 GB | 50 GB |
| MongoDB (per instance) | 1-4 cores | 2-8 GB | 100 GB |
| Prometheus | 0.5-2 cores | 2-4 GB | 100 GB |
| Grafana | 0.25-1 core | 0.5-2 GB | 10 GB |

### D. Version Compatibility Matrix

| Master Workflow | Kubernetes | Docker | Redis | MongoDB | Node.js |
|----------------|------------|--------|-------|---------|---------|
| 3.0 | 1.24-1.28 | 24.0+ | 7.0-7.2 | 6.0+ | 18.0+ |

### E. Glossary

- **Queen Controller**: Central orchestration engine managing all agents
- **Agent**: Autonomous execution unit for specific tasks
- **Distributed Coordinator**: Component enabling multi-node coordination
- **GPU Accelerator**: Component providing GPU-accelerated neural computations
- **HPA**: Horizontal Pod Autoscaler - scales pods based on metrics
- **StatefulSet**: Kubernetes workload for stateful applications
- **PVC**: PersistentVolumeClaim - storage request
- **ConfigMap**: Kubernetes configuration object
- **Secret**: Kubernetes secret object for sensitive data

---

**Document Version**: 3.0.0
**Last Updated**: 2025-11-20
**Author**: Master Workflow Team
