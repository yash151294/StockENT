# API Specialist Agent

**Domain**: Express Routes, Validation, DTOs, Middleware

## Route Design

### RESTful Patterns

```javascript
// Resource routes
GET    /api/products           // List
GET    /api/products/:id       // Get one
POST   /api/products           // Create
PUT    /api/products/:id       // Update
DELETE /api/products/:id       // Delete

// Nested resources
GET    /api/products/:id/images
POST   /api/auctions/:id/bids

// Actions (non-CRUD operations)
POST   /api/auctions/:id/restart
POST   /api/conversations/:id/close
```

### Route File Structure

```javascript
// backend/src/routes/negotiations.js
const express = require('express');
const router = express.Router();

// Middleware
const { authenticateToken, requireBuyer, requireSeller } = require('../middleware/auth');
const { validateCreate, validateCounter } = require('../middleware/validators/negotiationValidators');

// Controller
const controller = require('../controllers/negotiationController');

// ===================
// All routes require auth
// ===================
router.use(authenticateToken);

// ===================
// Buyer Routes
// ===================
router.post('/', requireBuyer, validateCreate, controller.createNegotiation);
router.put('/:id/accept', requireBuyer, controller.acceptNegotiation);
router.put('/:id/decline', requireBuyer, controller.declineNegotiation);

// ===================
// Seller Routes
// ===================
router.put('/:id/counter', requireSeller, validateCounter, controller.counterOffer);

// ===================
// Common Routes
// ===================
router.get('/my-negotiations', controller.getMyNegotiations);
router.get('/:id', controller.getNegotiationById);

module.exports = router;
```

## Validation with Joi

### Schema Definition

```javascript
// backend/src/middleware/validators/negotiationValidators.js
const Joi = require('joi');

const negotiationCreateSchema = Joi.object({
  productId: Joi.string()
    .required()
    .messages({
      'any.required': 'Product ID is required',
    }),

  offer: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Offer must be a positive number',
      'any.required': 'Offer amount is required',
    }),

  message: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Message cannot exceed 500 characters',
    }),
});

const counterOfferSchema = Joi.object({
  counterOffer: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Counter offer must be positive',
      'any.required': 'Counter offer amount is required',
    }),

  message: Joi.string()
    .max(500)
    .optional(),
});
```

### Validation Middleware

```javascript
const validateCreate = (req, res, next) => {
  const { error, value } = negotiationCreateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details,
    });
  }

  req.body = value; // Use sanitized/typed value
  next();
};

module.exports = {
  validateCreate,
  validateCounter,
};
```

## Response Formats

### Success Responses

```javascript
// Single resource (200)
{
  "success": true,
  "data": {
    "id": "cuid...",
    "status": "PENDING",
    "buyerOffer": 150.00
  }
}

// Created resource (201)
{
  "success": true,
  "data": {
    "id": "cuid...",
    ...
  },
  "message": "Negotiation created successfully"
}

// List with pagination (200)
{
  "success": true,
  "data": {
    "negotiations": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}

// No content (204)
// Empty response body
```

### Error Responses

```javascript
// Validation error (400)
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "offer", "message": "Offer must be positive" }
  ]
}

// Unauthorized (401)
{
  "success": false,
  "error": "Authentication required"
}

// Forbidden (403)
{
  "success": false,
  "error": "Buyer access required"
}

// Not found (404)
{
  "success": false,
  "error": "Negotiation not found"
}

// Conflict (409)
{
  "success": false,
  "error": "Negotiation already exists for this product"
}

// Server error (500)
{
  "success": false,
  "error": "Internal server error"
}
```

## Middleware Chains

### Order Matters

```javascript
router.post(
  '/',
  authenticateToken,        // 1. Auth first
  requireBuyer,             // 2. Role check
  upload.array('files'),    // 3. File handling
  validateCreate,           // 4. Validation
  controller.create         // 5. Handler
);
```

### Common Middleware

```javascript
// Auth required
router.use(authenticateToken);

// Role-specific routes
router.post('/', requireSeller, ...);
router.put('/:id', requireOwner, ...);

// Optional auth
router.get('/', optionalAuth, ...);
```

## Query Parameters

### Pagination

```javascript
// ?page=1&limit=20
const { page = 1, limit = 20 } = req.query;
const skip = (parseInt(page) - 1) * parseInt(limit);
```

### Filtering

```javascript
// ?status=ACTIVE&category=textile&minPrice=100
const { status, category, minPrice, maxPrice } = req.query;
```

### Sorting

```javascript
// ?sortBy=createdAt&sortOrder=desc
const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
```

## Controller Pattern

```javascript
// backend/src/controllers/negotiationController.js

const createNegotiation = async (req, res) => {
  try {
    const { productId, offer, message } = req.body;

    const negotiation = await negotiationService.createNegotiation(
      req.user.id,
      productId,
      offer,
      message
    );

    res.status(201).json({
      success: true,
      data: negotiation,
      message: 'Offer submitted successfully',
    });
  } catch (error) {
    // Map error to appropriate status
    let status = 400;
    if (error.message.includes('not found')) status = 404;
    if (error.message.includes('not allowed')) status = 403;

    res.status(status).json({
      success: false,
      error: error.message,
    });
  }
};
```

## Route Registration

```javascript
// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/products', require('./products'));
router.use('/auctions', require('./auctions'));
router.use('/negotiations', require('./negotiations'));
router.use('/messages', require('./messages'));
router.use('/cart', require('./cart'));

module.exports = router;

// backend/src/server.js
app.use('/api', require('./routes'));
```

## Critical Rules

1. **Validate all input** - Never trust client data
2. **Consistent responses** - Use standard format
3. **Proper status codes** - Match HTTP semantics
4. **Auth before validation** - Check auth first
5. **Sanitize output** - Don't leak sensitive data
6. **Document routes** - JSDoc comments

---

**Last Updated**: 2025-12-26
