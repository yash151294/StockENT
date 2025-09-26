const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validation');
const {
  createConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations,
  getConversation,
  markMessagesAsRead,
  updateConversationStatus,
  getUnreadMessageCount,
  searchConversations,
  deleteConversation,
} = require('../services/messageService');

const router = express.Router();

/**
 * @route   POST /api/messages/conversations
 * @desc    Create new conversation
 * @access  Private
 */
router.post(
  '/conversations',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      const { productId, sellerId } = req.body;
      const conversation = await createConversation(
        productId,
        req.user.id,
        sellerId
      );
      res.status(201).json({
        success: true,
        data: conversation,
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
 * @route   POST /api/messages/conversations/:id/messages
 * @desc    Send message
 * @access  Private
 */
router.post(
  '/conversations/:id/messages',
  [authenticateToken, messageLimiter, validate],
  async (req, res) => {
    try {
      const { content, messageType = 'TEXT' } = req.body;
      const message = await sendMessage(
        req.params.id,
        req.user.id,
        content,
        messageType
      );
      res.status(201).json({
        success: true,
        data: message,
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
 * @route   GET /api/messages/conversations/:id/messages
 * @desc    Get conversation messages
 * @access  Private
 */
router.get(
  '/conversations/:id/messages',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const result = await getConversationMessages(
        req.params.id,
        req.user.id,
        page,
        limit
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get(
  '/conversations',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      const result = await getUserConversations(req.user.id, req.query);
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
 * @route   GET /api/messages/conversations/:id
 * @desc    Get single conversation
 * @access  Private
 */
router.get(
  '/conversations/:id',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      const conversation = await getConversation(req.params.id, req.user.id);
      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   PUT /api/messages/conversations/:id/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put(
  '/conversations/:id/read',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      await markMessagesAsRead(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Messages marked as read',
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
 * @route   PUT /api/messages/conversations/:id/status
 * @desc    Update conversation status
 * @access  Private
 */
router.put(
  '/conversations/:id/status',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      const { status } = req.body;
      const conversation = await updateConversationStatus(
        req.params.id,
        req.user.id,
        status
      );
      res.json({
        success: true,
        data: conversation,
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
 * @route   GET /api/messages/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread-count', [authenticateToken, validate], async (req, res) => {
  try {
    const count = await getUnreadMessageCount(req.user.id);
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/messages/search
 * @desc    Search conversations
 * @access  Private
 */
router.get('/search', [authenticateToken, validate], async (req, res) => {
  try {
    const { q, ...filters } = req.query;
    const result = await searchConversations(req.user.id, q, filters);
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
 * @route   DELETE /api/messages/conversations/:id
 * @desc    Delete conversation
 * @access  Private
 */
router.delete(
  '/conversations/:id',
  [authenticateToken, validate],
  async (req, res) => {
    try {
      await deleteConversation(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Conversation deleted successfully',
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
