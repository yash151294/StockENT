const { logger } = require('../utils/logger');

class MonitoringConfig {
  constructor() {
    this.config = {
      // Health check intervals (in milliseconds)
      healthCheck: {
        interval: 5 * 60 * 1000, // 5 minutes
        timeout: 30000, // 30 seconds
        retries: 3,
      },
      
      // Performance monitoring
      performance: {
        enabled: true,
        trackAPI: true,
        trackDatabase: true,
        trackSystem: true,
        slowQueryThreshold: 1000, // 1 second
        slowAPIThreshold: 2000, // 2 seconds
        metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
      },
      
      // Data quality monitoring
      dataQuality: {
        enabled: true,
        interval: 10 * 60 * 1000, // 10 minutes
        rules: {
          duplicateProducts: { threshold: 5, severity: 'medium' },
          productsWithoutImages: { threshold: 20, severity: 'medium' },
          incompleteProfiles: { threshold: 100, severity: 'low' },
          invalidPrices: { threshold: 0, severity: 'high' },
          orphanedRecords: { threshold: 10, severity: 'medium' },
        },
      },
      
      // Textile marketplace monitoring
      textileMarketplace: {
        enabled: true,
        interval: 15 * 60 * 1000, // 15 minutes
        inventorySync: {
          enabled: true,
          threshold: 10,
        },
        priceAccuracy: {
          enabled: true,
          suspiciousPriceThreshold: 0.01,
          highPriceThreshold: 100000,
        },
        imageUploads: {
          enabled: true,
          maxImagesPerProduct: 20,
          requiredImages: 1,
        },
        searchIndex: {
          enabled: true,
          performanceThreshold: 1000, // 1 second
        },
        communication: {
          enabled: true,
          staleConversationThreshold: 7, // days
          maxMessagesPerConversation: 100,
        },
      },
      
      // Alerting configuration
      alerting: {
        enabled: true,
        channels: {
          email: {
            enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
            recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
            from: process.env.SMTP_FROM || 'alerts@stockent.com',
          },
          slack: {
            enabled: process.env.SLACK_ALERTS_ENABLED === 'true',
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
          },
        },
        rules: {
          databaseConnectionFailure: {
            severity: 'high',
            cooldown: 10 * 60 * 1000, // 10 minutes
          },
          slowDatabaseQueries: {
            severity: 'medium',
            cooldown: 5 * 60 * 1000, // 5 minutes
          },
          apiEndpointFailures: {
            severity: 'high',
            cooldown: 5 * 60 * 1000, // 5 minutes
          },
          highMemoryUsage: {
            severity: 'high',
            cooldown: 5 * 60 * 1000, // 5 minutes
          },
          dataIntegrityIssues: {
            severity: 'medium',
            cooldown: 10 * 60 * 1000, // 10 minutes
          },
          suspiciousActivity: {
            severity: 'high',
            cooldown: 1 * 60 * 1000, // 1 minute
          },
        },
      },
      
      // Reporting configuration
      reporting: {
        enabled: true,
        schedules: {
          daily: {
            enabled: process.env.DAILY_REPORTS_ENABLED === 'true',
            time: '09:00', // 9 AM
            recipients: process.env.DAILY_REPORT_RECIPIENTS?.split(',') || [],
          },
          weekly: {
            enabled: process.env.WEEKLY_REPORTS_ENABLED === 'true',
            day: 'monday',
            time: '10:00', // 10 AM
            recipients: process.env.WEEKLY_REPORT_RECIPIENTS?.split(',') || [],
          },
          monthly: {
            enabled: process.env.MONTHLY_REPORTS_ENABLED === 'true',
            day: 1, // 1st of month
            time: '11:00', // 11 AM
            recipients: process.env.MONTHLY_REPORT_RECIPIENTS?.split(',') || [],
          },
        },
      },
      
      // Security monitoring
      security: {
        enabled: true,
        suspiciousPatterns: [
          /\.\.\//, // Directory traversal
          /<script/i, // XSS attempts
          /union\s+select/i, // SQL injection
          /drop\s+table/i, // SQL injection
          /delete\s+from/i, // SQL injection
          /exec\s*\(/i, // Command injection
          /eval\s*\(/i, // Code injection
        ],
        rateLimiting: {
          enabled: true,
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100,
          skipSuccessfulRequests: false,
        },
        ipWhitelist: process.env.IP_WHITELIST?.split(',') || [],
        ipBlacklist: process.env.IP_BLACKLIST?.split(',') || [],
      },
      
      // Database monitoring
      database: {
        enabled: true,
        connectionPool: {
          min: 2,
          max: 10,
          idle: 10000,
          acquire: 30000,
          evict: 1000,
        },
        slowQueryThreshold: 1000, // 1 second
        connectionTimeout: 30000, // 30 seconds
        queryTimeout: 60000, // 60 seconds
      },
      
      // Cache monitoring
      cache: {
        enabled: process.env.REDIS_URL ? true : false,
        redis: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        },
        ttl: {
          default: 3600, // 1 hour
          user: 1800, // 30 minutes
          product: 7200, // 2 hours
          category: 86400, // 24 hours
        },
      },
      
      // Logging configuration
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        file: {
          enabled: true,
          filename: 'logs/monitoring.log',
          maxSize: '10m',
          maxFiles: 5,
        },
        console: {
          enabled: process.env.NODE_ENV !== 'production',
        },
      },
    };
  }

  // Get configuration value
  get(path) {
    return this.getNestedValue(this.config, path);
  }

  // Set configuration value
  set(path, value) {
    this.setNestedValue(this.config, path, value);
  }

  // Get nested value from object
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Set nested value in object
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Validate configuration
  validate() {
    const errors = [];

    // Validate required environment variables
    if (this.config.alerting.channels.email.enabled && !process.env.SMTP_HOST) {
      errors.push('SMTP_HOST is required when email alerts are enabled');
    }

    if (this.config.alerting.channels.slack.enabled && !process.env.SLACK_WEBHOOK_URL) {
      errors.push('SLACK_WEBHOOK_URL is required when Slack alerts are enabled');
    }

    if (this.config.reporting.schedules.daily.enabled && !process.env.DAILY_REPORT_RECIPIENTS) {
      errors.push('DAILY_REPORT_RECIPIENTS is required when daily reports are enabled');
    }

    if (this.config.reporting.schedules.weekly.enabled && !process.env.WEEKLY_REPORT_RECIPIENTS) {
      errors.push('WEEKLY_REPORT_RECIPIENTS is required when weekly reports are enabled');
    }

    if (this.config.reporting.schedules.monthly.enabled && !process.env.MONTHLY_REPORT_RECIPIENTS) {
      errors.push('MONTHLY_REPORT_RECIPIENTS is required when monthly reports are enabled');
    }

    // Validate configuration values
    if (this.config.healthCheck.interval < 60000) {
      errors.push('Health check interval should be at least 1 minute');
    }

    if (this.config.performance.slowQueryThreshold < 100) {
      errors.push('Slow query threshold should be at least 100ms');
    }

    if (this.config.alerting.rules.databaseConnectionFailure.cooldown < 60000) {
      errors.push('Database connection failure cooldown should be at least 1 minute');
    }

    if (errors.length > 0) {
      logger.error('Configuration validation failed:', errors);
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    logger.info('Configuration validation passed');
    return true;
  }

  // Get monitoring status
  getMonitoringStatus() {
    return {
      healthCheck: this.config.healthCheck.enabled,
      performance: this.config.performance.enabled,
      dataQuality: this.config.dataQuality.enabled,
      textileMarketplace: this.config.textileMarketplace.enabled,
      alerting: this.config.alerting.enabled,
      reporting: this.config.reporting.enabled,
      security: this.config.security.enabled,
      database: this.config.database.enabled,
      cache: this.config.cache.enabled,
    };
  }

  // Update configuration
  updateConfig(updates) {
    Object.keys(updates).forEach(key => {
      if (this.config.hasOwnProperty(key)) {
        this.config[key] = { ...this.config[key], ...updates[key] };
      }
    });
    
    logger.info('Configuration updated:', updates);
  }

  // Reset to defaults
  resetToDefaults() {
    this.config = new MonitoringConfig().config;
    logger.info('Configuration reset to defaults');
  }

  // Export configuration
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  // Import configuration
  importConfig(configJson) {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...this.config, ...importedConfig };
      logger.info('Configuration imported successfully');
    } catch (error) {
      logger.error('Failed to import configuration:', error);
      throw error;
    }
  }
}

module.exports = MonitoringConfig;