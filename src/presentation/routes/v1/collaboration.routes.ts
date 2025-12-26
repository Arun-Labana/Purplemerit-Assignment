import { Router } from 'express';
import CollaborationController from '../../controllers/CollaborationController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validationMiddleware';
import { Validators } from '../../../shared/utils';

const router = Router();

// All collaboration routes require authentication
router.use(authMiddleware);

router.post('/projects/:projectId/invite', validate(Validators.inviteMember), CollaborationController.invite.bind(CollaborationController));
router.put('/projects/:projectId/members/:userId/role', validate(Validators.updateMemberRole), CollaborationController.updateRole.bind(CollaborationController));
router.delete('/projects/:projectId/members/:userId', CollaborationController.removeMember.bind(CollaborationController));

export default router;

