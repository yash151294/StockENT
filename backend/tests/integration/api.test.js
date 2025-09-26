const request = require('supertest');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Import the actual server
const { app } = require('../../src/server');

describe('API Integration Tests', () => {
  let prisma;
  let server;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Start server for integration tests
    const PORT = process.env.PORT || 5001;
    server = app.listen(PORT);
  });
  
  afterAll(async () => {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  });
  
  beforeEach(async () => {
    // Clean database
    await prisma.bid.deleteMany();
    await prisma.auction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.message.deleteMany();
    await prisma.sampleRequest.deleteMany();
    await prisma.watchlistItem.deleteMany();
    await prisma.notification.deleteMany();
  });
  
  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
    
    it('should return Redis status', async () => {
      const response = await request(app)
        .get('/api/redis-status')
        .expect(200);
      
      expect(response.body.status).toBeDefined();
      expect(response.body.message).toBeDefined();
    });
  });
  
  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      // 1. Register user
      const userData = {
        email: 'integration@example.com',
        password: 'password123',
        companyName: 'Integration Test Company',
        contactPerson: 'Integration User',
        phone: '+1234567890',
        country: 'US',
        role: 'SELLER'
      };
      
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.email).toBe(userData.email);
      
      // 2. Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);
      
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.refreshToken).toBeDefined();
      
      const authToken = loginResponse.body.token;
      
      // 3. Access protected route
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.user.email).toBe(userData.email);
      
      // 4. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(logoutResponse.body.success).toBe(true);
    });
  });
  
  describe('Product Management Flow Integration', () => {
    let seller;
    let buyer;
    let sellerToken;
    let buyerToken;
    
    beforeEach(async () => {
      // Create test users
      seller = await global.testUtils.createTestUser({
        email: 'seller@integration.com',
        role: 'SELLER',
        companyName: 'Seller Company',
        contactPerson: 'Seller User'
      });
      
      buyer = await global.testUtils.createTestUser({
        email: 'buyer@integration.com',
        role: 'BUYER',
        companyName: 'Buyer Company',
        contactPerson: 'Buyer User'
      });
      
      sellerToken = jwt.sign(
        { userId: seller.id, role: seller.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      buyerToken = jwt.sign(
        { userId: buyer.id, role: buyer.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });
    
    it('should complete product lifecycle', async () => {
      // 1. Create product
      const productData = {
        title: 'Integration Test Product',
        description: 'Product for integration testing',
        categoryId: 'cat-1',
        quantityAvailable: 1000,
        unit: 'meters',
        minOrderQuantity: 50,
        basePrice: 25.50,
        currency: 'USD',
        location: 'New York',
        city: 'New York',
        state: 'NY',
        country: 'US',
        listingType: 'FIXED_PRICE',
        tags: ['cotton', 'fabric', 'textile']
      };
      
      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData)
        .expect(201);
      
      expect(createResponse.body.success).toBe(true);
      const product = createResponse.body.product;
      
      // 2. Get product details
      const getResponse = await request(app)
        .get(`/api/products/${product.id}`)
        .expect(200);
      
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.product.id).toBe(product.id);
      
      // 3. Update product
      const updateData = {
        title: 'Updated Integration Test Product',
        basePrice: 30.00
      };
      
      const updateResponse = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData)
        .expect(200);
      
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.product.title).toBe(updateData.title);
      expect(updateResponse.body.product.basePrice).toBe(updateData.basePrice);
      
      // 4. Search products
      const searchResponse = await request(app)
        .get('/api/products?search=integration')
        .expect(200);
      
      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.products.length).toBe(1);
      expect(searchResponse.body.products[0].title).toContain('integration');
      
      // 5. Delete product
      const deleteResponse = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      
      expect(deleteResponse.body.success).toBe(true);
      
      // 6. Verify product is deleted
      const verifyResponse = await request(app)
        .get(`/api/products/${product.id}`)
        .expect(404);
      
      expect(verifyResponse.body.success).toBe(false);
    });
  });
  
  describe('Auction Flow Integration', () => {
    let seller;
    let buyer1;
    let buyer2;
    let product;
    let auction;
    let sellerToken;
    let buyerToken1;
    let buyerToken2;
    
    beforeEach(async () => {
      // Create test users
      seller = await global.testUtils.createTestUser({
        email: 'auction-seller@integration.com',
        role: 'SELLER',
        companyName: 'Auction Seller Company',
        contactPerson: 'Auction Seller User'
      });
      
      buyer1 = await global.testUtils.createTestUser({
        email: 'auction-buyer1@integration.com',
        role: 'BUYER',
        companyName: 'Auction Buyer Company 1',
        contactPerson: 'Auction Buyer User 1'
      });
      
      buyer2 = await global.testUtils.createTestUser({
        email: 'auction-buyer2@integration.com',
        role: 'BUYER',
        companyName: 'Auction Buyer Company 2',
        contactPerson: 'Auction Buyer User 2'
      });
      
      // Create test product
      product = await global.testUtils.createTestProduct({
        sellerId: seller.id,
        title: 'Auction Integration Product',
        description: 'Product for auction integration testing',
        basePrice: 100,
        listingType: 'AUCTION'
      });
      
      sellerToken = jwt.sign(
        { userId: seller.id, role: seller.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      buyerToken1 = jwt.sign(
        { userId: buyer1.id, role: buyer1.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      buyerToken2 = jwt.sign(
        { userId: buyer2.id, role: buyer2.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });
    
    it('should complete auction lifecycle', async () => {
      // 1. Create auction
      const auctionData = {
        productId: product.id,
        auctionType: 'ENGLISH',
        startingPrice: 100,
        reservePrice: 200,
        bidIncrement: 10,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };
      
      const createAuctionResponse = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(auctionData)
        .expect(201);
      
      expect(createAuctionResponse.body.success).toBe(true);
      auction = createAuctionResponse.body.auction;
      
      // 2. Start auction
      const startAuctionResponse = await request(app)
        .put(`/api/auctions/${auction.id}/start`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      
      expect(startAuctionResponse.body.success).toBe(true);
      
      // 3. Place bids
      const bid1Response = await request(app)
        .post(`/api/auctions/${auction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken1}`)
        .send({ amount: 110 })
        .expect(201);
      
      expect(bid1Response.body.success).toBe(true);
      
      const bid2Response = await request(app)
        .post(`/api/auctions/${auction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken2}`)
        .send({ amount: 120 })
        .expect(201);
      
      expect(bid2Response.body.success).toBe(true);
      
      // 4. Get auction details with bids
      const auctionDetailsResponse = await request(app)
        .get(`/api/auctions/${auction.id}`)
        .expect(200);
      
      expect(auctionDetailsResponse.body.success).toBe(true);
      expect(auctionDetailsResponse.body.auction.currentBid).toBe(120);
      expect(auctionDetailsResponse.body.auction.bidCount).toBe(2);
      
      // 5. Get auction bids
      const bidsResponse = await request(app)
        .get(`/api/auctions/${auction.id}/bids`)
        .expect(200);
      
      expect(bidsResponse.body.success).toBe(true);
      expect(bidsResponse.body.bids.length).toBe(2);
      
      // 6. End auction
      const endAuctionResponse = await request(app)
        .put(`/api/auctions/${auction.id}/end`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      
      expect(endAuctionResponse.body.success).toBe(true);
      
      // 7. Verify auction ended
      const finalAuctionResponse = await request(app)
        .get(`/api/auctions/${auction.id}`)
        .expect(200);
      
      expect(finalAuctionResponse.body.success).toBe(true);
      expect(finalAuctionResponse.body.auction.status).toBe('ENDED');
      expect(finalAuctionResponse.body.auction.winnerId).toBe(buyer2.id);
    });
  });
  
  describe('Message Flow Integration', () => {
    let seller;
    let buyer;
    let product;
    let conversation;
    let sellerToken;
    let buyerToken;
    
    beforeEach(async () => {
      // Create test users
      seller = await global.testUtils.createTestUser({
        email: 'message-seller@integration.com',
        role: 'SELLER',
        companyName: 'Message Seller Company',
        contactPerson: 'Message Seller User'
      });
      
      buyer = await global.testUtils.createTestUser({
        email: 'message-buyer@integration.com',
        role: 'BUYER',
        companyName: 'Message Buyer Company',
        contactPerson: 'Message Buyer User'
      });
      
      // Create test product
      product = await global.testUtils.createTestProduct({
        sellerId: seller.id,
        title: 'Message Integration Product',
        description: 'Product for message integration testing',
        basePrice: 100
      });
      
      sellerToken = jwt.sign(
        { userId: seller.id, role: seller.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      buyerToken = jwt.sign(
        { userId: buyer.id, role: buyer.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });
    
    it('should complete message flow', async () => {
      // 1. Start conversation
      const startConversationResponse = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId: product.id,
          sellerId: seller.id,
          initialMessage: 'Hello, I am interested in this product.'
        })
        .expect(201);
      
      expect(startConversationResponse.body.success).toBe(true);
      conversation = startConversationResponse.body.conversation;
      
      // 2. Send message
      const sendMessageResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          conversationId: conversation.id,
          receiverId: seller.id,
          content: 'What is the minimum order quantity?',
          messageType: 'TEXT'
        })
        .expect(201);
      
      expect(sendMessageResponse.body.success).toBe(true);
      
      // 3. Get conversation messages
      const getMessagesResponse = await request(app)
        .get(`/api/messages/conversations/${conversation.id}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);
      
      expect(getMessagesResponse.body.success).toBe(true);
      expect(getMessagesResponse.body.messages.length).toBe(2); // Initial message + new message
      
      // 4. Seller responds
      const sellerResponse = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          conversationId: conversation.id,
          receiverId: buyer.id,
          content: 'The minimum order quantity is 50 meters.',
          messageType: 'TEXT'
        })
        .expect(201);
      
      expect(sellerResponse.body.success).toBe(true);
      
      // 5. Get updated conversation
      const getConversationResponse = await request(app)
        .get(`/api/messages/conversations/${conversation.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);
      
      expect(getConversationResponse.body.success).toBe(true);
      expect(getConversationResponse.body.conversation.messages.length).toBe(3);
    });
  });
  
  describe('Error Handling Integration', () => {
    it('should handle invalid routes gracefully', async () => {
      const response = await request(app)
        .get('/api/invalid-route')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Route not found');
    });
    
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(10).fill().map(() => 
        request(app).get('/api/health')
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed (rate limit is high for health endpoint)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});