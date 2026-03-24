import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const avatarsDir = path.resolve('uploads', 'avatars');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    const finalBase = safeBaseName || 'avatar';
    cb(null, `${Date.now()}-${finalBase}${extension}`);
  },
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const imageFileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new ApiError(400, 'Only image files are allowed (jpeg, png, webp, gif)'));
    return;
  }

  cb(null, true);
};

export const avatarUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const avatarUploadMiddleware = (req, res, next) => {
  avatarUpload.single('image')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      next(new ApiError(400, 'Image size must be 5MB or less'));
      return;
    }

    next(new ApiError(400, error.message || 'Invalid image upload request'));
  });
};
