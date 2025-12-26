import JobWorker from '../../../../src/infrastructure/workers/jobWorker';
import rabbitmqConsumer from '../../../../src/infrastructure/messaging/rabbitmq/consumer';
import JobRepository from '../../../../src/infrastructure/database/postgresql/JobRepository';
import JobResultRepository from '../../../../src/infrastructure/database/mongodb/JobResultRepository';
import { JobStatus } from '../../../../src/shared/constants/enums';
import { processJob } from '../../../../src/infrastructure/workers/processors/jobProcessors';
import { APP_CONSTANTS } from '../../../../src/shared/constants';
import logger from '../../../../src/infrastructure/observability/logger';

jest.mock('../../../../src/infrastructure/messaging/rabbitmq/consumer');
jest.mock('../../../../src/infrastructure/database/postgresql/JobRepository');
jest.mock('../../../../src/infrastructure/database/mongodb/JobResultRepository');
jest.mock('../../../../src/infrastructure/workers/processors/jobProcessors');
jest.mock('../../../../src/infrastructure/observability/logger');

describe('JobWorker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should start job worker and process jobs successfully', async () => {
      const jobId = 'job-123';
      const message = {
        jobId,
        type: 'CODE_EXECUTION',
        payload: { code: 'console.log("test")' },
      };
      const result = { output: 'test output' };

      let messageHandler: (msg: any) => Promise<void>;
      (rabbitmqConsumer.consumeJobs as jest.Mock).mockImplementation(async (handler) => {
        messageHandler = handler;
      });
      (JobRepository.updateStatus as jest.Mock).mockResolvedValue(undefined);
      (processJob as jest.Mock).mockResolvedValue(result);
      (JobResultRepository.update as jest.Mock).mockResolvedValue(undefined);

      await JobWorker.start();
      await messageHandler!(message);

      expect(rabbitmqConsumer.consumeJobs).toHaveBeenCalled();
      expect(JobRepository.updateStatus).toHaveBeenCalledWith(jobId, JobStatus.PROCESSING);
      expect(processJob).toHaveBeenCalledWith(message.type, message.payload);
      expect(JobRepository.updateStatus).toHaveBeenCalledWith(jobId, JobStatus.COMPLETED);
      expect(JobResultRepository.update).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Job completed successfully', {
        jobId,
        type: message.type,
      });
    });

    it('should handle job processing errors and retry', async () => {
      const jobId = 'job-123';
      const message = {
        jobId,
        type: 'CODE_EXECUTION',
        payload: {},
      };
      const error = new Error('Processing failed');
      const job = { id: jobId, retries: 1 };

      let messageHandler: (msg: any) => Promise<void>;
      (rabbitmqConsumer.consumeJobs as jest.Mock).mockImplementation(async (handler) => {
        messageHandler = handler;
      });
      (JobRepository.updateStatus as jest.Mock).mockResolvedValue(undefined);
      (processJob as jest.Mock).mockRejectedValue(error);
      (JobRepository.incrementRetries as jest.Mock).mockResolvedValue(job);
      (JobResultRepository.addError as jest.Mock).mockResolvedValue(undefined);

      await JobWorker.start();
      await messageHandler!(message);

      expect(JobRepository.incrementRetries).toHaveBeenCalledWith(jobId);
      expect(JobRepository.updateStatus).toHaveBeenCalledWith(jobId, JobStatus.PENDING);
      expect(JobResultRepository.addError).toHaveBeenCalledWith(jobId, error.message);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should mark job as failed after max retries', async () => {
      const jobId = 'job-123';
      const message = {
        jobId,
        type: 'CODE_EXECUTION',
        payload: {},
      };
      const error = new Error('Processing failed');
      const job = { id: jobId, retries: APP_CONSTANTS.MAX_JOB_RETRIES };

      let messageHandler: (msg: any) => Promise<void>;
      (rabbitmqConsumer.consumeJobs as jest.Mock).mockImplementation(async (handler) => {
        messageHandler = handler;
      });
      (JobRepository.updateStatus as jest.Mock).mockResolvedValue(undefined);
      (processJob as jest.Mock).mockRejectedValue(error);
      (JobRepository.incrementRetries as jest.Mock).mockResolvedValue(job);
      (JobResultRepository.addError as jest.Mock).mockResolvedValue(undefined);

      await JobWorker.start();
      await messageHandler!(message);

      expect(JobRepository.updateStatus).toHaveBeenCalledWith(
        jobId,
        JobStatus.FAILED,
        error.message
      );
      expect(JobResultRepository.addError).toHaveBeenCalledWith(
        jobId,
        `Max retries exceeded: ${error.message}`
      );
      expect(logger.error).toHaveBeenCalledWith('Job failed after max retries', { jobId });
    });

    it('should handle job with null retries result', async () => {
      const jobId = 'job-123';
      const message = {
        jobId,
        type: 'CODE_EXECUTION',
        payload: {},
      };
      const error = new Error('Processing failed');

      let messageHandler: (msg: any) => Promise<void>;
      (rabbitmqConsumer.consumeJobs as jest.Mock).mockImplementation(async (handler) => {
        messageHandler = handler;
      });
      (JobRepository.updateStatus as jest.Mock).mockResolvedValue(undefined);
      (processJob as jest.Mock).mockRejectedValue(error);
      (JobRepository.incrementRetries as jest.Mock).mockResolvedValue(null);

      await JobWorker.start();
      await messageHandler!(message);

      expect(JobRepository.updateStatus).toHaveBeenCalledWith(
        jobId,
        JobStatus.FAILED,
        error.message
      );
    });
  });
});

