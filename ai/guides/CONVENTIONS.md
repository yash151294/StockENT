# StockENT Coding Conventions

**@context_tier**: foundation
**@ai_summary**: Coding standards for StockENT including Node.js/Express patterns, Next.js/React patterns, Prisma patterns, file naming, and code quality guidelines.

## File Naming Conventions

### Backend (JavaScript)

```
routes/
  auth.js                   # Route definitions (kebab-case or camelCase)
  products.js
  auctions.js

controllers/
  authController.js         # camelCase with Controller suffix
  productController.js
  auctionController.js

services/
  authService.js            # camelCase with Service suffix
  productService.js
  auctionService.js
  emailService.js

middleware/
  auth.js                   # Short descriptive names
  rateLimiter.js
  upload.js
  errorHandler.js

utils/
  socket.js                 # Utility modules
  logger.js
  prisma.js

cron/
  auctionCron.js           # Cron job modules
  cleanupCron.js
  index.js                 # Entry point exports
```

### Frontend (TypeScript/React)

```
app/                        # Next.js App Router
  layout.tsx               # Root layout
  page.tsx                 # Page components
  products/
    page.tsx
    [id]/
      page.tsx

src/components/
  Layout.tsx               # PascalCase for components
  Logo.tsx
  PageHeader.tsx
  ProtectedRoute.tsx
  cart/
    CartItem.tsx
    CartSummary.tsx
  ui/                      # Radix UI primitives
    button.tsx             # lowercase for primitives
    dialog.tsx

src/contexts/
  AuthContext.tsx          # PascalCase with Context suffix
  CartContext.tsx
  SocketContext.tsx

src/services/
  api.ts                   # camelCase
  cartAPI.ts
  messageService.ts

src/hooks/
  useConversations.ts      # camelCase with use prefix
  useSocket.ts

src/types/
  index.ts                 # Type definitions
```

---

## JavaScript/Node.js Patterns

### Module Structure

```javascript
// 1. Imports (grouped by type)
const express = require('express');           // Core/framework
const { PrismaClient } = require('@prisma/client'); // Database
const { logger } = require('../utils/logger');  // Internal

// 2. Constants
const DEFAULT_PAGE_SIZE = 20;
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

// 3. Module logic
const createProduct = async (sellerId, data) => {
  // Implementation
};

// 4. Exports
module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
};
```

### Async/Await Pattern

```javascript
// ✅ CORRECT: Use async/await
const getProducts = async (filters) => {
  try {
    const products = await prisma.product.findMany({
      where: filters,
    });
    return products;
  } catch (error) {
    logger.error('Failed to get products:', error);
    throw error;
  }
};

// ❌ WRONG: Nested promises
const getProducts = (filters) => {
  return prisma.product.findMany({ where: filters })
    .then(products => {
      return products;
    })
    .catch(error => {
      throw error;
    });
};
```

### Error Handling

```javascript
// ✅ CORRECT: Custom error messages
const placeBid = async (auctionId, bidderId, amount) => {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  if (auction.status !== 'ACTIVE') {
    throw new Error('Auction is not active');
  }

  if (amount <= auction.currentBid) {
    throw new Error(`Bid must be higher than current bid of $${auction.currentBid}`);
  }

  // Continue with valid bid
};

// ❌ WRONG: Generic errors
const placeBid = async (auctionId, bidderId, amount) => {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction || auction.status !== 'ACTIVE') {
    throw new Error('Error'); // Too generic
  }
};
```

### Function Parameters

```javascript
// ✅ CORRECT: Destructuring with defaults
const getProducts = async ({
  page = 1,
  limit = 20,
  search = '',
  category = null,
  sortBy = 'createdAt',
  sortOrder = 'desc',
} = {}) => {
  // Implementation
};

// ❌ WRONG: Too many positional arguments
const getProducts = async (page, limit, search, category, sortBy, sortOrder) => {
  // Hard to remember parameter order
};
```

---

## TypeScript/React Patterns

### Component Structure

```typescript
// ✅ CORRECT: Functional component with TypeScript
'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onWatchlistToggle?: (productId: string) => void;
}

export default function ProductCard({
  product,
  onWatchlistToggle,
}: ProductCardProps) {
  const [isWatched, setIsWatched] = useState(false);

  const handleToggle = () => {
    setIsWatched(!isWatched);
    onWatchlistToggle?.(product.id);
  };

  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      <button onClick={handleToggle}>
        {isWatched ? 'Remove' : 'Add to Watchlist'}
      </button>
    </div>
  );
}
```

### Type Definitions

```typescript
// frontend/src/types/index.ts

export interface User {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  companyName?: string;
  country?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  currency: 'USD' | 'INR' | 'CNY' | 'TRY';
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'EXPIRED';
  listingType: 'FIXED_PRICE' | 'AUCTION' | 'NEGOTIABLE';
  seller: User;
  images: ProductImage[];
}

export interface Auction {
  id: string;
  productId: string;
  auctionType: 'ENGLISH' | 'DUTCH' | 'SEALED_BID';
  startingPrice: number;
  currentBid?: number;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  startTime: string;
  endTime: string;
}
```

### React Query Usage

```typescript
// ✅ CORRECT: Proper query key with dependencies
const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.get('/products', { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ✅ CORRECT: Mutation with optimistic update
const useToggleWatchlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      api.post(`/products/watchlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
};

// ❌ WRONG: Missing dependencies in query key
const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: ['products'], // Missing filters!
    queryFn: () => api.get('/products', { params: filters }),
  });
};
```

### Context Pattern

```typescript
// ✅ CORRECT: Context with type safety
import { createContext, useContext, useState, ReactNode } from 'react';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems((prev) => [...prev, item]);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
```

---

## Prisma Patterns

### Query Patterns

```javascript
// ✅ CORRECT: Select only needed fields
const getProductList = async () => {
  return prisma.product.findMany({
    select: {
      id: true,
      title: true,
      basePrice: true,
      status: true,
      seller: {
        select: {
          id: true,
          companyName: true,
        },
      },
      images: {
        where: { isPrimary: true },
        select: {
          imageUrl: true,
        },
      },
    },
  });
};

// ❌ WRONG: Select everything
const getProductList = async () => {
  return prisma.product.findMany({
    include: {
      seller: true,        // Returns ALL fields
      images: true,
      category: true,
      specifications: true,
    },
  });
};
```

### Relation Handling

```javascript
// ✅ CORRECT: Include specific relations
const getAuctionWithBids = async (auctionId) => {
  return prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      product: {
        include: {
          seller: {
            select: {
              id: true,
              companyName: true,
              country: true,
            },
          },
        },
      },
      bids: {
        orderBy: { amount: 'desc' },
        take: 10,
        include: {
          bidder: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
      },
    },
  });
};
```

### Transaction Usage

```javascript
// ✅ CORRECT: Use transactions for multi-step operations
const acceptNegotiation = async (negotiationId) => {
  return prisma.$transaction(async (tx) => {
    // Update negotiation
    const negotiation = await tx.negotiation.update({
      where: { id: negotiationId },
      data: { status: 'ACCEPTED' },
    });

    // Create cart item
    await tx.cartItem.create({
      data: {
        userId: negotiation.buyerId,
        productId: negotiation.productId,
        priceAtAddition: negotiation.sellerCounterOffer,
        sourceType: 'NEGOTIATION',
        negotiationId: negotiationId,
      },
    });

    return negotiation;
  });
};
```

---

## Express Middleware Patterns

### Route Middleware Chain

```javascript
// ✅ CORRECT: Clear middleware chain
router.post(
  '/products',
  authenticateToken,           // 1. Auth required
  requireSeller,               // 2. Must be seller
  uploadMiddleware.array('images', 4), // 3. Handle file upload
  validateProductInput,        // 4. Validate input
  productController.createProduct // 5. Handle request
);
```

### Middleware Implementation

```javascript
// ✅ CORRECT: Middleware with proper error handling
const requireSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.role !== 'SELLER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Seller access required',
    });
  }

  next();
};
```

---

## Code Quality Rules

### Naming Conventions

```javascript
// Variables: camelCase
const productList = [];
const isActive = true;
const maxRetryCount = 3;

// Constants: SCREAMING_SNAKE_CASE
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;
const JWT_EXPIRY = '24h';

// Functions: camelCase (verb + noun)
const getProducts = async () => {};
const createAuction = async () => {};
const validateInput = (data) => {};

// Classes/Components: PascalCase
class ProductService {}
function ProductCard() {}

// Database tables/columns: snake_case (Prisma handles this)
// Model names: PascalCase in Prisma schema
```

### Import Order

```javascript
// 1. Node.js built-in modules
const path = require('path');
const fs = require('fs');

// 2. External packages
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// 3. Internal modules (absolute paths)
const { getPrismaClient } = require('../utils/prisma');
const { logger } = require('../utils/logger');

// 4. Relative imports
const { validateProductInput } = require('./validators');
```

### Comment Guidelines

```javascript
// ✅ CORRECT: Explain WHY, not WHAT
// Reserve price is optional - auction can end without meeting it
const isReserveMet = !auction.reservePrice ||
  (winningBid && winningBid.amount >= auction.reservePrice);

// ✅ CORRECT: Document complex business logic
/**
 * Cart items are locked at the price when added.
 * - DIRECT: Uses product.basePrice
 * - AUCTION: Uses winning bid amount
 * - NEGOTIATION: Uses agreed price (sellerCounterOffer)
 */
const priceAtAddition = calculatePriceBySource(item);

// ❌ WRONG: Obvious comments
// Get the product
const product = await prisma.product.findUnique({ where: { id } });

// ❌ WRONG: Commented-out code
// const oldMethod = async () => { ... };
```

### Function Length

```javascript
// ✅ CORRECT: Single responsibility, <30 lines
const validateBid = (auction, bidderId, amount) => {
  if (!auction) throw new Error('Auction not found');
  if (auction.status !== 'ACTIVE') throw new Error('Auction not active');
  if (auction.product.sellerId === bidderId) throw new Error('Cannot bid on own auction');
  if (amount <= (auction.currentBid || auction.startingPrice)) {
    throw new Error('Bid must be higher than current bid');
  }
};

const placeBid = async (auctionId, bidderId, amount) => {
  const auction = await getAuctionWithProduct(auctionId);
  validateBid(auction, bidderId, amount);
  return createBidRecord(auctionId, bidderId, amount);
};

// ❌ WRONG: Function doing too much
const placeBid = async (auctionId, bidderId, amount) => {
  // 50+ lines of mixed validation, database calls, notifications...
};
```

---

## ESLint Rules

### Backend (.eslintrc.js)

```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },
};
```

### Frontend (eslint.config.js)

```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'warn',
  },
};
```

---

## Related Documentation

- `CLAUDE.md` - Complete project guide
- `ARCHITECTURE.md` - System design patterns
- `API_STANDARDS.md` - REST API guidelines
- `ANTI_PATTERNS.md` - Common mistakes to avoid

---

**Last Updated**: 2025-12-26
**Owner**: StockENT Engineering Team
