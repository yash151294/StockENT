/**
 * Integration tests for Auth Routes
 * Tests authentication endpoints using supertest
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const {
  createMockPrismaClient,
  createTestUser,
} = require('../../helpers/testDb');
const {
  generateTestAccessToken,
  generateTestRefreshToken,
  hashPassword,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
} = require('../../helpers/authHelpers');

// Mock the prisma module
const mockPrisma = createMockPrismaClient();
jest.mock('../../../src/utils/prisma', () => ({
  getPrismaClient: () => mockPrisma,
}));

// Mock email service
jest.mock('../../../src/utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// Mock Google Auth service
jest.mock('../../../src/services/googleAuthService', () => ({
  handleGoogleCallback: jest.fn(),
  getGoogleAuthUrl: jest.fn(() => 'https://accounts.google.com/o/oauth2/auth'),
}));

// Import auth controller after mocks
const authController = require('../../../src/controllers/authController');

// Create a minimal Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Auth routes
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/refresh', authController.refreshToken);
  app.post('/api/auth/logout', authController.logout);
  app.get('/api/auth/verify/:token', authController.verifyEmail);
  app.post('/api/auth/password/reset-request', authController.requestPasswordReset);
  app.post('/api/auth/password/reset', authController.resetPassword);

  // Protected routes (mock auth middleware)
  app.get('/api/auth/profile', (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  }, authController.getProfile);

  return app;
};

describe('Auth Routes', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
      role: 'BUYER',
      companyName: 'New Company',
      contactPerson: 'John Doe',
      phone: '+1234567890',
      country: 'USA',
    };

    it('should register a new user successfully', async () => {
      const newUser = createTestUser({
        id: 'new-user-id',
        email: validRegistrationData.email,
        role: validRegistrationData.role,
        verificationStatus: 'PENDING',
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validRegistrationData.email);
      expect(response.body.data.role).toBe(validRegistrationData.role);
    });

    it('should return 400 if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        createTestUser({ email: validRegistrationData.email })
      );

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await hashPassword('CorrectPassword123!');
      const testUser = createTestUser({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        isActive: true,
      });

      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-1' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'CorrectPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      // Check that cookies are set
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 with invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for deactivated account', async () => {
      const hashedPassword = await hashPassword('CorrectPassword123!');
      const inactiveUser = createTestUser({
        passwordHash: hashedPassword,
        isActive: false,
      });

      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'CorrectPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account is deactivated');
    });

    it('should return 401 with wrong password', async () => {
      const hashedPassword = await hashPassword('CorrectPassword123!');
      const testUser = createTestUser({
        passwordHash: hashedPassword,
        isActive: true,
      });

      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const testUser = createTestUser({
        id: 'user-1',
        isActive: true,
      });

      const refreshToken = generateTestRefreshToken({ userId: 'user-1' });

      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'token-1',
        token: refreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 401 without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Refresh token required');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const refreshToken = generateTestRefreshToken({ userId: 'user-1' });

      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      // Check that cookies are cleared
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should succeed even without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const testUser = createTestUser({
        id: 'user-1',
        email: 'test@example.com',
      });

      const accessToken = generateTestAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'BUYER',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        ...testUser,
        companyProfile: null,
        _count: {
          products: 0,
          conversations: 0,
          watchlist: 0,
        },
      });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/password/reset-request', () => {
    it('should send reset email for existing user', async () => {
      const testUser = createTestUser({
        id: 'user-1',
        email: 'test@example.com',
      });

      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/auth/password/reset-request')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return success even for non-existent user (security)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/password/reset-request')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/password/reset', () => {
    it('should reset password with valid token', async () => {
      const jwt = require('jsonwebtoken');
      const resetToken = jwt.sign(
        { userId: 'user-1', type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockPrisma.user.update.mockResolvedValue(createTestUser());
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const response = await request(app)
        .post('/api/auth/password/reset')
        .send({
          token: resetToken,
          newPassword: 'NewStrongPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successfully');
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/password/reset')
        .send({
          token: 'invalid-token',
          newPassword: 'NewStrongPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/verify/:token', () => {
    it('should verify email with valid token', async () => {
      const jwt = require('jsonwebtoken');
      const verifyToken = jwt.sign(
        { userId: 'user-1', type: 'email_verification' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      mockPrisma.user.update.mockResolvedValue(
        createTestUser({ verificationStatus: 'VERIFIED' })
      );

      const response = await request(app)
        .get(`/api/auth/verify/${verifyToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');
    });

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .get('/api/auth/verify/invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
