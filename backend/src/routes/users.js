const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', [authenticateToken, apiLimiter], async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        companyProfile: true,
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
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [authenticateToken, apiLimiter], async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      country,
      businessLicense,
      taxId,
      address,
    } = req.body;

    const updateData = {};
    if (companyName) updateData.companyName = companyName;
    if (contactPerson) updateData.contactPerson = contactPerson;
    if (phone) updateData.phone = phone;
    if (country) updateData.country = country;

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    // Update or create company profile
    if (businessLicense || taxId || address) {
      await prisma.companyProfile.upsert({
        where: { userId: req.user.id },
        update: {
          businessLicense,
          taxId,
          address,
        },
        create: {
          userId: req.user.id,
          businessLicense,
          taxId,
          address,
        },
      });
    }

    logger.info(`User profile updated: ${req.user.id}`);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get public user profile
 * @access  Public
 */
router.get('/:id', [apiLimiter], async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        country: true,
        verificationStatus: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' },
            },
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
    logger.error('Get public user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/users/:id/products
 * @desc    Get user's products
 * @access  Public
 */
router.get('/:id/products', [apiLimiter], async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'ACTIVE' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      sellerId: req.params.id,
      status,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
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
          auction: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true,
              currentBid: true,
              bidCount: true,
            },
          },
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
    logger.error('Get user products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/users/:id/reviews
 * @desc    Get user reviews
 * @access  Public
 */
router.get('/:id/reviews', [apiLimiter], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { sellerId: req.params.id },
        include: {
          buyer: {
            select: {
              id: true,
              companyName: true,
              country: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({
        where: { sellerId: req.params.id },
      }),
    ]);

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: { sellerId: req.params.id },
      _avg: { rating: true },
    });

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: avgRating._avg.rating || 0,
        totalReviews: total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   POST /api/users/:id/reviews
 * @desc    Create user review
 * @access  Private
 */
router.post(
  '/:id/reviews',
  [authenticateToken, apiLimiter],
  async (req, res) => {
    try {
      const { rating, comment, productId } = req.body;

      // Check if user can review (must have purchased from this seller)
      const order = await prisma.order.findFirst({
        where: {
          buyerId: req.user.id,
          sellerId: req.params.id,
          productId,
          status: 'COMPLETED',
        },
      });

      if (!order) {
        return res.status(400).json({
          success: false,
          error: 'You can only review sellers you have purchased from',
        });
      }

      // Check if review already exists
      const existingReview = await prisma.review.findFirst({
        where: {
          buyerId: req.user.id,
          sellerId: req.params.id,
          productId,
        },
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          error: 'You have already reviewed this seller for this product',
        });
      }

      const review = await prisma.review.create({
        data: {
          buyerId: req.user.id,
          sellerId: req.params.id,
          productId,
          rating: parseInt(rating),
          comment,
        },
        include: {
          buyer: {
            select: {
              id: true,
              companyName: true,
              country: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      logger.info(`Review created: ${review.id} by user: ${req.user.id}`);

      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      logger.error('Create review error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user statistics
 * @access  Public
 */
router.get('/:id/stats', [apiLimiter], async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      totalSales,
      totalRevenue,
      averageRating,
      totalReviews,
    ] = await Promise.all([
      prisma.product.count({
        where: { sellerId: req.params.id },
      }),
      prisma.product.count({
        where: {
          sellerId: req.params.id,
          status: 'ACTIVE',
        },
      }),
      prisma.order.count({
        where: {
          sellerId: req.params.id,
          status: 'COMPLETED',
        },
      }),
      prisma.order.aggregate({
        where: {
          sellerId: req.params.id,
          status: 'COMPLETED',
        },
        _sum: { price: true },
      }),
      prisma.review.aggregate({
        where: { sellerId: req.params.id },
        _avg: { rating: true },
      }),
      prisma.review.count({
        where: { sellerId: req.params.id },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalSales,
        totalRevenue: totalRevenue._sum.price || 0,
        averageRating: averageRating._avg.rating || 0,
        totalReviews,
      },
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
