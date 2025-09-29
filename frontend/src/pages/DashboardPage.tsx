import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  CardContent,
  Typography,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory,
  Gavel,
  Message,
  ShoppingCart,
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../hooks/useConversations';
import { dashboardAPI } from '../services/api';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import LiquidGlassStatsCard from '../components/LiquidGlassStatsCard';
import LiquidGlassCard from '../components/LiquidGlassCard';
import NotificationDebug from '../components/NotificationDebug';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, clearJustLoggedIn } = useAuth();
  const { hasConversations, isLoading: conversationsLoading, error: conversationsError } = useConversations();

  // Debug logging for dashboard
  console.log('🔍 Dashboard Debug:', {
    isAuthenticated: state.isAuthenticated,
    userRole: state.user?.role,
    hasConversations,
    conversationsLoading,
    conversationsError
  });


  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProducts: 0,
      activeAuctions: 0,
      totalMessages: 0,
      watchlistItems: 0,
    },
    recentActivities: [],
    watchlistItems: [],
  });

  // State for role change animation
  const [isRoleChanging, setIsRoleChanging] = useState(false);
  const [previousRole, setPreviousRole] = useState<string | null>(null);

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

  // Fetch dashboard data using React Query
  const { data: dashboardResponse, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['dashboard', state.user?.role], // Include user role in query key
    queryFn: () => dashboardAPI.getDashboardStats(),
    enabled: state.isAuthenticated,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache data for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update local state when query data changes
  useEffect(() => {
    if (dashboardResponse?.data?.data) {
      console.log('📊 Dashboard data fetched:', dashboardResponse.data.data);
      setDashboardData(dashboardResponse.data.data);
    }
  }, [dashboardResponse]);

  // Force refresh dashboard data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.isAuthenticated) {
        console.log('🔄 Dashboard became visible, refetching data...');
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refetch when component mounts (user navigates to dashboard)
    if (state.isAuthenticated) {
      console.log('🔄 Dashboard mounted, refetching data...');
      refetch();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch, state.isAuthenticated]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('❌ Dashboard fetch error:', error);
    }
  }, [error]);

  // Force refetch when user role changes
  useEffect(() => {
    if (state.isAuthenticated && state.user?.role) {
      // Check if role actually changed
      if (previousRole && previousRole !== state.user.role) {
        console.log('🔄 Role changed, starting animation for role:', state.user.role);
        setIsRoleChanging(true);
        
        // Start the role change animation
        setTimeout(() => {
          refetch();
        }, 300); // Small delay to show the transition
        
        // Reset animation state after data loads
        setTimeout(() => {
          setIsRoleChanging(false);
        }, 1000);
      } else {
        console.log('🔄 Role changed, refetching dashboard data for role:', state.user.role);
        refetch();
      }
      
      setPreviousRole(state.user.role);
    }
  }, [state.user?.role, refetch, state.isAuthenticated, previousRole]);



  const stats = state.user?.role === 'SELLER' ? [
    {
      title: 'My Products',
      value: loading ? '...' : dashboardData.stats?.totalProducts?.toString() || '0',
      icon: <Inventory />,
      color: 'primary',
      action: () => navigate('/products?my=true'),
    },
    {
      title: 'My Auctions',
      value: loading ? '...' : dashboardData.stats?.activeAuctions?.toString() || '0',
      icon: <Gavel />,
      color: 'secondary',
      action: () => navigate('/auctions?my=true'),
    },
    {
      title: 'Messages',
      value: loading ? '...' : dashboardData.stats?.totalMessages?.toString() || '0',
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
      value: loading ? '...' : dashboardData.stats?.totalProducts?.toString() || '0',
      icon: <Inventory />,
      color: 'primary',
      action: () => navigate('/products'),
    },
    {
      title: 'Active Auctions',
      value: loading ? '...' : dashboardData.stats?.activeAuctions?.toString() || '0',
      icon: <Gavel />,
      color: 'secondary',
      action: () => navigate('/auctions'),
    },
    {
      title: 'Messages',
      value: loading ? '...' : dashboardData.stats?.totalMessages?.toString() || '0',
      icon: <Message />,
      color: 'success',
      action: () => navigate('/messages'),
    },
    {
      title: 'Watchlist',
      value: loading ? '...' : dashboardData.stats?.watchlistItems?.toString() || '0',
      icon: <Visibility />,
      color: 'warning',
      action: () => navigate('/watchlist'),
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

    // Use the recentActivities from the API if available, otherwise generate from individual arrays
    if (dashboardData.recentActivities && dashboardData.recentActivities.length > 0) {
      dashboardData.recentActivities.slice(0, 5).forEach((activity: any) => {
        let icon = <Inventory />;
        if (activity.icon === 'gavel') icon = <Gavel />;
        else if (activity.icon === 'message') icon = <Message />;
        else if (activity.icon === 'visibility') icon = <Visibility />;

        activities.push({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          time: new Date(activity.time).toLocaleDateString(),
          icon: icon,
        });
      });
    } else {
      // Fallback: No recent activities to show
      // The backend now only provides unread messages and auction bids
      // If no activities are returned, the card will show "No recent activity"
    }

    return activities.slice(0, 5); // Limit to 5 activities
  };

  const recentActivities = generateRecentActivities();

  // Base actions for sellers and buyers
  const sellerActions = [
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
  ];

  const buyerActions = [
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
  ];

  // Messages action (only show if user has conversations)
  const messagesAction = {
    title: 'View Messages',
    description: 'Check your conversations',
    icon: <Message />,
    action: () => navigate('/messages'),
    color: 'info',
  };

  // Combine actions based on role and conversation status
  const quickActions = state.user?.role === 'SELLER' 
    ? [...sellerActions, ...(hasConversations ? [messagesAction] : [])]
    : [...buyerActions, ...(hasConversations ? [messagesAction] : [])];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
      color: 'white'
    }}>
      {/* Header Section */}
      <PageHeader
        title="Dashboard"
        subtitle={state.user?.role === 'SELLER' 
          ? 'Manage your listings, track sales, and connect with buyers.'
          : 'Discover new products, track your bids, and find the best deals.'
        }
      />

      {/* Alert Messages Container */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 10 }}>
        {/* Welcome message for newly logged in users */}
        {state.justLoggedIn && state.isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert 
              severity="success" 
              sx={{ 
                mb: 4,
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#6366F1',
                position: 'relative',
                zIndex: 10,
              }}
              onClose={() => clearJustLoggedIn()}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#6366F1' }}>
                Welcome back, {getDisplayName()}!
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {state.loginMethod === 'google' 
                  ? "You have successfully signed in with Google. Here's what's happening with your account today."
                  : "You have successfully signed in. Here's what's happening with your account today."
                }
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                color: '#ff6b6b',
                position: 'relative',
                zIndex: 10,
              }}
            >
              {error instanceof Error ? error.message : 'Failed to load dashboard data'}
            </Alert>
          </motion.div>
        )}
      </Box>

      {/* Welcome Card with Stats */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isRoleChanging ? 0.98 : 1
        }}
        transition={{ 
          duration: isRoleChanging ? 0.3 : 0.6,
          ease: "easeInOut"
        }}
      >
        <LiquidGlassCard
          variant="default"
          hoverEffect={true}
          glassIntensity="medium"
          borderGlow={true}
          customSx={{
            mb: 6,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Welcome Message Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                key={state.user?.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  Welcome back, {getDisplayName()}!
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  {state.user?.role === 'SELLER' 
                    ? 'Here\'s your business overview and key metrics.'
                    : 'Discover opportunities and track your activity.'
                  }
                </Typography>
              </motion.div>
              
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={`${state.user?.role}-${index}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ 
                      opacity: isRoleChanging ? 0.7 : 1, 
                      y: 0, 
                      scale: isRoleChanging ? 0.95 : 1,
                      rotateY: isRoleChanging ? 5 : 0
                    }}
                    transition={{ 
                      duration: isRoleChanging ? 0.3 : 0.5, 
                      delay: isRoleChanging ? 0 : index * 0.1,
                      ease: "easeInOut"
                    }}
                  >
                    <LiquidGlassStatsCard
                      title={stat.title}
                      value={stat.value}
                      icon={stat.icon}
                      color={stat.color as any}
                      action={stat.action}
                      loading={loading || isRoleChanging}
                      variant="default"
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </LiquidGlassCard>
        </motion.div>
      </Box>


      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
          <LiquidGlassCard
            variant="default"
            hoverEffect={true}
            glassIntensity="high"
            borderGlow={true}
            customSx={{
              height: 500,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  mb: 3,
                  textAlign: 'center'
                }}
              >
                Quick Actions
              </Typography>
              <Grid container spacing={2} sx={{ flex: 1 }}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} key={`${state.user?.role}-action-${index}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: isRoleChanging ? 0.6 : 1, 
                        y: 0,
                        scale: isRoleChanging ? 0.95 : 1
                      }}
                      transition={{ 
                        duration: isRoleChanging ? 0.3 : 0.5, 
                        delay: isRoleChanging ? 0 : index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <LiquidGlassCard
                        variant="subtle"
                        hoverEffect={true}
                        glassIntensity="low"
                        borderGlow={true}
                        onClick={action.action}
                        customSx={{
                          cursor: 'pointer',
                          background: 'rgba(17, 17, 17, 0.6)',
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          borderRadius: 2,
                          '&:hover': {
                            background: 'rgba(17, 17, 17, 0.8)',
                          },
                        }}
                      >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Avatar
                          sx={{
                            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                            color: '#000000',
                            width: 48,
                            height: 48,
                            mx: 'auto',
                            mb: 1,
                            fontWeight: 600,
                          }}
                        >
                          {action.icon}
                        </Avatar>
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom 
                          sx={{ 
                            color: 'white',
                            fontWeight: 500
                          }}
                        >
                          {action.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.875rem'
                          }}
                        >
                          {action.description}
                        </Typography>
                      </CardContent>
                    </LiquidGlassCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </LiquidGlassCard>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <LiquidGlassCard
            variant="default"
            hoverEffect={true}
            glassIntensity="high"
            borderGlow={true}
            customSx={{
              height: 500,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    textAlign: 'center',
                    flex: 1
                  }}
                >
                  Recent Activity
                </Typography>
                <Tooltip title="Refresh recent activity">
                  <span>
                    <IconButton
                      onClick={() => refetch()}
                      disabled={loading}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          color: '#6366F1',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        },
                        '&:disabled': {
                          color: 'rgba(255, 255, 255, 0.3)',
                        }
                      }}
                    >
                      <Refresh 
                        sx={{
                          animation: loading ? 'spin 1s linear infinite' : 'none',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <Box sx={{ flex: 1 }}>
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
                <Box>
                  {recentActivities.slice(0, 4).map((activity, index) => (
                    <Box key={activity.id} sx={{ mb: 2 }}>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        sx={{
                          p: 2,
                          background: 'rgba(17, 17, 17, 0.4)',
                          borderRadius: 2,
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(17, 17, 17, 0.6)',
                            borderColor: 'rgba(99, 102, 241, 0.2)',
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                          color: '#000000',
                          fontWeight: 600,
                          width: 40,
                          height: 40,
                          mr: 2
                        }}>
                          {activity.icon}
                        </Avatar>
                        <Box flex={1}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              color: 'white',
                              fontWeight: 500,
                              mb: 0.5
                            }}
                          >
                            {activity.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.875rem',
                              mb: 0.5
                            }}
                          >
                            {activity.description}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.5)',
                              fontSize: '0.75rem'
                            }}
                          >
                            {activity.time}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    py: 4,
                    background: 'rgba(17, 17, 17, 0.4)',
                    borderRadius: 2,
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    No recent activity to show
                  </Typography>
                </Box>
              )}
              </Box>
            </CardContent>
          </LiquidGlassCard>
          </Grid>

        </Grid>
      </Box>

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 3 }}>
          <NotificationDebug />
        </Box>
      )}

    </Box>
  );
};

export default DashboardPage;
