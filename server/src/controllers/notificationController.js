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

  if (req.user.role !== 'admin' && Number(notification.userId) !== Number(req.user.id)) {
    throw new ApiError(403, 'You are not allowed to update this notification');
  }

  await notification.update({ isRead: true });
  sendSuccess(res, { message: 'Notification updated successfully', notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.update(
    { isRead: true },
    { where: { userId: req.user.id, isRead: false } }
  );

  sendSuccess(res, { message: 'All notifications marked as read' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (req.user.role !== 'admin' && Number(notification.userId) !== Number(req.user.id)) {
    throw new ApiError(403, 'You are not allowed to delete this notification');
  }

  await notification.destroy();
  sendSuccess(res, { message: 'Notification deleted successfully' });
});
