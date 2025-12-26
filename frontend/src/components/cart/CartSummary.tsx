import React from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Stack,
} from '@mui/material';
import { ShoppingCartCheckout as CheckoutIcon } from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { useRouter } from 'next/navigation';

export const CartSummary: React.FC = () => {
  const { cartItems, getItemCount, getTotalValue, validateCart } = useCart();
  const router = useRouter();

  const itemCount = getItemCount();
  const totalValue = getTotalValue();

  // Group items by currency
  const itemsByCurrency = cartItems.reduce((acc, item) => {
    if (!acc[item.currency]) {
      acc[item.currency] = [];
    }
    acc[item.currency].push(item);
    return acc;
  }, {} as Record<string, typeof cartItems>);

  const handleCheckout = () => {
    // Navigate to checkout page
    router.push('/checkout');
  };

  const handleValidateCart = async () => {
    try {
      await validateCart();
    } catch (error) {
      console.error('Failed to validate cart:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Order Summary
      </Typography>

      {/* Item Count */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Items ({itemCount})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {itemCount}
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Total by Currency */}
      {Object.entries(itemsByCurrency).map(([currency, items]) => {
        const currencyTotal = items.reduce(
          (sum, item) => sum + (item.quantity * item.priceAtAddition),
          0
        );
        
        return (
          <Box key={currency} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal ({currency})
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {currencyTotal.toFixed(2)} {currency}
            </Typography>
          </Box>
        );
      })}

      <Divider sx={{ my: 1 }} />

      {/* Total Value */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Total
        </Typography>
        <Typography variant="h6" color="primary" fontWeight={600}>
          {totalValue.toFixed(2)}
        </Typography>
      </Box>

      {/* Actions */}
      <Stack spacing={1}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<CheckoutIcon />}
          onClick={handleCheckout}
          disabled={itemCount === 0}
          size="large"
        >
          Proceed to Checkout
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={handleValidateCart}
          disabled={itemCount === 0}
        >
          Validate Cart
        </Button>
      </Stack>

      {/* Additional Info */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        * Prices are locked at the time of adding to cart
      </Typography>
    </Box>
  );
};
