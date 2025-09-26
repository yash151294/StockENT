const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.queryMetrics = new Map();
    this.apiMetrics = new Map();
    this.startTime = Date.now();
  }

  // Track API endpoint performance
  trackAPIEndpoint(method, path, duration, statusCode, userId = null) {
    const key = `${method} ${path}`;
    const timestamp = new Date().toISOString();
    
    if (!this.apiMetrics.has(key)) {
      this.apiMetrics.set(key, {
        totalRequests: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0,
        successCount: 0,
        statusCodes: {},
        lastRequest: null,
        requests: [],
      });
    }

    const metric = this.apiMetrics.get(key);
    metric.totalRequests++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.totalRequests;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastRequest = timestamp;

    if (statusCode >= 400) {
      metric.errorCount++;
    } else {
      metric.successCount++;
    }

    metric.statusCodes[statusCode] = (metric.statusCodes[statusCode] || 0) + 1;

    // Keep only last 100 requests for detailed tracking
    metric.requests.push({
      timestamp,
      duration,
      statusCode,
      userId,
    });

    if (metric.requests.length > 100) {
      metric.requests.shift();
    }

    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn(`Slow API request: ${key} took ${duration}ms`, {
        method,
        path,
        duration,
        statusCode,
        userId,
      });
    }
  }

  // Track database query performance
  trackDatabaseQuery(query, duration, rowsAffected = null) {
    const timestamp = new Date().toISOString();
    const key = this.normalizeQuery(query);
    
    if (!this.queryMetrics.has(key)) {
      this.queryMetrics.set(key, {
        totalQueries: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalRowsAffected: 0,
        lastQuery: null,
        queries: [],
      });
    }

    const metric = this.queryMetrics.get(key);
    metric.totalQueries++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.totalQueries;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastQuery = timestamp;

    if (rowsAffected !== null) {
      metric.totalRowsAffected += rowsAffected;
    }

    // Keep only last 50 queries for detailed tracking
    metric.queries.push({
      timestamp,
      duration,
      rowsAffected,
    });

    if (metric.queries.length > 50) {
      metric.queries.shift();
    }

    // Log slow queries
    if (duration > 1000) { // 1 second
      logger.warn(`Slow database query: ${key} took ${duration}ms`, {
        query: key,
        duration,
        rowsAffected,
      });
    }
  }

  // Normalize SQL query for grouping
  normalizeQuery(query) {
    return query
      .replace(/\$\d+/g, '$N') // Replace parameter placeholders
      .replace(/\d+/g, 'N') // Replace numbers
      .replace(/'[^']*'/g, "'STRING'") // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Track system metrics
  trackSystemMetric(metricName, value, unit = null) {
    const timestamp = new Date().toISOString();
    
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, {
        values: [],
        unit,
        lastValue: null,
        lastUpdate: null,
      });
    }

    const metric = this.metrics.get(metricName);
    metric.values.push({ timestamp, value });
    metric.lastValue = value;
    metric.lastUpdate = timestamp;

    // Keep only last 1000 values
    if (metric.values.length > 1000) {
      metric.values.shift();
    }
  }

  // Get API performance summary
  getAPIPerformanceSummary() {
    const summary = {
      totalEndpoints: this.apiMetrics.size,
      totalRequests: 0,
      averageResponseTime: 0,
      slowestEndpoints: [],
      errorRate: 0,
      endpoints: [],
    };

    let totalDuration = 0;
    let totalRequests = 0;
    let totalErrors = 0;

    for (const [endpoint, metric] of this.apiMetrics) {
      totalRequests += metric.totalRequests;
      totalDuration += metric.totalDuration;
      totalErrors += metric.errorCount;

      summary.endpoints.push({
        endpoint,
        totalRequests: metric.totalRequests,
        averageDuration: metric.averageDuration,
        minDuration: metric.minDuration,
        maxDuration: metric.maxDuration,
        errorCount: metric.errorCount,
        successCount: metric.successCount,
        errorRate: metric.totalRequests > 0 ? metric.errorCount / metric.totalRequests : 0,
        lastRequest: metric.lastRequest,
      });
    }

    summary.totalRequests = totalRequests;
    summary.averageResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0;
    summary.errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    // Get slowest endpoints
    summary.slowestEndpoints = summary.endpoints
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10);

    return summary;
  }

  // Get database performance summary
  getDatabasePerformanceSummary() {
    const summary = {
      totalQueries: 0,
      averageQueryTime: 0,
      slowestQueries: [],
      mostFrequentQueries: [],
      queries: [],
    };

    let totalDuration = 0;
    let totalQueries = 0;

    for (const [query, metric] of this.queryMetrics) {
      totalQueries += metric.totalQueries;
      totalDuration += metric.totalDuration;

      summary.queries.push({
        query,
        totalQueries: metric.totalQueries,
        averageDuration: metric.averageDuration,
        minDuration: metric.minDuration,
        maxDuration: metric.maxDuration,
        totalRowsAffected: metric.totalRowsAffected,
        lastQuery: metric.lastQuery,
      });
    }

    summary.totalQueries = totalQueries;
    summary.averageQueryTime = totalQueries > 0 ? totalDuration / totalQueries : 0;

    // Get slowest queries
    summary.slowestQueries = summary.queries
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10);

    // Get most frequent queries
    summary.mostFrequentQueries = summary.queries
      .sort((a, b) => b.totalQueries - a.totalQueries)
      .slice(0, 10);

    return summary;
  }

  // Get system metrics summary
  getSystemMetricsSummary() {
    const summary = {
      metrics: {},
      uptime: Date.now() - this.startTime,
    };

    for (const [metricName, metric] of this.metrics) {
      const values = metric.values.map(v => v.value);
      const latest = metric.lastValue;
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      summary.metrics[metricName] = {
        unit: metric.unit,
        latest,
        average,
        min,
        max,
        count: values.length,
        lastUpdate: metric.lastUpdate,
      };
    }

    return summary;
  }

  // Get comprehensive performance report
  getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      api: this.getAPIPerformanceSummary(),
      database: this.getDatabasePerformanceSummary(),
      system: this.getSystemMetricsSummary(),
    };
  }

  // Get slow queries from database
  async getSlowQueriesFromDatabase() {
    try {
      const slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time,
          min_time,
          stddev_time
        FROM pg_stat_statements 
        WHERE mean_time > 1000 
        ORDER BY mean_time DESC 
        LIMIT 20
      `;

      return slowQueries;
    } catch (error) {
      logger.error('Failed to get slow queries from database:', error);
      return [];
    }
  }

  // Get database connection stats
  async getDatabaseConnectionStats() {
    try {
      const connectionStats = await prisma.$queryRaw`
        SELECT 
          state,
          COUNT(*) as count,
          MAX(now() - state_change) as max_idle_time
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
        ORDER BY count DESC
      `;

      return connectionStats;
    } catch (error) {
      logger.error('Failed to get database connection stats:', error);
      return [];
    }
  }

  // Get table statistics
  async getTableStatistics() {
    try {
      const tableStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        ORDER BY n_live_tup DESC
        LIMIT 20
      `;

      return tableStats;
    } catch (error) {
      logger.error('Failed to get table statistics:', error);
      return [];
    }
  }

  // Get index usage statistics
  async getIndexUsageStats() {
    try {
      const indexStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC
        LIMIT 20
      `;

      return indexStats;
    } catch (error) {
      logger.error('Failed to get index usage stats:', error);
      return [];
    }
  }

  // Get comprehensive database report
  async getDatabaseReport() {
    try {
      const [slowQueries, connectionStats, tableStats, indexStats] = await Promise.all([
        this.getSlowQueriesFromDatabase(),
        this.getDatabaseConnectionStats(),
        this.getTableStatistics(),
        this.getIndexUsageStats(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        slowQueries,
        connectionStats,
        tableStats,
        indexStats,
        performance: this.getDatabasePerformanceSummary(),
      };
    } catch (error) {
      logger.error('Failed to get database report:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // Clear old metrics (keep last 24 hours)
  cleanupOldMetrics() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Clean up API metrics
    for (const [endpoint, metric] of this.apiMetrics) {
      metric.requests = metric.requests.filter(r => new Date(r.timestamp) > cutoffTime);
    }

    // Clean up query metrics
    for (const [query, metric] of this.queryMetrics) {
      metric.queries = metric.queries.filter(q => new Date(q.timestamp) > cutoffTime);
    }

    // Clean up system metrics
    for (const [metricName, metric] of this.metrics) {
      metric.values = metric.values.filter(v => new Date(v.timestamp) > cutoffTime);
    }

    logger.info('Cleaned up old performance metrics');
  }

  // Start performance monitoring
  startMonitoring() {
    logger.info('Starting performance monitoring...');

    // Track system metrics periodically
    setInterval(() => {
      const usage = process.memoryUsage();
      this.trackSystemMetric('memory_heap_used', usage.heapUsed, 'bytes');
      this.trackSystemMetric('memory_heap_total', usage.heapTotal, 'bytes');
      this.trackSystemMetric('memory_external', usage.external, 'bytes');
      this.trackSystemMetric('memory_rss', usage.rss, 'bytes');
      
      const cpuUsage = process.cpuUsage();
      this.trackSystemMetric('cpu_user', cpuUsage.user, 'microseconds');
      this.trackSystemMetric('cpu_system', cpuUsage.system, 'microseconds');
    }, 30000); // Every 30 seconds

    // Cleanup old metrics daily
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    logger.info('Performance monitoring started');
  }
}

module.exports = PerformanceMonitor;