import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import { Close as CloseIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartEmptyState } from './CartEmptyState';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose }) => {
  const { cartItems, isLoading, getItemCount, getTotalValue } = useCart();
  const itemCount = getItemCount();
  const totalValue = getTotalValue();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon color="primary" />
            <Typography variant="h6" component="h2">
              Shopping Cart
            </Typography>
            {itemCount > 0 && (
              <Typography variant="body2" color="text.secondary">
                ({itemCount} items)
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} aria-label="Close cart">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {isLoading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading cart...</Typography>
            </Box>
          ) : cartItems.length === 0 ? (
            <CartEmptyState onClose={onClose} />
          ) : (
            <>
              {/* Cart Items */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <Stack spacing={2}>
                  {cartItems.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Cart Summary */}
              <Box sx={{ p: 2 }}>
                <CartSummary />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
