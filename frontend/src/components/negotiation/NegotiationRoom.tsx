import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  Divider,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import {
  Send as SendIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../contexts/SocketContext';
import { negotiationAPI } from '../../services/negotiationAPI';
import { useNotification } from '../../contexts/NotificationContext';
import { Negotiation, CounterOfferData } from '../../types';

interface NegotiationRoomProps {
  negotiation: Negotiation;
  currentUserId: string;
}

export const NegotiationRoom: React.FC<NegotiationRoomProps> = ({
  negotiation,
  currentUserId,
}) => {
  const [counterOffer, setCounterOffer] = useState<number>(negotiation.buyerOffer * 1.1);
  const [sellerMessage, setSellerMessage] = useState<string>('');
  const { socket, joinNegotiation, leaveNegotiation } = useSocket();
  const { showSuccess, showWarning } = useNotification();
  const queryClient = useQueryClient();

  const isBuyer = negotiation.buyerId === currentUserId;
  const isSeller = negotiation.sellerId === currentUserId;

  // Join negotiation room when component mounts
  useEffect(() => {
    if (socket) {
      joinNegotiation(negotiation.id);
    }

    return () => {
      if (socket) {
        leaveNegotiation(negotiation.id);
      }
    };
  }, [socket, negotiation.id, joinNegotiation, leaveNegotiation]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNegotiationUpdate = (updatedNegotiation: Negotiation) => {
      queryClient.invalidateQueries({ queryKey: ['negotiation', negotiation.id] });
      showSuccess('Negotiation updated');
    };

    socket.on('counter_offer_received', handleNegotiationUpdate);
    socket.on('negotiation_accepted', handleNegotiationUpdate);
    socket.on('negotiation_declined', handleNegotiationUpdate);

    return () => {
      socket.off('counter_offer_received', handleNegotiationUpdate);
      socket.off('negotiation_accepted', handleNegotiationUpdate);
      socket.off('negotiation_declined', handleNegotiationUpdate);
    };
  }, [socket, negotiation.id, queryClient, showSuccess]);

  // Mutations
  const sendCounterOfferMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CounterOfferData }) => 
      negotiationAPI.sendCounterOffer(id, data),
    onSuccess: () => {
      showSuccess('Counter-offer sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['negotiation', negotiation.id] });
      setSellerMessage('');
    },
    onError: (error: any) => {
      showWarning(
        error.response?.data?.message || 'Failed to send counter-offer'
      );
    },
  });

  const acceptCounterOfferMutation = useMutation({
    mutationFn: negotiationAPI.acceptCounterOffer,
    onSuccess: () => {
      showSuccess('Counter-offer accepted! Item added to cart');
      queryClient.invalidateQueries({ queryKey: ['negotiation', negotiation.id] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      showWarning(
        error.response?.data?.message || 'Failed to accept counter-offer'
      );
    },
  });

  const declineCounterOfferMutation = useMutation({
    mutationFn: negotiationAPI.declineCounterOffer,
    onSuccess: () => {
      showSuccess('Counter-offer declined');
      queryClient.invalidateQueries({ queryKey: ['negotiation', negotiation.id] });
    },
    onError: (error: any) => {
      showWarning(
        error.response?.data?.message || 'Failed to decline counter-offer'
      );
    },
  });

  const handleSendCounterOffer = () => {
    if (counterOffer <= negotiation.buyerOffer) {
      showWarning('Counter-offer must be higher than buyer\'s offer');
      return;
    }

    sendCounterOfferMutation.mutate({
      id: negotiation.id,
      data: {
        counterOffer,
        sellerMessage: sellerMessage.trim() || undefined,
      }
    });
  };

  const handleAcceptCounterOffer = () => {
    acceptCounterOfferMutation.mutate(negotiation.id);
  };

  const handleDeclineCounterOffer = () => {
    declineCounterOfferMutation.mutate(negotiation.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'COUNTERED':
        return 'info';
      case 'ACCEPTED':
        return 'success';
      case 'DECLINED':
        return 'error';
      case 'EXPIRED':
        return 'default';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1">
              Negotiation Room
            </Typography>
            <Chip
              label={negotiation.status}
              color={getStatusColor(negotiation.status)}
              variant="outlined"
            />
          </Box>

          <Typography variant="h6" color="primary">
            {negotiation.product?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Negotiation between {negotiation.buyer?.companyName} and {negotiation.seller?.companyName}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Product Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Product Details
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Base Price:</strong> {negotiation.product?.basePrice?.toFixed(2)} {negotiation.product?.currency}
              </Typography>
              <Typography variant="body2">
                <strong>Available:</strong> {negotiation.product?.quantityAvailable} {negotiation.product?.unit}
              </Typography>
              <Typography variant="body2">
                <strong>Minimum Order:</strong> {negotiation.product?.minOrderQuantity} {negotiation.product?.unit}
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        {/* Negotiation Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Buyer's Offer */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon color="primary" />
                  Buyer's Offer
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{negotiation.buyer?.companyName}</strong> offered{' '}
                    <strong>{negotiation.buyerOffer.toFixed(2)} {negotiation.product?.currency}</strong>
                    {negotiation.buyerMessage && (
                      <>
                        <br />
                        <br />
                        <em>"{negotiation.buyerMessage}"</em>
                      </>
                    )}
                  </Typography>
                </Alert>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Seller's Counter-Offer */}
              {negotiation.status === 'COUNTERED' && negotiation.sellerCounterOffer && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="secondary" />
                    Seller's Counter-Offer
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>{negotiation.seller?.companyName}</strong> countered with{' '}
                      <strong>{negotiation.sellerCounterOffer.toFixed(2)} {negotiation.product?.currency}</strong>
                      {negotiation.sellerMessage && (
                        <>
                          <br />
                          <br />
                          <em>"{negotiation.sellerMessage}"</em>
                        </>
                      )}
                    </Typography>
                  </Alert>

                  {/* Buyer Actions */}
                  {isBuyer && (
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={handleAcceptCounterOffer}
                        disabled={acceptCounterOfferMutation.isPending}
                      >
                        Accept Counter-Offer
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={handleDeclineCounterOffer}
                        disabled={declineCounterOfferMutation.isPending}
                      >
                        Decline
                      </Button>
                    </Stack>
                  )}
                </Box>
              )}

              {/* Seller Counter-Offer Form */}
              {isSeller && negotiation.status === 'PENDING' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Send Counter-Offer
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    You can only send one counter-offer. Make it count!
                  </Alert>

                  <Stack spacing={2}>
                    <TextField
                      label="Counter-Offer Amount"
                      type="number"
                      value={counterOffer}
                      onChange={(e) => setCounterOffer(parseFloat(e.target.value) || 0)}
                      fullWidth
                      inputProps={{
                        min: negotiation.buyerOffer + 0.01,
                        step: 0.01,
                      }}
                      helperText={`Must be higher than buyer's offer of ${negotiation.buyerOffer.toFixed(2)} ${negotiation.product?.currency}`}
                    />

                    <TextField
                      label="Message (Optional)"
                      multiline
                      rows={2}
                      value={sellerMessage}
                      onChange={(e) => setSellerMessage(e.target.value)}
                      fullWidth
                      placeholder="Add a message to explain your counter-offer..."
                      inputProps={{ maxLength: 500 }}
                    />

                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSendCounterOffer}
                      disabled={sendCounterOfferMutation.isPending || counterOffer <= negotiation.buyerOffer}
                      fullWidth
                    >
                      Send Counter-Offer
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Final Status */}
              {['ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'].includes(negotiation.status) && (
                <Alert severity={negotiation.status === 'ACCEPTED' ? 'success' : 'info'} sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {negotiation.status === 'ACCEPTED' && 'Counter-offer accepted! Item has been added to cart.'}
                    {negotiation.status === 'DECLINED' && 'Counter-offer was declined.'}
                    {negotiation.status === 'EXPIRED' && 'Negotiation has expired.'}
                    {negotiation.status === 'CANCELLED' && 'Negotiation was cancelled.'}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
