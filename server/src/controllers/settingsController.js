import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getSettings = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    settings: {
      profile: req.user,
      preferences: {
        theme: 'system',
        emailNotifications: true,
        pushNotifications: true,
      },
    },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const user = await User.scope('withPassword').findByPk(req.user.id);

  const { name, avatar, password } = req.body;
  const updatePayload = {};

  if (name) {
    updatePayload.name = name;
  }

  if (avatar) {
    updatePayload.avatar = avatar;
  }

  if (password) {
    updatePayload.password = await bcrypt.hash(password, 10);
  }

  await user.update(updatePayload);

  const safeUser = await User.findByPk(user.id);

  sendSuccess(res, {
    message: 'Settings updated successfully',
    user: safeUser,
  });
});
