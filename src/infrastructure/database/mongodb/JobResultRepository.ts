import { JobResultModel } from './schemas/JobResult';
import { IJobResult } from '../../../shared/types';
import logger from '../../observability/logger';

export class JobResultRepository {
  async create(jobResultData: IJobResult): Promise<void> {
    try {
      await JobResultModel.create({
        jobId: jobResultData.jobId,
        inputPayload: jobResultData.inputPayload,
        outputResult: jobResultData.outputResult,
        logs: jobResultData.logs,
        errorMessages: jobResultData.errors,
      } as any);
    } catch (error) {
      logger.error('Error creating job result', { jobResultData, error });
      throw error;
    }
  }

  async findByJobId(jobId: string): Promise<IJobResult | null> {
    try {
      const result = await JobResultModel.findOne({ jobId }).lean();
      return result as any as IJobResult | null;
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
      return result as any as IJobResult | null;
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
      await JobResultModel.findOneAndUpdate({ jobId }, { $push: { errorMessages: errorMessage } });
    } catch (error) {
      logger.error('Error adding job error', { jobId, errorMessage, error });
      throw error;
    }
  }
}

export default new JobResultRepository();

