import JobRepository from '../../../infrastructure/database/postgresql/JobRepository';
import JobResultRepository from '../../../infrastructure/database/mongodb/JobResultRepository';
import WorkspaceRepository from '../../../infrastructure/database/postgresql/WorkspaceRepository';
import ProjectMemberRepository from '../../../infrastructure/database/postgresql/ProjectMemberRepository';
import { Job } from '../../../domain/entities/Job';
import { NotFoundError, ForbiddenError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import logger from '../../../infrastructure/observability/logger';

export class GetJobStatus {
  async execute(jobId: string, userId: string): Promise<{ job: Job; result: any }> {
    try {
      // Get job
      const jobRecord = await JobRepository.findById(jobId);
      if (!jobRecord) {
        throw new NotFoundError(ERROR_MESSAGES.JOB_NOT_FOUND);
      }

      const job = Job.fromDatabase(jobRecord);

      // Verify workspace access
      const workspace = await WorkspaceRepository.findById(job.workspaceId);
      if (!workspace) {
        throw new NotFoundError(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);
      }

      const member = await ProjectMemberRepository.findByProjectAndUser(workspace.projectId, userId);
      if (!member) {
        throw new ForbiddenError(ERROR_MESSAGES.WORKSPACE_ACCESS_DENIED);
      }

      // Get job result from MongoDB
      const result = await JobResultRepository.findByJobId(jobId);

      logger.info('Job status fetched successfully', { jobId, userId });

      return {
        job,
        result: result || null,
      };
    } catch (error) {
      logger.error('Error getting job status', { jobId, userId, error });
      throw error;
    }
  }
}

export default new GetJobStatus();

