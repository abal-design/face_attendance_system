import { Attendance, ClassModel, Department, Student, Teacher } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [students, teachers, departments, classes, attendanceToday] = await Promise.all([
    Student.count(),
    Teacher.count(),
    Department.count(),
    ClassModel.count(),
    Attendance.count({ where: { attendanceDate: new Date().toISOString().slice(0, 10) } }),
  ]);

  sendSuccess(res, {
    stats: {
      students,
      teachers,
      departments,
      classes,
      attendanceToday,
    },
  });
});
