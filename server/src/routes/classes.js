import { Router } from 'express';
import { createClass, deleteClass, getClassById, listClasses, updateClass } from '../controllers/classController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listClasses);
router.get('/:id', getClassById);
router.post('/', roleCheck('admin', 'teacher'), createClass);
router.put('/:id', roleCheck('admin', 'teacher'), updateClass);
router.delete('/:id', roleCheck('admin'), deleteClass);

export default router;
