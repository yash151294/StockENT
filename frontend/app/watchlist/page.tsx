'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import WatchlistPage from '@/views/WatchlistPage';

export default function Watchlist() {
  return (
    <ProtectedRoute>
      <Layout>
        <WatchlistPage />
      </Layout>
    </ProtectedRoute>
  );
}
