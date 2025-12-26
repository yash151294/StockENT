import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  ShoppingBag as ShoppingBagIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface CartEmptyStateProps {
  onClose: () => void;
}

export const CartEmptyState: React.FC<CartEmptyStateProps> = ({ onClose }) => {
  const router = useRouter();

  const handleBrowseProducts = () => {
    onClose();
    router.push('/products');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <ShoppingCartIcon sx={{ fontSize: 60, color: 'grey.400' }} />
      </Box>

      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Your cart is empty
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 300 }}>
        Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
      </Typography>

      <Stack spacing={2} sx={{ width: '100%', maxWidth: 280 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingBagIcon />}
          onClick={handleBrowseProducts}
          size="large"
        >
          Browse Products
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={onClose}
        >
          Continue Shopping
        </Button>
      </Stack>

      {/* Quick Tips */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2, width: '100%' }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Quick Tips:
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          • Fixed price items can be added directly to cart
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          • Negotiable items require making an offer first
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          • Auction wins are automatically added to cart
        </Typography>
      </Box>
    </Box>
  );
};
