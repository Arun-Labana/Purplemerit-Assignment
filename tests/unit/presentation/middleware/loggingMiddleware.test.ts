import { loggingMiddleware } from '../../../../src/presentation/middleware/loggingMiddleware';
import { Request, Response, NextFunction } from 'express';
import logger from '../../../../src/infrastructure/observability/logger';

jest.mock('../../../../src/infrastructure/observability/logger');

describe('loggingMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
      headers: { 'x-request-id': 'test-id' },
      ip: '127.0.0.1',
      get: jest.fn((header: string): string | string[] | undefined => {
        if (header === 'user-agent') {
          return 'test-user-agent';
        }
        return undefined;
      }) as any,
    };

    mockResponse = {
      statusCode: 200,
      on: jest.fn(),
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should log request and call next', () => {
    loggingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.info).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log response when finished', () => {
    (mockResponse.on as jest.Mock).mockImplementation((event: string, callback: () => void) => {
      if (event === 'finish') {
        setTimeout(callback, 0);
      }
    });

    loggingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });
});

