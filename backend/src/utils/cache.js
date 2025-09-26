const Redis = require('redis');
const { logger } = require('./logger');

// Redis client instance
let redisClient = null;

/**
 * Initialize Redis connection
 */
const initRedis = async () => {
  try {
    redisClient = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis connection refused');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis client connection ended');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
};

/**
 * Get Redis client
 */
const getRedisClient = () => {
  if (!redisClient) {
    logger.warn('Redis client not available, skipping cache operation');
    return null;
  }
  return redisClient;
};

/**
 * Set cache value
 */
const setCache = async (key, value, ttl = 3600) => {
  try {
    const client = getRedisClient();
    if (!client) return; // Skip if Redis not available

    const serializedValue = JSON.stringify(value);

    if (ttl > 0) {
      await client.setEx(key, ttl, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }

    logger.debug(`Cache set: ${key}`);
  } catch (error) {
    logger.error(`Failed to set cache for key ${key}:`, error);
    // Don't throw error, just log it
  }
};

/**
 * Get cache value
 */
const getCache = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) return null; // Return null if Redis not available

    const value = await client.get(key);

    if (value) {
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(value);
    }

    logger.debug(`Cache miss: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Failed to get cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Delete cache value
 */
const deleteCache = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
    logger.debug(`Cache deleted: ${key}`);
  } catch (error) {
    logger.error(`Failed to delete cache for key ${key}:`, error);
  }
};

/**
 * Delete multiple cache keys
 */
const deleteCachePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
      logger.debug(`Cache deleted pattern: ${pattern} (${keys.length} keys)`);
    }
  } catch (error) {
    logger.error(`Failed to delete cache pattern ${pattern}:`, error);
  }
};

/**
 * Check if cache key exists
 */
const existsCache = async (key) => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`Failed to check cache existence for key ${key}:`, error);
    return false;
  }
};

/**
 * Get cache TTL
 */
const getCacheTTL = async (key) => {
  try {
    const client = getRedisClient();
    const ttl = await client.ttl(key);
    return ttl;
  } catch (error) {
    logger.error(`Failed to get cache TTL for key ${key}:`, error);
    return -1;
  }
};

/**
 * Set cache TTL
 */
const setCacheTTL = async (key, ttl) => {
  try {
    const client = getRedisClient();
    await client.expire(key, ttl);
    logger.debug(`Cache TTL set: ${key} -> ${ttl}s`);
  } catch (error) {
    logger.error(`Failed to set cache TTL for key ${key}:`, error);
  }
};

/**
 * Increment cache value
 */
const incrementCache = async (key, value = 1) => {
  try {
    const client = getRedisClient();
    const result = await client.incrBy(key, value);
    logger.debug(`Cache incremented: ${key} -> ${result}`);
    return result;
  } catch (error) {
    logger.error(`Failed to increment cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Decrement cache value
 */
const decrementCache = async (key, value = 1) => {
  try {
    const client = getRedisClient();
    const result = await client.decrBy(key, value);
    logger.debug(`Cache decremented: ${key} -> ${result}`);
    return result;
  } catch (error) {
    logger.error(`Failed to decrement cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Set cache hash
 */
const setCacheHash = async (key, field, value, ttl = 3600) => {
  try {
    const client = getRedisClient();
    await client.hSet(key, field, JSON.stringify(value));

    if (ttl > 0) {
      await client.expire(key, ttl);
    }

    logger.debug(`Cache hash set: ${key}.${field}`);
  } catch (error) {
    logger.error(`Failed to set cache hash for key ${key}.${field}:`, error);
  }
};

/**
 * Get cache hash
 */
const getCacheHash = async (key, field) => {
  try {
    const client = getRedisClient();
    const value = await client.hGet(key, field);

    if (value) {
      logger.debug(`Cache hash hit: ${key}.${field}`);
      return JSON.parse(value);
    }

    logger.debug(`Cache hash miss: ${key}.${field}`);
    return null;
  } catch (error) {
    logger.error(`Failed to get cache hash for key ${key}.${field}:`, error);
    return null;
  }
};

/**
 * Get all cache hash fields
 */
const getCacheHashAll = async (key) => {
  try {
    const client = getRedisClient();
    const hash = await client.hGetAll(key);

    const result = {};
    for (const [field, value] of Object.entries(hash)) {
      result[field] = JSON.parse(value);
    }

    logger.debug(`Cache hash get all: ${key}`);
    return result;
  } catch (error) {
    logger.error(`Failed to get all cache hash for key ${key}:`, error);
    return {};
  }
};

/**
 * Delete cache hash field
 */
const deleteCacheHashField = async (key, field) => {
  try {
    const client = getRedisClient();
    await client.hDel(key, field);
    logger.debug(`Cache hash field deleted: ${key}.${field}`);
  } catch (error) {
    logger.error(`Failed to delete cache hash field ${key}.${field}:`, error);
  }
};

/**
 * Cache middleware
 */
const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl}`;
      const cachedData = await getCache(key);

      if (cachedData) {
        return res.json(cachedData);
      }

      // Store original res.json
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function (data) {
        // Try to cache, but don't fail if Redis is unavailable
        setCache(key, data, ttl).catch((err) => {
          logger.debug('Cache middleware: Failed to cache response', err);
        });
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear all cache
 */
const clearAllCache = async () => {
  try {
    const client = getRedisClient();
    await client.flushAll();
    logger.info('All cache cleared');
  } catch (error) {
    logger.error('Failed to clear all cache:', error);
  }
};

/**
 * Get cache info
 */
const getCacheInfo = async () => {
  try {
    const client = getRedisClient();
    const info = await client.info('memory');
    const keyspace = await client.info('keyspace');

    return {
      memory: info,
      keyspace: keyspace,
    };
  } catch (error) {
    logger.error('Failed to get cache info:', error);
    return null;
  }
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Failed to close Redis connection:', error);
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  existsCache,
  getCacheTTL,
  setCacheTTL,
  incrementCache,
  decrementCache,
  setCacheHash,
  getCacheHash,
  getCacheHashAll,
  deleteCacheHashField,
  cacheMiddleware,
  clearAllCache,
  getCacheInfo,
  closeRedis,
};
