import React, { useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const FirstLoginWelcome: React.FC = () => {
  const { state, clearFirstLoginMessage } = useAuth();

  useEffect(() => {
    // Auto-hide the message after 5 seconds
    const timer = setTimeout(() => {
      clearFirstLoginMessage();
    }, 5000);

    return () => clearTimeout(timer);
  }, [clearFirstLoginMessage]);

  if (!state.showFirstLoginMessage || !state.user) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: 400,
        minWidth: 300,
      }}
    >
      <Alert
        severity="success"
        icon={<CheckCircle />}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={clearFirstLoginMessage}
          >
            Dismiss
          </Button>
        }
        sx={{
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Typography variant="h6" gutterBottom>
          Welcome to StockENT!
        </Typography>
        <Typography variant="body2">
          You have successfully signed in with Google. Here's what's happening with your account today.
        </Typography>
      </Alert>
    </Box>
  );
};

export default FirstLoginWelcome;
