const { logger } = require('../utils/logger');
const nodemailer = require('nodemailer');

class AlertingSystem {
  constructor() {
    this.alertRules = new Map();
    this.alertHistory = [];
    this.notificationChannels = [];
    this.alertCooldowns = new Map();
    this.setupEmailTransporter();
  }

  // Setup email transporter for alerts
  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Add alert rule
  addAlertRule(name, condition, severity = 'medium', cooldown = 300000) {
    this.alertRules.set(name, {
      condition,
      severity,
      cooldown,
      lastTriggered: null,
    });
  }

  // Check if alert should be triggered
  shouldTriggerAlert(ruleName, currentValue) {
    const rule = this.alertRules.get(ruleName);
    if (!rule) return false;

    // Check cooldown
    const now = Date.now();
    if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
      return false;
    }

    // Check condition
    return rule.condition(currentValue);
  }

  // Send alert
  async sendAlert(ruleName, message, data = {}) {
    const rule = this.alertRules.get(ruleName);
    if (!rule) return;

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleName,
      severity: rule.severity,
      message,
      data,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    // Add to history
    this.alertHistory.push(alert);
    rule.lastTriggered = Date.now();

    // Send notifications
    await this.sendNotifications(alert);

    logger.error(`ALERT: ${ruleName} - ${message}`, { alert, data });
  }

  // Send notifications through all channels
  async sendNotifications(alert) {
    for (const channel of this.notificationChannels) {
      try {
        await channel.send(alert);
      } catch (error) {
        logger.error(`Failed to send alert through channel ${channel.name}:`, error);
      }
    }
  }

  // Add notification channel
  addNotificationChannel(channel) {
    this.notificationChannels.push(channel);
  }

  // Email notification channel
  createEmailChannel(recipients = []) {
    return {
      name: 'email',
      send: async (alert) => {
        if (recipients.length === 0) return;

        const subject = `[${alert.severity.toUpperCase()}] StockENT Alert: ${alert.ruleName}`;
        const html = `
          <h2>StockENT System Alert</h2>
          <p><strong>Rule:</strong> ${alert.ruleName}</p>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Time:</strong> ${alert.timestamp}</p>
          <h3>Details:</h3>
          <pre>${JSON.stringify(alert.data, null, 2)}</pre>
        `;

        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'alerts@stockent.com',
          to: recipients.join(', '),
          subject,
          html,
        });
      },
    };
  }

  // Slack notification channel
  createSlackChannel(webhookUrl) {
    return {
      name: 'slack',
      send: async (alert) => {
        const axios = require('axios');
        const color = alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'good';
        
        await axios.post(webhookUrl, {
          attachments: [{
            color,
            title: `StockENT Alert: ${alert.ruleName}`,
            text: alert.message,
            fields: [
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Time', value: alert.timestamp, short: true },
            ],
            footer: 'StockENT Monitoring System',
          }],
        });
      },
    };
  }

  // Database monitoring alerts
  setupDatabaseAlerts() {
    // Database connection failure
    this.addAlertRule(
      'database_connection_failure',
      (result) => result.status === 'unhealthy',
      'high',
      600000 // 10 minutes cooldown
    );

    // Slow database queries
    this.addAlertRule(
      'slow_database_queries',
      (result) => result.details?.responseTime > 5000,
      'medium',
      300000 // 5 minutes cooldown
    );

    // Database response time degradation
    this.addAlertRule(
      'database_response_time',
      (result) => result.details?.responseTime > 2000,
      'medium',
      300000
    );
  }

  // API monitoring alerts
  setupAPIAlerts() {
    // API endpoint failures
    this.addAlertRule(
      'api_endpoint_failures',
      (result) => result.status === 'unhealthy' || result.details?.unhealthyEndpoints > 0,
      'high',
      300000
    );

    // High API error rate
    this.addAlertRule(
      'high_api_error_rate',
      (result) => {
        const errorRate = result.details?.unhealthyEndpoints / result.details?.totalEndpoints;
        return errorRate > 0.1; // 10% error rate
      },
      'medium',
      300000
    );
  }

  // System resource alerts
  setupSystemAlerts() {
    // High memory usage
    this.addAlertRule(
      'high_memory_usage',
      (result) => result.details?.memory?.percent > 90,
      'high',
      300000
    );

    // High CPU usage
    this.addAlertRule(
      'high_cpu_usage',
      (result) => result.details?.cpu?.user > 1000000, // 1 second of CPU time
      'medium',
      300000
    );
  }

  // Textile marketplace specific alerts
  setupTextileAlerts() {
    // Data integrity issues
    this.addAlertRule(
      'data_integrity_issues',
      (result) => result.details?.issues?.length > 0,
      'medium',
      600000
    );

    // Orphaned records
    this.addAlertRule(
      'orphaned_records',
      (result) => result.details?.orphanedImages > 10,
      'low',
      1800000 // 30 minutes cooldown
    );

    // Inconsistent auctions
    this.addAlertRule(
      'inconsistent_auctions',
      (result) => result.details?.inconsistentAuctions > 0,
      'medium',
      300000
    );

    // Too many unverified sellers
    this.addAlertRule(
      'unverified_sellers_backlog',
      (result) => result.details?.unverifiedSellers > 50,
      'low',
      3600000 // 1 hour cooldown
    );
  }

  // Data quality alerts
  setupDataQualityAlerts() {
    // Duplicate products
    this.addAlertRule(
      'duplicate_products',
      (result) => result.details?.duplicateProducts > 5,
      'low',
      1800000
    );

    // Products without images
    this.addAlertRule(
      'products_without_images',
      (result) => result.details?.productsWithoutImages > 20,
      'medium',
      1800000
    );

    // Incomplete user profiles
    this.addAlertRule(
      'incomplete_profiles',
      (result) => result.details?.incompleteProfiles > 100,
      'low',
      3600000
    );

    // Invalid product prices
    this.addAlertRule(
      'invalid_product_prices',
      (result) => result.details?.invalidPrices > 0,
      'medium',
      300000
    );
  }

  // Performance alerts
  setupPerformanceAlerts() {
    // Slow queries detected
    this.addAlertRule(
      'slow_queries_detected',
      (result) => result.details?.slowQueries > 5,
      'medium',
      1800000
    );

    // High database connection count
    this.addAlertRule(
      'high_database_connections',
      (result) => {
        const activeConnections = result.details?.connectionStats?.find(c => c.state === 'active')?.count || 0;
        return activeConnections > 50;
      },
      'medium',
      300000
    );
  }

  // Security alerts
  setupSecurityAlerts() {
    // Suspicious login attempts
    this.addAlertRule(
      'suspicious_login_attempts',
      (result) => result.details?.failedLogins > 10,
      'high',
      300000
    );

    // Unusual API usage patterns
    this.addAlertRule(
      'unusual_api_usage',
      (result) => result.details?.unusualPatterns > 0,
      'medium',
      600000
    );
  }

  // Initialize all alert rules
  initializeAlerts() {
    this.setupDatabaseAlerts();
    this.setupAPIAlerts();
    this.setupSystemAlerts();
    this.setupTextileAlerts();
    this.setupDataQualityAlerts();
    this.setupPerformanceAlerts();
    this.setupSecurityAlerts();

    logger.info(`Initialized ${this.alertRules.size} alert rules`);
  }

  // Process health check results and trigger alerts
  async processHealthResults(results) {
    for (const [checkName, result] of Object.entries(results)) {
      if (checkName === 'overall') continue;

      // Check each alert rule
      for (const [ruleName, rule] of this.alertRules) {
        if (this.shouldTriggerAlert(ruleName, result)) {
          await this.sendAlert(
            ruleName,
            `${checkName} check failed: ${result.error || 'Unknown error'}`,
            result
          );
        }
      }
    }
  }

  // Get alert history
  getAlertHistory(limit = 100) {
    return this.alertHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Get active alerts (unresolved)
  getActiveAlerts() {
    return this.alertHistory.filter(alert => !alert.resolved);
  }

  // Resolve alert
  resolveAlert(alertId) {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      logger.info(`Alert resolved: ${alertId}`);
    }
  }

  // Get alert statistics
  getAlertStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const last24hAlerts = this.alertHistory.filter(a => new Date(a.timestamp) > last24h);
    const last7dAlerts = this.alertHistory.filter(a => new Date(a.timestamp) > last7d);

    return {
      total: this.alertHistory.length,
      active: this.getActiveAlerts().length,
      last24h: last24hAlerts.length,
      last7d: last7dAlerts.length,
      bySeverity: {
        high: this.alertHistory.filter(a => a.severity === 'high').length,
        medium: this.alertHistory.filter(a => a.severity === 'medium').length,
        low: this.alertHistory.filter(a => a.severity === 'low').length,
      },
    };
  }
}

module.exports = AlertingSystem;