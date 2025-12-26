import { Router } from 'express';
import AuthController from '../../controllers/AuthController';
import { validate } from '../../middleware/validationMiddleware';
import { authMiddleware } from '../../middleware/authMiddleware';
import { authRateLimiter } from '../../middleware/rateLimitMiddleware';
import { Validators } from '../../../shared/utils';

const router = Router();

// Public routes with rate limiting
router.post('/register', authRateLimiter, validate(Validators.registerUser), AuthController.register.bind(AuthController));
router.post('/login', authRateLimiter, validate(Validators.loginUser), AuthController.login.bind(AuthController));
router.post('/refresh', AuthController.refresh.bind(AuthController));
router.post('/logout', AuthController.logout.bind(AuthController));

// Protected routes
router.get('/me', authMiddleware, AuthController.me.bind(AuthController));

export default router;

