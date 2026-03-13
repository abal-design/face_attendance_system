import { Router } from 'express';
import { createSchedule, deleteSchedule, listSchedule, updateSchedule } from '../controllers/scheduleController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listSchedule);
router.post('/', roleCheck('admin', 'teacher'), createSchedule);
router.put('/:id', roleCheck('admin', 'teacher'), updateSchedule);
router.delete('/:id', roleCheck('admin'), deleteSchedule);

export default router;
