import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { negotiationAPI } from '../services/negotiationAPI';
import { useAuth } from '../contexts/AuthContext';
import { NegotiationRoom } from '../components/negotiation/NegotiationRoom';
import LoadingSpinner from '../components/LoadingSpinner';

export const NegotiationDetailPage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { state } = useAuth();

  const {
    data: negotiation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['negotiation', id],
    queryFn: () => negotiationAPI.getNegotiation(id!),
    enabled: !!id && !!state.user,
  });

  const handleBack = () => {
    router.push('/negotiations');
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error || !negotiation) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load negotiation: {error?.message || 'Negotiation not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Negotiations
        </Button>
      </Container>
    );
  }

  // Check if user has access to this negotiation
  if (
    negotiation.buyerId !== state.user?.id &&
    negotiation.sellerId !== state.user?.id
  ) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          You don't have access to this negotiation.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Negotiations
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => router.push('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <HomeIcon fontSize="small" />
          Home
        </Link>
        <Link
          component="button"
          variant="body2"
          onClick={() => router.push('/negotiations')}
        >
          Negotiations
        </Link>
        <Typography variant="body2" color="text.primary">
          Negotiation Details
        </Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Negotiations
        </Button>
      </Box>

      {/* Negotiation Room */}
      <NegotiationRoom
        negotiation={negotiation}
        currentUserId={state.user?.id!}
      />
    </Container>
  );
};
