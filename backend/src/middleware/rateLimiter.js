const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100000 : 100, // Very permissive in development
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

/**
 * Auth rate limiter (stricter for login/register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // More permissive in development
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    });
  },
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many password reset attempts, please try again later.',
    });
  },
});

/**
 * API rate limiter (for API endpoints)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 200, // Very permissive in development
  message: {
    success: false,
    error: 'Too many API requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many API requests, please try again later.',
    });
  },
});

/**
 * Upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: {
    success: false,
    error: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many file uploads, please try again later.',
    });
  },
});

/**
 * Message rate limiter
 */
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 messages per minute
  message: {
    success: false,
    error: 'Too many messages sent, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Message rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many messages sent, please slow down.',
    });
  },
});

/**
 * Bid rate limiter
 */
const bidLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 bids per minute
  message: {
    success: false,
    error: 'Too many bids placed, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Bid rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many bids placed, please slow down.',
    });
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  uploadLimiter,
  messageLimiter,
  bidLimiter,
};
