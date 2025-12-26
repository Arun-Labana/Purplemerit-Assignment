import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './projects.routes';
import workspaceRoutes from './workspaces.routes';
import workspaceByIdRoutes from './workspace.routes';
import collaborationRoutes from './collaboration.routes';
import jobRoutes from './jobs.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/projects', workspaceRoutes); // Project-scoped workspace routes: /api/v1/projects/:projectId/workspaces
router.use('/workspaces', workspaceByIdRoutes); // Workspace-by-id routes: /api/v1/workspaces/:id
router.use('/collaboration', collaborationRoutes);
router.use('/jobs', jobRoutes);

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
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
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

