import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'small' | 'medium' | 'large';
  clickable?: boolean;
  sx?: any;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  size = 'medium', 
  clickable = true,
  sx = {} 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate('/');
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: 36 };
      case 'large':
        return { width: 200, height: 60 };
      default: // medium
        return { width: 160, height: 48 };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === 'icon') {
    return (
      <Box
        component="img"
        src="/logo.svg"
        alt="StockENT"
        onClick={handleClick}
        sx={{
          width: 48,
          height: 48,
          cursor: clickable ? 'pointer' : 'default',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': clickable ? {
            transform: 'scale(1.05)',
          } : {},
          ...sx,
        }}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: clickable ? 'pointer' : 'default',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': clickable ? {
            transform: 'scale(1.02)',
          } : {},
          ...sx,
        }}
      >
        <Box
          component="img"
          src="/logo.svg"
          alt="StockENT"
          sx={{
            width: 40,
            height: 40,
            mr: 1,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '1.25rem',
          }}
        >
          StockENT
        </Typography>
      </Box>
    );
  }

  // Full variant (default)
  return (
    <Box
      component="img"
      src="/logo.svg"
      alt="StockENT"
      onClick={handleClick}
      sx={{
        ...sizeStyles,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': clickable ? {
          transform: 'scale(1.02)',
        } : {},
        ...sx,
      }}
    />
  );
};

export default Logo;
