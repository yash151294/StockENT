const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const { sendAuctionNotification } = require('./emailService');

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

    return auction;
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

    return {
      auctions,
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

    return {
      bids,
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

    logger.info(
      `Processed ${scheduledAuctions.length} scheduled auctions and ${activeAuctions.length} active auctions`
    );
  } catch (error) {
    logger.error('Process scheduled auctions error:', error);
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
};
