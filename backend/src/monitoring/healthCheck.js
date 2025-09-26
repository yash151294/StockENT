const { PrismaClient } = require('@prisma/client');
const redis = require('redis');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.lastResults = new Map();
    this.alertThresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.9, // 90%
      cpuUsage: 0.8, // 80%
    };
  }

  // Register health checks
  registerCheck(name, checkFunction, interval = 30000) {
    this.checks.set(name, {
      function: checkFunction,
      interval,
      lastRun: null,
      status: 'unknown',
    });
  }

  // Database health check
  async checkDatabase() {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          connection: 'active',
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        details: {
          connection: 'failed',
          error: error.message,
        },
      };
    }
  }

  // Redis health check
  async checkRedis() {
    try {
      const redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      
      const start = Date.now();
      await redisClient.connect();
      await redisClient.ping();
      const responseTime = Date.now() - start;
      await redisClient.quit();
      
      return {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          connection: 'active',
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        details: {
          connection: 'failed',
          error: error.message,
        },
      };
    }
  }

  // API endpoint health check
  async checkAPIEndpoints() {
    const endpoints = [
      '/api/health',
      '/api/products',
      '/api/categories',
      '/api/search',
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(`http://localhost:${process.env.PORT || 5000}${endpoint}`);
        const responseTime = Date.now() - start;
        
        results.push({
          endpoint,
          status: response.ok ? 'healthy' : 'unhealthy',
          statusCode: response.status,
          responseTime,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'unhealthy',
          error: error.message,
          responseTime: null,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const overallStatus = healthyCount === results.length ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      details: {
        totalEndpoints: results.length,
        healthyEndpoints: healthyCount,
        unhealthyEndpoints: results.length - healthyCount,
        endpoints: results,
      },
    };
  }

  // System resources health check
  async checkSystemResources() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const memoryUsagePercent = usage.heapUsed / usage.heapTotal;
    const isMemoryHealthy = memoryUsagePercent < this.alertThresholds.memoryUsage;
    
    return {
      status: isMemoryHealthy ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      details: {
        memory: {
          used: Math.round(usage.heapUsed / 1024 / 1024),
          total: Math.round(usage.heapTotal / 1024 / 1024),
          percent: Math.round(memoryUsagePercent * 100),
          healthy: isMemoryHealthy,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        uptime: process.uptime(),
      },
    };
  }

  // Textile marketplace specific checks
  async checkTextileMarketplaceHealth() {
    try {
      // Check product data integrity
      const productStats = await prisma.product.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      // Check for orphaned records
      const orphanedImages = await prisma.productImage.count({
        where: {
          product: null,
        },
      });

      // Check auction consistency
      const inconsistentAuctions = await prisma.auction.count({
        where: {
          OR: [
            { currentBid: { lt: 0 } },
            { bidCount: { lt: 0 } },
            { startTime: { gt: new Date() } },
            { endTime: { lt: new Date() } },
          ],
        },
      });

      // Check user verification status
      const unverifiedSellers = await prisma.user.count({
        where: {
          role: 'SELLER',
          verificationStatus: 'PENDING',
          createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 days old
        },
      });

      const issues = [];
      if (orphanedImages > 0) issues.push(`${orphanedImages} orphaned product images`);
      if (inconsistentAuctions > 0) issues.push(`${inconsistentAuctions} inconsistent auctions`);
      if (unverifiedSellers > 10) issues.push(`${unverifiedSellers} unverified sellers (7+ days old)`);

      return {
        status: issues.length === 0 ? 'healthy' : 'warning',
        timestamp: new Date().toISOString(),
        details: {
          productStats,
          orphanedImages,
          inconsistentAuctions,
          unverifiedSellers,
          issues,
        },
      };
    } catch (error) {
      logger.error('Textile marketplace health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Data quality checks
  async checkDataQuality() {
    try {
      // Check for duplicate products
      const duplicateProducts = await prisma.$queryRaw`
        SELECT title, seller_id, COUNT(*) as count
        FROM products 
        WHERE status = 'ACTIVE'
        GROUP BY title, seller_id 
        HAVING COUNT(*) > 1
      `;

      // Check for products without images
      const productsWithoutImages = await prisma.product.count({
        where: {
          status: 'ACTIVE',
          images: { none: {} },
        },
      });

      // Check for incomplete user profiles
      const incompleteProfiles = await prisma.user.count({
        where: {
          OR: [
            { companyName: null },
            { contactPerson: null },
            { country: null },
          ],
          isActive: true,
        },
      });

      // Check for products with invalid prices
      const invalidPrices = await prisma.product.count({
        where: {
          OR: [
            { basePrice: { lte: 0 } },
            { minOrderQuantity: { lte: 0 } },
            { quantityAvailable: { lte: 0 } },
          ],
        },
      });

      const issues = [];
      if (duplicateProducts.length > 0) issues.push(`${duplicateProducts.length} duplicate products`);
      if (productsWithoutImages > 0) issues.push(`${productsWithoutImages} products without images`);
      if (incompleteProfiles > 0) issues.push(`${incompleteProfiles} incomplete user profiles`);
      if (invalidPrices > 0) issues.push(`${invalidPrices} products with invalid prices`);

      return {
        status: issues.length === 0 ? 'healthy' : 'warning',
        timestamp: new Date().toISOString(),
        details: {
          duplicateProducts: duplicateProducts.length,
          productsWithoutImages,
          incompleteProfiles,
          invalidPrices,
          issues,
        },
      };
    } catch (error) {
      logger.error('Data quality check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Performance monitoring
  async checkPerformance() {
    try {
      // Check slow queries (last 24 hours)
      const slowQueries = await prisma.$queryRaw`
        SELECT query, mean_time, calls
        FROM pg_stat_statements 
        WHERE mean_time > 1000 
        ORDER BY mean_time DESC 
        LIMIT 10
      `;

      // Check database connections
      const connectionStats = await prisma.$queryRaw`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;

      // Check table sizes
      const tableSizes = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: {
          slowQueries: slowQueries.length,
          connectionStats,
          tableSizes,
        },
      };
    } catch (error) {
      logger.error('Performance check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Run all health checks
  async runAllChecks() {
    const results = {};
    
    // Database check
    results.database = await this.checkDatabase();
    
    // Redis check
    results.redis = await this.checkRedis();
    
    // API endpoints check
    results.apiEndpoints = await this.checkAPIEndpoints();
    
    // System resources check
    results.systemResources = await this.checkSystemResources();
    
    // Textile marketplace specific check
    results.textileMarketplace = await this.checkTextileMarketplaceHealth();
    
    // Data quality check
    results.dataQuality = await this.checkDataQuality();
    
    // Performance check
    results.performance = await this.checkPerformance();

    // Determine overall health
    const allStatuses = Object.values(results).map(r => r.status);
    const hasUnhealthy = allStatuses.includes('unhealthy');
    const hasWarning = allStatuses.includes('warning');
    
    results.overall = {
      status: hasUnhealthy ? 'unhealthy' : hasWarning ? 'warning' : 'healthy',
      timestamp: new Date().toISOString(),
      summary: {
        total: allStatuses.length,
        healthy: allStatuses.filter(s => s === 'healthy').length,
        warning: allStatuses.filter(s => s === 'warning').length,
        unhealthy: allStatuses.filter(s => s === 'unhealthy').length,
      },
    };

    return results;
  }

  // Start monitoring
  startMonitoring() {
    logger.info('Starting health monitoring...');
    
    // Run initial check
    this.runAllChecks().then(results => {
      this.lastResults = results;
      logger.info('Initial health check completed', { overall: results.overall });
    });

    // Set up periodic checks
    setInterval(async () => {
      try {
        const results = await this.runAllChecks();
        this.lastResults = results;
        
        // Log warnings and errors
        Object.entries(results).forEach(([name, result]) => {
          if (result.status === 'unhealthy') {
            logger.error(`Health check failed: ${name}`, result);
          } else if (result.status === 'warning') {
            logger.warn(`Health check warning: ${name}`, result);
          }
        });
        
        // Store results for API access
        this.lastResults = results;
      } catch (error) {
        logger.error('Health monitoring error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Get last results
  getLastResults() {
    return this.lastResults;
  }
}

module.exports = HealthChecker;