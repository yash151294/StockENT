import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import RoleSelectionModal from '../components/RoleSelectionModal';
import { authAPI } from '../services/api';

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithOAuth } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Prevent multiple executions
      if (hasProcessed) {
        return;
      }
      
      try {
        setHasProcessed(true);
        const authParam = searchParams.get('auth');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          setIsProcessing(false);
          return;
        }

        if (!authParam) {
          setError('No authentication data received');
          setIsProcessing(false);
          return;
        }

        // Parse the authentication data
        const authData = JSON.parse(decodeURIComponent(authParam));

        if (!authData.success) {
          setError(authData.error || 'Authentication failed');
          setIsProcessing(false);
          return;
        }

        const { user, isFirstLogin: firstLogin } = authData.data;

        // Debug: Log the user data to see if profile image URL is present
        logger.info('OAuth user data received:', {
          id: user.id,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          contactPerson: user.contactPerson,
          companyName: user.companyName,
          role: user.role
        });

        // If this is a first login, show role selection modal
        if (firstLogin) {
          setUserData(user);
          setShowRoleSelection(true);
          setIsProcessing(false);
          return;
        }

        // For existing users, login directly
        loginWithOAuth(user, firstLogin);

        // Set first login state
        setIsFirstLogin(firstLogin || false);

        logger.info('OAuth login successful, showing success message');
        
        // Show success state briefly before redirecting
        setIsSuccess(true);
        setIsProcessing(false);
        
        // Redirect to intended destination or dashboard after a brief delay to show success message
        setTimeout(() => {
          const from = (location.state as any)?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }, 2000);
      } catch (error: any) {
        logger.error('OAuth callback error:', error);
        setError('Failed to process authentication data');
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, loginWithOAuth, hasProcessed]);

  // Handle error redirect
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  // Handle role selection
  const handleRoleSelection = async (role: 'BUYER' | 'SELLER') => {
    try {
      // Update user role in backend
      await authAPI.updateUserRole(role);
      
      // Update local user data
      const updatedUser = { ...userData, role };
      
      // Login the user with updated role
      loginWithOAuth(updatedUser, true);
      
      // Set first login state
      setIsFirstLogin(true);

      logger.info('OAuth login with role selection successful');
      
      // Show success state briefly before redirecting
      setIsSuccess(true);
      setShowRoleSelection(false);
      
      // Redirect to intended destination or dashboard after a brief delay to show success message
      setTimeout(() => {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }, 2000);
    } catch (error: any) {
      logger.error('Role selection error:', error);
      setError('Failed to set account type. Please try again.');
    }
  };

  if (isProcessing) {
  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Completing sign-in...
        </Typography>
      </Box>

      {/* Role Selection Modal */}
      {userData && (
        <RoleSelectionModal
          open={showRoleSelection}
          onClose={() => setShowRoleSelection(false)}
          onRoleSelect={handleRoleSelection}
          userInfo={{
            name: userData.contactPerson || userData.companyName || userData.email.split('@')[0],
            email: userData.email,
            profileImageUrl: userData.profileImageUrl,
          }}
        />
      )}
    </>
  );
  }

  if (isSuccess) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
        p={3}
      >
        <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
        <Typography variant="h4" color="success.main" gutterBottom>
          {isFirstLogin ? 'Account Created!' : 'Welcome back!'}
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center">
          {isFirstLogin 
            ? 'Your account has been successfully created and verified.'
            : 'You have been successfully signed in with Google.'
          }
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Redirecting you to the dashboard...
        </Typography>
        <CircularProgress size={24} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
        p={3}
      >
        <Alert severity="error" sx={{ maxWidth: 500, width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Sign-in Failed
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary" align="center">
          You will be redirected to the login page in a few seconds.
        </Typography>
      </Box>
    );
  }

  return null;
};

export default OAuthCallbackPage;
