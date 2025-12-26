#!/bin/bash
# Run this script ON your EC2 instance to set up Kubernetes

set -e

echo "🚀 Setting up Kubernetes on EC2"
echo ""

# Update system
echo "📦 Updating system..."
sudo yum update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install k3s (lightweight Kubernetes)
echo "☸️  Installing k3s..."
curl -sfL https://get.k3s.io | sh -

# Wait for k3s to be ready
echo "⏳ Waiting for Kubernetes to be ready..."
sleep 10

# Verify installation
echo "✅ Verifying installation..."
sudo kubectl get nodes

# Create namespace
echo "📁 Creating namespace..."
sudo kubectl create namespace collaborative-workspace 2>/dev/null || echo "Namespace already exists"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy k8s/ folder to this EC2 instance"
echo "2. Run: cd ~/k8s && ./generate-secrets.sh"
echo "3. Run: kubectl apply -f ."
echo ""
echo "To use kubectl without sudo:"
echo "  mkdir -p ~/.kube"
echo "  sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config"
echo "  sudo chown ec2-user:ec2-user ~/.kube/config"
echo "  export KUBECONFIG=~/.kube/config"

