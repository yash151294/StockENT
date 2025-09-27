const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  uploadProductImages,
  handleUploadError,
} = require('../middleware/upload');
const { apiLimiter } = require('../middleware/rateLimiter');
const { validate, validateJoi } = require('../middleware/validation');
const {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
  addToWatchlistSchema,
  getUserProductsSchema,
  getWatchlistSchema,
} = require('../validators/productValidators');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  addToWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
  getWatchlist,
} = require('../controllers/productController');

const router = express.Router();

/**
 * @route   GET /api/products/tags
 * @desc    Get all unique tags from products
 * @access  Public
 */
router.get('/tags', [apiLimiter], async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { logger } = require('../utils/logger');

    // Get all unique tags from active products
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { tags: true },
    });

    // Extract and count all tags
    const tagCounts = {};
    products.forEach((product) => {
      product.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by count and return
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      data: sortedTags,
    });
  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/products/specifications
 * @desc    Get all unique specification keys from products
 * @access  Public
 */
router.get('/specifications', [apiLimiter], async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { logger } = require('../utils/logger');

    // Get all specifications from active products
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { 
        specifications: {
          select: {
            specName: true
          }
        }
      },
    });

    // Extract and count all specification keys
    const specKeyCounts = {};
    products.forEach((product) => {
      if (product.specifications && Array.isArray(product.specifications)) {
        product.specifications.forEach((spec) => {
          if (spec.specName) {
            specKeyCounts[spec.specName] = (specKeyCounts[spec.specName] || 0) + 1;
          }
        });
      }
    });

    // Sort by count and return
    const sortedSpecKeys = Object.entries(specKeyCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([key, count]) => ({ key, count }));

    res.json({
      success: true,
      data: sortedSpecKeys,
    });
  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Get specifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering
 * @access  Public
 */
router.get('/', [apiLimiter, validateJoi(getProductsSchema)], getProducts);

/**
 * @route   GET /api/products/my-products
 * @desc    Get user's products
 * @access  Private
 */
router.get(
  '/my-products',
  [authenticateToken, validateJoi(getUserProductsSchema)],
  getUserProducts
);

/**
 * @route   GET /api/products/watchlist
 * @desc    Get user's watchlist
 * @access  Private
 */
router.get(
  '/watchlist',
  [authenticateToken, validateJoi(getWatchlistSchema)],
  getWatchlist
);

/**
 * @route   POST /api/products/watchlist
 * @desc    Add product to watchlist
 * @access  Private
 */
router.post(
  '/watchlist',
  [authenticateToken, validateJoi(addToWatchlistSchema)],
  addToWatchlist
);

/**
 * @route   DELETE /api/products/watchlist/:productId
 * @desc    Remove product from watchlist
 * @access  Private
 */
router.delete('/watchlist/:productId', authenticateToken, removeFromWatchlist);

/**
 * @route   POST /api/products/watchlist/toggle
 * @desc    Toggle product in watchlist (add if not present, remove if present)
 * @access  Private
 */
router.post(
  '/watchlist/toggle',
  [authenticateToken, validateJoi(addToWatchlistSchema)],
  toggleWatchlist
);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product
 * @access  Public
 */
router.get('/:id', getProduct);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Seller)
 */
router.post(
  '/',
  [
    authenticateToken,
    uploadProductImages,
    handleUploadError,
  ],
  createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Seller)
 */
router.put(
  '/:id',
  [authenticateToken, validateJoi(updateProductSchema)],
  updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Seller)
 */
router.delete('/:id', authenticateToken, deleteProduct);

module.exports = router;
