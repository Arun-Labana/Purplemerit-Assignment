import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request } from 'express';
import redisClient from '../../infrastructure/database/redis/connection';
import config from '../../config';
import { APP_CONSTANTS } from '../../shared/constants';
import { AuthRequest } from './authMiddleware';

// Helper function to get IP from request with IPv6 support
const getIpFromRequest = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  // Use ipKeyGenerator to properly handle IPv6 addresses
  return ipKeyGenerator(ip);
};

// General rate limiter - per user for authenticated requests, per IP for unauthenticated
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if authenticated, otherwise use IP address (with IPv6 support)
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    if (authReq.user?.userId) {
      return authReq.user.userId;
    }
    // Use helper function for proper IPv6 handling
    return getIpFromRequest(req);
  },
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      const client = redisClient.getClient();
      return await client.sendCommand(args);
    },
    prefix: 'rate_limit:general:',
  }),
});

// Auth rate limiter - per IP address (since user isn't authenticated yet)
export const authRateLimiter = rateLimit({
  windowMs: APP_CONSTANTS.AUTH_RATE_LIMIT_WINDOW_MS,
  max: APP_CONSTANTS.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Auth endpoints use IP with proper IPv6 handling
  keyGenerator: (req: Request) => getIpFromRequest(req),
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      const client = redisClient.getClient();
      return await client.sendCommand(args);
    },
    prefix: 'rate_limit:auth:',
  }),
});

export default { generalRateLimiter, authRateLimiter };

