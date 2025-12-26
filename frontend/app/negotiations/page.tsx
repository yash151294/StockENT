'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { NegotiationsPage } from '@/views/NegotiationsPage';

export default function Negotiations() {
  return (
    <ProtectedRoute>
      <Layout>
        <NegotiationsPage />
      </Layout>
    </ProtectedRoute>
  );
}
