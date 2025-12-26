/**
 * Login Page Object
 * Page object pattern for the login page
 */

import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly googleLoginButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly roleSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    // MUI TextFields use id attributes for inputs
    this.emailInput = page.locator('#email').or(page.getByLabel(/email/i));
    this.passwordInput = page.locator('#password').or(page.getByLabel(/^password$/i));
    this.loginButton = page.getByRole('button', { name: /sign in/i }).or(
      page.locator('button[type="submit"]')
    );
    this.registerLink = page.getByRole('link', { name: /create.*account|register|sign up/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot/i });
    this.googleLoginButton = page.getByRole('button', { name: /google/i });
    // MUI Alert component - be specific to avoid Next.js route announcer
    this.errorMessage = page.locator('.MuiAlert-root').first();
    this.successMessage = page.locator('.MuiAlert-standardSuccess').first();
    this.roleSelector = page.getByLabel(/role/i);
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill the login form with credentials
   */
  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the login form
   */
  async submit() {
    await this.loginButton.click();
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  /**
   * Login and wait for navigation to dashboard
   */
  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 });
  }

  /**
   * Check if login was successful
   */
  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  /**
   * Check if login failed with error
   */
  async expectLoginError(errorText?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (errorText) {
      await expect(this.errorMessage).toContainText(errorText);
    }
  }

  /**
   * Click register link
   */
  async clickRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/\/register/);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/\/reset-password/);
  }

  /**
   * Check if page is loaded
   */
  async expectPageLoaded() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}

export default LoginPage;
