import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../../config';
import { ITokenPayload } from '../types';
import logger from '../../infrastructure/observability/logger';
import { UnauthorizedError } from '../errors';

export class JWTUtil {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: ITokenPayload): string {
    try {
      const options: SignOptions = {
        expiresIn: config.jwt.expiresIn as any,
      };
      return jwt.sign(payload, config.jwt.secret, options);
    } catch (error) {
      logger.error('Error generating access token', error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: ITokenPayload): string {
    try {
      const options: SignOptions = {
        expiresIn: config.jwt.refreshExpiresIn as any,
      };
      return jwt.sign(payload, config.jwt.refreshSecret, options);
    } catch (error) {
      logger.error('Error generating refresh token', error);
      throw error;
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): ITokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as ITokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      logger.error('Error verifying access token', error);
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): ITokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as ITokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      logger.error('Error verifying refresh token', error);
      throw new UnauthorizedError('Refresh token verification failed');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decode(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Get token expiry time in seconds
   */
  static getTokenExpiryInSeconds(expiresIn: string): number {
    // Parse strings like '15m', '7d', '1h'
    if (!expiresIn || typeof expiresIn !== 'string' || expiresIn.length < 2) {
      return 900; // Default 15 minutes
    }

    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    if (isNaN(value)) {
      return 900; // Default 15 minutes
    }

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // Default 15 minutes
    }
  }
}

export default JWTUtil;

