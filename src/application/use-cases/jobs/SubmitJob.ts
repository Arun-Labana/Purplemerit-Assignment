import JobRepository from '../../../infrastructure/database/postgresql/JobRepository';
import JobResultRepository from '../../../infrastructure/database/mongodb/JobResultRepository';
import WorkspaceRepository from '../../../infrastructure/database/postgresql/WorkspaceRepository';
import ProjectMemberRepository from '../../../infrastructure/database/postgresql/ProjectMemberRepository';
import rabbitmqPublisher from '../../../infrastructure/messaging/rabbitmq/publisher';
import idempotencyService from '../../../infrastructure/database/redis/IdempotencyService';
import { IJobCreate } from '../../../shared/types';
import { Job } from '../../../domain/entities/Job';
import { Role } from '../../../domain/value-objects/Role';
import { NotFoundError, ForbiddenError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import logger from '../../../infrastructure/observability/logger';

export class SubmitJob {
  async execute(jobData: IJobCreate, userId: string): Promise<Job> {
    try {
      // Verify workspace exists
      const workspace = await WorkspaceRepository.findById(jobData.workspaceId);
      if (!workspace) {
        throw new NotFoundError(ERROR_MESSAGES.WORKSPACE_NOT_FOUND);
      }

      // Verify user has write permission
      const member = await ProjectMemberRepository.findByProjectAndUser(workspace.projectId, userId);
      if (!member) {
        throw new ForbiddenError(ERROR_MESSAGES.WORKSPACE_ACCESS_DENIED);
      }

      const role = new Role(member.role);
      role.assertPermission('write');

      // Check idempotency if idempotency key is provided
      if (jobData.idempotencyKey) {
        // First check Redis cache
        const cachedJobId = await idempotencyService.getJobId(jobData.idempotencyKey, jobData.workspaceId);
        if (cachedJobId) {
          const existingJob = await JobRepository.findById(cachedJobId);
          if (existingJob) {
            logger.info('Job already exists with idempotency key', {
              idempotencyKey: jobData.idempotencyKey,
              jobId: existingJob.id,
              userId,
            });
            return Job.fromDatabase(existingJob);
          }
        }

        // Check database for existing job with same idempotency key
        const existingJob = await JobRepository.findByIdempotencyKey(
          jobData.idempotencyKey,
          jobData.workspaceId
        );
        if (existingJob) {
          // Store in Redis cache for faster future lookups
          await idempotencyService.setJobId(
            jobData.idempotencyKey,
            jobData.workspaceId,
            existingJob.id
          );
          logger.info('Job already exists with idempotency key', {
            idempotencyKey: jobData.idempotencyKey,
            jobId: existingJob.id,
            userId,
          });
          return Job.fromDatabase(existingJob);
        }
      }

      // Create job in PostgreSQL
      const jobRecord = await JobRepository.create(jobData);

      // Store idempotency key in Redis if provided
      if (jobData.idempotencyKey) {
        await idempotencyService.setJobId(
          jobData.idempotencyKey,
          jobData.workspaceId,
          jobRecord.id
        );
      }

      // Create job result document in MongoDB
      await JobResultRepository.create({
        jobId: jobRecord.id,
        inputPayload: jobData.payload,
        outputResult: null,
        logs: [],
        errors: [],
      });

      // Publish job to RabbitMQ queue
      await rabbitmqPublisher.publishJob(
        jobRecord.id,
        jobData.workspaceId,
        jobData.type,
        jobData.payload
      );

      logger.info('Job submitted successfully', {
        jobId: jobRecord.id,
        type: jobData.type,
        idempotencyKey: jobData.idempotencyKey,
        userId,
      });

      return Job.fromDatabase(jobRecord);
    } catch (error) {
      logger.error('Error submitting job', { jobData, userId, error });
      throw error;
    }
  }
}

export default new SubmitJob();

