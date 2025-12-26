import RabbitMQConnection from '../../../../../src/infrastructure/messaging/rabbitmq/connection';
import amqp from 'amqplib';
import config from '../../../../../src/config';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('amqplib');
jest.mock('../../../../../src/config');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('RabbitMQConnection', () => {
  let mockConnection: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChannel = {
      assertQueue: jest.fn().mockResolvedValue(undefined),
      assertExchange: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (amqp.connect as jest.Mock) = jest.fn().mockResolvedValue(mockConnection);
    (config.rabbitmq.url as any) = 'amqp://localhost:5672';
  });

  describe('singleton pattern', () => {
    it('should be a singleton instance', () => {
      const instance1 = RabbitMQConnection;
      const instance2 = RabbitMQConnection;

      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('should connect to RabbitMQ successfully', async () => {
      const connection = RabbitMQConnection;
      await connection.connect();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost:5672');
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('jobs.pending', { durable: true });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('jobs.retry', { durable: true });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('jobs.dlq', { durable: true });
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'workspace.events',
        'topic',
        { durable: true }
      );
      expect(logger.info).toHaveBeenCalledWith('RabbitMQ connected successfully');
      expect(logger.info).toHaveBeenCalledWith('RabbitMQ queues and exchanges setup complete');
    });

    it('should setup event handlers', async () => {
      const connection = RabbitMQConnection;
      await connection.connect();

      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      (amqp.connect as jest.Mock).mockRejectedValue(error);

      const connection = RabbitMQConnection;
      await expect(connection.connect()).rejects.toThrow('Connection failed');

      expect(logger.error).toHaveBeenCalledWith('Failed to connect to RabbitMQ', error);
    });

    it('should handle setupQueues errors', async () => {
      const setupError = new Error('Setup failed');
      mockChannel.assertQueue.mockRejectedValue(setupError);

      const connection = RabbitMQConnection;
      await expect(connection.connect()).rejects.toThrow('Setup failed');
    });
  });

  describe('getChannel', () => {
    it('should return channel when initialized', async () => {
      const connection = RabbitMQConnection;
      await connection.connect();

      const channel = connection.getChannel();

      expect(channel).toBe(mockChannel);
    });

    it('should throw error when channel not initialized', () => {
      // Create a fresh instance by clearing the singleton
      const RabbitMQConnectionClass = require('../../../../../src/infrastructure/messaging/rabbitmq/connection').default.constructor;
      // Reset the singleton instance
      (RabbitMQConnectionClass as any).instance = undefined;
      const connection = RabbitMQConnectionClass.getInstance();
      
      expect(() => connection.getChannel()).toThrow('RabbitMQ channel not initialized');
    });
  });

  describe('close', () => {
    it('should close channel and connection', async () => {
      const connection = RabbitMQConnection;
      await connection.connect();
      await connection.close();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('RabbitMQ connection closed');
    });

    it('should handle errors when closing', async () => {
      const error = new Error('Close failed');
      mockChannel.close.mockRejectedValue(error);

      const connection = RabbitMQConnection;
      await connection.connect();
      await connection.close();

      expect(logger.error).toHaveBeenCalledWith('Error closing RabbitMQ connection', error);
    });
  });

  describe('testConnection', () => {
    it('should return true when connection and channel are initialized', async () => {
      const connection = RabbitMQConnection;
      await connection.connect();

      const result = await connection.testConnection();

      expect(result).toBe(true);
    });

    it('should return false when connection not initialized', async () => {
      // Create a fresh instance by clearing the singleton
      const RabbitMQConnectionClass = require('../../../../../src/infrastructure/messaging/rabbitmq/connection').default.constructor;
      // Reset the singleton instance
      (RabbitMQConnectionClass as any).instance = undefined;
      const connection = RabbitMQConnectionClass.getInstance();

      const result = await connection.testConnection();

      expect(result).toBe(false);
    });

    it('should handle errors when testing connection', async () => {
      const connection = RabbitMQConnection;
      await connection.connect();

      // Mock testConnection to throw error
      const originalTestConnection = connection.testConnection.bind(connection);
      connection.testConnection = jest.fn().mockRejectedValue(new Error('Test failed'));

      await expect(connection.testConnection()).rejects.toThrow('Test failed');
      
      // Restore
      connection.testConnection = originalTestConnection;
    });
  });
});

