import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), 'src', 'uploads');

// Ensure src/uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed extensions and mimetypes
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimetypeAllowed = ALLOWED_MIMETYPES.includes(mimetype);

  if (isExtensionAllowed && isMimetypeAllowed) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only image files (.jpg, .jpeg, .png, .webp, .gif) are allowed.');
    error.code = 'LIMIT_FILE_TYPES';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

/**
 * Middleware handling single photo upload under form field 'photo'.
 * Catches multer errors and converts them to HTTP 400 response.
 */
export function uploadPhoto(req, res, next) {
  const singleUpload = upload.single('photo');

  singleUpload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: { message: 'File size exceeds maximum limit of 5MB' } });
      }
      return res.status(400).json({ error: { message: err.message || 'File upload error' } });
    }
    next();
  });
}
