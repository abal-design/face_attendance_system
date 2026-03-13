import { ClassModel, Schedule } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const scheduleIncludes = [{ model: ClassModel, as: 'class', attributes: ['id', 'name', 'code', 'section'] }];

export const listSchedule = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.classId) {
    where.classId = req.query.classId;
  }

  const schedules = await Schedule.findAll({
    where,
    include: scheduleIncludes,
    order: [
      ['dayOfWeek', 'ASC'],
      ['startTime', 'ASC'],
    ],
  });

  sendSuccess(res, { schedules });
});

export const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.create(req.body);
  sendSuccess(res, { message: 'Schedule created successfully', schedule }, 201);
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findByPk(req.params.id);
  if (!schedule) {
    throw new ApiError(404, 'Schedule entry not found');
  }

  await schedule.update(req.body);
  sendSuccess(res, { message: 'Schedule updated successfully', schedule });
});

export const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findByPk(req.params.id);
  if (!schedule) {
    throw new ApiError(404, 'Schedule entry not found');
  }

  await schedule.destroy();
  sendSuccess(res, { message: 'Schedule deleted successfully' });
});
