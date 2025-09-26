const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', [apiLimiter], async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (Admin)
 */
router.post(
  '/',
  [authenticateToken, requireRole(['ADMIN']), apiLimiter],
  async (req, res) => {
    try {
      const { name, description, parentId } = req.body;

      const category = await prisma.category.create({
        data: {
          name,
          description,
          parentId,
          isActive: true,
        },
      });

      logger.info(`Category created: ${category.id} by user: ${req.user.id}`);

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      logger.error('Create category error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  [authenticateToken, requireRole(['ADMIN']), apiLimiter],
  async (req, res) => {
    try {
      const { name, description, parentId, isActive } = req.body;

      const category = await prisma.category.findUnique({
        where: { id: req.params.id },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
        });
      }

      const updatedCategory = await prisma.category.update({
        where: { id: req.params.id },
        data: {
          name,
          description,
          parentId,
          isActive,
        },
      });

      logger.info(`Category updated: ${req.params.id} by user: ${req.user.id}`);

      res.json({
        success: true,
        data: updatedCategory,
      });
    } catch (error) {
      logger.error('Update category error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  [authenticateToken, requireRole(['ADMIN']), apiLimiter],
  async (req, res) => {
    try {
      const category = await prisma.category.findUnique({
        where: { id: req.params.id },
        include: {
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found',
        });
      }

      if (category._count.products > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete category with products',
        });
      }

      if (category._count.children > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete category with subcategories',
        });
      }

      await prisma.category.delete({
        where: { id: req.params.id },
      });

      logger.info(`Category deleted: ${req.params.id} by user: ${req.user.id}`);

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      logger.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/categories/:id/products
 * @desc    Get products in category
 * @access  Public
 */
router.get('/:id/products', [apiLimiter], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      minPrice,
      maxPrice,
      listingType,
      country,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      categoryId: req.params.id,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (listingType) {
      where.listingType = listingType;
    }

    if (country) {
      where.seller = {
        country,
      };
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        orderBy,
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
    logger.error('Get category products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
