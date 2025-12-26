# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Collaborative Workspace Backend in a cloud-ready, scalable architecture.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured to access your cluster
- Container registry with your Docker image
- Ingress controller (nginx-ingress recommended)
- cert-manager (optional, for TLS certificates)

## Architecture Overview

The Kubernetes deployment includes:

- **Namespace**: Isolated environment for the application
- **ConfigMap**: Non-sensitive configuration
- **Secrets**: Sensitive data (JWT secrets, database passwords)
- **Deployments**: API server and worker pods
- **Services**: Internal service discovery
- **HorizontalPodAutoscaler**: Auto-scaling based on CPU/memory
- **Ingress**: External routing and TLS termination

## Quick Start

### 1. Build and Push Docker Image

```bash
# Build the image
docker build -t your-registry/collaborative-workspace:latest .

# Push to registry
docker push your-registry/collaborative-workspace:latest
```

### 2. Update Configuration

Edit the following files with your actual values:

- `configmap.yaml`: Update database URLs, CORS origins
- `secrets.yaml`: Generate and set secure secrets
- `api-deployment.yaml`: Update image registry
- `worker-deployment.yaml`: Update image registry
- `ingress.yaml`: Update domain name

### 3. Generate Secrets

```bash
# Generate secure JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Create secrets manually
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  --from-literal=JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET \
  --from-literal=DATABASE_PASSWORD=your-db-password \
  --namespace=collaborative-workspace
```

### 4. Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Apply ConfigMap
kubectl apply -f configmap.yaml

# Apply Secrets (or create manually as shown above)
kubectl apply -f secrets.yaml

# Deploy API server
kubectl apply -f api-deployment.yaml

# Deploy worker
kubectl apply -f worker-deployment.yaml

# Create services
kubectl apply -f api-service.yaml

# Set up auto-scaling
kubectl apply -f hpa.yaml

# Configure ingress (update domain first)
kubectl apply -f ingress.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n collaborative-workspace

# Check services
kubectl get svc -n collaborative-workspace

# Check HPA
kubectl get hpa -n collaborative-workspace

# View logs
kubectl logs -f deployment/api-server -n collaborative-workspace
kubectl logs -f deployment/worker -n collaborative-workspace
```

## Database Setup

### Option 1: Managed Databases (Recommended for Production)

Use managed database services:
- **PostgreSQL**: Google Cloud SQL, AWS RDS, Azure Database
- **MongoDB**: MongoDB Atlas
- **Redis**: Google Memorystore, AWS ElastiCache, Azure Cache

Update `configmap.yaml` with external connection strings.

### Option 2: Database Services in Kubernetes

If deploying databases in Kubernetes, create additional manifests:

```yaml
# Example: PostgreSQL StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: collaborative-workspace
spec:
  serviceName: postgres-service
  replicas: 1
  # ... (PostgreSQL configuration)
```

## Scaling

### Manual Scaling

```bash
# Scale API servers
kubectl scale deployment api-server --replicas=5 -n collaborative-workspace

# Scale workers
kubectl scale deployment worker --replicas=3 -n collaborative-workspace
```

### Auto-Scaling

The HPA (HorizontalPodAutoscaler) automatically scales based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

Adjust thresholds in `hpa.yaml` as needed.

## Monitoring

### Health Checks

- **Liveness Probe**: `/health` endpoint
- **Readiness Probe**: `/health` endpoint
- **Startup Probe**: Ensures graceful startup

### Metrics

Access Prometheus metrics at:
```
http://api-service/metrics
```

## Rolling Updates

Deployments use RollingUpdate strategy:
- Zero-downtime deployments
- Gradual pod replacement
- Automatic rollback on failure

```bash
# Update image
kubectl set image deployment/api-server \
  api-server=your-registry/collaborative-workspace:v1.1.0 \
  -n collaborative-workspace

# Watch rollout
kubectl rollout status deployment/api-server -n collaborative-workspace

# Rollback if needed
kubectl rollout undo deployment/api-server -n collaborative-workspace
```

## Resource Management

### Resource Requests and Limits

Current configuration:
- **API Server**: 256Mi-512Mi memory, 250m-500m CPU
- **Worker**: 256Mi-512Mi memory, 250m-500m CPU

Adjust based on your workload in `*-deployment.yaml` files.

## Security Best Practices

1. **Secrets Management**: Use external secret management (AWS Secrets Manager, HashiCorp Vault)
2. **Network Policies**: Implement network policies to restrict pod communication
3. **RBAC**: Configure Role-Based Access Control for Kubernetes resources
4. **Pod Security**: Use Pod Security Standards
5. **Image Scanning**: Scan container images for vulnerabilities

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n collaborative-workspace

# Check logs
kubectl logs <pod-name> -n collaborative-workspace
```

### Database Connection Issues

```bash
# Verify ConfigMap
kubectl get configmap app-config -n collaborative-workspace -o yaml

# Test database connectivity from pod
kubectl exec -it <pod-name> -n collaborative-workspace -- sh
```

### Scaling Issues

```bash
# Check HPA status
kubectl describe hpa api-hpa -n collaborative-workspace

# Check resource usage
kubectl top pods -n collaborative-workspace
```

## Production Checklist

- [ ] Update all placeholder values in manifests
- [ ] Configure managed databases
- [ ] Set up TLS certificates
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Configure backup strategy
- [ ] Review resource limits
- [ ] Set up network policies
- [ ] Configure RBAC
- [ ] Test disaster recovery procedures

## Cost Optimization

- Use node pools with appropriate instance types
- Implement pod disruption budgets
- Configure resource quotas
- Use cluster autoscaling
- Consider spot instances for workers

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Ingress Controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)

