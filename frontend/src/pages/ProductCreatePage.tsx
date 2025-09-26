import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  FormHelperText,
  Divider,
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '../services/api';

interface ProductFormData {
  title: string;
  description: string;
  categoryId: string;
  price: string;
  quantity: string;
  unit: string;
  listingType: 'FIXED_PRICE' | 'AUCTION' | 'NEGOTIABLE';
  tags: string[];
  specifications: { [key: string]: string };
  location: string;
  country: string;
  minOrderQuantity: string;
  auctionStartTime?: string;
  auctionEndTime?: string;
  minimumBid?: string;
  reservePrice?: string;
}

interface ProductSubmitData {
  title: string;
  description: string;
  categoryId: string;
  price: number;
  quantity: number;
  unit: string;
  listingType: 'FIXED_PRICE' | 'AUCTION' | 'NEGOTIABLE';
  tags: string[];
  specifications: { [key: string]: string };
  location: string;
  country: string;
  minOrderQuantity: number;
  auctionStartTime?: string;
  auctionEndTime?: string;
  minimumBid?: number;
  reservePrice?: number;
}

const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  
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
  
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    quantity: '',
    unit: '',
    listingType: 'FIXED_PRICE',
    tags: [],
    specifications: {},
    location: '',
    country: '',
    minOrderQuantity: '',
  });
  
  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await categoriesAPI.getCategories();
        return response.data;
      } catch (error) {
        console.error('Categories fetch error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: any) => productsAPI.createProduct(data),
    onSuccess: (response) => {
      navigate('/products');
    },
    onError: (error: any) => {
      console.error('Create product error:', error);
      setErrors({
        general: error.response?.data?.error || 'Failed to create product'
      });
    },
  });

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const handleRemoveSpecification = (keyToRemove: string) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[keyToRemove];
    setFormData(prev => ({
      ...prev,
      specifications: newSpecs
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must not exceed 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'Description must not exceed 2000 characters';
    }

    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.minOrderQuantity || parseFloat(formData.minOrderQuantity) <= 0) {
      newErrors.minOrderQuantity = 'Valid minimum order quantity is required';
    }

    if (formData.listingType === 'AUCTION') {
      if (!formData.auctionStartTime) newErrors.auctionStartTime = 'Auction start time is required';
      if (!formData.auctionEndTime) newErrors.auctionEndTime = 'Auction end time is required';
      if (!formData.minimumBid || parseFloat(formData.minimumBid) <= 0) newErrors.minimumBid = 'Valid minimum bid is required';
      
      if (formData.auctionStartTime && formData.auctionEndTime) {
        const startTime = new Date(formData.auctionStartTime);
        const endTime = new Date(formData.auctionEndTime);
        if (endTime <= startTime) {
          newErrors.auctionEndTime = 'End time must be after start time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData: ProductSubmitData = {
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      listingType: formData.listingType,
      tags: formData.tags,
      specifications: formData.specifications,
      location: formData.location,
      country: formData.country,
      minOrderQuantity: parseFloat(formData.minOrderQuantity),
    };

    // Only include auction fields if listing type is AUCTION
    if (formData.listingType === 'AUCTION') {
      submitData.auctionStartTime = formData.auctionStartTime;
      submitData.auctionEndTime = formData.auctionEndTime;
      submitData.minimumBid = formData.minimumBid ? parseFloat(formData.minimumBid) : undefined;
      submitData.reservePrice = formData.reservePrice ? parseFloat(formData.reservePrice) : undefined;
    }

    createProductMutation.mutate(submitData);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        List New Product
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Add a new product to your inventory
      </Typography>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title || `${formData.title.length}/100 characters`}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.categoryId}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    label="Category"
                    disabled={categoriesLoading}
                  >
                    {categoriesLoading ? (
                      <MenuItem disabled>Loading categories...</MenuItem>
                    ) : categoriesError ? (
                      <MenuItem disabled>Error loading categories</MenuItem>
                    ) : categoriesData && Array.isArray(categoriesData.data) ? (
                      categoriesData.data.map((category: any) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No categories available</MenuItem>
                    )}
                  </Select>
                  {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 2000) {
                      handleInputChange('description', value);
                    }
                  }}
                  error={!!errors.description}
                  helperText={errors.description || `${formData.description.length}/2000 characters`}
                  required
                  inputProps={{ maxLength: 2000 }}
                  sx={{
                    '& .MuiInputBase-root': {
                      '& textarea': {
                        resize: 'vertical',
                        minHeight: '100px',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Pricing and Inventory */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Pricing & Inventory
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  error={!!errors.price}
                  helperText={errors.price}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  error={!!errors.quantity}
                  helperText={errors.quantity}
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.unit}>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    label="Unit"
                  >
                    <MenuItem value="KG">KG</MenuItem>
                    <MenuItem value="TONS">TONS</MenuItem>
                    <MenuItem value="METERS">METERS</MenuItem>
                    <MenuItem value="YARDS">YARDS</MenuItem>
                    <MenuItem value="PIECES">PIECES</MenuItem>
                    <MenuItem value="ROLLS">ROLLS</MenuItem>
                    <MenuItem value="BALES">BALES</MenuItem>
                  </Select>
                  {errors.unit && <FormHelperText>{errors.unit}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  error={!!errors.location}
                  helperText={errors.location}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.country}>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    label="Country"
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.country && <FormHelperText>{errors.country}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Minimum Order Quantity"
                  type="number"
                  value={formData.minOrderQuantity}
                  onChange={(e) => handleInputChange('minOrderQuantity', e.target.value)}
                  error={!!errors.minOrderQuantity}
                  helperText={errors.minOrderQuantity}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Listing Type</InputLabel>
                  <Select
                    value={formData.listingType}
                    onChange={(e) => handleInputChange('listingType', e.target.value)}
                    label="Listing Type"
                  >
                    <MenuItem value="FIXED_PRICE">Fixed Price</MenuItem>
                    <MenuItem value="NEGOTIABLE">Negotiable</MenuItem>
                    <MenuItem value="AUCTION">Auction</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Auction Settings */}
              {formData.listingType === 'AUCTION' && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Auction Settings
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Auction Start Time"
                      type="datetime-local"
                      value={formData.auctionStartTime || ''}
                      onChange={(e) => handleInputChange('auctionStartTime', e.target.value)}
                      error={!!errors.auctionStartTime}
                      helperText={errors.auctionStartTime}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Auction End Time"
                      type="datetime-local"
                      value={formData.auctionEndTime || ''}
                      onChange={(e) => handleInputChange('auctionEndTime', e.target.value)}
                      error={!!errors.auctionEndTime}
                      helperText={errors.auctionEndTime}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Minimum Bid"
                      type="number"
                      value={formData.minimumBid || ''}
                      onChange={(e) => handleInputChange('minimumBid', e.target.value)}
                      error={!!errors.minimumBid}
                      helperText={errors.minimumBid}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Reserve Price (Optional)"
                      type="number"
                      value={formData.reservePrice || ''}
                      onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                </>
              )}

              {/* Tags */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Add Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add Tag
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              {/* Specifications */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Specifications
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Specification Key"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Specification Value"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddSpecification}
                  disabled={!specKey.trim() || !specValue.trim()}
                >
                  Add Specification
                </Button>
              </Grid>

              <Grid item xs={12}>
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <Box key={key} display="flex" alignItems="center" gap={1} mb={1}>
                    <Chip
                      label={`${key}: ${value}`}
                      onDelete={() => handleRemoveSpecification(key)}
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                ))}
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => navigate('/products')}
                    disabled={createProductMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={createProductMutation.isPending ? <CircularProgress size={20} /> : <Save />}
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductCreatePage;
