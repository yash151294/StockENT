import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Visibility,
  Message,
  ShoppingCart,
  Gavel,
  AttachMoney,
  LocationOn,
  Business,
  Verified,
  WatchLater,
  Person,
  ZoomIn,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import PageHeader from '../components/PageHeader';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showWarning } = useNotification();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getProduct(id!),
    enabled: !!id,
  });

  const productData = product?.data?.data as any;

  const watchlistMutation = useMutation({
    mutationFn: () => productsAPI.toggleWatchlist(id!),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
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
      // Error handling is done in handleWatchlistToggle
      console.error('Watchlist mutation error:', error);
    },
  });

  const handleContactSeller = async () => {
    if (!state.isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!productData || !productData.seller) {
      console.error('Product data not available');
      navigate('/messages');
      return;
    }
    
    try {
      // Create conversation with seller
      const response = await messagesAPI.createConversation({
        productId: productData.id,
        sellerId: productData.seller.id
      });
      
      // Invalidate conversations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Navigate to messages page with the new conversation
      navigate(`/messages?conversation=${response.data.data.id}`);
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      
      // Type-safe error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Error response:', axiosError.response?.data);
      }
      
      // Fallback to messages page
      navigate('/messages');
    }
  };

  const handleWatchlistToggle = async () => {
    if (!state.isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // If product is in watchlist, show confirmation dialog
    if (productData?.isInWatchlist) {
      setRemoveConfirmOpen(true);
      return;
    }
    
    // If not in watchlist, add directly
    setWatchlistLoading(true);
    try {
      await watchlistMutation.mutateAsync();
    } catch (error: any) {
      console.error('Watchlist toggle error:', error);
      showWarning('Unable to add product to watchlist. Please try again.');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleConfirmRemove = async () => {
    setRemoveConfirmOpen(false);
    setWatchlistLoading(true);
    try {
      await watchlistMutation.mutateAsync();
    } catch (error: any) {
      console.error('Watchlist toggle error:', error);
      showWarning('Unable to remove product from watchlist. Please try again.');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageDialogOpen(true);
  };

  const handlePreviousImage = () => {
    const images = productData?.images || [];
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    const images = productData?.images || [];
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
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

  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
        color: 'white'
      }}>
        <PageHeader
          title="Loading Product..."
          subtitle="Please wait while we fetch the product details"
        />
        <Grid container spacing={3} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
            <Box mt={2}>
              <Skeleton variant="text" height={32} />
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={20} />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !product?.data) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
        color: 'white'
      }}>
        <PageHeader
          title="Product Not Found"
          subtitle="The product you're looking for could not be found"
          showBackButton={true}
          backPath="/products"
        />
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">
            Product not found or failed to load.
          </Alert>
        </Box>
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
        title={productData?.title || 'Product Details'}
        subtitle={productData?.description ? productData.description.substring(0, 100) + '...' : 'View detailed information about this product'}
        showBackButton={true}
        backPath="/products"
      />

      {/* Product Images */}
      <Grid container spacing={3} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={getImageUrl(productData?.images?.[selectedImageIndex]?.imageUrl || productData?.images?.[0]?.imageUrl)}
                alt={productData?.title}
                sx={{
                  width: '100%',
                  height: 400,
                  objectFit: 'cover',
                  borderRadius: 1,
                  cursor: 'pointer',
                }}
                onClick={() => handleImageClick(selectedImageIndex)}
              />
              {productData?.images && productData.images.length > 1 && (
                <>
                  <IconButton
                    onClick={handlePreviousImage}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    <NavigateBefore />
                  </IconButton>
                  <IconButton
                    onClick={handleNextImage}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    <NavigateNext />
                  </IconButton>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                    }}
                  >
                    {selectedImageIndex + 1} / {productData.images.length}
                  </Box>
                </>
              )}
              <IconButton
                onClick={() => handleImageClick(selectedImageIndex)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                }}
              >
                <ZoomIn />
              </IconButton>
            </Box>
          </Card>

          {/* Image Thumbnails */}
          {productData?.images && productData.images.length > 1 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, overflowX: 'auto' }}>
              {productData.images.map((image: any, index: number) => (
                <Paper
                  key={index}
                  elevation={selectedImageIndex === index ? 4 : 1}
                  sx={{
                    minWidth: 80,
                    height: 80,
                    cursor: 'pointer',
                    border: selectedImageIndex === index ? 2 : 0,
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Box
                    component="img"
                    src={getImageUrl(image.imageUrl)}
                    alt={image.alt || `Product image ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Paper>
              ))}
            </Box>
          )}

          {/* Product Details Tabs */}
          <Card sx={{ mt: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Description" />
              <Tab label="Specifications" />
              <Tab label="Seller Info" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Typography variant="body1">
                  {productData.description}
                </Typography>
              )}
              
              {activeTab === 1 && (
                <Box>
                  {productData.specifications && productData.specifications.length > 0 ? (
                    <Grid container spacing={2}>
                      {productData.specifications.map((spec: any, index: number) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box display="flex" justifyContent="space-between" py={1}>
                            <Typography variant="body2" color="text.secondary">
                              {spec.specName}:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {spec.specValue} {spec.unit && spec.unit}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body1" color="text.secondary">
                        No specifications available for this product.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {activeTab === 2 && (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {productData.seller?.companyName || 'Unknown Seller'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          icon={<Verified />}
                          label={productData.seller?.verificationStatus || 'UNVERIFIED'}
                          size="small"
                          color={
                            (productData.seller?.verificationStatus || 'UNVERIFIED') === 'VERIFIED'
                              ? 'success'
                              : 'warning'
                          }
                        />
                        <Typography variant="body2" color="text.secondary">
                          {productData.seller?.country || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {productData.seller.companyProfile && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {productData.seller.companyProfile.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Product Info Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {productData.title}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip
                  icon={getListingTypeIcon(productData.listingType || 'FIXED_PRICE')}
                  label={(productData.listingType || 'FIXED_PRICE').replace('_', ' ')}
                  color={getListingTypeColor(productData.listingType || 'FIXED_PRICE')}
                />
                <Chip
                  label={productData.status || 'ACTIVE'}
                  color={(productData.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
                />
              </Box>

              <Box mb={3}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {formatPrice(productData.basePrice || 0, productData.currency || 'USD')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  per {productData.unit || 'unit'}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  <strong>Available:</strong> {productData.quantityAvailable || 0} {productData.unit || 'unit'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Min Order:</strong> {productData.minOrderQuantity || 0} {productData.unit || 'unit'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Location:</strong> {productData.location || 'Not specified'}
                </Typography>
                <Typography variant="body1">
                  <strong>Category:</strong> {productData.category?.name || 'Uncategorized'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Action Buttons */}
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Message />}
                  onClick={handleContactSeller}
                  fullWidth
                >
                  Contact Seller
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Visibility />}
                  onClick={handleWatchlistToggle}
                  disabled={watchlistLoading}
                  fullWidth
                >
                  {productData.isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </Button>

                {(productData.listingType || 'FIXED_PRICE') === 'AUCTION' && productData.auction && (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<Gavel />}
                    onClick={() => navigate(`/auctions/${productData.auction.id}`)}
                    fullWidth
                  >
                    View Auction
                  </Button>
                )}

                {(productData.listingType || 'FIXED_PRICE') === 'FIXED_PRICE' && (
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<ShoppingCart />}
                    fullWidth
                  >
                    Buy Now
                  </Button>
                )}

                {(productData.listingType || 'FIXED_PRICE') === 'NEGOTIABLE' && (
                  <Button
                    variant="contained"
                    color="warning"
                    size="large"
                    startIcon={<AttachMoney />}
                    fullWidth
                  >
                    Make Offer
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Seller Information
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {productData.seller?.companyName || 'Unknown Seller'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {productData.seller?.country || 'Unknown'}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip
                  icon={<Verified />}
                  label={productData.seller?.verificationStatus || 'UNVERIFIED'}
                  size="small"
                  color={
                    (productData.seller?.verificationStatus || 'UNVERIFIED') === 'VERIFIED'
                      ? 'success'
                      : 'warning'
                  }
                />
              </Box>

              <Button
                variant="outlined"
                startIcon={<Message />}
                onClick={handleContactSeller}
                fullWidth
              >
                Contact Seller
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


        {/* Image Dialog */}
        <Dialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'black',
              color: 'white',
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              {productData?.title} - Image {selectedImageIndex + 1} of {productData?.images?.length}
            </Typography>
            <IconButton
              onClick={() => setImageDialogOpen(false)}
              sx={{ color: 'white' }}
            >
              ×
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <Box
              component="img"
              src={getImageUrl(productData?.images?.[selectedImageIndex]?.imageUrl)}
              alt={productData?.title}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
            {productData?.images && productData.images.length > 1 && (
              <>
                <IconButton
                  onClick={handlePreviousImage}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <NavigateBefore />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <NavigateNext />
                </IconButton>
              </>
            )}
          </DialogContent>
        </Dialog>

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
  
  export default ProductDetailPage;
