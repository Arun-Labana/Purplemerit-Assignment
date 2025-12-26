#!/bin/bash
# Complete deployment script for AWS EC2 with Kubernetes

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Complete AWS Kubernetes Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if running on EC2 or locally
if [ -f /sys/hypervisor/uuid ] || [ -f /sys/devices/virtual/dmi/id/product_uuid ]; then
    echo "✅ Running on EC2"
    IS_EC2=true
else
    echo "ℹ️  Running locally - will prepare for EC2 deployment"
    IS_EC2=false
fi

echo ""

if [ "$IS_EC2" = false ]; then
    echo "STEP 1: Push Docker image to AWS ECR"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Run: ./deploy-to-aws.sh"
    echo "This will build and push your Docker image"
    echo ""
    read -p "Press Enter after running deploy-to-aws.sh..."
fi

echo ""
echo "STEP 2: Generate Kubernetes Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd k8s
./generate-secrets.sh

echo ""
echo "STEP 3: Deploy All Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deploying PostgreSQL, Redis, API, and Worker..."
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f api-deployment.yaml
kubectl apply -f worker-deployment.yaml
kubectl apply -f api-service-nodeport.yaml

echo ""
echo "⏳ Waiting for services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/api-server -n collaborative-workspace || true
kubectl wait --for=condition=available --timeout=300s deployment/worker -n collaborative-workspace || true
kubectl wait --for=condition=ready --timeout=300s pod -l app=postgres -n collaborative-workspace || true
kubectl wait --for=condition=ready --timeout=300s pod -l app=redis -n collaborative-workspace || true

echo ""
echo "STEP 4: Run Database Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running migrations..."
kubectl run migration-job --image=$(kubectl get deployment api-server -n collaborative-workspace -o jsonpath='{.spec.template.spec.containers[0].image}') --restart=Never -n collaborative-workspace -- npm run migrate
kubectl wait --for=condition=complete --timeout=60s job/migration-job -n collaborative-workspace || true
kubectl logs job/migration-job -n collaborative-workspace
kubectl delete job migration-job -n collaborative-workspace

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get EC2 public IP if available
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_IP")

echo "📡 YOUR SHAREABLE URLS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 API Server:"
echo "   http://${EC2_IP}:30000"
echo "   http://${EC2_IP}:30000/api-docs (Swagger UI)"
echo "   http://${EC2_IP}:30000/health (Health Check)"
echo ""
echo "📊 Check Status:"
echo "   kubectl get pods -n collaborative-workspace"
echo "   kubectl get svc -n collaborative-workspace"
echo ""
echo "📝 View Logs:"
echo "   kubectl logs -f deployment/api-server -n collaborative-workspace"
echo "   kubectl logs -f deployment/worker -n collaborative-workspace"
echo ""
echo "🔧 Troubleshooting:"
echo "   kubectl describe pod <pod-name> -n collaborative-workspace"
echo "   kubectl get events -n collaborative-workspace --sort-by='.lastTimestamp'"
echo ""

