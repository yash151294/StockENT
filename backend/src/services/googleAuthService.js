const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Handle Google OAuth callback
 */
const handleGoogleCallback = async (profile, selectedRole = 'BUYER') => {
  try {
    logger.info('Google profile data:', JSON.stringify(profile, null, 2));

    if (!profile.id) {
      throw new Error('Google profile ID is missing');
    }

    const { id: googleId, email, name, picture } = profile;

    if (!email) {
      throw new Error('Google profile email is missing');
    }

    const fullName = name
      ? `${name.given_name || ''} ${name.family_name || ''}`.trim()
      : email.split('@')[0];
    
    // Clean up the profile picture URL - remove size parameters to get the original
    let profilePicture = picture;
    if (profilePicture && profilePicture.includes('=s96-c')) {
      profilePicture = profilePicture.replace('=s96-c', '');
    }

    logger.info('Extracted profile data:', {
      email,
      fullName,
      profilePicture,
      googleId,
      originalPicture: picture
    });

    // Check if user already exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: {
        companyProfile: true,
      },
    });

    if (user) {
      // Check if this is the first login (ever)
      const isFirstLoginToday = user.isFirstLogin;

      // Update last login, profile image, and mark first login as completed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          isFirstLogin: false, // Mark as no longer first login for today
          profileImageUrl: profilePicture, // Update profile image in case it changed
        },
      });

      logger.info(`Google OAuth login for existing user: ${email}`);
      return generateTokens(user, isFirstLoginToday);
    }

    // Check if user exists with this email but different auth method
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Check if this is the first login today for existing user
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      const isFirstLoginToday =
        existingUser.isFirstLogin ||
        !existingUser.lastLoginAt ||
        existingUser.lastLoginAt < today;

      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId,
          lastLoginAt: new Date(),
          isFirstLogin: false, // Mark as no longer first login for today
          profileImageUrl: profilePicture, // Save Google profile image
        },
        include: {
          companyProfile: true,
        },
      });

      logger.info(`Linked Google account to existing user: ${email}`);
      return generateTokens(user, isFirstLoginToday);
    }

    // Create new user with Google OAuth
    user = await prisma.user.create({
      data: {
        email,
        googleId,
        contactPerson: fullName,
        profileImageUrl: profilePicture, // Save Google profile image
        role: selectedRole, // Use the selected role
        verificationStatus: 'VERIFIED', // Google users are pre-verified
        isActive: true,
        isFirstLogin: true, // This is definitely a first login for new users
        lastLoginAt: new Date(),
      },
      include: {
        companyProfile: true,
      },
    });

    logger.info(`New Google OAuth user created: ${email}`);
    return generateTokens(user, true); // New users are always first login
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    throw error;
  }
};

/**
 * Generate JWT tokens for user
 */
const generateTokens = async (user, isFirstLogin = false) => {
  try {
    // Generate access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Generate refresh token
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

    return {
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
      accessToken,
      refreshToken,
      isFirstLogin,
    };
  } catch (error) {
    logger.error('Token generation error:', error);
    throw error;
  }
};

/**
 * Get Google OAuth URL
 */
const getGoogleAuthUrl = (role = null) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:5001/api/auth/google/callback';
  const scope = 'profile email';

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
  }

  let authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;

  // Add role parameter if provided
  if (role) {
    authUrl += `&state=${encodeURIComponent(JSON.stringify({ role }))}`;
  }

  return authUrl;
};

module.exports = {
  handleGoogleCallback,
  getGoogleAuthUrl,
};
