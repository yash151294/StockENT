const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { syncCartAfterProductUpdate } = require('../services/cartService');
const { getPrismaClient } = require('../utils/prisma');

const prisma = getPrismaClient();

/**
 * Cart cleanup cron job
 * Runs every 6 hours to clean up invalid cart items
 */
const cartCleanupCron = cron.schedule('0 */6 * * *', async () => {
  try {
    logger.info('🔄 Running cart cleanup job...');
    
    // Get all products that are no longer active
    const inactiveProducts = await prisma.product.findMany({
      where: {
        status: {
          in: ['INACTIVE', 'SOLD', 'EXPIRED'],
        },
      },
      select: {
        id: true,
      },
    });

    let totalCleaned = 0;

    // Clean up cart items for inactive products
    for (const product of inactiveProducts) {
      const result = await syncCartAfterProductUpdate(product.id);
      totalCleaned += result.processed;
    }

    // Clean up cart items for products that have been deleted
    // Use raw query to find orphaned records (where productId references non-existent product)
    const orphanedItems = await prisma.$queryRaw`
      SELECT ci.id FROM "CartItem" ci
      LEFT JOIN "Product" p ON ci."productId" = p.id
      WHERE p.id IS NULL
    `;

    if (orphanedItems.length > 0) {
      const orphanedIds = orphanedItems.map(item => item.id);
      const deletedCartItems = await prisma.cartItem.deleteMany({
        where: {
          id: { in: orphanedIds },
        },
      });
      totalCleaned += deletedCartItems.count;
    }

    logger.info(`✅ Cart cleanup completed: ${totalCleaned} items processed`);
  } catch (error) {
    logger.error('❌ Cart cleanup failed:', error);
  }
}, {
  scheduled: false, // Don't start automatically
  timezone: 'UTC',
});

/**
 * Start cart cleanup cron job
 */
const startCartCleanupCron = () => {
  cartCleanupCron.start();
  logger.info('✅ Cart cleanup cron job started (every 6 hours)');
};

/**
 * Stop cart cleanup cron job
 */
const stopCartCleanupCron = () => {
  cartCleanupCron.stop();
  logger.info('🛑 Cart cleanup cron job stopped');
};

module.exports = {
  startCartCleanupCron,
  stopCartCleanupCron,
  cartCleanupCron,
};
