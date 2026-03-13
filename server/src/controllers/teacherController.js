import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';
import { Department, Teacher, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateEntityId } from '../utils/generateId.js';
import { sendSuccess } from '../utils/response.js';

const teacherIncludes = [
  { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar', 'role', 'isActive'] },
  { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
];

export const listTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.findAll({
    include: teacherIncludes,
    order: [['createdAt', 'DESC']],
  });

  sendSuccess(res, { teachers });
});

export const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByPk(req.params.id, { include: teacherIncludes });
  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }

  sendSuccess(res, { teacher });
});

export const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, password, departmentId, subject, experience, qualification, phone } = req.body;

  const existingUser = await User.scope('withPassword').findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  let teacher;

  await sequelize.transaction(async (transaction) => {
    const user = await User.scope('withPassword').create(
      {
        name,
        email,
        password: await bcrypt.hash(password || 'ChangeMe123!', 10),
        role: 'teacher',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      },
      { transaction }
    );

    teacher = await Teacher.create(
      {
        userId: user.id,
        teacherId: generateEntityId('TCH'),
        departmentId: departmentId || null,
        subject: subject || null,
        experience: experience || 0,
        qualification: qualification || null,
        phone: phone || null,
      },
      { transaction }
    );
  });

  const savedTeacher = await Teacher.findByPk(teacher.id, { include: teacherIncludes });
  sendSuccess(res, { message: 'Teacher created successfully', teacher: savedTeacher }, 201);
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }

  const { name, email, avatar, isActive, departmentId, subject, experience, qualification, phone, status } = req.body;

  if (teacher.user) {
    await teacher.user.update({
      name: name ?? teacher.user.name,
      email: email ?? teacher.user.email,
      avatar: avatar ?? teacher.user.avatar,
      isActive: isActive ?? teacher.user.isActive,
    });
  }

  await teacher.update({
    departmentId: departmentId ?? teacher.departmentId,
    subject: subject ?? teacher.subject,
    experience: experience ?? teacher.experience,
    qualification: qualification ?? teacher.qualification,
    phone: phone ?? teacher.phone,
    status: status ?? teacher.status,
  });

  const updatedTeacher = await Teacher.findByPk(teacher.id, { include: teacherIncludes });
  sendSuccess(res, { message: 'Teacher updated successfully', teacher: updatedTeacher });
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByPk(req.params.id);
  if (!teacher) {
    throw new ApiError(404, 'Teacher not found');
  }

  await sequelize.transaction(async (transaction) => {
    await Teacher.destroy({ where: { id: teacher.id }, transaction });
    await User.destroy({ where: { id: teacher.userId }, transaction });
  });

  sendSuccess(res, { message: 'Teacher deleted successfully' });
});
