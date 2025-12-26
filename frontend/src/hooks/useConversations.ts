import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messagesAPI } from '../services/api';
import { useEffect } from 'react';

/**
 * Custom hook to manage conversation state and check if user has conversations
 */
export const useConversations = () => {
  const { state } = useAuth();
  const { socket } = useSocket();
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
  
  // Include conversations that have messages OR are recently created (within last 5 minutes)
  const conversations = allConversations.filter((conv: any) => {
    const hasMessages = conv._count?.messages && conv._count.messages > 0;
    const isRecent = conv.createdAt && (Date.now() - new Date(conv.createdAt).getTime()) < 5 * 60 * 1000; // 5 minutes
    return hasMessages || isRecent;
  });
  
  // Show conversations that have messages or are recently created
  const hasConversations = conversations.length > 0;
  const conversationCount = conversations.length;

  // Only log debug info in development and when there are actual changes
  // Removed excessive logging to reduce console noise

  // Real-time socket event handling for conversations
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: any) => {
        // Refresh conversations to update last message and unread count
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      const handleMessageNotification = (data: any) => {
        // Refresh conversations to update unread count
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        // Note: Notification handling is done by NotificationContext
      };

      const handleMessageDeleted = (data: any) => {
        // Refresh conversations to update message count
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      const handleConversationClosed = (data: any) => {
        // Refresh conversations to update conversation status
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      const handleConversationCreated = (conversation: any) => {
        // Refresh conversations to include new conversation
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      // Listen to socket events
      socket.on('message_received', handleNewMessage);
      socket.on('new_message_notification', handleMessageNotification);
      socket.on('message_deleted', handleMessageDeleted);
      socket.on('conversation_closed', handleConversationClosed);
      socket.on('conversation_created', handleConversationCreated);

      return () => {
        socket.off('message_received', handleNewMessage);
        socket.off('new_message_notification', handleMessageNotification);
        socket.off('message_deleted', handleMessageDeleted);
        socket.off('conversation_closed', handleConversationClosed);
        socket.off('conversation_created', handleConversationCreated);
      };
    }
  }, [socket, queryClient]);

  // Function to completely refresh conversation data
  const refreshConversations = async () => {
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
