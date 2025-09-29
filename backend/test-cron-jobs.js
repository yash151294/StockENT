const { processScheduledAuctions } = require('./src/services/auctionService');
const { logger } = require('./src/utils/logger');

async function testCronJobs() {
  try {
    console.log('🧪 Testing cron job functionality...');
    
    // Manually run the auction processing
    console.log('🔄 Running processScheduledAuctions manually...');
    const result = await processScheduledAuctions();
    
    console.log('📊 Result:', result);
    
    if (result.startedCount > 0 || result.endedCount > 0) {
      console.log(`✅ Processed ${result.startedCount} started and ${result.endedCount} ended auctions`);
      console.log('💡 Check your frontend console for real-time events!');
    } else {
      console.log('ℹ️ No auctions needed processing at this time');
      console.log('💡 This is normal if no auctions are ready for status changes');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCronJobs();
