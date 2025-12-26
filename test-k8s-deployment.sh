#!/bin/bash
# Comprehensive Testing Script for Kubernetes Deployment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3000"
BASE_URL="${API_URL}/api/v1"

echo -e "${GREEN}🧪 Testing Collaborative Workspace Backend (Kubernetes)${NC}"
echo ""

# Check if port-forward is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port-forward not active. Starting port-forward...${NC}"
    kubectl port-forward -n collaborative-workspace svc/api-service 3000:80 > /tmp/k8s-port-forward.log 2>&1 &
    PORT_FORWARD_PID=$!
    echo "Port-forward started (PID: $PORT_FORWARD_PID)"
    sleep 3
fi

echo -e "${GREEN}✓${NC} Testing API at: $API_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s "${API_URL}/health")
if echo "$HEALTH" | grep -q "success"; then
    echo -e "${GREEN}✓${NC} Health check passed"
    echo "Response: $HEALTH"
else
    echo -e "${RED}✗${NC} Health check failed"
    echo "Response: $HEALTH"
fi
echo ""

# Test 2: Register User
echo -e "${YELLOW}Test 2: Register User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@example.com",
    "name": "Test User",
    "password": "TestPassword123!"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✓${NC} User registration successful"
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "User ID: $USER_ID"
else
    echo -e "${RED}✗${NC} User registration failed"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Get Current User
echo -e "${YELLOW}Test 3: Get Current User (Authenticated)${NC}"
ME_RESPONSE=$(curl -s -X GET "${BASE_URL}/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$ME_RESPONSE" | grep -q "email"; then
    echo -e "${GREEN}✓${NC} Get current user successful"
    echo "Response: $ME_RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗${NC} Get current user failed"
    echo "Response: $ME_RESPONSE"
fi
echo ""

# Test 4: Create Workspace
echo -e "${YELLOW}Test 4: Create Workspace${NC}"
WORKSPACE_RESPONSE=$(curl -s -X POST "${BASE_URL}/workspaces" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workspace",
    "description": "Test workspace description"
  }')

if echo "$WORKSPACE_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✓${NC} Workspace creation successful"
    WORKSPACE_ID=$(echo "$WORKSPACE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Workspace ID: $WORKSPACE_ID"
else
    echo -e "${RED}✗${NC} Workspace creation failed"
    echo "Response: $WORKSPACE_RESPONSE"
fi
echo ""

# Test 5: Create Project
echo -e "${YELLOW}Test 5: Create Project${NC}"
PROJECT_RESPONSE=$(curl -s -X POST "${BASE_URL}/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Test project description",
    "workspaceId": "'"$WORKSPACE_ID"'"
  }')

if echo "$PROJECT_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✓${NC} Project creation successful"
    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Project ID: $PROJECT_ID"
else
    echo -e "${RED}✗${NC} Project creation failed"
    echo "Response: $PROJECT_RESPONSE"
fi
echo ""

# Test 6: Get Projects
echo -e "${YELLOW}Test 6: Get Projects${NC}"
PROJECTS_RESPONSE=$(curl -s -X GET "${BASE_URL}/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROJECTS_RESPONSE" | grep -q "projects"; then
    echo -e "${GREEN}✓${NC} Get projects successful"
    echo "Response: $PROJECTS_RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗${NC} Get projects failed"
    echo "Response: $PROJECTS_RESPONSE"
fi
echo ""

# Test 7: Submit Job
echo -e "${YELLOW}Test 7: Submit Job${NC}"
JOB_RESPONSE=$(curl -s -X POST "${BASE_URL}/jobs" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code_execution",
    "projectId": "'"$PROJECT_ID"'",
    "payload": {
      "code": "console.log(\"Hello World\");",
      "language": "javascript"
    }
  }')

if echo "$JOB_RESPONSE" | grep -q "jobId"; then
    echo -e "${GREEN}✓${NC} Job submission successful"
    JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)
    echo "Job ID: $JOB_ID"
else
    echo -e "${RED}✗${NC} Job submission failed"
    echo "Response: $JOB_RESPONSE"
fi
echo ""

# Test 8: Metrics Endpoint
echo -e "${YELLOW}Test 8: Metrics Endpoint${NC}"
METRICS=$(curl -s "${API_URL}/metrics" | head -20)
if [ ! -z "$METRICS" ]; then
    echo -e "${GREEN}✓${NC} Metrics endpoint accessible"
    echo "Sample metrics:"
    echo "$METRICS"
else
    echo -e "${RED}✗${NC} Metrics endpoint failed"
fi
echo ""

# Test 9: Swagger Documentation
echo -e "${YELLOW}Test 9: Swagger Documentation${NC}"
SWAGGER=$(curl -s "${API_URL}/api-docs" | head -5)
if echo "$SWAGGER" | grep -q "swagger\|openapi"; then
    echo -e "${GREEN}✓${NC} Swagger documentation accessible"
    echo "Visit: ${API_URL}/api-docs"
else
    echo -e "${RED}✗${NC} Swagger documentation failed"
fi
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Testing Complete!${NC}"
echo ""
echo "API URL: $API_URL"
echo "Swagger UI: ${API_URL}/api-docs"
echo "Health Check: ${API_URL}/health"
echo "Metrics: ${API_URL}/metrics"
echo ""
echo "To stop port-forward, run:"
echo "  pkill -f 'kubectl port-forward'"

