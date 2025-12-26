# Test Specialist Agent

**Domain**: Jest, Testing Strategies, Unit Tests, Integration Tests

## Tech Stack

```
Backend Testing:
  Framework:      Jest 29
  HTTP Testing:   Supertest
  Mocking:        Jest mocks

Frontend Testing:
  Framework:      Vitest / Jest
  Component:      React Testing Library
  Mocking:        MSW (Mock Service Worker)
```

## Test File Organization

```
backend/
├── src/
│   ├── services/
│   │   ├── auctionService.js
│   │   └── __tests__/
│   │       └── auctionService.test.js
│   └── controllers/
│       ├── auctionController.js
│       └── __tests__/
│           └── auctionController.test.js
├── tests/
│   ├── integration/
│   │   └── auction.integration.test.js
│   └── setup.js

frontend/
├── src/
│   ├── components/
│   │   ├── ProductCard.tsx
│   │   └── __tests__/
│   │       └── ProductCard.test.tsx
│   └── hooks/
│       └── __tests__/
│           └── useProducts.test.ts
```

## Backend Testing

### Unit Test Pattern

```javascript
// backend/src/services/__tests__/negotiationService.test.js
const { createNegotiation } = require('../negotiationService');
const { getPrismaClient } = require('../../utils/prisma');

// Mock Prisma
jest.mock('../../utils/prisma');
jest.mock('../../utils/socket');

describe('NegotiationService', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      product: {
        findUnique: jest.fn(),
      },
      negotiation: {
        create: jest.fn(),
      },
    };
    getPrismaClient.mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNegotiation', () => {
    const mockProduct = {
      id: 'product-1',
      sellerId: 'seller-1',
      listingType: 'NEGOTIABLE',
      seller: { id: 'seller-1' },
    };

    it('should create negotiation for valid product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.negotiation.create.mockResolvedValue({
        id: 'negotiation-1',
        buyerOffer: 100,
        status: 'PENDING',
      });

      const result = await createNegotiation('buyer-1', 'product-1', 100, 'Please');

      expect(result.buyerOffer).toBe(100);
      expect(result.status).toBe('PENDING');
    });

    it('should throw if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        createNegotiation('buyer-1', 'invalid', 100)
      ).rejects.toThrow('Product not found');
    });

    it('should throw if product is not negotiable', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        listingType: 'FIXED_PRICE',
      });

      await expect(
        createNegotiation('buyer-1', 'product-1', 100)
      ).rejects.toThrow('does not support negotiation');
    });

    it('should throw if buyer is seller', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        createNegotiation('seller-1', 'product-1', 100)
      ).rejects.toThrow('Cannot negotiate on your own product');
    });
  });
});
```

### Integration Test Pattern

```javascript
// backend/tests/integration/negotiation.integration.test.js
const request = require('supertest');
const { app } = require('../../src/server');
const { getPrismaClient } = require('../../src/utils/prisma');

describe('Negotiation API', () => {
  let prisma;
  let buyerToken;
  let sellerToken;
  let testProduct;

  beforeAll(async () => {
    prisma = getPrismaClient();
    // Create test users and get tokens
    // Create test product
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.negotiation.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });
  });

  describe('POST /api/negotiations', () => {
    it('should create negotiation with valid data', async () => {
      const response = await request(app)
        .post('/api/negotiations')
        .set('Cookie', [`accessToken=${buyerToken}`])
        .send({
          productId: testProduct.id,
          offer: 150,
          message: 'Interested in bulk order',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/negotiations')
        .send({ productId: testProduct.id, offer: 150 });

      expect(response.status).toBe(401);
    });

    it('should return 400 with invalid offer', async () => {
      const response = await request(app)
        .post('/api/negotiations')
        .set('Cookie', [`accessToken=${buyerToken}`])
        .send({
          productId: testProduct.id,
          offer: -50,
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toBeDefined();
    });
  });
});
```

## Frontend Testing

### Component Test Pattern

```typescript
// frontend/src/components/__tests__/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';
import { CartProvider } from '@/contexts/CartContext';

const mockProduct = {
  id: 'product-1',
  title: 'Cotton Fabric',
  basePrice: 150,
  images: [{ imageUrl: '/image.jpg' }],
  seller: { companyName: 'Test Seller' },
};

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  );
};

describe('ProductCard', () => {
  it('renders product information', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Cotton Fabric')).toBeInTheDocument();
    expect(screen.getByText('$150')).toBeInTheDocument();
  });

  it('calls onWatchlistToggle when watchlist button clicked', () => {
    const onToggle = jest.fn();
    renderWithProviders(
      <ProductCard product={mockProduct} onWatchlistToggle={onToggle} />
    );

    fireEvent.click(screen.getByText('Add to Watchlist'));
    expect(onToggle).toHaveBeenCalledWith('product-1');
  });

  it('updates button text when watched', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const button = screen.getByText('Add to Watchlist');
    fireEvent.click(button);

    expect(screen.getByText('Remove from Watchlist')).toBeInTheDocument();
  });
});
```

### Hook Test Pattern

```typescript
// frontend/src/hooks/__tests__/useNegotiation.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateNegotiation } from '../useNegotiation';
import api from '@/services/api';

jest.mock('@/services/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCreateNegotiation', () => {
  it('should create negotiation successfully', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { success: true, data: { id: 'neg-1' } },
    });

    const { result } = renderHook(() => useCreateNegotiation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      productId: 'product-1',
      offer: 150,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.post).toHaveBeenCalledWith('/negotiations', {
      productId: 'product-1',
      offer: 150,
    });
  });
});
```

## Testing Checklist

### Unit Tests
- [ ] Happy path works correctly
- [ ] Invalid input throws appropriate errors
- [ ] Edge cases handled (null, empty, boundary values)
- [ ] Dependencies are mocked
- [ ] Async operations work correctly

### Integration Tests
- [ ] API endpoints return correct status codes
- [ ] Authentication is enforced
- [ ] Authorization is enforced
- [ ] Validation errors return proper format
- [ ] Database operations work correctly

### Component Tests
- [ ] Renders correctly with valid props
- [ ] Handles user interactions
- [ ] Shows loading/error states
- [ ] Calls callbacks with correct arguments
- [ ] Accessibility (labels, roles)

## Jest Configuration

```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
```

## Critical Rules

1. **Test behavior, not implementation** - Focus on outputs
2. **One assertion per test** - Clear failure messages
3. **Mock external dependencies** - Database, APIs, sockets
4. **Clean up after tests** - Reset mocks, cleanup data
5. **Test edge cases** - Nulls, empty, boundaries
6. **Name tests clearly** - Describe expected behavior

---

**Last Updated**: 2025-12-26
