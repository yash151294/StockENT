import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import RoleChip from '../components/RoleChip';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { state, logout } = useAuth();
  const { showSuccess } = useNotification();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [userType, setUserType] = React.useState<'buyer' | 'seller'>('buyer');

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('You have been logged out successfully');
      navigate('/');
      handleProfileMenuClose();
    } catch (error) {
      // Handle logout error if needed
      console.error('Logout error:', error);
    }
  };

  const handleUserTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newUserType: 'buyer' | 'seller' | null,
  ) => {
    if (newUserType !== null) {
      setUserType(newUserType);
    }
  };

  // Helper function to get dynamic primary color based on user type
  const getPrimaryColor = () => {
    if (state.isAuthenticated) {
      return state.user?.role === 'SELLER' ? 'secondary.main' : 'primary.main';
    }
    return userType === 'seller' ? 'secondary.main' : 'primary.main';
  };

  // Helper function to get avatar initials
  const getAvatarInitials = () => {
    const user = state.user;
    if (user?.contactPerson) {
      // Use first letter of contact person name
      return user.contactPerson.charAt(0).toUpperCase();
    }
    if (user?.companyName) {
      // Use first letter of company name
      return user.companyName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      // Use first letter of email
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Helper function to get profile image URL with fallback
  const getProfileImageUrl = () => {
    const user = state.user;
    if (user?.profileImageUrl) {
      // Add debugging
      console.log('Using profile image URL:', user.profileImageUrl);
      return user.profileImageUrl;
    }
    console.log('No profile image URL available');
    return undefined;
  };

  const features = [
    {
      icon: <Search sx={{ fontSize: 40, color: getPrimaryColor() }} />,
      title: 'Advanced Textile Search',
      description: 'Find fabrics by weight, composition, certifications (OEKO-TEX, GOTS), and technical specifications with precision filtering',
    },
    {
      icon: <Gavel sx={{ fontSize: 40, color: getPrimaryColor() }} />,
      title: 'Live Dead Stock Auctions',
      description: 'Participate in real-time auctions for surplus inventory with automatic bidding and reserve price protection',
    },
    {
      icon: <Message sx={{ fontSize: 40, color: getPrimaryColor() }} />,
      title: 'Secure B2B Messaging',
      description: 'Communicate with verified textile suppliers and buyers while maintaining business confidentiality',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: getPrimaryColor() }} />,
      title: 'Verified Suppliers',
      description: 'Trade with confidence using our verified supplier network with quality certifications and compliance tracking',
    },
    {
      icon: <Language sx={{ fontSize: 40, color: getPrimaryColor() }} />,
      title: 'Global Textile Network',
      description: 'Connect with mills, manufacturers, and suppliers worldwide in English, Chinese, and Turkish',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: getPrimaryColor() }} />,
      title: 'Real-Time Inventory',
      description: 'Get instant updates on dead stock availability, price changes, and new surplus listings',
    },
  ];

  const stats = [
    { number: '2,500+', label: 'Verified Textile Suppliers' },
    { number: '15,000+', label: 'Dead Stock Listings' },
    { number: '3,200+', label: 'Successful B2B Transactions' },
    { number: '95%', label: 'Waste Reduction Achieved' },
  ];

  return (
    <Box>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          backgroundColor: state.isAuthenticated 
            ? state.user?.role === 'SELLER' 
              ? 'secondary.main' 
              : 'primary.main'
            : userType === 'seller' 
              ? 'secondary.main'
              : 'primary.main',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: state.isAuthenticated 
                ? 'white' 
                : 'white',
              transition: 'color 0.3s ease',
            }}
          >
            StockENT
          </Typography>
          
          {/* User Menu */}
          {state.isAuthenticated && (
            <>
              {/* Role Chip */}
              <RoleChip 
                onRoleChange={() => {
                  // Refresh the page to show updated UI based on new role
                  window.location.reload();
                }}
                sx={{ 
                  mr: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              />
              
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="primary-search-account-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                sx={{ color: 'white' }}
              >
                <Avatar 
                  sx={{ width: 32, height: 32 }}
                  src={getProfileImageUrl()}
                  alt={state.user?.contactPerson || state.user?.companyName || state.user?.email}
                  onLoad={() => console.log('Avatar image loaded successfully')}
                  onError={(e) => console.log('Avatar image failed to load:', e, 'URL:', getProfileImageUrl())}
                >
                  {!getProfileImageUrl() && getAvatarInitials()}
                </Avatar>
              </IconButton>
              <Menu
                id="primary-search-account-menu"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  {t('navigation.profile')}
                </MenuItem>
                <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  {t('navigation.settings')}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  {t('auth.logout')}
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: state.isAuthenticated 
            ? state.user?.role === 'SELLER'
              ? 'linear-gradient(135deg, #dc004e 0%, #ff5983 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
            : userType === 'seller'
              ? 'linear-gradient(135deg, #dc004e 0%, #ff5983 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: 8,
          transition: 'background 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          {/* User Type Toggle - Only show when not authenticated */}
          {!state.isAuthenticated && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
              <ToggleButtonGroup
                value={userType}
                exclusive
                onChange={handleUserTypeChange}
                aria-label="user type"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  '& .MuiToggleButton-root': {
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: userType === 'seller' ? 'secondary.main' : 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="buyer" aria-label="buyer">
                  Buyer
                </ToggleButton>
                <ToggleButton value="seller" aria-label="seller">
                  Seller
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                {state.isAuthenticated ? (
                  state.user?.role === 'SELLER' 
                    ? 'Transform Your Dead Stock into Revenue'
                    : 'Source Premium Textile Materials'
                ) : userType === 'seller'
                  ? 'Transform Your Dead Stock into Revenue'
                  : 'Source Premium Textile Materials'}
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ opacity: 0.9, mb: 4 }}>
                {state.isAuthenticated ? (
                  state.user?.role === 'SELLER' 
                    ? 'Connect with global buyers for your surplus inventory. List dead stock with technical specifications, certifications, and create competitive auctions to maximize returns.'
                    : 'Access verified textile suppliers with OEKO-TEX, GOTS certified materials. Find fabrics by weight, composition, and technical specs. Reduce waste through circular fashion sourcing.'
                ) : userType === 'seller'
                  ? 'Connect with global buyers for your surplus inventory. List dead stock with technical specifications, certifications, and create competitive auctions to maximize returns.'
                  : 'Access verified textile suppliers with OEKO-TEX, GOTS certified materials. Find fabrics by weight, composition, and technical specs. Reduce waste through circular fashion sourcing.'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {state.isAuthenticated ? (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/dashboard')}
                      sx={{ bgcolor: 'white', color: getPrimaryColor(), '&:hover': { bgcolor: 'grey.100' } }}
                    >
                      Go to Dashboard
                    </Button>
                    {state.user?.role === 'SELLER' ? (
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/products/create')}
                        sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                      >
                        List Products
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/products')}
                        sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
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
                      sx={{ bgcolor: 'white', color: getPrimaryColor(), '&:hover': { bgcolor: 'grey.100' } }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h4" sx={{ opacity: 0.7 }}>
                  Platform Preview
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box textAlign="center">
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ 
                      fontWeight: 700,
                      color: getPrimaryColor()
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 700 }}>
            Why Choose StockENT for Textile Dead Stock?
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            The only B2B marketplace designed specifically for textile professionals with industry expertise and circular economy focus
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: state.isAuthenticated 
            ? state.user?.role === 'SELLER'
              ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
              : 'linear-gradient(135deg, #dc004e 0%, #ff5983 100%)'
            : userType === 'buyer'
              ? 'linear-gradient(135deg, #dc004e 0%, #ff5983 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: 8,
          transition: 'background 0.3s ease',
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
              Ready to Transform Your Textile Business?
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ opacity: 0.9, mb: 4 }}>
              Join 2,500+ verified textile suppliers and buyers already using StockENT to reduce waste and maximize revenue through circular fashion
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ 
                bgcolor: 'white', 
                color: state.isAuthenticated 
                  ? state.user?.role === 'SELLER'
                    ? 'primary.main'
                    : 'secondary.main'
                  : userType === 'buyer'
                    ? 'secondary.main'
                    : 'primary.main',
                '&:hover': { bgcolor: 'grey.100' } 
              }}
            >
              Create Free Account
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                StockENT
              </Typography>
              <Typography variant="body2" color="grey.400">
                The leading B2B marketplace for textile dead stock and surplus materials. Connecting verified mills, manufacturers, and suppliers worldwide to reduce waste and maximize value through circular fashion.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1,
                alignItems: 'flex-start'
              }}>
                {state.isAuthenticated ? (
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/products')}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      minWidth: 'auto',
                      p: 0
                    }}
                  >
                    Browse Products
                  </Button>
                ) : (
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/login')}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      minWidth: 'auto',
                      p: 0
                    }}
                  >
                    Sign In to Browse
                  </Button>
                )}
                {state.isAuthenticated ? (
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/auctions')}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      minWidth: 'auto',
                      p: 0
                    }}
                  >
                    Live Auctions
                  </Button>
                ) : (
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/login')}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      minWidth: 'auto',
                      p: 0
                    }}
                  >
                    Sign In for Auctions
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Support
              </Typography>
              <Typography variant="body2" color="grey.400">
                Email: support@stockent.com
              </Typography>
              <Typography variant="body2" color="grey.400">
                Phone: +1 (555) 123-4567
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid', borderColor: 'grey.800', mt: 4, pt: 2 }}>
            <Typography variant="body2" color="grey.400" textAlign="center">
              © 2024 StockENT. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
