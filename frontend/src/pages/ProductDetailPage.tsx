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
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getProduct(id!),
    enabled: !!id,
  });

  const productData = product?.data as any;

  const watchlistMutation = useMutation({
    mutationFn: () => productsAPI.toggleWatchlist(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });

  const handleContactSeller = () => {
    if (!state.isAuthenticated) {
      navigate('/login');
      return;
    }
    setContactDialogOpen(true);
  };

  const handleWatchlistToggle = async () => {
    if (!state.isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setWatchlistLoading(true);
    try {
      await watchlistMutation.mutateAsync();
    } finally {
      setWatchlistLoading(false);
    }
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
      <Box>
        <Grid container spacing={3}>
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
      <Box>
        <Alert severity="error">
          Product not found or failed to load.
        </Alert>
      </Box>
    );
  }


  return (
    <Box>
      {/* Product Images */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <Box
              component="img"
              src={productData?.images?.[0]?.imageUrl || '/placeholder-product.jpg'}
              alt={productData?.title}
              sx={{
                width: '100%',
                height: 400,
                objectFit: 'cover',
                borderRadius: 1,
              }}
            />
          </Card>

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
                <Grid container spacing={2}>
                  {productData.specifications?.map((spec: any, index: number) => (
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
              )}
              
              {activeTab === 2 && (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {productData.seller.companyName}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          icon={<Verified />}
                          label={productData.seller.verificationStatus}
                          size="small"
                          color={
                            productData.seller.verificationStatus === 'VERIFIED'
                              ? 'success'
                              : 'warning'
                          }
                        />
                        <Typography variant="body2" color="text.secondary">
                          {productData.seller.country}
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
                  icon={getListingTypeIcon(productData.listingType)}
                  label={productData.listingType.replace('_', ' ')}
                  color={getListingTypeColor(productData.listingType)}
                />
                <Chip
                  label={productData.status}
                  color={productData.status === 'ACTIVE' ? 'success' : 'default'}
                />
              </Box>

              <Box mb={3}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {formatPrice(productData.basePrice, productData.currency)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  per {productData.unit}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="body1" gutterBottom>
                  <strong>Available:</strong> {productData.quantityAvailable} {productData.unit}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Min Order:</strong> {productData.minOrderQuantity} {productData.unit}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Location:</strong> {productData.location}
                </Typography>
                <Typography variant="body1">
                  <strong>Category:</strong> {productData.category.name}
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

                {productData.listingType === 'AUCTION' && productData.auction && (
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

                {productData.listingType === 'FIXED_PRICE' && (
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

                {productData.listingType === 'NEGOTIABLE' && (
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
                    {productData.seller.companyName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {productData.seller.country}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip
                  icon={<Verified />}
                  label={productData.seller.verificationStatus}
                  size="small"
                  color={
                    productData.seller.verificationStatus === 'VERIFIED'
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

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Seller</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            You will be connected anonymously with the seller to discuss this product.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your message here..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => setContactDialogOpen(false)}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductDetailPage;
