import { ClassModel, Department, Teacher } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const classIncludes = [
  { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
  { model: Teacher, as: 'teacher', attributes: ['id', 'teacherId'] },
];

export const listClasses = asyncHandler(async (req, res) => {
  const classes = await ClassModel.findAll({
    include: classIncludes,
    order: [['createdAt', 'DESC']],
  });

  sendSuccess(res, { classes });
});

export const getClassById = asyncHandler(async (req, res) => {
  const classItem = await ClassModel.findByPk(req.params.id, { include: classIncludes });
  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  sendSuccess(res, { class: classItem });
});

export const createClass = asyncHandler(async (req, res) => {
  const classItem = await ClassModel.create(req.body);
  sendSuccess(res, { message: 'Class created successfully', class: classItem }, 201);
});

export const updateClass = asyncHandler(async (req, res) => {
  const classItem = await ClassModel.findByPk(req.params.id);
  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  await classItem.update(req.body);
  sendSuccess(res, { message: 'Class updated successfully', class: classItem });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const classItem = await ClassModel.findByPk(req.params.id);
  if (!classItem) {
    throw new ApiError(404, 'Class not found');
  }

  await classItem.destroy();
  sendSuccess(res, { message: 'Class deleted successfully' });
});
