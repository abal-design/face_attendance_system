import { Department, Teacher } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const departmentIncludes = [{ model: Teacher, as: 'head', attributes: ['id', 'teacherId'] }];

export const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.findAll({
    include: departmentIncludes,
    order: [['name', 'ASC']],
  });

  sendSuccess(res, { departments });
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id, { include: departmentIncludes });
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  sendSuccess(res, { department });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  sendSuccess(res, { message: 'Department created successfully', department }, 201);
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  await department.update(req.body);
  sendSuccess(res, { message: 'Department updated successfully', department });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  await department.destroy();
  sendSuccess(res, { message: 'Department deleted successfully' });
});
