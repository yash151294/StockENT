const { PrismaClient } = require('@prisma/client');

// Use singleton pattern to avoid multiple database connections
let prisma;

/**
 * Get the Prisma client singleton instance
 * @returns {PrismaClient}
 */
const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error'],
      errorFormat: 'minimal',
    });
  }
  return prisma;
};

/**
 * Disconnect the Prisma client (for graceful shutdown)
 */
const disconnectPrisma = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

module.exports = { getPrismaClient, disconnectPrisma };
