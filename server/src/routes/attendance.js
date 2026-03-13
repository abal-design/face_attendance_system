import { Router } from 'express';
import { createAttendance, deleteAttendance, listAttendance, updateAttendance } from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listAttendance);
router.post('/', roleCheck('admin', 'teacher'), createAttendance);
router.put('/:id', roleCheck('admin', 'teacher'), updateAttendance);
router.delete('/:id', roleCheck('admin'), deleteAttendance);

export default router;
