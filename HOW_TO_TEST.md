# How to Test the Application

## Quick Start Testing Guide

### Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- npm installed

---

## Step 1: Setup Environment

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Create Environment File
```bash
cp .env.example .env
```

Edit `.env` with these values (for local testing):
```env
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database URLs (will use Docker services)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collaborative_workspace
MONGODB_URI=mongodb://localhost:27017/collaborative_workspace
REDIS_URL=redis://localhost:6380
RABBITMQ_URL=amqp://admin:admin@localhost:5672

# JWT Secrets (use strong secrets in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## Step 2: Start Services

### 2.1 Start Docker Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- MongoDB on port 27017
- Redis on port 6380 (external), 6379 (internal)
- RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)

### 2.2 Verify Services are Running
```bash
docker-compose ps
```

All services should show "Up" status.

### 2.3 Run Database Migrations
```bash
npm run migrate
```

This creates all necessary tables in PostgreSQL.

---

## Step 3: Run Automated Tests

### 3.1 Run All Tests
```bash
npm test
```

### 3.2 Run Tests with Coverage
```bash
npm run test:coverage
```

This will show:
- Test results
- Coverage percentage
- Coverage report in `coverage/` directory

### 3.3 Run Specific Test Files
```bash
# Unit tests only
npm test -- tests/unit

# Integration tests only
npm test -- tests/integration

# Specific test file
npm test -- tests/unit/utils/password.test.ts
```

---

## Step 4: Start the Application

### 4.1 Start API Server
```bash
npm run dev
```

You should see:
```
Server started successfully
API Documentation: http://localhost:3000/api-docs
Health Check: http://localhost:3000/health
Metrics: http://localhost:3000/metrics
WebSocket: ws://localhost:3000
```

### 4.2 Start Background Worker (in a NEW terminal)
```bash
npm run worker:dev
```

You should see:
```
Worker process started successfully
Started consuming jobs from queue
```

---

## Step 5: Manual API Testing

### 5.1 Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-12-26T...",
  "environment": "development"
}
```

### 5.2 Test API Documentation
Open in browser:
```
http://localhost:3000/api-docs
```

You should see Swagger UI with all API endpoints.

### 5.3 Test Authentication Flow

#### Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "TestPassword123!"
  }'
```

Expected response (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "name": "Test User",
      "createdAt": "2024-12-26T..."
    },
    "accessToken": "jwt-token...",
    "refreshToken": "jwt-refresh-token..."
  }
}
```

**Save the `accessToken` for next requests!**

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

#### Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

### 5.4 Test Project Management

#### Create Project (requires token)
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "description": "This is a test project"
  }'
```

Expected response (201):
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "uuid",
    "name": "My First Project",
    "description": "This is a test project",
    "ownerId": "uuid",
    "createdAt": "2024-12-26T..."
  }
}
```

**Save the project `id` for next requests!**

#### List Projects
```bash
curl -X GET http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

#### Get Project
```bash
curl -X GET http://localhost:3000/api/v1/projects/PROJECT_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

#### Update Project
```bash
curl -X PUT http://localhost:3000/api/v1/projects/PROJECT_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name",
    "description": "Updated description"
  }'
```

#### Delete Project
```bash
curl -X DELETE http://localhost:3000/api/v1/projects/PROJECT_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5.5 Test Workspace Management

#### Create Workspace
```bash
curl -X POST http://localhost:3000/api/v1/projects/PROJECT_ID_HERE/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development Workspace",
    "settings": {
      "theme": "dark",
      "language": "typescript"
    }
  }'
```

**Save the workspace `id` for job testing!**

### 5.6 Test Job Processing

#### Submit a Job
```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "WORKSPACE_ID_HERE",
    "type": "code_execution",
    "payload": {
      "code": "console.log(\"Hello World\");",
      "language": "javascript"
    }
  }'
```

Expected response (201):
```json
{
  "success": true,
  "message": "Job submitted successfully",
  "data": {
    "id": "job-uuid",
    "workspaceId": "workspace-uuid",
    "type": "code_execution",
    "status": "pending",
    "createdAt": "2024-12-26T..."
  }
}
```

**Save the job `id`!**

#### Check Job Status
```bash
curl -X GET http://localhost:3000/api/v1/jobs/JOB_ID_HERE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Wait a few seconds and check again - the status should change from `pending` → `processing` → `completed`.

#### List Workspace Jobs
```bash
curl -X GET http://localhost:3000/api/v1/jobs/workspaces/WORKSPACE_ID_HERE/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5.7 Test Collaboration

#### Invite Collaborator
```bash
curl -X POST http://localhost:3000/api/v1/collaboration/projects/PROJECT_ID_HERE/invite \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collaborator@example.com",
    "role": "collaborator"
  }'
```

**Note:** The collaborator must be registered first.

---

## Step 6: Test WebSocket (Real-Time)

### 6.1 Using Browser Console

Open browser console and run:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN_HERE'
  }
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected!', socket.id);
});

// Join a workspace
socket.emit('join:workspace', 'WORKSPACE_ID_HERE');

// Listen for user joined
socket.on('user:joined', (data) => {
  console.log('User joined:', data);
});

// Listen for file changes
socket.on('file:changed', (data) => {
  console.log('File changed:', data);
});

// Send file change event
socket.emit('file:change', {
  workspaceId: 'WORKSPACE_ID_HERE',
  fileId: 'file-123',
  fileName: 'index.ts',
  changes: {
    line: 10,
    content: 'console.log("updated");'
  }
});

// Send cursor movement
socket.emit('cursor:move', {
  workspaceId: 'WORKSPACE_ID_HERE',
  fileId: 'file-123',
  position: { line: 10, column: 5 }
});

// Listen for cursor movements
socket.on('cursor:moved', (data) => {
  console.log('Cursor moved:', data);
});
```

### 6.2 Using Postman

1. Open Postman
2. Create new WebSocket request
3. URL: `ws://localhost:3000`
4. Add header: `Authorization: Bearer YOUR_TOKEN`
5. Connect and send events

---

## Step 7: Test Error Cases

### 7.1 Test Invalid Authentication
```bash
# Missing token
curl -X GET http://localhost:3000/api/v1/projects

# Invalid token
curl -X GET http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer invalid-token"
```

Expected: 401 Unauthorized

### 7.2 Test Validation Errors
```bash
# Invalid email
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "name": "Test",
    "password": "Test123!"
  }'

# Short password
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test",
    "password": "short"
  }'
```

Expected: 400 Bad Request with validation errors

### 7.3 Test Rate Limiting
```bash
# Make many rapid requests
for i in {1..150}; do
  curl -X GET http://localhost:3000/health
done
```

After 100 requests, you should see 429 Too Many Requests.

---

## Step 8: Monitor and Debug

### 8.1 Check Logs
```bash
# API server logs (in terminal where npm run dev is running)
# Look for structured JSON logs

# Worker logs (in terminal where npm run worker:dev is running)
# Look for job processing logs
```

### 8.2 Check Metrics
```bash
curl http://localhost:3000/metrics
```

This returns Prometheus-formatted metrics.

### 8.3 Check RabbitMQ Management UI
Open in browser:
```
http://localhost:15672
```

Login:
- Username: `admin`
- Password: `admin`

You can see:
- Queues (jobs.pending, jobs.retry, jobs.dlq)
- Messages in queues
- Connection status

### 8.4 Check Database

#### PostgreSQL
```bash
docker exec -it collab-postgres psql -U postgres -d collaborative_workspace

# List tables
\dt

# Check users
SELECT * FROM users;

# Check projects
SELECT * FROM projects;

# Check jobs
SELECT * FROM jobs;
```

#### MongoDB
```bash
docker exec -it collab-mongodb mongosh

# Use database
use collaborative_workspace

# Check collections
show collections

# Check activity logs
db.activitylogs.find().pretty()

# Check job results
db.jobresults.find().pretty()
```

#### Redis
```bash
docker exec -it collab-redis redis-cli

# Check keys
KEYS *

# Get cache
GET cache:project:PROJECT_ID

# Check feature flags
GET feature:flag:ENABLE_NEW_FEATURE
```

---

## Step 9: Test Coverage Verification

### 9.1 Run Coverage Report
```bash
npm run test:coverage
```

### 9.2 View Coverage Report
Open in browser:
```
coverage/lcov-report/index.html
```

Check that coverage is ≥70% as required.

---

## Step 10: Integration Test Scenarios

### Scenario 1: Complete User Flow
1. Register user
2. Login
3. Create project
4. Create workspace
5. Submit job
6. Check job status
7. Invite collaborator

### Scenario 2: Real-Time Collaboration
1. User A connects via WebSocket
2. User A joins workspace
3. User B connects via WebSocket
4. User B joins same workspace
5. User A should see User B joined event
6. User A sends file change
7. User B should receive file change event

### Scenario 3: Job Processing Flow
1. Submit job
2. Check job status (should be pending)
3. Worker picks up job
4. Check job status (should be processing)
5. Wait for completion
6. Check job status (should be completed)
7. Check job result in MongoDB

---

## Troubleshooting

### Services Won't Start
```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :27017 # MongoDB
lsof -i :6380  # Redis
lsof -i :5672  # RabbitMQ

# Stop conflicting services or change ports in docker-compose.yml
```

### Database Connection Errors
```bash
# Check if services are running
docker-compose ps

# Check service logs
docker-compose logs postgres
docker-compose logs mongodb
docker-compose logs redis
```

### Tests Failing
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run single test file
npm test -- tests/unit/utils/password.test.ts
```

### API Not Responding
```bash
# Check if server is running
curl http://localhost:3000/health

# Check server logs for errors
# Look in terminal where npm run dev is running
```

---

## Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

echo "1. Testing Health..."
curl -s $BASE_URL/../health | jq .

echo -e "\n2. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test123!"}')

echo $REGISTER_RESPONSE | jq .

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')

echo -e "\n3. Creating project..."
PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Test"}')

echo $PROJECT_RESPONSE | jq .

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id')

echo -e "\n4. Listing projects..."
curl -s -X GET $BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n✅ Basic API test complete!"
```

Make it executable:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Next Steps

1. ✅ Run automated tests: `npm test`
2. ✅ Test API endpoints manually
3. ✅ Test WebSocket connections
4. ✅ Verify job processing
5. ✅ Check test coverage
6. ✅ Review logs and metrics

**Happy Testing! 🚀**

