import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'BUYER' | 'SELLER' | 'ADMIN';
  requireVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireVerification = false,
}) => {
  const { state } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRole && state.user?.role !== requiredRole && state.user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check verification requirement
  if (requireVerification && state.user?.verificationStatus !== 'VERIFIED') {
    return <Navigate to="/profile?tab=verification" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
