import RabbitMQPublisher from '../../../../../src/infrastructure/messaging/rabbitmq/publisher';
import rabbitmqConnection from '../../../../../src/infrastructure/messaging/rabbitmq/connection';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/messaging/rabbitmq/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('RabbitMQPublisher', () => {
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChannel = {
      sendToQueue: jest.fn(),
      publish: jest.fn(),
    };

    (rabbitmqConnection.getChannel as jest.Mock).mockReturnValue(mockChannel);
  });

  describe('publishJob', () => {
    it('should publish job to queue successfully', async () => {
      const jobId = 'job-123';
      const workspaceId = 'workspace-123';
      const type = 'CODE_EXECUTION';
      const payload = { code: 'console.log("test")' };

      await RabbitMQPublisher.publishJob(jobId, workspaceId, type, payload);

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'jobs.pending',
        expect.any(Buffer),
        { persistent: true }
      );

      const sentMessage = JSON.parse(mockChannel.sendToQueue.mock.calls[0][1].toString());
      expect(sentMessage).toMatchObject({
        jobId,
        workspaceId,
        type,
        payload,
        attempt: 0,
      });
      expect(sentMessage).toHaveProperty('timestamp');
      expect(logger.info).toHaveBeenCalledWith('Job published to queue', { jobId, type });
    });

    it('should handle errors when publishing job', async () => {
      const error = new Error('Publish failed');
      mockChannel.sendToQueue.mockImplementation(() => {
        throw error;
      });

      await expect(
        RabbitMQPublisher.publishJob('job-123', 'workspace-123', 'CODE_EXECUTION', {})
      ).rejects.toThrow('Publish failed');

      expect(logger.error).toHaveBeenCalledWith('Error publishing job', {
        jobId: 'job-123',
        error,
      });
    });
  });

  describe('publishWorkspaceEvent', () => {
    it('should publish workspace event successfully', async () => {
      const workspaceId = 'workspace-123';
      const eventType = 'file:change';
      const data = { fileId: 'file-123', changes: [] };

      await RabbitMQPublisher.publishWorkspaceEvent(workspaceId, eventType, data);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'workspace.events',
        `workspace.${workspaceId}.${eventType}`,
        expect.any(Buffer),
        { persistent: true }
      );

      const sentMessage = JSON.parse(mockChannel.publish.mock.calls[0][2].toString());
      expect(sentMessage).toMatchObject({
        workspaceId,
        eventType,
        data,
      });
      expect(sentMessage).toHaveProperty('timestamp');
      expect(logger.debug).toHaveBeenCalledWith('Workspace event published', {
        workspaceId,
        eventType,
      });
    });

    it('should handle errors when publishing workspace event', async () => {
      const error = new Error('Publish failed');
      mockChannel.publish.mockImplementation(() => {
        throw error;
      });

      await expect(
        RabbitMQPublisher.publishWorkspaceEvent('workspace-123', 'file:change', {})
      ).rejects.toThrow('Publish failed');

      expect(logger.error).toHaveBeenCalledWith('Error publishing workspace event', {
        workspaceId: 'workspace-123',
        eventType: 'file:change',
        error,
      });
    });
  });
});

