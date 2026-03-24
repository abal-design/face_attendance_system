import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
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

export const getAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ['id', 'avatar'] });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  sendSuccess(res, { avatar: user.avatar });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await User.scope('withPassword').findByPk(req.user.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!req.file) {
    throw new ApiError(400, 'Image file is required. Send as form-data field: image');
  }

  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

  await user.update({ avatar: avatarUrl });

  const safeUser = await User.findByPk(user.id);
  sendSuccess(
    res,
    {
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      user: safeUser,
    },
    201
  );
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
