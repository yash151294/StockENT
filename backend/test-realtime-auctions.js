const { PrismaClient } = require('@prisma/client');
const { processScheduledAuctions } = require('./src/services/auctionService');
const { logger } = require('./src/utils/logger');

const prisma = new PrismaClient();

async function testRealtimeAuctions() {
  try {
    console.log('🧪 Testing real-time auction functionality...');
    
    // Get current auction counts by status
    const [scheduledCount, activeCount, endedCount] = await Promise.all([
      prisma.auction.count({ where: { status: 'SCHEDULED' } }),
      prisma.auction.count({ where: { status: 'ACTIVE' } }),
      prisma.auction.count({ where: { status: 'ENDED' } })
    ]);

    console.log('📊 Current auction status counts:');
    console.log(`  - Scheduled: ${scheduledCount}`);
    console.log(`  - Active: ${activeCount}`);
    console.log(`  - Ended: ${endedCount}`);

    // Get auctions that should be processed
    const now = new Date();
    const scheduledToStart = await prisma.auction.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: { lte: now }
      },
      include: { product: true }
    });

    const activeToEnd = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: { lte: now }
      },
      include: { product: true }
    });

    console.log(`\n🔄 Auctions ready for processing:`);
    console.log(`  - Scheduled to start: ${scheduledToStart.length}`);
    console.log(`  - Active to end: ${activeToEnd.length}`);

    if (scheduledToStart.length > 0) {
      console.log('\n📋 Scheduled auctions ready to start:');
      scheduledToStart.forEach(auction => {
        console.log(`  - ${auction.product.title} (ID: ${auction.id})`);
      });
    }

    if (activeToEnd.length > 0) {
      console.log('\n📋 Active auctions ready to end:');
      activeToEnd.forEach(auction => {
        console.log(`  - ${auction.product.title} (ID: ${auction.id})`);
      });
    }

    // Process auctions (this will emit real-time events)
    if (scheduledToStart.length > 0 || activeToEnd.length > 0) {
      console.log('\n⚡ Processing auctions (this will emit real-time events)...');
      await processScheduledAuctions();
      console.log('✅ Auction processing completed!');
    } else {
      console.log('\n✅ No auctions need processing at this time.');
      
      // Create a test auction to demonstrate real-time functionality
      console.log('\n🧪 Creating test auction for demonstration...');
      try {
        // Find a product to create auction for
        const testProduct = await prisma.product.findFirst({
          where: { status: 'ACTIVE' },
          include: { seller: true }
        });

        if (testProduct) {
          const now = new Date();
          const testAuction = await prisma.auction.create({
            data: {
              productId: testProduct.id,
              startingPrice: 100,
              reservePrice: 150,
              bidIncrement: 10,
              startTime: new Date(now.getTime() + 1000), // Start in 1 second
              endTime: new Date(now.getTime() + 60000), // End in 1 minute
              status: 'SCHEDULED'
            }
          });

          console.log(`✅ Created test auction: ${testAuction.id}`);
          console.log('⏰ Test auction will start in 1 second and end in 1 minute');
          console.log('💡 Watch your frontend to see the real-time updates!');
        } else {
          console.log('❌ No products available to create test auction');
        }
      } catch (error) {
        console.log('❌ Failed to create test auction:', error.message);
      }
    }

    // Get updated counts
    const [newScheduledCount, newActiveCount, newEndedCount] = await Promise.all([
      prisma.auction.count({ where: { status: 'SCHEDULED' } }),
      prisma.auction.count({ where: { status: 'ACTIVE' } }),
      prisma.auction.count({ where: { status: 'ENDED' } })
    ]);

    console.log('\n📊 Updated auction status counts:');
    console.log(`  - Scheduled: ${newScheduledCount} (${newScheduledCount - scheduledCount >= 0 ? '+' : ''}${newScheduledCount - scheduledCount})`);
    console.log(`  - Active: ${newActiveCount} (${newActiveCount - activeCount >= 0 ? '+' : ''}${newActiveCount - activeCount})`);
    console.log(`  - Ended: ${newEndedCount} (${newEndedCount - endedCount >= 0 ? '+' : ''}${newEndedCount - endedCount})`);

    console.log('\n🎉 Real-time auction test completed!');
    console.log('💡 Check your frontend to see if the auction lists updated automatically.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRealtimeAuctions();
