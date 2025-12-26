import SessionService from '../../../infrastructure/database/redis/SessionService';
import { JWTUtil } from '../../../shared/utils';
import { IAuthTokens } from '../../../shared/types';
import { UnauthorizedError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import logger from '../../../infrastructure/observability/logger';
import config from '../../../config';

export class RefreshToken {
  async execute(refreshToken: string): Promise<IAuthTokens> {
    try {
      // Verify refresh token
      const payload = JWTUtil.verifyRefreshToken(refreshToken);

      // Check if token exists in Redis
      const userId = await SessionService.verifyRefreshToken(refreshToken);
      if (!userId || userId !== payload.userId) {
        throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
      }

      logger.info('Token refreshed successfully', { userId: payload.userId });

      // Generate new tokens
      const newAccessToken = JWTUtil.generateAccessToken({
        userId: payload.userId,
        email: payload.email,
      });

      const newRefreshToken = JWTUtil.generateRefreshToken({
        userId: payload.userId,
        email: payload.email,
      });

      // Revoke old refresh token
      await SessionService.revokeRefreshToken(refreshToken);

      // Store new refresh token
      const refreshTokenTTL = JWTUtil.getTokenExpiryInSeconds(config.jwt.refreshExpiresIn);
      await SessionService.storeRefreshToken(newRefreshToken, payload.userId, refreshTokenTTL);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Error refreshing token', error);
      throw error;
    }
  }
}

export default new RefreshToken();

