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
  IconButton,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
  CloudUpload,
  Delete,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '../services/api';
import PageHeader from '../components/PageHeader';

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

  // Common textile industry tags
  const commonTags = [
    'Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim', 'Canvas',
    'Synthetic', 'Natural', 'Blended', 'Organic', 'Premium', 'Quality',
    'Fabric', 'Yarn', 'Thread', 'Raw Material', 'Finished Goods',
    'Industrial', 'Commercial', 'Retail', 'Wholesale', 'Export',
    'Sustainable', 'Eco-Friendly', 'Durable', 'Soft', 'Breathable'
  ];

  // Common textile specifications
  const commonSpecifications = [
    'Weight', 'GSM', 'Width', 'Length', 'Color', 'Composition',
    'Thread Count', 'Stretch', 'Shrinkage', 'Finish', 'Wash Care',
    'Origin', 'Grade', 'Quality', 'Thickness', 'Density', 'Strength',
    'Moisture Content', 'pH Level', 'Fastness', 'Durability'
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

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

  // Fetch existing tags
  const { data: tagsData, isLoading: tagsLoading } = useQuery({
    queryKey: ['existing-tags'],
    queryFn: async () => {
      try {
        const response = await productsAPI.getTags();
        return response.data;
      } catch (error) {
        console.error('Tags fetch error:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch existing specifications
  const { data: specificationsData, isLoading: specificationsLoading } = useQuery({
    queryKey: ['existing-specifications'],
    queryFn: async () => {
      try {
        const response = await productsAPI.getSpecifications();
        return response.data;
      } catch (error) {
        console.error('Specifications fetch error:', error);
        throw error;
      }
    },
    retry: 2,
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

  const handleSelectExistingTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleSelectExistingSpec = (key: string) => {
    setSpecKey(key);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = selectedImages.length + newFiles.length;
    
    if (totalFiles > 4) {
      setErrors(prev => ({
        ...prev,
        images: `You can only upload up to 4 images. You have ${selectedImages.length} selected and trying to add ${newFiles.length} more.`
      }));
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} is not an image file`);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        invalidFiles.push(`${file.name} is too large (max 10MB)`);
        return;
      }
      
      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        images: invalidFiles.join(', ')
      }));
      return;
    }

    // Add valid files
    const updatedImages = [...selectedImages, ...validFiles];
    setSelectedImages(updatedImages);

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);

    // Clear any previous image errors
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setSelectedImages(updatedImages);
    setImagePreviewUrls(updatedPreviews);
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
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.minOrderQuantity || parseFloat(formData.minOrderQuantity) <= 0) {
      newErrors.minOrderQuantity = 'Valid minimum order quantity is required';
    }

    if (formData.listingType === 'AUCTION') {
      if (!formData.auctionStartTime) {
        newErrors.auctionStartTime = 'Auction start time is required';
      } else {
        const startTime = new Date(formData.auctionStartTime);
        if (isNaN(startTime.getTime())) {
          newErrors.auctionStartTime = 'Please enter a valid start time';
        }
      }
      
      if (!formData.auctionEndTime) {
        newErrors.auctionEndTime = 'Auction end time is required';
      } else {
        const endTime = new Date(formData.auctionEndTime);
        if (isNaN(endTime.getTime())) {
          newErrors.auctionEndTime = 'Please enter a valid end time';
        }
      }
      
      if (!formData.minimumBid || parseFloat(formData.minimumBid) <= 0) {
        newErrors.minimumBid = 'Valid minimum bid is required';
      }
      
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

    // Create FormData for file upload
    const formDataToSubmit = new FormData();
    
    // Add text fields
    formDataToSubmit.append('title', formData.title);
    formDataToSubmit.append('description', formData.description);
    formDataToSubmit.append('categoryId', formData.categoryId);
    formDataToSubmit.append('price', formData.price);
    formDataToSubmit.append('quantity', formData.quantity);
    formDataToSubmit.append('unit', formData.unit);
    formDataToSubmit.append('listingType', formData.listingType);
    formDataToSubmit.append('location', formData.location);
    formDataToSubmit.append('country', formData.country);
    formDataToSubmit.append('minOrderQuantity', formData.minOrderQuantity);
    
    // Add tags and specifications as JSON
    formDataToSubmit.append('tags', JSON.stringify(formData.tags));
    formDataToSubmit.append('specifications', JSON.stringify(formData.specifications));

    // Add auction fields if needed
    if (formData.listingType === 'AUCTION') {
      if (formData.auctionStartTime) formDataToSubmit.append('auctionStartTime', formData.auctionStartTime);
      if (formData.auctionEndTime) formDataToSubmit.append('auctionEndTime', formData.auctionEndTime);
      if (formData.minimumBid) formDataToSubmit.append('minimumBid', formData.minimumBid);
      if (formData.reservePrice) formDataToSubmit.append('reservePrice', formData.reservePrice);
    }

    // Add images
    selectedImages.forEach((image, index) => {
      formDataToSubmit.append('productImages', image);
    });

    createProductMutation.mutate(formDataToSubmit);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
      color: 'white'
    }}>
      {/* Header */}
      <PageHeader
        title="List New Product"
        subtitle="Add a new product to your inventory and reach potential buyers worldwide"
        showBackButton={true}
        backPath="/products"
      />

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <Card sx={{
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          borderRadius: 3,
        }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>

              {/* Image Upload Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Product Images
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Upload up to 4 images (max 10MB each). Images will be automatically compressed if needed.
                </Typography>
                
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Click to upload images
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Drag and drop images here or click to browse
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Supported formats: JPEG, PNG, GIF, WebP (Max 10MB each)
                  </Typography>
                </Paper>

                {errors.images && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errors.images}
                  </Alert>
                )}

                {/* Image Previews */}
                {imagePreviewUrls.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Images ({imagePreviewUrls.length}/4):
                    </Typography>
                    <Grid container spacing={2}>
                      {imagePreviewUrls.map((url, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Paper
                            elevation={2}
                            sx={{
                              position: 'relative',
                              p: 1,
                              borderRadius: 2,
                            }}
                          >
                            <Box
                              component="img"
                              src={url}
                              alt={`Preview ${index + 1}`}
                              sx={{
                                width: '100%',
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                },
                              }}
                              onClick={() => handleRemoveImage(index)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                            {index === 0 && (
                              <Chip
                                label="Primary"
                                size="small"
                                color="primary"
                                sx={{
                                  position: 'absolute',
                                  bottom: 4,
                                  left: 4,
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add relevant tags to help buyers find your product. You can select from popular tags or add custom ones.
                </Typography>
              </Grid>

              {/* Add Custom Tag */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Add Custom Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Type a custom tag and press Enter"
                  helperText={`${formData.tags.length}/10 tags used`}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || formData.tags.length >= 10}
                  sx={{ height: '56px' }}
                >
                  Add Tag
                </Button>
              </Grid>

              {/* Selected Tags */}
              {formData.tags.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Selected Tags:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {formData.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        color="primary"
                        variant="filled"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Popular Tags from API */}
              {tagsData && tagsData.data && tagsData.data.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Popular Tags (click to add):
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {tagsData.data.slice(0, 20).map((tagData: any) => (
                      <Chip
                        key={tagData.tag}
                        label={tagData.tag}
                        onClick={() => handleSelectExistingTag(tagData.tag)}
                        disabled={formData.tags.includes(tagData.tag) || formData.tags.length >= 10}
                        variant={formData.tags.includes(tagData.tag) ? "filled" : "outlined"}
                        color={formData.tags.includes(tagData.tag) ? "primary" : "primary"}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: formData.tags.includes(tagData.tag) ? undefined : 'primary.light',
                            color: formData.tags.includes(tagData.tag) ? undefined : 'white',
                          },
                          mb: 1
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Common Tags Fallback */}
              {(!tagsData || !tagsData.data || tagsData.data.length === 0) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Common Tags (click to add):
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {commonTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onClick={() => handleSelectExistingTag(tag)}
                        disabled={formData.tags.includes(tag) || formData.tags.length >= 10}
                        variant={formData.tags.includes(tag) ? "filled" : "outlined"}
                        color={formData.tags.includes(tag) ? "primary" : "primary"}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: formData.tags.includes(tag) ? undefined : 'primary.light',
                            color: formData.tags.includes(tag) ? undefined : 'white',
                          },
                          mb: 1
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Specifications */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Specifications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add technical specifications for your product. Select from common keys or create custom ones.
                </Typography>
              </Grid>

              {/* Add Custom Specification */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Specification Key"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="e.g., Weight, Color"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Specification Value"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  placeholder="e.g., 100 GSM, Blue"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddSpecification}
                  disabled={!specKey.trim() || !specValue.trim()}
                  sx={{ height: '56px' }}
                >
                  Add Specification
                </Button>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    setSpecKey('');
                    setSpecValue('');
                  }}
                  sx={{ height: '56px' }}
                >
                  Clear
                </Button>
              </Grid>

              {/* Selected Specifications */}
              {Object.keys(formData.specifications).length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Selected Specifications:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {Object.entries(formData.specifications).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        onDelete={() => handleRemoveSpecification(key)}
                        color="secondary"
                        variant="filled"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Popular Specification Keys from API */}
              {specificationsData && specificationsData.data && specificationsData.data.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Popular Specification Keys (click to use):
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {specificationsData.data.slice(0, 20).map((specData: any) => (
                      <Chip
                        key={specData.key}
                        label={specData.key}
                        onClick={() => handleSelectExistingSpec(specData.key)}
                        variant="outlined"
                        color="primary"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'white',
                          },
                          mb: 1
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Common Specifications Fallback */}
              {(!specificationsData || !specificationsData.data || specificationsData.data.length === 0) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Common Specification Keys (click to use):
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {commonSpecifications.map((spec) => (
                      <Chip
                        key={spec}
                        label={spec}
                        onClick={() => handleSelectExistingSpec(spec)}
                        variant="outlined"
                        color="primary"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'white',
                          },
                          mb: 1
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}

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
    </Box>
  );
};

export default ProductCreatePage;
