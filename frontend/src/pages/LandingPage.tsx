import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Stack,
} from '@mui/material';
import {
  Search,
  Gavel,
  Message,
  Security,
  Language,
  Speed,
  TrendingUp,
  People,
  Inventory,
  Verified,
  Person,
  Settings,
  Logout,
  ArrowForward,
  Star,
  CheckCircle,
  TrendingDown,
  LocalShipping,
  Support,
  Analytics,
  Shield,
  Bolt,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { authAPI } from '../services/api';
import RoleChip from '../components/RoleChip';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { state, logout, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();

  const [userType, setUserType] = React.useState<'buyer' | 'seller'>('buyer');

  const handleUserTypeChange = async (
    event: React.MouseEvent<HTMLElement>,
    newUserType: 'buyer' | 'seller' | null,
  ) => {
    if (newUserType !== null) {
      if (state.isAuthenticated) {
        // For authenticated users, update their role via API
        try {
          const newRole = newUserType === 'seller' ? 'SELLER' : 'BUYER';
          
          // Call the API to update the user's role
          const response = await authAPI.updateUserRole(newRole);
          
          if (response.data.success) {
            // Update local state
            setUserType(newUserType);
            
            // Update the auth context with the new role
            // This will trigger a re-render with the updated role
            if (state.user) {
              updateUser({ ...state.user, role: newRole });
            }
            
            // Show success notification
            showSuccess(
              `Role updated to ${newUserType === 'seller' ? 'Seller' : 'Buyer'} successfully!`
            );
          } else {
            throw new Error(response.data.error || 'Failed to update role');
          }
        } catch (error) {
          console.error('Error updating user role:', error);
          showError('Failed to update role. Please try again.');
        }
      } else {
        // For non-authenticated users, just update the local state
        setUserType(newUserType);
      }
    }
  };

  // Helper function to get dynamic primary color based on user type
  const getPrimaryColor = () => {
    if (state.isAuthenticated) {
      return state.user?.role === 'SELLER' ? 'secondary.main' : 'primary.main';
    }
    return userType === 'seller' ? 'secondary.main' : 'primary.main';
  };


  const features = [
    {
      icon: <Search sx={{ fontSize: 48, color: '#6366F1' }} />,
      title: 'Smart Search',
      description: 'AI-powered search with advanced filtering to find exactly what you need',
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      icon: <Gavel sx={{ fontSize: 48, color: '#6366F1' }} />,
      title: 'Live Auctions',
      description: 'Real-time bidding with automatic features and instant notifications',
      gradient: 'from-blue-400 to-cyan-500',
    },
    {
      icon: <Message sx={{ fontSize: 48, color: '#6366F1' }} />,
      title: 'Secure Messaging',
      description: 'End-to-end encrypted communication with verified partners',
      gradient: 'from-purple-400 to-pink-500',
    },
    {
      icon: <Security sx={{ fontSize: 48, color: '#6366F1' }} />,
      title: 'Trusted Platform',
      description: 'Enterprise-grade security with verified transactions',
      gradient: 'from-orange-400 to-red-500',
    },
    {
      icon: <Analytics sx={{ fontSize: 48, color: '#6366F1' }} />,
      title: 'Market Insights',
      description: 'Real-time analytics and market trends for informed decisions',
      gradient: 'from-indigo-400 to-blue-500',
    },
    {
      icon: <Bolt sx={{ fontSize: 48, color: '#6366F1' }} />,
      title: 'Lightning Fast',
      description: 'Optimized performance with instant updates and notifications',
      gradient: 'from-yellow-400 to-orange-500',
    },
  ];

  const stats = [
    { number: '25,000+', label: 'Active Users', icon: <People /> },
    { number: '100,000+', label: 'Products Listed', icon: <Inventory /> },
    { number: '5,000+', label: 'Successful Deals', icon: <TrendingUp /> },
    { number: '99.9%', label: 'Uptime', icon: <CheckCircle /> },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      company: 'Textile Solutions Inc.',
      role: 'Procurement Manager',
      content: 'StockENT has revolutionized our sourcing process. We found premium materials 40% faster.',
      rating: 5,
    },
    {
      name: 'Ahmed Hassan',
      company: 'Global Textiles Ltd.',
      role: 'Sales Director',
      content: 'The auction system increased our sales by 60%. Best platform for B2B textile trading.',
      rating: 5,
    },
    {
      name: 'Maria Rodriguez',
      company: 'Fashion Forward Co.',
      role: 'Buyer',
      content: 'Incredible variety and quality. The messaging system makes negotiations seamless.',
      rating: 5,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)' }}>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)',
          color: 'white',
          pt: 8,
          pb: 6,
          position: 'relative',
          overflow: 'hidden',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          // Ensure content is always visible
          '& > *': {
            position: 'relative',
            zIndex: 2,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 70% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 20% 60%, rgba(99, 102, 241, 0.03) 0%, transparent 40%)
            `,
            pointerEvents: 'none',
            zIndex: 1,
            animation: 'liquidGlass 12s ease-in-out infinite',
          },
          '@keyframes liquidGlass': {
            '0%, 100%': {
              transform: 'translateX(0) translateY(0) scale(1)',
              opacity: 0.2,
            },
            '25%': {
              transform: 'translateX(-5px) translateY(-3px) scale(1.01)',
              opacity: 0.4,
            },
            '50%': {
              transform: 'translateX(3px) translateY(-5px) scale(0.99)',
              opacity: 0.3,
            },
            '75%': {
              transform: 'translateX(-3px) translateY(3px) scale(1.005)',
              opacity: 0.5,
            },
          },
        }}
      >
        <Container maxWidth="lg" sx={{ 
          position: 'relative', 
          zIndex: 2, 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 3, sm: 4, md: 5 },
          pb: { xs: 3, sm: 4, md: 5 }
        }}>
          {/* User Type Toggle - Show for all users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              width: '100%',
              mb: 6,
              mx: 'auto',
              maxWidth: 'fit-content',
              mt: { xs: 2, sm: 3, md: 4 }
            }}>
              <ToggleButtonGroup
                value={state.isAuthenticated ? (state.user?.role === 'SELLER' ? 'seller' : 'buyer') : userType}
                exclusive
                onChange={handleUserTypeChange}
                aria-label="user type"
                sx={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 3,
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 'auto',
                  minWidth: 'fit-content',
                  '& .MuiToggleButton-root': {
                    color: '#6366F1',
                    border: 'none',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      boxShadow: 'none',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#6366F1',
                      color: '#FFFFFF',
                      '&:hover': {
                        backgroundColor: '#4F46E5',
                        boxShadow: 'none',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="buyer" aria-label="buyer">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Inventory />
                    Buyer
                  </Box>
                </ToggleButton>
                <ToggleButton value="seller" aria-label="seller">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Seller
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </motion.div>
          
          <Grid container spacing={5} alignItems="center" sx={{ 
            justifyContent: 'center',
            width: '100%'
          }}>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                style={{ willChange: 'transform, opacity', width: '100%' }}
              >
                <Typography 
                  variant="h1" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 800,
                    fontSize: { xs: '2.2rem', md: '3rem', lg: '3.5rem' },
                    lineHeight: 1.1,
                    mb: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {state.isAuthenticated ? (
                    state.user?.role === 'SELLER' 
                      ? 'Sell Your Textile Products'
                      : 'Find Quality Textile Materials'
                  ) : userType === 'seller'
                    ? 'Sell Your Textile Products'
                    : 'Find Quality Textile Materials'}
                </Typography>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    opacity: 0.8, 
                    mb: 4,
                    textAlign: 'center',
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                    lineHeight: 1.6,
                  }}
                >
                  {state.isAuthenticated ? (
                    state.user?.role === 'SELLER' 
                      ? 'List your surplus inventory and connect with buyers worldwide. Create auctions, set fixed prices, and grow your business.'
                      : 'Discover quality textile materials from verified suppliers. Browse products, participate in auctions, and source materials efficiently.'
                  ) : userType === 'seller'
                    ? 'List your surplus inventory and connect with buyers worldwide. Create auctions, set fixed prices, and grow your business.'
                    : 'Discover quality textile materials from verified suppliers. Browse products, participate in auctions, and source materials efficiently.'}
                </Typography>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4, justifyContent: 'center' }}>
                    {state.isAuthenticated ? (
                      <>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => navigate('/dashboard')}
                          endIcon={<ArrowForward />}
                          sx={{ 
                            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                            color: '#000000',
                            fontWeight: 600,
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            '&:hover': { 
                              background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
                              transform: 'translateY(-2px)',
                            }
                          }}
                        >
                          Go to Dashboard
                        </Button>
                        {state.user?.role === 'SELLER' ? (
                          <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/products/create')}
                            sx={{ 
                              borderColor: '#6366F1', 
                              color: '#6366F1',
                              borderWidth: 2,
                              px: 4,
                              py: 1.5,
                              fontSize: '1.1rem',
                              '&:hover': { 
                                borderColor: '#818CF8',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                transform: 'translateY(-2px)',
                              }
                            }}
                          >
                            List Products
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/products')}
                            sx={{ 
                              borderColor: '#6366F1', 
                              color: '#6366F1',
                              borderWidth: 2,
                              px: 4,
                              py: 1.5,
                              fontSize: '1.1rem',
                              '&:hover': { 
                                borderColor: '#818CF8',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                transform: 'translateY(-2px)',
                              }
                            }}
                          >
                            Browse Products
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => navigate('/register')}
                          endIcon={<ArrowForward />}
                          sx={{ 
                            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                            color: '#000000',
                            fontWeight: 600,
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            '&:hover': { 
                              background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
                              transform: 'translateY(-2px)',
                            }
                          }}
                        >
                          Get Started Free
                        </Button>
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => navigate('/login')}
                          sx={{ 
                            borderColor: '#6366F1', 
                            color: '#6366F1',
                            borderWidth: 2,
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            '&:hover': { 
                              borderColor: '#818CF8',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              transform: 'translateY(-2px)',
                            }
                          }}
                        >
                          Sign In
                        </Button>
                      </>
                    )}
                  </Stack>
                </motion.div>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{ width: '100%' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: { xs: 250, md: 320 },
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: 4,
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, transparent 50%, rgba(99, 102, 241, 0.1) 100%)',
                      animation: 'gradient 3s ease infinite',
                    },
                  }}
                >
                  <Box sx={{ textAlign: 'center', zIndex: 1 }}>
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Inventory sx={{ fontSize: 80, color: '#6366F1', mb: 2 }} />
                    </motion.div>
                    <Typography variant="h4" sx={{ color: '#6366F1', fontWeight: 600 }}>
                      Platform Preview
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.7, mt: 1 }}>
                      Interactive marketplace coming soon
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box 
        sx={{ 
          py: 8, 
          background: 'linear-gradient(135deg, #111111 0%, #0A0A0A 100%)',
          borderTop: '1px solid rgba(99, 102, 241, 0.1)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={4}>
              {stats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      sx={{
                        background: 'rgba(99, 102, 241, 0.05)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: 3,
                        p: 3,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          background: 'rgba(99, 102, 241, 0.1)',
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                        },
                      }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                            color: '#000000',
                            mx: 'auto',
                            mb: 2,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {stat.icon}
                        </Box>
                      </Box>
                      <Typography 
                        variant="h3" 
                        component="div" 
                        sx={{ 
                          fontWeight: 800,
                          color: '#6366F1',
                          mb: 1,
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontWeight: 500,
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Box 
        sx={{ 
          py: 12,
          background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            viewport={{ once: true }}
          >
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography 
                variant="h2" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                }}
              >
                Why Choose StockENT?
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 400,
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                Built specifically for the textile industry with cutting-edge features that matter
              </Typography>
            </Box>
            
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%', 
                        background: 'rgba(17, 17, 17, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        borderRadius: 3,
                        p: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          borderColor: 'rgba(99, 102, 241, 0.3)',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 0 }}>
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Box sx={{ mb: 3 }}>
                            {feature.icon}
                          </Box>
                        </motion.div>
                        <Typography 
                          variant="h5" 
                          component="h3" 
                          gutterBottom 
                          sx={{ 
                            fontWeight: 700,
                            color: '#6366F1',
                            mb: 2,
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.8)',
                            lineHeight: 1.6,
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box 
        sx={{ 
          py: 12,
          background: 'linear-gradient(135deg, #111111 0%, #0A0A0A 100%)',
          borderTop: '1px solid rgba(99, 102, 241, 0.1)',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            viewport={{ once: true }}
          >
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography 
                variant="h2" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                }}
              >
                What Our Users Say
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 400,
                }}
              >
                Trusted by thousands of textile professionals worldwide
              </Typography>
            </Box>
            
            <Grid container spacing={4}>
              {testimonials.map((testimonial, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%', 
                        background: 'rgba(17, 17, 17, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        borderRadius: 3,
                        p: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: 'rgba(99, 102, 241, 0.3)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 0 }}>
                        <Box sx={{ display: 'flex', mb: 2 }}>
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} sx={{ color: '#6366F1', fontSize: 20 }} />
                          ))}
                        </Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.9)',
                            lineHeight: 1.6,
                            mb: 3,
                            fontStyle: 'italic',
                          }}
                        >
                          "{testimonial.content}"
                        </Typography>
                        <Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: '#6366F1',
                              fontWeight: 600,
                              mb: 0.5,
                            }}
                          >
                            {testimonial.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.6)',
                              mb: 0.5,
                            }}
                          >
                            {testimonial.role}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.5)',
                            }}
                          >
                            {testimonial.company}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
          color: '#000000',
          py: 12,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            viewport={{ once: true }}
            style={{ width: '100%' }}
          >
            <Box textAlign="center" sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <Typography 
                variant="h2" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 800,
                  color: '#000000',
                  mb: 3,
                }}
              >
                Ready to Start Trading?
              </Typography>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  color: 'rgba(0, 0, 0, 0.8)',
                  mb: 4,
                  fontWeight: 400,
                }}
              >
                Join thousands of textile professionals already using StockENT to grow their business
              </Typography>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  endIcon={<ArrowForward />}
                  sx={{ 
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: '#6366F1',
                    fontWeight: 600,
                    px: 6,
                    py: 2,
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    '&:hover': { 
                      background: 'rgba(0, 0, 0, 1)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  Create Free Account
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        </Container>
      </Box>
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #0A0A0A 0%, #000000 100%)',
          color: 'white', 
          py: 8,
          borderTop: '1px solid rgba(99, 102, 241, 0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between" alignItems="flex-start">
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                viewport={{ once: true }}
                style={{ width: '100%', maxWidth: '300px' }}
              >
                <Logo 
                  size={35}
                  color="#6366F1"
                  textColor="#FFFFFF"
                  variant="full"
                  clickable={false}
                />
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  The leading B2B marketplace for textile materials. Connecting mills with manufacturers worldwide.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Chip 
                    label="Trusted" 
                    sx={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }} 
                  />
                  <Chip 
                    label="Secure" 
                    sx={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }} 
                  />
                  <Chip 
                    label="Global" 
                    sx={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }} 
                  />
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                viewport={{ once: true }}
                style={{ width: '100%', maxWidth: '300px' }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: '#6366F1',
                    fontWeight: 600,
                    mb: 3,
                    textAlign: 'center',
                  }}
                >
                  Quick Links
                </Typography>
                <Stack spacing={2} sx={{ alignItems: 'center' }}>
                  {state.isAuthenticated ? (
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/products')}
                      startIcon={<Inventory sx={{ fontSize: 20 }} />}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        width: '100%',
                        minHeight: 'auto',
                        padding: '12px 16px',
                        margin: 0,
                        color: 'rgba(255, 255, 255, 0.8)',
                        '& .MuiButton-startIcon': {
                          marginRight: '8px',
                          marginLeft: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                        },
                        '&:hover': {
                          color: '#6366F1',
                          backgroundColor: 'transparent',
                        }
                      }}
                    >
                      Browse Products
                    </Button>
                  ) : (
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/login')}
                      startIcon={<Person sx={{ fontSize: 20 }} />}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        width: '100%',
                        minHeight: 'auto',
                        padding: '12px 16px',
                        margin: 0,
                        color: 'rgba(255, 255, 255, 0.8)',
                        boxShadow: 'none',
                        '& .MuiButton-startIcon': {
                          marginRight: '8px',
                          marginLeft: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                        },
                        '&:hover': {
                          color: '#6366F1',
                          backgroundColor: 'transparent',
                          boxShadow: 'none',
                        }
                      }}
                    >
                      Sign In to Browse
                    </Button>
                  )}
                  {state.isAuthenticated ? (
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/auctions')}
                      startIcon={<Gavel sx={{ fontSize: 20 }} />}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        width: '100%',
                        minHeight: 'auto',
                        padding: '12px 16px',
                        margin: 0,
                        color: 'rgba(255, 255, 255, 0.8)',
                        '& .MuiButton-startIcon': {
                          marginRight: '8px',
                          marginLeft: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                        },
                        '&:hover': {
                          color: '#6366F1',
                          backgroundColor: 'transparent',
                        }
                      }}
                    >
                      Live Auctions
                    </Button>
                  ) : (
                    <Button 
                      color="inherit" 
                      onClick={() => navigate('/login')}
                      startIcon={<Gavel sx={{ fontSize: 20 }} />}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        width: '100%',
                        minHeight: 'auto',
                        padding: '12px 16px',
                        margin: 0,
                        color: 'rgba(255, 255, 255, 0.8)',
                        boxShadow: 'none',
                        '& .MuiButton-startIcon': {
                          marginRight: '8px',
                          marginLeft: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                        },
                        '&:hover': {
                          color: '#6366F1',
                          backgroundColor: 'transparent',
                          boxShadow: 'none',
                        }
                      }}
                    >
                      Sign In for Auctions
                    </Button>
                  )}
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                viewport={{ once: true }}
                style={{ width: '100%', maxWidth: '300px' }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: '#6366F1',
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  Support
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Message sx={{ color: '#6366F1', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      support@stockent.com
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Support sx={{ color: '#6366F1', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      +1 (555) 123-4567
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Shield sx={{ color: '#6366F1', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      24/7 Security Monitoring
                    </Typography>
                  </Box>
                </Stack>
              </motion.div>
            </Grid>
          </Grid>
          <Box 
            sx={{ 
              borderTop: '1px solid rgba(99, 102, 241, 0.2)', 
              mt: 6, 
              pt: 4,
              textAlign: 'center',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              © 2024 StockENT. All rights reserved. Built with ❤️ for the textile industry.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
