import { Page } from '@playwright/test';

/**
 * Test context that provides common utilities for tests
 */
export class TestContext {
  private readonly page: Page;
  private readonly uniqueId: string;

  constructor(page: Page) {
    this.page = page;
    this.uniqueId = Math.random().toString(36).substring(2, 10);
  }

  getPage(): Page {
    return this.page;
  }

  makeUnique(value: string): string {
    return `${value}-${this.uniqueId}`;
  }

  makeUniqueEmail(value: string): string {
    const emailPrefix = value.toLowerCase().replace(/\s+/g, '.');
    return `${this.makeUnique(emailPrefix)}@test.stockent.com`;
  }
}

/**
 * Test users from seeded database
 * See backend/prisma/seed.js for credentials
 */
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
