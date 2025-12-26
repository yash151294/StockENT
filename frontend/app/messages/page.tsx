'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import MessagesPage from '@/views/MessagesPage';

export default function Messages() {
  return (
    <ProtectedRoute>
      <Layout>
        <MessagesPage />
      </Layout>
    </ProtectedRoute>
  );
}
