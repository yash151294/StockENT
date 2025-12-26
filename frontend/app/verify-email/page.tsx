'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import VerifyEmailPage from '@/views/VerifyEmailPage';

export default function VerifyEmail() {
  return (
    <Layout>
      <VerifyEmailPage />
    </Layout>
  );
}
