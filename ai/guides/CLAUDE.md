# StockENT Project Guide

**@context_tier**: foundation
**@ai_summary**: StockENT is a B2B dead-stock textile trading platform with Express.js backend (Node.js), Next.js 14 frontend, PostgreSQL database via Prisma ORM, and real-time features via Socket.io. Key features: product listings, live auctions, price negotiations, cart/checkout, and encrypted messaging.

## Project Overview

StockENT is a comprehensive **B2B Dead-Stock Trading Platform** for the textile industry. It enables businesses to buy, sell, and auction excess inventory through a feature-rich marketplace with real-time capabilities.

### Business Domain

**Core Users:**
- **BUYERS**: Purchase products, participate in auctions, negotiate prices
- **SELLERS**: List products, manage auctions, respond to negotiations
- **ADMINS**: Platform management, analytics, user verification

**Key Features:**
1. Product Listings (fixed price, auction, negotiable)
2. Live Auction System (English, Dutch, Sealed-Bid)
3. Price Negotiation (offer/counter-offer workflow)
4. Shopping Cart with price locking
5. Real-time Messaging with E2E encryption
6. Watchlist for tracking products
7. Sample Request management

---

## Technology Stack

### Backend
```
Runtime:        Node.js 18+
Framework:      Express.js 4.18
ORM:            Prisma 5.6
Database:       PostgreSQL
Caching:        Redis
Real-time:      Socket.io 4.7
Authentication: JWT (jsonwebtoken)
File Upload:    Multer + Sharp
Email:          Nodemailer + Handlebars
Validation:     Joi
Logging:        Winston + Morgan
Task Scheduling: node-cron
```

### Frontend
```
Framework:      Next.js 14 (App Router)
React:          React 18
Language:       TypeScript
State:          React Query (@tanstack/react-query)
UI:             Material-UI + Radix UI + TailwindCSS
Forms:          React Hook Form + Formik
Real-time:      Socket.io-client
Routing:        Next.js App Router
Charts:         Recharts
Dates:          date-fns
i18n:           react-i18next
```

### Database
```
RDBMS:          PostgreSQL
ORM:            Prisma
Migrations:     Prisma Migrate
```

---

## Project Structure

```
StockENT/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # Prisma migrations
│   │   └── seed.js                # Database seeding
│   ├── src/
│   │   ├── server.js              # Express app entry point
│   │   ├── controllers/           # Request handlers
│   │   ├── routes/                # API route definitions
│   │   ├── services/              # Business logic
│   │   ├── middleware/            # Express middleware
│   │   ├── cron/                  # Scheduled tasks
│   │   └── utils/                 # Utilities (socket, logger, prisma)
│   ├── uploads/                   # Uploaded files
│   └── package.json
│
├── frontend/
│   ├── app/                       # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page
│   │   ├── login/                 # Auth pages
│   │   ├── register/
│   │   ├── products/              # Product pages
│   │   │   ├── page.tsx           # Product listing
│   │   │   └── [id]/              # Dynamic product detail
│   │   ├── auctions/              # Auction pages
│   │   ├── messages/              # Messaging
│   │   ├── cart/                  # Shopping cart
│   │   ├── negotiations/          # Negotiation management
│   │   ├── dashboard/             # User dashboard
│   │   ├── profile/               # User profile
│   │   └── admin/                 # Admin panel
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── contexts/              # React contexts
│   │   ├── services/              # API client services
│   │   ├── hooks/                 # Custom hooks
│   │   ├── types/                 # TypeScript types
│   │   └── utils/                 # Utilities
│   └── package.json
│
└── ai/                            # AI development infrastructure
    ├── config/
    ├── guides/
    ├── orchestration/
    └── tools/
```

---

## Development Commands

### Backend
```bash
cd backend

# Development
npm run dev                        # Start with nodemon (hot reload)
npm start                          # Production start

# Database
npm run db:migrate                 # Run Prisma migrations (dev)
npm run db:deploy                  # Deploy migrations (prod)
npm run db:generate                # Generate Prisma client
npm run db:seed                    # Seed database
npm run db:studio                  # Open Prisma Studio
npm run db:reset                   # Reset database

# Quality
npm run lint                       # ESLint check
npm run lint:fix                   # ESLint fix
npm run format                     # Prettier format
npm test                           # Run Jest tests
npm run test:watch                 # Jest watch mode
npm run test:coverage              # Coverage report
```

### Frontend
```bash
cd frontend

# Development
npm run dev                        # Next.js dev server
npm run build                      # Production build
npm start                          # Production start

# Quality
npm run lint                       # ESLint check
npm run lint:fix                   # ESLint fix
npm run format                     # Prettier format
npm run type-check                 # TypeScript check
```

---

## Database Schema

### Core Models

**User**
```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  passwordHash      String?
  googleId          String?  @unique
  role              UserRole @default(BUYER)
  companyName       String?
  contactPerson     String?
  phone             String?
  country           String?
  profileImageUrl   String?
  verificationStatus VerificationStatus @default(PENDING)
  isActive          Boolean  @default(true)
  // ... relations
}
```

**Product**
```prisma
model Product {
  id                String      @id @default(cuid())
  sellerId          String
  categoryId        String
  title             String
  description       String
  quantityAvailable Float
  unit              String
  minOrderQuantity  Float
  basePrice         Float
  currency          Currency    @default(USD)
  location          String
  status            ProductStatus @default(ACTIVE)
  listingType       ListingType @default(FIXED_PRICE)
  expiresAt         DateTime?
  tags              String[]
  // ... relations
}
```

**Auction**
```prisma
model Auction {
  id            String      @id @default(cuid())
  productId     String      @unique
  auctionType   AuctionType @default(ENGLISH)
  startingPrice Float
  reservePrice  Float?
  currentBid    Float?
  bidIncrement  Float
  startTime     DateTime
  endTime       DateTime
  status        AuctionStatus @default(SCHEDULED)
  winnerId      String?
  bidCount      Int         @default(0)
  // ... relations
}
```

**Negotiation**
```prisma
model Negotiation {
  id                 String            @id @default(cuid())
  productId          String
  buyerId            String
  sellerId           String
  buyerOffer         Float
  sellerCounterOffer Float?
  status             NegotiationStatus @default(PENDING)
  expiresAt          DateTime?
  // ... relations
  @@unique([productId, buyerId])
}
```

### Key Enums
```prisma
enum UserRole { BUYER, SELLER, ADMIN }
enum ProductStatus { ACTIVE, INACTIVE, SOLD, EXPIRED }
enum ListingType { FIXED_PRICE, AUCTION, NEGOTIABLE }
enum AuctionType { ENGLISH, DUTCH, SEALED_BID }
enum AuctionStatus { SCHEDULED, ACTIVE, ENDED, CANCELLED }
enum NegotiationStatus { PENDING, COUNTERED, ACCEPTED, DECLINED, EXPIRED, CANCELLED }
enum CartItemSource { DIRECT, NEGOTIATION, AUCTION }
```

---

## API Routes

### Authentication (`/api/auth`)
```
POST /register              # User registration
POST /login                 # Email/password login
POST /google                # Google OAuth callback
POST /refresh               # Refresh JWT token
POST /logout                # Logout
POST /verify-email          # Verify email token
POST /resend-verification   # Resend verification
POST /forgot-password       # Request password reset
POST /reset-password        # Reset password with token
```

### Products (`/api/products`)
```
GET    /                    # List products (with filters)
GET    /:id                 # Get product details
POST   /                    # Create product (seller)
PUT    /:id                 # Update product (seller)
DELETE /:id                 # Delete product (seller)
GET    /my-products         # Seller's products
POST   /watchlist           # Add to watchlist
DELETE /watchlist/:id       # Remove from watchlist
GET    /watchlist           # Get user's watchlist
```

### Auctions (`/api/auctions`)
```
GET    /                    # List active auctions
GET    /:id                 # Get auction details
POST   /:id/bid             # Place bid
GET    /my-auctions         # Seller's auctions
GET    /my-bids             # User's bids
POST   /:id/restart         # Restart ended auction
```

### Messages (`/api/messages`)
```
POST   /send                # Send message
GET    /conversations       # List conversations
GET    /:conversationId     # Get messages
DELETE /:messageId          # Delete message
POST   /close               # Close conversation
POST   /mark-read           # Mark as read
GET    /unread-count        # Get unread count
POST   /key-exchange        # E2E encryption key exchange
```

### Cart (`/api/cart`)
```
POST   /add                 # Add item to cart
GET    /                    # Get cart items
DELETE /:itemId             # Remove from cart
PUT    /:itemId             # Update quantity
```

### Negotiations (`/api/negotiations`)
```
POST   /                    # Create offer
PUT    /:id                 # Counter-offer
DELETE /:id                 # Decline
GET    /my-negotiations     # User's negotiations
```

---

## Real-Time Events (Socket.io)

### Room Types
```javascript
// Personal rooms
socket.join(`user:${userId}`);       // User notifications
socket.join(`role:${role}`);         // Role-based broadcasts

// Feature rooms
socket.join(`product:${productId}`); // Product updates
socket.join(`auction:${auctionId}`); // Live bidding
socket.join(`conversation:${id}`);   // Message delivery
socket.join(`cart:${userId}`);       // Cart sync
socket.join(`negotiation:${id}`);    // Negotiation updates
```

### Event Types

**Messaging Events:**
```javascript
// Client → Server
socket.emit('new_message', { conversationId, content, encryptionData });
socket.emit('typing_start', { conversationId });
socket.emit('typing_stop', { conversationId });
socket.emit('delete_message', { messageId });

// Server → Client
socket.on('message_received', (message) => {});
socket.on('new_message_notification', (data) => {});
socket.on('user_typing', (data) => {});
socket.on('message_deleted', (data) => {});
```

**Auction Events:**
```javascript
// Client → Server
socket.emit('new_bid', { auctionId, amount });

// Server → Client
socket.on('bid_placed', (data) => {});
socket.on('auction_started', (data) => {});
socket.on('auction_ended', (data) => {});
socket.on('auction_status_changed', (data) => {});
```

**Encryption Events:**
```javascript
socket.emit('key_exchange_request', { conversationId, toUserId, ... });
socket.on('key_exchange_received', (data) => {});
socket.on('key_exchange_processed', (data) => {});
```

### Utility Functions
```javascript
// Backend: backend/src/utils/socket.js
emitToUser(userId, event, data);
emitToRole(role, event, data);
emitToProduct(productId, event, data);
emitToAuction(auctionId, event, data);
emitToConversation(conversationId, event, data);
emitToCart(userId, event, data);
emitToNegotiation(negotiationId, event, data);
broadcast(event, data);
```

---

## Critical Business Logic

### Auction System

**Auction Types:**
1. **ENGLISH**: Traditional ascending bid auction
2. **DUTCH**: Descending price (not fully implemented)
3. **SEALED_BID**: Hidden bids until end

**Auction Lifecycle:**
```
SCHEDULED → ACTIVE → ENDED
    │          │        │
    │          │        └→ Winner determined
    │          │           Price = highest bid
    │          │           Cart item created
    │          │
    │          └→ Bids accepted
    │             Real-time updates
    │
    └→ Cron job starts auction when startTime reached
```

**Critical Code:**
```javascript
// backend/src/services/auctionService.js
const placeBid = async (auctionId, bidderId, amount, quantity) => {
  // Verify auction is ACTIVE
  // Check bidder is not seller
  // Validate amount > currentBid
  // Create bid record
  // Update auction.currentBid
  // Emit real-time event
};
```

**Auto-Processing (Cron):**
```javascript
// backend/src/cron/auctionCron.js
// Runs every minute
// - Starts SCHEDULED auctions when startTime reached
// - Ends ACTIVE auctions when endTime reached
// - Creates cart item for winner
```

### Negotiation System

**Negotiation Flow:**
```
Buyer sends offer → PENDING
  ↓
Seller counters → COUNTERED
  ↓
Buyer accepts → ACCEPTED → Cart item created
     or
Buyer declines → DECLINED
     or
Product expires → EXPIRED
```

**Critical Code:**
```javascript
// backend/src/services/negotiationService.js
const acceptNegotiation = async (negotiationId, buyerId) => {
  // Verify negotiation is COUNTERED
  // Verify buyer owns negotiation
  // Update status to ACCEPTED
  // Create cart item with negotiated price
  // Emit notification to seller
};
```

### Cart System

**Cart Sources:**
1. **DIRECT**: Normal purchase at basePrice
2. **AUCTION**: Won auction, price = winning bid
3. **NEGOTIATION**: Accepted negotiation, price = agreed price

**Price Locking:**
```javascript
// Price is locked when item is added to cart
cartItem.priceAtAddition = price; // Never changes
```

**Cart Item Creation:**
```javascript
// From auction win
await cartService.addToCart(winnerId, productId, quantity, 'AUCTION', winningBid);

// From negotiation acceptance
await cartService.addToCart(buyerId, productId, quantity, 'NEGOTIATION', negotiatedPrice);
```

### Messaging System

**E2E Encryption:**
1. Buyer initiates key exchange (RSA public key)
2. Seller generates AES key, encrypts with buyer's public key
3. Both parties use AES key for message encryption
4. Messages stored encrypted, decrypted client-side

**Key Exchange Flow:**
```javascript
// Frontend: frontend/src/services/keyService.ts
// 1. Generate RSA key pair
// 2. Send public key via socket
// 3. Receive encrypted AES key
// 4. Decrypt AES key with private key
// 5. Use AES key for all messages
```

---

## Authentication Flow

### JWT Authentication
```javascript
// Token structure
{
  userId: "cuid...",
  email: "user@example.com",
  role: "BUYER|SELLER|ADMIN",
  iat: timestamp,
  exp: timestamp + 24h
}

// Cookie-based storage (default)
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

### Middleware
```javascript
// backend/src/middleware/auth.js
authenticateToken     // Require valid JWT
requireRole(['ADMIN']) // Require specific role
requireVerified       // Require email verified
requireSeller         // Require SELLER role
requireBuyer          // Require BUYER role
optionalAuth          // Auth optional
```

---

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/stockent"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
EMAIL_FROM=noreply@stockent.com

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
```

---

## Common Gotchas

### Backend

1. **Prisma Client Singleton**
   ```javascript
   // ✅ CORRECT: Use singleton
   const { getPrismaClient } = require('../utils/prisma');
   const prisma = getPrismaClient();

   // ❌ WRONG: Create new client
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   ```

2. **Socket.io in Services**
   ```javascript
   // ✅ CORRECT: Import utilities
   const { emitToUser } = require('../utils/socket');
   emitToUser(userId, 'event', data);

   // ❌ WRONG: Try to access io directly
   req.app.get('io').emit(...); // Only works in routes
   ```

3. **Transaction Handling**
   ```javascript
   // ✅ CORRECT: Use Prisma transactions
   await prisma.$transaction(async (tx) => {
     await tx.auction.update(...);
     await tx.product.update(...);
   });
   ```

### Frontend

1. **Server vs Client Components**
   ```typescript
   // Server Component (default in app/)
   export default async function Page() {
     const data = await fetchData(); // Can fetch server-side
     return <ClientComponent data={data} />;
   }

   // Client Component (needs 'use client')
   'use client';
   export default function ClientComponent({ data }) {
     const [state, setState] = useState();
     // Can use hooks
   }
   ```

2. **Socket Context**
   ```typescript
   // ✅ CORRECT: Use context
   const { socket } = useSocket();

   // ❌ WRONG: Create new socket
   const socket = io(url);
   ```

3. **React Query Keys**
   ```typescript
   // ✅ CORRECT: Include all dependencies
   useQuery(['products', filters], () => fetchProducts(filters));

   // ❌ WRONG: Missing dependencies
   useQuery(['products'], () => fetchProducts(filters));
   ```

---

## Testing Strategy

### Backend Testing
```javascript
// Jest + Supertest
describe('POST /api/auth/login', () => {
  it('should return tokens for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

### Frontend Testing
```typescript
// Vitest + React Testing Library
describe('ProductCard', () => {
  it('should render product title', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
  });
});
```

---

## Deployment Checklist

1. **Database**
   - [ ] Run `npm run db:deploy` for migrations
   - [ ] Verify all environment variables set
   - [ ] Enable SSL for database connection

2. **Backend**
   - [ ] Set `NODE_ENV=production`
   - [ ] Configure production Redis
   - [ ] Set up proper CORS origins
   - [ ] Enable rate limiting

3. **Frontend**
   - [ ] Build with `npm run build`
   - [ ] Configure production API URLs
   - [ ] Set up CDN for static assets

4. **Monitoring**
   - [ ] Set up error tracking (Sentry)
   - [ ] Configure log aggregation
   - [ ] Set up health checks

---

## Related Documentation

- `ARCHITECTURE.md` - System design patterns
- `CONVENTIONS.md` - Coding standards
- `API_STANDARDS.md` - REST API guidelines
- `SECURITY.md` - Security requirements
- `ANTI_PATTERNS.md` - Common mistakes to avoid

---

**Last Updated**: 2025-12-26
**Owner**: StockENT Engineering Team
