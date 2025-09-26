const { startCronJobs, stopCronJobs } = require('./auctionCron');
const { startCleanupJobs, stopCleanupJobs } = require('./cleanupCron');
const { startDailyResetJobs, stopDailyResetJobs } = require('./dailyResetCron');
const { logger } = require('../utils/logger');

const startAllCronJobs = () => {
  try {
    startCronJobs();
    startCleanupJobs();
    startDailyResetJobs();
    logger.info('All cron jobs started successfully');
  } catch (error) {
    logger.error('Failed to start cron jobs:', error);
  }
};

const stopAllCronJobs = () => {
  try {
    stopCronJobs();
    stopCleanupJobs();
    stopDailyResetJobs();
    logger.info('All cron jobs stopped successfully');
  } catch (error) {
    logger.error('Failed to stop cron jobs:', error);
  }
};

const gracefulShutdown = () => {
  logger.info('Received shutdown signal, stopping cron jobs...');
  stopAllCronJobs();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { startAllCronJobs, stopAllCronJobs, gracefulShutdown };
