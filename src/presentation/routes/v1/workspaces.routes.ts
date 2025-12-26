import { Router } from 'express';
import WorkspaceController from '../../controllers/WorkspaceController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validationMiddleware';
import { Validators } from '../../../shared/utils';

const router = Router();

// All workspace routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/projects/{projectId}/workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Development Workspace
 *               settings:
 *                 type: object
 *                 example:
 *                   theme: dark
 *                   language: typescript
 *     responses:
 *       201:
 *         description: Workspace created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Unauthorized
 */
router.post('/:projectId/workspaces', validate(Validators.createWorkspace), WorkspaceController.create.bind(WorkspaceController));

/**
 * @swagger
 * /api/v1/projects/{projectId}/workspaces:
 *   get:
 *     summary: List workspaces in a project
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Unauthorized
 */
router.get('/:projectId/workspaces', WorkspaceController.listByProject.bind(WorkspaceController));

export default router;
