'use client';

export const dynamic = 'force-dynamic';

import Layout from '@/components/Layout';
import LandingPage from '@/views/LandingPage';

export default function Home() {
  return (
    <Layout>
      <LandingPage />
    </Layout>
  );
}
