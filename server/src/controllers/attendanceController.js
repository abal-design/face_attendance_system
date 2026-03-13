import { Attendance, ClassModel, Student, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const attendanceIncludes = [
  {
    model: Student,
    as: 'student',
    attributes: ['id', 'studentId'],
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
  },
  {
    model: ClassModel,
    as: 'class',
    attributes: ['id', 'name', 'code', 'section'],
  },
];

export const listAttendance = asyncHandler(async (req, res) => {
  const where = {};

  if (req.query.classId) {
    where.classId = req.query.classId;
  }

  if (req.query.studentId) {
    where.studentId = req.query.studentId;
  }

  if (req.query.date) {
    where.attendanceDate = req.query.date;
  }

  const attendance = await Attendance.findAll({
    where,
    include: attendanceIncludes,
    order: [['attendanceDate', 'DESC']],
  });

  sendSuccess(res, { attendance });
});

export const createAttendance = asyncHandler(async (req, res) => {
  const { studentId, classId, attendanceDate, status, notes } = req.body;

  const [record, created] = await Attendance.findOrCreate({
    where: { studentId, classId, attendanceDate },
    defaults: {
      status: status || 'present',
      notes: notes || null,
      markedBy: req.user?.name || 'system',
      markedAt: new Date(),
    },
  });

  if (!created) {
    await record.update({
      status: status || record.status,
      notes: notes ?? record.notes,
      markedBy: req.user?.name || record.markedBy,
      markedAt: new Date(),
    });
  }

  const savedRecord = await Attendance.findByPk(record.id, { include: attendanceIncludes });
  sendSuccess(res, { message: 'Attendance saved successfully', attendance: savedRecord }, created ? 201 : 200);
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByPk(req.params.id);
  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  await attendance.update({
    ...req.body,
    markedAt: new Date(),
    markedBy: req.user?.name || attendance.markedBy,
  });

  const updatedAttendance = await Attendance.findByPk(attendance.id, { include: attendanceIncludes });
  sendSuccess(res, { message: 'Attendance updated successfully', attendance: updatedAttendance });
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByPk(req.params.id);
  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  await attendance.destroy();
  sendSuccess(res, { message: 'Attendance deleted successfully' });
});
