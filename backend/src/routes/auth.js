const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  authLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiter');
const { validate, validateJoi } = require('../middleware/validation');
const {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('../validators/authValidators');
const {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  markFirstLoginCompleted,
  updateUserRole,
  getGoogleAuthUrl,
  googleCallback,
} = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [authLimiter, validateJoi(registerSchema)], register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [authLimiter, validateJoi(loginSchema)], login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validateJoi(refreshTokenSchema), refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public (to allow clearing cookies even if session is invalid)
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/verify/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify/:token', verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  [passwordResetLimiter, validateJoi(requestPasswordResetSchema)],
  requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password', validateJoi(resetPasswordSchema), resetPassword);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  [authenticateToken, validateJoi(updateProfileSchema)],
  updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  [authenticateToken, validateJoi(changePasswordSchema)],
  changePassword
);

/**
 * @route   GET /api/auth/google/url
 * @desc    Get Google OAuth URL
 * @access  Public
 */
router.get('/google/url', getGoogleAuthUrl);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', googleCallback);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, getProfile);

/**
 * @route   POST /api/auth/mark-first-login-completed
 * @desc    Mark first login as completed
 * @access  Private
 */
router.post(
  '/mark-first-login-completed',
  authenticateToken,
  markFirstLoginCompleted
);

/**
 * @route   PUT /api/auth/role
 * @desc    Update user role
 * @access  Private
 */
router.put('/role', authenticateToken, updateUserRole);

module.exports = router;
