const { getPrismaClient } = require('../utils/prisma');
const { logger } = require('../utils/logger');
const { emitToUser, emitToNegotiation } = require('../utils/socket');
const cartService = require('./cartService');

const prisma = getPrismaClient();

/**
 * Create initial negotiation offer
 */
const createNegotiation = async (productId, buyerId, buyerOffer, buyerMessage = null) => {
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
      throw new Error('Product is not available for negotiation');
    }

    if (product.listingType !== 'NEGOTIABLE') {
      throw new Error('Product is not negotiable');
    }

    if (product.sellerId === buyerId) {
      throw new Error('Cannot negotiate on your own product');
    }

    // Check if negotiation already exists
    const existingNegotiation = await prisma.negotiation.findUnique({
      where: {
        productId_buyerId: {
          productId,
          buyerId,
        },
      },
    });

    if (existingNegotiation) {
      throw new Error('Negotiation already exists for this product');
    }

    // Validate offer amount
    if (buyerOffer <= 0) {
      throw new Error('Offer amount must be greater than 0');
    }

    if (buyerOffer > product.basePrice * 1.5) {
      throw new Error('Offer amount cannot exceed 150% of base price');
    }

    // Create negotiation
    const negotiation = await prisma.negotiation.create({
      data: {
        productId,
        buyerId,
        sellerId: product.sellerId,
        buyerOffer,
        buyerMessage,
        expiresAt: product.expiresAt,
        status: 'PENDING',
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
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    // Emit real-time updates
    emitToUser(product.sellerId, 'new_negotiation_notification', negotiation);
    emitToUser(buyerId, 'negotiation_created', negotiation);
    emitToNegotiation(negotiation.id, 'negotiation_created', negotiation);

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        title: 'New Negotiation Offer',
        message: `${negotiation.buyer.companyName} has made an offer of ${buyerOffer} ${product.currency} for ${product.title}`,
        type: 'NEGOTIATION_OFFER',
        data: {
          negotiationId: negotiation.id,
          productId,
          buyerId,
          offer: buyerOffer,
        },
      },
    });

    logger.info(`Negotiation created: ${negotiation.id} for product: ${productId}`);
    return negotiation;
  } catch (error) {
    logger.error('Create negotiation error:', error);
    throw error;
  }
};

/**
 * Send counter-offer
 */
const sendCounterOffer = async (negotiationId, sellerId, counterOffer, sellerMessage = null) => {
  try {
    // Get negotiation details
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (negotiation.sellerId !== sellerId) {
      throw new Error('Unauthorized to send counter-offer');
    }

    if (negotiation.status !== 'PENDING') {
      throw new Error('Cannot send counter-offer for this negotiation status');
    }

    // Validate counter-offer
    if (counterOffer <= 0) {
      throw new Error('Counter-offer amount must be greater than 0');
    }

    if (counterOffer <= negotiation.buyerOffer) {
      throw new Error('Counter-offer must be higher than buyer\'s offer');
    }

    if (counterOffer > negotiation.product.basePrice * 1.5) {
      throw new Error('Counter-offer cannot exceed 150% of base price');
    }

    // Update negotiation
    const updatedNegotiation = await prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        sellerCounterOffer: counterOffer,
        sellerMessage,
        status: 'COUNTERED',
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
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    // Emit real-time updates
    emitToUser(negotiation.buyerId, 'counter_offer_received', updatedNegotiation);
    emitToUser(sellerId, 'counter_offer_sent', updatedNegotiation);
    emitToNegotiation(negotiationId, 'counter_offer_received', updatedNegotiation);

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: negotiation.buyerId,
        title: 'Counter-Offer Received',
        message: `${negotiation.seller.companyName} has sent a counter-offer of ${counterOffer} ${negotiation.product.currency} for ${negotiation.product.title}`,
        type: 'NEGOTIATION_COUNTER_OFFER',
        data: {
          negotiationId: negotiation.id,
          productId: negotiation.productId,
          sellerId,
          counterOffer,
        },
      },
    });

    logger.info(`Counter-offer sent: ${negotiationId} by seller: ${sellerId}`);
    return updatedNegotiation;
  } catch (error) {
    logger.error('Send counter-offer error:', error);
    throw error;
  }
};

/**
 * Accept counter-offer
 */
const acceptCounterOffer = async (negotiationId, buyerId) => {
  try {
    // Get negotiation details
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (negotiation.buyerId !== buyerId) {
      throw new Error('Unauthorized to accept this negotiation');
    }

    if (negotiation.status !== 'COUNTERED') {
      throw new Error('Cannot accept counter-offer for this negotiation status');
    }

    // Check if product is still available
    if (negotiation.product.status !== 'ACTIVE') {
      throw new Error('Product is no longer available');
    }

    // Update negotiation status
    const updatedNegotiation = await prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: 'ACCEPTED',
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
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    // Add to cart with negotiated price (use product's minimum order quantity)
    const cartItem = await cartService.addToCart(
      buyerId,
      negotiation.productId,
      negotiation.product.minOrderQuantity || 1,
      'NEGOTIATION',
      negotiation.sellerCounterOffer,
      { negotiationId: negotiation.id }
    );

    // Update cart item with negotiation reference
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { negotiationId: negotiation.id },
    });

    // Emit real-time updates
    emitToUser(buyerId, 'negotiation_accepted', updatedNegotiation);
    emitToUser(negotiation.sellerId, 'negotiation_accepted', updatedNegotiation);
    emitToNegotiation(negotiationId, 'negotiation_accepted', updatedNegotiation);

    // Create notifications
    await prisma.notification.create({
      data: {
        userId: negotiation.sellerId,
        title: 'Negotiation Accepted',
        message: `${negotiation.buyer.companyName} has accepted your counter-offer of ${negotiation.sellerCounterOffer} ${negotiation.product.currency} for ${negotiation.product.title}`,
        type: 'NEGOTIATION_ACCEPTED',
        data: {
          negotiationId: negotiation.id,
          productId: negotiation.productId,
          buyerId,
          acceptedPrice: negotiation.sellerCounterOffer,
        },
      },
    });

    logger.info(`Negotiation accepted: ${negotiationId} by buyer: ${buyerId}`);
    return { negotiation: updatedNegotiation, cartItem };
  } catch (error) {
    logger.error('Accept counter-offer error:', error);
    throw error;
  }
};

/**
 * Decline counter-offer
 */
const declineCounterOffer = async (negotiationId, buyerId) => {
  try {
    // Get negotiation details
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (negotiation.buyerId !== buyerId) {
      throw new Error('Unauthorized to decline this negotiation');
    }

    if (negotiation.status !== 'COUNTERED') {
      throw new Error('Cannot decline counter-offer for this negotiation status');
    }

    // Update negotiation status
    const updatedNegotiation = await prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: 'DECLINED',
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
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    // Emit real-time updates
    emitToUser(buyerId, 'negotiation_declined', updatedNegotiation);
    emitToUser(negotiation.sellerId, 'negotiation_declined', updatedNegotiation);
    emitToNegotiation(negotiationId, 'negotiation_declined', updatedNegotiation);

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: negotiation.sellerId,
        title: 'Negotiation Declined',
        message: `${negotiation.buyer.companyName} has declined your counter-offer for ${negotiation.product.title}`,
        type: 'NEGOTIATION_DECLINED',
        data: {
          negotiationId: negotiation.id,
          productId: negotiation.productId,
          buyerId,
        },
      },
    });

    logger.info(`Negotiation declined: ${negotiationId} by buyer: ${buyerId}`);
    return updatedNegotiation;
  } catch (error) {
    logger.error('Decline counter-offer error:', error);
    throw error;
  }
};

/**
 * Cancel negotiation
 */
const cancelNegotiation = async (negotiationId, userId) => {
  try {
    // Get negotiation details
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    if (negotiation.buyerId !== userId && negotiation.sellerId !== userId) {
      throw new Error('Unauthorized to cancel this negotiation');
    }

    if (negotiation.status === 'ACCEPTED' || negotiation.status === 'CANCELLED') {
      throw new Error('Cannot cancel negotiation in this status');
    }

    // Update negotiation status
    const updatedNegotiation = await prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: 'CANCELLED',
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
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    // Emit real-time updates to both parties
    emitToUser(negotiation.buyerId, 'negotiation_cancelled', updatedNegotiation);
    emitToUser(negotiation.sellerId, 'negotiation_cancelled', updatedNegotiation);
    emitToNegotiation(negotiationId, 'negotiation_cancelled', updatedNegotiation);

    logger.info(`Negotiation cancelled: ${negotiationId} by user: ${userId}`);
    return updatedNegotiation;
  } catch (error) {
    logger.error('Cancel negotiation error:', error);
    throw error;
  }
};

/**
 * Get negotiations by user
 */
const getNegotiationsByUser = async (userId, role = null) => {
  try {
    let whereClause = {};
    
    if (role === 'buyer') {
      whereClause = { buyerId: userId };
    } else if (role === 'seller') {
      whereClause = { sellerId: userId };
    } else {
      whereClause = {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      };
    }

    const negotiations = await prisma.negotiation.findMany({
      where: whereClause,
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
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return negotiations;
  } catch (error) {
    logger.error('Get negotiations by user error:', error);
    throw error;
  }
};

/**
 * Get single negotiation
 */
const getNegotiation = async (negotiationId, userId) => {
  try {
    const negotiation = await prisma.negotiation.findFirst({
      where: {
        id: negotiationId,
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
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
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found or access denied');
    }

    return negotiation;
  } catch (error) {
    logger.error('Get negotiation error:', error);
    throw error;
  }
};

/**
 * Check negotiation expiry (cron job)
 */
const checkNegotiationExpiry = async () => {
  try {
    const expiredNegotiations = await prisma.negotiation.findMany({
      where: {
        status: {
          in: ['PENDING', 'COUNTERED'],
        },
        OR: [
          { expiresAt: { lte: new Date() } },
          {
            product: {
              status: { not: 'ACTIVE' },
            },
          },
        ],
      },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            companyName: true,
          },
        },
        seller: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    for (const negotiation of expiredNegotiations) {
      await prisma.negotiation.update({
        where: { id: negotiation.id },
        data: {
          status: 'EXPIRED',
          updatedAt: new Date(),
        },
      });

      // Emit real-time updates
      emitToUser(negotiation.buyerId, 'negotiation_expired', negotiation);
      emitToUser(negotiation.sellerId, 'negotiation_expired', negotiation);
      emitToNegotiation(negotiation.id, 'negotiation_expired', negotiation);

      // Create notifications
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: negotiation.buyerId,
            title: 'Negotiation Expired',
            message: `Your negotiation for ${negotiation.product.title} has expired`,
            type: 'NEGOTIATION_EXPIRED',
            data: {
              negotiationId: negotiation.id,
              productId: negotiation.productId,
            },
          },
        }),
        prisma.notification.create({
          data: {
            userId: negotiation.sellerId,
            title: 'Negotiation Expired',
            message: `Negotiation for ${negotiation.product.title} has expired`,
            type: 'NEGOTIATION_EXPIRED',
            data: {
              negotiationId: negotiation.id,
              productId: negotiation.productId,
            },
          },
        }),
      ]);

      logger.info(`Negotiation expired: ${negotiation.id}`);
    }

    return { expired: expiredNegotiations.length };
  } catch (error) {
    logger.error('Check negotiation expiry error:', error);
    throw error;
  }
};

module.exports = {
  createNegotiation,
  sendCounterOffer,
  acceptCounterOffer,
  declineCounterOffer,
  cancelNegotiation,
  getNegotiationsByUser,
  getNegotiation,
  checkNegotiationExpiry,
};