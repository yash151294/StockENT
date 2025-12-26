/**
 * Authentication test helpers
 * Provides utilities for testing authenticated routes
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Test JWT secrets (matching jest.setup.js)
const JWT_SECRET = 'test-jwt-secret-for-testing';
const JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing';

/**
 * Generate a test access token
 * @param {Object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @param {Object} options - Token options
 * @param {string} options.expiresIn - Token expiry (default: '1h')
 * @returns {string} JWT access token
 */
const generateTestAccessToken = (payload, options = {}) => {
  const { expiresIn = '1h' } = options;
  return jwt.sign(
    {
      userId: payload.userId || 'test-user-id',
      email: payload.email || 'test@example.com',
      role: payload.role || 'USER',
    },
    JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate a test refresh token
 * @param {Object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {Object} options - Token options
 * @param {string} options.expiresIn - Token expiry (default: '7d')
 * @returns {string} JWT refresh token
 */
const generateTestRefreshToken = (payload, options = {}) => {
  const { expiresIn = '7d' } = options;
  return jwt.sign(
    {
      userId: payload.userId || 'test-user-id',
      tokenType: 'refresh',
    },
    JWT_REFRESH_SECRET,
    { expiresIn }
  );
};

/**
 * Generate an expired test token
 * @param {Object} payload - Token payload
 * @returns {string} Expired JWT token
 */
const generateExpiredToken = (payload = {}) => {
  return jwt.sign(
    {
      userId: payload.userId || 'test-user-id',
      email: payload.email || 'test@example.com',
      role: payload.role || 'USER',
    },
    JWT_SECRET,
    { expiresIn: '-1s' } // Already expired
  );
};

/**
 * Generate an invalid token (signed with wrong secret)
 * @param {Object} payload - Token payload
 * @returns {string} Invalid JWT token
 */
const generateInvalidToken = (payload = {}) => {
  return jwt.sign(
    {
      userId: payload.userId || 'test-user-id',
      email: payload.email || 'test@example.com',
      role: payload.role || 'USER',
    },
    'wrong-secret',
    { expiresIn: '1h' }
  );
};

/**
 * Hash a password for testing
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

/**
 * Create test user credentials
 * @param {Object} overrides - Override default values
 * @returns {Object} User credentials with hashed password
 */
const createTestCredentials = async (overrides = {}) => {
  const password = overrides.password || 'TestPassword123!';
  const hashedPassword = await hashPassword(password);

  return {
    email: overrides.email || 'test@example.com',
    password: password,
    hashedPassword: hashedPassword,
  };
};

/**
 * Create authenticated request headers
 * @param {Object} user - User object
 * @param {string} user.id - User ID
 * @param {string} user.email - User email
 * @param {string} user.role - User role
 * @returns {Object} Headers with Authorization token
 */
const createAuthHeaders = (user = {}) => {
  const token = generateTestAccessToken({
    userId: user.id || 'test-user-id',
    email: user.email || 'test@example.com',
    role: user.role || 'USER',
  });

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Create admin authenticated request headers
 * @param {Object} user - User object
 * @returns {Object} Headers with admin Authorization token
 */
const createAdminAuthHeaders = (user = {}) => {
  const token = generateTestAccessToken({
    userId: user.id || 'admin-user-id',
    email: user.email || 'admin@example.com',
    role: 'ADMIN',
  });

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Decode a JWT token (without verification)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @param {boolean} isRefreshToken - Whether it's a refresh token
 * @returns {Object} Verified payload
 */
const verifyToken = (token, isRefreshToken = false) => {
  const secret = isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET;
  return jwt.verify(token, secret);
};

module.exports = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  generateTestAccessToken,
  generateTestRefreshToken,
  generateExpiredToken,
  generateInvalidToken,
  hashPassword,
  createTestCredentials,
  createAuthHeaders,
  createAdminAuthHeaders,
  decodeToken,
  verifyToken,
};
