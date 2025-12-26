import SessionService from '../../../../../src/infrastructure/database/redis/SessionService';
import redisClient from '../../../../../src/infrastructure/database/redis/connection';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/database/redis/connection');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token successfully', async () => {
      (redisClient.set as jest.Mock).mockResolvedValue(undefined);

      await SessionService.storeRefreshToken('refresh-token', 'user-123', 604800);

      expect(redisClient.set).toHaveBeenCalledWith(
        'session:refresh-token',
        expect.stringContaining('user-123'),
        604800
      );
    });

    it('should handle errors', async () => {
      (redisClient.set as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(SessionService.storeRefreshToken('token', 'user-123', 3600)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', async () => {
      const sessionData = JSON.stringify({ userId: 'user-123', createdAt: new Date().toISOString() });
      (redisClient.get as jest.Mock).mockResolvedValue(sessionData);

      const result = await SessionService.verifyRefreshToken('refresh-token');

      expect(result).toBe('user-123');
      expect(redisClient.get).toHaveBeenCalledWith('session:refresh-token');
    });

    it('should return null when token not found', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const result = await SessionService.verifyRefreshToken('refresh-token');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const result = await SessionService.verifyRefreshToken('refresh-token');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token successfully', async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(undefined);

      await SessionService.revokeRefreshToken('refresh-token');

      expect(redisClient.del).toHaveBeenCalledWith('session:refresh-token');
    });

    it('should handle errors', async () => {
      (redisClient.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(SessionService.revokeRefreshToken('refresh-token')).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all user tokens successfully', async () => {
      const keys = ['session:token1', 'session:token2'];
      (redisClient.keys as jest.Mock).mockResolvedValue(keys);
      (redisClient.get as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ userId: 'user-123' }))
        .mockResolvedValueOnce(JSON.stringify({ userId: 'user-456' }));
      (redisClient.del as jest.Mock).mockResolvedValue(undefined);

      await SessionService.revokeAllUserTokens('user-123');

      expect(redisClient.keys).toHaveBeenCalledWith('session:*');
      expect(redisClient.del).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      (redisClient.keys as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(SessionService.revokeAllUserTokens('user-123')).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

