/**
 * Unit tests for CartContext
 * Tests cart state management and operations
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies - these need to come before importing the tested module
jest.mock('../../../src/contexts/SocketContext', () => ({
  useSocket: () => ({
    socket: null,
    isConnected: false,
  }),
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { id: 'test-user-id', email: 'test@example.com' },
      isAuthenticated: true,
    },
  }),
}));

jest.mock('../../../src/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: jest.fn(),
    showWarning: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
  }),
}));

// Mock cart API with inline jest.fn() to avoid hoisting issues
jest.mock('../../../src/services/cartAPI', () => ({
  cartAPI: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateQuantity: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    validateCart: jest.fn(),
  },
}));

// Import the tested module after mocks
import { CartProvider, useCart } from '../../../src/contexts/CartContext';
import { cartAPI } from '../../../src/services/cartAPI';

// Get typed references to mocked functions
const mockGetCart = cartAPI.getCart as jest.MockedFunction<typeof cartAPI.getCart>;
const mockAddToCart = cartAPI.addToCart as jest.MockedFunction<typeof cartAPI.addToCart>;
const mockUpdateQuantity = cartAPI.updateQuantity as jest.MockedFunction<typeof cartAPI.updateQuantity>;
const mockRemoveFromCart = cartAPI.removeFromCart as jest.MockedFunction<typeof cartAPI.removeFromCart>;
const mockClearCart = cartAPI.clearCart as jest.MockedFunction<typeof cartAPI.clearCart>;
const mockValidateCart = cartAPI.validateCart as jest.MockedFunction<typeof cartAPI.validateCart>;

// Helper to create test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CartProvider>{children}</CartProvider>
      </QueryClientProvider>
    );
  };
};

// Sample test data
const mockCartItem = {
  id: 'cart-item-1',
  userId: 'test-user-id',
  productId: 'product-1',
  quantity: 50,
  priceAtAddition: 100,
  currency: 'USD',
  sourceType: 'DIRECT',
  product: {
    id: 'product-1',
    title: 'Test Cotton Fabric',
    name: 'Test Cotton Fabric',
  },
  addedAt: '2024-01-01T00:00:00.000Z',
};

const mockCartData = {
  items: [mockCartItem],
  summary: {
    itemCount: 1,
    totalQuantity: 50,
    totalValue: 5000,
    currencies: ['USD'],
  },
};

describe('CartContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCart.mockResolvedValue(mockCartData);
  });

  describe('useCart hook', () => {
    it('should throw error when used outside CartProvider', () => {
      // Suppress console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart must be used within a CartProvider');

      consoleSpy.mockRestore();
    });

    it('should provide cart context when used within CartProvider', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cartItems).toEqual(mockCartData.items);
      expect(result.current.cartSummary).toEqual(mockCartData.summary);
    });
  });

  describe('getItemCount', () => {
    it('should return total quantity of all items', async () => {
      const multipleItems = {
        items: [
          { ...mockCartItem, quantity: 10 },
          { ...mockCartItem, id: 'cart-item-2', quantity: 20 },
        ],
        summary: null,
      };
      mockGetCart.mockResolvedValue(multipleItems);

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getItemCount()).toBe(30); // 10 + 20
    });

    it('should return 0 for empty cart', async () => {
      mockGetCart.mockResolvedValue({ items: [], summary: null });

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getItemCount()).toBe(0);
    });
  });

  describe('getTotalValue', () => {
    it('should calculate total value correctly', async () => {
      const multipleItems = {
        items: [
          { ...mockCartItem, quantity: 10, priceAtAddition: 100 },
          { ...mockCartItem, id: 'cart-item-2', quantity: 5, priceAtAddition: 50 },
        ],
        summary: null,
      };
      mockGetCart.mockResolvedValue(multipleItems);

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // (10 * 100) + (5 * 50) = 1000 + 250 = 1250
      expect(result.current.getTotalValue()).toBe(1250);
    });
  });

  describe('isInCart', () => {
    it('should return true if product is in cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isInCart('product-1')).toBe(true);
    });

    it('should return false if product is not in cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isInCart('product-not-in-cart')).toBe(false);
    });

    it('should filter by sourceType when provided', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isInCart('product-1', 'DIRECT')).toBe(true);
      expect(result.current.isInCart('product-1', 'NEGOTIATION')).toBe(false);
    });
  });

  describe('addToCart', () => {
    it('should call addToCart API', async () => {
      const newItem = { ...mockCartItem, id: 'new-item' };
      mockAddToCart.mockResolvedValue(newItem);

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addToCart({
          productId: 'product-1',
          quantity: 50,
          sourceType: 'DIRECT',
        });
      });

      expect(mockAddToCart).toHaveBeenCalled();
      const callArgs = mockAddToCart.mock.calls[0][0];
      expect(callArgs).toEqual({
        productId: 'product-1',
        quantity: 50,
        sourceType: 'DIRECT',
      });
    });
  });

  describe('updateQuantity', () => {
    it('should call updateQuantity API', async () => {
      const updatedItem = { ...mockCartItem, quantity: 100 };
      mockUpdateQuantity.mockResolvedValue(updatedItem);

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateQuantity('cart-item-1', 100);
      });

      expect(mockUpdateQuantity).toHaveBeenCalledWith('cart-item-1', 100);
    });
  });

  describe('removeFromCart', () => {
    it('should call removeFromCart API', async () => {
      mockRemoveFromCart.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeFromCart('cart-item-1');
      });

      expect(mockRemoveFromCart).toHaveBeenCalled();
      expect(mockRemoveFromCart.mock.calls[0][0]).toBe('cart-item-1');
    });
  });

  describe('clearCart', () => {
    it('should call clearCart API', async () => {
      mockClearCart.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.clearCart();
      });

      expect(mockClearCart).toHaveBeenCalled();
    });
  });

  describe('validateCart', () => {
    it('should call validateCart API', async () => {
      mockValidateCart.mockResolvedValue({ invalidItems: 0 });

      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.validateCart();
      });

      expect(mockValidateCart).toHaveBeenCalled();
    });
  });
});
