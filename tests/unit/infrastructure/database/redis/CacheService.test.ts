import CacheService from '../../../../../src/infrastructure/database/redis/CacheService';
import redisClient from '../../../../../src/infrastructure/database/redis/connection';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/database/redis/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get cached value successfully', async () => {
      const cachedData = JSON.stringify({ id: '123', name: 'Test' });
      (redisClient.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await CacheService.get('test-key');

      expect(result).toEqual({ id: '123', name: 'Test' });
      expect(redisClient.get).toHaveBeenCalledWith('cache:test-key');
    });

    it('should return null when key not found', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const result = await CacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const result = await CacheService.get('test-key');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set cache value successfully', async () => {
      (redisClient.set as jest.Mock).mockResolvedValue(undefined);

      await CacheService.set('test-key', { id: '123' }, 3600);

      expect(redisClient.set).toHaveBeenCalledWith('cache:test-key', JSON.stringify({ id: '123' }), 3600);
    });

    it('should not throw error on failure', async () => {
      (redisClient.set as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(CacheService.set('test-key', { id: '123' })).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('del', () => {
    it('should delete cache key successfully', async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(undefined);

      await CacheService.del('test-key');

      expect(redisClient.del).toHaveBeenCalledWith('cache:test-key');
    });
  });

  describe('wrap', () => {
    it('should return cached value if available', async () => {
      const cachedData = JSON.stringify({ id: '123' });
      (redisClient.get as jest.Mock).mockResolvedValue(cachedData);

      const fetchFn = jest.fn();
      const result = await CacheService.wrap('test-key', 3600, fetchFn);

      expect(result).toEqual({ id: '123' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache when not in cache', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (redisClient.set as jest.Mock).mockResolvedValue(undefined);
      const fetchFn = jest.fn().mockResolvedValue({ id: '456' });

      const result = await CacheService.wrap('test-key', 3600, fetchFn);

      expect(result).toEqual({ id: '456' });
      expect(fetchFn).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('project cache methods', () => {
    it('should cache project', async () => {
      (redisClient.set as jest.Mock).mockResolvedValue(undefined);
      const project = { id: 'project-123', name: 'Test Project' };

      await CacheService.cacheProject('project-123', project);

      expect(redisClient.set).toHaveBeenCalled();
    });

    it('should get cached project', async () => {
      const cachedData = JSON.stringify({ id: 'project-123', name: 'Test Project' });
      (redisClient.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await CacheService.getCachedProject('project-123');

      expect(result).toEqual({ id: 'project-123', name: 'Test Project' });
    });

    it('should invalidate project', async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(undefined);

      await CacheService.invalidateProject('project-123');

      expect(redisClient.del).toHaveBeenCalledWith('cache:project:project-123');
    });
  });

  describe('workspace cache methods', () => {
    it('should cache workspace', async () => {
      (redisClient.set as jest.Mock).mockResolvedValue(undefined);
      const workspace = { id: 'workspace-123', name: 'Test Workspace' };

      await CacheService.cacheWorkspace('workspace-123', workspace);

      expect(redisClient.set).toHaveBeenCalled();
    });

    it('should invalidate workspace', async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(undefined);

      await CacheService.invalidateWorkspace('workspace-123');

      expect(redisClient.del).toHaveBeenCalledWith('cache:workspace:workspace-123');
    });
  });

  describe('permissions cache methods', () => {
    it('should cache permissions', async () => {
      (redisClient.set as jest.Mock).mockResolvedValue(undefined);
      const permissions = { read: true, write: true };

      await CacheService.cachePermissions('user-123', 'project-123', permissions);

      expect(redisClient.set).toHaveBeenCalled();
    });

    it('should invalidate user permissions', async () => {
      (redisClient.delPattern as jest.Mock).mockResolvedValue(undefined);

      await CacheService.invalidateUserPermissions('user-123');

      expect(redisClient.delPattern).toHaveBeenCalledWith('cache:permissions:user-123:*');
    });

    it('should invalidate project permissions', async () => {
      (redisClient.delPattern as jest.Mock).mockResolvedValue(undefined);

      await CacheService.invalidateProjectPermissions('project-123');

      expect(redisClient.delPattern).toHaveBeenCalledWith('cache:permissions:*:project-123');
    });
  });
});

