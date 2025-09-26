import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  Business,
  Email,
  Lock,
  Phone,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import GoogleOAuthButton from '../components/GoogleOAuthButton';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = yup.object({
    email: yup
      .string()
      .email('Invalid email format')
      .required('Email is required'),
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      )
      .required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
    role: yup
      .string()
      .oneOf(['BUYER', 'SELLER'], 'Invalid role')
      .required('Role is required'),
    companyName: yup
      .string()
      .min(2, 'Company name must be at least 2 characters')
      .required('Company name is required'),
    contactPerson: yup
      .string()
      .min(2, 'Contact person must be at least 2 characters')
      .required('Contact person is required'),
    phone: yup
      .string()
      .min(10, 'Phone number must be at least 10 characters')
      .required('Phone number is required'),
    country: yup
      .string()
      .required('Country is required'),
    agreeToTerms: yup
      .boolean()
      .oneOf([true], 'You must agree to the terms and conditions'),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'BUYER',
      companyName: '',
      contactPerson: '',
      phone: '',
      country: '',
      agreeToTerms: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError(null);
        await register({
          email: values.email,
          password: values.password,
          role: values.role as 'BUYER' | 'SELLER',
          companyName: values.companyName,
          contactPerson: values.contactPerson,
          phone: values.phone,
          country: values.country,
        });
        navigate('/login?registered=true');
      } catch (err: any) {
        setError(err.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
    },
  });

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={24} sx={{ p: 4, borderRadius: 2 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              StockENT
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom>
              Create Your Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join the leading B2B textile marketplace
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Email */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Confirm Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Role */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>I am a</InputLabel>
                  <Select
                    id="role"
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                  >
                    <MenuItem value="BUYER">Buyer (Looking for materials)</MenuItem>
                    <MenuItem value="SELLER">Seller (Selling materials)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    id="country"
                    name="country"
                    value={formik.values.country}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.country && Boolean(formik.errors.country)}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Company Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="companyName"
                  name="companyName"
                  label="Company Name"
                  value={formik.values.companyName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                  helperText={formik.touched.companyName && formik.errors.companyName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Contact Person */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactPerson"
                  name="contactPerson"
                  label="Contact Person"
                  value={formik.values.contactPerson}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactPerson && Boolean(formik.errors.contactPerson)}
                  helperText={formik.touched.contactPerson && formik.errors.contactPerson}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Phone */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label="Phone Number"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Terms and Conditions */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formik.values.agreeToTerms}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link href="/terms" target="_blank" rel="noopener">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" target="_blank" rel="noopener">
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                />
                {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {formik.errors.agreeToTerms}
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <GoogleOAuthButton
              onError={setError}
              onSuccess={() => navigate('/dashboard')}
              fullWidth
              size="large"
              sx={{ mb: 2 }}
            />

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
