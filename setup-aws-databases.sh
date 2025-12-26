#!/bin/bash
# Setup AWS RDS PostgreSQL and ElastiCache Redis (Free Tier)

set -e

AWS_REGION=${AWS_REGION:-us-east-1}

echo "🗄️  Setting up AWS Databases (Free Tier)"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    exit 1
fi

echo "Creating RDS PostgreSQL (Free Tier)..."
echo ""
echo "Run these commands manually in AWS Console or CLI:"
echo ""
echo "1. RDS PostgreSQL:"
echo "   aws rds create-db-instance \\"
echo "     --db-instance-identifier collaborative-workspace-db \\"
echo "     --db-instance-class db.t2.micro \\"
echo "     --engine postgres \\"
echo "     --master-username postgres \\"
echo "     --master-user-password YOUR_PASSWORD \\"
echo "     --allocated-storage 20 \\"
echo "     --region $AWS_REGION"
echo ""
echo "2. ElastiCache Redis:"
echo "   aws elasticache create-cache-cluster \\"
echo "     --cache-cluster-id collaborative-workspace-redis \\"
echo "     --cache-node-type cache.t2.micro \\"
echo "     --engine redis \\"
echo "     --num-cache-nodes 1 \\"
echo "     --region $AWS_REGION"
echo ""
echo "⚠️  Note: These take 10-15 minutes to create"
echo ""
echo "After creation, update k8s/configmap.yaml with:"
echo "  - RDS endpoint (from RDS Console)"
echo "  - ElastiCache endpoint (from ElastiCache Console)"
echo ""
echo "Or use docker-compose on EC2 for simpler setup:"
echo "  - Run: docker-compose up -d postgres redis"
echo "  - Use: postgres-service:5432 and redis-service:6379"

