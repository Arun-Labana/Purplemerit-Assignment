import LogoutUser from '../../../../../src/application/use-cases/auth/LogoutUser';
import SessionService from '../../../../../src/infrastructure/database/redis/SessionService';
import logger from '../../../../../src/infrastructure/observability/logger';

jest.mock('../../../../../src/infrastructure/database/redis/SessionService');
jest.mock('../../../../../src/infrastructure/observability/logger');

describe('LogoutUser', () => {
  const refreshToken = 'refresh-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout user successfully', async () => {
    (SessionService.revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);

    await LogoutUser.execute(refreshToken);

    expect(SessionService.revokeRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(logger.info).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('Redis error');
    (SessionService.revokeRefreshToken as jest.Mock).mockRejectedValue(error);

    await expect(LogoutUser.execute(refreshToken)).rejects.toThrow('Redis error');
    expect(logger.error).toHaveBeenCalled();
  });
});

