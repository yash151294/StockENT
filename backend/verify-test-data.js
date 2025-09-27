const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTestData() {
  try {
    console.log('🔍 Verifying StockENT test data...\n');
    
    // Get user statistics
    const totalUsers = await prisma.user.count();
    const buyers = await prisma.user.count({ where: { role: 'BUYER' } });
    const sellers = await prisma.user.count({ where: { role: 'SELLER' } });
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    console.log('📊 User Statistics:');
    console.log(`  Total Users: ${totalUsers}`);
    console.log(`  Buyers: ${buyers}`);
    console.log(`  Sellers: ${sellers}`);
    console.log(`  Admins: ${admins}`);
    
    // Check users with complete data
    const usersWithCompleteData = await prisma.user.findMany({
      where: {
        AND: [
          { companyName: { not: null } },
          { contactPerson: { not: null } },
          { phone: { not: null } },
          { country: { not: null } }
        ]
      },
      select: {
        email: true,
        role: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        country: true
      }
    });
    
    console.log(`\n✅ Users with complete data: ${usersWithCompleteData.length}/${totalUsers}`);
    
    // Check users with missing data
    const usersWithMissingData = await prisma.user.findMany({
      where: {
        OR: [
          { companyName: null },
          { contactPerson: null },
          { phone: null },
          { country: null }
        ]
      },
      select: {
        email: true,
        role: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        country: true
      }
    });
    
    if (usersWithMissingData.length > 0) {
      console.log(`\n⚠️  Users with missing data: ${usersWithMissingData.length}`);
      usersWithMissingData.forEach(user => {
        const missing = [];
        if (!user.companyName) missing.push('companyName');
        if (!user.contactPerson) missing.push('contactPerson');
        if (!user.phone) missing.push('phone');
        if (!user.country) missing.push('country');
        console.log(`  - ${user.email} (${user.role}): Missing ${missing.join(', ')}`);
      });
    }
    
    // Check conversations
    const totalConversations = await prisma.conversation.count();
    const allConversations = await prisma.conversation.findMany({
      select: {
        id: true,
        buyerAlias: true,
        sellerAlias: true
      }
    });
    
    const conversationsWithAliases = allConversations.filter(conv => 
      conv.buyerAlias && conv.sellerAlias
    );
    
    console.log(`\n💬 Conversation Statistics:`);
    console.log(`  Total Conversations: ${totalConversations}`);
    console.log(`  With Aliases: ${conversationsWithAliases.length}/${totalConversations}`);
    
    // Show sample users
    console.log('\n📋 Sample Users:');
    const sampleUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        companyName: true,
        contactPerson: true,
        phone: true,
        country: true
      },
      take: 5
    });
    
    sampleUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
      console.log(`    Company: ${user.companyName || 'N/A'}`);
      console.log(`    Contact: ${user.contactPerson || 'N/A'}`);
      console.log(`    Phone: ${user.phone || 'N/A'}`);
      console.log(`    Country: ${user.country || 'N/A'}`);
      console.log('');
    });
    
    // Check products
    const totalProducts = await prisma.product.count();
    console.log(`\n📦 Products: ${totalProducts}`);
    
    // Check auctions
    const totalAuctions = await prisma.auction.count();
    console.log(`🔨 Auctions: ${totalAuctions}`);
    
    console.log('\n✅ Test data verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyTestData()
  .then(() => {
    console.log('\n🎉 Verification completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });