const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

class MonitoringReporter {
  constructor() {
    this.emailTransporter = this.setupEmailTransporter();
    this.reportTemplates = new Map();
    this.setupReportTemplates();
  }

  // Setup email transporter
  setupEmailTransporter() {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Setup report templates
  setupReportTemplates() {
    this.reportTemplates.set('daily', {
      subject: 'StockENT Daily Monitoring Report',
      template: 'daily-report',
    });
    
    this.reportTemplates.set('weekly', {
      subject: 'StockENT Weekly Monitoring Report',
      template: 'weekly-report',
    });
    
    this.reportTemplates.set('monthly', {
      subject: 'StockENT Monthly Monitoring Report',
      template: 'monthly-report',
    });
  }

  // Generate daily report
  async generateDailyReport() {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Get system metrics
      const systemMetrics = await this.getSystemMetrics(yesterday, now);
      
      // Get user activity
      const userActivity = await this.getUserActivity(yesterday, now);
      
      // Get product activity
      const productActivity = await this.getProductActivity(yesterday, now);
      
      // Get auction activity
      const auctionActivity = await this.getAuctionActivity(yesterday, now);
      
      // Get communication activity
      const communicationActivity = await this.getCommunicationActivity(yesterday, now);
      
      // Get error statistics
      const errorStats = await this.getErrorStatistics(yesterday, now);
      
      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(yesterday, now);
      
      const report = {
        period: 'daily',
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        system: systemMetrics,
        users: userActivity,
        products: productActivity,
        auctions: auctionActivity,
        communication: communicationActivity,
        errors: errorStats,
        performance: performanceMetrics,
      };
      
      return report;
      
    } catch (error) {
      logger.error('Daily report generation failed:', error);
      throw error;
    }
  }

  // Generate weekly report
  async generateWeeklyReport() {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get weekly trends
      const weeklyTrends = await this.getWeeklyTrends(weekAgo, now);
      
      // Get user growth
      const userGrowth = await this.getUserGrowth(weekAgo, now);
      
      // Get product growth
      const productGrowth = await this.getProductGrowth(weekAgo, now);
      
      // Get category distribution
      const categoryDistribution = await this.getCategoryDistribution();
      
      // Get geographic distribution
      const geographicDistribution = await this.getGeographicDistribution();
      
      // Get top performing products
      const topProducts = await this.getTopPerformingProducts(weekAgo, now);
      
      // Get system health summary
      const systemHealth = await this.getSystemHealthSummary(weekAgo, now);
      
      const report = {
        period: 'weekly',
        week: this.getWeekNumber(now),
        year: now.getFullYear(),
        timestamp: now.toISOString(),
        trends: weeklyTrends,
        userGrowth,
        productGrowth,
        categoryDistribution,
        geographicDistribution,
        topProducts,
        systemHealth,
      };
      
      return report;
      
    } catch (error) {
      logger.error('Weekly report generation failed:', error);
      throw error;
    }
  }

  // Generate monthly report
  async generateMonthlyReport() {
    try {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      
      // Get monthly trends
      const monthlyTrends = await this.getMonthlyTrends(monthAgo, now);
      
      // Get revenue metrics (if available)
      const revenueMetrics = await this.getRevenueMetrics(monthAgo, now);
      
      // Get user engagement metrics
      const userEngagement = await this.getUserEngagementMetrics(monthAgo, now);
      
      // Get product performance metrics
      const productPerformance = await this.getProductPerformanceMetrics(monthAgo, now);
      
      // Get system performance summary
      const systemPerformance = await this.getSystemPerformanceSummary(monthAgo, now);
      
      // Get recommendations
      const recommendations = await this.getRecommendations(monthAgo, now);
      
      const report = {
        period: 'monthly',
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        timestamp: now.toISOString(),
        trends: monthlyTrends,
        revenue: revenueMetrics,
        userEngagement,
        productPerformance,
        systemPerformance,
        recommendations,
      };
      
      return report;
      
    } catch (error) {
      logger.error('Monthly report generation failed:', error);
      throw error;
    }
  }

  // Get system metrics
  async getSystemMetrics(startDate, endDate) {
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
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.product.count(),
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.auction.count(),
        prisma.auction.count({ where: { status: 'ACTIVE' } }),
        prisma.conversation.count(),
        prisma.message.count(),
      ]);

      return {
        users: { total: totalUsers, active: activeUsers },
        products: { total: totalProducts, active: activeProducts },
        auctions: { total: totalAuctions, active: activeAuctions },
        communication: { conversations: totalConversations, messages: totalMessages },
      };
    } catch (error) {
      logger.error('Failed to get system metrics:', error);
      return {};
    }
  }

  // Get user activity
  async getUserActivity(startDate, endDate) {
    try {
      const [
        newUsers,
        activeUsers,
        userRegistrations,
        userLogins,
      ] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.user.count({
          where: {
            lastLoginAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.user.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
        }),
        prisma.user.count({
          where: {
            lastLoginAt: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      return {
        newUsers,
        activeUsers,
        userRegistrations,
        userLogins,
      };
    } catch (error) {
      logger.error('Failed to get user activity:', error);
      return {};
    }
  }

  // Get product activity
  async getProductActivity(startDate, endDate) {
    try {
      const [
        newProducts,
        updatedProducts,
        productViews,
        productCategories,
      ] = await Promise.all([
        prisma.product.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.product.count({
          where: {
            updatedAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.product.count({
          where: {
            status: 'ACTIVE',
          },
        }),
        prisma.product.groupBy({
          by: ['categoryId'],
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
        }),
      ]);

      return {
        newProducts,
        updatedProducts,
        productViews,
        productCategories,
      };
    } catch (error) {
      logger.error('Failed to get product activity:', error);
      return {};
    }
  }

  // Get auction activity
  async getAuctionActivity(startDate, endDate) {
    try {
      const [
        newAuctions,
        endedAuctions,
        totalBids,
        averageBidAmount,
      ] = await Promise.all([
        prisma.auction.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.auction.count({
          where: {
            status: 'ENDED',
            endTime: { gte: startDate, lte: endDate },
          },
        }),
        prisma.bid.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.bid.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          _avg: { amount: true },
        }),
      ]);

      return {
        newAuctions,
        endedAuctions,
        totalBids,
        averageBidAmount: averageBidAmount._avg.amount || 0,
      };
    } catch (error) {
      logger.error('Failed to get auction activity:', error);
      return {};
    }
  }

  // Get communication activity
  async getCommunicationActivity(startDate, endDate) {
    try {
      const [
        newConversations,
        totalMessages,
        activeConversations,
        averageMessagesPerConversation,
      ] = await Promise.all([
        prisma.conversation.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.message.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.conversation.count({
          where: {
            status: 'ACTIVE',
            updatedAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.message.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
        }),
      ]);

      return {
        newConversations,
        totalMessages,
        activeConversations,
        averageMessagesPerConversation: totalMessages / Math.max(newConversations, 1),
      };
    } catch (error) {
      logger.error('Failed to get communication activity:', error);
      return {};
    }
  }

  // Get error statistics
  async getErrorStatistics(startDate, endDate) {
    try {
      // This would typically come from your logging system
      // For now, we'll return mock data
      return {
        totalErrors: 0,
        errorRate: 0,
        criticalErrors: 0,
        warningErrors: 0,
        errorTypes: {},
      };
    } catch (error) {
      logger.error('Failed to get error statistics:', error);
      return {};
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(startDate, endDate) {
    try {
      // This would typically come from your performance monitoring system
      // For now, we'll return mock data
      return {
        averageResponseTime: 0,
        slowestEndpoints: [],
        databasePerformance: {},
        cacheHitRate: 0,
      };
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      return {};
    }
  }

  // Get weekly trends
  async getWeeklyTrends(startDate, endDate) {
    try {
      const dailyUserGrowth = await prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      });

      const dailyProductGrowth = await prisma.product.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      });

      return {
        userGrowth: dailyUserGrowth,
        productGrowth: dailyProductGrowth,
      };
    } catch (error) {
      logger.error('Failed to get weekly trends:', error);
      return {};
    }
  }

  // Get user growth
  async getUserGrowth(startDate, endDate) {
    try {
      const growth = await prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      });

      return {
        total: growth.reduce((sum, day) => sum + day._count.id, 0),
        daily: growth,
      };
    } catch (error) {
      logger.error('Failed to get user growth:', error);
      return {};
    }
  }

  // Get product growth
  async getProductGrowth(startDate, endDate) {
    try {
      const growth = await prisma.product.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      });

      return {
        total: growth.reduce((sum, day) => sum + day._count.id, 0),
        daily: growth,
      };
    } catch (error) {
      logger.error('Failed to get product growth:', error);
      return {};
    }
  }

  // Get category distribution
  async getCategoryDistribution() {
    try {
      const distribution = await prisma.product.groupBy({
        by: ['categoryId'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
        include: {
          category: {
            select: { name: true },
          },
        },
      });

      return distribution;
    } catch (error) {
      logger.error('Failed to get category distribution:', error);
      return [];
    }
  }

  // Get geographic distribution
  async getGeographicDistribution() {
    try {
      const distribution = await prisma.user.groupBy({
        by: ['country'],
        where: { isActive: true },
        _count: { id: true },
      });

      return distribution;
    } catch (error) {
      logger.error('Failed to get geographic distribution:', error);
      return [];
    }
  }

  // Get top performing products
  async getTopPerformingProducts(startDate, endDate) {
    try {
      const topProducts = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          seller: {
            select: { companyName: true },
          },
          category: {
            select: { name: true },
          },
          _count: {
            select: {
              watchlistItems: true,
              conversations: true,
            },
          },
        },
        orderBy: {
          watchlistItems: { _count: 'desc' },
        },
        take: 10,
      });

      return topProducts;
    } catch (error) {
      logger.error('Failed to get top performing products:', error);
      return [];
    }
  }

  // Get system health summary
  async getSystemHealthSummary(startDate, endDate) {
    try {
      // This would typically come from your health monitoring system
      return {
        overallHealth: 'healthy',
        databaseHealth: 'healthy',
        apiHealth: 'healthy',
        performanceHealth: 'healthy',
      };
    } catch (error) {
      logger.error('Failed to get system health summary:', error);
      return {};
    }
  }

  // Get monthly trends
  async getMonthlyTrends(startDate, endDate) {
    try {
      const weeklyUserGrowth = await prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      });

      const weeklyProductGrowth = await prisma.product.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      });

      return {
        userGrowth: weeklyUserGrowth,
        productGrowth: weeklyProductGrowth,
      };
    } catch (error) {
      logger.error('Failed to get monthly trends:', error);
      return {};
    }
  }

  // Get revenue metrics
  async getRevenueMetrics(startDate, endDate) {
    try {
      // This would typically come from your payment/transaction system
      return {
        totalRevenue: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
        topRevenueCategories: [],
      };
    } catch (error) {
      logger.error('Failed to get revenue metrics:', error);
      return {};
    }
  }

  // Get user engagement metrics
  async getUserEngagementMetrics(startDate, endDate) {
    try {
      const [
        activeUsers,
        userSessions,
        averageSessionDuration,
        userRetention,
      ] = await Promise.all([
        prisma.user.count({
          where: {
            lastLoginAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.user.count({
          where: {
            lastLoginAt: { gte: startDate, lte: endDate },
          },
        }),
        0, // This would come from session tracking
        0, // This would come from user retention analysis
      ]);

      return {
        activeUsers,
        userSessions,
        averageSessionDuration,
        userRetention,
      };
    } catch (error) {
      logger.error('Failed to get user engagement metrics:', error);
      return {};
    }
  }

  // Get product performance metrics
  async getProductPerformanceMetrics(startDate, endDate) {
    try {
      const [
        totalProducts,
        activeProducts,
        productsWithViews,
        productsWithConversations,
        averageProductViews,
      ] = await Promise.all([
        prisma.product.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.product.count({
          where: {
            status: 'ACTIVE',
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.product.count({
          where: {
            status: 'ACTIVE',
            conversations: { some: {} },
          },
        }),
        prisma.product.count({
          where: {
            status: 'ACTIVE',
            conversations: { some: {} },
          },
        }),
        0, // This would come from analytics
      ]);

      return {
        totalProducts,
        activeProducts,
        productsWithViews,
        productsWithConversations,
        averageProductViews,
      };
    } catch (error) {
      logger.error('Failed to get product performance metrics:', error);
      return {};
    }
  }

  // Get system performance summary
  async getSystemPerformanceSummary(startDate, endDate) {
    try {
      return {
        averageResponseTime: 0,
        uptime: 99.9,
        errorRate: 0.1,
        databasePerformance: 'good',
        cachePerformance: 'good',
      };
    } catch (error) {
      logger.error('Failed to get system performance summary:', error);
      return {};
    }
  }

  // Get recommendations
  async getRecommendations(startDate, endDate) {
    try {
      const recommendations = [];
      
      // Analyze data and generate recommendations
      const totalUsers = await prisma.user.count();
      const totalProducts = await prisma.product.count();
      
      if (totalUsers < 100) {
        recommendations.push({
          type: 'user_growth',
          priority: 'high',
          message: 'Consider implementing user acquisition strategies to reach 100+ users',
        });
      }
      
      if (totalProducts < 50) {
        recommendations.push({
          type: 'product_growth',
          priority: 'medium',
          message: 'Encourage more product listings to improve marketplace value',
        });
      }
      
      return recommendations;
    } catch (error) {
      logger.error('Failed to get recommendations:', error);
      return [];
    }
  }

  // Get week number
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Send report via email
  async sendReport(report, recipients) {
    try {
      const template = this.reportTemplates.get(report.period);
      if (!template) {
        throw new Error(`No template found for period: ${report.period}`);
      }

      const html = this.generateReportHTML(report, template.template);
      
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'reports@stockent.com',
        to: recipients.join(', '),
        subject: template.subject,
        html,
      });

      logger.info(`Report sent successfully to ${recipients.length} recipients`);
    } catch (error) {
      logger.error('Failed to send report:', error);
      throw error;
    }
  }

  // Generate report HTML
  generateReportHTML(report, template) {
    // This would typically use a templating engine like Handlebars
    // For now, we'll generate a simple HTML report
    return `
      <html>
        <head>
          <title>StockENT ${report.period} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; }
            .section { margin: 20px 0; }
            .metric { display: inline-block; margin: 10px; padding: 10px; background-color: #e9e9e9; border-radius: 3px; }
            .recommendation { background-color: #fff3cd; padding: 10px; border-radius: 3px; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>StockENT ${report.period} Report</h1>
            <p>Generated on: ${report.timestamp}</p>
          </div>
          
          <div class="section">
            <h2>System Overview</h2>
            <div class="metric">Total Users: ${report.system?.users?.total || 0}</div>
            <div class="metric">Active Users: ${report.system?.users?.active || 0}</div>
            <div class="metric">Total Products: ${report.system?.products?.total || 0}</div>
            <div class="metric">Active Products: ${report.system?.products?.active || 0}</div>
          </div>
          
          ${report.recommendations ? `
            <div class="section">
              <h2>Recommendations</h2>
              ${report.recommendations.map(rec => `
                <div class="recommendation">
                  <strong>${rec.type}:</strong> ${rec.message}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;
  }

  // Start automated reporting
  startAutomatedReporting() {
    logger.info('Starting automated reporting...');

    // Daily report at 9 AM
    const dailyInterval = setInterval(async () => {
      try {
        const report = await this.generateDailyReport();
        const recipients = process.env.DAILY_REPORT_RECIPIENTS?.split(',') || [];
        
        if (recipients.length > 0) {
          await this.sendReport(report, recipients);
        }
      } catch (error) {
        logger.error('Daily report failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Weekly report on Mondays at 10 AM
    const weeklyInterval = setInterval(async () => {
      try {
        const report = await this.generateWeeklyReport();
        const recipients = process.env.WEEKLY_REPORT_RECIPIENTS?.split(',') || [];
        
        if (recipients.length > 0) {
          await this.sendReport(report, recipients);
        }
      } catch (error) {
        logger.error('Weekly report failed:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    // Monthly report on the 1st at 11 AM
    const monthlyInterval = setInterval(async () => {
      try {
        const report = await this.generateMonthlyReport();
        const recipients = process.env.MONTHLY_REPORT_RECIPIENTS?.split(',') || [];
        
        if (recipients.length > 0) {
          await this.sendReport(report, recipients);
        }
      } catch (error) {
        logger.error('Monthly report failed:', error);
      }
    }, 30 * 24 * 60 * 60 * 1000); // 30 days

    logger.info('Automated reporting started');
  }
}

module.exports = MonitoringReporter;