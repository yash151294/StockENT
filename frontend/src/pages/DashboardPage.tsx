import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  Gavel,
  Message,
  Person,
  AttachMoney,
  ShoppingCart,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dashboardAPI } from '../services/api';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, clearJustLoggedIn } = useAuth();
  const { t } = useLanguage();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    activeAuctions: 0,
    totalMessages: 0,
    watchlistItems: 0,
    recentProducts: [],
    recentBids: [],
    recentConversations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get display name
  const getDisplayName = () => {
    const user = state.user;
    if (user?.contactPerson) return user.contactPerson;
    if (user?.companyName) return user.companyName;
    if (user?.email) {
      // Extract name from email (part before @)
      const nameFromEmail = user.email.split('@')[0];
      // Convert to title case
      return nameFromEmail.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'User';
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardAPI.getDashboardStats();
        setDashboardData(response.data.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (state.isAuthenticated) {
      fetchDashboardData();
    }
  }, [state.isAuthenticated]);


  const stats = state.user?.role === 'SELLER' ? [
    {
      title: 'My Products',
      value: loading ? '...' : dashboardData.totalProducts.toString(),
      icon: <Inventory />,
      color: 'primary',
      action: () => navigate('/products?my=true'),
    },
    {
      title: 'My Auctions',
      value: loading ? '...' : dashboardData.activeAuctions.toString(),
      icon: <Gavel />,
      color: 'secondary',
      action: () => navigate('/auctions?my=true'),
    },
    {
      title: 'Messages',
      value: loading ? '...' : dashboardData.totalMessages.toString(),
      icon: <Message />,
      color: 'success',
      action: () => navigate('/messages'),
    },
    {
      title: 'Profile Views',
      value: loading ? '...' : '0',
      icon: <Visibility />,
      color: 'warning',
      action: () => navigate('/profile'),
    },
  ] : [
    {
      title: 'Total Products',
      value: loading ? '...' : dashboardData.totalProducts.toString(),
      icon: <Inventory />,
      color: 'primary',
      action: () => navigate('/products'),
    },
    {
      title: 'Active Auctions',
      value: loading ? '...' : dashboardData.activeAuctions.toString(),
      icon: <Gavel />,
      color: 'secondary',
      action: () => navigate('/auctions'),
    },
    {
      title: 'Messages',
      value: loading ? '...' : dashboardData.totalMessages.toString(),
      icon: <Message />,
      color: 'success',
      action: () => navigate('/messages'),
    },
    {
      title: 'Watchlist',
      value: loading ? '...' : dashboardData.watchlistItems.toString(),
      icon: <Visibility />,
      color: 'warning',
      action: () => navigate('/profile?tab=watchlist'),
    },
  ];

  // Generate recent activities from real data
  const generateRecentActivities = () => {
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      time: string;
      icon: React.ReactElement;
    }> = [];

    // Add recent products
    dashboardData.recentProducts.slice(0, 2).forEach((product: any) => {
      activities.push({
        id: `product-${product.id}`,
        type: 'product',
        title: 'Product Listed',
        description: product.title,
        time: new Date(product.createdAt).toLocaleDateString(),
        icon: <Inventory />,
      });
    });

    // Add recent bids
    dashboardData.recentBids.slice(0, 2).forEach((bid: any) => {
      activities.push({
        id: `bid-${bid.id}`,
        type: 'auction',
        title: 'Bid Placed',
        description: `${bid.auction?.product?.title || 'Auction'} - $${bid.amount}`,
        time: new Date(bid.createdAt).toLocaleDateString(),
        icon: <Gavel />,
      });
    });

    // Add recent conversations
    dashboardData.recentConversations.slice(0, 1).forEach((conversation: any) => {
      activities.push({
        id: `conversation-${conversation.id}`,
        type: 'message',
        title: 'New Message',
        description: `From ${conversation.otherUser?.companyName || conversation.otherUser?.email}`,
        time: new Date(conversation.updatedAt).toLocaleDateString(),
        icon: <Message />,
      });
    });

    return activities.slice(0, 5); // Limit to 5 activities
  };

  const recentActivities = generateRecentActivities();

  const quickActions = state.user?.role === 'SELLER' ? [
    {
      title: 'List Product',
      description: 'Add a new product to sell',
      icon: <Inventory />,
      action: () => navigate('/products/create'),
      color: 'primary',
    },
    {
      title: 'Start Auction',
      description: 'Create a new auction',
      icon: <Gavel />,
      action: () => navigate('/auctions/create'),
      color: 'secondary',
    },
    {
      title: 'My Products',
      description: 'Manage your listings',
      icon: <Inventory />,
      action: () => navigate('/products?my=true'),
      color: 'success',
    },
    {
      title: 'View Messages',
      description: 'Check your conversations',
      icon: <Message />,
      action: () => navigate('/messages'),
      color: 'info',
    },
  ] : [
    {
      title: 'Browse Products',
      description: 'Find materials to buy',
      icon: <ShoppingCart />,
      action: () => navigate('/products'),
      color: 'primary',
    },
    {
      title: 'Live Auctions',
      description: 'Participate in auctions',
      icon: <Gavel />,
      action: () => navigate('/auctions'),
      color: 'secondary',
    },
    {
      title: 'My Watchlist',
      description: 'Track products you like',
      icon: <Visibility />,
      action: () => navigate('/profile?tab=watchlist'),
      color: 'success',
    },
    {
      title: 'View Messages',
      description: 'Check your conversations',
      icon: <Message />,
      action: () => navigate('/messages'),
      color: 'info',
    },
  ];

  return (
    <Box>
      {/* Role-based accent bar */}
      <Box
        sx={{
          height: 4,
          background: state.user?.role === 'SELLER' 
            ? 'linear-gradient(90deg, #dc004e 0%, #ff5983 100%)'
            : 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
          mb: 3,
          transition: 'background 0.3s ease',
        }}
      />
      {/* Welcome message for newly logged in users */}
      {state.justLoggedIn && state.isAuthenticated && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => clearJustLoggedIn()}
        >
          <Typography variant="h6" gutterBottom>
            Welcome back, {getDisplayName()}!
          </Typography>
          <Typography variant="body2">
            You have successfully signed in with Google. Here's what's happening with your account today.
          </Typography>
        </Alert>
      )}

      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {getDisplayName()}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {state.user?.role === 'SELLER' 
            ? 'Manage your listings, track sales, and connect with buyers.'
            : 'Discover new products, track your bids, and find the best deals.'
          }
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
              onClick={stat.action}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    {loading ? (
                      <Skeleton variant="text" width={60} height={40} />
                    ) : (
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={action.action}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: `${action.color}.main`,
                            width: 48,
                            height: 48,
                            mx: 'auto',
                            mb: 1,
                          }}
                        >
                          {action.icon}
                        </Avatar>
                        <Typography variant="subtitle1" gutterBottom>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              {loading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <React.Fragment key={i}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                        <Box flex={1}>
                          <Skeleton variant="text" width="60%" height={20} />
                          <Skeleton variant="text" width="80%" height={16} />
                          <Skeleton variant="text" width="40%" height={14} />
                        </Box>
                      </Box>
                      {i < 3 && <Divider sx={{ mb: 2 }} />}
                    </React.Fragment>
                  ))}
                </Box>
              ) : recentActivities.length > 0 ? (
                <List>
                  {recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {activity.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <Box component="div" sx={{ display: 'block' }}>
                              <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.875rem' }}>
                                {activity.description}
                              </Box>
                              <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
                                {activity.time}
                              </Box>
                            </Box>
                          }
                          secondaryTypographyProps={{
                            component: 'div'
                          }}
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No recent activity to show
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Account Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Status
              </Typography>
              
              {/* Verification Status */}
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip
                  label={state.user?.verificationStatus || 'PENDING'}
                  color={
                    state.user?.verificationStatus === 'VERIFIED'
                      ? 'success'
                      : state.user?.verificationStatus === 'REJECTED'
                      ? 'error'
                      : 'warning'
                  }
                />
                <Typography variant="body2" color="text.secondary">
                  {state.user?.verificationStatus === 'VERIFIED'
                    ? 'Your account is verified'
                    : state.user?.verificationStatus === 'REJECTED'
                    ? 'Your account verification was rejected'
                    : 'Your account is pending verification'}
                </Typography>
              </Box>

              {state.user?.verificationStatus !== 'VERIFIED' && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/profile?tab=verification')}
                >
                  Complete Verification
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
};

export default DashboardPage;
