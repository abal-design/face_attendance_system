import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findByPk(payload.sub);

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid authentication token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, 'Invalid authentication token');
  }
});
