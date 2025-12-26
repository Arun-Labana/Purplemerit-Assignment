# API Endpoints Reference

## Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://your-app.onrender.com/api/v1`

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePassword123!"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## Project Endpoints

### Create Project
```http
POST /projects
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "My Project",
  "description": "Project description"
}
```

### Get Project
```http
GET /projects/{projectId}
Authorization: Bearer {access-token}
```

### Update Project
```http
PUT /projects/{projectId}
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Project
```http
DELETE /projects/{projectId}
Authorization: Bearer {access-token}
```

### List User Projects
```http
GET /projects
Authorization: Bearer {access-token}
```

## Workspace Endpoints

### Create Workspace
```http
POST /projects/{projectId}/workspaces
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "name": "Development Workspace",
  "settings": {
    "theme": "dark",
    "language": "typescript"
  }
}
```

### Get Workspace
```http
GET /workspaces/{workspaceId}
Authorization: Bearer {access-token}
```

### List Project Workspaces
```http
GET /projects/{projectId}/workspaces
Authorization: Bearer {access-token}
```

## Collaboration Endpoints

### Invite Collaborator
```http
POST /collaboration/projects/{projectId}/invite
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "email": "collaborator@example.com",
  "role": "collaborator"
}
```

**Roles**: `owner`, `collaborator`, `viewer`

### Update Member Role
```http
PUT /collaboration/projects/{projectId}/members/{userId}/role
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "role": "viewer"
}
```

### Remove Member
```http
DELETE /collaboration/projects/{projectId}/members/{userId}
Authorization: Bearer {access-token}
```

## Job Endpoints

### Submit Job
```http
POST /jobs
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "workspaceId": "workspace-uuid",
  "type": "code_execution",
  "payload": {
    "code": "console.log('Hello World');",
    "language": "javascript"
  }
}
```

**Job Types**:
- `code_execution` - Execute code in sandbox
- `file_processing` - Process uploaded files
- `export_project` - Export project as archive

### Get Job Status
```http
GET /jobs/{jobId}
Authorization: Bearer {access-token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job-uuid",
      "status": "completed",
      "type": "code_execution",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "result": {
      "output": "Hello World",
      "executionTime": 0.05,
      "exitCode": 0
    }
  }
}
```

**Job Statuses**:
- `pending` - Waiting in queue
- `processing` - Currently executing
- `completed` - Successfully finished
- `failed` - Execution failed

### List Workspace Jobs
```http
GET /jobs/workspaces/{workspaceId}/jobs?page=1&limit=20
Authorization: Bearer {access-token}
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Join Workspace
```javascript
socket.emit('join:workspace', 'workspace-id');
```

### Leave Workspace
```javascript
socket.emit('leave:workspace', 'workspace-id');
```

### File Change Event
```javascript
socket.emit('file:change', {
  workspaceId: 'workspace-id',
  fileId: 'file-id',
  fileName: 'index.ts',
  changes: {
    line: 10,
    content: 'console.log("updated");'
  }
});
```

### Listen for Updates
```javascript
// User joined
socket.on('user:joined', (data) => {
  console.log('User joined:', data.userId);
});

// User left
socket.on('user:left', (data) => {
  console.log('User left:', data.userId);
});

// File changed
socket.on('file:changed', (data) => {
  console.log('File changed:', data.fileId, 'by', data.userId);
});

// Cursor moved
socket.on('cursor:moved', (data) => {
  console.log('Cursor:', data.userId, 'at', data.position);
});

// Activity update
socket.on('activity:update', (data) => {
  console.log('Activity:', data.action, 'by', data.userId);
});
```

## Health & Monitoring

### Health Check
```http
GET /health
```

**Response**:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Metrics (Prometheus)
```http
GET /metrics
```

Returns Prometheus-formatted metrics.

## API Documentation

Interactive API documentation available at:
```
http://localhost:3000/api-docs
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

**Common Error Codes**:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

Default limits:
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: Stricter limits apply
- Authenticated requests: Higher limits

Headers in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Testing with cURL

### Register and Login
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test123!"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Create Project (requires token)
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Project","description":"Test project"}'
```

## Postman Collection

Import the Swagger spec into Postman:
1. Open Postman
2. Import → Link
3. Paste: `http://localhost:3000/api-docs/swagger.json`

