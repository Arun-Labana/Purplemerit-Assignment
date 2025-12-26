import amqp, { Connection, Channel } from 'amqplib';
import config from '../../../config';
import logger from '../../observability/logger';

class RabbitMQConnection {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private static instance: RabbitMQConnection;

  private constructor() {}

  public static getInstance(): RabbitMQConnection {
    if (!RabbitMQConnection.instance) {
      RabbitMQConnection.instance = new RabbitMQConnection();
    }
    return RabbitMQConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      logger.info('RabbitMQ connected successfully');

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
      });

      // Setup exchanges and queues
      await this.setupQueues();
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    // Create job queues
    await this.channel.assertQueue('jobs.pending', { durable: true });
    await this.channel.assertQueue('jobs.retry', { durable: true });
    await this.channel.assertQueue('jobs.dlq', { durable: true });

    // Create workspace events exchange
    await this.channel.assertExchange('workspace.events', 'topic', { durable: true });

    logger.info('RabbitMQ queues and exchanges setup complete');
  }

  public getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }

  public async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', error);
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      return this.connection !== null && this.channel !== null;
    } catch (error) {
      logger.error('RabbitMQ connection test failed', error);
      return false;
    }
  }
}

export default RabbitMQConnection.getInstance();

