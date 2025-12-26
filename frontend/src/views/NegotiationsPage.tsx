import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Tabs,
  Tab,
  Alert,
  Divider,
} from '@mui/material';
import {
  Message as MessageIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { negotiationAPI } from '../services/negotiationAPI';
import { NegotiationStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { NegotiationStatusBadge } from '../components/negotiation/NegotiationStatusBadge';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`negotiation-tabpanel-${index}`}
      aria-labelledby={`negotiation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const NegotiationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();
  const { state } = useAuth();

  // Fetch negotiations
  const {
    data: negotiations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['negotiations'],
    queryFn: () => negotiationAPI.getNegotiations(),
    enabled: !!state.user,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNegotiationClick = (negotiationId: string) => {
    router.push(`/negotiations/${negotiationId}`);
  };

  // Filter negotiations by status
  const activeNegotiations = negotiations.filter(
    (n) => ['PENDING', 'COUNTERED'].includes(n.status)
  );
  const completedNegotiations = negotiations.filter(
    (n) => ['ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'].includes(n.status)
  );

  const getStatusCount = (status: string) => {
    return negotiations.filter((n) => n.status === status).length;
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="Negotiations" />
        <LoadingSpinner />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="Negotiations" />
        <Alert severity="error">
          Failed to load negotiations: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="Negotiations" />

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <MessageIcon color="primary" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {activeNegotiations.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Negotiations
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUpIcon color="success" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {getStatusCount('ACCEPTED')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accepted Offers
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <HistoryIcon color="info" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {completedNegotiations.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Active (${activeNegotiations.length})`} />
          <Tab label={`Completed (${completedNegotiations.length})`} />
        </Tabs>
      </Box>

      {/* Active Negotiations */}
      <TabPanel value={activeTab} index={0}>
        {activeNegotiations.length === 0 ? (
          <Alert severity="info">
            You have no active negotiations. Start by making an offer on a negotiable product!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {activeNegotiations.map((negotiation) => (
              <Grid item xs={12} md={6} key={negotiation.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => handleNegotiationClick(negotiation.id)}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {negotiation.product?.title}
                        </Typography>
                        <NegotiationStatusBadge status={negotiation.status as NegotiationStatus} />
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {negotiation.buyerId === state.user?.id ? 'Your offer' : 'Offer from'} {negotiation.buyer?.companyName}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {negotiation.buyerOffer.toFixed(2)} {negotiation.product?.currency}
                        </Typography>
                        {negotiation.sellerCounterOffer && (
                          <Typography variant="body2" color="text.secondary">
                            Counter: {negotiation.sellerCounterOffer.toFixed(2)} {negotiation.product?.currency}
                          </Typography>
                        )}
                      </Box>

                      {negotiation.buyerMessage && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          "{negotiation.buyerMessage}"
                        </Typography>
                      )}

                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNegotiationClick(negotiation.id);
                        }}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Completed Negotiations */}
      <TabPanel value={activeTab} index={1}>
        {completedNegotiations.length === 0 ? (
          <Alert severity="info">
            You have no completed negotiations yet.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {completedNegotiations.map((negotiation) => (
              <Grid item xs={12} md={6} key={negotiation.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => handleNegotiationClick(negotiation.id)}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {negotiation.product?.title}
                        </Typography>
                        <NegotiationStatusBadge status={negotiation.status as NegotiationStatus} />
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {negotiation.buyerId === state.user?.id ? 'Your offer' : 'Offer from'} {negotiation.buyer?.companyName}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {negotiation.buyerOffer.toFixed(2)} {negotiation.product?.currency}
                        </Typography>
                        {negotiation.sellerCounterOffer && (
                          <Typography variant="body2" color="text.secondary">
                            Final: {negotiation.sellerCounterOffer.toFixed(2)} {negotiation.product?.currency}
                          </Typography>
                        )}
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Completed {new Date(negotiation.updatedAt).toLocaleDateString()}
                      </Typography>

                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNegotiationClick(negotiation.id);
                        }}
                      >
                        View Details
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
    </Container>
  );
};
