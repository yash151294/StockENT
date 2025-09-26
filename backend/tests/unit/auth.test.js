const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Mock the server
jest.mock('../../src/server', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  // Import auth routes
  const authRoutes = require('../../src/routes/auth');
  app.use('/api/auth', authRoutes);
  
  return { app };
});

const { app } = require('../../src/server');

describe('Authentication Unit Tests', () => {
  let prisma;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  beforeEach(async () => {
    // Clean users table before each test
    await prisma.user.deleteMany();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        companyName: 'Test Company',
        contactPerson: 'John Doe',
        phone: '+1234567890',
        country: 'US',
        role: 'BUYER'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.passwordHash).toBeUndefined(); // Password should not be returned
    });
    
    it('should fail to register with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        companyName: 'Test Company',
        contactPerson: 'John Doe',
        phone: '+1234567890',
        country: 'US'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
    
    it('should fail to register with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        companyName: 'Test Company',
        contactPerson: 'John Doe',
        phone: '+1234567890',
        country: 'US'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should fail to register with existing email', async () => {
      // First registration
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        companyName: 'Test Company',
        contactPerson: 'John Doe',
        phone: '+1234567890',
        country: 'US'
      };
      
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });
  
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: hashedPassword,
          role: 'BUYER',
          companyName: 'Test Company',
          contactPerson: 'Test User',
          phone: '+1234567890',
          country: 'US',
          verificationStatus: 'VERIFIED',
          isActive: true
        }
      });
    });
    
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });
    
    it('should fail to login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
    
    it('should fail to login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
    
    it('should fail to login with inactive user', async () => {
      // Create inactive user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'inactive@example.com',
          passwordHash: hashedPassword,
          role: 'BUYER',
          companyName: 'Test Company',
          contactPerson: 'Test User',
          phone: '+1234567890',
          country: 'US',
          verificationStatus: 'VERIFIED',
          isActive: false
        }
      });
      
      const loginData = {
        email: 'inactive@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Account is inactive');
    });
  });
  
  describe('POST /api/auth/refresh', () => {
    let refreshToken;
    
    beforeEach(async () => {
      // Create a test user and refresh token
      const user = await global.testUtils.createTestUser({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10)
      });
      
      refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    });
    
    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });
    
    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });
    
    it('should fail with expired refresh token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: 'test-user-id', type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '-1h' }
      );
      
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });
  });
  
  describe('POST /api/auth/logout', () => {
    let authToken;
    let user;
    
    beforeEach(async () => {
      user = await global.testUtils.createTestUser({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10)
      });
      
      authToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });
    
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });
    
    it('should fail without authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });
});