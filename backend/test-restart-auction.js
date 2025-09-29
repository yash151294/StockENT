const { PrismaClient } = require('@prisma/client');
const { restartAuction } = require('./src/services/auctionService');

const prisma = new PrismaClient();

async function testRestartAuction() {
  try {
    console.log('🧪 Testing Restart Auction Functionality...\n');

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
      console.log('❌ No ended auctions found. Creating a test auction...');
      
      // Create a test product and auction
      const testProduct = await prisma.product.create({
        data: {
          sellerId: 'test-seller-id', // You'll need to replace with actual seller ID
          categoryId: 'test-category-id', // You'll need to replace with actual category ID
          title: 'Test Auction Product',
          description: 'Test product for auction restart testing',
          quantityAvailable: 100,
          unit: 'kg',
          minOrderQuantity: 10,
          basePrice: 50.00,
          currency: 'USD',
          location: 'Test Location',
          country: 'US',
          status: 'ACTIVE',
          listingType: 'AUCTION'
        }
      });

      const testAuction = await prisma.auction.create({
        data: {
          productId: testProduct.id,
          auctionType: 'ENGLISH',
          startingPrice: 50.00,
          reservePrice: 45.00,
          currentBid: 50.00,
          bidIncrement: 5.00,
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
          endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ended 1 day ago
          status: 'ENDED'
        }
      });

      console.log('✅ Test auction created:', testAuction.id);
      console.log('📝 Note: You need to update the sellerId and categoryId with actual values');
      return;
    }

    console.log('✅ Found ended auction:', endedAuction.id);
    console.log('📊 Auction details:');
    console.log('   - Product:', endedAuction.product.title);
    console.log('   - Seller:', endedAuction.product.seller.companyName);
    console.log('   - Status:', endedAuction.status);
    console.log('   - End Time:', endedAuction.endTime);
    console.log('   - Current Bid:', endedAuction.currentBid);

    // Test restart functionality
    console.log('\n🔄 Testing restart auction...');
    
    try {
      const restartedAuction = await restartAuction(endedAuction.id, endedAuction.product.sellerId);
      
      console.log('✅ Auction restarted successfully!');
      console.log('📊 Restarted auction details:');
      console.log('   - New Status:', restartedAuction.status);
      console.log('   - New Start Time:', restartedAuction.startTime);
      console.log('   - New End Time:', restartedAuction.endTime);
      console.log('   - Reset Current Bid:', restartedAuction.currentBid);
      console.log('   - Reset Bid Count:', restartedAuction.bidCount);

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

    } catch (error) {
      console.error('❌ Error restarting auction:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRestartAuction();
