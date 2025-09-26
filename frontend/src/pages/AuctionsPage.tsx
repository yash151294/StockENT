import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Alert,
  Tabs,
  Tab,
  Skeleton,
} from '@mui/material';
import {
  Gavel,
  Timer,
  TrendingUp,
  Person,
  Visibility,
  Message,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auctionsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const AuctionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);

  const { data: auctions, isLoading, error } = useQuery({
    queryKey: ['auctions', activeTab, page],
    queryFn: () => auctionsAPI.getAuctions({
      page,
      limit: 12,
      status: activeTab === 0 ? 'ACTIVE' : activeTab === 1 ? 'SCHEDULED' : 'ENDED',
    }),
  });

  const formatPrice = (price: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      INR: '₹',
      CNY: '¥',
      TRY: '₺',
    };
    return `${symbols[currency] || currency} ${price.toFixed(2)}`;
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getProgressPercentage = (startTime: string, endTime: string) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  const getAuctionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SCHEDULED':
        return 'info';
      case 'ENDED':
        return 'default';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error">
          Failed to load auctions. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Auctions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Participate in live auctions for textile materials
        </Typography>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 4 }}>
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
          <Tab label="Live Auctions" />
          <Tab label="Upcoming" />
          <Tab label="Ended" />
        </Tabs>
      </Card>

      {/* Auctions Grid */}
      <Box sx={{ width: '100%', overflow: 'auto' }}>
        {isLoading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 12 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" height={24} />
                    <Skeleton variant="text" height={20} />
                    <Skeleton variant="text" height={16} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={3}>
            {(auctions?.data as any)?.auctions?.map((auction: any) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={auction.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
                onClick={() => navigate(`/auctions/${auction.id}`)}
              >
                <Box
                  component="img"
                  src={auction.product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                  alt={auction.product.title}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                  }}
                />
                
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom noWrap>
                    {auction.product.title}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      icon={<Gavel />}
                      label={auction.auctionType}
                      size="small"
                      color="secondary"
                    />
                    <Chip
                      label={auction.status}
                      size="small"
                      color={getAuctionStatusColor(auction.status)}
                    />
                  </Box>

                  <Box mb={2}>
                    <Typography variant="h5" color="primary" gutterBottom>
                      {formatPrice(auction.currentBid, auction.product.currency)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Bid
                    </Typography>
                  </Box>

                  {auction.status === 'ACTIVE' && (
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Time Remaining
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {getTimeRemaining(auction.endsAt)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getProgressPercentage(auction.startsAt, auction.endsAt)}
                        color="primary"
                      />
                    </Box>
                  )}

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Avatar 
                      sx={{ width: 24, height: 24 }}
                      src={auction.product.seller.profileImageUrl}
                      alt={auction.product.seller.contactPerson || auction.product.seller.companyName || auction.product.seller.email}
                    >
                      <Person />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {auction.product.seller.companyName}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/auctions/${auction.id}`);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Gavel />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/auctions/${auction.id}`);
                      }}
                    >
                      Bid
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* No Results */}
      {!isLoading && (auctions?.data as any)?.auctions?.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" gutterBottom>
            No auctions found
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {activeTab === 0 && 'No live auctions at the moment.'}
            {activeTab === 1 && 'No upcoming auctions scheduled.'}
            {activeTab === 2 && 'No ended auctions found.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
          >
            Browse Products
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AuctionsPage;
