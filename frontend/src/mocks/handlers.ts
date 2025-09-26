import { rest } from 'msw';

// Mock API handlers for testing
export const handlers = [
  // Health check
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: 'test',
        version: '1.0.0'
      })
    );
  }),

  // Authentication endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'BUYER',
          companyName: 'Test Company',
          contactPerson: 'Test User',
          phone: '+1234567890',
          country: 'US',
          verificationStatus: 'VERIFIED',
          isActive: true,
          isFirstLogin: false
        }
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: 'new-user-id',
          email: 'newuser@example.com',
          role: 'BUYER',
          companyName: 'New Company',
          contactPerson: 'New User',
          phone: '+1234567890',
          country: 'US',
          verificationStatus: 'PENDING',
          isActive: true,
          isFirstLogin: true
        }
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logged out successfully'
      })
    );
  }),

  rest.post('/api/auth/refresh', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token'
      })
    );
  }),

  // User endpoints
  rest.get('/api/users/profile', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'BUYER',
          companyName: 'Test Company',
          contactPerson: 'Test User',
          phone: '+1234567890',
          country: 'US',
          verificationStatus: 'VERIFIED',
          isActive: true,
          isFirstLogin: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    );
  }),

  // Product endpoints
  rest.get('/api/products', (req, res, ctx) => {
    const mockProducts = [
      {
        id: 'product-1',
        title: 'Premium Cotton Fabric',
        description: 'High quality cotton fabric for textile manufacturing',
        sellerId: 'seller-1',
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
        status: 'ACTIVE',
        listingType: 'FIXED_PRICE',
        tags: ['cotton', 'fabric', 'textile'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        seller: {
          id: 'seller-1',
          companyName: 'Seller Company',
          contactPerson: 'Seller User'
        },
        category: {
          id: 'cat-1',
          name: 'Cotton',
          path: '/cotton'
        },
        images: [
          {
            id: 'img-1',
            imageUrl: 'https://example.com/image1.jpg',
            alt: 'Cotton fabric',
            isPrimary: true,
            orderIndex: 0
          }
        ]
      },
      {
        id: 'product-2',
        title: 'Polyester Blend Fabric',
        description: 'Durable polyester blend fabric',
        sellerId: 'seller-2',
        categoryId: 'cat-2',
        quantityAvailable: 500,
        unit: 'meters',
        minOrderQuantity: 25,
        basePrice: 15.75,
        currency: 'USD',
        location: 'Los Angeles',
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        status: 'ACTIVE',
        listingType: 'FIXED_PRICE',
        tags: ['polyester', 'fabric', 'textile'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        seller: {
          id: 'seller-2',
          companyName: 'Another Seller Company',
          contactPerson: 'Another Seller User'
        },
        category: {
          id: 'cat-2',
          name: 'Polyester',
          path: '/polyester'
        },
        images: []
      }
    ];

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        products: mockProducts,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      })
    );
  }),

  rest.get('/api/products/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'non-existent') {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: 'Product not found'
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        product: {
          id: id,
          title: 'Premium Cotton Fabric',
          description: 'High quality cotton fabric for textile manufacturing',
          sellerId: 'seller-1',
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
          status: 'ACTIVE',
          listingType: 'FIXED_PRICE',
          tags: ['cotton', 'fabric', 'textile'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          seller: {
            id: 'seller-1',
            companyName: 'Seller Company',
            contactPerson: 'Seller User',
            phone: '+1234567890',
            country: 'US'
          },
          category: {
            id: 'cat-1',
            name: 'Cotton',
            path: '/cotton'
          },
          images: [
            {
              id: 'img-1',
              imageUrl: 'https://example.com/image1.jpg',
              alt: 'Cotton fabric',
              isPrimary: true,
              orderIndex: 0
            }
          ],
          specifications: [
            {
              id: 'spec-1',
              specName: 'Weight',
              specValue: '150 GSM',
              unit: 'GSM'
            },
            {
              id: 'spec-2',
              specName: 'Width',
              specValue: '60',
              unit: 'inches'
            }
          ]
        }
      })
    );
  }),

  rest.post('/api/products', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        product: {
          id: 'new-product-id',
          title: 'New Product',
          description: 'New product description',
          sellerId: 'test-user-id',
          categoryId: 'cat-1',
          quantityAvailable: 100,
          unit: 'meters',
          minOrderQuantity: 10,
          basePrice: 20.00,
          currency: 'USD',
          location: 'New York',
          city: 'New York',
          state: 'NY',
          country: 'US',
          status: 'ACTIVE',
          listingType: 'FIXED_PRICE',
          tags: ['new', 'product'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    );
  }),

  rest.put('/api/products/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        product: {
          id: id,
          title: 'Updated Product',
          description: 'Updated product description',
          sellerId: 'test-user-id',
          categoryId: 'cat-1',
          quantityAvailable: 100,
          unit: 'meters',
          minOrderQuantity: 10,
          basePrice: 25.00,
          currency: 'USD',
          location: 'New York',
          city: 'New York',
          state: 'NY',
          country: 'US',
          status: 'ACTIVE',
          listingType: 'FIXED_PRICE',
          tags: ['updated', 'product'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    );
  }),

  rest.delete('/api/products/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Product deleted successfully'
      })
    );
  }),

  // Category endpoints
  rest.get('/api/categories', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        categories: [
          {
            id: 'cat-1',
            name: 'Cotton',
            level: 1,
            path: '/cotton',
            description: 'Cotton fabrics',
            isActive: true,
            children: []
          },
          {
            id: 'cat-2',
            name: 'Polyester',
            level: 1,
            path: '/polyester',
            description: 'Polyester fabrics',
            isActive: true,
            children: []
          }
        ]
      })
    );
  }),

  // Auction endpoints
  rest.get('/api/auctions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        auctions: [
          {
            id: 'auction-1',
            productId: 'product-1',
            auctionType: 'ENGLISH',
            startingPrice: 100,
            reservePrice: 150,
            currentBid: 120,
            bidIncrement: 10,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACTIVE',
            bidCount: 2,
            createdAt: new Date().toISOString(),
            product: {
              id: 'product-1',
              title: 'Auction Product',
              description: 'Product for auction',
              basePrice: 100,
              currency: 'USD'
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      })
    );
  }),

  rest.get('/api/auctions/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        auction: {
          id: id,
          productId: 'product-1',
          auctionType: 'ENGLISH',
          startingPrice: 100,
          reservePrice: 150,
          currentBid: 120,
          bidIncrement: 10,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'ACTIVE',
          bidCount: 2,
          createdAt: new Date().toISOString(),
          product: {
            id: 'product-1',
            title: 'Auction Product',
            description: 'Product for auction',
            basePrice: 100,
            currency: 'USD',
            images: [
              {
                id: 'img-1',
                imageUrl: 'https://example.com/auction-image.jpg',
                alt: 'Auction product',
                isPrimary: true,
                orderIndex: 0
              }
            ]
          }
        }
      })
    );
  }),

  rest.post('/api/auctions/:id/bid', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        bid: {
          id: 'bid-1',
          auctionId: req.params.id,
          bidderId: 'test-user-id',
          amount: 130,
          isAutomatic: false,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      })
    );
  }),

  // Message endpoints
  rest.get('/api/messages/conversations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        conversations: [
          {
            id: 'conv-1',
            productId: 'product-1',
            buyerId: 'buyer-1',
            sellerId: 'seller-1',
            buyerAlias: 'Buyer Company',
            sellerAlias: 'Seller Company',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            product: {
              id: 'product-1',
              title: 'Product Title',
              basePrice: 25.50,
              currency: 'USD'
            },
            lastMessage: {
              id: 'msg-1',
              content: 'Hello, I am interested in this product.',
              senderId: 'buyer-1',
              messageType: 'TEXT',
              createdAt: new Date().toISOString()
            }
          }
        ]
      })
    );
  }),

  rest.get('/api/messages/conversations/:id/messages', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        messages: [
          {
            id: 'msg-1',
            conversationId: req.params.id,
            senderId: 'buyer-1',
            receiverId: 'seller-1',
            content: 'Hello, I am interested in this product.',
            messageType: 'TEXT',
            attachments: [],
            readAt: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 'msg-2',
            conversationId: req.params.id,
            senderId: 'seller-1',
            receiverId: 'buyer-1',
            content: 'Thank you for your interest. What would you like to know?',
            messageType: 'TEXT',
            attachments: [],
            readAt: null,
            createdAt: new Date().toISOString()
          }
        ]
      })
    );
  }),

  rest.post('/api/messages', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: {
          id: 'new-msg-id',
          conversationId: 'conv-1',
          senderId: 'test-user-id',
          receiverId: 'seller-1',
          content: 'New message content',
          messageType: 'TEXT',
          attachments: [],
          readAt: null,
          createdAt: new Date().toISOString()
        }
      })
    );
  }),

  // Search endpoints
  rest.get('/api/search', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        results: {
          products: [
            {
              id: 'product-1',
              title: 'Search Result Product',
              description: 'Product found in search',
              basePrice: 25.50,
              currency: 'USD',
              status: 'ACTIVE'
            }
          ],
          total: 1
        }
      })
    );
  }),

  // Error handlers
  rest.get('/api/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        message: 'Internal server error'
      })
    );
  }),

  rest.get('/api/not-found', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        message: 'Resource not found'
      })
    );
  })
];