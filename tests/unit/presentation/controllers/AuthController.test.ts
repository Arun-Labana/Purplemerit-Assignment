import { Response, NextFunction } from 'express';
import AuthController from '../../../../src/presentation/controllers/AuthController';
import RegisterUser from '../../../../src/application/use-cases/auth/RegisterUser';
import LoginUser from '../../../../src/application/use-cases/auth/LoginUser';
import RefreshToken from '../../../../src/application/use-cases/auth/RefreshToken';
import LogoutUser from '../../../../src/application/use-cases/auth/LogoutUser';
import UserRepository from '../../../../src/infrastructure/database/postgresql/UserRepository';
import { AuthRequest } from '../../../../src/presentation/middleware/authMiddleware';

jest.mock('../../../../src/application/use-cases/auth/RegisterUser');
jest.mock('../../../../src/application/use-cases/auth/LoginUser');
jest.mock('../../../../src/application/use-cases/auth/RefreshToken');
jest.mock('../../../../src/application/use-cases/auth/LogoutUser');
jest.mock('../../../../src/infrastructure/database/postgresql/UserRepository');

describe('AuthController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
      user: {
        userId: 'user-123',
        email: 'test@example.com',
      },
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockResult = {
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      (RegisterUser.execute as jest.Mock).mockResolvedValue(mockResult);

      await AuthController.register(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(RegisterUser.execute).toHaveBeenCalledWith(mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      (LoginUser.execute as jest.Mock).mockResolvedValue(mockTokens);

      await AuthController.login(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(LoginUser.execute).toHaveBeenCalledWith(mockRequest.body);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      mockRequest.body = { refreshToken: 'refresh-token' };
      const mockTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };
      (RefreshToken.execute as jest.Mock).mockResolvedValue(mockTokens);

      await AuthController.refresh(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(RefreshToken.execute).toHaveBeenCalledWith('refresh-token');
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockRequest.body = { refreshToken: 'refresh-token' };
      (LogoutUser.execute as jest.Mock).mockResolvedValue(undefined);

      await AuthController.logout(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(LogoutUser.execute).toHaveBeenCalledWith('refresh-token');
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('me', () => {
    it('should get current user info successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };
      (UserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      await AuthController.me(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(UserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });
  });
});

