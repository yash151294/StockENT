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
  Edit,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, messagesAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import PageHeader from '../components/PageHeader';
import LiquidGlassCard from '../components/LiquidGlassCard';

// Memoized ProductCard component for better performance
const ProductCard = memo(({ product, onView, onContact, onEdit, formatPrice, getListingTypeColor, getListingTypeIcon, currentUserId }: {
  product: any;
  onView: (id: string) => void;
  onContact: (id: string) => void;
  onEdit: (id: string) => void;
  formatPrice: (price: number, currency: string) => string;
  getListingTypeColor: (type: string) => any;
  getListingTypeIcon: (type: string) => React.ReactElement;
  currentUserId?: string;
}) => {
  const theme = useTheme();
  
  const imageUrl = product.images && product.images.length > 0 ? product.images[0].imageUrl : null;
  const generatedUrl = getImageUrl(imageUrl);
  
  
  return (
    <LiquidGlassCard
      variant="default"
      hoverEffect={true}
      glassIntensity="medium"
      borderGlow={true}
      onClick={() => onView(product.id)}
      customSx={{
        height: '520px', // Fixed height for all cards
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Prevent content overflow
      }}
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
      <CardContent sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        height: '320px', // Fixed height for content area
        overflow: 'hidden' // Prevent content overflow
      }}>
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
            WebkitLineClamp: 2, // Reduced to 2 lines for consistent height
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '40px', // Ensure minimum height for description
          }}
        >
          {product.description.substring(0, 80)}...
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
        
        <Box 
          display="flex" 
          gap={1} 
          mt="auto" 
          justifyContent="center"
          alignItems="center"
          sx={{ 
            height: '48px', // Fixed height for button container
            flexShrink: 0 // Prevent shrinking
          }}
        >
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
              minWidth: '80px', // Ensure consistent button width
              '&:hover': {
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
              }
            }}
          >
            View
          </Button>
          {/* Show Contact button for buyers, Edit button for sellers viewing their own products */}
          {currentUserId !== product.seller?.id ? (
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
                minWidth: '80px', // Ensure consistent button width
                '&:hover': {
                  background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
                }
              }}
            >
              Contact
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<Edit />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product.id); // Navigate to edit page
              }}
              sx={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                color: '#000000',
                minWidth: '80px', // Ensure consistent button width
                '&:hover': {
                  background: 'linear-gradient(135deg, #D97706 0%, #EA580C 100%)',
                }
              }}
            >
              Edit
            </Button>
          )}
        </Box>
      </CardContent>
    </LiquidGlassCard>
  );
});

ProductCard.displayName = 'ProductCard';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: authState } = useAuth();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Check if we should show only user's products
  const searchParams = new URLSearchParams(location.search);
  const showMyProducts = searchParams.get('my') === 'true' || authState.user?.role === 'SELLER';
  
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
    queryKey: ['products', page, searchQuery, filters, showMyProducts],
    queryFn: async () => {
      try {
        const response = showMyProducts 
          ? await productsAPI.getMyProducts({
              page,
              limit: isMobile ? 8 : isTablet ? 10 : 12,
              search: searchQuery,
              ...filters,
            })
          : await productsAPI.getProducts({
              page,
              limit: isMobile ? 8 : isTablet ? 10 : 12,
              search: searchQuery,
              ...filters,
            });
        return response;
      } catch (error: any) {
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

  const handleEditProduct = useCallback((productId: string) => {
    navigate(`/products/${productId}/edit`);
  }, [navigate]);

  const handleContactSeller = useCallback(async (productId: string) => {
    if (!authState.isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Find the product to get seller information
    const product = displayData?.data?.data?.products?.find((p: any) => p.id === productId);
    if (!product || !product.seller) {
      console.error('Product or seller not found:', { product, seller: product?.seller });
      navigate('/messages');
      return;
    }
    
    // Navigate to messages page with product and seller info for new message composition
    // The messages page will handle the new conversation creation when user sends first message
    navigate(`/messages?product=${product.id}&seller=${product.seller.id}`);
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
        title={showMyProducts ? "My Products" : "Products"}
        subtitle={showMyProducts 
          ? authState.user?.role === 'SELLER' 
            ? "View and manage your product listings"
            : "Manage your product listings and track their performance"
          : "Discover textile materials from verified suppliers worldwide"
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
        </CardContent>
        </LiquidGlassCard>
      </Box>


      {/* Products Grid */}
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
                <LiquidGlassCard
                  variant="default"
                  hoverEffect={false}
                  glassIntensity="medium"
                  customSx={{
                    borderRadius: 3,
                  }}
                >
                  <Skeleton variant="rectangular" height={200} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                  <CardContent>
                    <Skeleton variant="text" height={24} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                    <Skeleton variant="text" height={20} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                    <Skeleton variant="text" height={16} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }} />
                  </CardContent>
                </LiquidGlassCard>
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
                      onEdit={handleEditProduct}
                      formatPrice={formatPrice}
                      getListingTypeColor={getListingTypeColor}
                      getListingTypeIcon={getListingTypeIcon}
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
