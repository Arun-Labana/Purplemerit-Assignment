import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import v1Routes from './presentation/routes/v1';
import { errorMiddleware } from './presentation/middleware/errorMiddleware';
import { loggingMiddleware } from './presentation/middleware/loggingMiddleware';
import { generalRateLimiter } from './presentation/middleware/rateLimitMiddleware';
import { requestIdMiddleware } from './infrastructure/observability/tracing';
import { register as metricsRegister } from './infrastructure/observability/metrics';
import { swaggerSpec } from './presentation/docs/swagger';
import logger from './infrastructure/observability/logger';

const app: Application = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware - CSP configured to allow Swagger UI
const railwayDomain = process.env.API_BASE_URL 
  ? new URL(process.env.API_BASE_URL).origin 
  : (process.env.NODE_ENV === 'production' 
    ? 'https://collab-workspace-api-production.up.railway.app'
    : `http://localhost:${config.app.port}`);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        railwayDomain,
        "https://collab-workspace-api-production.up.railway.app",
        "https://*.up.railway.app",
        "http://localhost:*",
        "https://localhost:*",
      ],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      frameSrc: ["'self'"],
    },
  },
}));
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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Check if the server is running and healthy
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: production
 */
// Health check (before API routes)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: config.app.env,
  });
});

// Metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    const metrics = await metricsRegister.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error getting metrics', error);
    res.status(500).end();
  }
});

// API Documentation
const swaggerServerUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' 
  ? 'https://collab-workspace-api-production.up.railway.app'
  : `http://localhost:${config.app.port}`);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    // Force Swagger UI to use the correct server URL
    url: swaggerServerUrl,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    validatorUrl: null, // Disable validator
  },
  customSiteTitle: 'Collaborative Workspace API',
}));

// API routes
app.use(`/api/${config.app.apiVersion}`, v1Routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;

