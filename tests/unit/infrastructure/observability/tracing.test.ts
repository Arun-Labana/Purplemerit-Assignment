import { requestIdMiddleware, getRequestId } from '../../../../src/infrastructure/observability/tracing';
import { Request, Response, NextFunction } from 'express';

describe('Tracing', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('requestIdMiddleware', () => {
    it('should generate request ID when not present', () => {
      requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.headers && mockRequest.headers['x-request-id']).toBeDefined();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing request ID from headers', () => {
      mockRequest.headers = { 'x-request-id': 'existing-id' };

      requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.headers['x-request-id']).toBe('existing-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id');
    });
  });

  describe('getRequestId', () => {
    it('should get request ID from request', () => {
      mockRequest.headers = { 'x-request-id': 'test-id' };

      const requestId = getRequestId(mockRequest as Request);

      expect(requestId).toBe('test-id');
    });
  });
});

