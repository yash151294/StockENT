import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useQuery } from '@tanstack/react-query';
import { messagesAPI } from '../services/api';

export interface Notification {
  id: string;
  type: 'message' | 'auction_activity';
  title: string;
  message: string;
  data: {
    conversationId?: string;
    auctionId?: string;
    productId?: string;
    productTitle?: string;
    senderName?: string;
    senderId?: string;
    senderProfileImageUrl?: string;
    activityType?: 'bid_placed' | 'auction_started' | 'auction_ended' | 'outbid' | 'won' | 'lost';
    unreadCount?: number; // Track number of unread messages from this user
  };
  isRead: boolean;
  createdAt: string;
  onClick?: () => void;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markMessageNotificationsAsRead: (conversationId: string) => void;
  markAllAsRead: () => void;
  markNotificationsViewed: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  clearDismissedNotifications: () => void; // For testing/debugging
  testNotification: () => void; // For testing/debugging
  testMessageNotification: () => void; // For testing message notifications
  // Toast notification methods
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showError: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { state } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());
  const dismissedNotificationIdsRef = useRef<Set<string>>(new Set());

  // Get unread message count (currently not used but kept for future use)
  useQuery({
    queryKey: ['unread-message-count'],
    queryFn: () => messagesAPI.getUnreadCount(),
    enabled: state.isAuthenticated && !!state.user?.id,
    refetchInterval: 30000,
    retry: 2,
    staleTime: 10000,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Load notifications from localStorage and fetch unread messages on mount
  useEffect(() => {
    if (state.isAuthenticated && state.user?.id) {
      const savedNotifications = localStorage.getItem(`notifications_${state.user?.id}`);
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          setNotifications(parsed);
        } catch (error) {
          console.error('Error loading notifications from localStorage:', error);
        }
      }

      // Load dismissed notification IDs
      const savedDismissedIds = localStorage.getItem(`dismissed_notifications_${state.user?.id}`);
      if (savedDismissedIds) {
        try {
          const parsed = JSON.parse(savedDismissedIds) as string[];
          const dismissedSet = new Set<string>(parsed);
          setDismissedNotificationIds(dismissedSet);
          dismissedNotificationIdsRef.current = dismissedSet;
        } catch (error) {
          console.error('Error loading dismissed notifications from localStorage:', error);
        }
      }

      // Fetch existing unread messages and create one notification per user
      const loadUnreadMessages = async () => {
        try {
          // Get unread messages from the last 7 days
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const response = await messagesAPI.getUnreadNotifications(50, oneWeekAgo);
          
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            // Group messages by sender to create one notification per user
            const messagesBySender = new Map();
            
            response.data.data.forEach((message: any) => {
              const senderId = message.senderId;
              if (!messagesBySender.has(senderId)) {
                messagesBySender.set(senderId, {
                  latestMessage: message,
                  count: 0,
                });
              }
              messagesBySender.get(senderId).count++;
              
              // Keep the most recent message
              if (new Date(message.createdAt) > new Date(messagesBySender.get(senderId).latestMessage.createdAt)) {
                messagesBySender.get(senderId).latestMessage = message;
              }
            });

            // Create one notification per sender
            const unreadMessageNotifications = Array.from(messagesBySender.values())
              .map(({ latestMessage, count }) => ({
                id: `user_msg_${latestMessage.senderId}`,
                type: 'message' as const,
                title: 'Unread Messages',
                message: count === 1 
                  ? `${latestMessage.sender?.companyName || 'Someone'} sent you a message`
                  : `${latestMessage.sender?.companyName || 'Someone'} sent you ${count} messages`,
                data: {
                  conversationId: latestMessage.conversationId,
                  senderName: latestMessage.sender?.companyName || 'Unknown',
                  senderId: latestMessage.senderId,
                  senderProfileImageUrl: latestMessage.sender?.profileImageUrl || undefined,
                  productId: latestMessage.product?.id,
                  productTitle: latestMessage.product?.title,
                  unreadCount: count,
                },
                isRead: false,
                createdAt: latestMessage.createdAt,
                onClick: () => {
                  window.location.href = `/messages?conversation=${latestMessage.conversationId}`;
                },
              }));

            setNotifications(prev => {
              // Remove old message notifications and add new ones
              const nonMessageNotifications = prev.filter(n => n.type !== 'message');
              
              // Filter out dismissed notifications and preserve read status from localStorage for existing notifications
              const updatedMessageNotifications = unreadMessageNotifications
                .filter(newNotif => !dismissedNotificationIdsRef.current.has(newNotif.id))
                .map(newNotif => {
                  const existingNotif = prev.find(p => p.id === newNotif.id);
                  if (existingNotif) {
                    return { ...newNotif, isRead: existingNotif.isRead };
                  }
                  return newNotif;
                });
              
              return [...updatedMessageNotifications, ...nonMessageNotifications].slice(0, 50);
            });

            console.log(`📬 Loaded ${unreadMessageNotifications.length} user notifications with unread messages`);
          } else {
            console.log('📭 No recent unread messages found');
          }
        } catch (error) {
          console.error('Error loading unread messages:', error);
          // Don't throw error to prevent breaking the app
        }
      };

      loadUnreadMessages();
    }
  }, [state.isAuthenticated, state.user?.id]);

  // Save notifications to localStorage whenever notifications change
  useEffect(() => {
    if (state.isAuthenticated && state.user?.id) {
      localStorage.setItem(`notifications_${state.user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, state.isAuthenticated, state.user?.id]);

  // Save dismissed notification IDs to localStorage whenever they change
  useEffect(() => {
    if (state.isAuthenticated && state.user?.id) {
      localStorage.setItem(`dismissed_notifications_${state.user.id}`, JSON.stringify([...dismissedNotificationIds]));
    }
  }, [dismissedNotificationIds, state.isAuthenticated, state.user?.id]);

  // Keep ref in sync with dismissedNotificationIds state
  useEffect(() => {
    dismissedNotificationIdsRef.current = dismissedNotificationIds;
  }, [dismissedNotificationIds]);

  // Socket event handlers for real-time notifications
  useEffect(() => {
    console.log('🔧 NotificationContext useEffect triggered:', { 
      isAuthenticated: state.isAuthenticated, 
      hasSocket: !!socket, 
      isConnected,
      userId: state.user?.id
    });
    if (state.isAuthenticated && socket && isConnected) {
      const handleMessageReceived = (message: any) => {
        console.log('📨 Message received event:', message);
        console.log('🔍 Message sender ID:', message.senderId);
        console.log('🔍 Current user ID:', state.user?.id);
        
        // Only process if message is not from current user
        if (message.senderId !== state.user?.id) {
          console.log('✅ Processing message from different user');
          setNotifications(prev => {
            const existingNotificationIndex = prev.findIndex(
              n => n.type === 'message' && n.data.senderId === message.senderId
            );

            if (existingNotificationIndex >= 0) {
              // Update existing notification
              const existing = prev[existingNotificationIndex];
              const newUnreadCount = (existing.data.unreadCount || 0) + 1;
              
              const updatedNotification: Notification = {
                ...existing,
                message: newUnreadCount === 1 
                  ? `${message.sender?.companyName || 'Someone'} sent you a message`
                  : `${message.sender?.companyName || 'Someone'} sent you ${newUnreadCount} messages`,
                data: {
                  ...existing.data,
                  conversationId: message.conversationId,
                  unreadCount: newUnreadCount,
                  productId: message.product?.id,
                  productTitle: message.product?.title,
                },
                isRead: false,
                createdAt: message.createdAt || new Date().toISOString(),
              };

              const newNotifications = [...prev];
              newNotifications[existingNotificationIndex] = updatedNotification;
              return newNotifications;
            } else {
              // Create new notification for this sender (always create, don't block based on dismissal)
              const notificationId = `user_msg_${message.senderId}`;
              const notification: Notification = {
                id: notificationId,
                type: 'message',
                title: 'Unread Messages',
                message: `${message.sender?.companyName || 'Someone'} sent you a message`,
                data: {
                  conversationId: message.conversationId,
                  senderName: message.sender?.companyName || 'Unknown',
                  senderId: message.senderId,
                  senderProfileImageUrl: message.sender?.profileImageUrl || undefined,
                  productId: message.product?.id,
                  productTitle: message.product?.title,
                  unreadCount: 1,
                },
                isRead: false,
                createdAt: message.createdAt || new Date().toISOString(),
                onClick: () => {
                  window.location.href = `/messages?conversation=${message.conversationId}`;
                },
              };

              return [notification, ...prev].slice(0, 50);
            }
          });
        }
      };

      const handleNewMessageNotification = (data: any) => {
        console.log('🔔 New message notification event:', data);
        console.log('🚀 handleNewMessageNotification function called!');
        console.log('🔍 Function execution started');
        
        // Extract message from the notification data structure
        const message = data.message;
        console.log('🔍 Extracted message:', message);
        console.log('🔍 Current user ID:', state.user?.id);
        console.log('🔍 Message sender ID:', message?.senderId);
        
        if (!message || message.senderId === state.user?.id) {
          console.log('❌ Message filtered out - either no message or from current user');
          return;
        }
        
        // Use the same logic as handleMessageReceived
        setNotifications(prev => {
          console.log('🔍 Current notifications before processing:', prev.length);
          const existingNotificationIndex = prev.findIndex(
            n => n.type === 'message' && n.data.senderId === message.senderId
          );
          console.log('🔍 Existing notification index:', existingNotificationIndex);

          if (existingNotificationIndex >= 0) {
            console.log('📝 Updating existing notification');
            // Update existing notification
            const existing = prev[existingNotificationIndex];
            const newUnreadCount = (existing.data.unreadCount || 0) + 1;
            
            const updatedNotification: Notification = {
              ...existing,
              message: newUnreadCount === 1 
                ? `${message.sender?.companyName || 'Someone'} sent you a message`
                : `${message.sender?.companyName || 'Someone'} sent you ${newUnreadCount} messages`,
              data: {
                ...existing.data,
                conversationId: data.conversationId,
                unreadCount: newUnreadCount,
                productId: data.product?.id,
                productTitle: data.product?.title,
              },
              isRead: false,
              createdAt: message.createdAt || new Date().toISOString(),
            };

            const newNotifications = [...prev];
            newNotifications[existingNotificationIndex] = updatedNotification;
            console.log('✅ Updated notification:', updatedNotification);
            return newNotifications;
          } else {
            console.log('🆕 Creating new notification');
            // Create new notification for this sender
            const notificationId = `user_msg_${message.senderId}`;
            console.log('🔍 Notification ID:', notificationId);
            console.log('🔍 Dismissed notifications:', Array.from(dismissedNotificationIdsRef.current));
            console.log('🔍 Is notification dismissed?', dismissedNotificationIdsRef.current.has(notificationId));
            
            // Always create new notifications - don't block based on previous dismissal
            console.log('✅ Creating new notification (ignoring previous dismissal)');
            const notification: Notification = {
              id: notificationId,
              type: 'message',
              title: 'Unread Messages',
              message: `${message.sender?.companyName || 'Someone'} sent you a message`,
              data: {
                conversationId: data.conversationId,
                senderName: message.sender?.companyName || 'Unknown',
                senderId: message.senderId,
                senderProfileImageUrl: message.sender?.profileImageUrl || undefined,
                productId: data.product?.id,
                productTitle: data.product?.title,
                unreadCount: 1,
              },
              isRead: false,
              createdAt: message.createdAt || new Date().toISOString(),
              onClick: () => {
                window.location.href = `/messages?conversation=${data.conversationId}`;
              },
            };

            console.log('✅ Created new notification:', notification);
            return [notification, ...prev].slice(0, 50);
          }
        });
      };

      const handleAuctionActivity = (activity: any) => {
        console.log('🔨 Auction activity notification received:', activity);
        
        const notification: Notification = {
          id: `auction_${activity.id || Date.now()}`,
          type: 'auction_activity',
          title: 'Auction Activity',
          message: getAuctionActivityMessage(activity),
          data: {
            auctionId: activity.auctionId,
            productId: activity.productId,
            productTitle: activity.productTitle,
            activityType: activity.type,
            senderName: activity.bidderName,
            senderId: activity.bidderId,
          },
          isRead: false,
          createdAt: activity.createdAt || new Date().toISOString(),
          onClick: () => {
            // Navigate to auction detail page
            window.location.href = `/auctions/${activity.auctionId}`;
          },
        };

        addNotification(notification);
      };

      console.log('🔌 Registering socket event listeners in NotificationContext');
      socket.on('message_received', handleMessageReceived);
      socket.on('new_message_notification', handleNewMessageNotification);
      socket.on('auction_activity', handleAuctionActivity);
      socket.on('bid_placed', handleAuctionActivity);
      socket.on('auction_started', handleAuctionActivity);
      socket.on('auction_ended', handleAuctionActivity);
      console.log('✅ Socket event listeners registered in NotificationContext');

      return () => {
        socket.off('message_received', handleMessageReceived);
        socket.off('new_message_notification', handleNewMessageNotification);
        socket.off('auction_activity', handleAuctionActivity);
        socket.off('bid_placed', handleAuctionActivity);
        socket.off('auction_started', handleAuctionActivity);
        socket.off('auction_ended', handleAuctionActivity);
      };
    }
  }, [socket, isConnected, state.isAuthenticated, state.user?.id]);

  const getAuctionActivityMessage = (activity: any): string => {
    switch (activity.type) {
      case 'bid_placed':
        return `${activity.bidderName || 'Someone'} placed a bid on "${activity.productTitle || 'your auction'}"`;
      case 'auction_started':
        return `Auction for "${activity.productTitle || 'a product'}" has started`;
      case 'auction_ended':
        return `Auction for "${activity.productTitle || 'a product'}" has ended`;
      case 'outbid':
        return `You were outbid on "${activity.productTitle || 'an auction'}"`;
      case 'won':
        return `You won the auction for "${activity.productTitle || 'a product'}"`;
      case 'lost':
        return `You lost the auction for "${activity.productTitle || 'a product'}"`;
      default:
        return `Activity on "${activity.productTitle || 'an auction'}"`;
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50 notifications
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markMessageNotificationsAsRead = (conversationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.type === 'message' && 
        notification.data.conversationId === conversationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
    console.log('📱 Message notifications marked as read for conversation:', conversationId);
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    console.log('📱 All notifications marked as read');
  };

  const markNotificationsViewed = async () => {
    try {
      await messagesAPI.markNotificationsViewed();
      console.log('📱 Notifications marked as viewed');
    } catch (error) {
      console.error('Error marking notifications as viewed:', error);
    }
  };

  const removeNotification = (notificationId: string) => {
    // Add to dismissed set so it doesn't reappear
    setDismissedNotificationIds(prev => new Set([...prev, notificationId]));
    
    // Remove from current notifications
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    console.log('🗑️ Notification removed:', notificationId);
  };

  const clearAllNotifications = () => {
    // Add all current notification IDs to dismissed set
    const currentNotificationIds = notifications.map(n => n.id);
    setDismissedNotificationIds(prev => new Set([...prev, ...currentNotificationIds]));
    
    // Clear all notifications
    setNotifications([]);
    console.log('🗑️ All notifications cleared');
  };

  const clearDismissedNotifications = () => {
    setDismissedNotificationIds(new Set());
    console.log('🗑️ Dismissed notifications cleared');
  };

  const testNotification = () => {
    const testNotif: Notification = {
      id: `test_${Date.now()}`,
      type: 'message',
      title: 'Test Notification',
      message: 'This is a test notification',
      data: {
        conversationId: 'test-conversation',
        senderName: 'Test User',
        senderId: 'test-user-id',
        unreadCount: 1,
      },
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [testNotif, ...prev]);
    console.log('🧪 Test notification added');
  };

  // Test function to simulate a message notification
  const testMessageNotification = () => {
    console.log('🧪 Testing message notification...');
    const mockMessage = {
      id: 'test-message-123',
      senderId: 'test-sender-456',
      conversationId: 'test-conversation-789',
      content: 'This is a test message',
      createdAt: new Date().toISOString(),
      sender: {
        id: 'test-sender-456',
        companyName: 'Test Company',
        profileImageUrl: undefined
      }
    };
    
    const mockData = {
      conversationId: 'test-conversation-789',
      message: mockMessage,
      product: {
        id: 'test-product-123',
        title: 'Test Product'
      }
    };
    
    // Simulate the handleNewMessageNotification logic directly
    console.log('🔔 New message notification event:', mockData);
    console.log('🚀 handleNewMessageNotification function called!');
    console.log('🔍 Function execution started');
    
    // Extract message from the notification data structure
    const message = mockData.message;
    console.log('🔍 Extracted message:', message);
    console.log('🔍 Current user ID:', state.user?.id);
    console.log('🔍 Message sender ID:', message?.senderId);
    
    if (!message || message.senderId === state.user?.id) {
      console.log('❌ Message filtered out - either no message or from current user');
      return;
    }
    
    // Use the same logic as handleNewMessageNotification
    setNotifications(prev => {
      console.log('🔍 Current notifications before processing:', prev.length);
      const existingNotificationIndex = prev.findIndex(
        n => n.type === 'message' && n.data.senderId === message.senderId
      );
      console.log('🔍 Existing notification index:', existingNotificationIndex);

      if (existingNotificationIndex >= 0) {
        console.log('📝 Updating existing notification');
        // Update existing notification
        const existing = prev[existingNotificationIndex];
        const newUnreadCount = (existing.data.unreadCount || 0) + 1;
        
        const updatedNotification: Notification = {
          ...existing,
          message: newUnreadCount === 1 
            ? `${message.sender?.companyName || 'Someone'} sent you a message`
            : `${message.sender?.companyName || 'Someone'} sent you ${newUnreadCount} messages`,
          data: {
            ...existing.data,
            conversationId: mockData.conversationId,
            unreadCount: newUnreadCount,
            productId: mockData.product?.id,
            productTitle: mockData.product?.title,
          },
          isRead: false,
          createdAt: message.createdAt || new Date().toISOString(),
        };

        const newNotifications = [...prev];
        newNotifications[existingNotificationIndex] = updatedNotification;
        console.log('✅ Updated notification:', updatedNotification);
        return newNotifications;
      } else {
        console.log('🆕 Creating new notification');
        // Create new notification for this sender
        const notificationId = `user_msg_${message.senderId}`;
        console.log('🔍 Notification ID:', notificationId);
        console.log('🔍 Dismissed notifications:', Array.from(dismissedNotificationIdsRef.current));
        console.log('🔍 Is notification dismissed?', dismissedNotificationIdsRef.current.has(notificationId));
        
        // Always create new notifications - don't block based on previous dismissal
        console.log('✅ Creating new notification (ignoring previous dismissal)');
        const notification: Notification = {
          id: notificationId,
          type: 'message',
          title: 'Unread Messages',
          message: `${message.sender?.companyName || 'Someone'} sent you a message`,
          data: {
            conversationId: mockData.conversationId,
            senderName: message.sender?.companyName || 'Unknown',
            senderId: message.senderId,
            senderProfileImageUrl: message.sender?.profileImageUrl || undefined,
            productId: mockData.product?.id,
            productTitle: mockData.product?.title,
            unreadCount: 1,
          },
          isRead: false,
          createdAt: message.createdAt || new Date().toISOString(),
          onClick: () => {
            window.location.href = `/messages?conversation=${mockData.conversationId}`;
          },
        };

        console.log('✅ Created new notification:', notification);
        return [notification, ...prev].slice(0, 50);
      }
    });
  };

  // Toast notification methods (simple console.log for now, can be enhanced with a toast library)
  const showSuccess = (message: string) => {
    console.log('✅ Success:', message);
    // TODO: Implement proper toast notification
  };

  const showWarning = (message: string) => {
    console.log('⚠️ Warning:', message);
    // TODO: Implement proper toast notification
  };

  const showError = (message: string) => {
    console.log('❌ Error:', message);
    // TODO: Implement proper toast notification
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markMessageNotificationsAsRead,
    markAllAsRead,
    markNotificationsViewed,
    addNotification,
    removeNotification,
    clearAllNotifications,
    clearDismissedNotifications,
    testNotification,
    testMessageNotification,
    showSuccess,
    showWarning,
    showError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Export useNotification for backward compatibility
export const useNotification = useNotifications;