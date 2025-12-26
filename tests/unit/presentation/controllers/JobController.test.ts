import { Response, NextFunction } from 'express';
import JobController from '../../../../src/presentation/controllers/JobController';
import SubmitJob from '../../../../src/application/use-cases/jobs/SubmitJob';
import GetJobStatus from '../../../../src/application/use-cases/jobs/GetJobStatus';
import JobRepository from '../../../../src/infrastructure/database/postgresql/JobRepository';
import { AuthRequest } from '../../../../src/presentation/middleware/authMiddleware';
import { Job } from '../../../../src/domain/entities/Job';
import { JobType, JobStatus } from '../../../../src/shared/constants/enums';

jest.mock('../../../../src/application/use-cases/jobs/SubmitJob');
jest.mock('../../../../src/application/use-cases/jobs/GetJobStatus');
jest.mock('../../../../src/infrastructure/database/postgresql/JobRepository');

describe('JobController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
      },
      params: { id: 'job-123', workspaceId: 'workspace-123' },
      body: {
        workspaceId: 'workspace-123',
        type: JobType.CODE_EXECUTION,
        payload: { code: 'console.log("test")' },
      },
      query: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submit', () => {
    it('should submit job successfully', async () => {
      const mockJob = new Job(
        'job-123',
        'workspace-123',
        JobType.CODE_EXECUTION,
        JobStatus.PENDING,
        0,
        3,
        new Date(),
        null,
        null
      );
      (SubmitJob.execute as jest.Mock).mockResolvedValue(mockJob);

      await JobController.submit(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(SubmitJob.execute).toHaveBeenCalledWith(mockRequest.body, 'user-123');
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Submit failed');
      (SubmitJob.execute as jest.Mock).mockRejectedValue(error);

      await JobController.submit(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getStatus', () => {
    it('should get job status successfully', async () => {
      const mockJob = new Job(
        'job-123',
        'workspace-123',
        JobType.CODE_EXECUTION,
        JobStatus.PENDING,
        0,
        3,
        new Date(),
        null,
        null
      );
      const mockResult = { result: 'success' };
      (GetJobStatus.execute as jest.Mock).mockResolvedValue({ job: mockJob, result: mockResult });

      await JobController.getStatus(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(GetJobStatus.execute).toHaveBeenCalledWith('job-123', 'user-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Get status failed');
      (GetJobStatus.execute as jest.Mock).mockRejectedValue(error);

      await JobController.getStatus(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('listByWorkspace', () => {
    it('should list jobs by workspace successfully', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          workspaceId: 'workspace-123',
          type: JobType.CODE_EXECUTION,
          status: JobStatus.PENDING,
          createdAt: new Date(),
        },
      ];
      (JobRepository.findByWorkspaceId as jest.Mock).mockResolvedValue(mockJobs);

      await JobController.listByWorkspace(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(JobRepository.findByWorkspaceId).toHaveBeenCalledWith('workspace-123', 20, 0);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should handle custom pagination', async () => {
      mockRequest.query = { page: '2', limit: '10' };
      (JobRepository.findByWorkspaceId as jest.Mock).mockResolvedValue([]);

      await JobController.listByWorkspace(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(JobRepository.findByWorkspaceId).toHaveBeenCalledWith('workspace-123', 10, 10);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('List failed');
      (JobRepository.findByWorkspaceId as jest.Mock).mockRejectedValue(error);

      await JobController.listByWorkspace(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

