# Collaborative Workspace Backend - Deployment Guide

This guide covers multiple deployment options for the Collaborative Workspace Backend:

1. **Render Deployment** (Simplified PaaS)
2. **Kubernetes Deployment** (Cloud-ready, scalable architecture)

## Kubernetes Deployment

For production-grade cloud deployment with auto-scaling and high availability, see [k8s/README.md](./k8s/README.md).

The Kubernetes deployment includes:
- ✅ Horizontal Pod Autoscaling (3-10 API pods, 2-5 worker pods)
- ✅ Health checks (liveness, readiness, startup probes)
- ✅ Rolling updates (zero-downtime deployments)
- ✅ Service discovery and load balancing
- ✅ Ingress with TLS termination
- ✅ Resource management and limits
- ✅ Production-ready configuration

**Quick Start:**
```bash
# Update configuration files in k8s/ directory
# Then deploy:
kubectl apply -k k8s/
```

---

## Render Deployment

### Prerequisites
1. Create a Render account at [render.com](https://render.com)
2. Install Render CLI (optional): `npm install -g render`
3. Have your GitHub repository ready

### Setup RabbitMQ (CloudAMQP)
Since Render doesn't provide managed RabbitMQ, use CloudAMQP:

1. Go to [cloudamqp.com](https://www.cloudamqp.com/)
2. Sign up for free tier
3. Create a new instance (Little Lemur - Free)
4. Copy the AMQP URL

### Automated Deployment (using render.yaml)

1. **Fork/Push your repository to GitHub**

2. **Connect to Render**:
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` and provision all services

3. **Configure Environment Variables**:
   - Go to each service in Render dashboard
   - Add the `RABBITMQ_URL` from CloudAMQP manually
   - Verify other auto-generated secrets (JWT_SECRET, JWT_REFRESH_SECRET)

4. **Deploy**:
   - Render will automatically deploy on every git push to main branch

### Manual Deployment

If you prefer manual setup:

#### 1. Create PostgreSQL Database
```bash
# In Render Dashboard
New + → PostgreSQL
Name: collab-postgres
Database: collaborative_workspace
Region: Oregon
Plan: Starter ($7/month)
```

#### 2. Create Redis Instance
```bash
New + → Redis
Name: collab-redis
Region: Oregon
Plan: Starter ($10/month)
Maxmemory Policy: allkeys-lru
```

#### 3. Create Web Service (API)
```bash
New + → Web Service
Name: collab-workspace-api
Environment: Node
Region: Oregon
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
Plan: Starter ($7/month)
```

Add environment variables:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<from postgres>
MONGODB_URI=<from mongodb atlas or render>
REDIS_URL=<from redis>
RABBITMQ_URL=<from cloudamqp>
JWT_SECRET=<generate random>
JWT_REFRESH_SECRET=<generate random>
CORS_ORIGIN=https://your-frontend.onrender.com
```

#### 4. Create Background Worker
```bash
New + → Background Worker
Name: collab-workspace-worker
Environment: Node
Region: Oregon
Branch: main
Build Command: npm install && npm run build
Start Command: npm run worker
Plan: Starter ($7/month)
```

Same environment variables as API (except PORT and CORS_ORIGIN not needed)

### MongoDB Setup

Since Render doesn't provide managed MongoDB, use MongoDB Atlas:

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free tier (M0 Sandbox)
3. Create cluster
4. Create database user
5. Whitelist IP: 0.0.0.0/0 (allow from anywhere)
6. Get connection string
7. Add to Render env vars as `MONGODB_URI`

### Database Migrations

Run migrations after first deployment:

```bash
# Option 1: Using Render Shell
# Go to service → Shell tab
npm run migrate

# Option 2: Connect via local terminal
DATABASE_URL=<render-postgres-external-url> npm run migrate
```

### Health Checks

Render will automatically monitor:
- `/health` endpoint (HTTP 200)
- Auto-restart on failures
- Health check interval: 30s

### Scaling

To scale horizontally:
```bash
# In Render Dashboard
Service → Settings → Instances
Adjust number of instances
```

### Cost Estimate

Minimum production setup:
- PostgreSQL: $7/month
- Redis: $10/month
- API Service: $7/month
- Worker Service: $7/month
- MongoDB Atlas: Free (M0)
- CloudAMQP: Free (Little Lemur)

**Total: ~$31/month**

Free alternative for testing:
- Use Render Free Tier (sleeps after inactivity)
- MongoDB Atlas Free
- CloudAMQP Free

### Monitoring

Access logs in Render:
```bash
# Dashboard → Service → Logs
# Real-time logs with filtering
```

Metrics endpoint:
```
https://your-app.onrender.com/metrics
```

### CI/CD

Automatic deployment on push:
```bash
git push origin main
# Render automatically builds and deploys
```

### Custom Domain

1. Go to Service → Settings → Custom Domain
2. Add your domain
3. Update DNS CNAME record to point to Render

### Environment-specific Configuration

**Production checklist**:
- [ ] Set strong JWT secrets
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set up monitoring/alerting
- [ ] Configure database backups
- [ ] Review rate limits
- [ ] Set appropriate LOG_LEVEL

### Troubleshooting

**Service won't start:**
- Check logs for errors
- Verify all environment variables are set
- Ensure database connections are accessible
- Check build output for compilation errors

**Database connection errors:**
- Verify connection strings
- Check IP whitelisting
- Ensure databases are running

**Worker not processing jobs:**
- Check RabbitMQ connection
- Verify worker logs
- Ensure queue names match

### Backup & Recovery

**PostgreSQL:**
- Render provides automatic daily backups (7-day retention on Starter plan)
- Manual backup: Service → Backups → Create Backup

**MongoDB:**
- Atlas provides automated backups (depends on tier)
- Manual export: Use `mongodump`

### Support

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- CloudAMQP Docs: https://www.cloudamqp.com/docs/

---

## Alternative: Docker Deployment

You can also deploy using Docker:

```bash
# Build and run
docker-compose up -d

# For production, use docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

See `docker-compose.yml` for configuration.

