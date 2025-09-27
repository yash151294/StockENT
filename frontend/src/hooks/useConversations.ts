import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI } from '../services/api';

/**
 * Custom hook to manage conversation state and check if user has conversations
 */
export const useConversations = () => {
  const { state } = useAuth();
  const queryClient = useQueryClient();

  // Query to get conversation count
  const { data: conversationsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations'], // Use same key as MessagesPage for consistency
    queryFn: () => messagesAPI.getConversations(),
    enabled: state.isAuthenticated, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't always refetch when component mounts
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const allConversations = conversationsResponse?.data?.data?.conversations || [];
  
  // Debug logging
  console.log('🔍 useConversations Debug:', {
    isAuthenticated: state.isAuthenticated,
    isLoading,
    error,
    responseData: conversationsResponse?.data?.data,
    allConversationsCount: allConversations.length,
    allConversations: allConversations.map(conv => ({
      id: conv.id,
      productTitle: conv.product?.title,
      messageCount: conv._count?.messages,
      hasMessages: conv._count?.messages && conv._count.messages > 0
    }))
  });
  
  // Only include conversations that have actual messages (conversations that have been started)
  const conversations = allConversations.filter((conv: any) => 
    conv._count?.messages && conv._count.messages > 0
  );
  
  // Only show conversations that have actual messages (conversations that have been started)
  const hasConversations = conversations.length > 0;
  const conversationCount = conversations.length;

  console.log('🔍 Filtered Results:', {
    hasConversations,
    conversationCount,
    conversationsWithMessages: conversations.length,
    allConversationsCount: allConversations.length,
    filteredConversations: conversations.map(conv => ({
      id: conv.id,
      productTitle: conv.product?.title,
      messageCount: conv._count?.messages
    })),
    timestamp: new Date().toISOString()
  });

  // Function to completely refresh conversation data
  const refreshConversations = async () => {
    console.log('🔄 Force refreshing conversations...');
    // Remove from cache completely
    queryClient.removeQueries({ queryKey: ['conversations'] });
    // Refetch
    await refetch();
  };

  return {
    hasConversations,
    conversationCount,
    isLoading,
    error,
    conversations,
    refetch, // Expose refetch function for manual refresh
    refreshConversations // Expose force refresh function
  };
};
