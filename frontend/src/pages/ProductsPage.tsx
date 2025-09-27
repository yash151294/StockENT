import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Skeleton,
  Alert,
  Fade,
  CircularProgress,
  Backdrop,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  Sort,
  Visibility,
  ShoppingCart,
  Gavel,
  AttachMoney,
  Message,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, messagesAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import PageHeader from '../components/PageHeader';

// Memoized ProductCard component for better performance
const ProductCard = memo(({ product, onView, onContact, formatPrice, getListingTypeColor, getListingTypeIcon }: {
  product: any;
  onView: (id: string) => void;
  onContact: (id: string) => void;
  formatPrice: (price: number, currency: string) => string;
  getListingTypeColor: (type: string) => any;
  getListingTypeIcon: (type: string) => React.ReactElement;
}) => {
  const theme = useTheme();
  
  const imageUrl = product.images && product.images.length > 0 ? product.images[0].imageUrl : null;
  const generatedUrl = getImageUrl(imageUrl);
  
  
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
      onClick={() => onView(product.id)}
    >
      <CardMedia
        component="img"
        height="200"
        image={generatedUrl}
        alt={product.title}
        sx={{ 
          objectFit: 'cover',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
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
            {product.title}
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Chip
              icon={getListingTypeIcon(product.listingType)}
              label={product.listingType.replace('_', ' ')}
              size="small"
              color={getListingTypeColor(product.listingType)}
              sx={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#6366F1',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            />
            <Chip
              label={product.category?.name || 'Category'}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                color: '#A855F7',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            />
          </Box>
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
          {product.description.substring(0, 100)}...
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#6366F1',
              fontWeight: 700,
            }}
          >
            {formatPrice(product.basePrice, product.currency)}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {product.quantityAvailable} {product.unit}
          </Typography>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {product.seller?.companyName || 'Unknown Seller'}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {product.location || 'Unknown Location'}
          </Typography>
        </Box>
        
        <Box display="flex" gap={1} mt="auto" justifyContent="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={(e) => {
              e.stopPropagation();
              onView(product.id);
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
            startIcon={<Message />}
            onClick={(e) => {
              e.stopPropagation();
              onContact(product.id);
            }}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              color: '#000000',
              '&:hover': {
                background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
              }
            }}
          >
            Contact
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const isTablet = useMediaQuery(useTheme().breakpoints.down('md'));
  
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    currency: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Local state to prevent flickering
  const [displayData, setDisplayData] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousDataRef = useRef<any>(null);

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['products', page, searchQuery, filters],
    queryFn: async () => {
      try {
        const response = await productsAPI.getProducts({
          page,
          limit: isMobile ? 8 : isTablet ? 10 : 12,
          search: searchQuery,
          ...filters,
        });
        return response;
      } catch (error) {
        console.error('Products fetch error:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  }) as any;

  // Effect to manage display data and prevent flickering
  useEffect(() => {
    if (data && !isLoading) {
      // If we have new data and it's not loading, update display data
      setDisplayData(data);
      setIsTransitioning(false);
      previousDataRef.current = data;
    } else if (isLoading && !data && previousDataRef.current) {
      // If we're loading and have previous data, keep showing it
      setDisplayData(previousDataRef.current);
      setIsTransitioning(true);
    } else if (isLoading && !data && !previousDataRef.current) {
      // First load, show loading state
      setDisplayData(null);
      setIsTransitioning(false);
    }
  }, [data, isLoading]);

  // Effect to handle filter changes with smooth transitions
  useEffect(() => {
    if (isTransitioning && data && !isLoading) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setDisplayData(data);
        setIsTransitioning(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [data, isLoading, isTransitioning]);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await categoriesAPI.getCategories();
        return response.data;
      } catch (error) {
        console.error('Categories fetch error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });


  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
    setIsTransitioning(true);
  }, []);

  const handleViewProduct = useCallback((productId: string) => {
    navigate(`/products/${productId}`);
  }, [navigate]);

  const handleContactSeller = useCallback(async (productId: string) => {
    if (!authState.isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      // Find the product to get seller information
      const product = displayData?.data?.data?.products?.find((p: any) => p.id === productId);
      if (!product || !product.seller) {
        navigate('/messages');
        return;
      }
      
      // Create conversation with seller
      const response = await messagesAPI.createConversation({
        productId: product.id,
        sellerId: product.seller.id
      });
      
      // Navigate to messages page with the new conversation
      navigate(`/messages?conversation=${response.data.data.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // Fallback to opening messages page
      navigate('/messages');
    }
  }, [authState.isAuthenticated, navigate, displayData]);


  // Simple filter state management - no complex dropdown control

  // Memoized loading state to prevent unnecessary re-renders
  const showLoading = useMemo(() => {
    return isLoading && !displayData;
  }, [isLoading, displayData]);

  // Memoized products data to prevent flickering
  const products = useMemo(() => {
    return displayData?.data?.data?.products || [];
  }, [displayData]);

  // Memoized pagination data
  const pagination = useMemo(() => {
    return displayData?.data?.data?.pagination || null;
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

  // Error handling with retry option
  if (error) {
    console.error('ProductsPage error:', error);
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
            Failed to load products. Please try again later.
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
        title="Products"
        subtitle="Discover textile materials from verified suppliers worldwide"
      />


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
            placeholder="Search products..."
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
          
          {/* Category Filter */}
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 160,
              width: isMobile ? '100%' : 'auto',
              mb: isMobile ? 2 : 0,
              zIndex: 1000,
              '& .MuiSelect-select': {
                zIndex: 1001,
              }
            }}
          >
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              label="Category"
              disabled={categoriesLoading}
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
              <MenuItem value="">All Categories</MenuItem>
              {categoriesLoading ? (
                <MenuItem disabled>Loading categories...</MenuItem>
              ) : categoriesError ? (
                <MenuItem disabled>Error loading categories</MenuItem>
              ) : categoriesData && Array.isArray(categoriesData.data) ? (
                categoriesData.data.map((category: any) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No categories available</MenuItem>
              )}
            </Select>
          </FormControl>
          
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
              <MenuItem value="basePrice">Price</MenuItem>
              <MenuItem value="title">Name</MenuItem>
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


      {/* Products Grid */}
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
              Loading Products...
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
              Please wait while we fetch the latest products
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
                {products.map((product: any) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <ProductCard
                      product={product}
                      onView={handleViewProduct}
                      onContact={handleContactSeller}
                      formatPrice={formatPrice}
                      getListingTypeColor={getListingTypeColor}
                      getListingTypeIcon={getListingTypeIcon}
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
      {!showLoading && !isTransitioning && products.length === 0 && (
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
            No products found
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 4,
              fontWeight: 400
            }}
          >
            Try adjusting your search criteria or filters
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setSearchQuery('');
              setFilters({
                category: '',
                minPrice: '',
                maxPrice: '',
                currency: '',
                location: '',
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
const MemoizedProductsPage = memo(ProductsPage);
MemoizedProductsPage.displayName = 'ProductsPage';

export default MemoizedProductsPage;
