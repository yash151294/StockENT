const { getPrismaClient } = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { emitToUser, emitToCart } = require('../utils/socket');

const prisma = getPrismaClient();

/**
 * Add item to cart with validation
 */
const addToCart = async (userId, productId, quantity, sourceType = 'DIRECT', priceOverride = null, metadata = {}) => {
  try {
    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.status !== 'ACTIVE') {
      throw new Error('Product is not available');
    }

    if (product.sellerId === userId) {
      throw new Error('Cannot add your own product to cart');
    }

    // Validate quantity
    if (quantity < product.minOrderQuantity) {
      throw new Error(`Minimum order quantity is ${product.minOrderQuantity} ${product.unit}`);
    }

    if (quantity > product.quantityAvailable) {
      throw new Error(`Only ${product.quantityAvailable} ${product.unit} available`);
    }

    // Determine price
    const price = priceOverride || product.basePrice;

    // Check if item already exists in cart for this source type
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId_sourceType: {
          userId,
          productId,
          sourceType,
        },
      },
    });

    if (existingItem) {
      // Update existing item
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: quantity,
          priceAtAddition: price,
          updatedAt: new Date(),
        },
        include: {
          product: {
            include: {
              images: true,
              seller: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },
        },
      });

      // Emit real-time update
      emitToCart(userId, 'cart_item_updated', updatedItem);
      emitToCart(userId, 'cart_updated', { itemId: updatedItem.id, action: 'updated' });

      logger.info(`Cart item updated: ${updatedItem.id} for user: ${userId}`);
      return updatedItem;
    } else {
      // Create new cart item
      const cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          priceAtAddition: price,
          currency: product.currency,
          sourceType,
          negotiationId: metadata.negotiationId || null,
          auctionBidId: metadata.auctionBidId || null,
        },
        include: {
          product: {
            include: {
              images: true,
              seller: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },
        },
      });

      // Emit real-time update
      emitToCart(userId, 'cart_item_added', cartItem);
      emitToCart(userId, 'cart_updated', { itemId: cartItem.id, action: 'added' });

      logger.info(`Cart item added: ${cartItem.id} for user: ${userId}`);
      return cartItem;
    }
  } catch (error) {
    logger.error('Add to cart error:', error);
    throw error;
  }
};

/**
 * Update cart item quantity
 */
const updateCartItemQuantity = async (cartItemId, quantity, userId) => {
  try {
    // Get cart item with product details
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // Validate quantity
    if (quantity < cartItem.product.minOrderQuantity) {
      throw new Error(`Minimum order quantity is ${cartItem.product.minOrderQuantity} ${cartItem.product.unit}`);
    }

    if (quantity > cartItem.product.quantityAvailable) {
      throw new Error(`Only ${cartItem.product.quantityAvailable} ${cartItem.product.unit} available`);
    }

    // Update cart item
    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity,
        updatedAt: new Date(),
      },
      include: {
        product: {
          include: {
            images: true,
            seller: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
      },
    });

    // Emit real-time update
    emitToCart(userId, 'cart_item_updated', updatedItem);
    emitToCart(userId, 'cart_updated', { itemId: updatedItem.id, action: 'updated' });

    logger.info(`Cart item quantity updated: ${cartItemId} to ${quantity}`);
    return updatedItem;
  } catch (error) {
    logger.error('Update cart item quantity error:', error);
    throw error;
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (cartItemId, userId) => {
  try {
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    // Emit real-time update
    emitToCart(userId, 'cart_item_removed', { itemId: cartItemId });
    emitToCart(userId, 'cart_updated', { itemId: cartItemId, action: 'removed' });

    logger.info(`Cart item removed: ${cartItemId} for user: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Remove from cart error:', error);
    throw error;
  }
};

/**
 * Get all cart items for a user
 */
const getCartItems = async (userId) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: true,
            seller: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        negotiation: true,
        auctionBid: true,
      },
      orderBy: { addedAt: 'desc' },
    });

    return cartItems;
  } catch (error) {
    logger.error('Get cart items error:', error);
    throw error;
  }
};

/**
 * Clear all cart items for a user
 */
const clearCart = async (userId) => {
  try {
    const deletedItems = await prisma.cartItem.deleteMany({
      where: { userId },
    });

    // Emit real-time update
    emitToCart(userId, 'cart_cleared', { count: deletedItems.count });
    emitToCart(userId, 'cart_updated', { action: 'cleared' });

    logger.info(`Cart cleared for user: ${userId}, removed ${deletedItems.count} items`);
    return { success: true, count: deletedItems.count };
  } catch (error) {
    logger.error('Clear cart error:', error);
    throw error;
  }
};

/**
 * Validate cart item
 */
const validateCartItem = async (cartItemId) => {
  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        product: true,
        user: true,
      },
    });

    if (!cartItem) {
      return { isValid: false, reason: 'Cart item not found' };
    }

    const product = cartItem.product;

    // Check if product still exists and is active
    if (product.status !== 'ACTIVE') {
      return { isValid: false, reason: 'Product is no longer available' };
    }

    // Check if quantity is still available
    if (cartItem.quantity > product.quantityAvailable) {
      return { isValid: false, reason: 'Insufficient quantity available' };
    }

    // Check if price has changed significantly (>20%)
    const priceChange = Math.abs(product.basePrice - cartItem.priceAtAddition) / cartItem.priceAtAddition;
    if (priceChange > 0.2) {
      return { isValid: false, reason: 'Product price has changed significantly' };
    }

    return { isValid: true };
  } catch (error) {
    logger.error('Validate cart item error:', error);
    throw error;
  }
};

/**
 * Sync cart after product update
 */
const syncCartAfterProductUpdate = async (productId) => {
  try {
    // Get all cart items for this product
    const cartItems = await prisma.cartItem.findMany({
      where: { productId },
      include: {
        user: true,
        product: true,
      },
    });

    for (const cartItem of cartItems) {
      const validation = await validateCartItem(cartItem.id);
      
      if (!validation.isValid) {
        // Remove invalid cart item
        await prisma.cartItem.delete({
          where: { id: cartItem.id },
        });

        // Emit real-time update to user
        emitToCart(cartItem.userId, 'cart_item_unavailable', {
          itemId: cartItem.id,
          product: cartItem.product,
          reason: validation.reason,
        });
        emitToCart(cartItem.userId, 'cart_updated', { 
          itemId: cartItem.id, 
          action: 'removed_unavailable' 
        });

        logger.info(`Removed invalid cart item: ${cartItem.id} for user: ${cartItem.userId}, reason: ${validation.reason}`);
      }
    }

    return { processed: cartItems.length };
  } catch (error) {
    logger.error('Sync cart after product update error:', error);
    throw error;
  }
};

/**
 * Get cart summary (totals, item count)
 */
const getCartSummary = async (userId) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            currency: true,
          },
        },
      },
    });

    const summary = {
      itemCount: cartItems.length,
      totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: cartItems.reduce((sum, item) => sum + (item.quantity * item.priceAtAddition), 0),
      currencies: [...new Set(cartItems.map(item => item.product.currency))],
    };

    return summary;
  } catch (error) {
    logger.error('Get cart summary error:', error);
    throw error;
  }
};

module.exports = {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  getCartItems,
  clearCart,
  validateCartItem,
  syncCartAfterProductUpdate,
  getCartSummary,
};
