import { Notification } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const where = req.user.role === 'admin' && req.query.userId ? { userId: req.query.userId } : { userId: req.user.id };

  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });

  sendSuccess(res, { notifications });
});

export const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create(req.body);
  sendSuccess(res, { message: 'Notification created successfully', notification }, 201);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  await notification.update({ isRead: true });
  sendSuccess(res, { message: 'Notification updated successfully', notification });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  await notification.destroy();
  sendSuccess(res, { message: 'Notification deleted successfully' });
});
