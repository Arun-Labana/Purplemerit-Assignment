import RegisterUser from '../../../../../src/application/use-cases/auth/RegisterUser';
import UserRepository from '../../../../../src/infrastructure/database/postgresql/UserRepository';
import SessionService from '../../../../../src/infrastructure/database/redis/SessionService';
import { PasswordUtil, JWTUtil } from '../../../../../src/shared/utils';
import { ValidationError } from '../../../../../src/shared/errors';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/database/postgresql/connection', () => ({
  default: {
    query: jest.fn(),
    getClient: jest.fn(),
  },
}));
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
jest.mock('../../../../../src/infrastructure/database/postgresql/UserRepository');
jest.mock('../../../../../src/infrastructure/database/redis/SessionService');
jest.mock('../../../../../src/shared/utils/password');
jest.mock('../../../../../src/shared/utils/jwt');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('RegisterUser', () => {
  const registerData = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Password123!',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register user successfully', async () => {
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (PasswordUtil.hash as jest.Mock).mockResolvedValue('hashed-password');
    (UserRepository.create as jest.Mock).mockResolvedValue(mockUser);
    (JWTUtil.generateAccessToken as jest.Mock).mockReturnValue('access-token');
    (JWTUtil.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
    (JWTUtil.getTokenExpiryInSeconds as jest.Mock).mockReturnValue(604800);
    (SessionService.storeRefreshToken as jest.Mock).mockResolvedValue(undefined);

    const result = await RegisterUser.execute(registerData);

    expect(UserRepository.findByEmail).toHaveBeenCalledWith(registerData.email);
    expect(PasswordUtil.hash).toHaveBeenCalledWith(registerData.password);
    expect(UserRepository.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe(registerData.email);
  });

  it('should throw ValidationError when user already exists', async () => {
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

    await expect(RegisterUser.execute(registerData)).rejects.toThrow(ValidationError);
  });

  it('should handle errors', async () => {
    const error = new Error('Database error');
    (UserRepository.findByEmail as jest.Mock).mockRejectedValue(error);

    await expect(RegisterUser.execute(registerData)).rejects.toThrow('Database error');
    expect(logger.error).toHaveBeenCalled();
  });
});

