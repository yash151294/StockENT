const { logger } = require('../utils/logger');

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const startCpuUsage = process.cpuUsage();
  
  // Store original methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Track response
  res.send = function(data) {
    trackPerformance(req, res, startTime, startCpuUsage);
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    trackPerformance(req, res, startTime, startCpuUsage);
    return originalJson.call(this, data);
  };
  
  next();
};

// Track performance metrics
function trackPerformance(req, res, startTime, startCpuUsage) {
  const duration = Date.now() - startTime;
  const cpuUsage = process.cpuUsage(startCpuUsage);
  
  // Get performance monitor instance
  const PerformanceMonitor = require('../monitoring/performanceMonitor');
  const performanceMonitor = new PerformanceMonitor();
  
  // Track API endpoint performance
  performanceMonitor.trackAPIEndpoint(
    req.method,
    req.route?.path || req.path,
    duration,
    res.statusCode,
    req.user?.id
  );
  
  // Track system metrics
  const memoryUsage = process.memoryUsage();
  performanceMonitor.trackSystemMetric('memory_heap_used', memoryUsage.heapUsed);
  performanceMonitor.trackSystemMetric('memory_heap_total', memoryUsage.heapTotal);
  performanceMonitor.trackSystemMetric('cpu_user', cpuUsage.user);
  performanceMonitor.trackSystemMetric('cpu_system', cpuUsage.system);
  
  // Log slow requests
  if (duration > 2000) { // 2 seconds
    logger.warn('Slow API request detected', {
      method: req.method,
      path: req.path,
      duration: `${duration}ms`,
      statusCode: res.statusCode,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  }
  
  // Log error responses
  if (res.statusCode >= 400) {
    logger.error('API error response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  }
}

// Database query monitoring middleware
const databaseMonitoring = (req, res, next) => {
  // Store original query method
  const originalQuery = req.db?.$queryRaw;
  
  if (originalQuery) {
    req.db.$queryRaw = function(query, ...args) {
      const startTime = Date.now();
      
      return originalQuery.call(this, query, ...args)
        .then(result => {
          const duration = Date.now() - startTime;
          
          // Get performance monitor instance
          const PerformanceMonitor = require('../monitoring/performanceMonitor');
          const performanceMonitor = new PerformanceMonitor();
          
          // Track database query performance
          performanceMonitor.trackDatabaseQuery(
            query.toString(),
            duration,
            Array.isArray(result) ? result.length : null
          );
          
          return result;
        })
        .catch(error => {
          const duration = Date.now() - startTime;
          
          logger.error('Database query error', {
            query: query.toString(),
            duration: `${duration}ms`,
            error: error.message,
            userId: req.user?.id,
          });
          
          throw error;
        });
    };
  }
  
  next();
};

// Security monitoring middleware
const securityMonitoring = (req, res, next) => {
  // Track suspicious activity
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /delete\s+from/i, // SQL injection
  ];
  
  const requestString = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers,
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      logger.warn('Suspicious request detected', {
        pattern: pattern.toString(),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
      });
      
      // You might want to implement rate limiting or blocking here
      break;
    }
  }
  
  next();
};

// Rate limiting monitoring
const rateLimitMonitoring = (req, res, next) => {
  const key = `rate_limit:${req.ip}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;
  
  // This is a simplified rate limiting check
  // In production, you'd use Redis or a proper rate limiting library
  
  next();
};

// Error monitoring middleware
const errorMonitoring = (err, req, res, next) => {
  // Log error details
  logger.error('API error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  
  // Track error metrics
  const PerformanceMonitor = require('../monitoring/performanceMonitor');
  const performanceMonitor = new PerformanceMonitor();
  
  performanceMonitor.trackSystemMetric('api_errors', 1);
  
  next(err);
};

// Textile marketplace specific monitoring
const textileMarketplaceMonitoring = (req, res, next) => {
  // Track textile-specific metrics
  if (req.path.includes('/products')) {
    // Track product-related requests
    const TextileMarketplaceMonitor = require('../monitoring/textileMarketplaceMonitor');
    const textileMonitor = new TextileMarketplaceMonitor();
    
    // You can add specific textile marketplace tracking here
  }
  
  if (req.path.includes('/auctions')) {
    // Track auction-related requests
    // Add auction-specific monitoring
  }
  
  if (req.path.includes('/messages')) {
    // Track communication-related requests
    // Add communication monitoring
  }
  
  next();
};

module.exports = {
  performanceMonitoring,
  databaseMonitoring,
  securityMonitoring,
  rateLimitMonitoring,
  errorMonitoring,
  textileMarketplaceMonitoring,
};