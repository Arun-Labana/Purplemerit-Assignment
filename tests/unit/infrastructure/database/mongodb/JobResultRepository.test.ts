import JobResultRepository from '../../../../../src/infrastructure/database/mongodb/JobResultRepository';
import { JobResultModel } from '../../../../../src/infrastructure/database/mongodb/schemas/JobResult';

jest.mock('../../../../../src/infrastructure/database/mongodb/schemas/JobResult');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('JobResultRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create job result', async () => {
      const jobResultData = {
        jobId: 'job-123',
        inputPayload: { code: 'test' },
        outputResult: null,
        logs: [],
        errors: [],
      };
      (JobResultModel.create as jest.Mock).mockResolvedValue(undefined);

      await JobResultRepository.create(jobResultData);

      expect(JobResultModel.create).toHaveBeenCalled();
    });
  });

  describe('findByJobId', () => {
    it('should find job result by job id', async () => {
      const mockResult = {
        jobId: 'job-123',
        inputPayload: { code: 'test' },
        outputResult: { result: 'success' },
        logs: [],
        errorMessages: [],
      };
      (JobResultModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResult),
      });

      const result = await JobResultRepository.findByJobId('job-123');

      expect(result).toBeDefined();
    });

    it('should return null when job result not found', async () => {
      (JobResultModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await JobResultRepository.findByJobId('job-123');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update job result', async () => {
      const updates = { outputResult: { result: 'success' } };
      const mockResult = { jobId: 'job-123', ...updates };
      (JobResultModel.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockResult),
      });

      const result = await JobResultRepository.update('job-123', updates);

      expect(result).toEqual(mockResult);
    });
  });

  describe('addLog', () => {
    it('should add log to job result', async () => {
      (JobResultModel.findOneAndUpdate as jest.Mock).mockResolvedValue(undefined);

      await JobResultRepository.addLog('job-123', 'Log message');

      expect(JobResultModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('addError', () => {
    it('should add error to job result', async () => {
      (JobResultModel.findOneAndUpdate as jest.Mock).mockResolvedValue(undefined);

      await JobResultRepository.addError('job-123', 'Error message');

      expect(JobResultModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });
});

