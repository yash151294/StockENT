'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import RegisterPage from '@/views/RegisterPage';

export default function Register() {
  return (
    <Layout>
      <RegisterPage />
    </Layout>
  );
}
