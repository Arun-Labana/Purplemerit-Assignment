import RabbitMQConsumer from '../../../../../src/infrastructure/messaging/rabbitmq/consumer';
import rabbitmqConnection from '../../../../../src/infrastructure/messaging/rabbitmq/connection';
import logger from '../../../../../src/infrastructure/observability/logger';
import { ConsumeMessage } from 'amqplib';

jest.mock('../../../../../src/infrastructure/messaging/rabbitmq/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('RabbitMQConsumer', () => {
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChannel = {
      prefetch: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue({ queue: 'temp-queue-123' }),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      ack: jest.fn(),
      nack: jest.fn(),
    };

    (rabbitmqConnection.getChannel as jest.Mock).mockReturnValue(mockChannel);
  });

  describe('consumeJobs', () => {
    it('should setup job consumer successfully', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      await RabbitMQConsumer.consumeJobs(handler);

      expect(mockChannel.prefetch).toHaveBeenCalledWith(1);
      expect(mockChannel.consume).toHaveBeenCalledWith('jobs.pending', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith('Started consuming jobs from queue');
    });

    it('should process job message successfully', async () => {
      const message = {
        jobId: 'job-123',
        type: 'CODE_EXECUTION',
        payload: {},
      };
      const mockMsg: Partial<ConsumeMessage> = {
        content: Buffer.from(JSON.stringify(message)),
      };
      const handler = jest.fn().mockResolvedValue(undefined);

      let consumeCallback: (msg: ConsumeMessage | null) => Promise<void>;
      mockChannel.consume.mockImplementation((_queue: string, callback: any) => {
        consumeCallback = callback;
      });

      await RabbitMQConsumer.consumeJobs(handler);
      await consumeCallback!(mockMsg as ConsumeMessage);

      expect(handler).toHaveBeenCalledWith(message);
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
      expect(logger.info).toHaveBeenCalledWith('Processing job from queue', {
        jobId: message.jobId,
      });
    });

    it('should handle null message', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      let consumeCallback: (msg: ConsumeMessage | null) => Promise<void>;
      mockChannel.consume.mockImplementation((_queue: string, callback: any) => {
        consumeCallback = callback;
      });

      await RabbitMQConsumer.consumeJobs(handler);
      await consumeCallback!(null);

      expect(handler).not.toHaveBeenCalled();
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    it('should handle handler errors and requeue', async () => {
      const message = { jobId: 'job-123' };
      const mockMsg: Partial<ConsumeMessage> = {
        content: Buffer.from(JSON.stringify(message)),
      };
      const error = new Error('Handler failed');
      const handler = jest.fn().mockRejectedValue(error);

      let consumeCallback: (msg: ConsumeMessage | null) => Promise<void>;
      mockChannel.consume.mockImplementation((_queue: string, callback: any) => {
        consumeCallback = callback;
      });

      await RabbitMQConsumer.consumeJobs(handler);
      await consumeCallback!(mockMsg as ConsumeMessage);

      expect(handler).toHaveBeenCalled();
      expect(mockChannel.nack).toHaveBeenCalledWith(mockMsg, false, true);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      (rabbitmqConnection.getChannel as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const handler = jest.fn();

      await expect(RabbitMQConsumer.consumeJobs(handler)).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('consumeWorkspaceEvents', () => {
    it('should setup workspace event consumer successfully', async () => {
      const workspaceId = 'workspace-123';
      const handler = jest.fn().mockResolvedValue(undefined);

      await RabbitMQConsumer.consumeWorkspaceEvents(workspaceId, handler);

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('', { exclusive: true });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'temp-queue-123',
        'workspace.events',
        `workspace.${workspaceId}.*`
      );
      expect(mockChannel.consume).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Started consuming workspace events', {
        workspaceId,
      });
    });

    it('should process workspace event message successfully', async () => {
      const workspaceId = 'workspace-123';
      const message = { eventType: 'file:change', data: {} };
      const mockMsg: Partial<ConsumeMessage> = {
        content: Buffer.from(JSON.stringify(message)),
      };
      const handler = jest.fn().mockResolvedValue(undefined);

      let consumeCallback: (msg: ConsumeMessage | null) => Promise<void>;
      mockChannel.consume.mockImplementation((_queue: string, callback: any) => {
        consumeCallback = callback;
      });

      await RabbitMQConsumer.consumeWorkspaceEvents(workspaceId, handler);
      await consumeCallback!(mockMsg as ConsumeMessage);

      expect(handler).toHaveBeenCalledWith(message);
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
    });

    it('should handle handler errors and ack anyway', async () => {
      const workspaceId = 'workspace-123';
      const message = { eventType: 'file:change' };
      const mockMsg: Partial<ConsumeMessage> = {
        content: Buffer.from(JSON.stringify(message)),
      };
      const error = new Error('Handler failed');
      const handler = jest.fn().mockRejectedValue(error);

      let consumeCallback: (msg: ConsumeMessage | null) => Promise<void>;
      mockChannel.consume.mockImplementation((_queue: string, callback: any) => {
        consumeCallback = callback;
      });

      await RabbitMQConsumer.consumeWorkspaceEvents(workspaceId, handler);
      await consumeCallback!(mockMsg as ConsumeMessage);

      expect(handler).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle null message', async () => {
      const workspaceId = 'workspace-123';
      const handler = jest.fn().mockResolvedValue(undefined);

      let consumeCallback: (msg: ConsumeMessage | null) => Promise<void>;
      mockChannel.consume.mockImplementation((_queue: string, callback: any) => {
        consumeCallback = callback;
      });

      await RabbitMQConsumer.consumeWorkspaceEvents(workspaceId, handler);
      await consumeCallback!(null);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

