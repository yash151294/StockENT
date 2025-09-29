const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const io = require('socket.io-client');

const prisma = new PrismaClient();

/**
 * Test script for real-time messaging functionality
 * This script simulates two users sending messages to each other
 * and verifies that socket events are properly emitted
 */

async function testRealtimeMessaging() {
  console.log('🧪 Starting real-time messaging test...\n');

  try {
    // Get two test users
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['BUYER', 'SELLER'] },
        isActive: true,
      },
      take: 2,
    });

    if (users.length < 2) {
      console.error('❌ Need at least 2 users to test messaging');
      return;
    }

    const [user1, user2] = users;
    console.log(`👤 User 1: ${user1.companyName} (${user1.email})`);
    console.log(`👤 User 2: ${user2.companyName} (${user2.email})\n`);

    // Get a test product
    const product = await prisma.product.findFirst({
      where: { status: 'ACTIVE' },
      include: { seller: true },
    });

    if (!product) {
      console.error('❌ No active products found for testing');
      return;
    }

    console.log(`📦 Test Product: ${product.title}\n`);

    // Create or get conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        productId: product.id,
        OR: [
          { buyerId: user1.id, sellerId: user2.id },
          { buyerId: user2.id, sellerId: user1.id },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          productId: product.id,
          buyerId: user1.id,
          sellerId: user2.id,
          buyerAlias: user1.companyName || 'Buyer',
          sellerAlias: user2.companyName || 'Seller',
          status: 'ACTIVE',
        },
      });
      console.log(`💬 Created conversation: ${conversation.id}\n`);
    } else {
      console.log(`💬 Using existing conversation: ${conversation.id}\n`);
    }

    // Generate JWT tokens for socket authentication
    const token1 = jwt.sign(
      { userId: user1.id, email: user1.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const token2 = jwt.sign(
      { userId: user2.id, email: user2.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create socket connections
    const socket1 = io('http://localhost:5001', {
      auth: { token: token1 },
      transports: ['websocket', 'polling'],
    });

    const socket2 = io('http://localhost:5001', {
      auth: { token: token2 },
      transports: ['websocket', 'polling'],
    });

    // Test results
    const testResults = {
      socketConnections: false,
      roomJoining: false,
      messageEmission: false,
      messageReceipt: false,
      conversationUpdate: false,
    };

    // Socket 1 event handlers
    socket1.on('connect', () => {
      console.log('✅ Socket 1 connected');
      testResults.socketConnections = true;

      // Join conversation room
      socket1.emit('join_conversation', conversation.id);
      console.log(`📡 Socket 1 joined conversation: ${conversation.id}`);
    });

    socket1.on('message_received', (message) => {
      console.log('📨 Socket 1 received message:', {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
      });
      testResults.messageReceipt = true;
    });

    // Socket 2 event handlers
    socket2.on('connect', () => {
      console.log('✅ Socket 2 connected');

      // Join conversation room
      socket2.emit('join_conversation', conversation.id);
      console.log(`📡 Socket 2 joined conversation: ${conversation.id}`);
      testResults.roomJoining = true;

      // Wait a bit then send a message
      setTimeout(async () => {
        console.log('\n📤 Sending test message via Socket 2...');
        
        try {
          // Send message via socket
          socket2.emit('new_message', {
            conversationId: conversation.id,
            content: `Test message from ${user2.companyName} at ${new Date().toISOString()}`,
            messageType: 'TEXT',
          });

          testResults.messageEmission = true;
          console.log('✅ Message sent via socket');

          // Also send via HTTP API to test both paths
          setTimeout(async () => {
            console.log('\n📤 Sending test message via HTTP API...');
            
            try {
              const response = await fetch(`http://localhost:5001/api/messages/conversations/${conversation.id}/messages`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token1}`,
                  'Cookie': `accessToken=${token1}`,
                },
                body: JSON.stringify({
                  content: `HTTP API test message from ${user1.companyName} at ${new Date().toISOString()}`,
                  messageType: 'TEXT',
                }),
              });

              if (response.ok) {
                console.log('✅ Message sent via HTTP API');
                testResults.conversationUpdate = true;
              } else {
                console.error('❌ HTTP API message failed:', response.status);
              }
            } catch (error) {
              console.error('❌ HTTP API error:', error.message);
            }

            // Wait for all events then show results
            setTimeout(() => {
              showTestResults(testResults);
              cleanup();
            }, 2000);

          }, 1000);

        } catch (error) {
          console.error('❌ Socket message error:', error.message);
        }
      }, 1000);
    });

    // Cleanup function
    function cleanup() {
      socket1.disconnect();
      socket2.disconnect();
      console.log('\n🧹 Cleaned up socket connections');
    }

    // Show test results
    function showTestResults(results) {
      console.log('\n📊 Test Results:');
      console.log('================');
      console.log(`Socket Connections: ${results.socketConnections ? '✅' : '❌'}`);
      console.log(`Room Joining: ${results.roomJoining ? '✅' : '❌'}`);
      console.log(`Message Emission: ${results.messageEmission ? '✅' : '❌'}`);
      console.log(`Message Receipt: ${results.messageReceipt ? '✅' : '❌'}`);
      console.log(`Conversation Update: ${results.conversationUpdate ? '✅' : '❌'}`);

      const allPassed = Object.values(results).every(result => result === true);
      console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
      
      if (allPassed) {
        console.log('\n🎉 Real-time messaging is working correctly!');
      } else {
        console.log('\n⚠️  Some issues detected. Check the logs above.');
      }
    }

    // Handle errors
    socket1.on('connect_error', (error) => {
      console.error('❌ Socket 1 connection error:', error.message);
    });

    socket2.on('connect_error', (error) => {
      console.error('❌ Socket 2 connection error:', error.message);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('\n⏰ Test timeout reached');
      showTestResults(testResults);
      cleanup();
    }, 30000);

  } catch (error) {
    console.error('❌ Test setup error:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRealtimeMessaging()
    .then(() => {
      console.log('\n🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testRealtimeMessaging };
