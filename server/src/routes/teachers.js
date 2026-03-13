import { Router } from 'express';
import { createTeacher, deleteTeacher, getTeacherById, listTeachers, updateTeacher } from '../controllers/teacherController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listTeachers);
router.get('/:id', getTeacherById);
router.post('/', roleCheck('admin'), createTeacher);
router.put('/:id', roleCheck('admin'), updateTeacher);
router.delete('/:id', roleCheck('admin'), deleteTeacher);

export default router;
