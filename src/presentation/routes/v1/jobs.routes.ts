import { Router } from 'express';
import JobController from '../../controllers/JobController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validationMiddleware';
import { Validators } from '../../../shared/utils';

const router = Router();

// All job routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/jobs:
 *   post:
 *     summary: Submit a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         schema:
 *           type: string
 *           maxLength: 255
 *         description: Optional idempotency key to prevent duplicate job submissions. If provided and a job with the same key exists, the existing job will be returned.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workspaceId
 *               - type
 *               - payload
 *             properties:
 *               workspaceId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [code_execution, file_processing, export_project]
 *                 example: code_execution
 *               payload:
 *                 type: object
 *                 example:
 *                   code: console.log("Hello World");
 *                   language: javascript
 *               idempotencyKey:
 *                 type: string
 *                 maxLength: 255
 *                 description: Optional idempotency key (can also be provided via Idempotency-Key header)
 *     responses:
 *       200:
 *         description: Job already exists with the provided idempotency key (idempotent response)
 *       201:
 *         description: Job submitted successfully
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
 *                   $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(Validators.submitJob), JobController.submit.bind(JobController));

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   get:
 *     summary: Get job status
 *     tags: [Jobs]
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
 *         description: Job status and result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     job:
 *                       $ref: '#/components/schemas/Job'
 *                     result:
 *                       type: object
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.get('/:id', JobController.getStatus.bind(JobController));

/**
 * @swagger
 * /api/v1/jobs/workspaces/{workspaceId}/jobs:
 *   get:
 *     summary: List jobs in a workspace
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized
 */
router.get('/workspaces/:workspaceId/jobs', JobController.listByWorkspace.bind(JobController));

export default router;

