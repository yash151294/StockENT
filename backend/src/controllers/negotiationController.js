const negotiationService = require('../services/negotiationService');
const { logger } = require('../utils/logger');

/**
 * Create negotiation (buyer)
 */
const createNegotiation = async (req, res) => {
  try {
    const { productId, buyerOffer, buyerMessage } = req.body;
    const buyerId = req.user.id;

    if (!productId || !buyerOffer) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and offer amount are required',
      });
    }

    const negotiation = await negotiationService.createNegotiation(
      productId,
      buyerId,
      buyerOffer,
      buyerMessage
    );

    res.status(201).json({
      success: true,
      data: negotiation,
      message: 'Negotiation offer sent successfully',
    });
  } catch (error) {
    logger.error('Create negotiation controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's negotiations
 */
const getNegotiations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query; // 'buyer', 'seller', or null for both

    const negotiations = await negotiationService.getNegotiationsByUser(userId, role);

    res.json({
      success: true,
      data: negotiations,
    });
  } catch (error) {
    logger.error('Get negotiations controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch negotiations',
    });
  }
};

/**
 * Get single negotiation
 */
const getNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const negotiation = await negotiationService.getNegotiation(id, userId);

    res.json({
      success: true,
      data: negotiation,
    });
  } catch (error) {
    logger.error('Get negotiation controller error:', error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send counter-offer (seller)
 */
const sendCounterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { counterOffer, sellerMessage } = req.body;
    const sellerId = req.user.id;

    if (!counterOffer) {
      return res.status(400).json({
        success: false,
        message: 'Counter-offer amount is required',
      });
    }

    const negotiation = await negotiationService.sendCounterOffer(
      id,
      sellerId,
      counterOffer,
      sellerMessage
    );

    res.json({
      success: true,
      data: negotiation,
      message: 'Counter-offer sent successfully',
    });
  } catch (error) {
    logger.error('Send counter-offer controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Accept counter-offer (buyer)
 */
const acceptCounterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;

    const result = await negotiationService.acceptCounterOffer(id, buyerId);

    res.json({
      success: true,
      data: result,
      message: 'Counter-offer accepted! Item added to cart',
    });
  } catch (error) {
    logger.error('Accept counter-offer controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Decline counter-offer (buyer)
 */
const declineCounterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;

    const negotiation = await negotiationService.declineCounterOffer(id, buyerId);

    res.json({
      success: true,
      data: negotiation,
      message: 'Counter-offer declined',
    });
  } catch (error) {
    logger.error('Decline counter-offer controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancel negotiation
 */
const cancelNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const negotiation = await negotiationService.cancelNegotiation(id, userId);

    res.json({
      success: true,
      data: negotiation,
      message: 'Negotiation cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel negotiation controller error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createNegotiation,
  getNegotiations,
  getNegotiation,
  sendCounterOffer,
  acceptCounterOffer,
  declineCounterOffer,
  cancelNegotiation,
};
