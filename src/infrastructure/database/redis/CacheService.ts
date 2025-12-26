import redisClient from './connection';
import { APP_CONSTANTS } from '../../../shared/constants';
import logger from '../../observability/logger';
import { cacheHits, cacheMisses } from '../../observability/metrics';

export class CacheService {
  private prefix = 'cache:';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key);
      const data = await redisClient.get(cacheKey);

      if (data) {
        cacheHits.inc({ cache_key: key });
        logger.debug('Cache hit', { key });
        return JSON.parse(data) as T;
      }

      cacheMisses.inc({ cache_key: key });
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Error getting from cache', { key, error });
      return null; // Return null on error to allow fallback to database
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const cacheKey = this.getKey(key);
      const data = JSON.stringify(value);
      await redisClient.set(cacheKey, data, ttlSeconds);
      logger.debug('Cache set', { key, ttl: ttlSeconds });
    } catch (error) {
      logger.error('Error setting cache', { key, error });
      // Don't throw error, caching is optional
    }
  }

  async del(key: string): Promise<void> {
    try {
      const cacheKey = this.getKey(key);
      await redisClient.del(cacheKey);
      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Error deleting from cache', { key, error });
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const fullPattern = this.getKey(pattern);
      const deleted = await redisClient.delPattern(fullPattern);
      logger.debug('Cache pattern deleted', { pattern, deleted });
    } catch (error) {
      logger.error('Error deleting cache pattern', { pattern, error });
    }
  }

  // Cache wrapper for database queries
  async wrap<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from database
    const data = await fetchFn();

    // Store in cache
    await this.set(key, data, ttlSeconds);

    return data;
  }

  // Project cache methods
  async cacheProject(projectId: string, project: any): Promise<void> {
    await this.set(`project:${projectId}`, project, APP_CONSTANTS.CACHE_TTL_PROJECT);
  }

  async getCachedProject(projectId: string): Promise<any | null> {
    return await this.get(`project:${projectId}`);
  }

  async invalidateProject(projectId: string): Promise<void> {
    await this.del(`project:${projectId}`);
  }

  // Workspace cache methods
  async cacheWorkspace(workspaceId: string, workspace: any): Promise<void> {
    await this.set(`workspace:${workspaceId}`, workspace, APP_CONSTANTS.CACHE_TTL_WORKSPACE);
  }

  async getCachedWorkspace(workspaceId: string): Promise<any | null> {
    return await this.get(`workspace:${workspaceId}`);
  }

  async invalidateWorkspace(workspaceId: string): Promise<void> {
    await this.del(`workspace:${workspaceId}`);
  }

  // Permissions cache methods
  async cachePermissions(userId: string, projectId: string, permissions: any): Promise<void> {
    await this.set(
      `permissions:${userId}:${projectId}`,
      permissions,
      APP_CONSTANTS.CACHE_TTL_PERMISSIONS
    );
  }

  async getCachedPermissions(userId: string, projectId: string): Promise<any | null> {
    return await this.get(`permissions:${userId}:${projectId}`);
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.delPattern(`permissions:${userId}:*`);
  }

  async invalidateProjectPermissions(projectId: string): Promise<void> {
    await this.delPattern(`permissions:*:${projectId}`);
  }
}

export default new CacheService();

