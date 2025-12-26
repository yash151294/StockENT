'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import AuctionsPage from '@/views/AuctionsPage';

export default function Auctions() {
  return (
    <Layout>
      <AuctionsPage />
    </Layout>
  );
}
