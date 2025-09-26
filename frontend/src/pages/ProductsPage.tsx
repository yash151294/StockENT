import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  Sort,
  Visibility,
  ShoppingCart,
  Gavel,
  AttachMoney,
  Message,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    currency: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, searchQuery, filters],
    queryFn: () => productsAPI.getProducts({
      page,
      limit: 12,
      search: searchQuery,
      ...filters,
    }),
  }) as any;

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const formatPrice = (price: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      INR: '₹',
      CNY: '¥',
      TRY: '₺',
    };
    return `${symbols[currency] || currency} ${price.toFixed(2)}`;
  };

  const getListingTypeColor = (type: string) => {
    switch (type) {
      case 'FIXED_PRICE':
        return 'success';
      case 'AUCTION':
        return 'secondary';
      case 'NEGOTIABLE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getListingTypeIcon = (type: string) => {
    switch (type) {
      case 'FIXED_PRICE':
        return <ShoppingCart />;
      case 'AUCTION':
        return <Gavel />;
      case 'NEGOTIABLE':
        return <AttachMoney />;
      default:
        return <ShoppingCart />;
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error">
          Failed to load products. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Textile Dead Stock Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover premium textile materials from verified suppliers. Find fabrics by weight, composition, certifications (OEKO-TEX, GOTS), and technical specifications.
        </Typography>
      </Box>


      {/* Search and Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by fabric type, weight, composition, certifications..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="cotton">Cotton Fabrics</MenuItem>
                  <MenuItem value="polyester">Polyester Materials</MenuItem>
                  <MenuItem value="yarn">Yarns & Threads</MenuItem>
                  <MenuItem value="fabric">Woven Fabrics</MenuItem>
                  <MenuItem value="knit">Knitted Materials</MenuItem>
                  <MenuItem value="denim">Denim & Jeans</MenuItem>
                  <MenuItem value="synthetic">Synthetic Fibers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={filters.currency}
                  onChange={(e) => handleFilterChange('currency', e.target.value)}
                  label="Currency"
                >
                  <MenuItem value="">All Currencies</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="INR">INR</MenuItem>
                  <MenuItem value="CNY">CNY</MenuItem>
                  <MenuItem value="TRY">TRY</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="createdAt">Date</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="title">Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Grid */}
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
          <>
            <Grid container spacing={3}>
            {data?.data?.products?.map((product: any) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.images[0]?.imageUrl || '/placeholder-product.jpg'}
                    alt={product.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="h6" component="h3" noWrap sx={{ flex: 1, mr: 1 }}>
                        {product.title}
                      </Typography>
                      <Chip
                        icon={getListingTypeIcon(product.listingType)}
                        label={product.listingType.replace('_', ' ')}
                        size="small"
                        color={getListingTypeColor(product.listingType)}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {product.description.substring(0, 100)}...
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" color="primary">
                        {formatPrice(product.basePrice, product.currency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.quantityAvailable} {product.unit}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        {product.seller.companyName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.location}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${product.id}`);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Message />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle contact seller
                        }}
                      >
                        Contact
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={data.data.pagination.totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
          </>
        )}
      </Box>

      {/* No Results */}
      {!isLoading && data?.data?.products?.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" gutterBottom>
            No products found
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Try adjusting your search criteria or filters
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setSearchQuery('');
              setFilters({
                category: '',
                minPrice: '',
                maxPrice: '',
                currency: '',
                location: '',
                sortBy: 'createdAt',
                sortOrder: 'desc',
              });
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProductsPage;
