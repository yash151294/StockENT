import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Dashboard,
  Inventory,
  Gavel,
  Message,
  Person,
  Settings,
  Notifications,
  Language,
  Logout,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import RoleChip from './RoleChip';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout } = useAuth();
  const { t, currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const { showSuccess } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);

  // Add robust event handling to prevent unwanted sidebar toggles
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Only allow sidebar toggle from the designated toggle button
      const isToggleButton = target.closest('[data-sidebar-toggle="true"]');
      
      // If it's not the toggle button, prevent any sidebar state changes
      if (!isToggleButton) {
        // Check if this click might trigger unwanted sidebar behavior
        const isTabClick = target.closest('.MuiTabs-root') || 
                          target.closest('.MuiTab-root') || 
                          target.closest('[role="tab"]') ||
                          target.classList.contains('MuiTab-root');
        
        if (isTabClick) {
          // Prevent any event propagation that might affect sidebar
          event.stopImmediatePropagation();
        }
      }
    };

    // Use capture phase to intercept events before they reach other handlers
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, []);

  const handleDrawerToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    setDrawerOpen(false);
  };

  const handleDesktopDrawerToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    setDesktopDrawerOpen(!desktopDrawerOpen);
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

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('You have been logged out successfully');
      navigate('/');
      handleProfileMenuClose();
    } catch (error) {
      // Handle logout error if needed
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    { label: t('navigation.home'), icon: <Home />, path: '/', auth: false },
    { label: t('navigation.dashboard'), icon: <Dashboard />, path: '/dashboard', auth: true },
    { label: t('navigation.products'), icon: <Inventory />, path: '/products' },
    { label: t('navigation.auctions'), icon: <Gavel />, path: '/auctions' },
    { label: t('navigation.messages'), icon: <Message />, path: '/messages', auth: true },
    { label: t('navigation.profile'), icon: <Person />, path: '/profile', auth: true },
  ];

  if (state.user?.role === 'ADMIN') {
    navigationItems.push({
      label: t('navigation.admin'),
      icon: <Settings />,
      path: '/admin',
      auth: true,
    });
  }

  const drawer = (
    <Box sx={{ width: desktopDrawerOpen ? 250 : 56, transition: 'width 0.3s ease' }}>
      <Toolbar>
        {desktopDrawerOpen && (
          <Typography variant="h6" noWrap component="div">
            StockENT
          </Typography>
        )}
        {!isMobile && (
          <IconButton
            onClick={handleDesktopDrawerToggle}
            sx={{ ml: 'auto' }}
            aria-label="toggle sidebar"
          >
            {desktopDrawerOpen ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        )}
      </Toolbar>
      <List>
        {navigationItems.map((item) => {
          // Show item if:
          // - No auth requirement (undefined)
          // - auth: true and user is authenticated
          // - auth: false and user is NOT authenticated
          if (item.auth === true && !state.isAuthenticated) return null;
          if (item.auth === false && state.isAuthenticated) return null;
          
          return (
            <ListItem
              button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                // Only close mobile drawer, don't affect desktop drawer state
                if (isMobile) {
                  setDrawerOpen(false);
                }
              }}
              selected={location.pathname === item.path}
              sx={{
                justifyContent: desktopDrawerOpen ? 'initial' : 'center',
                px: desktopDrawerOpen ? 3 : 2,
              }}
            >
              <ListItemIcon sx={{ minWidth: desktopDrawerOpen ? 56 : 'auto' }}>
                {item.icon}
              </ListItemIcon>
              {desktopDrawerOpen && <ListItemText primary={item.label} />}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: state.isAuthenticated 
            ? state.user?.role === 'SELLER' 
              ? 'secondary.main' 
              : 'primary.main'
            : 'primary.main',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            edge="start"
            onClick={isMobile ? handleDrawerToggle : handleDesktopDrawerToggle}
            sx={{ mr: 2 }}
            data-sidebar-toggle="true"
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            StockENT
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Search Button */}
            <IconButton color="inherit" onClick={() => navigate('/products')}>
              <Search />
            </IconButton>

            {/* Role Chip */}
            {state.isAuthenticated && (
              <RoleChip 
                onRoleChange={() => {
                  // Redirect to dashboard to show updated UI
                  navigate('/dashboard');
                }}
                sx={{ 
                  mr: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              />
            )}

            {/* Notifications */}
            {state.isAuthenticated && (
              <IconButton color="inherit">
                <Badge badgeContent={0} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            )}

            {/* Language Selector */}
            <IconButton color="inherit" onClick={handleLanguageMenuOpen}>
              <Language />
            </IconButton>

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
                    src={state.user?.profileImageUrl}
                    alt={state.user?.contactPerson || state.user?.companyName || state.user?.email}
                    onLoad={() => console.log('Layout Avatar image loaded successfully')}
                    onError={(e) => console.log('Layout Avatar image failed to load:', e, 'URL:', state.user?.profileImageUrl)}
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
                  <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    {t('navigation.profile')}
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    {t('navigation.settings')}
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
                <Button color="inherit" onClick={() => navigate('/login')}>
                  {t('auth.login')}
                </Button>
                <Button color="inherit" onClick={() => navigate('/register')}>
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

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isMobile ? drawerOpen : desktopDrawerOpen}
        onClose={isMobile ? handleDrawerClose : undefined}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: isMobile ? 250 : (desktopDrawerOpen ? 250 : 56),
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            xs: '100%', 
            md: desktopDrawerOpen ? `calc(100% - 250px)` : `calc(100% - 56px)`
          },
          marginLeft: { 
            xs: 0, 
            md: desktopDrawerOpen ? '250px' : '56px' 
          },
          minWidth: 0, // Prevents content from overflowing
          mt: '64px',
          transition: theme.transitions.create(['margin', 'width', 'marginLeft'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container 
          maxWidth="xl" 
          sx={{ 
            width: '100%',
            maxWidth: 'none', // Allow container to use full available width
            px: 0, // Remove horizontal padding to use full width
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
