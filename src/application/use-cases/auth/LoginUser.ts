import UserRepository from '../../../infrastructure/database/postgresql/UserRepository';
import SessionService from '../../../infrastructure/database/redis/SessionService';
import { PasswordUtil, JWTUtil } from '../../../shared/utils';
import { ILoginRequest, IAuthTokens } from '../../../shared/types';
import { UnauthorizedError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import logger from '../../../infrastructure/observability/logger';
import config from '../../../config';

export class LoginUser {
  async execute(request: ILoginRequest): Promise<IAuthTokens> {
    try {
      // Find user by email
      const user = await UserRepository.findByEmail(request.email);
      if (!user) {
        throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Verify password
      const isPasswordValid = await PasswordUtil.compare(request.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      // Generate tokens
      const accessToken = JWTUtil.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const refreshToken = JWTUtil.generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      // Store refresh token in Redis
      const refreshTokenTTL = JWTUtil.getTokenExpiryInSeconds(config.jwt.refreshExpiresIn);
      await SessionService.storeRefreshToken(refreshToken, user.id, refreshTokenTTL);

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Error logging in user', { email: request.email, error });
      throw error;
    }
  }
}

export default new LoginUser();

