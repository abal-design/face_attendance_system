import { Router } from 'express';
import { body } from 'express-validator';
import { getCurrentUser, login, register } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'teacher', 'student']),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

router.get('/me', authMiddleware, getCurrentUser);

export default router;
