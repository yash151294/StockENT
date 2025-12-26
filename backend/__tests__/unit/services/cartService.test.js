/**
 * Unit tests for CartService
 * Tests cart operations in isolation using mocked Prisma
 */

const {
  createMockPrismaClient,
  createTestUser,
  createTestProduct,
  createTestCartItem,
} = require('../../helpers/testDb');

// Mock the prisma module before requiring the service
const mockPrisma = createMockPrismaClient();
jest.mock('../../../src/utils/prisma', () => ({
  getPrismaClient: () => mockPrisma,
}));

// Now import the service after mocking
const cartService = require('../../../src/services/cartService');

describe('CartService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('addToCart', () => {
    it('should add a new item to cart successfully', async () => {
      const testProduct = createTestProduct({
        id: 'product-1',
        sellerId: 'seller-1',
        status: 'ACTIVE',
        minOrderQuantity: 10,
        quantityAvailable: 1000,
        basePrice: 100,
      });

      const expectedCartItem = createTestCartItem({
        id: 'cart-item-1',
        userId: 'user-1',
        productId: 'product-1',
        quantity: 50,
        priceAtAddition: 100,
        product: testProduct,
      });

      // Mock product lookup
      mockPrisma.product.findUnique.mockResolvedValue({
        ...testProduct,
        seller: { id: 'seller-1', companyName: 'Seller Company' },
      });

      // Mock no existing cart item
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      // Mock cart item creation
      mockPrisma.cartItem.create.mockResolvedValue({
        ...expectedCartItem,
        product: {
          ...testProduct,
          images: [],
          seller: { id: 'seller-1', companyName: 'Seller Company' },
        },
      });

      const result = await cartService.addToCart('user-1', 'product-1', 50);

      expect(result.id).toBe('cart-item-1');
      expect(result.quantity).toBe(50);
      expect(mockPrisma.cartItem.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        cartService.addToCart('user-1', 'non-existent-product', 50)
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when product is not active', async () => {
      const inactiveProduct = createTestProduct({
        status: 'INACTIVE',
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        ...inactiveProduct,
        seller: { id: 'seller-1', companyName: 'Seller Company' },
      });

      await expect(
        cartService.addToCart('user-1', 'product-1', 50)
      ).rejects.toThrow('Product is not available');
    });

    it('should throw error when trying to add own product', async () => {
      const testProduct = createTestProduct({
        sellerId: 'user-1', // Same as userId
        status: 'ACTIVE',
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        ...testProduct,
        seller: { id: 'user-1', companyName: 'My Company' },
      });

      await expect(
        cartService.addToCart('user-1', 'product-1', 50)
      ).rejects.toThrow('Cannot add your own product to cart');
    });

    it('should throw error when quantity is below minimum', async () => {
      const testProduct = createTestProduct({
        sellerId: 'seller-1',
        status: 'ACTIVE',
        minOrderQuantity: 100,
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        ...testProduct,
        seller: { id: 'seller-1', companyName: 'Seller Company' },
      });

      await expect(
        cartService.addToCart('user-1', 'product-1', 50)
      ).rejects.toThrow(/Minimum order quantity is/);
    });

    it('should throw error when quantity exceeds available', async () => {
      const testProduct = createTestProduct({
        sellerId: 'seller-1',
        status: 'ACTIVE',
        minOrderQuantity: 10,
        quantityAvailable: 100,
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        ...testProduct,
        seller: { id: 'seller-1', companyName: 'Seller Company' },
      });

      await expect(
        cartService.addToCart('user-1', 'product-1', 500)
      ).rejects.toThrow(/Only \d+ \w+ available/);
    });

    it('should update existing cart item when same product added', async () => {
      const testProduct = createTestProduct({
        id: 'product-1',
        sellerId: 'seller-1',
        status: 'ACTIVE',
        minOrderQuantity: 10,
        quantityAvailable: 1000,
      });

      const existingCartItem = createTestCartItem({
        id: 'cart-item-1',
        userId: 'user-1',
        productId: 'product-1',
        quantity: 30,
      });

      mockPrisma.product.findUnique.mockResolvedValue({
        ...testProduct,
        seller: { id: 'seller-1', companyName: 'Seller Company' },
      });

      // Mock existing cart item found
      mockPrisma.cartItem.findUnique.mockResolvedValue(existingCartItem);

      // Mock cart item update
      mockPrisma.cartItem.update.mockResolvedValue({
        ...existingCartItem,
        quantity: 50,
        product: {
          ...testProduct,
          images: [],
          seller: { id: 'seller-1', companyName: 'Seller Company' },
        },
      });

      const result = await cartService.addToCart('user-1', 'product-1', 50);

      expect(result.quantity).toBe(50);
      expect(mockPrisma.cartItem.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.cartItem.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update cart item quantity successfully', async () => {
      const testProduct = createTestProduct({
        minOrderQuantity: 10,
        quantityAvailable: 1000,
      });

      const cartItem = createTestCartItem({
        id: 'cart-item-1',
        userId: 'user-1',
        quantity: 30,
        product: testProduct,
      });

      mockPrisma.cartItem.findFirst.mockResolvedValue(cartItem);
      mockPrisma.cartItem.update.mockResolvedValue({
        ...cartItem,
        quantity: 100,
        product: {
          ...testProduct,
          images: [],
          seller: { id: 'seller-1', companyName: 'Seller Company' },
        },
      });

      const result = await cartService.updateCartItemQuantity(
        'cart-item-1',
        100,
        'user-1'
      );

      expect(result.quantity).toBe(100);
      expect(mockPrisma.cartItem.update).toHaveBeenCalledTimes(1);
    });

    it('should throw error when cart item not found', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(
        cartService.updateCartItemQuantity('non-existent', 100, 'user-1')
      ).rejects.toThrow('Cart item not found');
    });
  });

  describe('removeFromCart', () => {
    it('should remove cart item successfully', async () => {
      const cartItem = createTestCartItem({
        id: 'cart-item-1',
        userId: 'user-1',
      });

      mockPrisma.cartItem.findFirst.mockResolvedValue(cartItem);
      mockPrisma.cartItem.delete.mockResolvedValue(cartItem);

      const result = await cartService.removeFromCart('cart-item-1', 'user-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'cart-item-1' },
      });
    });

    it('should throw error when cart item not found', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(
        cartService.removeFromCart('non-existent', 'user-1')
      ).rejects.toThrow('Cart item not found');
    });
  });

  describe('getCartItems', () => {
    it('should return all cart items for user', async () => {
      const cartItems = [
        createTestCartItem({ id: 'item-1', userId: 'user-1' }),
        createTestCartItem({ id: 'item-2', userId: 'user-1' }),
      ];

      mockPrisma.cartItem.findMany.mockResolvedValue(cartItems);

      const result = await cartService.getCartItems('user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.cartItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        })
      );
    });

    it('should return empty array when no cart items', async () => {
      mockPrisma.cartItem.findMany.mockResolvedValue([]);

      const result = await cartService.getCartItems('user-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all cart items for user', async () => {
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 5 });

      const result = await cartService.clearCart('user-1');

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('validateCartItem', () => {
    it('should return valid for active product with available quantity', async () => {
      const testProduct = createTestProduct({
        status: 'ACTIVE',
        quantityAvailable: 1000,
        basePrice: 100,
      });

      const cartItem = createTestCartItem({
        id: 'cart-item-1',
        quantity: 50,
        priceAtAddition: 100,
        product: testProduct,
      });

      mockPrisma.cartItem.findUnique.mockResolvedValue({
        ...cartItem,
        user: createTestUser(),
      });

      const result = await cartService.validateCartItem('cart-item-1');

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when cart item not found', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      const result = await cartService.validateCartItem('non-existent');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Cart item not found');
    });

    it('should return invalid when product is no longer active', async () => {
      const inactiveProduct = createTestProduct({
        status: 'INACTIVE',
      });

      const cartItem = createTestCartItem({
        product: inactiveProduct,
      });

      mockPrisma.cartItem.findUnique.mockResolvedValue({
        ...cartItem,
        user: createTestUser(),
      });

      const result = await cartService.validateCartItem('cart-item-1');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Product is no longer available');
    });

    it('should return invalid when insufficient quantity', async () => {
      const testProduct = createTestProduct({
        status: 'ACTIVE',
        quantityAvailable: 10,
      });

      const cartItem = createTestCartItem({
        quantity: 100, // More than available
        product: testProduct,
      });

      mockPrisma.cartItem.findUnique.mockResolvedValue({
        ...cartItem,
        user: createTestUser(),
      });

      const result = await cartService.validateCartItem('cart-item-1');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Insufficient quantity available');
    });

    it('should return invalid when price changed significantly', async () => {
      const testProduct = createTestProduct({
        status: 'ACTIVE',
        quantityAvailable: 1000,
        basePrice: 150, // 50% increase from cart price
      });

      const cartItem = createTestCartItem({
        quantity: 50,
        priceAtAddition: 100,
        product: testProduct,
      });

      mockPrisma.cartItem.findUnique.mockResolvedValue({
        ...cartItem,
        user: createTestUser(),
      });

      const result = await cartService.validateCartItem('cart-item-1');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Product price has changed significantly');
    });
  });

  describe('getCartSummary', () => {
    it('should return correct cart summary', async () => {
      const cartItems = [
        {
          ...createTestCartItem({ quantity: 10, priceAtAddition: 100 }),
          product: { currency: 'USD' },
        },
        {
          ...createTestCartItem({ quantity: 20, priceAtAddition: 50 }),
          product: { currency: 'USD' },
        },
      ];

      mockPrisma.cartItem.findMany.mockResolvedValue(cartItems);

      const result = await cartService.getCartSummary('user-1');

      expect(result.itemCount).toBe(2);
      expect(result.totalQuantity).toBe(30); // 10 + 20
      expect(result.totalValue).toBe(2000); // (10 * 100) + (20 * 50)
      expect(result.currencies).toContain('USD');
    });

    it('should handle empty cart', async () => {
      mockPrisma.cartItem.findMany.mockResolvedValue([]);

      const result = await cartService.getCartSummary('user-1');

      expect(result.itemCount).toBe(0);
      expect(result.totalQuantity).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.currencies).toHaveLength(0);
    });
  });
});
