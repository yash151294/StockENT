const { PrismaClient } = require('@prisma/client');
const { broadcast, emitToAuction } = require('./src/utils/socket');
const { logger } = require('./src/utils/logger');

const prisma = new PrismaClient();

async function manualTriggerAuctionEvents() {
  try {
    console.log('🧪 Manual trigger for auction events...');
    
    // Get a scheduled auction to start
    const scheduledAuction = await prisma.auction.findFirst({
      where: { status: 'SCHEDULED' },
      include: { product: true }
    });

    if (scheduledAuction) {
      console.log(`📋 Found scheduled auction: ${scheduledAuction.id} (${scheduledAuction.product.title})`);
      
      // Manually emit the events
      const eventData = {
        auctionId: scheduledAuction.id,
        status: 'ACTIVE',
        startTime: new Date(),
        product: {
          id: scheduledAuction.productId,
          title: scheduledAuction.product.title,
          sellerId: scheduledAuction.product.sellerId,
        },
        type: 'STARTED'
      };
      
      console.log('📡 Broadcasting auction_status_changed event...');
      broadcast('auction_status_changed', eventData);
      
      console.log('📡 Emitting auction_started to auction room...');
      emitToAuction(scheduledAuction.id, 'auction_started', {
        auctionId: scheduledAuction.id,
        status: 'ACTIVE',
        startTime: new Date(),
      });
      
      console.log('✅ Events emitted successfully!');
    } else {
      console.log('❌ No scheduled auctions found');
      
      // Create a test auction and emit events
      const testProduct = await prisma.product.findFirst({
        where: { status: 'ACTIVE' }
      });
      
      if (testProduct) {
        console.log('🧪 Creating test auction...');
        const testAuction = await prisma.auction.create({
          data: {
            productId: testProduct.id,
            startingPrice: 100,
            reservePrice: 150,
            bidIncrement: 10,
            startTime: new Date(Date.now() + 1000), // Start in 1 second
            endTime: new Date(Date.now() + 60000), // End in 1 minute
            status: 'SCHEDULED'
          }
        });
        
        console.log(`✅ Created test auction: ${testAuction.id}`);
        console.log('⏰ Test auction will start in 1 second');
        
        // Wait 2 seconds then emit events
        setTimeout(async () => {
          const eventData = {
            auctionId: testAuction.id,
            status: 'ACTIVE',
            startTime: new Date(),
            product: {
              id: testAuction.productId,
              title: testProduct.title,
              sellerId: testProduct.sellerId,
            },
            type: 'STARTED'
          };
          
          console.log('📡 Broadcasting auction_status_changed event...');
          broadcast('auction_status_changed', eventData);
          
          console.log('📡 Emitting auction_started to auction room...');
          emitToAuction(testAuction.id, 'auction_started', {
            auctionId: testAuction.id,
            status: 'ACTIVE',
            startTime: new Date(),
          });
          
          console.log('✅ Test events emitted successfully!');
        }, 2000);
      } else {
        console.log('❌ No products available to create test auction');
      }
    }
    
  } catch (error) {
    console.error('❌ Manual trigger failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the manual trigger
manualTriggerAuctionEvents();
