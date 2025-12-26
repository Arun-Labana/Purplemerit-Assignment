import RefreshToken from '../../../../../src/application/use-cases/auth/RefreshToken';
import SessionService from '../../../../../src/infrastructure/database/redis/SessionService';
import { JWTUtil } from '../../../../../src/shared/utils';
import { UnauthorizedError } from '../../../../../src/shared/errors';

jest.mock('../../../../../src/infrastructure/database/redis/connection', () => ({
  default: {
    getClient: jest.fn(),
  },
}));
jest.mock('../../../../../src/config', () => ({
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
      redis: { url: 'redis://localhost:6379' },
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
jest.mock('../../../../../src/infrastructure/database/redis/SessionService');
jest.mock('../../../../../src/shared/utils/jwt');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('RefreshToken', () => {
  const refreshToken = 'refresh-token-123';
  const payload = { userId: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should refresh token successfully', async () => {
    (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue(payload);
    (SessionService.verifyRefreshToken as jest.Mock).mockResolvedValue('user-123');
    (JWTUtil.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');
    (JWTUtil.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh-token');
    (JWTUtil.getTokenExpiryInSeconds as jest.Mock).mockReturnValue(604800);
    (SessionService.revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);
    (SessionService.storeRefreshToken as jest.Mock).mockResolvedValue(undefined);

    const result = await RefreshToken.execute(refreshToken);

    expect(JWTUtil.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(SessionService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
  });

  it('should throw UnauthorizedError when token is invalid', async () => {
    (JWTUtil.verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError('Invalid token');
    });

    await expect(RefreshToken.execute(refreshToken)).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when token not found in session', async () => {
    (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue(payload);
    (SessionService.verifyRefreshToken as jest.Mock).mockResolvedValue(null);

    await expect(RefreshToken.execute(refreshToken)).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when userId mismatch', async () => {
    (JWTUtil.verifyRefreshToken as jest.Mock).mockReturnValue(payload);
    (SessionService.verifyRefreshToken as jest.Mock).mockResolvedValue('different-user');

    await expect(RefreshToken.execute(refreshToken)).rejects.toThrow(UnauthorizedError);
  });
});

