import { test as base, expect } from '@playwright/test';

import { TestContext, TEST_USERS } from './test.context';
import { LoginPage } from '../page-objects/LoginPage';

type TestFixtures = {
  context: TestContext;
  authenticatedBuyer: TestContext;
  authenticatedSeller: TestContext;
};

/**
 * Authenticate a user and return the context
 */
async function authenticateUser(
  context: TestContext,
  email: string,
  password: string
): Promise<void> {
  const page = context.getPage();
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(email, password);

  // Wait for redirect to dashboard or products
  await page.waitForURL(/\/(dashboard|products)/, { timeout: 15000 });
}

/**
 * Extended Playwright test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  context: async ({ page }, use) => {
    const context = new TestContext(page);
    await use(context);
  },

  authenticatedBuyer: async ({ page }, use) => {
    const context = new TestContext(page);
    await authenticateUser(context, TEST_USERS.buyer.email, TEST_USERS.buyer.password);
    await use(context);
  },

  authenticatedSeller: async ({ page }, use) => {
    const context = new TestContext(page);
    await authenticateUser(context, TEST_USERS.seller.email, TEST_USERS.seller.password);
    await use(context);
  },
});

export { expect };
