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

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- MongoDB on port 27017
- Redis on port 6379
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

## Architecture

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

### Environment Variables

See `.env.example` for all required environment variables.

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

