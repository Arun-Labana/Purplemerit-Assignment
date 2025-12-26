import { AppError } from '../../../src/shared/errors/AppError';
import { ValidationError } from '../../../src/shared/errors/ValidationError';
import { NotFoundError } from '../../../src/shared/errors/NotFoundError';
import { UnauthorizedError } from '../../../src/shared/errors/UnauthorizedError';
import { ForbiddenError } from '../../../src/shared/errors/ForbiddenError';
import { HttpStatus } from '../../../src/shared/constants/enums';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create AppError with default values', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create AppError with custom status code', () => {
      const error = new AppError('Test error', HttpStatus.BAD_REQUEST);
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create AppError with custom isOperational flag', () => {
      const error = new AppError('Test error', HttpStatus.INTERNAL_SERVER_ERROR, false);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with BAD_REQUEST status', () => {
      const error = new ValidationError('Validation failed');
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Invalid token');
      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with default message', () => {
      const error = new ForbiddenError();
      expect(error.message).toBe('Access forbidden');
      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});

