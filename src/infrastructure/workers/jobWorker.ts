import rabbitmqConnection from '../messaging/rabbitmq/connection';
import rabbitmqConsumer from '../messaging/rabbitmq/consumer';
import JobRepository from '../database/postgresql/JobRepository';
import JobResultRepository from '../database/mongodb/JobResultRepository';
import { JobStatus } from '../../shared/constants/enums';
import { processJob } from './processors/jobProcessors';
import { APP_CONSTANTS } from '../../shared/constants';
import logger from '../observability/logger';

export class JobWorker {
  async start(): Promise<void> {
    logger.info('Starting job worker...');

    await rabbitmqConsumer.consumeJobs(async (message) => {
      const { jobId, type, payload, attempt = 0 } = message;

      try {
        // Update job status to processing
        await JobRepository.updateStatus(jobId, JobStatus.PROCESSING);

        // Process the job
        const result = await processJob(type, payload);

        // Update job as completed
        await JobRepository.updateStatus(jobId, JobStatus.COMPLETED);

        // Store result in MongoDB
        await JobResultRepository.update(jobId, {
          outputResult: result,
          logs: [`Job completed successfully at ${new Date().toISOString()}`],
        } as any);

        logger.info('Job completed successfully', { jobId, type });
      } catch (error: any) {
        logger.error('Job processing failed', { jobId, type, error: error.message });

        // Increment retry count
        const job = await JobRepository.incrementRetries(jobId);

        if (job && job.retries < APP_CONSTANTS.MAX_JOB_RETRIES) {
          // Retry logic - exponential backoff
          const delay = APP_CONSTANTS.JOB_RETRY_DELAYS[job.retries - 1] || 5000;

          logger.info('Job will be retried', {
            jobId,
            attempt: job.retries,
            delay: `${delay}ms`,
          });

          // In a real implementation, you'd use RabbitMQ delayed messages
          // For now, we'll just update the status
          await JobRepository.updateStatus(jobId, JobStatus.PENDING);

          // Add error to job result
          await JobResultRepository.addError(jobId, error.message);
        } else {
          // Max retries exceeded
          await JobRepository.updateStatus(jobId, JobStatus.FAILED, error.message);
          await JobResultRepository.addError(jobId, `Max retries exceeded: ${error.message}`);

          logger.error('Job failed after max retries', { jobId });
        }
      }
    });

    logger.info('Job worker started successfully');
  }
}

export default new JobWorker();

