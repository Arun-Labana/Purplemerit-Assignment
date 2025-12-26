import { Router } from 'express';
import WorkspaceController from '../../controllers/WorkspaceController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// All workspace routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/workspaces/{id}:
 *   get:
 *     summary: Get workspace by ID
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workspace details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workspace not found
 */
router.get('/:id', WorkspaceController.getById.bind(WorkspaceController));

export default router;

