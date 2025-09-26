const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = ['uploads', 'uploads/products', 'uploads/users', 'uploads/temp'];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize upload directories
ensureUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp';

    if (file.fieldname === 'productImages') {
      uploadPath = 'uploads/products';
    } else if (file.fieldname === 'profilePicture') {
      uploadPath = 'uploads/users';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;

    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
  },
});

// Product images upload middleware
const uploadProductImages = upload.array('productImages', 10);

// Profile picture upload middleware
const uploadProfilePicture = upload.single('profilePicture');

// Single file upload middleware
const uploadSingle = upload.single('file');

// Multiple files upload middleware
const uploadMultiple = upload.array('files', 10);

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.',
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 10 files.',
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name.',
      });
    }

    logger.error('Multer error:', error);
    return res.status(400).json({
      success: false,
      error: 'File upload error.',
    });
  }

  if (
    error.message ===
    'Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'
  ) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  logger.error('Upload error:', error);
  next(error);
};

// Image optimization function
const optimizeImage = async (filePath, _options = {}) => {
  try {
    // This would typically use a library like sharp or jimp
    // For now, we'll just return the original path
    // In production, you'd want to:
    // 1. Resize the image to different sizes
    // 2. Compress the image
    // 3. Generate thumbnails
    // 4. Convert to WebP format

    // Destructure options for future use
    // const { width = 800, height = 600, quality = 80 } = options;

    // Placeholder for image optimization
    // const sharp = require('sharp');
    // await sharp(filePath)
    //   .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    //   .jpeg({ quality })
    //   .toFile(optimizedPath);

    return filePath;
  } catch (error) {
    logger.error('Image optimization error:', error);
    throw error;
  }
};

// Clean up temporary files
const cleanupTempFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up temporary file: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Failed to cleanup file: ${filePath}`, error);
    }
  });
};

// Validate image dimensions
const validateImageDimensions = (
  filePath,
  _minWidth = 100,
  _minHeight = 100
) => {
  return new Promise((resolve, _reject) => {
    // This would typically use a library like sharp or jimp
    // For now, we'll just resolve as valid
    // In production, you'd want to:
    // 1. Check image dimensions
    // 2. Validate aspect ratio
    // 3. Check for corrupted images

    resolve(true);
  });
};

// Generate image URLs
const generateImageUrl = (filePath, baseUrl = process.env.BASE_URL) => {
  if (!filePath) return null;

  // Remove uploads/ prefix and replace with proper URL
  const relativePath = filePath.replace(/^uploads\//, '');
  return `${baseUrl}/uploads/${relativePath}`;
};

// Delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath}`, error);
    return false;
  }
};

module.exports = {
  uploadProductImages,
  uploadProfilePicture,
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  optimizeImage,
  cleanupTempFiles,
  validateImageDimensions,
  generateImageUrl,
  deleteFile,
};
