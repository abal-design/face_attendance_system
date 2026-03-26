import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { sequelize } from '../config/db.js';
import { Student, Teacher, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateEntityId } from '../utils/generateId.js';
import { normalizeInstitutionEmail } from '../utils/institutionEmail.js';
import { canSendCredentialEmail, sendCredentialEmail } from '../utils/credentialEmail.js';
import { sendSuccess } from '../utils/response.js';

const buildToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

const buildAvatar = (email) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

const attachRoleProfileId = async (userLike) => {
  if (!userLike) return userLike;

  const user = typeof userLike.toJSON === 'function' ? userLike.toJSON() : { ...userLike };

  if (user.role === 'teacher') {
    const teacher = await Teacher.findOne({
      where: { userId: user.id },
      attributes: ['teacherId'],
    });
    user.teacherId = teacher?.teacherId || null;
  }

  if (user.role === 'student') {
    const student = await Student.findOne({
      where: { userId: user.id },
      attributes: ['studentId'],
    });
    user.studentId = student?.studentId || null;
  }

  return user;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  const shouldUseInstitutionFormat = role === 'student' || role === 'teacher';
  const normalizedEmail = shouldUseInstitutionFormat ? normalizeInstitutionEmail(email) : email;

  const existingUser = await User.scope('withPassword').findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  let user;

  await sequelize.transaction(async (transaction) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.scope('withPassword').create(
      {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        avatar: buildAvatar(normalizedEmail),
      },
      { transaction }
    );

    if (role === 'student') {
      await Student.create(
        {
          userId: user.id,
          studentId: generateEntityId('STU'),
          year: 1,
        },
        { transaction }
      );
    }

    if (role === 'teacher') {
      await Teacher.create(
        {
          userId: user.id,
          teacherId: generateEntityId('TCH'),
        },
        { transaction }
      );
    }
  });

  const savedUser = await User.findByPk(user.id);
  const enrichedUser = await attachRoleProfileId(savedUser);

  let emailDelivery = {
    attempted: false,
    sent: false,
    error: null,
  };

  if (canSendCredentialEmail()) {
    emailDelivery.attempted = true;
    try {
      const roleId = role === 'student' ? enrichedUser.studentId : role === 'teacher' ? enrichedUser.teacherId : `ADM-${savedUser.id}`;
      await sendCredentialEmail({
        toEmail: savedUser.email,
        userName: savedUser.name,
        userId: roleId,
        password,
        role,
      });
      emailDelivery.sent = true;
    } catch (error) {
      emailDelivery.error = error.message || 'Failed to send credential email';
    }
  }

  sendSuccess(
    res,
    {
      message: 'Registration successful',
      token: buildToken(savedUser),
      user: enrichedUser,
      emailDelivery,
    },
    201
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const safeUser = await User.findByPk(user.id);
  const enrichedUser = await attachRoleProfileId(safeUser);

  sendSuccess(res, {
    message: 'Login successful',
    token: buildToken(safeUser),
    user: enrichedUser,
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const enrichedUser = await attachRoleProfileId(req.user);
  sendSuccess(res, { user: enrichedUser });
});
