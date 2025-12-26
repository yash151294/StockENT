import React from 'react';
import { IconButton, Badge } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';

interface CartButtonProps {
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'inherit';
}

export const CartButton: React.FC<CartButtonProps> = ({ 
  onClick, 
  color = 'primary' 
}) => {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <IconButton 
      color={color} 
      onClick={onClick}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <Badge badgeContent={itemCount} color="error">
        <ShoppingCart />
      </Badge>
    </IconButton>
  );
};
