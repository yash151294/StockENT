const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test data for different user types
const testData = {
  buyers: [
    {
      companyName: 'Fashion Forward Ltd',
      contactPerson: 'Sarah Johnson',
      phone: '+1-555-0101',
      country: 'United States'
    },
    {
      companyName: 'Style Solutions Inc',
      contactPerson: 'Michael Chen',
      phone: '+1-555-0102',
      country: 'Canada'
    },
    {
      companyName: 'Trendy Textiles Co',
      contactPerson: 'Emily Rodriguez',
      phone: '+1-555-0103',
      country: 'Mexico'
    },
    {
      companyName: 'Fabric World Ltd',
      contactPerson: 'David Kim',
      phone: '+1-555-0104',
      country: 'South Korea'
    },
    {
      companyName: 'Textile Traders',
      contactPerson: 'Lisa Wang',
      phone: '+1-555-0105',
      country: 'China'
    }
  ],
  sellers: [
    {
      companyName: 'Premium Fabrics Co',
      contactPerson: 'Ahmed Hassan',
      phone: '+1-555-0201',
      country: 'Turkey'
    },
    {
      companyName: 'Cotton Masters Ltd',
      contactPerson: 'Priya Sharma',
      phone: '+1-555-0202',
      country: 'India'
    },
    {
      companyName: 'Silk & More Inc',
      contactPerson: 'Marco Rossi',
      phone: '+1-555-0203',
      country: 'Italy'
    },
    {
      companyName: 'Global Textiles',
      contactPerson: 'Anna Schmidt',
      phone: '+1-555-0204',
      country: 'Germany'
    },
    {
      companyName: 'Fabric Excellence',
      contactPerson: 'James Wilson',
      phone: '+1-555-0205',
      country: 'United Kingdom'
    }
  ]
};

// Additional test users to create
const additionalTestUsers = [
  {
    email: 'testbuyer1@example.com',
    password: 'TestPass123!',
    role: 'BUYER',
    companyName: 'Test Buyer Co',
    contactPerson: 'Test Buyer',
    phone: '+1-555-1001',
    country: 'United States'
  },
  {
    email: 'testseller1@example.com',
    password: 'TestPass123!',
    role: 'SELLER',
    companyName: 'Test Seller Co',
    contactPerson: 'Test Seller',
    phone: '+1-555-2001',
    country: 'India'
  }
];

async function populateExistingUsers() {
  console.log('📝 Updating existing users with test data...');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      country: true
    }
  });

  console.log(`Found ${users.length} users to update`);

  let buyerIndex = 0;
  let sellerIndex = 0;
  let updatedCount = 0;

  for (const user of users) {
    let updateData = {};
    
    if (user.role === 'BUYER') {
      const testDataItem = testData.buyers[buyerIndex % testData.buyers.length];
      updateData = {
        companyName: user.companyName || testDataItem.companyName,
        contactPerson: user.contactPerson || testDataItem.contactPerson,
        phone: user.phone || testDataItem.phone,
        country: user.country || testDataItem.country
      };
      buyerIndex++;
    } else if (user.role === 'SELLER') {
      const testDataItem = testData.sellers[sellerIndex % testData.sellers.length];
      updateData = {
        companyName: user.companyName || testDataItem.companyName,
        contactPerson: user.contactPerson || testDataItem.contactPerson,
        phone: user.phone || testDataItem.phone,
        country: user.country || testDataItem.country
      };
      sellerIndex++;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
      updatedCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} users`);
  return updatedCount;
}

async function createAdditionalUsers() {
  console.log('👥 Creating additional test users...');
  
  const createdUsers = [];
  const skippedUsers = [];

  for (const userData of additionalTestUsers) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        skippedUsers.push(userData.email);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: hashedPassword,
          role: userData.role,
          companyName: userData.companyName,
          contactPerson: userData.contactPerson,
          phone: userData.phone,
          country: userData.country,
          verificationStatus: 'VERIFIED',
          isActive: true,
          isFirstLogin: false
        }
      });

      createdUsers.push(user.email);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log(`✅ Created: ${createdUsers.length} users`);
  console.log(`⏭️  Skipped: ${skippedUsers.length} users (already exist)`);
  
  return { createdUsers, skippedUsers };
}

async function updateConversationAliases() {
  console.log('💬 Updating conversation aliases...');
  
  const conversations = await prisma.conversation.findMany({
    include: {
      buyer: {
        select: {
          id: true,
          email: true,
          companyName: true,
          contactPerson: true
        }
      },
      seller: {
        select: {
          id: true,
          email: true,
          companyName: true,
          contactPerson: true
        }
      }
    }
  });

  console.log(`Found ${conversations.length} conversations to check`);

  let updatedCount = 0;

  for (const conversation of conversations) {
    let needsUpdate = false;
    const updateData = {};

    const buyerAlias = conversation.buyer?.companyName || conversation.buyer?.contactPerson || 'Buyer';
    if (conversation.buyerAlias !== buyerAlias) {
      updateData.buyerAlias = buyerAlias;
      needsUpdate = true;
    }

    const sellerAlias = conversation.seller?.companyName || conversation.seller?.contactPerson || 'Seller';
    if (conversation.sellerAlias !== sellerAlias) {
      updateData.sellerAlias = sellerAlias;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: updateData
      });
      updatedCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} conversations`);
  return updatedCount;
}

async function showSummary() {
  console.log('\n📊 Database Summary:');
  
  const userCount = await prisma.user.count();
  const buyerCount = await prisma.user.count({ where: { role: 'BUYER' } });
  const sellerCount = await prisma.user.count({ where: { role: 'SELLER' } });
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  const conversationCount = await prisma.conversation.count();
  
  console.log(`👥 Total Users: ${userCount}`);
  console.log(`🛒 Buyers: ${buyerCount}`);
  console.log(`🏪 Sellers: ${sellerCount}`);
  console.log(`👑 Admins: ${adminCount}`);
  console.log(`💬 Conversations: ${conversationCount}`);
  
  // Show sample users
  const sampleUsers = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      companyName: true,
      contactPerson: true
    },
    take: 5
  });
  
  console.log('\n📋 Sample Users:');
  sampleUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.role}): ${user.companyName} - ${user.contactPerson}`);
  });
}

async function main() {
  try {
    console.log('🚀 Starting StockENT test data setup...\n');
    
    // Step 1: Update existing users
    const updatedUsers = await populateExistingUsers();
    
    // Step 2: Create additional test users
    const { createdUsers, skippedUsers } = await createAdditionalUsers();
    
    // Step 3: Update conversation aliases
    const updatedConversations = await updateConversationAliases();
    
    // Step 4: Show summary
    await showSummary();
    
    console.log('\n🎉 Test data setup completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Updated existing users: ${updatedUsers}`);
    console.log(`- Created new users: ${createdUsers.length}`);
    console.log(`- Skipped existing users: ${skippedUsers.length}`);
    console.log(`- Updated conversations: ${updatedConversations}`);
    
  } catch (error) {
    console.error('❌ Error during test data setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
