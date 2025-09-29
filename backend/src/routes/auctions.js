const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter, bidLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validation');
const {
  getActiveAuctions,
  getAuctionDetails,
  getUserAuctions,
  getUserBids,
  placeBid,
  restartAuction,
} = require('../services/auctionService');

const router = express.Router();

/**
 * @route   GET /api/auctions
 * @desc    Get active auctions
 * @access  Public
 */
router.get('/', [apiLimiter, validate], async (req, res) => {
  try {
    const result = await getActiveAuctions(req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/auctions/my-bids
 * @desc    Get user's bids
 * @access  Private
 */
router.get('/my-bids', [authenticateToken, validate], async (req, res) => {
  try {
    const result = await getUserBids(req.user.id, req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/auctions/my-auctions
 * @desc    Get user's auctions
 * @access  Private
 */
router.get(
  '/my-auctions',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      const result = await getUserAuctions(req.user.id, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/auctions/:id
 * @desc    Get auction details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const auction = await getAuctionDetails(req.params.id);
    res.json({
      success: true,
      data: auction,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Auction not found',
    });
  }
});

/**
 * @route   POST /api/auctions/:id/bid
 * @desc    Place a bid
 * @access  Private
 */
router.post(
  '/:id/bid',
  [authenticateToken, bidLimiter, validate],
  async (req, res) => {
    try {
      const { amount } = req.body;
      const bid = await placeBid(req.params.id, req.user.id, amount);
      res.status(201).json({
        success: true,
        data: bid,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/auctions/:id/restart
 * @desc    Restart an ended auction
 * @access  Private (Seller only)
 */
router.post(
  '/:id/restart',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      const { startTime, endTime } = req.body;
      const auction = await restartAuction(req.params.id, req.user.id, startTime, endTime);
      res.json({
        success: true,
        data: auction,
        message: 'Auction restarted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;
