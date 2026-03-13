import { Router } from 'express';
import authRoutes from './auth.js';
import studentRoutes from './students.js';
import teacherRoutes from './teachers.js';
import departmentRoutes from './departments.js';
import classRoutes from './classes.js';
import attendanceRoutes from './attendance.js';
import scheduleRoutes from './schedule.js';
import reportRoutes from './reports.js';
import dashboardRoutes from './dashboard.js';
import notificationRoutes from './notifications.js';
import settingsRoutes from './settings.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/departments', departmentRoutes);
router.use('/classes', classRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);

export default router;
