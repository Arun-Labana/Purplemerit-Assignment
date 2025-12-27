import redisClient from './connection';
import logger from '../../observability/logger';

export class IdempotencyService {
  private prefix = 'idempotency:';
  private ttlSeconds = 24 * 60 * 60; // 24 hours

  private getKey(idempotencyKey: string, workspaceId: string): string {
    return `${this.prefix}${workspaceId}:${idempotencyKey}`;
  }

  /**
   * Check if an idempotency key exists and return the associated job ID
   */
  async getJobId(idempotencyKey: string, workspaceId: string): Promise<string | null> {
    try {
      const key = this.getKey(idempotencyKey, workspaceId);
      const jobId = await redisClient.get(key);
      return jobId;
    } catch (error) {
      logger.error('Error getting idempotency key', { idempotencyKey, workspaceId, error });
      return null;
    }
  }

  /**
   * Store an idempotency key with associated job ID
   */
  async setJobId(idempotencyKey: string, workspaceId: string, jobId: string): Promise<void> {
    try {
      const key = this.getKey(idempotencyKey, workspaceId);
      await redisClient.set(key, jobId, this.ttlSeconds);
      logger.debug('Idempotency key stored', { idempotencyKey, workspaceId, jobId });
    } catch (error) {
      logger.error('Error setting idempotency key', { idempotencyKey, workspaceId, jobId, error });
      throw error;
    }
  }

  /**
   * Check if idempotency key exists
   */
  async exists(idempotencyKey: string, workspaceId: string): Promise<boolean> {
    try {
      const key = this.getKey(idempotencyKey, workspaceId);
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Error checking idempotency key existence', { idempotencyKey, workspaceId, error });
      return false;
    }
  }

  /**
   * Delete an idempotency key (for cleanup if needed)
   */
  async delete(idempotencyKey: string, workspaceId: string): Promise<void> {
    try {
      const key = this.getKey(idempotencyKey, workspaceId);
      await redisClient.del(key);
      logger.debug('Idempotency key deleted', { idempotencyKey, workspaceId });
    } catch (error) {
      logger.error('Error deleting idempotency key', { idempotencyKey, workspaceId, error });
      throw error;
    }
  }
}

export default new IdempotencyService();

