import { Request, Response, NextFunction } from 'express';
import { validate } from '../../../../src/presentation/middleware/validationMiddleware';
import { Validators } from '../../../../src/shared/utils';
import { ValidationError } from '../../../../src/shared/errors';

describe('validationMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };

    mockResponse = {};

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next when validation passes', () => {
    const schema = Validators.registerUser;
    mockRequest.body = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password123!',
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.body).toBeDefined();
    expect(mockRequest.body.email).toBe('test@example.com');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with error when validation fails', () => {
    const schema = Validators.registerUser;
    mockRequest.body = {
      email: 'invalid-email',
      name: 'T',
      password: 'short',
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
  });
});

