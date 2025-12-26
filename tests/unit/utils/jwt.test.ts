import { JWTUtil } from '../../../src/shared/utils/jwt';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../../src/shared/errors';
import logger from '../../../src/infrastructure/observability/logger';

const mockConfig = {
  jwt: {
    secret: 'test-secret',
    refreshSecret: 'test-refresh-secret',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
};

jest.mock('../../../src/config', () => ({
  __esModule: true,
  default: {
    app: {
      env: 'test',
      port: 3000,
      apiVersion: 'v1',
    },
    database: {
      postgres: { url: 'postgresql://test' },
      mongodb: { uri: 'mongodb://test' },
      redis: { url: 'redis://test' },
    },
    rabbitmq: { url: 'amqp://test' },
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    cors: { origin: ['http://localhost:3000'] },
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    logging: { level: 'info' },
  },
}));
jest.mock('../../../src/infrastructure/observability/logger');

describe('JWTUtil', () => {
  const payload = { userId: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token successfully', () => {
      const token = JWTUtil.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should handle errors', () => {
      const signSpy = jest.spyOn(jwt, 'sign').mockImplementationOnce(() => {
        throw new Error('Sign failed');
      });

      expect(() => JWTUtil.generateAccessToken(payload)).toThrow();
      expect(logger.error).toHaveBeenCalled();
      signSpy.mockRestore();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token successfully', () => {
      const token = JWTUtil.generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should handle errors', () => {
      const signSpy = jest.spyOn(jwt, 'sign').mockImplementationOnce(() => {
        throw new Error('Sign failed');
      });

      expect(() => JWTUtil.generateRefreshToken(payload)).toThrow();
      expect(logger.error).toHaveBeenCalled();
      
      signSpy.mockRestore();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token successfully', () => {
      const token = JWTUtil.generateAccessToken(payload);
      const decoded = JWTUtil.verifyAccessToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw UnauthorizedError for expired token', () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Token expired') as any;
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(() => JWTUtil.verifyAccessToken('expired-token')).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Invalid token') as any;
        error.name = 'JsonWebTokenError';
        throw error;
      });

      expect(() => JWTUtil.verifyAccessToken('invalid-token')).toThrow(UnauthorizedError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', () => {
      // Ensure jwt.verify is not mocked for this test
      jest.restoreAllMocks();
      const token = JWTUtil.generateRefreshToken(payload);
      const decoded = JWTUtil.verifyRefreshToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw UnauthorizedError for expired refresh token', () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Token expired') as any;
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(() => JWTUtil.verifyRefreshToken('expired-token')).toThrow(UnauthorizedError);
    });
  });

  describe('decode', () => {
    it('should decode token without verification', () => {
      // Restore jwt.sign mock if it exists, then use actual implementation
      const signSpy = jest.spyOn(jwt, 'sign');
      signSpy.mockRestore();
      const token = jwt.sign(payload, mockConfig.jwt.secret);
      const decoded: any = JWTUtil.decode(token);

      expect(decoded).toBeDefined();
      if (decoded && typeof decoded === 'object') {
        expect(decoded.userId).toBe(payload.userId);
      }
    });
  });

  describe('getTokenExpiryInSeconds', () => {
    it('should parse seconds correctly', () => {
      expect(JWTUtil.getTokenExpiryInSeconds('30s')).toBe(30);
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
      expect(JWTUtil.getTokenExpiryInSeconds('')).toBe(900);
      expect(JWTUtil.getTokenExpiryInSeconds('x')).toBe(900);
    });

    it('should return default for non-numeric value', () => {
      expect(JWTUtil.getTokenExpiryInSeconds('abc')).toBe(900);
    });
  });
});
