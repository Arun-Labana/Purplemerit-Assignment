import { Router } from 'express';
import CollaborationController from '../../controllers/CollaborationController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validationMiddleware';
import { Validators } from '../../../shared/utils';

const router = Router();

// All collaboration routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/collaboration/projects/{projectId}/invite:
 *   post:
 *     summary: Invite a collaborator to a project
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: collaborator@example.com
 *               role:
 *                 type: string
 *                 enum: [owner, collaborator, viewer]
 *                 example: collaborator
 *     responses:
 *       201:
 *         description: Collaborator invited successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project or user not found
 */
router.post('/projects/:projectId/invite', validate(Validators.inviteMember), CollaborationController.invite.bind(CollaborationController));

/**
 * @swagger
 * /api/v1/collaboration/projects/{projectId}/members/{userId}/role:
 *   put:
 *     summary: Update member role in a project
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [owner, collaborator, viewer]
 *                 example: viewer
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project or member not found
 */
router.put('/projects/:projectId/members/:userId/role', validate(Validators.updateMemberRole), CollaborationController.updateRole.bind(CollaborationController));

/**
 * @swagger
 * /api/v1/collaboration/projects/{projectId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a project
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project or member not found
 */
router.delete('/projects/:projectId/members/:userId', CollaborationController.removeMember.bind(CollaborationController));

export default router;

