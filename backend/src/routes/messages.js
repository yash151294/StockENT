const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validation');

const prisma = new PrismaClient();
const {
  createConversation,
  createOrGetConversation,
  sendMessage,
  sendMessageWithConversation,
  getConversationMessages,
  getUserConversations,
  getConversation,
  markMessagesAsRead,
  updateConversationStatus,
  getUnreadMessageCount,
  searchConversations,
  closeConversation,
  deleteMessage,
  createKeyExchange,
  processKeyExchange,
  getPendingKeyExchanges,
  getConversationEncryptionStatus,
} = require('../services/messageService');

const router = express.Router();

/**
 * @route   POST /api/messages/conversations
 * @desc    Get existing conversation or return error (DEPRECATED - Use /send endpoint)
 * @access  Private
 */
router.post(
  '/conversations',
  [authenticateToken],
  async (req, res) => {
    try {
      const { productId, sellerId } = req.body;
      
      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          productId,
          buyerId: req.user.id,
          sellerId,
        },
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  companyName: true,
                  country: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              images: {
                where: { isPrimary: true },
                select: {
                  id: true,
                  imageUrl: true,
                  alt: true,
                },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              companyName: true,
              country: true,
            },
          },
          seller: {
            select: {
              id: true,
              companyName: true,
              country: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      if (existingConversation) {
        return res.status(200).json({
          success: true,
          data: existingConversation,
        });
      }

      // DEPRECATED: Don't create empty conversations
      return res.status(410).json({
        success: false,
        error: 'This endpoint is deprecated. Use POST /api/messages/send to create conversations when sending messages.',
        message: 'To prevent empty conversations, please use the /send endpoint when you have a message to send.',
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
  [authenticateToken, messageLimiter],
  async (req, res) => {
    try {
      const { content, messageType = 'TEXT' } = req.body;
      
      // Check if conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: { id: req.params.id }
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found. Please start a new conversation.',
        });
      }

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
 * @route   POST /api/messages/send
 * @desc    Send message with automatic conversation creation (RECOMMENDED)
 * @access  Private
 */
router.post(
  '/send',
  [authenticateToken, messageLimiter],
  async (req, res) => {
    try {
      const { productId, receiverId, content, messageType = 'TEXT' } = req.body;
      
      if (!productId || !receiverId || !content) {
        return res.status(400).json({
          success: false,
          error: 'productId, receiverId, and content are required',
        });
      }

      // Validate that content is not empty
      if (content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message content cannot be empty',
        });
      }

      const message = await sendMessageWithConversation(
        productId,
        req.user.id,
        receiverId,
        content,
        messageType
      );
      
      res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent and conversation created successfully',
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
  [authenticateToken],
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
  [authenticateToken],
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
  [authenticateToken],
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
  [authenticateToken],
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
  [authenticateToken],
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
router.get('/unread-count', [authenticateToken], async (req, res) => {
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
 * @route   GET /api/messages/unread-notifications
 * @desc    Get unread messages for notifications
 * @access  Private
 */
router.get('/unread-notifications', [authenticateToken], async (req, res) => {
  try {
    const { limit = 20, since } = req.query;
    const userId = req.user.id;
    
    // Default to last 24 hours if no 'since' parameter is provided
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversation: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        },
        readAt: null, // Unread messages have null readAt
        senderId: { not: userId }, // Exclude messages sent by the current user
        createdAt: { gte: sinceDate } // Only messages since the specified date
      },
      include: {
        sender: {
          select: {
            id: true,
            companyName: true,
            profileImageUrl: true
          }
        },
        conversation: {
          include: {
            product: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Transform messages into notification format
    const notifications = unreadMessages.map(message => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        companyName: message.sender.companyName,
        profileImageUrl: message.sender.profileImageUrl
      },
      content: message.content,
      product: message.conversation.product,
      createdAt: message.createdAt
    }));

    res.json({
      success: true,
      data: notifications,
      meta: {
        total: notifications.length,
        since: sinceDate.toISOString(),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   POST /api/messages/mark-notifications-viewed
 * @desc    Mark that user has viewed their notifications (for tracking purposes)
 * @access  Private
 */
router.post('/mark-notifications-viewed', [authenticateToken], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Update user's last notification check time (could be stored in user profile or separate table)
    // For now, we'll just log it - this could be enhanced to track in database
    console.log(`User ${userId} viewed notifications at ${new Date().toISOString()}`);
    
    res.json({
      success: true,
      message: 'Notifications marked as viewed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking notifications as viewed:', error);
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
router.get('/search', [authenticateToken], async (req, res) => {
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
 * @route   PUT /api/messages/conversations/:id/close
 * @desc    Close conversation
 * @access  Private
 */
router.put(
  '/conversations/:id/close',
  [authenticateToken],
  async (req, res) => {
    try {
      console.log('🔒 Close conversation request:', {
        conversationId: req.params.id,
        userId: req.user.id,
        userEmail: req.user.email
      });
      
      const result = await closeConversation(req.params.id, req.user.id);
      
      console.log('✅ Conversation closed successfully:', result);
      
      res.json({
        success: true,
        message: 'Conversation closed successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Close conversation error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/messages/conversations/:conversationId/messages/:messageId
 * @desc    Delete individual message
 * @access  Private
 */
router.delete(
  '/conversations/:conversationId/messages/:messageId',
  [authenticateToken],
  async (req, res) => {
    try {
      await deleteMessage(req.params.messageId, req.user.id);
      res.json({
        success: true,
        message: 'Message deleted successfully',
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
 * @route   POST /api/messages/key-exchange
 * @desc    Create key exchange request
 * @access  Private
 */
router.post(
  '/key-exchange',
  [authenticateToken, messageLimiter],
  async (req, res) => {
    try {
      const { conversationId, toUserId, encryptedAESKey, keyId, publicKey } = req.body;
      const keyExchange = await createKeyExchange(
        conversationId,
        req.user.id,
        toUserId,
        encryptedAESKey,
        keyId,
        publicKey
      );
      res.status(201).json({
        success: true,
        data: keyExchange,
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
 * @route   PUT /api/messages/key-exchange/:id/process
 * @desc    Process key exchange
 * @access  Private
 */
router.put(
  '/key-exchange/:id/process',
  [authenticateToken, messageLimiter],
  async (req, res) => {
    try {
      const { status = 'PROCESSED' } = req.body;
      const keyExchange = await processKeyExchange(req.params.id, status);
      res.json({
        success: true,
        data: keyExchange,
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
 * @route   GET /api/messages/key-exchange/pending
 * @desc    Get pending key exchanges
 * @access  Private
 */
router.get(
  '/key-exchange/pending',
  [authenticateToken],
  async (req, res) => {
    try {
      const keyExchanges = await getPendingKeyExchanges(req.user.id);
      res.json({
        success: true,
        data: keyExchanges,
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
 * @route   GET /api/messages/conversations/:id/encryption-status
 * @desc    Get conversation encryption status
 * @access  Private
 */
router.get(
  '/conversations/:id/encryption-status',
  [authenticateToken],
  async (req, res) => {
    try {
      const status = await getConversationEncryptionStatus(req.params.id);
      res.json({
        success: true,
        data: status,
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
