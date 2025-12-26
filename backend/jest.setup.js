/**
 * Jest setup file for StockENT Backend
 * Runs before each test file
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/stockent_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock winston logger to prevent noise during tests
jest.mock('./src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock socket utilities to prevent real socket connections
jest.mock('./src/utils/socket', () => ({
  emitToUser: jest.fn(),
  emitToRoom: jest.fn(),
  emitToCart: jest.fn(),
  emitAuctionUpdate: jest.fn(),
  getIO: jest.fn(() => ({
    emit: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
  })),
}));

// Global test utilities
global.testUtils = {
  // Helper to create a mock response object
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  },

  // Helper to create a mock request object
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    cookies: {},
    ...overrides,
  }),

  // Helper to create a mock next function
  mockNext: () => jest.fn(),
};

// Increase timeout for integration tests
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise((resolve) => setTimeout(resolve, 500));
});
