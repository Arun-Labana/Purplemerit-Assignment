import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '../../shared/utils';
import UserRepository from '../../infrastructure/database/postgresql/UserRepository';
import { UnauthorizedError } from '../../shared/errors';
import { ERROR_MESSAGES } from '../../shared/constants';
import logger from '../../infrastructure/observability/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = JWTUtil.verifyAccessToken(token);

    // Verify user still exists
    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', error);
    next(error);
  }
};

export default authMiddleware;

