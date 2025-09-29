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
  ZoomIn,
  NavigateBefore,
  NavigateNext,
  Edit,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import PageHeader from '../components/PageHeader';
import LiquidGlassCard from '../components/LiquidGlassCard';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
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
      console.error('Product data not available:', { productData, seller: productData?.seller });
      navigate('/messages');
      return;
    }
    
    // Navigate to messages page with product and seller info for new message composition
    // The messages page will handle the new conversation creation when user sends first message
    navigate(`/messages?product=${productData.id}&seller=${productData.seller.id}`);
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
        subtitle={productData?.description ? productData.description.substring(0, 50) + '...' : 'View detailed information about this product'}
        showBackButton={true}
        backPath="/products"
      />

      {/* Main Content */}
      <Grid container spacing={3} sx={{ px: { xs: 2, sm: 3, md: 4 }, alignItems: 'stretch' }}>
        {/* Left Side - Product Images and Details */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Product Image Card */}
            <LiquidGlassCard
              variant="default"
              hoverEffect={true}
              glassIntensity="high"
            >
              {/* Add children here to fix the missing children prop error */}
              {/* Example placeholder content */}
              <Box />
            </LiquidGlassCard>
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


            {/* Product Details Tabs Card */}
            <LiquidGlassCard
              variant="default"
              hoverEffect={true}
              glassIntensity="high"
            >
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
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" sx={{ 
                          color: '#6366F1', 
                          fontWeight: 600, 
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          📋 Product Specifications
                        </Typography>
                        <Grid container spacing={3}>
                          {productData.specifications.map((spec: any, index: number) => (
                            <Grid item xs={12} sm={6} key={index}>
                              <Box sx={{
                                p: 2,
                                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                                borderRadius: 2,
                                border: '1px solid rgba(99, 102, 241, 0.1)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                  borderColor: 'rgba(99, 102, 241, 0.2)',
                                }
                              }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" sx={{ 
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontSize: '0.75rem'
                                  }}>
                                    {spec.specName}
                                  </Typography>
                                  <Typography variant="body1" sx={{ 
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                  }}>
                                    {spec.specValue} {spec.unit && (
                                      <Typography component="span" sx={{ 
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        fontWeight: 400,
                                        fontSize: '0.8rem',
                                        ml: 0.5
                                      }}>
                                        {spec.unit}
                                      </Typography>
                                    )}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        borderRadius: 2,
                        border: '1px dashed rgba(99, 102, 241, 0.2)'
                      }}>
                        <Typography variant="h6" sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                          mb: 1
                        }}>
                          📋 No Specifications Available
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}>
                          This product doesn't have detailed specifications listed yet.
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
            </LiquidGlassCard>
          </Box>
        </Grid>

        {/* Right Side - Product Info and Seller Details */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Product Info Card */}
            <LiquidGlassCard
              variant="default"
              hoverEffect={true}
              glassIntensity="high"
            >
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ 
                  color: 'white',
                  fontWeight: 600
                }}>
                  {productData.title}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Chip
                    icon={getListingTypeIcon(productData.listingType || 'FIXED_PRICE')}
                    label={(productData.listingType || 'FIXED_PRICE').replace('_', ' ')}
                    color={getListingTypeColor(productData.listingType || 'FIXED_PRICE')}
                    sx={{
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  />
                  <Chip
                    label={productData.status || 'ACTIVE'}
                    color={(productData.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
                    sx={{
                      backgroundColor: (productData.status || 'ACTIVE') === 'ACTIVE' 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : 'rgba(107, 114, 128, 0.2)',
                      color: (productData.status || 'ACTIVE') === 'ACTIVE' 
                        ? '#22C55E' 
                        : '#6B7280',
                      border: (productData.status || 'ACTIVE') === 'ACTIVE' 
                        ? '1px solid rgba(34, 197, 94, 0.3)' 
                        : '1px solid rgba(107, 114, 128, 0.3)',
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <Typography variant="h4" sx={{ 
                    color: '#6366F1',
                    fontWeight: 700,
                    mb: 1
                  }}>
                    {formatPrice(productData.basePrice || 0, productData.currency || 'USD')}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    per {productData.unit || 'unit'}
                  </Typography>
                </Box>

                <Box mb={3} sx={{
                  p: 2,
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 1,
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
                    <strong>Available:</strong> {productData.quantityAvailable || 0} {productData.unit || 'unit'}
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
                    <strong>Min Order:</strong> {productData.minOrderQuantity || 0} {productData.unit || 'unit'}
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
                    <strong>Location:</strong> {productData.location || 'Not specified'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white' }}>
                    <strong>Category:</strong> {productData.category?.name || 'Uncategorized'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(99, 102, 241, 0.3)' }} />

                {/* Action Buttons */}
                <Box display="flex" flexDirection="column" gap={2}>
                  {/* Edit Product Button - Only show for product owner */}
                  {state.isAuthenticated && state.user?.id === productData?.sellerId && (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Edit />}
                      onClick={() => navigate(`/products/${id}/edit`)}
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #D97706 0%, #EA580C 100%)',
                        }
                      }}
                    >
                      Edit Product
                    </Button>
                  )}

                  {/* Only show Contact Seller button if current user is not the seller */}
                  {state.user?.id !== productData?.sellerId && (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Message />}
                      onClick={handleContactSeller}
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5B5FCF 0%, #7C3AED 100%)',
                        }
                      }}
                    >
                      Contact Seller
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Visibility />}
                    onClick={handleWatchlistToggle}
                    disabled={watchlistLoading}
                    fullWidth
                    sx={{
                      borderColor: 'rgba(99, 102, 241, 0.4)',
                      color: '#6366F1',
                      '&:hover': {
                        borderColor: '#6366F1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      }
                    }}
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
              </Box>

              {/* Seller Information Section */}
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: '#6366F1',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Business sx={{ fontSize: '1.2rem' }} />
                  Seller Information
                </Typography>
                
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    mr: 2, 
                    width: 56, 
                    height: 56,
                    background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                    fontSize: '1.5rem',
                    fontWeight: 600
                  }}>
                    {productData.seller?.companyName?.charAt(0) || 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      color: 'white',
                      mb: 0.5
                    }}>
                      {productData.seller?.companyName || 'Unknown Seller'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn sx={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {productData.seller?.country || 'Unknown Location'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Chip
                    icon={<Verified />}
                    label={productData.seller?.verificationStatus || 'UNVERIFIED'}
                    size="small"
                    sx={{
                      backgroundColor: (productData.seller?.verificationStatus || 'UNVERIFIED') === 'VERIFIED' 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : 'rgba(251, 191, 36, 0.2)',
                      color: (productData.seller?.verificationStatus || 'UNVERIFIED') === 'VERIFIED' 
                        ? '#22C55E' 
                        : '#FBBF24',
                      border: (productData.seller?.verificationStatus || 'UNVERIFIED') === 'VERIFIED' 
                        ? '1px solid rgba(34, 197, 94, 0.3)' 
                        : '1px solid rgba(251, 191, 36, 0.3)',
                    }}
                  />
                  {productData.seller?.email && (
                    <Chip
                      label="Email Verified"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        color: '#6366F1',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    />
                  )}
                </Box>

                {productData.seller?.companyProfile?.description && (
                  <Box mb={3} sx={{ flex: '1 1 auto' }}>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      lineHeight: 1.6,
                      fontStyle: 'italic'
                    }}>
                      "{productData.seller.companyProfile.description}"
                    </Typography>
                  </Box>
                )}
              </Box>
            </LiquidGlassCard>

          </Box>
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
