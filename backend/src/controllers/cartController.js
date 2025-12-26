const cartService = require('../services/cartService');
const { logger } = require('../utils/logger');

/**
 * Add item to cart
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, sourceType = 'DIRECT', priceOverride, metadata } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required',
      });
    }

    const cartItem = await cartService.addToCart(
      userId,
      productId,
      quantity,
      sourceType,
      priceOverride,
      metadata
    );

    res.status(201).json({
      success: true,
      data: cartItem,
      message: 'Item added to cart successfully',
    });
  } catch (error) {
    logger.error('Add to cart controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's cart items
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await cartService.getCartItems(userId);
    const summary = await cartService.getCartSummary(userId);

    res.json({
      success: true,
      data: {
        items: cartItems,
        summary,
      },
    });
  } catch (error) {
    logger.error('Get cart controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart items',
    });
  }
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required',
      });
    }

    const updatedItem = await cartService.updateCartItemQuantity(id, quantity, userId);

    res.json({
      success: true,
      data: updatedItem,
      message: 'Cart item updated successfully',
    });
  } catch (error) {
    logger.error('Update cart item controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await cartService.removeFromCart(id, userId);

    res.json({
      success: true,
      data: result,
      message: 'Item removed from cart successfully',
    });
  } catch (error) {
    logger.error('Remove from cart controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Clear entire cart
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await cartService.clearCart(userId);

    res.json({
      success: true,
      data: result,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    logger.error('Clear cart controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
    });
  }
};

/**
 * Validate all cart items
 */
const validateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await cartService.getCartItems(userId);
    const validationResults = [];

    for (const item of cartItems) {
      const validation = await cartService.validateCartItem(item.id);
      validationResults.push({
        itemId: item.id,
        productId: item.productId,
        isValid: validation.isValid,
        reason: validation.reason,
      });
    }

    res.json({
      success: true,
      data: {
        validationResults,
        totalItems: cartItems.length,
        validItems: validationResults.filter(r => r.isValid).length,
        invalidItems: validationResults.filter(r => !r.isValid).length,
      },
    });
  } catch (error) {
    logger.error('Validate cart controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cart',
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCart,
};
