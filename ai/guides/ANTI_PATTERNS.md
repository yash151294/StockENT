# StockENT Anti-Patterns Guide

**@context_tier**: foundation
**@ai_summary**: Common mistakes to avoid in StockENT development, including coding patterns, architecture violations, security issues, and performance problems.

## Code Style Anti-Patterns

### Over-Commenting

```javascript
// ❌ WRONG: Obvious comments
// Get the product by ID
const product = await prisma.product.findUnique({ where: { id } });

// Check if product exists
if (!product) {
  // Throw error if not found
  throw new Error('Product not found');
}

// ✅ CORRECT: Only explain WHY, not WHAT
// Reserve price is optional - auction succeeds without meeting it
const isReserveMet = !auction.reservePrice ||
  winningBid.amount >= auction.reservePrice;
```

### Magic Numbers

```javascript
// ❌ WRONG: Magic numbers
if (password.length < 8) { ... }
const skip = (page - 1) * 20;
setTimeout(callback, 86400000);

// ✅ CORRECT: Named constants
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_PAGE_SIZE = 20;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

if (password.length < MIN_PASSWORD_LENGTH) { ... }
const skip = (page - 1) * DEFAULT_PAGE_SIZE;
setTimeout(callback, ONE_DAY_MS);
```

### Long Functions

```javascript
// ❌ WRONG: 100+ line function doing everything
const handleAuctionEnd = async (auctionId) => {
  // Find auction
  // Validate status
  // Find winner
  // Check reserve price
  // Update auction status
  // Update product status
  // Create cart item
  // Send email to winner
  // Send email to seller
  // Emit socket events
  // Log everything
  // 100 more lines...
};

// ✅ CORRECT: Single responsibility functions
const handleAuctionEnd = async (auctionId) => {
  const auction = await getAuctionWithBids(auctionId);
  validateAuctionCanEnd(auction);

  const winner = determineWinner(auction);
  await updateAuctionStatus(auctionId, 'ENDED');
  await updateProductStatus(auction.productId, winner ? 'SOLD' : 'ACTIVE');

  if (winner) {
    await createWinnerCartItem(winner, auction);
    await notifyWinner(winner, auction);
  }

  await notifySeller(auction);
  emitAuctionEndEvents(auctionId, winner);
};
```

---

## Architecture Anti-Patterns

### Cross-Domain Service Calls

```javascript
// ❌ WRONG: AuctionService directly using ProductRepository
class AuctionService {
  async endAuction(auctionId) {
    const auction = await this.auctionRepo.findById(auctionId);

    // Wrong: AuctionService shouldn't update Product directly
    await this.productRepo.update(auction.productId, { status: 'SOLD' });

    // Wrong: AuctionService shouldn't create CartItem
    await this.cartRepo.create({ ... });
  }
}

// ✅ CORRECT: Use handler to coordinate services
const handleAuctionEnd = async (auctionId) => {
  const auction = await auctionService.endAuction(auctionId);
  await productService.updateStatus(auction.productId, 'SOLD');
  await cartService.addFromAuction(auction);
};
```

### Controller Business Logic

```javascript
// ❌ WRONG: Business logic in controller
const createProduct = async (req, res) => {
  // Validation
  if (req.body.listingType === 'AUCTION') {
    if (!req.body.auctionConfig) {
      return res.status(400).json({ error: 'Auction config required' });
    }
    if (req.body.auctionConfig.endTime < req.body.auctionConfig.startTime) {
      return res.status(400).json({ error: 'End time must be after start' });
    }
  }

  // More complex business logic...
  const product = await prisma.product.create({ ... });

  if (req.body.listingType === 'AUCTION') {
    await prisma.auction.create({ ... });
  }

  res.json(product);
};

// ✅ CORRECT: Controller delegates to service
const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.user.id, req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
```

### Missing Error Handling

```javascript
// ❌ WRONG: No error handling
const getProduct = async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
  });
  res.json(product); // What if product is null? What if Prisma throws?
};

// ✅ CORRECT: Proper error handling
const getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
    });
  }
};
```

---

## Database Anti-Patterns

### N+1 Queries

```javascript
// ❌ WRONG: N+1 query problem
const products = await prisma.product.findMany();
for (const product of products) {
  product.seller = await prisma.user.findUnique({
    where: { id: product.sellerId },
  });
  product.images = await prisma.productImage.findMany({
    where: { productId: product.id },
  });
}

// ✅ CORRECT: Eager loading with include
const products = await prisma.product.findMany({
  include: {
    seller: {
      select: { id: true, companyName: true },
    },
    images: {
      where: { isPrimary: true },
    },
  },
});
```

### Over-Fetching

```javascript
// ❌ WRONG: Fetching all fields when you only need a few
const products = await prisma.product.findMany({
  include: {
    seller: true,           // Returns ALL user fields (including passwordHash!)
    images: true,
    specifications: true,
    category: true,
  },
});

// ✅ CORRECT: Select only needed fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    title: true,
    basePrice: true,
    seller: {
      select: {
        id: true,
        companyName: true,
        country: true,
      },
    },
    images: {
      where: { isPrimary: true },
      select: { imageUrl: true },
    },
  },
});
```

### Missing Transactions

```javascript
// ❌ WRONG: Multiple operations without transaction
const acceptNegotiation = async (negotiationId) => {
  await prisma.negotiation.update({
    where: { id: negotiationId },
    data: { status: 'ACCEPTED' },
  });

  // If this fails, negotiation is ACCEPTED but no cart item exists!
  await prisma.cartItem.create({ ... });
};

// ✅ CORRECT: Use transaction
const acceptNegotiation = async (negotiationId) => {
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

---

## React Anti-Patterns

### Missing Cleanup

```javascript
// ❌ WRONG: No cleanup in useEffect
useEffect(() => {
  const socket = io(SOCKET_URL);
  socket.on('message', handleMessage);
  // Memory leak! Socket stays open after unmount
}, []);

// ✅ CORRECT: Cleanup on unmount
useEffect(() => {
  const socket = io(SOCKET_URL);
  socket.on('message', handleMessage);

  return () => {
    socket.off('message', handleMessage);
    socket.close();
  };
}, []);
```

### State in Loops

```javascript
// ❌ WRONG: setState in loop causes multiple re-renders
const updateItems = (newItems) => {
  newItems.forEach((item) => {
    setItems((prev) => [...prev, item]); // N re-renders!
  });
};

// ✅ CORRECT: Batch state update
const updateItems = (newItems) => {
  setItems((prev) => [...prev, ...newItems]); // 1 re-render
};
```

### Props Drilling

```javascript
// ❌ WRONG: Passing props through many levels
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserInfo user={user} />
    </Sidebar>
  </Layout>
</App>

// ✅ CORRECT: Use context
const UserContext = createContext();

function App() {
  return (
    <UserContext.Provider value={user}>
      <Layout>
        <Sidebar>
          <UserInfo /> {/* Gets user from context */}
        </Sidebar>
      </Layout>
    </UserContext.Provider>
  );
}
```

### Missing Query Key Dependencies

```javascript
// ❌ WRONG: Query key doesn't include all dependencies
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: () => fetchProducts(filters), // filters not in key!
});

// ✅ CORRECT: Include all dependencies
const { data } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
});
```

---

## Security Anti-Patterns

### Exposing Sensitive Data

```javascript
// ❌ WRONG: Returning password hash in response
const getUser = async (id) => {
  return prisma.user.findUnique({ where: { id } });
  // Returns { id, email, passwordHash, ... }
};

// ✅ CORRECT: Exclude sensitive fields
const getUser = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      // No passwordHash, tokens, etc.
    },
  });
};
```

### Client-Side Auth Checks Only

```javascript
// ❌ WRONG: Only checking auth on client
function AdminPage() {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Redirect to="/" />;
  // Anyone can call API directly!
}

// ✅ CORRECT: Server-side auth + client-side UX
// Server:
router.get('/admin/users', authenticateToken, requireAdmin, ...);

// Client (for UX only):
function AdminPage() {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Redirect to="/" />;
  // API is also protected
}
```

### Storing Tokens in localStorage

```javascript
// ❌ WRONG: Vulnerable to XSS
localStorage.setItem('token', token);

// ✅ CORRECT: HTTP-only cookies
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
});
```

---

## Performance Anti-Patterns

### Unnecessary Re-renders

```javascript
// ❌ WRONG: Creating new objects on every render
<ProductList filters={{ category: 'textile' }} /> // New object every render

// ✅ CORRECT: Stable references
const filters = useMemo(() => ({ category: 'textile' }), []);
<ProductList filters={filters} />
```

### Blocking the Main Thread

```javascript
// ❌ WRONG: Heavy sync operation
const processLargeData = () => {
  const result = [];
  for (let i = 0; i < 1000000; i++) {
    result.push(heavyComputation(data[i]));
  }
  return result;
};

// ✅ CORRECT: Use async/await, batch processing, or web workers
const processLargeData = async () => {
  const results = [];
  const BATCH_SIZE = 1000;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchResult = await processBatch(batch);
    results.push(...batchResult);

    // Allow other tasks to run
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
};
```

### Missing Pagination

```javascript
// ❌ WRONG: Fetching all records
const getAllProducts = async () => {
  return prisma.product.findMany(); // Returns 10,000+ records!
};

// ✅ CORRECT: Paginate
const getProducts = async ({ page = 1, limit = 20 }) => {
  return prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
};
```

---

## Socket.io Anti-Patterns

### Missing Authorization

```javascript
// ❌ WRONG: Anyone can join any room
socket.on('join_conversation', (conversationId) => {
  socket.join(`conversation:${conversationId}`);
});

// ✅ CORRECT: Verify access
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

### Memory Leaks

```javascript
// ❌ WRONG: Not cleaning up listeners
useEffect(() => {
  socket.on('message', handleMessage);
  socket.on('notification', handleNotification);
  // Missing cleanup!
}, []);

// ✅ CORRECT: Clean up all listeners
useEffect(() => {
  socket.on('message', handleMessage);
  socket.on('notification', handleNotification);

  return () => {
    socket.off('message', handleMessage);
    socket.off('notification', handleNotification);
  };
}, []);
```

---

## Testing Anti-Patterns

### Testing Implementation Details

```javascript
// ❌ WRONG: Testing internal state
it('should update internal state', () => {
  const { result } = renderHook(() => useProducts());
  expect(result.current.internalState.loading).toBe(true);
});

// ✅ CORRECT: Test behavior/output
it('should show loading state initially', () => {
  render(<ProductList />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### Missing Edge Cases

```javascript
// ❌ WRONG: Only testing happy path
it('should create product', async () => {
  const product = await createProduct(validData);
  expect(product).toBeDefined();
});

// ✅ CORRECT: Test edge cases and errors
describe('createProduct', () => {
  it('should create product with valid data', async () => {});
  it('should throw if title is empty', async () => {});
  it('should throw if price is negative', async () => {});
  it('should throw if seller not found', async () => {});
  it('should handle duplicate product gracefully', async () => {});
});
```

---

## Related Documentation

- `CLAUDE.md` - Complete project guide
- `CONVENTIONS.md` - Coding standards
- `ARCHITECTURE.md` - System design
- `SECURITY.md` - Security requirements

---

**Last Updated**: 2025-12-26
**Owner**: StockENT Engineering Team
