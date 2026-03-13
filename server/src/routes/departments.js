import { Router } from 'express';
import { createDepartment, deleteDepartment, getDepartmentById, listDepartments, updateDepartment } from '../controllers/departmentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listDepartments);
router.get('/:id', getDepartmentById);
router.post('/', roleCheck('admin'), createDepartment);
router.put('/:id', roleCheck('admin'), updateDepartment);
router.delete('/:id', roleCheck('admin'), deleteDepartment);

export default router;
