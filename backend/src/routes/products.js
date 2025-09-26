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
  getWatchlist,
} = require('../controllers/productController');

const router = express.Router();

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
    validateJoi(createProductSchema),
    validate,
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
