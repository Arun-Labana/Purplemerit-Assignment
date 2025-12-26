import { Router } from 'express';
import JobController from '../../controllers/JobController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validationMiddleware';
import { Validators } from '../../../shared/utils';

const router = Router();

// All job routes require authentication
router.use(authMiddleware);

router.post('/', validate(Validators.submitJob), JobController.submit.bind(JobController));
router.get('/:id', JobController.getStatus.bind(JobController));
router.get('/workspaces/:workspaceId/jobs', JobController.listByWorkspace.bind(JobController));

export default router;

