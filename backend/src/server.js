const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const path = require('path');
require('express-async-errors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const auctionRoutes = require('./routes/auctions');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const monitoringRoutes = require('./monitoring/monitoringRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { logger } = require('./utils/logger');
const monitoringSystem = require('./monitoring');

const app = express();
const server = createServer(app);

// Redis client setup
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
  // Don't exit process, just log the error
});

redisClient.on('connect', () => logger.info('Redis connected successfully'));

// Connect to Redis with graceful fallback
redisClient.connect().catch((err) => {
  logger.error('Failed to connect to Redis:', err);
  logger.warn('Application will continue without Redis caching');
  // Don't exit process, allow app to run without Redis
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin:
      process.env.SOCKET_CORS_ORIGIN ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    (process.env.NODE_ENV === 'development' ? 1000 : 100), // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(
      (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000
    ),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('User connected:', socket.id);

  // Join auction room
  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
    logger.info(`User ${socket.id} joined auction ${auctionId}`);
  });

  // Leave auction room
  socket.on('leave-auction', (auctionId) => {
    socket.leave(`auction-${auctionId}`);
    logger.info(`User ${socket.id} left auction ${auctionId}`);
  });

  // Join conversation room
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    logger.info(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
    logger.info(`User ${socket.id} left conversation ${conversationId}`);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: true,
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: false,
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info(`User ${socket.id} disconnected: ${reason}`);
  });
});

// Make io and redis available to routes
app.set('io', io);
app.set('redis', redisClient);

// Add Redis connection status check
app.get('/api/redis-status', async (req, res) => {
  try {
    await redisClient.ping();
    res.json({ status: 'connected', message: 'Redis is running' });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      message: 'Redis is not available',
      error: error.message,
    });
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Redis connection before starting server
const initializeServer = async () => {
  try {
    // Test Redis connection
    await redisClient.ping();
    logger.info('✅ Redis connection verified');
  } catch (error) {
    logger.warn(
      '⚠️  Redis connection failed, but server will continue without caching'
    );
    logger.warn(
      '   To enable caching, ensure Redis is running on localhost:6379'
    );
  }

  // Initialize monitoring system
  try {
    await monitoringSystem.initialize();
    logger.info('✅ Monitoring system initialized');
  } catch (error) {
    logger.error('❌ Failed to initialize monitoring system:', error);
    logger.warn('   Server will continue without monitoring');
  }

  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    logger.info(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
    logger.info(`🔗 API Documentation: http://localhost:${PORT}/api/docs`);
    logger.info(`🔍 Redis Status: http://localhost:${PORT}/api/redis-status`);
    logger.info(`📊 Monitoring Dashboard: http://localhost:${PORT}/api/monitoring/dashboard`);
  });
};

// Start the server
initializeServer().catch((error) => {
  logger.error('Failed to initialize server:', error);
  process.exit(1);
});

module.exports = { app, server, io };
