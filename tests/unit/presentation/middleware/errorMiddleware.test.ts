import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from '../../../../src/presentation/middleware/errorMiddleware';
import { AppError, ValidationError, NotFoundError } from '../../../../src/shared/errors';
import { HttpStatus } from '../../../../src/shared/constants/enums';
import logger from '../../../../src/infrastructure/observability/logger';

jest.mock('../../../../src/infrastructure/observability/logger');

describe('errorMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      path: '/test',
      method: 'GET',
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

  it('should handle AppError correctly', () => {
    const error = new ValidationError('Validation failed');
    errorMiddleware(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledWith('Application error', {
      message: 'Validation failed',
      statusCode: HttpStatus.BAD_REQUEST,
      path: '/test',
      method: 'GET',
    });
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
    });
  });

  it('should handle NotFoundError correctly', () => {
    const error = new NotFoundError('Resource not found');
    errorMiddleware(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Resource not found',
    });
  });

  it('should handle unknown errors correctly', () => {
    const error = new Error('Unexpected error');
    errorMiddleware(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledWith('Unexpected error', {
      error,
      stack: error.stack,
      path: '/test',
      method: 'GET',
    });
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });
  });
});

