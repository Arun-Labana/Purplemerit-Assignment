import SessionService from '../../../infrastructure/database/redis/SessionService';
import logger from '../../../infrastructure/observability/logger';

export class LogoutUser {
  async execute(refreshToken: string): Promise<void> {
    try {
      // Revoke refresh token
      await SessionService.revokeRefreshToken(refreshToken);

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Error logging out user', error);
      throw error;
    }
  }
}

export default new LogoutUser();

