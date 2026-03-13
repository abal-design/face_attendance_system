import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { sequelize } from '../config/db.js';
import { Student, Teacher, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateEntityId } from '../utils/generateId.js';
import { sendSuccess } from '../utils/response.js';

const buildToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

const buildAvatar = (email) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;

  const existingUser = await User.scope('withPassword').findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  let user;

  await sequelize.transaction(async (transaction) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.scope('withPassword').create(
      {
        name,
        email,
        password: hashedPassword,
        role,
        avatar: buildAvatar(email),
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

  sendSuccess(
    res,
    {
      message: 'Registration successful',
      token: buildToken(savedUser),
      user: savedUser,
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

  sendSuccess(res, {
    message: 'Login successful',
    token: buildToken(safeUser),
    user: safeUser,
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user });
});
