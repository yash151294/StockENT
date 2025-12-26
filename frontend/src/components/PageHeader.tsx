import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backPath?: string;
  onBackClick?: () => void;
  noTopSpacing?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backPath = '/',
  onBackClick,
  noTopSpacing = false
}) => {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.push(backPath);
    }
  };

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)',
      py: noTopSpacing ? [2, 4, 6] : 8,
      pt: noTopSpacing ? 1 : undefined,
      mb: 4,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 1,
      },
      '& > *': {
        position: 'relative',
        zIndex: 2,
      },
    }}>
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        mb: subtitle ? 3 : 0
      }}>
        {showBackButton && (
          <IconButton 
            onClick={handleBackClick}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
              }
            }}
          >
            <ArrowBack />
          </IconButton>
        )}
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          {title}
        </Typography>
      </Box>
      {subtitle && (
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 400,
            maxWidth: '600px', 
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default PageHeader;
