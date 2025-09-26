const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Private (Admin)
 */
router.get(
  '/dashboard',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        totalProducts,
        activeProducts,
        totalAuctions,
        liveAuctions,
        totalConversations,
        totalMessages,
        recentUsers,
        recentProducts,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.auction.count(),
        prisma.auction.count({ where: { status: 'ACTIVE' } }),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            email: true,
            companyName: true,
            role: true,
            verificationStatus: true,
            createdAt: true,
          },
        }),
        prisma.product.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            seller: {
              select: {
                id: true,
                companyName: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]);

      // Get user growth data (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const userGrowth = await prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Get product growth data (last 30 days)
      const productGrowth = await prisma.product.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Get revenue data (mock for now)
      const revenue = {
        total: 0,
        monthly: 0,
        growth: 0,
      };

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            activeUsers,
            totalProducts,
            activeProducts,
            totalAuctions,
            liveAuctions,
            totalConversations,
            totalMessages,
            userGrowth,
            productGrowth,
          },
          revenue,
          recentUsers,
          recentProducts,
        },
      });
    } catch (error) {
      logger.error('Get admin dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering
 * @access  Private (Admin)
 */
router.get(
  '/users',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string'),
    query('role')
      .optional()
      .isIn(['BUYER', 'SELLER', 'ADMIN'])
      .withMessage('Invalid role'),
    query('status')
      .optional()
      .isIn(['PENDING', 'VERIFIED', 'REJECTED'])
      .withMessage('Invalid status'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 20,
        search,
        role,
        status,
        isActive,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) where.role = role;
      if (status) where.verificationStatus = status;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            companyProfile: true,
            _count: {
              select: {
                products: true,
                conversations: true,
                watchlistItems: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Get admin users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user
 * @access  Private (Admin)
 */
router.get(
  '/users/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          companyProfile: true,
          products: {
            include: {
              category: true,
              images: {
                where: { isPrimary: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          conversations: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
          },
          _count: {
            select: {
              products: true,
              conversations: true,
              watchlistItems: true,
              bids: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Get admin user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put(
  '/users/:id',
  [
    body('role')
      .optional()
      .isIn(['BUYER', 'SELLER', 'ADMIN'])
      .withMessage('Invalid role'),
    body('verificationStatus')
      .optional()
      .isIn(['PENDING', 'VERIFIED', 'REJECTED'])
      .withMessage('Invalid status'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          companyProfile: true,
        },
      });

      logger.info(`User updated by admin: ${id} by user: ${req.user.id}`);

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      logger.error('Update admin user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete(
  '/users/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Prevent admin from deleting themselves
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete your own account',
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      logger.info(`User deleted by admin: ${id} by user: ${req.user.id}`);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete admin user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   POST /api/admin/users/:id/verify
 * @desc    Verify user
 * @access  Private (Admin)
 */
router.post(
  '/users/:id/verify',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { verificationStatus: 'VERIFIED' },
      });

      logger.info(`User verified by admin: ${id} by user: ${req.user.id}`);

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      logger.error('Verify user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/admin/products
 * @desc    Get all products with filtering
 * @access  Private (Admin)
 */
router.get(
  '/products',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string'),
    query('status')
      .optional()
      .isIn(['ACTIVE', 'INACTIVE', 'SOLD', 'EXPIRED'])
      .withMessage('Invalid status'),
    query('listingType')
      .optional()
      .isIn(['FIXED_PRICE', 'AUCTION', 'NEGOTIABLE'])
      .withMessage('Invalid listing type'),
  ],
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 20, search, status, listingType } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) where.status = status;
      if (listingType) where.listingType = listingType;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            seller: {
              select: {
                id: true,
                email: true,
                companyName: true,
                country: true,
                verificationStatus: true,
              },
            },
            category: true,
            images: {
              where: { isPrimary: true },
            },
            auction: true,
            _count: {
              select: {
                watchlistItems: true,
                conversations: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Get admin products error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   POST /api/admin/products/:id/approve
 * @desc    Approve product
 * @access  Private (Admin)
 */
router.post(
  '/products/:id/approve',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });

      logger.info(`Product approved by admin: ${id} by user: ${req.user.id}`);

      res.json({
        success: true,
        data: updatedProduct,
      });
    } catch (error) {
      logger.error('Approve product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   POST /api/admin/products/:id/reject
 * @desc    Reject product
 * @access  Private (Admin)
 */
router.post(
  '/products/:id/reject',
  [
    body('reason')
      .notEmpty()
      .trim()
      .withMessage('Rejection reason is required'),
  ],
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });

      logger.info(
        `Product rejected by admin: ${id} by user: ${req.user.id}, reason: ${reason}`
      );

      res.json({
        success: true,
        data: updatedProduct,
      });
    } catch (error) {
      logger.error('Reject product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics data
 * @access  Private (Admin)
 */
router.get(
  '/analytics',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { period = '30d' } = req.query;

      let startDate;
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // User analytics
      const userAnalytics = await prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Product analytics
      const productAnalytics = await prisma.product.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Category distribution
      const categoryDistribution = await prisma.product.groupBy({
        by: ['categoryId'],
        _count: {
          id: true,
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      // Country distribution
      const countryDistribution = await prisma.user.groupBy({
        by: ['country'],
        _count: {
          id: true,
        },
      });

      res.json({
        success: true,
        data: {
          period,
          userAnalytics,
          productAnalytics,
          categoryDistribution,
          countryDistribution,
        },
      });
    } catch (error) {
      logger.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

module.exports = router;
