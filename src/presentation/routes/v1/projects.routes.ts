import { Router } from 'express';
import ProjectController from '../../controllers/ProjectController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validationMiddleware';
import { Validators } from '../../../shared/utils';

const router = Router();

// All project routes require authentication
router.use(authMiddleware);

// Project CRUD
router.post('/', validate(Validators.createProject), ProjectController.create.bind(ProjectController));
router.get('/', ProjectController.list.bind(ProjectController));
router.get('/:id', ProjectController.getById.bind(ProjectController));
router.put('/:id', validate(Validators.updateProject), ProjectController.update.bind(ProjectController));
router.delete('/:id', ProjectController.delete.bind(ProjectController));

// Project members
router.get('/:id/members', ProjectController.getMembers.bind(ProjectController));

export default router;

