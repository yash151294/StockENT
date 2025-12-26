'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person,
  Language,
  Logout,
  Search,
  Close,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getImageUrl } from '../utils/imageUtils';
import { useConversations } from '../hooks/useConversations';
import RoleChip from './RoleChip';
import Logo from './Logo';
import Footer from './Footer';
import NotificationDropdown from './NotificationDropdown';
import { CartButton } from './cart/CartButton';
import { CartDrawer } from './cart/CartDrawer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { state, logout } = useAuth();
  const { t, currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const { showSuccess } = useNotification();
  const { hasConversations } = useConversations();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageMenuAnchor(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchor(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
    setLanguageMenuAnchor(null);
  };

  const handleCartDrawerToggle = () => {
    setCartDrawerOpen(!cartDrawerOpen);
  };

  const handleCartDrawerClose = () => {
    setCartDrawerOpen(false);
  };



  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('You have been logged out successfully');
      router.push('/');
      handleProfileMenuClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    { label: t('navigation.home'), path: '/', auth: false },
    { label: t('navigation.dashboard'), path: '/dashboard', auth: true },
    { label: t('navigation.products'), path: '/products' },
    { label: t('navigation.auctions'), path: '/auctions' },
    { label: t('navigation.messages'), path: '/messages', auth: true, requiresConversations: true },
    { label: t('navigation.watchlist'), path: '/watchlist', auth: true, hideForRole: 'SELLER' },
  ];

  if (state.user?.role === 'ADMIN') {
    navigationItems.push({
      label: t('navigation.admin'),
      path: '/admin',
      auth: true,
    });
  }



  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', // Ensure full viewport height
    }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: state.isAuthenticated 
            ? state.user?.role === 'SELLER' 
              ? 'secondary.main' 
              : 'primary.main'
            : 'primary.main',
          transition: 'background-color 0.3s ease',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          minHeight: 64,
        }}>
          {/* Left side - Logo and Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Logo 
              size={32}
              color="white"
              textColor="#FFFFFF"
              variant="full"
              clickable={true}
            />
            
            {/* Desktop Navigation Menu */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {navigationItems.map((item) => {
                  // Show item if:
                  // - No auth requirement (undefined)
                  // - auth: true and user is authenticated
                  // - auth: false and user is NOT authenticated
                  if (item.auth === true && !state.isAuthenticated) return null;
                  if (item.auth === false && state.isAuthenticated) return null;
                  
                  // For messages tab, only show if user has conversations
                  if (item.requiresConversations && !hasConversations) return null;
                  
                  // Hide items for specific roles
                  if (item.hideForRole && state.user?.role === item.hideForRole) return null;
                  
                  return (
                    <Button
                      key={item.path}
                      color="inherit"
                      onClick={() => router.push(item.path)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: pathname === item.path ? 600 : 500,
                        px: 2,
                        py: 1,
                        backgroundColor: pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* Right side - Actions and User Menu */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
          }}>
            {/* Search Button */}
            <IconButton color="inherit" onClick={() => router.push('/products')} sx={{ mr: 1 }}>
              <Search />
            </IconButton>

            {/* Role Chip */}
            {state.isAuthenticated && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <RoleChip 
                  onRoleChange={() => {
                    router.push('/dashboard');
                  }}
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    height: 32,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                />
              </Box>
            )}

            {/* Notifications */}
            {state.isAuthenticated && (
              <NotificationDropdown />
            )}

            {/* Cart Button - Only for Buyers */}
            {state.isAuthenticated && state.user?.role === 'BUYER' && (
              <CartButton 
                onClick={handleCartDrawerToggle}
                color="inherit"
              />
            )}

            {/* Language Selector */}
            <IconButton color="inherit" onClick={handleLanguageMenuOpen} sx={{ mr: 1 }}>
              <Language />
            </IconButton>

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open mobile menu"
                onClick={handleMobileMenuToggle}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* User Menu */}
            {state.isAuthenticated ? (
              <>
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="primary-search-account-menu"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <Avatar 
                    sx={{ width: 32, height: 32 }}
                    src={getImageUrl(state.user?.profileImageUrl, 'avatar')}
                    alt={state.user?.contactPerson || state.user?.companyName || state.user?.email}
                  >
                    {!state.user?.profileImageUrl && state.user?.email?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  id="primary-search-account-menu"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleProfileMenuClose}
                >
                  <MenuItem onClick={() => { router.push('/profile'); handleProfileMenuClose(); }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    {t('navigation.profile')}
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    {t('auth.logout')}
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button color="inherit" onClick={() => router.push('/login')}>
                  {t('auth.login')}
                </Button>
                <Button color="inherit" onClick={() => router.push('/register')}>
                  {t('auth.register')}
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>



      {/* Language Menu */}
      <Menu
        anchorEl={languageMenuAnchor}
        open={Boolean(languageMenuAnchor)}
        onClose={handleLanguageMenuClose}
      >
        {availableLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={currentLanguage === language.code}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{language.flag}</span>
              <span>{language.nativeName}</span>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(99, 102, 241, 0.2)',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Logo 
              size={28}
              color="#6366F1"
              textColor="#FFFFFF"
              variant="full"
              clickable={true}
            />
            <IconButton onClick={handleMobileMenuClose} sx={{ color: '#6366F1' }}>
              <Close />
            </IconButton>
          </Box>
          
          <List>
            {navigationItems.map((item) => {
              if (item.auth === true && !state.isAuthenticated) return null;
              if (item.auth === false && state.isAuthenticated) return null;
              
              // For messages tab, only show if user has conversations
              if (item.requiresConversations && !hasConversations) return null;
              
              // Hide items for specific roles
              if (item.hideForRole && state.user?.role === item.hideForRole) return null;
              
              return (
                <ListItem
                  key={item.path}
                  button
                  onClick={() => {
                    router.push(item.path);
                    handleMobileMenuClose();
                  }}
                  selected={pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    }
                  }}
                >
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: pathname === item.path ? 600 : 500,
                      color: pathname === item.path ? '#6366F1' : 'inherit',
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flex: 1, pb: 4 }}>
          {children}
        </Box>
      </Box>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer 
        open={cartDrawerOpen}
        onClose={handleCartDrawerClose}
      />
    </Box>
  );
};

export default Layout;
