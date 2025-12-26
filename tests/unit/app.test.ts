import request from 'supertest';
import app from '../../src/app';
import config from '../../src/config';

jest.mock('../../src/presentation/routes/v1', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/test', (_req: any, res: any) => res.json({ success: true }));
  return router;
});

describe('App Routes', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is healthy');
      expect(response.body.environment).toBe(config.app.env);
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });
  });
});

