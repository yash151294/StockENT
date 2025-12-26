'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!state.isLoading && !state.isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
    }
  }, [state.isLoading, state.isAuthenticated, router, pathname]);

  useEffect(() => {
    // Check role requirement
    if (!state.isLoading && state.isAuthenticated) {
      if (requiredRole && state.user?.role !== requiredRole && state.user?.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [state.isLoading, state.isAuthenticated, state.user?.role, requiredRole, router]);

  useEffect(() => {
    // Check verification requirement
    if (!state.isLoading && state.isAuthenticated && requireVerification) {
      if (state.user?.verificationStatus !== 'VERIFIED') {
        router.push('/profile?tab=verification');
      }
    }
  }, [state.isLoading, state.isAuthenticated, state.user?.verificationStatus, requireVerification, router]);

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  // Don't render children if not authenticated or doesn't have required role
  if (!state.isAuthenticated) {
    return <LoadingSpinner />;
  }

  if (requiredRole && state.user?.role !== requiredRole && state.user?.role !== 'ADMIN') {
    return <LoadingSpinner />;
  }

  if (requireVerification && state.user?.verificationStatus !== 'VERIFIED') {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
