import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ConversationsResponse, MessagesResponse, Conversation, Message as MessageType } from '../types';

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { t } = useLanguage();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversationsResponse, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.getConversations(),
  });

  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => messagesAPI.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
  });

  const conversations: ConversationsResponse | undefined = conversationsResponse?.data?.data;
  const messages: MessagesResponse | undefined = messagesResponse?.data?.data;

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
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communicate with buyers and sellers anonymously
        </Typography>
      </Box>

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
                    .filter((conv: Conversation) =>
                      conv.product?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conv.buyer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conv.seller?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .length > 0 ? (
                    (conversations?.conversations || [])
                      .filter((conv: Conversation) =>
                        conv.product?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        conv.buyer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        conv.seller?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((conversation: Conversation) => (
                        <React.Fragment key={conversation.id}>
                          <ListItem
                            button
                            selected={selectedConversation === conversation.id}
                            onClick={() => setSelectedConversation(conversation.id)}
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
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar>
                    <Business />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {conversations?.conversations?.find((c: Conversation) => c.id === selectedConversation)?.product?.title || 'Conversation'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {conversations?.conversations?.find((c: Conversation) => c.id === selectedConversation)?.buyer?.companyName || 'Buyer'} • {' '}
                      {conversations?.conversations?.find((c: Conversation) => c.id === selectedConversation)?.seller?.companyName || 'Seller'}
                    </Typography>
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
                            }}
                          >
                            <Typography variant="body1">
                              {message.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: message.sender?.id === state.user?.id ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                              }}
                            >
                              {formatTime(message.createdAt)}
                            </Typography>
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
                  />
                  <Button variant="outlined" size="small">
                    <AttachFile />
                  </Button>
                  <Button variant="outlined" size="small">
                    <Image />
                  </Button>
                  <Button variant="contained" size="small">
                    <Send />
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
    </Box>
  );
};

export default MessagesPage;
