import { IJob } from '../../shared/types';
import { JobStatus, JobType } from '../../shared/constants/enums';
import { ValidationError } from '../../shared/errors';

export class Job {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly type: string,
    public readonly status: string,
    public readonly retries: number,
    public readonly maxRetries: number,
    public readonly createdAt: Date,
    public readonly completedAt: Date | null,
    public readonly errorMessage: string | null
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.workspaceId) {
      throw new ValidationError('Workspace ID is required');
    }

    if (!this.type) {
      throw new ValidationError('Job type is required');
    }

    if (!Object.values(JobType).includes(this.type as JobType)) {
      throw new ValidationError('Invalid job type');
    }
  }

  static fromDatabase(data: IJob): Job {
    return new Job(
      data.id,
      data.workspaceId,
      data.type,
      data.status,
      data.retries,
      data.maxRetries,
      data.createdAt,
      data.completedAt,
      data.errorMessage
    );
  }

  isPending(): boolean {
    return this.status === JobStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.status === JobStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.status === JobStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === JobStatus.FAILED;
  }

  canRetry(): boolean {
    return this.retries < this.maxRetries;
  }

  toResponse() {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      type: this.type,
      status: this.status,
      retries: this.retries,
      maxRetries: this.maxRetries,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      errorMessage: this.errorMessage,
    };
  }
}

export default Job;

