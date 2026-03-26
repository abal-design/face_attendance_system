import { Router } from 'express';
import { bulkCreateStudents, createStudent, deleteStudent, getStudentById, listStudents, registerStudentFace, updateStudent } from '../controllers/studentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { avatarUploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listStudents);
router.post('/face-registration', roleCheck('student'), avatarUploadMiddleware, registerStudentFace);
router.post('/bulk', roleCheck('admin'), bulkCreateStudents);
router.get('/:id', getStudentById);
router.post('/', roleCheck('admin'), createStudent);
router.put('/:id', roleCheck('admin'), updateStudent);
router.delete('/:id', roleCheck('admin'), deleteStudent);

export default router;
