'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProductsPage from '@/views/ProductsPage';

export default function Products() {
  return (
    <Layout>
      <ProductsPage />
    </Layout>
  );
}
