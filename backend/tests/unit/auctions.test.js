const request = require('supertest');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Mock the server
jest.mock('../../src/server', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  // Import auction routes
  const auctionRoutes = require('../../src/routes/auctions');
  app.use('/api/auctions', auctionRoutes);
  
  return { app };
});

const { app } = require('../../src/server');

describe('Auctions Unit Tests', () => {
  let prisma;
  let seller;
  let buyer1;
  let buyer2;
  let product;
  let auction;
  let sellerToken;
  let buyerToken1;
  let buyerToken2;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  beforeEach(async () => {
    // Clean database
    await prisma.bid.deleteMany();
    await prisma.auction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    
    // Create test users
    seller = await global.testUtils.createTestUser({
      email: 'seller@example.com',
      role: 'SELLER',
      companyName: 'Seller Company',
      contactPerson: 'Seller User'
    });
    
    buyer1 = await global.testUtils.createTestUser({
      email: 'buyer1@example.com',
      role: 'BUYER',
      companyName: 'Buyer Company 1',
      contactPerson: 'Buyer User 1'
    });
    
    buyer2 = await global.testUtils.createTestUser({
      email: 'buyer2@example.com',
      role: 'BUYER',
      companyName: 'Buyer Company 2',
      contactPerson: 'Buyer User 2'
    });
    
    // Create test product
    product = await global.testUtils.createTestProduct({
      sellerId: seller.id,
      title: 'Auction Product',
      description: 'Product for auction',
      basePrice: 100,
      listingType: 'AUCTION'
    });
    
    // Create test auction
    auction = await global.testUtils.createTestAuction({
      productId: product.id,
      startingPrice: 100,
      reservePrice: 150,
      currentBid: 100,
      bidIncrement: 10,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      status: 'ACTIVE'
    });
    
    // Create auth tokens
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
  
  describe('POST /api/auctions', () => {
    it('should create a new auction successfully', async () => {
      const auctionData = {
        productId: product.id,
        auctionType: 'ENGLISH',
        startingPrice: 200,
        reservePrice: 300,
        bidIncrement: 25,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours from now
      };
      
      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(auctionData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.auction).toBeDefined();
      expect(response.body.auction.productId).toBe(auctionData.productId);
      expect(response.body.auction.startingPrice).toBe(auctionData.startingPrice);
      expect(response.body.auction.status).toBe('SCHEDULED');
    });
    
    it('should fail to create auction without authentication', async () => {
      const auctionData = {
        productId: product.id,
        auctionType: 'ENGLISH',
        startingPrice: 200,
        reservePrice: 300,
        bidIncrement: 25,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };
      
      const response = await request(app)
        .post('/api/auctions')
        .send(auctionData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
    
    it('should fail to create auction with invalid data', async () => {
      const invalidAuctionData = {
        productId: 'invalid-product-id',
        auctionType: 'INVALID_TYPE',
        startingPrice: -100, // Negative starting price
        reservePrice: 50, // Reserve price lower than starting price
        bidIncrement: -10, // Negative bid increment
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // End time in the past
      };
      
      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(invalidAuctionData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
    
    it('should fail to create auction for non-existent product', async () => {
      const auctionData = {
        productId: 'non-existent-product-id',
        auctionType: 'ENGLISH',
        startingPrice: 200,
        reservePrice: 300,
        bidIncrement: 25,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };
      
      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(auctionData)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });
  });
  
  describe('GET /api/auctions', () => {
    it('should get all active auctions', async () => {
      const response = await request(app)
        .get('/api/auctions')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.auctions).toBeDefined();
      expect(response.body.auctions.length).toBe(1);
      expect(response.body.auctions[0].id).toBe(auction.id);
    });
    
    it('should get auctions with pagination', async () => {
      const response = await request(app)
        .get('/api/auctions?page=1&limit=1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.auctions.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
    
    it('should get auctions with status filter', async () => {
      const response = await request(app)
        .get('/api/auctions?status=ACTIVE')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.auctions.length).toBe(1);
      expect(response.body.auctions[0].status).toBe('ACTIVE');
    });
  });
  
  describe('GET /api/auctions/:id', () => {
    it('should get auction by id', async () => {
      const response = await request(app)
        .get(`/api/auctions/${auction.id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.auction).toBeDefined();
      expect(response.body.auction.id).toBe(auction.id);
      expect(response.body.auction.product).toBeDefined();
    });
    
    it('should fail to get non-existent auction', async () => {
      const response = await request(app)
        .get('/api/auctions/non-existent-id')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Auction not found');
    });
  });
  
  describe('POST /api/auctions/:id/bid', () => {
    it('should place a bid successfully', async () => {
      const bidData = {
        amount: 120
      };
      
      const response = await request(app)
        .post(`/api/auctions/${auction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken1}`)
        .send(bidData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.bid).toBeDefined();
      expect(response.body.bid.amount).toBe(bidData.amount);
      expect(response.body.bid.bidderId).toBe(buyer1.id);
    });
    
    it('should fail to place bid without authentication', async () => {
      const bidData = {
        amount: 120
      };
      
      const response = await request(app)
        .post(`/api/auctions/${auction.id}/bid`)
        .send(bidData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
    
    it('should fail to place bid lower than current bid', async () => {
      // First bid
      await request(app)
        .post(`/api/auctions/${auction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken1}`)
        .send({ amount: 120 })
        .expect(201);
      
      // Second bid lower than first
      const response = await request(app)
        .post(`/api/auctions/${auction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken2}`)
        .send({ amount: 110 })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Bid amount must be higher');
    });
    
    it('should fail to place bid on ended auction', async () => {
      // Update auction to ended status
      await prisma.auction.update({
        where: { id: auction.id },
        data: { 
          status: 'ENDED',
          endTime: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      });
      
      const bidData = {
        amount: 120
      };
      
      const response = await request(app)
        .post(`/api/auctions/${auction.id}/bid`)
        .set('Authorization', `Bearer ${buyerToken1}`)
        .send(bidData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Auction has ended');
    });
    
    it('should fail to place bid by auction owner', async () => {
      const bidData = {
        amount: 120
      };
      
      const response = await request(app)
        .post(`/api/auctions/${auction.id}/bid`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(bidData)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot bid on your own auction');
    });
  });
  
  describe('GET /api/auctions/:id/bids', () => {
    beforeEach(async () => {
      // Create some test bids
      await prisma.bid.createMany({
        data: [
          {
            auctionId: auction.id,
            bidderId: buyer1.id,
            amount: 110,
            status: 'ACTIVE'
          },
          {
            auctionId: auction.id,
            bidderId: buyer2.id,
            amount: 120,
            status: 'ACTIVE'
          }
        ]
      });
    });
    
    it('should get auction bids', async () => {
      const response = await request(app)
        .get(`/api/auctions/${auction.id}/bids`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.bids).toBeDefined();
      expect(response.body.bids.length).toBe(2);
      expect(response.body.bids[0].amount).toBe(110);
      expect(response.body.bids[1].amount).toBe(120);
    });
    
    it('should get bids with pagination', async () => {
      const response = await request(app)
        .get(`/api/auctions/${auction.id}/bids?page=1&limit=1`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.bids.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });
  
  describe('PUT /api/auctions/:id/end', () => {
    it('should end auction successfully', async () => {
      const response = await request(app)
        .put(`/api/auctions/${auction.id}/end`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Auction ended successfully');
      
      // Verify auction status
      const updatedAuction = await prisma.auction.findUnique({
        where: { id: auction.id }
      });
      expect(updatedAuction.status).toBe('ENDED');
    });
    
    it('should fail to end auction without authentication', async () => {
      const response = await request(app)
        .put(`/api/auctions/${auction.id}/end`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
    
    it('should fail to end auction by non-owner', async () => {
      const response = await request(app)
        .put(`/api/auctions/${auction.id}/end`)
        .set('Authorization', `Bearer ${buyerToken1}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
    
    it('should fail to end already ended auction', async () => {
      // End auction first
      await prisma.auction.update({
        where: { id: auction.id },
        data: { status: 'ENDED' }
      });
      
      const response = await request(app)
        .put(`/api/auctions/${auction.id}/end`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Auction is already ended');
    });
  });
});