import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
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
      console.error('Product data not available');
      navigate('/messages');
      return;
    }
    
    try {
      // Create conversation with seller
      const response = await messagesAPI.createConversation({
        productId: product.id,
        sellerId: product.seller.id
      });
      
      // Invalidate conversations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Navigate to messages page with the new conversation
      navigate(`/messages?conversation=${response.data.data.id}`);
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      navigate('/messages');
    }
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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search watchlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  startAdornment={<Sort />}
                >
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  startAdornment={<FilterList />}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={`${filteredAndSortedItems.length} items`}
                  color="primary"
                  variant="outlined"
                />
                {searchTerm && (
                  <Chip
                    label={`Search: "${searchTerm}"`}
                    onDelete={() => setSearchTerm('')}
                    color="secondary"
                    variant="outlined"
                  />
                )}
                {filterCategory !== 'all' && (
                  <Chip
                    label={`Category: ${filterCategory}`}
                    onDelete={() => setFilterCategory('all')}
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Watchlist Items */}
      {watchlistLoading ? (
        <Box>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Skeleton variant="rectangular" width={120} height={120} />
                  <Box flex={1}>
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" height={24} width="80%" />
                    <Skeleton variant="text" height={20} width="60%" />
                    <Box display="flex" gap={1} mt={1}>
                      <Skeleton variant="rectangular" width={80} height={24} />
                      <Skeleton variant="rectangular" width={100} height={24} />
                    </Box>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Skeleton variant="rectangular" width={80} height={32} />
                    <Skeleton variant="rectangular" width={80} height={32} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : filteredAndSortedItems.length > 0 ? (
        <Grid container spacing={2}>
          {filteredAndSortedItems.map((item: any) => (
            <Grid item xs={12} sm={6} lg={4} key={item.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={getImageUrl(item.product?.images?.[0]?.imageUrl)}
                    alt={item.product?.title}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImageUrl(null);
                    }}
                  />
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="h6" noWrap sx={{ flex: 1, mr: 1 }}>
                        {item.product?.title}
                      </Typography>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveFromWatchlist(item.product?.id)}
                        disabled={removeFromWatchlistMutation.isPending}
                        sx={{ flexShrink: 0 }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.product?.description}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
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
                      <Typography variant="caption" color="text.secondary">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Box display="flex" gap={1} mb={1}>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          onClick={() => navigate(`/products/${item.product?.id}`)}
                          startIcon={<Visibility />}
                        >
                          View Details
                        </Button>
                      </Box>
                      
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={() => handleContactSeller(item.product)}
                          startIcon={<Message />}
                        >
                          Contact Seller
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
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
