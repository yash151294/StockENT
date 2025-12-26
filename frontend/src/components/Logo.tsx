import React from 'react';
import { Box } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';

interface LogoProps {
  size?: number;
  color?: string;
  variant?: 'full' | 'icon';
  textColor?: string;
  clickable?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  color = '#6366F1',
  variant = 'full',
  textColor,
  clickable = true
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const iconSize = size * 0.6;

  const handleLogoClick = () => {
    if (clickable && pathname !== '/') {
      router.push('/');
    }
  };
  
  return (
    <Box
      onClick={handleLogoClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        cursor: clickable && pathname !== '/' ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: clickable && pathname !== '/' ? 'scale(1.05)' : 'none',
        },
      }}
    >
      {/* Logo Icon */}
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
            animation: 'shimmer 2s ease-in-out infinite',
          },
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        }}
      >
        {/* Minimalistic "S" icon */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            fill="white"
            opacity="0.3"
          />
          <path
            d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"
            fill="white"
            opacity="0.6"
          />
          <path
            d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
            fill="white"
          />
          {/* Minimalistic "S" shape */}
          <path
            d="M9 8h6v2H9v4h4v2H9v-2h4v-2H9V8z"
            fill="white"
            opacity="0.8"
          />
        </svg>
      </Box>
      
      {/* Logo Text - only show if variant is 'full' */}
      {variant === 'full' && (
        <Box
          sx={{
            fontWeight: 800,
            fontSize: '1.5rem',
            color: textColor || (color === 'white' ? '#FFFFFF' : color),
            letterSpacing: '-0.02em',
            textShadow: color === 'white' ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none',
          }}
        >
          StockENT
        </Box>
      )}
    </Box>
  );
};

export default Logo;
