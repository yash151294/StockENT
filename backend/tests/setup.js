const { PrismaClient } = require('@prisma/client');
const redis = require('redis');

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/stockent_test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.PORT = '5001';
  
  // Initialize test database
  const prisma = new PrismaClient();
  
  try {
    // Clean database before tests
    await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "categories" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "products" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "auctions" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "bids" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "conversations" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "messages" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "sample_requests" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "watchlist_items" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "notifications" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "verification_tokens" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "refresh_tokens" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "company_profiles" CASCADE`;
    
    // Seed test categories
    await prisma.category.createMany({
      data: [
        {
          id: 'cat-1',
          name: 'Cotton',
          level: 1,
          path: '/cotton',
          description: 'Cotton fabrics',
          isActive: true
        },
        {
          id: 'cat-2',
          name: 'Polyester',
          level: 1,
          path: '/polyester',
          description: 'Polyester fabrics',
          isActive: true
        },
        {
          id: 'cat-3',
          name: 'Silk',
          level: 1,
          path: '/silk',
          description: 'Silk fabrics',
          isActive: true
        }
      ]
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test setup error:', error);
    throw error;
  }
});

afterAll(async () => {
  // Clean up after all tests
  const prisma = new PrismaClient();
  
  try {
    // Clean database after tests
    await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "categories" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "products" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "auctions" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "bids" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "conversations" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "messages" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "sample_requests" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "watchlist_items" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "notifications" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "verification_tokens" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "refresh_tokens" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "company_profiles" CASCADE`;
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test cleanup error:', error);
  }
});

// Global test utilities
global.testUtils = {
  createTestUser: async (userData = {}) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const defaultUser = {
      email: 'test@example.com',
      passwordHash: '$2a$10$test.hash',
      role: 'BUYER',
      companyName: 'Test Company',
      contactPerson: 'Test User',
      phone: '+1234567890',
      country: 'US',
      verificationStatus: 'VERIFIED',
      isActive: true,
      isFirstLogin: false,
      ...userData
    };
    
    const user = await prisma.user.create({
      data: defaultUser
    });
    
    await prisma.$disconnect();
    return user;
  },
  
  createTestProduct: async (productData = {}) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const defaultProduct = {
      sellerId: productData.sellerId || 'test-seller-id',
      categoryId: 'cat-1',
      title: 'Test Cotton Fabric',
      description: 'High quality cotton fabric',
      quantityAvailable: 100,
      unit: 'meters',
      minOrderQuantity: 10,
      basePrice: 25.50,
      currency: 'USD',
      location: 'New York',
      city: 'New York',
      state: 'NY',
      country: 'US',
      status: 'ACTIVE',
      listingType: 'FIXED_PRICE',
      tags: ['cotton', 'fabric', 'textile'],
      ...productData
    };
    
    const product = await prisma.product.create({
      data: defaultProduct
    });
    
    await prisma.$disconnect();
    return product;
  },
  
  createTestAuction: async (auctionData = {}) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const defaultAuction = {
      productId: auctionData.productId || 'test-product-id',
      auctionType: 'ENGLISH',
      startingPrice: 100,
      reservePrice: 150,
      currentBid: 100,
      bidIncrement: 10,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      status: 'ACTIVE',
      bidCount: 0,
      ...auctionData
    };
    
    const auction = await prisma.auction.create({
      data: defaultAuction
    });
    
    await prisma.$disconnect();
    return auction;
  }
};