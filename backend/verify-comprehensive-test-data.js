const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTestData() {
  try {
    console.log('🔍 Verifying StockENT Comprehensive Test Data...\n');
    
    // Users by role
    console.log('👥 USERS BY ROLE:');
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    
    usersByRole.forEach(group => {
      console.log(`  ${group.role}: ${group._count.role} users`);
    });
    
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        companyName: true,
        contactPerson: true,
        country: true
      },
      orderBy: { role: 'asc' }
    });
    
    console.log('\n📋 ALL USERS:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}): ${user.companyName} - ${user.contactPerson} (${user.country})`);
    });
    
    // Categories
    console.log('\n📂 CATEGORIES:');
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        level: true,
        path: true,
        description: true
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    });
    
    categories.forEach(category => {
      const indent = '  '.repeat(category.level);
      console.log(`${indent}- ${category.name} (Level ${category.level})`);
      console.log(`${indent}  Path: ${category.path}`);
      if (category.description) {
        console.log(`${indent}  Description: ${category.description}`);
      }
    });
    
    // Products by seller
    console.log('\n🛍️ PRODUCTS BY SELLER:');
    const productsBySeller = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        basePrice: true,
        currency: true,
        listingType: true,
        status: true,
        tags: true,
        seller: {
          select: {
            email: true,
            companyName: true,
            country: true
          }
        },
        category: {
          select: {
            name: true,
            path: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const sellerGroups = {};
    productsBySeller.forEach(product => {
      const sellerKey = `${product.seller.companyName} (${product.seller.country})`;
      if (!sellerGroups[sellerKey]) {
        sellerGroups[sellerKey] = [];
      }
      sellerGroups[sellerKey].push(product);
    });
    
    Object.entries(sellerGroups).forEach(([seller, products]) => {
      console.log(`\n  📦 ${seller}:`);
      products.forEach(product => {
        console.log(`    - ${product.title}`);
        console.log(`      Price: ${product.basePrice} ${product.currency} (${product.listingType})`);
        console.log(`      Category: ${product.category.name} (${product.category.path})`);
        console.log(`      Status: ${product.status}`);
        if (product.tags.length > 0) {
          console.log(`      Tags: ${product.tags.join(', ')}`);
        }
      });
    });
    
    // Auctions
    console.log('\n🎯 AUCTIONS:');
    const auctions = await prisma.auction.findMany({
      select: {
        id: true,
        auctionType: true,
        startingPrice: true,
        reservePrice: true,
        currentBid: true,
        bidCount: true,
        status: true,
        startTime: true,
        endTime: true,
        product: {
          select: {
            title: true,
            seller: {
              select: {
                companyName: true
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    
    auctions.forEach(auction => {
      console.log(`  🎯 ${auction.product.title} (${auction.product.seller.companyName})`);
      console.log(`    Type: ${auction.auctionType} | Status: ${auction.status}`);
      console.log(`    Price: $${auction.startingPrice} → $${auction.currentBid || 'No bids'} (Reserve: $${auction.reservePrice})`);
      console.log(`    Bids: ${auction.bidCount} total`);
      console.log(`    Time: ${auction.startTime.toISOString()} → ${auction.endTime.toISOString()}`);
    });
    
    // Bids
    console.log('\n💰 BIDS:');
    const bids = await prisma.bid.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        isAutomatic: true,
        createdAt: true,
        bidder: {
          select: {
            companyName: true,
            email: true
          }
        },
        auction: {
          select: {
            product: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    bids.forEach(bid => {
      console.log(`  💰 ${bid.bidder.companyName} - $${bid.amount} (${bid.status})`);
      console.log(`    Product: ${bid.auction.product.title}`);
      console.log(`    Automatic: ${bid.isAutomatic ? 'Yes' : 'No'} | Time: ${bid.createdAt.toISOString()}`);
    });
    
    // Conversations
    console.log('\n💬 CONVERSATIONS:');
    const conversations = await prisma.conversation.findMany({
      select: {
        id: true,
        buyerAlias: true,
        sellerAlias: true,
        status: true,
        createdAt: true,
        product: {
          select: {
            title: true
          }
        },
        buyer: {
          select: {
            companyName: true,
            country: true
          }
        },
        seller: {
          select: {
            companyName: true,
            country: true
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    
    conversations.forEach(conversation => {
      console.log(`  💬 ${conversation.buyer.companyName} (${conversation.buyer.country}) ↔ ${conversation.seller.companyName} (${conversation.seller.country})`);
      console.log(`    Product: ${conversation.product.title}`);
      console.log(`    Status: ${conversation.status}`);
      console.log(`    Started: ${conversation.createdAt.toISOString()}`);
    });
    
    // Sample Messages
    console.log('\n📨 SAMPLE MESSAGES:');
    const sampleMessages = await prisma.message.findMany({
      select: {
        content: true,
        createdAt: true,
        sender: {
          select: {
            companyName: true,
            role: true
          }
        },
        receiver: {
          select: {
            companyName: true,
            role: true
          }
        },
        conversation: {
          select: {
            product: {
              select: {
                title: true
              }
            }
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    sampleMessages.forEach(message => {
      const senderRole = message.sender.role;
      const receiverRole = message.receiver.role;
      console.log(`  📨 ${message.sender.companyName} (${senderRole}) → ${message.receiver.companyName} (${receiverRole})`);
      console.log(`    Product: ${message.conversation.product.title}`);
      console.log(`    Message: "${message.content.substring(0, 80)}${message.content.length > 80 ? '...' : ''}"`);
      console.log(`    Time: ${message.createdAt.toISOString()}`);
    });
    
    // Watchlist Items
    console.log('\n👀 WATCHLIST ITEMS:');
    const watchlistItems = await prisma.watchlistItem.findMany({
      select: {
        createdAt: true,
        user: {
          select: {
            companyName: true,
            email: true
          }
        },
        product: {
          select: {
            title: true,
            seller: {
              select: {
                companyName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const watchlistByUser = {};
    watchlistItems.forEach(item => {
      const userKey = item.user.companyName;
      if (!watchlistByUser[userKey]) {
        watchlistByUser[userKey] = [];
      }
      watchlistByUser[userKey].push(item);
    });
    
    Object.entries(watchlistByUser).forEach(([user, items]) => {
      console.log(`  👀 ${user} (${items.length} items):`);
      items.forEach(item => {
        console.log(`    - ${item.product.title} (by ${item.product.seller.companyName})`);
      });
    });
    
    // Sample Requests
    console.log('\n📦 SAMPLE REQUESTS:');
    const sampleRequests = await prisma.sampleRequest.findMany({
      select: {
        quantityRequested: true,
        status: true,
        sampleCost: true,
        shippingCost: true,
        trackingNumber: true,
        createdAt: true,
        buyer: {
          select: {
            companyName: true
          }
        },
        seller: {
          select: {
            companyName: true
          }
        },
        product: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    sampleRequests.forEach(request => {
      console.log(`  📦 ${request.buyer.companyName} → ${request.seller.companyName}`);
      console.log(`    Product: ${request.product.title}`);
      console.log(`    Quantity: ${request.quantityRequested} | Status: ${request.status}`);
      console.log(`    Costs: Sample $${request.sampleCost}, Shipping $${request.shippingCost}`);
      if (request.trackingNumber) {
        console.log(`    Tracking: ${request.trackingNumber}`);
      }
      console.log(`    Requested: ${request.createdAt.toISOString()}`);
    });
    
    // Final Statistics
    console.log('\n📊 FINAL STATISTICS:');
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.auction.count(),
      prisma.bid.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.watchlistItem.count(),
      prisma.sampleRequest.count()
    ]);
    
    console.log(`👥 Users: ${stats[0]}`);
    console.log(`📂 Categories: ${stats[1]}`);
    console.log(`🛍️  Products: ${stats[2]}`);
    console.log(`🎯 Auctions: ${stats[3]}`);
    console.log(`💰 Bids: ${stats[4]}`);
    console.log(`💬 Conversations: ${stats[5]}`);
    console.log(`📨 Messages: ${stats[6]}`);
    console.log(`👀 Watchlist Items: ${stats[7]}`);
    console.log(`📦 Sample Requests: ${stats[8]}`);
    
    console.log('\n✅ Test data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test data verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyTestData()
  .then(() => {
    console.log('\n🎉 Verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
