const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const { sendMessageNotification } = require('./emailService');

const prisma = new PrismaClient();

/**
 * Create a new conversation
 */
const createConversation = async (productId, buyerId, sellerId) => {
  try {
    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        productId,
        buyerId,
        sellerId,
      },
    });

    if (existingConversation) {
      // Return existing conversation with full details
      const fullConversation = await prisma.conversation.findUnique({
        where: { id: existingConversation.id },
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
      return fullConversation;
    }

    // Get buyer and seller information for aliases
    const [buyer, seller] = await Promise.all([
      prisma.user.findUnique({
        where: { id: buyerId },
        select: { companyName: true, contactPerson: true }
      }),
      prisma.user.findUnique({
        where: { id: sellerId },
        select: { companyName: true, contactPerson: true }
      })
    ]);

    // Ensure we have valid aliases
    const buyerAlias = buyer?.companyName || buyer?.contactPerson || 'Buyer';
    const sellerAlias = seller?.companyName || seller?.contactPerson || 'Seller';

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        productId,
        buyerId,
        sellerId,
        buyerAlias,
        sellerAlias,
        status: 'ACTIVE',
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

    logger.info(
      `Conversation created: ${conversation.id} for product: ${productId}`
    );
    return conversation;
  } catch (error) {
    logger.error('Create conversation error:', error);
    throw error;
  }
};

/**
 * Send a message
 */
const sendMessage = async (
  conversationId,
  senderId,
  content,
  messageType = 'TEXT',
  encryptionData = null
) => {
  try {
    // Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ buyerId: senderId }, { sellerId: senderId }],
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
        buyer: true,
        seller: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Determine receiver ID
    const receiverId = conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId;

    // Prepare message data
    const messageData = {
      conversationId,
      senderId,
      receiverId,
      content,
      messageType,
    };

    // Add encryption fields if provided
    if (encryptionData) {
      messageData.isEncrypted = true;
      messageData.encryptedContent = encryptionData.encryptedContent;
      messageData.encryptionKeyId = encryptionData.keyId;
      messageData.iv = encryptionData.iv;
      messageData.tag = encryptionData.tag;
      messageData.keyExchangeId = encryptionData.keyExchangeId;
    }

    // Create message
    const message = await prisma.message.create({
      data: messageData,
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
      },
    });

    // Send email notification to the other party
    const recipient =
      senderId === conversation.buyerId
        ? conversation.seller
        : conversation.buyer;

    try {
      await sendMessageNotification(recipient.email, {
        product: conversation.product,
        sender:
          senderId === conversation.buyerId
            ? conversation.buyer
            : conversation.seller,
        content,
        conversationId,
      });
    } catch (emailError) {
      logger.error('Failed to send message notification email:', emailError);
    }

    logger.info(
      `Message sent: ${message.id} in conversation: ${conversationId}`
    );
    return message;
  } catch (error) {
    logger.error('Send message error:', error);
    throw error;
  }
};

/**
 * Get conversation messages
 */
const getConversationMessages = async (
  conversationId,
  userId,
  page = 1,
  limit = 50
) => {
  try {
    // Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              companyName: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.message.count({
        where: { conversationId },
      }),
    ]);

    return {
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Get conversation messages error:', error);
    throw error;
  }
};

/**
 * Get user's conversations
 */
const getUserConversations = async (userId, filters = {}) => {
  try {
    const { page = 1, limit = 20, status, search } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.product = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
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
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Get user conversations error:', error);
    throw error;
  }
};

/**
 * Get single conversation
 */
const getConversation = async (conversationId, userId) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                companyName: true,
                country: true,
                verificationStatus: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            images: {
              select: {
                id: true,
                imageUrl: true,
                alt: true,
                isPrimary: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            companyName: true,
            country: true,
            verificationStatus: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
            country: true,
            verificationStatus: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                companyName: true,
                country: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    return conversation;
  } catch (error) {
    logger.error('Get conversation error:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
const markMessagesAsRead = async (conversationId, userId) => {
  try {
    // Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Mark all unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: 'SENT',
      },
      data: {
        status: 'READ',
      },
    });

    logger.info(
      `Messages marked as read in conversation: ${conversationId} by user: ${userId}`
    );
  } catch (error) {
    logger.error('Mark messages as read error:', error);
    throw error;
  }
};

/**
 * Update conversation status
 */
const updateConversationStatus = async (conversationId, userId, status) => {
  try {
    // Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Update conversation status
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });

    logger.info(
      `Conversation status updated: ${conversationId} to ${status} by user: ${userId}`
    );
    return updatedConversation;
  } catch (error) {
    logger.error('Update conversation status error:', error);
    throw error;
  }
};

/**
 * Get unread message count for user
 */
const getUnreadMessageCount = async (userId) => {
  try {
    const count = await prisma.message.count({
      where: {
        conversation: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        senderId: { not: userId },
        status: 'SENT',
      },
    });

    return count;
  } catch (error) {
    logger.error('Get unread message count error:', error);
    throw error;
  }
};

/**
 * Search conversations
 */
const searchConversations = async (userId, searchTerm, filters = {}) => {
  try {
    const { page = 1, limit = 20, status } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      AND: [
        {
          OR: [
            {
              product: {
                OR: [
                  { title: { contains: searchTerm, mode: 'insensitive' } },
                  {
                    description: { contains: searchTerm, mode: 'insensitive' },
                  },
                ],
              },
            },
            {
              buyer: {
                companyName: { contains: searchTerm, mode: 'insensitive' },
              },
            },
            {
              seller: {
                companyName: { contains: searchTerm, mode: 'insensitive' },
              },
            },
            {
              messages: {
                some: {
                  content: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
          ],
        },
      ],
    };

    if (status) {
      where.status = status;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
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
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Search conversations error:', error);
    throw error;
  }
};

/**
 * Delete conversation
 */
const deleteConversation = async (conversationId, userId) => {
  try {
    // Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Delete conversation (cascade will handle messages)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    logger.info(`Conversation deleted: ${conversationId} by user: ${userId}`);
  } catch (error) {
    logger.error('Delete conversation error:', error);
    throw error;
  }
};

/**
 * Delete individual message
 */
const deleteMessage = async (messageId, userId) => {
  try {
    // Verify message exists and user is the sender or receiver
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new Error('Message not found or access denied');
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    logger.info(`Message deleted: ${messageId} by user: ${userId}`);
    return message;
  } catch (error) {
    logger.error('Delete message error:', error);
    throw error;
  }
};

/**
 * Create key exchange request
 */
const createKeyExchange = async (
  conversationId,
  fromUserId,
  toUserId,
  encryptedAESKey,
  keyId,
  publicKey
) => {
  try {
    const keyExchange = await prisma.keyExchange.create({
      data: {
        conversationId,
        fromUserId,
        toUserId,
        encryptedAESKey,
        keyId,
        publicKey,
        status: 'PENDING',
      },
    });

    logger.info(`Key exchange created: ${keyExchange.id} for conversation: ${conversationId}`);
    return keyExchange;
  } catch (error) {
    logger.error('Create key exchange error:', error);
    throw error;
  }
};

/**
 * Process key exchange
 */
const processKeyExchange = async (keyExchangeId, status = 'PROCESSED') => {
  try {
    const keyExchange = await prisma.keyExchange.update({
      where: { id: keyExchangeId },
      data: {
        status,
        processedAt: new Date(),
      },
    });

    logger.info(`Key exchange processed: ${keyExchangeId} with status: ${status}`);
    return keyExchange;
  } catch (error) {
    logger.error('Process key exchange error:', error);
    throw error;
  }
};

/**
 * Get pending key exchanges for user
 */
const getPendingKeyExchanges = async (userId) => {
  try {
    const keyExchanges = await prisma.keyExchange.findMany({
      where: {
        toUserId: userId,
        status: 'PENDING',
      },
      include: {
        fromUser: {
          select: {
            id: true,
            companyName: true,
            email: true,
          },
        },
        conversation: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return keyExchanges;
  } catch (error) {
    logger.error('Get pending key exchanges error:', error);
    throw error;
  }
};

/**
 * Get conversation encryption status
 */
const getConversationEncryptionStatus = async (conversationId) => {
  try {
    const keyExchange = await prisma.keyExchange.findFirst({
      where: {
        conversationId,
        status: 'PROCESSED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      isEncrypted: !!keyExchange,
      keyId: keyExchange?.keyId,
      lastExchange: keyExchange?.createdAt,
    };
  } catch (error) {
    logger.error('Get conversation encryption status error:', error);
    throw error;
  }
};

module.exports = {
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
  deleteMessage,
  createKeyExchange,
  processKeyExchange,
  getPendingKeyExchanges,
  getConversationEncryptionStatus,
};
