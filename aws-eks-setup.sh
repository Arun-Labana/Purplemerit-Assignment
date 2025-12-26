#!/bin/bash
# AWS EKS Setup Script
# This sets up Kubernetes on AWS EC2 (free tier eligible)

set -e

echo "🚀 AWS Kubernetes Deployment Setup"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    echo "Install: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

echo "✅ AWS credentials configured"
echo ""

echo "📋 Steps to deploy:"
echo ""
echo "1. Create EC2 instance (free tier):"
echo "   - Go to AWS Console → EC2 → Launch Instance"
echo "   - Choose: Amazon Linux 2023 AMI"
echo "   - Instance type: t2.micro (free tier)"
echo "   - Security Group: Allow ports 22, 80, 443, 3000"
echo "   - Key pair: Create/download .pem file"
echo ""
echo "2. SSH into instance:"
echo "   ssh -i your-key.pem ec2-user@YOUR_EC2_IP"
echo ""
echo "3. Install Docker and Kubernetes:"
echo "   sudo yum update -y"
echo "   sudo yum install docker -y"
echo "   sudo systemctl start docker"
echo "   sudo systemctl enable docker"
echo "   sudo usermod -aG docker ec2-user"
echo ""
echo "4. Install k3s (lightweight Kubernetes):"
echo "   curl -sfL https://get.k3s.io | sh -"
echo "   sudo kubectl get nodes"
echo ""
echo "5. Copy k8s files to EC2 and deploy:"
echo "   scp -r k8s/ ec2-user@YOUR_EC2_IP:~/"
echo "   ssh into instance"
echo "   kubectl apply -f k8s/"
echo ""
echo "⚠️  Note: For production, use AWS EKS (not free) or managed databases"

