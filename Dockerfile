# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
# Copy schema.sql file for migrations
COPY --from=builder /app/src/infrastructure/database/postgresql/schema.sql ./src/infrastructure/database/postgresql/schema.sql

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "dist/server.js"]

