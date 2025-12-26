import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Email,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  const { data: verificationResult, isLoading } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authAPI.verifyEmail(token!),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (verificationResult) {
      if (verificationResult.data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(verificationResult.data.error || 'Verification failed');
      }
    }
  }, [verificationResult]);

  const handleContinue = () => {
    router.push('/login');
  };

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={24} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
            <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Invalid Verification Link
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              The verification link is invalid or has expired.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={24} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <CircularProgress size={64} sx={{ mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Verifying Email...
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Email Verified Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Your email has been verified. You can now log in to your account.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
              >
                Continue to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
              <Typography variant="body1" color="text.secondary" mb={3}>
                The verification link may have expired or is invalid.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyEmailPage;
