/**
 * Test utility to verify conversation logic
 * This file demonstrates how the conversation visibility logic works
 */

import { messagesAPI } from '../services/api';

/**
 * Test function to verify conversation visibility logic
 * This simulates the behavior of the useConversations hook
 */
export const testConversationLogic = async () => {
  try {
    // Simulate fetching conversations
    const response = await messagesAPI.getConversations();
    const allConversations = response?.data?.data?.conversations || [];
    
    // Filter conversations that have actual messages (conversations that have been started)
    const conversations = allConversations.filter((conv: any) => 
      conv._count?.messages && conv._count.messages > 0
    );
    
    // Check if user has conversations with messages
    const hasConversations = conversations.length > 0;
    
    console.log('📊 Conversation Test Results:');
    console.log(`- Total conversations (all): ${allConversations.length}`);
    console.log(`- Conversations with messages: ${conversations.length}`);
    console.log(`- Has conversations with messages: ${hasConversations}`);
    console.log(`- Messages tab should be visible: ${hasConversations}`);
    
    if (hasConversations) {
      console.log('✅ Messages tab will be shown in navigation');
      console.log('✅ View Messages quick action will be shown in dashboard');
    } else {
      console.log('❌ Messages tab will be hidden from navigation');
      console.log('❌ View Messages quick action will be hidden from dashboard');
      console.log('ℹ️  This is because no conversations have been started (no messages exchanged)');
    }
    
    return {
      hasConversations,
      conversationCount: conversations.length,
      conversations: conversations.map(conv => ({
        id: conv.id,
        productTitle: conv.product?.title,
        seller: conv.seller?.companyName,
        buyer: conv.buyer?.companyName,
        messageCount: conv._count?.messages || 0
      }))
    };
  } catch (error) {
    console.error('❌ Error testing conversation logic:', error);
    return {
      hasConversations: false,
      conversationCount: 0,
      conversations: [],
      error: error
    };
  }
};

/**
 * Utility to check if a user should see messages-related UI elements
 */
export const shouldShowMessagesUI = (conversationCount: number): boolean => {
  return conversationCount > 0;
};

/**
 * Example usage in components:
 * 
 * const { hasConversations } = useConversations();
 * 
 * // In navigation
 * {hasConversations && <MessagesTab />}
 * 
 * // In dashboard
 * const quickActions = [
 *   ...baseActions,
 *   ...(hasConversations ? [messagesAction] : [])
 * ];
 */
