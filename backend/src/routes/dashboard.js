const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user's products (for sellers) or all products (for buyers)
    const userProducts = await prisma.product.findMany({
      where: userRole === 'SELLER' ? { sellerId: userId } : {},
      include: {
        category: {
          select: { name: true }
        },
        seller: {
          select: { companyName: true }
        },
        _count: {
          select: { watchlistItems: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get user's bids
    const userBids = await prisma.bid.findMany({
      where: { bidderId: userId },
      include: {
        auction: {
          include: {
            product: {
              select: { title: true, id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get user's conversations
    const userConversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: {
        buyer: {
          select: { companyName: true, email: true }
        },
        seller: {
          select: { companyName: true, email: true }
        },
        product: {
          select: { title: true, id: true }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Get user's watchlist
    const userWatchlist = await prisma.watchlistItem.findMany({
      where: { userId: userId },
      include: {
        product: {
          select: { title: true, id: true, basePrice: true, currency: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate stats
    const totalProducts = userRole === 'SELLER' 
      ? await prisma.product.count({ where: { sellerId: userId, status: 'ACTIVE' } })
      : await prisma.product.count({ where: { status: 'ACTIVE' } });

    const activeAuctions = await prisma.auction.count({
      where: {
        status: 'ACTIVE',
        ...(userRole === 'SELLER' ? { product: { sellerId: userId } } : {})
      }
    });

    const totalConversations = await prisma.conversation.count({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ],
        messages: {
          some: {} // Only count conversations that have at least one message
        }
      }
    });

    const watchlistItems = await prisma.watchlistItem.count({
      where: { userId: userId }
    });

    // Get unread messages for recent activities
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversation: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        },
        readAt: null, // Unread messages have null readAt
        senderId: { not: userId } // Exclude messages sent by the current user
      },
      include: {
        conversation: {
          include: {
            buyer: { select: { companyName: true, email: true } },
            seller: { select: { companyName: true, email: true } },
            product: { select: { title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent auction bids (for buyers) or bids on user's auctions (for sellers)
    const recentBids = await prisma.bid.findMany({
      where: userRole === 'SELLER' 
        ? {
            auction: {
              product: { sellerId: userId }
            }
          }
        : {
            bidderId: userId
          },
      include: {
        auction: {
          include: {
            product: { select: { title: true } }
          }
        },
        bidder: { select: { companyName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get user's most recent bid
    const lastBid = await prisma.bid.findFirst({
      where: {
        bidderId: userId
      },
      include: {
        auction: {
          include: {
            product: { select: { title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Prepare recent activities - only unread messages and auction bids
    const recentActivities = [];

    // Add unread messages
    unreadMessages.forEach(message => {
      const otherUser = message.conversation.buyerId === userId 
        ? message.conversation.seller 
        : message.conversation.buyer;
      
      recentActivities.push({
        id: `message-${message.id}`,
        type: 'message',
        title: 'Unread Message',
        description: `From ${otherUser?.companyName || otherUser?.email}`,
        time: message.createdAt,
        icon: 'message',
        data: message
      });
    });

    // Add recent auction bids
    recentBids.forEach(bid => {
      const isUserBid = bid.bidderId === userId;
      recentActivities.push({
        id: `bid-${bid.id}`,
        type: 'bid',
        title: isUserBid ? 'Your Bid' : 'New Bid on Your Auction',
        description: isUserBid 
          ? `${bid.auction?.product?.title || 'Auction'} - $${bid.amount}`
          : `${bid.bidder?.companyName || bid.bidder?.email} bid $${bid.amount}`,
        time: bid.createdAt,
        icon: 'gavel',
        data: bid
      });
    });

    // Add user's last bid
    if (lastBid) {
      recentActivities.push({
        id: `last-bid-${lastBid.id}`,
        type: 'last_bid',
        title: 'Your Last Bid',
        description: `${lastBid.auction?.product?.title || 'Auction'} - $${lastBid.amount}`,
        time: lastBid.createdAt,
        icon: 'gavel',
        data: lastBid
      });
    }

    // Sort activities by time (most recent first)
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

    const dashboardData = {
      stats: {
        totalProducts,
        activeAuctions,
        totalMessages: totalConversations,
        watchlistItems
      },
      recentProducts: userProducts.slice(0, 5),
      recentBids: userBids.slice(0, 5),
      recentConversations: userConversations.slice(0, 5),
      recentActivities: recentActivities.slice(0, 8),
      watchlistItems: userWatchlist.slice(0, 5)
    };

    logger.info(`Dashboard data fetched for user ${userId}`, {
      userId,
      userRole,
      stats: dashboardData.stats,
      activitiesCount: recentActivities.length
    });

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

module.exports = router;
