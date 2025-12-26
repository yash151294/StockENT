'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardPage from '@/views/DashboardPage';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <Layout>
        <DashboardPage />
      </Layout>
    </ProtectedRoute>
  );
}
