import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Bookmark,
  Visibility,
  Delete,
  Search,
  FilterList,
  Sort,
  ShoppingCart,
  Message,
  Favorite,
  FavoriteBorder,
  Gavel,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import LiquidGlassCard from '../components/LiquidGlassCard';

const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showWarning } = useNotification();
  const queryClient = useQueryClient();
  
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: watchlist, isLoading: watchlistLoading, error: watchlistError } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => productsAPI.getWatchlist(),
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: (productId: string) => productsAPI.removeFromWatchlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess('Product removed from watchlist');
      setRemoveConfirmOpen(false);
      setProductToRemove(null);
    },
    onError: (error: any) => {
      console.error('Remove from watchlist error:', error);
      showWarning('Failed to remove product from watchlist');
    },
  });

  const handleRemoveFromWatchlist = (productId: string) => {
    setProductToRemove(productId);
    setRemoveConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (productToRemove) {
      removeFromWatchlistMutation.mutate(productToRemove);
    }
  };

  const handleCancelRemove = () => {
    setRemoveConfirmOpen(false);
    setProductToRemove(null);
  };

  const handleContactSeller = async (product: any) => {
    if (!state.isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!product || !product.seller) {
      console.error('Product data not available:', { product, seller: product?.seller });
      navigate('/messages');
      return;
    }
    
    // Navigate to messages page with product and seller info for new message composition
    // The messages page will handle the new conversation creation when user sends first message
    navigate(`/messages?product=${product.id}&seller=${product.seller.id}`);
  };

  // Filter and sort watchlist items
  const filteredAndSortedItems = React.useMemo(() => {
    if (!watchlist?.data?.data?.watchlistItems) return [];
    
    let items = watchlist.data.data.watchlistItems;
    
    // Filter by search term
    if (searchTerm) {
      items = items.filter((item: any) => 
        item.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (filterCategory !== 'all') {
      items = items.filter((item: any) => 
        item.product?.category?.name === filterCategory
      );
    }
    
    // Sort items
    items.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return (a.product?.title || '').localeCompare(b.product?.title || '');
        case 'category':
          return (a.product?.category?.name || '').localeCompare(b.product?.category?.name || '');
        default:
          return 0;
      }
    });
    
    return items;
  }, [watchlist, searchTerm, sortBy, filterCategory]);

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    if (!watchlist?.data?.data?.watchlistItems) return [];
    const categorySet = new Set(
      watchlist.data.data.watchlistItems
        .map((item: any) => item.product?.category?.name)
        .filter(Boolean)
    );
    return Array.from(categorySet) as string[];
  }, [watchlist]);

  // Helper functions for consistent styling
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

  if (watchlistError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load watchlist. Please try again.
        </Alert>
        <Button variant="contained" onClick={() => queryClient.invalidateQueries({ queryKey: ['watchlist'] })}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="My Watchlist"
        subtitle="Products you're watching for updates and new information."
      />

      {/* Filters and Search */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <LiquidGlassCard variant="default" hoverEffect={true} glassIntensity="high" customSx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%'
          }}>
            <TextField
              placeholder="Search watchlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ 
                minWidth: 220, 
                maxWidth: 300,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort by"
              >
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="oldest">Oldest</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="category">Category</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
        </LiquidGlassCard>
      </Box>

      {/* Watchlist Items */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {watchlistLoading ? (
          <Grid container spacing={3}>
          {Array.from({ length: 12 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <LiquidGlassCard
                variant="default"
                hoverEffect={false}
                glassIntensity="medium"
                customSx={{
                  borderRadius: 3,
                  height: '100%',
                  minHeight: '500px',
                  display: 'flex',
                  flexDirection: 'column',
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
      ) : filteredAndSortedItems.length > 0 ? (
        <Grid container spacing={3}>
          {filteredAndSortedItems.map((item: any) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LiquidGlassCard
                  variant="default"
                  hoverEffect={true}
                  glassIntensity="medium"
                  borderGlow={true}
                  onClick={() => navigate(`/products/${item.product?.id}`)}
                  customSx={{
                    height: '100%',
                    minHeight: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(item.product?.images?.[0]?.imageUrl)}
                    alt={item.product?.title}
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
                    minHeight: '300px',
                    justifyContent: 'space-between'
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
                        {item.product?.title}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          icon={getListingTypeIcon(item.product?.listingType)}
                          label={item.product?.listingType?.replace('_', ' ')}
                          size="small"
                          color={getListingTypeColor(item.product?.listingType)}
                          sx={{
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366F1',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        />
                        <Chip
                          label={item.product?.category?.name || 'Category'}
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
                        height: '72px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.product?.description?.substring(0, 100)}...
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#6366F1',
                          fontWeight: 700,
                        }}
                      >
                        {formatPrice(item.product?.basePrice, item.product?.currency)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        {item.product?.quantityAvailable} {item.product?.unit}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        {item.product?.seller?.companyName || 'Unknown Seller'}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        {item.product?.location || 'Unknown Location'}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" gap={1} mt="auto" justifyContent="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${item.product?.id}`);
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
                      {/* Only show Contact button if current user is not the seller */}
                      {state.user?.id !== item.product?.seller?.id && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Message />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactSeller(item.product);
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
                      )}
                    </Box>
                  </CardContent>
                </LiquidGlassCard>
              </motion.div>
            </Grid>
          ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={8}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Bookmark sx={{ fontSize: 120, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              {searchTerm || filterCategory !== 'all' ? 'No matching items' : 'No items in watchlist'}
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4} maxWidth={400} mx="auto">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start watching products you\'re interested in by clicking the watch button on product pages.'
              }
            </Typography>
            <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
              {searchTerm || filterCategory !== 'all' ? (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
              <Button
                variant="contained"
                onClick={() => navigate('/products')}
                startIcon={<Visibility />}
              >
                Browse Products
              </Button>
            </Box>
          </motion.div>
          </Box>
        )}
      </Box>

      {/* Remove from Watchlist Confirmation Dialog */}
      <Dialog
        open={removeConfirmOpen}
        onClose={handleCancelRemove}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove from Watchlist</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this product from your watchlist? 
            You can always add it back later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove} disabled={removeFromWatchlistMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRemove} 
            color="error" 
            variant="contained"
            disabled={removeFromWatchlistMutation.isPending}
            startIcon={<Delete />}
          >
            {removeFromWatchlistMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WatchlistPage;
