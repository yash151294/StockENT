const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const { sendAuctionNotification } = require('./emailService');
const { broadcast, emitToAuction } = require('../utils/socket');

const prisma = new PrismaClient();

/**
 * Start an auction
 */
const startAuction = async (auctionId) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status !== 'SCHEDULED') {
      throw new Error('Auction is not scheduled');
    }

    // Update auction status
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: 'ACTIVE',
        startTime: new Date(),
      },
    });

    // Update product status
    await prisma.product.update({
      where: { id: auction.productId },
      data: { status: 'ACTIVE' },
    });

    // Send notification to seller
    try {
      await sendAuctionNotification(
        auction.product.seller.email,
        auction,
        'STARTED'
      );
    } catch (emailError) {
      logger.error('Failed to send auction started email:', emailError);
    }

    // Emit real-time event for auction status change
    try {
      const eventData = {
        auctionId,
        status: 'ACTIVE',
        startTime: updatedAuction.startTime,
        product: {
          id: auction.productId,
          title: auction.product.title,
          sellerId: auction.product.sellerId,
        },
        type: 'STARTED'
      };
      
      logger.info(`📡 Broadcasting auction_status_changed event:`, eventData);
      broadcast('auction_status_changed', eventData);
      
      // Emit to auction room
      const auctionEventData = {
        auctionId,
        status: 'ACTIVE',
        startTime: updatedAuction.startTime,
      };
      logger.info(`📡 Emitting auction_started to auction room:`, auctionEventData);
      emitToAuction(auctionId, 'auction_started', auctionEventData);
      
      // Also broadcast to all users for the auctions page
      logger.info(`📡 Broadcasting auction_started to all users:`, auctionEventData);
      broadcast('auction_started', auctionEventData);
      
      logger.info(`✅ Successfully emitted real-time events for auction ${auctionId}`);
    } catch (socketError) {
      logger.error('❌ Failed to emit auction started event:', socketError);
    }

    logger.info(`Auction started: ${auctionId}`);
    return updatedAuction;
  } catch (error) {
    logger.error('Start auction error:', error);
    throw error;
  }
};

/**
 * End an auction
 */
const endAuction = async (auctionId) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
        bids: {
          include: {
            bidder: true,
          },
          orderBy: { amount: 'desc' },
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status !== 'ACTIVE') {
      throw new Error('Auction is not active');
    }

    // Find winning bid
    const winningBid = auction.bids[0];
    const isReserveMet =
      !auction.reservePrice ||
      (winningBid && winningBid.amount >= auction.reservePrice);

    // Update auction status
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: 'ENDED',
        endTime: new Date(),
      },
    });

    // Update product status
    await prisma.product.update({
      where: { id: auction.productId },
      data: {
        status: isReserveMet ? 'SOLD' : 'ACTIVE',
      },
    });

    // Create order if auction was successful
    if (isReserveMet && winningBid) {
      await prisma.order.create({
        data: {
          productId: auction.productId,
          buyerId: winningBid.bidderId,
          sellerId: auction.product.sellerId,
          price: winningBid.amount,
          quantity: 1, // Assuming 1 unit per auction
          status: 'PENDING',
          orderType: 'AUCTION',
        },
      });

      // Send notification to winner
      try {
        await sendAuctionNotification(
          winningBid.bidder.email,
          auction,
          'ENDED'
        );
      } catch (emailError) {
        logger.error(
          'Failed to send auction ended email to winner:',
          emailError
        );
      }
    }

    // Send notification to seller
    try {
      await sendAuctionNotification(
        auction.product.seller.email,
        auction,
        'ENDED'
      );
    } catch (emailError) {
      logger.error('Failed to send auction ended email to seller:', emailError);
    }

    // Emit real-time event for auction status change
    try {
      const eventData = {
        auctionId,
        status: 'ENDED',
        endTime: updatedAuction.endTime,
        product: {
          id: auction.productId,
          title: auction.product.title,
          sellerId: auction.product.sellerId,
        },
        winner: winningBid ? {
          id: winningBid.bidderId,
          companyName: winningBid.bidder.companyName,
          amount: winningBid.amount,
        } : null,
        isReserveMet,
        type: 'ENDED'
      };
      
      logger.info(`📡 Broadcasting auction_status_changed event:`, eventData);
      broadcast('auction_status_changed', eventData);
      
      // Emit to auction room
      const auctionEventData = {
        auctionId,
        status: 'ENDED',
        endTime: updatedAuction.endTime,
        winner: winningBid ? {
          id: winningBid.bidderId,
          companyName: winningBid.bidder.companyName,
          amount: winningBid.amount,
        } : null,
        isReserveMet,
      };
      logger.info(`📡 Emitting auction_ended to auction room:`, auctionEventData);
      emitToAuction(auctionId, 'auction_ended', auctionEventData);
      
      // Also broadcast to all users for the auctions page
      logger.info(`📡 Broadcasting auction_ended to all users:`, auctionEventData);
      broadcast('auction_ended', auctionEventData);
      
      logger.info(`✅ Successfully emitted real-time events for auction ${auctionId}`);
    } catch (socketError) {
      logger.error('❌ Failed to emit auction ended event:', socketError);
    }

    logger.info(
      `Auction ended: ${auctionId}, Status: ${updatedAuction.status}`
    );
    return updatedAuction;
  } catch (error) {
    logger.error('End auction error:', error);
    throw error;
  }
};

/**
 * Place a bid on an auction
 */
const placeBid = async (auctionId, bidderId, amount) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status !== 'ACTIVE') {
      throw new Error('Auction is not active');
    }

    if (new Date() > auction.endTime) {
      throw new Error('Auction has ended');
    }

    // Check if bidder is the seller
    if (auction.product.sellerId === bidderId) {
      throw new Error('Sellers cannot bid on their own auctions');
    }

    // Check minimum bid
    if (amount < auction.minimumBid) {
      throw new Error(`Bid must be at least $${auction.minimumBid}`);
    }

    // Check if bid is higher than current highest bid
    const currentHighestBid = auction.bids[0];
    if (currentHighestBid && amount <= currentHighestBid.amount) {
      throw new Error(
        `Bid must be higher than current highest bid of $${currentHighestBid.amount}`
      );
    }

    // Create bid
    const bid = await prisma.bid.create({
      data: {
        auctionId,
        bidderId,
        amount,
        status: 'ACTIVE',
      },
    });

    // Update auction current bid
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        currentBid: amount,
        bidCount: {
          increment: 1,
        },
      },
    });

    logger.info(
      `Bid placed: ${bid.id} for auction: ${auctionId}, amount: $${amount}`
    );
    return bid;
  } catch (error) {
    logger.error('Place bid error:', error);
    throw error;
  }
};

/**
 * Get auction details
 */
const getAuctionDetails = async (auctionId) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                companyName: true,
                country: true,
                verificationStatus: true,
              },
            },
            category: true,
            images: {
              where: { isPrimary: true },
            },
          },
        },
        bids: {
          include: {
            bidder: {
              select: {
                id: true,
                companyName: true,
                country: true,
              },
            },
          },
          orderBy: { amount: 'desc' },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    // Transform the data to match frontend expectations
    const transformedAuction = {
      ...auction,
      startsAt: auction.startTime,
      endsAt: auction.endTime,
      auctionType: auction.auctionType,
      minimumBid: auction.startingPrice,
    };

    return transformedAuction;
  } catch (error) {
    logger.error('Get auction details error:', error);
    throw error;
  }
};

/**
 * Get active auctions
 */
const getActiveAuctions = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      country,
      status = 'ACTIVE',
      sortBy = 'endTime',
      sortOrder = 'asc',
    } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      status: status,
    };

    if (search) {
      where.product = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (category) {
      where.product = {
        ...where.product,
        categoryId: category,
      };
    }

    if (minPrice || maxPrice) {
      where.currentBid = {};
      if (minPrice) where.currentBid.gte = parseFloat(minPrice);
      if (maxPrice) where.currentBid.lte = parseFloat(maxPrice);
    }

    if (country) {
      where.product = {
        ...where.product,
        seller: {
          country,
        },
      };
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  companyName: true,
                  country: true,
                  verificationStatus: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              images: {
                where: { isPrimary: true },
                select: {
                  id: true,
                  imageUrl: true,
                  alt: true,
                },
              },
            },
          },
          _count: {
            select: {
              bids: true,
            },
          },
        },
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      prisma.auction.count({ where }),
    ]);

    // Transform the data to match frontend expectations
    const transformedAuctions = auctions.map(auction => ({
      ...auction,
      startsAt: auction.startTime,
      endsAt: auction.endTime,
      auctionType: auction.auctionType,
      minimumBid: auction.startingPrice,
    }));

    return {
      auctions: transformedAuctions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Get active auctions error:', error);
    throw error;
  }
};

/**
 * Get user's auctions
 */
const getUserAuctions = async (userId, filters = {}) => {
  try {
    const { page = 1, limit = 20, status } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      product: {
        sellerId: userId,
      },
    };

    if (status) {
      where.status = status;
    }

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          product: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              images: {
                where: { isPrimary: true },
                select: {
                  id: true,
                  imageUrl: true,
                  alt: true,
                },
              },
            },
          },
          _count: {
            select: {
              bids: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auction.count({ where }),
    ]);

    // Transform the data to match frontend expectations
    const transformedAuctions = auctions.map(auction => ({
      ...auction,
      startsAt: auction.startTime,
      endsAt: auction.endTime,
      auctionType: auction.auctionType,
      minimumBid: auction.startingPrice,
    }));

    return {
      auctions: transformedAuctions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Get user auctions error:', error);
    throw error;
  }
};

/**
 * Get user's bids
 */
const getUserBids = async (userId, filters = {}) => {
  try {
    const { page = 1, limit = 20, status } = filters;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      bidderId: userId,
    };

    if (status) {
      where.status = status;
    }

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        include: {
          auction: {
            include: {
              product: {
                include: {
                  seller: {
                    select: {
                      id: true,
                      companyName: true,
                      country: true,
                    },
                  },
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  images: {
                    where: { isPrimary: true },
                    select: {
                      id: true,
                      imageUrl: true,
                      alt: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.bid.count({ where }),
    ]);

    // Transform auction data to match frontend expectations
    const transformedBids = bids.map(bid => ({
      ...bid,
      auction: {
        ...bid.auction,
        startsAt: bid.auction.startTime,
        endsAt: bid.auction.endTime,
        auctionType: bid.auction.auctionType,
        minimumBid: bid.auction.startingPrice,
      },
    }));

    return {
      bids: transformedBids,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Get user bids error:', error);
    throw error;
  }
};

/**
 * Check for auctions that need to be started or ended
 */
const processScheduledAuctions = async () => {
  try {
    const now = new Date();

    // Start scheduled auctions
    const scheduledAuctions = await prisma.auction.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: {
          lte: now,
        },
      },
    });

    for (const auction of scheduledAuctions) {
      try {
        await startAuction(auction.id);
      } catch (error) {
        logger.error(`Failed to start auction ${auction.id}:`, error);
      }
    }

    // End active auctions
    const activeAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          lte: now,
        },
      },
    });

    for (const auction of activeAuctions) {
      try {
        await endAuction(auction.id);
      } catch (error) {
        logger.error(`Failed to end auction ${auction.id}:`, error);
      }
    }

    // Emit real-time events for status changes
    if (scheduledAuctions.length > 0 || activeAuctions.length > 0) {
      try {
        broadcast('auction_batch_processed', {
          startedCount: scheduledAuctions.length,
          endedCount: activeAuctions.length,
          timestamp: new Date().toISOString(),
        });
      } catch (socketError) {
        logger.error('Failed to emit auction batch processed event:', socketError);
      }
    }

    logger.info(
      `Processed ${scheduledAuctions.length} scheduled auctions and ${activeAuctions.length} active auctions`
    );

    // Return counts for cron job logging
    return {
      startedCount: scheduledAuctions.length,
      endedCount: activeAuctions.length
    };
  } catch (error) {
    logger.error('Process scheduled auctions error:', error);
    throw error;
  }
};

/**
 * Restart an ended auction
 */
const restartAuction = async (auctionId, sellerId, customStartTime = null, customEndTime = null) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    // Check if user is the seller
    if (auction.product.sellerId !== sellerId) {
      throw new Error('Only the seller can restart this auction');
    }

    // Check if auction is ended
    if (auction.status !== 'ENDED') {
      throw new Error('Only ended auctions can be restarted');
    }

    // Calculate new start and end times
    let newStartTime, newEndTime, newStatus;
    
    if (customStartTime && customEndTime) {
      // Use custom times provided by user
      newStartTime = new Date(customStartTime);
      newEndTime = new Date(customEndTime);
      
      // Validate custom times
      const now = new Date();
      if (newStartTime <= now) {
        throw new Error('Start time must be in the future');
      }
      if (newEndTime <= newStartTime) {
        throw new Error('End time must be after start time');
      }
      
      // If start time is in the future, set status to SCHEDULED
      newStatus = newStartTime > now ? 'SCHEDULED' : 'ACTIVE';
    } else {
      // Use default behavior (immediate restart with original duration)
      const now = new Date();
      const duration = auction.endTime.getTime() - auction.startTime.getTime();
      newStartTime = now;
      newEndTime = new Date(now.getTime() + duration);
      newStatus = 'ACTIVE'; // Immediate restart is always active
    }

    // Update auction with new times and reset status
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: newStatus,
        startTime: newStartTime,
        endTime: newEndTime,
        currentBid: auction.startingPrice, // Reset to starting price
        bidCount: 0, // Reset bid count
        winnerId: null, // Clear winner
      },
    });

    // Update product status to ACTIVE
    await prisma.product.update({
      where: { id: auction.productId },
      data: { status: 'ACTIVE' },
    });

    // Clear all previous bids
    await prisma.bid.deleteMany({
      where: { auctionId: auctionId },
    });

    // Send notification to seller
    try {
      await sendAuctionNotification(
        auction.product.seller.email,
        updatedAuction,
        'RESTARTED'
      );
    } catch (emailError) {
      logger.error('Failed to send auction restarted email:', emailError);
    }

    // Emit real-time event for auction restart
    try {
      const eventData = {
        auctionId,
        status: newStatus,
        startTime: newStartTime,
        endTime: newEndTime,
        product: {
          id: auction.productId,
          title: auction.product.title,
          sellerId: auction.product.sellerId,
        },
        type: 'RESTARTED'
      };
      
      logger.info(`📡 Broadcasting auction_restarted event:`, eventData);
      broadcast('auction_restarted', eventData);
      
      // Emit to auction room
      const auctionEventData = {
        auctionId,
        status: newStatus,
        startTime: newStartTime,
        endTime: newEndTime,
        currentBid: auction.startingPrice,
        bidCount: 0,
      };
      logger.info(`📡 Emitting auction_restarted to auction room:`, auctionEventData);
      emitToAuction(auctionId, 'auction_restarted', auctionEventData);
      
      logger.info(`✅ Successfully emitted real-time events for auction restart ${auctionId}`);
    } catch (socketError) {
      logger.error('❌ Failed to emit auction restarted event:', socketError);
    }

    logger.info(
      `Auction restarted: ${auctionId}, Status: ${updatedAuction.status}`
    );
    return updatedAuction;
  } catch (error) {
    logger.error('Restart auction error:', error);
    throw error;
  }
};

/**
 * Send auction ending soon notifications
 */
const sendEndingSoonNotifications = async () => {
  try {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Find auctions ending in the next hour
    const endingSoonAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          gte: oneHourFromNow,
          lte: twoHoursFromNow,
        },
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
        bids: {
          include: {
            bidder: true,
          },
        },
      },
    });

    for (const auction of endingSoonAuctions) {
      // Send notification to all bidders
      const uniqueBidders = [
        ...new Set(auction.bids.map((bid) => bid.bidder.email)),
      ];

      for (const email of uniqueBidders) {
        try {
          await sendAuctionNotification(email, auction, 'ENDING_SOON');
        } catch (emailError) {
          logger.error(
            `Failed to send ending soon notification to ${email}:`,
            emailError
          );
        }
      }
    }

    logger.info(
      `Sent ending soon notifications for ${endingSoonAuctions.length} auctions`
    );
  } catch (error) {
    logger.error('Send ending soon notifications error:', error);
    throw error;
  }
};

module.exports = {
  startAuction,
  endAuction,
  placeBid,
  getAuctionDetails,
  getActiveAuctions,
  getUserAuctions,
  getUserBids,
  processScheduledAuctions,
  sendEndingSoonNotifications,
  restartAuction,
};
