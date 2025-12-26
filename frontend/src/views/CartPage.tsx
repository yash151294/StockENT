import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Stack,
  Alert,
  Divider,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  ShoppingBag as ShoppingBagIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { CartItem } from '../components/cart/CartItem';
import { CartSummary } from '../components/cart/CartSummary';
import { CartEmptyState } from '../components/cart/CartEmptyState';
import PageHeader from '../components/PageHeader';

export const CartPage: React.FC = () => {
  const { cartItems, isLoading, error, validateCart, clearCart } = useCart();
  const router = useRouter();

  const handleContinueShopping = () => {
    router.push('/products');
  };

  const handleValidateCart = async () => {
    try {
      await validateCart();
    } catch (error) {
      console.error('Failed to validate cart:', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="Shopping Cart" />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading your cart...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="Shopping Cart" />
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load cart: {error.message}
        </Alert>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="Shopping Cart" />
        <CartEmptyState onClose={() => router.push('/products')} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="Shopping Cart" />
      
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="text.secondary">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleValidateCart}
              size="small"
            >
              Validate Cart
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearCart}
              size="small"
            >
              Clear Cart
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Cart Items
            </Typography>
            <Divider />
          </Box>

          <Stack spacing={3}>
            {cartItems.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </Stack>

          {/* Continue Shopping */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ShoppingBagIcon />}
              onClick={handleContinueShopping}
              size="large"
            >
              Continue Shopping
            </Button>
          </Box>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <CartSummary />
          </Box>
        </Grid>
      </Grid>

      {/* Cart Info */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Important Information
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            • Prices are locked at the time of adding items to your cart
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Items from negotiations and auctions have special pricing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Validate your cart before checkout to ensure all items are still available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • You can modify quantities or remove items at any time
          </Typography>
        </Stack>
      </Box>
    </Container>
  );
};
