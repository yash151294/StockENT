'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import ResetPasswordPage from '@/views/ResetPasswordPage';

export default function ResetPassword() {
  return (
    <Layout>
      <ResetPasswordPage />
    </Layout>
  );
}
