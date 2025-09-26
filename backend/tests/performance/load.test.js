const request = require('supertest');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Import the actual server
const { app } = require('../../src/server');

describe('Performance and Load Tests', () => {
  let prisma;
  let server;
  let testUsers = [];
  let testProducts = [];
  let authTokens = [];
  
  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Start server for performance tests
    const PORT = process.env.PORT || 5001;
    server = app.listen(PORT);
    
    // Create test data for load testing
    await setupTestData();
  });
  
  afterAll(async () => {
    if (server) {
      server.close();
    }
    await cleanupTestData();
    await prisma.$disconnect();
  });
  
  async function setupTestData() {
    // Create multiple test users
    for (let i = 0; i < 50; i++) {
      const user = await global.testUtils.createTestUser({
        email: `loadtest${i}@example.com`,
        role: i % 2 === 0 ? 'SELLER' : 'BUYER',
        companyName: `Load Test Company ${i}`,
        contactPerson: `Load Test User ${i}`
      });
      
      testUsers.push(user);
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      authTokens.push(token);
      
      // Create products for sellers
      if (user.role === 'SELLER') {
        for (let j = 0; j < 5; j++) {
          const product = await global.testUtils.createTestProduct({
            sellerId: user.id,
            title: `Load Test Product ${i}-${j}`,
            description: `Product ${j} for load testing by user ${i}`,
            basePrice: 10 + (j * 5),
            status: 'ACTIVE'
          });
          testProducts.push(product);
        }
      }
    }
  }
  
  async function cleanupTestData() {
    // Clean up test data
    await prisma.bid.deleteMany();
    await prisma.auction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.message.deleteMany();
    await prisma.sampleRequest.deleteMany();
    await prisma.watchlistItem.deleteMany();
    await prisma.notification.deleteMany();
  }
  
  describe('API Response Time Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body.status).toBe('OK');
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });
    
    it('should handle concurrent health checks efficiently', async () => {
      const concurrentRequests = 100;
      const startTime = Date.now();
      
      const requests = Array(concurrentRequests).fill().map(() => 
        request(app).get('/api/health')
      );
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrentRequests;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Average response time should be reasonable
      expect(averageTime).toBeLessThan(200); // Average should be under 200ms
      console.log(`Concurrent health checks: ${concurrentRequests} requests in ${totalTime}ms (avg: ${averageTime.toFixed(2)}ms)`);
    });
  });
  
  describe('Product Search Performance', () => {
    it('should handle product search efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/products?search=load&limit=20')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
      console.log(`Product search completed in ${responseTime}ms`);
    });
    
    it('should handle concurrent product searches', async () => {
      const concurrentSearches = 20;
      const startTime = Date.now();
      
      const searchQueries = [
        'load', 'test', 'product', 'fabric', 'cotton',
        'polyester', 'silk', 'textile', 'material', 'fiber'
      ];
      
      const requests = Array(concurrentSearches).fill().map((_, index) => 
        request(app).get(`/api/products?search=${searchQueries[index % searchQueries.length]}&limit=10`)
      );
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrentSearches;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      expect(averageTime).toBeLessThan(1000); // Average should be under 1 second
      console.log(`Concurrent product searches: ${concurrentSearches} requests in ${totalTime}ms (avg: ${averageTime.toFixed(2)}ms)`);
    });
  });
  
  describe('Authentication Performance', () => {
    it('should handle concurrent logins efficiently', async () => {
      const concurrentLogins = 10;
      const startTime = Date.now();
      
      const loginRequests = Array(concurrentLogins).fill().map((_, index) => {
        const user = testUsers[index % testUsers.length];
        return request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: 'password123' // Assuming all test users have this password
          });
      });
      
      const responses = await Promise.all(loginRequests);
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrentLogins;
      
      // Count successful logins
      const successfulLogins = responses.filter(response => response.status === 200).length;
      
      expect(successfulLogins).toBeGreaterThan(0);
      expect(averageTime).toBeLessThan(2000); // Average should be under 2 seconds
      console.log(`Concurrent logins: ${concurrentLogins} requests in ${totalTime}ms (avg: ${averageTime.toFixed(2)}ms), ${successfulLogins} successful`);
    });
  });
  
  describe('Database Query Performance', () => {
    it('should handle product listing with pagination efficiently', async () => {
      const pageSizes = [10, 20, 50];
      
      for (const pageSize of pageSizes) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/products?page=1&limit=${pageSize}`)
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        
        expect(response.body.success).toBe(true);
        expect(response.body.products.length).toBeLessThanOrEqual(pageSize);
        expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        
        console.log(`Product listing (limit: ${pageSize}): ${responseTime}ms`);
      }
    });
    
    it('should handle product filtering efficiently', async () => {
      const filters = [
        { category: 'cat-1' },
        { minPrice: 10, maxPrice: 50 },
        { status: 'ACTIVE' },
        { currency: 'USD' }
      ];
      
      for (const filter of filters) {
        const startTime = Date.now();
        
        const queryParams = new URLSearchParams(filter).toString();
        const response = await request(app)
          .get(`/api/products?${queryParams}`)
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        
        expect(response.body.success).toBe(true);
        expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        
        console.log(`Product filtering (${JSON.stringify(filter)}): ${responseTime}ms`);
      }
    });
  });
  
  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/health');
        await request(app).get('/api/products?limit=10');
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`Memory usage: Initial ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, Final ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, Increase ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });
  
  describe('Stress Tests', () => {
    it('should handle high concurrent load', async () => {
      const concurrentRequests = 200;
      const startTime = Date.now();
      
      const requests = Array(concurrentRequests).fill().map((_, index) => {
        const endpoint = index % 4 === 0 ? '/api/health' : 
                        index % 4 === 1 ? '/api/products?limit=5' :
                        index % 4 === 2 ? '/api/categories' : '/api/redis-status';
        return request(app).get(endpoint);
      });
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrentRequests;
      
      // Count successful responses
      const successfulResponses = responses.filter(response => response.status < 500).length;
      const successRate = (successfulResponses / concurrentRequests) * 100;
      
      expect(successRate).toBeGreaterThan(95); // At least 95% success rate
      expect(averageTime).toBeLessThan(2000); // Average response time under 2 seconds
      
      console.log(`Stress test: ${concurrentRequests} requests in ${totalTime}ms (avg: ${averageTime.toFixed(2)}ms), ${successRate.toFixed(2)}% success rate`);
    });
    
    it('should handle rapid sequential requests', async () => {
      const sequentialRequests = 100;
      const startTime = Date.now();
      
      for (let i = 0; i < sequentialRequests; i++) {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
      }
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / sequentialRequests;
      
      expect(averageTime).toBeLessThan(100); // Average should be under 100ms
      console.log(`Sequential requests: ${sequentialRequests} requests in ${totalTime}ms (avg: ${averageTime.toFixed(2)}ms)`);
    });
  });
  
  describe('Error Recovery Tests', () => {
    it('should recover from invalid requests gracefully', async () => {
      const invalidRequests = [
        { method: 'GET', url: '/api/products/invalid-id' },
        { method: 'POST', url: '/api/auth/login', body: { email: 'invalid' } },
        { method: 'GET', url: '/api/auctions/non-existent' },
        { method: 'POST', url: '/api/products', body: {} }
      ];
      
      for (const requestConfig of invalidRequests) {
        const startTime = Date.now();
        
        let response;
        if (requestConfig.method === 'GET') {
          response = await request(app).get(requestConfig.url);
        } else {
          response = await request(app)
            .post(requestConfig.url)
            .send(requestConfig.body);
        }
        
        const responseTime = Date.now() - startTime;
        
        // Should respond with appropriate error status
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(responseTime).toBeLessThan(1000); // Should respond quickly even for errors
        
        console.log(`Invalid request (${requestConfig.method} ${requestConfig.url}): ${response.status} in ${responseTime}ms`);
      }
    });
  });
});