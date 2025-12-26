'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProductCreatePage from '@/views/ProductCreatePage';

export default function ProductCreate() {
  return (
    <ProtectedRoute>
      <Layout>
        <ProductCreatePage />
      </Layout>
    </ProtectedRoute>
  );
}
