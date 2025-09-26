const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

class TextileMarketplaceMonitor {
  constructor() {
    this.marketplaceMetrics = new Map();
    this.inventorySyncStatus = new Map();
    this.priceAccuracyChecks = new Map();
    this.searchIndexStatus = new Map();
  }

  // Monitor inventory synchronization
  async checkInventorySynchronization() {
    try {
      // Check for products with quantity mismatches
      const inventoryIssues = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { quantityAvailable: { lte: 0 } },
            { quantityAvailable: { gt: 1000000 } }, // Suspiciously high quantity
          ],
        },
        select: {
          id: true,
          title: true,
          quantityAvailable: true,
          seller: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
      });

      // Check for products with inconsistent status
      const statusIssues = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lt: new Date() },
        },
        select: {
          id: true,
          title: true,
          status: true,
          expiresAt: true,
        },
      });

      // Check for products with missing specifications
      const missingSpecs = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          specifications: { none: {} },
        },
        select: {
          id: true,
          title: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      const result = {
        timestamp: new Date().toISOString(),
        inventoryIssues: inventoryIssues.length,
        statusIssues: statusIssues.length,
        missingSpecs: missingSpecs.length,
        details: {
          inventoryIssues,
          statusIssues,
          missingSpecs,
        },
        healthy: inventoryIssues.length === 0 && statusIssues.length === 0,
      };

      this.inventorySyncStatus.set('lastCheck', result);
      return result;

    } catch (error) {
      logger.error('Inventory synchronization check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        healthy: false,
      };
    }
  }

  // Monitor price accuracy and currency conversion
  async checkPriceAccuracy() {
    try {
      // Check for products with suspiciously low prices
      const suspiciousPrices = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          basePrice: { lte: 0.01 }, // Less than 1 cent
        },
        select: {
          id: true,
          title: true,
          basePrice: true,
          currency: true,
          seller: {
            select: {
              companyName: true,
              country: true,
            },
          },
        },
      });

      // Check for products with suspiciously high prices
      const highPrices = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          basePrice: { gte: 100000 }, // More than $100,000
        },
        select: {
          id: true,
          title: true,
          basePrice: true,
          currency: true,
          seller: {
            select: {
              companyName: true,
              country: true,
            },
          },
        },
      });

      // Check for currency conversion issues
      const currencyIssues = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          currency: { not: 'USD' },
          basePrice: { gte: 1000 },
        },
        select: {
          id: true,
          title: true,
          basePrice: true,
          currency: true,
          seller: {
            select: {
              country: true,
            },
          },
        },
      });

      // Check for price inconsistencies in auctions
      const auctionPriceIssues = await prisma.auction.findMany({
        where: {
          OR: [
            { currentBid: { lt: startingPrice } },
            { currentBid: { gt: startingPrice * 100 } }, // 100x starting price
          ],
        },
        include: {
          product: {
            select: {
              title: true,
              basePrice: true,
            },
          },
        },
      });

      const result = {
        timestamp: new Date().toISOString(),
        suspiciousPrices: suspiciousPrices.length,
        highPrices: highPrices.length,
        currencyIssues: currencyIssues.length,
        auctionPriceIssues: auctionPriceIssues.length,
        details: {
          suspiciousPrices,
          highPrices,
          currencyIssues,
          auctionPriceIssues,
        },
        healthy: suspiciousPrices.length === 0 && auctionPriceIssues.length === 0,
      };

      this.priceAccuracyChecks.set('lastCheck', result);
      return result;

    } catch (error) {
      logger.error('Price accuracy check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        healthy: false,
      };
    }
  }

  // Monitor image and document upload functionality
  async checkImageAndDocumentUploads() {
    try {
      // Check for products without images
      const productsWithoutImages = await prisma.product.count({
        where: {
          status: 'ACTIVE',
          images: { none: {} },
        },
      });

      // Check for broken image URLs
      const productsWithImages = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          images: { some: {} },
        },
        include: {
          images: {
            select: {
              id: true,
              imageUrl: true,
              isPrimary: true,
            },
          },
        },
      });

      // Check for oversized images (this would require actual file size checking)
      const potentialOversizedImages = await prisma.productImage.count({
        where: {
          imageUrl: {
            contains: '.jpg',
          },
        },
      });

      // Check for products with too many images (potential spam)
      const productsWithManyImages = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          _count: {
            select: {
              images: true,
            },
          },
        },
        having: {
          images: {
            _count: {
              gte: 20, // More than 20 images
            },
          },
        },
      });

      const result = {
        timestamp: new Date().toISOString(),
        productsWithoutImages,
        productsWithManyImages: productsWithManyImages.length,
        potentialOversizedImages,
        totalProductsWithImages: productsWithImages.length,
        healthy: productsWithoutImages < 50, // Less than 50 products without images
      };

      return result;

    } catch (error) {
      logger.error('Image and document upload check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        healthy: false,
      };
    }
  }

  // Monitor search index consistency
  async checkSearchIndexConsistency() {
    try {
      // Check for products not appearing in search
      const activeProducts = await prisma.product.count({
        where: { status: 'ACTIVE' },
      });

      // Check for products with missing searchable fields
      const productsWithMissingSearchFields = await prisma.product.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { equals: '' } },
            { description: { equals: '' } },
            { tags: { equals: [] } },
          ],
        },
      });

      // Check for categories without products
      const emptyCategories = await prisma.category.count({
        where: {
          isActive: true,
          products: { none: {} },
        },
      });

      // Check for search performance
      const searchPerformance = await this.measureSearchPerformance();

      const result = {
        timestamp: new Date().toISOString(),
        activeProducts,
        productsWithMissingSearchFields,
        emptyCategories,
        searchPerformance,
        healthy: productsWithMissingSearchFields < 100 && emptyCategories < 10,
      };

      this.searchIndexStatus.set('lastCheck', result);
      return result;

    } catch (error) {
      logger.error('Search index consistency check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        healthy: false,
      };
    }
  }

  // Measure search performance
  async measureSearchPerformance() {
    const searchQueries = [
      'cotton fabric',
      'polyester yarn',
      'denim material',
      'silk fabric',
      'wool blend',
    ];

    const results = [];

    for (const query of searchQueries) {
      const start = Date.now();
      try {
        const products = await prisma.product.findMany({
          where: {
            status: 'ACTIVE',
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { tags: { has: query } },
            ],
          },
          take: 20,
        });
        const duration = Date.now() - start;
        
        results.push({
          query,
          duration,
          resultCount: products.length,
          success: true,
        });
      } catch (error) {
        results.push({
          query,
          duration: Date.now() - start,
          resultCount: 0,
          success: false,
          error: error.message,
        });
      }
    }

    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const successRate = results.filter(r => r.success).length / results.length;

    return {
      averageDuration,
      successRate,
      results,
    };
  }

  // Monitor user communication system
  async checkUserCommunicationSystem() {
    try {
      // Check for conversations without recent activity
      const staleConversations = await prisma.conversation.count({
        where: {
          status: 'ACTIVE',
          updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days
        },
      });

      // Check for unread messages
      const unreadMessages = await prisma.message.count({
        where: {
          readAt: null,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days
        },
      });

      // Check for conversations with too many messages (potential spam)
      const conversationsWithManyMessages = await prisma.conversation.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
        },
        having: {
          messages: {
            _count: {
              gte: 100, // More than 100 messages
            },
          },
        },
      });

      // Check for message delivery issues
      const recentMessages = await prisma.message.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours
        },
      });

      const result = {
        timestamp: new Date().toISOString(),
        staleConversations,
        unreadMessages,
        conversationsWithManyMessages: conversationsWithManyMessages.length,
        recentMessages,
        healthy: staleConversations < 100 && conversationsWithManyMessages.length < 10,
      };

      return result;

    } catch (error) {
      logger.error('User communication system check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        healthy: false,
      };
    }
  }

  // Monitor textile-specific metrics
  async checkTextileSpecificMetrics() {
    try {
      // Check category distribution
      const categoryDistribution = await prisma.product.groupBy({
        by: ['categoryId'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      // Check material types
      const materialTypes = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          tags: { hasSome: ['cotton', 'polyester', 'silk', 'wool', 'denim', 'linen'] },
        },
        select: {
          tags: true,
        },
      });

      // Check geographic distribution
      const geographicDistribution = await prisma.product.groupBy({
        by: ['country'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      });

      // Check listing types
      const listingTypeDistribution = await prisma.product.groupBy({
        by: ['listingType'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      });

      const result = {
        timestamp: new Date().toISOString(),
        categoryDistribution,
        materialTypes: materialTypes.length,
        geographicDistribution,
        listingTypeDistribution,
        totalActiveProducts: await prisma.product.count({
          where: { status: 'ACTIVE' },
        }),
      };

      return result;

    } catch (error) {
      logger.error('Textile-specific metrics check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // Get comprehensive marketplace health report
  async getMarketplaceHealthReport() {
    try {
      const [
        inventorySync,
        priceAccuracy,
        imageUploads,
        searchIndex,
        communicationSystem,
        textileMetrics,
      ] = await Promise.all([
        this.checkInventorySynchronization(),
        this.checkPriceAccuracy(),
        this.checkImageAndDocumentUploads(),
        this.checkSearchIndexConsistency(),
        this.checkUserCommunicationSystem(),
        this.checkTextileSpecificMetrics(),
      ]);

      const overallHealth = [
        inventorySync.healthy,
        priceAccuracy.healthy,
        imageUploads.healthy,
        searchIndex.healthy,
        communicationSystem.healthy,
      ].filter(Boolean).length / 5;

      return {
        timestamp: new Date().toISOString(),
        overallHealth: overallHealth > 0.8 ? 'healthy' : overallHealth > 0.6 ? 'warning' : 'unhealthy',
        healthScore: overallHealth,
        inventorySync,
        priceAccuracy,
        imageUploads,
        searchIndex,
        communicationSystem,
        textileMetrics,
      };

    } catch (error) {
      logger.error('Marketplace health report failed:', error);
      return {
        timestamp: new Date().toISOString(),
        overallHealth: 'unhealthy',
        healthScore: 0,
        error: error.message,
      };
    }
  }

  // Get marketplace statistics
  async getMarketplaceStatistics() {
    try {
      const [
        totalUsers,
        activeUsers,
        totalProducts,
        activeProducts,
        totalAuctions,
        activeAuctions,
        totalConversations,
        totalMessages,
        categoryStats,
        countryStats,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.auction.count(),
        prisma.auction.count({ where: { status: 'ACTIVE' } }),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.category.findMany({
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
        }),
        prisma.user.groupBy({
          by: ['country'],
          where: { isActive: true },
          _count: { id: true },
        }),
      ]);

      return {
        timestamp: new Date().toISOString(),
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts,
        },
        auctions: {
          total: totalAuctions,
          active: activeAuctions,
          inactive: totalAuctions - activeAuctions,
        },
        communication: {
          conversations: totalConversations,
          messages: totalMessages,
        },
        distribution: {
          categories: categoryStats,
          countries: countryStats,
        },
      };

    } catch (error) {
      logger.error('Marketplace statistics failed:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // Start marketplace monitoring
  startMonitoring(interval = 600000) { // 10 minutes default
    logger.info('Starting textile marketplace monitoring...');

    // Run initial check
    this.getMarketplaceHealthReport().then(report => {
      logger.info('Initial marketplace health check completed', {
        overallHealth: report.overallHealth,
        healthScore: report.healthScore,
      });
    });

    // Set up periodic checks
    setInterval(async () => {
      try {
        const report = await this.getMarketplaceHealthReport();
        logger.info('Marketplace health check completed', {
          overallHealth: report.overallHealth,
          healthScore: report.healthScore,
        });
      } catch (error) {
        logger.error('Marketplace monitoring error:', error);
      }
    }, interval);

    logger.info(`Textile marketplace monitoring started with ${interval}ms interval`);
  }
}

module.exports = TextileMarketplaceMonitor;