import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import v1Routes from './presentation/routes/v1';
import { errorMiddleware } from './presentation/middleware/errorMiddleware';
import { loggingMiddleware } from './presentation/middleware/loggingMiddleware';
import { generalRateLimiter } from './presentation/middleware/rateLimitMiddleware';
import { requestIdMiddleware } from './infrastructure/observability/tracing';
import { register as metricsRegister } from './infrastructure/observability/metrics';
import logger from './infrastructure/observability/logger';

const app: Application = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request ID for tracing
app.use(requestIdMiddleware);

// Logging
app.use(loggingMiddleware);

// Rate limiting
app.use(generalRateLimiter);

// Health check (before API routes)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: config.app.env,
  });
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    const metrics = await metricsRegister.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error getting metrics', error);
    res.status(500).end();
  }
});

// API routes
app.use(`/api/${config.app.apiVersion}`, v1Routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;

