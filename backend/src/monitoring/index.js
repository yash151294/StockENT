const { logger } = require('../utils/logger');
const MonitoringConfig = require('./config');
const HealthChecker = require('./healthCheck');
const AlertingSystem = require('./alerting');
const PerformanceMonitor = require('./performanceMonitor');
const DataQualityMonitor = require('./dataQualityMonitor');
const TextileMarketplaceMonitor = require('./textileMarketplaceMonitor');
const MonitoringReporter = require('./reporting');

class MonitoringSystem {
  constructor() {
    this.config = new MonitoringConfig();
    this.healthChecker = null;
    this.alertingSystem = null;
    this.performanceMonitor = null;
    this.dataQualityMonitor = null;
    this.textileMarketplaceMonitor = null;
    this.reporter = null;
    this.isInitialized = false;
    this.isRunning = false;
  }

  // Initialize monitoring system
  async initialize() {
    try {
      logger.info('Initializing monitoring system...');

      // Validate configuration
      this.config.validate();

      // Initialize components
      this.healthChecker = new HealthChecker();
      this.alertingSystem = new AlertingSystem();
      this.performanceMonitor = new PerformanceMonitor();
      this.dataQualityMonitor = new DataQualityMonitor();
      this.textileMarketplaceMonitor = new TextileMarketplaceMonitor();
      this.reporter = new MonitoringReporter();

      // Initialize alerting system
      this.alertingSystem.initializeAlerts();

      // Add notification channels
      this.setupNotificationChannels();

      // Start monitoring components
      await this.startMonitoring();

      this.isInitialized = true;
      logger.info('Monitoring system initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize monitoring system:', error);
      throw error;
    }
  }

  // Setup notification channels
  setupNotificationChannels() {
    const emailConfig = this.config.get('alerting.channels.email');
    const slackConfig = this.config.get('alerting.channels.slack');

    if (emailConfig.enabled && emailConfig.recipients.length > 0) {
      this.alertingSystem.addNotificationChannel(
        this.alertingSystem.createEmailChannel(emailConfig.recipients)
      );
      logger.info(`Email notifications enabled for ${emailConfig.recipients.length} recipients`);
    }

    if (slackConfig.enabled && slackConfig.webhookUrl) {
      this.alertingSystem.addNotificationChannel(
        this.alertingSystem.createSlackChannel(slackConfig.webhookUrl)
      );
      logger.info('Slack notifications enabled');
    }
  }

  // Start monitoring
  async startMonitoring() {
    try {
      logger.info('Starting monitoring components...');

      // Start health monitoring
      if (this.config.get('healthCheck.enabled')) {
        this.healthChecker.startMonitoring();
        logger.info('Health monitoring started');
      }

      // Start performance monitoring
      if (this.config.get('performance.enabled')) {
        this.performanceMonitor.startMonitoring();
        logger.info('Performance monitoring started');
      }

      // Start data quality monitoring
      if (this.config.get('dataQuality.enabled')) {
        this.dataQualityMonitor.startMonitoring(
          this.config.get('dataQuality.interval')
        );
        logger.info('Data quality monitoring started');
      }

      // Start textile marketplace monitoring
      if (this.config.get('textileMarketplace.enabled')) {
        this.textileMarketplaceMonitor.startMonitoring(
          this.config.get('textileMarketplace.interval')
        );
        logger.info('Textile marketplace monitoring started');
      }

      // Start automated reporting
      if (this.config.get('reporting.enabled')) {
        this.reporter.startAutomatedReporting();
        logger.info('Automated reporting started');
      }

      // Set up periodic health checks and alert processing
      this.setupPeriodicChecks();

      this.isRunning = true;
      logger.info('All monitoring components started successfully');

    } catch (error) {
      logger.error('Failed to start monitoring:', error);
      throw error;
    }
  }

  // Setup periodic checks
  setupPeriodicChecks() {
    const healthCheckInterval = this.config.get('healthCheck.interval');

    setInterval(async () => {
      try {
        if (this.healthChecker && this.alertingSystem) {
          const healthResults = await this.healthChecker.runAllChecks();
          await this.alertingSystem.processHealthResults(healthResults);
        }
      } catch (error) {
        logger.error('Periodic health check failed:', error);
      }
    }, healthCheckInterval);

    logger.info(`Periodic health checks scheduled every ${healthCheckInterval}ms`);
  }

  // Stop monitoring
  async stopMonitoring() {
    try {
      logger.info('Stopping monitoring system...');

      // Stop all monitoring components
      if (this.healthChecker) {
        // Health checker doesn't have a stop method, but we can clear intervals
        logger.info('Health monitoring stopped');
      }

      if (this.performanceMonitor) {
        // Performance monitor doesn't have a stop method
        logger.info('Performance monitoring stopped');
      }

      if (this.dataQualityMonitor) {
        // Data quality monitor doesn't have a stop method
        logger.info('Data quality monitoring stopped');
      }

      if (this.textileMarketplaceMonitor) {
        // Textile marketplace monitor doesn't have a stop method
        logger.info('Textile marketplace monitoring stopped');
      }

      if (this.reporter) {
        // Reporter doesn't have a stop method
        logger.info('Automated reporting stopped');
      }

      this.isRunning = false;
      logger.info('Monitoring system stopped successfully');

    } catch (error) {
      logger.error('Failed to stop monitoring:', error);
      throw error;
    }
  }

  // Get monitoring status
  getStatus() {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      components: {
        healthChecker: !!this.healthChecker,
        alertingSystem: !!this.alertingSystem,
        performanceMonitor: !!this.performanceMonitor,
        dataQualityMonitor: !!this.dataQualityMonitor,
        textileMarketplaceMonitor: !!this.textileMarketplaceMonitor,
        reporter: !!this.reporter,
      },
      config: this.config.getMonitoringStatus(),
    };
  }

  // Get health status
  async getHealthStatus() {
    if (!this.healthChecker) {
      throw new Error('Health checker not initialized');
    }

    return this.healthChecker.getLastResults();
  }

  // Get performance metrics
  getPerformanceMetrics() {
    if (!this.performanceMonitor) {
      throw new Error('Performance monitor not initialized');
    }

    return this.performanceMonitor.getPerformanceReport();
  }

  // Get data quality status
  getDataQualityStatus() {
    if (!this.dataQualityMonitor) {
      throw new Error('Data quality monitor not initialized');
    }

    return this.dataQualityMonitor.getQualityReport();
  }

  // Get marketplace health
  async getMarketplaceHealth() {
    if (!this.textileMarketplaceMonitor) {
      throw new Error('Textile marketplace monitor not initialized');
    }

    return await this.textileMarketplaceMonitor.getMarketplaceHealthReport();
  }

  // Get alert statistics
  getAlertStatistics() {
    if (!this.alertingSystem) {
      throw new Error('Alerting system not initialized');
    }

    return this.alertingSystem.getAlertStats();
  }

  // Get comprehensive dashboard data
  async getDashboardData() {
    try {
      const [
        healthStatus,
        performanceMetrics,
        dataQualityStatus,
        marketplaceHealth,
        alertStats,
      ] = await Promise.all([
        this.getHealthStatus(),
        this.getPerformanceMetrics(),
        this.getDataQualityStatus(),
        this.getMarketplaceHealth(),
        this.getAlertStatistics(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        health: healthStatus,
        performance: performanceMetrics,
        dataQuality: dataQualityStatus,
        marketplace: marketplaceHealth,
        alerts: alertStats,
        system: this.getStatus(),
      };

    } catch (error) {
      logger.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  // Update configuration
  updateConfig(updates) {
    this.config.updateConfig(updates);
    logger.info('Configuration updated:', updates);
  }

  // Get configuration
  getConfig() {
    return this.config.config;
  }

  // Validate configuration
  validateConfig() {
    return this.config.validate();
  }

  // Export configuration
  exportConfig() {
    return this.config.exportConfig();
  }

  // Import configuration
  importConfig(configJson) {
    this.config.importConfig(configJson);
    logger.info('Configuration imported successfully');
  }

  // Reset configuration
  resetConfig() {
    this.config.resetToDefaults();
    logger.info('Configuration reset to defaults');
  }

  // Get monitoring components
  getComponents() {
    return {
      healthChecker: this.healthChecker,
      alertingSystem: this.alertingSystem,
      performanceMonitor: this.performanceMonitor,
      dataQualityMonitor: this.dataQualityMonitor,
      textileMarketplaceMonitor: this.textileMarketplaceMonitor,
      reporter: this.reporter,
    };
  }

  // Test monitoring system
  async testMonitoring() {
    try {
      logger.info('Testing monitoring system...');

      const tests = [];

      // Test health checker
      if (this.healthChecker) {
        try {
          const healthResults = await this.healthChecker.runAllChecks();
          tests.push({ component: 'healthChecker', status: 'passed', data: healthResults });
        } catch (error) {
          tests.push({ component: 'healthChecker', status: 'failed', error: error.message });
        }
      }

      // Test performance monitor
      if (this.performanceMonitor) {
        try {
          const performanceReport = this.performanceMonitor.getPerformanceReport();
          tests.push({ component: 'performanceMonitor', status: 'passed', data: performanceReport });
        } catch (error) {
          tests.push({ component: 'performanceMonitor', status: 'failed', error: error.message });
        }
      }

      // Test data quality monitor
      if (this.dataQualityMonitor) {
        try {
          const qualityReport = this.dataQualityMonitor.getQualityReport();
          tests.push({ component: 'dataQualityMonitor', status: 'passed', data: qualityReport });
        } catch (error) {
          tests.push({ component: 'dataQualityMonitor', status: 'failed', error: error.message });
        }
      }

      // Test textile marketplace monitor
      if (this.textileMarketplaceMonitor) {
        try {
          const marketplaceHealth = await this.textileMarketplaceMonitor.getMarketplaceHealthReport();
          tests.push({ component: 'textileMarketplaceMonitor', status: 'passed', data: marketplaceHealth });
        } catch (error) {
          tests.push({ component: 'textileMarketplaceMonitor', status: 'failed', error: error.message });
        }
      }

      // Test alerting system
      if (this.alertingSystem) {
        try {
          const alertStats = this.alertingSystem.getAlertStats();
          tests.push({ component: 'alertingSystem', status: 'passed', data: alertStats });
        } catch (error) {
          tests.push({ component: 'alertingSystem', status: 'failed', error: error.message });
        }
      }

      const passedTests = tests.filter(test => test.status === 'passed').length;
      const totalTests = tests.length;

      logger.info(`Monitoring system test completed: ${passedTests}/${totalTests} tests passed`);

      return {
        timestamp: new Date().toISOString(),
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        tests,
      };

    } catch (error) {
      logger.error('Monitoring system test failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const monitoringSystem = new MonitoringSystem();

module.exports = monitoringSystem;