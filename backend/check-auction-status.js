const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuctionStatus() {
  try {
    console.log('🔍 Checking auction status...\n');

    // Get all auctions with their details
    const auctions = await prisma.auction.findMany({
      include: {
        product: {
          select: {
            title: true,
            seller: {
              select: {
                companyName: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total auctions found: ${auctions.length}\n`);

    if (auctions.length === 0) {
      console.log('❌ No auctions found in the system');
      return;
    }

    // Group by status
    const statusGroups = {
      SCHEDULED: [],
      ACTIVE: [],
      ENDED: [],
      CANCELLED: [],
    };

    auctions.forEach(auction => {
      if (statusGroups[auction.status]) {
        statusGroups[auction.status].push(auction);
      }
    });

    // Display results
    Object.entries(statusGroups).forEach(([status, statusAuctions]) => {
      if (statusAuctions.length > 0) {
        console.log(`\n📋 ${status} AUCTIONS (${statusAuctions.length}):`);
        console.log('─'.repeat(60));
        
        statusAuctions.forEach(auction => {
          const now = new Date();
          const startTime = new Date(auction.startTime);
          const endTime = new Date(auction.endTime);
          
          console.log(`🎯 ID: ${auction.id}`);
          console.log(`   Product: ${auction.product.title}`);
          console.log(`   Seller: ${auction.product.seller.companyName}`);
          console.log(`   Start Time: ${startTime.toLocaleString()}`);
          console.log(`   End Time: ${endTime.toLocaleString()}`);
          console.log(`   Current Time: ${now.toLocaleString()}`);
          console.log(`   Should be Active: ${startTime <= now && endTime > now ? 'YES' : 'NO'}`);
          console.log(`   Bids: ${auction._count.bids}`);
          console.log(`   Starting Price: $${auction.startingPrice}`);
          console.log(`   Current Bid: $${auction.currentBid || 'None'}`);
          console.log('');
        });
      }
    });

    // Check for auctions that should be active but aren't
    const now = new Date();
    const shouldBeActive = auctions.filter(auction => {
      const startTime = new Date(auction.startTime);
      const endTime = new Date(auction.endTime);
      return auction.status === 'SCHEDULED' && startTime <= now && endTime > now;
    });

    if (shouldBeActive.length > 0) {
      console.log('\n⚠️  AUCTIONS THAT SHOULD BE ACTIVE BUT AREN\'T:');
      console.log('─'.repeat(60));
      shouldBeActive.forEach(auction => {
        console.log(`🎯 ${auction.product.title} (${auction.id})`);
        console.log(`   Started: ${new Date(auction.startTime).toLocaleString()}`);
        console.log(`   Current Status: ${auction.status}`);
        console.log('');
      });
      
      console.log('💡 Run "node manual-activate-auctions.js" to activate these auctions');
    } else {
      console.log('\n✅ All auctions have correct status');
    }

  } catch (error) {
    console.error('❌ Error checking auction status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAuctionStatus();
