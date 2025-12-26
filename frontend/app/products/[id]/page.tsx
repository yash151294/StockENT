'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProductDetailPage from '@/views/ProductDetailPage';

export default function ProductDetail() {
  return (
    <Layout>
      <ProductDetailPage />
    </Layout>
  );
}
