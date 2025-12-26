import rabbitmqConnection from './connection';
import logger from '../../observability/logger';
import { ConsumeMessage } from 'amqplib';

export type MessageHandler = (message: any) => Promise<void>;

export class RabbitMQConsumer {
  async consumeJobs(handler: MessageHandler): Promise<void> {
    try {
      const channel = rabbitmqConnection.getChannel();

      // Set prefetch to 1 for fair dispatch
      await channel.prefetch(1);

      await channel.consume('jobs.pending', async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const message = JSON.parse(msg.content.toString());
          logger.info('Processing job from queue', { jobId: message.jobId });

          await handler(message);

          // Acknowledge message
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing job message', error);
          // Reject and requeue
          channel.nack(msg, false, true);
        }
      });

      logger.info('Started consuming jobs from queue');
    } catch (error) {
      logger.error('Error setting up job consumer', error);
      throw error;
    }
  }

  async consumeWorkspaceEvents(workspaceId: string, handler: MessageHandler): Promise<void> {
    try {
      const channel = rabbitmqConnection.getChannel();

      // Create a temporary queue for this consumer
      const { queue } = await channel.assertQueue('', { exclusive: true });

      // Bind to workspace events
      const routingKey = `workspace.${workspaceId}.*`;
      await channel.bindQueue(queue, 'workspace.events', routingKey);

      await channel.consume(queue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const message = JSON.parse(msg.content.toString());
          await handler(message);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing workspace event', error);
          channel.ack(msg); // Ack anyway for events
        }
      });

      logger.info('Started consuming workspace events', { workspaceId });
    } catch (error) {
      logger.error('Error setting up workspace event consumer', error);
      throw error;
    }
  }
}

export default new RabbitMQConsumer();

