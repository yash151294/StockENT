# Backend Specialist Agent

**Domain**: Express.js, Node.js, Services, Controllers, Prisma

## Tech Stack

```
Runtime:        Node.js 18+
Framework:      Express.js 4.18
ORM:            Prisma 5.6
Authentication: JWT (jsonwebtoken)
Validation:     Joi
Real-time:      Socket.io 4.7
File Upload:    Multer + Sharp
Email:          Nodemailer
Cron:           node-cron
Logging:        Winston + Morgan
```

## Architecture Layers

```
Routes → Controllers → Services → Prisma
```

### Route Layer
- Define endpoints and middleware chains
- Group related routes
- Apply authentication middleware
- Location: `backend/src/routes/*.js`

### Controller Layer
- Parse and validate requests
- Delegate to services
- Format responses
- Handle errors
- Location: `backend/src/controllers/*.js`

### Service Layer
- Business logic
- Database operations via Prisma
- Real-time notifications
- Location: `backend/src/services/*.js`

## Code Patterns

### Service Implementation

```javascript
// backend/src/services/negotiationService.js
const { getPrismaClient } = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { emitToUser, emitToNegotiation } = require('../utils/socket');

/**
 * Create a new negotiation offer
 */
const createNegotiation = async (buyerId, productId, offer, message) => {
  const prisma = getPrismaClient();

  // Get product with seller
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.listingType !== 'NEGOTIABLE') {
    throw new Error('Product does not support negotiation');
  }

  if (product.sellerId === buyerId) {
    throw new Error('Cannot negotiate on your own product');
  }

  // Create negotiation
  const negotiation = await prisma.negotiation.create({
    data: {
      productId,
      buyerId,
      sellerId: product.sellerId,
      buyerOffer: offer,
      buyerMessage: message,
      expiresAt: product.expiresAt,
      status: 'PENDING',
    },
    include: {
      product: true,
      buyer: { select: { id: true, companyName: true } },
    },
  });

  // Notify seller
  emitToUser(product.sellerId, 'negotiation_offer', {
    negotiationId: negotiation.id,
    product: { id: productId, title: product.title },
    offer,
    buyer: negotiation.buyer,
  });

  logger.info(`Negotiation created: ${negotiation.id}`);
  return negotiation;
};

module.exports = { createNegotiation };
```

### Controller Implementation

```javascript
// backend/src/controllers/negotiationController.js
const negotiationService = require('../services/negotiationService');

const createNegotiation = async (req, res) => {
  try {
    const { productId, offer, message } = req.body;

    const negotiation = await negotiationService.createNegotiation(
      req.user.id,
      productId,
      parseFloat(offer),
      message
    );

    res.status(201).json({
      success: true,
      data: negotiation,
      message: 'Offer submitted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = { createNegotiation };
```

### Route Definition

```javascript
// backend/src/routes/negotiations.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireBuyer } = require('../middleware/auth');
const { validateNegotiationCreate } = require('../middleware/validators');
const controller = require('../controllers/negotiationController');

// All routes require authentication
router.use(authenticateToken);

// Buyer routes
router.post('/', requireBuyer, validateNegotiationCreate, controller.createNegotiation);
router.put('/:id/accept', requireBuyer, controller.acceptNegotiation);
router.put('/:id/decline', requireBuyer, controller.declineNegotiation);

// Seller routes
router.put('/:id/counter', controller.counterOffer);

// Common routes
router.get('/my-negotiations', controller.getMyNegotiations);
router.get('/:id', controller.getNegotiationById);

module.exports = router;
```

## Prisma Patterns

### Use Singleton Client

```javascript
// ✅ CORRECT
const { getPrismaClient } = require('../utils/prisma');
const prisma = getPrismaClient();

// ❌ WRONG
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

### Include Related Data

```javascript
// Select only needed fields
const product = await prisma.product.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    basePrice: true,
    seller: {
      select: { id: true, companyName: true },
    },
    images: {
      where: { isPrimary: true },
      select: { imageUrl: true },
    },
  },
});
```

### Use Transactions

```javascript
// Multi-step operations
const acceptNegotiation = async (negotiationId) => {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const negotiation = await tx.negotiation.update({
      where: { id: negotiationId },
      data: { status: 'ACCEPTED' },
    });

    await tx.cartItem.create({
      data: {
        userId: negotiation.buyerId,
        productId: negotiation.productId,
        priceAtAddition: negotiation.sellerCounterOffer,
        sourceType: 'NEGOTIATION',
        negotiationId,
      },
    });

    return negotiation;
  });
};
```

## Socket.io Integration

```javascript
// Import utilities
const { emitToUser, emitToNegotiation, broadcast } = require('../utils/socket');

// In service
const notifyNegotiationUpdate = (negotiation) => {
  // Notify both parties
  emitToUser(negotiation.buyerId, 'negotiation_updated', {
    negotiationId: negotiation.id,
    status: negotiation.status,
  });

  emitToUser(negotiation.sellerId, 'negotiation_updated', {
    negotiationId: negotiation.id,
    status: negotiation.status,
  });

  // Emit to negotiation room (for real-time page updates)
  emitToNegotiation(negotiation.id, 'status_changed', {
    status: negotiation.status,
  });
};
```

## Error Handling

```javascript
// Service level
const getProduct = async (id) => {
  const prisma = getPrismaClient();

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.status !== 'ACTIVE') {
    throw new Error('Product is not available');
  }

  return product;
};

// Controller level
const getProduct = async (req, res) => {
  try {
    const product = await productService.getProduct(req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};
```

## Critical Rules

1. **Never expose Prisma in routes** - Always go through services
2. **Use getPrismaClient()** - Never create new PrismaClient instances
3. **Use transactions** - For multi-step database operations
4. **Emit socket events** - For real-time updates after mutations
5. **Validate input** - In middleware before controller
6. **Log operations** - Using Winston logger

## Files to Reference

- `backend/src/utils/prisma.js` - Prisma client singleton
- `backend/src/utils/socket.js` - Socket.io utilities
- `backend/src/utils/logger.js` - Winston logger
- `backend/src/middleware/auth.js` - Auth middleware
- `backend/prisma/schema.prisma` - Database schema

---

**Last Updated**: 2025-12-26
