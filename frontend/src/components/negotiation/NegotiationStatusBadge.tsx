import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { NegotiationStatus } from '../../types';

interface NegotiationStatusBadgeProps {
  status: NegotiationStatus;
  size?: ChipProps['size'];
  variant?: ChipProps['variant'];
}

export const NegotiationStatusBadge: React.FC<NegotiationStatusBadgeProps> = ({
  status,
  size = 'small',
  variant = 'outlined',
}) => {
  const getStatusConfig = (status: NegotiationStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending',
          color: 'warning' as const,
          icon: '⏳',
        };
      case 'COUNTERED':
        return {
          label: 'Countered',
          color: 'info' as const,
          icon: '💰',
        };
      case 'ACCEPTED':
        return {
          label: 'Accepted',
          color: 'success' as const,
          icon: '✅',
        };
      case 'DECLINED':
        return {
          label: 'Declined',
          color: 'error' as const,
          icon: '❌',
        };
      case 'EXPIRED':
        return {
          label: 'Expired',
          color: 'default' as const,
          icon: '⏰',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          color: 'default' as const,
          icon: '🚫',
        };
      default:
        return {
          label: status,
          color: 'default' as const,
          icon: '❓',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={`${config.icon} ${config.label}`}
      color={config.color}
      size={size}
      variant={variant}
      sx={{
        fontWeight: 600,
        '& .MuiChip-label': {
          fontSize: '0.75rem',
        },
      }}
    />
  );
};
