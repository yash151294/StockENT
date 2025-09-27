import React, { useState } from 'react';
import {
  Button,
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
  SwapHoriz,
  ShoppingCart,
  Store,
  ArrowDropDown,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

interface RoleButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onRoleChange?: () => void;
  sx?: any;
}

const RoleButton: React.FC<RoleButtonProps> = ({
  variant = 'outlined',
  size = 'small',
  showLabel = true,
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
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          disabled={isChanging}
          startIcon={isChanging ? <CircularProgress size={16} /> : getRoleIcon()}
          endIcon={!isChanging ? <ArrowDropDown /> : undefined}
          sx={{
            minWidth: 'auto',
            textTransform: 'none',
            fontWeight: 500,
            ...sx,
          }}
        >
          {showLabel && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="body2" component="span">
                {getRoleLabel()}
              </Typography>
            </Box>
          )}
        </Button>
      </motion.div>

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
            minWidth: 200,
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

export default RoleButton;
