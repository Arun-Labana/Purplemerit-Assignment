# Collaborative Workspace Backend

A production-grade real-time collaborative workspace backend built with Node.js, Express, TypeScript, and Clean Architecture.

## Features

- 🔐 **Authentication & Authorization**: JWT with refresh tokens, RBAC (Owner/Collaborator/Viewer)
- 📦 **Project & Workspace Management**: Full CRUD operations with role-based permissions
- ⚡ **Real-Time Collaboration**: WebSocket support for live updates
- 🔄 **Asynchronous Job Processing**: Background workers with RabbitMQ
- 💾 **Multi-Datastore Architecture**:
  - **PostgreSQL**: Relational data (users, projects, workspaces, members, jobs)
  - **MongoDB**: Event logs and activity tracking
  - **Redis**: Caching, sessions, feature flags
- 📊 **Observability**: Structured logging (Winston) and Prometheus metrics
- 🚀 **Feature Flags**: Dynamic feature management
- 🧪 **Testing**: Unit and integration tests with Jest
- 🐳 **Docker**: Containerized services for easy deployment

## Architecture

### Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Client]
        MOBILE[Mobile Client]
    end

    subgraph "Presentation Layer"
        API[Express API Server]
        WS[WebSocket Server]
        MIDDLEWARE[Auth/Rate Limit/Validation Middleware]
    end

    subgraph "Application Layer"
        UC1[Auth Use Cases]
        UC2[Project Use Cases]
        UC3[Job Use Cases]
        UC4[Collaboration Use Cases]
    end

    subgraph "Domain Layer"
        ENTITIES[Entities: User, Project, Workspace, Job]
        VO[Value Objects: Role, Email]
    end

    subgraph "Infrastructure Layer"
        PG[(PostgreSQL<br/>Relational Data)]
        MONGO[(MongoDB<br/>Event Logs)]
        REDIS[(Redis<br/>Cache/Sessions)]
        RABBITMQ[RabbitMQ<br/>Message Queue]
        WORKER[Background Worker]
    end

    WEB --> API
    MOBILE --> API
    WEB --> WS
    
    API --> MIDDLEWARE
    MIDDLEWARE --> UC1
    MIDDLEWARE --> UC2
    MIDDLEWARE --> UC3
    MIDDLEWARE --> UC4
    
    UC1 --> ENTITIES
    UC2 --> ENTITIES
    UC3 --> ENTITIES
    UC4 --> ENTITIES
    
    ENTITIES --> VO
    
    UC1 --> PG
    UC2 --> PG
    UC3 --> PG
    UC4 --> PG
    
    UC1 --> REDIS
    UC2 --> REDIS
    UC3 --> REDIS
    UC4 --> REDIS
    
    UC2 --> MONGO
    UC3 --> MONGO
    UC4 --> MONGO
    
    UC3 --> RABBITMQ
    RABBITMQ --> WORKER
    WORKER --> PG
    WORKER --> MONGO
    
    WS --> REDIS
    WS --> RABBITMQ
```

### Multi-Datastore Strategy

- **PostgreSQL**: ACID-compliant relational data (users, projects, workspaces, members, jobs)
- **MongoDB**: High-write event logs (activity logs, collaboration events, job results)
- **Redis**: In-memory caching, sessions, and feature flags

### Clean Architecture

The application follows Clean Architecture principles:
1. **Domain Layer**: Business entities and rules
2. **Application Layer**: Use cases and business logic
3. **Infrastructure Layer**: Database implementations and external services
4. **Presentation Layer**: API controllers and routes

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express
- **Language**: TypeScript
- **Databases**: PostgreSQL, MongoDB, Redis
- **Message Queue**: RabbitMQ
- **Real-time**: Socket.io
- **Testing**: Jest, Supertest
- **Architecture**: Clean Architecture / Domain-Driven Design

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose (for local development)
- npm or yarn

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd purplemerit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database URLs (matching docker-compose ports)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/collaborative_workspace
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
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 4. Start Services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5433 (mapped from internal 5432)
- MongoDB on port 27017
- Redis on port 6380 (mapped from internal 6379)
- RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)

### 5. Run Database Migrations

```bash
npm run migrate
```

### 6. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### 7. Start Background Worker (in separate terminal)

```bash
npm run worker:dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run worker` - Start background worker
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run migrate` - Run database migrations

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/health`
- Metrics: `http://localhost:3000/metrics`

## Project Structure

```
src/
├── domain/               # Domain Layer (Entities, Value Objects)
├── application/          # Application Layer (Use Cases)
├── infrastructure/       # Infrastructure Layer (Databases, External Services)
├── presentation/         # Presentation Layer (Controllers, Routes, Middleware)
├── shared/              # Shared utilities and types
└── config/              # Configuration
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Deployment

### Using Docker

```bash
# Build image
docker build -t collaborative-workspace .

# Run container
docker run -p 3000:3000 --env-file .env collaborative-workspace
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Run migrations
npm run migrate
```

### Using Kubernetes (Cloud-Ready, Scalable)

For production-grade cloud deployment with auto-scaling:

```bash
# See k8s/README.md for detailed instructions
kubectl apply -k k8s/
```

The Kubernetes deployment includes:
- **Auto-scaling**: HorizontalPodAutoscaler (3-10 API pods, 2-5 worker pods)
- **Health checks**: Liveness, readiness, and startup probes
- **Rolling updates**: Zero-downtime deployments
- **Service discovery**: Internal ClusterIP services
- **Ingress**: External routing with TLS termination
- **Resource management**: CPU and memory limits

See `k8s/README.md` for complete Kubernetes deployment guide.

### Environment Variables

Required environment variables (for docker-compose setup):
- `DATABASE_URL` - PostgreSQL connection string (use `postgresql://postgres:postgres@localhost:5433/collaborative_workspace` for docker-compose)
- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/collaborative_workspace`)
- `REDIS_URL` - Redis connection string (use `redis://localhost:6380` for docker-compose)
- `RABBITMQ_URL` - RabbitMQ connection string (default: `amqp://admin:admin@localhost:5672`)
- `JWT_SECRET` - Secret key for JWT access tokens (required in production)
- `JWT_REFRESH_SECRET` - Secret key for JWT refresh tokens (required in production)
- `JWT_EXPIRES_IN` - Access token expiry (default: `15m`)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (default: `7d`)
- `CORS_ORIGIN` - Comma-separated list of allowed origins
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: `60000`)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: `100`)
- `LOG_LEVEL` - Logging level (default: `info`)

## Design Decisions

1. **Clean Architecture**: Separation of concerns, testability, and maintainability
2. **Multi-Datastore**: Right tool for each job (PostgreSQL for transactions, MongoDB for logs, Redis for caching)
3. **TypeScript**: Type safety and better developer experience
4. **JWT with Refresh Tokens**: Balance between security and UX
5. **RabbitMQ**: Reliable message queue for job processing with retry logic

## Scalability Considerations

- Stateless API design for horizontal scaling
- Redis-backed caching and sessions
- RabbitMQ for distributed job processing
- Database connection pooling
- Indexed database queries

## License

MIT

## Author

Arun Labana

