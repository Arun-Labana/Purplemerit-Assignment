# Kubernetes Deployment Checklist

Use this checklist to ensure all configuration is complete before deploying.

## ✅ Pre-Deployment Checklist

### 1. Docker Image
- [ ] Build Docker image: `docker build -t your-registry/collaborative-workspace:latest .`
- [ ] Push to registry: `docker push your-registry/collaborative-workspace:latest`
- [ ] Update `api-deployment.yaml` line 28 with your image registry
- [ ] Update `worker-deployment.yaml` line 28 with your image registry

### 2. Secrets
- [ ] Run `./generate-secrets.sh` to create Kubernetes secrets
- [ ] Or manually create secrets using kubectl (see README.md)

### 3. Configuration (configmap.yaml)
- [ ] Update `DATABASE_URL` - PostgreSQL connection string
  - For managed DB: `postgresql://user:pass@host:5432/dbname`
  - For in-cluster: `postgresql://user:pass@postgres-service:5432/dbname`
- [ ] Update `MONGODB_URI` - ✅ Already configured (from render.yaml)
- [ ] Update `REDIS_URL` - Redis connection string
  - For managed Redis: `redis://host:6379` or `rediss://host:6379`
  - For in-cluster: `redis://redis-service:6379`
- [ ] Update `RABBITMQ_URL` - ✅ Already configured (from render.yaml)
- [ ] Update `CORS_ORIGIN` - Your frontend domain

### 4. Ingress (ingress.yaml)
- [ ] Update domain on line 20: `api.your-domain.com` → your actual domain
- [ ] Update domain on line 23: `api.your-domain.com` → your actual domain
- [ ] Ensure ingress controller is installed in your cluster
- [ ] Ensure cert-manager is installed (for TLS certificates)

### 5. Kubernetes Cluster
- [ ] kubectl is configured and connected to cluster
- [ ] Verify cluster access: `kubectl cluster-info`
- [ ] Check available resources: `kubectl top nodes`

## 🚀 Deployment Steps

### Option 1: Automated (Recommended)
```bash
cd k8s/
./setup.sh
```

### Option 2: Manual Step-by-Step
```bash
# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Generate secrets
./generate-secrets.sh

# 3. Apply ConfigMap (after updating)
kubectl apply -f configmap.yaml

# 4. Deploy API server
kubectl apply -f api-deployment.yaml

# 5. Deploy worker
kubectl apply -f worker-deployment.yaml

# 6. Create services
kubectl apply -f api-service.yaml

# 7. Set up auto-scaling
kubectl apply -f hpa.yaml

# 8. Configure ingress (after updating domain)
kubectl apply -f ingress.yaml
```

## ✅ Post-Deployment Verification

### Check Pods
```bash
kubectl get pods -n collaborative-workspace
# Should see: api-server-* (3 pods) and worker-* (2 pods)
```

### Check Services
```bash
kubectl get svc -n collaborative-workspace
# Should see: api-service (ClusterIP)
```

### Check HPA
```bash
kubectl get hpa -n collaborative-workspace
# Should see: api-hpa and worker-hpa
```

### Check Logs
```bash
# API server logs
kubectl logs -f deployment/api-server -n collaborative-workspace

# Worker logs
kubectl logs -f deployment/worker -n collaborative-workspace
```

### Test Health Endpoint
```bash
# Port forward to test locally
kubectl port-forward svc/api-service 3000:80 -n collaborative-workspace

# In another terminal
curl http://localhost:3000/health
```

## 🔧 Common Issues

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

# Test from pod
kubectl exec -it <pod-name> -n collaborative-workspace -- sh
# Then test database connection
```

### Image Pull Errors
```bash
# Check if image exists in registry
docker pull your-registry/collaborative-workspace:latest

# Verify imagePullPolicy in deployment
kubectl get deployment api-server -n collaborative-workspace -o yaml | grep imagePullPolicy
```

## 📝 Current Configuration Status

### ✅ Pre-configured (from render.yaml)
- MongoDB URI: `mongodb+srv://labanaarun0_db_user:Password1@cluster0.w7emiil.mongodb.net/...`
- RabbitMQ URL: `amqps://fcsjowty:vtFpaBA2HlHoldtOA3encf__AYHDH_Ma@leopard.lmq.cloudamqp.com/...`

### ⚠️ Needs Configuration
- Docker Image Registry: Update in `api-deployment.yaml` and `worker-deployment.yaml`
- PostgreSQL URL: Update in `configmap.yaml` (if using managed DB)
- Redis URL: Update in `configmap.yaml` (if using managed Redis)
- Domain: Update in `ingress.yaml`
- Secrets: Generate using `./generate-secrets.sh`

## 🎯 Next Steps After Deployment

1. **Run Database Migrations**
   ```bash
   kubectl exec -it deployment/api-server -n collaborative-workspace -- npm run migrate
   ```

2. **Monitor Application**
   ```bash
   kubectl get pods -w -n collaborative-workspace
   kubectl top pods -n collaborative-workspace
   ```

3. **Access Application**
   - Via Ingress: `https://your-domain.com`
   - Via Port Forward: `kubectl port-forward svc/api-service 3000:80 -n collaborative-workspace`

4. **Scale Manually (if needed)**
   ```bash
   kubectl scale deployment api-server --replicas=5 -n collaborative-workspace
   ```

