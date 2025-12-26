# Frontend Specialist Agent

**Domain**: Next.js 14, React 18, TypeScript, Components, Hooks

## Tech Stack

```
Framework:      Next.js 14 (App Router)
React:          React 18
Language:       TypeScript
State:          React Query (@tanstack/react-query)
UI:             Material-UI + Radix UI + TailwindCSS
Forms:          React Hook Form + Formik
Real-time:      Socket.io-client
Dates:          date-fns
Charts:         Recharts
```

## Directory Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   ├── login/page.tsx     # Auth pages
│   ├── products/
│   │   ├── page.tsx       # Product list
│   │   └── [id]/page.tsx  # Product detail
│   └── ...
└── src/
    ├── components/        # React components
    ├── contexts/          # React contexts
    ├── services/          # API client
    ├── hooks/             # Custom hooks
    ├── types/             # TypeScript types
    └── utils/             # Utilities
```

## Component Patterns

### Server Component (Default)

```typescript
// app/products/page.tsx
// No 'use client' = Server Component

import { ProductList } from '@/components/ProductList';

interface PageProps {
  searchParams: { category?: string; page?: string };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  // Can fetch data directly on server
  const products = await fetch(`${API_URL}/products?${new URLSearchParams(searchParams)}`);

  return (
    <div>
      <h1>Products</h1>
      <ProductList initialProducts={products} />
    </div>
  );
}
```

### Client Component

```typescript
// src/components/ProductCard.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onWatchlistToggle?: (id: string) => void;
}

export default function ProductCard({ product, onWatchlistToggle }: ProductCardProps) {
  const [isWatched, setIsWatched] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      quantity: product.minOrderQuantity,
      price: product.basePrice,
      sourceType: 'DIRECT',
    });
  };

  return (
    <div className="product-card">
      <img src={product.images[0]?.imageUrl} alt={product.title} />
      <h3>{product.title}</h3>
      <p>${product.basePrice}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
      <button onClick={() => {
        setIsWatched(!isWatched);
        onWatchlistToggle?.(product.id);
      }}>
        {isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
      </button>
    </div>
  );
}
```

## React Query Patterns

### Query Hook

```typescript
// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: filters });
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
```

### Mutation Hook

```typescript
// src/hooks/useNegotiation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useCreateNegotiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      productId: string;
      offer: number;
      message?: string;
    }) => {
      const response = await api.post('/negotiations', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

## Context Patterns

### Auth Context

```typescript
// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

interface User {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    api.get('/auth/me')
      .then(res => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.data.user);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Socket Context

```typescript
// src/contexts/SocketContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
```

## Socket Event Handling

```typescript
// Component using socket
'use client';

import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export function AuctionBids({ auctionId }: { auctionId: string }) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Join auction room
    socket.emit('join_auction', auctionId);

    // Listen for new bids
    const handleBid = (data: { bid: any; currentBid: number }) => {
      console.log('New bid:', data);
      // Update UI
    };

    socket.on('bid_placed', handleBid);

    // Cleanup
    return () => {
      socket.emit('leave_auction', auctionId);
      socket.off('bid_placed', handleBid);
    };
  }, [socket, auctionId]);

  return <div>...</div>;
}
```

## Form Patterns

### React Hook Form

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  offer: z.number().positive('Offer must be positive'),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NegotiationForm({ productId, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="number"
        {...register('offer', { valueAsNumber: true })}
        placeholder="Your offer"
      />
      {errors.offer && <span>{errors.offer.message}</span>}

      <textarea {...register('message')} placeholder="Message (optional)" />

      <button type="submit">Submit Offer</button>
    </form>
  );
}
```

## File Organization

```typescript
// Page component
// app/negotiations/page.tsx
import { NegotiationList } from '@/components/negotiation/NegotiationList';

export default function NegotiationsPage() {
  return <NegotiationList />;
}

// Feature component
// src/components/negotiation/NegotiationList.tsx
'use client';
export function NegotiationList() { ... }

// Sub-component
// src/components/negotiation/NegotiationCard.tsx
'use client';
export function NegotiationCard() { ... }
```

## Critical Rules

1. **'use client'** - Required for components using hooks, events, or browser APIs
2. **Query keys** - Include all dependencies that affect the query
3. **Cleanup effects** - Always cleanup socket listeners and subscriptions
4. **Context errors** - Throw if context used outside provider
5. **Type everything** - No `any` types
6. **Stable references** - Use useMemo/useCallback for objects/functions passed as props

## Files to Reference

- `frontend/src/contexts/AuthContext.tsx` - Auth patterns
- `frontend/src/contexts/SocketContext.tsx` - Socket patterns
- `frontend/src/services/api.ts` - API client
- `frontend/src/types/index.ts` - Type definitions

---

**Last Updated**: 2025-12-26
