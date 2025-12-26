import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Business,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  Cancel,
  Verified,
  Pending,
  Close,
  Upload,
  Security,
  Notifications,
  Bookmark,
  ShoppingCart,
  Gavel,
  Message,
  Visibility,
  Delete,
  PhotoCamera,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, productsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import LiquidGlassCard from '../components/LiquidGlassCard';

// Types
interface ProfileData {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  country?: string;
  profileImageUrl?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  lastLoginAt?: string;
  companyProfile?: {
    id: string;
    businessLicense?: string;
    taxId?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    website?: string;
    description?: string;
    certifications: string[];
  };
  _count?: {
    products: number;
    conversations: number;
    watchlist: number;
    bids: number;
  };
}

interface WatchlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    description: string;
    basePrice: number;
    currency: string;
    status: string;
    category?: {
      id: string;
      name: string;
    };
    images?: {
      id: string;
      imageUrl: string;
      isPrimary: boolean;
    }[];
  };
}

interface EditProfileData {
  companyName: string;
  contactPerson: string;
  phone: string;
  country: string;
}

interface EditCompanyData {
  businessLicense: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  website: string;
  description: string;
  certifications: string[];
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuth();
  const { showSuccess, showWarning, showError } = useNotification();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countries = [
    'United States',
    'India',
    'China',
    'Turkey',
    'United Kingdom',
    'Germany',
    'France',
    'Italy',
    'Spain',
    'Canada',
    'Australia',
    'Japan',
    'South Korea',
    'Brazil',
    'Mexico',
    'Argentina',
    'South Africa',
    'Egypt',
    'Nigeria',
    'Kenya',
    'Other',
  ];

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [editData, setEditData] = useState<EditProfileData>({
    companyName: '',
    contactPerson: '',
    phone: '',
    country: '',
  });
  const [editCompanyData, setEditCompanyData] = useState<EditCompanyData>({
    businessLicense: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    website: '',
    description: '',
    certifications: [],
  });
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState<string | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // API Queries
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersAPI.getProfile(),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: watchlist, 
    isLoading: watchlistLoading, 
    error: watchlistError,
    refetch: refetchWatchlist
  } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => productsAPI.getWatchlist(),
    retry: 2,
    enabled: activeTab === 4, // Only fetch when watchlist tab is active
  });

  // Handle URL parameters to set active tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'watchlist') {
      setActiveTab(4);
    } else if (tab === 'company') {
      setActiveTab(1);
    } else if (tab === 'security') {
      setActiveTab(2);
    } else if (tab === 'notifications') {
      setActiveTab(3);
    }
  }, [searchParams]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: EditProfileData) => usersAPI.updateProfile(data),
    onSuccess: (response) => {
      const updatedUser = response.data.data;
      updateUser(updatedUser);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showSuccess('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error('Update profile error:', error);
      showError(error.response?.data?.error || 'Failed to update profile');
    },
  });

  const updateCompanyProfileMutation = useMutation({
    mutationFn: (data: EditCompanyData) => usersAPI.updateCompanyProfile(data),
    onSuccess: (response) => {
      setIsEditingCompany(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showSuccess('Company profile updated successfully');
    },
    onError: (error: any) => {
      console.error('Update company profile error:', error);
      showError(error.response?.data?.error || 'Failed to update company profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      usersAPI.changePassword(data),
    onSuccess: () => {
      setChangePasswordOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showSuccess('Password changed successfully');
    },
    onError: (error: any) => {
      console.error('Change password error:', error);
      showError(error.response?.data?.error || 'Failed to change password');
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: (productId: string) => productsAPI.removeFromWatchlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess('Product removed from watchlist');
      setRemoveConfirmOpen(false);
      setProductToRemove(null);
    },
    onError: (error: any) => {
      console.error('Remove from watchlist error:', error);
      showError('Failed to remove product from watchlist');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersAPI.uploadAvatar(file),
    onSuccess: (response) => {
      const updatedUser = response.data.data;
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showSuccess('Profile picture updated successfully');
    },
    onError: (error: any) => {
      console.error('Upload avatar error:', error);
      showError('Failed to upload profile picture');
    },
  });

  // Event handlers
  const handleEdit = () => {
    if (profile?.data?.data) {
      const profileData = profile.data.data as ProfileData;
      setEditData({
        companyName: profileData.companyName || '',
        contactPerson: profileData.contactPerson || '',
        phone: profileData.phone || '',
        country: profileData.country || '',
      });
      setIsEditing(true);
    }
  };

  const handleEditCompany = () => {
    if (profile?.data?.data) {
      const profileData = profile.data.data as ProfileData;
      const companyProfile = profileData.companyProfile;
      setEditCompanyData({
        businessLicense: companyProfile?.businessLicense || '',
        taxId: companyProfile?.taxId || '',
        address: companyProfile?.address || '',
        city: companyProfile?.city || '',
        state: companyProfile?.state || '',
        postalCode: companyProfile?.postalCode || '',
        website: companyProfile?.website || '',
        description: companyProfile?.description || '',
        certifications: companyProfile?.certifications || [],
      });
      setIsEditingCompany(true);
    }
  };

  const handleSave = () => {
    if (!editData.companyName.trim() || !editData.contactPerson.trim()) {
      showWarning('Company name and contact person are required');
      return;
    }
    updateProfileMutation.mutate(editData);
  };

  const handleSaveCompany = () => {
    updateCompanyProfileMutation.mutate(editCompanyData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      companyName: '',
      contactPerson: '',
      phone: '',
      country: '',
    });
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
    setEditCompanyData({
      businessLicense: '',
      taxId: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      website: '',
      description: '',
      certifications: [],
    });
  };

  const handleRemoveFromWatchlist = (productId: string) => {
    setProductToRemove(productId);
    setRemoveConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (productToRemove) {
      removeFromWatchlistMutation.mutate(productToRemove);
    }
  };

  const handleCancelRemove = () => {
    setRemoveConfirmOpen(false);
    setProductToRemove(null);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showWarning('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showWarning('New password must be at least 6 characters long');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleCancelChangePassword = () => {
    setChangePasswordOpen(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleProfileVisibilityChange = async (checked: boolean) => {
    setProfileVisibility(checked);
    // TODO: Implement API call to update profile visibility
    showSuccess(`Profile ${checked ? 'made visible' : 'hidden'} to other users`);
  };

  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  // Helper functions
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

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Verified />;
      case 'PENDING':
        return <Pending />;
      case 'REJECTED':
        return <Close />;
      default:
        return <Pending />;
    }
  };

  // Reusable TextField styling
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(99, 102, 241, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#6366f1',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.6)',
      '&.Mui-focused': {
        color: '#6366f1',
      },
    },
    '& .MuiInputLabel-root.Mui-disabled': {
      color: 'rgba(255, 255, 255, 0.4)',
    },
    '& .MuiOutlinedInput-root.Mui-disabled': {
      color: 'rgba(255, 255, 255, 0.4)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
  };

  // Loading state
  if (profileLoading) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                  <Skeleton variant="circular" width={80} height={80} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={32} width="80%" />
                  <Skeleton variant="text" height={24} width="60%" />
                  <Skeleton variant="rectangular" height={32} width="120px" sx={{ mt: 2, borderRadius: 1 }} />
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" height={20} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <Skeleton variant="rectangular" height={400} />
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Error state
  if (profileError) {
    return (
      <Box>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetchProfile()}>
              Retry
            </Button>
          }
        >
          Failed to load profile data. Please try again.
        </Alert>
      </Box>
    );
  }

  const profileData = profile?.data?.data as ProfileData | undefined;

  if (!profileData) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load profile data. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
      color: 'white'
    }}>
      {/* Header */}
      <PageHeader
        title="Account"
        subtitle="Manage your account and company information"
      />

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={4} sx={{ alignItems: 'stretch' }}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <LiquidGlassCard
              variant="default"
              hoverEffect={true}
              glassIntensity="medium"
              borderGlow={true}
              customSx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" flex={1}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Tooltip title="Change profile picture">
                      <IconButton
                        size="small"
                        onClick={handleAvatarUpload}
                        sx={{
                          background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.6)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <PhotoCamera fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                <Avatar
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mb: 3,
                    border: '3px solid rgba(99, 102, 241, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                  src={getImageUrl(profileData.profileImageUrl, 'avatar')}
                  alt={profileData.contactPerson || profileData.companyName || 'User'}
                >
                  {profileData.companyName?.charAt(0) || 
                   profileData.contactPerson?.charAt(0) || 
                   profileData.email?.charAt(0) || 'U'}
                </Avatar>
                </Badge>
                
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {profileData.companyName || 'Company Name'}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 2,
                    fontWeight: 400,
                  }}
                >
                  {profileData.contactPerson || 'Contact Person'}
                </Typography>
                
                <Chip
                  icon={getVerificationStatusIcon(profileData.verificationStatus)}
                  label={profileData.verificationStatus}
                  color={getVerificationStatusColor(profileData.verificationStatus)}
                  sx={{ 
                    mb: 2,
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                  }}
                />
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    mb: 3,
                  }}
                >
                  {profileData.country || 'Country'}
                </Typography>
                
                {/* Profile Visibility Toggle */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={profileVisibility}
                      onChange={(e) => handleProfileVisibilityChange(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#6366f1',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#6366f1',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                      Profile Visible
                    </Typography>
                  }
                />
              </Box>
            </CardContent>
          </LiquidGlassCard>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <LiquidGlassCard
              variant="default"
              hoverEffect={true}
              glassIntensity="medium"
              borderGlow={true}
              customSx={{
                mt: 3,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mb: 4,
                  textAlign: 'center',
                }}
              >
                Account Stats
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: 280 }}>
                {/* Products Stat */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                }}>
                  <ShoppingCart sx={{ color: '#6366f1', fontSize: 24 }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                      {profileData._count?.products || 0}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                      Products Listed
                    </Typography>
                  </Box>
                </Box>

                {/* Watchlist Stat */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                }}>
                  <Bookmark sx={{ color: '#6366f1', fontSize: 24 }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                      {profileData._count?.watchlist || 0}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                      Watchlist Items
                    </Typography>
                  </Box>
                </Box>

                {/* Bids Stat */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                }}>
                  <Gavel sx={{ color: '#6366f1', fontSize: 24 }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                      {profileData._count?.bids || 0}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                      Bids Made
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </LiquidGlassCard>
          </motion.div>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Card
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(17, 17, 17, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 500,
                    textTransform: 'none',
                    minHeight: 60,
                    '&.Mui-selected': {
                      color: '#6366f1',
                      fontWeight: 600,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#6366f1',
                    height: 3,
                  },
                }}
              >
                <Tab label="Personal Info" />
                <Tab label="Company Info" />
                <Tab label="Security" />
                <Tab label="Notifications" />
                <Tab label="Watchlist" />
              </Tabs>
            
            <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
              {activeTab === 0 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      Personal Information
                    </Typography>
                    {!isEditing ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        sx={{
                          borderColor: 'rgba(99, 102, 241, 0.5)',
                          color: '#6366f1',
                          '&:hover': {
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          },
                        }}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSave}
                          disabled={updateProfileMutation.isPending}
                          sx={{
                            background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #5b5cf6, #7c3aed)',
                            },
                          }}
                        >
                          {updateProfileMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
                          disabled={updateProfileMutation.isPending}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company Name"
                        value={isEditing ? editData.companyName : profileData.companyName || ''}
                        onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
                        disabled={!isEditing}
                        required
                        InputProps={{
                          startAdornment: <Business sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />,
                        }}
                        sx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Person"
                        value={isEditing ? editData.contactPerson : profileData.contactPerson || ''}
                        onChange={(e) => setEditData({ ...editData, contactPerson: e.target.value })}
                        disabled={!isEditing}
                        required
                        InputProps={{
                          startAdornment: <Person sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />,
                        }}
                        sx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email || ''}
                        disabled
                        InputProps={{
                          startAdornment: <Email sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />,
                        }}
                        helperText="Email cannot be changed"
                        sx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={isEditing ? editData.phone : profileData.phone || ''}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Phone sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />,
                        }}
                        sx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl 
                        fullWidth 
                        disabled={!isEditing}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(99, 102, 241, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366f1',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            '&.Mui-focused': {
                              color: '#6366f1',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-disabled': {
                            color: 'rgba(255, 255, 255, 0.4)',
                          },
                          '& .MuiOutlinedInput-root.Mui-disabled': {
                            color: 'rgba(255, 255, 255, 0.4)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          },
                          '& .MuiSelect-select': {
                            color: 'white',
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'rgba(255, 255, 255, 0.6)',
                          },
                        }}
                      >
                        <InputLabel>Country</InputLabel>
                        <Select
                          value={isEditing ? editData.country : profileData.country || ''}
                          onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                          label="Country"
                          startAdornment={<LocationOn sx={{ color: 'rgba(255, 255, 255, 0.6)', ml: 1, mr: 1 }} />}
                        >
                          {countries.map((country) => (
                            <MenuItem key={country} value={country}>
                              {country}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                      Company Information
                    </Typography>
                    {!isEditingCompany ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEditCompany}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveCompany}
                          disabled={updateCompanyProfileMutation.isPending}
                        >
                          {updateCompanyProfileMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancelCompany}
                          disabled={updateCompanyProfileMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    This information helps other users understand your business better.
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Business License"
                        value={isEditingCompany ? editCompanyData.businessLicense : profileData.companyProfile?.businessLicense || ''}
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, businessLicense: e.target.value })}
                        disabled={!isEditingCompany}
                        InputProps={{
                          startAdornment: <Business color="action" />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tax ID"
                        value={isEditingCompany ? editCompanyData.taxId : profileData.companyProfile?.taxId || ''}
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, taxId: e.target.value })}
                        disabled={!isEditingCompany}
                        InputProps={{
                          startAdornment: <Business color="action" />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={isEditingCompany ? editCompanyData.address : profileData.companyProfile?.address || ''}
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, address: e.target.value })}
                        disabled={!isEditingCompany}
                        InputProps={{
                          startAdornment: <LocationOn color="action" />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="City"
                        value={isEditingCompany ? editCompanyData.city : profileData.companyProfile?.city || ''}
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, city: e.target.value })}
                        disabled={!isEditingCompany}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="State"
                        value={isEditingCompany ? editCompanyData.state : profileData.companyProfile?.state || ''}
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, state: e.target.value })}
                        disabled={!isEditingCompany}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Postal Code"
                        value={isEditingCompany ? editCompanyData.postalCode : profileData.companyProfile?.postalCode || ''}
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, postalCode: e.target.value })}
                        disabled={!isEditingCompany}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Website"
                        value={isEditingCompany ? editCompanyData.website : profileData.companyProfile?.website || ''}
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, website: e.target.value })}
                        disabled={!isEditingCompany}
                        placeholder="https://example.com"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company Description"
                        multiline
                        rows={4}
                        value={isEditingCompany ? editCompanyData.description : profileData.companyProfile?.description || ''}
                        onChange={(e) => setEditCompanyData({ ...editCompanyData, description: e.target.value })}
                        disabled={!isEditingCompany}
                        placeholder="Describe your company, products, and services..."
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Security Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Manage your account security and privacy settings.
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Security color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Change Password"
                        secondary="Update your account password"
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => setChangePasswordOpen(true)}
                      >
                        Change
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <Upload color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Upload Documents"
                        secondary="Upload verification documents"
                      />
                      <Button variant="outlined" size="small" disabled>
                        Coming Soon
                      </Button>
                    </ListItem>
                  </List>
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Notification Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Choose how you want to be notified about important updates.
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Notifications color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Receive updates via email"
                      />
                      <Switch defaultChecked />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <Message color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Message Notifications"
                        secondary="Get notified about new messages"
                      />
                      <Switch defaultChecked />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <Gavel color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Auction Notifications"
                        secondary="Get notified about auction updates and bidding"
                      />
                      <Switch defaultChecked />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <ShoppingCart color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Product Notifications"
                        secondary="Get notified about new products and price changes"
                      />
                      <Switch defaultChecked />
                    </ListItem>
                  </List>
                </Box>
              )}

              {activeTab === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    My Watchlist
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Products you're watching for updates and new information.
                  </Typography>
                  
                  {watchlistError ? (
                    <Alert 
                      severity="error"
                      action={
                        <Button color="inherit" size="small" onClick={() => refetchWatchlist()}>
                          Retry
                        </Button>
                      }
                    >
                      Failed to load watchlist. Please try again.
                    </Alert>
                  ) : watchlistLoading ? (
                    <Box>
                      {[1, 2, 3].map((i) => (
                        <Card key={i} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Skeleton variant="rectangular" width={80} height={80} />
                              <Box flex={1}>
                                <Skeleton variant="text" height={24} />
                                <Skeleton variant="text" height={20} width="60%" />
                                <Skeleton variant="text" height={16} width="40%" />
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : watchlist?.data?.data?.watchlistItems?.length > 0 ? (
                    <List>
                      {watchlist?.data?.data?.watchlistItems?.map((item: WatchlistItem) => (
                        <Card key={item.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Box
                                component="img"
                                src={getImageUrl(item.product?.images?.[0]?.imageUrl)}
                                alt={item.product?.title}
                                sx={{
                                  width: 80,
                                  height: 80,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  backgroundColor: 'grey.100',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getImageUrl(null);
                                }}
                              />
                              <Box flex={1}>
                                <Typography variant="h6" gutterBottom>
                                  {item.product?.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {item.product?.description?.substring(0, 100)}...
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={1}>
                                  <Chip
                                    label={item.product?.category?.name || 'Category'}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    ${item.product?.basePrice} {item.product?.currency}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    • Added {new Date(item.createdAt).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box display="flex" flexDirection="column" gap={1}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => router.push(`/products/${item.product?.id}`)}
                                  startIcon={<Visibility />}
                                >
                                  View
                                </Button>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Bookmark sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No items in watchlist
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3}>
                        Start watching products you're interested in by clicking the watch button on product pages.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => router.push('/products')}
                        startIcon={<Visibility />}
                      >
                        Browse Products
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </Grid>
      </Grid>
      </Box>

      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Remove from Watchlist Confirmation Dialog */}
      <Dialog
        open={removeConfirmOpen}
        onClose={handleCancelRemove}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(17, 17, 17, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>
          Remove from Watchlist
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Are you sure you want to remove this product from your watchlist? 
            You can always add it back later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelRemove} 
            disabled={removeFromWatchlistMutation.isPending}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRemove} 
            variant="contained"
            disabled={removeFromWatchlistMutation.isPending}
            startIcon={removeFromWatchlistMutation.isPending ? <CircularProgress size={20} /> : <Delete />}
            sx={{
              background: 'linear-gradient(45deg, #ef4444, #dc2626)',
              '&:hover': {
                background: 'linear-gradient(45deg, #dc2626, #b91c1c)',
              },
            }}
          >
            {removeFromWatchlistMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordOpen}
        onClose={handleCancelChangePassword}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(17, 17, 17, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 600 }}>
          Change Password
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              margin="normal"
              required
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              margin="normal"
              required
              helperText="Password must be at least 6 characters long"
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              margin="normal"
              required
              sx={textFieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelChangePassword} 
            disabled={changePasswordMutation.isPending}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={
              changePasswordMutation.isPending || 
              !passwordData.currentPassword || 
              !passwordData.newPassword || 
              !passwordData.confirmPassword
            }
            startIcon={changePasswordMutation.isPending ? <CircularProgress size={20} /> : <Security />}
            sx={{
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5b5cf6, #7c3aed)',
              },
            }}
          >
            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;