const express = require('express');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const searchRoutes = require('./search');
const userRoutes = require('./users');
const auctionRoutes = require('./auctions');
const messageRoutes = require('./messages');
const adminRoutes = require('./admin');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'StockENT API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/search', searchRoutes);
router.use('/users', userRoutes);
router.use('/auctions', auctionRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
