const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

const cleanupRefreshTokensJob = cron.schedule(
  '0 0 * * *',
  async () => {
    try {
      logger.info('Running refresh tokens cleanup job...');
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      logger.info(`Cleaned up ${result.count} expired refresh tokens`);
    } catch (error) {
      logger.error('Refresh tokens cleanup job failed:', error);
    }
  },
  { scheduled: false }
);

const cleanupMessagesJob = cron.schedule(
  '0 0 * * 0',
  async () => {
    try {
      logger.info('Running messages cleanup job...');
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const result = await prisma.message.deleteMany({
        where: { createdAt: { lt: oneYearAgo } },
      });
      logger.info(`Cleaned up ${result.count} old messages`);
    } catch (error) {
      logger.error('Messages cleanup job failed:', error);
    }
  },
  { scheduled: false }
);

const startCleanupJobs = () => {
  cleanupRefreshTokensJob.start();
  cleanupMessagesJob.start();
  logger.info('Cleanup cron jobs started');
};

const stopCleanupJobs = () => {
  cleanupRefreshTokensJob.stop();
  cleanupMessagesJob.stop();
  logger.info('Cleanup cron jobs stopped');
};

module.exports = { startCleanupJobs, stopCleanupJobs };
