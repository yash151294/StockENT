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
  RestartAlt,
  Info,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionsAPI, productsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import { Auction } from '../types';
import NumericInput from '../components/NumericInput';
import CalendarInput from '../components/CalendarInput';
import LiquidGlassCard from '../components/LiquidGlassCard';

const AuctionDetailPage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
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
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [restartStartTime, setRestartStartTime] = useState('');
  const [restartEndTime, setRestartEndTime] = useState('');
  const [restartErrors, setRestartErrors] = useState<{ [key: string]: string }>({});

  // Fetch auction details with improved throttling and error handling
  const { 
    data: auction, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Auction>({
    queryKey: ['auction', id],
    queryFn: async () => {
      if (!id) throw new Error('Auction ID is required');
      
      try {
        const response = await auctionsAPI.getAuction(id);
        return response.data.data;
      } catch (error: any) {
        // Handle authentication errors specifically
        if (error.response?.status === 401) {
          console.warn('🚫 Authentication failed, user may need to log in again');
          // Don't throw the error immediately, let the auth context handle it
          throw new Error('Authentication failed. Please log in again.');
        }
        throw error;
      }
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication failed')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    staleTime: 15 * 1000, // 15 seconds - longer to reduce requests
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      const jitter = Math.random() * 1000;
      return baseDelay + jitter;
    },
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

  // Restart auction mutation
  const restartAuctionMutation = useMutation({
    mutationFn: async (data?: { startTime?: string; endTime?: string }) => {
      if (!id) throw new Error('Auction ID is required');
      return await auctionsAPI.restartAuction(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSuccess('Auction restarted successfully!');
      setRestartConfirmOpen(false);
      // Reset form
      setRestartStartTime('');
      setRestartEndTime('');
      setRestartErrors({});
    },
    onError: (error: any) => {
      console.error('Restart auction error:', error);
      showWarning(error.response?.data?.error || 'Failed to restart auction');
    },
  });

  // Handle authentication failures
  useEffect(() => {
    if (error && (error as any)?.response?.status === 401) {
      console.warn('🚫 Authentication failed, redirecting to login...');
      router.replace('/login');
    }
  }, [error, router]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (socket && id) {
      socket.emit('join-auction', id);
      
      socket.on('auction-updated', (data) => {
        if (data.auctionId === id) {
          queryClient.setQueryData(['auction', id], data.auction);
        }
      });

      socket.on('bid_placed', (data) => {
        if (data.auctionId === id) {
          queryClient.invalidateQueries({ queryKey: ['auction', id] });
        }
      });

      socket.on('auction_status_changed', (data) => {
        if (data.auctionId === id) {
          console.log('Auction status changed:', data);
          // Force immediate refetch to get updated auction data
          queryClient.invalidateQueries({ queryKey: ['auction', id] });
          // Also invalidate auctions list to update the main page
          queryClient.invalidateQueries({ queryKey: ['auctions'] });
        }
      });

      socket.on('auction_started', (data) => {
        if (data.auctionId === id) {
          console.log('Auction started:', data);
          // Force immediate refetch to get updated auction data
          queryClient.invalidateQueries({ queryKey: ['auction', id] });
          // Also invalidate auctions list to update the main page
          queryClient.invalidateQueries({ queryKey: ['auctions'] });
        }
      });

      socket.on('auction_ended', (data) => {
        if (data.auctionId === id) {
          console.log('Auction ended:', data);
          // Force immediate refetch to get updated auction data
          queryClient.invalidateQueries({ queryKey: ['auction', id] });
          // Also invalidate auctions list to update the main page
          queryClient.invalidateQueries({ queryKey: ['auctions'] });
        }
      });

      socket.on('auction_restarted', (data) => {
        if (data.auctionId === id) {
          console.log('Auction restarted:', data);
          // Force immediate refetch to get updated auction data
          queryClient.invalidateQueries({ queryKey: ['auction', id] });
          // Also invalidate auctions list to update the main page
          queryClient.invalidateQueries({ queryKey: ['auctions'] });
        }
      });

      return () => {
        socket.emit('leave-auction', id);
        socket.off('auction-updated');
        socket.off('bid_placed');
        socket.off('auction_status_changed');
        socket.off('auction_started');
        socket.off('auction_ended');
        socket.off('auction_restarted');
      };
    }
  }, [socket, id, queryClient]);

  const handlePlaceBid = useCallback(async () => {
    if (!authState.isAuthenticated) {
      router.push('/login');
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
  }, [bidAmount, authState.isAuthenticated, router, placeBidMutation]);

  const handleWatchlistToggle = useCallback(async () => {
    if (!authState.isAuthenticated) {
      router.push('/login');
      return;
    }

    // Don't allow sellers to add their own products to watchlist
    if (authState.user?.role === 'SELLER' && auction?.product?.seller?.id === authState.user.id) {
      showWarning('You cannot add your own products to watchlist.');
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
  }, [authState.isAuthenticated, authState.user, router, auction?.product?.isInWatchlist, auction?.product?.seller?.id, watchlistMutation, showWarning]);

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

  const handleRestartAuction = useCallback(() => {
    if (!authState.isAuthenticated) {
      router.push('/login');
      return;
    }
    setRestartConfirmOpen(true);
  }, [authState.isAuthenticated, router]);

  const validateRestartTimes = () => {
    const newErrors: { [key: string]: string } = {};

    if (restartStartTime && restartEndTime) {
      const startTime = new Date(restartStartTime);
      const endTime = new Date(restartEndTime);
      const now = new Date();

      if (startTime <= now) {
        newErrors.startTime = 'Start time must be in the future';
      }
      if (endTime <= startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setRestartErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmRestart = useCallback(async () => {
    if (restartStartTime && restartEndTime) {
      if (!validateRestartTimes()) {
        return;
      }
      try {
        await restartAuctionMutation.mutateAsync({
          startTime: restartStartTime,
          endTime: restartEndTime
        });
      } catch (error) {
        console.error('Failed to restart auction:', error);
      }
    } else {
      // Use default restart (immediate)
      try {
        await restartAuctionMutation.mutateAsync(undefined);
      } catch (error) {
        console.error('Failed to restart auction:', error);
      }
    }
  }, [restartAuctionMutation, restartStartTime, restartEndTime]);

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
              onClick={() => router.push('/auctions')}
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
  const isSeller = authState.isAuthenticated && auction?.product?.seller?.id === authState.user?.id;
  const canBid = isActive && authState.isAuthenticated && !isSeller;
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
            onClick={() => router.push('/auctions')}
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
          {/* Left Column - Product Images and Auction Details */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
              {/* Product Image Card */}
              <LiquidGlassCard
                variant="default"
                hoverEffect={true}
                glassIntensity="high"
                customSx={{
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
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
              </LiquidGlassCard>

              {/* Auction Details Card */}
              <LiquidGlassCard
                variant="default"
                hoverEffect={true}
                glassIntensity="high"
                customSx={{
                  flex: 1,
                  p: 3,
                }}
              >
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
              </LiquidGlassCard>
            </Box>
          </Grid>

          {/* Right Column - Product Details and Bidding */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
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
              <LiquidGlassCard
                variant="default"
                hoverEffect={true}
                glassIntensity="high"
                customSx={{
                  p: 3,
                }}
              >
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
              </LiquidGlassCard>

              {/* Bid Form */}
              {canBid && (
                <LiquidGlassCard
                  variant="default"
                  hoverEffect={true}
                  glassIntensity="high"
                  customSx={{
                    p: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                    Place Your Bid
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <NumericInput
                      placeholder="Enter bid amount per unit"
                      value={bidAmount}
                      onChange={setBidAmount}
                      allowDecimals={true}
                      allowNegative={false}
                      min={0}
                      step={0.01}
                      precision={2}
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
                </LiquidGlassCard>
              )}

              {/* Seller Notice */}
              {isActive && isSeller && (
                <LiquidGlassCard
                  variant="default"
                  hoverEffect={true}
                  glassIntensity="high"
                  customSx={{
                    p: 3,
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    background: 'rgba(255, 193, 7, 0.05)',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Info sx={{ color: '#FFC107', fontSize: 24 }} />
                    <Typography variant="body1" sx={{ color: '#FFC107', fontWeight: 500 }}>
                      You cannot bid on your own auction. This auction is for other buyers to participate.
                    </Typography>
                  </Box>
                </LiquidGlassCard>
              )}

              {/* Action Buttons */}
              <Box display="flex" gap={2} flexWrap="wrap">
                {/* Only show Contact Seller button if current user is not the seller */}
                {authState.isAuthenticated && auction?.product?.seller?.id !== authState.user?.id && (
                  <Button
                    variant="outlined"
                    startIcon={<Message />}
                    onClick={() => router.push(`/messages?auction=${id}`)}
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
                
                {/* Only show watchlist button for buyers or sellers viewing other sellers' auctions */}
                {(authState.user?.role !== 'SELLER' || auction?.product?.seller?.id !== authState.user?.id) && (
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
                )}
                
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

                {/* Restart Auction Button - Only show for ended auctions and if user is the seller */}
                {auction?.status === 'ENDED' && authState.isAuthenticated && auction?.product?.seller?.id === authState.user?.id && (
                  <Button
                    variant="contained"
                    startIcon={<RestartAlt />}
                    onClick={handleRestartAuction}
                    disabled={restartAuctionMutation.isPending}
                    sx={{
                      background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D97706 0%, #EA580C 100%)',
                      }
                    }}
                  >
                    {restartAuctionMutation.isPending ? 'Restarting...' : 'Restart Auction'}
                  </Button>
                )}
              </Box>

              {/* Seller Information */}
              <LiquidGlassCard
                variant="default"
                hoverEffect={true}
                glassIntensity="high"
                customSx={{
                  p: 3,
                  flex: 1,
                }}
              >
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
              </LiquidGlassCard>
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

      {/* Restart Auction Confirmation Dialog */}
      <Dialog
        open={restartConfirmOpen}
        onClose={() => setRestartConfirmOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Restart Auction</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Choose when you want to restart this auction. You can either restart immediately or schedule it for later.
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Auction Schedule
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <CalendarInput
                fullWidth
                label="New Start Time"
                value={restartStartTime}
                onChange={(value) => {
                  setRestartStartTime(value);
                  if (restartErrors.startTime) {
                    setRestartErrors(prev => ({ ...prev, startTime: '' }));
                  }
                }}
                error={!!restartErrors.startTime}
                helperText={restartErrors.startTime || 'Leave empty to restart immediately'}
                format="datetime-local"
                minDate={new Date().toISOString().slice(0, 16)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <CalendarInput
                fullWidth
                label="New End Time"
                value={restartEndTime}
                onChange={(value) => {
                  setRestartEndTime(value);
                  if (restartErrors.endTime) {
                    setRestartErrors(prev => ({ ...prev, endTime: '' }));
                  }
                }}
                error={!!restartErrors.endTime}
                helperText={restartErrors.endTime || 'Leave empty to use original duration'}
                format="datetime-local"
                minDate={restartStartTime || new Date().toISOString().slice(0, 16)}
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>What will happen:</strong>
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
              <Typography component="li" variant="body2">Reset the auction to active status</Typography>
              <Typography component="li" variant="body2">Clear all previous bids</Typography>
              <Typography component="li" variant="body2">
                {restartStartTime && restartEndTime 
                  ? 'Use your custom start and end times' 
                  : 'Use immediate start with original duration'
                }
              </Typography>
              <Typography component="li" variant="body2">Make the product available for bidding again</Typography>
            </Box>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRestartConfirmOpen(false);
              setRestartStartTime('');
              setRestartEndTime('');
              setRestartErrors({});
            }}
            disabled={restartAuctionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRestart}
            color="warning"
            variant="contained"
            disabled={restartAuctionMutation.isPending}
            startIcon={<RestartAlt />}
          >
            {restartAuctionMutation.isPending ? 'Restarting...' : 'Restart Auction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuctionDetailPage;
