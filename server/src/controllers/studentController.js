import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';
import { Department, Student, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateEntityId } from '../utils/generateId.js';
import { generatePassword } from '../utils/generatePassword.js';
import { normalizeInstitutionEmail } from '../utils/institutionEmail.js';
import { canSendCredentialEmail, sendStudentCredentialEmail } from '../utils/credentialEmail.js';
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
  const { name, email, password, departmentId, year, semester, section, phone, address, guardianName, guardianPhone } = req.body;
  const normalizedEmail = normalizeInstitutionEmail(email);

  const existingUser = await User.scope('withPassword').findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  let student;
  const generatedPassword = String(password || '').trim() || generatePassword(12);

  await sequelize.transaction(async (transaction) => {
    const user = await User.scope('withPassword').create(
      {
        name,
        email: normalizedEmail,
        password: await bcrypt.hash(generatedPassword, 10),
        role: 'student',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`,
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
        section: section ? String(section).trim() : null,
        phone: phone || null,
        address: address || null,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
      },
      { transaction }
    );
  });

  const savedStudent = await Student.findByPk(student.id, { include: studentIncludes });

  let emailDelivery = {
    attempted: false,
    sent: false,
    error: null,
  };

  if (canSendCredentialEmail()) {
    emailDelivery.attempted = true;
    try {
      await sendStudentCredentialEmail({
        toEmail: savedStudent.user?.email || normalizedEmail,
        studentName: savedStudent.user?.name || name,
        studentId: savedStudent.studentId,
        password: generatedPassword,
      });
      emailDelivery.sent = true;
    } catch (error) {
      emailDelivery.error = error.message || 'Failed to send credential email';
    }
  }

  sendSuccess(
    res,
    {
      message: 'Student created successfully',
      student: savedStudent,
      credentials: {
        name: savedStudent.user?.name || name,
        email: savedStudent.user?.email || normalizedEmail,
        studentId: savedStudent.studentId,
        password: generatedPassword,
      },
      emailDelivery,
    },
    201
  );
});

export const bulkCreateStudents = asyncHandler(async (req, res) => {
  const entries = Array.isArray(req.body.students) ? req.body.students : [];
  if (entries.length === 0) {
    throw new ApiError(400, 'students array is required for bulk create');
  }

  const departments = await Department.findAll({ attributes: ['id', 'name', 'code'] });
  const departmentByCode = new Map(
    departments
      .filter((d) => d.code)
      .map((d) => [String(d.code).trim().toUpperCase(), d.id])
  );
  const departmentByName = new Map(
    departments
      .filter((d) => d.name)
      .map((d) => [String(d.name).trim().toLowerCase(), d.id])
  );

  const createdStudentIds = [];
  const credentials = [];
  const skipped = [];

  await sequelize.transaction(async (transaction) => {
    for (const [index, rawEntry] of entries.entries()) {
      const row = index + 1;
      const name = String(rawEntry?.name || '').trim();
      const emailInput = String(rawEntry?.email || '').trim().toLowerCase();
      const email = normalizeInstitutionEmail(emailInput);

      if (!name || !email) {
        skipped.push({ row, email, reason: 'Missing required name or email' });
        continue;
      }

      const existingUser = await User.scope('withPassword').findOne({ where: { email }, transaction });
      if (existingUser) {
        skipped.push({ row, email, reason: 'Email already exists' });
        continue;
      }

      let resolvedDepartmentId = null;
      if (rawEntry?.departmentId) {
        resolvedDepartmentId = Number(rawEntry.departmentId);
      } else if (rawEntry?.department) {
        const departmentText = String(rawEntry.department).trim();
        resolvedDepartmentId =
          departmentByCode.get(departmentText.toUpperCase()) ||
          departmentByName.get(departmentText.toLowerCase()) ||
          null;
      }

      const plainPassword = String(rawEntry?.password || '').trim() || generatePassword(12);

      const user = await User.scope('withPassword').create(
        {
          name,
          email,
          password: await bcrypt.hash(plainPassword, 10),
          role: 'student',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
        },
        { transaction }
      );

      const student = await Student.create(
        {
          userId: user.id,
          studentId: generateEntityId('STU'),
          departmentId: resolvedDepartmentId,
          year: rawEntry?.year ? Number(rawEntry.year) : 1,
          semester: rawEntry?.semester ? Number(rawEntry.semester) : null,
          section: rawEntry?.section ? String(rawEntry.section).trim() : null,
          phone: rawEntry?.phone ? String(rawEntry.phone).trim() : null,
          address: rawEntry?.address ? String(rawEntry.address).trim() : null,
          guardianName: rawEntry?.guardianName ? String(rawEntry.guardianName).trim() : null,
          guardianPhone: rawEntry?.guardianPhone ? String(rawEntry.guardianPhone).trim() : null,
        },
        { transaction }
      );

      createdStudentIds.push(student.id);
      credentials.push({
        name,
        email,
        studentId: student.studentId,
        password: plainPassword,
      });
    }
  });

  const students = createdStudentIds.length
    ? await Student.findAll({ where: { id: createdStudentIds }, include: studentIncludes })
    : [];

  let emailDelivery = {
    attempted: false,
    sent: 0,
    failed: 0,
    failures: [],
  };

  if (credentials.length > 0 && canSendCredentialEmail()) {
    emailDelivery.attempted = true;
    const deliveryResults = await Promise.allSettled(
      credentials.map((credential) =>
        sendStudentCredentialEmail({
          toEmail: credential.email,
          studentName: credential.name,
          studentId: credential.studentId,
          password: credential.password,
        })
      )
    );

    deliveryResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        emailDelivery.sent += 1;
      } else {
        emailDelivery.failed += 1;
        emailDelivery.failures.push({
          email: credentials[index]?.email || null,
          reason: result.reason?.message || 'Unknown email send error',
        });
      }
    });
  }

  sendSuccess(
    res,
    {
      message: `${students.length} students created successfully`,
      students,
      credentials,
      skipped,
      summary: {
        total: entries.length,
        created: students.length,
        skipped: skipped.length,
      },
      emailDelivery,
    },
    201
  );
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  const { name, email, avatar, isActive, departmentId, year, semester, section, phone, address, guardianName, guardianPhone, status } = req.body;
  const normalizedEmail = email ? normalizeInstitutionEmail(email) : student.user?.email;

  if (student.user) {
    await student.user.update({
      name: name ?? student.user.name,
      email: normalizedEmail ?? student.user.email,
      avatar: avatar ?? student.user.avatar,
      isActive: isActive ?? student.user.isActive,
    });
  }

  await student.update({
    departmentId: departmentId ?? student.departmentId,
    year: year ?? student.year,
    semester: semester ?? student.semester,
    section: section ?? student.section,
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

export const registerStudentFace = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    throw new ApiError(403, 'Only students can register face data');
  }

  if (!req.file) {
    throw new ApiError(400, 'Image file is required. Send as form-data field: image');
  }

  let parsedFaceDescriptor = null;
  if (req.body?.faceDescriptor) {
    try {
      const descriptor = JSON.parse(req.body.faceDescriptor);
      if (!Array.isArray(descriptor) || descriptor.length < 64 || descriptor.length > 1024) {
        throw new Error('Invalid descriptor shape');
      }

      const normalized = descriptor.map((value) => Number(value));
      if (normalized.some((value) => Number.isNaN(value))) {
        throw new Error('Descriptor contains non-numeric values');
      }

      parsedFaceDescriptor = normalized;
    } catch (error) {
      throw new ApiError(400, 'Invalid faceDescriptor payload');
    }
  }

  let parsedFaceSamples = [];
  if (req.body?.faceSamples) {
    try {
      const samples = JSON.parse(req.body.faceSamples);
      if (!Array.isArray(samples)) {
        throw new Error('Invalid samples payload');
      }

      parsedFaceSamples = samples
        .filter((sample) => Array.isArray(sample) && sample.length >= 64 && sample.length <= 1024)
        .map((sample) => sample.map((value) => Number(value)))
        .filter((sample) => !sample.some((value) => Number.isNaN(value)));
    } catch (error) {
      throw new ApiError(400, 'Invalid faceSamples payload');
    }
  }

  const student = await Student.findOne({
    where: { userId: req.user.id },
    include: [{ model: User, as: 'user' }],
  });

  if (!student || !student.user) {
    throw new ApiError(404, 'Student profile not found');
  }

  const faceImageUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
  await student.user.update({ avatar: faceImageUrl });

  const existingSamples = (() => {
    if (!student.faceSamples) return [];
    try {
      const parsed = JSON.parse(student.faceSamples);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  })();

  const mergedSamples = [
    ...existingSamples,
    ...parsedFaceSamples,
    ...(parsedFaceDescriptor ? [parsedFaceDescriptor] : []),
  ].slice(-30);

  const descriptorFromSamples = (() => {
    if (mergedSamples.length === 0) return parsedFaceDescriptor;
    const length = mergedSamples[0].length;
    if (!length) return parsedFaceDescriptor;

    const valid = mergedSamples.filter((sample) => Array.isArray(sample) && sample.length === length);
    if (valid.length === 0) return parsedFaceDescriptor;

    const sum = new Array(length).fill(0);
    for (const sample of valid) {
      for (let index = 0; index < length; index += 1) {
        sum[index] += sample[index];
      }
    }
    return sum.map((value) => Number((value / valid.length).toFixed(8)));
  })();

  await student.update({
    faceDescriptor: descriptorFromSamples ? JSON.stringify(descriptorFromSamples) : student.faceDescriptor,
    faceSamples: JSON.stringify(mergedSamples),
  });

  sendSuccess(
    res,
    {
      message: 'Face registered successfully',
      faceImageUrl,
      studentId: student.studentId,
      hasFaceDescriptor: Boolean(descriptorFromSamples),
      totalFaceSamples: mergedSamples.length,
    },
    201
  );
});
