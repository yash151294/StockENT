const { PrismaClient } = require('@prisma/client');
const { processScheduledAuctions } = require('./src/services/auctionService');
const { logger } = require('./src/utils/logger');

const prisma = new PrismaClient();

async function manualActivateAuctions() {
  try {
    console.log('🔄 Starting manual auction activation...');
    
    // Get all scheduled auctions that should be active now
    const now = new Date();
    const scheduledAuctions = await prisma.auction.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: {
          lte: now,
        },
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    console.log(`📋 Found ${scheduledAuctions.length} scheduled auctions to activate`);

    if (scheduledAuctions.length === 0) {
      console.log('✅ No auctions need activation at this time');
      return;
    }

    // Process each scheduled auction
    for (const auction of scheduledAuctions) {
      try {
        console.log(`🎯 Activating auction: ${auction.id} (${auction.product.title})`);
        
        // Update auction status to ACTIVE
        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            status: 'ACTIVE',
            startTime: new Date(), // Update start time to now
          },
        });

        // Update product status
        await prisma.product.update({
          where: { id: auction.productId },
          data: { status: 'ACTIVE' },
        });

        console.log(`✅ Successfully activated auction: ${auction.id}`);
      } catch (error) {
        console.error(`❌ Failed to activate auction ${auction.id}:`, error.message);
      }
    }

    console.log('🎉 Manual auction activation completed!');
  } catch (error) {
    console.error('❌ Manual auction activation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
manualActivateAuctions();
