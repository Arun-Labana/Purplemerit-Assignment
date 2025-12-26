import { Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../../../../src/presentation/middleware/authMiddleware';
import { JWTUtil } from '../../../../src/shared/utils';
import UserRepository from '../../../../src/infrastructure/database/postgresql/UserRepository';
import { UnauthorizedError } from '../../../../src/shared/errors';
import logger from '../../../../src/infrastructure/observability/logger';

jest.mock('../../../../src/shared/utils/jwt');
jest.mock('../../../../src/infrastructure/database/postgresql/UserRepository');
jest.mock('../../../../src/infrastructure/observability/logger');

describe('authMiddleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };

    mockResponse = {};

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate valid token and attach user to request', async () => {
    const token = 'valid-token';
    const payload = { userId: 'user-123', email: 'test@example.com' };
    const user = { id: 'user-123', email: 'test@example.com', name: 'Test User' };

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(payload);
    (UserRepository.findById as jest.Mock).mockResolvedValue(user);

    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(JWTUtil.verifyAccessToken).toHaveBeenCalledWith(token);
    expect(UserRepository.findById).toHaveBeenCalledWith('user-123');
    expect(mockRequest.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should throw UnauthorizedError when no authorization header', async () => {
    mockRequest.headers = {};

    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockRequest.user).toBeUndefined();
  });

  it('should throw UnauthorizedError when authorization header does not start with Bearer', async () => {
    mockRequest.headers = {
      authorization: 'Invalid token',
    };

    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('should throw UnauthorizedError when token is invalid', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    (JWTUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError('Invalid token');
    });

    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw UnauthorizedError when user not found', async () => {
    const token = 'valid-token';
    const payload = { userId: 'user-123', email: 'test@example.com' };

    mockRequest.headers = {
      authorization: `Bearer ${token}`,
    };

    (JWTUtil.verifyAccessToken as jest.Mock).mockReturnValue(payload);
    (UserRepository.findById as jest.Mock).mockResolvedValue(null);

    await authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

