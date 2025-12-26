'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminPage from '@/views/AdminPage';

export default function Admin() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Layout>
        <AdminPage />
      </Layout>
    </ProtectedRoute>
  );
}
