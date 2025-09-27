const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/search
 * @desc    Search products, users, and categories
 * @access  Public
 */
router.get('/', [apiLimiter], async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = q.trim();

    const results = {};

    // Search products
    if (type === 'all' || type === 'products') {
      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { has: searchTerm } },
          ],
        },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      });

      const totalProducts = await prisma.product.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { has: searchTerm } },
          ],
        },
      });

      results.products = {
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalProducts,
          pages: Math.ceil(totalProducts / parseInt(limit)),
        },
      };
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      const categories = await prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
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

      results.categories = {
        data: categories,
        total: categories.length,
      };
    }

    // Search users (only for admin or if user is verified)
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          verificationStatus: 'VERIFIED',
          OR: [
            { companyName: { contains: searchTerm, mode: 'insensitive' } },
            { contactPerson: { contains: searchTerm, mode: 'insensitive' } },
            { country: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          country: true,
          verificationStatus: true,
          _count: {
            select: {
              products: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
        orderBy: { companyName: 'asc' },
        take: 10, // Limit user results
      });

      results.users = {
        data: users,
        total: users.length,
      };
    }

    res.json({
      success: true,
      data: results,
      query: searchTerm,
      type,
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions
 * @access  Public
 */
router.get('/suggestions', [apiLimiter], async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          products: [],
          categories: [],
          tags: [],
        },
      });
    }

    const searchTerm = q.trim();

    // Get product suggestions
    const productSuggestions = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { has: searchTerm } },
        ],
      },
      select: {
        id: true,
        title: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get category suggestions
    const categorySuggestions = await prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: searchTerm, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
      take: 5,
    });

    // Get popular tags
    const popularTags = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        tags: {
          has: searchTerm,
        },
      },
      select: {
        tags: true,
      },
      take: 20,
    });

    // Extract and count tags
    const tagCounts = {};
    popularTags.forEach((product) => {
      product.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(searchTerm.toLowerCase())) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    const tagSuggestions = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    res.json({
      success: true,
      data: {
        products: productSuggestions,
        categories: categorySuggestions,
        tags: tagSuggestions,
      },
    });
  } catch (error) {
    logger.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/search/trending
 * @desc    Get trending search terms
 * @access  Public
 */
router.get('/trending', [apiLimiter], async (req, res) => {
  try {
    // This would typically be stored in Redis or a search analytics service
    // For now, we'll return some mock trending terms
    const trendingTerms = [
      'cotton fabric',
      'polyester yarn',
      'denim material',
      'silk fabric',
      'wool blend',
      'linen fabric',
      'synthetic fiber',
      'organic cotton',
      'recycled polyester',
      'bamboo fiber',
    ];

    res.json({
      success: true,
      data: trendingTerms,
    });
  } catch (error) {
    logger.error('Trending search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @route   GET /api/search/filters
 * @desc    Get available search filters
 * @access  Public
 */
router.get('/filters', [apiLimiter], async (req, res) => {
  try {
    // Get categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
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

    // Get countries
    const countries = await prisma.user.findMany({
      where: {
        isActive: true,
        verificationStatus: 'VERIFIED',
      },
      select: {
        country: true,
      },
      distinct: ['country'],
    });

    // Get price ranges
    const priceRanges = await prisma.product.aggregate({
      where: { status: 'ACTIVE' },
      _min: { basePrice: true },
      _max: { basePrice: true },
    });

    // Get listing types
    const listingTypes = await prisma.product.groupBy({
      by: ['listingType'],
      where: { status: 'ACTIVE' },
      _count: {
        id: true,
      },
    });

    res.json({
      success: true,
      data: {
        categories,
        countries: countries.map((c) => c.country).filter(Boolean),
        priceRanges: {
          min: priceRanges._min.price || 0,
          max: priceRanges._max.price || 0,
        },
        listingTypes: listingTypes.map((lt) => ({
          type: lt.listingType,
          count: lt._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error('Search filters error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
