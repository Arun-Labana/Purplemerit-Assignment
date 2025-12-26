import { Job } from '../../../src/domain/entities/Job';
import { ValidationError } from '../../../src/shared/errors';
import { JobStatus, JobType } from '../../../src/shared/constants/enums';

describe('Job Entity', () => {
  const validJobData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    workspaceId: 'workspace-123',
    type: JobType.CODE_EXECUTION,
    status: JobStatus.PENDING,
    retries: 0,
    maxRetries: 3,
    createdAt: new Date('2024-01-01'),
    completedAt: null,
    errorMessage: null,
  };

  describe('constructor', () => {
    it('should create a Job instance with valid data', () => {
      const job = new Job(
        validJobData.id,
        validJobData.workspaceId,
        validJobData.type,
        validJobData.status,
        validJobData.retries,
        validJobData.maxRetries,
        validJobData.createdAt,
        validJobData.completedAt,
        validJobData.errorMessage
      );

      expect(job).toBeInstanceOf(Job);
      expect(job.id).toBe(validJobData.id);
      expect(job.workspaceId).toBe(validJobData.workspaceId);
      expect(job.type).toBe(validJobData.type);
    });

    it('should throw ValidationError for empty workspaceId', () => {
      expect(() => {
        new Job(
          validJobData.id,
          '',
          validJobData.type,
          validJobData.status,
          validJobData.retries,
          validJobData.maxRetries,
          validJobData.createdAt,
          validJobData.completedAt,
          validJobData.errorMessage
        );
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty type', () => {
      expect(() => {
        new Job(
          validJobData.id,
          validJobData.workspaceId,
          '',
          validJobData.status,
          validJobData.retries,
          validJobData.maxRetries,
          validJobData.createdAt,
          validJobData.completedAt,
          validJobData.errorMessage
        );
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid job type', () => {
      expect(() => {
        new Job(
          validJobData.id,
          validJobData.workspaceId,
          'INVALID_TYPE',
          validJobData.status,
          validJobData.retries,
          validJobData.maxRetries,
          validJobData.createdAt,
          validJobData.completedAt,
          validJobData.errorMessage
        );
      }).toThrow(ValidationError);
    });
  });

  describe('fromDatabase', () => {
    it('should create Job from database record', () => {
      const job = Job.fromDatabase(validJobData);

      expect(job).toBeInstanceOf(Job);
      expect(job.id).toBe(validJobData.id);
      expect(job.workspaceId).toBe(validJobData.workspaceId);
      expect(job.type).toBe(validJobData.type);
    });
  });

  describe('status checks', () => {
    it('should return true for isPending when status is PENDING', () => {
      const job = Job.fromDatabase({ ...validJobData, status: JobStatus.PENDING });
      expect(job.isPending()).toBe(true);
      expect(job.isProcessing()).toBe(false);
      expect(job.isCompleted()).toBe(false);
      expect(job.isFailed()).toBe(false);
    });

    it('should return true for isProcessing when status is PROCESSING', () => {
      const job = Job.fromDatabase({ ...validJobData, status: JobStatus.PROCESSING });
      expect(job.isPending()).toBe(false);
      expect(job.isProcessing()).toBe(true);
      expect(job.isCompleted()).toBe(false);
      expect(job.isFailed()).toBe(false);
    });

    it('should return true for isCompleted when status is COMPLETED', () => {
      const job = Job.fromDatabase({ ...validJobData, status: JobStatus.COMPLETED });
      expect(job.isPending()).toBe(false);
      expect(job.isProcessing()).toBe(false);
      expect(job.isCompleted()).toBe(true);
      expect(job.isFailed()).toBe(false);
    });

    it('should return true for isFailed when status is FAILED', () => {
      const job = Job.fromDatabase({ ...validJobData, status: JobStatus.FAILED });
      expect(job.isPending()).toBe(false);
      expect(job.isProcessing()).toBe(false);
      expect(job.isCompleted()).toBe(false);
      expect(job.isFailed()).toBe(true);
    });
  });

  describe('canRetry', () => {
    it('should return true when retries less than maxRetries', () => {
      const job = Job.fromDatabase({ ...validJobData, retries: 1, maxRetries: 3 });
      expect(job.canRetry()).toBe(true);
    });

    it('should return false when retries equal maxRetries', () => {
      const job = Job.fromDatabase({ ...validJobData, retries: 3, maxRetries: 3 });
      expect(job.canRetry()).toBe(false);
    });

    it('should return false when retries exceed maxRetries', () => {
      const job = Job.fromDatabase({ ...validJobData, retries: 4, maxRetries: 3 });
      expect(job.canRetry()).toBe(false);
    });
  });

  describe('toResponse', () => {
    it('should return job data', () => {
      const job = Job.fromDatabase(validJobData);
      const response = job.toResponse();

      expect(response).toBeDefined();
      expect(response.id).toBe(validJobData.id);
      expect(response.workspaceId).toBe(validJobData.workspaceId);
      expect(response.type).toBe(validJobData.type);
      expect(response.status).toBe(validJobData.status);
      expect(response.retries).toBe(validJobData.retries);
      expect(response.maxRetries).toBe(validJobData.maxRetries);
    });
  });
});

