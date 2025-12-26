import { JWTUtil } from '../../../src/shared/utils/jwt';
import { ITokenPayload } from '../../../src/shared/types';
import { UnauthorizedError } from '../../../src/shared/errors';

describe('JWTUtil', () => {
  const validPayload: ITokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTUtil.generateAccessToken(validPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JWTUtil.generateRefreshToken(validPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = JWTUtil.generateAccessToken(validPayload);
      const decoded = JWTUtil.verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        JWTUtil.verifyAccessToken(invalidToken);
      }).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for malformed token', () => {
      expect(() => {
        JWTUtil.verifyAccessToken('not-a-jwt');
      }).toThrow(UnauthorizedError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = JWTUtil.generateRefreshToken(validPayload);
      const decoded = JWTUtil.verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });

    it('should throw UnauthorizedError for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        JWTUtil.verifyRefreshToken(invalidToken);
      }).toThrow(UnauthorizedError);
    });
  });

  describe('decode', () => {
    it('should decode token without verification', () => {
      const token = JWTUtil.generateAccessToken(validPayload);
      const decoded: any = JWTUtil.decode(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });
  });

  describe('getTokenExpiryInSeconds', () => {
    it('should parse seconds correctly', () => {
      expect(JWTUtil.getTokenExpiryInSeconds('60s')).toBe(60);
    });

    it('should parse minutes correctly', () => {
      expect(JWTUtil.getTokenExpiryInSeconds('15m')).toBe(900);
    });

    it('should parse hours correctly', () => {
      expect(JWTUtil.getTokenExpiryInSeconds('2h')).toBe(7200);
    });

    it('should parse days correctly', () => {
      expect(JWTUtil.getTokenExpiryInSeconds('7d')).toBe(604800);
    });

    it('should return default for invalid format', () => {
      expect(JWTUtil.getTokenExpiryInSeconds('invalid')).toBe(900);
    });
  });
});

