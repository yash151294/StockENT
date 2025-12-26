'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import LoginPage from '@/views/LoginPage';

export default function Login() {
  return (
    <Layout>
      <LoginPage />
    </Layout>
  );
}
