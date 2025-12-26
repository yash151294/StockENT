import React, { useState, useEffect } from 'react';
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
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import PageHeader from '../components/PageHeader';
import NumericInput from '../components/NumericInput';
import CalendarInput from '../components/CalendarInput';

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

const ProductEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { state } = useAuth();
  const { showSuccess, showError } = useNotification();
  
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
    auctionStartTime: '',
    auctionEndTime: '',
    minimumBid: '',
    reservePrice: '',
  });
  
  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Fetch product data for editing
  const { data: productData, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getProduct(id!),
    enabled: !!id,
  });

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

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: any) => productsAPI.updateProduct(id!, data),
    onSuccess: (response) => {
      showSuccess('Product updated successfully!');
      router.push(`/products/${id}`);
    },
    onError: (error: any) => {
      console.error('Update product error:', error);
      setErrors({
        general: error.response?.data?.error || 'Failed to update product'
      });
      showError('Failed to update product. Please try again.');
    },
  });

  // Load product data into form when product is fetched
  useEffect(() => {
    if (productData?.data?.data) {
      const product = productData.data.data;
      
      // Check if current user is the product owner
      if (state.user?.id !== product.sellerId) {
        showError('You are not authorized to edit this product.');
        router.push(`/products/${id}`);
        return;
      }

      // Convert specifications array to object
      const specificationsObj: { [key: string]: string } = {};
      if (product.specifications) {
        product.specifications.forEach((spec: any) => {
          specificationsObj[spec.specName] = spec.specValue;
        });
      }

      setFormData({
        title: product.title || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        price: product.basePrice?.toString() || '',
        quantity: product.quantityAvailable?.toString() || '',
        unit: product.unit || '',
        listingType: product.listingType || 'FIXED_PRICE',
        tags: [], // Tags will be handled separately if needed
        specifications: specificationsObj,
        location: product.location || '',
        country: product.country || '',
        minOrderQuantity: product.minOrderQuantity?.toString() || '',
        auctionStartTime: product.auction?.startTime ? new Date(product.auction.startTime).toISOString().slice(0, 16) : '',
        auctionEndTime: product.auction?.endTime ? new Date(product.auction.endTime).toISOString().slice(0, 16) : '',
        minimumBid: product.auction?.startingPrice?.toString() || '',
        reservePrice: product.auction?.reservePrice?.toString() || '',
      });

      // Set existing images as preview URLs
      if (product.images && product.images.length > 0) {
        setImagePreviewUrls(product.images.map((img: any) => img.imageUrl));
      }
    }
  }, [productData, state.user, id, router, showError]);

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

    setSelectedImages(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    // Clear any previous image errors
    setErrors(prev => ({ ...prev, images: '' }));
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...selectedImages];
    const newPreviewUrls = [...imagePreviewUrls];
    
    // Revoke object URL to prevent memory leaks
    if (index < imagePreviewUrls.length) {
      URL.revokeObjectURL(newPreviewUrls[index]);
    }
    
    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setSelectedImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.unit.trim()) newErrors.unit = 'Unit is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.minOrderQuantity || parseFloat(formData.minOrderQuantity) <= 0) {
      newErrors.minOrderQuantity = 'Valid minimum order quantity is required';
    }

    if (formData.listingType === 'AUCTION') {
      if (!formData.auctionStartTime) newErrors.auctionStartTime = 'Auction start time is required';
      if (!formData.auctionEndTime) newErrors.auctionEndTime = 'Auction end time is required';
      if (!formData.minimumBid || parseFloat(formData.minimumBid) <= 0) {
        newErrors.minimumBid = 'Valid minimum bid is required';
      }

      if (formData.auctionStartTime && formData.auctionEndTime) {
        const startTime = new Date(formData.auctionStartTime);
        const endTime = new Date(formData.auctionEndTime);
        const now = new Date();

        if (startTime <= now) {
          newErrors.auctionStartTime = 'Auction start time must be in the future';
        }
        if (endTime <= startTime) {
          newErrors.auctionEndTime = 'Auction end time must be after start time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData: ProductSubmitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      categoryId: formData.categoryId,
      price: parseFloat(formData.price),
      quantity: parseFloat(formData.quantity),
      unit: formData.unit.trim(),
      listingType: formData.listingType,
      tags: formData.tags,
      specifications: formData.specifications,
      location: formData.location.trim(),
      country: formData.country,
      minOrderQuantity: parseFloat(formData.minOrderQuantity),
    };

    if (formData.listingType === 'AUCTION') {
      submitData.auctionStartTime = formData.auctionStartTime;
      submitData.auctionEndTime = formData.auctionEndTime;
      submitData.minimumBid = parseFloat(formData.minimumBid || '0');
      submitData.reservePrice = parseFloat(formData.reservePrice || '0');
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(submitData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (typeof value === 'object') {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });

      // Add new images
      selectedImages.forEach((file, index) => {
        formDataToSend.append('images', file);
      });

      console.log('Submitting product update with data:', submitData);
      console.log('FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      await updateProductMutation.mutateAsync(formDataToSend);
    } catch (error) {
      console.error('Submit error:', error);
      showError('Failed to update product. Please check the console for details.');
    }
  };

  const handleCancel = () => {
    router.push(`/products/${id}`);
  };

  if (productLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (productError || !productData?.data?.data) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
        color: 'white'
      }}>
        <PageHeader
          title="Product Not Found"
          subtitle="The product you're trying to edit could not be found"
          showBackButton={true}
          backPath={`/products/${id}`}
        />
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">
            Product not found or failed to load.
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A0A0A 0%, #111111 100%)',
      color: 'white'
    }}>
      <PageHeader
        title="Edit Product"
        subtitle="Update your product listing information"
        showBackButton={true}
        backPath={`/products/${id}`}
      />

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <CardContent sx={{ p: 4 }}>
                <form onSubmit={handleSubmit}>
                  {errors.general && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {errors.general}
                    </Alert>
                  )}

                  {/* Basic Information */}
                  <Typography variant="h6" gutterBottom sx={{ color: '#6366F1', mb: 3 }}>
                    Basic Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Product Title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        error={!!errors.title}
                        helperText={errors.title}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#6366F1',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366F1',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-focused': {
                              color: '#6366F1',
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        error={!!errors.description}
                        helperText={errors.description}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#6366F1',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366F1',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-focused': {
                              color: '#6366F1',
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.categoryId}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
                        <Select
                          value={formData.categoryId}
                          onChange={(e) => handleInputChange('categoryId', e.target.value)}
                          label="Category"
                          sx={{
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366F1',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366F1',
                            },
                          }}
                        >
                          {categoriesData?.data?.map((category: any) => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Listing Type</InputLabel>
                        <Select
                          value={formData.listingType}
                          onChange={(e) => handleInputChange('listingType', e.target.value)}
                          label="Listing Type"
                          sx={{
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366F1',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366F1',
                            },
                          }}
                        >
                          <MenuItem value="FIXED_PRICE">Fixed Price</MenuItem>
                          <MenuItem value="NEGOTIABLE">Negotiable</MenuItem>
                          <MenuItem value="AUCTION">Auction</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                  {/* Pricing and Inventory */}
                  <Typography variant="h6" gutterBottom sx={{ color: '#6366F1', mb: 3 }}>
                    Pricing & Inventory
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <NumericInput
                        label="Price"
                        value={formData.price}
                        onChange={(value) => handleInputChange('price', value)}
                        error={!!errors.price}
                        helperText={errors.price}
                        prefix="$"
                        precision={2}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <NumericInput
                        label="Available Quantity"
                        value={formData.quantity}
                        onChange={(value) => handleInputChange('quantity', value)}
                        error={!!errors.quantity}
                        helperText={errors.quantity}
                        precision={2}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Unit"
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        error={!!errors.unit}
                        helperText={errors.unit}
                        placeholder="e.g., kg, meters, pieces"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#6366F1',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366F1',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-focused': {
                              color: '#6366F1',
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <NumericInput
                        label="Minimum Order Quantity"
                        value={formData.minOrderQuantity}
                        onChange={(value) => handleInputChange('minOrderQuantity', value)}
                        error={!!errors.minOrderQuantity}
                        helperText={errors.minOrderQuantity}
                        precision={2}
                      />
                    </Grid>
                  </Grid>

                  {/* Auction Settings */}
                  {formData.listingType === 'AUCTION' && (
                    <>
                      <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      <Typography variant="h6" gutterBottom sx={{ color: '#6366F1', mb: 3 }}>
                        Auction Settings
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <CalendarInput
                            label="Start Time"
                            value={formData.auctionStartTime || ''}
                            onChange={(value) => handleInputChange('auctionStartTime', value)}
                            error={!!errors.auctionStartTime}
                            helperText={errors.auctionStartTime}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <CalendarInput
                            label="End Time"
                            value={formData.auctionEndTime || ''}
                            onChange={(value) => handleInputChange('auctionEndTime', value)}
                            error={!!errors.auctionEndTime}
                            helperText={errors.auctionEndTime}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <NumericInput
                            label="Minimum Bid"
                            value={formData.minimumBid || ''}
                            onChange={(value) => handleInputChange('minimumBid', value)}
                            error={!!errors.minimumBid}
                            helperText={errors.minimumBid}
                            prefix="$"
                            precision={2}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <NumericInput
                            label="Reserve Price (Optional)"
                            value={formData.reservePrice || ''}
                            onChange={(value) => handleInputChange('reservePrice', value)}
                            prefix="$"
                            precision={2}
                          />
                        </Grid>
                      </Grid>
                    </>
                  )}

                  <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                  {/* Location */}
                  <Typography variant="h6" gutterBottom sx={{ color: '#6366F1', mb: 3 }}>
                    Location
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        error={!!errors.location}
                        helperText={errors.location}
                        placeholder="e.g., New York, NY"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#6366F1',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366F1',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-focused': {
                              color: '#6366F1',
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.country}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Country</InputLabel>
                        <Select
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          label="Country"
                          sx={{
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366F1',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366F1',
                            },
                          }}
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
                  </Grid>

                  <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                  {/* Tags */}
                  <Typography variant="h6" gutterBottom sx={{ color: '#6366F1', mb: 3 }}>
                    Tags
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          fullWidth
                          label="Add Tag"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: '#6366F1',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#6366F1',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&.Mui-focused': {
                                color: '#6366F1',
                              },
                            },
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddTag}
                          startIcon={<Add />}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            '&:hover': {
                              borderColor: '#6366F1',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            },
                          }}
                        >
                          Add
                        </Button>
                      </Box>

                      {/* Common Tags */}
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                        Common Tags:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {commonTags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            onClick={() => handleSelectExistingTag(tag)}
                            sx={{
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                              color: '#6366F1',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              '&:hover': {
                                backgroundColor: 'rgba(99, 102, 241, 0.3)',
                              },
                            }}
                          />
                        ))}
                      </Box>

                      {/* Selected Tags */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {formData.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            onDelete={() => handleRemoveTag(tag)}
                            sx={{
                              backgroundColor: 'rgba(99, 102, 241, 0.3)',
                              color: 'white',
                              border: '1px solid rgba(99, 102, 241, 0.5)',
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                  {/* Specifications */}
                  <Typography variant="h6" gutterBottom sx={{ color: '#6366F1', mb: 3 }}>
                    Specifications
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          fullWidth
                          label="Specification Name"
                          value={specKey}
                          onChange={(e) => setSpecKey(e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: '#6366F1',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#6366F1',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&.Mui-focused': {
                                color: '#6366F1',
                              },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Value"
                          value={specValue}
                          onChange={(e) => setSpecValue(e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: '#6366F1',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#6366F1',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&.Mui-focused': {
                                color: '#6366F1',
                              },
                            },
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleAddSpecification}
                          startIcon={<Add />}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            '&:hover': {
                              borderColor: '#6366F1',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            },
                          }}
                        >
                          Add
                        </Button>
                      </Box>

                      {/* Common Specifications */}
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                        Common Specifications:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {commonSpecifications.map((spec) => (
                          <Chip
                            key={spec}
                            label={spec}
                            size="small"
                            onClick={() => handleSelectExistingSpec(spec)}
                            sx={{
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                              color: '#6366F1',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              '&:hover': {
                                backgroundColor: 'rgba(99, 102, 241, 0.3)',
                              },
                            }}
                          />
                        ))}
                      </Box>

                      {/* Selected Specifications */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(formData.specifications).map(([key, value]) => (
                          <Paper
                            key={key}
                            sx={{
                              p: 2,
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {key}
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'white' }}>
                                {value}
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={() => handleRemoveSpecification(key)}
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              <Delete />
                            </IconButton>
                          </Paper>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                  {/* Images */}
                  <Typography variant="h6" gutterBottom sx={{ color: '#6366F1', mb: 3 }}>
                    Product Images
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="image-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUpload />}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            mb: 2,
                            '&:hover': {
                              borderColor: '#6366F1',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            },
                          }}
                        >
                          Upload Images (Max 4)
                        </Button>
                      </label>

                      {errors.images && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {errors.images}
                        </Alert>
                      )}

                      {/* Image Previews */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {imagePreviewUrls.map((url, index) => (
                          <Paper
                            key={index}
                            sx={{
                              position: 'relative',
                              width: 150,
                              height: 150,
                              overflow: 'hidden',
                              borderRadius: 1,
                            }}
                          >
                            <Box
                              component="img"
                              src={url}
                              alt={`Preview ${index + 1}`}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <IconButton
                              onClick={() => handleRemoveImage(index)}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                },
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Paper>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      startIcon={<Cancel />}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        '&:hover': {
                          borderColor: '#6366F1',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={updateProductMutation.isPending}
                      sx={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5B5FCF 0%, #7C3AED 100%)',
                        },
                      }}
                    >
                      {updateProductMutation.isPending ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Updating...
                        </>
                      ) : (
                        'Update Product'
                      )}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ProductEditPage;
