import JobRepository from '../../../../../src/infrastructure/database/postgresql/JobRepository';
import pgDatabase from '../../../../../src/infrastructure/database/postgresql/connection';
import { JobStatus, JobType } from '../../../../../src/shared/constants/enums';

jest.mock('../../../../../src/infrastructure/database/postgresql/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('JobRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find job by id', async () => {
      const mockJob = {
        id: 'job-123',
        workspaceId: 'workspace-123',
        type: JobType.CODE_EXECUTION,
        status: JobStatus.PENDING,
        retries: 0,
        maxRetries: 3,
        createdAt: new Date(),
        completedAt: null,
        errorMessage: null,
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockJob] });

      const result = await JobRepository.findById('job-123');

      expect(result).toEqual(mockJob);
    });
  });

  describe('findByWorkspaceId', () => {
    it('should find jobs by workspace id', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          workspaceId: 'workspace-123',
          type: JobType.CODE_EXECUTION,
          status: JobStatus.PENDING,
        },
      ];
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: mockJobs });

      const result = await JobRepository.findByWorkspaceId('workspace-123', 20, 0);

      expect(result).toEqual(mockJobs);
    });
  });

  describe('create', () => {
    it('should create job', async () => {
      const jobData = {
        workspaceId: 'workspace-123',
        type: JobType.CODE_EXECUTION,
        payload: {},
      };
      const mockJob = {
        ...jobData,
        id: 'job-123',
        status: JobStatus.PENDING,
        retries: 0,
        maxRetries: 3,
        createdAt: new Date(),
        completedAt: null,
        errorMessage: null,
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockJob] });

      const result = await JobRepository.create(jobData);

      expect(result.status).toBe(JobStatus.PENDING);
    });
  });

  describe('updateStatus', () => {
    it('should update job status to completed', async () => {
      const mockJob = {
        id: 'job-123',
        workspaceId: 'workspace-123',
        type: JobType.CODE_EXECUTION,
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockJob] });

      const result = await JobRepository.updateStatus('job-123', JobStatus.COMPLETED);

      expect(result?.status).toBe(JobStatus.COMPLETED);
    });

    it('should update job status with error message', async () => {
      const mockJob = {
        id: 'job-123',
        status: JobStatus.FAILED,
        errorMessage: 'Error occurred',
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockJob] });

      const result = await JobRepository.updateStatus('job-123', JobStatus.FAILED, 'Error occurred');

      expect(result?.errorMessage).toBe('Error occurred');
    });
  });

  describe('incrementRetries', () => {
    it('should increment job retries', async () => {
      const mockJob = {
        id: 'job-123',
        retries: 1,
      };
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [mockJob] });

      const result = await JobRepository.incrementRetries('job-123');

      expect(result?.retries).toBe(1);
    });
  });

  describe('countByStatus', () => {
    it('should count jobs by status', async () => {
      (pgDatabase.query as jest.Mock).mockResolvedValue({ rows: [{ count: '5' }] });

      const result = await JobRepository.countByStatus(JobStatus.PENDING);

      expect(result).toBe(5);
    });
  });
});

