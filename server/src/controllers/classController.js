import { ClassModel, Department, Teacher } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const classIncludes = [
  { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
  { model: Teacher, as: 'teacher', attributes: ['id', 'teacherId'] },
];

export const listClasses = asyncHandler(async (req, res) => {
  const classes = await ClassModel.findAll({
    include: classIncludes,
    order: [['createdAt', 'DESC']],
  });

  sendSuccess(res, { classes });
});

export const getClassById = asyncHandler(async (req, res) => {
  const classItem = await ClassModel.findByPk(req.params.id, { include: classIncludes });
  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  sendSuccess(res, { class: classItem });
});

export const createClass = asyncHandler(async (req, res) => {
  const { name, code, section, semester, academicYear, room, departmentId } = req.body;

  if (!String(name || '').trim()) {
    throw new ApiError(400, 'Class name is required');
  }

  if (!String(code || '').trim()) {
    throw new ApiError(400, 'Class code is required');
  }

  let resolvedTeacherId = null;

  if (req.user.role === 'teacher') {
    const teacherProfile = await Teacher.findOne({ where: { userId: req.user.id } });
    if (!teacherProfile) {
      throw new ApiError(403, 'Teacher profile not found for current user');
    }
    resolvedTeacherId = teacherProfile.id;
  } else if (req.body.teacherId) {
    resolvedTeacherId = Number(req.body.teacherId);
  }

  if (departmentId) {
    const department = await Department.findByPk(Number(departmentId));
    if (!department) {
      throw new ApiError(400, 'Selected department does not exist');
    }
  }

  try {
    const classItem = await ClassModel.create({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      section: section ? String(section).trim() : null,
      semester: semester ? Number(semester) : null,
      academicYear: academicYear ? String(academicYear).trim() : null,
      room: room ? String(room).trim() : null,
      departmentId: departmentId ? Number(departmentId) : null,
      teacherId: resolvedTeacherId,
    });

    sendSuccess(res, { message: 'Class created successfully', class: classItem }, 201);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ApiError(409, 'Class code already exists');
    }
    throw error;
  }
});

export const updateClass = asyncHandler(async (req, res) => {
  const classItem = await ClassModel.findByPk(req.params.id);
  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  await classItem.update(req.body);
  sendSuccess(res, { message: 'Class updated successfully', class: classItem });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const classItem = await ClassModel.findByPk(req.params.id);
  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  await classItem.destroy();
  sendSuccess(res, { message: 'Class deleted successfully' });
});
