'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Grid,
  Divider,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as ConfirmIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useCart } from '../contexts/CartContext';

const steps = [
  { label: 'Review Cart', icon: <CartIcon /> },
  { label: 'Shipping Details', icon: <ShippingIcon /> },
  { label: 'Payment', icon: <PaymentIcon /> },
  { label: 'Confirmation', icon: <ConfirmIcon /> },
];

interface ShippingDetails {
  fullName: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { cartItems, getTotalValue, getItemCount, clearCart } = useCart();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    fullName: '',
    companyName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  });

  const handleNext = () => {
    if (activeStep === steps.length - 2) {
      // Submit order
      handleSubmitOrder();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    // Simulate order submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setActiveStep(steps.length - 1);
    // Clear cart after successful order
    clearCart();
  };

  const handleShippingChange = (field: keyof ShippingDetails) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setShippingDetails((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  if (cartItems.length === 0 && activeStep !== steps.length - 1) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Your cart is empty
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Please add items to your cart before proceeding to checkout.
          </Typography>
          <Button variant="contained" onClick={() => router.push('/products')}>
            Browse Products
          </Button>
        </Paper>
      </Container>
    );
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Order
            </Typography>
            {cartItems.map((item) => (
              <Card key={item.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.product?.title || 'Product'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {item.quantity}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} textAlign="right">
                      <Typography variant="h6">
                        {item.currency} {(item.priceAtAddition * item.quantity).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Total ({getItemCount()} items)
              </Typography>
              <Typography variant="h5" color="primary">
                ${getTotalValue().toFixed(2)}
              </Typography>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Shipping Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={shippingDetails.fullName}
                  onChange={handleShippingChange('fullName')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={shippingDetails.companyName}
                  onChange={handleShippingChange('companyName')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={shippingDetails.address}
                  onChange={handleShippingChange('address')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={shippingDetails.city}
                  onChange={handleShippingChange('city')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State/Province"
                  value={shippingDetails.state}
                  onChange={handleShippingChange('state')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP/Postal Code"
                  value={shippingDetails.zipCode}
                  onChange={handleShippingChange('zipCode')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={shippingDetails.country}
                  onChange={handleShippingChange('country')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={shippingDetails.phone}
                  onChange={handleShippingChange('phone')}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              This is a B2B marketplace. Payment will be arranged directly with the seller
              after order confirmation.
            </Alert>
            <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Order Summary
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Subtotal</Typography>
                <Typography>${getTotalValue().toFixed(2)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Shipping</Typography>
                <Typography>To be determined</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  ${getTotalValue().toFixed(2)}
                </Typography>
              </Box>
            </Paper>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              By placing this order, you agree to our terms and conditions.
              The seller will contact you to arrange payment and shipping.
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box textAlign="center" py={4}>
            <ConfirmIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Order Placed Successfully!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Thank you for your order. The seller(s) will contact you shortly
              to arrange payment and shipping details.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: index <= activeStep ? 'primary.main' : 'grey.700',
                    color: 'white',
                  }}
                >
                  {step.icon}
                </Box>
              )}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 4 }}>
        {renderStepContent(activeStep)}

        {activeStep < steps.length - 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {activeStep === steps.length - 2
                ? isSubmitting
                  ? 'Placing Order...'
                  : 'Place Order'
                : 'Continue'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CheckoutPage;
