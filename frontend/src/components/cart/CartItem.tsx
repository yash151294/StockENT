import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { CartItem as CartItemType } from '../../types';
import NumericInput from '../NumericInput';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity === item.quantity || newQuantity < 1) return;
    
    setIsUpdating(true);
    try {
      await updateQuantity(item.id, newQuantity);
      setQuantity(newQuantity);
    } catch (error) {
      // Revert on error
      setQuantity(item.quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      await removeFromCart(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'DIRECT':
        return 'primary';
      case 'NEGOTIATION':
        return 'secondary';
      case 'AUCTION':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'DIRECT':
        return 'Direct Purchase';
      case 'NEGOTIATION':
        return 'Negotiated Price';
      case 'AUCTION':
        return 'Auction Win';
      default:
        return sourceType;
    }
  };

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Product Image */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item.product?.images?.[0] ? (
              <img
                src={item.product.images[0].imageUrl}
                alt={item.product.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                No Image
              </Typography>
            )}
          </Box>

          {/* Product Details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.product?.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              by {item.product?.seller?.companyName || 'Unknown Seller'}
            </Typography>

            {/* Source Type Badge */}
            <Chip
              label={getSourceTypeLabel(item.sourceType)}
              color={getSourceTypeColor(item.sourceType)}
              size="small"
              sx={{ mb: 1 }}
            />

            {/* Price */}
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              {item.priceAtAddition.toFixed(2)} {item.currency}
            </Typography>

            {/* Quantity Controls */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <NumericInput
                value={quantity}
                onChange={(value) => setQuantity(parseFloat(value) || 1)}
                min={1}
                max={item.product?.quantityAvailable || 999}
                disabled={isUpdating}
                size="small"
                sx={{ width: 80 }}
              />
              <Typography variant="body2" color="text.secondary">
                {item.product?.unit || 'units'}
              </Typography>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <IconButton
              onClick={handleRemove}
              color="error"
              size="small"
              aria-label="Remove from cart"
            >
              <DeleteIcon />
            </IconButton>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Total: {(quantity * item.priceAtAddition).toFixed(2)} {item.currency}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
