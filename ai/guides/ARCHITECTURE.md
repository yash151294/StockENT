# StockENT Architecture

**@context_tier**: foundation
**@ai_summary**: StockENT uses a layered architecture with Express.js backend (routes → controllers → services → Prisma), Next.js 14 frontend with App Router, PostgreSQL database, and Socket.io for real-time features.

## System Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                              │
│  Next.js 14 + React 18 + TypeScript + React Query            │
│  Socket.io-client for real-time                              │
└────────────┬─────────────────────────────────────────────────┘
             │ REST API
             │ WebSocket (Socket.io)
┌────────────▼─────────────────────────────────────────────────┐
│                   APPLICATION LAYER                           │
│  Express.js + Node.js + JWT Auth                             │
│  Routes → Controllers → Services → Prisma                    │
└────────────┬─────────────────────────────────────────────────┘
             │ Prisma ORM
             │
┌────────────▼─────────────────────────────────────────────────┐
│                    DATABASE LAYER                             │
│  PostgreSQL + Redis (caching)                                │
└──────────────────────────────────────────────────────────────┘

BACKGROUND PROCESSING:
┌─────────────────────────────────────────────────────────────┐
│  Cron Jobs (node-cron)                                       │
│  - Auction lifecycle (start/end)                             │
│  - Product expiration                                        │
│  - Negotiation expiration                                    │
│  - Cart cleanup                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ROUTES                                │
│  Route definitions, middleware chains                        │
│  Location: backend/src/routes/*.js                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     CONTROLLERS                              │
│  Request parsing, validation, response formatting            │
│  Location: backend/src/controllers/*.js                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      SERVICES                                │
│  Business logic, orchestration, domain rules                 │
│  Location: backend/src/services/*.js                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                       PRISMA                                 │
│  Database queries, transactions                              │
│  Location: backend/prisma/schema.prisma                     │
└─────────────────────────────────────────────────────────────┘
```

### Route Layer

Routes define API endpoints and middleware chains.

```javascript
// backend/src/routes/products.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireSeller } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', authenticateToken, requireSeller, productController.createProduct);
router.put('/:id', authenticateToken, requireSeller, productController.updateProduct);
router.delete('/:id', authenticateToken, requireSeller, productController.deleteProduct);

module.exports = router;
```

### Controller Layer

Controllers handle request/response, delegate to services.

```javascript
// backend/src/controllers/productController.js
const productService = require('../services/productService');

const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
```

### Service Layer

Services contain business logic, use Prisma for data access.

```javascript
// backend/src/services/productService.js
const { getPrismaClient } = require('../utils/prisma');
const { emitToProduct } = require('../utils/socket');

const createProduct = async (sellerId, productData) => {
  const prisma = getPrismaClient();

  // Business logic validation
  if (productData.listingType === 'AUCTION') {
    // Validate auction-specific requirements
  }

  // Create with Prisma
  const product = await prisma.product.create({
    data: {
      sellerId,
      ...productData,
    },
    include: {
      category: true,
      images: true,
    },
  });

  // Real-time notification
  emitToProduct(product.id, 'product_created', product);

  return product;
};
```

### Service Layer Separation (Critical)

**Each service should focus on one domain.**

```javascript
// ❌ WRONG: Service handling multiple domains
class ProductService {
  async createProduct(data) {
    const product = await prisma.product.create(...);
    // Creating auction in product service
    await prisma.auction.create({
      productId: product.id,
      ...
    });
  }
}

// ✅ CORRECT: Handler coordinates multiple services
// Route or controller coordinates
const createAuctionProduct = async (req, res) => {
  const product = await productService.createProduct(req.body);
  const auction = await auctionService.createAuction(product.id, req.body.auctionConfig);
  res.json({ product, auction });
};
```

---

## Frontend Architecture

### Next.js App Router Structure

```
frontend/app/
├── layout.tsx              # Root layout (providers)
├── page.tsx                # Landing page (/)
├── login/
│   └── page.tsx           # Login (/login)
├── register/
│   └── page.tsx           # Register (/register)
├── products/
│   ├── page.tsx           # Product list (/products)
│   ├── create/
│   │   └── page.tsx       # Create product (/products/create)
│   └── [id]/
│       ├── page.tsx       # Product detail (/products/:id)
│       └── edit/
│           └── page.tsx   # Edit product (/products/:id/edit)
├── auctions/
│   ├── page.tsx           # Auction list (/auctions)
│   └── [id]/
│       └── page.tsx       # Auction detail (/auctions/:id)
└── dashboard/
    └── page.tsx           # Dashboard (/dashboard)
```

### Component Architecture

```
frontend/src/
├── components/
│   ├── Layout.tsx         # Main layout wrapper
│   ├── Logo.tsx           # Brand logo
│   ├── PageHeader.tsx     # Page headers
│   ├── ProtectedRoute.tsx # Route protection
│   ├── cart/              # Cart components
│   ├── negotiation/       # Negotiation UI
│   └── ui/                # Radix UI primitives
├── contexts/
│   ├── AuthContext.tsx    # Authentication state
│   ├── CartContext.tsx    # Cart state
│   ├── SocketContext.tsx  # WebSocket connection
│   └── NotificationContext.tsx
├── services/
│   ├── api.ts             # Axios instance
│   ├── cartAPI.ts         # Cart API calls
│   └── messageService.ts  # Message encryption
└── hooks/
    └── useConversations.ts
```

### Context Providers Pattern

```typescript
// frontend/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Server vs Client Components

```typescript
// Server Component (default) - can fetch data directly
// frontend/app/products/page.tsx
export default async function ProductsPage() {
  // This runs on the server
  const products = await fetch(`${API_URL}/products`);
  return <ProductList products={products} />;
}

// Client Component - interactive, uses hooks
// frontend/src/components/ProductCard.tsx
'use client';

import { useState } from 'react';

export default function ProductCard({ product }) {
  const [isWatched, setIsWatched] = useState(false);
  // Client-side interactivity
}
```

---

## Real-Time Architecture

### Socket.io Server Structure

```javascript
// backend/src/utils/socket.js

// 1. Initialize with CORS and authentication
const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: FRONTEND_URL, credentials: true },
    transports: ['websocket', 'polling'],
  });

  // 2. Authentication middleware
  io.use(async (socket, next) => {
    const token = extractToken(socket);
    const user = await verifyToken(token);
    socket.user = user;
    next();
  });

  // 3. Connection handling
  io.on('connection', (socket) => {
    // Join personal room
    socket.join(`user:${socket.user.id}`);

    // Handle events
    socket.on('new_message', handleNewMessage);
    socket.on('new_bid', handleNewBid);
  });
};
```

### Room-Based Broadcasting

```javascript
// Room types and their purposes
const ROOM_TYPES = {
  user: 'user:{userId}',           // Personal notifications
  role: 'role:{role}',             // Role-based broadcasts
  product: 'product:{productId}',  // Product updates
  auction: 'auction:{auctionId}',  // Live bidding
  conversation: 'conversation:{id}', // Messaging
  cart: 'cart:{userId}',           // Cart sync
  negotiation: 'negotiation:{id}', // Negotiation updates
};

// Emit to specific room
emitToAuction(auctionId, 'bid_placed', { bid, currentBid });
```

### Client-Side Socket Integration

```typescript
// frontend/src/contexts/SocketContext.tsx
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_URL, {
        auth: { token: getAccessToken() },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
```

---

## Database Architecture

### Prisma Schema Organization

```prisma
// backend/prisma/schema.prisma

// 1. Generator and datasource
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 2. Core models (User, Product, Category)
// 3. Transaction models (Auction, Bid, Negotiation, CartItem)
// 4. Communication models (Conversation, Message, KeyExchange)
// 5. Support models (Notification, WatchlistItem, SampleRequest)
// 6. Enums
```

### Prisma Client Singleton

```javascript
// backend/src/utils/prisma.js
const { PrismaClient } = require('@prisma/client');

let prisma = null;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }
  return prisma;
};

module.exports = { getPrismaClient };
```

### Transaction Patterns

```javascript
// Multi-step operations use transactions
const endAuction = async (auctionId) => {
  const prisma = getPrismaClient();

  return await prisma.$transaction(async (tx) => {
    // 1. Update auction status
    const auction = await tx.auction.update({
      where: { id: auctionId },
      data: { status: 'ENDED' },
    });

    // 2. Update product status
    await tx.product.update({
      where: { id: auction.productId },
      data: { status: 'SOLD' },
    });

    // 3. Create cart item for winner
    await tx.cartItem.create({
      data: {
        userId: auction.winnerId,
        productId: auction.productId,
        sourceType: 'AUCTION',
        priceAtAddition: auction.currentBid,
      },
    });

    return auction;
  });
};
```

---

## Cron Job Architecture

### Cron Structure

```javascript
// backend/src/cron/index.js
const { startAuctionCron } = require('./auctionCron');
const { startCleanupCron } = require('./cleanupCron');
const { startNegotiationCron } = require('./negotiationCron');
const { startCartCron } = require('./cartCron');

const startAllCronJobs = () => {
  startAuctionCron();      // Every minute
  startCleanupCron();      // Every hour
  startNegotiationCron();  // Every 15 minutes
  startCartCron();         // Every 30 minutes
};

module.exports = { startAllCronJobs };
```

### Auction Cron Example

```javascript
// backend/src/cron/auctionCron.js
const cron = require('node-cron');
const { processScheduledAuctions } = require('../services/auctionService');

const startAuctionCron = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledAuctions();
    } catch (error) {
      logger.error('Auction cron error:', error);
    }
  });
};
```

---

## Error Handling Architecture

### Express Error Middleware

```javascript
// backend/src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
};
```

### Frontend Error Boundaries

```typescript
// frontend/src/components/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## Caching Architecture

### Redis Integration

```javascript
// backend/src/server.js
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

// Make available to routes
app.set('redis', redisClient);
```

### Caching Patterns

```javascript
// Cache frequently accessed data
const getCategories = async (req, res) => {
  const redis = req.app.get('redis');
  const cacheKey = 'categories:all';

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Fetch from DB
  const categories = await prisma.category.findMany();

  // Cache for 1 hour
  await redis.setEx(cacheKey, 3600, JSON.stringify(categories));

  res.json(categories);
};
```

---

## Security Architecture

See `SECURITY.md` for detailed security patterns:
- JWT authentication flow
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- CORS configuration
- Socket.io authentication

---

## Related Documentation

- `CLAUDE.md` - Complete project guide
- `CONVENTIONS.md` - Coding standards
- `API_STANDARDS.md` - REST API guidelines
- `SECURITY.md` - Security requirements

---

**Last Updated**: 2025-12-26
**Owner**: StockENT Engineering Team
