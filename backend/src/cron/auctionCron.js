const cron = require('node-cron');
const {
  processScheduledAuctions,
  sendEndingSoonNotifications,
} = require('../services/auctionService');
const { logger } = require('../utils/logger');

// Auction processing job runs every 5 seconds for real-time responsiveness
// Ending soon notifications run every 30 minutes

const processAuctionsJob = cron.schedule(
  '*/5 * * * * *',
  async () => {
    try {
      logger.info('🔄 Running auction processing job (every 5 seconds)...');
      const result = await processScheduledAuctions();
      logger.info('✅ Auction processing job completed');
      
      // Log if any auctions were processed
      if (result && (result.startedCount > 0 || result.endedCount > 0)) {
        logger.info(`📊 Processed ${result.startedCount} started and ${result.endedCount} ended auctions`);
      }
    } catch (error) {
      logger.error('❌ Auction processing job failed:', error);
    }
  },
  { scheduled: false }
);

const endingSoonJob = cron.schedule(
  '*/30 * * * *',
  async () => {
    try {
      logger.info('Running ending soon notifications job...');
      await sendEndingSoonNotifications();
      logger.info('Ending soon notifications job completed');
    } catch (error) {
      logger.error('Ending soon notifications job failed:', error);
    }
  },
  { scheduled: false }
);

const startCronJobs = () => {
  processAuctionsJob.start();
  endingSoonJob.start();
  logger.info('Cron jobs started');
};

const stopCronJobs = () => {
  processAuctionsJob.stop();
  endingSoonJob.stop();
  logger.info('Cron jobs stopped');
};

module.exports = { startCronJobs, stopCronJobs };
