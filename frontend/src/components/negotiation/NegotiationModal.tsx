import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { negotiationAPI } from '../../services/negotiationAPI';
import { useNotification } from '../../contexts/NotificationContext';
import { Product } from '../../types';

interface NegotiationModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  open,
  onClose,
  product,
}) => {
  const [offer, setOffer] = useState<number>(product.basePrice * 0.8); // Start at 80% of base price
  const [message, setMessage] = useState<string>('');
  const { showSuccess, showWarning } = useNotification();
  const queryClient = useQueryClient();

  const createNegotiationMutation = useMutation({
    mutationFn: negotiationAPI.createNegotiation,
    onSuccess: () => {
      showSuccess('Negotiation offer sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      onClose();
      // Reset form
      setOffer(product.basePrice * 0.8);
      setMessage('');
    },
    onError: (error: any) => {
      showWarning(
        error.response?.data?.message || 'Failed to send negotiation offer'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (offer <= 0) {
      showWarning('Offer amount must be greater than 0');
      return;
    }

    if (offer > product.basePrice * 1.5) {
      showWarning('Offer amount cannot exceed 150% of base price');
      return;
    }

    createNegotiationMutation.mutate({
      productId: product.id,
      buyerOffer: offer,
      buyerMessage: message.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!createNegotiationMutation.isPending) {
      onClose();
      // Reset form
      setOffer(product.basePrice * 0.8);
      setMessage('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Make an Offer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {product.title}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            {/* Product Info */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Product Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Base Price:</strong> {product.basePrice.toFixed(2)} {product.currency}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Available Quantity:</strong> {product.quantityAvailable} {product.unit}
              </Typography>
              <Typography variant="body2">
                <strong>Minimum Order:</strong> {product.minOrderQuantity} {product.unit}
              </Typography>
            </Box>

            {/* Negotiation Info */}
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Important:</strong> You can only make one offer per product. 
                The seller can send one counter-offer, and you can accept or decline it.
              </Typography>
            </Alert>

            {/* Offer Amount */}
            <TextField
              label="Your Offer Amount"
              type="number"
              value={offer}
              onChange={(e) => setOffer(parseFloat(e.target.value) || 0)}
              fullWidth
              required
              inputProps={{
                min: 0.01,
                max: product.basePrice * 1.5,
                step: 0.01,
              }}
              helperText={`Enter amount between ${(product.basePrice * 0.1).toFixed(2)} and ${(product.basePrice * 1.5).toFixed(2)} ${product.currency}`}
            />

            {/* Message */}
            <TextField
              label="Message (Optional)"
              multiline
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              placeholder="Add a message to explain your offer..."
              inputProps={{ maxLength: 500 }}
              helperText={`${message.length}/500 characters`}
            />

            {/* Offer Summary */}
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Offer Summary
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Your Offer:</strong> {offer.toFixed(2)} {product.currency}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Savings:</strong> {((product.basePrice - offer) / product.basePrice * 100).toFixed(1)}% off base price
              </Typography>
              <Typography variant="body2">
                <strong>Total Savings:</strong> {(product.basePrice - offer).toFixed(2)} {product.currency}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={createNegotiationMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createNegotiationMutation.isPending || offer <= 0}
          >
            {createNegotiationMutation.isPending ? 'Sending...' : 'Send Offer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
