import bcrypt from 'bcrypt';
import { APP_CONSTANTS } from '../constants';
import logger from '../../infrastructure/observability/logger';

export class PasswordUtil {
  /**
   * Hash a password
   */
  static async hash(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, APP_CONSTANTS.BCRYPT_SALT_ROUNDS);
      return hash;
    } catch (error) {
      logger.error('Error hashing password', error);
      throw error;
    }
  }

  /**
   * Compare password with hash
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      logger.error('Error comparing password', error);
      throw error;
    }
  }

  /**
   * Validate password strength
   */
  static validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default PasswordUtil;

