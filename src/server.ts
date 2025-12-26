import { createServer } from 'http';
import app from './app';
import config from './config';
import logger from './infrastructure/observability/logger';
import pgDatabase from './infrastructure/database/postgresql/connection';
import mongoDatabase from './infrastructure/database/mongodb/connection';
import redisClient from './infrastructure/database/redis/connection';
import rabbitmqConnection from './infrastructure/messaging/rabbitmq/connection';
import featureFlagService from './infrastructure/database/redis/FeatureFlagService';
import WebSocketServer from './infrastructure/websocket/socketServer';

const PORT = config.app.port;

async function startServer() {
  try {
    // Test database connections
    logger.info('Testing database connections...');

    const pgConnected = await pgDatabase.testConnection();
    if (!pgConnected) {
      throw new Error('PostgreSQL connection failed');
    }

    // Run migrations automatically on startup (only if tables don't exist)
    if (process.env.AUTO_MIGRATE === 'true') {
      try {
        logger.info('Checking if migrations are needed...');
        const result = await pgDatabase.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          );
        `);
        const tablesExist = result.rows[0].exists;
        
        if (!tablesExist) {
          logger.info('Tables not found, running migrations...');
          const fs = await import('fs');
          const path = await import('path');
          // Try multiple paths for schema.sql (dev vs production)
          const possiblePaths = [
            path.join(__dirname, '../infrastructure/database/postgresql/schema.sql'), // Production (dist/)
            path.join(__dirname, '../../src/infrastructure/database/postgresql/schema.sql'), // Alternative
            path.join(process.cwd(), 'src/infrastructure/database/postgresql/schema.sql'), // From project root
            path.join(process.cwd(), 'dist/infrastructure/database/postgresql/schema.sql'), // From project root dist
          ];
          
          let schemaPath: string | null = null;
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              schemaPath = possiblePath;
              break;
            }
          }
          
          if (!schemaPath) {
            throw new Error(`Schema file not found. Tried: ${possiblePaths.join(', ')}`);
          }
          
          logger.info(`Loading schema from: ${schemaPath}`);
          const schema = fs.readFileSync(schemaPath, 'utf8');
          await pgDatabase.query(schema);
          logger.info('Migrations completed successfully');
        } else {
          logger.info('Tables already exist, skipping migrations');
        }
      } catch (migrationError) {
        logger.warn('Auto-migration failed, continuing anyway', migrationError);
      }
    }

    const mongoConnected = await mongoDatabase.testConnection();
    if (!mongoConnected) {
      throw new Error('MongoDB connection failed');
    }

    const redisConnected = await redisClient.testConnection();
    if (!redisConnected) {
      throw new Error('Redis connection failed');
    }

    // Connect to RabbitMQ
    await rabbitmqConnection.connect();

    logger.info('All database connections successful');

    // Initialize feature flags
    await featureFlagService.initializeDefaults();
    logger.info('Feature flags initialized');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket server
    new WebSocketServer(httpServer, config.cors.origin);
    logger.info('WebSocket server initialized');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: config.app.env,
        apiVersion: config.app.apiVersion,
      });
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`WebSocket: ws://localhost:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        try {
          await pgDatabase.close();
          await mongoDatabase.close();
          await redisClient.close();
          await rabbitmqConnection.close();
          logger.info('Database connections closed');

          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();

