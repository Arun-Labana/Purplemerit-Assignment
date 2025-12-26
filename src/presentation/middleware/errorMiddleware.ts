import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors';
import { HttpStatus } from '../../shared/constants/enums';
import logger from '../../infrastructure/observability/logger';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error('Application error', {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Unknown error
  logger.error('Unexpected error', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: 'Internal server error',
  });
};

export default errorMiddleware;

