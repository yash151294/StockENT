import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Stack,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
  ArrowBack,
  Security,
  Speed,
  Shield,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import GoogleOAuthButton from '../components/GoogleOAuthButton';
import { motion } from 'framer-motion';

const LoginPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = yup.object({
    email: yup
      .string()
      .email('Invalid email format')
      .required('Email is required'),
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError(null);
        await login(values.email, values.password);
        // Redirect to intended destination or dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } catch (err: any) {
        setError(err.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #0A0A0A 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Paper 
            elevation={0} 
            sx={{ 
              p: 6, 
              borderRadius: 4,
              background: 'rgba(17, 17, 17, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/')}
                sx={{
                  color: '#6366F1',
                  mb: 3,
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  }
                }}
              >
                Back to Home
              </Button>
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Box textAlign="center" mb={6}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 400,
                    mb: 3,
                  }}
                >
                  Sign in to your StockENT account
                </Typography>
                
                {/* Security Features */}
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                  <Chip 
                    icon={<Security />} 
                    label="Secure" 
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }} 
                  />
                  <Chip 
                    icon={<Speed />} 
                    label="Fast" 
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }} 
                  />
                  <Chip 
                    icon={<Shield />} 
                    label="Trusted" 
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }} 
                  />
                </Stack>
              </Box>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    color: '#ff6b6b',
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            <motion.form
              onSubmit={formik.handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#6366F1' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#6366F1',
                  },
                }}
              />

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#6366F1' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleShowPassword}
                        edge="end"
                        sx={{ color: '#6366F1' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#6366F1',
                  },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                <Link
                  component={RouterLink}
                  to="/reset-password"
                  variant="body2"
                  sx={{ 
                    color: '#6366F1',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Forgot your password?
                </Link>
              </Box>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={isLoading ? <LoadingSpinner size={20} /> : <LoginIcon />}
                  sx={{ 
                    mb: 4,
                    background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                    color: '#000000',
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #818CF8 0%, #22C55E 100%)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      background: 'rgba(99, 102, 241, 0.3)',
                      color: 'rgba(0, 0, 0, 0.5)',
                    }
                  }}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </motion.div>

              <Divider sx={{ my: 4 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    px: 2,
                  }}
                >
                  OR
                </Typography>
              </Divider>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.1 }}
              >
                <GoogleOAuthButton
                  onError={setError}
                  onSuccess={() => {
                    const from = (location.state as any)?.from?.pathname || '/dashboard';
                    navigate(from, { replace: true });
                  }}
                  fullWidth
                  size="large"
                  sx={{ 
                    mb: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#6366F1',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      borderColor: '#6366F1',
                    }
                  }}
                />
              </motion.div>

              <Box textAlign="center">
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 1,
                  }}
                >
                  Don't have an account?
                </Typography>
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  sx={{ 
                    color: '#6366F1',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Create your free account
                </Link>
              </Box>
            </motion.form>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
