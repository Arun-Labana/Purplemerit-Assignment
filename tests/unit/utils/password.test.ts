import { PasswordUtil } from '../../../src/shared/utils/password';
import logger from '../../../src/infrastructure/observability/logger';

jest.mock('../../../src/infrastructure/observability/logger');

describe('PasswordUtil', () => {
  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtil.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await PasswordUtil.hash(password);
      const hash2 = await PasswordUtil.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle hashing errors', async () => {
      const bcrypt = require('bcrypt');
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockRejectedValueOnce(new Error('Hashing failed'));

      await expect(PasswordUtil.hash('password')).rejects.toThrow('Hashing failed');
      expect(logger.error).toHaveBeenCalled();
      
      hashSpy.mockRestore();
    });
  });

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtil.hash(password);
      const result = await PasswordUtil.compare(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await PasswordUtil.hash(password);
      const result = await PasswordUtil.compare(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('should handle comparison errors', async () => {
      const bcrypt = require('bcrypt');
      const compareSpy = jest.spyOn(bcrypt, 'compare').mockRejectedValueOnce(new Error('Comparison failed'));

      await expect(PasswordUtil.compare('password', 'hash')).rejects.toThrow('Comparison failed');
      expect(logger.error).toHaveBeenCalled();
      
      compareSpy.mockRestore();
    });
  });

  describe('validateStrength', () => {
    it('should validate strong password', () => {
      const result = PasswordUtil.validateStrength('TestPassword123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = PasswordUtil.validateStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = PasswordUtil.validateStrength('testpassword123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = PasswordUtil.validateStrength('TESTPASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = PasswordUtil.validateStrength('TestPassword!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = PasswordUtil.validateStrength('TestPassword123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for weak password', () => {
      const result = PasswordUtil.validateStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

