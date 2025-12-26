import redisClient from './connection';
import logger from '../../observability/logger';

export class SessionService {
  private prefix = 'session:';

  private getKey(token: string): string {
    return `${this.prefix}${token}`;
  }

  async storeRefreshToken(token: string, userId: string, expiresInSeconds: number): Promise<void> {
    try {
      const key = this.getKey(token);
      const data = JSON.stringify({ userId, createdAt: new Date().toISOString() });
      await redisClient.set(key, data, expiresInSeconds);
      logger.debug('Refresh token stored', { userId });
    } catch (error) {
      logger.error('Error storing refresh token', { userId, error });
      throw error;
    }
  }

  async verifyRefreshToken(token: string): Promise<string | null> {
    try {
      const key = this.getKey(token);
      const data = await redisClient.get(key);

      if (data) {
        const session = JSON.parse(data);
        return session.userId;
      }

      return null;
    } catch (error) {
      logger.error('Error verifying refresh token', error);
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const key = this.getKey(token);
      await redisClient.del(key);
      logger.debug('Refresh token revoked');
    } catch (error) {
      logger.error('Error revoking refresh token', error);
      throw error;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const pattern = this.getKey('*');
      const keys = await redisClient.keys(pattern);

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const session = JSON.parse(data);
          if (session.userId === userId) {
            await redisClient.del(key);
          }
        }
      }

      logger.info('All user tokens revoked', { userId });
    } catch (error) {
      logger.error('Error revoking all user tokens', { userId, error });
      throw error;
    }
  }
}

export default new SessionService();

