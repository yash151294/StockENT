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
  Refresh,
  Search,
  Sort,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auctionsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import PageHeader from '../components/PageHeader';
import { Auction } from '../types';


// Memoized AuctionCard component for better performance
const AuctionCard = memo(({ auction, onView, onBid, formatPrice, getAuctionStatusColor, getTimeRemaining, getProgressPercentage }: {
  auction: Auction;
  onView: (id: string) => void;
  onBid: (id: string) => void;
  formatPrice: (price: number, currency: string) => string;
  getAuctionStatusColor: (status: string) => any;
  getTimeRemaining: (endTime: string) => string;
  getProgressPercentage: (startTime: string, endTime: string) => number;
}) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        cursor: 'pointer',
        background: 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99, 102, 241, 0.1)',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-8px)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        },
      }}
      onClick={() => onView(auction.id)}
    >
      <CardMedia
        component="img"
        height="200"
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
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Typography 
            variant="h6" 
            component="h3" 
            noWrap 
            sx={{ 
              flex: 1, 
              mr: 1,
              color: 'white',
              fontWeight: 600,
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
            }}
          />
        </Box>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 2,
            lineHeight: 1.5,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {auction.product?.description?.substring(0, 100) || 'No description available'}...
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#6366F1',
              fontWeight: 700,
            }}
          >
            {formatPrice(auction.currentBid || auction.startingPrice || 0, auction.product?.currency || 'USD')}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Current Bid
          </Typography>
        </Box>

        {auction.status === 'ACTIVE' && auction.endsAt && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Time Remaining
              </Typography>
              <Typography variant="body2" fontWeight="medium" sx={{ color: 'white' }}>
                {getTimeRemaining(auction.endsAt)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgressPercentage(auction.startsAt || auction.startTime, auction.endsAt)}
              color="primary"
              sx={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                },
              }}
            />
          </Box>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {auction.product?.seller?.companyName || 'Unknown Seller'}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
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
              '&:hover': {
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
              }
            }}
          >
            View
          </Button>
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
              '&:hover': {
                background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
              }
            }}
          >
            Bid
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

AuctionCard.displayName = 'AuctionCard';

const AuctionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { state: authState } = useAuth();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const isTablet = useMediaQuery(useTheme().breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    currency: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Local state to prevent flickering
  const [displayData, setDisplayData] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousDataRef = useRef<any>(null);

  // Enhanced query with better error handling and debugging
  const { 
    data: auctions, 
    isLoading, 
    error, 
    refetch,
    isFetching,
    isError 
  } = useQuery({
    queryKey: ['auctions', activeTab, page, retryCount, searchQuery, filters],
    queryFn: async () => {
      console.log('🔄 Fetching auctions...', { activeTab, page, status: activeTab === 0 ? 'ACTIVE' : activeTab === 1 ? 'SCHEDULED' : 'ENDED' });
      
      try {
        const response = await auctionsAPI.getAuctions({
          page,
          limit: isMobile ? 8 : isTablet ? 10 : 12,
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
      } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Effect to manage display data and prevent flickering
  useEffect(() => {
    if (auctions && !isLoading) {
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
  }, [auctions, isLoading]);

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
    navigate(`/auctions/${auctionId}`);
  }, [navigate]);

  const handleBidAuction = useCallback((auctionId: string) => {
    if (!authState.isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/auctions/${auctionId}`);
  }, [authState.isAuthenticated, navigate]);

  // Memoized loading state to prevent unnecessary re-renders
  const showLoading = useMemo(() => {
    return isLoading && !displayData;
  }, [isLoading, displayData]);

  // Memoized auctions data to prevent flickering
  const auctionsList = useMemo((): Auction[] => {
    const auctions = displayData?.auctions || [];
    return auctions;
  }, [displayData]);

  // Memoized pagination data
  const pagination = useMemo(() => {
    return displayData?.pagination || null;
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
        <Card sx={{ 
          maxWidth: 500, 
          p: 4,
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
        }}>
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
        </Card>
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
        title="Auctions"
        subtitle="Participate in live auctions for textile materials"
      />

      {/* Tabs with Glassmorphism */}
      <Box sx={{ 
        mb: 4, 
        p: 3, 
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.8) 0%, rgba(26, 26, 26, 0.6) 100%)',
        borderRadius: 3,
        border: '1px solid rgba(99, 102, 241, 0.2)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, transparent 25%, transparent 75%, rgba(99, 102, 241, 0.1) 100%)',
          animation: 'liquidFlow 8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '& > *': {
          position: 'relative',
          zIndex: 2,
        },
      }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            width: '100%',
            minHeight: 'auto',
            '& .MuiTabs-flexContainer': {
              flexWrap: 'wrap',
            },
            '& .MuiTab-root': {
              minWidth: 'auto',
              flex: 1,
              maxWidth: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#6366F1',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#6366F1',
            },
          }}
        >
          <Tab label="Live Auctions" />
          <Tab label="Upcoming" />
          <Tab label="Ended" />
        </Tabs>
      </Box>

      {/* Search and Filters - Liquid Glass Style */}
      <Box sx={{ 
        mb: 4, 
        p: 3, 
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.8) 0%, rgba(26, 26, 26, 0.6) 100%)',
        borderRadius: 3,
        border: '1px solid rgba(99, 102, 241, 0.2)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, transparent 25%, transparent 75%, rgba(99, 102, 241, 0.1) 100%)',
          animation: 'liquidFlow 8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
          animation: 'liquidFlow 12s ease-in-out infinite reverse',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '& > *': {
          position: 'relative',
          zIndex: 2,
        },
        '&:hover': {
          '&::before': {
            animationDuration: '4s',
          },
          '&::after': {
            animationDuration: '6s',
          },
        },
      }}>
        
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
        </Box>
      </Box>

      {/* Auctions Grid */}
      <Box sx={{ width: '100%', overflow: 'auto', position: 'relative', px: { xs: 2, md: 0 } }}>
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
          <Grid container spacing={3}>
            {Array.from({ length: 12 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card sx={{
                  background: 'rgba(17, 17, 17, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                  borderRadius: 3,
                }}>
                  <Skeleton variant="rectangular" height={200} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                  <CardContent>
                    <Skeleton variant="text" height={24} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                    <Skeleton variant="text" height={20} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                    <Skeleton variant="text" height={16} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Fade in={!showLoading && !isTransitioning} timeout={300}>
            <Box>
              <Grid container spacing={3}>
                {auctionsList.map((auction: Auction) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={auction.id}>
                    <AuctionCard
                      auction={auction}
                      onView={handleViewAuction}
                      onBid={handleBidAuction}
                      formatPrice={formatPrice}
                      getAuctionStatusColor={getAuctionStatusColor}
                      getTimeRemaining={getTimeRemaining}
                      getProgressPercentage={getProgressPercentage}
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