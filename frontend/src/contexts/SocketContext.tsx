import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

// Types
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinAuction: (auctionId: string) => void;
  leaveAuction: (auctionId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  emitTyping: (conversationId: string, isTyping: boolean) => void;
  emitBid: (auctionId: string, amount: number) => void;
  emitMessage: (conversationId: string, content: string, type?: string, encryptionData?: any) => void;
  emitKeyExchange: (conversationId: string, toUserId: string, encryptedAESKey: string, keyId: string, publicKey: string) => void;
  emitKeyExchangeResponse: (keyExchangeId: string, status?: string) => void;
}

// Context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Provider
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { state } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (state.isAuthenticated && !socketRef.current) {
      console.log('Creating new socket connection...');
      // Get authentication token
      const token = localStorage.getItem('accessToken') || document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      console.log('🔐 Socket auth token:', token ? 'Present' : 'Missing');

      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
        auth: { token }, // Send token in auth object
        withCredentials: true, // Enable cookies for authentication
        transports: ['websocket', 'polling'],
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        console.log('🔍 Socket ID:', newSocket.id);
        console.log('🔍 Socket URL:', process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001');
        logger.info('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        logger.info('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        logger.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Authentication events
      newSocket.on('auth-success', () => {
        console.log('✅ Socket authentication successful');
        logger.info('Socket authentication successful');
      });

      newSocket.on('auth-error', (error) => {
        console.error('❌ Socket authentication failed:', error);
        logger.error('Socket authentication failed:', error);
      });

      // Auction events
      newSocket.on('bid_placed', (data) => {
        logger.info('Bid placed:', data);
        // Handle bid placed event
      });

      newSocket.on('bid_outbid', (data) => {
        logger.info('Bid outbid:', data);
        // Handle outbid event
      });

      newSocket.on('auction_ended', (data) => {
        logger.info('Auction ended:', data);
        // Handle auction ended event
      });

      newSocket.on('auction_started', (data) => {
        logger.info('Auction started:', data);
        // Handle auction started event
      });

      newSocket.on('auction_status_changed', (data) => {
        logger.info('Auction status changed:', data);
        // Handle auction status change event
      });

      newSocket.on('auction_batch_processed', (data) => {
        logger.info('Auction batch processed:', data);
        // Handle batch processing event
      });

      newSocket.on('auction_extended', (data) => {
        logger.info('Auction extended:', data);
        // Handle auction extended event
      });

      // Message events
      newSocket.on('message_received', (data) => {
        console.log('📨 Socket: message_received event received:', data);
        logger.info('Message received:', data);
        // Handle new message event - this will be handled by MessageNotification component
      });

      newSocket.on('new_message_notification', (data) => {
        console.log('🔔 Socket: new_message_notification event received:', data);
        logger.info('New message notification:', data);
        // Handle new message notification - this will be handled by MessageNotification component
      });

      newSocket.on('conversation_created', (data) => {
        logger.info('Conversation created:', data);
        // Handle new conversation creation
      });

      newSocket.on('message_deleted', (data) => {
        logger.info('Message deleted:', data);
        // Handle message deletion
      });

      newSocket.on('conversation_closed', (data) => {
        logger.info('Conversation closed:', data);
        // Handle conversation closure
      });

      newSocket.on('user-typing', (data) => {
        logger.info('User typing:', data);
        // Handle typing indicator
      });

      newSocket.on('user_stopped_typing', (data) => {
        logger.info('User stopped typing:', data);
        // Handle typing stop indicator
      });

      // Notification events
      newSocket.on('notification', (data) => {
        logger.info('Notification received:', data);
        // Handle notification
      });

      // Test events
      newSocket.on('test_response', (data) => {
        logger.info('Test response received:', data);
        console.log('✅ Socket communication working!', data);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } else if (!state.isAuthenticated && socketRef.current) {
      console.log('Disconnecting socket due to logout...');
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection...');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [state.isAuthenticated]);

  // Socket methods
  const joinAuction = (auctionId: string) => {
    if (socket && isConnected) {
      socket.emit('join_auction', auctionId);
    }
  };

  const leaveAuction = (auctionId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_auction', auctionId);
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  const emitTyping = (conversationId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      const event = isTyping ? 'typing_start' : 'typing_stop';
      socket.emit(event, {
        conversationId,
        userId: state.user?.id,
      });
    }
  };

  const emitBid = (auctionId: string, amount: number) => {
    if (socket && isConnected) {
      socket.emit('new_bid', {
        auctionId,
        amount,
        bidderId: state.user?.id,
      });
    }
  };

  const emitMessage = (conversationId: string, content: string, type: string = 'TEXT', encryptionData?: any) => {
    if (socket && isConnected) {
      socket.emit('new_message', {
        conversationId,
        content,
        messageType: type,
        encryptionData,
      });
    }
  };

  const emitKeyExchange = (conversationId: string, toUserId: string, encryptedAESKey: string, keyId: string, publicKey: string) => {
    if (socket && isConnected) {
      socket.emit('key_exchange_request', {
        conversationId,
        toUserId,
        encryptedAESKey,
        keyId,
        publicKey,
      });
    }
  };

  const emitKeyExchangeResponse = (keyExchangeId: string, status: string = 'PROCESSED') => {
    if (socket && isConnected) {
      socket.emit('key_exchange_response', {
        keyExchangeId,
        status,
      });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinAuction,
    leaveAuction,
    joinConversation,
    leaveConversation,
    emitTyping,
    emitBid,
    emitMessage,
    emitKeyExchange,
    emitKeyExchangeResponse,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
