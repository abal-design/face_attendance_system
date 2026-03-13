import { Router } from 'express';
import { createReport, listReports } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listReports);
router.post('/', roleCheck('admin', 'teacher'), createReport);

export default router;
