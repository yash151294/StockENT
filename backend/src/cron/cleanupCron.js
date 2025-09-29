const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const { cleanupEmptyConversations, cleanupOldEmptyConversations, cleanupAbandonedConversations } = require('../services/messageService');

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

const cleanupEmptyConversationsJob = cron.schedule(
  '0 */6 * * *', // Every 6 hours
  async () => {
    try {
      logger.info('Running empty conversations cleanup job...');
      const result = await cleanupEmptyConversations();
      logger.info(`Cleaned up ${result.deletedCount} empty conversations`);
    } catch (error) {
      logger.error('Empty conversations cleanup job failed:', error);
    }
  },
  { scheduled: false }
);

const cleanupOldEmptyConversationsJob = cron.schedule(
  '0 2 * * *', // Daily at 2 AM
  async () => {
    try {
      logger.info('Running old empty conversations cleanup job...');
      const result = await cleanupOldEmptyConversations();
      logger.info(`Cleaned up ${result.deletedCount} old empty conversations`);
    } catch (error) {
      logger.error('Old empty conversations cleanup job failed:', error);
    }
  },
  { scheduled: false }
);

const cleanupAbandonedConversationsJob = cron.schedule(
  '0 */2 * * *', // Every 2 hours
  async () => {
    try {
      logger.info('Running abandoned conversations cleanup job...');
      const result = await cleanupAbandonedConversations();
      logger.info(`Cleaned up ${result.deletedCount} abandoned conversations`);
    } catch (error) {
      logger.error('Abandoned conversations cleanup job failed:', error);
    }
  },
  { scheduled: false }
);

const startCleanupJobs = () => {
  cleanupRefreshTokensJob.start();
  cleanupMessagesJob.start();
  cleanupEmptyConversationsJob.start();
  cleanupOldEmptyConversationsJob.start();
  cleanupAbandonedConversationsJob.start();
  logger.info('Cleanup cron jobs started');
};

const stopCleanupJobs = () => {
  cleanupRefreshTokensJob.stop();
  cleanupMessagesJob.stop();
  cleanupEmptyConversationsJob.stop();
  cleanupOldEmptyConversationsJob.stop();
  cleanupAbandonedConversationsJob.stop();
  logger.info('Cleanup cron jobs stopped');
};

module.exports = { startCleanupJobs, stopCleanupJobs };
