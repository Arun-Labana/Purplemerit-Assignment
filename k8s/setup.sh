#!/bin/bash
# Complete Kubernetes setup script for Collaborative Workspace Backend

set -e

echo "🚀 Setting up Collaborative Workspace Backend on Kubernetes"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi

# Check if connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Not connected to a Kubernetes cluster.${NC}"
    echo "Please configure kubectl to connect to your cluster first."
    exit 1
fi

echo -e "${GREEN}✓${NC} kubectl is installed and connected to cluster"
echo ""

# Step 1: Create namespace
echo "📦 Step 1: Creating namespace..."
kubectl apply -f namespace.yaml
echo -e "${GREEN}✓${NC} Namespace created"
echo ""

# Step 2: Generate and create secrets
echo "🔐 Step 2: Setting up secrets..."
echo "Running secret generation script..."
bash generate-secrets.sh
echo ""

# Step 3: Update ConfigMap
echo -e "${YELLOW}⚠️${NC}  Step 3: Please update k8s/configmap.yaml with your database URLs"
echo "   Current MongoDB URI is set (from render.yaml)"
echo "   Update DATABASE_URL and REDIS_URL if using in-cluster services"
echo ""
read -p "Press Enter to continue after updating configmap.yaml..."

# Step 4: Apply ConfigMap
echo "📝 Step 4: Applying ConfigMap..."
kubectl apply -f configmap.yaml
echo -e "${GREEN}✓${NC} ConfigMap applied"
echo ""

# Step 5: Update image registry
echo -e "${YELLOW}⚠️${NC}  Step 5: Please update image registry in deployment files"
echo "   Update 'your-registry/collaborative-workspace:latest' in:"
echo "   - k8s/api-deployment.yaml"
echo "   - k8s/worker-deployment.yaml"
echo ""
read -p "Enter your Docker image registry (e.g., docker.io/username/collaborative-workspace:latest): " IMAGE_REGISTRY

if [ ! -z "$IMAGE_REGISTRY" ]; then
    echo "Updating deployment files with image: $IMAGE_REGISTRY"
    sed -i.bak "s|your-registry/collaborative-workspace:latest|$IMAGE_REGISTRY|g" api-deployment.yaml
    sed -i.bak "s|your-registry/collaborative-workspace:latest|$IMAGE_REGISTRY|g" worker-deployment.yaml
    echo -e "${GREEN}✓${NC} Image registry updated"
fi
echo ""

# Step 6: Update ingress domain
echo -e "${YELLOW}⚠️${NC}  Step 6: Please update domain in ingress.yaml"
echo "   Update 'api.your-domain.com' with your actual domain"
echo ""
read -p "Enter your domain (or press Enter to skip): " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    echo "Updating ingress with domain: $DOMAIN"
    sed -i.bak "s|api.your-domain.com|$DOMAIN|g" ingress.yaml
    echo -e "${GREEN}✓${NC} Domain updated"
fi
echo ""

# Step 7: Deploy application
echo "🚀 Step 7: Deploying application..."
kubectl apply -f api-deployment.yaml
kubectl apply -f worker-deployment.yaml
kubectl apply -f api-service.yaml
kubectl apply -f hpa.yaml

# Optionally apply ingress if domain was set
if [ ! -z "$DOMAIN" ]; then
    kubectl apply -f ingress.yaml
    echo -e "${GREEN}✓${NC} Ingress configured"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check pod status:"
echo "   kubectl get pods -n collaborative-workspace"
echo ""
echo "2. Check services:"
echo "   kubectl get svc -n collaborative-workspace"
echo ""
echo "3. View logs:"
echo "   kubectl logs -f deployment/api-server -n collaborative-workspace"
echo "   kubectl logs -f deployment/worker -n collaborative-workspace"
echo ""
echo "4. Check HPA:"
echo "   kubectl get hpa -n collaborative-workspace"
echo ""

