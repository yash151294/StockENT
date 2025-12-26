# StockENT Security Guidelines

**@context_tier**: foundation
**@ai_summary**: Security requirements for StockENT including JWT authentication, password hashing, input validation, rate limiting, CORS, XSS/CSRF protection, Socket.io security, and E2E messaging encryption.

## Authentication

### JWT Token Structure

```javascript
// Token payload
{
  userId: "cuid...",
  email: "user@example.com",
  role: "BUYER" | "SELLER" | "ADMIN",
  iat: 1703000000,  // Issued at
  exp: 1703086400   // Expires (24 hours)
}

// Token generation
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
```

### Token Storage

```javascript
// ✅ CORRECT: HTTP-only cookies (server-side)
res.cookie('accessToken', token, {
  httpOnly: true,          // Not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',         // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
});

// ✅ CORRECT: Refresh token in separate cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',      // Only sent to refresh endpoint
});

// ❌ WRONG: localStorage (vulnerable to XSS)
localStorage.setItem('token', token);
```

### Token Verification

```javascript
// backend/src/middleware/auth.js
const authenticateToken = async (req, res, next) => {
  try {
    // 1. Get token from cookie first, then header
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

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch user and verify active status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
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
```

---

## Password Security

### Hashing with bcrypt

```javascript
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

// Hash password
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
```

### Password Requirements

```javascript
// Joi validation
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
  });
```

### Password Reset Flow

```javascript
// 1. Generate secure token
const resetToken = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

// 2. Store in database with expiry
await prisma.verificationToken.create({
  data: {
    userId: user.id,
    token: hashedToken,
    type: 'PASSWORD_RESET',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
});

// 3. Send unhashed token in email
// User clicks link with token, we hash and compare
```

---

## Input Validation

### Joi Validation

```javascript
// ✅ CORRECT: Comprehensive validation
const productSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .required()
    .trim()
    .replace(/<[^>]*>/g, ''), // Strip HTML tags

  description: Joi.string()
    .min(20)
    .max(5000)
    .required(),

  basePrice: Joi.number()
    .positive()
    .precision(2)
    .required(),

  email: Joi.string()
    .email()
    .lowercase()
    .required(),
});
```

### XSS Prevention

```javascript
const xss = require('xss');

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return xss(input);
  }
  return input;
};

// In controller
const createProduct = async (req, res) => {
  const sanitizedData = {
    ...req.body,
    title: sanitizeInput(req.body.title),
    description: sanitizeInput(req.body.description),
  };
  // Continue with sanitized data
};
```

### SQL Injection Prevention

```javascript
// ✅ CORRECT: Prisma parameterized queries (automatic)
const product = await prisma.product.findFirst({
  where: {
    title: { contains: searchTerm },  // Prisma handles escaping
  },
});

// ✅ CORRECT: Raw queries with parameterization
const results = await prisma.$queryRaw`
  SELECT * FROM products WHERE title ILIKE ${`%${searchTerm}%`}
`;

// ❌ WRONG: String concatenation
const results = await prisma.$queryRawUnsafe(
  `SELECT * FROM products WHERE title LIKE '%${searchTerm}%'`  // SQL Injection!
);
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
    error: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static files
    return req.path.startsWith('/uploads/');
  },
});

// Stricter limiter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 attempts
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
});

// Bid limiter (prevent auction manipulation)
const bidLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: 'Too many bids, please slow down',
  },
});
```

### Usage

```javascript
// Apply to routes
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

router.post('/:id/bid', authenticateToken, bidLimiter, auctionController.placeBid);
```

---

## CORS Configuration

```javascript
// backend/src/middleware/cors.js
const cors = require('cors');

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const corsMiddleware = cors(corsOptions);

module.exports = { corsMiddleware };
```

---

## Helmet Security Headers

```javascript
// backend/src/server.js
const helmet = require('helmet');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: false, // Allow embedding
  })
);
```

---

## Socket.io Security

### Authentication

```javascript
// backend/src/utils/socket.js
io.use(async (socket, next) => {
  try {
    // Get token from cookies or auth
    let token = null;

    if (socket.handshake.headers.cookie) {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      token = cookies.accessToken;
    }

    if (!token) {
      token = socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return next(new Error('Invalid or inactive user'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

### Room Authorization

```javascript
// Only allow joining rooms user has access to
socket.on('join_conversation', async (conversationId) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { buyerId: socket.user.id },
        { sellerId: socket.user.id },
      ],
    },
  });

  if (!conversation) {
    socket.emit('error', { message: 'Access denied' });
    return;
  }

  socket.join(`conversation:${conversationId}`);
});
```

---

## E2E Message Encryption

### Key Exchange Flow

```
1. Buyer generates RSA key pair
2. Buyer sends public key to seller via socket
3. Seller generates AES key for conversation
4. Seller encrypts AES key with buyer's RSA public key
5. Seller sends encrypted AES key to buyer
6. Both parties use AES key for message encryption
```

### Implementation

```javascript
// Backend: Store key exchange
socket.on('key_exchange_request', async (data) => {
  const { conversationId, toUserId, encryptedAESKey, keyId, publicKey } = data;

  // Verify access
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ buyerId: socket.user.id }, { sellerId: socket.user.id }],
    },
  });

  if (!conversation) {
    socket.emit('error', { message: 'Access denied' });
    return;
  }

  // Store key exchange
  const keyExchange = await prisma.keyExchange.create({
    data: {
      conversationId,
      fromUserId: socket.user.id,
      toUserId,
      encryptedAESKey,
      keyId,
      publicKey,
      status: 'PENDING',
    },
  });

  // Notify recipient
  io.to(`user:${toUserId}`).emit('key_exchange_received', {
    keyExchangeId: keyExchange.id,
    conversationId,
    fromUser: { id: socket.user.id, companyName: socket.user.companyName },
  });
});
```

### Encrypted Message Storage

```prisma
model Message {
  // ... other fields
  isEncrypted      Boolean  @default(false)
  encryptedContent String?  // Encrypted message
  encryptionKeyId  String?  // Key ID used
  iv               String?  // Initialization vector
  tag              String?  // Auth tag for AES-GCM
  keyExchangeId    String?
}
```

---

## File Upload Security

### Validation

```javascript
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 4, // Max 4 files
  },
  fileFilter: (req, file, cb) => {
    // Whitelist allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }

    // Check file extension matches MIME type
    const ext = path.extname(file.originalname).toLowerCase();
    const extToMime = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    if (extToMime[ext] !== file.mimetype) {
      return cb(new Error('File extension mismatch'));
    }

    cb(null, true);
  },
});
```

### File Storage

```javascript
// Generate unique filename to prevent path traversal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: (req, file, cb) => {
    // Use UUID, not user-provided name
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
```

---

## Environment Variables

### Required Secrets

```bash
# NEVER commit these to git
JWT_SECRET=<random-256-bit-key>
JWT_REFRESH_SECRET=<different-random-key>
DATABASE_URL=postgresql://...

# Generate secure secrets:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### .gitignore

```
.env
.env.local
.env.*.local
*.pem
*.key
```

---

## Security Checklist

### Before Production

- [ ] All secrets in environment variables
- [ ] JWT tokens expire appropriately
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS whitelist production domains only
- [ ] HTTPS enforced
- [ ] Security headers via Helmet
- [ ] No sensitive data in logs
- [ ] File upload validation
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (input sanitization)
- [ ] Socket.io authentication

---

## Related Documentation

- `CLAUDE.md` - Complete project guide
- `ARCHITECTURE.md` - System design patterns
- `API_STANDARDS.md` - REST API guidelines

---

**Last Updated**: 2025-12-26
**Owner**: StockENT Engineering Team
