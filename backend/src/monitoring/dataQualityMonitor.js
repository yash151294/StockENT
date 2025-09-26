const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

class DataQualityMonitor {
  constructor() {
    this.qualityRules = new Map();
    this.qualityHistory = [];
    this.setupQualityRules();
  }

  // Setup data quality rules
  setupQualityRules() {
    // Product data quality rules
    this.addQualityRule('products_without_images', {
      description: 'Products without images',
      severity: 'medium',
      query: async () => {
        return await prisma.product.count({
          where: {
            status: 'ACTIVE',
            images: { none: {} },
          },
        });
      },
      threshold: 10,
    });

    this.addQualityRule('products_without_descriptions', {
      description: 'Products with empty or very short descriptions',
      severity: 'low',
      query: async () => {
        return await prisma.product.count({
          where: {
            status: 'ACTIVE',
            OR: [
              { description: { equals: '' } },
              { description: { lt: 50 } },
            ],
          },
        });
      },
      threshold: 20,
    });

    this.addQualityRule('products_with_invalid_prices', {
      description: 'Products with invalid prices',
      severity: 'high',
      query: async () => {
        return await prisma.product.count({
          where: {
            OR: [
              { basePrice: { lte: 0 } },
              { minOrderQuantity: { lte: 0 } },
              { quantityAvailable: { lte: 0 } },
            ],
          },
        });
      },
      threshold: 0,
    });

    this.addQualityRule('duplicate_products', {
      description: 'Duplicate products by same seller',
      severity: 'medium',
      query: async () => {
        const duplicates = await prisma.$queryRaw`
          SELECT title, seller_id, COUNT(*) as count
          FROM products 
          WHERE status = 'ACTIVE'
          GROUP BY title, seller_id 
          HAVING COUNT(*) > 1
        `;
        return duplicates.length;
      },
      threshold: 5,
    });

    // User data quality rules
    this.addQualityRule('incomplete_user_profiles', {
      description: 'Users with incomplete profiles',
      severity: 'low',
      query: async () => {
        return await prisma.user.count({
          where: {
            isActive: true,
            OR: [
              { companyName: null },
              { contactPerson: null },
              { country: null },
            ],
          },
        });
      },
      threshold: 50,
    });

    this.addQualityRule('unverified_sellers', {
      description: 'Unverified sellers (7+ days old)',
      severity: 'medium',
      query: async () => {
        return await prisma.user.count({
          where: {
            role: 'SELLER',
            verificationStatus: 'PENDING',
            createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        });
      },
      threshold: 20,
    });

    // Auction data quality rules
    this.addQualityRule('inconsistent_auctions', {
      description: 'Auctions with inconsistent data',
      severity: 'high',
      query: async () => {
        return await prisma.auction.count({
          where: {
            OR: [
              { currentBid: { lt: 0 } },
              { bidCount: { lt: 0 } },
              { startTime: { gt: new Date() } },
              { endTime: { lt: new Date() } },
            ],
          },
        });
      },
      threshold: 0,
    });

    this.addQualityRule('orphaned_auction_bids', {
      description: 'Bids without valid auctions',
      severity: 'medium',
      query: async () => {
        return await prisma.bid.count({
          where: {
            auction: null,
          },
        });
      },
      threshold: 0,
    });

    // Image data quality rules
    this.addQualityRule('orphaned_product_images', {
      description: 'Images without valid products',
      severity: 'medium',
      query: async () => {
        return await prisma.productImage.count({
          where: {
            product: null,
          },
        });
      },
      threshold: 5,
    });

    this.addQualityRule('products_without_primary_images', {
      description: 'Products without primary images',
      severity: 'low',
      query: async () => {
        return await prisma.product.count({
          where: {
            status: 'ACTIVE',
            images: {
              none: { isPrimary: true },
            },
          },
        });
      },
      threshold: 30,
    });

    // Message data quality rules
    this.addQualityRule('orphaned_messages', {
      description: 'Messages without valid conversations',
      severity: 'medium',
      query: async () => {
        return await prisma.message.count({
          where: {
            conversation: null,
          },
        });
      },
      threshold: 0,
    });

    this.addQualityRule('conversations_without_messages', {
      description: 'Conversations without messages',
      severity: 'low',
      query: async () => {
        return await prisma.conversation.count({
          where: {
            messages: { none: {} },
            createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours old
          },
        });
      },
      threshold: 10,
    });

    // Category data quality rules
    this.addQualityRule('categories_without_products', {
      description: 'Categories without products',
      severity: 'low',
      query: async () => {
        return await prisma.category.count({
          where: {
            isActive: true,
            products: { none: {} },
          },
        });
      },
      threshold: 5,
    });

    this.addQualityRule('orphaned_categories', {
      description: 'Categories with invalid parent references',
      severity: 'medium',
      query: async () => {
        return await prisma.category.count({
          where: {
            parentId: { not: null },
            parent: null,
          },
        });
      },
      threshold: 0,
    });
  }

  // Add quality rule
  addQualityRule(name, rule) {
    this.qualityRules.set(name, {
      ...rule,
      lastCheck: null,
      lastResult: null,
      violations: 0,
    });
  }

  // Run all quality checks
  async runAllQualityChecks() {
    const results = {
      timestamp: new Date().toISOString(),
      totalRules: this.qualityRules.size,
      passedRules: 0,
      failedRules: 0,
      warnings: 0,
      errors: 0,
      rules: {},
    };

    for (const [ruleName, rule] of this.qualityRules) {
      try {
        const start = Date.now();
        const violations = await rule.query();
        const duration = Date.now() - start;

        const result = {
          name: ruleName,
          description: rule.description,
          severity: rule.severity,
          violations,
          threshold: rule.threshold,
          passed: violations <= rule.threshold,
          duration,
          timestamp: new Date().toISOString(),
        };

        results.rules[ruleName] = result;

        if (result.passed) {
          results.passedRules++;
        } else {
          results.failedRules++;
          if (rule.severity === 'high') {
            results.errors++;
          } else {
            results.warnings++;
          }
        }

        // Update rule state
        rule.lastCheck = new Date();
        rule.lastResult = result;
        rule.violations = violations;

        // Log violations
        if (!result.passed) {
          logger.warn(`Data quality violation: ${ruleName}`, {
            violations,
            threshold: rule.threshold,
            severity: rule.severity,
          });
        }

      } catch (error) {
        logger.error(`Data quality check failed: ${ruleName}`, error);
        results.rules[ruleName] = {
          name: ruleName,
          description: rule.description,
          severity: rule.severity,
          error: error.message,
          passed: false,
          timestamp: new Date().toISOString(),
        };
        results.failedRules++;
        results.errors++;
      }
    }

    // Add to history
    this.qualityHistory.push(results);

    // Keep only last 100 results
    if (this.qualityHistory.length > 100) {
      this.qualityHistory.shift();
    }

    return results;
  }

  // Get quality trends
  getQualityTrends(days = 7) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentHistory = this.qualityHistory.filter(
      h => new Date(h.timestamp) > cutoffDate
    );

    if (recentHistory.length === 0) {
      return { trends: [], summary: {} };
    }

    const trends = {};
    const ruleNames = Object.keys(recentHistory[0].rules);

    for (const ruleName of ruleNames) {
      trends[ruleName] = recentHistory.map(h => ({
        timestamp: h.timestamp,
        violations: h.rules[ruleName]?.violations || 0,
        passed: h.rules[ruleName]?.passed || false,
      }));
    }

    const summary = {
      totalChecks: recentHistory.length,
      averagePassRate: recentHistory.reduce((sum, h) => sum + (h.passedRules / h.totalRules), 0) / recentHistory.length,
      mostProblematicRules: Object.entries(trends)
        .map(([name, trend]) => ({
          name,
          averageViolations: trend.reduce((sum, t) => sum + t.violations, 0) / trend.length,
          failureRate: trend.filter(t => !t.passed).length / trend.length,
        }))
        .sort((a, b) => b.averageViolations - a.averageViolations)
        .slice(0, 5),
    };

    return { trends, summary };
  }

  // Get specific rule details
  getRuleDetails(ruleName) {
    const rule = this.qualityRules.get(ruleName);
    if (!rule) return null;

    return {
      name: ruleName,
      description: rule.description,
      severity: rule.severity,
      threshold: rule.threshold,
      lastCheck: rule.lastCheck,
      lastResult: rule.lastResult,
      violations: rule.violations,
    };
  }

  // Get quality report
  getQualityReport() {
    const latestCheck = this.qualityHistory[this.qualityHistory.length - 1];
    const trends = this.getQualityTrends(7);

    return {
      timestamp: new Date().toISOString(),
      latest: latestCheck,
      trends,
      history: this.qualityHistory.slice(-10), // Last 10 checks
    };
  }

  // Fix data quality issues
  async fixDataQualityIssues() {
    const fixes = [];
    
    try {
      // Fix orphaned product images
      const orphanedImages = await prisma.productImage.findMany({
        where: { product: null },
      });
      
      if (orphanedImages.length > 0) {
        await prisma.productImage.deleteMany({
          where: { product: null },
        });
        fixes.push(`Deleted ${orphanedImages.length} orphaned product images`);
      }

      // Fix orphaned auction bids
      const orphanedBids = await prisma.bid.findMany({
        where: { auction: null },
      });
      
      if (orphanedBids.length > 0) {
        await prisma.bid.deleteMany({
          where: { auction: null },
        });
        fixes.push(`Deleted ${orphanedBids.length} orphaned auction bids`);
      }

      // Fix orphaned messages
      const orphanedMessages = await prisma.message.findMany({
        where: { conversation: null },
      });
      
      if (orphanedMessages.length > 0) {
        await prisma.message.deleteMany({
          where: { conversation: null },
        });
        fixes.push(`Deleted ${orphanedMessages.length} orphaned messages`);
      }

      // Fix products without primary images
      const productsWithoutPrimary = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          images: {
            none: { isPrimary: true },
          },
        },
        include: { images: true },
      });

      for (const product of productsWithoutPrimary) {
        if (product.images.length > 0) {
          await prisma.productImage.update({
            where: { id: product.images[0].id },
            data: { isPrimary: true },
          });
        }
      }

      if (productsWithoutPrimary.length > 0) {
        fixes.push(`Set primary images for ${productsWithoutPrimary.length} products`);
      }

      logger.info('Data quality fixes applied:', fixes);
      return { fixes, success: true };

    } catch (error) {
      logger.error('Failed to fix data quality issues:', error);
      return { fixes: [], success: false, error: error.message };
    }
  }

  // Get duplicate products
  async getDuplicateProducts() {
    try {
      const duplicates = await prisma.$queryRaw`
        SELECT 
          title, 
          seller_id, 
          COUNT(*) as count,
          ARRAY_AGG(id) as product_ids,
          ARRAY_AGG(created_at) as created_dates
        FROM products 
        WHERE status = 'ACTIVE'
        GROUP BY title, seller_id 
        HAVING COUNT(*) > 1
        ORDER BY count DESC
      `;

      return duplicates;
    } catch (error) {
      logger.error('Failed to get duplicate products:', error);
      return [];
    }
  }

  // Get data quality statistics
  getQualityStatistics() {
    const latest = this.qualityHistory[this.qualityHistory.length - 1];
    const trends = this.getQualityTrends(30);

    return {
      current: {
        totalRules: latest?.totalRules || 0,
        passedRules: latest?.passedRules || 0,
        failedRules: latest?.failedRules || 0,
        passRate: latest ? (latest.passedRules / latest.totalRules) * 100 : 0,
      },
      trends: {
        averagePassRate: trends.summary.averagePassRate * 100,
        mostProblematicRules: trends.summary.mostProblematicRules,
      },
      history: {
        totalChecks: this.qualityHistory.length,
        lastCheck: latest?.timestamp,
      },
    };
  }

  // Start quality monitoring
  startMonitoring(interval = 300000) { // 5 minutes default
    logger.info('Starting data quality monitoring...');

    // Run initial check
    this.runAllQualityChecks().then(results => {
      logger.info('Initial data quality check completed', {
        passed: results.passedRules,
        failed: results.failedRules,
      });
    });

    // Set up periodic checks
    setInterval(async () => {
      try {
        const results = await this.runAllQualityChecks();
        logger.info('Data quality check completed', {
          passed: results.passedRules,
          failed: results.failedRules,
          errors: results.errors,
          warnings: results.warnings,
        });
      } catch (error) {
        logger.error('Data quality monitoring error:', error);
      }
    }, interval);

    logger.info(`Data quality monitoring started with ${interval}ms interval`);
  }
}

module.exports = DataQualityMonitor;