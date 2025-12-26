import { Request, Response, NextFunction } from 'express';
import logger from '../../infrastructure/observability/logger';
import { httpRequestCounter, httpRequestDuration } from '../../infrastructure/observability/metrics';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    // Update metrics
    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
      },
      duration
    );

    // Log response
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}s`,
    });
  });

  next();
};

export default loggingMiddleware;

