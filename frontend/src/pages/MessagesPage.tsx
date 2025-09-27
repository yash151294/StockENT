import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Message,
  Person,
  Business,
  AttachMoney,
  ShoppingCart,
  Gavel,
  Send,
  AttachFile,
  Image,
  Lock,
  Delete,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ConversationsResponse, MessagesResponse, Conversation, Message as MessageType } from '../types';
import PageHeader from '../components/PageHeader';

const MessagesPage: React.FC = () => {
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'message' | 'conversation' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: conversationsResponse, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.getConversations(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => messagesAPI.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Get conversations data first
  const conversations: ConversationsResponse | undefined = conversationsResponse?.data?.data;

  // Fetch individual conversation data if not found in conversations list
  const { data: individualConversationResponse } = useQuery({
    queryKey: ['conversation', selectedConversation],
    queryFn: () => messagesAPI.getConversation(selectedConversation!),
    enabled: !!selectedConversation && !conversations?.conversations?.find((c: Conversation) => c.id === selectedConversation),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; type?: string }) => 
      messagesAPI.sendMessage(selectedConversation!, data),
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', selectedConversation] });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', selectedConversation]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['messages', selectedConversation], (old: any) => {
        if (!old) return old;
        const newMessageData = {
          id: `temp-${Date.now()}`,
          conversationId: selectedConversation!,
          senderId: state.user?.id!,
          content: newMessage.content,
          messageType: newMessage.type || 'TEXT',
          attachments: [],
          readAt: null,
          createdAt: new Date().toISOString(),
          isEncrypted: false,
          sender: {
            id: state.user?.id!,
            companyName: state.user?.companyName,
            country: state.user?.country
          }
        };
        return {
          ...old,
          data: {
            ...old.data,
            messages: [...(old.data.messages || []), newMessageData]
          }
        };
      });
      
      return { previousMessages };
    },
    onSuccess: (response) => {
      console.log('✅ Message sent successfully:', response.data);
      // Invalidate to get the real data from server
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Clear the message input
      setMessageText('');
      setSendingMessage(false);
    },
    onError: (error, newMessage, context) => {
      console.error('❌ Failed to send message:', error);
      // Revert the optimistic update
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', selectedConversation], context.previousMessages);
      }
      setSendingMessage(false);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) => 
      messagesAPI.deleteMessage(conversationId, messageId),
    onSuccess: () => {
      console.log('🗑️ Message deleted successfully, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Invalidate dashboard data
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: string) => messagesAPI.deleteConversation(conversationId),
    onSuccess: () => {
      console.log('🗑️ Conversation deleted successfully, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Invalidate dashboard data
      setSelectedConversation(null);
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error);
    },
  });

  const messages: MessagesResponse | undefined = messagesResponse?.data?.data;

  // Helper function to get current conversation data
  const getCurrentConversation = () => {
    if (!selectedConversation) return null;
    
    // First try to find in conversations list
    const conversationFromList = conversations?.conversations?.find((c: Conversation) => c.id === selectedConversation);
    if (conversationFromList) {
      return conversationFromList;
    }
    
    // Fallback to individual conversation data
    return individualConversationResponse?.data?.data || null;
  };

  const currentConversation = getCurrentConversation();


  // Handle URL parameters to auto-select conversation
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    
    if (conversationId) {
      // Always set the conversation ID from URL, regardless of whether conversations are loaded
      setSelectedConversation(conversationId);
    }
  }, [searchParams]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sendingMessage) {
      return;
    }

    setSendingMessage(true);
    try {
      await sendMessageMutation.mutateAsync({
        content: messageText.trim(),
        type: 'TEXT'
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = (messageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteType('message');
    setDeleteTargetId(messageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConversation = (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteType('conversation');
    setDeleteTargetId(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTargetId || !deleteType) return;

    if (deleteType === 'message' && selectedConversation) {
      deleteMessageMutation.mutate({ conversationId: selectedConversation, messageId: deleteTargetId });
    } else if (deleteType === 'conversation') {
      deleteConversationMutation.mutate(deleteTargetId);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteType(null);
    setDeleteTargetId(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getListingTypeIcon = (type: string) => {
    switch (type) {
      case 'FIXED_PRICE':
        return <ShoppingCart />;
      case 'AUCTION':
        return <Gavel />;
      case 'NEGOTIABLE':
        return <AttachMoney />;
      default:
        return <ShoppingCart />;
    }
  };

  const getListingTypeColor = (type: string) => {
    switch (type) {
      case 'FIXED_PRICE':
        return 'success';
      case 'AUCTION':
        return 'secondary';
      case 'NEGOTIABLE':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error">
          Failed to load conversations. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="Messages"
        subtitle="Communicate with buyers and sellers anonymously"
      />

      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              {isLoading ? (
                <List>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Skeleton variant="circular" width={40} height={40} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Skeleton variant="text" width="80%" />}
                        secondary={<Skeleton variant="text" width="60%" />}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <List>
                  {(conversations?.conversations || [])
                    .filter((conv: Conversation) => {
                      // Only show conversations that have actual messages
                      const hasMessages = conv._count?.messages && conv._count.messages > 0;
                      
                      // Apply search filter
                      const matchesSearch = 
                        conv.product?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        conv.buyer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        conv.seller?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      return hasMessages && matchesSearch;
                    })
                    .length > 0 ? (
                    (conversations?.conversations || [])
                      .filter((conv: Conversation) => {
                        // Only show conversations that have actual messages
                        const hasMessages = conv._count?.messages && conv._count.messages > 0;
                        
                        // Apply search filter
                        const matchesSearch = 
                          conv.product?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          conv.buyer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          conv.seller?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
                        
                        return hasMessages && matchesSearch;
                      })
                      .map((conversation: Conversation) => (
                        <React.Fragment key={conversation.id}>
                          <ListItem
                            button
                            selected={selectedConversation === conversation.id}
                            onClick={() => setSelectedConversation(conversation.id)}
                            sx={{
                              '&:hover .conversation-delete-button': {
                                opacity: 1,
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Badge
                                badgeContent={conversation._count?.messages || 0}
                                color="primary"
                                invisible={(conversation._count?.messages || 0) === 0}
                              >
                                <Avatar>
                                  <Business />
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle1" noWrap>
                                    {conversation.product?.title || 'Unknown Product'}
                                  </Typography>
                                  <Chip
                                    icon={getListingTypeIcon(conversation.product?.listingType || 'FIXED_PRICE')}
                                    label={conversation.product?.listingType?.replace('_', ' ') || 'Unknown'}
                                    size="small"
                                    color={getListingTypeColor(conversation.product?.listingType || 'FIXED_PRICE')}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {conversation.messages?.[0]?.content || 'No messages yet'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {conversation.messages?.[0]?.createdAt
                                      ? formatTime(conversation.messages[0].createdAt)
                                      : formatTime(conversation.updatedAt)}
                                  </Typography>
                                </Box>
                              }
                            />
                            <Box
                              className="conversation-delete-button"
                              sx={{
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                              }}
                            >
                              <Tooltip title="Delete conversation">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                                >
                                  <Delete sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Message sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No conversations found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery ? 'No conversations match your search.' : 'Start a conversation by viewing a product.'}
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Messages */}
        <Grid item xs={12} md={8}>
          {selectedConversation ? (
            <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
              {/* Conversation Header */}
              <CardContent sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {currentConversation?.product?.title || 'Conversation'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentConversation?.buyer?.companyName || 'Buyer'} • {' '}
                        {currentConversation?.seller?.companyName || 'Seller'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Actions */}
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      icon={<Lock />}
                      label="End-to-End Encrypted"
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                    <Tooltip title="Delete conversation">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteConversation(selectedConversation!, e)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>

              {/* Messages List */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messagesLoading ? (
                  <Box>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Box key={index} display="flex" gap={2} mb={2}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Box flex={1}>
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box>
                    {(messages?.messages || []).length > 0 ? (
                      (messages?.messages || []).map((message: MessageType) => (
                        <Box
                          key={message.id}
                          display="flex"
                          gap={2}
                          mb={2}
                          justifyContent={message.sender?.id === state.user?.id ? 'flex-end' : 'flex-start'}
                        >
                          {message.sender?.id !== state.user?.id && (
                            <Avatar 
                              sx={{ width: 32, height: 32 }}
                              src={message.sender?.profileImageUrl}
                              alt={message.sender?.contactPerson || message.sender?.companyName || message.sender?.email || 'User'}
                            >
                              <Person />
                            </Avatar>
                          )}
                          <Box
                            sx={{
                              maxWidth: '70%',
                              p: 2,
                              borderRadius: 2,
                              bgcolor: message.sender?.id === state.user?.id ? 'primary.main' : 'grey.100',
                              color: message.sender?.id === state.user?.id ? 'white' : 'text.primary',
                              position: 'relative',
                              '&:hover .delete-button': {
                                opacity: 1,
                              },
                            }}
                          >
                            <Typography variant="body1">
                              {message.content}
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: message.sender?.id === state.user?.id ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                                }}
                              >
                                {formatTime(message.createdAt)}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                {message.isEncrypted && (
                                  <>
                                    <Lock sx={{ fontSize: 12, color: message.sender?.id === state.user?.id ? 'rgba(255,255,255,0.7)' : 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ color: message.sender?.id === state.user?.id ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                                      E2E
                                    </Typography>
                                  </>
                                )}
                                <Tooltip title="Delete message">
                                  <IconButton
                                    className="delete-button"
                                    size="small"
                                    sx={{
                                      opacity: 0,
                                      transition: 'opacity 0.2s',
                                      color: message.sender?.id === state.user?.id ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                                      '&:hover': {
                                        color: message.sender?.id === state.user?.id ? 'white' : 'error.main',
                                      },
                                    }}
                                    onClick={(e) => handleDeleteMessage(message.id, e)}
                                  >
                                    <Delete sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </Box>
                          {message.sender?.id === state.user?.id && (
                            <Avatar 
                              sx={{ width: 32, height: 32 }}
                              src={state.user?.profileImageUrl}
                              alt={state.user?.contactPerson || state.user?.companyName || state.user?.email}
                            >
                              <Person />
                            </Avatar>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Box textAlign="center" py={4}>
                        <Message sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          No messages yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Start the conversation by sending your first message.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Message Input */}
              <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    variant="outlined"
                    size="small"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage}
                    multiline
                    maxRows={3}
                  />
                  <Button 
                    variant="outlined" 
                    size="small"
                    disabled={sendingMessage}
                  >
                    <AttachFile />
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    disabled={sendingMessage}
                  >
                    <Image />
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                  >
                    {sendingMessage ? 'Sending...' : <Send />}
                  </Button>
                </Box>
              </Box>
            </Card>
          ) : (
            <Card sx={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box textAlign="center">
                <Message sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Select a conversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a conversation from the list to start messaging
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete {deleteType === 'message' ? 'Message' : 'Conversation'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {deleteType === 'message' 
              ? 'Are you sure you want to delete this message? This action cannot be undone.'
              : 'Are you sure you want to delete this conversation? This will delete all messages in the conversation and cannot be undone.'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteMessageMutation.isPending || deleteConversationMutation.isPending}
          >
            {deleteMessageMutation.isPending || deleteConversationMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessagesPage;
