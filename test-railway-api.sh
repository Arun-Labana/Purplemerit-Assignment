#!/bin/bash
# Test script for Railway deployed API

set -e

# Get Railway URL from user
if [ -z "$1" ]; then
    echo "Usage: ./test-railway-api.sh https://your-app.up.railway.app"
    echo ""
    echo "Get your Railway URL from:"
    echo "Railway Dashboard → Service → Settings → Public Domain"
    exit 1
fi

API_URL="$1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing Railway API: $API_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    echo "✅ Health check passed"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: API Docs
echo "2️⃣  Testing API Documentation..."
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api-docs")
if [ "$DOCS_STATUS" = "200" ]; then
    echo "✅ API docs accessible"
    echo "   Visit: $API_URL/api-docs"
else
    echo "❌ API docs not accessible (Status: $DOCS_STATUS)"
fi
echo ""

# Test 3: Register User
echo "3️⃣  Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@example.com",
    "name": "Test User",
    "password": "TestPassword123!"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
    echo "✅ User registration successful"
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    echo "   Access Token: ${ACCESS_TOKEN:0:50}..."
    echo ""
    
    # Test 4: Get User Info
    echo "4️⃣  Testing Protected Endpoint (Get User Info)..."
    ME_RESPONSE=$(curl -s "$API_URL/api/v1/auth/me" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$ME_RESPONSE" | grep -q "email"; then
        echo "✅ Protected endpoint works"
        echo "   Response: $ME_RESPONSE"
    else
        echo "❌ Protected endpoint failed"
        echo "   Response: $ME_RESPONSE"
    fi
    echo ""
    
    # Test 5: Create Project
    echo "5️⃣  Testing Create Project..."
    PROJECT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/projects" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test Project",
        "description": "Created via test script"
      }')
    
    if echo "$PROJECT_RESPONSE" | grep -q "success"; then
        echo "✅ Project creation successful"
        echo "   Response: $PROJECT_RESPONSE"
    else
        echo "❌ Project creation failed"
        echo "   Response: $PROJECT_RESPONSE"
    fi
else
    echo "❌ User registration failed"
    echo "   Response: $REGISTER_RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testing Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 API Documentation: $API_URL/api-docs"
echo "❤️  Health Check: $API_URL/health"
echo "📊 Metrics: $API_URL/metrics"

