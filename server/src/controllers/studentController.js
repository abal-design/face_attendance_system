import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';
import { Department, Student, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateEntityId } from '../utils/generateId.js';
import { sendSuccess } from '../utils/response.js';

const studentIncludes = [
  { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar', 'role', 'isActive'] },
  { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
];

export const listStudents = asyncHandler(async (req, res) => {
  const students = await Student.findAll({
    include: studentIncludes,
    order: [['createdAt', 'DESC']],
  });

  sendSuccess(res, { students });
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, { include: studentIncludes });
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  sendSuccess(res, { student });
});

export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, password, departmentId, year, semester, phone, address, guardianName, guardianPhone } = req.body;

  const existingUser = await User.scope('withPassword').findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  let student;

  await sequelize.transaction(async (transaction) => {
    const user = await User.scope('withPassword').create(
      {
        name,
        email,
        password: await bcrypt.hash(password || 'ChangeMe123!', 10),
        role: 'student',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      },
      { transaction }
    );

    student = await Student.create(
      {
        userId: user.id,
        studentId: generateEntityId('STU'),
        departmentId: departmentId || null,
        year: year || 1,
        semester: semester || null,
        phone: phone || null,
        address: address || null,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
      },
      { transaction }
    );
  });

  const savedStudent = await Student.findByPk(student.id, { include: studentIncludes });
  sendSuccess(res, { message: 'Student created successfully', student: savedStudent }, 201);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  const { name, email, avatar, isActive, departmentId, year, semester, phone, address, guardianName, guardianPhone, status } = req.body;

  if (student.user) {
    await student.user.update({
      name: name ?? student.user.name,
      email: email ?? student.user.email,
      avatar: avatar ?? student.user.avatar,
      isActive: isActive ?? student.user.isActive,
    });
  }

  await student.update({
    departmentId: departmentId ?? student.departmentId,
    year: year ?? student.year,
    semester: semester ?? student.semester,
    phone: phone ?? student.phone,
    address: address ?? student.address,
    guardianName: guardianName ?? student.guardianName,
    guardianPhone: guardianPhone ?? student.guardianPhone,
    status: status ?? student.status,
  });

  const updatedStudent = await Student.findByPk(student.id, { include: studentIncludes });
  sendSuccess(res, { message: 'Student updated successfully', student: updatedStudent });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  await sequelize.transaction(async (transaction) => {
    await Student.destroy({ where: { id: student.id }, transaction });
    await User.destroy({ where: { id: student.userId }, transaction });
  });

  sendSuccess(res, { message: 'Student deleted successfully' });
});
