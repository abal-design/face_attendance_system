import { Router } from 'express';
import { getAvatar, getSettings, updateSettings, uploadAvatar } from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/auth.js';
import { avatarUploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);
router.get('/', getSettings);
router.get('/avatar', getAvatar);
router.post('/avatar', avatarUploadMiddleware, uploadAvatar);
router.put('/', updateSettings);

export default router;
