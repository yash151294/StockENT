import React, { useState } from 'react';
import {
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import {
  ShoppingCart,
  Store,
  SwapHoriz,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

interface RoleChipProps {
  onRoleChange?: () => void;
  sx?: any;
}

const RoleChip: React.FC<RoleChipProps> = ({
  onRoleChange,
  sx,
}) => {
  const { state, updateUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isChanging, setIsChanging] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleChange = async (newRole: 'BUYER' | 'SELLER') => {
    if (newRole === state.user?.role || isChanging) {
      handleClose();
      return;
    }

    try {
      setIsChanging(true);
      await authAPI.updateUserRole(newRole);
      
      // Update user in context
      if (state.user) {
        const updatedUser = { ...state.user, role: newRole };
        updateUser(updatedUser);
      }
      
      // Call the callback if provided
      onRoleChange?.();
      
      handleClose();
    } catch (error: any) {
      console.error('Role change error:', error);
      // You might want to show a toast notification here
    } finally {
      setIsChanging(false);
    }
  };

  const getRoleIcon = () => {
    return state.user?.role === 'SELLER' ? <Store /> : <ShoppingCart />;
  };

  const getRoleLabel = () => {
    return state.user?.role === 'SELLER' ? 'Seller' : 'Buyer';
  };

  const getRoleColor = () => {
    return state.user?.role === 'SELLER' ? 'secondary' : 'primary';
  };

  if (!state.user) return null;

  return (
    <>
      <Chip
        icon={isChanging ? <CircularProgress size={16} /> : getRoleIcon()}
        label={getRoleLabel()}
        onClick={handleClick}
        color={getRoleColor()}
        variant="filled"
        size="small"
        disabled={isChanging}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
          },
          ...sx,
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            minWidth: 220,
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Switch Account Type
          </Typography>
        </Box>
        
        <MenuItem
          onClick={() => handleRoleChange('BUYER')}
          disabled={state.user?.role === 'BUYER' || isChanging}
          selected={state.user?.role === 'BUYER'}
        >
          <ListItemIcon>
            <ShoppingCart color={state.user?.role === 'BUYER' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText
            primary="Buyer Account"
            secondary="Browse products and participate in auctions"
          />
        </MenuItem>
        
        <MenuItem
          onClick={() => handleRoleChange('SELLER')}
          disabled={state.user?.role === 'SELLER' || isChanging}
          selected={state.user?.role === 'SELLER'}
        >
          <ListItemIcon>
            <Store color={state.user?.role === 'SELLER' ? 'secondary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText
            primary="Seller Account"
            secondary="List products and create auctions"
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default RoleChip;
