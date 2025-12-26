'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CheckoutPage from '@/views/CheckoutPage';

export default function Checkout() {
  return (
    <ProtectedRoute requiredRole="BUYER">
      <Layout>
        <CheckoutPage />
      </Layout>
    </ProtectedRoute>
  );
}
