const request = require('supertest');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Mock the server
jest.mock('../../src/server', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  // Import product routes
  const productRoutes = require('../../src/routes/products');
  app.use('/api/products', productRoutes);
  
  return { app };
});

const { app } = require('../../src/server');

describe('Products Unit Tests', () => {
  let prisma;
  let seller;
  let buyer;
  let authToken;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  beforeEach(async () => {
    // Clean database
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    
    // Create test users
    seller = await global.testUtils.createTestUser({
      email: 'seller@example.com',
      role: 'SELLER',
      companyName: 'Seller Company',
      contactPerson: 'Seller User'
    });
    
    buyer = await global.testUtils.createTestUser({
      email: 'buyer@example.com',
      role: 'BUYER',
      companyName: 'Buyer Company',
      contactPerson: 'Buyer User'
    });
    
    authToken = jwt.sign(
      { userId: seller.id, role: seller.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });
  
  describe('POST /api/products', () => {
    it('should create a new product successfully', async () => {
      const productData = {
        title: 'Premium Cotton Fabric',
        description: 'High quality cotton fabric for textile manufacturing',
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
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.product).toBeDefined();
      expect(response.body.product.title).toBe(productData.title);
      expect(response.body.product.sellerId).toBe(seller.id);
      expect(response.body.product.status).toBe('ACTIVE');
    });
    
    it('should fail to create product without authentication', async () => {
      const productData = {
        title: 'Test Product',
        description: 'Test description',
        categoryId: 'cat-1',
        quantityAvailable: 100,
        unit: 'meters',
        minOrderQuantity: 10,
        basePrice: 25.50,
        currency: 'USD',
        location: 'New York',
        country: 'US'
      };
      
      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
    
    it('should fail to create product with invalid data', async () => {
      const invalidProductData = {
        title: '', // Empty title
        description: 'Test description',
        categoryId: 'invalid-category',
        quantityAvailable: -100, // Negative quantity
        unit: 'meters',
        minOrderQuantity: 10,
        basePrice: -25.50, // Negative price
        currency: 'USD',
        location: 'New York',
        country: 'US'
      };
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProductData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
    
    it('should fail to create product with non-seller role', async () => {
      const buyerToken = jwt.sign(
        { userId: buyer.id, role: buyer.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const productData = {
        title: 'Test Product',
        description: 'Test description',
        categoryId: 'cat-1',
        quantityAvailable: 100,
        unit: 'meters',
        minOrderQuantity: 10,
        basePrice: 25.50,
        currency: 'USD',
        location: 'New York',
        country: 'US'
      };
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(productData)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Seller access required');
    });
  });
  
  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await global.testUtils.createTestProduct({
        sellerId: seller.id,
        title: 'Cotton Fabric 1',
        description: 'High quality cotton',
        basePrice: 25.50,
        status: 'ACTIVE'
      });
      
      await global.testUtils.createTestProduct({
        sellerId: seller.id,
        title: 'Polyester Fabric',
        description: 'Durable polyester',
        basePrice: 15.75,
        status: 'ACTIVE'
      });
      
      await global.testUtils.createTestProduct({
        sellerId: seller.id,
        title: 'Inactive Product',
        description: 'This product is inactive',
        basePrice: 20.00,
        status: 'INACTIVE'
      });
    });
    
    it('should get all active products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.products).toBeDefined();
      expect(response.body.products.length).toBe(2); // Only active products
      expect(response.body.pagination).toBeDefined();
    });
    
    it('should get products with pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
    
    it('should get products with search query', async () => {
      const response = await request(app)
        .get('/api/products?search=cotton')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].title).toContain('Cotton');
    });
    
    it('should get products with category filter', async () => {
      const response = await request(app)
        .get('/api/products?category=cat-1')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(2);
    });
    
    it('should get products with price range filter', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=20&maxPrice=30')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].basePrice).toBeGreaterThanOrEqual(20);
      expect(response.body.products[0].basePrice).toBeLessThanOrEqual(30);
    });
  });
  
  describe('GET /api/products/:id', () => {
    let product;
    
    beforeEach(async () => {
      product = await global.testUtils.createTestProduct({
        sellerId: seller.id,
        title: 'Test Product',
        description: 'Test description',
        basePrice: 25.50
      });
    });
    
    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/api/products/${product.id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.product).toBeDefined();
      expect(response.body.product.id).toBe(product.id);
      expect(response.body.product.title).toBe(product.title);
    });
    
    it('should fail to get non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/non-existent-id')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });
  });
  
  describe('PUT /api/products/:id', () => {
    let product;
    
    beforeEach(async () => {
      product = await global.testUtils.createTestProduct({
        sellerId: seller.id,
        title: 'Original Title',
        description: 'Original description',
        basePrice: 25.50
      });
    });
    
    it('should update product successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        basePrice: 30.00
      };
      
      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.product.title).toBe(updateData.title);
      expect(response.body.product.description).toBe(updateData.description);
      expect(response.body.product.basePrice).toBe(updateData.basePrice);
    });
    
    it('should fail to update product without authentication', async () => {
      const updateData = {
        title: 'Updated Title'
      };
      
      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send(updateData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should fail to update product by non-owner', async () => {
      const buyerToken = jwt.sign(
        { userId: buyer.id, role: buyer.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const updateData = {
        title: 'Updated Title'
      };
      
      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(updateData)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });
  
  describe('DELETE /api/products/:id', () => {
    let product;
    
    beforeEach(async () => {
      product = await global.testUtils.createTestProduct({
        sellerId: seller.id,
        title: 'Product to Delete',
        description: 'This product will be deleted',
        basePrice: 25.50
      });
    });
    
    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Product deleted successfully');
      
      // Verify product is deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });
      expect(deletedProduct).toBeNull();
    });
    
    it('should fail to delete product without authentication', async () => {
      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should fail to delete product by non-owner', async () => {
      const buyerToken = jwt.sign(
        { userId: buyer.id, role: buyer.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });
});