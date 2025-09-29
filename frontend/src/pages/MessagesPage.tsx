import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Badge,
  Alert,
  Skeleton,
  CircularProgress,
  Chip,
  Paper,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Send,
  AttachFile,
  MoreVert,
  Search,
  FilterList,
  Message,
  Person,
  Business,
  Gavel,
  ShoppingCart,
  Visibility,
  Delete,
  Archive,
  MarkAsUnread,
  Block,
  Report,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesAPI, productsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import LiquidGlassCard from '../components/LiquidGlassCard';
import { Conversation, Message as MessageType } from '../types';

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useAuth();
  const { socket, isConnected } = useSocket();
  const { showSuccess, showWarning, showError, markMessageNotificationsAsRead } = useNotification();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State management
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  // Get conversation ID from URL params
  const conversationId = searchParams.get('conversation');
  const productId = searchParams.get('product');
  const sellerId = searchParams.get('seller');

  // Debug logging
  console.log('MessagesPage URL params:', { conversationId, productId, sellerId });

  // Fetch product and seller data for new conversation
  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsAPI.getProduct(productId!),
    enabled: !!productId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // API Queries
  const { 
    data: conversations, 
    isLoading: conversationsLoading, 
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.getConversations(),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: messages, 
    isLoading: messagesLoading, 
    error: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => messagesAPI.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Get seller data from conversations list if available
  const sellerData = React.useMemo(() => {
    if (!conversations?.data?.data?.conversations || !sellerId) return null;
    
    // Find seller info from existing conversations
    const conversation = conversations.data.data.conversations.find((conv: any) => 
      conv.sellerId === sellerId || conv.buyerId === sellerId
    );
    
    if (conversation) {
      return {
        data: {
          data: {
            companyName: conversation.sellerId === sellerId 
              ? conversation.sellerAlias 
              : conversation.buyerAlias,
            profileImageUrl: conversation.sellerId === sellerId 
              ? conversation.seller?.profileImageUrl 
              : conversation.buyer?.profileImageUrl
          }
        }
      };
    }
    
    return null;
  }, [conversations, sellerId]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: { conversationId: string; content: string }) => 
      messagesAPI.sendMessage(data.conversationId, { content: data.content }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      const errorMessage = error.response?.data?.error || error.message;
      
      if (errorMessage.includes('closed conversation')) {
        showWarning('This conversation is closed. You cannot send messages.');
      } else {
        showError('Failed to send message');
      }
    },
  });

  // NEW: Mutation for sending message with automatic conversation creation
  const sendMessageWithConversationMutation = useMutation({
    mutationFn: (data: { productId: string; receiverId: string; content: string }) => 
      messagesAPI.sendMessageWithConversation(data),
    onSuccess: (response) => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Extract conversation ID from response and navigate to it
      const conversationId = response.data?.data?.conversationId;
      if (conversationId) {
        setSelectedConversation(conversationId);
        navigate(`/messages?conversation=${conversationId}`, { replace: true });
      }
      
      showSuccess('Message sent successfully!');
    },
    onError: (error: any) => {
      console.error('Send message with conversation error:', error);
      const errorMessage = error.response?.data?.error || error.message;
      showError(`Failed to send message: ${errorMessage}`);
    },
  });

  const closeConversationMutation = useMutation({
    mutationFn: (conversationId: string) => {
      console.log('🔒 Attempting to close conversation:', conversationId);
      return messagesAPI.closeConversation(conversationId);
    },
    onSuccess: (data) => {
      console.log('✅ Conversation closed successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setCloseConfirmOpen(false);
      showSuccess('Conversation closed successfully');
    },
    onError: (error: any) => {
      console.error('❌ Close conversation error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      showError('Failed to close conversation');
    },
  });

  const markConversationAsReadMutation = useMutation({
    mutationFn: (conversationId: string) => {
      console.log('📖 Marking conversation as read:', conversationId);
      return messagesAPI.markConversationAsRead(conversationId);
    },
    onSuccess: () => {
      console.log('✅ Conversation marked as read successfully');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
    },
    onError: (error: any) => {
      console.error('❌ Mark conversation as read error:', error);
      // Don't show error to user as this is a background operation
    },
  });

  // Archive functionality not implemented in API yet
  // const archiveConversationMutation = useMutation({
  //   mutationFn: (conversationId: string) => messagesAPI.archiveConversation(conversationId),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['conversations'] });
  //     setArchiveConfirmOpen(false);
  //     showSuccess('Conversation archived successfully');
  //   },
  //   onError: (error: any) => {
  //     console.error('Archive conversation error:', error);
  //     showError('Failed to archive conversation');
  //   },
  // });

  // Set selected conversation from URL params
  useEffect(() => {
    if (conversationId && conversationId !== selectedConversation) {
      setSelectedConversation(conversationId);
      // Mark conversation as read when opened from URL
      markConversationAsReadMutation.mutate(conversationId);
      // Mark message notifications as read for this conversation
      markMessageNotificationsAsRead(conversationId);
    }
  }, [conversationId, selectedConversation]);

  // Socket connection status handling
  useEffect(() => {
    if (socket && !isConnected) {
      showWarning('Socket connection lost. Messages may not appear in real-time.');
    }
  }, [socket, isConnected, showWarning]);

  // Join/leave conversation rooms when conversation changes
  useEffect(() => {
    if (socket && isConnected && selectedConversation) {
      socket.emit('join_conversation', selectedConversation);
      
      return () => {
        socket.emit('leave_conversation', selectedConversation);
      };
    }
  }, [socket, isConnected, selectedConversation]);

  // Socket event handlers
  useEffect(() => {
    if (socket && isConnected) {
      const handleNewMessage = (message: any) => {
        // If this message is for the currently selected conversation, refresh messages
        if (message.conversationId === selectedConversation) {
          queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
        }
        
        // Always refresh conversations list to update last message preview
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
        
        // Note: Notifications are handled by NotificationContext and MessageNotification components
        // No need to show additional notifications here to avoid duplicates
      };

      const handleMessageNotification = (data: any) => {
        // Refresh conversations list to show unread count
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
        
        // Note: Notifications are handled by NotificationContext and MessageNotification components
        // No need to show additional notifications here to avoid duplicates
      };

      const handleMessageDeleted = (data: any) => {
        if (data.conversationId === selectedConversation) {
          queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      const handleConversationClosed = (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        showSuccess('Conversation was closed');
      };

      const handleConversationCreated = (conversation: any) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        showSuccess('New conversation started');
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
  }, [socket, isConnected, selectedConversation, queryClient, state.user?.id, showSuccess, showWarning, navigate]);

  // Auto-scroll to bottom when new messages arrive or when sending a message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isSuccess]);

  // Event handlers
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    navigate(`/messages?conversation=${conversationId}`, { replace: true });
    
    // Mark conversation as read when opened
    markConversationAsReadMutation.mutate(conversationId);
    
    // Mark message notifications as read for this conversation
    markMessageNotificationsAsRead(conversationId);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // If we have product and seller info but no conversation, create new conversation
    if (productId && sellerId && !selectedConversation) {
      sendMessageWithConversationMutation.mutate({
        productId,
        receiverId: sellerId,
        content: newMessage.trim(),
      });
      return;
    }
    
    // If we have an existing conversation, send message to it
    if (selectedConversation) {
      // Check if conversation is closed
      if (currentConversation?.status === 'CLOSED') {
        showWarning('This conversation is closed. You cannot send messages.');
        return;
      }
      
      sendMessageMutation.mutate({
        conversationId: selectedConversation,
        content: newMessage.trim(),
      });
      return;
    }
    
    // No conversation and no product/seller info
    showError('Unable to send message. Please select a conversation or contact a seller.');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversationId: string) => {
    console.log('🔒 Menu opened for conversation:', conversationId);
    setAnchorEl(event.currentTarget);
    setSelectedConversationId(conversationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConversationId(null);
  };

  const handleCloseConversation = () => {
    console.log('🔒 HandleCloseConversation called with selectedConversationId:', selectedConversationId);
    if (selectedConversationId) {
      console.log('🔒 Opening close confirmation dialog...');
      setCloseConfirmOpen(true);
    } else {
      console.error('❌ No selectedConversationId found in handleCloseConversation!');
    }
  };

  // const handleArchiveConversation = () => {
  //   if (selectedConversationId) {
  //     setArchiveConfirmOpen(true);
  //   }
  // };

  const handleConfirmClose = () => {
    console.log('🔒 HandleConfirmClose called with selectedConversationId:', selectedConversationId);
    if (selectedConversationId) {
      console.log('🔒 Calling closeConversationMutation.mutate...');
      closeConversationMutation.mutate(selectedConversationId);
    } else {
      console.error('❌ No selectedConversationId found!');
    }
  };

  // const handleConfirmArchive = () => {
  //   if (selectedConversationId) {
  //     archiveConversationMutation.mutate(selectedConversationId);
  //   }
  // };

  // Filter conversations
  const filteredConversations = React.useMemo(() => {
    if (!conversations?.data?.data?.conversations) return [];
    
    let filtered = conversations.data.data.conversations;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((conv: Conversation) => 
        conv.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.buyer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.seller?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((conv: Conversation) => conv.status === filterStatus);
    }
    
    return filtered;
  }, [conversations, searchTerm, filterStatus]);

  // Get current conversation data
  const currentConversation = React.useMemo(() => {
    if (!conversations?.data?.data?.conversations || !selectedConversation) return null;
    return conversations.data.data.conversations.find((conv: Conversation) => conv.id === selectedConversation);
  }, [conversations, selectedConversation]);

  // Helper functions
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getUnreadCount = (conversation: Conversation) => {
    // Use the unreadCount field from backend if available, otherwise fallback to 0
    return conversation.unreadCount || 0;
  };

  const getOtherUser = (conversation: Conversation) => {
    if (!state.user) return null;
    return state.user.id === conversation.buyerId ? conversation.seller : conversation.buyer;
  };

  const getOtherUserAlias = (conversation: Conversation) => {
    if (!state.user) return '';
    return state.user.id === conversation.buyerId ? conversation.sellerAlias : conversation.buyerAlias;
  };


  // Loading state
  if (conversationsLoading) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="text" height={32} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="rectangular" height={200} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" height={400} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Error state
  if (conversationsError) {
    return (
      <Box>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetchConversations()}>
              Retry
            </Button>
          }
        >
          Failed to load conversations. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
      color: 'white'
    }}>
      {/* Header */}
      <PageHeader
        title="Messages"
        subtitle="Communicate with buyers and sellers"
      />


      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
          {/* Conversations List */}
          <Grid item xs={12} md={4}>
            <LiquidGlassCard 
              variant="default"
              hoverEffect={false}
              glassIntensity="medium"
              borderGlow={true}
              customSx={{
                height: '600px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Search and Filter */}
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <TextField
                  fullWidth
                  placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                          <Search sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </InputAdornment>
                    ),
                  }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(99, 102, 241, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6366f1',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.6)',
                        '&.Mui-focused': {
                          color: '#6366f1',
                        },
                      },
                    }}
                  />
                  
                  <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Status"
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(99, 102, 241, 0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                        },
                      }}
                    >
                      <MenuItem value="all">All Conversations</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Conversations List */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {filteredConversations.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {filteredConversations.map((conversation: Conversation) => {
                        const otherUser = getOtherUser(conversation);
                        const otherUserAlias = getOtherUserAlias(conversation);
                        const unreadCount = getUnreadCount(conversation);
                        const isSelected = selectedConversation === conversation.id;
                        
                        return (
                          <motion.div
                            key={conversation.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ListItem
                              button
                              onClick={() => handleConversationSelect(conversation.id)}
                              sx={{
                                borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                '&:hover': {
                                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.05)',
                                },
                                position: 'relative',
                              }}
                            >
                              <ListItemAvatar>
                                <Badge
                                  overlap="circular"
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                  badgeContent={
                                    unreadCount > 0 ? (
                                      <Chip
                                        label={unreadCount}
                                        size="small"
                                        sx={{
                                          backgroundColor: '#6366f1',
                                          color: 'white',
                                          fontSize: '0.75rem',
                                          height: 20,
                                          minWidth: 20,
                                        }}
                                      />
                                    ) : null
                                  }
                                >
                                  <Avatar
                                    src={getImageUrl(otherUser?.profileImageUrl, 'avatar')}
                                    alt={otherUserAlias}
                                    sx={{
                                      width: 48,
                                      height: 48,
                                      border: '2px solid rgba(99, 102, 241, 0.2)',
                                    }}
                                  >
                                    {otherUser?.companyName?.charAt(0) || 'U'}
                                  </Avatar>
                                </Badge>
                              </ListItemAvatar>
                              
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography
                                      variant="subtitle1"
                                      noWrap
                                      sx={{
                                        color: 'white',
                                        fontWeight: isSelected ? 600 : 500,
                                        flex: 1,
                                      }}
                                    >
                                      {otherUser?.companyName || 'Unknown Company'}
                                    </Typography>
                                    <Chip
                                      label={conversation.status}
                                      size="small"
                                      sx={{
                                        fontSize: '0.7rem',
                                        height: 20,
                                        minWidth: 'auto',
                                        backgroundColor: 
                                          conversation.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' :
                                          conversation.status === 'ARCHIVED' ? 'rgba(156, 163, 175, 0.2)' :
                                          conversation.status === 'CLOSED' ? 'rgba(239, 68, 68, 0.2)' :
                                          'rgba(156, 163, 175, 0.2)',
                                        color: 
                                          conversation.status === 'ACTIVE' ? '#22c55e' :
                                          conversation.status === 'ARCHIVED' ? '#9ca3af' :
                                          conversation.status === 'CLOSED' ? '#ef4444' :
                                          '#9ca3af',
                                        border: 
                                          conversation.status === 'ACTIVE' ? '1px solid rgba(34, 197, 94, 0.3)' :
                                          conversation.status === 'ARCHIVED' ? '1px solid rgba(156, 163, 175, 0.3)' :
                                          conversation.status === 'CLOSED' ? '1px solid rgba(239, 68, 68, 0.3)' :
                                          '1px solid rgba(156, 163, 175, 0.3)',
                                        '& .MuiChip-label': {
                                          px: 1,
                                        },
                                      }}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      noWrap
                                      sx={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        mb: 0.5,
                                      }}
                                    >
                          {conversation.product?.title || 'Unknown Product'}
                        </Typography>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Typography
                                        variant="caption"
                                        noWrap
                                        sx={{
                                          color: 'rgba(255, 255, 255, 0.6)',
                                          flex: 1,
                                        }}
                                      >
                                        {conversation.messages?.[0]?.content?.substring(0, 50) || 'No messages yet'}...
                                    </Typography>
                                      <Typography
                                        variant="caption"
                                sx={{
                                          color: 'rgba(255, 255, 255, 0.5)',
                                          ml: 1,
                                        }}
                                      >
                                        {conversation.messages?.[0] ? formatTime(conversation.messages[0].createdAt) : ''}
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                              
                                  <IconButton
                                    size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuOpen(e, conversation.id);
                                }}
                                sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                              >
                                <MoreVert />
                                  </IconButton>
                            </ListItem>
                          </motion.div>
                        );
                      })}
                    </List>
                  ) : (
                    <Box textAlign="center" py={8}>
                      <Message sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                          No conversations found
                        </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Start a conversation by contacting a seller from a product page.'
                        }
                        </Typography>
                      </Box>
                    )}
                </Box>
              </CardContent>
            </LiquidGlassCard>
          </Grid>

          {/* Messages Area */}
          <Grid item xs={12} md={8}>
            {(selectedConversation && currentConversation) || (productId && sellerId) ? (
              <LiquidGlassCard 
                variant="default"
                hoverEffect={false}
                glassIntensity="medium"
                borderGlow={true}
                customSx={{
                  height: '600px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Conversation Header */}
                  <Box sx={{ 
                    p: 3, 
                    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={getImageUrl(
                          currentConversation 
                            ? getOtherUser(currentConversation)?.profileImageUrl 
                            : sellerData?.data?.data?.profileImageUrl, 
                          'avatar'
                        )}
                        alt={currentConversation 
                          ? getOtherUserAlias(currentConversation) 
                          : sellerData?.data?.data?.companyName || 'Seller'
                        }
                        sx={{
                          width: 48,
                          height: 48,
                          border: '2px solid rgba(99, 102, 241, 0.2)',
                        }}
                      >
                        {currentConversation 
                          ? getOtherUser(currentConversation)?.companyName?.charAt(0) || 'U'
                          : sellerData?.data?.data?.companyName?.charAt(0) || 'S'
                        }
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                          {currentConversation 
                            ? getOtherUser(currentConversation)?.companyName || 'Unknown Company'
                            : sellerData?.data?.data?.companyName || 'Seller'
                          }
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {currentConversation 
                            ? currentConversation.product?.title || 'Unknown Product'
                            : productData?.data?.data?.title || 'Loading product...'
                          }
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      {currentConversation && (
                        <>
                          <Chip
                            label={currentConversation.status}
                            size="small"
                            color={currentConversation.status === 'ACTIVE' ? 'success' : 'default'}
                            sx={{
                              backgroundColor: currentConversation.status === 'ACTIVE' 
                                ? 'rgba(34, 197, 94, 0.1)' 
                                : 'rgba(255, 255, 255, 0.1)',
                              color: currentConversation.status === 'ACTIVE' ? '#22c55e' : 'rgba(255, 255, 255, 0.7)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/products/${currentConversation.product?.id}`)}
                            startIcon={<Visibility />}
                            sx={{
                              borderColor: 'rgba(99, 102, 241, 0.4)',
                          color: '#6366f1',
                          '&:hover': {
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          },
                        }}
                      >
                        View Product
                      </Button>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Messages */}
                  <Box 
                    ref={messagesEndRef}
                    sx={{ 
                      flex: 1, 
                      overflow: 'auto', 
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                  {!currentConversation && productId && sellerId ? (
                    // New conversation composition mode
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      flexDirection: 'column',
                      gap: 3,
                      p: 4
                    }}>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 1 }}>
                          Start a conversation with {sellerData?.data?.data?.companyName || 'the seller'}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                          Type your message below and press Enter to send
                        </Typography>
                      </Box>
                    </Box>
                  ) : messagesLoading ? (
                    <Box>
                        {Array.from({ length: 5 }).map((_, index) => (
                        <Box key={index} display="flex" gap={2} mb={2}>
                            <Skeleton variant="circular" width={40} height={40} />
                          <Box flex={1}>
                              <Skeleton variant="text" height={20} width="60%" />
                              <Skeleton variant="text" height={16} width="40%" />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                    ) : messagesError ? (
                      <Alert severity="error">
                        Failed to load messages. Please try again.
                      </Alert>
                    ) : messages?.data?.data?.messages && messages.data.data.messages.length > 0 ? (
                      messages.data.data.messages.map((message: MessageType) => {
                        const isOwnMessage = message.senderId === state.user?.id;
                        
                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Box
                            display="flex"
                              justifyContent={isOwnMessage ? 'flex-end' : 'flex-start'}
                              mb={1}
                            >
                            <Box
                              sx={{
                                maxWidth: '70%',
                                p: 2,
                                  borderRadius: 3,
                                  backgroundColor: isOwnMessage 
                                    ? 'rgba(99, 102, 241, 0.2)' 
                                    : 'rgba(255, 255, 255, 0.05)',
                                  border: isOwnMessage 
                                    ? '1px solid rgba(99, 102, 241, 0.3)' 
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                {message.content}
                              </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    display: 'block',
                                    textAlign: isOwnMessage ? 'right' : 'left',
                                    mt: 0.5,
                                  }}
                                >
                                  {formatTime(message.createdAt)}
                                  {isOwnMessage && message.readAt && ' • Read'}
                                </Typography>
                                  </Box>
                              </Box>
                          </motion.div>
                        );
                      })
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Message sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                            No messages yet
                          </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Start the conversation by sending a message below.
                          </Typography>
                        </Box>
                      )}
                </Box>

                {/* Conversation Closed Notice */}
                {currentConversation?.status === 'CLOSED' && (
                  <Box sx={{ 
                    p: 2, 
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderLeft: '4px solid #ef4444',
                  }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Block sx={{ color: '#ef4444', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500 }}>
                        This conversation has been closed. No new messages can be sent.
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Message Input */}
                  <Box sx={{ 
                    p: 3, 
                    borderTop: '1px solid rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-end',
                  }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder={
                        currentConversation?.status === 'CLOSED' 
                          ? "This conversation is closed" 
                          : productId && sellerId && !selectedConversation
                          ? "Type your message to start a new conversation..."
                          : "Type your message..."
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendMessageMutation.isPending || currentConversation?.status === 'CLOSED'}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                            >
                              <AttachFile />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#6366f1',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.6)',
                          '&.Mui-focused': {
                            color: '#6366f1',
                          },
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={
                        !newMessage.trim() || 
                        (sendMessageMutation.isPending || sendMessageWithConversationMutation.isPending) || 
                        currentConversation?.status === 'CLOSED'
                      }
                      startIcon={
                        (sendMessageMutation.isPending || sendMessageWithConversationMutation.isPending) 
                          ? <CircularProgress size={20} /> 
                          : <Send />
                      }
                      sx={{
                        background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5b5cf6, #7c3aed)',
                        },
                        '&:disabled': {
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    >
                      {currentConversation?.status === 'CLOSED' ? 'Closed' : 
                       sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                  </Box>
                </CardContent>
              </LiquidGlassCard>
            ) : (
              <LiquidGlassCard 
                variant="default"
                hoverEffect={false}
                glassIntensity="medium"
                borderGlow={true}
                customSx={{
                  height: '600px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box textAlign="center" py={8}>
                  {productId && sellerId ? (
                    // New conversation composition mode
                    <>
                      <Message sx={{ fontSize: 120, color: 'rgba(99, 102, 241, 0.6)', mb: 3 }} />
                      <Typography variant="h4" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}>
                        Start a New Conversation
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                        with {sellerData?.data?.data?.companyName || 'the seller'}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
                        {productData?.data?.data?.title || 'this product'}
                      </Typography>
                    </>
                  ) : (
                    // No conversation selected mode
                    <>
                      <Message sx={{ fontSize: 120, color: 'rgba(255, 255, 255, 0.3)', mb: 3 }} />
                      <Typography variant="h4" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                        Select a conversation
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 4 }}>
                        Choose a conversation from the list to start messaging
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/products')}
                        startIcon={<ShoppingCart />}
                        sx={{
                          background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #5b5cf6, #7c3aed)',
                          },
                        }}
                      >
                        Browse Products
                      </Button>
                    </>
                  )}
                </Box>
              </LiquidGlassCard>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Conversation Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: 'rgba(17, 17, 17, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            borderRadius: 2,
          },
        }}
      >
        {/* <MenuItem onClick={handleArchiveConversation}>
          <Archive sx={{ mr: 1 }} />
          Archive
        </MenuItem> */}
        {currentConversation?.status !== 'CLOSED' && (
          <MenuItem onClick={handleCloseConversation} sx={{ color: 'warning.main' }}>
            <Block sx={{ mr: 1 }} />
            Close
          </MenuItem>
        )}
        {currentConversation?.status === 'CLOSED' && (
          <MenuItem disabled sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <Block sx={{ mr: 1 }} />
            Conversation Closed
          </MenuItem>
        )}
      </Menu>

        {/* Close Confirmation Dialog */}
      <Dialog
        open={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(17, 17, 17, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>
          Close Conversation
          </DialogTitle>
          <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Are you sure you want to close this conversation? The conversation will be marked as closed and moved to the closed status.
          </Typography>
          </DialogContent>
          <DialogActions>
          <Button 
            onClick={() => setCloseConfirmOpen(false)}
            disabled={closeConversationMutation.isPending}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmClose}
            variant="contained"
            disabled={closeConversationMutation.isPending}
            startIcon={closeConversationMutation.isPending ? <CircularProgress size={20} /> : <Block />}
            sx={{
              background: 'linear-gradient(45deg, #f59e0b, #d97706)',
              '&:hover': {
                background: 'linear-gradient(45deg, #d97706, #b45309)',
              },
            }}
          >
            {closeConversationMutation.isPending ? 'Closing...' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog - Disabled for now */}
      {/* <Dialog
        open={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(17, 17, 17, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>
          Archive Conversation
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Are you sure you want to archive this conversation? You can unarchive it later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setArchiveConfirmOpen(false)}
            disabled={archiveConversationMutation.isPending}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmArchive}
            variant="contained"
            disabled={archiveConversationMutation.isPending}
            startIcon={archiveConversationMutation.isPending ? <CircularProgress size={20} /> : <Archive />}
            sx={{
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5b5cf6, #7c3aed)',
              },
            }}
          >
            {archiveConversationMutation.isPending ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog> */}
    </Box>
  );
};

export default MessagesPage;
