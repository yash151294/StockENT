const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('./logger');

const prisma = new PrismaClient();

/**
 * Socket.IO server instance
 */
let io = null;

/**
 * Initialize Socket.IO server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Try to get token from cookies first, then from auth/headers
      let token = null;

      // Check cookies first (for cookie-based authentication)
      if (socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie
          .split(';')
          .reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          }, {});
        token = cookies.accessToken;
      }

      // Fallback to auth token or Authorization header
      if (!token) {
        token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          companyName: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.email} (${socket.id})`);

    // Join user to their personal room
    socket.join(`user:${socket.user.id}`);

    // Join user to role-based rooms
    socket.join(`role:${socket.user.role}`);

    // Handle joining product rooms
    socket.on('join_product', (productId) => {
      socket.join(`product:${productId}`);
      logger.info(
        `User ${socket.user.email} joined product room: ${productId}`
      );
    });

    // Handle leaving product rooms
    socket.on('leave_product', (productId) => {
      socket.leave(`product:${productId}`);
      logger.info(`User ${socket.user.email} left product room: ${productId}`);
    });

    // Handle joining auction rooms
    socket.on('join_auction', (auctionId) => {
      socket.join(`auction:${auctionId}`);
      logger.info(
        `User ${socket.user.email} joined auction room: ${auctionId}`
      );
    });

    // Handle leaving auction rooms
    socket.on('leave_auction', (auctionId) => {
      socket.leave(`auction:${auctionId}`);
      logger.info(`User ${socket.user.email} left auction room: ${auctionId}`);
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      logger.info(
        `User ${socket.user.email} joined conversation room: ${conversationId}`
      );
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(
        `User ${socket.user.email} left conversation room: ${conversationId}`
      );
    });

    // Handle new message
    socket.on('new_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'TEXT' } = data;

        // Verify user has access to conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [{ buyerId: socket.user.id }, { sellerId: socket.user.id }],
          },
          include: {
            buyer: true,
            seller: true,
            product: true,
          },
        });

        if (!conversation) {
          socket.emit('error', {
            message: 'Conversation not found or access denied',
          });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.user.id,
            content,
            messageType,
            status: 'SENT',
          },
          include: {
            sender: {
              select: {
                id: true,
                companyName: true,
                country: true,
              },
            },
          },
        });

        // Update conversation
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit(
          'message_received',
          message
        );

        // Emit to other user's personal room
        const otherUserId =
          socket.user.id === conversation.buyerId
            ? conversation.sellerId
            : conversation.buyerId;
        io.to(`user:${otherUserId}`).emit('new_message_notification', {
          conversationId,
          message,
          product: conversation.product,
        });

        logger.info(
          `Message sent via socket: ${message.id} in conversation: ${conversationId}`
        );
      } catch (error) {
        logger.error('Socket new message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle new bid
    socket.on('new_bid', async (data) => {
      try {
        const { auctionId, amount } = data;

        // Verify auction exists and is active
        const auction = await prisma.auction.findUnique({
          where: { id: auctionId },
          include: {
            product: true,
          },
        });

        if (!auction || auction.status !== 'ACTIVE') {
          socket.emit('error', { message: 'Auction not found or not active' });
          return;
        }

        // Check if user can bid (not the seller)
        if (auction.product.sellerId === socket.user.id) {
          socket.emit('error', {
            message: 'Sellers cannot bid on their own auctions',
          });
          return;
        }

        // Create bid
        const bid = await prisma.bid.create({
          data: {
            auctionId,
            bidderId: socket.user.id,
            amount: parseFloat(amount),
            status: 'ACTIVE',
          },
          include: {
            bidder: {
              select: {
                id: true,
                companyName: true,
                country: true,
              },
            },
          },
        });

        // Update auction
        await prisma.auction.update({
          where: { id: auctionId },
          data: {
            currentBid: parseFloat(amount),
            bidCount: { increment: 1 },
          },
        });

        // Emit to auction room
        io.to(`auction:${auctionId}`).emit('bid_placed', {
          bid,
          auctionId,
          currentBid: parseFloat(amount),
        });

        // Emit to seller's personal room
        io.to(`user:${auction.product.sellerId}`).emit(
          'auction_bid_notification',
          {
            auctionId,
            bid,
            product: auction.product,
          }
        );

        logger.info(
          `Bid placed via socket: ${bid.id} for auction: ${auctionId}`
        );
      } catch (error) {
        logger.error('Socket new bid error:', error);
        socket.emit('error', { message: 'Failed to place bid' });
      }
    });

    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        companyName: socket.user.companyName,
        conversationId,
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.user.id,
        conversationId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(
        `User disconnected: ${socket.user.email} (${socket.id}) - ${reason}`
      );
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user.email}:`, error);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 */
const getSocket = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Emit to user
 */
const emitToUser = (userId, event, data) => {
  try {
    const socket = getSocket();
    socket.to(`user:${userId}`).emit(event, data);
    logger.debug(`Emitted to user ${userId}: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit to user ${userId}:`, error);
  }
};

/**
 * Emit to role
 */
const emitToRole = (role, event, data) => {
  try {
    const socket = getSocket();
    socket.to(`role:${role}`).emit(event, data);
    logger.debug(`Emitted to role ${role}: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit to role ${role}:`, error);
  }
};

/**
 * Emit to product room
 */
const emitToProduct = (productId, event, data) => {
  try {
    const socket = getSocket();
    socket.to(`product:${productId}`).emit(event, data);
    logger.debug(`Emitted to product ${productId}: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit to product ${productId}:`, error);
  }
};

/**
 * Emit to auction room
 */
const emitToAuction = (auctionId, event, data) => {
  try {
    const socket = getSocket();
    socket.to(`auction:${auctionId}`).emit(event, data);
    logger.debug(`Emitted to auction ${auctionId}: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit to auction ${auctionId}:`, error);
  }
};

/**
 * Emit to conversation room
 */
const emitToConversation = (conversationId, event, data) => {
  try {
    const socket = getSocket();
    socket.to(`conversation:${conversationId}`).emit(event, data);
    logger.debug(`Emitted to conversation ${conversationId}: ${event}`);
  } catch (error) {
    logger.error(`Failed to emit to conversation ${conversationId}:`, error);
  }
};

/**
 * Broadcast to all connected users
 */
const broadcast = (event, data) => {
  try {
    const socket = getSocket();
    socket.emit(event, data);
    logger.debug(`Broadcasted: ${event}`);
  } catch (error) {
    logger.error(`Failed to broadcast ${event}:`, error);
  }
};

/**
 * Get connected users count
 */
const getConnectedUsersCount = () => {
  try {
    const socket = getSocket();
    return socket.engine.clientsCount;
  } catch (error) {
    logger.error('Failed to get connected users count:', error);
    return 0;
  }
};

/**
 * Get users in room
 */
const getUsersInRoom = (room) => {
  try {
    const socket = getSocket();
    const roomSockets = socket.sockets.adapter.rooms.get(room);
    return roomSockets ? roomSockets.size : 0;
  } catch (error) {
    logger.error(`Failed to get users in room ${room}:`, error);
    return 0;
  }
};

/**
 * Close Socket.IO server
 */
const closeSocket = () => {
  if (io) {
    io.close();
    io = null;
    logger.info('Socket.IO server closed');
  }
};

module.exports = {
  initSocket,
  getSocket,
  emitToUser,
  emitToRole,
  emitToProduct,
  emitToAuction,
  emitToConversation,
  broadcast,
  getConnectedUsersCount,
  getUsersInRoom,
  closeSocket,
};
