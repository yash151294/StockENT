import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  IconButton,
  Link,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <Box 
      sx={{ 
        background: 'linear-gradient(135deg, #0A0A0A 0%, #000000 100%)',
        color: 'white', 
        py: 8,
        borderTop: '1px solid rgba(99, 102, 241, 0.1)',
        mt: 'auto', // This will push the footer to the bottom
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between" alignItems="flex-start">
          {/* Company Info */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
              style={{ width: '100%', maxWidth: '300px' }}
            >
              <Logo 
                size={35}
                color="#6366F1"
                textColor="#FFFFFF"
                variant="full"
                clickable={false}
              />
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.6,
                  mb: 3,
                }}
              >
                The leading B2B marketplace for textile materials. Connecting mills with manufacturers worldwide.
              </Typography>
              <Stack direction="row" spacing={2}>
                <IconButton 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  <Facebook />
                </IconButton>
                <IconButton 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  <Twitter />
                </IconButton>
                <IconButton 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  <LinkedIn />
                </IconButton>
                <IconButton 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  <Instagram />
                </IconButton>
              </Stack>
            </motion.div>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                Quick Links
              </Typography>
              <Stack spacing={2}>
                <Link 
                  href="/products" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  Products
                </Link>
                <Link 
                  href="/auctions" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  Auctions
                </Link>
                <Link 
                  href="/dashboard" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  Profile
                </Link>
              </Stack>
            </motion.div>
          </Grid>

          {/* Support */}
          <Grid item xs={12} md={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                Support
              </Typography>
              <Stack spacing={2}>
                <Link 
                  href="/help" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  Help Center
                </Link>
                <Link 
                  href="/contact" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  Contact Us
                </Link>
                <Link 
                  href="/privacy" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': { color: '#6366F1' }
                  }}
                >
                  Terms of Service
                </Link>
              </Stack>
            </motion.div>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                Contact Info
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ color: '#6366F1', fontSize: 20 }} />
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    support@stockent.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ color: '#6366F1', fontSize: 20 }} />
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    +1 (555) 123-4567
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ color: '#6366F1', fontSize: 20 }} />
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    New York, NY 10001
                  </Typography>
                </Box>
              </Stack>
            </motion.div>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box 
          sx={{ 
            borderTop: '1px solid rgba(99, 102, 241, 0.2)', 
            mt: 6, 
            pt: 4,
            textAlign: 'center',
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            © 2024 StockENT. All rights reserved. Built with ❤️ for the textile industry.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
