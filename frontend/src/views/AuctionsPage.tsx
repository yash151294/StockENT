import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
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
  Tabs,
  Tab,
  Skeleton,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Fade,
  Backdrop,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Gavel,
  Timer,
  TrendingUp,
  Person,
  Visibility,
  Message,
  Search,
  Sort,
  AttachMoney,
  Refresh,
} from '@mui/icons-material';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auctionsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useRealtimeAuctions } from '../hooks/useRealtimeAuctions';
import { getImageUrl } from '../utils/imageUtils';
import PageHeader from '../components/PageHeader';
import LiquidGlassCard from '../components/LiquidGlassCard';
import { Auction } from '../types';


// Memoized AuctionCard component for better performance
const AuctionCard = memo(({ auction, onView, onBid, formatPrice, getAuctionStatusColor, getTimeRemaining, getProgressPercentage, currentUserId }: {
  auction: Auction;
  onView: (id: string) => void;
  onBid: (id: string) => void;
  formatPrice: (price: number, currency: string) => string;
  getAuctionStatusColor: (status: string) => any;
  getTimeRemaining: (endTime: string) => string;
  getProgressPercentage: (startTime: string, endTime: string) => number;
  currentUserId?: string;
}) => {
  const theme = useTheme();
  
  return (
    <LiquidGlassCard
      variant="default"
      hoverEffect={true}
      glassIntensity="medium"
      borderGlow={true}
      onClick={() => onView(auction.id)}
      customSx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
    >
      <CardMedia
        component="img"
        height="160"
        image={getImageUrl(auction.product?.images?.[0]?.imageUrl)}
        alt={auction.product?.title || 'Auction item'}
        sx={{ 
          objectFit: 'cover',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = getImageUrl(null);
        }}
      />
      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1.5}>
          <Typography 
            variant="subtitle1" 
            component="h3" 
            noWrap 
            sx={{ 
              flex: 1, 
              mr: 1,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            {auction.product?.title || 'Untitled Auction'}
          </Typography>
          <Chip
            icon={<Gavel />}
            label={auction.status || 'ACTIVE'}
            size="small"
            color={getAuctionStatusColor(auction.status)}
            sx={{
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: '#6366F1',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.75rem',
              height: 24,
            }}
          />
        </Box>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 1.5,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.85rem',
          }}
        >
          {auction.product?.description?.substring(0, 80) || 'No description available'}...
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#6366F1',
              fontWeight: 700,
              fontSize: '1.1rem',
            }}
          >
            {formatPrice(auction.currentBid || auction.startingPrice || 0, auction.product?.currency || 'USD')}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
            }}
          >
            Current Bid
          </Typography>
        </Box>

        {auction.status === 'ACTIVE' && auction.endsAt && (
          <Box mb={1.5}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                Time Remaining
              </Typography>
              <Typography variant="caption" fontWeight="medium" sx={{ color: 'white', fontSize: '0.75rem' }}>
                {getTimeRemaining(auction.endsAt)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgressPercentage(auction.startsAt || auction.startTime, auction.endsAt)}
              color="primary"
              sx={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                height: 4,
                borderRadius: 2,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography 
            variant="caption" 
            noWrap
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
              maxWidth: '60%',
            }}
          >
            {auction.product?.seller?.companyName || 'Unknown Seller'}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
            }}
          >
            {auction.auctionType || 'ENGLISH'}
          </Typography>
        </Box>
        
        <Box display="flex" gap={1} mt="auto">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={(e) => {
              e.stopPropagation();
              onView(auction.id);
            }}
            sx={{
              borderColor: 'rgba(99, 102, 241, 0.4)',
              color: '#6366F1',
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              '&:hover': {
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
              }
            }}
          >
            View
          </Button>
          {/* Only show bid button if current user is not the seller */}
          {currentUserId !== auction.product?.seller?.id && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Gavel />}
              onClick={(e) => {
                e.stopPropagation();
                onBid(auction.id);
              }}
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                color: '#000000',
                fontSize: '0.75rem',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
                }
              }}
            >
              Bid
            </Button>
          )}
        </Box>
      </CardContent>
    </LiquidGlassCard>
  );
});

AuctionCard.displayName = 'AuctionCard';

const AuctionsPage: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { state: authState } = useAuth();
  const { socket, isConnected } = useSocket();
  const { invalidateAllAuctions, updateAuctionInCache, updateAuctionData } = useRealtimeAuctions();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const isTablet = useMediaQuery(useTheme().breakpoints.down('md'));

  // Check if we should show only user's auctions
  const showMyAuctions = searchParams.get('my') === 'true' || authState.user?.role === 'SELLER';
  
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    currency: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });


  // Local state to prevent flickering and enable instant tab switching
  const [displayData, setDisplayData] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [localAuctionsCache, setLocalAuctionsCache] = useState<{ [key: string]: Auction[] }>({});
  const previousDataRef = useRef<any>(null);

  // Enhanced query with improved throttling and error handling
  const { 
    data: auctions, 
    isLoading, 
    error, 
    refetch,
    isFetching,
    isError 
  } = useQuery({
    queryKey: ['auctions', activeTab, page, retryCount, searchQuery, filters, showMyAuctions],
    queryFn: async () => {
      console.log('🔄 Fetching auctions...', { activeTab, page, status: activeTab === 0 ? 'ACTIVE' : activeTab === 1 ? 'SCHEDULED' : 'ENDED', showMyAuctions });
      
      try {
        const response = showMyAuctions 
          ? await auctionsAPI.getMyAuctions({
              page,
              limit: isMobile ? 6 : isTablet ? 8 : 12,
              status: activeTab === 0 ? 'ACTIVE' : activeTab === 1 ? 'SCHEDULED' : 'ENDED',
              search: searchQuery,
              ...filters,
            })
          : await auctionsAPI.getAuctions({
              page,
              limit: isMobile ? 6 : isTablet ? 8 : 12,
              status: activeTab === 0 ? 'ACTIVE' : activeTab === 1 ? 'SCHEDULED' : 'ENDED',
              search: searchQuery,
              ...filters,
            });
        
        console.log('✅ API Response received:', {
          success: response.data.success,
          dataKeys: Object.keys(response.data.data || {}),
          auctionsCount: response.data.data?.auctions?.length || 0,
          pagination: response.data.data?.pagination
        });
        
        return response.data.data; // Extract the data from the Axios response
      } catch (error: any) {
        console.error('❌ API Error:', error);
        
        // Handle authentication errors specifically
        if (error.response?.status === 401) {
          console.warn('🚫 Authentication failed, user may need to log in again');
          // Don't throw the error immediately, let the auth context handle it
          // Return empty data to prevent crashes
          return { auctions: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } };
        }
        
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if ((error as any)?.response?.status === 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      const jitter = Math.random() * 1000;
      return baseDelay + jitter;
    },
    staleTime: 20 * 1000, // 20 seconds - longer to reduce requests
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true,
    refetchInterval: 60 * 1000, // Refetch every 60 seconds as backup
  });

  // Real-time auction updates are handled by useRealtimeAuctions hook

  // Handle authentication failures
  useEffect(() => {
    if (error && (error as any)?.response?.status === 401) {
      console.warn('🚫 Authentication failed, redirecting to login...');
      router.replace('/login');
    }
  }, [error, router]);

  // Effect to manage display data, cache data, and prevent flickering
  useEffect(() => {
    if (auctions && !isLoading) {
      // Cache the data for instant tab switching
      const statusMap = ['ACTIVE', 'SCHEDULED', 'ENDED'];
      const currentStatus = statusMap[activeTab];
      const cacheKey = `${currentStatus}_${page}_${searchQuery}_${JSON.stringify(filters)}`;
      
      setLocalAuctionsCache(prev => ({
        ...prev,
        [cacheKey]: (auctions as any)?.auctions || []
      }));
      
      // If we have new data and it's not loading, update display data
      setDisplayData(auctions);
      setIsTransitioning(false);
      previousDataRef.current = auctions;
    } else if (isLoading && !auctions && previousDataRef.current) {
      // If we're loading and have previous data, keep showing it
      setDisplayData(previousDataRef.current);
      setIsTransitioning(true);
    } else if (isLoading && !auctions && !previousDataRef.current) {
      // First load, show loading state
      setDisplayData(null);
      setIsTransitioning(false);
    }
  }, [auctions, isLoading, activeTab, page, searchQuery, filters]);

  // Effect to handle filter changes with smooth transitions
  useEffect(() => {
    if (isTransitioning && auctions && !isLoading) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setDisplayData(auctions);
        setIsTransitioning(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [auctions, isLoading, isTransitioning]);

  // Real-time auction updates are now handled by useRealtimeAuctions hook
  // This effect only handles display data updates when real-time events occur
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleAuctionUpdate = (data: any) => {
      console.log('🔄 Real-time auction update received in AuctionsPage:', data);
      
      // Update current display data if the auction is visible
      if (displayData?.auctions) {
        const updatedAuctions = displayData.auctions.map((auction: Auction) => {
          if (auction.id === data.auctionId) {
            return {
              ...auction,
              status: data.status,
              startTime: data.startTime || auction.startTime,
              endTime: data.endTime || auction.endTime,
            };
          }
          return auction;
        });
        
        setDisplayData({
          ...displayData,
          auctions: updatedAuctions
        });
      }
    };

    // Only listen to specific events that need display updates
    socket.on('auction_status_changed', handleAuctionUpdate);
    socket.on('auction_started', handleAuctionUpdate);
    socket.on('auction_ended', handleAuctionUpdate);

    return () => {
      socket.off('auction_status_changed', handleAuctionUpdate);
      socket.off('auction_started', handleAuctionUpdate);
      socket.off('auction_ended', handleAuctionUpdate);
    };
  }, [socket, isConnected, displayData]);

  // Real-time updates are handled by socket events, no need for periodic sync
  // This ensures true real-time updates without unnecessary API calls

  // Clear cache when filters change to force fresh data
  useEffect(() => {
    setLocalAuctionsCache({});
  }, [searchQuery, filters.currency, filters.sortBy, filters.sortOrder]);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
    setIsTransitioning(true);
  }, []);

  const handleViewAuction = useCallback((auctionId: string) => {
    router.push(`/auctions/${auctionId}`);
  }, [router]);

  const handleBidAuction = useCallback((auctionId: string) => {
    if (!authState.isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push(`/auctions/${auctionId}`);
  }, [authState.isAuthenticated, router]);

  // Memoized loading state to prevent unnecessary re-renders
  const showLoading = useMemo(() => {
    return isLoading && !displayData;
  }, [isLoading, displayData]);

  // Memoized auctions data to prevent flickering
  const auctionsList = useMemo((): Auction[] => {
    const auctionsList = (displayData as any)?.auctions || [];
    return auctionsList;
  }, [displayData]);

  // Memoized pagination data
  const pagination = useMemo(() => {
    return (displayData as any)?.pagination || null;
  }, [displayData]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

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

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  // Smooth refresh handler that prevents flickering
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    
    // Don't clear display data, just refetch in background
    refetch({
      throwOnError: false, // Don't throw errors during background refresh
    });
  }, [refetch]);

  // Function to instantly filter auctions by status for instant tab switching
  const getFilteredAuctionsByStatus = useCallback((auctions: Auction[], status: string) => {
    const now = new Date();
    return auctions.filter(auction => {
      switch (status) {
        case 'ACTIVE':
          return auction.status === 'ACTIVE' && 
                 auction.endsAt && 
                 new Date(auction.endsAt) > now;
        case 'SCHEDULED':
          return auction.status === 'SCHEDULED' || 
                 (auction.status === 'ACTIVE' && 
                  auction.startsAt && 
                  new Date(auction.startsAt) > now);
        case 'ENDED':
          return auction.status === 'ENDED' || 
                 (auction.status === 'ACTIVE' && 
                  auction.endsAt && 
                  new Date(auction.endsAt) <= now);
        default:
          return true;
      }
    });
  }, []);

  // Enhanced tab change handler with instant switching
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    const statusMap = ['ACTIVE', 'SCHEDULED', 'ENDED'];
    const newStatus = statusMap[newValue];
    
    // Check if we have cached data for instant switching
    const cacheKey = `${newStatus}_${page}_${searchQuery}_${JSON.stringify(filters)}`;
    if (localAuctionsCache[cacheKey]) {
      console.log('🚀 Instant tab switch using cached data for:', newStatus);
      setActiveTab(newValue);
      
      // Apply local filtering for instant results
      const allAuctions = displayData?.auctions || [];
      const filteredAuctions = getFilteredAuctionsByStatus(allAuctions, newStatus);
      
      if (filteredAuctions.length > 0) {
        setDisplayData({
          ...displayData,
          auctions: filteredAuctions,
          pagination: {
            ...displayData?.pagination,
            total: filteredAuctions.length,
            pages: Math.ceil(filteredAuctions.length / (isMobile ? 6 : isTablet ? 8 : 12))
          }
        });
        return;
      }
    }
    
    // Fallback to normal tab switching if no cache
    console.log('🔄 Normal tab switch - fetching new data for:', newStatus);
    setActiveTab(newValue);
    setIsTransitioning(true);
  }, [localAuctionsCache, page, searchQuery, filters, displayData, getFilteredAuctionsByStatus, isMobile, isTablet]);

  // Error handling with retry option
  if (error) {
    console.error('AuctionsPage error:', error);
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4
      }}>
        <LiquidGlassCard
          variant="default"
          hoverEffect={false}
          glassIntensity="medium"
          customSx={{
            maxWidth: 500, 
            p: 4,
          }}
        >
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => refetch()}
              >
                Retry
              </Button>
            }
          >
            Failed to load auctions. Please try again later.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Error: {error.message || 'Unknown error'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => refetch()}
            fullWidth
          >
            Refresh Page
          </Button>
        </LiquidGlassCard>
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
        title={showMyAuctions ? "My Auctions" : "Auctions"}
        subtitle={showMyAuctions 
          ? authState.user?.role === 'SELLER' 
            ? "View and manage your auction listings"
            : "Manage your auction listings and track their performance"
          : "Participate in live auctions for textile materials"
        }
      />


      {/* Search and Filters - Liquid Glass Style */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <LiquidGlassCard 
          variant="default" 
          hoverEffect={true} 
          glassIntensity="high" 
          customSx={{ mb: 4 }}
        >
          <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%'
          }}>
          {/* Search Input */}
          <TextField
            placeholder="Search auctions..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            sx={{ 
              minWidth: isMobile ? '100%' : 220, 
              maxWidth: isMobile ? 'none' : 300,
              mb: isMobile ? 2 : 0,
              flex: isMobile ? 'none' : '0 0 auto'
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Currency Filter */}
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 140,
              width: isMobile ? '100%' : 'auto',
              mb: isMobile ? 2 : 0,
              zIndex: 1000,
              '& .MuiSelect-select': {
                zIndex: 1001,
              }
            }}
          >
            <InputLabel>Currency</InputLabel>
            <Select
              value={filters.currency}
              onChange={(e) => handleFilterChange('currency', e.target.value)}
              label="Currency"
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(17, 17, 17, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    zIndex: 9999,
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(99, 102, 241, 0.3)',
                        },
                      },
                    },
                  },
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                disableScrollLock: true,
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="INR">INR</MenuItem>
              <MenuItem value="CNY">CNY</MenuItem>
              <MenuItem value="TRY">TRY</MenuItem>
            </Select>
          </FormControl>
          
          {/* Sort By Filter */}
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 140,
              width: isMobile ? '100%' : 'auto',
              mb: isMobile ? 2 : 0,
              zIndex: 1000,
              '& .MuiSelect-select': {
                zIndex: 1001,
              }
            }}
          >
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              label="Sort By"
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(17, 17, 17, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    zIndex: 9999,
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(99, 102, 241, 0.3)',
                        },
                      },
                    },
                  },
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                disableScrollLock: true,
              }}
            >
              <MenuItem value="createdAt">Date</MenuItem>
              <MenuItem value="currentBid">Current Bid</MenuItem>
              <MenuItem value="endsAt">End Time</MenuItem>
            </Select>
          </FormControl>
          
          {/* Sort Order Button */}
          <Button
            variant={filters.sortOrder === 'desc' ? 'contained' : 'outlined'}
            onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
            startIcon={<Sort />}
            size="small"
            sx={{
              minWidth: 120,
              width: isMobile ? '100%' : 'auto',
              mb: isMobile ? 2 : 0,
            }}
          >
            {filters.sortOrder === 'desc' ? '↓' : '↑'}
          </Button>
          
          {/* Refresh Button */}
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={isFetching}
            size="small"
            sx={{
              minWidth: 48,
              width: isMobile ? '100%' : 48,
              height: 40,
              mb: isMobile ? 2 : 0,
              borderColor: 'rgba(99, 102, 241, 0.4)',
              color: '#6366F1',
              opacity: isFetching ? 0.6 : 1,
              '&:hover': {
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                transform: isFetching ? 'none' : 'rotate(180deg)',
                transition: 'transform 0.3s ease',
              },
              '&:disabled': {
                borderColor: 'rgba(99, 102, 241, 0.2)',
                color: 'rgba(99, 102, 241, 0.4)',
              }
            }}
            title={isFetching ? "Refreshing..." : "Refresh auctions"}
          >
            <Refresh 
              sx={{ 
                animation: isFetching ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} 
            />
          </Button>
          </Box>
        </CardContent>
        </LiquidGlassCard>
      </Box>

      {/* Compact Tabs */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mb: 2 }}>
        <Box sx={{
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{
              width: '100%',
              minHeight: 'auto',
              '& .MuiTabs-flexContainer': {
                flexWrap: 'nowrap',
                gap: 0,
              },
              '& .MuiTab-root': {
                minWidth: 'auto',
                flex: 1,
                maxWidth: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '16px 8px',
                minHeight: '56px',
                fontSize: '0.9rem',
                fontWeight: 500,
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#6366F1',
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                },
                '&.Mui-selected': {
                  color: '#6366F1',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#6366F1',
                height: 3,
                borderRadius: '2px 2px 0 0',
              },
            }}
          >
            <Tab label="Live Auctions" />
            <Tab label="Upcoming" />
            <Tab label="Ended" />
          </Tabs>
        </Box>
      </Box>

      {/* Auctions Grid */}
      <Box sx={{ width: '100%', position: 'relative', px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Loading indicator for background fetching */}
        {(isFetching || isTransitioning) && !showLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, transparent, #6366F1, transparent)',
              animation: 'loading-shimmer 1.5s infinite',
              zIndex: 1,
            }}
          />
        )}
        
        {/* Loading backdrop for better UX */}
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          open={showLoading}
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
              Loading Auctions...
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
              Please wait while we fetch the latest auctions
            </Typography>
          </Box>
        </Backdrop>
        
        {showLoading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 12 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={index}>
                <LiquidGlassCard
                  variant="default"
                  hoverEffect={false}
                  glassIntensity="medium"
                  customSx={{
                    borderRadius: 3,
                  }}
                >
                  <Skeleton variant="rectangular" height={160} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                  <CardContent sx={{ p: 2 }}>
                    <Skeleton variant="text" height={20} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                    <Skeleton variant="text" height={16} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                    <Skeleton variant="text" height={14} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                  </CardContent>
                </LiquidGlassCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Fade in={!showLoading && !isTransitioning} timeout={300}>
            <Box>
              <Grid container spacing={2}>
                {auctionsList.map((auction: Auction) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={auction.id}>
                    <AuctionCard
                      auction={auction}
                      onView={handleViewAuction}
                      onBid={handleBidAuction}
                      formatPrice={formatPrice}
                      getAuctionStatusColor={getAuctionStatusColor}
                      getTimeRemaining={getTimeRemaining}
                      getProgressPercentage={getProgressPercentage}
                      currentUserId={authState.user?.id}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <Box display="flex" justifyContent="center" mt={6}>
                  <Pagination
                    count={pagination.pages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: 'white',
                        '&.Mui-selected': {
                          backgroundColor: '#6366F1',
                          color: '#000000',
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Box>

      {/* No Results */}
      {!showLoading && !isTransitioning && auctionsList.length === 0 && (
        <Box textAlign="center" py={8} px={2}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              color: 'white',
              fontWeight: 600,
              mb: 2
            }}
          >
            No auctions found
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 4,
              fontWeight: 400
            }}
          >
            {activeTab === 0 && 'No live auctions at the moment.'}
            {activeTab === 1 && 'No upcoming auctions scheduled.'}
            {activeTab === 2 && 'No ended auctions found.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setSearchQuery('');
              setFilters({
                currency: '',
                sortBy: 'createdAt',
                sortOrder: 'desc',
              });
              setPage(1);
            }}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              color: '#000000',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Clear Filters
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Memoize the main component to prevent unnecessary re-renders
const MemoizedAuctionsPage = memo(AuctionsPage);
MemoizedAuctionsPage.displayName = 'AuctionsPage';

export default MemoizedAuctionsPage;