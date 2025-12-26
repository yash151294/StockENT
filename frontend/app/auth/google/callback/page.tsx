'use client';

import Layout from '@/components/Layout';
import OAuthCallbackPage from '@/views/OAuthCallbackPage';

export default function GoogleCallback() {
  return (
    <Layout>
      <OAuthCallbackPage />
    </Layout>
  );
}
