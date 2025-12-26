'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CartPage } from '@/views/CartPage';

export default function Cart() {
  return (
    <ProtectedRoute requiredRole="BUYER">
      <Layout>
        <CartPage />
      </Layout>
    </ProtectedRoute>
  );
}
