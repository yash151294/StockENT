const jwt = require('jsonwebtoken');
const { getPrismaClient } = require('../utils/prisma');

const prisma = getPrismaClient();

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Try to get token from cookies first, then from Authorization header
    const token =
      req.cookies.accessToken ||
      (req.headers['authorization'] &&
        req.headers['authorization'].split(' ')[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        companyProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Middleware to check user roles
 * @param {string[]} roles - Array of allowed roles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Middleware to require verified users
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.verificationStatus !== 'VERIFIED') {
    return res.status(403).json({
      success: false,
      error: 'Account verification required',
    });
  }

  next();
};

/**
 * Middleware to check if user is seller
 */
const requireSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'SELLER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Seller access required',
    });
  }

  next();
};

/**
 * Middleware to check if user is buyer
 */
const requireBuyer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'BUYER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Buyer access required',
    });
  }

  next();
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Try to get token from cookies first, then from Authorization header
    const token =
      req.cookies.accessToken ||
      (req.headers['authorization'] &&
        req.headers['authorization'].split(' ')[1]);

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { companyProfile: true },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }

  next();
};

/**
 * Middleware to check if user owns the resource
 * @param {string} userIdField - Field name containing user ID in params/body
 */
const requireOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];

    if (req.user.role === 'ADMIN') {
      return next(); // Admins can access everything
    }

    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - resource ownership required',
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireVerified,
  requireSeller,
  requireBuyer,
  optionalAuth,
  requireOwnership,
};
