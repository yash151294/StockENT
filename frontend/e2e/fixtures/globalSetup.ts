/**
 * Global Setup for Playwright E2E Tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function globalSetup(config: FullConfig) {
  console.log('Running E2E global setup...');

  // Wait for services to be ready
  await waitForServices();

  // Note: Using seeded users from database (buyer@garmentfactory.com, seller@textilemill.com)
  // See backend/prisma/seed.js for credentials
  console.log('Using seeded test users from database');

  console.log('E2E global setup complete');
}

/**
 * Wait for frontend and backend services to be ready
 */
async function waitForServices() {
  const maxRetries = 30;
  const retryDelay = 2000;

  // Check frontend
  const frontendUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  await waitForUrl(frontendUrl, 'Frontend', maxRetries, retryDelay);

  // Check backend API
  await waitForUrl(`${API_URL}/health`, 'Backend API', maxRetries, retryDelay);

  console.log('All services are ready');
}

async function waitForUrl(url: string, name: string, maxRetries: number, delay: number) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok || response.status < 500) {
        console.log(`${name} is ready at ${url}`);
        return;
      }
    } catch {
      // Service not ready yet
    }

    if (i < maxRetries - 1) {
      console.log(`Waiting for ${name}... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.warn(`${name} may not be fully ready at ${url}`);
}

/**
 * Create test users for E2E tests
 */
async function createTestUsers() {
  const testUsers = [
    {
      email: 'e2e-buyer@stockent.test',
      password: 'E2ETestPassword123!',
      role: 'BUYER',
      companyName: 'E2E Test Buyer Company',
      contactPerson: 'E2E Buyer',
      phone: '+1234567890',
      country: 'USA',
    },
    {
      email: 'e2e-seller@stockent.test',
      password: 'E2ETestPassword123!',
      role: 'SELLER',
      companyName: 'E2E Test Seller Company',
      contactPerson: 'E2E Seller',
      phone: '+1234567891',
      country: 'USA',
    },
  ];

  for (const user of testUsers) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        console.log(`Created test user: ${user.email}`);
      } else {
        const data = await response.json().catch(() => ({}));
        if (data.error?.includes('already exists')) {
          console.log(`Test user already exists: ${user.email}`);
        } else {
          console.warn(`Could not create test user ${user.email}: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.warn(`Error creating test user ${user.email}:`, error);
    }
  }
}

export default globalSetup;

// Export test credentials for use in tests
// Use seeded users from the database (see backend/prisma/seed.js)
export const TEST_USERS = {
  buyer: {
    email: 'buyer@garmentfactory.com',
    password: 'buyer123456',
  },
  seller: {
    email: 'seller@textilemill.com',
    password: 'seller123456',
  },
  admin: {
    email: 'admin@stockent.com',
    password: 'admin123456',
  },
};
