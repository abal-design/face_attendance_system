import { Router } from 'express';
import { askChatbot, requestAdminSupport } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.post('/ask', roleCheck('admin', 'teacher', 'student'), askChatbot);
router.post('/support', roleCheck('admin', 'teacher', 'student'), requestAdminSupport);

export default router;
