import { Router } from 'express';
import WorkspaceController from '../../controllers/WorkspaceController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validationMiddleware';
import { Validators } from '../../../shared/utils';

const router = Router();

// All workspace routes require authentication
router.use(authMiddleware);

// Workspace CRUD
router.post('/projects/:projectId/workspaces', validate(Validators.createWorkspace), WorkspaceController.create.bind(WorkspaceController));
router.get('/projects/:projectId/workspaces', WorkspaceController.listByProject.bind(WorkspaceController));
router.get('/:id', WorkspaceController.getById.bind(WorkspaceController));

export default router;

