import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../../infrastructure/database/redis/connection';
import config from '../../config';
import { APP_CONSTANTS } from '../../shared/constants';

// General rate limiter
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    client: redisClient.getClient(),
    prefix: 'rate_limit:general:',
  }),
});

// Auth rate limiter (stricter)
export const authRateLimiter = rateLimit({
  windowMs: APP_CONSTANTS.AUTH_RATE_LIMIT_WINDOW_MS,
  max: APP_CONSTANTS.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    client: redisClient.getClient(),
    prefix: 'rate_limit:auth:',
  }),
});

export default { generalRateLimiter, authRateLimiter };

