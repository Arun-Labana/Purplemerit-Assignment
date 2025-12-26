import { JobResultModel } from './schemas/JobResult';
import { IJobResult } from '../../../shared/types';
import logger from '../../observability/logger';

export class JobResultRepository {
  async create(jobResultData: IJobResult): Promise<void> {
    try {
      await JobResultModel.create(jobResultData);
    } catch (error) {
      logger.error('Error creating job result', { jobResultData, error });
      throw error;
    }
  }

  async findByJobId(jobId: string): Promise<IJobResult | null> {
    try {
      const result = await JobResultModel.findOne({ jobId }).lean();
      return result;
    } catch (error) {
      logger.error('Error finding job result', { jobId, error });
      throw error;
    }
  }

  async update(jobId: string, updates: Partial<IJobResult>): Promise<IJobResult | null> {
    try {
      const result = await JobResultModel.findOneAndUpdate({ jobId }, updates, {
        new: true,
      }).lean();
      return result;
    } catch (error) {
      logger.error('Error updating job result', { jobId, updates, error });
      throw error;
    }
  }

  async addLog(jobId: string, log: string): Promise<void> {
    try {
      await JobResultModel.findOneAndUpdate({ jobId }, { $push: { logs: log } });
    } catch (error) {
      logger.error('Error adding job log', { jobId, log, error });
      throw error;
    }
  }

  async addError(jobId: string, errorMessage: string): Promise<void> {
    try {
      await JobResultModel.findOneAndUpdate({ jobId }, { $push: { errors: errorMessage } });
    } catch (error) {
      logger.error('Error adding job error', { jobId, errorMessage, error });
      throw error;
    }
  }
}

export default new JobResultRepository();

