const cron = require('node-cron');
const {
  processScheduledAuctions,
  sendEndingSoonNotifications,
} = require('../services/auctionService');
const { logger } = require('../utils/logger');

const processAuctionsJob = cron.schedule(
  '* * * * *',
  async () => {
    try {
      logger.info('Running auction processing job...');
      await processScheduledAuctions();
      logger.info('Auction processing job completed');
    } catch (error) {
      logger.error('Auction processing job failed:', error);
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
