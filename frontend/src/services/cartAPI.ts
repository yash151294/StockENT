import api from './api';
import { 
  CartItem, 
  AddToCartData, 
  UpdateCartItemData, 
  CartSummary 
} from '../types';

export interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}

export const cartAPI = {
  /**
   * Get user's cart items
   */
  getCart: (): Promise<CartResponse> => 
    api.get<CartResponse>('/cart').then((response: any) => response.data),

  /**
   * Add item to cart
   */
  addToCart: (data: AddToCartData): Promise<CartItem> =>
    api.post<CartItem>('/cart', data).then((response: any) => response.data),

  /**
   * Update cart item quantity
   */
  updateQuantity: (id: string, quantity: number): Promise<CartItem> =>
    api.put<CartItem>(`/cart/${id}`, { quantity }).then((response: any) => response.data),

  /**
   * Remove item from cart
   */
  removeFromCart: (id: string): Promise<{ success: boolean }> =>
    api.delete<{ success: boolean }>(`/cart/${id}`).then((response: any) => response.data),

  /**
   * Clear entire cart
   */
  clearCart: (): Promise<{ success: boolean; count: number }> =>
    api.delete<{ success: boolean; count: number }>('/cart').then((response: any) => response.data),

  /**
   * Validate all cart items
   */
  validateCart: (): Promise<{
    validationResults: Array<{
      itemId: string;
      productId: string;
      isValid: boolean;
      reason?: string;
    }>;
    totalItems: number;
    validItems: number;
    invalidItems: number;
  }> =>
    api.post('/cart/validate').then((response: any) => response.data),
};
