const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const HealthChecker = require('./healthCheck');
const AlertingSystem = require('./alerting');
const PerformanceMonitor = require('./performanceMonitor');
const DataQualityMonitor = require('./dataQualityMonitor');
const TextileMarketplaceMonitor = require('./textileMarketplaceMonitor');
const { logger } = require('../utils/logger');

const router = express.Router();

// Initialize monitoring components
const healthChecker = new HealthChecker();
const alertingSystem = new AlertingSystem();
const performanceMonitor = new PerformanceMonitor();
const dataQualityMonitor = new DataQualityMonitor();
const textileMarketplaceMonitor = new TextileMarketplaceMonitor();

// Initialize alerting system
alertingSystem.initializeAlerts();

// Add notification channels
if (process.env.ALERT_EMAIL_RECIPIENTS) {
  const emailRecipients = process.env.ALERT_EMAIL_RECIPIENTS.split(',');
  alertingSystem.addNotificationChannel(
    alertingSystem.createEmailChannel(emailRecipients)
  );
}

if (process.env.SLACK_WEBHOOK_URL) {
  alertingSystem.addNotificationChannel(
    alertingSystem.createSlackChannel(process.env.SLACK_WEBHOOK_URL)
  );
}

// Start monitoring
healthChecker.startMonitoring();
performanceMonitor.startMonitoring();
dataQualityMonitor.startMonitoring();
textileMarketplaceMonitor.startMonitoring();

/**
 * @route   GET /api/monitoring/health
 * @desc    Get comprehensive health status
 * @access  Private (Admin)
 */
router.get('/health', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const healthResults = await healthChecker.runAllChecks();
    
    // Process alerts
    await alertingSystem.processHealthResults(healthResults);
    
    res.json({
      success: true,
      data: healthResults,
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/health/quick
 * @desc    Get quick health status
 * @access  Public
 */
router.get('/health/quick', [apiLimiter], async (req, res) => {
  try {
    const results = healthChecker.getLastResults();
    if (!results) {
      return res.json({
        success: true,
        data: {
          status: 'unknown',
          message: 'Health check not yet performed',
        },
      });
    }

    res.json({
      success: true,
      data: {
        status: results.overall.status,
        timestamp: results.overall.timestamp,
        summary: results.overall.summary,
      },
    });
  } catch (error) {
    logger.error('Quick health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Quick health check failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/performance
 * @desc    Get performance metrics
 * @access  Private (Admin)
 */
router.get('/performance', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const performanceReport = performanceMonitor.getPerformanceReport();
    res.json({
      success: true,
      data: performanceReport,
    });
  } catch (error) {
    logger.error('Performance monitoring failed:', error);
    res.status(500).json({
      success: false,
      error: 'Performance monitoring failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/performance/database
 * @desc    Get database performance report
 * @access  Private (Admin)
 */
router.get('/performance/database', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const databaseReport = await performanceMonitor.getDatabaseReport();
    res.json({
      success: true,
      data: databaseReport,
    });
  } catch (error) {
    logger.error('Database performance monitoring failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database performance monitoring failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/data-quality
 * @desc    Get data quality report
 * @access  Private (Admin)
 */
router.get('/data-quality', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const qualityReport = dataQualityMonitor.getQualityReport();
    res.json({
      success: true,
      data: qualityReport,
    });
  } catch (error) {
    logger.error('Data quality monitoring failed:', error);
    res.status(500).json({
      success: false,
      error: 'Data quality monitoring failed',
    });
  }
});

/**
 * @route   POST /api/monitoring/data-quality/fix
 * @desc    Fix data quality issues
 * @access  Private (Admin)
 */
router.post('/data-quality/fix', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const fixResults = await dataQualityMonitor.fixDataQualityIssues();
    res.json({
      success: true,
      data: fixResults,
    });
  } catch (error) {
    logger.error('Data quality fix failed:', error);
    res.status(500).json({
      success: false,
      error: 'Data quality fix failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/marketplace
 * @desc    Get textile marketplace health report
 * @access  Private (Admin)
 */
router.get('/marketplace', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const marketplaceReport = await textileMarketplaceMonitor.getMarketplaceHealthReport();
    res.json({
      success: true,
      data: marketplaceReport,
    });
  } catch (error) {
    logger.error('Marketplace monitoring failed:', error);
    res.status(500).json({
      success: false,
      error: 'Marketplace monitoring failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/marketplace/stats
 * @desc    Get marketplace statistics
 * @access  Private (Admin)
 */
router.get('/marketplace/stats', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const marketplaceStats = await textileMarketplaceMonitor.getMarketplaceStatistics();
    res.json({
      success: true,
      data: marketplaceStats,
    });
  } catch (error) {
    logger.error('Marketplace statistics failed:', error);
    res.status(500).json({
      success: false,
      error: 'Marketplace statistics failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/alerts
 * @desc    Get alert history
 * @access  Private (Admin)
 */
router.get('/alerts', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const { limit = 100, severity, resolved } = req.query;
    
    let alerts = alertingSystem.getAlertHistory(parseInt(limit));
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      alerts = alerts.filter(alert => alert.resolved === isResolved);
    }
    
    res.json({
      success: true,
      data: {
        alerts,
        stats: alertingSystem.getAlertStats(),
      },
    });
  } catch (error) {
    logger.error('Alert history failed:', error);
    res.status(500).json({
      success: false,
      error: 'Alert history failed',
    });
  }
});

/**
 * @route   PUT /api/monitoring/alerts/:alertId/resolve
 * @desc    Resolve an alert
 * @access  Private (Admin)
 */
router.put('/alerts/:alertId/resolve', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const { alertId } = req.params;
    alertingSystem.resolveAlert(alertId);
    
    res.json({
      success: true,
      message: 'Alert resolved successfully',
    });
  } catch (error) {
    logger.error('Alert resolution failed:', error);
    res.status(500).json({
      success: false,
      error: 'Alert resolution failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/dashboard
 * @desc    Get monitoring dashboard data
 * @access  Private (Admin)
 */
router.get('/dashboard', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const [
      healthResults,
      performanceReport,
      qualityReport,
      marketplaceReport,
      alertStats,
    ] = await Promise.all([
      healthChecker.getLastResults(),
      performanceMonitor.getPerformanceReport(),
      dataQualityMonitor.getQualityReport(),
      textileMarketplaceMonitor.getMarketplaceHealthReport(),
      alertingSystem.getAlertStats(),
    ]);

    res.json({
      success: true,
      data: {
        health: healthResults,
        performance: performanceReport,
        dataQuality: qualityReport,
        marketplace: marketplaceReport,
        alerts: alertStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Monitoring dashboard failed:', error);
    res.status(500).json({
      success: false,
      error: 'Monitoring dashboard failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/duplicates
 * @desc    Get duplicate products
 * @access  Private (Admin)
 */
router.get('/duplicates', [authenticateToken, requireRole(['ADMIN']), apiLimiter], async (req, res) => {
  try {
    const duplicates = await dataQualityMonitor.getDuplicateProducts();
    res.json({
      success: true,
      data: duplicates,
    });
  } catch (error) {
    logger.error('Duplicate products check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Duplicate products check failed',
    });
  }
});

/**
 * @route   GET /api/monitoring/status
 * @desc    Get overall monitoring status
 * @access  Public
 */
router.get('/status', [apiLimiter], async (req, res) => {
  try {
    const healthResults = healthChecker.getLastResults();
    const alertStats = alertingSystem.getAlertStats();
    
    const status = {
      monitoring: 'active',
      health: healthResults?.overall?.status || 'unknown',
      alerts: {
        active: alertStats.active,
        total: alertStats.total,
      },
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Monitoring status failed:', error);
    res.status(500).json({
      success: false,
      error: 'Monitoring status failed',
    });
  }
});

module.exports = router;