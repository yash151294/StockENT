const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
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
    } else if (file.fieldname === 'profilePicture' || file.fieldname === 'avatar') {
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
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 4, // Maximum 4 files for product images
  },
});

// Product images upload middleware
const uploadProductImages = upload.array('productImages', 4);

// Profile picture upload middleware
const uploadProfilePicture = upload.single('profilePicture');

// Avatar upload middleware
const uploadAvatar = upload.single('avatar');

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
const optimizeImage = async (filePath, options = {}) => {
  try {
    const { 
      maxWidth = 1920, 
      maxHeight = 1080, 
      quality = 85,
      maxFileSize = 2 * 1024 * 1024 // 2MB max file size
    } = options;

    // Get file stats to check if compression is needed
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // If file is already small enough, return original
    if (fileSize <= maxFileSize) {
      logger.info(`Image ${filePath} is already optimized (${fileSize} bytes)`);
      return filePath;
    }

    // Create optimized file path
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    const optimizedPath = path.join(dir, `${name}_optimized${ext}`);

    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    
    // Calculate new dimensions if needed
    let { width, height } = metadata;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Optimize image
    await sharp(filePath)
      .resize(width, height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality,
        progressive: true,
        mozjpeg: true
      })
      .png({ 
        quality,
        progressive: true,
        compressionLevel: 9
      })
      .webp({ 
        quality,
        effort: 6
      })
      .toFile(optimizedPath);

    // Replace original with optimized version
    fs.unlinkSync(filePath);
    fs.renameSync(optimizedPath, filePath);

    const newStats = fs.statSync(filePath);
    const compressionRatio = ((fileSize - newStats.size) / fileSize * 100).toFixed(2);
    
    logger.info(`Image optimized: ${filePath} - ${fileSize} -> ${newStats.size} bytes (${compressionRatio}% reduction)`);
    
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
const generateImageUrl = (filePath, baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`) => {
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

// Process multiple product images with compression
const processProductImages = async (files) => {
  try {
    if (!files || files.length === 0) {
      return [];
    }

    // Limit to 4 images maximum
    const limitedFiles = files.slice(0, 4);
    const processedImages = [];

    for (let i = 0; i < limitedFiles.length; i++) {
      const file = limitedFiles[i];
      
      try {
        // Optimize the image
        const optimizedPath = await optimizeImage(file.path, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
          maxFileSize: 2 * 1024 * 1024 // 2MB
        });

        // Generate image URL
        const imageUrl = generateImageUrl(optimizedPath);
        
        processedImages.push({
          imageUrl,
          alt: file.originalname,
          isPrimary: i === 0, // First image is primary
          orderIndex: i,
          originalName: file.originalname,
          filePath: optimizedPath
        });

        logger.info(`Processed image ${i + 1}/${limitedFiles.length}: ${file.originalname}`);
      } catch (error) {
        logger.error(`Failed to process image ${file.originalname}:`, error);
        // Continue with other images even if one fails
      }
    }

    return processedImages;
  } catch (error) {
    logger.error('Process product images error:', error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadProductImages,
  uploadProfilePicture,
  uploadAvatar,
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  optimizeImage,
  cleanupTempFiles,
  validateImageDimensions,
  generateImageUrl,
  deleteFile,
  processProductImages,
};
