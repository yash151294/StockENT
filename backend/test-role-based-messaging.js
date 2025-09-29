/**
 * Test script to verify role-based messaging functionality
 * This script tests the getUserConversations function with different user roles
 */

const { PrismaClient } = require('@prisma/client');
const { getUserConversations } = require('./src/services/messageService');

const prisma = new PrismaClient();

async function testRoleBasedMessaging() {
  try {
    console.log('🧪 Testing Role-Based Messaging Functionality\n');

    // Test 1: Get a SELLER user
    const seller = await prisma.user.findFirst({
      where: { role: 'SELLER' },
      select: { id: true, email: true, role: true, companyName: true }
    });

    if (seller) {
      console.log(`📧 Testing SELLER role: ${seller.email} (${seller.companyName})`);
      const sellerConversations = await getUserConversations(seller.id, { userRole: 'SELLER' });
      console.log(`   Found ${sellerConversations.conversations.length} conversations where user is the seller`);
      
      // Verify all conversations have the user as seller
      const allSellerConversations = sellerConversations.conversations.every(conv => conv.sellerId === seller.id);
      console.log(`   ✅ All conversations have user as seller: ${allSellerConversations}`);
    } else {
      console.log('❌ No SELLER user found for testing');
    }

    // Test 2: Get a BUYER user
    const buyer = await prisma.user.findFirst({
      where: { role: 'BUYER' },
      select: { id: true, email: true, role: true, companyName: true }
    });

    if (buyer) {
      console.log(`\n📧 Testing BUYER role: ${buyer.email} (${buyer.companyName})`);
      const buyerConversations = await getUserConversations(buyer.id, { userRole: 'BUYER' });
      console.log(`   Found ${buyerConversations.conversations.length} conversations where user is the buyer`);
      
      // Verify all conversations have the user as buyer
      const allBuyerConversations = buyerConversations.conversations.every(conv => conv.buyerId === buyer.id);
      console.log(`   ✅ All conversations have user as buyer: ${allBuyerConversations}`);
    } else {
      console.log('❌ No BUYER user found for testing');
    }

    // Test 3: Get an ADMIN user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, role: true, companyName: true }
    });

    if (admin) {
      console.log(`\n📧 Testing ADMIN role: ${admin.email} (${admin.companyName})`);
      const adminConversations = await getUserConversations(admin.id, { userRole: 'ADMIN' });
      console.log(`   Found ${adminConversations.conversations.length} total conversations (no role filtering)`);
      
      // Admin should see all conversations (both as buyer and seller)
      const hasBuyerConversations = adminConversations.conversations.some(conv => conv.buyerId === admin.id);
      const hasSellerConversations = adminConversations.conversations.some(conv => conv.sellerId === admin.id);
      console.log(`   ✅ Admin can see conversations as buyer: ${hasBuyerConversations}`);
      console.log(`   ✅ Admin can see conversations as seller: ${hasSellerConversations}`);
    } else {
      console.log('❌ No ADMIN user found for testing');
    }

    // Test 4: Verify conversation data structure
    console.log('\n🔍 Testing conversation data structure...');
    const allUsers = await prisma.user.findMany({
      where: { role: { in: ['SELLER', 'BUYER', 'ADMIN'] } },
      select: { id: true, role: true }
    });

    for (const user of allUsers.slice(0, 3)) { // Test first 3 users
      const conversations = await getUserConversations(user.id, { userRole: user.role });
      
      if (conversations.conversations.length > 0) {
        const conv = conversations.conversations[0];
        console.log(`   User ${user.role}: Conversation includes product, buyer, seller, messages: ${
          !!(conv.product && conv.buyer && conv.seller && conv.messages)
        }`);
      }
    }

    console.log('\n✅ Role-based messaging test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRoleBasedMessaging();
