const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

const resetFirstLoginStatusJob = cron.schedule(
  '0 0 * * *', // Run daily at midnight
  async () => {
    try {
      logger.info('Running daily first login status reset job...');

      // Reset isFirstLogin to true for all users
      const result = await prisma.user.updateMany({
        where: {
          isActive: true, // Only reset for active users
        },
        data: {
          isFirstLogin: true,
        },
      });

      logger.info(`Reset first login status for ${result.count} active users`);
    } catch (error) {
      logger.error('Daily first login status reset job failed:', error);
    }
  },
  { scheduled: false }
);

const startDailyResetJobs = () => {
  resetFirstLoginStatusJob.start();
  logger.info('Daily reset cron jobs started');
};

const stopDailyResetJobs = () => {
  resetFirstLoginStatusJob.stop();
  logger.info('Daily reset cron jobs stopped');
};

module.exports = { startDailyResetJobs, stopDailyResetJobs };
