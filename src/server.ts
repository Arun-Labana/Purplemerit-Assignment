import app from './app';
import config from './config';
import logger from './infrastructure/observability/logger';
import pgDatabase from './infrastructure/database/postgresql/connection';
import mongoDatabase from './infrastructure/database/mongodb/connection';
import redisClient from './infrastructure/database/redis/connection';
import rabbitmqConnection from './infrastructure/messaging/rabbitmq/connection';
import featureFlagService from './infrastructure/database/redis/FeatureFlagService';

const PORT = config.app.port;

async function startServer() {
  try {
    // Test database connections
    logger.info('Testing database connections...');

    const pgConnected = await pgDatabase.testConnection();
    if (!pgConnected) {
      throw new Error('PostgreSQL connection failed');
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

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: config.app.env,
        apiVersion: config.app.apiVersion,
      });
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      server.close(async () => {
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

