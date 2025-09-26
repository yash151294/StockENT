import React, { useState } from 'react';
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
  Divider,
  Alert,
  Skeleton,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateUser } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    country: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersAPI.getProfile(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => usersAPI.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data.data);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateCompanyProfileMutation = useMutation({
    mutationFn: (data: any) => usersAPI.updateCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const handleEdit = () => {
    if (profile?.data) {
      setEditData({
        companyName: (profile.data as any)?.companyName || '',
        contactPerson: (profile.data as any)?.contactPerson || '',
        phone: (profile.data as any)?.phone || '',
        country: (profile.data as any)?.country || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editData);
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

  if (isLoading) {
    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Skeleton variant="circular" width={80} height={80} />
                <Skeleton variant="text" height={32} />
                <Skeleton variant="text" height={24} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const profileData = profile?.data;

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account and company information
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Avatar
                  sx={{ width: 80, height: 80, mb: 2 }}
                  src={(profileData as any)?.avatarUrl}
                >
                  {(profileData as any)?.companyName?.charAt(0) || 'U'}
                </Avatar>
                
                <Typography variant="h5" gutterBottom>
                  {(profileData as any)?.companyName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {(profileData as any)?.contactPerson}
                </Typography>
                
                <Chip
                  icon={getVerificationStatusIcon((profileData as any)?.verificationStatus)}
                  label={(profileData as any)?.verificationStatus}
                  color={getVerificationStatusColor((profileData as any)?.verificationStatus)}
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary">
                  {(profileData as any)?.country}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Stats
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ShoppingCart />
                  </ListItemIcon>
                  <ListItemText
                    primary="Products Listed"
                    secondary={(profileData as any)?._count?.products || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Message />
                  </ListItemIcon>
                  <ListItemText
                    primary="Conversations"
                    secondary={(profileData as any)?._count?.conversations || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Bookmark />
                  </ListItemIcon>
                  <ListItemText
                    primary="Watchlist Items"
                    secondary={(profileData as any)?._count?.watchlistItems || 0}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
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
              <Tab label="Personal Info" />
              <Tab label="Company Info" />
              <Tab label="Security" />
              <Tab label="Notifications" />
            </Tabs>
            
            <CardContent sx={{ width: '100%', overflow: 'hidden' }}>
              {activeTab === 0 && (
                <Box sx={{ width: '100%', overflow: 'auto' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                    <Typography variant="h6">
                      Personal Information
                    </Typography>
                    {!isEditing ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSave}
                          disabled={updateProfileMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
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
                        value={isEditing ? editData.companyName : (profileData as any)?.companyName || ''}
                        onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Business />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Person"
                        value={isEditing ? editData.contactPerson : (profileData as any)?.contactPerson || ''}
                        onChange={(e) => setEditData({ ...editData, contactPerson: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Person />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={(profileData as any)?.email || ''}
                        disabled
                        InputProps={{
                          startAdornment: <Email />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={isEditing ? editData.phone : (profileData as any)?.phone || ''}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Phone />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Country"
                        value={isEditing ? editData.country : (profileData as any)?.country || ''}
                        onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <LocationOn />,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 1 && (
                <Box sx={{ width: '100%', overflow: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    Company Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    This information helps other users understand your business better.
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Business License"
                        value={(profileData as any)?.companyProfile?.businessLicense || ''}
                        InputProps={{
                          startAdornment: <Business />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tax ID"
                        value={(profileData as any)?.companyProfile?.taxId || ''}
                        InputProps={{
                          startAdornment: <Business />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={(profileData as any)?.companyProfile?.address || ''}
                        InputProps={{
                          startAdornment: <LocationOn />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        value={(profileData as any)?.companyProfile?.city || ''}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="State"
                        value={(profileData as any)?.companyProfile?.state || ''}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Postal Code"
                        value={(profileData as any)?.companyProfile?.postalCode || ''}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        value={(profileData as any)?.companyProfile?.website || ''}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={4}
                        value={(profileData as any)?.companyProfile?.description || ''}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 2 && (
                <Box sx={{ width: '100%', overflow: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    Security Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Manage your account security and privacy settings.
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText
                        primary="Change Password"
                        secondary="Update your account password"
                      />
                      <Button variant="outlined" size="small">
                        Change
                      </Button>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Upload />
                      </ListItemIcon>
                      <ListItemText
                        primary="Upload Documents"
                        secondary="Upload verification documents"
                      />
                      <Button variant="outlined" size="small">
                        Upload
                      </Button>
                    </ListItem>
                  </List>
                </Box>
              )}

              {activeTab === 3 && (
                <Box sx={{ width: '100%', overflow: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    Notification Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Choose how you want to be notified about important updates.
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Notifications />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Receive updates via email"
                      />
                      <Button variant="outlined" size="small">
                        Configure
                      </Button>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Message />
                      </ListItemIcon>
                      <ListItemText
                        primary="Message Notifications"
                        secondary="Get notified about new messages"
                      />
                      <Button variant="outlined" size="small">
                        Configure
                      </Button>
                    </ListItem>
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
