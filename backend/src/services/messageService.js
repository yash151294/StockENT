const { getPrismaClient } = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { sendMessageNotification } = require('./emailService');

const prisma = getPrismaClient();

/**
 * Create a new conversation (DEPRECATED - Use sendMessageWithConversation instead)
 * This function now creates conversation data structure but doesn't persist it until a message is sent
 * WARNING: This function should not be used directly as it can create empty conversations
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

    // DEPRECATED: This creates empty conversations - use sendMessageWithConversation instead
    logger.warn('DEPRECATED: createConversation called - this can create empty conversations. Use sendMessageWithConversation instead.');
    
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

    // Emit socket event for real-time updates
    const { getSocket } = require('../utils/socket');
    try {
      const io = getSocket();
      
      // Emit to both users' personal rooms
      io.to(`user:${buyerId}`).emit('conversation_created', conversation);
      io.to(`user:${sellerId}`).emit('conversation_created', conversation);
    } catch (socketError) {
      logger.error('Failed to emit socket events for conversation creation:', socketError);
      // Don't fail the conversation creation if socket emission fails
    }

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
 * Create or get conversation for messaging (lazy creation)
 * This function creates conversation only when first message is sent
 */
const createOrGetConversation = async (productId, buyerId, sellerId) => {
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
      return existingConversation;
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
    });

    logger.info(
      `Conversation created: ${conversation.id} for product: ${productId}`
    );
    return conversation;
  } catch (error) {
    logger.error('Create or get conversation error:', error);
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

    // Check if conversation is closed
    if (conversation.status === 'CLOSED') {
      throw new Error('Cannot send messages to a closed conversation');
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

    // Emit socket event for real-time updates
    const { getSocket } = require('../utils/socket');
    try {
      const io = getSocket();
      
      logger.info(`🔌 Emitting socket events for message: ${message.id} in conversation: ${conversationId}`);
      
      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('message_received', {
        ...message,
        conversationId,
        sender: {
          id: message.senderId,
          companyName: senderId === conversation.buyerId ? conversation.buyer.companyName : conversation.seller.companyName,
          country: senderId === conversation.buyerId ? conversation.buyer.country : conversation.seller.country,
        }
      });
      
      logger.info(`📡 Emitted 'message_received' to conversation:${conversationId}`);

      // Emit to other user's personal room for notifications
      const otherUserId = conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId;
      io.to(`user:${otherUserId}`).emit('new_message_notification', {
        conversationId,
        message: {
          ...message,
          sender: {
            id: message.senderId,
            companyName: senderId === conversation.buyerId ? conversation.buyer.companyName : conversation.seller.companyName,
          },
          // Include conversation data for role-based filtering
          conversation: {
            id: conversationId,
            buyerId: conversation.buyerId,
            sellerId: conversation.sellerId,
          }
        },
        product: conversation.product,
      });
      
      logger.info(`📡 Emitted 'new_message_notification' to user:${otherUserId}`);
    } catch (socketError) {
      logger.error('Failed to emit socket events for message:', socketError);
      // Don't fail the message sending if socket emission fails
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
 * Send a message with automatic conversation creation
 * This function creates conversation only when first message is sent
 */
const sendMessageWithConversation = async (
  productId,
  senderId,
  receiverId,
  content,
  messageType = 'TEXT',
  encryptionData = null
) => {
  try {
    // Create or get conversation
    const conversation = await createOrGetConversation(productId, senderId, receiverId);

    // Check if conversation is closed
    if (conversation.status === 'CLOSED') {
      throw new Error('Cannot send messages to a closed conversation');
    }

    // Determine actual receiver ID (swap if needed)
    const actualReceiverId = conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId;

    // Prepare message data
    const messageData = {
      conversationId: conversation.id,
      senderId,
      receiverId: actualReceiverId,
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
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // Get full conversation details for notifications
    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
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

    // Send email notification to the other party
    const recipient = actualReceiverId === fullConversation.buyerId ? fullConversation.buyer : fullConversation.seller;

    try {
      await sendMessageNotification(recipient.email, {
        product: fullConversation.product,
        sender: senderId === fullConversation.buyerId ? fullConversation.buyer : fullConversation.seller,
        content,
        conversationId: conversation.id,
      });
    } catch (emailError) {
      logger.error('Failed to send message notification email:', emailError);
    }

    // Emit socket event for real-time updates
    const { getSocket } = require('../utils/socket');
    try {
      const io = getSocket();
      
      logger.info(`🔌 Emitting socket events for message: ${message.id} in conversation: ${conversation.id}`);
      
      // Emit to conversation room
      io.to(`conversation:${conversation.id}`).emit('message_received', {
        ...message,
        conversationId: conversation.id,
        sender: {
          id: message.senderId,
          companyName: senderId === fullConversation.buyerId ? fullConversation.buyer.companyName : fullConversation.seller.companyName,
          country: senderId === fullConversation.buyerId ? fullConversation.buyer.country : fullConversation.seller.country,
        }
      });
      
      logger.info(`📡 Emitted 'message_received' to conversation:${conversation.id}`);

      // Emit to other user's personal room for notifications
      io.to(`user:${actualReceiverId}`).emit('new_message_notification', {
        conversationId: conversation.id,
        message: {
          ...message,
          sender: {
            id: message.senderId,
            companyName: senderId === fullConversation.buyerId ? fullConversation.buyer.companyName : fullConversation.seller.companyName,
          },
          // Include conversation data for role-based filtering
          conversation: {
            id: conversation.id,
            buyerId: fullConversation.buyerId,
            sellerId: fullConversation.sellerId,
          }
        },
        product: fullConversation.product,
      });
      
      logger.info(`📡 Emitted 'new_message_notification' to user:${actualReceiverId}`);
    } catch (socketError) {
      logger.error('Failed to emit socket events for message:', socketError);
      // Don't fail the message sending if socket emission fails
    }

    logger.info(
      `Message sent: ${message.id} in conversation: ${conversation.id}`
    );
    return message;
  } catch (error) {
    logger.error('Send message with conversation error:', error);
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
        orderBy: { createdAt: 'desc' },
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
    const { page = 1, limit = 20, status, search, userRole } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Role-based filtering: 
    // - For BUYER: show conversations they initiated (buyerId = userId)
    // - For SELLER: show conversations initiated by others (sellerId = userId)
    let where;
    if (userRole === 'SELLER') {
      // Sellers see conversations where they are the seller (initiated by buyers)
      where = {
        sellerId: userId,
      };
    } else {
      // Buyers see conversations where they are the buyer (initiated by them)
      where = {
        buyerId: userId,
      };
    }

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

    // Get unread message counts for each conversation
    const conversationIds = conversations.map(conv => conv.id);
    
    let unreadCounts = [];
    if (conversationIds.length > 0) {
      unreadCounts = await prisma.message.groupBy({
        by: ['conversationId'],
        where: {
          conversationId: { in: conversationIds },
          senderId: { not: userId },
          readAt: null,
        },
        _count: {
          id: true,
        },
      });
    }

    // Create a map of conversationId -> unread count
    const unreadCountMap = {};
    unreadCounts.forEach(item => {
      unreadCountMap[item.conversationId] = item._count.id;
    });

    // Add unread count to each conversation
    const conversationsWithUnreadCount = conversations.map(conversation => ({
      ...conversation,
      unreadCount: unreadCountMap[conversation.id] || 0,
    }));

    return {
      conversations: conversationsWithUnreadCount,
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
        readAt: null,
      },
      data: {
        readAt: new Date(),
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
const getUnreadMessageCount = async (userId, userRole = 'BUYER') => {
  try {
    // Role-based filtering for unread message count:
    // - For SELLER: count unread messages in conversations about their own products (initiated by buyers)
    // - For BUYER: count unread messages in conversations they initiated
    let roleFilter;
    if (userRole === 'SELLER') {
      // Sellers count unread messages for conversations about their own products (initiated by buyers)
      roleFilter = { sellerId: userId };
    } else {
      // Buyers count unread messages for conversations they initiated
      roleFilter = { buyerId: userId };
    }

    const count = await prisma.message.count({
      where: {
        conversation: {
          ...roleFilter,
        },
        senderId: { not: userId },
        readAt: null,
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
    const { page = 1, limit = 20, status, userRole } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Role-based filtering: 
    // - For BUYER: show conversations they initiated (buyerId = userId)
    // - For SELLER: show conversations initiated by others (sellerId = userId)
    let roleFilter;
    if (userRole === 'SELLER') {
      // Sellers see conversations where they are the seller (initiated by buyers)
      roleFilter = { sellerId: userId };
    } else {
      // Buyers see conversations where they are the buyer (initiated by them)
      roleFilter = { buyerId: userId };
    }

    const where = {
      ...roleFilter,
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
 * Close conversation
 */
const closeConversation = async (conversationId, userId) => {
  try {
    console.log('🔍 Checking conversation access:', { conversationId, userId });
    
    // Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    console.log('🔍 Conversation found:', conversation ? 'Yes' : 'No');
    
    if (!conversation) {
      console.log('❌ Conversation not found or access denied');
      throw new Error('Conversation not found or access denied');
    }

    console.log('🔄 Updating conversation status to CLOSED...');
    
    // Update conversation status to CLOSED
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        status: 'CLOSED',
        updatedAt: new Date()
      },
    });

    console.log('✅ Conversation updated:', updatedConversation);
    logger.info(`Conversation closed: ${conversationId} by user: ${userId}`);
    return updatedConversation;
  } catch (error) {
    console.error('❌ Close conversation service error:', error);
    logger.error('Close conversation error:', error);
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

    const conversationId = message.conversationId;

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    // Check if conversation is now empty and clean it up
    await cleanupConversationIfEmpty(conversationId);

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

/**
 * Clean up empty conversations (conversations with no messages)
 */
const cleanupEmptyConversations = async () => {
  try {
    // Find conversations with no messages
    const emptyConversations = await prisma.conversation.findMany({
      where: {
        messages: {
          none: {}
        }
      },
      include: {
        _count: {
          select: {
            messages: true,
            keyExchanges: true
          }
        }
      }
    });

    if (emptyConversations.length === 0) {
      logger.info('No empty conversations found');
      return { deletedCount: 0 };
    }

    logger.info(`Found ${emptyConversations.length} empty conversations to clean up`);

    // Delete key exchanges first (if any)
    for (const conversation of emptyConversations) {
      if (conversation._count.keyExchanges > 0) {
        await prisma.keyExchange.deleteMany({
          where: { conversationId: conversation.id }
        });
      }
    }

    // Delete empty conversations
    const result = await prisma.conversation.deleteMany({
      where: {
        id: {
          in: emptyConversations.map(c => c.id)
        }
      }
    });

    logger.info(`Cleaned up ${result.count} empty conversations`);
    return { deletedCount: result.count };
  } catch (error) {
    logger.error('Cleanup empty conversations error:', error);
    throw error;
  }
};

/**
 * Clean up old empty conversations (older than 24 hours)
 */
const cleanupOldEmptyConversations = async () => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Find old empty conversations
    const oldEmptyConversations = await prisma.conversation.findMany({
      where: {
        messages: {
          none: {}
        },
        createdAt: {
          lt: oneDayAgo
        }
      },
      include: {
        _count: {
          select: {
            messages: true,
            keyExchanges: true
          }
        }
      }
    });

    if (oldEmptyConversations.length === 0) {
      logger.info('No old empty conversations found');
      return { deletedCount: 0 };
    }

    logger.info(`Found ${oldEmptyConversations.length} old empty conversations to clean up`);

    // Delete key exchanges first (if any)
    for (const conversation of oldEmptyConversations) {
      if (conversation._count.keyExchanges > 0) {
        await prisma.keyExchange.deleteMany({
          where: { conversationId: conversation.id }
        });
      }
    }

    // Delete old empty conversations
    const result = await prisma.conversation.deleteMany({
      where: {
        id: {
          in: oldEmptyConversations.map(c => c.id)
        }
      }
    });

    logger.info(`Cleaned up ${result.count} old empty conversations`);
    return { deletedCount: result.count };
  } catch (error) {
    logger.error('Cleanup old empty conversations error:', error);
    throw error;
  }
};

/**
 * Clean up empty conversations for a specific conversation after message operations
 */
const cleanupConversationIfEmpty = async (conversationId) => {
  try {
    // Check if conversation has any messages
    const messageCount = await prisma.message.count({
      where: { conversationId }
    });

    if (messageCount === 0) {
      // Delete key exchanges first
      await prisma.keyExchange.deleteMany({
        where: { conversationId }
      });

      // Delete the empty conversation
      await prisma.conversation.delete({
        where: { id: conversationId }
      });

      logger.info(`Cleaned up empty conversation: ${conversationId}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Cleanup conversation if empty error:', error);
    throw error;
  }
};

/**
 * Clean up conversations that were created but never received messages
 * This runs periodically to clean up conversations that users started but never sent messages to
 */
const cleanupAbandonedConversations = async () => {
  try {
    // Find conversations created more than 1 hour ago with no messages
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const abandonedConversations = await prisma.conversation.findMany({
      where: {
        messages: {
          none: {}
        },
        createdAt: {
          lt: oneHourAgo
        }
      },
      include: {
        _count: {
          select: {
            messages: true,
            keyExchanges: true
          }
        }
      }
    });

    if (abandonedConversations.length === 0) {
      logger.info('No abandoned conversations found');
      return { deletedCount: 0 };
    }

    logger.info(`Found ${abandonedConversations.length} abandoned conversations to clean up`);

    // Delete key exchanges first (if any)
    for (const conversation of abandonedConversations) {
      if (conversation._count.keyExchanges > 0) {
        await prisma.keyExchange.deleteMany({
          where: { conversationId: conversation.id }
        });
      }
    }

    // Delete abandoned conversations
    const result = await prisma.conversation.deleteMany({
      where: {
        id: {
          in: abandonedConversations.map(c => c.id)
        }
      }
    });

    logger.info(`Cleaned up ${result.count} abandoned conversations`);
    return { deletedCount: result.count };
  } catch (error) {
    logger.error('Cleanup abandoned conversations error:', error);
    throw error;
  }
};

module.exports = {
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
  cleanupEmptyConversations,
  cleanupOldEmptyConversations,
  cleanupConversationIfEmpty,
  cleanupAbandonedConversations,
};
