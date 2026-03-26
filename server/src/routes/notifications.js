import { Router } from 'express';
import { createNotification, deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listNotifications);
router.post('/', roleCheck('admin'), createNotification);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
