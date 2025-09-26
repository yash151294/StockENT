import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Skeleton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Verified,
  Block,
  TrendingUp,
  People,
  Inventory,
  Gavel,
  Message,
  AttachMoney,
  Dashboard,
  Person,
  Business,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard(),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.getUsers({ page: 1, limit: 10 }),
  }) as any;

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminAPI.getProducts({ page: 1, limit: 10 }),
  }) as any;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProductStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'error';
      case 'SOLD':
        return 'info';
      case 'EXPIRED':
        return 'default';
      default:
        return 'default';
    }
  };

  if (dashboardLoading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={24} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const dashboardData = dashboard?.data as any;

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, products, and platform settings
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {dashboardData?.stats?.totalUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {dashboardData?.stats?.totalProducts || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Inventory />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {dashboardData?.stats?.totalAuctions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Auctions
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Gavel />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {dashboardData?.stats?.totalConversations || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conversations
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Message />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            width: '100%',
            minHeight: 'auto',
            '& .MuiTabs-flexContainer': {
              flexWrap: 'wrap',
            },
            '& .MuiTab-root': {
              minWidth: 'auto',
              flex: 1,
              maxWidth: 'none',
            },
          }}
        >
          <Tab label="Users" />
          <Tab label="Products" />
          <Tab label="Analytics" />
        </Tabs>
        
        <CardContent sx={{ width: '100%', overflow: 'hidden' }}>
          {activeTab === 0 && (
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Recent Users
              </Typography>
              {usersLoading ? (
                <Box>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box flex={1}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <TableContainer 
                  component={Paper}
                  sx={{
                    width: '100%',
                    overflowX: 'auto',
                    '& .MuiTable-root': {
                      minWidth: 650,
                    },
                  }}
                >
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(users?.data as any)?.users?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar>
                                {user.companyName?.charAt(0) || 'U'}
                              </Avatar>
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="subtitle2" noWrap>
                                  {user.contactPerson}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {user.companyName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              size="small"
                              color={user.role === 'ADMIN' ? 'error' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.verificationStatus}
                              size="small"
                              color={getVerificationStatusColor(user.verificationStatus)}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, user.id)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Recent Products
              </Typography>
              {productsLoading ? (
                <Box>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                      <Skeleton variant="rectangular" width={60} height={60} />
                      <Box flex={1}>
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="60%" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <TableContainer 
                  component={Paper}
                  sx={{
                    width: '100%',
                    overflowX: 'auto',
                    '& .MuiTable-root': {
                      minWidth: 650,
                    },
                  }}
                >
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Seller</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(products?.data as any)?.products?.map((product: any) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Box
                                component="img"
                                src={product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                                alt={product.title}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                }}
                              />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="subtitle2" noWrap>
                                  {product.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {product.category.name}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {product.seller.companyName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {product.currency} {product.basePrice}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={product.status}
                              size="small"
                              color={getProductStatusColor(product.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, product.id)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Platform Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        User Growth
                      </Typography>
                      <Typography variant="h4" color="primary">
                        +{dashboardData?.stats?.userGrowth || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New users this month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Product Growth
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        +{dashboardData?.stats?.productGrowth || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New products this month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Verified sx={{ mr: 1 }} />
          Verify User
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Block sx={{ mr: 1 }} />
          Block User
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminPage;
