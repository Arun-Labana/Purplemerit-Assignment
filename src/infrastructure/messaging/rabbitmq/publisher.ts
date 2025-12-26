import rabbitmqConnection from './connection';
import logger from '../../observability/logger';

export class RabbitMQPublisher {
  async publishJob(jobId: string, workspaceId: string, type: string, payload: any): Promise<void> {
    try {
      const channel = rabbitmqConnection.getChannel();

      const message = {
        jobId,
        workspaceId,
        type,
        payload,
        attempt: 0,
        timestamp: new Date().toISOString(),
      };

      channel.sendToQueue('jobs.pending', Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });

      logger.info('Job published to queue', { jobId, type });
    } catch (error) {
      logger.error('Error publishing job', { jobId, error });
      throw error;
    }
  }

  async publishWorkspaceEvent(workspaceId: string, eventType: string, data: any): Promise<void> {
    try {
      const channel = rabbitmqConnection.getChannel();

      const message = {
        workspaceId,
        eventType,
        data,
        timestamp: new Date().toISOString(),
      };

      const routingKey = `workspace.${workspaceId}.${eventType}`;

      channel.publish('workspace.events', routingKey, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });

      logger.debug('Workspace event published', { workspaceId, eventType });
    } catch (error) {
      logger.error('Error publishing workspace event', { workspaceId, eventType, error });
      throw error;
    }
  }
}

export default new RabbitMQPublisher();

