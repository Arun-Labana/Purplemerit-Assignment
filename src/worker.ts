import logger from './infrastructure/observability/logger';
import mongoDatabase from './infrastructure/database/mongodb/connection';
import rabbitmqConnection from './infrastructure/messaging/rabbitmq/connection';
import jobWorker from './infrastructure/workers/jobWorker';

async function startWorker() {
  try {
    logger.info('Initializing worker process...');

    // Connect to MongoDB
    const mongoConnected = await mongoDatabase.testConnection();
    if (!mongoConnected) {
      throw new Error('MongoDB connection failed');
    }

    // Connect to RabbitMQ
    await rabbitmqConnection.connect();

    logger.info('All worker connections established');

    // Start job worker
    await jobWorker.start();

    logger.info('Worker process started successfully');

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      try {
        await rabbitmqConnection.close();
        await mongoDatabase.close();
        logger.info('Worker connections closed');

        process.exit(0);
      } catch (error) {
        logger.error('Error during worker shutdown', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start worker', error);
    process.exit(1);
  }
}

startWorker();

