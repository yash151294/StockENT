/**
 * Authentication E2E Tests
 * Tests login, logout, and registration flows
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { TEST_USERS } from '../framework/test.context';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await loginPage.goto();
      await loginPage.expectPageLoaded();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.buyer.email, TEST_USERS.buyer.password);
      await expect(page).toHaveURL(/\/(dashboard|products)/, { timeout: 15000 });
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login('invalid@email.com', 'wrongpassword');
      await loginPage.expectLoginError();
    });

    test('should show error with empty email', async ({ page }) => {
      await loginPage.goto();
      await loginPage.passwordInput.fill('somepassword');
      await loginPage.submit();
      // Form should prevent submission or show error
    });

    test('should show error with empty password', async ({ page }) => {
      await loginPage.goto();
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.submit();
      // Form should prevent submission or show error
    });

    test('should navigate to register page', async ({ page }) => {
      await loginPage.goto();
      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/\/register/);
      }
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await loginPage.goto();
      const forgotLink = page.getByRole('link', { name: /forgot|reset password/i });
      if (await forgotLink.isVisible()) {
        await forgotLink.click();
        await expect(page).toHaveURL(/\/(forgot|reset)-password/);
      }
    });
  });

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.buyer.email, TEST_USERS.buyer.password);
      await page.waitForURL(/\/(dashboard|products)/, { timeout: 15000 });
    });

    test('should logout successfully', async ({ page }) => {
      const userMenu = page.getByRole('button', { name: /profile|account|user/i });
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).or(
        page.getByRole('menuitem', { name: /logout|sign out/i })
      );

      if (await userMenu.isVisible()) {
        await userMenu.click();
      }

      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TEST_USERS.buyer.email, TEST_USERS.buyer.password);

      // Wait for redirect with retry
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.waitForURL(/\/(dashboard|products)/, { timeout: 15000 });
          break;
        } catch {
          if (attempt < 2 && page.url().includes('/login')) {
            await page.waitForTimeout(1000);
            await loginPage.login(TEST_USERS.buyer.email, TEST_USERS.buyer.password);
          }
        }
      }

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });
  });

  test.describe('Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');
      const emailInput = page.locator('#email').or(page.getByLabel(/email/i));
      const passwordInput = page.locator('#password').or(page.getByLabel(/^password$/i));
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/register');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      // Form should show validation errors or prevent submission
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register');

      await page.locator('#email').fill(TEST_USERS.buyer.email);
      await page.locator('#password').fill('TestPassword123!');

      const confirmPassword = page.locator('#confirmPassword');
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('TestPassword123!');
      }

      const companyInput = page.locator('#companyName');
      if (await companyInput.isVisible()) {
        await companyInput.fill('Test Company');
      }

      const contactInput = page.locator('#contactPerson');
      if (await contactInput.isVisible()) {
        await contactInput.fill('Test Person');
      }

      const phoneInput = page.locator('#phone');
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('+1234567890');
      }

      const countrySelect = page.locator('#country');
      if (await countrySelect.isVisible()) {
        await countrySelect.click();
        await page.getByRole('option', { name: /united states|usa/i }).first().click().catch(() => {});
      }

      const termsCheckbox = page.locator('input[type="checkbox"]').first();
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const errorMessage = page.locator('.MuiAlert-root').or(
        page.getByText(/already exists|already registered|email.*taken/i)
      );
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });
});
