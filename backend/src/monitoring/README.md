# StockENT Monitoring System

A comprehensive monitoring and alerting system for the StockENT B2B textile marketplace platform.

## Overview

The StockENT monitoring system provides real-time monitoring of:
- **Database health and performance**
- **API endpoint availability and performance**
- **Textile marketplace specific metrics**
- **Data quality and integrity**
- **System resources and security**
- **User activity and engagement**

## Features

### 🔍 Health Monitoring
- Database connection and query performance
- Redis cache status and performance
- API endpoint availability and response times
- System resource usage (CPU, memory, disk)
- Third-party service integrations

### 📊 Performance Monitoring
- API response time tracking
- Database query performance analysis
- Slow query detection and optimization
- System resource utilization
- Cache hit rates and effectiveness

### 🏭 Textile Marketplace Monitoring
- Inventory synchronization between sellers and platform
- Price accuracy and currency conversion validation
- Image and document upload functionality
- Search index consistency and performance
- User communication system integrity
- Category and geographic distribution analysis

### 🔒 Data Quality Monitoring
- Product data completeness validation
- Duplicate listing detection
- User profile completeness checks
- Data import/export process monitoring
- Orphaned record detection and cleanup

### 🚨 Alerting System
- Real-time alert notifications via email and Slack
- Configurable alert thresholds and cooldowns
- Alert history and resolution tracking
- Severity-based alert routing
- Custom alert rules for textile marketplace

### 📈 Reporting System
- Daily, weekly, and monthly automated reports
- Performance trend analysis
- User growth and engagement metrics
- Product performance analytics
- System health summaries

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring System                        │
├─────────────────────────────────────────────────────────────┤
│  Health Checker  │  Performance Monitor  │  Data Quality   │
│  - Database      │  - API Tracking       │  - Validation   │
│  - Redis         │  - Query Analysis     │  - Duplicates   │
│  - API Endpoints │  - System Metrics     │  - Orphans      │
│  - System        │  - Cache Performance │  - Integrity    │
├─────────────────────────────────────────────────────────────┤
│  Textile Marketplace Monitor  │  Alerting System            │
│  - Inventory Sync            │  - Email Notifications      │
│  - Price Accuracy            │  - Slack Integration       │
│  - Image Uploads             │  - Alert Rules              │
│  - Search Index              │  - Cooldown Management      │
│  - Communication             │  - History Tracking         │
├─────────────────────────────────────────────────────────────┤
│  Reporting System  │  Configuration Management             │
│  - Daily Reports  │  - Environment Variables               │
│  - Weekly Reports │  - Threshold Configuration             │
│  - Monthly Reports│  - Channel Configuration               │
│  - Custom Reports │  - Rule Management                    │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Environment Configuration

Copy the monitoring environment template:
```bash
cp .env.monitoring .env
```

Configure your monitoring settings in `.env`:
```env
# Email Alerts
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_RECIPIENTS=admin@stockent.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Slack Alerts
SLACK_ALERTS_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Reporting
DAILY_REPORTS_ENABLED=true
DAILY_REPORT_RECIPIENTS=admin@stockent.com
```

### 2. Start Monitoring

The monitoring system is automatically initialized when the server starts:

```bash
npm start
```

### 3. Access Monitoring Dashboard

- **Health Status**: `GET /api/monitoring/health`
- **Performance Metrics**: `GET /api/monitoring/performance`
- **Data Quality**: `GET /api/monitoring/data-quality`
- **Marketplace Health**: `GET /api/monitoring/marketplace`
- **Alerts**: `GET /api/monitoring/alerts`
- **Dashboard**: `GET /api/monitoring/dashboard`

## API Endpoints

### Health Monitoring
```http
GET /api/monitoring/health
GET /api/monitoring/health/quick
```

### Performance Monitoring
```http
GET /api/monitoring/performance
GET /api/monitoring/performance/database
```

### Data Quality
```http
GET /api/monitoring/data-quality
POST /api/monitoring/data-quality/fix
```

### Textile Marketplace
```http
GET /api/monitoring/marketplace
GET /api/monitoring/marketplace/stats
```

### Alerts
```http
GET /api/monitoring/alerts
PUT /api/monitoring/alerts/:alertId/resolve
```

### Dashboard
```http
GET /api/monitoring/dashboard
GET /api/monitoring/status
```

## Configuration

### Health Check Configuration
```javascript
{
  healthCheck: {
    interval: 300000,        // 5 minutes
    timeout: 30000,          // 30 seconds
    retries: 3
  }
}
```

### Performance Monitoring
```javascript
{
  performance: {
    enabled: true,
    trackAPI: true,
    trackDatabase: true,
    slowQueryThreshold: 1000,  // 1 second
    slowAPIThreshold: 2000     // 2 seconds
  }
}
```

### Data Quality Rules
```javascript
{
  dataQuality: {
    rules: {
      duplicateProducts: { threshold: 5, severity: 'medium' },
      productsWithoutImages: { threshold: 20, severity: 'medium' },
      incompleteProfiles: { threshold: 100, severity: 'low' },
      invalidPrices: { threshold: 0, severity: 'high' }
    }
  }
}
```

### Alert Configuration
```javascript
{
  alerting: {
    rules: {
      databaseConnectionFailure: {
        severity: 'high',
        cooldown: 600000  // 10 minutes
      },
      slowDatabaseQueries: {
        severity: 'medium',
        cooldown: 300000  // 5 minutes
      }
    }
  }
}
```

## Monitoring Components

### 1. Health Checker (`healthCheck.js`)
- Database connectivity and performance
- Redis cache status
- API endpoint availability
- System resource monitoring
- Textile marketplace specific checks

### 2. Performance Monitor (`performanceMonitor.js`)
- API response time tracking
- Database query performance
- System resource utilization
- Cache performance metrics
- Slow query detection

### 3. Data Quality Monitor (`dataQualityMonitor.js`)
- Product data validation
- Duplicate detection
- Orphaned record cleanup
- User profile completeness
- Data integrity checks

### 4. Textile Marketplace Monitor (`textileMarketplaceMonitor.js`)
- Inventory synchronization
- Price accuracy validation
- Image upload functionality
- Search index consistency
- User communication system

### 5. Alerting System (`alerting.js`)
- Real-time alert notifications
- Email and Slack integration
- Alert rule management
- Cooldown and escalation
- Alert history tracking

### 6. Reporting System (`reporting.js`)
- Automated report generation
- Daily, weekly, monthly reports
- Performance trend analysis
- User engagement metrics
- System health summaries

## Alert Rules

### Database Alerts
- **Database Connection Failure**: High severity, 10-minute cooldown
- **Slow Database Queries**: Medium severity, 5-minute cooldown
- **High Database Connections**: Medium severity, 5-minute cooldown

### API Alerts
- **API Endpoint Failures**: High severity, 5-minute cooldown
- **High API Error Rate**: Medium severity, 5-minute cooldown
- **Slow API Responses**: Medium severity, 5-minute cooldown

### System Alerts
- **High Memory Usage**: High severity, 5-minute cooldown
- **High CPU Usage**: Medium severity, 5-minute cooldown
- **Disk Space Low**: High severity, 30-minute cooldown

### Data Quality Alerts
- **Data Integrity Issues**: Medium severity, 10-minute cooldown
- **Orphaned Records**: Medium severity, 30-minute cooldown
- **Duplicate Products**: Low severity, 30-minute cooldown
- **Invalid Product Prices**: High severity, 5-minute cooldown

### Textile Marketplace Alerts
- **Inventory Sync Issues**: Medium severity, 15-minute cooldown
- **Price Accuracy Issues**: High severity, 5-minute cooldown
- **Image Upload Failures**: Medium severity, 15-minute cooldown
- **Search Index Issues**: Medium severity, 15-minute cooldown

## Reporting

### Daily Reports
- System health summary
- Performance metrics
- User activity
- Product activity
- Error statistics

### Weekly Reports
- User growth trends
- Product growth trends
- Category distribution
- Geographic distribution
- Top performing products

### Monthly Reports
- Revenue metrics
- User engagement
- Product performance
- System performance
- Recommendations

## Security Monitoring

### Suspicious Activity Detection
- Directory traversal attempts
- XSS injection attempts
- SQL injection attempts
- Command injection attempts
- Code injection attempts

### Rate Limiting
- API request rate limiting
- IP-based rate limiting
- User-based rate limiting
- Endpoint-specific limits

### IP Filtering
- IP whitelist support
- IP blacklist support
- Geographic filtering
- VPN detection

## Troubleshooting

### Common Issues

1. **Monitoring System Not Starting**
   - Check environment variables
   - Verify database connection
   - Check Redis connection
   - Review logs for errors

2. **Alerts Not Sending**
   - Verify SMTP configuration
   - Check Slack webhook URL
   - Verify recipient email addresses
   - Check alert rules configuration

3. **Performance Issues**
   - Check database query performance
   - Monitor system resources
   - Review slow query logs
   - Optimize database indexes

4. **Data Quality Issues**
   - Run data quality checks
   - Fix orphaned records
   - Clean up duplicate data
   - Validate data integrity

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
MONITORING_VERBOSE_LOGGING=true
```

### Test Monitoring System

```javascript
const monitoringSystem = require('./monitoring');

// Test all components
const testResults = await monitoringSystem.testMonitoring();
console.log(testResults);
```

## Best Practices

### 1. Configuration Management
- Use environment variables for sensitive data
- Implement configuration validation
- Use different configs for different environments
- Document all configuration options

### 2. Alert Management
- Set appropriate alert thresholds
- Use cooldown periods to prevent spam
- Implement alert escalation
- Regular alert rule review

### 3. Performance Optimization
- Monitor query performance regularly
- Optimize database indexes
- Use caching effectively
- Monitor system resources

### 4. Data Quality
- Implement data validation rules
- Regular data quality checks
- Automated cleanup processes
- Data integrity monitoring

### 5. Security
- Monitor for suspicious activity
- Implement rate limiting
- Use IP filtering
- Regular security audits

## Contributing

1. Follow the existing code structure
2. Add comprehensive tests
3. Update documentation
4. Follow coding standards
5. Submit pull requests

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation
- Review the troubleshooting guide