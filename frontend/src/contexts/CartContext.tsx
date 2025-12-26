'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/cartAPI';
import { 
  CartItem, 
  AddToCartData, 
  CartSummary, 
} from '../types';
import { useNotification } from './NotificationContext';

interface CartContextType {
  // Cart data
  cartItems: CartItem[];
  cartSummary: CartSummary | null;
  isLoading: boolean;
  error: Error | null;

  // Cart actions
  addToCart: (data: AddToCartData) => Promise<CartItem>;
  updateQuantity: (itemId: string, quantity: number) => Promise<CartItem>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  validateCart: () => Promise<void>;

  // Cart state helpers
  getItemCount: () => number;
  getTotalValue: () => number;
  isInCart: (productId: string, sourceType?: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { state } = useAuth();
  const { showSuccess, showWarning } = useNotification();
  const queryClient = useQueryClient();

  // Fetch cart data
  const {
    data: cartData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cart'],
    queryFn: cartAPI.getCart,
    enabled: !!state.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const cartItems = cartData?.items || [];
  const cartSummary = cartData?.summary || null;

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: cartAPI.addToCart,
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showSuccess(`Added ${newItem.product?.title} to cart`);
    },
    onError: (error: any) => {
      showWarning(error.response?.data?.message || 'Failed to add item to cart');
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartAPI.updateQuantity(itemId, quantity),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showSuccess(`Updated ${updatedItem.product?.title} quantity`);
    },
    onError: (error: any) => {
      showWarning(error.response?.data?.message || 'Failed to update quantity');
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: cartAPI.removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showSuccess('Item removed from cart');
    },
    onError: (error: any) => {
      showWarning(error.response?.data?.message || 'Failed to remove item');
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: cartAPI.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showSuccess('Cart cleared');
    },
    onError: (error: any) => {
      showWarning(error.response?.data?.message || 'Failed to clear cart');
    },
  });

  // Validate cart mutation
  const validateCartMutation = useMutation({
    mutationFn: cartAPI.validateCart,
    onSuccess: (result) => {
      if (result.invalidItems > 0) {
        showWarning(
          `${result.invalidItems} items were removed due to availability issues`
        );
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    },
    onError: (error: any) => {
      showWarning(error.response?.data?.message || 'Failed to validate cart');
    },
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !state.user) return;

    // Join cart room
    socket.emit('join_cart');

    // Cart event handlers
    const handleCartItemAdded = (item: CartItem) => {
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return { items: [item], summary: null };
        return {
          ...old,
          items: [...old.items, item],
        };
      });
    };

    const handleCartItemUpdated = (item: CartItem) => {
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return { items: [], summary: null };
        return {
          ...old,
          items: old.items.map((i: CartItem) => (i.id === item.id ? item : i)),
        };
      });
    };

    const handleCartItemRemoved = (data: { itemId: string }) => {
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return { items: [], summary: null };
        return {
          ...old,
          items: old.items.filter((i: CartItem) => i.id !== data.itemId),
        };
      });
    };

    const handleCartItemUnavailable = (data: { itemId: string; product: any; reason: string }) => {
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return { items: [], summary: null };
        return {
          ...old,
          items: old.items.filter((i: CartItem) => i.id !== data.itemId),
        };
      });
      showWarning(`${data.product.title} is no longer available: ${data.reason}`);
    };

    const handleCartCleared = () => {
      queryClient.setQueryData(['cart'], { items: [], summary: null });
    };

    const handleCartUpdated = () => {
      // Invalidate cart data to refetch
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    };

    // Register event listeners
    socket.on('cart_item_added', handleCartItemAdded);
    socket.on('cart_item_updated', handleCartItemUpdated);
    socket.on('cart_item_removed', handleCartItemRemoved);
    socket.on('cart_item_unavailable', handleCartItemUnavailable);
    socket.on('cart_cleared', handleCartCleared);
    socket.on('cart_updated', handleCartUpdated);

    return () => {
      socket.emit('leave_cart');
      socket.off('cart_item_added', handleCartItemAdded);
      socket.off('cart_item_updated', handleCartItemUpdated);
      socket.off('cart_item_removed', handleCartItemRemoved);
      socket.off('cart_item_unavailable', handleCartItemUnavailable);
      socket.off('cart_cleared', handleCartCleared);
      socket.off('cart_updated', handleCartUpdated);
    };
  }, [socket, isConnected, state.user, queryClient, showSuccess, showWarning]);

  // Cart actions
  const addToCart = async (data: AddToCartData): Promise<CartItem> => {
    return addToCartMutation.mutateAsync(data);
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<CartItem> => {
    return updateQuantityMutation.mutateAsync({ itemId, quantity });
  };

  const removeFromCart = async (itemId: string): Promise<void> => {
    await removeFromCartMutation.mutateAsync(itemId);
  };

  const clearCart = async (): Promise<void> => {
    await clearCartMutation.mutateAsync();
  };

  const validateCart = async (): Promise<void> => {
    await validateCartMutation.mutateAsync();
  };

  // Helper functions
  const getItemCount = (): number => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalValue = (): number => {
    return cartItems.reduce((total, item) => total + (item.quantity * item.priceAtAddition), 0);
  };

  const isInCart = (productId: string, sourceType?: string): boolean => {
    return cartItems.some(item => 
      item.productId === productId && 
      (!sourceType || item.sourceType === sourceType)
    );
  };

  const value: CartContextType = {
    cartItems,
    cartSummary,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    validateCart,
    getItemCount,
    getTotalValue,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
