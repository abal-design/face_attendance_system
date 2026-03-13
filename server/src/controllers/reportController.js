import { Report, User } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listReports = asyncHandler(async (req, res) => {
  const reports = await Report.findAll({
    include: [{ model: User, as: 'generator', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  sendSuccess(res, { reports });
});

export const createReport = asyncHandler(async (req, res) => {
  const report = await Report.create({
    ...req.body,
    generatedBy: req.user?.id || null,
  });

  sendSuccess(res, { message: 'Report created successfully', report }, 201);
});
