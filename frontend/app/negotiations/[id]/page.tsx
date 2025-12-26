'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { NegotiationDetailPage } from '@/views/NegotiationDetailPage';

export default function NegotiationDetail() {
  return (
    <ProtectedRoute>
      <Layout>
        <NegotiationDetailPage />
      </Layout>
    </ProtectedRoute>
  );
}
