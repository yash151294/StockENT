const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { checkNegotiationExpiry } = require('../services/negotiationService');

/**
 * Negotiation expiry cron job
 * Runs every hour to check for expired negotiations
 */
const negotiationExpiryCron = cron.schedule('0 * * * *', async () => {
  try {
    logger.info('🔄 Running negotiation expiry check...');
    
    const result = await checkNegotiationExpiry();
    
    logger.info(`✅ Negotiation expiry check completed: ${result.expired} negotiations expired`);
  } catch (error) {
    logger.error('❌ Negotiation expiry check failed:', error);
  }
}, {
  scheduled: false, // Don't start automatically
  timezone: 'UTC',
});

/**
 * Start negotiation expiry cron job
 */
const startNegotiationExpiryCron = () => {
  negotiationExpiryCron.start();
  logger.info('✅ Negotiation expiry cron job started (every hour)');
};

/**
 * Stop negotiation expiry cron job
 */
const stopNegotiationExpiryCron = () => {
  negotiationExpiryCron.stop();
  logger.info('🛑 Negotiation expiry cron job stopped');
};

module.exports = {
  startNegotiationExpiryCron,
  stopNegotiationExpiryCron,
  negotiationExpiryCron,
};
