# Integration Specialist Agent

**Domain**: Socket.io, Cross-Service Communication, External APIs, E2E Validation

## Responsibilities

1. Socket.io event handling
2. Cross-component communication
3. External API integration
4. End-to-end flow validation
5. Real-time synchronization

## Socket.io Patterns

### Server-Side Event Emission

```javascript
// backend/src/utils/socket.js

// Emit to specific user
const emitToUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

// Emit to room
const emitToNegotiation = (negotiationId, event, data) => {
  io.to(`negotiation:${negotiationId}`).emit(event, data);
};

// Broadcast to all
const broadcast = (event, data) => {
  io.emit(event, data);
};
```

### Event Handler Implementation

```javascript
// In socket.js connection handler
socket.on('join_negotiation', async (negotiationId) => {
  // Verify access
  const negotiation = await prisma.negotiation.findFirst({
    where: {
      id: negotiationId,
      OR: [
        { buyerId: socket.user.id },
        { sellerId: socket.user.id },
      ],
    },
  });

  if (!negotiation) {
    socket.emit('error', { message: 'Access denied' });
    return;
  }

  socket.join(`negotiation:${negotiationId}`);
  logger.info(`User ${socket.user.email} joined negotiation room: ${negotiationId}`);
});
```

### Client-Side Integration

```typescript
// frontend/src/hooks/useNegotiationSocket.ts
import { useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export function useNegotiationSocket(negotiationId: string) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !negotiationId) return;

    // Join room
    socket.emit('join_negotiation', negotiationId);

    // Cleanup
    return () => {
      socket.emit('leave_negotiation', negotiationId);
    };
  }, [socket, negotiationId]);

  const onStatusChange = useCallback((handler: (data: any) => void) => {
    if (!socket) return () => {};

    socket.on('negotiation_status_changed', handler);
    return () => socket.off('negotiation_status_changed', handler);
  }, [socket]);

  return { onStatusChange };
}
```

## Event Flow Patterns

### Negotiation Flow

```
Buyer creates offer:
├── POST /api/negotiations
├── Service creates record
├── emitToUser(sellerId, 'negotiation_offer', ...)
└── Seller receives notification

Seller counters:
├── PUT /api/negotiations/:id/counter
├── Service updates record
├── emitToUser(buyerId, 'negotiation_countered', ...)
├── emitToNegotiation(id, 'status_changed', ...)
└── Buyer receives notification

Buyer accepts:
├── PUT /api/negotiations/:id/accept
├── Service updates status + creates cart item
├── emitToUser(sellerId, 'negotiation_accepted', ...)
├── emitToCart(buyerId, 'item_added', ...)
└── Both parties updated
```

### Auction Flow

```
Bid placed:
├── POST /api/auctions/:id/bid (or socket 'new_bid')
├── Service validates and creates bid
├── emitToAuction(id, 'bid_placed', { bid, currentBid })
├── emitToUser(sellerId, 'auction_bid_notification', ...)
└── All watchers see new bid

Auction ends (cron):
├── Cron detects endTime passed
├── Service determines winner
├── Updates auction status
├── Creates cart item for winner
├── emitToAuction(id, 'auction_ended', { winner })
├── broadcast('auction_status_changed', ...)
└── All users updated
```

## Cross-Component Validation

### Type Matching Checklist

```
[ ] Frontend types match backend response
[ ] API request body matches validation schema
[ ] Socket event data structure consistent
[ ] Database enum values match frontend
```

### Contract Example

```typescript
// Shared contract (conceptual)
interface NegotiationStatusEvent {
  negotiationId: string;
  status: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED';
  updatedAt: string;
}

// Backend emits
emitToNegotiation(id, 'status_changed', {
  negotiationId: negotiation.id,
  status: negotiation.status,
  updatedAt: negotiation.updatedAt.toISOString(),
} satisfies NegotiationStatusEvent);

// Frontend expects
socket.on('status_changed', (data: NegotiationStatusEvent) => {
  // Type-safe handling
});
```

## End-to-End Validation

### Flow Test Pattern

```javascript
// Test complete negotiation flow
describe('Negotiation E2E Flow', () => {
  it('should complete full negotiation cycle', async () => {
    // 1. Buyer creates offer
    const offer = await request(app)
      .post('/api/negotiations')
      .set('Cookie', buyerToken)
      .send({ productId, offer: 100 });

    expect(offer.status).toBe(201);
    const negotiationId = offer.body.data.id;

    // 2. Seller receives socket event (mock verification)
    expect(mockSocketEmit).toHaveBeenCalledWith(
      `user:${sellerId}`,
      'negotiation_offer',
      expect.any(Object)
    );

    // 3. Seller counters
    const counter = await request(app)
      .put(`/api/negotiations/${negotiationId}/counter`)
      .set('Cookie', sellerToken)
      .send({ counterOffer: 120 });

    expect(counter.status).toBe(200);

    // 4. Buyer accepts
    const accept = await request(app)
      .put(`/api/negotiations/${negotiationId}/accept`)
      .set('Cookie', buyerToken);

    expect(accept.status).toBe(200);

    // 5. Verify cart item created
    const cart = await request(app)
      .get('/api/cart')
      .set('Cookie', buyerToken);

    expect(cart.body.data.items).toContainEqual(
      expect.objectContaining({
        productId,
        sourceType: 'NEGOTIATION',
        priceAtAddition: 120,
      })
    );
  });
});
```

## External API Integration

### Email Service Integration

```javascript
// backend/src/services/emailService.js
const { sendNegotiationNotification } = require('./emailService');

// In negotiation service
const createNegotiation = async (...) => {
  const negotiation = await prisma.negotiation.create(...);

  // Send email notification
  try {
    await sendNegotiationNotification(
      seller.email,
      'NEW_OFFER',
      {
        productTitle: product.title,
        offer: negotiation.buyerOffer,
        buyerCompany: buyer.companyName,
      }
    );
  } catch (error) {
    logger.error('Failed to send email:', error);
    // Don't fail the operation for email errors
  }

  return negotiation;
};
```

## Validation Checklist

### Before Feature Completion

- [ ] All socket events have handlers on both sides
- [ ] Event data structures match between emitter and listener
- [ ] Room join/leave properly managed
- [ ] Socket authentication verified
- [ ] Error events handled gracefully
- [ ] Connection recovery works
- [ ] Memory leaks prevented (cleanup listeners)
- [ ] Rate limiting in place for socket events
- [ ] Logging for debugging

### Common Issues

1. **Missing socket cleanup** - Always cleanup listeners in useEffect
2. **Type mismatches** - Define shared types
3. **Race conditions** - Handle stale state
4. **Memory leaks** - Track mounted state
5. **Missing error handlers** - Always handle 'error' events

---

**Last Updated**: 2025-12-26
