# StockENT API Standards

**@context_tier**: foundation
**@ai_summary**: REST API design guidelines for StockENT including Express route patterns, request/response formats, error handling, validation with Joi, and authentication middleware.

## API Design Principles

### RESTful URL Structure

```
GET    /api/resources           # List resources (with pagination)
GET    /api/resources/:id       # Get single resource
POST   /api/resources           # Create resource
PUT    /api/resources/:id       # Update resource
DELETE /api/resources/:id       # Delete resource

# Nested resources
GET    /api/products/:id/images
POST   /api/auctions/:id/bids

# Actions (when REST doesn't fit)
POST   /api/auctions/:id/restart
POST   /api/conversations/:id/close
```

### URL Naming Rules

```javascript
// ✅ CORRECT: Plural nouns, lowercase, hyphens
/api/products
/api/auctions
/api/cart-items
/api/sample-requests

// ❌ WRONG: Various anti-patterns
/api/product          // Use plural
/api/getProducts      // No verbs in URL
/api/ProductList      // Use lowercase
/api/cart_items       // Use hyphens, not underscores
```

---

## Request/Response Format

### Standard Success Response

```javascript
// Single resource
{
  "success": true,
  "data": {
    "id": "cuid...",
    "title": "Cotton Fabric",
    "basePrice": 150.00
  }
}

// List with pagination
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}

// Create response (201)
{
  "success": true,
  "data": {
    "id": "cuid...",
    "message": "Product created successfully"
  }
}
```

### Standard Error Response

```javascript
// Validation error (400)
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}

// Authentication error (401)
{
  "success": false,
  "error": "Authentication required"
}

// Authorization error (403)
{
  "success": false,
  "error": "Seller access required"
}

// Not found error (404)
{
  "success": false,
  "error": "Product not found"
}

// Conflict error (409)
{
  "success": false,
  "error": "User with this email already exists"
}

// Server error (500)
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Route Implementation

### Route File Structure

```javascript
// backend/src/routes/products.js
const express = require('express');
const router = express.Router();

// Middleware imports
const { authenticateToken, requireSeller, optionalAuth } = require('../middleware/auth');
const { validateProductCreate, validateProductUpdate } = require('../middleware/validators/productValidators');
const upload = require('../middleware/upload');

// Controller imports
const productController = require('../controllers/productController');

// ================
// Public Routes
// ================
router.get('/', optionalAuth, productController.getProducts);
router.get('/tags', productController.getProductTags);
router.get('/:id', optionalAuth, productController.getProductById);

// ================
// Protected Routes
// ================
router.use(authenticateToken); // All routes below require auth

// Seller routes
router.post(
  '/',
  requireSeller,
  upload.array('images', 4),
  validateProductCreate,
  productController.createProduct
);

router.put(
  '/:id',
  requireSeller,
  upload.array('images', 4),
  validateProductUpdate,
  productController.updateProduct
);

router.delete('/:id', requireSeller, productController.deleteProduct);
router.get('/seller/my-products', requireSeller, productController.getMyProducts);

// Watchlist routes (any authenticated user)
router.post('/watchlist', productController.addToWatchlist);
router.delete('/watchlist/:productId', productController.removeFromWatchlist);
router.get('/watchlist/my', productController.getMyWatchlist);

module.exports = router;
```

### Controller Implementation

```javascript
// backend/src/controllers/productController.js

/**
 * @route GET /api/products
 * @desc Get products with filters and pagination
 * @access Public
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      country,
      status = 'ACTIVE',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await productService.getProducts({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      country,
      status,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * @route POST /api/products
 * @desc Create a new product
 * @access Seller only
 */
const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(
      req.user.id,
      req.body,
      req.files
    );

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
```

---

## Request Validation

### Joi Schema Pattern

```javascript
// backend/src/middleware/validators/productValidators.js
const Joi = require('joi');

const productCreateSchema = Joi.object({
  title: Joi.string().min(3).max(200).required()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required',
    }),

  description: Joi.string().min(20).max(5000).required()
    .messages({
      'string.min': 'Description must be at least 20 characters',
      'any.required': 'Description is required',
    }),

  categoryId: Joi.string().required(),

  basePrice: Joi.number().positive().required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required',
    }),

  currency: Joi.string().valid('USD', 'INR', 'CNY', 'TRY').default('USD'),

  quantityAvailable: Joi.number().positive().required(),

  unit: Joi.string().valid('kg', 'meters', 'yards', 'pieces').required(),

  minOrderQuantity: Joi.number().positive().required(),

  listingType: Joi.string()
    .valid('FIXED_PRICE', 'AUCTION', 'NEGOTIABLE')
    .default('FIXED_PRICE'),

  location: Joi.string().required(),
  country: Joi.string().required(),

  tags: Joi.array().items(Joi.string()).optional(),

  // Conditional validation for auction products
  auctionConfig: Joi.when('listingType', {
    is: 'AUCTION',
    then: Joi.object({
      startingPrice: Joi.number().positive().required(),
      reservePrice: Joi.number().positive().optional(),
      bidIncrement: Joi.number().positive().required(),
      startTime: Joi.date().iso().greater('now').required(),
      endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
      auctionType: Joi.string()
        .valid('ENGLISH', 'DUTCH', 'SEALED_BID')
        .default('ENGLISH'),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
});

const validateProductCreate = (req, res, next) => {
  const { error, value } = productCreateSchema.validate(req.body, {
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

  req.body = value; // Use sanitized value
  next();
};

module.exports = { validateProductCreate };
```

---

## Pagination

### Query Parameters

```
GET /api/products?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### Implementation

```javascript
const getProducts = async ({
  page = 1,
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  ...filters
}) => {
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: buildWhereClause(filters),
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        seller: { select: { id: true, companyName: true } },
        images: { where: { isPrimary: true } },
      },
    }),
    prisma.product.count({ where: buildWhereClause(filters) }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
```

---

## Authentication

### Middleware Chain

```javascript
// Public route
router.get('/products', productController.getProducts);

// Optional auth (returns user if token present)
router.get('/products/:id', optionalAuth, productController.getProductById);

// Required auth
router.post('/cart', authenticateToken, cartController.addToCart);

// Role-specific
router.post('/products', authenticateToken, requireSeller, productController.create);
router.get('/admin/users', authenticateToken, requireRole(['ADMIN']), adminController.getUsers);
```

### Auth Middleware Implementation

```javascript
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { getPrismaClient } = require('../utils/prisma');

const authenticateToken = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await getPrismaClient().user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        companyName: true,
        isActive: true,
        verificationStatus: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }

  next();
};

const requireSeller = requireRole(['SELLER', 'ADMIN']);
const requireBuyer = requireRole(['BUYER', 'ADMIN']);
const requireAdmin = requireRole(['ADMIN']);
```

---

## Error Handling

### Error Handler Middleware

```javascript
// backend/src/middleware/errorHandler.js
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      field: err.meta?.target?.[0],
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.details,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
```

### Custom Error Classes

```javascript
// backend/src/utils/errors.js

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.details = details;
    this.name = 'ValidationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
};
```

---

## Rate Limiting

### Implementation

```javascript
// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000000 : 1000,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for bidding
const bidLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: 'Too many bids, please slow down',
  },
});

// Auth endpoints limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts',
  },
});

module.exports = { apiLimiter, bidLimiter, authLimiter };
```

---

## File Upload

### Multer Configuration

```javascript
// backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 4,
  },
});

module.exports = upload;
```

---

## API Documentation

### JSDoc Comments

```javascript
/**
 * @route POST /api/auctions/:id/bid
 * @desc Place a bid on an active auction
 * @access Private (authenticated users, not seller)
 *
 * @param {string} req.params.id - Auction ID
 * @body {number} amount - Bid amount (must be > current bid)
 * @body {number} [quantity=1] - Quantity to bid on
 *
 * @returns {Object} 201 - Created bid object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 403 - Seller cannot bid
 * @returns {Object} 404 - Auction not found
 */
const placeBid = async (req, res) => {
  // Implementation
};
```

---

## Related Documentation

- `CLAUDE.md` - Complete project guide
- `ARCHITECTURE.md` - System design patterns
- `SECURITY.md` - Security requirements
- `CONVENTIONS.md` - Coding standards

---

**Last Updated**: 2025-12-26
**Owner**: StockENT Engineering Team
