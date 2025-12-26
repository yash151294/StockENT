/**
 * Test database utilities for mocking Prisma
 * Provides helpers for creating mock Prisma client instances
 */

// Mock Prisma client for testing
const createMockPrismaClient = () => {
  return {
    // User model mocks
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Product model mocks
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // CartItem model mocks
    cartItem: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },

    // Auction model mocks
    auction: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // AuctionBid model mocks
    auctionBid: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Negotiation model mocks
    negotiation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Message model mocks
    message: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },

    // Conversation model mocks
    conversation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // Category model mocks
    category: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // ProductImage model mocks
    productImage: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },

    // Watchlist model mocks
    watchlist: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },

    // RefreshToken model mocks
    refreshToken: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },

    // CompanyProfile model mocks
    companyProfile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },

    // Transaction helpers
    $transaction: jest.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(createMockPrismaClient());
      }
      return Promise.all(callback);
    }),

    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
};

// Factory functions for test data
const createTestUser = (overrides = {}) => ({
  id: 'user-test-id-1',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword', // bcrypt hashed 'password123'
  firstName: 'Test',
  lastName: 'User',
  companyName: 'Test Company',
  phone: '+1234567890',
  role: 'USER',
  isVerified: true,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestProduct = (overrides = {}) => ({
  id: 'product-test-id-1',
  name: 'Test Cotton Fabric',
  description: 'High quality cotton fabric',
  basePrice: 100.0,
  currency: 'USD',
  quantityAvailable: 1000,
  minOrderQuantity: 10,
  unit: 'meters',
  status: 'ACTIVE',
  sellerId: 'seller-test-id-1',
  categoryId: 'category-test-id-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestCartItem = (overrides = {}) => ({
  id: 'cart-item-test-id-1',
  userId: 'user-test-id-1',
  productId: 'product-test-id-1',
  quantity: 50,
  priceAtAddition: 100.0,
  currency: 'USD',
  sourceType: 'DIRECT',
  negotiationId: null,
  auctionBidId: null,
  addedAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestAuction = (overrides = {}) => ({
  id: 'auction-test-id-1',
  productId: 'product-test-id-1',
  startingPrice: 50.0,
  currentPrice: 75.0,
  minBidIncrement: 5.0,
  quantity: 100,
  status: 'ACTIVE',
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-01-08'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestNegotiation = (overrides = {}) => ({
  id: 'negotiation-test-id-1',
  productId: 'product-test-id-1',
  buyerId: 'user-test-id-1',
  sellerId: 'seller-test-id-1',
  proposedPrice: 90.0,
  quantity: 100,
  status: 'PENDING',
  expiresAt: new Date('2024-01-08'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

module.exports = {
  createMockPrismaClient,
  createTestUser,
  createTestProduct,
  createTestCartItem,
  createTestAuction,
  createTestNegotiation,
};
