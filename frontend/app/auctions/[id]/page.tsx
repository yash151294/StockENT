'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import AuctionDetailPage from '@/views/AuctionDetailPage';

export default function AuctionDetail() {
  return (
    <Layout>
      <AuctionDetailPage />
    </Layout>
  );
}
