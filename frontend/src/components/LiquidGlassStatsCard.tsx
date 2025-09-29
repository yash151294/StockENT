import React, { forwardRef } from 'react';
import { CardContent, Typography, Avatar, Box } from '@mui/material';
import LiquidGlassCard from './LiquidGlassCard';

interface LiquidGlassStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  action?: () => void;
  loading?: boolean;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

const LiquidGlassStatsCard = forwardRef<HTMLDivElement, LiquidGlassStatsCardProps>(
  (
    {
      title,
      value,
      icon,
      color = 'primary',
      action,
      loading = false,
      trend,
      subtitle,
      variant = 'default',
    },
    ref
  ) => {
    const colorConfigs = {
      primary: {
        bg: 'rgba(99, 102, 241, 0.1)',
        iconBg: 'rgba(99, 102, 241, 0.2)',
        iconColor: '#6366F1',
        border: 'rgba(99, 102, 241, 0.3)',
        text: '#6366F1',
      },
      secondary: {
        bg: 'rgba(168, 85, 247, 0.1)',
        iconBg: 'rgba(168, 85, 247, 0.2)',
        iconColor: '#A855F7',
        border: 'rgba(168, 85, 247, 0.3)',
        text: '#A855F7',
      },
      success: {
        bg: 'rgba(34, 197, 94, 0.1)',
        iconBg: 'rgba(34, 197, 94, 0.2)',
        iconColor: '#22C55E',
        border: 'rgba(34, 197, 94, 0.3)',
        text: '#22C55E',
      },
      warning: {
        bg: 'rgba(245, 158, 11, 0.1)',
        iconBg: 'rgba(245, 158, 11, 0.2)',
        iconColor: '#F59E0B',
        border: 'rgba(245, 158, 11, 0.3)',
        text: '#F59E0B',
      },
      error: {
        bg: 'rgba(239, 68, 68, 0.1)',
        iconBg: 'rgba(239, 68, 68, 0.2)',
        iconColor: '#EF4444',
        border: 'rgba(239, 68, 68, 0.3)',
        text: '#EF4444',
      },
      info: {
        bg: 'rgba(59, 130, 246, 0.1)',
        iconBg: 'rgba(59, 130, 246, 0.2)',
        iconColor: '#3B82F6',
        border: 'rgba(59, 130, 246, 0.3)',
        text: '#3B82F6',
      },
    };

    const colorConfig = colorConfigs[color];

    const getTrendIcon = () => {
      if (!trend) return null;
      switch (trend.direction) {
        case 'up':
          return '↗';
        case 'down':
          return '↘';
        default:
          return '→';
      }
    };

    const getTrendColor = () => {
      if (!trend) return 'rgba(255, 255, 255, 0.6)';
      switch (trend.direction) {
        case 'up':
          return '#22C55E';
        case 'down':
          return '#EF4444';
        default:
          return '#F59E0B';
      }
    };

    return (
      <LiquidGlassCard
        ref={ref}
        variant={variant}
        hoverEffect={!!action}
        onClick={action}
        customSx={{
          height: '100%',
          minHeight: 140,
        }}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.75rem',
                  mb: 0.5,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '2rem',
                  lineHeight: 1,
                }}
              >
                {loading ? '...' : value}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.75rem',
                    mt: 0.5,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                color: '#000000',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.5rem',
                  color: '#000000 !important',
                },
                '& svg': {
                  color: '#000000 !important',
                  fontSize: '1.5rem',
                },
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  color: '#000000',
                  fontSize: '1.5rem',
                } 
              })}
            </Avatar>
          </Box>

          {trend && (
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              mt="auto"
              sx={{
                backgroundColor: colorConfig.bg,
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                border: `1px solid ${colorConfig.border}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: getTrendColor(),
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {getTrendIcon()} {Math.abs(trend.value)}%
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.7rem',
                }}
              >
                vs last period
              </Typography>
            </Box>
          )}
        </CardContent>
      </LiquidGlassCard>
    );
  }
);

LiquidGlassStatsCard.displayName = 'LiquidGlassStatsCard';

export default LiquidGlassStatsCard;
