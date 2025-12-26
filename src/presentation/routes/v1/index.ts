import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './projects.routes';
import workspaceRoutes from './workspaces.routes';
import collaborationRoutes from './collaboration.routes';
import jobRoutes from './jobs.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/collaboration', collaborationRoutes);
router.use('/jobs', jobRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

