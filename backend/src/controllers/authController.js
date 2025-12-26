const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPrismaClient } = require('../utils/prisma');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../utils/email');
const { logger } = require('../utils/logger');
const {
  handleGoogleCallback,
  getGoogleAuthUrl,
} = require('../services/googleAuthService');

const prisma = getPrismaClient();

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      companyName,
      contactPerson,
      phone,
      country,
      businessLicense,
      taxId,
      address,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        companyName,
        contactPerson,
        phone,
        country,
        verificationStatus: 'PENDING',
        isActive: true,
      },
    });

    // Create company profile if business license is provided
    if (businessLicense || taxId || address) {
      await prisma.companyProfile.create({
        data: {
          userId: user.id,
          businessLicense,
          taxId,
          address,
        },
      });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    logger.info(`New user registered: ${email} with role: ${role}`);

    res.status(201).json({
      success: true,
      message:
        'User registered successfully. Please check your email for verification.',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        companyProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set HTTP-only cookies for secure token storage
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          contactPerson: user.contactPerson,
          phone: user.phone,
          country: user.country,
          profileImageUrl: user.profileImageUrl,
          verificationStatus: user.verificationStatus,
          companyProfile: user.companyProfile,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Set new access token cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    };

    res.cookie('accessToken', newAccessToken, cookieOptions);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      try {
        // Remove refresh token from database
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
        logger.info('Refresh token removed from database');
      } catch (dbError) {
        // Don't fail logout if token removal fails
        logger.warn(
          'Failed to remove refresh token from database:',
          dbError.message
        );
      }
    }

    // Clear cookies regardless of authentication status
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    logger.info(`User logged out: ${req.user?.email || 'unknown user'}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    // Even if there's an error, try to clear cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
};

/**
 * Verify email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'email_verification') {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token',
      });
    }

    // Update user verification status
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { verificationStatus: 'VERIFIED' },
    });

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid or expired verification token',
    });
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send reset email',
      });
    }

    logger.info(`Password reset requested for: ${email}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token',
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash },
    });

    // Remove all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: decoded.userId },
    });

    logger.info(`Password reset for user: ${decoded.userId}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token',
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        companyProfile: true,
        _count: {
          select: {
            products: true,
            conversations: true,
            watchlist: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...user,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      phone,
      country,
      businessLicense,
      taxId,
      address,
    } = req.body;

    const updateData = {};
    if (companyName) updateData.companyName = companyName;
    if (contactPerson) updateData.contactPerson = contactPerson;
    if (phone) updateData.phone = phone;
    if (country) updateData.country = country;

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    // Update or create company profile
    if (businessLicense || taxId || address) {
      await prisma.companyProfile.upsert({
        where: { userId: req.user.id },
        update: {
          businessLicense,
          taxId,
          address,
        },
        create: {
          userId: req.user.id,
          businessLicense,
          taxId,
          address,
        },
      });
    }

    logger.info(`Profile updated for user: ${req.user.email}`);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    // Remove all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user.id },
    });

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Mark first login as completed
 */
const markFirstLoginCompleted = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isFirstLogin: false },
      select: { id: true, email: true, isFirstLogin: true },
    });

    logger.info(`First login marked as completed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'First login marked as completed',
    });
  } catch (error) {
    logger.error('Mark first login completed error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update user role
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!role || !['BUYER', 'SELLER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be BUYER or SELLER',
      });
    }

    // Check if user is trying to change to the same role
    if (req.user.role === role) {
      return res.status(400).json({
        success: false,
        error: 'You already have this role',
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { role },
      include: {
        companyProfile: true,
      },
    });

    logger.info(`User role updated: ${req.user.email} changed from ${req.user.role} to ${role}`);

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        companyName: updatedUser.companyName,
        contactPerson: updatedUser.contactPerson,
        phone: updatedUser.phone,
        country: updatedUser.country,
        profileImageUrl: updatedUser.profileImageUrl,
        verificationStatus: updatedUser.verificationStatus,
        companyProfile: updatedUser.companyProfile,
      },
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get Google OAuth URL
 */
const getGoogleAuthUrlController = async (req, res) => {
  try {
    // Check if Google OAuth is properly configured
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID === 'your-google-client-id'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Google OAuth is not configured. Please contact the administrator.',
      });
    }

    // Get role from query parameter (optional)
    const role = req.query.role;
    
    // Validate role if provided
    if (role && !['BUYER', 'SELLER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be BUYER or SELLER.',
      });
    }

    const authUrl = getGoogleAuthUrl(role);
    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    logger.error('Get Google auth URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Handle Google OAuth callback
 */
const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    logger.info('Google OAuth callback received:', {
      code: code ? 'present' : 'missing',
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      url: req.url,
    });

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent('Authorization code is required')}`
      );
    }

    // Check if Google OAuth credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent('Google OAuth is not configured')}`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri:
          process.env.GOOGLE_REDIRECT_URI ||
          'http://localhost:5001/api/auth/google/callback',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent('Failed to get access token from Google')}`
      );
    }

    // Get user profile from Google
    const profileResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const profile = await profileResponse.json();
    
    logger.info('Google profile response:', JSON.stringify(profile, null, 2));

    if (!profile.id) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent('Failed to get user profile from Google')}`
      );
    }

    // Get role from state parameter (if provided) or query parameter
    let selectedRole = 'BUYER';
    
    if (req.query.state) {
      try {
        const state = JSON.parse(decodeURIComponent(req.query.state));
        selectedRole = state.role || 'BUYER';
      } catch (error) {
        logger.warn('Failed to parse state parameter:', error);
      }
    } else {
      selectedRole = req.query.role || 'BUYER';
    }
    
    // Validate role
    if (!['BUYER', 'SELLER'].includes(selectedRole)) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent('Invalid role selected')}`
      );
    }

    // Handle the Google OAuth callback
    const result = await handleGoogleCallback(profile, selectedRole);

    logger.info(`Google OAuth successful for user: ${profile.email}`);
    logger.info('User data being sent to frontend:', {
      id: result.user.id,
      email: result.user.email,
      profileImageUrl: result.user.profileImageUrl,
      contactPerson: result.user.contactPerson,
      companyName: result.user.companyName
    });

    // Set HTTP-only cookies for secure token storage
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    };

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with success and auth data (without tokens)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const authData = encodeURIComponent(
      JSON.stringify({
        success: true,
        data: {
          user: result.user,
        },
      })
    );

    return res.redirect(`${frontendUrl}/auth/google/callback?auth=${authData}`);
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`
    );
  }
};

module.exports = {
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
  getGoogleAuthUrl: getGoogleAuthUrlController,
  googleCallback,
};
