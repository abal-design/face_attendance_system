import { Router } from 'express';
import { createStudent, deleteStudent, getStudentById, listStudents, updateStudent } from '../controllers/studentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listStudents);
router.get('/:id', getStudentById);
router.post('/', roleCheck('admin'), createStudent);
router.put('/:id', roleCheck('admin'), updateStudent);
router.delete('/:id', roleCheck('admin'), deleteStudent);

export default router;
