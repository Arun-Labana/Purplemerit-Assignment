import pgDatabase from './connection';
import { IJob, IJobCreate } from '../../../shared/types';
import { JobStatus } from '../../../shared/constants/enums';
import logger from '../../observability/logger';

export class JobRepository {
  async findById(id: string): Promise<IJob | null> {
    try {
      const result = await pgDatabase.query(
        `SELECT id, workspace_id as "workspaceId", type, status, retries, max_retries as "maxRetries",
                idempotency_key as "idempotencyKey", created_at as "createdAt", completed_at as "completedAt", error_message as "errorMessage"
         FROM jobs WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding job by ID', { id, error });
      throw error;
    }
  }

  async findByIdempotencyKey(idempotencyKey: string, workspaceId: string): Promise<IJob | null> {
    try {
      const result = await pgDatabase.query(
        `SELECT id, workspace_id as "workspaceId", type, status, retries, max_retries as "maxRetries",
                idempotency_key as "idempotencyKey", created_at as "createdAt", completed_at as "completedAt", error_message as "errorMessage"
         FROM jobs WHERE idempotency_key = $1 AND workspace_id = $2`,
        [idempotencyKey, workspaceId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding job by idempotency key', { idempotencyKey, workspaceId, error });
      throw error;
    }
  }

  async findByWorkspaceId(workspaceId: string, limit: number = 20, offset: number = 0): Promise<IJob[]> {
    try {
      const result = await pgDatabase.query(
        `SELECT id, workspace_id as "workspaceId", type, status, retries, max_retries as "maxRetries",
                idempotency_key as "idempotencyKey", created_at as "createdAt", completed_at as "completedAt", error_message as "errorMessage"
         FROM jobs WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [workspaceId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error finding jobs by workspace ID', { workspaceId, error });
      throw error;
    }
  }

  async create(jobData: IJobCreate): Promise<IJob> {
    try {
      const result = await pgDatabase.query(
        `INSERT INTO jobs (workspace_id, type, status, idempotency_key) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, workspace_id as "workspaceId", type, status, retries, max_retries as "maxRetries",
                   idempotency_key as "idempotencyKey", created_at as "createdAt", completed_at as "completedAt", error_message as "errorMessage"`,
        [jobData.workspaceId, jobData.type, JobStatus.PENDING, jobData.idempotencyKey || null]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating job', { jobData, error });
      throw error;
    }
  }

  async updateStatus(id: string, status: JobStatus, errorMessage?: string): Promise<IJob | null> {
    try {
      const completedAt = status === JobStatus.COMPLETED || status === JobStatus.FAILED ? new Date() : null;
      
      const result = await pgDatabase.query(
        `UPDATE jobs SET status = $1, completed_at = $2, error_message = $3
         WHERE id = $4
         RETURNING id, workspace_id as "workspaceId", type, status, retries, max_retries as "maxRetries",
                   idempotency_key as "idempotencyKey", created_at as "createdAt", completed_at as "completedAt", error_message as "errorMessage"`,
        [status, completedAt, errorMessage || null, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating job status', { id, status, error });
      throw error;
    }
  }

  async incrementRetries(id: string): Promise<IJob | null> {
    try {
      const result = await pgDatabase.query(
        `UPDATE jobs SET retries = retries + 1
         WHERE id = $1
         RETURNING id, workspace_id as "workspaceId", type, status, retries, max_retries as "maxRetries",
                   idempotency_key as "idempotencyKey", created_at as "createdAt", completed_at as "completedAt", error_message as "errorMessage"`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error incrementing job retries', { id, error });
      throw error;
    }
  }

  async countByStatus(status: JobStatus): Promise<number> {
    try {
      const result = await pgDatabase.query(
        'SELECT COUNT(*) as count FROM jobs WHERE status = $1',
        [status]
      );
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting jobs by status', { status, error });
      throw error;
    }
  }
}

export default new JobRepository();

