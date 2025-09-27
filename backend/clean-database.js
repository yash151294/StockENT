const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Delete in order to respect foreign key constraints
    // Start with dependent tables first
    
    console.log('🗑️  Deleting notifications...');
    await prisma.notification.deleteMany();
    
    console.log('🗑️  Deleting watchlist items...');
    await prisma.watchlistItem.deleteMany();
    
    console.log('🗑️  Deleting sample requests...');
    await prisma.sampleRequest.deleteMany();
    
    console.log('🗑️  Deleting key exchanges...');
    await prisma.keyExchange.deleteMany();
    
    console.log('🗑️  Deleting messages...');
    await prisma.message.deleteMany();
    
    console.log('🗑️  Deleting conversations...');
    await prisma.conversation.deleteMany();
    
    console.log('🗑️  Deleting bids...');
    await prisma.bid.deleteMany();
    
    console.log('🗑️  Deleting auctions...');
    await prisma.auction.deleteMany();
    
    console.log('🗑️  Deleting product specifications...');
    await prisma.productSpecification.deleteMany();
    
    console.log('🗑️  Deleting product images...');
    await prisma.productImage.deleteMany();
    
    console.log('🗑️  Deleting products...');
    await prisma.product.deleteMany();
    
    console.log('🗑️  Deleting categories...');
    await prisma.category.deleteMany();
    
    console.log('🗑️  Deleting refresh tokens...');
    await prisma.refreshToken.deleteMany();
    
    console.log('🗑️  Deleting verification tokens...');
    await prisma.verificationToken.deleteMany();
    
    console.log('🗑️  Deleting company profiles...');
    await prisma.companyProfile.deleteMany();
    
    console.log('🗑️  Deleting users...');
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('📊 All tables have been cleared.');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDatabase()
  .then(() => {
    console.log('🎉 Database cleanup finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database cleanup failed:', error);
    process.exit(1);
  });
