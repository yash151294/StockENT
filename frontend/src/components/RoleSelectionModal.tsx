import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Avatar,
  Divider,
} from '@mui/material';
import {
  ShoppingCart,
  Store,
  Person,
  Business,
} from '@mui/icons-material';

interface RoleSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onRoleSelect: (role: 'BUYER' | 'SELLER') => void;
  userInfo: {
    name: string;
    email: string;
    profileImageUrl?: string;
  };
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  open,
  onClose,
  onRoleSelect,
  userInfo,
}) => {
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'SELLER'>('BUYER');

  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRole(event.target.value as 'BUYER' | 'SELLER');
  };

  const handleConfirm = () => {
    onRoleSelect(selectedRole);
    onClose();
  };

  const roleOptions = [
    {
      value: 'BUYER',
      title: 'Buyer',
      description: 'I want to purchase materials and products',
      icon: <ShoppingCart />,
      benefits: [
        'Browse and search products',
        'Participate in auctions',
        'Request samples',
        'Contact sellers directly',
      ],
      color: 'primary',
    },
    {
      value: 'SELLER',
      title: 'Seller',
      description: 'I want to sell materials and products',
      icon: <Store />,
      benefits: [
        'List products for sale',
        'Create auctions',
        'Manage inventory',
        'Connect with buyers',
      ],
      color: 'secondary',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '500px',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            src={userInfo.profileImageUrl}
            sx={{ width: 48, height: 48 }}
          >
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              Welcome, {userInfo.name}!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userInfo.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Choose Your Account Type
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select how you plan to use StockENT. You can change this later in your profile settings.
          </Typography>
        </Box>

        <RadioGroup
          value={selectedRole}
          onChange={handleRoleChange}
          sx={{ gap: 2 }}
        >
          {roleOptions.map((option) => (
            <Card
              key={option.value}
              sx={{
                border: selectedRole === option.value ? 2 : 1,
                borderColor: selectedRole === option.value 
                  ? `${option.color}.main` 
                  : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: `${option.color}.main`,
                  boxShadow: 2,
                },
              }}
              onClick={() => setSelectedRole(option.value as 'BUYER' | 'SELLER')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <FormControlLabel
                    value={option.value}
                    control={<Radio />}
                    label=""
                    sx={{ m: 0 }}
                  />
                  <Avatar
                    sx={{
                      bgcolor: `${option.color}.main`,
                      width: 48,
                      height: 48,
                      mt: 0.5,
                    }}
                  >
                    {option.icon}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {option.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {option.description}
                    </Typography>
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        What you can do:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {option.benefits.map((benefit, index) => (
                          <Typography
                            key={index}
                            component="li"
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {benefit}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={selectedRole === 'BUYER' ? 'primary' : 'secondary'}
          sx={{ minWidth: 120 }}
        >
          Continue as {selectedRole === 'BUYER' ? 'Buyer' : 'Seller'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleSelectionModal;
