# Master Workflow 3.0 - Deployment Templates

## Overview

This directory contains comprehensive deployment templates for Master Workflow 3.0, supporting multiple deployment scenarios from local development to production cloud deployments.

## Quick Start

### Choose Your Deployment

| Deployment Type | Use Case | Directory | Quick Start |
|----------------|----------|-----------|-------------|
| **Local Development** | Development & Testing | `docker/` | `docker compose -f docker/docker-compose.dev.yml up` |
| **Multi-Node Docker** | Staging & Testing | `docker/` | `docker compose -f docker/docker-compose.distributed.yml up` |
| **Kubernetes** | Production | `kubernetes/` | `kubectl apply -f kubernetes/` |
| **AWS EKS** | Cloud Production | `aws/` | `eksctl create cluster -f aws/eks-cluster.yaml` |
| **GCP GKE** | Cloud Production | `gcp/` | `gcloud container clusters create -f gcp/gke-cluster.yaml` |
| **Azure AKS** | Cloud Production | `azure/` | `az aks create --config azure/aks-cluster.yaml` |

## Directory Structure

```text
deployment/
├── README.md                           # This file
├── DEPLOYMENT-GUIDE.md                 # Comprehensive deployment guide
│
├── kubernetes/                         # Kubernetes deployments
│   ├── namespace.yaml                  # Namespace with quotas
│   ├── configmap.yaml                  # Configuration
│   ├── secrets-template.yaml           # Secrets template
│   ├── redis-deployment.yaml           # Redis StatefulSet
│   ├── mongodb-deployment.yaml         # MongoDB StatefulSet
│   ├── queen-controller-deployment.yaml # Queen Controller Deployment
│   ├── monitoring-deployment.yaml      # Prometheus + Grafana
│   └── ingress.yaml                    # Ingress + Network Policies
│
├── docker/                             # Docker Compose deployments
│   ├── Dockerfile                      # Container image
│   ├── .dockerignore                   # Docker ignore file
│   ├── docker-compose.dev.yml          # Development environment
│   ├── docker-compose.distributed.yml  # Multi-node deployment
│   ├── docker-compose.prod.yml         # Production deployment
│   ├── prometheus.yml                  # Prometheus configuration
│   └── grafana-datasources.yml         # Grafana datasources
│
├── aws/                                # AWS EKS deployments
│   ├── eks-cluster.yaml                # EKS cluster configuration
│   ├── alb-ingress.yaml                # ALB Ingress
│   └── elasticache-redis.yaml          # ElastiCache (optional)
│
├── gcp/                                # GCP GKE deployments
│   ├── gke-cluster.yaml                # GKE cluster configuration
│   └── memorystore-redis.yaml          # Memorystore (optional)
│
└── azure/                              # Azure AKS deployments
    ├── aks-cluster.yaml                # AKS cluster configuration
    └── redis-cache.yaml                # Azure Cache for Redis (optional)
```

## Quick Start Commands

### 1. Local Development (Single Node)

```bash
# Navigate to deployment directory
cd deployment/docker

# Start development environment
docker compose -f docker-compose.dev.yml up -d

# Access services
# - Dashboard: http://localhost:3000
# - WebSocket: ws://localhost:8080
# - Metrics: http://localhost:9090
# - Redis Commander: http://localhost:8081
# - Mongo Express: http://localhost:8082

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop environment
docker compose -f docker-compose.dev.yml down
```

### 2. Multi-Node Distributed (3 Nodes)

```bash
# Set environment variables
cat > deployment/docker/.env <<EOF
REDIS_PASSWORD=$(openssl rand -base64 32)
MONGODB_ROOT_PASSWORD=$(openssl rand -base64 32)
MONGODB_PASSWORD=$(openssl rand -base64 32)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 16)
EOF

# Start distributed cluster
cd deployment/docker
docker compose -f docker-compose.distributed.yml up -d

# Access services (3 Queen Controller nodes)
# - Node 1: http://localhost:3000
# - Node 2: http://localhost:3001
# - Node 3: http://localhost:3002
# - Prometheus: http://localhost:9093
# - Grafana: http://localhost:3003

# Check cluster status
docker compose -f docker-compose.distributed.yml ps

# Stop cluster
docker compose -f docker-compose.distributed.yml down
```

### 3. Kubernetes Production

```bash
# Create namespace
kubectl apply -f deployment/kubernetes/namespace.yaml

# Create secrets (replace with actual passwords)
kubectl create secret generic master-workflow-secrets \
  --from-literal=REDIS_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGODB_ROOT_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGODB_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGODB_USERNAME="masterworkflow" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=API_KEY="$(uuidgen)" \
  --namespace=master-workflow

# Deploy all components
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/redis-deployment.yaml
kubectl apply -f deployment/kubernetes/mongodb-deployment.yaml
kubectl apply -f deployment/kubernetes/queen-controller-deployment.yaml
kubectl apply -f deployment/kubernetes/monitoring-deployment.yaml
kubectl apply -f deployment/kubernetes/ingress.yaml

# Check deployment status
kubectl get all -n master-workflow

# Get service URLs
kubectl get ingress -n master-workflow

# View logs
kubectl logs -f deployment/queen-controller -n master-workflow
```

### 4. AWS EKS

```bash
# Create EKS cluster (takes 15-20 minutes)
cd deployment/aws
eksctl create cluster -f eks-cluster.yaml

# Configure kubectl
aws eks update-kubeconfig --name master-workflow-cluster --region us-east-1

# Deploy to EKS (follow Kubernetes steps above)
cd ../kubernetes
kubectl apply -f namespace.yaml
# ... continue with Kubernetes deployment steps

# Optional: Deploy ElastiCache Redis
cd ../aws
aws cloudformation create-stack \
  --stack-name mw-redis \
  --template-body file://elasticache-redis.yaml
```

### 5. GCP GKE

```bash
# Create GKE cluster
cd deployment/gcp
gcloud container clusters create master-workflow-cluster \
  --region us-central1 \
  --machine-type n2-standard-8 \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials master-workflow-cluster --region us-central1

# Deploy to GKE (follow Kubernetes steps)
cd ../kubernetes
kubectl apply -f namespace.yaml
# ... continue with Kubernetes deployment steps

# Optional: Create Memorystore Redis
cd ../gcp
gcloud redis instances create master-workflow-redis \
  --size=16 \
  --region=us-central1 \
  --tier=STANDARD_HA \
  --redis-version=redis_7_0
```

### 6. Azure AKS

```bash
# Create resource group
az group create --name master-workflow-rg --location eastus

# Create AKS cluster
cd deployment/azure
az aks create \
  --resource-group master-workflow-rg \
  --name master-workflow-cluster \
  --location eastus \
  --kubernetes-version 1.28.0 \
  --node-count 3 \
  --node-vm-size Standard_D8s_v3 \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 10

# Get credentials
az aks get-credentials \
  --resource-group master-workflow-rg \
  --name master-workflow-cluster

# Deploy to AKS (follow Kubernetes steps)
cd ../kubernetes
kubectl apply -f namespace.yaml
# ... continue with Kubernetes deployment steps
```

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer / Ingress                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬───────────────┐
        │            │            │               │
┌───────▼──────┐ ┌──▼──────────┐ ┌▼─────────────┐
│   Queen      │ │   Queen     │ │   Queen      │
│ Controller 1 │ │ Controller 2│ │ Controller 3 │
│ (3000, 8080, │ │ (3001, 8081,│ │ (3002, 8082,│
│  9090)       │ │  9091)      │ │  9092)      │
└───────┬──────┘ └──┬──────────┘ └┬─────────────┘
        │           │             │
        └───────────┼─────────────┴───────────────┐
                    │                             │
        ┌───────────▼────────────┐   ┌───────────▼──────────┐
        │  Redis Cluster (3)     │   │  MongoDB Replica (3) │
        │  - redis-1:6379        │   │  - mongodb-1:27017   │
        │  - redis-2:6380        │   │  - mongodb-2:27018   │
        │  - redis-3:6381        │   │  - mongodb-3:27019   │
        └────────────────────────┘   └──────────────────────┘
                    │
        ┌───────────┴─────────────┐
        │  Monitoring Stack       │
        │  - Prometheus:9093      │
        │  - Grafana:3003         │
        └─────────────────────────┘
```

## Key Features

### Distributed Coordination
- **Multi-Node Support**: Deploy 3+ Queen Controller nodes for high availability
- **Redis Clustering**: Distributed state management with sub-10ms latency
- **MongoDB Replica Set**: Persistent storage with automatic failover
- **Load Balancing**: Consistent hashing for optimal agent distribution

### Scalability
- **4,462 Concurrent Agents**: Support for massive parallel execution
- **42+ Agent Types**: Specialized agents for different tasks
- **Horizontal Pod Autoscaling**: Automatic scaling based on CPU/memory
- **Cluster Autoscaling**: Node-level scaling for Kubernetes

### High Availability
- **Multi-Replica Deployments**: 3+ replicas for all critical components
- **Automatic Failover**: Redis and MongoDB automatic failover
- **Health Checks**: Liveness and readiness probes
- **Pod Disruption Budgets**: Ensure minimum availability during updates

### Monitoring & Observability
- **Prometheus Metrics**: Comprehensive metrics collection
- **Grafana Dashboards**: Real-time visualization
- **Advanced Monitoring Dashboard**: WebSocket-based live dashboard
- **Alerting**: Configurable alerts for critical issues

### Security
- **Network Policies**: Restrict traffic between components
- **TLS/SSL**: HTTPS/WSS with certificate management
- **RBAC**: Role-based access control
- **Secrets Management**: Kubernetes secrets with external secret support
- **Pod Security**: Security contexts, non-root users, read-only filesystems

### GPU Support
- **GPU Acceleration**: Optional GPU support for neural computations
- **NVIDIA GPU**: Support for NVIDIA GPUs via device plugin
- **Auto-Fallback**: Graceful fallback to CPU if GPU unavailable

## System Requirements

### Minimum (Development)
- **CPU**: 8 cores
- **Memory**: 16 GB RAM
- **Storage**: 100 GB SSD
- **Docker**: 24.0+
- **Kubernetes**: 1.24+ (for K8s deployment)

### Recommended (Production)
- **CPU**: 32+ cores (distributed across nodes)
- **Memory**: 128+ GB RAM (distributed across nodes)
- **Storage**: 1+ TB SSD
- **Kubernetes**: 1.24+
- **Cloud**: AWS/GCP/Azure account

## Component Versions

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime for Queen Controller |
| Redis | 7.2+ | Distributed state management |
| MongoDB | 6.0+ | Persistent storage |
| Prometheus | 2.48+ | Metrics collection |
| Grafana | 10.2+ | Visualization |
| Kubernetes | 1.24-1.28 | Container orchestration |
| Docker | 24.0+ | Container runtime |

## Configuration

### Environment Variables

Key configuration variables (see `DEPLOYMENT-GUIDE.md` for complete list):

```bash
# Scaling
MAX_CONCURRENT_AGENTS=4462
UNLIMITED_SCALING=true
SAFETY_LIMIT=1000

# Distributed Mode
DISTRIBUTED_MODE=true
CLUSTER_NAME=master-workflow-cluster
LOAD_BALANCING_STRATEGY=consistent-hashing

# Redis
REDIS_HOST=redis-service
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>

# MongoDB
MONGODB_HOST=mongodb-service
MONGODB_PORT=27017
MONGODB_USERNAME=masterworkflow
MONGODB_PASSWORD=<secure-password>

# GPU
GPU_ENABLED=true
GPU_BACKEND=auto  # auto, cuda, webgpu, cpu
```

### Secrets

Create secrets before deployment:

```bash
# Generate secure passwords
REDIS_PASSWORD=$(openssl rand -base64 32)
MONGODB_ROOT_PASSWORD=$(openssl rand -base64 32)
MONGODB_PASSWORD=$(openssl rand -base64 32)

# Store in Kubernetes secrets
kubectl create secret generic master-workflow-secrets \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
  --from-literal=MONGODB_ROOT_PASSWORD="$MONGODB_ROOT_PASSWORD" \
  --from-literal=MONGODB_PASSWORD="$MONGODB_PASSWORD" \
  --from-literal=MONGODB_USERNAME="masterworkflow" \
  --namespace=master-workflow
```

## Monitoring

### Access Dashboards

| Dashboard | Development | Production |
|-----------|-------------|------------|
| Main Dashboard | http://localhost:3000 | https://master-workflow.example.com |
| Prometheus | http://localhost:9093 | https://prometheus.master-workflow.example.com |
| Grafana | http://localhost:3003 | https://grafana.master-workflow.example.com |

### Key Metrics

- `master_workflow_agents_active` - Current active agents
- `master_workflow_memory_usage` - Memory utilization
- `master_workflow_cpu_usage` - CPU utilization
- `master_workflow_tasks_completed` - Total tasks completed
- `master_workflow_cluster_nodes` - Number of cluster nodes

## Troubleshooting

### Common Issues

#### Pods not starting
```bash
# Check pod status
kubectl get pods -n master-workflow

# View pod events
kubectl describe pod <pod-name> -n master-workflow

# Check logs
kubectl logs <pod-name> -n master-workflow
```

#### Connection issues
```bash
# Test Redis connection
kubectl run -it --rm redis-test --image=redis:alpine --restart=Never -n master-workflow -- redis-cli -h redis-service ping

# Test MongoDB connection
kubectl run -it --rm mongo-test --image=mongo:6.0 --restart=Never -n master-workflow -- mongosh mongodb-service:27017
```

#### Resource issues
```bash
# Check resource usage
kubectl top pods -n master-workflow
kubectl top nodes

# Check resource limits
kubectl describe pod <pod-name> -n master-workflow | grep -A 5 "Limits:"
```

See `DEPLOYMENT-GUIDE.md` for comprehensive troubleshooting.

## Backup and Recovery

### Backup

```bash
# Redis backup
kubectl exec -it redis-0 -n master-workflow -- redis-cli --rdb /data/backup.rdb

# MongoDB backup
kubectl exec -it mongodb-0 -n master-workflow -- mongodump --out /data/backup
```

### Restore

```bash
# Redis restore
kubectl cp ./backup.rdb master-workflow/redis-0:/data/dump.rdb

# MongoDB restore
kubectl exec -it mongodb-0 -n master-workflow -- mongorestore /data/backup
```

## Scaling

### Manual Scaling

```bash
# Scale Queen Controller
kubectl scale deployment queen-controller --replicas=5 -n master-workflow

# Scale Redis
kubectl scale statefulset redis --replicas=5 -n master-workflow

# Scale MongoDB
kubectl scale statefulset mongodb --replicas=5 -n master-workflow
```

### Auto-Scaling

Horizontal Pod Autoscaler is configured in `queen-controller-deployment.yaml`:
- Min replicas: 3
- Max replicas: 10
- Target CPU: 70%
- Target Memory: 80%

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong passwords** (minimum 32 characters)
3. **Enable TLS/SSL** for all external traffic
4. **Use network policies** to restrict inter-pod communication
5. **Enable RBAC** with least privilege
6. **Rotate secrets regularly** (every 90 days)
7. **Use external secret managers** (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
8. **Enable pod security policies**
9. **Use non-root containers**
10. **Enable audit logging**

## Documentation

- **Comprehensive Guide**: See `DEPLOYMENT-GUIDE.md` for detailed instructions
- **Architecture**: Phase 8 summary at `/END-OF-PHASE-SUMMARIES/PHASE-EIGHT/`
- **Code**: Main codebase at `/.ai-workflow/intelligence-engine/`

## Support

For issues, questions, or contributions:
- **GitHub Issues**: https://github.com/your-org/master-workflow/issues
- **Documentation**: https://github.com/your-org/master-workflow/tree/main/docs
- **Discussions**: https://github.com/your-org/master-workflow/discussions

## Version

- **Master Workflow**: 3.0.0
- **Deployment Templates**: 3.0.0
- **Last Updated**: 2025-11-20

---

**Quick Reference**: See `DEPLOYMENT-GUIDE.md` for complete documentation
