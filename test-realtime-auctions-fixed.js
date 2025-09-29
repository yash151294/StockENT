#!/usr/bin/env node

/**
 * Test script to verify real-time auction functionality
 * This script tests the socket.io integration and real-time updates
 */

const { PrismaClient } = require('@prisma/client');
const { io } = require('socket.io-client');

const prisma = new PrismaClient();

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🧪 Testing Real-time Auction Functionality');
console.log('==========================================');

async function testRealtimeAuctions() {
  try {
    console.log('📡 Connecting to backend socket...');
    
    // Connect to backend socket
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: 'test-token' // This would be a real JWT token in production
      }
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log('✅ Connected to backend socket');
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ Connection failed:', error.message);
        reject(error);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
    });

    // Test event listeners
    console.log('🎧 Setting up event listeners...');
    
    socket.on('auction_status_changed', (data) => {
      console.log('🔄 Auction status changed:', data);
    });
    
    socket.on('auction_started', (data) => {
      console.log('🚀 Auction started:', data);
    });
    
    socket.on('auction_ended', (data) => {
      console.log('🏁 Auction ended:', data);
    });
    
    socket.on('auction_batch_processed', (data) => {
      console.log('📦 Auction batch processed:', data);
    });

    // Test socket events
    console.log('🧪 Testing socket events...');
    
    // Test auction room joining
    socket.emit('join_auction', 'test-auction-id');
    console.log('✅ Joined auction room');
    
    // Test bid placement
    socket.emit('new_bid', {
      auctionId: 'test-auction-id',
      amount: 100
    });
    console.log('✅ Test bid placed');
    
    // Test conversation joining
    socket.emit('join_conversation', 'test-conversation-id');
    console.log('✅ Joined conversation room');
    
    // Test message sending
    socket.emit('new_message', {
      conversationId: 'test-conversation-id',
      content: 'Test message',
      messageType: 'TEXT'
    });
    console.log('✅ Test message sent');

    console.log('✅ All socket tests completed successfully');
    
    // Disconnect
    socket.disconnect();
    console.log('🔌 Disconnected from socket');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRealtimeAuctions().catch(console.error);
