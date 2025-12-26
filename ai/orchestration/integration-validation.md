# Integration Validation

## Purpose

Cross-component validation ensures all parts of the system work together correctly.

## Validation Layers

```
Layer 1: Schema Validation
├── Prisma schema is valid
├── All relations defined correctly
└── Enums match across codebase

Layer 2: API Contract Validation
├── Routes match controller methods
├── Request/response types consistent
├── Error responses standardized

Layer 3: Frontend-Backend Contract
├── API calls match endpoints
├── TypeScript types match responses
├── Socket events handled both sides

Layer 4: Real-time Integration
├── Socket events emitted correctly
├── Room management proper
├── Event data structures match
```

## Checklist Templates

### New Feature Checklist

```markdown
## Feature: [Feature Name]

### Database Layer
- [ ] Prisma schema updated
- [ ] Migration created and applied
- [ ] Indexes added for query performance
- [ ] Relations properly defined

### Backend Layer
- [ ] Service created with business logic
- [ ] Controller created with request handling
- [ ] Routes defined with proper middleware
- [ ] Joi validation schemas defined
- [ ] Error handling consistent

### API Layer
- [ ] Endpoints documented
- [ ] Request validation working
- [ ] Response format matches standard
- [ ] Error responses proper

### Frontend Layer
- [ ] TypeScript types defined
- [ ] API service functions created
- [ ] React Query hooks implemented
- [ ] Components created
- [ ] Loading/error states handled

### Real-time Layer
- [ ] Socket events defined
- [ ] Server emits events correctly
- [ ] Client handles events
- [ ] Room join/leave managed
- [ ] Cleanup on unmount

### Testing
- [ ] Unit tests for service
- [ ] Integration tests for API
- [ ] Component tests for frontend
- [ ] E2E test for full flow
```

### API Endpoint Checklist

```markdown
## Endpoint: [METHOD] /api/[path]

### Route Definition
- [ ] Route registered in routes file
- [ ] Correct HTTP method
- [ ] Path parameters defined
- [ ] Query parameters documented

### Middleware Chain
- [ ] authenticateToken (if protected)
- [ ] Role check (requireBuyer/requireSeller)
- [ ] Validation middleware
- [ ] Rate limiting (if needed)

### Controller
- [ ] Request body validated
- [ ] Service method called
- [ ] Response formatted correctly
- [ ] Errors caught and handled

### Response Format
- [ ] Success: { success: true, data: {...} }
- [ ] Error: { success: false, error: "..." }
- [ ] Pagination included (if list)

### Frontend Integration
- [ ] API function created
- [ ] React Query hook created
- [ ] Error handling in component
- [ ] Loading state shown
```

### Socket Event Checklist

```markdown
## Event: [event_name]

### Server Side
- [ ] Event emitted from correct location
- [ ] Correct room/user targeted
- [ ] Data structure defined
- [ ] Error handled if emit fails

### Client Side
- [ ] Event listener registered
- [ ] Handler function defined
- [ ] State updated correctly
- [ ] Cleanup on unmount

### Data Contract
- [ ] Server and client expect same structure
- [ ] All required fields included
- [ ] Types match (string, number, etc.)
```

## Contract Definitions

### API Response Contract

```typescript
// Standard success response
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Standard error response
interface ErrorResponse {
  success: false;
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Paginated response
interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}
```

### Socket Event Contracts

```typescript
// Negotiation events
interface NegotiationOfferEvent {
  negotiationId: string;
  productId: string;
  productTitle: string;
  buyerOffer: number;
  buyerCompany: string;
}

interface NegotiationStatusEvent {
  negotiationId: string;
  status: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  updatedAt: string;
}

// Auction events
interface BidPlacedEvent {
  auctionId: string;
  bid: {
    id: string;
    amount: number;
    bidderId: string;
  };
  currentBid: number;
}

interface AuctionEndedEvent {
  auctionId: string;
  winnerId: string | null;
  finalPrice: number | null;
  status: 'COMPLETED' | 'NO_BIDS';
}

// Message events
interface NewMessageEvent {
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    encryptedContent: string;
    iv: string;
    createdAt: string;
  };
}
```

## Validation Scripts

### Pre-Commit Validation

```bash
# Run before committing changes
npm run validate:context
npm run type-check
npm run lint
npm run test:unit
```

### Integration Validation

```bash
# Run before PR
npm run test:integration
npm run validate:api-contracts
npm run validate:socket-events
```

## Common Integration Issues

### 1. Type Mismatches

```typescript
// ❌ Backend returns different type than frontend expects
// Backend
res.json({ success: true, data: { price: "150.00" } }); // string

// Frontend
interface Response { price: number } // expects number

// ✅ Fix: Ensure consistency
// Backend
res.json({ success: true, data: { price: 150.00 } }); // number
```

### 2. Missing Socket Cleanup

```typescript
// ❌ Memory leak - listener not removed
useEffect(() => {
  socket.on('event', handler);
}, []);

// ✅ Proper cleanup
useEffect(() => {
  socket.on('event', handler);
  return () => socket.off('event', handler);
}, []);
```

### 3. Enum Mismatches

```prisma
// Backend Prisma
enum NegotiationStatus {
  PENDING
  COUNTERED
  ACCEPTED
  DECLINED
}
```

```typescript
// ❌ Frontend uses different values
type Status = 'pending' | 'counter' | 'accepted' | 'declined';

// ✅ Match exactly
type NegotiationStatus = 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED';
```

### 4. Missing Error Handling

```typescript
// ❌ No error handling
const data = await api.get('/products');
setProducts(data.data.products);

// ✅ Proper error handling
try {
  const data = await api.get('/products');
  if (data.data.success) {
    setProducts(data.data.data.products);
  } else {
    setError(data.data.error);
  }
} catch (err) {
  setError('Failed to load products');
}
```

## Validation Automation

### GitHub Actions Integration

```yaml
# .github/workflows/validate.yml
name: Validate Integration

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate Context
        run: npm run validate:context

      - name: Type Check
        run: npm run type-check

      - name: Run Tests
        run: npm test
```

---

**Last Updated**: 2025-12-26
