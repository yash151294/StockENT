import React, { forwardRef } from 'react';
import { Card, CardProps } from '@mui/material';
import { motion } from 'framer-motion';

interface LiquidGlassCardProps extends Omit<CardProps, 'sx' | 'variant'> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  hoverEffect?: boolean;
  glassIntensity?: 'low' | 'medium' | 'high';
  borderGlow?: boolean;
  customSx?: any;
}

const LiquidGlassCard = forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  (
    {
      children,
      variant = 'default',
      hoverEffect = true,
      glassIntensity = 'medium',
      borderGlow = true,
      customSx = {},
      ...props
    },
    ref
  ) => {

    // Glass effect configurations
    const glassConfigs = {
      low: {
        background: 'rgba(17, 17, 17, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(99, 102, 241, 0.08)',
      },
      medium: {
        background: 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99, 102, 241, 0.1)',
      },
      high: {
        background: 'rgba(17, 17, 17, 0.9)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
      },
    };

    // Variant configurations
    const variantConfigs = {
      default: {
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        hoverShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        hoverTransform: 'translateY(-8px)',
        hoverBorder: 'rgba(99, 102, 241, 0.3)',
      },
      elevated: {
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        hoverShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
        hoverTransform: 'translateY(-12px)',
        hoverBorder: 'rgba(99, 102, 241, 0.4)',
      },
      subtle: {
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
        hoverShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        hoverTransform: 'translateY(-4px)',
        hoverBorder: 'rgba(99, 102, 241, 0.2)',
      },
    };

    const glassConfig = glassConfigs[glassIntensity];
    const variantConfig = variantConfigs[variant];

    const baseSx = {
      position: 'relative',
      overflow: 'hidden',
      ...glassConfig,
      ...variantConfig,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: props.onClick ? 'pointer' : 'default',
      
      // Liquid glass effect
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(236, 72, 153, 0.05) 100%)',
        opacity: 0.3,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        zIndex: 1,
      },

      // Border glow effect
      ...(borderGlow && {
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
          borderRadius: 'inherit',
          opacity: 0.2,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: -1,
        },
      }),

      // Hover effects
      ...(hoverEffect && {
        '&:hover': {
          transform: variantConfig.hoverTransform,
          borderColor: variantConfig.hoverBorder,
          boxShadow: variantConfig.hoverShadow,
          
          '&::before': {
            opacity: 1,
          },
          
          ...(borderGlow && {
            '&::after': {
              opacity: 1,
            },
          }),
        },
      }),

      // Ensure content is above pseudo-elements
      '& > *': {
        position: 'relative',
        zIndex: 2,
      },
    };

    // Merge with custom styles
    const finalSx = {
      ...baseSx,
      ...customSx,
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={hoverEffect ? { scale: 1.02 } : {}}
        whileTap={hoverEffect ? { scale: 0.98 } : {}}
      >
        <Card
          ref={ref}
          sx={finalSx}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

LiquidGlassCard.displayName = 'LiquidGlassCard';

export default LiquidGlassCard;
