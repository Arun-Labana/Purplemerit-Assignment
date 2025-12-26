#!/bin/bash
# Deploy to AWS EC2 with Kubernetes

set -e

echo "🚀 Deploying to AWS EC2 with Kubernetes"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed. Install from: https://aws.amazon.com/cli/"
    exit 1
fi

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo "AWS Account: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo ""

# Create ECR repository
echo "📦 Creating ECR repository..."
aws ecr create-repository --repository-name collaborative-workspace --region $AWS_REGION 2>/dev/null || echo "Repository already exists"
echo "✅ ECR repository ready"
echo ""

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t collaborative-workspace:latest .
echo "✅ Image built"
echo ""

# Tag and push to ECR
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/collaborative-workspace:latest"
echo "📤 Pushing to ECR: $ECR_URI"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker tag collaborative-workspace:latest $ECR_URI
docker push $ECR_URI
echo "✅ Image pushed to ECR"
echo ""

# Update Kubernetes deployment files
echo "📝 Updating Kubernetes manifests..."
sed -i.bak "s|collaborative-workspace:latest|$ECR_URI|g" k8s/api-deployment.yaml
sed -i.bak "s|collaborative-workspace:latest|$ECR_URI|g" k8s/worker-deployment.yaml
echo "✅ Kubernetes files updated"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Copy k8s/ directory to your EC2 instance:"
echo "   scp -r k8s/ ec2-user@YOUR_EC2_IP:~/"
echo ""
echo "2. SSH into EC2:"
echo "   ssh -i your-key.pem ec2-user@YOUR_EC2_IP"
echo ""
echo "3. Deploy:"
echo "   cd ~/k8s"
echo "   ./generate-secrets.sh"
echo "   kubectl apply -f ."
echo ""
echo "Image URI: $ECR_URI"

