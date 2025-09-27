import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Backdrop,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Gavel,
  Timer,
  TrendingUp,
  Person,
  Visibility,
  Message,
  AttachMoney,
  ArrowBack,
  Refresh,
  Share,
  Favorite,
  FavoriteBorder,
  History,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsAPI, productsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import { Auction } from '../types';

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { state: authState } = useAuth();
  const { socket } = useSocket();
  const { showSuccess, showWarning } = useNotification();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [bidAmount, setBidAmount] = useState('');
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  // Fetch auction details
  const { 
    data: auction, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Auction>({
    queryKey: ['auction', id],
    queryFn: async () => {
      if (!id) throw new Error('Auction ID is required');
      const response = await auctionsAPI.getAuction(id);
      return response.data.data;
    },
    enabled: !!id,
    retry: 3,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds for live updates
  });

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!id) throw new Error('Auction ID is required');
      return await auctionsAPI.placeBid(id, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  // Watchlist mutation
  const watchlistMutation = useMutation({
    mutationFn: () => {
      if (!auction?.product?.id) throw new Error('Product ID is required');
      return productsAPI.toggleWatchlist(auction.product.id);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const action = response.data?.action;
      if (action === 'added') {
        showSuccess('Product added to watchlist!');
      } else if (action === 'removed') {
        showSuccess('Product removed from watchlist!');
      }
    },
    onError: (error: any) => {
      console.error('Watchlist mutation error:', error);
      showWarning('Unable to update watchlist. Please try again.');
    },
  });

  // Socket connection for real-time updates
  useEffect(() => {
    if (socket && id) {
      socket.emit('join-auction', id);
      
      socket.on('auction-updated', (data) => {
        if (data.auctionId === id) {
          queryClient.setQueryData(['auction', id], data.auction);
        }
      });

      socket.on('bid-placed', (data) => {
        if (data.auctionId === id) {
          queryClient.invalidateQueries({ queryKey: ['auction', id] });
        }
      });

      return () => {
        socket.emit('leave-auction', id);
        socket.off('auction-updated');
        socket.off('bid-placed');
      };
    }
  }, [socket, id, queryClient]);

  const handlePlaceBid = useCallback(async () => {
    if (!authState.isAuthenticated) {
      navigate('/login');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    try {
      await placeBidMutation.mutateAsync(amount);
      setBidAmount('');
    } catch (error) {
      console.error('Failed to place bid:', error);
    }
  }, [bidAmount, authState.isAuthenticated, navigate, placeBidMutation]);

  const handleWatchlistToggle = useCallback(async () => {
    if (!authState.isAuthenticated) {
      navigate('/login');
      return;
    }

    // If product is in watchlist, show confirmation dialog
    if (auction?.product?.isInWatchlist) {
      setRemoveConfirmOpen(true);
      return;
    }
    
    // If not in watchlist, add directly
    setWatchlistLoading(true);
    try {
      await watchlistMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  }, [authState.isAuthenticated, navigate, auction?.product?.isInWatchlist, watchlistMutation]);

  const handleConfirmRemove = useCallback(async () => {
    setRemoveConfirmOpen(false);
    setWatchlistLoading(true);
    try {
      await watchlistMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  }, [watchlistMutation]);

  const formatPrice = (price: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      INR: '₹',
      CNY: '¥',
      TRY: '₺',
    };
    return `${symbols[currency] || currency} ${price.toFixed(2)}`;
  };

  const getTimeRemaining = (endTime: string) => {
    if (!endTime) return 'No end time set';
    
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    
    // Check if date is valid
    if (isNaN(end)) return 'Invalid date';
    
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getProgressPercentage = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    // Check if dates are valid
    if (isNaN(start) || isNaN(end)) return 0;
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  const getAuctionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SCHEDULED':
        return 'info';
      case 'ENDED':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          open={true}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress 
              size={60} 
              thickness={4}
              sx={{ 
                color: '#6366F1',
                mb: 2
              }} 
            />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Loading Auction...
            </Typography>
          </Box>
        </Backdrop>
      </Box>
    );
  }

  if (error || !auction) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4
      }}>
        <Card sx={{ 
          maxWidth: 500, 
          p: 4,
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
        }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load auction details.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error?.message || 'Auction not found'}
          </Typography>
          <Box display="flex" gap={2}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/auctions')}
              startIcon={<ArrowBack />}
            >
              Back to Auctions
            </Button>
            <Button 
              variant="contained" 
              onClick={() => refetch()}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  const isActive = auction.status === 'ACTIVE';
  const canBid = isActive && authState.isAuthenticated;
  const timeRemaining = getTimeRemaining(auction.endsAt);
  const progressPercentage = getProgressPercentage(auction.startsAt || auction.startTime, auction.endsAt);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
      color: 'white'
    }}>
      {/* Header with Back Button */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)',
        py: 8,
        mb: 4,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '& > *': {
          position: 'relative',
          zIndex: 2,
        },
      }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          mb: 3
        }}>
          <IconButton 
            onClick={() => navigate('/auctions')}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Auction Details
          </Typography>
        </Box>
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 400,
            maxWidth: '600px', 
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          Participate in live bidding for textile materials
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Grid container spacing={4}>
          {/* Left Column - Product Images */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'rgba(17, 17, 17, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <CardMedia
                component="img"
                height="400"
                image={getImageUrl(auction.product?.images?.[0]?.imageUrl)}
                alt={auction.product?.title || 'Auction item'}
                sx={{ 
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getImageUrl(null);
                }}
              />
            </Card>
          </Grid>

          {/* Right Column - Auction Details */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Product Title and Status */}
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 1,
                    color: 'white'
                  }}
                >
                  {auction.product?.title || 'Untitled Auction'}
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Chip
                    icon={<Gavel />}
                    label={auction.status || 'ACTIVE'}
                    color={getAuctionStatusColor(auction.status)}
                    sx={{
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  />
                  <Chip
                    icon={<Timer />}
                    label={timeRemaining}
                    color={isActive ? 'success' : 'default'}
                    sx={{
                      backgroundColor: isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                      color: isActive ? '#4CAF50' : '#9E9E9E',
                      border: `1px solid ${isActive ? 'rgba(76, 175, 80, 0.3)' : 'rgba(158, 158, 158, 0.3)'}`,
                    }}
                  />
                </Box>
              </Box>

              {/* Description */}
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.6,
                }}
              >
                {auction.product?.description || 'No description available'}
              </Typography>

              {/* Current Bid */}
              <Card sx={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 2,
                p: 3,
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Current Bid
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: '#6366F1',
                    fontWeight: 700,
                  }}>
                    {formatPrice(auction.currentBid || auction.startingPrice || 0, auction.product?.currency || 'USD')}
                  </Typography>
                </Box>
                
                {isActive && (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Time Remaining
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                        {timeRemaining}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      color="primary"
                      sx={{
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                        },
                      }}
                    />
                  </>
                )}
              </Card>

              {/* Bid Form */}
              {canBid && (
                <Card sx={{
                  background: 'rgba(17, 17, 17, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 2,
                  p: 3,
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                    Place Your Bid
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <TextField
                      type="number"
                      placeholder="Enter bid amount"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handlePlaceBid}
                      disabled={placeBidMutation.isPending || !bidAmount}
                      startIcon={<Gavel />}
                      sx={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                        color: '#000000',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
                        }
                      }}
                    >
                      {placeBidMutation.isPending ? 'Placing...' : 'Place Bid'}
                    </Button>
                  </Box>
                </Card>
              )}

              {/* Action Buttons */}
              <Box display="flex" gap={2} flexWrap="wrap">
                {/* Only show Contact Seller button if current user is not the seller */}
                {authState.isAuthenticated && auction?.product?.seller?.id !== authState.user?.id && (
                  <Button
                    variant="outlined"
                    startIcon={<Message />}
                    onClick={() => navigate(`/messages?auction=${id}`)}
                    sx={{
                      borderColor: 'rgba(99, 102, 241, 0.4)',
                      color: '#6366F1',
                      '&:hover': {
                        borderColor: '#6366F1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      }
                    }}
                  >
                    Contact Seller
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={auction?.product?.isInWatchlist ? <Favorite /> : <FavoriteBorder />}
                  onClick={handleWatchlistToggle}
                  disabled={watchlistLoading}
                  sx={{
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    color: '#6366F1',
                    '&:hover': {
                      borderColor: '#6366F1',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    }
                  }}
                >
                  {auction?.product?.isInWatchlist ? 'Watching' : 'Watch'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  sx={{
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    color: '#6366F1',
                    '&:hover': {
                      borderColor: '#6366F1',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    }
                  }}
                >
                  Share
                </Button>
              </Box>

              {/* Seller Information */}
              <Card sx={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 2,
                p: 3,
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                  Seller Information
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ 
                    background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                  }}>
                    {auction.product?.seller?.companyName?.charAt(0) || 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                      {auction.product?.seller?.companyName || 'Unknown Seller'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {auction.product?.seller?.email || 'No email provided'}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* Auction Details */}
              <Card sx={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 2,
                p: 3,
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                  Auction Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Starting Price"
                      secondary={formatPrice(auction.startingPrice || 0, auction.product?.currency || 'USD')}
                      primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      secondaryTypographyProps={{ color: 'white', fontWeight: 600 }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Bid Count"
                      secondary={auction.bidCount || 0}
                      primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      secondaryTypographyProps={{ color: 'white', fontWeight: 600 }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Auction Type"
                      secondary={auction.auctionType || 'ENGLISH'}
                      primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      secondaryTypographyProps={{ color: 'white', fontWeight: 600 }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Start Time"
                      secondary={auction.startsAt || auction.startTime ? new Date(auction.startsAt || auction.startTime).toLocaleString() : 'Not set'}
                      primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      secondaryTypographyProps={{ color: 'white', fontWeight: 600 }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="End Time"
                      secondary={auction.endsAt ? new Date(auction.endsAt).toLocaleString() : 'Not set'}
                      primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      secondaryTypographyProps={{ color: 'white', fontWeight: 600 }}
                    />
                  </ListItem>
                </List>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Remove from Watchlist Confirmation Dialog */}
      <Dialog
        open={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove from Watchlist</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this product from your watchlist?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRemoveConfirmOpen(false)}
            disabled={watchlistLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemove}
            color="error"
            variant="contained"
            disabled={watchlistLoading}
          >
            {watchlistLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuctionDetailPage;
