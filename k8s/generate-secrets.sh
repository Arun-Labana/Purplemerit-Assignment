#!/bin/bash
# Script to generate Kubernetes secrets for the Collaborative Workspace Backend

set -e

echo "🔐 Generating Kubernetes Secrets for Collaborative Workspace"
echo ""

# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo "Generated Secrets:"
echo "JWT_SECRET: $JWT_SECRET"
echo "JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"
echo ""

# Prompt for database passwords
read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""
read -sp "Enter MongoDB password (or press Enter to skip): " MONGO_PASSWORD
echo ""
read -sp "Enter Redis password (or press Enter to skip): " REDIS_PASSWORD
echo ""
read -sp "Enter RabbitMQ password (or press Enter to skip): " RABBITMQ_PASSWORD
echo ""

# Create namespace if it doesn't exist
kubectl create namespace collaborative-workspace --dry-run=client -o yaml | kubectl apply -f -

# Create or update secret
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --from-literal=DATABASE_PASSWORD="${DB_PASSWORD:-}" \
  --from-literal=MONGODB_PASSWORD="${MONGO_PASSWORD:-}" \
  --from-literal=REDIS_PASSWORD="${REDIS_PASSWORD:-}" \
  --from-literal=RABBITMQ_PASSWORD="${RABBITMQ_PASSWORD:-}" \
  --namespace=collaborative-workspace \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✅ Secrets created successfully in namespace: collaborative-workspace"
echo ""
echo "To view secrets:"
echo "  kubectl get secrets app-secrets -n collaborative-workspace"
echo ""
echo "To view secret values (base64 encoded):"
echo "  kubectl get secret app-secrets -n collaborative-workspace -o yaml"

