import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// Add request ID for tracing
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.headers['x-request-id'] = requestId as string;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Extract request ID from request
export const getRequestId = (req: Request): string => {
  return req.headers['x-request-id'] as string;
};

