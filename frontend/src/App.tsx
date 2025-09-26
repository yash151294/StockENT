import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductCreatePage from './pages/ProductCreatePage';
import AuctionsPage from './pages/AuctionsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import FirstLoginWelcome from './components/FirstLoginWelcome';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
            },
          },
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LanguageProvider>
            <NotificationProvider>
              <AuthProvider>
                <SocketProvider>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <FirstLoginWelcome />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
                    
                    {/* Protected routes with layout */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Layout>
                          <DashboardPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Protected routes with layout */}
                    <Route path="/products" element={
                      <ProtectedRoute>
                        <Layout>
                          <ProductsPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/products/create" element={
                      <ProtectedRoute>
                        <Layout>
                          <ProductCreatePage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/products/:id" element={
                      <ProtectedRoute>
                        <Layout>
                          <ProductDetailPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/auctions" element={
                      <ProtectedRoute>
                        <Layout>
                          <AuctionsPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Protected routes */}
                    <Route path="/messages" element={
                      <ProtectedRoute>
                        <Layout>
                          <MessagesPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Layout>
                          <ProfilePage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin" element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <Layout>
                          <AdminPage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Router>
              </SocketProvider>
            </AuthProvider>
          </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
