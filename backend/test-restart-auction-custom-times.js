const { PrismaClient } = require('@prisma/client');
const { restartAuction } = require('./src/services/auctionService');

const prisma = new PrismaClient();

async function testRestartAuctionWithCustomTimes() {
  try {
    console.log('🧪 Testing Restart Auction with Custom Times...\n');

    // Find an ended auction
    const endedAuction = await prisma.auction.findFirst({
      where: {
        status: 'ENDED'
      },
      include: {
        product: {
          include: {
            seller: true
          }
        }
      }
    });

    if (!endedAuction) {
      console.log('❌ No ended auctions found. Please create an ended auction first.');
      return;
    }

    console.log('✅ Found ended auction:', endedAuction.id);
    console.log('📊 Auction details:');
    console.log('   - Product:', endedAuction.product.title);
    console.log('   - Seller:', endedAuction.product.seller.companyName);
    console.log('   - Status:', endedAuction.status);
    console.log('   - Original Start Time:', endedAuction.startTime);
    console.log('   - Original End Time:', endedAuction.endTime);
    console.log('   - Current Bid:', endedAuction.currentBid);

    // Test restart with custom times
    console.log('\n🔄 Testing restart auction with custom times...');
    
    const customStartTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    const customEndTime = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now
    
    console.log('📅 Custom times:');
    console.log('   - Start Time:', customStartTime.toISOString());
    console.log('   - End Time:', customEndTime.toISOString());
    
    try {
      const restartedAuction = await restartAuction(
        endedAuction.id, 
        endedAuction.product.sellerId,
        customStartTime.toISOString(),
        customEndTime.toISOString()
      );
      
      console.log('✅ Auction restarted successfully with custom times!');
      console.log('📊 Restarted auction details:');
      console.log('   - New Status:', restartedAuction.status);
      console.log('   - New Start Time:', restartedAuction.startTime);
      console.log('   - New End Time:', restartedAuction.endTime);
      console.log('   - Reset Current Bid:', restartedAuction.currentBid);
      console.log('   - Reset Bid Count:', restartedAuction.bidCount);
      
      // Verify the status is correct based on start time
      const now = new Date();
      const startTime = new Date(restartedAuction.startTime);
      const expectedStatus = startTime > now ? 'SCHEDULED' : 'ACTIVE';
      console.log('   - Expected Status:', expectedStatus);
      console.log('   - Status Correct:', restartedAuction.status === expectedStatus ? '✅' : '❌');

      // Verify the product status was updated
      const updatedProduct = await prisma.product.findUnique({
        where: { id: endedAuction.productId }
      });
      
      console.log('📊 Product status after restart:', updatedProduct.status);

      // Check if bids were cleared
      const remainingBids = await prisma.bid.count({
        where: { auctionId: endedAuction.id }
      });
      
      console.log('📊 Remaining bids after restart:', remainingBids);

      // Test validation - try to restart with invalid times
      console.log('\n🧪 Testing validation with invalid times...');
      
      try {
        // Try with start time in the past
        await restartAuction(
          endedAuction.id, 
          endedAuction.product.sellerId,
          new Date(Date.now() - 1000).toISOString(), // 1 second ago
          customEndTime.toISOString()
        );
        console.log('❌ Should have failed with past start time');
      } catch (error) {
        console.log('✅ Correctly rejected past start time:', error.message);
      }

      try {
        // Try with end time before start time
        await restartAuction(
          endedAuction.id, 
          endedAuction.product.sellerId,
          customStartTime.toISOString(),
          new Date(customStartTime.getTime() - 1000).toISOString() // 1 second before start
        );
        console.log('❌ Should have failed with end before start');
      } catch (error) {
        console.log('✅ Correctly rejected end time before start time:', error.message);
      }

    } catch (error) {
      console.error('❌ Error restarting auction:', error.message);
    }

    // Test default restart (immediate)
    console.log('\n🔄 Testing default restart (immediate)...');
    
    try {
      const immediateRestart = await restartAuction(endedAuction.id, endedAuction.product.sellerId);
      console.log('✅ Immediate restart successful!');
      console.log('📊 Immediate restart details:');
      console.log('   - Status:', immediateRestart.status);
      console.log('   - Start Time:', immediateRestart.startTime);
      console.log('   - End Time:', immediateRestart.endTime);
      console.log('   - Status Correct (should be ACTIVE):', immediateRestart.status === 'ACTIVE' ? '✅' : '❌');
    } catch (error) {
      console.error('❌ Error with immediate restart:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRestartAuctionWithCustomTimes();
