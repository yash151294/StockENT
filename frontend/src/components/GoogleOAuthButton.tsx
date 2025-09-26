import React, { useEffect, useState } from 'react';
import { Button, CircularProgress, SxProps, Theme } from '@mui/material';
import { Google } from '@mui/icons-material';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';

interface GoogleOAuthButtonProps {
  onError?: (error: string) => void;
  onSuccess?: () => void;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onError,
  onSuccess,
  disabled = false,
  variant = 'outlined',
  size = 'large',
  fullWidth = false,
  sx,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  // const { loginWithOAuth } = useAuth();
  // const navigate = useNavigate();

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (window.google) {
        setIsGoogleLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGoogleLoaded(true);
      };
      script.onerror = () => {
        onError?.('Failed to load Google Identity Services');
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, [onError]);

  const handleGoogleSignIn = async () => {
    if (!isGoogleLoaded || !window.google) {
      onError?.('Google Identity Services not loaded');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Getting Google OAuth URL...');

      // Get Google OAuth URL from backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/google/url`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Google OAuth URL response:', data);

      if (!data.success) {
        // Check if it's a configuration error
        if (data.error && data.error.includes('not configured')) {
          setIsConfigured(false);
          throw new Error('Google OAuth is not configured. Please contact the administrator.');
        }
        throw new Error(data.error || 'Failed to get Google OAuth URL');
      }

      console.log('Redirecting to Google OAuth:', data.data.authUrl);
      // Redirect to Google OAuth
      window.location.href = data.data.authUrl;
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      let errorMessage = 'Google sign-in failed';
      
      if (error.message.includes('Server error')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message.includes('not configured')) {
        errorMessage = 'Google sign-in is not available. Please contact support.';
      } else if (error.message.includes('Failed to get Google OAuth URL')) {
        errorMessage = 'Unable to start Google sign-in. Please try again.';
      } else {
        errorMessage = error.message || 'Google sign-in failed. Please try again.';
      }
      
      onError?.(errorMessage);
      setIsLoading(false);
    }
  };

  // No longer need to handle callback here since it's handled by a dedicated route

  // Don't render if Google OAuth is not configured
  if (!isConfigured) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || isLoading || !isGoogleLoaded}
      onClick={handleGoogleSignIn}
      startIcon={isLoading ? <CircularProgress size={20} /> : <Google />}
      sx={[
        {
          backgroundColor: variant === 'contained' ? '#4285f4' : 'transparent',
          color: variant === 'contained' ? 'white' : '#4285f4',
          borderColor: '#4285f4',
          '&:hover': {
            backgroundColor: variant === 'contained' ? '#3367d6' : 'rgba(66, 133, 244, 0.04)',
            borderColor: '#3367d6',
          },
          textTransform: 'none',
          fontWeight: 500,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
};

export default GoogleOAuthButton;
