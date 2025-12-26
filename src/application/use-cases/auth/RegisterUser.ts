import UserRepository from '../../../infrastructure/database/postgresql/UserRepository';
import SessionService from '../../../infrastructure/database/redis/SessionService';
import { PasswordUtil, JWTUtil } from '../../../shared/utils';
import { IRegisterRequest, IAuthTokens, IUserResponse } from '../../../shared/types';
import { ValidationError } from '../../../shared/errors';
import { ERROR_MESSAGES } from '../../../shared/constants';
import logger from '../../../infrastructure/observability/logger';
import config from '../../../config';

export interface IRegisterResponse extends IAuthTokens {
  user: IUserResponse;
}

export class RegisterUser {
  async execute(request: IRegisterRequest): Promise<IRegisterResponse> {
    try {
      // Check if user already exists
      const existingUser = await UserRepository.findByEmail(request.email);
      if (existingUser) {
        throw new ValidationError(ERROR_MESSAGES.USER_ALREADY_EXISTS);
      }

      // Hash password
      const passwordHash = await PasswordUtil.hash(request.password);

      // Create user
      const user = await UserRepository.create({
        email: request.email,
        name: request.name,
        password: request.password, // Include for interface compatibility
        passwordHash,
      });

      logger.info('User registered successfully', { userId: user.id, email: user.email });

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

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      logger.error('Error registering user', { request, error });
      throw error;
    }
  }
}

export default new RegisterUser();

