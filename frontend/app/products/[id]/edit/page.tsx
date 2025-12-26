'use client';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProductEditPage from '@/views/ProductEditPage';

export default function ProductEdit() {
  return (
    <ProtectedRoute>
      <Layout>
        <ProductEditPage />
      </Layout>
    </ProtectedRoute>
  );
}
