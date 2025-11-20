# Master Workflow 3.0 - Environment Variables Documentation

## Overview
This document lists all required and optional environment variables for Master Workflow 3.0 deployment. These variables are used across Docker Compose and Kubernetes deployments to secure credentials and enable configuration flexibility.

## Security Note
**IMPORTANT**: Never commit `.env` files with production credentials to version control. Use secure secret management systems (e.g., Kubernetes Secrets, HashiCorp Vault, AWS Secrets Manager) for production deployments.

## Required Environment Variables

### Redis Configuration
| Variable | Description | Default (Dev) | Required (Prod) |
|----------|-------------|---------------|-----------------|
| `REDIS_PASSWORD` | Redis authentication password | `devpassword` | **Yes** |

**Security Notes**:
- Redis uses `requirepass` for authentication
- Dangerous commands (`FLUSHALL`, `FLUSHDB`, `CONFIG`, `SHUTDOWN`) are renamed to prevent unauthorized access
- In production, use a strong password (min. 32 characters, alphanumeric + special chars)

### MongoDB Configuration
| Variable | Description | Default (Dev) | Required (Prod) |
|----------|-------------|---------------|-----------------|
| `MONGODB_ROOT_USERNAME` | MongoDB root username | `root` | **Yes** |
| `MONGODB_ROOT_PASSWORD` | MongoDB root password | `devpassword` | **Yes** |
| `MONGODB_USERNAME` | Application database username | `masterworkflow` | **Yes** |
| `MONGODB_PASSWORD` | Application database password | `changeme` | **Yes** |
| `MONGODB_DATABASE` | Application database name | `master-workflow` | No |
| `MONGODB_REPLICA_SET` | MongoDB replica set name | `master-workflow-rs` | No |

**Security Notes**:
- Use separate credentials for root and application users
- Application user should have minimal required permissions (readWrite, dbAdmin)
- In production, use strong passwords (min. 24 characters)

### Grafana Configuration
| Variable | Description | Default (Dev) | Required (Prod) |
|----------|-------------|---------------|-----------------|
| `GRAFANA_ADMIN_USER` | Grafana admin username | `admin` | No |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | `admin` | **Yes** |
| `GRAFANA_SECRET_KEY` | Grafana secret key for sessions | - | **Yes** (Prod) |

**Security Notes**:
- Change default admin password immediately
- `GRAFANA_SECRET_KEY` should be a random 32+ character string
- Grafana password is **required** (not optional) in Kubernetes deployments

### Application Security (Production)
| Variable | Description | Default (Dev) | Required (Prod) |
|----------|-------------|---------------|-----------------|
| `JWT_SECRET` | JWT token signing secret | - | **Yes** |
| `API_KEY` | API authentication key | - | **Yes** |

## Optional Environment Variables

### MongoDB GUI (Development Only)
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_EXPRESS_USERNAME` | Mongo Express basic auth username | `admin` |
| `MONGO_EXPRESS_PASSWORD` | Mongo Express basic auth password | `admin` |

### Queen Controller Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_CONCURRENT_AGENTS` | Maximum concurrent agents | `4462` |
| `SAFETY_LIMIT` | Safety limit for agent spawning | `1000` |
| `MEMORY_THRESHOLD` | Memory usage threshold (0-1) | `0.85` |
| `CPU_THRESHOLD` | CPU usage threshold (0-1) | `0.80` |
| `DISTRIBUTED_MODE` | Enable distributed mode | `false` |
| `CLUSTER_NAME` | Cluster identifier | `master-workflow-prod` |
| `GPU_ENABLED` | Enable GPU support | `true` |
| `GPU_BACKEND` | GPU backend (auto/cuda/opencl) | `auto` |

### WebSocket Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `WEBSOCKET_ENABLED` | Enable WebSocket server | `true` |
| `WEBSOCKET_PORT` | WebSocket server port | `8080` |
| `WS_PORT` | Alternative WebSocket port | `8080` |

### Monitoring Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `MONITORING_ENABLED` | Enable monitoring integration | `true` |
| `METRICS_PORT` | Prometheus metrics port | `9090` |

## Environment File Examples

### Development `.env` Example
```bash
# Redis
REDIS_PASSWORD=devpassword

# MongoDB
MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=devpassword
MONGODB_USERNAME=masterworkflow
MONGODB_PASSWORD=devpassword
MONGODB_DATABASE=master-workflow
MONGODB_REPLICA_SET=master-workflow-rs

# Grafana
GRAFANA_ADMIN_PASSWORD=admin

# Mongo Express (Dev Only)
MONGO_EXPRESS_USERNAME=admin
MONGO_EXPRESS_PASSWORD=admin
```

### Production `.env` Example
```bash
# Redis (Use strong passwords!)
REDIS_PASSWORD=<GENERATE_STRONG_PASSWORD_HERE>

# MongoDB (Use strong passwords!)
MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=<GENERATE_STRONG_PASSWORD_HERE>
MONGODB_USERNAME=masterworkflow
MONGODB_PASSWORD=<GENERATE_STRONG_PASSWORD_HERE>
MONGODB_DATABASE=master-workflow
MONGODB_REPLICA_SET=master-workflow-rs

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<GENERATE_STRONG_PASSWORD_HERE>
GRAFANA_SECRET_KEY=<GENERATE_RANDOM_32_CHAR_STRING>

# Application Security
JWT_SECRET=<GENERATE_RANDOM_64_CHAR_STRING>
API_KEY=<GENERATE_RANDOM_API_KEY>

# Optional: Custom cluster configuration
MAX_CONCURRENT_AGENTS=4462
DISTRIBUTED_MODE=true
CLUSTER_NAME=master-workflow-production
```

## Generating Secure Passwords

### Using OpenSSL (Linux/Mac)
```bash
# Generate 32-character password
openssl rand -base64 32

# Generate 64-character password
openssl rand -base64 64
```

### Using Python
```python
import secrets
import string

# Generate 32-character alphanumeric + special chars password
alphabet = string.ascii_letters + string.digits + string.punctuation
password = ''.join(secrets.choice(alphabet) for i in range(32))
print(password)
```

### Using Node.js
```javascript
const crypto = require('crypto');

// Generate 32-character password
const password = crypto.randomBytes(32).toString('base64');
console.log(password);
```

## Kubernetes Secrets

For Kubernetes deployments, create secrets using:

```bash
# Create secret from literal values
kubectl create secret generic master-workflow-secrets \
  --namespace=master-workflow \
  --from-literal=REDIS_PASSWORD=<strong-password> \
  --from-literal=MONGODB_ROOT_PASSWORD=<strong-password> \
  --from-literal=MONGODB_USERNAME=masterworkflow \
  --from-literal=MONGODB_PASSWORD=<strong-password> \
  --from-literal=GRAFANA_ADMIN_PASSWORD=<strong-password>

# Or from .env file (ensure .env is in .gitignore!)
kubectl create secret generic master-workflow-secrets \
  --namespace=master-workflow \
  --from-env-file=.env.production
```

## Security Best Practices

1. **Never use default passwords in production**
2. **Rotate credentials regularly** (every 90 days recommended)
3. **Use separate credentials for development and production**
4. **Store production secrets in secure secret management systems**
5. **Enable audit logging for credential access**
6. **Use encryption at rest for sensitive data**
7. **Implement least-privilege access for application users**
8. **Monitor for unauthorized access attempts**

## Backward Compatibility

All environment variables have sensible defaults to maintain backward compatibility with existing deployments:
- Development deployments continue to work with default `devpassword` values
- Production deployments **must** set strong passwords explicitly
- No breaking changes to existing configurations

## Migration from Hardcoded Credentials

If migrating from a deployment with hardcoded credentials:

1. Create `.env` file with current credentials
2. Test deployment with `.env` file in development
3. Generate new strong passwords for production
4. Update Kubernetes secrets or Docker environment files
5. Restart services to apply new credentials
6. Verify all services connect successfully
7. Document credentials in secure password manager

## Troubleshooting

### Redis Connection Issues
- Verify `REDIS_PASSWORD` matches across all services
- Check health check uses correct password: `redis-cli -a ${REDIS_PASSWORD} ping`
- Ensure Redis Commander includes password in connection string

### MongoDB Connection Issues
- Verify `MONGODB_ROOT_PASSWORD` and `MONGODB_PASSWORD` are set correctly
- Check replica set name matches `MONGODB_REPLICA_SET` environment variable
- Ensure application user has correct permissions on database

### Grafana Access Issues
- Verify `GRAFANA_ADMIN_PASSWORD` is set (required in Kubernetes)
- Check if password meets Grafana's complexity requirements
- Reset admin password if locked out (see Grafana documentation)

## References

- [Redis Security Documentation](https://redis.io/docs/management/security/)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [Grafana Security](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
